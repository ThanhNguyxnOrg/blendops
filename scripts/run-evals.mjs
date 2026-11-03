#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  ROUTING_PARTICIPANT_IDS,
  loadContextFieldVocabulary,
  resolveRoutingWinner,
} from './build-registry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_EVAL_SCHEMA_PATH = path.join(ROOT_DIR, 'schemas', 'skill-eval.schema.json');
const EVALS_DIR = path.join(ROOT_DIR, 'evals');
const SUITES_DIR = path.join(EVALS_DIR, 'suites');
const INDEX_PATH = path.join(EVALS_DIR, 'index.json');
const ROUTING_PARTICIPANT_SET = new Set(ROUTING_PARTICIPANT_IDS);

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

function isValidConditionScalar(val) {
  return (
    typeof val === 'string' ||
    (typeof val === 'number' && Number.isFinite(val)) ||
    typeof val === 'boolean'
  );
}

export function evaluateConditionPredicate(whenGroup, context) {
  if (!whenGroup || typeof whenGroup !== 'object' || Array.isArray(whenGroup)) {
    return false;
  }
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return false;
  }

  const groupKeys = Object.keys(whenGroup);
  if (groupKeys.length !== 1 || (groupKeys[0] !== 'all' && groupKeys[0] !== 'any')) {
    return false;
  }

  const evalRule = (rule) => {
    if (!rule || typeof rule !== 'object' || Array.isArray(rule)) return false;
    const ruleKeys = Object.keys(rule);
    if (
      ruleKeys.length !== 3 ||
      !Object.hasOwn(rule, 'field') ||
      !Object.hasOwn(rule, 'operator') ||
      !Object.hasOwn(rule, 'value')
    ) {
      return false;
    }
    if (typeof rule.field !== 'string' || rule.field.length === 0) {
      return false;
    }

    const hasField = Object.hasOwn(context, rule.field);

    if (rule.operator === 'exists') {
      if (typeof rule.value !== 'boolean') return false;
      return hasField === rule.value;
    }

    if (!hasField) {
      return false;
    }

    const actual = context[rule.field];
    if (!isValidConditionScalar(actual)) {
      return false;
    }

    if (rule.operator === 'equals') {
      if (!isValidConditionScalar(rule.value)) return false;
      return actual === rule.value;
    }

    if (rule.operator === 'not_equals') {
      if (!isValidConditionScalar(rule.value)) return false;
      return actual !== rule.value;
    }

    if (rule.operator === 'in') {
      if (
        !Array.isArray(rule.value) ||
        rule.value.length === 0 ||
        !rule.value.every(isValidConditionScalar)
      ) {
        return false;
      }
      return rule.value.includes(actual);
    }

    if (rule.operator === 'not_in') {
      if (
        !Array.isArray(rule.value) ||
        rule.value.length === 0 ||
        !rule.value.every(isValidConditionScalar)
      ) {
        return false;
      }
      return !rule.value.includes(actual);
    }

    return false;
  };

  if (Object.hasOwn(whenGroup, 'all')) {
    if (!Array.isArray(whenGroup.all) || whenGroup.all.length === 0) return false;
    return whenGroup.all.every(evalRule);
  }

  if (Object.hasOwn(whenGroup, 'any')) {
    if (!Array.isArray(whenGroup.any) || whenGroup.any.length === 0) return false;
    return whenGroup.any.some(evalRule);
  }

  return false;
}

export function validateHandoffContextObject(handoffContext, ctxPath, contextFieldMap) {
  const errors = [];
  if (!handoffContext || typeof handoffContext !== 'object' || Array.isArray(handoffContext)) {
    return [`${ctxPath}: handoffContext must be a non-empty object`];
  }
  const keys = Object.keys(handoffContext);
  if (keys.length === 0) {
    errors.push(`${ctxPath}: handoffContext must contain at least 1 field`);
    return errors;
  }
  if (!contextFieldMap || !(contextFieldMap instanceof Map) || contextFieldMap.size === 0) {
    return errors;
  }

  for (const key of keys) {
    const fieldMeta = contextFieldMap.get(key);
    if (!fieldMeta) {
      errors.push(
        `${ctxPath}: unregistered handoffContext field '${key}' (not in registry/contract-context-fields.json)`,
      );
      continue;
    }
    const val = handoffContext[key];
    const vType = fieldMeta.valueType || fieldMeta.type;
    const allowed = Array.isArray(fieldMeta.allowedValues) ? fieldMeta.allowedValues : null;
    if (vType === 'boolean') {
      if (typeof val !== 'boolean') {
        errors.push(
          `${ctxPath}.${key}: expected boolean value for field '${key}', got ${typeof val}`,
        );
      } else if (allowed && !allowed.includes(val)) {
        errors.push(
          `${ctxPath}.${key}: value '${val}' for field '${key}' is not in allowedValues [${allowed.join(', ')}]`,
        );
      }
    } else if (vType === 'number') {
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        errors.push(
          `${ctxPath}.${key}: expected finite number value for field '${key}', got ${typeof val}`,
        );
      } else if (allowed && !allowed.includes(val)) {
        errors.push(
          `${ctxPath}.${key}: value '${val}' for field '${key}' is not in allowedValues [${allowed.join(', ')}]`,
        );
      }
    } else if (vType === 'string' || vType === 'enum') {
      if (typeof val !== 'string' || val.length === 0) {
        errors.push(
          `${ctxPath}.${key}: expected non-empty string value for field '${key}', got ${typeof val}`,
        );
      } else if (allowed && allowed.length > 0 && !allowed.includes(val)) {
        errors.push(
          `${ctxPath}.${key}: value '${val}' for field '${key}' is not in allowedValues [${allowed.join(', ')}]`,
        );
      }
    }
  }

  return errors;
}

export function validateEvalSuiteObject(
  suite,
  expectedSkillId,
  catalogSkillSet,
  schemaPath = DEFAULT_EVAL_SCHEMA_PATH,
  { contractsById = null, contextFieldMap = null } = {},
) {
  const errors = [];
  const prefix = `evalSuite(${expectedSkillId})`;

  if (!suite || typeof suite !== 'object' || Array.isArray(suite)) {
    return [`${prefix}: root must be a JSON object`];
  }

  // Truth-state law check before Ajv so explicit diagnostic is always included
  if (Array.isArray(suite.cases)) {
    suite.cases.forEach((c, idx) => {
      if (
        c?.truthStateExpectations?.artifactStatus === 'Not Run' ||
        c?.deterministicFixture?.simulatedOutput?.artifactStatus === 'Not Run'
      ) {
        errors.push(
          `${prefix} cases[${idx}] (${c?.id || idx}): Truth-state law violation: 'Not Run' is exclusively a Runtime state and must never appear in artifactStatus`,
        );
      }
    });
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

  const expectedContractPath = `skills/${expectedSkillId}/contract.json`;
  if (suite.contractPath !== expectedContractPath) {
    errors.push(
      `${prefix}: contractPath '${suite.contractPath}' must equal '${expectedContractPath}'`,
    );
  }

  const expectedSkillMdPath = `skills/${expectedSkillId}/SKILL.md`;
  if (suite.skillMarkdownPath !== expectedSkillMdPath) {
    errors.push(
      `${prefix}: skillMarkdownPath '${suite.skillMarkdownPath}' must equal '${expectedSkillMdPath}'`,
    );
  }

  const expectedMdPath = `skills/${expectedSkillId}/EVAL.md`;
  if (suite.evalMarkdownPath !== expectedMdPath) {
    errors.push(
      `${prefix}: evalMarkdownPath '${suite.evalMarkdownPath}' must equal '${expectedMdPath}'`,
    );
  }

  const expectedRoutingParticipant = ROUTING_PARTICIPANT_SET.has(expectedSkillId);
  if (suite.isRoutingParticipant !== expectedRoutingParticipant) {
    errors.push(
      `${prefix}: isRoutingParticipant is ${suite.isRoutingParticipant}, but skill '${expectedSkillId}' routing-participant membership is ${expectedRoutingParticipant}`,
    );
  }

  const contract = contractsById instanceof Map ? contractsById.get(expectedSkillId) : null;
  if (contract) {
    if (suite.category !== contract.category) {
      errors.push(
        `${prefix}: category '${suite.category}' does not match contract.json category '${contract.category}'`,
      );
    }
    const contractHasRoutingPrecedence = Boolean(contract.routingPrecedence);
    if (contractHasRoutingPrecedence !== expectedRoutingParticipant) {
      errors.push(
        `${prefix}: contract routingPrecedence presence (${contractHasRoutingPrecedence}) does not match expected routing participant membership (${expectedRoutingParticipant})`,
      );
    }
  }

  if (suite.evaluationStatus) {
    if (suite.evaluationStatus.liveModel !== 'Not Run') {
      errors.push(
        `${prefix}: evaluationStatus.liveModel must be 'Not Run' (got '${suite.evaluationStatus.liveModel}')`,
      );
    }
    if (suite.evaluationStatus.blenderRuntime !== 'Not Run') {
      errors.push(
        `${prefix}: evaluationStatus.blenderRuntime must be 'Not Run' (got '${suite.evaluationStatus.blenderRuntime}')`,
      );
    }
    if (expectedRoutingParticipant) {
      if (suite.evaluationStatus.contractRouting !== 'Passed') {
        errors.push(
          `${prefix}: routing participant suite must have evaluationStatus.contractRouting === 'Passed'`,
        );
      }
      if (suite.evaluationStatus.contractHandoff !== 'Not Applicable') {
        errors.push(
          `${prefix}: routing participant suite must have evaluationStatus.contractHandoff === 'Not Applicable'`,
        );
      }
    } else {
      if (suite.evaluationStatus.contractRouting !== 'Not Applicable') {
        errors.push(
          `${prefix}: specialist skill suite must have evaluationStatus.contractRouting === 'Not Applicable'`,
        );
      }
      if (suite.evaluationStatus.contractHandoff !== 'Passed') {
        errors.push(
          `${prefix}: specialist skill suite must have evaluationStatus.contractHandoff === 'Passed'`,
        );
      }
    }
  }

  if (Array.isArray(suite.cases)) {
    if (suite.cases.length < 4) {
      errors.push(
        `${prefix}: suite must contain at least 4 cases (found ${suite.cases.length})`,
      );
    }

    const seenCaseIds = new Set();
    let contractRoutingCount = 0;
    let contractHandoffCount = 0;
    let deterministicFixtureCount = 0;

    suite.cases.forEach((c, idx) => {
      if (!c || typeof c !== 'object') return;
      const casePrefix = `${prefix} cases[${idx}] (${c.id || idx})`;

      if (seenCaseIds.has(c.id)) {
        errors.push(`${prefix} cases[${idx}]: duplicate case id '${c.id}'`);
      }
      seenCaseIds.add(c.id);

      if (c.skillId !== expectedSkillId) {
        errors.push(
          `${casePrefix}: case skillId '${c.skillId}' must match suite skillId '${expectedSkillId}'`,
        );
      }

      if (c.evaluationType === 'contract_routing') contractRoutingCount += 1;
      if (c.evaluationType === 'contract_handoff') contractHandoffCount += 1;
      if (c.evaluationType === 'deterministic_fixture') deterministicFixtureCount += 1;

      if (typeof c.expectedRoutingTarget === 'string' && catalogSkillSet) {
        const t = c.expectedRoutingTarget;
        const isDocTarget = t.startsWith('docs/');
        const isTerminal = t === 'none';
        if (!isDocTarget && !isTerminal && !catalogSkillSet.has(t)) {
          errors.push(
            `${casePrefix}: expectedRoutingTarget '${t}' is not a valid catalog skill ID, 'docs/...' path, or 'none'`,
          );
        }
      }

      if (expectedRoutingParticipant) {
        if (c.evaluationType === 'contract_handoff') {
          errors.push(
            `${casePrefix}: routing participant '${expectedSkillId}' cannot use evaluationType 'contract_handoff'`,
          );
        }
        if (c.evaluationType === 'contract_routing') {
          if (!c.deterministicFixture?.routingState) {
            errors.push(
              `${casePrefix}: contract_routing case must include deterministicFixture.routingState`,
            );
          }
          if (!c.deterministicFixture?.handoffContext) {
            errors.push(
              `${casePrefix}: contract_routing case must include deterministicFixture.handoffContext`,
            );
          }
        }
      } else {
        if (c.evaluationType === 'contract_routing') {
          errors.push(
            `${casePrefix}: specialist skill '${expectedSkillId}' cannot use evaluationType 'contract_routing'`,
          );
        }
        if (c.deterministicFixture?.routingState !== undefined) {
          errors.push(
            `${casePrefix}: specialist skill '${expectedSkillId}' must not include deterministicFixture.routingState`,
          );
        }
        if (c.evaluationType === 'contract_handoff') {
          if (!c.deterministicFixture?.handoffContext) {
            errors.push(
              `${casePrefix}: contract_handoff case must include deterministicFixture.handoffContext`,
            );
          }
        }
      }

      if (c.deterministicFixture?.handoffContext) {
        const ctxErrors = validateHandoffContextObject(
          c.deterministicFixture.handoffContext,
          `${casePrefix}.deterministicFixture.handoffContext`,
          contextFieldMap,
        );
        errors.push(...ctxErrors);
      }

      if (
        contract &&
        (c.evaluationType === 'contract_routing' || c.evaluationType === 'contract_handoff') &&
        c.deterministicFixture?.handoffContext &&
        typeof c.expectedRoutingTarget === 'string' &&
        !c.expectedRoutingTarget.startsWith('docs/')
      ) {
        const matchingHandoffs = (contract.handoffs || []).filter((h) =>
          evaluateConditionPredicate(h.when, c.deterministicFixture.handoffContext),
        );
        if (c.expectedRoutingTarget === 'none') {
          if (matchingHandoffs.length > 0) {
            errors.push(
              `${casePrefix}: expectedRoutingTarget is 'none', but handoffContext matched [${matchingHandoffs.map((h) => h.target).join(', ')}] in '${expectedSkillId}/contract.json'`,
            );
          }
        } else if (matchingHandoffs.length === 0) {
          errors.push(
            `${casePrefix}: handoffContext matched 0 handoffs in '${expectedSkillId}/contract.json'`,
          );
        } else if (!matchingHandoffs.some((h) => h.target === c.expectedRoutingTarget)) {
          errors.push(
            `${casePrefix}: handoffContext matched [${matchingHandoffs.map((h) => h.target).join(', ')}], which does not include expectedRoutingTarget '${c.expectedRoutingTarget}'`,
          );
        }
      }
    });

    if (expectedRoutingParticipant) {
      if (contractRoutingCount < 1) {
        errors.push(
          `${prefix}: routing participant suite must include at least 1 'contract_routing' case`,
        );
      }
    } else {
      if (contractHandoffCount < 2) {
        errors.push(
          `${prefix}: specialist skill suite must include at least 2 'contract_handoff' cases (found ${contractHandoffCount})`,
        );
      }
      if (deterministicFixtureCount < 2) {
        errors.push(
          `${prefix}: specialist skill suite must include at least 2 'deterministic_fixture' cases (found ${deterministicFixtureCount})`,
        );
      }
    }
  }

  return errors;
}

export function evaluateSingleCase(
  evalCase,
  { contractsById = new Map(), allContracts = [], contextFieldMap = null } = {},
) {
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
  if (
    sim.artifactStatus === 'Not Run' ||
    evalCase?.truthStateExpectations?.artifactStatus === 'Not Run'
  ) {
    failures.push(
      `Truth-state law violation: 'Not Run' is exclusively a Runtime state and must never appear in artifactStatus`,
    );
  }

  // 2. Truth-state alignment between simulatedOutput and truthStateExpectations
  if (sim.runtimeStatus !== evalCase?.truthStateExpectations?.runtimeStatus) {
    failures.push(
      `Runtime truth-state mismatch: expected '${evalCase?.truthStateExpectations?.runtimeStatus}', got '${sim.runtimeStatus}'`,
    );
  }
  if (sim.artifactStatus !== evalCase?.truthStateExpectations?.artifactStatus) {
    failures.push(
      `Artifact truth-state mismatch: expected '${evalCase?.truthStateExpectations?.artifactStatus}', got '${sim.artifactStatus}'`,
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

  // 6. Validate handoffContext against vocabulary if present
  const handoffCtx = evalCase.deterministicFixture?.handoffContext;
  if (handoffCtx && contextFieldMap instanceof Map && contextFieldMap.size > 0) {
    const ctxErrors = validateHandoffContextObject(
      handoffCtx,
      `case(${evalCase.id}).handoffContext`,
      contextFieldMap,
    );
    failures.push(...ctxErrors);
  }

  // 7. Contract routing & handoff predicate evaluation for contract_routing cases (4 routing participants only)
  if (evalCase.evaluationType === 'contract_routing') {
    if (!ROUTING_PARTICIPANT_SET.has(evalCase.skillId)) {
      failures.push(
        `Case '${evalCase.id}' has evaluationType 'contract_routing' on non-routing specialist skill '${evalCase.skillId}'`,
      );
    }
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

      if (!handoffCtx) {
        failures.push(`Case '${evalCase.id}' is missing deterministicFixture.handoffContext`);
      } else if (!evalCase.expectedRoutingTarget.startsWith('docs/')) {
        const matchingHandoffs = (contract.handoffs || []).filter((h) =>
          evaluateConditionPredicate(h.when, handoffCtx),
        );
        if (evalCase.expectedRoutingTarget === 'none') {
          if (matchingHandoffs.length > 0) {
            failures.push(
              `Contract handoff predicate matched [${matchingHandoffs.map((h) => h.target).join(', ')}] when expectedRoutingTarget is 'none'`,
            );
          }
        } else if (matchingHandoffs.length === 0) {
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

  // 8. Contract handoff predicate evaluation for contract_handoff cases (44 specialist skills)
  if (evalCase.evaluationType === 'contract_handoff') {
    if (ROUTING_PARTICIPANT_SET.has(evalCase.skillId)) {
      failures.push(
        `Case '${evalCase.id}' has evaluationType 'contract_handoff' on routing participant '${evalCase.skillId}' (must use 'contract_routing')`,
      );
    }
    if (evalCase.deterministicFixture?.routingState !== undefined) {
      failures.push(
        `Case '${evalCase.id}' on specialist skill '${evalCase.skillId}' must not include deterministicFixture.routingState`,
      );
    }
    const contract = contractsById.get(evalCase.skillId);
    if (!contract) {
      failures.push(
        `Case '${evalCase.id}' has evaluationType 'contract_handoff' but skill '${evalCase.skillId}' has no contract.json`,
      );
    } else if (!handoffCtx || typeof handoffCtx !== 'object' || Array.isArray(handoffCtx)) {
      failures.push(`Case '${evalCase.id}' is missing deterministicFixture.handoffContext`);
    } else if (evalCase.expectedRoutingTarget.startsWith('docs/')) {
      failures.push(
        `Case '${evalCase.id}' has evaluationType 'contract_handoff' with docs expectedRoutingTarget '${evalCase.expectedRoutingTarget}'`,
      );
    } else {
      const matchingHandoffs = (contract.handoffs || []).filter((h) =>
        evaluateConditionPredicate(h.when, handoffCtx),
      );
      if (evalCase.expectedRoutingTarget === 'none') {
        if (matchingHandoffs.length > 0) {
          failures.push(
            `Contract handoff predicate matched [${matchingHandoffs.map((h) => h.target).join(', ')}] in '${evalCase.skillId}' when expectedRoutingTarget is 'none' for context ${JSON.stringify(handoffCtx)}`,
          );
        }
      } else if (matchingHandoffs.length === 0) {
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

export function loadCanonicalSuitesFromDisk(rootDir = ROOT_DIR) {
  const suitesDir = path.join(rootDir, 'evals', 'suites');
  const errors = [];
  const suites = [];

  if (!fs.existsSync(suitesDir)) {
    return {
      suites: [],
      files: [],
      errors: ['Missing evals/suites/ directory.'],
    };
  }

  const files = fs
    .readdirSync(suitesDir)
    .filter((f) => f.endsWith('.eval.json'))
    .sort();

  for (const file of files) {
    const fullPath = path.join(suitesDir, file);
    try {
      const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      suites.push(parsed);
    } catch (err) {
      errors.push(`Invalid JSON in evals/suites/${file}: ${err.message}`);
    }
  }

  return { suites, files, errors };
}

export function buildEvalArtifacts(rootDir = ROOT_DIR) {
  const catalogIds = getCatalogSkillIds(rootDir);
  const catalogSet = new Set(catalogIds);
  const { contractsById } = loadContractMap(rootDir);
  const { fieldMap: contextFieldMap, errors: vocabErrors } = loadContextFieldVocabulary(rootDir);
  const { suites, files, errors: loadErrors } = loadCanonicalSuitesFromDisk(rootDir);
  const errors = [...vocabErrors, ...loadErrors];

  const legacyPilotDir = path.join(rootDir, 'evals', 'pilot');
  if (fs.existsSync(legacyPilotDir)) {
    errors.push(
      'Legacy evals/pilot/ directory still exists; all canonical evaluation suites must reside in evals/suites/.',
    );
  }

  const expectedFiles = catalogIds.map((id) => `${id}.eval.json`);
  const fileSet = new Set(files);
  for (const expectedFile of expectedFiles) {
    if (!fileSet.has(expectedFile)) {
      errors.push(`Missing evaluation suite file evals/suites/${expectedFile}`);
    }
  }
  for (const actualFile of files) {
    const id = actualFile.replace(/\.eval\.json$/, '');
    if (!catalogSet.has(id)) {
      errors.push(
        `Orphan evaluation suite file evals/suites/${actualFile} does not match any catalog skill`,
      );
    }
  }

  const globalCaseIds = new Map();
  const schemaPath = path.join(rootDir, 'schemas', 'skill-eval.schema.json');

  for (const suite of suites) {
    const suiteErrors = validateEvalSuiteObject(
      suite,
      suite.skillId,
      catalogSet,
      schemaPath,
      { contractsById, contextFieldMap },
    );
    errors.push(...suiteErrors);

    const mdPath = path.join(rootDir, suite.evalMarkdownPath || `skills/${suite.skillId}/EVAL.md`);
    if (!fs.existsSync(mdPath)) {
      errors.push(`Missing human-readable EVAL.md at ${suite.evalMarkdownPath}`);
    }
    const skillMdPath = path.join(
      rootDir,
      suite.skillMarkdownPath || `skills/${suite.skillId}/SKILL.md`,
    );
    if (!fs.existsSync(skillMdPath)) {
      errors.push(`Missing SKILL.md at ${suite.skillMarkdownPath}`);
    }
    const contractPath = path.join(
      rootDir,
      suite.contractPath || `skills/${suite.skillId}/contract.json`,
    );
    if (!fs.existsSync(contractPath)) {
      errors.push(`Missing contract.json at ${suite.contractPath}`);
    }

    for (const c of suite.cases || []) {
      if (!c || typeof c.id !== 'string') continue;
      if (globalCaseIds.has(c.id) && globalCaseIds.get(c.id) !== suite.skillId) {
        errors.push(
          `Duplicate case id '${c.id}' across suites '${globalCaseIds.get(c.id)}' and '${suite.skillId}'`,
        );
      } else {
        globalCaseIds.set(c.id, suite.skillId);
      }
    }
  }

  const suiteSkillIds = new Set(suites.map((s) => s.skillId));
  const remainingProseSkillIds = catalogIds.filter((id) => !suiteSkillIds.has(id));

  const totalCases = suites.reduce((acc, s) => acc + (s.cases?.length || 0), 0);
  const contractRoutingCases = suites.reduce(
    (acc, s) => acc + (s.cases || []).filter((c) => c.evaluationType === 'contract_routing').length,
    0,
  );
  const contractHandoffCases = suites.reduce(
    (acc, s) => acc + (s.cases || []).filter((c) => c.evaluationType === 'contract_handoff').length,
    0,
  );
  const deterministicFixtureCases = suites.reduce(
    (acc, s) =>
      acc + (s.cases || []).filter((c) => c.evaluationType === 'deterministic_fixture').length,
    0,
  );

  const routingSuites = suites.filter((s) => s.isRoutingParticipant === true);
  const specialistSuites = suites.filter((s) => s.isRoutingParticipant === false);

  const routingParticipantsWithRoutingEvals = routingSuites.filter((s) =>
    (s.cases || []).some((c) => c.evaluationType === 'contract_routing'),
  ).length;
  const specialistSkillsWithHandoffEvals = specialistSuites.filter((s) =>
    (s.cases || []).some((c) => c.evaluationType === 'contract_handoff'),
  ).length;
  const skillsWithFixtureEvals = suites.filter(
    (s) =>
      (s.cases || []).some(
        (c) =>
          c.evaluationType === 'deterministic_fixture' ||
          Boolean(c.deterministicFixture?.simulatedOutput),
      ),
  ).length;

  const suiteSummaries = suites.map((s) => {
    const cRouting = (s.cases || []).filter((c) => c.evaluationType === 'contract_routing').length;
    const cHandoff = (s.cases || []).filter((c) => c.evaluationType === 'contract_handoff').length;
    const cFixture = (s.cases || []).filter(
      (c) => c.evaluationType === 'deterministic_fixture',
    ).length;

    return {
      skillId: s.skillId,
      category: s.category,
      isContractedSkill: s.isContractedSkill,
      isRoutingParticipant: s.isRoutingParticipant,
      sourceEvalTier: s.sourceEvalTier,
      evalJsonPath: `evals/suites/${s.skillId}.eval.json`,
      contractPath: s.contractPath,
      skillMarkdownPath: s.skillMarkdownPath,
      evalMarkdownPath: s.evalMarkdownPath,
      caseCount: s.cases.length,
      countsByEvaluationType: {
        contract_routing: cRouting,
        contract_handoff: cHandoff,
        deterministic_fixture: cFixture,
      },
      evaluationTypes: [...new Set((s.cases || []).map((c) => c.evaluationType))],
      evaluationStatus: s.evaluationStatus,
    };
  });

  const indexObj = {
    schemaVersion: '2.0.0',
    phase: 'phase-6-full-catalog-behavioral-evals',
    generatedBy: 'scripts/run-evals.mjs',
    coverageSummary: {
      catalogSkills: catalogIds.length,
      machineReadableSuites: suites.length,
      skillsWithoutSuites: remainingProseSkillIds.length,
      proseOnlySkillsPendingMigration: remainingProseSkillIds.length,
      routingParticipants: routingSuites.length,
      specialistSkills: specialistSuites.length,
      totalCases,
      countsByEvaluationType: {
        contract_routing: contractRoutingCases,
        contract_handoff: contractHandoffCases,
        deterministic_fixture: deterministicFixtureCases,
      },
      contractRoutingCoverage: {
        routingParticipantsWithRoutingEvals,
        totalRoutingParticipantCases: contractRoutingCases,
      },
      contractHandoffCoverage: {
        specialistSkillsWithHandoffEvals,
        totalSpecialistHandoffCases: contractHandoffCases,
      },
      deterministicFixtureCoverage: {
        skillsWithFixtureEvals,
        totalDeterministicFixtureCases: deterministicFixtureCases,
      },
      liveModel: 'Not Run',
      blenderRuntime: 'Not Run',
      totalCatalogSkills: catalogIds.length,
      machineReadablePilotSuites: suites.length,
      remainingProseOnlyEvalFiles: remainingProseSkillIds.length,
      totalMachineReadableCases: totalCases,
      contractRoutingCases,
      contractHandoffCases,
      deterministicFixtureCases,
      liveModelStatus: 'Not Run',
      blenderRuntimeStatus: 'Not Run',
    },
    suites: suiteSummaries,
    remainingProseSkillsPendingMigration: remainingProseSkillIds.map((id) => ({
      skillId: id,
      evalMarkdownPath: `skills/${id}/EVAL.md`,
      migrationStatus: 'pending-migration',
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
  const suitesDir = path.join(rootDir, 'evals', 'suites');
  fs.mkdirSync(suitesDir, { recursive: true });
  for (const suite of suites) {
    const outPath = path.join(suitesDir, `${suite.skillId}.eval.json`);
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
  const schemaPath = path.join(rootDir, 'schemas', 'skill-eval.schema.json');

  if (!fs.existsSync(schemaPath)) {
    return {
      ok: false,
      errors: ['Missing schemas/skill-eval.schema.json'],
      suiteResults: [],
    };
  }

  const suitesDir = path.join(rootDir, 'evals', 'suites');
  const indexPath = path.join(rootDir, 'evals', 'index.json');
  if (!fs.existsSync(suitesDir) || !fs.existsSync(indexPath)) {
    return {
      ok: false,
      errors: [
        'Missing evals/suites/ directory or evals/index.json. Run node scripts/run-evals.mjs --build first.',
      ],
      suiteResults: [],
    };
  }

  const {
    errors: buildErrors,
    suites: loadedSuites,
    indexObj: expectedIndex,
  } = buildEvalArtifacts(rootDir);
  errors.push(...buildErrors);

  const actualIndexRaw = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');
  const expectedIndexRaw = JSON.stringify(expectedIndex, null, 2) + '\n';
  if (actualIndexRaw !== expectedIndexRaw) {
    errors.push(
      'evals/index.json is out of sync with evals/suites/*.eval.json. Run node scripts/run-evals.mjs --build.',
    );
  }

  const targetFilter = skillFilter || suiteFilter;
  const filteredSuites = targetFilter
    ? loadedSuites.filter((s) => s.skillId === targetFilter)
    : loadedSuites;

  if (targetFilter && filteredSuites.length === 0) {
    errors.push(`No evaluation suite found matching '${targetFilter}'`);
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
  const { fieldMap: contextFieldMap } = loadContextFieldVocabulary(rootDir);
  const suiteResults = [];
  let passedCases = 0;
  let failedCases = 0;

  for (const suite of filteredSuites) {
    const caseResults = [];
    for (const c of suite.cases || []) {
      const res = evaluateSingleCase(c, { contractsById, allContracts, contextFieldMap });
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
      isRoutingParticipant: suite.isRoutingParticipant,
      caseCount: caseResults.length,
      passedCount: caseResults.filter((r) => r.status === 'Passed').length,
      failedCount: caseResults.filter((r) => r.status === 'Failed').length,
      staticValidation: allSuitePassed ? 'Passed' : 'Failed',
      deterministicFixture: allSuitePassed ? 'Passed' : 'Failed',
      contractRouting: suite.isRoutingParticipant
        ? allSuitePassed
          ? 'Passed'
          : 'Failed'
        : 'Not Applicable',
      contractHandoff: suite.isRoutingParticipant
        ? 'Not Applicable'
        : allSuitePassed
          ? 'Passed'
          : 'Failed',
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
      `Generated ${suites.length} evaluation suites (${indexObj.coverageSummary.totalCases} cases) under evals/suites/ and updated evals/index.json.`,
    );
    return;
  }

  if (isList) {
    const { indexObj } = buildEvalArtifacts(ROOT_DIR);
    console.log('BlendOps Phase 6 — Full-Catalog Behavioral Evaluation Inventory');
    console.log(
      `Catalog coverage: ${indexObj.coverageSummary.machineReadableSuites}/${indexObj.coverageSummary.catalogSkills} machine-readable suites (${indexObj.coverageSummary.totalCases} cases) | ${indexObj.coverageSummary.proseOnlySkillsPendingMigration} prose-only EVAL.md files pending migration`,
    );
    console.log(
      '------------------------------------------------------------------------------------------------------------',
    );
    for (const s of indexObj.suites) {
      console.log(
        `- ${s.skillId.padEnd(36)} | cases: ${String(s.caseCount).padStart(2)} | types: ${s.evaluationTypes.join(', ').padEnd(40)} | liveModel: ${s.evaluationStatus.liveModel} | blenderRuntime: ${s.evaluationStatus.blenderRuntime}`,
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
      `evals:check passed (${res.summary.machineReadableSuites}/${res.summary.catalogSkills} suites, ${res.summary.totalCases} machine-readable cases validated against Draft 2020-12 Ajv schema; ${res.summary.proseOnlySkillsPendingMigration}/48 prose-only EVAL.md skills remaining).`,
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
