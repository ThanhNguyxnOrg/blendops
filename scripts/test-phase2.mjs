import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  validateContractObject,
  detectProgressionCycles,
  validatePrecedenceLadder,
  resolveRoutingWinner,
  enumerateRoutingStateSpace,
  isContradictoryRoutingState,
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

function loadPilotContracts() {
  return [
    loadPilotContract('blendops-help'),
    loadPilotContract('recipe-fit-assessor'),
    loadPilotContract('pack-prerequisite-checker'),
    loadPilotContract('workflow-stage-router'),
  ];
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
  const contracts = loadPilotContracts();

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
    err1.some((e) => e.includes('requires a retryPolicy object')),
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
  assert.notEqual(
    tamperedMd,
    applyManagedSectionsToSkillMd(tamperedMd, contract),
    'Drift detector must catch manual edit inside managed block',
  );
});

test('Phase 2 (7/7): Deterministic registry build produces identical checksums and honest catalog coverage metadata', () => {
  const run1 = buildRegistryArtifacts(root);
  const run2 = buildRegistryArtifacts(root);

  assert.deepEqual(run1.errors, []);
  assert.equal(run1.skillsRegistry.coverage, 'full-catalog');
  assert.equal(run1.skillsRegistry.contractedSkills, 48);
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

// ============================================================================
// Phase 2.1 Hardening Tests (Workstreams A, B, D)
// ============================================================================

test('Phase 2.1 (Workstream A): Draft 2020-12 JSON Schema rejects invalid nested objects, unknown properties, and invalid predicate values with exact paths', () => {
  const catalogSet = getCatalogSet();

  // 1. Unknown nested property inside inputs.required[0]
  const badInputProp = structuredClone(loadPilotContract('blendops-help'));
  badInputProp.inputs.required[0].extraNestedField = true;
  const errInput = validateContractObject(badInputProp, 'blendops-help', catalogSet);
  assert.equal(
    errInput.some(
      (e) =>
        e.includes('contract(blendops-help)') &&
        e.includes('/inputs/required/0') &&
        e.includes('extraNestedField'),
    ),
    true,
    `Expected exact path error for unknown nested input property, got: ${errInput.join('; ')}`,
  );

  // 2. Invalid input parameter name pattern (camelCase instead of snake_case)
  const badInputName = structuredClone(loadPilotContract('blendops-help'));
  badInputName.inputs.required[0].name = 'InvalidCamelCaseName';
  const errInputName = validateContractObject(badInputName, 'blendops-help', catalogSet);
  assert.equal(
    errInputName.some((e) => e.includes('/inputs/required/0/name')),
    true,
    'Must reject input parameter name violating ^[a-z0-9_]+$',
  );

  // 3. Non-retry handoff edge accidentally receiving retryPolicy
  const unexpectedRetryPolicy = structuredClone(loadPilotContract('blendops-help'));
  unexpectedRetryPolicy.handoffs[0].retryPolicy = {
    maxAttempts: 2,
    exitCondition: {
      all: [{ field: 'goal.clarity', operator: 'equals', value: 'clear' }],
    },
  };
  const errNonRetry = validateContractObject(unexpectedRetryPolicy, 'blendops-help', catalogSet);
  assert.equal(
    errNonRetry.some(
      (e) =>
        e.includes('contract(blendops-help)') &&
        e.includes('/handoffs/0') &&
        e.includes('retryPolicy'),
    ),
    true,
    `Must reject retryPolicy on non-retry handoff edge, got: ${errNonRetry.join('; ')}`,
  );

  // 4. Predicate operator 'in' with scalar instead of non-empty array
  const badInPredicate = structuredClone(loadPilotContract('recipe-fit-assessor'));
  badInPredicate.handoffs[3].when.all[0].value = 'strong_fit'; // operator is 'in'
  const errInPred = validateContractObject(badInPredicate, 'recipe-fit-assessor', catalogSet);
  assert.equal(
    errInPred.some((e) => e.includes('/handoffs/3/when/all/0/value')),
    true,
    `Must reject non-array value when operator is 'in', got: ${errInPred.join('; ')}`,
  );

  // 5. Predicate operator 'exists' with non-boolean value
  const badExistsPredicate = structuredClone(loadPilotContract('blendops-help'));
  badExistsPredicate.handoffs[0].when.all[0] = {
    field: 'goal.clarity',
    operator: 'exists',
    value: 'yes',
  };
  const errExistsPred = validateContractObject(badExistsPredicate, 'blendops-help', catalogSet);
  assert.equal(
    errExistsPred.some((e) => e.includes('/handoffs/0/when/all/0/value')),
    true,
    `Must reject non-boolean value when operator is 'exists', got: ${errExistsPred.join('; ')}`,
  );

  // 6. ConditionGroup containing both 'all' and 'any' simultaneously
  const bothAllAndAny = structuredClone(loadPilotContract('blendops-help'));
  bothAllAndAny.handoffs[0].when = {
    all: [{ field: 'goal.clarity', operator: 'equals', value: 'clear' }],
    any: [{ field: 'recipe.selected', operator: 'equals', value: false }],
  };
  const errBoth = validateContractObject(bothAllAndAny, 'blendops-help', catalogSet);
  assert.equal(
    errBoth.some((e) => e.includes('/handoffs/0/when')),
    true,
    'Must reject conditionGroup with both all and any',
  );

  // 7. Self-reference and directory ID mismatch
  const selfRef = structuredClone(loadPilotContract('blendops-help'));
  selfRef.id = 'wrong-dir-id';
  selfRef.exclusions[0].delegateTo = 'blendops-help';
  selfRef.handoffs[0].target = 'blendops-help';
  const errSelf = validateContractObject(selfRef, 'blendops-help', catalogSet);
  assert.equal(errSelf.some((e) => e.includes('/id')), true, 'Must report directory ID mismatch');
  assert.equal(
    errSelf.some((e) => e.includes('/exclusions/0/delegateTo') && e.includes('self-reference')),
    true,
    'Must reject exclusion self-reference',
  );
  assert.equal(
    errSelf.some((e) => e.includes('/handoffs/0/target') && e.includes('self-reference')),
    true,
    'Must reject handoff self-reference',
  );
});

test('Phase 2.1 (Workstream B): Deterministic state-space overlap detection catches goalClarity:any overlaps, duplicate conditions, and unreachable gates', () => {
  const validStates = enumerateRoutingStateSpace({ includeContradictory: false });
  const allStates = enumerateRoutingStateSpace({ includeContradictory: true });
  assert.equal(allStates.length, 16, '4-variable routing state space must have 16 total combinations');
  assert.equal(validStates.length, 8, 'Monotonic non-contradictory routing state space must have 8 valid combinations');

  // 1. Detect goalClarity: 'any' overlapping another gate in the same group
  const wildcardOverlap = structuredClone(loadPilotContracts());
  wildcardOverlap[1].routingPrecedence.activationGate.goalClarity = 'any'; // recipe-fit-assessor now overlaps blendops-help on ambiguous_or_mixed
  const overlapErrors = validatePrecedenceLadder(wildcardOverlap);
  assert.equal(
    overlapErrors.some(
      (e) =>
        e.includes('Overlapping activationGate') &&
        e.includes("'blendops-help' (rank 1)") &&
        e.includes("'recipe-fit-assessor' (rank 2)") &&
        e.includes('"goalClarity":"ambiguous_or_mixed"'),
    ),
    true,
    `Expected actionable overlap diagnostic naming conflicting contracts and state vector, got: ${overlapErrors.join('; ')}`,
  );

  // 2. Detect identical/duplicate activation conditions even with distinct ranks
  const duplicateGate = structuredClone(loadPilotContracts());
  duplicateGate[2].routingPrecedence.activationGate = structuredClone(
    duplicateGate[1].routingPrecedence.activationGate,
  );
  const dupErrors = validatePrecedenceLadder(duplicateGate);
  assert.equal(
    dupErrors.some((e) => e.includes('Identical activationGate') && e.includes('recipe-fit-assessor') && e.includes('pack-prerequisite-checker')),
    true,
    'Must detect identical activationGate across different ranks',
  );
  assert.equal(
    dupErrors.some((e) => e.includes('Unreachable activationGate') && e.includes('pack-prerequisite-checker')),
    true,
    'Must detect that shadowed lower-rank gate is unreachable',
  );

  // 3. Detect unreachable gate that requires a contradictory state vector (e.g. recipeSelected: false, preflightPassed: true)
  const unreachableContradictory = structuredClone(loadPilotContracts());
  unreachableContradictory[2].routingPrecedence.activationGate = {
    goalClarity: 'clear',
    recipeSelected: false,
    preflightPassed: true,
    hasStageOrArtifactInventory: false,
  };
  const unreachableErrors = validatePrecedenceLadder(unreachableContradictory);
  assert.equal(
    unreachableErrors.some(
      (e) =>
        e.includes('Unreachable activationGate') &&
        e.includes("'pack-prerequisite-checker' (rank 3)") &&
        e.includes('matches 0 valid runtime states'),
    ),
    true,
    `Must detect unreachable gate requiring contradictory runtime state, got: ${unreachableErrors.join('; ')}`,
  );
});

test('Phase 2.1 (Workstream B): resolveRoutingWinner rejects invalid goalClarity, missing fields, and all contradictory state combinations without selecting Rank 1', () => {
  const contracts = loadPilotContracts();

  // 1. Invalid clarity values (including wildcard 'any', empty string, unknown string, non-string)
  for (const badClarity of ['any', '', 'vague', 'mixed', null, undefined, 123, true]) {
    assert.equal(
      resolveRoutingWinner(contracts, {
        goalClarity: badClarity,
        recipeSelected: false,
        preflightPassed: false,
        hasStageOrArtifactInventory: false,
      }),
      null,
      `Must return null for invalid runtime goalClarity=${JSON.stringify(badClarity)}`,
    );
  }

  // 2. Even if Rank 1 has goalClarity: 'any', invalid runtime goalClarity must still return null
  const wildcardRank1 = structuredClone(contracts);
  wildcardRank1[0].routingPrecedence.activationGate.goalClarity = 'any';
  assert.equal(
    resolveRoutingWinner(wildcardRank1, {
      goalClarity: 'invalid_runtime_clarity',
      recipeSelected: false,
      preflightPassed: false,
      hasStageOrArtifactInventory: false,
    }),
    null,
    'Wildcard gate must never match an invalid runtime goalClarity value',
  );

  // 3. Missing required state fields must never silently select Rank 1
  const requiredKeys = ['goalClarity', 'recipeSelected', 'preflightPassed', 'hasStageOrArtifactInventory'];
  for (const omittedKey of requiredKeys) {
    const partialState = {
      goalClarity: 'ambiguous_or_mixed',
      recipeSelected: false,
      preflightPassed: false,
      hasStageOrArtifactInventory: false,
    };
    delete partialState[omittedKey];
    assert.equal(
      resolveRoutingWinner(contracts, partialState),
      null,
      `Missing '${omittedKey}' must return null and never select Rank 1`,
    );
  }

  // 4. Contradictory states across the state space must all return null
  const allStates = enumerateRoutingStateSpace({ includeContradictory: true });
  const contradictoryStates = allStates.filter((s) => isContradictoryRoutingState(s));
  assert.equal(contradictoryStates.length, 8, 'Expected 8 contradictory states');
  for (const badState of contradictoryStates) {
    assert.equal(
      resolveRoutingWinner(contracts, badState),
      null,
      `Contradictory state ${JSON.stringify(badState)} must return null`,
    );
  }
});

test('Phase 2.1 (Workstream D): --check is strictly read-only and failed validation never writes partial or misleading registry output', () => {
  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p21-test-'));
  try {
    fs.cpSync(path.join(root, 'schemas'), path.join(tmpRoot, 'schemas'), { recursive: true });
    fs.cpSync(path.join(root, 'skills'), path.join(tmpRoot, 'skills'), { recursive: true });
    fs.cpSync(path.join(root, 'registry'), path.join(tmpRoot, 'registry'), { recursive: true });

    const skillsJsonPath = path.join(tmpRoot, 'registry', 'skills.json');
    const graphJsonPath = path.join(tmpRoot, 'registry', 'workflow-graph.json');
    const helpSkillMdPath = path.join(tmpRoot, 'skills', 'blendops-help', 'SKILL.md');
    const helpContractPath = path.join(tmpRoot, 'skills', 'blendops-help', 'contract.json');

    // 1. Introduce managed Markdown drift in SKILL.md and verify --check fails without modifying ANY file
    const driftedMd = fs
      .readFileSync(helpSkillMdPath, 'utf8')
      .replace('"What should I do next?"', '"Drifted trigger in temp workspace"');
    fs.writeFileSync(helpSkillMdPath, driftedMd, 'utf8');

    const beforeHashSkills = crypto.createHash('sha256').update(fs.readFileSync(skillsJsonPath)).digest('hex');
    const beforeHashGraph = crypto.createHash('sha256').update(fs.readFileSync(graphJsonPath)).digest('hex');
    const beforeHashMd = crypto.createHash('sha256').update(fs.readFileSync(helpSkillMdPath)).digest('hex');

    const checkRes = spawnSync(
      process.execPath,
      [path.join(root, 'scripts', 'build-registry.mjs'), '--check'],
      { cwd: tmpRoot, encoding: 'utf8' },
    );
    assert.notEqual(checkRes.status, 0, '--check must exit non-zero when SKILL.md managed section has drifted');
    assert.equal(
      checkRes.stderr.includes('Managed section drift detected in skills/blendops-help/SKILL.md'),
      true,
      'Must report exact drifted SKILL.md path',
    );

    // Verify --check did not mutate any file
    assert.equal(
      crypto.createHash('sha256').update(fs.readFileSync(skillsJsonPath)).digest('hex'),
      beforeHashSkills,
      '--check must not modify registry/skills.json',
    );
    assert.equal(
      crypto.createHash('sha256').update(fs.readFileSync(graphJsonPath)).digest('hex'),
      beforeHashGraph,
      '--check must not modify registry/workflow-graph.json',
    );
    assert.equal(
      crypto.createHash('sha256').update(fs.readFileSync(helpSkillMdPath)).digest('hex'),
      beforeHashMd,
      '--check must not modify skills/blendops-help/SKILL.md',
    );

    // 2. Verify --sync-skills restores drifted SKILL.md cleanly
    const syncRes = spawnSync(
      process.execPath,
      [path.join(root, 'scripts', 'build-registry.mjs'), '--sync-skills'],
      { cwd: tmpRoot, encoding: 'utf8' },
    );
    assert.equal(syncRes.status, 0, '--sync-skills must succeed when contracts are valid');

    // 3. Corrupt a contract and remove registry output; verify failed build writes ZERO registry files and does not touch SKILL.md
    fs.rmSync(path.join(tmpRoot, 'registry'), { recursive: true, force: true });
    const cleanMdBeforeFail = fs.readFileSync(helpSkillMdPath, 'utf8');

    const badContract = JSON.parse(fs.readFileSync(helpContractPath, 'utf8'));
    badContract.routingPrecedence.rank = 2; // collides with recipe-fit-assessor
    fs.writeFileSync(helpContractPath, JSON.stringify(badContract, null, 2), 'utf8');

    const failBuildRes = spawnSync(
      process.execPath,
      [path.join(root, 'scripts', 'build-registry.mjs'), '--sync-skills'],
      { cwd: tmpRoot, encoding: 'utf8' },
    );
    assert.notEqual(failBuildRes.status, 0, 'Build must fail when contract validation fails');
    assert.equal(
      fs.existsSync(skillsJsonPath),
      false,
      'Failed build must never write partial registry/skills.json',
    );
    assert.equal(
      fs.existsSync(graphJsonPath),
      false,
      'Failed build must never write partial registry/workflow-graph.json',
    );
    assert.equal(
      fs.readFileSync(helpSkillMdPath, 'utf8'),
      cleanMdBeforeFail,
      'Failed build with --sync-skills must not mutate SKILL.md when validation fails',
    );
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});
