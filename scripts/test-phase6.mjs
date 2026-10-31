import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  ROUTING_PARTICIPANT_IDS,
  loadContextFieldVocabulary,
} from './build-registry.mjs';
import {
  validateEvalSuiteObject,
  validateHandoffContextObject,
  evaluateSingleCase,
  buildEvalArtifacts,
  runEvalSuites,
  getCatalogSkillIds,
  loadContractMap,
} from './run-evals.mjs';
import {
  generateCurrentAuditArtifacts,
  computeAuditedInputsDigest,
  resolveAuditedInputFiles,
  AUDITED_INPUTS_MANIFEST_REL,
} from './generate-current-audit.mjs';

const root = process.cwd();
const catalogIds = getCatalogSkillIds(root);
const catalogSet = new Set(catalogIds);
const { contractsById, allContracts } = loadContractMap(root);
const { fieldMap: contextFieldMap } = loadContextFieldVocabulary(root);

function loadSuite(skillId) {
  const fullPath = path.join(root, 'evals', 'suites', `${skillId}.eval.json`);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

describe('Phase 6 — Full-Catalog Behavioral Evaluation Coverage & F-04 Resolution', () => {
  it('Scenario 1: all 48 catalog skills have a valid .eval.json file under evals/suites/ and evals/pilot/ is removed', () => {
    assert.equal(catalogIds.length, 48);
    assert.equal(
      fs.existsSync(path.join(root, 'evals', 'pilot')),
      false,
      'Legacy evals/pilot/ directory must be removed',
    );

    const suitesDir = path.join(root, 'evals', 'suites');
    assert.equal(fs.existsSync(suitesDir), true);

    const suiteFiles = fs
      .readdirSync(suitesDir)
      .filter((f) => f.endsWith('.eval.json'))
      .sort();
    assert.equal(suiteFiles.length, 48);

    for (const skillId of catalogIds) {
      const suitePath = path.join(suitesDir, `${skillId}.eval.json`);
      assert.equal(fs.existsSync(suitePath), true, `Missing eval suite for ${skillId}`);
    }
  });

  it('Scenario 2: evals/index.json accurately reflects 48/48 coverage, 0 missing suites, 0 prose-only pending skills, and 269 total cases', () => {
    const evalIndex = JSON.parse(
      fs.readFileSync(path.join(root, 'evals', 'index.json'), 'utf8'),
    );
    assert.equal(evalIndex.schemaVersion, '2.0.0');
    assert.equal(evalIndex.phase, 'phase-6-full-catalog-behavioral-evals');
    assert.equal(evalIndex.coverageSummary.catalogSkills, 48);
    assert.equal(evalIndex.coverageSummary.machineReadableSuites, 48);
    assert.equal(evalIndex.coverageSummary.skillsWithoutSuites, 0);
    assert.equal(evalIndex.coverageSummary.proseOnlySkillsPendingMigration, 0);
    assert.equal(evalIndex.coverageSummary.routingParticipants, 4);
    assert.equal(evalIndex.coverageSummary.specialistSkills, 44);
    assert.equal(evalIndex.coverageSummary.totalCases, 269);
    assert.deepEqual(evalIndex.coverageSummary.countsByEvaluationType, {
      contract_routing: 21,
      contract_handoff: 124,
      deterministic_fixture: 124,
    });
    assert.deepEqual(evalIndex.coverageSummary.contractRoutingCoverage, {
      routingParticipantsWithRoutingEvals: 4,
      totalRoutingParticipantCases: 21,
    });
    assert.deepEqual(evalIndex.coverageSummary.contractHandoffCoverage, {
      specialistSkillsWithHandoffEvals: 44,
      totalSpecialistHandoffCases: 124,
    });
    assert.deepEqual(evalIndex.coverageSummary.deterministicFixtureCoverage, {
      skillsWithFixtureEvals: 48,
      totalDeterministicFixtureCases: 124,
    });
    assert.equal(evalIndex.coverageSummary.liveModel, 'Not Run');
    assert.equal(evalIndex.coverageSummary.blenderRuntime, 'Not Run');
    assert.equal(evalIndex.suites.length, 48);
    assert.deepEqual(evalIndex.remainingProseSkillsPendingMigration, []);
  });

  it('Scenario 3: every suite validates against schemas/skill-eval.schema.json (2.0.0) with Ajv2020 strict mode', () => {
    for (const skillId of catalogIds) {
      const suite = loadSuite(skillId);
      assert.equal(suite.schemaVersion, '2.0.0');
      const errs = validateEvalSuiteObject(suite, skillId, catalogSet, undefined, {
        contractsById,
        contextFieldMap,
      });
      assert.deepEqual(errs, [], `Validation errors in ${skillId}: ${errs.join('; ')}`);
    }
  });

  it('Scenario 4: every suite has at least 4 cases (actual minimum is 5) and preserves all 12 Phase 3 pilot suites', () => {
    for (const skillId of catalogIds) {
      const suite = loadSuite(skillId);
      assert.ok(
        suite.cases.length >= 5,
        `Expected >= 5 cases in ${skillId}, found ${suite.cases.length}`,
      );
    }

    // Verify all 12 original Phase 3 pilot skills have preserved/expanded case counts
    const expectedPilotMinCounts = {
      'blendops-help': 6,
      'recipe-fit-assessor': 5,
      'pack-prerequisite-checker': 5,
      'workflow-stage-router': 5,
      'blender-brainstorming': 7,
      'intent-to-3d-brief-writer': 9,
      'blender-asset-discovery-planner': 9,
      'blender-troubleshooting': 8,
      'pre-handoff-verification': 9,
      'render-export-evidence': 10,
      'runtime-bridge-conflict-resolver': 9,
      'official-runtime-readiness-checker': 7,
    };
    for (const [id, expectedCount] of Object.entries(expectedPilotMinCounts)) {
      const suite = loadSuite(id);
      assert.equal(suite.cases.length, expectedCount, `Case count mismatch for pilot skill ${id}`);
    }
  });

  it('Scenario 5: removing a suite file from an isolated temp repo causes evals:check to fail', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase6-missing-suite-'));
    try {
      for (const rel of ['schemas', 'registry', 'skills', 'evals']) {
        fs.cpSync(path.join(root, rel), path.join(tempDir, rel), { recursive: true });
      }
      fs.unlinkSync(path.join(tempDir, 'evals', 'suites', 'polycount-budget-checker.eval.json'));

      const checkRes = runEvalSuites({ rootDir: tempDir, checkOnly: true });
      assert.equal(checkRes.ok, false);
      assert.ok(
        checkRes.errors.some((e) =>
          e.includes('Missing evaluation suite file evals/suites/polycount-budget-checker.eval.json'),
        ),
        `Expected missing suite error, got: ${checkRes.errors.join('; ')}`,
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Scenario 6: adding an orphan .eval.json file for a non-catalog skill or restoring evals/pilot/ causes evals:check to fail', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase6-orphan-suite-'));
    try {
      for (const rel of ['schemas', 'registry', 'skills', 'evals']) {
        fs.cpSync(path.join(root, rel), path.join(tempDir, rel), { recursive: true });
      }
      const orphanSuite = loadSuite('polycount-budget-checker');
      orphanSuite.skillId = 'non-existent-orphan-skill';
      fs.writeFileSync(
        path.join(tempDir, 'evals', 'suites', 'non-existent-orphan-skill.eval.json'),
        JSON.stringify(orphanSuite, null, 2) + '\n',
        'utf8',
      );
      fs.mkdirSync(path.join(tempDir, 'evals', 'pilot'), { recursive: true });

      const checkRes = runEvalSuites({ rootDir: tempDir, checkOnly: true });
      assert.equal(checkRes.ok, false);
      assert.ok(
        checkRes.errors.some((e) =>
          e.includes('Orphan evaluation suite file evals/suites/non-existent-orphan-skill.eval.json'),
        ),
      );
      assert.ok(
        checkRes.errors.some((e) => e.includes('Legacy evals/pilot/ directory still exists')),
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Scenario 7: duplicate case IDs within a suite or across suites fail validation', () => {
    // Intra-suite duplicate case ID
    const suite = loadSuite('acceptance-criteria-builder');
    suite.cases.push({ ...structuredClone(suite.cases[0]) });
    const intraErrs = validateEvalSuiteObject(
      suite,
      'acceptance-criteria-builder',
      catalogSet,
      undefined,
      { contractsById, contextFieldMap },
    );
    assert.ok(intraErrs.some((e) => e.includes('duplicate case id')));

    // Cross-suite duplicate case ID in isolated repo
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase6-dup-case-'));
    try {
      for (const rel of ['schemas', 'registry', 'skills', 'evals']) {
        fs.cpSync(path.join(root, rel), path.join(tempDir, rel), { recursive: true });
      }
      const suiteA = JSON.parse(
        fs.readFileSync(
          path.join(tempDir, 'evals', 'suites', 'acceptance-criteria-builder.eval.json'),
          'utf8',
        ),
      );
      const suiteBPath = path.join(tempDir, 'evals', 'suites', 'asset-fallback-strategy.eval.json');
      const suiteB = JSON.parse(fs.readFileSync(suiteBPath, 'utf8'));
      suiteB.cases[0].id = suiteA.cases[0].id;
      fs.writeFileSync(suiteBPath, JSON.stringify(suiteB, null, 2) + '\n', 'utf8');

      const buildRes = buildEvalArtifacts(tempDir);
      assert.ok(
        buildRes.errors.some((e) => e.includes(`Duplicate case id '${suiteA.cases[0].id}' across suites`)),
        `Expected cross-suite duplicate case ID error, got: ${buildRes.errors.join('; ')}`,
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Scenario 8: mismatched skillId, category, contractPath, skillMarkdownPath, or evalMarkdownPath fails validation', () => {
    const base = loadSuite('cycles-vs-eevee-decision');

    const badSkillId = structuredClone(base);
    badSkillId.skillId = 'color-management-decision';
    assert.ok(
      validateEvalSuiteObject(badSkillId, 'cycles-vs-eevee-decision', catalogSet, undefined, {
        contractsById,
        contextFieldMap,
      }).some((e) => e.includes('does not match expected')),
    );

    const badCategory = structuredClone(base);
    badCategory.category = 'asset-and-sourcing';
    assert.ok(
      validateEvalSuiteObject(badCategory, 'cycles-vs-eevee-decision', catalogSet, undefined, {
        contractsById,
        contextFieldMap,
      }).some((e) => e.includes('does not match contract.json category')),
    );

    const badContractPath = structuredClone(base);
    badContractPath.contractPath = 'skills/wrong-skill/contract.json';
    assert.ok(
      validateEvalSuiteObject(badContractPath, 'cycles-vs-eevee-decision', catalogSet, undefined, {
        contractsById,
        contextFieldMap,
      }).some((e) => e.includes('contractPath')),
    );

    const badSkillMdPath = structuredClone(base);
    badSkillMdPath.skillMarkdownPath = 'skills/wrong-skill/SKILL.md';
    assert.ok(
      validateEvalSuiteObject(badSkillMdPath, 'cycles-vs-eevee-decision', catalogSet, undefined, {
        contractsById,
        contextFieldMap,
      }).some((e) => e.includes('skillMarkdownPath')),
    );

    const badEvalMdPath = structuredClone(base);
    badEvalMdPath.evalMarkdownPath = 'skills/wrong-skill/EVAL.md';
    assert.ok(
      validateEvalSuiteObject(badEvalMdPath, 'cycles-vs-eevee-decision', catalogSet, undefined, {
        contractsById,
        contextFieldMap,
      }).some((e) => e.includes('evalMarkdownPath')),
    );
  });

  it('Scenario 9: routing participant suites validate contract_routing against resolveRoutingWinner and contract handoffs', () => {
    assert.equal(ROUTING_PARTICIPANT_IDS.length, 4);
    let totalRoutingCases = 0;
    for (const skillId of ROUTING_PARTICIPANT_IDS) {
      const suite = loadSuite(skillId);
      assert.equal(suite.isRoutingParticipant, true);
      assert.equal(suite.evaluationStatus.contractRouting, 'Passed');
      assert.equal(suite.evaluationStatus.contractHandoff, 'Not Applicable');
      for (const c of suite.cases) {
        assert.equal(c.evaluationType, 'contract_routing');
        const res = evaluateSingleCase(c, { contractsById, allContracts, contextFieldMap });
        assert.equal(res.status, 'Passed', `Failed routing case ${c.id}: ${res.failures.join('; ')}`);
        totalRoutingCases += 1;
      }
    }
    assert.equal(totalRoutingCases, 21);
  });

  it('Scenario 10: specialist skill suites reject routingState, isRoutingParticipant=true, or contract_routing misuse', () => {
    const specialistSuite = loadSuite('product-hero-scene-planner');
    assert.equal(specialistSuite.isRoutingParticipant, false);

    // Mismarking specialist as routing participant
    const wrongFlag = structuredClone(specialistSuite);
    wrongFlag.isRoutingParticipant = true;
    const errs1 = validateEvalSuiteObject(
      wrongFlag,
      'product-hero-scene-planner',
      catalogSet,
      undefined,
      { contractsById, contextFieldMap },
    );
    assert.ok(errs1.some((e) => e.includes('isRoutingParticipant')));

    // Adding routingState or contract_routing to a specialist case
    const wrongCaseSuite = structuredClone(specialistSuite);
    wrongCaseSuite.cases[0].evaluationType = 'contract_routing';
    wrongCaseSuite.cases[0].deterministicFixture.routingState = {
      goalClarity: 'clear',
      recipeSelected: true,
      preflightPassed: true,
      hasStageOrArtifactInventory: true,
    };
    const errs2 = validateEvalSuiteObject(
      wrongCaseSuite,
      'product-hero-scene-planner',
      catalogSet,
      undefined,
      { contractsById, contextFieldMap },
    );
    assert.ok(
      errs2.some(
        (e) =>
          e.includes("cannot use evaluationType 'contract_routing'") ||
          e.includes('must not include deterministicFixture.routingState'),
      ),
    );

    const caseRes = evaluateSingleCase(wrongCaseSuite.cases[0], {
      contractsById,
      allContracts,
      contextFieldMap,
    });
    assert.equal(caseRes.status, 'Failed');
    assert.ok(
      caseRes.failures.some((f) => f.includes('non-routing specialist skill')),
    );
  });

  it('Scenario 11: specialist contract_handoff cases pass when handoffContext matches the expected contract handoff target across all 44 specialist skills', () => {
    const specialistIds = catalogIds.filter((id) => !ROUTING_PARTICIPANT_IDS.includes(id));
    assert.equal(specialistIds.length, 44);

    let totalHandoffCases = 0;
    for (const skillId of specialistIds) {
      const suite = loadSuite(skillId);
      const handoffCases = suite.cases.filter((c) => c.evaluationType === 'contract_handoff');
      assert.ok(
        handoffCases.length >= 2,
        `Specialist skill ${skillId} must have >= 2 contract_handoff cases`,
      );
      for (const c of handoffCases) {
        const res = evaluateSingleCase(c, { contractsById, allContracts, contextFieldMap });
        assert.equal(
          res.status,
          'Passed',
          `Expected contract_handoff case ${skillId}/${c.id} to pass, got: ${res.failures.join('; ')}`,
        );
        totalHandoffCases += 1;
      }
    }
    assert.equal(totalHandoffCases, 124);
  });

  it('Scenario 12: specialist contract_handoff cases fail when handoffContext matches zero handoffs or the wrong handoff target', () => {
    const suite = loadSuite('product-hero-scene-planner');
    const handoffCase = structuredClone(
      suite.cases.find((c) => c.evaluationType === 'contract_handoff' && c.expectedRoutingTarget !== 'none'),
    );

    // 1. Context matches 0 handoffs while expectedRoutingTarget is a skill
    const zeroMatchCase = structuredClone(handoffCase);
    zeroMatchCase.deterministicFixture.handoffContext = {
      'brief.locked': false,
    };
    const res1 = evaluateSingleCase(zeroMatchCase, {
      contractsById,
      allContracts,
      contextFieldMap,
    });
    assert.equal(res1.status, 'Failed');
    assert.ok(res1.failures.some((f) => f.includes('matched 0 handoffs')));

    // 2. Context matches a handoff, but expectedRoutingTarget is a different skill
    const wrongTargetCase = structuredClone(handoffCase);
    wrongTargetCase.expectedRoutingTarget = 'glb-animation-handoff';
    wrongTargetCase.deterministicFixture.simulatedOutput.targetHandoff = 'glb-animation-handoff';
    const res2 = evaluateSingleCase(wrongTargetCase, {
      contractsById,
      allContracts,
      contextFieldMap,
    });
    assert.equal(res2.status, 'Failed');
    assert.ok(res2.failures.some((f) => f.includes('does not include expected')));

    // 3. Context matches a handoff when expectedRoutingTarget is 'none'
    const unexpectedMatchOnNone = structuredClone(handoffCase);
    unexpectedMatchOnNone.expectedRoutingTarget = 'none';
    unexpectedMatchOnNone.deterministicFixture.simulatedOutput.targetHandoff = 'none';
    const res3 = evaluateSingleCase(unexpectedMatchOnNone, {
      contractsById,
      allContracts,
      contextFieldMap,
    });
    assert.equal(res3.status, 'Failed');
    assert.ok(res3.failures.some((f) => f.includes("when expectedRoutingTarget is 'none'")));
  });

  it('Scenario 13: unregistered handoffContext fields or invalid enum/type values fail validation against registry/contract-context-fields.json', () => {
    const unknownFieldErrs = validateHandoffContextObject(
      { 'invented.unregisteredField': true },
      'testCtx',
      contextFieldMap,
    );
    assert.ok(unknownFieldErrs.some((e) => e.includes("unregistered handoffContext field 'invented.unregisteredField'")));

    const badEnumErrs = validateHandoffContextObject(
      { 'runtime.status': 'InventedRuntimeState' },
      'testCtx',
      contextFieldMap,
    );
    assert.ok(badEnumErrs.some((e) => e.includes('not in allowedValues')));

    const badBoolErrs = validateHandoffContextObject(
      { 'brief.locked': 'yes' },
      'testCtx',
      contextFieldMap,
    );
    assert.ok(badBoolErrs.some((e) => e.includes('expected boolean value')));

    // Also verify evaluateSingleCase fails closed on unregistered handoffContext field
    const suite = loadSuite('product-hero-scene-planner');
    const mutatedCase = structuredClone(suite.cases[0]);
    mutatedCase.deterministicFixture.handoffContext['unknown.field'] = 'bad';
    const caseRes = evaluateSingleCase(mutatedCase, {
      contractsById,
      allContracts,
      contextFieldMap,
    });
    assert.equal(caseRes.status, 'Failed');
    assert.ok(caseRes.failures.some((f) => f.includes("unregistered handoffContext field 'unknown.field'")));
  });

  it('Scenario 14: missing requiredOutputProperties in simulatedOutput fails evals:run', () => {
    const suite = loadSuite('material-quality-checker');
    const c = structuredClone(suite.cases[0]);
    c.requiredOutputProperties.push('mandatory-phrase-that-is-missing-xyz');
    const res = evaluateSingleCase(c, { contractsById, allContracts, contextFieldMap });
    assert.equal(res.status, 'Failed');
    assert.ok(
      res.failures.some((f) =>
        f.includes("Missing required output property/phrase: 'mandatory-phrase-that-is-missing-xyz'"),
      ),
    );
  });

  it('Scenario 15: presence of forbiddenOutputProperties in simulatedOutput fails evals:run', () => {
    const suite = loadSuite('lighting-quality-checker');
    const c = structuredClone(suite.cases[0]);
    c.deterministicFixture.simulatedOutput.summary += ' | looks good and Artifact: Verified';
    const res = evaluateSingleCase(c, { contractsById, allContracts, contextFieldMap });
    assert.equal(res.status, 'Failed');
    assert.ok(res.failures.some((f) => f.includes('Output contains forbidden property/overclaim')));
  });

  it('Scenario 16: Artifact status = Not Run fails both schema/suite validation and evaluateSingleCase', () => {
    const suite = loadSuite('glb-web-handoff');
    const badSuite = structuredClone(suite);
    badSuite.cases[0].truthStateExpectations.artifactStatus = 'Not Run';
    badSuite.cases[0].deterministicFixture.simulatedOutput.artifactStatus = 'Not Run';

    const suiteErrs = validateEvalSuiteObject(badSuite, 'glb-web-handoff', catalogSet, undefined, {
      contractsById,
      contextFieldMap,
    });
    assert.ok(suiteErrs.some((e) => e.includes('Truth-state law violation')));

    const caseRes = evaluateSingleCase(badSuite.cases[0], {
      contractsById,
      allContracts,
      contextFieldMap,
    });
    assert.equal(caseRes.status, 'Failed');
    assert.ok(caseRes.failures.some((f) => f.includes('Truth-state law violation')));
  });

  it('Scenario 17: claiming Produced or Verified with existingArtifactEvidence = none or attempted-no-file fails evals:run', () => {
    const suite = loadSuite('render-export-evidence');
    const noneCase = structuredClone(suite.cases[0]);
    noneCase.preconditions.existingArtifactEvidence = 'none';
    noneCase.truthStateExpectations.artifactStatus = 'Produced';
    noneCase.deterministicFixture.simulatedOutput.artifactStatus = 'Produced';
    const res1 = evaluateSingleCase(noneCase, { contractsById, allContracts, contextFieldMap });
    assert.equal(res1.status, 'Failed');
    assert.ok(res1.failures.some((f) => f.includes('Evidence-before-done violation')));

    const attemptedNoFileCase = structuredClone(suite.cases[0]);
    attemptedNoFileCase.preconditions.existingArtifactEvidence = 'attempted-no-file';
    attemptedNoFileCase.truthStateExpectations.artifactStatus = 'Verified';
    attemptedNoFileCase.deterministicFixture.simulatedOutput.artifactStatus = 'Verified';
    const res2 = evaluateSingleCase(attemptedNoFileCase, {
      contractsById,
      allContracts,
      contextFieldMap,
    });
    assert.equal(res2.status, 'Failed');
    assert.ok(res2.failures.some((f) => f.includes('Evidence-before-done violation')));
  });

  it('Scenario 18: claiming Verified with existingArtifactEvidence = file-only-unvalidated fails evals:run', () => {
    const suite = loadSuite('pre-handoff-verification');
    const unvalidatedCase = structuredClone(suite.cases[0]);
    unvalidatedCase.preconditions.existingArtifactEvidence = 'file-only-unvalidated';
    unvalidatedCase.truthStateExpectations.artifactStatus = 'Verified';
    unvalidatedCase.deterministicFixture.simulatedOutput.artifactStatus = 'Verified';
    const res = evaluateSingleCase(unvalidatedCase, {
      contractsById,
      allContracts,
      contextFieldMap,
    });
    assert.equal(res.status, 'Failed');
    assert.ok(
      res.failures.some((f) =>
        f.includes("artifactStatus 'Verified' claimed when existingArtifactEvidence is 'file-only-unvalidated'"),
      ),
    );
  });

  it('Scenario 19: Path 1 (5.1+ Lab MCP add-on), Path 2 (mcp-for-blender, 3.0+), and CLI fallback semantics are preserved across runtime suites', () => {
    const readinessSuite = loadSuite('official-runtime-readiness-checker');
    const setupSuite = loadSuite('official-runtime-setup-guide');
    const hostOutlineSuite = loadSuite('path-one-host-outline');
    const pathPickerSuite = loadSuite('runtime-path-picker');
    const cliSuite = loadSuite('cli-appendix-job-outline');

    const readinessText = JSON.stringify(readinessSuite);
    assert.match(readinessText, /Blender 5\.1\+/);
    assert.match(readinessText, /not standalone/i);

    const setupText = JSON.stringify(setupSuite);
    assert.match(setupText, /Blender 5\.1\+/);
    assert.match(setupText, /not standalone/i);

    const hostText = JSON.stringify(hostOutlineSuite);
    assert.match(hostText, /Path 1/);
    assert.match(hostText, /Blender 5\.1\+/);

    const pickerText = JSON.stringify(pathPickerSuite);
    assert.match(pickerText, /Path 1/);
    assert.match(pickerText, /Path 2/);
    assert.match(pickerText, /3\.0\+/);

    const cliText = JSON.stringify(cliSuite);
    assert.match(cliText, /CLI/i);
    assert.match(cliText, /Not Run/);
  });

  it('Scenario 20: liveModel and blenderRuntime remain Not Run across all 48 suites and in evals/index.json', () => {
    const evalIndex = JSON.parse(
      fs.readFileSync(path.join(root, 'evals', 'index.json'), 'utf8'),
    );
    assert.equal(evalIndex.coverageSummary.liveModel, 'Not Run');
    assert.equal(evalIndex.coverageSummary.blenderRuntime, 'Not Run');

    for (const skillId of catalogIds) {
      const suite = loadSuite(skillId);
      assert.equal(suite.evaluationStatus.liveModel, 'Not Run');
      assert.equal(suite.evaluationStatus.blenderRuntime, 'Not Run');
      for (const c of suite.cases) {
        assert.notEqual(c.evaluationType, 'live_model');
        assert.notEqual(c.evaluationType, 'blender_runtime');
      }
    }
  });

  it('Scenario 21: --skill <id> and --suite <id> execute only the requested suite and fail on unknown skill IDs', () => {
    const skillRes = runEvalSuites({
      rootDir: root,
      skillFilter: 'three-fiber-component-shape-planner',
      checkOnly: false,
    });
    assert.equal(skillRes.ok, true);
    assert.equal(skillRes.summary.suitesExecuted, 1);
    assert.equal(skillRes.summary.totalCasesExecuted, 5);
    assert.equal(skillRes.suiteResults[0].skillId, 'three-fiber-component-shape-planner');
    assert.equal(skillRes.suiteResults[0].contractHandoff, 'Passed');
    assert.equal(skillRes.suiteResults[0].contractRouting, 'Not Applicable');

    const suiteRes = runEvalSuites({
      rootDir: root,
      suiteFilter: 'glb-mobile-performance-budget',
      checkOnly: false,
    });
    assert.equal(suiteRes.ok, true);
    assert.equal(suiteRes.summary.suitesExecuted, 1);
    assert.equal(suiteRes.summary.totalCasesExecuted, 5);

    const badRes = runEvalSuites({
      rootDir: root,
      skillFilter: 'unknown-skill-id-404',
      checkOnly: false,
    });
    assert.equal(badRes.ok, false);
    assert.ok(badRes.errors.some((e) => e.includes('unknown-skill-id-404')));
  });

  it('Scenario 22: evals/index.json drift detection fails evals:check when a suite file is modified without rebuilding the index', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase6-index-drift-'));
    try {
      for (const rel of ['schemas', 'registry', 'skills', 'evals']) {
        fs.cpSync(path.join(root, rel), path.join(tempDir, rel), { recursive: true });
      }
      const suitePath = path.join(
        tempDir,
        'evals',
        'suites',
        'polycount-budget-checker.eval.json',
      );
      const suite = JSON.parse(fs.readFileSync(suitePath, 'utf8'));
      suite.cases.push({
        ...structuredClone(suite.cases[3]),
        id: 'polycount-budget-checker-extra-drift-case',
      });
      fs.writeFileSync(suitePath, JSON.stringify(suite, null, 2) + '\n', 'utf8');

      const checkRes = runEvalSuites({ rootDir: tempDir, checkOnly: true });
      assert.equal(checkRes.ok, false);
      assert.ok(
        checkRes.errors.some((e) =>
          e.includes('evals/index.json is out of sync with evals/suites/*.eval.json'),
        ),
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Scenario 23: scripts/export-claude-skills.mjs still exports all 48 skills with SKILL.md, EVAL.md, and references/', () => {
    const tempExportRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase6-export-'));
    try {
      const out = execFileSync(
        process.execPath,
        [path.join(root, 'scripts', 'export-claude-skills.mjs'), '--output-root', tempExportRoot],
        { cwd: root, encoding: 'utf8' },
      );
      assert.match(out, /Exported 48 Claude skill zips/i);

      const manifestPath = path.join(tempExportRoot, 'manifest.json');
      assert.equal(fs.existsSync(manifestPath), true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      assert.equal(manifest.skillCount, 48);
      assert.deepEqual(manifest.skills, catalogIds);

      for (const skillId of catalogIds) {
        const zipPath = path.join(tempExportRoot, 'desktop-zips', `${skillId}.zip`);
        const folderSkillMd = path.join(
          tempExportRoot,
          'claude-code-skills',
          skillId,
          'SKILL.md',
        );
        const folderEvalMd = path.join(
          tempExportRoot,
          'claude-code-skills',
          skillId,
          'EVAL.md',
        );
        assert.equal(fs.existsSync(zipPath), true, `Missing ZIP for ${skillId}`);
        assert.equal(fs.existsSync(folderSkillMd), true, `Missing SKILL.md for ${skillId}`);
        assert.equal(fs.existsSync(folderEvalMd), true, `Missing EVAL.md for ${skillId}`);

        const srcRefsDir = path.join(root, 'skills', skillId, 'references');
        if (fs.existsSync(srcRefsDir)) {
          const refFiles = fs
            .readdirSync(srcRefsDir, { withFileTypes: true })
            .filter((d) => d.isFile())
            .map((d) => d.name);
          for (const refFile of refFiles) {
            const exportedRefPath = path.join(
              tempExportRoot,
              'claude-code-skills',
              skillId,
              'references',
              refFile,
            );
            assert.equal(
              fs.existsSync(exportedRefPath),
              true,
              `Missing exported reference ${skillId}/references/${refFile}`,
            );
          }
        }
      }
    } finally {
      fs.rmSync(tempExportRoot, { recursive: true, force: true });
    }
  });

  it('Scenario 24: docs/audits/current/* marks F-04 FIXED, updates eval-inventory.json to 48/48 suites (0 prose-only remaining), preserves F-08 PARTIALLY_FIXED and F-09 OPEN, and keeps auditedInputsSha256 synchronized', () => {
    const scorecard = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'scorecard.json'), 'utf8'),
    );
    const findings = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'findings.json'), 'utf8'),
    );
    const evalInv = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'eval-inventory.json'), 'utf8'),
    );
    const skillInv = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'skill-inventory.json'), 'utf8'),
    );

    const f04 = findings.findings.find((f) => f.id === 'F-04');
    const f08 = findings.findings.find((f) => f.id === 'F-08');
    const f09 = findings.findings.find((f) => f.id === 'F-09');
    assert.equal(f04?.currentLifecycleStatus, 'FIXED');
    assert.equal(f08?.currentLifecycleStatus, 'PARTIALLY_FIXED');
    assert.equal(f09?.currentLifecycleStatus, 'OPEN');

    assert.equal(evalInv.summary.totalEvalFiles, 48);
    assert.equal(evalInv.summary.machineReadableSuitesCount, 48);
    assert.equal(evalInv.summary.skillsWithoutSuitesCount, 0);
    assert.equal(evalInv.summary.remainingUnmigratedProseSkillsCount, 0);
    assert.equal(evalInv.summary.totalMachineReadableCases, 269);
    assert.equal(evalInv.summary.contractRoutingCasesCount, 21);
    assert.equal(evalInv.summary.contractHandoffCasesCount, 124);
    assert.equal(evalInv.summary.deterministicFixtureCasesCount, 124);
    assert.equal(evalInv.summary.deterministicRunnerStatus, 'Passed');
    assert.equal(evalInv.summary.liveModelRunnerStatus, 'Not Run');
    assert.equal(evalInv.summary.blenderRuntimeRunnerStatus, 'Not Run');

    for (const item of evalInv.evals) {
      assert.equal(item.hasMachineReadableEvalJson, true);
      assert.equal(item.evalJsonPath, `evals/suites/${item.id}.eval.json`);
      assert.ok(item.machineReadableCaseCount >= 5);
      assert.equal(item.deterministicRunnerStatus, 'Passed');
      assert.equal(item.liveModelStatus, 'Not Run');
      assert.equal(item.blenderRuntimeStatus, 'Not Run');
    }

    assert.equal(skillInv.summary.machineReadableEvalSuitesCount, 48);
    assert.equal(skillInv.summary.skillsWithoutEvalSuitesCount, 0);
    assert.equal(skillInv.summary.totalMachineReadableEvalCases, 269);

    const resolvedFiles = new Set(resolveAuditedInputFiles(root));
    assert.equal(resolvedFiles.has('scripts/test-phase6.mjs'), true);
    assert.equal(
      resolvedFiles.has('evals/suites/product-hero-scene-planner.eval.json'),
      true,
    );
    assert.equal(scorecard.auditProvenance.auditedInputsSha256, computeAuditedInputsDigest(root));
  });

  it('Scenario 25: removing a suite or breaking a case in an isolated temp repo prevents F-04 from being marked FIXED', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase6-f04-revert-'));
    try {
      for (const relDir of [
        path.join('docs', 'audits', 'phase-0'),
        'registry',
        'evals',
        'schemas',
        'skills',
      ]) {
        fs.cpSync(path.join(root, relDir), path.join(tempDir, relDir), { recursive: true });
      }
      fs.writeFileSync(
        path.join(tempDir, AUDITED_INPUTS_MANIFEST_REL),
        JSON.stringify(
          {
            schemaVersion: '1.0.0',
            requiredFiles: [AUDITED_INPUTS_MANIFEST_REL],
            requiredDirectories: ['docs/audits/phase-0', 'registry', 'evals', 'schemas', 'skills'],
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );
      execFileSync('git', ['init', '-b', 'main'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.name', 'Temp Tester'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: tempDir });
      execFileSync('git', ['add', '.'], { cwd: tempDir });
      execFileSync('git', ['commit', '-m', 'Initial temp commit'], { cwd: tempDir });

      // Break one case in polycount-budget-checker.eval.json so evalRunResult.ok becomes false
      const targetSuitePath = path.join(
        tempDir,
        'evals',
        'suites',
        'polycount-budget-checker.eval.json',
      );
      const suite = JSON.parse(fs.readFileSync(targetSuitePath, 'utf8'));
      suite.cases[0].deterministicFixture.simulatedOutput.summary += ' | Artifact: Verified';
      fs.writeFileSync(targetSuitePath, JSON.stringify(suite, null, 2) + '\n', 'utf8');

      const generated = generateCurrentAuditArtifacts(tempDir);
      const mutatedF04 = generated.findings.findings.find((f) => f.id === 'F-04');
      assert.equal(
        mutatedF04.currentLifecycleStatus,
        'PARTIALLY_FIXED',
        'F-04 must revert to PARTIALLY_FIXED if any evaluation suite or case fails',
      );
      assert.equal(generated.currentEvalInventory.summary.deterministicRunnerStatus, 'Failed');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
