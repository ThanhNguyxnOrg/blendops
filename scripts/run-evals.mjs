#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { resolveRoutingWinner } from './build-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_EVAL_SCHEMA_PATH = path.join(ROOT_DIR, 'schemas', 'skill-eval.schema.json');
const EVALS_DIR = path.join(ROOT_DIR, 'evals');
const PILOT_DIR = path.join(EVALS_DIR, 'pilot');
const INDEX_PATH = path.join(EVALS_DIR, 'index.json');

let cachedEvalValidator = null;

function getEvalSchemaValidator(schemaPath = DEFAULT_EVAL_SCHEMA_PATH) {
  const resolved = path.resolve(schemaPath);
  const raw = fs.readFileSync(resolved, 'utf8');
  const hash = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  if (cachedEvalValidator && cachedEvalValidator.hash === hash) {
    return cachedEvalValidator.validate;
  }
  const schemaObj = JSON.parse(raw);
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    verbose: true,
  });
  const validate = ajv.compile(schemaObj);
  cachedEvalValidator = { hash, validate };
  return validate;
}

export function evaluateConditionPredicate(whenGroup, context) {
  if (!whenGroup || typeof whenGroup !== 'object' || !context || typeof context !== 'object') {
    return false;
  }
  const evalRule = (rule) => {
    const actual = context[rule.field];
    if (rule.operator === 'equals') return actual === rule.value;
    if (rule.operator === 'not_equals') return actual !== rule.value;
    if (rule.operator === 'in') return Array.isArray(rule.value) && rule.value.includes(actual);
    return false;
  };
  if (Array.isArray(whenGroup.all)) {
    return whenGroup.all.every(evalRule);
  }
  if (Array.isArray(whenGroup.any)) {
    return whenGroup.any.some(evalRule);
  }
  return false;
}

export function validateEvalSuiteObject(
  suite,
  expectedSkillId,
  catalogSkillSet,
  schemaPath = DEFAULT_EVAL_SCHEMA_PATH,
) {
  const errors = [];
  const prefix = `evalSuite(${expectedSkillId})`;

  if (!suite || typeof suite !== 'object' || Array.isArray(suite)) {
    return [`${prefix}: root must be a JSON object`];
  }

  const validate = getEvalSchemaValidator(schemaPath);
  const valid = validate(suite);
  if (!valid) {
    for (const err of validate.errors || []) {
      const ptr = err.instancePath || '/';
      const extra =
        err.keyword === 'additionalProperties' && err.params?.additionalProperty
          ? ` ('${err.params.additionalProperty}')`
          : '';
      errors.push(`${prefix} at ${ptr}: ${err.message}${extra}`);
    }
  }

  if (suite.skillId !== expectedSkillId) {
    errors.push(`${prefix}: skillId '${suite.skillId}' does not match expected '${expectedSkillId}'`);
  }

  if (catalogSkillSet && !catalogSkillSet.has(expectedSkillId)) {
    errors.push(`${prefix}: skillId '${expectedSkillId}' does not exist in the 48-skill catalog`);
  }

  const expectedMdPath = `skills/${expectedSkillId}/EVAL.md`;
  if (suite.evalMarkdownPath !== expectedMdPath) {
    errors.push(
      `${prefix}: evalMarkdownPath '${suite.evalMarkdownPath}' must equal '${expectedMdPath}'`,
    );
  }

  if (Array.isArray(suite.cases)) {
    const seenCaseIds = new Set();
    suite.cases.forEach((c, idx) => {
      if (!c || typeof c !== 'object') return;
      if (seenCaseIds.has(c.id)) {
        errors.push(`${prefix} cases[${idx}]: duplicate case id '${c.id}'`);
      }
      seenCaseIds.add(c.id);

      if (c.skillId !== expectedSkillId) {
        errors.push(
          `${prefix} cases[${idx}] (${c.id}): case skillId '${c.skillId}' must match suite skillId '${expectedSkillId}'`,
        );
      }

      if (typeof c.expectedRoutingTarget === 'string' && catalogSkillSet) {
        const t = c.expectedRoutingTarget;
        const isDocTarget = t.startsWith('docs/');
        const isTerminal = t === 'none';
        if (!isDocTarget && !isTerminal && !catalogSkillSet.has(t)) {
          errors.push(
            `${prefix} cases[${idx}] (${c.id}): expectedRoutingTarget '${t}' is not a valid catalog skill ID, 'docs/...' path, or 'none'`,
          );
        }
      }
    });
  }

  return errors;
}

export function evaluateSingleCase(evalCase, { contractsById = new Map(), allContracts = [] } = {}) {
  const failures = [];
  const sim = evalCase?.deterministicFixture?.simulatedOutput;
  if (!sim || typeof sim !== 'object') {
    return {
      caseId: evalCase?.id || '<unknown>',
      skillId: evalCase?.skillId || '<unknown>',
      evaluationType: evalCase?.evaluationType || 'deterministic_fixture',
      status: 'Failed',
      failures: ['Missing deterministicFixture.simulatedOutput'],
    };
  }

  // 1. Truth-state law enforcement: Artifact status must NEVER be 'Not Run'
  if (sim.artifactStatus === 'Not Run' || evalCase?.truthStateExpectations?.artifactStatus === 'Not Run') {
    failures.push(
      `Truth-state law violation: 'Not Run' is exclusively a Runtime state and must never appear in artifactStatus`,
    );
  }

  // 2. Truth-state alignment between simulatedOutput and truthStateExpectations
  if (sim.runtimeStatus !== evalCase.truthStateExpectations.runtimeStatus) {
    failures.push(
      `Runtime truth-state mismatch: expected '${evalCase.truthStateExpectations.runtimeStatus}', got '${sim.runtimeStatus}'`,
    );
  }
  if (sim.artifactStatus !== evalCase.truthStateExpectations.artifactStatus) {
    failures.push(
      `Artifact truth-state mismatch: expected '${evalCase.truthStateExpectations.artifactStatus}', got '${sim.artifactStatus}'`,
    );
  }

  // 3. Evidence-before-done guard: cannot claim Produced or Verified when existingArtifactEvidence is none or attempted-no-file
  const preEv = evalCase?.preconditions?.existingArtifactEvidence;
  if (
    (preEv === 'none' || preEv === 'attempted-no-file') &&
    (sim.artifactStatus === 'Produced' || sim.artifactStatus === 'Verified')
  ) {
    failures.push(
      `Evidence-before-done violation: artifactStatus '${sim.artifactStatus}' claimed while existingArtifactEvidence is '${preEv}'`,
    );
  }
  if (preEv === 'file-only-unvalidated' && sim.artifactStatus === 'Verified') {
    failures.push(
      `Evidence-before-done violation: artifactStatus 'Verified' claimed when existingArtifactEvidence is 'file-only-unvalidated' (must downgrade to 'Produced')`,
    );
  }

  // 4. Target handoff check
  if (sim.targetHandoff !== evalCase.expectedRoutingTarget) {
    failures.push(
      `Routing target mismatch: expected '${evalCase.expectedRoutingTarget}', got '${sim.targetHandoff}'`,
    );
  }

  // 5. Required & forbidden output properties check across serialized output text
  const searchableText = [
    sim.mode,
    sim.recommendedNextAction,
    sim.targetHandoff,
    `Runtime: ${sim.runtimeStatus}`,
    `Artifact: ${sim.artifactStatus}`,
    sim.summary,
    ...(sim.warnings || []),
    ...(sim.evidenceCitations || []),
  ]
    .join(' | ')
    .toLowerCase();

  for (const reqProp of evalCase.requiredOutputProperties || []) {
    if (!searchableText.includes(reqProp.toLowerCase())) {
      failures.push(`Missing required output property/phrase: '${reqProp}'`);
    }
  }

  for (const forbProp of evalCase.forbiddenOutputProperties || []) {
    if (searchableText.includes(forbProp.toLowerCase())) {
      failures.push(`Output contains forbidden property/overclaim: '${forbProp}'`);
    }
  }

  // 6. Contract routing & handoff predicate evaluation for contract_routing cases
  if (evalCase.evaluationType === 'contract_routing') {
    const contract = contractsById.get(evalCase.skillId);
    if (!contract) {
      failures.push(
        `Case '${evalCase.id}' has evaluationType 'contract_routing' but skill '${evalCase.skillId}' has no contract.json`,
      );
    } else {
      const routingState = evalCase.deterministicFixture.routingState;
      if (!routingState) {
        failures.push(`Case '${evalCase.id}' is missing deterministicFixture.routingState`);
      } else {
        const winner = resolveRoutingWinner(allContracts, routingState);
        if (winner !== evalCase.skillId) {
          failures.push(
            `Contract activationGate mismatch: resolveRoutingWinner returned '${winner}' instead of '${evalCase.skillId}' for state ${JSON.stringify(routingState)}`,
          );
        }
      }

      const handoffCtx = evalCase.deterministicFixture.handoffContext;
      if (!handoffCtx) {
        failures.push(`Case '${evalCase.id}' is missing deterministicFixture.handoffContext`);
      } else if (!evalCase.expectedRoutingTarget.startsWith('docs/') && evalCase.expectedRoutingTarget !== 'none') {
        const matchingHandoffs = (contract.handoffs || []).filter((h) =>
          evaluateConditionPredicate(h.when, handoffCtx),
        );
        if (matchingHandoffs.length === 0) {
          failures.push(
            `Contract handoff predicate matched 0 handoffs in '${evalCase.skillId}' for context ${JSON.stringify(handoffCtx)}`,
          );
        } else if (!matchingHandoffs.some((h) => h.target === evalCase.expectedRoutingTarget)) {
          failures.push(
            `Contract handoff predicate matched [${matchingHandoffs.map((h) => h.target).join(', ')}], which does not include expected '${evalCase.expectedRoutingTarget}'`,
          );
        }
      }
    }
  }

  return {
    caseId: evalCase.id,
    skillId: evalCase.skillId,
    scenario: evalCase.scenario,
    category: evalCase.category,
    evaluationType: evalCase.evaluationType,
    severity: evalCase.severity,
    status: failures.length === 0 ? 'Passed' : 'Failed',
    runtimeTruthState: sim.runtimeStatus,
    artifactTruthState: sim.artifactStatus,
    failures,
  };
}

function buildPilotEvalSuitesData() {
  return [
    // =========================================================================
    // 1. blendops-help (Contract-First Routing Pilot + Structured EVAL.md Table)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'blendops-help',
      category: 'routing-and-governance',
      isContractedSkill: true,
      evalMarkdownPath: 'skills/blendops-help/EVAL.md',
      sourceEvalTier: 'structured_multi_case_table',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Passed',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'blendops-help-unclear-next-step',
          skillId: 'blendops-help',
          scenario: 'Unclear next step without a concrete 3D brief',
          category: 'ambiguous',
          inputPrompt: 'I just cloned BlendOps and have an idea for a 3D sneaker showcase, what should I do next?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'States text-only routing scope and does not claim Blender execution',
            'Recommends exactly one safe next action (intent-to-3d-brief-writer) to lock the 8-slot brief',
          ],
          requiredOutputProperties: [
            'Text-only routing',
            'intent-to-3d-brief-writer',
            'Runtime: Not Run',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'Artifact: Not Run',
            'Artifact: Produced',
            'Artifact: Verified',
            'Blender executed',
          ],
          expectedRoutingTarget: 'intent-to-3d-brief-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Single recommended next action',
            'Conservative Runtime: Not Run and Artifact: Not Produced labels',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'ambiguous_or_mixed',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'brief.locked': false,
            },
            simulatedOutput: {
              mode: 'Text-only routing (No runtime execution)',
              recommendedNextAction: 'Use intent-to-3d-brief-writer to lock the 8-slot 3D brief before selecting a scene planner.',
              targetHandoff: 'intent-to-3d-brief-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Routed ambiguous entry request to intent-to-3d-brief-writer with zero runtime or artifact claims.',
              warnings: ['Do not run Blender or claim preview/GLB outputs during entry routing.'],
              evidenceCitations: ['skills/blendops-help/SKILL.md', 'skills/blendops-help/EVAL.md'],
            },
          },
        },
        {
          id: 'blendops-help-runtime-readiness-request',
          skillId: 'blendops-help',
          scenario: 'User asks whether BlendOps can run Blender right now',
          category: 'normal',
          inputPrompt: 'Can BlendOps run Blender right now on my machine and render a preview?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Routes runtime readiness inquiries to official-runtime-readiness-checker',
            'Preserves Runtime status as Not Run until an actual evaluation occurs',
          ],
          requiredOutputProperties: [
            'official-runtime-readiness-checker',
            'Runtime: Not Run',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'Runtime: Verified',
            'Artifact: Produced',
            'standalone Anthropic Connector',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Target handoff to official-runtime-readiness-checker',
            'Explicit Runtime: Not Run label',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'ambiguous_or_mixed',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'request.topic': 'runtime_readiness',
            },
            simulatedOutput: {
              mode: 'Text-only routing',
              recommendedNextAction: 'Run official-runtime-readiness-checker to inspect Path 1 (Blender 5.1+ Lab MCP) or Path 2 readiness.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Routed runtime execution inquiry to official-runtime-readiness-checker while keeping Runtime status Not Run.',
              warnings: ['Path 1 requires the Blender Lab MCP add-on inside Blender 5.1+; Anthropic Connector is not standalone.'],
              evidenceCitations: ['docs/runtime-stack-strategy.md', 'skills/official-runtime-readiness-checker/SKILL.md'],
            },
          },
        },
        {
          id: 'blendops-help-unverified-artifact-claim',
          skillId: 'blendops-help',
          scenario: 'User claims a GLB render exists without path or validation notes',
          category: 'evidence_boundary',
          inputPrompt: 'My agent said the hero GLB is already done and verified, can we ship it?',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Refuses to upgrade artifact status to Produced or Verified without file path and validation notes',
            'Routes to render-export-evidence to audit the artifact claim',
          ],
          requiredOutputProperties: [
            'render-export-evidence',
            'Artifact: Not Produced',
            'no output path or validation notes',
          ],
          forbiddenOutputProperties: [
            'Artifact: Verified',
            'Artifact: Produced',
            'ready to ship',
          ],
          expectedRoutingTarget: 'render-export-evidence',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Route to render-export-evidence',
            'Preserve Artifact: Not Produced when no path or validation exists',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'ambiguous_or_mixed',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'request.topic': 'artifact_evidence',
            },
            simulatedOutput: {
              mode: 'Text-only routing',
              recommendedNextAction: 'Route to render-export-evidence because no output path or validation notes were provided.',
              targetHandoff: 'render-export-evidence',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Blocked unverified shipping claim and routed to render-export-evidence.',
              warnings: ['Artifact status remains Not Produced until file path, existence, and validation checks are recorded.'],
              evidenceCitations: ['laws/evidence-before-done.md', 'skills/render-export-evidence/SKILL.md'],
            },
          },
        },
        {
          id: 'blendops-help-bridge-conflict-fallback',
          skillId: 'blendops-help',
          scenario: 'User reports port 9876 conflict between Lab MCP and community mcp-for-blender',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Both Blender MCP add-ons are enabled on port 9876 and my connection is failing, what skill do I use?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Detects single-bridge constraint conflict and routes to runtime-bridge-conflict-resolver',
            'Does not claim to disable add-ons automatically',
          ],
          requiredOutputProperties: [
            'runtime-bridge-conflict-resolver',
            'single-bridge constraint',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'disabled the add-on for you',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'runtime-bridge-conflict-resolver',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Fallback handoff to runtime-bridge-conflict-resolver',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'ambiguous_or_mixed',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'runtime.conflictDetected': true,
            },
            simulatedOutput: {
              mode: 'Text-only routing',
              recommendedNextAction: 'Use runtime-bridge-conflict-resolver to isolate the single-bridge constraint conflict on port 9876.',
              targetHandoff: 'runtime-bridge-conflict-resolver',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Routed dual-bridge conflict to runtime-bridge-conflict-resolver.',
              warnings: ['Never enable Path 1 Lab MCP and Path 2 mcp-for-blender simultaneously in the same Blender session.'],
              evidenceCitations: ['skills/runtime-bridge-conflict-resolver/SKILL.md'],
            },
          },
        },
        {
          id: 'blendops-help-clear-goal-progression-to-recipe-fit',
          skillId: 'blendops-help',
          scenario: 'User clarifies goal and needs recipe or pack selection',
          category: 'structured_skip',
          inputPrompt: 'My goal is now clear: I want a single product hero render and web GLB spin, which pack fits?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Delegates clear recipe-selection requests to recipe-fit-assessor at Rank 2',
            'Preserves conservative runtime and artifact truth states',
          ],
          requiredOutputProperties: [
            'recipe-fit-assessor',
            'Runtime: Not Run',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'recipe-fit-assessor',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Progression handoff to recipe-fit-assessor',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'ambiguous_or_mixed',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'goal.clarity': 'clear',
              'recipe.selected': false,
            },
            simulatedOutput: {
              mode: 'Text-only routing',
              recommendedNextAction: 'Hand off to recipe-fit-assessor to score product-hero-v0 against your deliverable requirements.',
              targetHandoff: 'recipe-fit-assessor',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Handed off clear recipe selection request to recipe-fit-assessor.',
              warnings: [],
              evidenceCitations: ['skills/blendops-help/contract.json'],
            },
          },
        },
        {
          id: 'blendops-help-unsupported-direct-mcp-claim',
          skillId: 'blendops-help',
          scenario: 'User asks for unsupported direct official Anthropic Connector inside a non-Claude agent',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Can I toggle the Claude Desktop Anthropic Connector directly inside Cursor without the Blender Lab MCP add-on?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Clarifies that the Anthropic Connector is a Path 1 host option in Claude Desktop and is never standalone (requires Blender Lab MCP add-on in Blender 5.1+)',
            'Routes to runtime-path-picker to pick Path 1 host (b) manual MCP or Path 2 for Cursor',
          ],
          requiredOutputProperties: [
            'runtime-path-picker',
            'not standalone',
            'Blender 5.1+',
          ],
          forbiddenOutputProperties: [
            'standalone connector works in Cursor',
            'no add-on needed',
          ],
          expectedRoutingTarget: 'runtime-path-picker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Explicit Path 1 Lab MCP add-on attribution (Blender 5.1+)',
            'Handoff to runtime-path-picker',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'ambiguous_or_mixed',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'request.topic': 'runtime_selection',
            },
            simulatedOutput: {
              mode: 'Text-only routing',
              recommendedNextAction: 'Use runtime-path-picker to select Path 1 host (b) manual Lab MCP (Blender 5.1+) or Path 2 for Cursor; Anthropic Connector is not standalone.',
              targetHandoff: 'runtime-path-picker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Rejected standalone Connector misconception and routed to runtime-path-picker.',
              warnings: ['Path 1 always requires the Blender Lab MCP add-on inside Blender 5.1+.'],
              evidenceCitations: ['docs/runtime-stack-strategy.md', 'skills/runtime-path-picker/SKILL.md'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 2. recipe-fit-assessor (Contract-First Routing Pilot, Rank 2)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'recipe-fit-assessor',
      category: 'routing-and-governance',
      isContractedSkill: true,
      evalMarkdownPath: 'skills/recipe-fit-assessor/EVAL.md',
      sourceEvalTier: 'routing_contract_pilot',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Passed',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'recipe-fit-strong-product-hero-unlocked-brief',
          skillId: 'recipe-fit-assessor',
          scenario: 'Clear single-product hero goal with unlocked brief routes to intent-to-3d-brief-writer',
          category: 'normal',
          inputPrompt: 'I want a studio hero shot and web GLB viewer spin for a single wireless headphone product. Does product-hero-v0 fit?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Scores product-hero-v0 as a strong fit for single-subject hero still + web GLB',
            'Hands off to intent-to-3d-brief-writer because the 8-slot brief is not locked yet',
          ],
          requiredOutputProperties: [
            'product-hero-v0',
            'strong_fit',
            'intent-to-3d-brief-writer',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'Artifact: Not Run',
            'skipping brief',
          ],
          expectedRoutingTarget: 'intent-to-3d-brief-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Fit verdict table',
            'Progression handoff to intent-to-3d-brief-writer',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'fit.verdict': 'strong_fit',
              'brief.locked': false,
            },
            simulatedOutput: {
              mode: 'Text-only recipe fit scoring',
              recommendedNextAction: 'Lock the 8-slot brief in intent-to-3d-brief-writer for pack product-hero-v0 (strong_fit).',
              targetHandoff: 'intent-to-3d-brief-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Scored product-hero-v0 as strong_fit and handed off to intent-to-3d-brief-writer.',
              warnings: [],
              evidenceCitations: ['packs/product-hero-v0/PACK.md', 'skills/recipe-fit-assessor/contract.json'],
            },
          },
        },
        {
          id: 'recipe-fit-locked-brief-routes-to-pack-prerequisite',
          skillId: 'recipe-fit-assessor',
          scenario: 'Strong fit with an already locked 8-slot brief advances to pack-prerequisite-checker',
          category: 'structured_skip',
          inputPrompt: 'We already locked our 8-slot brief for a smartwatch hero render and confirmed product-hero-v0 fits. What is the next gate?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Recognizes brief.locked is true and fit.verdict is strong_fit',
            'Advances directly to pack-prerequisite-checker (Rank 3)',
          ],
          requiredOutputProperties: [
            'pack-prerequisite-checker',
            'strong_fit',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'Artifact: Verified',
            'ready to render immediately',
          ],
          expectedRoutingTarget: 'pack-prerequisite-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Progression handoff to pack-prerequisite-checker',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'fit.verdict': 'strong_fit',
              'brief.locked': true,
            },
            simulatedOutput: {
              mode: 'Text-only recipe fit scoring',
              recommendedNextAction: 'Run pack-prerequisite-checker to verify preflight readiness for product-hero-v0 (strong_fit).',
              targetHandoff: 'pack-prerequisite-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Brief is already locked; advancing from recipe-fit-assessor to pack-prerequisite-checker.',
              warnings: [],
              evidenceCitations: ['skills/recipe-fit-assessor/contract.json'],
            },
          },
        },
        {
          id: 'recipe-fit-multi-deliverable-decomposer',
          skillId: 'recipe-fit-assessor',
          scenario: 'Multi-deliverable prompt spanning incompatible recipes routes to blender-recipe-decomposer',
          category: 'scope_creep',
          inputPrompt: 'I need a 12-item e-commerce product grid, a character portrait, AND a full architectural dining room tour all in one pack.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Flags multi-deliverable scope across incompatible domain recipes',
            'Routes to blender-recipe-decomposer before locking a single brief',
          ],
          requiredOutputProperties: [
            'blender-recipe-decomposer',
            'multi-deliverable',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'product-hero-v0 covers all three without changes',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'blender-recipe-decomposer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Conditional handoff to blender-recipe-decomposer',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'fit.multiDeliverableDetected': true,
            },
            simulatedOutput: {
              mode: 'Text-only recipe fit scoring',
              recommendedNextAction: 'Use blender-recipe-decomposer to split the multi-deliverable scope into ordered sub-recipes.',
              targetHandoff: 'blender-recipe-decomposer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Detected multi-deliverable scope across grid, character, and interior domains; routed to blender-recipe-decomposer.',
              warnings: ['Do not force a single product-hero pack onto a multi-domain request.'],
              evidenceCitations: ['skills/recipe-fit-assessor/EVAL.md', 'skills/recipe-fit-assessor/contract.json'],
            },
          },
        },
        {
          id: 'recipe-fit-interior-dining-room-domain',
          skillId: 'recipe-fit-assessor',
          scenario: 'Interior dining room hero with locked brief routes to interior-architectural-scene-planner',
          category: 'normal',
          inputPrompt: 'We have a locked brief for a cinematic interior dining room hero for a furniture brand website. Which domain planner fits?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Recognizes interior architectural domain over single-object product-hero-v0',
            'Routes to interior-architectural-scene-planner when brief is locked',
          ],
          requiredOutputProperties: [
            'interior-architectural-scene-planner',
            'interior caveat',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'use product-hero-v0 with no interior caveat',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'interior-architectural-scene-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Alternative handoff to interior-architectural-scene-planner',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'brief.locked': true,
              'recipe.domain': 'interior_archviz',
            },
            simulatedOutput: {
              mode: 'Text-only recipe fit scoring',
              recommendedNextAction: 'Route to interior-architectural-scene-planner with interior caveat for room-scale lighting and camera blocking.',
              targetHandoff: 'interior-architectural-scene-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Matched room-scale dining room brief to interior-architectural-scene-planner.',
              warnings: ['product-hero-v0 is only partial fit unless scoped to a single hero furniture piece.'],
              evidenceCitations: ['skills/recipe-fit-assessor/EVAL.md'],
            },
          },
        },
        {
          id: 'recipe-fit-vague-idea-upstream-brainstorming',
          skillId: 'recipe-fit-assessor',
          scenario: 'Vague creative idea without delivery shape delegates upstream to blender-brainstorming',
          category: 'ambiguous',
          inputPrompt: 'I want something futuristic and 3D for our brand launch next month, maybe neon, not sure what format.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Detects that delivery shape and subject are still diverging',
            'Routes upstream to blender-brainstorming',
          ],
          requiredOutputProperties: [
            'blender-brainstorming',
            'Runtime: Not Run',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'strong_fit for product-hero-v0',
          ],
          expectedRoutingTarget: 'blender-brainstorming',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Upstream reference handoff to blender-brainstorming',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: false,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'goal.clarity': 'ambiguous_or_mixed',
            },
            simulatedOutput: {
              mode: 'Text-only recipe fit scoring',
              recommendedNextAction: 'Route upstream to blender-brainstorming to explore 2-3 scoping options before scoring recipe fit.',
              targetHandoff: 'blender-brainstorming',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Delegated unstructured creative prompt to blender-brainstorming.',
              warnings: [],
              evidenceCitations: ['skills/recipe-fit-assessor/contract.json'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 3. pack-prerequisite-checker (Contract-First Routing Pilot, Rank 3)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'pack-prerequisite-checker',
      category: 'routing-and-governance',
      isContractedSkill: true,
      evalMarkdownPath: 'skills/pack-prerequisite-checker/EVAL.md',
      sourceEvalTier: 'routing_contract_pilot',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Passed',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'pack-prereq-incomplete-brief-no-go',
          skillId: 'pack-prerequisite-checker',
          scenario: 'Selected product-hero-v0 pack with missing brief slots triggers No-Go and routes to intent-to-3d-brief-writer',
          category: 'normal',
          inputPrompt: 'We picked product-hero-v0 and have a mood + silhouette, but constraints, acceptance criteria, and owner slots are missing. Are we ready to start?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Emits Prerequisite Matrix and No-Go verdict due to incomplete 8-slot brief',
            'Routes to intent-to-3d-brief-writer as single next skill',
          ],
          requiredOutputProperties: [
            'no-go',
            'intent-to-3d-brief-writer',
            'Runtime: Not Run',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'Ready to model',
            'Artifact: Produced',
            'Artifact: Not Run',
          ],
          expectedRoutingTarget: 'intent-to-3d-brief-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Prerequisite matrix',
            'No-Go decision + fallback handoff to intent-to-3d-brief-writer',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'brief.complete': false,
            },
            simulatedOutput: {
              mode: 'Text-only pack preflight check',
              recommendedNextAction: 'No-Go: complete the missing brief slots in intent-to-3d-brief-writer before scene planning.',
              targetHandoff: 'intent-to-3d-brief-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Emitted No-Go prerequisite matrix and routed to intent-to-3d-brief-writer.',
              warnings: ['Cannot declare Go when required brief slots are missing.'],
              evidenceCitations: ['skills/pack-prerequisite-checker/EVAL.md', 'skills/pack-prerequisite-checker/contract.json'],
            },
          },
        },
        {
          id: 'pack-prereq-runtime-unverified-routes-to-readiness',
          skillId: 'pack-prerequisite-checker',
          scenario: 'User requests live runtime execution for product-hero-v0 but runtime readiness is unverified',
          category: 'evidence_boundary',
          inputPrompt: 'Our product-hero-v0 brief is complete and we want live MCP execution in Blender now, check prerequisites.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Flags runtime row as Needs Input / Unverified',
            'Routes to official-runtime-readiness-checker before any scene execution',
          ],
          requiredOutputProperties: [
            'official-runtime-readiness-checker',
            'Needs input',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'Runtime: Verified',
            'Blender is connected and ready',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Conditional handoff to official-runtime-readiness-checker',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'runtime.mode': 'runtime_requested',
              'runtime.verifiedReady': false,
            },
            simulatedOutput: {
              mode: 'Text-only pack preflight check',
              recommendedNextAction: 'Runtime row Needs input: run official-runtime-readiness-checker before attempting MCP execution.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Gated pack execution on official-runtime-readiness-checker.',
              warnings: ['Runtime status remains Not Run during preflight verification.'],
              evidenceCitations: ['skills/pack-prerequisite-checker/EVAL.md'],
            },
          },
        },
        {
          id: 'pack-prereq-unlicensed-external-assets',
          skillId: 'pack-prerequisite-checker',
          scenario: 'Brief includes external 3D meshes with unknown license status',
          category: 'blocked_or_adversarial',
          inputPrompt: 'We picked product-hero-v0 and downloaded three third-party sneaker meshes from a forum without license files. Are prerequisites met?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Flags external asset license row as blocked',
            'Routes to asset-license-checker before scene planning',
          ],
          requiredOutputProperties: [
            'asset-license-checker',
            'license',
            'No-Go',
          ],
          forbiddenOutputProperties: [
            'license does not matter',
            'Go to product-hero-scene-planner',
          ],
          expectedRoutingTarget: 'asset-license-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Conditional handoff to asset-license-checker',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'assets.externalUsed': true,
              'assets.licenseCleared': false,
            },
            simulatedOutput: {
              mode: 'Text-only pack preflight check',
              recommendedNextAction: 'No-Go: run asset-license-checker to verify provenance and license compatibility for external meshes.',
              targetHandoff: 'asset-license-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Blocked preflight on unverified third-party asset licenses and routed to asset-license-checker.',
              warnings: ['Unverified external assets cannot enter commercial scene planning.'],
              evidenceCitations: ['skills/pack-prerequisite-checker/contract.json', 'skills/asset-license-checker/SKILL.md'],
            },
          },
        },
        {
          id: 'pack-prereq-all-green-go-product-hero',
          skillId: 'pack-prerequisite-checker',
          scenario: 'All prerequisites satisfied for product-hero-v0 emits Go and hands off to product-hero-scene-planner',
          category: 'normal',
          inputPrompt: '8-slot brief is locked, CC0 assets are verified, and mode is text-only planning for product-hero-v0. Run preflight.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Emits Go verdict on the prerequisite matrix',
            'Hands off to product-hero-scene-planner',
          ],
          requiredOutputProperties: [
            'Go',
            'product-hero-scene-planner',
            'Runtime: Not Run',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'product-hero-scene-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Go verdict + handoff to product-hero-scene-planner',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'preflight.verdict': 'go',
              'recipe.domain': 'product_hero',
            },
            simulatedOutput: {
              mode: 'Text-only pack preflight check',
              recommendedNextAction: 'Go: all text-only planning prerequisites satisfied; advance to product-hero-scene-planner.',
              targetHandoff: 'product-hero-scene-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Preflight matrix passed (Go); routed to product-hero-scene-planner.',
              warnings: [],
              evidenceCitations: ['packs/product-hero-v0/PACK.md', 'skills/pack-prerequisite-checker/contract.json'],
            },
          },
        },
        {
          id: 'pack-prereq-bridge-conflict-fallback',
          skillId: 'pack-prerequisite-checker',
          scenario: 'Preflight detects active MCP bridge conflict on port 9876',
          category: 'blocked_or_adversarial',
          inputPrompt: 'We are running preflight for product-hero-v0 but both Lab MCP and community mcp-for-blender are active.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Blocks preflight with No-Go due to dual MCP bridge conflict',
            'Routes to runtime-bridge-conflict-resolver',
          ],
          requiredOutputProperties: [
            'runtime-bridge-conflict-resolver',
            'No-Go',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'Go to product-hero-scene-planner',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'runtime-bridge-conflict-resolver',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Fallback handoff to runtime-bridge-conflict-resolver',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: false,
              hasStageOrArtifactInventory: false,
            },
            handoffContext: {
              'runtime.conflictDetected': true,
            },
            simulatedOutput: {
              mode: 'Text-only pack preflight check',
              recommendedNextAction: 'No-Go: resolve the dual MCP bridge conflict via runtime-bridge-conflict-resolver before starting the pack.',
              targetHandoff: 'runtime-bridge-conflict-resolver',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Preflight blocked on dual-bridge conflict; routed to runtime-bridge-conflict-resolver.',
              warnings: [],
              evidenceCitations: ['skills/pack-prerequisite-checker/contract.json'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 4. workflow-stage-router (Contract-First Routing Pilot, Rank 4)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'workflow-stage-router',
      category: 'routing-and-governance',
      isContractedSkill: true,
      evalMarkdownPath: 'skills/workflow-stage-router/EVAL.md',
      sourceEvalTier: 'routing_contract_pilot',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Passed',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'workflow-stage-post-execution-evidence-audit',
          skillId: 'workflow-stage-router',
          scenario: 'In-flight workflow at post-execution audit stage routes to render-export-evidence',
          category: 'normal',
          inputPrompt: 'Preflight passed, scene plan is complete, and we are at post_execution_audit to classify our output status. What skill is next?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Identifies current milestone stage as post_execution_audit',
            'Routes to render-export-evidence without upgrading artifact truth states',
          ],
          requiredOutputProperties: [
            'render-export-evidence',
            'post_execution_audit',
            'Runtime: Not Run',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'Artifact: Verified',
            'Artifact: Not Run',
          ],
          expectedRoutingTarget: 'render-export-evidence',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Progression handoff to render-export-evidence',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: true,
              hasStageOrArtifactInventory: true,
            },
            handoffContext: {
              'stage.current': 'post_execution_audit',
            },
            simulatedOutput: {
              mode: 'Text-only stage routing',
              recommendedNextAction: 'Advance from post_execution_audit to render-export-evidence to record truth states.',
              targetHandoff: 'render-export-evidence',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Routed in-flight workflow at post_execution_audit to render-export-evidence.',
              warnings: [],
              evidenceCitations: ['skills/workflow-stage-router/contract.json'],
            },
          },
        },
        {
          id: 'workflow-stage-runtime-required-but-not-run',
          skillId: 'workflow-stage-router',
          scenario: 'Next stage requires runtime mutation while runtime status is Not Run',
          category: 'evidence_boundary',
          inputPrompt: 'We have our locked brief, hero plan, camera plan, and lighting plan, and want to execute in Blender next. Where do we route?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Detects stage.requiresRuntime is true while runtime.status is Not Run',
            'Routes to official-runtime-readiness-checker before any execution step',
          ],
          requiredOutputProperties: [
            'official-runtime-readiness-checker',
            'Runtime: Not Run',
            'preconditions',
          ],
          forbiddenOutputProperties: [
            'Start rendering now',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Conditional handoff to official-runtime-readiness-checker',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: true,
              hasStageOrArtifactInventory: true,
            },
            handoffContext: {
              'runtime.status': 'Not Run',
              'stage.requiresRuntime': true,
            },
            simulatedOutput: {
              mode: 'Text-only stage routing',
              recommendedNextAction: 'Route to official-runtime-readiness-checker to verify runtime preconditions before any Blender execution.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Gated transition from planning to execution on official-runtime-readiness-checker.',
              warnings: ['Never jump directly to rendering without verified runtime readiness.'],
              evidenceCitations: ['skills/workflow-stage-router/EVAL.md', 'skills/workflow-stage-router/contract.json'],
            },
          },
        },
        {
          id: 'workflow-stage-mid-workflow-scope-creep',
          skillId: 'workflow-stage-router',
          scenario: 'Mid-workflow scope expansion delegates to blender-scope-boundary-enforcer',
          category: 'scope_creep',
          inputPrompt: 'While routing our product-hero-v0 lighting stage, the stakeholder just asked to add a 60-second character animation and fluid simulation.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Detects mid-workflow scope drift outside the locked brief',
            'Delegates to blender-scope-boundary-enforcer',
          ],
          requiredOutputProperties: [
            'blender-scope-boundary-enforcer',
            'scope',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'added fluid simulation to current stage',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'blender-scope-boundary-enforcer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Boundary delegation handoff to blender-scope-boundary-enforcer',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: true,
              hasStageOrArtifactInventory: true,
            },
            handoffContext: {
              'scope.driftDetected': true,
            },
            simulatedOutput: {
              mode: 'Text-only stage routing',
              recommendedNextAction: 'Pause stage progression and route to blender-scope-boundary-enforcer to handle mid-workflow scope expansion.',
              targetHandoff: 'blender-scope-boundary-enforcer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Intercepted mid-workflow scope expansion and delegated to blender-scope-boundary-enforcer.',
              warnings: ['Unapproved deliverables cannot be injected mid-pack without a formal scope decision.'],
              evidenceCitations: ['skills/workflow-stage-router/contract.json', 'skills/blender-scope-boundary-enforcer/SKILL.md'],
            },
          },
        },
        {
          id: 'workflow-stage-failed-gate-exits-to-pre-handoff',
          skillId: 'workflow-stage-router',
          scenario: 'Failed quality gate or final verification exits to pre-handoff-verification',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Our scene quality gate failed on material checks, or we are at final_verification before user handoff. Which skill runs next?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Triggers fallback/final gate handoff to pre-handoff-verification',
            'Enforces downgrade-only truth state policy',
          ],
          requiredOutputProperties: [
            'pre-handoff-verification',
            'downgrade',
            'Artifact: Not Produced',
          ],
          forbiddenOutputProperties: [
            'upgraded to Verified',
            'skipping verification gate',
          ],
          expectedRoutingTarget: 'pre-handoff-verification',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P0',
          evidenceRequirements: [
            'Fallback handoff to pre-handoff-verification',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: true,
              hasStageOrArtifactInventory: true,
            },
            handoffContext: {
              'gate.status': 'failed',
            },
            simulatedOutput: {
              mode: 'Text-only stage routing',
              recommendedNextAction: 'Exit to pre-handoff-verification to enforce the 7-point checklist and downgrade-only truth labels.',
              targetHandoff: 'pre-handoff-verification',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Routed failed gate directly to pre-handoff-verification.',
              warnings: [],
              evidenceCitations: ['skills/workflow-stage-router/contract.json'],
            },
          },
        },
        {
          id: 'workflow-stage-bridge-conflict-fallback',
          skillId: 'workflow-stage-router',
          scenario: 'Active MCP bridge conflict during stage transition routes to runtime-bridge-conflict-resolver',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Mid-workflow before runtime handoff, port 9876 shows a conflict between two MCP clients.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Halts stage progression and routes to runtime-bridge-conflict-resolver',
            'Keeps Runtime status Not Run',
          ],
          requiredOutputProperties: [
            'runtime-bridge-conflict-resolver',
            'port 9876',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'Runtime: Verified',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'runtime-bridge-conflict-resolver',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'contract_routing',
          severity: 'P1',
          evidenceRequirements: [
            'Fallback handoff to runtime-bridge-conflict-resolver',
          ],
          deterministicFixture: {
            routingState: {
              goalClarity: 'clear',
              recipeSelected: true,
              preflightPassed: true,
              hasStageOrArtifactInventory: true,
            },
            handoffContext: {
              'runtime.conflictDetected': true,
            },
            simulatedOutput: {
              mode: 'Text-only stage routing',
              recommendedNextAction: 'Route to runtime-bridge-conflict-resolver to clear the port 9876 MCP client collision.',
              targetHandoff: 'runtime-bridge-conflict-resolver',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Routed mid-workflow MCP port conflict to runtime-bridge-conflict-resolver.',
              warnings: [],
              evidenceCitations: ['skills/workflow-stage-router/contract.json'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 5. blender-brainstorming (Structured EVAL.md Table — 5 Cases)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'blender-brainstorming',
      category: 'process-discipline',
      isContractedSkill: false,
      evalMarkdownPath: 'skills/blender-brainstorming/EVAL.md',
      sourceEvalTier: 'structured_multi_case_table',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Not Implemented',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'brainstorming-vague-creative-request',
          skillId: 'blender-brainstorming',
          scenario: 'Vague creative request ("Make me a cool sneaker render")',
          category: 'ambiguous',
          inputPrompt: 'Make me a cool sneaker render for my new shoe line.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Quotes original request verbatim, batches 3-5 clarifying questions, and proposes 3 distinct scopings',
            'Produces plain-language confirmed intent summary and hands off to intent-to-3d-brief-writer',
          ],
          requiredOutputProperties: [
            'Make me a cool sneaker render',
            'clarifying questions',
            'alternative scopings',
            'intent-to-3d-brief-writer',
          ],
          forbiddenOutputProperties: [
            'subsurf modifier',
            'BSDF shader',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'intent-to-3d-brief-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Quoted original request, 3-5 batched questions, 2-3 scopings, plain-language intent summary',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only Socratic intent exploration',
              recommendedNextAction: 'Confirm preferred scoping option and hand off to intent-to-3d-brief-writer.',
              targetHandoff: 'intent-to-3d-brief-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Quoted "Make me a cool sneaker render", asked 4 batched clarifying questions, and proposed 3 alternative scopings in plain language.',
              warnings: [],
              evidenceCitations: ['skills/blender-brainstorming/EVAL.md'],
            },
          },
        },
        {
          id: 'brainstorming-half-specified-request',
          skillId: 'blender-brainstorming',
          scenario: 'Half-specified cyberpunk shoe web hero request',
          category: 'normal',
          inputPrompt: 'I need a cyberpunk shoe hero for web, but I do not know what constraints or deliverables to pick.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Asks 1-3 targeted questions on audience, web performance budget, and evidence expectations',
            'Proposes 2 distinct scopings and hands off to intent-to-3d-brief-writer',
          ],
          requiredOutputProperties: [
            'cyberpunk shoe hero for web',
            'targeted questions',
            'intent-to-3d-brief-writer',
          ],
          forbiddenOutputProperties: [
            'Artifact: Verified',
            'installed the Blender connector',
          ],
          expectedRoutingTarget: 'intent-to-3d-brief-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Targeted questions + 2 scopings + plain-language summary',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only Socratic intent exploration',
              recommendedNextAction: 'Hand off confirmed cyberpunk shoe web hero intent to intent-to-3d-brief-writer.',
              targetHandoff: 'intent-to-3d-brief-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Quoted "cyberpunk shoe hero for web", asked 3 targeted questions on web budget and audience, and proposed 2 scopings.',
              warnings: [],
              evidenceCitations: ['skills/blender-brainstorming/EVAL.md'],
            },
          },
        },
        {
          id: 'brainstorming-user-refuses-clarification',
          skillId: 'blender-brainstorming',
          scenario: 'User refuses clarification ("Just do whatever, I trust you")',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Just do whatever for the 3D bottle render, I trust you, do not ask me questions.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Records explicit assumption block listing assumed defaults and low-confidence label',
            'Still offers 2 scoping options and hands off to intent-to-3d-brief-writer',
          ],
          requiredOutputProperties: [
            'explicit assumption block',
            'low-confidence',
            'intent-to-3d-brief-writer',
          ],
          forbiddenOutputProperties: [
            'high-confidence verified brief',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'intent-to-3d-brief-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Explicit assumption list + low-confidence label',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only Socratic intent exploration',
              recommendedNextAction: 'Pass explicit assumption block with low-confidence label to intent-to-3d-brief-writer.',
              targetHandoff: 'intent-to-3d-brief-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Recorded explicit assumption block with low-confidence label and 2 scoping options after user declined clarification.',
              warnings: ['Assumptions must be confirmed in intent-to-3d-brief-writer before scene planning.'],
              evidenceCitations: ['skills/blender-brainstorming/EVAL.md'],
            },
          },
        },
        {
          id: 'brainstorming-continuous-scope-expansion',
          skillId: 'blender-brainstorming',
          scenario: 'User keeps expanding scope mid-brainstorm ("and a music video version too")',
          category: 'scope_creep',
          inputPrompt: 'Add the sneaker still... and also an interactive configurator... and a 3-minute music video version too.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Pauses expansion and prompts user to lock current scope or delegate to blender-scope-boundary-enforcer',
            'Summarizes current baseline scope clearly',
          ],
          requiredOutputProperties: [
            'lock current scope',
            'blender-scope-boundary-enforcer',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'music video rendered',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'blender-scope-boundary-enforcer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Scope-lock prompt + summary of current baseline scope',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only Socratic intent exploration',
              recommendedNextAction: 'Ask user to lock current scope and route scope expansion to blender-scope-boundary-enforcer.',
              targetHandoff: 'blender-scope-boundary-enforcer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Issued scope-lock prompt ("lock current scope or keep expanding?") and routed multi-deliverable creep to blender-scope-boundary-enforcer.',
              warnings: [],
              evidenceCitations: ['skills/blender-brainstorming/EVAL.md'],
            },
          },
        },
        {
          id: 'brainstorming-already-structured-brief-skip',
          skillId: 'blender-brainstorming',
          scenario: 'User already provides subject, mood, deliverable, audience, and evidence expectations',
          category: 'structured_skip',
          inputPrompt: 'Subject: matte black espresso grinder. Mood: warm studio editorial. Deliverable: 4K PNG + <=8MB GLB. Audience: web buyers. Owner: design lead.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Explicitly states skipping brainstorming because brief inputs are already structured',
            'Routes directly to intent-to-3d-brief-writer',
          ],
          requiredOutputProperties: [
            'skipping brainstorming because brief is complete',
            'intent-to-3d-brief-writer',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            '5 mandatory clarifying questions',
          ],
          expectedRoutingTarget: 'intent-to-3d-brief-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Explicit structured-skip message + route to intent-to-3d-brief-writer',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only Socratic intent exploration',
              recommendedNextAction: 'Route directly to intent-to-3d-brief-writer (skipping brainstorming because brief is complete).',
              targetHandoff: 'intent-to-3d-brief-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Detected complete brief inputs; skipping brainstorming because brief is complete and routing to intent-to-3d-brief-writer.',
              warnings: [],
              evidenceCitations: ['skills/blender-brainstorming/EVAL.md'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 6. intent-to-3d-brief-writer (Structured EVAL.md Table — 7 Cases)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'intent-to-3d-brief-writer',
      category: 'process-discipline',
      isContractedSkill: false,
      evalMarkdownPath: 'skills/intent-to-3d-brief-writer/EVAL.md',
      sourceEvalTier: 'structured_multi_case_table',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Not Implemented',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'brief-writer-fully-specified-intent',
          skillId: 'intent-to-3d-brief-writer',
          scenario: 'Confirmed intent covers all 8 brief slots',
          category: 'normal',
          inputPrompt: 'Confirmed intent: ceramic pour-over dripper, warm minimalist mood, 2K hero PNG + <=5MB web GLB, marketing team audience, design lead owner, observable framing check.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Writes all 8 slots in plain language, lists deferred decisions, echoes brief for confirmation',
            'Hands off to product-hero-scene-planner',
          ],
          requiredOutputProperties: [
            '8-slot brief',
            'decisions deferred',
            'product-hero-scene-planner',
          ],
          forbiddenOutputProperties: [
            'subsurf scattering',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'product-hero-scene-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'All 8 slots populated + deferred decisions list + echo confirmation',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 8-slot brief authoring',
              recommendedNextAction: 'Echo 8-slot brief for confirmation and hand off to product-hero-scene-planner.',
              targetHandoff: 'product-hero-scene-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Authored complete 8-slot brief in plain language with explicit decisions deferred and echoed to user.',
              warnings: [],
              evidenceCitations: ['skills/intent-to-3d-brief-writer/EVAL.md'],
            },
          },
        },
        {
          id: 'brief-writer-half-specified-intent',
          skillId: 'intent-to-3d-brief-writer',
          scenario: '5 of 8 slots present; batches 3 missing-slot questions',
          category: 'ambiguous',
          inputPrompt: 'We want a hero render of a mechanical keyboard with neon keycaps for our launch page, but constraints, acceptance criteria, and owner are not set yet.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks missing slots explicitly as Unknown and batches 3 targeted questions in one turn',
            'Echoes draft 8-slot brief before handing off to blender-asset-discovery-planner',
          ],
          requiredOutputProperties: [
            'Unknown',
            'batched 3 missing-slot questions',
            'blender-asset-discovery-planner',
          ],
          forbiddenOutputProperties: [
            'invented owner',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'blender-asset-discovery-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Explicit Unknown markers + batched missing-slot questions',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 8-slot brief authoring',
              recommendedNextAction: 'Resolve the batched 3 missing-slot questions (marked Unknown) and advance to blender-asset-discovery-planner.',
              targetHandoff: 'blender-asset-discovery-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Wrote draft 8-slot brief with Unknown slots explicitly flagged and batched 3 missing-slot questions.',
              warnings: [],
              evidenceCitations: ['skills/intent-to-3d-brief-writer/EVAL.md'],
            },
          },
        },
        {
          id: 'brief-writer-four-plus-slots-missing',
          skillId: 'intent-to-3d-brief-writer',
          scenario: '4+ slots missing routes back to blender-brainstorming',
          category: 'ambiguous',
          inputPrompt: 'Write a 3D brief for something cool in space.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Refuses to fabricate 4+ missing brief slots',
            'Routes upstream to blender-brainstorming',
          ],
          requiredOutputProperties: [
            'blender-brainstorming',
            '4+ slots missing',
            'no brief written yet',
          ],
          forbiddenOutputProperties: [
            'Brief complete and locked',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'blender-brainstorming',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Explicit re-route message to blender-brainstorming',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 8-slot brief authoring',
              recommendedNextAction: 'Route back to blender-brainstorming because 4+ slots missing (no brief written yet).',
              targetHandoff: 'blender-brainstorming',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Halted brief generation with 4+ slots missing; no brief written yet; re-routed to blender-brainstorming.',
              warnings: ['Never invent missing brief slots without user input.'],
              evidenceCitations: ['skills/intent-to-3d-brief-writer/EVAL.md'],
            },
          },
        },
        {
          id: 'brief-writer-conflicting-deliverable-constraint',
          skillId: 'intent-to-3d-brief-writer',
          scenario: 'Conflicting deliverable and constraint ("mobile web GLB AND 50MB uncompressed budget")',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Write a brief for a mobile web GLB hero that must load instantly on 3G but also allows a 50MB uncompressed poly/texture budget.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Flags the conflict in Slot 4 (Constraints) and prompts user to resolve before locking',
            'Routes to glb-mobile-performance-budget to reconcile mobile budget targets',
          ],
          requiredOutputProperties: [
            'conflict flag',
            'Slot 4',
            'glb-mobile-performance-budget',
          ],
          forbiddenOutputProperties: [
            'no conflict found',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'glb-mobile-performance-budget',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Slot 4 conflict flag + resolution prompt',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 8-slot brief authoring',
              recommendedNextAction: 'Resolve the Slot 4 conflict flag via glb-mobile-performance-budget before locking the brief.',
              targetHandoff: 'glb-mobile-performance-budget',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Raised conflict flag in Slot 4 between instant mobile web GLB delivery and 50MB budget.',
              warnings: ['Brief remains unlocked until conflicting constraints are resolved.'],
              evidenceCitations: ['skills/intent-to-3d-brief-writer/EVAL.md'],
            },
          },
        },
        {
          id: 'brief-writer-mixed-audience-dual-sections',
          skillId: 'intent-to-3d-brief-writer',
          scenario: 'Mixed audience (non-Blender marketing team + technical artist)',
          category: 'normal',
          inputPrompt: 'Our audience includes both the non-Blender marketing director and the WebGL technical artist for a sneaker product hero.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Includes both plain-language stakeholder section and technical handoff notes while keeping primary slots jargon-free',
            'Hands off to product-hero-scene-planner',
          ],
          requiredOutputProperties: [
            'plain-language section',
            'technical section',
            'product-hero-scene-planner',
          ],
          forbiddenOutputProperties: [
            'raw bpy script',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'product-hero-scene-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P2',
          evidenceRequirements: [
            'Dual audience sections with plain-language primary summary',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 8-slot brief authoring',
              recommendedNextAction: 'Confirm dual-section brief (plain-language section + technical section) and hand off to product-hero-scene-planner.',
              targetHandoff: 'product-hero-scene-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Generated 8-slot brief containing both plain-language section for marketing and technical section for WebGL integration.',
              warnings: [],
              evidenceCitations: ['skills/intent-to-3d-brief-writer/EVAL.md'],
            },
          },
        },
        {
          id: 'brief-writer-user-edits-mood-re-echo',
          skillId: 'intent-to-3d-brief-writer',
          scenario: 'User edits mood after initial brief echo',
          category: 'normal',
          inputPrompt: 'Change Slot 2 mood from warm daylight studio to high-contrast dramatic rim lighting and re-echo the brief.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Updates Slot 2 in a versioned brief, re-echoes for second confirmation',
            'Hands off to product-hero-scene-planner after confirmation',
          ],
          requiredOutputProperties: [
            'versioned brief',
            'second confirmation',
            'product-hero-scene-planner',
          ],
          forbiddenOutputProperties: [
            'skipped re-echo',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'product-hero-scene-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P2',
          evidenceRequirements: [
            'Versioned brief update + second confirmation prompt',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 8-slot brief authoring',
              recommendedNextAction: 'Await second confirmation on the versioned brief before advancing to product-hero-scene-planner.',
              targetHandoff: 'product-hero-scene-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Updated Slot 2 mood in versioned brief and echoed for second confirmation.',
              warnings: [],
              evidenceCitations: ['skills/intent-to-3d-brief-writer/EVAL.md'],
            },
          },
        },
        {
          id: 'brief-writer-text-only-iteration-loop',
          skillId: 'intent-to-3d-brief-writer',
          scenario: 'User wants text-only plan first and runtime later',
          category: 'structured_skip',
          inputPrompt: 'We want a text-only scene plan first with zero Blender execution right now; runtime will happen next week.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Sets Slot 3 deliverables to text-only plan and Slot 5 evidence expectations to Runtime: Not Run / Artifact: Not Produced',
            'Hands off to acceptance-criteria-builder',
          ],
          requiredOutputProperties: [
            'text-only plan',
            'Runtime: Not Run',
            'acceptance-criteria-builder',
          ],
          forbiddenOutputProperties: [
            'runtime ready',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'acceptance-criteria-builder',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Explicit text-only deliverable and Not Run / Not Produced expectations in Slot 5',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 8-slot brief authoring',
              recommendedNextAction: 'Hand off locked text-only plan brief to acceptance-criteria-builder.',
              targetHandoff: 'acceptance-criteria-builder',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Locked text-only plan brief with Slot 5 explicitly recording Runtime: Not Run and Artifact: Not Produced.',
              warnings: [],
              evidenceCitations: ['skills/intent-to-3d-brief-writer/EVAL.md'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 7. blender-asset-discovery-planner (Structured EVAL.md Table — 7 Cases)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'blender-asset-discovery-planner',
      category: 'asset-and-sourcing',
      isContractedSkill: false,
      evalMarkdownPath: 'skills/blender-asset-discovery-planner/EVAL.md',
      sourceEvalTier: 'structured_multi_case_table',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Not Implemented',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'asset-discovery-cyberpunk-shoe-web-hero',
          skillId: 'blender-asset-discovery-planner',
          scenario: 'Cyberpunk shoe web hero brief (<=10MB GLB constraint)',
          category: 'normal',
          inputPrompt: 'Plan asset strategy for a floating cyberpunk shoe hero with neon glossy floor under a 10MB GLB budget.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Produces per-asset strategy table, sums estimated GLB budget (8MB vs 10MB limit), and flags Path 2 generative caveat',
            'Hands off to product-hero-scene-planner without downloading or generating files',
          ],
          requiredOutputProperties: [
            'asset table',
            'budget sum',
            'Path 2 generative caveat',
            'product-hero-scene-planner',
          ],
          forbiddenOutputProperties: [
            'downloaded asset',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'product-hero-scene-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Per-asset strategy table + GLB budget sum + Path 2 generative caveat',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only asset discovery plan',
              recommendedNextAction: 'Proceed to product-hero-scene-planner with the 8MB estimated asset table and Path 2 generative caveat.',
              targetHandoff: 'product-hero-scene-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Built full asset table with budget sum (8MB / 10MB) and explicit Path 2 generative caveat.',
              warnings: ['Generative 3D integrations belong to community Path 2 (mcp-for-blender) and require readiness verification.'],
              evidenceCitations: ['skills/blender-asset-discovery-planner/EVAL.md', 'docs/unofficial-runtime-bridges.md'],
            },
          },
        },
        {
          id: 'asset-discovery-brand-restricted-library',
          skillId: 'blender-asset-discovery-planner',
          scenario: 'Brand product render restricted to brand-approved library only',
          category: 'normal',
          inputPrompt: 'Subject is an official brand sneaker; constraint requires brand-restricted asset library only and zero third-party meshes.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Enforces brand-only library source for subject and procedural environment',
            'Routes to asset-license-checker to record brand-restricted license compliance',
          ],
          requiredOutputProperties: [
            'brand-restricted',
            'license risk callout',
            'asset-license-checker',
          ],
          forbiddenOutputProperties: [
            'use any free model from the internet',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'asset-license-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Brand-restricted enforcement + license risk callout',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only asset discovery plan',
              recommendedNextAction: 'Verify brand-restricted terms in asset-license-checker before scene planning.',
              targetHandoff: 'asset-license-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Enforced brand-restricted library for hero asset and procedural environment with explicit license risk callout.',
              warnings: [],
              evidenceCitations: ['skills/blender-asset-discovery-planner/EVAL.md'],
            },
          },
        },
        {
          id: 'asset-discovery-procedural-iteration-sketch',
          skillId: 'blender-asset-discovery-planner',
          scenario: 'Text-only iteration sketch prioritizes procedural primitives and CC0 HDRI',
          category: 'structured_skip',
          inputPrompt: 'Deliverable is a fast text-only blocking sketch loop with zero external mesh dependencies.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Assigns procedural-first strategy for geometry and CC0 Poly Haven HDRI for lighting',
            'Hands off to product-hero-scene-planner',
          ],
          requiredOutputProperties: [
            'procedural-first',
            'Poly Haven CC0',
            'product-hero-scene-planner',
          ],
          forbiddenOutputProperties: [
            'fetched external model',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'product-hero-scene-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P2',
          evidenceRequirements: [
            'Procedural-first asset assignment with low license risk',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only asset discovery plan',
              recommendedNextAction: 'Hand off procedural-first asset table with Poly Haven CC0 HDRI to product-hero-scene-planner.',
              targetHandoff: 'product-hero-scene-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Selected procedural-first blocking primitives and Poly Haven CC0 lighting with low license risk.',
              warnings: [],
              evidenceCitations: ['skills/blender-asset-discovery-planner/EVAL.md'],
            },
          },
        },
        {
          id: 'asset-discovery-generative-without-path2-blocked',
          skillId: 'blender-asset-discovery-planner',
          scenario: 'User requests Hyper3D generative mesh without Path 2 readiness',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Use Hyper3D to generate the hero sneaker mesh right now even though Path 2 is not configured.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks generative strategy blocked, offers procedural/library fallback, and routes to official-runtime-readiness-checker',
            'Never claims Hyper3D generated an asset',
          ],
          requiredOutputProperties: [
            'generative blocked',
            'official-runtime-readiness-checker',
            'procedural/library alternatives',
          ],
          forbiddenOutputProperties: [
            'generated Hyper3D mesh',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Blocked flag + procedural/library alternatives + route to official-runtime-readiness-checker',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only asset discovery plan',
              recommendedNextAction: 'Generative blocked without Path 2: route to official-runtime-readiness-checker or use procedural/library alternatives.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Marked Hyper3D generative strategy blocked and offered procedural/library alternatives.',
              warnings: ['Hyper3D requires community Path 2 (mcp-for-blender) readiness and third-party caveats.'],
              evidenceCitations: ['skills/blender-asset-discovery-planner/EVAL.md', 'docs/unofficial-runtime-bridges.md'],
            },
          },
        },
        {
          id: 'asset-discovery-skipped-license-tbd',
          skillId: 'blender-asset-discovery-planner',
          scenario: 'User says license "doesn\'t matter" for web commercial deployment',
          category: 'evidence_boundary',
          inputPrompt: 'Just grab any 3D watch mesh, license does not matter to us.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks license column as TBD (never silently approved) and requires follow-up via asset-license-checker',
            'Preserves Runtime: Not Run and Artifact: Not Produced',
          ],
          requiredOutputProperties: [
            'TBD',
            'asset-license-checker',
            'follow-up required',
          ],
          forbiddenOutputProperties: [
            'license approved automatically',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'asset-license-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Explicit TBD license marker + handoff to asset-license-checker',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only asset discovery plan',
              recommendedNextAction: 'License marked TBD (follow-up required): route to asset-license-checker before downstream planner consumes.',
              targetHandoff: 'asset-license-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Refused to skip license tracking; marked license TBD with follow-up required via asset-license-checker.',
              warnings: [],
              evidenceCitations: ['skills/blender-asset-discovery-planner/EVAL.md'],
            },
          },
        },
        {
          id: 'asset-discovery-conflicting-2mb-brand-cad',
          skillId: 'blender-asset-discovery-planner',
          scenario: 'Conflicting constraints: unoptimized 80MB CAD brand asset vs <=2MB GLB target',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Use our raw 80MB CAD shoe assembly with 4K uncompressed textures inside a <=2MB mobile GLB budget.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Surfaces budget conflict between raw CAD source and <=2MB GLB constraint',
            'Routes to asset-fallback-strategy to plan decimation/baking or proxy replacement',
          ],
          requiredOutputProperties: [
            'conflict callout',
            'asset-fallback-strategy',
            '2MB',
          ],
          forbiddenOutputProperties: [
            '80MB fits inside 2MB without changes',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'asset-fallback-strategy',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Explicit budget conflict callout + route to asset-fallback-strategy',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only asset discovery plan',
              recommendedNextAction: 'Surface 80MB vs 2MB conflict callout and route to asset-fallback-strategy.',
              targetHandoff: 'asset-fallback-strategy',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Raised conflict callout on 80MB CAD asset vs 2MB GLB constraint and routed to asset-fallback-strategy.',
              warnings: [],
              evidenceCitations: ['skills/blender-asset-discovery-planner/EVAL.md'],
            },
          },
        },
        {
          id: 'asset-discovery-missing-brief-reroute',
          skillId: 'blender-asset-discovery-planner',
          scenario: 'No 8-slot brief provided before asset discovery',
          category: 'ambiguous',
          inputPrompt: 'Pick assets for my project right now (no brief provided).',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Refuses to guess asset classes without an 8-slot brief',
            'Routes back to intent-to-3d-brief-writer',
          ],
          requiredOutputProperties: [
            'intent-to-3d-brief-writer',
            'missing 8-slot brief',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'invented asset table',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'intent-to-3d-brief-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Re-route message to intent-to-3d-brief-writer',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only asset discovery plan',
              recommendedNextAction: 'Route back to intent-to-3d-brief-writer because of missing 8-slot brief.',
              targetHandoff: 'intent-to-3d-brief-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Halted asset discovery due to missing 8-slot brief and re-routed to intent-to-3d-brief-writer.',
              warnings: [],
              evidenceCitations: ['skills/blender-asset-discovery-planner/EVAL.md'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 8. blender-troubleshooting (Structured EVAL.md Table — 6 Cases)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'blender-troubleshooting',
      category: 'runtime-and-execution',
      isContractedSkill: false,
      evalMarkdownPath: 'skills/blender-troubleshooting/EVAL.md',
      sourceEvalTier: 'structured_multi_case_table',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Not Implemented',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'troubleshooting-black-render-diagnosis',
          skillId: 'blender-troubleshooting',
          scenario: 'Render output is completely black (3/3 reproducible)',
          category: 'normal',
          inputPrompt: 'Expected a cyberpunk-lit shoe render, but the observed render image is 100% black across 3/3 runs.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'file-only-unvalidated',
          },
          expectedBehavior: [
            'Completes all 4 diagnostic phases (reproduce -> narrow -> identify -> propose)',
            'Identifies missing key light / exposure in lighting plan and hands off to blender-lighting-material-planner',
          ],
          requiredOutputProperties: [
            'Phase 1 (reproduce)',
            'Phase 2 (narrow)',
            'Phase 3 (identify)',
            'Phase 4 (propose)',
            'blender-lighting-material-planner',
          ],
          forbiddenOutputProperties: [
            'I re-rendered the scene for you',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'blender-lighting-material-planner',
          truthStateExpectations: {
            runtimeStatus: 'Attempted',
            artifactStatus: 'Failed',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            '4-phase diagnostic record + rejected alternatives + pass criteria',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only root-cause diagnosis',
              recommendedNextAction: 'Phase 4 (propose): update key/rim exposure in blender-lighting-material-planner with observable luminance pass criteria.',
              targetHandoff: 'blender-lighting-material-planner',
              runtimeStatus: 'Attempted',
              artifactStatus: 'Failed',
              summary: 'Completed Phase 1 (reproduce), Phase 2 (narrow), Phase 3 (identify), and Phase 4 (propose) for black render; routed to blender-lighting-material-planner.',
              warnings: [],
              evidenceCitations: ['skills/blender-troubleshooting/EVAL.md'],
            },
          },
        },
        {
          id: 'troubleshooting-empty-glb-export',
          skillId: 'blender-troubleshooting',
          scenario: 'Exported GLB is an empty 100-byte container missing hero geometry',
          category: 'normal',
          inputPrompt: 'Expected GLB with hero shoe + floor, but observed output is a 100-byte empty .glb file.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'file-only-unvalidated',
          },
          expectedBehavior: [
            'Narrows issue to export selection/collection filter and identifies export plan misconfiguration',
            'Hands off to glb-web-handoff with pass criteria requiring mesh/material count > 0',
          ],
          requiredOutputProperties: [
            'Phase 1 (reproduce)',
            'Phase 3 (identify)',
            'glb-web-handoff',
          ],
          forbiddenOutputProperties: [
            'Artifact: Verified',
            're-exported the GLB now',
          ],
          expectedRoutingTarget: 'glb-web-handoff',
          truthStateExpectations: {
            runtimeStatus: 'Attempted',
            artifactStatus: 'Failed',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            '4-phase diagnosis + handoff to glb-web-handoff',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only root-cause diagnosis',
              recommendedNextAction: 'Re-specify collection inclusion in glb-web-handoff so exported GLB contains hero geometry.',
              targetHandoff: 'glb-web-handoff',
              runtimeStatus: 'Attempted',
              artifactStatus: 'Failed',
              summary: 'Completed Phase 1 (reproduce), Phase 2 (narrow), Phase 3 (identify), and Phase 4 (propose): empty GLB traced to export selection filter; routed to glb-web-handoff.',
              warnings: [],
              evidenceCitations: ['skills/blender-troubleshooting/EVAL.md'],
            },
          },
        },
        {
          id: 'troubleshooting-jargon-in-final-response',
          skillId: 'blender-troubleshooting',
          scenario: 'Final user-facing response leaked dense Blender jargon ("BSDF subsurf topology")',
          category: 'normal',
          inputPrompt: 'Expected plain-language stakeholder summary, but observed output says "adjust Principled BSDF subsurface anisotropy and quad topology".',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Identifies missing plain-language translation step in Phase 3',
            'Proposes routing through non-blender-user-response-writer in Phase 4',
          ],
          requiredOutputProperties: [
            'missing translation step',
            'non-blender-user-response-writer',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'jargon is acceptable for non-Blender users',
          ],
          expectedRoutingTarget: 'non-blender-user-response-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Root cause = missing translation step + handoff to non-blender-user-response-writer',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only root-cause diagnosis',
              recommendedNextAction: 'Route raw planner output through non-blender-user-response-writer to eliminate unglossed jargon.',
              targetHandoff: 'non-blender-user-response-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Identified missing translation step as root cause of jargon leak; proposed handoff to non-blender-user-response-writer.',
              warnings: [],
              evidenceCitations: ['skills/blender-troubleshooting/EVAL.md', 'laws/non-blender-user-language.md'],
            },
          },
        },
        {
          id: 'troubleshooting-intermittent-symptom-gate',
          skillId: 'blender-troubleshooting',
          scenario: 'Symptom is intermittent (1/5 runs) and cannot be locked in Phase 1 yet',
          category: 'evidence_boundary',
          inputPrompt: 'The render was black in 1 out of 5 runs, and the other 4 looked normal.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks symptom intermittent in Phase 1 and requires >= 2 consistent reproductions before proposing a fix',
            'Routes to runtime-attempt-report-writer to log structured reproduction attempts',
          ],
          requiredOutputProperties: [
            'intermittent',
            'no fix proposed yet',
            'runtime-attempt-report-writer',
          ],
          forbiddenOutputProperties: [
            'root cause confirmed',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'runtime-attempt-report-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Intermittent flag in Phase 1 + no speculative fix',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only root-cause diagnosis',
              recommendedNextAction: 'Symptom marked intermittent (1/5): no fix proposed yet; record reproduction inputs via runtime-attempt-report-writer.',
              targetHandoff: 'runtime-attempt-report-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Halted at Phase 1 (intermittent 1/5 runs); no fix proposed yet until >= 2 consistent reproductions are logged.',
              warnings: ['Never propose speculative fixes before Phase 1 reproduction is locked.'],
              evidenceCitations: ['skills/blender-troubleshooting/EVAL.md'],
            },
          },
        },
        {
          id: 'troubleshooting-missing-evidence-blocked-phase1',
          skillId: 'blender-troubleshooting',
          scenario: 'Operator says "the output is wrong" without file path, log, or screenshot',
          category: 'blocked_or_adversarial',
          inputPrompt: 'The Blender output is wrong, fix it now (no logs or paths provided).',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks Phase 1 blocked due to missing observed evidence',
            'Routes to official-runtime-readiness-checker / evidence collection without speculative fixes',
          ],
          requiredOutputProperties: [
            'Phase 1 blocked',
            'no speculative fix',
            'official-runtime-readiness-checker',
          ],
          forbiddenOutputProperties: [
            'probably needs better lighting',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Explicit Phase 1 blocked marker + zero speculative fixes',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only root-cause diagnosis',
              recommendedNextAction: 'Phase 1 blocked (missing observed evidence): route to official-runtime-readiness-checker with no speculative fix.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Marked Phase 1 blocked because no log or file path was supplied; issued no speculative fix.',
              warnings: [],
              evidenceCitations: ['skills/blender-troubleshooting/EVAL.md'],
            },
          },
        },
        {
          id: 'troubleshooting-ranked-competing-causes',
          skillId: 'blender-troubleshooting',
          scenario: 'Two plausible causes (camera framing vs subject scale) ranked by evidence weight',
          category: 'ambiguous',
          inputPrompt: 'The sneaker fills only 5% of the frame in the preview; both camera focal length and mesh import scale could explain it.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'file-only-unvalidated',
          },
          expectedBehavior: [
            'Ranks primary cause by evidence weight and preserves secondary cause as "alternative pending more evidence"',
            'Hands off to blender-composition-camera-planner',
          ],
          requiredOutputProperties: [
            'ranked by evidence weight',
            'alternative pending more evidence',
            'blender-composition-camera-planner',
          ],
          forbiddenOutputProperties: [
            '5 unranked causes',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'blender-composition-camera-planner',
          truthStateExpectations: {
            runtimeStatus: 'Attempted',
            artifactStatus: 'Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P2',
          evidenceRequirements: [
            'Ranked cause list + secondary cause marked alternative pending more evidence',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only root-cause diagnosis',
              recommendedNextAction: 'Verify camera distance in blender-composition-camera-planner (ranked by evidence weight; mesh scale kept as alternative pending more evidence).',
              targetHandoff: 'blender-composition-camera-planner',
              runtimeStatus: 'Attempted',
              artifactStatus: 'Produced',
              summary: 'Ranked camera framing vs mesh scale by evidence weight and kept second cause as alternative pending more evidence.',
              warnings: [],
              evidenceCitations: ['skills/blender-troubleshooting/EVAL.md'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 9. runtime-bridge-conflict-resolver (Structured EVAL.md Table — 7 Cases)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'runtime-bridge-conflict-resolver',
      category: 'runtime-and-execution',
      isContractedSkill: false,
      evalMarkdownPath: 'skills/runtime-bridge-conflict-resolver/EVAL.md',
      sourceEvalTier: 'structured_multi_case_table',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Not Implemented',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'bridge-conflict-path1-and-path2-both-enabled',
          skillId: 'runtime-bridge-conflict-resolver',
          scenario: 'Path 1 Lab MCP add-on and Path 2 mcp-for-blender addon.py both enabled in Blender',
          category: 'blocked_or_adversarial',
          inputPrompt: 'In Blender 5.1 I enabled both the Blender Lab MCP add-on and community mcp-for-blender addon.py. My target is Path 1 host (a).',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Builds bridge state matrix, identifies Path 1 host (a) as intended path, names Path 2 addon.py as residual bridge',
            'Proposes disabling Path 2 addon.py and hands off to official-runtime-readiness-checker without executing',
          ],
          requiredOutputProperties: [
            'bridge state matrix',
            'Path 1 host (a)',
            'disable unintended',
            'official-runtime-readiness-checker',
          ],
          forbiddenOutputProperties: [
            'I disabled the addon for you',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Bridge state matrix + intended path + cheapest fix + do-not reminders + handoff',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only bridge conflict diagnosis',
              recommendedNextAction: 'Disable unintended mcp-for-blender addon.py for Path 1 host (a) and re-verify via official-runtime-readiness-checker.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Built bridge state matrix for Path 1 host (a); identified community addon.py conflict; proposed disable unintended step.',
              warnings: ['Do not keep both Blender-side MCP add-ons enabled simultaneously.'],
              evidenceCitations: ['skills/runtime-bridge-conflict-resolver/EVAL.md'],
            },
          },
        },
        {
          id: 'bridge-conflict-two-mcp-clients-same-blender',
          skillId: 'runtime-bridge-conflict-resolver',
          scenario: 'Claude Desktop Connector ON + Cursor manual uvx mcp-for-blender targeting same Blender',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Claude Desktop Connector is active AND Cursor has uvx mcp-for-blender connected to the same Blender session.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Enforces single-client-per-session rule in the bridge state matrix',
            'Proposes unregistering the non-target client and hands off to official-runtime-readiness-checker',
          ],
          requiredOutputProperties: [
            'bridge state matrix',
            'single client per session',
            'official-runtime-readiness-checker',
          ],
          forbiddenOutputProperties: [
            'both clients can share the same Blender session',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Single-client decision + matrix + handoff to official-runtime-readiness-checker',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only bridge conflict diagnosis',
              recommendedNextAction: 'Pick a single client per session in the bridge state matrix and re-verify via official-runtime-readiness-checker.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Diagnosed multi-client collision in bridge state matrix; enforced single client per session.',
              warnings: [],
              evidenceCitations: ['skills/runtime-bridge-conflict-resolver/EVAL.md'],
            },
          },
        },
        {
          id: 'bridge-conflict-port-9876-collision',
          skillId: 'runtime-bridge-conflict-resolver',
          scenario: 'Port collision on localhost:9876 between Lab MCP server and community server',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Both MCP servers are trying to bind localhost:9876 and throwing EADDRINUSE.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Diagnoses localhost:9876 port collision in the matrix',
            'Proposes stopping the residual server or rebinding port and hands off to official-runtime-readiness-checker',
          ],
          requiredOutputProperties: [
            'localhost:9876',
            'port collision',
            'official-runtime-readiness-checker',
          ],
          forbiddenOutputProperties: [
            'killed the process for you',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Port collision diagnosis + port resolution proposal',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only bridge conflict diagnosis',
              recommendedNextAction: 'Resolve the localhost:9876 port collision by stopping the residual bridge and verify in official-runtime-readiness-checker.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Diagnosed localhost:9876 port collision in bridge state matrix and proposed single-server port resolution.',
              warnings: [],
              evidenceCitations: ['skills/runtime-bridge-conflict-resolver/EVAL.md'],
            },
          },
        },
        {
          id: 'bridge-conflict-dual-path1-hosts-in-claude-desktop',
          skillId: 'runtime-bridge-conflict-resolver',
          scenario: 'Anthropic Connector toggle ON + manual mcpServers.blender Lab entry both active in Claude Desktop',
          category: 'normal',
          inputPrompt: 'In Claude Desktop I turned ON the Anthropic Blender Connector AND also added a manual mcpServers.blender entry pointing to the Lab server.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Explains that both are Path 1 host options (a and b) targeting the same Blender Lab MCP stack',
            'Recommends picking one Path 1 host option per session and hands off to official-runtime-readiness-checker',
          ],
          requiredOutputProperties: [
            'both are Path 1 host options',
            'pick one host per session',
            'official-runtime-readiness-checker',
          ],
          forbiddenOutputProperties: [
            'Anthropic Connector is standalone',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Clarification that both are Path 1 host options + single host selection',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only bridge conflict diagnosis',
              recommendedNextAction: 'Because both are Path 1 host options, pick one host per session and re-verify in official-runtime-readiness-checker.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Identified redundant Path 1 host options (a and b) in Claude Desktop; advised picking one host per session.',
              warnings: ['Anthropic Connector is never standalone; it connects to the Blender Lab MCP add-on in Blender 5.1+.'],
              evidenceCitations: ['docs/runtime-stack-strategy.md', 'skills/runtime-bridge-conflict-resolver/EVAL.md'],
            },
          },
        },
        {
          id: 'bridge-conflict-clean-matrix-routes-to-troubleshooting',
          skillId: 'runtime-bridge-conflict-resolver',
          scenario: 'Bridge matrix is completely clean (single path, single client, no port collision) but smoke test still fails',
          category: 'structured_skip',
          inputPrompt: 'Only Path 1 host (a) and the Lab add-on are enabled, no port collision, but the smoke test still fails.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Confirms bridge state matrix is clean',
            'Routes to blender-troubleshooting for non-conflict diagnosis',
          ],
          requiredOutputProperties: [
            'clean matrix',
            'blender-troubleshooting',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'invented bridge conflict',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'blender-troubleshooting',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Clean matrix confirmation + route to blender-troubleshooting',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only bridge conflict diagnosis',
              recommendedNextAction: 'Verified clean matrix with zero bridge conflicts; route to blender-troubleshooting.',
              targetHandoff: 'blender-troubleshooting',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Confirmed clean matrix (single bridge, single client); handed off to blender-troubleshooting.',
              warnings: [],
              evidenceCitations: ['skills/runtime-bridge-conflict-resolver/EVAL.md'],
            },
          },
        },
        {
          id: 'bridge-conflict-unknown-port-no-logs',
          skillId: 'runtime-bridge-conflict-resolver',
          scenario: 'Operator has no netstat/lsof port output',
          category: 'evidence_boundary',
          inputPrompt: 'I do not have netstat output, only my MCP client config JSON files.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks port collision check explicitly as Unknown and proceeds with config-based matrix diagnosis',
            'Hands off to official-runtime-readiness-checker',
          ],
          requiredOutputProperties: [
            'Port collision: Unknown',
            'config-based diagnosis',
            'official-runtime-readiness-checker',
          ],
          forbiddenOutputProperties: [
            'Port collision: Verified Pass',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P2',
          evidenceRequirements: [
            'Explicit Unknown port marker + partial config-based diagnosis',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only bridge conflict diagnosis',
              recommendedNextAction: 'Record Port collision: Unknown and proceed with config-based diagnosis before official-runtime-readiness-checker.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Marked Port collision: Unknown due to missing socket logs and completed config-based diagnosis.',
              warnings: [],
              evidenceCitations: ['skills/runtime-bridge-conflict-resolver/EVAL.md'],
            },
          },
        },
        {
          id: 'bridge-conflict-dual-blender-process-isolation',
          skillId: 'runtime-bridge-conflict-resolver',
          scenario: 'Operator wants two separate Blender processes on isolated ports',
          category: 'normal',
          inputPrompt: 'Can I run Blender 5.1 with Path 1 on port 9876 and a separate Blender 4.2 instance with Path 2 on port 9877?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Provides explicit process and port isolation plan in the matrix',
            'Hands off to official-runtime-readiness-checker to verify each isolated instance separately',
          ],
          requiredOutputProperties: [
            'port isolation plan',
            'separate processes',
            'official-runtime-readiness-checker',
          ],
          forbiddenOutputProperties: [
            'both bridges in one process',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P2',
          evidenceRequirements: [
            'Port isolation plan + separate process verification matrix',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only bridge conflict diagnosis',
              recommendedNextAction: 'Document port isolation plan across separate processes and verify via official-runtime-readiness-checker.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Created port isolation plan for separate processes (9876 vs 9877) and routed to official-runtime-readiness-checker.',
              warnings: [],
              evidenceCitations: ['skills/runtime-bridge-conflict-resolver/EVAL.md'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 10. render-export-evidence (Structured EVAL.md Table — 8 Cases)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'render-export-evidence',
      category: 'evidence-and-handoff',
      isContractedSkill: false,
      evalMarkdownPath: 'skills/render-export-evidence/EVAL.md',
      sourceEvalTier: 'structured_multi_case_table',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Not Implemented',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'render-evidence-no-runtime-action',
          skillId: 'render-export-evidence',
          scenario: 'No Blender execution attempted preserves Not Run and Not Produced',
          category: 'normal',
          inputPrompt: 'We completed our text-only scene and lighting plan with zero Blender execution. Classify evidence status.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Classifies Runtime status as Not Run and Artifact status as Not Produced',
            'Hands off to pre-handoff-verification',
          ],
          requiredOutputProperties: [
            'Runtime: Not Run',
            'Artifact: Not Produced',
            'pre-handoff-verification',
          ],
          forbiddenOutputProperties: [
            'Artifact: Not Run',
            'Artifact: Produced',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'pre-handoff-verification',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Runtime: Not Run and Artifact: Not Produced separation',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only artifact evidence classification',
              recommendedNextAction: 'Pass conservative Not Run / Not Produced evidence table to pre-handoff-verification.',
              targetHandoff: 'pre-handoff-verification',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Classified text-only session as Runtime: Not Run and Artifact: Not Produced.',
              warnings: [],
              evidenceCitations: ['skills/render-export-evidence/EVAL.md', 'laws/evidence-before-done.md'],
            },
          },
        },
        {
          id: 'render-evidence-attempted-no-output-file',
          skillId: 'render-export-evidence',
          scenario: 'Runtime command attempted but no output path or file evidence exists',
          category: 'evidence_boundary',
          inputPrompt: 'The operator ran a render command in Blender, but no output path or file on disk was recorded.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'attempted-no-file',
          },
          expectedBehavior: [
            'Classifies Artifact status as Attempted (never Produced or Verified)',
            'Routes to pre-handoff-verification with blocked validation notes',
          ],
          requiredOutputProperties: [
            'Artifact: Attempted',
            'output path missing',
            'pre-handoff-verification',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'pre-handoff-verification',
          truthStateExpectations: {
            runtimeStatus: 'Attempted',
            artifactStatus: 'Attempted',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Artifact status Attempted when output path or file existence is missing',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only artifact evidence classification',
              recommendedNextAction: 'Keep status at Artifact: Attempted (output path missing) and route to pre-handoff-verification.',
              targetHandoff: 'pre-handoff-verification',
              runtimeStatus: 'Attempted',
              artifactStatus: 'Attempted',
              summary: 'Downgraded unsubstantiated render claim to Artifact: Attempted because output path is missing.',
              warnings: ['Never upgrade Attempted to Produced without file existence evidence.'],
              evidenceCitations: ['skills/render-export-evidence/EVAL.md'],
            },
          },
        },
        {
          id: 'render-evidence-file-exists-validation-missing',
          skillId: 'render-export-evidence',
          scenario: 'Output file exists on disk but validation checks are missing',
          category: 'evidence_boundary',
          inputPrompt: 'File renders/hero.png exists on disk, but no framing, lighting, or polycount validation checks have been recorded yet.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'file-only-unvalidated',
          },
          expectedBehavior: [
            'Classifies Artifact status as Produced (never Verified without validation notes)',
            'Routes to blender-scene-quality-checker to complete validation checks',
          ],
          requiredOutputProperties: [
            'Artifact: Produced',
            'validation notes pending',
            'blender-scene-quality-checker',
          ],
          forbiddenOutputProperties: [
            'Artifact: Verified',
            'validation complete',
          ],
          expectedRoutingTarget: 'blender-scene-quality-checker',
          truthStateExpectations: {
            runtimeStatus: 'Produced',
            artifactStatus: 'Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Produced (not Verified) classification when validation notes are missing',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only artifact evidence classification',
              recommendedNextAction: 'Record Artifact: Produced (validation notes pending) and route to blender-scene-quality-checker.',
              targetHandoff: 'blender-scene-quality-checker',
              runtimeStatus: 'Produced',
              artifactStatus: 'Produced',
              summary: 'Classified renders/hero.png as Artifact: Produced because validation notes are still pending.',
              warnings: [],
              evidenceCitations: ['skills/render-export-evidence/EVAL.md'],
            },
          },
        },
        {
          id: 'render-evidence-full-path-existence-and-validation',
          skillId: 'render-export-evidence',
          scenario: 'Output path, file existence, tool names, and validation notes are all recorded',
          category: 'normal',
          inputPrompt: 'Path 1 host (a) produced renders/hero-v1.png; file existence verified; framing, PBR material, and lighting validation checks all passed.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'file-and-validation-recorded',
          },
          expectedBehavior: [
            'Classifies Artifact status as Verified with full provenance fields',
            'Hands off to pre-handoff-verification for final 7-point check',
          ],
          requiredOutputProperties: [
            'Artifact: Verified',
            'Path 1 host (a)',
            'pre-handoff-verification',
          ],
          forbiddenOutputProperties: [
            'standalone connector',
            'Artifact: Not Run',
          ],
          expectedRoutingTarget: 'pre-handoff-verification',
          truthStateExpectations: {
            runtimeStatus: 'Verified',
            artifactStatus: 'Verified',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Complete 13-field evidence record + Verified classification',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only artifact evidence classification',
              recommendedNextAction: 'Pass complete Path 1 host (a) Artifact: Verified record to pre-handoff-verification.',
              targetHandoff: 'pre-handoff-verification',
              runtimeStatus: 'Verified',
              artifactStatus: 'Verified',
              summary: 'Recorded Artifact: Verified for renders/hero-v1.png under Path 1 host (a) with complete validation notes.',
              warnings: [],
              evidenceCitations: ['skills/render-export-evidence/EVAL.md'],
            },
          },
        },
        {
          id: 'render-evidence-path1-read-only-smoke-no-artifacts',
          skillId: 'render-export-evidence',
          scenario: 'Path 1 read-only smoke test returned get_blendfile_summary_* and get_objects_summary only',
          category: 'evidence_boundary',
          inputPrompt: 'Lab MCP returned get_blendfile_summary and get_objects_summary from Blender 5.1 under Path 1 host (a); no render or export was run.',
          preconditions: {
            mode: 'read-only-smoke-transcript',
            runtimeAvailable: true,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Labels runtime access as scoped read-only (Attempted) and keeps Artifact status strictly Not Produced',
            'Explicitly records Path 1 + host option (a) and tool names',
          ],
          requiredOutputProperties: [
            'scoped read-only',
            'Path 1 host (a)',
            'Artifact: Not Produced',
            'pre-handoff-verification',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'pre-handoff-verification',
          truthStateExpectations: {
            runtimeStatus: 'Attempted',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Read-only smoke separation from artifact production (Artifact: Not Produced)',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only artifact evidence classification',
              recommendedNextAction: 'Record scoped read-only runtime access under Path 1 host (a) with Artifact: Not Produced and route to pre-handoff-verification.',
              targetHandoff: 'pre-handoff-verification',
              runtimeStatus: 'Attempted',
              artifactStatus: 'Not Produced',
              summary: 'Classified Lab MCP read-only smoke transcript as scoped read-only with Artifact: Not Produced.',
              warnings: ['Read-only smoke tests never constitute render or GLB artifact production.'],
              evidenceCitations: ['docs/evals/blender-connector-read-only-smoke-test.md', 'skills/render-export-evidence/EVAL.md'],
            },
          },
        },
        {
          id: 'render-evidence-path2-community-caveat-labeling',
          skillId: 'render-export-evidence',
          scenario: 'Path 2 (mcp-for-blender) evidence requires upstream commit and third-party caveat',
          category: 'normal',
          inputPrompt: 'We produced a preview image using community uvx mcp-for-blender (Path 2) with execute_blender_code.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'file-only-unvalidated',
          },
          expectedBehavior: [
            'Labels evidence as Path 2 with upstream addon.py / uvx mcp-for-blender version and third-party caveat',
            'Never promotes Path 2 evidence as official Path 1 release evidence',
          ],
          requiredOutputProperties: [
            'Path 2',
            'third-party from Anthropic and Blender Foundation',
            'docs/unofficial-runtime-bridges.md',
          ],
          forbiddenOutputProperties: [
            'official Path 1 evidence',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'pre-handoff-verification',
          truthStateExpectations: {
            runtimeStatus: 'Produced',
            artifactStatus: 'Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Path 2 label + third-party caveat per docs/unofficial-runtime-bridges.md',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only artifact evidence classification',
              recommendedNextAction: 'Attach Path 2 third-party caveat per docs/unofficial-runtime-bridges.md and route to pre-handoff-verification.',
              targetHandoff: 'pre-handoff-verification',
              runtimeStatus: 'Produced',
              artifactStatus: 'Produced',
              summary: 'Labeled preview output as Path 2 (third-party from Anthropic and Blender Foundation) per docs/unofficial-runtime-bridges.md.',
              warnings: [],
              evidenceCitations: ['docs/unofficial-runtime-bridges.md', 'skills/render-export-evidence/EVAL.md'],
            },
          },
        },
        {
          id: 'render-evidence-cli-fallback-appendix-note',
          skillId: 'render-export-evidence',
          scenario: 'CLI fallback (blender --background --python) evidence requires explicit appendix note',
          category: 'normal',
          inputPrompt: 'We ran blender --background scene.blend --python render.py and produced /tmp/out.png.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'file-only-unvalidated',
          },
          expectedBehavior: [
            'Labels evidence as CLI fallback (appendix) with explicit note that no in-repo evidence file yet exists (Blender CLI itself is upstream-documented)',
            'Classifies unvalidated output file as Produced (not Verified) and routes to pre-handoff-verification',
          ],
          requiredOutputProperties: [
            'CLI fallback (appendix)',
            'no in-repo evidence file yet',
            'upstream-documented',
          ],
          forbiddenOutputProperties: [
            'publisher-verified MCP peer',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'pre-handoff-verification',
          truthStateExpectations: {
            runtimeStatus: 'Produced',
            artifactStatus: 'Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'CLI fallback appendix label + no in-repo evidence file yet note',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only artifact evidence classification',
              recommendedNextAction: 'Label output as CLI fallback (appendix) with no in-repo evidence file yet note and route to pre-handoff-verification.',
              targetHandoff: 'pre-handoff-verification',
              runtimeStatus: 'Produced',
              artifactStatus: 'Produced',
              summary: 'Classified background CLI run as CLI fallback (appendix) — upstream-documented Blender CLI, no in-repo evidence file yet.',
              warnings: [],
              evidenceCitations: ['docs/runtime-stack-strategy.md', 'skills/render-export-evidence/EVAL.md'],
            },
          },
        },
        {
          id: 'render-evidence-tool-name-vs-path-label-mismatch',
          skillId: 'render-export-evidence',
          scenario: 'Recorded tool names (get_scene_info) contradict Path 1 label',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Operator labeled the run as Path 1 Lab MCP, but the recorded tool calls are get_scene_info and get_object_info from Path 2.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: false,
            existingArtifactEvidence: 'attempted-no-file',
          },
          expectedBehavior: [
            'Flags tool-name vs path-label inconsistency as ambiguous and refuses to count it as verified evidence',
            'Recommends re-verification via official-runtime-readiness-checker',
          ],
          requiredOutputProperties: [
            'ambiguous',
            're-verification needed',
            'official-runtime-readiness-checker',
          ],
          forbiddenOutputProperties: [
            'Artifact: Verified',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'official-runtime-readiness-checker',
          truthStateExpectations: {
            runtimeStatus: 'Attempted',
            artifactStatus: 'Attempted',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Tool-surface vs path-label mismatch detection + re-verification recommendation',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only artifact evidence classification',
              recommendedNextAction: 'Mark path attribution ambiguous (re-verification needed) and route to official-runtime-readiness-checker.',
              targetHandoff: 'official-runtime-readiness-checker',
              runtimeStatus: 'Attempted',
              artifactStatus: 'Attempted',
              summary: 'Detected tool-name vs path-label mismatch (get_scene_info belongs to Path 2, not Path 1); marked ambiguous with re-verification needed.',
              warnings: [],
              evidenceCitations: ['skills/render-export-evidence/EVAL.md'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 11. pre-handoff-verification (Structured EVAL.md Table — 7 Cases)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'pre-handoff-verification',
      category: 'evidence-and-handoff',
      isContractedSkill: false,
      evalMarkdownPath: 'skills/pre-handoff-verification/EVAL.md',
      sourceEvalTier: 'structured_multi_case_table',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Not Implemented',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'pre-handoff-verified-claim-upheld',
          skillId: 'pre-handoff-verification',
          scenario: 'Verified claim with all 7 checklist items passing is upheld',
          category: 'normal',
          inputPrompt: 'Proposed claim: Verified. Path 1 host (a). File renders/preview-2026.png exists. Validation notes complete. Tool names recorded. Plain language verified.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'file-and-validation-recorded',
          },
          expectedBehavior: [
            'Runs all 7 checks systematically, confirms Pass on each, and upholds Verified claim',
            'Hands off to non-blender-user-response-writer',
          ],
          requiredOutputProperties: [
            '7-check record',
            'Verified upheld',
            'non-blender-user-response-writer',
          ],
          forbiddenOutputProperties: [
            'Artifact: Not Run',
            'skipped check',
          ],
          expectedRoutingTarget: 'non-blender-user-response-writer',
          truthStateExpectations: {
            runtimeStatus: 'Verified',
            artifactStatus: 'Verified',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Complete 7-check record all Pass + Verified upheld',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 7-point handoff gate',
              recommendedNextAction: '7-check record all Pass (Verified upheld); hand off to non-blender-user-response-writer.',
              targetHandoff: 'non-blender-user-response-writer',
              runtimeStatus: 'Verified',
              artifactStatus: 'Verified',
              summary: 'Completed 7-check record with all checks passing; Verified upheld for final user response.',
              warnings: [],
              evidenceCitations: ['skills/pre-handoff-verification/EVAL.md'],
            },
          },
        },
        {
          id: 'pre-handoff-missing-validation-downgrades-to-produced',
          skillId: 'pre-handoff-verification',
          scenario: 'Verified claim missing validation notes fails Check 4 and downgrades to Produced',
          category: 'evidence_boundary',
          inputPrompt: 'Proposed claim: Verified. File exports/shoe.glb exists on disk, but Check 4 validation notes are empty.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'file-only-unvalidated',
          },
          expectedBehavior: [
            'Marks Check 4 (validation notes) Fail and downgrades resulting claim from Verified to Produced',
            'Routes to blender-scene-quality-checker',
          ],
          requiredOutputProperties: [
            'Check 4 Fail',
            'downgrade to Produced',
            'blender-scene-quality-checker',
          ],
          forbiddenOutputProperties: [
            'Verified upheld',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'blender-scene-quality-checker',
          truthStateExpectations: {
            runtimeStatus: 'Produced',
            artifactStatus: 'Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Check 4 Fail + explicit downgrade from Verified to Produced',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 7-point handoff gate',
              recommendedNextAction: 'Check 4 Fail: downgrade to Produced and route to blender-scene-quality-checker for validation.',
              targetHandoff: 'blender-scene-quality-checker',
              runtimeStatus: 'Produced',
              artifactStatus: 'Produced',
              summary: 'Check 4 Fail (missing validation notes); enforced downgrade to Produced.',
              warnings: ['pre-handoff-verification only confirms or downgrades claims; never upgrades.'],
              evidenceCitations: ['skills/pre-handoff-verification/EVAL.md'],
            },
          },
        },
        {
          id: 'pre-handoff-produced-no-file-downgrades-to-attempted',
          skillId: 'pre-handoff-verification',
          scenario: 'Produced claim with no file path fails Check 3 and downgrades to Attempted',
          category: 'evidence_boundary',
          inputPrompt: 'Proposed claim: Produced. Operator says render finished, but no output file path exists.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'attempted-no-file',
          },
          expectedBehavior: [
            'Marks Check 3 (artifact paths) Fail and downgrades claim from Produced to Attempted',
            'Routes to render-export-evidence',
          ],
          requiredOutputProperties: [
            'Check 3 Fail',
            'downgrade to Attempted',
            'render-export-evidence',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'render-export-evidence',
          truthStateExpectations: {
            runtimeStatus: 'Attempted',
            artifactStatus: 'Attempted',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Check 3 Fail + downgrade to Attempted',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 7-point handoff gate',
              recommendedNextAction: 'Check 3 Fail (missing file path): downgrade to Attempted and route to render-export-evidence.',
              targetHandoff: 'render-export-evidence',
              runtimeStatus: 'Attempted',
              artifactStatus: 'Attempted',
              summary: 'Check 3 Fail; downgraded Produced claim to Attempted due to missing artifact path.',
              warnings: [],
              evidenceCitations: ['skills/pre-handoff-verification/EVAL.md'],
            },
          },
        },
        {
          id: 'pre-handoff-smoke-claim-with-mutation-tool-fails',
          skillId: 'pre-handoff-verification',
          scenario: 'Read-only smoke claim includes execute_blender_code mutation tool call',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Proposed claim: Pass on read-only smoke test, but tool transcript includes execute_blender_code.',
          preconditions: {
            mode: 'read-only-smoke-transcript',
            runtimeAvailable: true,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Fails Check 6 (no-mutation guarantee) and flags mutation tool execution during a read-only smoke claim',
            'Routes to render-export-evidence to reclassify transcript',
          ],
          requiredOutputProperties: [
            'Check 6 Fail',
            'mutation flag',
            'render-export-evidence',
          ],
          forbiddenOutputProperties: [
            'read-only smoke upheld',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'render-export-evidence',
          truthStateExpectations: {
            runtimeStatus: 'Attempted',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Check 6 Fail + mutation flag on execute_blender_code',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 7-point handoff gate',
              recommendedNextAction: 'Check 6 Fail (mutation flag on execute_blender_code): reject read-only smoke label and route to render-export-evidence.',
              targetHandoff: 'render-export-evidence',
              runtimeStatus: 'Attempted',
              artifactStatus: 'Not Produced',
              summary: 'Failed Check 6 (no-mutation guarantee) because execute_blender_code was called; raised mutation flag.',
              warnings: [],
              evidenceCitations: ['skills/pre-handoff-verification/EVAL.md'],
            },
          },
        },
        {
          id: 'pre-handoff-vague-ready-claim-rejected',
          skillId: 'pre-handoff-verification',
          scenario: 'Vague "It\'s ready, ship it" claim fails Check 1 (claim named)',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Proposed handoff says: "It is ready, ship it to the client!" without any canonical truth state.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Fails Check 1 because "ready" is not one of the 5 canonical truth states',
            'Rejects handoff and routes to render-export-evidence',
          ],
          requiredOutputProperties: [
            'Check 1 Fail',
            'reject handoff until claim is named',
            'render-export-evidence',
          ],
          forbiddenOutputProperties: [
            'ship it approved',
            'Artifact: Verified',
          ],
          expectedRoutingTarget: 'render-export-evidence',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Check 1 Fail + rejection of non-canonical truth label',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 7-point handoff gate',
              recommendedNextAction: 'Check 1 Fail: reject handoff until claim is named using canonical truth states via render-export-evidence.',
              targetHandoff: 'render-export-evidence',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Check 1 Fail: "ready" is not a valid truth label; rejected handoff until claim is named.',
              warnings: [],
              evidenceCitations: ['skills/pre-handoff-verification/EVAL.md', 'laws/evidence-before-done.md'],
            },
          },
        },
        {
          id: 'pre-handoff-text-only-mode-na-checks',
          skillId: 'pre-handoff-verification',
          scenario: 'Text-only planning handoff passes Checks 1, 2, 7 and marks Checks 3-6 as N/A',
          category: 'structured_skip',
          inputPrompt: 'Verify our text-only 3D scene plan handoff where Runtime is Not Run and Artifact is Not Produced.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Passes Checks 1, 2, and 7 while marking Checks 3-6 explicitly N/A for text-only mode',
            'Hands off to non-blender-user-response-writer',
          ],
          requiredOutputProperties: [
            'Checks 1, 2, 7 Pass',
            'Checks 3-6 marked N/A',
            'non-blender-user-response-writer',
          ],
          forbiddenOutputProperties: [
            'Artifact: Produced',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'non-blender-user-response-writer',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Explicit N/A markers on Checks 3-6 + Pass on Checks 1, 2, 7',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 7-point handoff gate',
              recommendedNextAction: 'Checks 1, 2, 7 Pass and Checks 3-6 marked N/A; advance to non-blender-user-response-writer.',
              targetHandoff: 'non-blender-user-response-writer',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Verified text-only handoff (Checks 1, 2, 7 Pass; Checks 3-6 marked N/A) and routed to non-blender-user-response-writer.',
              warnings: [],
              evidenceCitations: ['skills/pre-handoff-verification/EVAL.md'],
            },
          },
        },
        {
          id: 'pre-handoff-operator-override-logged-without-upgrade',
          skillId: 'pre-handoff-verification',
          scenario: 'Operator attempts to override downgrade ("ignore downgrade, mark Verified anyway")',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Ignore the missing validation notes on Check 4 and mark the GLB as Verified anyway.',
          preconditions: {
            mode: 'artifact-claim-audit',
            runtimeAvailable: true,
            existingArtifactEvidence: 'file-only-unvalidated',
          },
          expectedBehavior: [
            'Logs the operator override request in the evidence record but keeps the check result and downgraded Produced status unchanged',
            'Refuses to upgrade Produced to Verified without validation evidence',
          ],
          requiredOutputProperties: [
            'override logged in evidence',
            'check result unchanged',
            'Artifact: Produced',
          ],
          forbiddenOutputProperties: [
            'Artifact: Verified',
            'override accepted as Verified',
          ],
          expectedRoutingTarget: 'non-blender-user-response-writer',
          truthStateExpectations: {
            runtimeStatus: 'Produced',
            artifactStatus: 'Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Override log entry + unchanged downgraded status (Produced)',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only 7-point handoff gate',
              recommendedNextAction: 'Operator override logged in evidence with check result unchanged (Artifact: Produced); route to non-blender-user-response-writer.',
              targetHandoff: 'non-blender-user-response-writer',
              runtimeStatus: 'Produced',
              artifactStatus: 'Produced',
              summary: 'Logged operator override request in evidence; check result unchanged and claim remains downgraded at Artifact: Produced.',
              warnings: ['Operator override cannot fabricate missing validation evidence.'],
              evidenceCitations: ['skills/pre-handoff-verification/EVAL.md'],
            },
          },
        },
      ],
    },

    // =========================================================================
    // 12. official-runtime-readiness-checker (Gateway Runtime Skill — 5 Cases)
    // =========================================================================
    {
      schemaVersion: '1.0.0',
      skillId: 'official-runtime-readiness-checker',
      category: 'runtime-and-execution',
      isContractedSkill: false,
      evalMarkdownPath: 'skills/official-runtime-readiness-checker/EVAL.md',
      sourceEvalTier: 'gateway_pilot_upgraded',
      evaluationStatus: {
        staticValidation: 'Passed',
        deterministicFixture: 'Passed',
        contractRouting: 'Not Implemented',
        liveModel: 'Not Run',
        blenderRuntime: 'Not Run',
      },
      cases: [
        {
          id: 'readiness-checker-path1-blender-version-below-floor',
          skillId: 'official-runtime-readiness-checker',
          scenario: 'User wants Path 1 (Blender Lab MCP) but has Blender 4.2 installed (< 5.1 floor)',
          category: 'blocked_or_adversarial',
          inputPrompt: 'I want to use Path 1 (Anthropic Connector + Blender Lab MCP add-on), and my installed Blender version is 4.2 LTS. Check readiness.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks Path 1 Blocked because the Blender Lab MCP add-on manifest requires Blender 5.1+',
            'Explains that Path 2 (mcp-for-blender, Blender 3.0+) or CLI fallback does not have the 5.1+ floor, and routes to runtime-path-picker',
          ],
          requiredOutputProperties: [
            'Blocked',
            'Blender 5.1+',
            'Path 1',
            'runtime-path-picker',
          ],
          forbiddenOutputProperties: [
            'Path 1 Ready on Blender 4.2',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'runtime-path-picker',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Readiness matrix showing Blender 5.1+ floor bound to Path 1 Lab add-on',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only runtime readiness check',
              recommendedNextAction: 'Path 1 is Blocked on Blender 4.2 (Lab MCP add-on requires Blender 5.1+); route to runtime-path-picker or upgrade to Blender 5.1+.',
              targetHandoff: 'runtime-path-picker',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Marked Path 1 Blocked because Blender 5.1+ is required by the Lab MCP add-on manifest; routed to runtime-path-picker.',
              warnings: ['The Blender 5.1+ floor applies only to Path 1 (Lab MCP add-on), not Path 2 (3.0+) or CLI fallback.'],
              evidenceCitations: ['docs/runtime-stack-strategy.md', 'skills/official-runtime-readiness-checker/EVAL.md'],
            },
          },
        },
        {
          id: 'readiness-checker-standalone-connector-misconception',
          skillId: 'official-runtime-readiness-checker',
          scenario: 'User enabled Claude Desktop Connector toggle but did not install the Blender Lab MCP add-on inside Blender 5.1+',
          category: 'evidence_boundary',
          inputPrompt: 'I toggled ON the Anthropic Blender Connector in Claude Desktop on Blender 5.1, so I do not need any Blender add-on, right?',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks status Partially Ready / Blocked and states that Anthropic Connector is NOT standalone (Step 2 requires installing the Blender Lab MCP add-on inside Blender 5.1+)',
            'Routes to official-runtime-setup-guide',
          ],
          requiredOutputProperties: [
            'Partially Ready',
            'not standalone',
            'Blender Lab MCP add-on',
            'official-runtime-setup-guide',
          ],
          forbiddenOutputProperties: [
            'Connector works standalone without add-on',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'official-runtime-setup-guide',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Explicit non-standalone Connector check + route to official-runtime-setup-guide',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only runtime readiness check',
              recommendedNextAction: 'Status Partially Ready: Anthropic Connector is not standalone; install the Blender Lab MCP add-on via official-runtime-setup-guide.',
              targetHandoff: 'official-runtime-setup-guide',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Flagged missing Blender Lab MCP add-on; explained that Anthropic Connector is not standalone and routed to official-runtime-setup-guide.',
              warnings: [],
              evidenceCitations: ['docs/external-runtime-setup.md', 'skills/official-runtime-readiness-checker/EVAL.md'],
            },
          },
        },
        {
          id: 'readiness-checker-ready-is-not-execution',
          skillId: 'official-runtime-readiness-checker',
          scenario: 'All Path 1 host (a) checks pass, but readiness must not be conflated with execution or artifact creation',
          category: 'normal',
          inputPrompt: 'Blender 5.1 is open, Blender Lab MCP add-on is enabled on port 9876, and Claude Desktop Connector is connected with zero conflicts.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Reports readiness status Ready (verified-read confidence) while keeping Runtime execution status Not Run and Artifact status Not Produced',
            'Hands off to product-hero-scene-planner',
          ],
          requiredOutputProperties: [
            'Readiness: Ready',
            'Runtime: Not Run',
            'Artifact: Not Produced',
            'product-hero-scene-planner',
          ],
          forbiddenOutputProperties: [
            'Runtime: Verified',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'product-hero-scene-planner',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P0',
          evidenceRequirements: [
            'Separation between Readiness: Ready and Runtime: Not Run / Artifact: Not Produced',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only runtime readiness check',
              recommendedNextAction: 'Readiness: Ready for Path 1 host (a), while Runtime: Not Run and Artifact: Not Produced until execution; proceed to product-hero-scene-planner.',
              targetHandoff: 'product-hero-scene-planner',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Verified Readiness: Ready for Path 1 host (a) without conflating readiness with runtime execution (Runtime: Not Run).',
              warnings: [],
              evidenceCitations: ['skills/official-runtime-readiness-checker/EVAL.md', 'laws/evidence-before-done.md'],
            },
          },
        },
        {
          id: 'readiness-checker-dual-bridge-conflict-detected',
          skillId: 'official-runtime-readiness-checker',
          scenario: 'Readiness matrix detects both Lab MCP add-on and community mcp-for-blender enabled',
          category: 'blocked_or_adversarial',
          inputPrompt: 'Check my readiness: Blender 5.1 has both Lab MCP add-on and ahujasid mcp-for-blender enabled on port 9876.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks readiness Blocked due to single-bridge constraint violation',
            'Routes to runtime-bridge-conflict-resolver',
          ],
          requiredOutputProperties: [
            'Blocked',
            'single-bridge constraint',
            'runtime-bridge-conflict-resolver',
          ],
          forbiddenOutputProperties: [
            'Readiness: Ready',
            'Runtime: Verified',
          ],
          expectedRoutingTarget: 'runtime-bridge-conflict-resolver',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Blocked status + route to runtime-bridge-conflict-resolver',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only runtime readiness check',
              recommendedNextAction: 'Readiness Blocked by single-bridge constraint violation; route to runtime-bridge-conflict-resolver.',
              targetHandoff: 'runtime-bridge-conflict-resolver',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Marked readiness Blocked due to dual MCP add-ons enabled simultaneously; routed to runtime-bridge-conflict-resolver.',
              warnings: [],
              evidenceCitations: ['skills/official-runtime-readiness-checker/EVAL.md'],
            },
          },
        },
        {
          id: 'readiness-checker-no-environment-info-unknown',
          skillId: 'official-runtime-readiness-checker',
          scenario: 'User provides zero information about Blender version, add-on, or MCP client',
          category: 'ambiguous',
          inputPrompt: 'Am I ready to run Blender MCP? I have not checked my Blender version or installed any add-ons yet.',
          preconditions: {
            mode: 'text-only',
            runtimeAvailable: false,
            existingArtifactEvidence: 'none',
          },
          expectedBehavior: [
            'Marks readiness status Unknown / Blocked with linked-only or unknown confidence',
            'Routes to official-runtime-setup-guide',
          ],
          requiredOutputProperties: [
            'Unknown',
            'official-runtime-setup-guide',
            'Runtime: Not Run',
          ],
          forbiddenOutputProperties: [
            'Readiness: Ready',
            'Artifact: Produced',
          ],
          expectedRoutingTarget: 'official-runtime-setup-guide',
          truthStateExpectations: {
            runtimeStatus: 'Not Run',
            artifactStatus: 'Not Produced',
          },
          evaluationType: 'deterministic_fixture',
          severity: 'P1',
          evidenceRequirements: [
            'Conservative Unknown status + route to official-runtime-setup-guide',
          ],
          deterministicFixture: {
            simulatedOutput: {
              mode: 'Text-only runtime readiness check',
              recommendedNextAction: 'Readiness status is Unknown; follow official-runtime-setup-guide to verify Blender version and MCP add-on setup.',
              targetHandoff: 'official-runtime-setup-guide',
              runtimeStatus: 'Not Run',
              artifactStatus: 'Not Produced',
              summary: 'Assigned conservative Unknown readiness status and routed to official-runtime-setup-guide.',
              warnings: [],
              evidenceCitations: ['skills/official-runtime-readiness-checker/EVAL.md'],
            },
          },
        },
      ],
    },
  ];
}

export function getCatalogSkillIds(rootDir = ROOT_DIR) {
  const skillsDir = path.join(rootDir, 'skills');
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .filter((id) => fs.existsSync(path.join(skillsDir, id, 'SKILL.md')))
    .sort();
}

export function loadContractMap(rootDir = ROOT_DIR) {
  const skillsDir = path.join(rootDir, 'skills');
  const map = new Map();
  const list = [];
  for (const id of getCatalogSkillIds(rootDir)) {
    const cPath = path.join(skillsDir, id, 'contract.json');
    if (fs.existsSync(cPath)) {
      const c = JSON.parse(fs.readFileSync(cPath, 'utf8'));
      map.set(id, c);
      list.push(c);
    }
  }
  return { contractsById: map, allContracts: list };
}

export function buildEvalArtifacts(rootDir = ROOT_DIR) {
  const catalogIds = getCatalogSkillIds(rootDir);
  const catalogSet = new Set(catalogIds);
  const suites = buildPilotEvalSuitesData();
  const errors = [];

  for (const suite of suites) {
    const suiteErrors = validateEvalSuiteObject(
      suite,
      suite.skillId,
      catalogSet,
      path.join(rootDir, 'schemas', 'skill-eval.schema.json'),
    );
    errors.push(...suiteErrors);
  }

  const pilotIds = new Set(suites.map((s) => s.skillId));
  const remainingProseSkillIds = catalogIds.filter((id) => !pilotIds.has(id));

  const totalCases = suites.reduce((acc, s) => acc + s.cases.length, 0);
  const contractRoutingCases = suites.reduce(
    (acc, s) => acc + s.cases.filter((c) => c.evaluationType === 'contract_routing').length,
    0,
  );
  const deterministicFixtureCases = suites.reduce(
    (acc, s) => acc + s.cases.filter((c) => c.evaluationType === 'deterministic_fixture').length,
    0,
  );

  const indexObj = {
    schemaVersion: '1.0.0',
    phase: 'phase-3-foundation',
    generatedBy: 'scripts/run-evals.mjs',
    coverageSummary: {
      totalCatalogSkills: catalogIds.length,
      machineReadablePilotSuites: suites.length,
      remainingProseOnlyEvalFiles: remainingProseSkillIds.length,
      totalMachineReadableCases: totalCases,
      contractRoutingCases,
      deterministicFixtureCases,
      liveModelStatus: 'Not Run',
      blenderRuntimeStatus: 'Not Run',
    },
    pilotSuites: suites.map((s) => ({
      skillId: s.skillId,
      category: s.category,
      isContractedSkill: s.isContractedSkill,
      sourceEvalTier: s.sourceEvalTier,
      evalJsonPath: `evals/pilot/${s.skillId}.eval.json`,
      evalMarkdownPath: s.evalMarkdownPath,
      caseCount: s.cases.length,
      evaluationTypes: [...new Set(s.cases.map((c) => c.evaluationType))],
      evaluationStatus: s.evaluationStatus,
    })),
    remainingProseSkillsPendingMigration: remainingProseSkillIds.map((id) => ({
      skillId: id,
      evalMarkdownPath: `skills/${id}/EVAL.md`,
      migrationStatus: 'pending-phase-3-expansion',
    })),
  };

  return {
    errors,
    suites,
    indexObj,
  };
}

export function writeEvalArtifactsToDisk(rootDir = ROOT_DIR) {
  const { errors, suites, indexObj } = buildEvalArtifacts(rootDir);
  if (errors.length > 0) {
    throw new Error(`Cannot write invalid evaluation artifacts:\n${errors.join('\n')}`);
  }
  const pilotDir = path.join(rootDir, 'evals', 'pilot');
  fs.mkdirSync(pilotDir, { recursive: true });
  for (const suite of suites) {
    const outPath = path.join(pilotDir, `${suite.skillId}.eval.json`);
    fs.writeFileSync(outPath, JSON.stringify(suite, null, 2) + '\n', 'utf8');
  }
  const idxPath = path.join(rootDir, 'evals', 'index.json');
  fs.writeFileSync(idxPath, JSON.stringify(indexObj, null, 2) + '\n', 'utf8');
  return { suites, indexObj };
}

export function runEvalSuites({
  rootDir = ROOT_DIR,
  skillFilter = null,
  suiteFilter = null,
  checkOnly = false,
} = {}) {
  const errors = [];
  const catalogIds = getCatalogSkillIds(rootDir);
  const catalogSet = new Set(catalogIds);
  const schemaPath = path.join(rootDir, 'schemas', 'skill-eval.schema.json');

  if (!fs.existsSync(schemaPath)) {
    return {
      ok: false,
      errors: ['Missing schemas/skill-eval.schema.json'],
      suiteResults: [],
    };
  }

  const pilotDir = path.join(rootDir, 'evals', 'pilot');
  const indexPath = path.join(rootDir, 'evals', 'index.json');
  if (!fs.existsSync(pilotDir) || !fs.existsSync(indexPath)) {
    return {
      ok: false,
      errors: ['Missing evals/pilot/ directory or evals/index.json. Run node scripts/run-evals.mjs --build first.'],
      suiteResults: [],
    };
  }

  const { suites: expectedSuites, indexObj: expectedIndex } = buildEvalArtifacts(rootDir);
  const actualIndexRaw = fs.readFileSync(indexPath, 'utf8');
  const expectedIndexRaw = JSON.stringify(expectedIndex, null, 2) + '\n';
  if (actualIndexRaw !== expectedIndexRaw) {
    errors.push('evals/index.json is out of sync with pilot suites. Run node scripts/run-evals.mjs --build.');
  }

  const files = fs
    .readdirSync(pilotDir)
    .filter((f) => f.endsWith('.eval.json'))
    .sort();

  if (files.length !== expectedSuites.length) {
    errors.push(
      `Expected ${expectedSuites.length} pilot .eval.json files in evals/pilot/, found ${files.length}`,
    );
  }

  const loadedSuites = [];
  for (const file of files) {
    const expectedSkillId = file.replace(/\.eval\.json$/, '');
    const fullPath = path.join(pilotDir, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      errors.push(`Invalid JSON in evals/pilot/${file}: ${e.message}`);
      continue;
    }

    const vErrs = validateEvalSuiteObject(parsed, expectedSkillId, catalogSet, schemaPath);
    errors.push(...vErrs);

    const mdPath = path.join(rootDir, parsed.evalMarkdownPath || `skills/${expectedSkillId}/EVAL.md`);
    if (!fs.existsSync(mdPath)) {
      errors.push(`Missing human-readable EVAL.md at ${parsed.evalMarkdownPath}`);
    }

    loadedSuites.push(parsed);
  }

  const targetFilter = skillFilter || suiteFilter;
  const filteredSuites = targetFilter
    ? loadedSuites.filter((s) => s.skillId === targetFilter)
    : loadedSuites;

  if (targetFilter && filteredSuites.length === 0) {
    errors.push(`No pilot evaluation suite found matching '${targetFilter}'`);
  }

  if (checkOnly) {
    return {
      ok: errors.length === 0,
      errors,
      suiteResults: [],
      summary: expectedIndex.coverageSummary,
    };
  }

  const { contractsById, allContracts } = loadContractMap(rootDir);
  const suiteResults = [];
  let passedCases = 0;
  let failedCases = 0;

  for (const suite of filteredSuites) {
    const caseResults = [];
    for (const c of suite.cases || []) {
      const res = evaluateSingleCase(c, { contractsById, allContracts });
      caseResults.push(res);
      if (res.status === 'Passed') {
        passedCases++;
      } else {
        failedCases++;
        for (const f of res.failures) {
          errors.push(`[${suite.skillId}/${c.id}] ${f}`);
        }
      }
    }

    const allSuitePassed = caseResults.every((r) => r.status === 'Passed');
    suiteResults.push({
      skillId: suite.skillId,
      category: suite.category,
      isContractedSkill: suite.isContractedSkill,
      caseCount: caseResults.length,
      passedCount: caseResults.filter((r) => r.status === 'Passed').length,
      failedCount: caseResults.filter((r) => r.status === 'Failed').length,
      staticValidation: allSuitePassed ? 'Passed' : 'Failed',
      deterministicFixture: allSuitePassed ? 'Passed' : 'Failed',
      contractRouting: suite.isContractedSkill ? (allSuitePassed ? 'Passed' : 'Failed') : 'Not Implemented',
      liveModel: 'Not Run',
      blenderRuntime: 'Not Run',
      caseResults,
    });
  }

  return {
    ok: errors.length === 0 && failedCases === 0,
    errors,
    suiteResults,
    summary: {
      suitesExecuted: suiteResults.length,
      totalCasesExecuted: passedCases + failedCases,
      passedCases,
      failedCases,
      liveModelStatus: 'Not Run',
      blenderRuntimeStatus: 'Not Run',
      unmigratedProseSkills: catalogIds.length - loadedSuites.length,
    },
  };
}

function main() {
  const args = process.argv.slice(2);
  const isBuild = args.includes('--build');
  const isCheck = args.includes('--check');
  const isList = args.includes('--list');

  let skillFilter = null;
  let suiteFilter = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--skill' && args[i + 1]) {
      skillFilter = args[i + 1];
      i++;
    } else if (args[i] === '--suite' && args[i + 1]) {
      suiteFilter = args[i + 1];
      i++;
    }
  }

  if (isBuild) {
    const { suites, indexObj } = writeEvalArtifactsToDisk(ROOT_DIR);
    console.log(
      `Generated ${suites.length} pilot evaluation suites (${indexObj.coverageSummary.totalMachineReadableCases} cases) under evals/pilot/ and updated evals/index.json.`,
    );
    return;
  }

  if (isList) {
    const { indexObj } = buildEvalArtifacts(ROOT_DIR);
    console.log('BlendOps Phase 3 — Behavioral Evaluation Inventory');
    console.log(
      `Catalog coverage: ${indexObj.coverageSummary.machineReadablePilotSuites}/${indexObj.coverageSummary.totalCatalogSkills} machine-readable pilot suites (${indexObj.coverageSummary.totalMachineReadableCases} cases) | ${indexObj.coverageSummary.remainingProseOnlyEvalFiles} prose-only EVAL.md files pending migration`,
    );
    console.log('--------------------------------------------------------------------------------------------');
    for (const s of indexObj.pilotSuites) {
      console.log(
        `- ${s.skillId.padEnd(36)} | cases: ${String(s.caseCount).padStart(2)} | types: ${s.evaluationTypes.join(', ').padEnd(22)} | liveModel: ${s.evaluationStatus.liveModel} | blenderRuntime: ${s.evaluationStatus.blenderRuntime}`,
      );
    }
    return;
  }

  if (isCheck) {
    const res = runEvalSuites({ rootDir: ROOT_DIR, checkOnly: true });
    if (!res.ok) {
      console.error('evals:check failed:');
      for (const e of res.errors) console.error(`- ${e}`);
      process.exit(1);
    }
    console.log(
      `evals:check passed (${res.summary.machineReadablePilotSuites} pilot suites, ${res.summary.totalMachineReadableCases} machine-readable cases validated against Draft 2020-12 Ajv schema; ${res.summary.remainingProseOnlyEvalFiles}/48 prose-only EVAL.md skills tracked).`,
    );
    return;
  }

  const res = runEvalSuites({
    rootDir: ROOT_DIR,
    skillFilter,
    suiteFilter,
    checkOnly: false,
  });

  if (!res.ok) {
    console.error('evals:run failed:');
    for (const e of res.errors) console.error(`- ${e}`);
    process.exit(1);
  }

  console.log(
    `evals:run passed: ${res.summary.suitesExecuted} suite(s), ${res.summary.passedCases}/${res.summary.totalCasesExecuted} deterministic cases Passed | live_model: ${res.summary.liveModelStatus} | blender_runtime: ${res.summary.blenderRuntimeStatus} | ${res.summary.unmigratedProseSkills}/48 prose-only EVAL.md skills pending migration.`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
