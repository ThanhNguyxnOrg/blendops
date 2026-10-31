import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  validateContractObject,
  detectProgressionCycles,
  validatePrecedenceLadder,
  resolveRoutingWinner,
  applyManagedSectionsToSkillMd,
  buildRegistryArtifacts,
} from './build-registry.mjs';

const root = process.cwd();

function getCatalogSet() {
  const skillsDir = path.join(root, 'skills');
  const dirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name);
  return new Set(dirs);
}

function loadPilotContract(id) {
  return JSON.parse(fs.readFileSync(path.join(root, 'skills', id, 'contract.json'), 'utf8'));
}

test('Phase 2 (1/7): Schema validation passes for all 4 pilot contracts and rejects malformed contracts', () => {
  const catalogSet = getCatalogSet();
  const pilotIds = ['blendops-help', 'recipe-fit-assessor', 'pack-prerequisite-checker', 'workflow-stage-router'];

  for (const id of pilotIds) {
    const contract = loadPilotContract(id);
    const errors = validateContractObject(contract, id, catalogSet);
    assert.deepEqual(errors, [], `Expected 0 validation errors for ${id}`);
  }

  // Reject invalid operator in condition DSL
  const badOperator = structuredClone(loadPilotContract('blendops-help'));
  badOperator.handoffs[0].when.all[0].operator = 'eval_js';
  const opErrors = validateContractObject(badOperator, 'blendops-help', catalogSet);
  assert.equal(opErrors.some((e) => e.includes('eval_js')), true, 'Must reject unsupported DSL operator');
});

test('Phase 2 (2/7): Precedence ladder resolves non-overlapping winners across Ranks 1..4', () => {
  const contracts = [
    loadPilotContract('blendops-help'),
    loadPilotContract('recipe-fit-assessor'),
    loadPilotContract('pack-prerequisite-checker'),
    loadPilotContract('workflow-stage-router'),
  ];

  const ladderErrors = validatePrecedenceLadder(contracts);
  assert.deepEqual(ladderErrors, [], 'Precedence ladder must have unique ranks and distinct activation gates');

  // Rank 1: Goal ambiguous
  assert.equal(
    resolveRoutingWinner(contracts, {
      goalClarity: 'ambiguous_or_mixed',
      recipeSelected: false,
      preflightPassed: false,
      hasStageOrArtifactInventory: false,
    }),
    'blendops-help',
  );

  // Rank 2: Goal clear, recipe not selected
  assert.equal(
    resolveRoutingWinner(contracts, {
      goalClarity: 'clear',
      recipeSelected: false,
      preflightPassed: false,
      hasStageOrArtifactInventory: false,
    }),
    'recipe-fit-assessor',
  );

  // Rank 3: Goal clear, recipe selected, preflight not passed
  assert.equal(
    resolveRoutingWinner(contracts, {
      goalClarity: 'clear',
      recipeSelected: true,
      preflightPassed: false,
      hasStageOrArtifactInventory: false,
    }),
    'pack-prerequisite-checker',
  );

  // Rank 4: Goal clear, recipe selected, preflight passed, stage/artifact inventory exists
  assert.equal(
    resolveRoutingWinner(contracts, {
      goalClarity: 'clear',
      recipeSelected: true,
      preflightPassed: true,
      hasStageOrArtifactInventory: true,
    }),
    'workflow-stage-router',
  );

  // Incomplete or contradictory state must return null (never silently fallback to Rank 1)
  assert.equal(
    resolveRoutingWinner(contracts, {
      goalClarity: 'clear',
      recipeSelected: false,
    }),
    null,
    'Incomplete context state must return null instead of picking Rank 1',
  );
  assert.equal(
    resolveRoutingWinner(contracts, {
      goalClarity: 'clear',
      recipeSelected: false,
      preflightPassed: true,
      hasStageOrArtifactInventory: true,
    }),
    null,
    'Contradictory state (preflightPassed=true without recipeSelected) must return null',
  );

  // Detect duplicate rank collision
  const colliding = structuredClone(contracts);
  colliding[1].routingPrecedence.rank = 1;
  assert.equal(validatePrecedenceLadder(colliding).length > 0, true, 'Must detect duplicate precedence rank');
});

test('Phase 2 (3/7): Unknown handoff target or exclusion delegateTo fails validation', () => {
  const catalogSet = getCatalogSet();
  const c = structuredClone(loadPilotContract('workflow-stage-router'));
  c.handoffs.push({
    target: 'non-existent-blender-skill',
    type: 'progression',
    label: 'Invalid target test',
    when: { all: [{ field: 'stage.current', operator: 'equals', value: 'test' }] },
  });

  const errors = validateContractObject(c, 'workflow-stage-router', catalogSet);
  assert.equal(
    errors.some((e) => e.includes('non-existent-blender-skill')),
    true,
    'Must reject target not in 48-skill catalog',
  );
});

test('Phase 2 (4/7): Progression cycle detection catches linear loops while permitting non-progression edges', () => {
  const acyclicEdges = [
    { from: 'blendops-help', to: 'recipe-fit-assessor', type: 'progression' },
    { from: 'recipe-fit-assessor', to: 'pack-prerequisite-checker', type: 'progression' },
    { from: 'pack-prerequisite-checker', to: 'recipe-fit-assessor', type: 'upstream_reference' },
  ];
  assert.equal(detectProgressionCycles(acyclicEdges).length, 0, 'Acyclic progression graph must pass');

  const cyclicEdges = [
    { from: 'blendops-help', to: 'recipe-fit-assessor', type: 'progression' },
    { from: 'recipe-fit-assessor', to: 'pack-prerequisite-checker', type: 'progression' },
    { from: 'pack-prerequisite-checker', to: 'blendops-help', type: 'progression' },
  ];
  const cycles = detectProgressionCycles(cyclicEdges);
  assert.equal(cycles.length > 0, true, 'Must detect cycle in progression subgraph');
});

test('Phase 2 (5/7): Retry edges require bounded maxAttempts (1..5) and structured exitCondition', () => {
  const catalogSet = getCatalogSet();
  const missingRetryPolicy = structuredClone(loadPilotContract('workflow-stage-router'));
  missingRetryPolicy.handoffs.push({
    target: 'blender-scene-quality-checker',
    type: 'retry',
    label: 'Unbounded retry test',
    when: { all: [{ field: 'quality.verdict', operator: 'equals', value: 'fail' }] },
  });
  const err1 = validateContractObject(missingRetryPolicy, 'workflow-stage-router', catalogSet);
  assert.equal(
    err1.some((e) => e.includes("requires a retryPolicy object")),
    true,
    'Must reject retry edge without retryPolicy',
  );

  const validRetryPolicy = structuredClone(missingRetryPolicy);
  validRetryPolicy.handoffs[validRetryPolicy.handoffs.length - 1].retryPolicy = {
    maxAttempts: 2,
    exitCondition: {
      all: [{ field: 'quality.verdict', operator: 'equals', value: 'pass' }],
    },
  };
  const err2 = validateContractObject(validRetryPolicy, 'workflow-stage-router', catalogSet);
  assert.deepEqual(err2, [], 'Bounded retry edge with maxAttempts and exitCondition must pass');
});

test('Phase 2 (6/7): SKILL.md managed section drift is detected accurately without mutating files in --check mode', () => {
  const contract = loadPilotContract('blendops-help');
  const currentSkillMd = fs.readFileSync(path.join(root, 'skills', 'blendops-help', 'SKILL.md'), 'utf8');
  const expectedSkillMd = applyManagedSectionsToSkillMd(currentSkillMd, contract);
  assert.equal(currentSkillMd, expectedSkillMd, 'Synced SKILL.md must match rendered contract sections');

  // Simulate manual tampering inside the managed triggers block
  const tamperedMd = currentSkillMd.replace('"What should I do next?"', '"Tampered manual trigger phrase"');
  assert.notEqual(tamperedMd, applyManagedSectionsToSkillMd(tamperedMd, contract), 'Drift detector must catch manual edit inside managed block');
});

test('Phase 2 (7/7): Deterministic registry build produces identical checksums and honest pilot coverage metadata', () => {
  const run1 = buildRegistryArtifacts(root);
  const run2 = buildRegistryArtifacts(root);

  assert.deepEqual(run1.errors, []);
  assert.equal(run1.skillsRegistry.coverage, 'routing-pilot');
  assert.equal(run1.skillsRegistry.contractedSkills, 4);
  assert.equal(run1.skillsRegistry.catalogSkills, 48);
  assert.equal(run1.skillsRegistry.sourceChecksum, run2.skillsRegistry.sourceChecksum);
  assert.equal(JSON.stringify(run1.skillsRegistry), JSON.stringify(run2.skillsRegistry));
  assert.equal(JSON.stringify(run1.workflowGraph), JSON.stringify(run2.workflowGraph));

  // Verify CLI --check passes
  execFileSync(process.execPath, [path.join(root, 'scripts', 'build-registry.mjs'), '--check'], {
    cwd: root,
    stdio: 'pipe',
  });
});
