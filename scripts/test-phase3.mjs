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
  inspectWorkingTreeProvenance,
  resolveAuditedInputFiles,
  AUDITED_INPUTS_MANIFEST_REL,
} from './generate-current-audit.mjs';
import {
  buildMinimalValidGlbBuffer,
  inspectGlbBuffer,
  inspectGlbFile,
  runKhronosGltfValidator,
  GLB_CHUNK_TYPE_JSON,
} from './inspect-glb.mjs';
import { validateEvidencePacket } from './validate-evidence-packet.mjs';
import {
  buildExpectedCapabilityPolicy,
  validateCapabilityPolicyObject,
  evaluateRuntimeCapabilityInvocation,
} from './validate-capability-policy.mjs';
import {
  buildExpectedCompatibilityMatrix,
  validateCompatibilityMatrixObject,
} from './validate-compatibility-matrix.mjs';

const root = process.cwd();
const catalogSet = new Set(getCatalogSkillIds(root));
const { contractsById, allContracts } = loadContractMap(root);

function loadValidPilotSuite(skillId = 'blendops-help') {
  const fullPath = path.join(root, 'evals', 'suites', `${skillId}.eval.json`);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

describe('Phase 3 — Behavioral Evaluation Schema & Deterministic Runner', () => {
  it('validates all 48 catalog evaluation suites (269 cases) via runEvalSuites(--check)', () => {
    const checkRes = runEvalSuites({ rootDir: root, checkOnly: true });
    assert.equal(checkRes.ok, true, `Expected evals:check to pass, got: ${checkRes.errors.join('; ')}`);
    assert.equal(checkRes.summary.machineReadableSuites, 48);
    assert.equal(checkRes.summary.machineReadablePilotSuites, 48);
    assert.equal(checkRes.summary.totalCases, 269);
    assert.equal(checkRes.summary.totalMachineReadableCases, 269);
    assert.equal(checkRes.summary.remainingProseOnlyEvalFiles, 0);
    assert.equal(checkRes.summary.liveModelStatus, 'Not Run');
    assert.equal(checkRes.summary.blenderRuntimeStatus, 'Not Run');
  });

  it('executes all 269 deterministic evaluation cases across all 48 catalog skills and passes', () => {
    const runRes = runEvalSuites({ rootDir: root, checkOnly: false });
    assert.equal(runRes.ok, true, `Expected evals:run to pass, got: ${runRes.errors.join('; ')}`);
    assert.equal(runRes.summary.suitesExecuted, 48);
    assert.equal(runRes.summary.totalCasesExecuted, 269);
    assert.equal(runRes.summary.passedCases, 269);
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

  it('rejects schema violations: extra keys, < 4 cases, unknown routing target, and Artifact status = Not Run', () => {
    const extraKeySuite = loadValidPilotSuite('blendops-help');
    extraKeySuite.unexpectedField = true;
    const errs1 = validateEvalSuiteObject(extraKeySuite, 'blendops-help', catalogSet);
    assert.ok(errs1.some((e) => e.includes('unexpectedField')));

    const tooFewCasesSuite = loadValidPilotSuite('blendops-help');
    tooFewCasesSuite.cases = tooFewCasesSuite.cases.slice(0, 2);
    const errs2 = validateEvalSuiteObject(tooFewCasesSuite, 'blendops-help', catalogSet);
    assert.ok(errs2.some((e) => e.includes('must NOT have fewer than 4 items') || e.includes('at least 4 cases')));

    const badTargetSuite = loadValidPilotSuite('blendops-help');
    badTargetSuite.cases[0].expectedRoutingTarget = 'fabricated-blender-skill';
    const errs3 = validateEvalSuiteObject(badTargetSuite, 'blendops-help', catalogSet);
    assert.ok(errs3.some((e) => e.includes('fabricated-blender-skill')));

    const badTruthSuite = loadValidPilotSuite('blendops-help');
    badTruthSuite.cases[0].truthStateExpectations.artifactStatus = 'Not Run';
    const errs4 = validateEvalSuiteObject(badTruthSuite, 'blendops-help', catalogSet);
    assert.ok(errs4.some((e) => e.includes('/cases/0/truthStateExpectations/artifactStatus') || e.includes('Truth-state law violation')));
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
    assert.equal(currentScorecard.totals.measuredScore, 87.0);
    assert.equal(currentScorecard.methodology.activeZeroCompensationBlockers.length, 0);

    // Verify commitChain includes all verified commits through Phase 8.1.1 (3e72020)
    const chainShas = currentManifest.commitChain.map((c) => c.commitSha);
    assert.deepEqual(chainShas, [
      '3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d',
      'd9e70ed0a7191cd8e6f63bcb6d50d9964544e625',
      'ac1ccdb96afe7c52c3064281bd5b0f2dde69468e',
      'f43385a8a07dace4c13ad48cb4d63ca111f3a2ff',
      'b1927ba04bc9ac9c5ca476997ee6da7f8b8f4f78',
      '88dc3bddb6b907a7ca12b213bd988cb5c51659e1',
      '650f0a5979f1d6b9fea94a0e6378988ef1ab544e',
      '51f76d98d16deef4ed9d8d5991ff59c55ce1d27e',
      'a5ddece28e71d0ce89f6b7a741214f8832d37ee5',
      '75f3b5c8b16b2d7e174d6dba58965da5013cfb5e',
      'f8301a3e39e05bee4da1b8f85f16fb13ff1c6b3e',
      '869462d3b24acc131bd0e63203322b966dc01785',
      '4af8b16aad3bdf1dce4114c479002e0b397f3c99',
      '9ba2d80bc8c77e8dcbd21b8d2298a837c3728c86',
      'defb847b58516afa75f090fd2fa7b066d01e5832',
      '42dadea8d92c384dcd5eae419880d15d4b9ccce4',
      '3e72020fb64af4d5aeadeb942c9cbb0314c11cba',
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
        '3e72020fb64af4d5aeadeb942c9cbb0314c11cba',
        `${label} sourceCommitSha must record Phase 8.1.1 completion base commit 3e72020fb64af4d5aeadeb942c9cbb0314c11cba`,
      );
      assert.equal(
        doc.auditProvenance.sourceCommitSha,
        '3e72020fb64af4d5aeadeb942c9cbb0314c11cba',
      );
      assert.equal(doc.auditProvenance.sourceCommitShort, '3e72020');
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
    const f05 = currentFindings.findings.find((f) => f.id === 'F-05');
    const f06 = currentFindings.findings.find((f) => f.id === 'F-06');
    const f07 = currentFindings.findings.find((f) => f.id === 'F-07');
    const f08 = currentFindings.findings.find((f) => f.id === 'F-08');
    const f09 = currentFindings.findings.find((f) => f.id === 'F-09');
    const f10 = currentFindings.findings.find((f) => f.id === 'F-10');
    assert.equal(f01?.currentLifecycleStatus, 'FIXED');
    assert.equal(f02?.currentLifecycleStatus, 'FIXED');
    assert.equal(f03?.currentLifecycleStatus, 'FIXED');
    assert.equal(f04?.currentLifecycleStatus, 'FIXED');
    assert.equal(f05?.currentLifecycleStatus, 'FIXED');
    assert.equal(f06?.currentLifecycleStatus, 'FIXED');
    assert.equal(f07?.currentLifecycleStatus, 'FIXED');
    assert.equal(f08?.currentLifecycleStatus, 'PARTIALLY_FIXED');
    assert.equal(f09?.currentLifecycleStatus, 'FIXED');
    assert.equal(f10?.currentLifecycleStatus, 'FIXED');

    assert.equal(currentSkillInv.summary.totalSkills, 48);
    assert.equal(currentSkillInv.summary.contractedSkillsCount, 48);
    assert.equal(currentSkillInv.summary.skillsWithArtifactNotRunContradiction, 0);
    assert.equal(currentSkillInv.summary.skillsMissingExtendedTemplateSections, 0);
    assert.equal(currentSkillInv.summary.totalMissingExtendedSectionInstances, 0);
    assert.equal(currentEvalInv.summary.machineReadableSuitesCount, 48);
    assert.equal(currentEvalInv.summary.machineReadablePilotSuitesCount, 48);
    assert.equal(currentEvalInv.summary.totalMachineReadableCases, 269);
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
      fs.writeFileSync(
        path.join(tempDir, AUDITED_INPUTS_MANIFEST_REL),
        JSON.stringify(
          {
            schemaVersion: '1.0.0',
            requiredFiles: [AUDITED_INPUTS_MANIFEST_REL],
            requiredDirectories: [
              'docs/audits/phase-0',
              'registry',
              'evals',
              'schemas',
              'skills',
            ],
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );

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
        '650f0a5979f1d6b9fea94a0e6378988ef1ab544e',
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

  it('Workstream A: accurately classifies Git working-tree changes across all 10 porcelain status scenarios', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-workstream-a-'));
    try {
      // Scenario 10: Non-repository path or Git command failure must fail explicitly, never report clean
      assert.throws(
        () => inspectWorkingTreeProvenance(tempDir),
        /Git command failed|not a git repository/i,
        'Non-Git directory must throw an explicit error rather than reporting clean',
      );

      // Initialize clean repo with both tracked source files and tracked docs/audits/current/* outputs
      fs.mkdirSync(path.join(tempDir, 'skills', 'blendops-help'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'docs', 'audits', 'current'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'skills', 'blendops-help', 'SKILL.md'), '# Help\n', 'utf8');
      fs.writeFileSync(path.join(tempDir, 'skills', 'blendops-help', 'EVAL.md'), '# Eval\n', 'utf8');
      fs.writeFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'scorecard.json'),
        '{"score":70}\n',
        'utf8',
      );
      fs.writeFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'findings.json'),
        '{"findings":[]}\n',
        'utf8',
      );

      execFileSync('git', ['init', '-b', 'main'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.name', 'Temp Audit Tester'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: tempDir });
      execFileSync('git', ['add', '.'], { cwd: tempDir });
      execFileSync('git', ['commit', '-m', 'Initial commit with tracked audit outputs'], {
        cwd: tempDir,
      });

      // Scenario 1: Clean committed repository -> clean, count 0
      const s1 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(s1.workingTreeState, 'clean');
      assert.equal(s1.snapshotBasis, 'clean-committed-tree');
      assert.equal(s1.uncommittedChangeCount, 0);

      // Scenario 2: Modify a tracked source file -> dirty, count 1
      fs.appendFileSync(
        path.join(tempDir, 'skills', 'blendops-help', 'SKILL.md'),
        'updated line\n',
        'utf8',
      );
      const s2 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(s2.workingTreeState, 'dirty');
      assert.equal(s2.snapshotBasis, 'working-tree-on-top-of-source-commit');
      assert.equal(s2.uncommittedChangeCount, 1);
      execFileSync('git', ['checkout', '--', '.'], { cwd: tempDir });

      // Scenario 3: Modify a tracked file under docs/audits/current/ -> excluded from count (clean, 0)
      fs.writeFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'scorecard.json'),
        '{"score":70,"regenerated":true}\n',
        'utf8',
      );
      const s3 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(
        s3.workingTreeState,
        'clean',
        'Unstaged modification to tracked docs/audits/current/scorecard.json must be excluded',
      );
      assert.equal(s3.snapshotBasis, 'clean-committed-tree');
      assert.equal(s3.uncommittedChangeCount, 0);

      // Scenario 4: Modify multiple files including both tracked audit outputs and tracked source files -> only non-excluded changes counted
      fs.writeFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'findings.json'),
        '{"findings":["updated"]}\n',
        'utf8',
      );
      fs.appendFileSync(
        path.join(tempDir, 'skills', 'blendops-help', 'SKILL.md'),
        'mod 1\n',
        'utf8',
      );
      fs.appendFileSync(
        path.join(tempDir, 'skills', 'blendops-help', 'EVAL.md'),
        'mod 2\n',
        'utf8',
      );
      const s4 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(s4.workingTreeState, 'dirty');
      assert.equal(s4.uncommittedChangeCount, 2);
      execFileSync('git', ['checkout', '--', '.'], { cwd: tempDir });

      // Scenario 5: Stage a source change -> counted (and staged docs/audits/current/ change still excluded)
      fs.appendFileSync(
        path.join(tempDir, 'skills', 'blendops-help', 'SKILL.md'),
        'staged mod\n',
        'utf8',
      );
      fs.writeFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'scorecard.json'),
        '{"score":70,"staged":true}\n',
        'utf8',
      );
      execFileSync(
        'git',
        ['add', 'skills/blendops-help/SKILL.md', 'docs/audits/current/scorecard.json'],
        { cwd: tempDir },
      );
      const s5 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(s5.workingTreeState, 'dirty');
      assert.equal(s5.uncommittedChangeCount, 1);
      execFileSync('git', ['reset', '--hard', 'HEAD'], { cwd: tempDir });

      // Scenario 6: Delete a tracked source file -> counted
      fs.unlinkSync(path.join(tempDir, 'skills', 'blendops-help', 'EVAL.md'));
      const s6 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(s6.workingTreeState, 'dirty');
      assert.equal(s6.uncommittedChangeCount, 1);
      execFileSync('git', ['checkout', '--', '.'], { cwd: tempDir });

      // Scenario 7: Add an untracked source file -> counted
      const untrackedSource = path.join(tempDir, 'skills', 'blendops-help', 'NEW.md');
      fs.writeFileSync(untrackedSource, '# New\n', 'utf8');
      const s7 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(s7.workingTreeState, 'dirty');
      assert.equal(s7.uncommittedChangeCount, 1);
      fs.unlinkSync(untrackedSource);

      // Scenario 8: Add an untracked audit output file under docs/audits/current/ -> excluded
      const untrackedAudit = path.join(tempDir, 'docs', 'audits', 'current', 'extra.json');
      fs.writeFileSync(untrackedAudit, '{}\n', 'utf8');
      const s8 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(s8.workingTreeState, 'clean');
      assert.equal(s8.uncommittedChangeCount, 0);
      fs.unlinkSync(untrackedAudit);

      // Scenario 9: Filename with spaces -> parsed and counted accurately as 1 logical path
      const spacedFile = path.join(tempDir, 'skills', 'blendops-help', 'reference with spaces.md');
      fs.writeFileSync(spacedFile, '# Spaced file\n', 'utf8');
      const s9 = inspectWorkingTreeProvenance(tempDir);
      assert.equal(s9.workingTreeState, 'dirty');
      assert.equal(s9.uncommittedChangeCount, 1);
      fs.unlinkSync(spacedFile);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Workstream B: enforces evidence-complete audited-inputs.manifest.json, full evidence path coverage, missing-entry failure, deduplication, and output exclusion', () => {
    const manifestFull = path.join(root, AUDITED_INPUTS_MANIFEST_REL);
    assert.equal(
      fs.existsSync(manifestFull),
      true,
      'docs/audits/audited-inputs.manifest.json must exist on disk',
    );

    const manifest = JSON.parse(fs.readFileSync(manifestFull, 'utf8'));
    assert.ok(Array.isArray(manifest.requiredFiles), 'manifest.requiredFiles must be an array');
    assert.ok(
      Array.isArray(manifest.requiredDirectories),
      'manifest.requiredDirectories must be an array',
    );
    assert.ok(
      manifest.requiredFiles.includes(AUDITED_INPUTS_MANIFEST_REL),
      'manifest must include docs/audits/audited-inputs.manifest.json itself',
    );

    const resolvedFiles = resolveAuditedInputFiles(root);
    const expandedSet = new Set(resolvedFiles);
    assert.equal(
      expandedSet.size,
      resolvedFiles.length,
      'resolveAuditedInputFiles must return a strictly deduplicated file list',
    );

    const scorecard = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'scorecard.json'), 'utf8'),
    );
    const findings = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'findings.json'), 'utf8'),
    );

    const referencedEvidencePaths = new Set();
    for (const pillar of scorecard.pillars || []) {
      for (const p of pillar.evidenceFiles || []) {
        referencedEvidencePaths.add(p);
      }
    }
    for (const finding of findings.findings || []) {
      for (const p of finding.evidencePaths || []) {
        referencedEvidencePaths.add(p);
      }
    }

    for (const evPath of referencedEvidencePaths) {
      const absEv = path.join(root, evPath);
      assert.equal(fs.existsSync(absEv), true, `Referenced evidence path does not exist: ${evPath}`);

      if (evPath === 'docs/audits/current' || evPath.startsWith('docs/audits/current/')) {
        assert.equal(
          expandedSet.has(evPath),
          false,
          `Generated current audit output ${evPath} must be excluded from audited input digest`,
        );
        continue;
      }

      const stat = fs.statSync(absEv);
      if (stat.isDirectory()) {
        const normalizedPrefix = evPath.endsWith('/') ? evPath : `${evPath}/`;
        const hasChildCovered = resolvedFiles.some((f) => f.startsWith(normalizedPrefix));
        assert.equal(
          hasChildCovered,
          true,
          `Referenced evidence directory ${evPath} has no files covered by resolveAuditedInputFiles(root)`,
        );
      } else {
        assert.equal(
          expandedSet.has(evPath),
          true,
          `Referenced evidence file ${evPath} is not covered by resolveAuditedInputFiles(root)`,
        );
      }
    }

    // Verify isolated digest behaviors: missing entry error, deduplication, symlink exclusion, included file sensitivity, and docs/audits/current/* exclusion
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-workstream-b-'));
    try {
      fs.mkdirSync(path.join(tempDir, 'docs', 'audits', 'current'), { recursive: true });
      fs.mkdirSync(path.join(tempDir, 'laws'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Readme v1\n', 'utf8');
      fs.writeFileSync(
        path.join(tempDir, 'laws', 'no-arbitrary-python-interface.md'),
        '# Law v1\n',
        'utf8',
      );
      fs.writeFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'scorecard.json'),
        '{"score":70}\n',
        'utf8',
      );

      const baseManifest = {
        schemaVersion: '1.0.0',
        requiredFiles: [AUDITED_INPUTS_MANIFEST_REL, 'README.md'],
        requiredDirectories: ['laws'],
      };
      fs.writeFileSync(
        path.join(tempDir, AUDITED_INPUTS_MANIFEST_REL),
        JSON.stringify(baseManifest, null, 2) + '\n',
        'utf8',
      );

      const digest1 = computeAuditedInputsDigest(tempDir);
      const digest2 = computeAuditedInputsDigest(tempDir);
      assert.equal(digest1, digest2, 'computeAuditedInputsDigest must be deterministic');

      // Modifying a generated file under docs/audits/current/* must NOT change the digest
      fs.writeFileSync(
        path.join(tempDir, 'docs', 'audits', 'current', 'scorecard.json'),
        '{"score":70,"modified":true}\n',
        'utf8',
      );
      assert.equal(
        computeAuditedInputsDigest(tempDir),
        digest1,
        'Modifying generated docs/audits/current/* files must not change auditedInputsSha256',
      );

      // Modifying an included evidence file MUST change the digest
      fs.writeFileSync(path.join(tempDir, 'README.md'), '# Readme v2\n', 'utf8');
      const digestAfterSourceChange = computeAuditedInputsDigest(tempDir);
      assert.notEqual(
        digestAfterSourceChange,
        digest1,
        'Modifying an included evidence file must change auditedInputsSha256',
      );

      // Overlapping file in both requiredFiles and requiredDirectories must be deduplicated (never double-hashed)
      const listBeforeDup = resolveAuditedInputFiles(tempDir);
      fs.writeFileSync(
        path.join(tempDir, AUDITED_INPUTS_MANIFEST_REL),
        JSON.stringify(
          {
            ...baseManifest,
            requiredFiles: [
              AUDITED_INPUTS_MANIFEST_REL,
              'README.md',
              'README.md',
              'laws/no-arbitrary-python-interface.md',
            ],
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );
      const listWithDup = resolveAuditedInputFiles(tempDir);
      assert.deepEqual(
        listWithDup,
        listBeforeDup,
        'Overlapping and duplicate entries in manifest must resolve to the exact same deduplicated file list',
      );

      // Symlinks inside a traversed directory pointing outside rootDir must be ignored and never read
      const externalFile = path.join(os.tmpdir(), `blendops-ext-${Date.now()}.txt`);
      fs.writeFileSync(externalFile, 'external secret\n', 'utf8');
      try {
        fs.symlinkSync(externalFile, path.join(tempDir, 'laws', 'escape-symlink.md'));
        const listWithSymlink = resolveAuditedInputFiles(tempDir);
        assert.equal(
          listWithSymlink.includes('laws/escape-symlink.md'),
          false,
          'Symlinks inside requiredDirectories must be ignored',
        );
      } finally {
        fs.rmSync(externalFile, { force: true });
      }

      // Missing required file must fail explicitly
      fs.writeFileSync(
        path.join(tempDir, AUDITED_INPUTS_MANIFEST_REL),
        JSON.stringify(
          {
            ...baseManifest,
            requiredFiles: [AUDITED_INPUTS_MANIFEST_REL, 'README.md', 'MISSING_EVIDENCE.md'],
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );
      assert.throws(
        () => computeAuditedInputsDigest(tempDir),
        /Required audited input does not exist: MISSING_EVIDENCE\.md/,
        'Missing required file in manifest must throw an explicit error',
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Workstream E1 (F-07): inspects valid and adversarial GLB 2.0 containers, handles optional Khronos gltf-validator states, and verifies Blender 3.6/4.2/5.1 compatibility docs', async () => {
    const validGlb = buildMinimalValidGlbBuffer();
    const resValid = inspectGlbBuffer(validGlb, { strictPositionBounds: true });
    assert.equal(resValid.valid, true, `Expected valid GLB, got errors: ${resValid.errors.join('; ')}`);
    assert.equal(resValid.header.magic, 'glTF');
    assert.equal(resValid.header.version, 2);
    assert.equal(resValid.header.declaredByteLength, validGlb.byteLength);
    assert.equal(resValid.chunks.hasBinChunk, true);
    assert.equal(resValid.counts.scenes, 1);
    assert.equal(resValid.counts.nodes, 1);
    assert.equal(resValid.counts.meshes, 1);
    assert.equal(resValid.counts.primitives, 1);
    assert.equal(resValid.counts.materials, 1);
    assert.equal(resValid.bounds.positionAccessorCount, 1);
    assert.equal(resValid.bounds.missingPositionBoundsCount, 0);
    assert.deepEqual(resValid.bounds.sceneBoundingBox.min, [0, 0, 0]);
    assert.deepEqual(resValid.bounds.sceneBoundingBox.max, [1, 1, 0]);
    assert.equal(resValid.truthBoundary.provesContainerIntegrity, true);
    assert.equal(resValid.truthBoundary.provesVisualCorrectness, false);
    assert.equal(resValid.truthBoundary.provesBlenderRuntimeExecution, false);

    // Empty and truncated buffers
    assert.equal(inspectGlbBuffer(Buffer.alloc(0)).valid, false);
    assert.equal(inspectGlbBuffer(Buffer.alloc(12)).valid, false);

    // Wrong magic header
    const badMagic = Buffer.from(validGlb);
    badMagic.writeUInt32LE(0x12345678, 0);
    const resMagic = inspectGlbBuffer(badMagic);
    assert.equal(resMagic.valid, false);
    assert.ok(resMagic.errors.some((e) => e.includes('Invalid GLB magic header')));

    // Unsupported version
    const badVer = Buffer.from(validGlb);
    badVer.writeUInt32LE(1, 4);
    const resVer = inspectGlbBuffer(badVer);
    assert.equal(resVer.valid, false);
    assert.ok(resVer.errors.some((e) => e.includes('Unsupported GLB container version')));

    // Declared length mismatch
    const badLen = Buffer.from(validGlb);
    badLen.writeUInt32LE(validGlb.byteLength + 16, 8);
    const resLen = inspectGlbBuffer(badLen);
    assert.equal(resLen.valid, false);
    assert.ok(resLen.errors.some((e) => e.includes('declared length')));

    // Missing POSITION min/max bounds under strictPositionBounds
    const noBoundsGlb = buildMinimalValidGlbBuffer({ includePositionBounds: false });
    const resWarnBounds = inspectGlbBuffer(noBoundsGlb, { strictPositionBounds: false });
    assert.equal(resWarnBounds.valid, true);
    assert.equal(resWarnBounds.bounds.missingPositionBoundsCount, 1);
    const resStrictBounds = inspectGlbBuffer(noBoundsGlb, { strictPositionBounds: true });
    assert.equal(resStrictBounds.valid, false);
    assert.ok(resStrictBounds.errors.some((e) => e.includes('omit required min/max bounds')));

    // NUL byte padding inside Chunk 0 (JSON) must fail (glTF 2.0 requires 0x20 space padding)
    const nulPadded = Buffer.from(validGlb);
    const jsonLen = nulPadded.readUInt32LE(12);
    nulPadded[20 + jsonLen - 1] = 0x00;
    const resNul = inspectGlbBuffer(nulPadded);
    assert.equal(resNul.valid, false);
    assert.ok(resNul.errors.some((e) => e.includes('forbidden NUL (0x00) padding')));

    // File-based inspection + Khronos validator states (unavailable, passed, failed, error)
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-glb-test-'));
    try {
      const glbPath = path.join(tmpDir, 'fixture.glb');
      fs.writeFileSync(glbPath, validGlb);

      const fileResDefault = await inspectGlbFile(glbPath);
      assert.equal(fileResDefault.valid, true);
      assert.equal(fileResDefault.khronosValidator.status, 'not_run');

      const fileResUnavailable = await inspectGlbFile(glbPath, { runKhronos: true });
      assert.equal(fileResUnavailable.valid, true);
      assert.equal(fileResUnavailable.khronosValidator.status, 'unavailable');

      const fileResPassed = await inspectGlbFile(glbPath, {
        runKhronos: true,
        validatorModuleLoader: async () => ({
          validateBytes: async () => ({
            validatorVersion: '2.0.0-mock',
            issues: { numErrors: 0, numWarnings: 1, numInfos: 0, numHints: 0, messages: [] },
          }),
        }),
      });
      assert.equal(fileResPassed.valid, true);
      assert.equal(fileResPassed.khronosValidator.status, 'passed');

      const fileResFailed = await inspectGlbFile(glbPath, {
        runKhronos: true,
        validatorModuleLoader: async () => ({
          validateBytes: async () => ({
            validatorVersion: '2.0.0-mock',
            issues: {
              numErrors: 2,
              numWarnings: 0,
              numInfos: 0,
              numHints: 0,
              messages: [{ code: 'ACCESSOR_MIN_MISMATCH' }],
            },
          }),
        }),
      });
      assert.equal(fileResFailed.valid, false);
      assert.equal(fileResFailed.khronosValidator.status, 'failed');

      const missingFileRes = await inspectGlbFile(path.join(tmpDir, 'does-not-exist.glb'));
      assert.equal(missingFileRes.valid, false);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    // Verify docs/blender-version-compatibility.md covers 3.6 LTS, 4.2 LTS, and 5.1+
    const compatDoc = fs.readFileSync(path.join(root, 'docs', 'blender-version-compatibility.md'), 'utf8');
    for (const requiredTerm of [
      '3.6 LTS',
      '4.2 LTS',
      '5.1+',
      'Subsurface Weight',
      'Specular IOR Level',
      'Coat Weight',
      'Transmission Weight',
      'BLENDER_EEVEE_NEXT',
      'AgX',
      'Khronos PBR Neutral',
      'Path 1',
      'Path 2',
    ]) {
      assert.equal(
        compatDoc.includes(requiredTerm),
        true,
        `docs/blender-version-compatibility.md is missing required term '${requiredTerm}'`,
      );
    }
  });

  it('Workstream E2 (F-07 / Pillar 5): validates runtime & artifact evidence packets and blocks truth-state contradictions', () => {
    const validNotRunPacket = {
      schemaVersion: '1.0.0',
      packetId: 'packet-text-only-default',
      skillId: 'product-hero-scene-planner',
      isStaticFixture: true,
      runtimeEvidence: {
        runtimePath: 'none',
        runtimeStatus: 'Not Run',
        blenderVersion: null,
        addonIdentity: null,
        observedMcpTools: [],
      },
      artifactEvidence: {
        artifactStatus: 'Not Produced',
        artifactType: 'none',
        artifactPath: null,
        byteSize: null,
        sha256: null,
        glbInspection: null,
      },
      validationChecks: {
        framing: 'Not Run',
        lighting: 'Not Run',
        pbrMaterials: 'Not Run',
        polycountAndBudget: 'Not Run',
      },
    };
    assert.equal(
      validateEvidencePacket(validNotRunPacket, { catalogSkillSet: catalogSet }).valid,
      true,
    );

    // 1. Reject Artifact status = Not Run
    const badArtifactNotRun = structuredClone(validNotRunPacket);
    badArtifactNotRun.artifactEvidence.artifactStatus = 'Not Run';
    const res1 = validateEvidencePacket(badArtifactNotRun, { catalogSkillSet: catalogSet });
    assert.equal(res1.valid, false);
    assert.ok(res1.errors.some((e) => e.includes('Not Run')));

    // 2. Reject Path 1 with Blender < 5.1.0 (e.g. 4.2.0) or with Path 2 tool execute_blender_code
    const badPath1Version = structuredClone(validNotRunPacket);
    badPath1Version.runtimeEvidence = {
      runtimePath: 'path-1-host-a',
      runtimeStatus: 'Attempted',
      blenderVersion: '4.2.0',
      addonIdentity: 'bpype/blender_mcp',
      observedMcpTools: ['get_blendfile_summary_datablocks', 'execute_blender_code'],
    };
    const res2 = validateEvidencePacket(badPath1Version, { catalogSkillSet: catalogSet });
    assert.equal(res2.valid, false);
    assert.ok(res2.errors.some((e) => e.includes('>= 5.1.0')));
    assert.ok(res2.errors.some((e) => e.includes('execute_blender_code')));

    // 3. Reject Produced without sha256/byteSize or with invalid GLB container
    const badProduced = structuredClone(validNotRunPacket);
    badProduced.runtimeEvidence = {
      runtimePath: 'path-1-host-b',
      runtimeStatus: 'Produced',
      blenderVersion: '5.1.0',
      addonIdentity: 'bpype/blender_mcp',
      observedMcpTools: ['get_blendfile_summary_datablocks'],
    };
    badProduced.artifactEvidence = {
      artifactStatus: 'Produced',
      artifactType: 'glb',
      artifactPath: 'exports/shoe.glb',
      byteSize: 0,
      sha256: null,
      glbInspection: null,
    };
    const res3 = validateEvidencePacket(badProduced, { catalogSkillSet: catalogSet });
    assert.equal(res3.valid, false);
    assert.ok(res3.errors.some((e) => e.includes('byteSize')));
    assert.ok(res3.errors.some((e) => e.includes('sha256')));
    assert.ok(res3.errors.some((e) => e.includes('glbInspection.valid === true')));

    // 4. Reject Verified when isStaticFixture is true or validationChecks are not Passed
    const validVerifiedLive = {
      schemaVersion: '1.0.0',
      packetId: 'packet-live-verified-glb',
      skillId: 'render-export-evidence',
      isStaticFixture: false,
      runtimeEvidence: {
        runtimePath: 'path-1-host-a',
        runtimeStatus: 'Verified',
        blenderVersion: '5.1.0',
        addonIdentity: 'bpype/blender_mcp@0.1.0',
        observedMcpTools: ['get_blendfile_summary_datablocks', 'get_objects_summary'],
      },
      artifactEvidence: {
        artifactStatus: 'Verified',
        artifactType: 'glb',
        artifactPath: 'exports/shoe-hero.glb',
        byteSize: 1024,
        sha256: 'a'.repeat(64),
        glbInspection: {
          valid: true,
          headerMagic: 'glTF',
          version: 2,
          sceneCount: 1,
          meshCount: 1,
          materialCount: 1,
          khronosStatus: 'passed',
        },
      },
      validationChecks: {
        framing: 'Passed',
        lighting: 'Passed',
        pbrMaterials: 'Passed',
        polycountAndBudget: 'Passed',
      },
    };
    assert.equal(
      validateEvidencePacket(validVerifiedLive, { catalogSkillSet: catalogSet }).valid,
      true,
    );

    const staticClaimingVerified = structuredClone(validVerifiedLive);
    staticClaimingVerified.isStaticFixture = true;
    const res4 = validateEvidencePacket(staticClaimingVerified, { catalogSkillSet: catalogSet });
    assert.equal(res4.valid, false);
    assert.ok(res4.errors.some((e) => e.includes('isStaticFixture: true')));

    const failedCheckClaimingVerified = structuredClone(validVerifiedLive);
    failedCheckClaimingVerified.validationChecks.lighting = 'Warn';
    const res5 = validateEvidencePacket(failedCheckClaimingVerified, { catalogSkillSet: catalogSet });
    assert.equal(res5.valid, false);
    assert.ok(res5.errors.some((e) => e.includes('validationChecks.lighting')));
  });

  it('Workstream E3 (F-10 / Pillar 6): enforces L0-L3 capability tiers, prevents privilege escalation, and blocks mutation when pre-mutation .blend backup fails', () => {
    const policy = buildExpectedCapabilityPolicy(root);
    const valPolicy = validateCapabilityPolicyObject(policy, { rootDir: root });
    assert.equal(valPolicy.valid, true, `Expected valid capability policy, got: ${valPolicy.errors.join('; ')}`);
    assert.equal(policy.defaultCapabilityTier, 'L0');
    assert.equal(policy.skills.length, 48);
    assert.equal(policy.runtimeExecutionState.blenderRuntime, 'Not Run');
    assert.equal(policy.runtimeExecutionState.liveRollbackEngineExecuted, false);

    // 1. Default L0 read-only operation succeeds without backup
    const l0Read = evaluateRuntimeCapabilityInvocation(
      {
        skillId: 'blendops-help',
        requestedOperationTier: 'L0',
        mutatesScene: false,
      },
      policy,
    );
    assert.equal(l0Read.allowed, true);
    assert.equal(l0Read.effectiveGrantedTier, 'L0');

    // 2. Privilege escalation denied: L0 skill (blendops-help) attempting L1 scene mutation
    const l0Escalation = evaluateRuntimeCapabilityInvocation(
      {
        skillId: 'blendops-help',
        requestedOperationTier: 'L1',
        mutatesScene: true,
      },
      policy,
    );
    assert.equal(l0Escalation.allowed, false);
    assert.ok(l0Escalation.errors.some((e) => e.includes('Privilege escalation denied')));

    // 3. L1 scene mutation WITHOUT verified backup is strictly blocked (fail-closed)
    const l1NoBackup = evaluateRuntimeCapabilityInvocation(
      {
        skillId: 'product-hero-scene-planner',
        requestedOperationTier: 'L1',
        mutatesScene: true,
        backupRecord: {
          sourceBlendPath: '/scenes/hero.blend',
          backupPath: '/scenes/hero.pre-product-hero-scene-planner-2026-05-08T00:00:00Z.blend',
          byteSize: 4096,
          sha256: 'b'.repeat(64),
          createdBeforeMutation: true,
          verifiedOnDisk: false, // backup verification failed!
        },
        mutationBoundaries: {
          allowedDatablocks: ['Camera', 'Light'],
          maxObjectsModified: 4,
        },
        recoveryProtocol: {
          restoreFromBackupPath: '/scenes/hero.pre-product-hero-scene-planner-2026-05-08T00:00:00Z.blend',
          postRecoveryVerificationTool: 'get_objects_summary',
          onRecoveryFailure: 'halt-and-report-failed',
        },
      },
      policy,
    );
    assert.equal(l1NoBackup.allowed, false);
    assert.equal(l1NoBackup.mutationBlockedByBackupFailure, true);

    // 4. L1 scene mutation WITH verified backup, boundaries, and recovery protocol succeeds
    const l1Valid = evaluateRuntimeCapabilityInvocation(
      {
        skillId: 'product-hero-scene-planner',
        requestedOperationTier: 'L1',
        mutatesScene: true,
        backupRecord: {
          sourceBlendPath: '/scenes/hero.blend',
          backupPath: '/scenes/hero.pre-product-hero-scene-planner-2026-05-08T00:00:00Z.blend',
          byteSize: 4096,
          sha256: 'b'.repeat(64),
          createdBeforeMutation: true,
          verifiedOnDisk: true,
        },
        mutationBoundaries: {
          allowedDatablocks: ['Camera', 'Light'],
          maxObjectsModified: 4,
        },
        recoveryProtocol: {
          restoreFromBackupPath: '/scenes/hero.pre-product-hero-scene-planner-2026-05-08T00:00:00Z.blend',
          postRecoveryVerificationTool: 'get_objects_summary',
          onRecoveryFailure: 'halt-and-report-failed',
        },
      },
      policy,
    );
    assert.equal(l1Valid.allowed, true);
    assert.equal(l1Valid.mutationBlockedByBackupFailure, false);

    // 5. L2 external asset import requires asset-license-checker clearance & allowlisted output directory
    const l2UnclearLicense = evaluateRuntimeCapabilityInvocation(
      {
        skillId: 'glb-web-handoff',
        requestedOperationTier: 'L2',
        mutatesScene: false,
        exportsFile: true,
        targetOutputPath: '/workspace/exports/hero.glb',
        outputDirectoryAllowlist: ['/workspace/exports'],
        importsExternalAssets: true,
        assetLicenseClearance: {
          status: 'Blocked',
          spdxOrCategory: 'Unknown-Unverified',
          verifiedBySkill: 'asset-license-checker',
        },
      },
      policy,
    );
    assert.equal(l2UnclearLicense.allowed, false);
    assert.ok(l2UnclearLicense.errors.some((e) => e.includes('External asset import blocked')));

    // 6. L3 requires explicit operatorConfirmation and forbids exposing raw Python to the end user
    const l3ExposesPython = evaluateRuntimeCapabilityInvocation(
      {
        skillId: 'cli-appendix-job-outline',
        requestedOperationTier: 'L3',
        mutatesScene: false,
        exposesRawPythonToEndUser: true,
        operatorConfirmation: {
          confirmed: true,
          confirmedBy: 'operator-1',
          scopeSummary: 'Headless CLI batch render',
        },
      },
      policy,
    );
    assert.equal(l3ExposesPython.allowed, false);
    assert.ok(l3ExposesPython.errors.some((e) => e.includes('no-arbitrary-python-interface.md')));
  });

  it('Workstream E4 (F-08 / Pillar 7): validates 26-target compatibility matrix and blocks promoting linked-only targets without empirical evidence', () => {
    const matrix = buildExpectedCompatibilityMatrix();
    const valRes = validateCompatibilityMatrixObject(matrix, { rootDir: root });
    assert.equal(valRes.valid, true, `Expected valid compatibility matrix, got: ${valRes.errors.join('; ')}`);
    assert.equal(matrix.summary.totalInstallTargets, 26);
    assert.equal(matrix.summary.dedicatedAdapterDocs, 6);
    assert.equal(matrix.summary.installOnlyTargets, 20);
    assert.equal(matrix.summary.verifiedReadCount, 2);
    assert.equal(matrix.summary.linkedOnlyCount, 24);
    assert.equal(matrix.summary.verifiedE2eCount, 0);

    // Attempt to promote a linked-only target ('cursor') to verified-read based on docs alone -> must fail
    const promotedCursor = structuredClone(matrix);
    promotedCursor.summary.verifiedReadCount = 3;
    promotedCursor.summary.linkedOnlyCount = 23;
    const cursorEntry = promotedCursor.targets.find((t) => t.id === 'cursor');
    cursorEntry.evidenceLevel = 'verified-read';
    cursorEntry.verificationState = 'Verified Read (Repo-Local)';
    cursorEntry.verificationDate = '2026-05-08';
    cursorEntry.verificationEvidencePath = 'docs/evals/adapter-install-v0-dry-run.md';

    const badPromotionRes = validateCompatibilityMatrixObject(promotedCursor, { rootDir: root });
    assert.equal(badPromotionRes.valid, false);
    assert.ok(
      badPromotionRes.errors.some((e) => e.includes("Unverified promotion blocked for 'cursor'")),
      `Expected unverified promotion error for cursor, got: ${badPromotionRes.errors.join('; ')}`,
    );
  });
});





