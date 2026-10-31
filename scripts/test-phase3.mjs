import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateEvalSuiteObject,
  evaluateSingleCase,
  evaluateConditionPredicate,
  runEvalSuites,
  getCatalogSkillIds,
  loadContractMap,
} from './run-evals.mjs';

const root = process.cwd();
const catalogSet = new Set(getCatalogSkillIds(root));
const { contractsById, allContracts } = loadContractMap(root);

function loadValidPilotSuite(skillId = 'blendops-help') {
  const fullPath = path.join(root, 'evals', 'pilot', `${skillId}.eval.json`);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

describe('Phase 3 — Behavioral Evaluation Schema & Deterministic Runner', () => {
  it('validates all 12 pilot evaluation suites (73 cases) via runEvalSuites(--check)', () => {
    const checkRes = runEvalSuites({ rootDir: root, checkOnly: true });
    assert.equal(checkRes.ok, true, `Expected evals:check to pass, got: ${checkRes.errors.join('; ')}`);
    assert.equal(checkRes.summary.machineReadablePilotSuites, 12);
    assert.equal(checkRes.summary.totalMachineReadableCases, 73);
    assert.equal(checkRes.summary.remainingProseOnlyEvalFiles, 36);
    assert.equal(checkRes.summary.liveModelStatus, 'Not Run');
    assert.equal(checkRes.summary.blenderRuntimeStatus, 'Not Run');
  });

  it('executes all 73 deterministic evaluation cases across the 12 pilot skills and passes', () => {
    const runRes = runEvalSuites({ rootDir: root, checkOnly: false });
    assert.equal(runRes.ok, true, `Expected evals:run to pass, got: ${runRes.errors.join('; ')}`);
    assert.equal(runRes.summary.suitesExecuted, 12);
    assert.equal(runRes.summary.totalCasesExecuted, 73);
    assert.equal(runRes.summary.passedCases, 73);
    assert.equal(runRes.summary.failedCases, 0);
    assert.equal(runRes.summary.liveModelStatus, 'Not Run');
    assert.equal(runRes.summary.blenderRuntimeStatus, 'Not Run');
  });

  it('supports filtering by --skill and --suite and rejects unknown skill filters', () => {
    const singleSkillRes = runEvalSuites({
      rootDir: root,
      skillFilter: 'recipe-fit-assessor',
      checkOnly: false,
    });
    assert.equal(singleSkillRes.ok, true);
    assert.equal(singleSkillRes.summary.suitesExecuted, 1);
    assert.equal(singleSkillRes.summary.totalCasesExecuted, 5);

    const unknownSkillRes = runEvalSuites({
      rootDir: root,
      suiteFilter: 'non-existent-skill-xyz',
      checkOnly: false,
    });
    assert.equal(unknownSkillRes.ok, false);
    assert.ok(unknownSkillRes.errors.some((e) => e.includes('non-existent-skill-xyz')));
  });

  it('rejects schema violations: extra keys, < 5 cases, unknown routing target, and Artifact status = Not Run', () => {
    const extraKeySuite = loadValidPilotSuite('blendops-help');
    extraKeySuite.unexpectedField = true;
    const errs1 = validateEvalSuiteObject(extraKeySuite, 'blendops-help', catalogSet);
    assert.ok(errs1.some((e) => e.includes('unexpectedField')));

    const tooFewCasesSuite = loadValidPilotSuite('blendops-help');
    tooFewCasesSuite.cases = tooFewCasesSuite.cases.slice(0, 2);
    const errs2 = validateEvalSuiteObject(tooFewCasesSuite, 'blendops-help', catalogSet);
    assert.ok(errs2.some((e) => e.includes('must NOT have fewer than 5 items')));

    const badTargetSuite = loadValidPilotSuite('blendops-help');
    badTargetSuite.cases[0].expectedRoutingTarget = 'fabricated-blender-skill';
    const errs3 = validateEvalSuiteObject(badTargetSuite, 'blendops-help', catalogSet);
    assert.ok(errs3.some((e) => e.includes('fabricated-blender-skill')));

    const badTruthSuite = loadValidPilotSuite('blendops-help');
    badTruthSuite.cases[0].truthStateExpectations.artifactStatus = 'Not Run';
    const errs4 = validateEvalSuiteObject(badTruthSuite, 'blendops-help', catalogSet);
    assert.ok(errs4.some((e) => e.includes('/cases/0/truthStateExpectations/artifactStatus')));
  });

  it('detects behavioral and evidence-before-done regressions in evaluateSingleCase', () => {
    const suite = loadValidPilotSuite('blendops-help');

    // 1. Forbidden output property regression
    const forbiddenCase = structuredClone(suite.cases[0]);
    forbiddenCase.deterministicFixture.simulatedOutput.summary += ' | Blender executed and Artifact: Produced';
    const res1 = evaluateSingleCase(forbiddenCase, { contractsById, allContracts });
    assert.equal(res1.status, 'Failed');
    assert.ok(res1.failures.some((f) => f.includes('forbidden property/overclaim')));

    // 2. Evidence-before-done regression: claiming Verified when existingArtifactEvidence is file-only-unvalidated
    const renderSuite = loadValidPilotSuite('render-export-evidence');
    const unvalidatedCase = structuredClone(renderSuite.cases[2]);
    unvalidatedCase.truthStateExpectations.artifactStatus = 'Verified';
    unvalidatedCase.deterministicFixture.simulatedOutput.artifactStatus = 'Verified';
    const res2 = evaluateSingleCase(unvalidatedCase, { contractsById, allContracts });
    assert.equal(res2.status, 'Failed');
    assert.ok(res2.failures.some((f) => f.includes('Evidence-before-done violation')));

    // 3. Contract routing regression: wrong routingState for contracted skill
    const wrongGateCase = structuredClone(suite.cases[0]);
    wrongGateCase.deterministicFixture.routingState = {
      goalClarity: 'clear',
      recipeSelected: true,
      preflightPassed: true,
      hasStageOrArtifactInventory: true,
    };
    const res3 = evaluateSingleCase(wrongGateCase, { contractsById, allContracts });
    assert.equal(res3.status, 'Failed');
    assert.ok(res3.failures.some((f) => f.includes('Contract activationGate mismatch')));
  });

  it('evaluates structured condition predicates (equals, not_equals, in, all, any) deterministically', () => {
    assert.equal(
      evaluateConditionPredicate(
        {
          all: [
            { field: 'fit.verdict', operator: 'in', value: ['strong_fit', 'partial_fit'] },
            { field: 'brief.locked', operator: 'equals', value: false },
          ],
        },
        { 'fit.verdict': 'strong_fit', 'brief.locked': false },
      ),
      true,
    );
    assert.equal(
      evaluateConditionPredicate(
        {
          any: [
            { field: 'gate.status', operator: 'equals', value: 'failed' },
            { field: 'runtime.mode', operator: 'not_equals', value: 'text-only' },
          ],
        },
        { 'gate.status': 'passed', 'runtime.mode': 'text-only' },
      ),
      false,
    );
  });

  it('reconciles docs/audits/current/* with live repository state while preserving Phase 0 baseline immutably', () => {
    const phase0Baseline = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'phase-0', 'baseline-scorecard.json'), 'utf8'),
    );
    assert.equal(phase0Baseline.commitSha, '3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d');
    assert.equal(phase0Baseline.totals.measuredScore, 54.5);

    const currentScorecard = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'scorecard.json'), 'utf8'),
    );
    const currentFindings = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'findings.json'), 'utf8'),
    );
    const currentSkillInv = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'skill-inventory.json'), 'utf8'),
    );
    const currentEvalInv = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'eval-inventory.json'), 'utf8'),
    );

    assert.equal(currentScorecard.totals.historicalBaselineScore, 54.5);
    assert.equal(currentScorecard.totals.measuredScore, 70.0);
    assert.equal(currentScorecard.methodology.activeZeroCompensationBlockers.length, 0);

    const f01 = currentFindings.findings.find((f) => f.id === 'F-01');
    const f02 = currentFindings.findings.find((f) => f.id === 'F-02');
    const f03 = currentFindings.findings.find((f) => f.id === 'F-03');
    const f04 = currentFindings.findings.find((f) => f.id === 'F-04');
    assert.equal(f01?.currentLifecycleStatus, 'FIXED');
    assert.equal(f02?.currentLifecycleStatus, 'FIXED');
    assert.equal(f03?.currentLifecycleStatus, 'PARTIALLY_FIXED');
    assert.equal(f04?.currentLifecycleStatus, 'PARTIALLY_FIXED');

    assert.equal(currentSkillInv.summary.totalSkills, 48);
    assert.equal(currentSkillInv.summary.contractedSkillsCount, 4);
    assert.equal(currentSkillInv.summary.skillsWithArtifactNotRunContradiction, 0);
    assert.equal(currentEvalInv.summary.machineReadablePilotSuitesCount, 12);
    assert.equal(currentEvalInv.summary.totalMachineReadableCases, 73);
    assert.equal(currentEvalInv.summary.liveModelRunnerStatus, 'Not Run');
    assert.equal(currentEvalInv.summary.blenderRuntimeRunnerStatus, 'Not Run');
  });
});

