import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  validateEvalSuiteObject,
  evaluateSingleCase,
  evaluateConditionPredicate,
  runEvalSuites,
  getCatalogSkillIds,
  loadContractMap,
} from './run-evals.mjs';
import {
  generateCurrentAuditArtifacts,
  computeAuditedInputsDigest,
} from './generate-current-audit.mjs';

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

  it('evaluates all 5 schema-supported condition predicate operators (equals, not_equals, in, not_in, exists) with strict fail-closed semantics', () => {
    // 1. equals matching and non-matching cases (string, number, boolean, strict type)
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'mode', operator: 'equals', value: 'headless' }] },
        { mode: 'headless' },
      ),
      true,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'count', operator: 'equals', value: 3 }] },
        { count: 3 },
      ),
      true,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'count', operator: 'equals', value: 3 }] },
        { count: '3' },
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'ready', operator: 'equals', value: false }] },
        { ready: false },
      ),
      true,
    );

    // 2. not_equals matching and non-matching cases
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'runtime.mode', operator: 'not_equals', value: 'text-only' }] },
        { 'runtime.mode': 'mcp-connected' },
      ),
      true,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'runtime.mode', operator: 'not_equals', value: 'text-only' }] },
        { 'runtime.mode': 'text-only' },
      ),
      false,
    );

    // 3. in matching and non-matching cases
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'fit.verdict', operator: 'in', value: ['strong_fit', 'partial_fit'] }] },
        { 'fit.verdict': 'partial_fit' },
      ),
      true,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'fit.verdict', operator: 'in', value: ['strong_fit', 'partial_fit'] }] },
        { 'fit.verdict': 'poor_fit' },
      ),
      false,
    );

    // 4. not_in matching and non-matching cases
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'stage.status', operator: 'not_in', value: ['blocked', 'failed'] }] },
        { 'stage.status': 'ready' },
      ),
      true,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'stage.status', operator: 'not_in', value: ['blocked', 'failed'] }] },
        { 'stage.status': 'blocked' },
      ),
      false,
    );

    // 5. exists: true when field exists (including falsy scalar values false, 0, "")
    assert.equal(
      evaluateConditionPredicate(
        {
          all: [
            { field: 'brief.locked', operator: 'exists', value: true },
            { field: 'retry.count', operator: 'exists', value: true },
            { field: 'notes.tag', operator: 'exists', value: true },
          ],
        },
        { 'brief.locked': false, 'retry.count': 0, 'notes.tag': '' },
      ),
      true,
    );

    // 6. exists: false when field does not exist
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'artifact.glbPath', operator: 'exists', value: false }] },
        { 'brief.locked': true },
      ),
      true,
    );

    // 7. exists failure when actual existence disagrees with expected boolean
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'artifact.glbPath', operator: 'exists', value: true }] },
        { 'brief.locked': true },
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'brief.locked', operator: 'exists', value: false }] },
        { 'brief.locked': false },
      ),
      false,
    );

    // 8. Missing field behavior for equals, not_equals, in, and not_in (must all fail closed to false!)
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'missing.key', operator: 'equals', value: 'any' }] },
        {},
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'missing.key', operator: 'not_equals', value: 'any' }] },
        {},
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'missing.key', operator: 'in', value: ['a', 'b'] }] },
        {},
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'missing.key', operator: 'not_in', value: ['a', 'b'] }] },
        {},
      ),
      false,
    );

    // 9. Dotted field names treated as literal own properties (not nested traversal or Object.prototype)
    assert.equal(
      evaluateConditionPredicate(
        {
          all: [
            { field: 'fit.verdict', operator: 'equals', value: 'strong_fit' },
            { field: 'brief.locked', operator: 'equals', value: false },
          ],
        },
        { fit: { verdict: 'strong_fit' }, brief: { locked: false } },
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'toString', operator: 'exists', value: true }] },
        {},
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'constructor', operator: 'not_equals', value: 'foo' }] },
        {},
      ),
      false,
    );

    // 10. all and any group evaluation
    assert.equal(
      evaluateConditionPredicate(
        {
          all: [
            { field: 'fit.verdict', operator: 'in', value: ['strong_fit', 'partial_fit'] },
            { field: 'brief.locked', operator: 'equals', value: false },
            { field: 'blocker.code', operator: 'exists', value: false },
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
            { field: 'runtime.mode', operator: 'not_in', value: ['text-only', 'offline'] },
          ],
        },
        { 'gate.status': 'passed', 'runtime.mode': 'mcp-live' },
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

    // 11. Invalid operator / malformed rule / empty group / non-boolean exists value handling (fail closed)
    assert.equal(evaluateConditionPredicate(null, { a: 1 }), false);
    assert.equal(evaluateConditionPredicate({}, { a: 1 }), false);
    assert.equal(evaluateConditionPredicate({ all: [] }, { a: 1 }), false);
    assert.equal(evaluateConditionPredicate({ any: [] }, { a: 1 }), false);
    assert.equal(
      evaluateConditionPredicate(
        {
          all: [{ field: 'a', operator: 'equals', value: 1 }],
          any: [{ field: 'a', operator: 'equals', value: 1 }],
        },
        { a: 1 },
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'a', operator: 'regex_match', value: '.*' }] },
        { a: 'hello' },
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'a', operator: 'exists', value: 'yes' }] },
        { a: 'hello' },
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'a', operator: 'in', value: [] }] },
        { a: 'hello' },
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: 'a', operator: 'not_in', value: 'not-an-array' }] },
        { a: 'hello' },
      ),
      false,
    );
    assert.equal(
      evaluateConditionPredicate(
        { all: [{ field: '', operator: 'equals', value: 'x' }] },
        { '': 'x' },
      ),
      false,
    );
  });

  it('reconciles docs/audits/current/* with accurate auditProvenance, commitChain, and untouched Phase 0 baseline', () => {
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
    const currentManifest = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'verification-manifest.json'), 'utf8'),
    );

    assert.equal(currentScorecard.totals.historicalBaselineScore, 54.5);
    assert.equal(currentScorecard.totals.measuredScore, 70.0);
    assert.equal(currentScorecard.methodology.activeZeroCompensationBlockers.length, 0);

    // Verify commitChain includes all verified commits through Phase 2.2 & Phase 3 (88dc3bd)
    const chainShas = currentManifest.commitChain.map((c) => c.commitSha);
    assert.deepEqual(chainShas, [
      '3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d',
      'd9e70ed0a7191cd8e6f63bcb6d50d9964544e625',
      'ac1ccdb96afe7c52c3064281bd5b0f2dde69468e',
      'f43385a8a07dace4c13ad48cb4d63ca111f3a2ff',
      'b1927ba04bc9ac9c5ca476997ee6da7f8b8f4f78',
      '88dc3bddb6b907a7ca12b213bd988cb5c51659e1',
    ]);

    // Verify explicit auditProvenance on all 5 JSON artifacts and no ambiguous self-referential commitSha
    const liveDigest = computeAuditedInputsDigest(root);
    for (const [label, doc] of [
      ['scorecard.json', currentScorecard],
      ['findings.json', currentFindings],
      ['skill-inventory.json', currentSkillInv],
      ['eval-inventory.json', currentEvalInv],
      ['verification-manifest.json', currentManifest],
    ]) {
      assert.equal(
        Object.hasOwn(doc, 'commitSha'),
        false,
        `${label} must not use ambiguous top-level commitSha; use sourceCommitSha + auditProvenance`,
      );
      assert.ok(doc.auditProvenance, `${label} must include auditProvenance`);
      assert.equal(
        doc.sourceCommitSha,
        '88dc3bddb6b907a7ca12b213bd988cb5c51659e1',
        `${label} sourceCommitSha must record Phase 2.2/3 base commit 88dc3bddb6b907a7ca12b213bd988cb5c51659e1`,
      );
      assert.equal(
        doc.auditProvenance.sourceCommitSha,
        '88dc3bddb6b907a7ca12b213bd988cb5c51659e1',
      );
      assert.equal(doc.auditProvenance.sourceCommitShort, '88dc3bd');
      assert.ok(
        doc.auditProvenance.workingTreeState === 'clean' ||
          doc.auditProvenance.workingTreeState === 'dirty',
      );
      assert.equal(
        doc.auditProvenance.snapshotBasis,
        doc.auditProvenance.workingTreeState === 'clean'
          ? 'clean-committed-tree'
          : 'working-tree-on-top-of-source-commit',
      );
      assert.equal(
        doc.auditProvenance.auditedInputsSha256,
        liveDigest,
        `${label} auditedInputsSha256 must match live audited inputs digest`,
      );
    }

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

  it('scopes generateCurrentAuditArtifacts(rootDir) to isolated repos, detects clean vs dirty workingTreeState, and is deterministic', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-audit-prov-'));
    try {
      // Copy minimal audited input directories into tempDir
      for (const relDir of [
        path.join('docs', 'audits', 'phase-0'),
        'registry',
        'evals',
        'schemas',
        'skills',
      ]) {
        fs.cpSync(path.join(root, relDir), path.join(tempDir, relDir), { recursive: true });
      }

      execFileSync('git', ['init', '-b', 'main'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.name', 'Temp Audit Tester'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: tempDir });
      execFileSync('git', ['add', '.'], { cwd: tempDir });
      execFileSync('git', ['commit', '-m', 'Initial isolated clean snapshot'], { cwd: tempDir });

      const tempHeadSha = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: tempDir,
        encoding: 'utf8',
      }).trim();
      assert.notEqual(
        tempHeadSha,
        '88dc3bddb6b907a7ca12b213bd988cb5c51659e1',
        'Isolated temp repo must have its own distinct commit SHA',
      );

      // 1. Run generator on clean committed tree
      const cleanRun1 = generateCurrentAuditArtifacts(tempDir);
      assert.equal(cleanRun1.currentScorecard.sourceCommitSha, tempHeadSha);
      assert.equal(cleanRun1.currentScorecard.auditProvenance.sourceCommitSha, tempHeadSha);
      assert.equal(cleanRun1.currentScorecard.auditProvenance.workingTreeState, 'clean');
      assert.equal(
        cleanRun1.currentScorecard.auditProvenance.snapshotBasis,
        'clean-committed-tree',
      );

      const scorecardDisk1 = fs.readFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'scorecard.json'),
        'utf8',
      );

      // 2. Re-run generator on unchanged audited inputs -> must be 100% deterministic
      const cleanRun2 = generateCurrentAuditArtifacts(tempDir);
      const scorecardDisk2 = fs.readFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'scorecard.json'),
        'utf8',
      );
      assert.equal(scorecardDisk1, scorecardDisk2);
      assert.equal(
        cleanRun1.currentScorecard.auditProvenance.auditedInputsSha256,
        cleanRun2.currentScorecard.auditProvenance.auditedInputsSha256,
      );

      // 3. Modify a tracked skill file in tempDir without committing -> must detect dirty working tree
      const helpSkillPath = path.join(tempDir, 'skills', 'blendops-help', 'SKILL.md');
      fs.appendFileSync(helpSkillPath, '\n', 'utf8');

      const dirtyRun = generateCurrentAuditArtifacts(tempDir);
      assert.equal(dirtyRun.currentScorecard.sourceCommitSha, tempHeadSha);
      assert.equal(dirtyRun.currentScorecard.auditProvenance.workingTreeState, 'dirty');
      assert.equal(
        dirtyRun.currentScorecard.auditProvenance.snapshotBasis,
        'working-tree-on-top-of-source-commit',
      );
      assert.notEqual(
        dirtyRun.currentScorecard.auditProvenance.auditedInputsSha256,
        cleanRun1.currentScorecard.auditProvenance.auditedInputsSha256,
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

