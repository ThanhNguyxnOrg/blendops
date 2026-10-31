import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  buildExpectedCompatibilityMatrix,
  validateCompatibilityMatrixObject,
  validateAdapterAndInstallDocsConsistency,
  verifyEvidenceRecordForTarget,
  isValidIsoCalendarDate,
  isSafeRepoSubpath,
} from './validate-compatibility-matrix.mjs';
import { computeAuditedInputsDigest, loadAuditedInputsManifest } from './generate-current-audit.mjs';

const root = process.cwd();

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

describe('Phase 7 — Adapter Empirical Verification & Evidence Integrity (F-08)', () => {
  it('Scenario 1: canonical compatibility matrix preserves 26 targets, 6 dedicated adapter docs, 20 install-only targets, 2 verified-read, 24 linked-only, and 0 verified-e2e', () => {
    const matrix = buildExpectedCompatibilityMatrix();
    const diskMatrix = JSON.parse(
      fs.readFileSync(path.join(root, 'registry', 'compatibility-matrix.json'), 'utf8'),
    );
    assert.deepEqual(diskMatrix, matrix);

    const val = validateCompatibilityMatrixObject(matrix, { rootDir: root });
    assert.equal(val.valid, true, `Expected valid matrix, got errors: ${val.errors.join('; ')}`);

    assert.equal(matrix.summary.totalInstallTargets, 26);
    assert.equal(matrix.summary.dedicatedAdapterDocs, 6);
    assert.equal(matrix.summary.installOnlyTargets, 20);
    assert.equal(matrix.summary.verifiedReadCount, 2);
    assert.equal(matrix.summary.linkedOnlyCount, 24);
    assert.equal(matrix.summary.verifiedE2eCount, 0);
    assert.equal(matrix.promotionPolicy.allowDocOnlyPromotion, false);
    assert.deepEqual(matrix.promotionPolicy.verifiedReadAllowlist, ['claude-code', 'generic-project']);
  });

  it('Scenario 2: Phase 7 empirical verification report exists, separates all 6 evidence categories, inventories all 26 targets, and verifies target-specific evidence matching', () => {
    const reportRel = 'docs/evals/adapter-empirical-verification-phase-7.md';
    const reportAbs = path.join(root, reportRel);
    assert.equal(fs.existsSync(reportAbs), true, `${reportRel} must exist`);

    const reportTxt = fs.readFileSync(reportAbs, 'utf8');
    assert.match(reportTxt, /Runtime status:\s*`Not Run`/);
    assert.match(reportTxt, /Artifact status:\s*`Not Produced`/);

    // Must separate the 6 distinct evidence types
    for (const evidenceType of [
      'Upstream documentation reviewed',
      'Repository-local fixture verified',
      'Empirical host read verified',
      'Native skill-loader verified',
      'MCP integration verified',
      'Blender runtime E2E verified',
    ]) {
      assert.ok(
        reportTxt.includes(evidenceType),
        `Expected ${reportRel} to document evidence category '${evidenceType}'`,
      );
    }

    const matrix = buildExpectedCompatibilityMatrix();
    for (const target of matrix.targets) {
      assert.ok(
        reportTxt.includes(`\`${target.id}\``),
        `Expected ${reportRel} availability table to include target '${target.id}'`,
      );

      const targetWithPhase7Evidence = {
        ...target,
        verificationEvidencePath: reportRel,
      };
      const checkPhase7 = verifyEvidenceRecordForTarget(root, targetWithPhase7Evidence);

      const targetWithDryRunEvidence = {
        ...target,
        verificationEvidencePath: 'docs/evals/adapter-install-v0-dry-run.md',
      };
      const checkDryRun = verifyEvidenceRecordForTarget(root, targetWithDryRunEvidence);

      if (target.id === 'claude-code' || target.id === 'generic-project') {
        assert.equal(
          checkPhase7.ok,
          true,
          `Expected ${target.id} to pass verifyEvidenceRecordForTarget on ${reportRel}: ${checkPhase7.reason}`,
        );
        assert.equal(
          checkDryRun.ok,
          true,
          `Expected ${target.id} to pass verifyEvidenceRecordForTarget on adapter-install-v0-dry-run.md: ${checkDryRun.reason}`,
        );
      } else {
        assert.equal(
          checkPhase7.ok,
          false,
          `Expected linked-only target '${target.id}' to fail verifyEvidenceRecordForTarget on ${reportRel}`,
        );
        assert.equal(
          checkDryRun.ok,
          false,
          `Expected linked-only target '${target.id}' to fail verifyEvidenceRecordForTarget on adapter-install-v0-dry-run.md`,
        );
      }
    }
  });

  it('Scenario 3: disposable /tmp fixture verification for generic-project and claude-code verifies nonce read-back and exact SHA-256 rollback restoration with zero leftover files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-test-phase7-fixture-'));
    try {
      const nonce = 'BLENDOPS-PHASE7-TEST-NONCE-A1B2C3D4';
      const origAgentsContent = '# Existing Project Agents\n\nDo not lose this content.\n';
      const agentsPath = path.join(tmpDir, 'AGENTS.md');
      const backupPath = path.join(tmpDir, 'AGENTS.md.bak');
      const blendopsPath = path.join(tmpDir, 'BLENDOPS.md');

      fs.writeFileSync(agentsPath, origAgentsContent, 'utf8');
      const origHash = sha256(fs.readFileSync(agentsPath));

      // Attach BlendOps project-locally with backup and nonce
      fs.copyFileSync(agentsPath, backupPath);
      const canonicalBlendops = fs.readFileSync(
        path.join(root, 'bundles', 'generic-project-local', 'BLENDOPS.md'),
        'utf8',
      );
      fs.writeFileSync(blendopsPath, `${canonicalBlendops}\n<!-- nonce: ${nonce} -->\n`, 'utf8');
      fs.appendFileSync(
        agentsPath,
        `\n## BlendOps Reference\nSee [BLENDOPS.md](./BLENDOPS.md) (${nonce}).\n`,
        'utf8',
      );

      assert.ok(fs.readFileSync(blendopsPath, 'utf8').includes(nonce));
      assert.ok(fs.readFileSync(agentsPath, 'utf8').includes(nonce));
      assert.notEqual(sha256(fs.readFileSync(agentsPath)), origHash);

      // Rollback
      fs.unlinkSync(blendopsPath);
      fs.copyFileSync(backupPath, agentsPath);
      fs.unlinkSync(backupPath);

      const restoredHash = sha256(fs.readFileSync(agentsPath));
      assert.equal(restoredHash, origHash, 'Rollback must restore exact pre-install SHA-256');
      assert.deepEqual(fs.readdirSync(tmpDir), ['AGENTS.md']);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('Scenario 4: resolves documentation confidence contradictions across docs/install/*, docs/adapters/*, and docs/install/README.md and rejects simulated contradictions', () => {
    const matrix = buildExpectedCompatibilityMatrix();
    const docErrors = validateAdapterAndInstallDocsConsistency(matrix, { rootDir: root });
    assert.deepEqual(docErrors, [], `Expected 0 doc consistency errors, got: ${docErrors.join('; ')}`);

    // Specifically verify cursor.md and codex.md separate upstream doc review from BlendOps empirical status
    const cursorInstall = fs.readFileSync(path.join(root, 'docs/install/cursor.md'), 'utf8');
    assert.match(cursorInstall, /^Status\/confidence:\s*Draft v0,\s*linked-only/m);
    assert.match(cursorInstall, /^Upstream documentation reviewed:\s*Yes/m);
    assert.match(cursorInstall, /^BlendOps empirical verification status:\s*`linked-only`/m);
    assert.equal(/\bverified-read\b/i.test(cursorInstall), false);

    const codexInstall = fs.readFileSync(path.join(root, 'docs/install/codex.md'), 'utf8');
    assert.match(codexInstall, /^Status\/confidence:\s*Draft v0,\s*linked-only/m);
    assert.match(codexInstall, /^Upstream documentation reviewed:\s*Yes/m);
    assert.match(codexInstall, /^BlendOps empirical verification status:\s*`linked-only`/m);
    assert.equal(/\bverified-read\b/i.test(codexInstall), false);

    // Negative check in isolated temp repo: re-introducing 'verified-read' into docs/install/cursor.md or docs/install/README.md fails validation
    const tmpRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase7-doc-drift-'));
    try {
      fs.mkdirSync(path.join(tmpRepo, 'docs', 'install'), { recursive: true });
      fs.mkdirSync(path.join(tmpRepo, 'docs', 'adapters'), { recursive: true });
      for (const f of fs.readdirSync(path.join(root, 'docs', 'install'))) {
        fs.copyFileSync(
          path.join(root, 'docs', 'install', f),
          path.join(tmpRepo, 'docs', 'install', f),
        );
      }
      for (const f of fs.readdirSync(path.join(root, 'docs', 'adapters'))) {
        fs.copyFileSync(
          path.join(root, 'docs', 'adapters', f),
          path.join(tmpRepo, 'docs', 'adapters', f),
        );
      }

      // Contradiction 1: cursor.md claiming verified-read
      const badCursor = cursorInstall.replace(
        /^Status\/confidence:.*$/m,
        'Status/confidence: Draft v0, verified-read for rules + AGENTS.md discovery',
      );
      fs.writeFileSync(path.join(tmpRepo, 'docs', 'install', 'cursor.md'), badCursor, 'utf8');
      const errs1 = validateAdapterAndInstallDocsConsistency(matrix, { rootDir: tmpRepo });
      assert.ok(
        errs1.some((e) => e.includes("docs/install/cursor.md") && e.includes('contradicts')),
        `Expected contradiction error for cursor.md, got: ${errs1.join('; ')}`,
      );
      fs.writeFileSync(path.join(tmpRepo, 'docs', 'install', 'cursor.md'), cursorInstall, 'utf8');

      // Contradiction 2: docs/install/README.md claiming verified-read for codex
      const origReadme = fs.readFileSync(path.join(root, 'docs', 'install', 'README.md'), 'utf8');
      const badReadme = origReadme.replace(
        /(\|\s*Codex CLI\/App\s*\|\s*\[codex\.md\]\(\.\/codex\.md\)\s*\|[^|]+\|[^|]+\|)\s*[^|]+\|/,
        '$1 verified-read (AGENTS.md) |',
      );
      fs.writeFileSync(path.join(tmpRepo, 'docs', 'install', 'README.md'), badReadme, 'utf8');
      const errs2 = validateAdapterAndInstallDocsConsistency(matrix, { rootDir: tmpRepo });
      assert.ok(
        errs2.some((e) => e.includes("docs/install/README.md row for 'codex'")),
        `Expected contradiction error in docs/install/README.md for codex, got: ${errs2.join('; ')}`,
      );
    } finally {
      fs.rmSync(tmpRepo, { recursive: true, force: true });
    }
  });

  it('Scenario 5: rejects promoting Cursor using only its install guide or adapter document', () => {
    const matrix = buildExpectedCompatibilityMatrix();
    matrix.summary.verifiedReadCount = 3;
    matrix.summary.linkedOnlyCount = 23;
    const cursor = matrix.targets.find((t) => t.id === 'cursor');
    cursor.evidenceLevel = 'verified-read';
    cursor.verificationState = 'Verified Read (Repo-Local)';
    cursor.verificationDate = '2026-10-31';
    cursor.verificationEvidencePath = 'docs/install/cursor.md';

    const res = validateCompatibilityMatrixObject(matrix, { rootDir: root });
    assert.equal(res.valid, false);
    assert.ok(
      res.errors.some((e) => e.includes("Unverified promotion blocked for 'cursor'")),
      `Expected unverified promotion error for cursor, got: ${res.errors.join('; ')}`,
    );
    assert.ok(
      res.errors.some((e) => e.includes("must be a normalized Markdown path strictly under docs/evals/")),
      `Expected docs/evals/ path confinement error for docs/install/cursor.md, got: ${res.errors.join('; ')}`,
    );
  });

  it('Scenario 6: rejects promoting Codex using only upstream AGENTS.md documentation', () => {
    const matrix = buildExpectedCompatibilityMatrix();
    matrix.summary.verifiedReadCount = 3;
    matrix.summary.linkedOnlyCount = 23;
    const codex = matrix.targets.find((t) => t.id === 'codex');
    codex.evidenceLevel = 'verified-read';
    codex.verificationState = 'Verified Read (Repo-Local)';
    codex.verificationDate = '2026-10-14';
    codex.verificationEvidencePath = 'docs/adapters/codex.md';

    const res = validateCompatibilityMatrixObject(matrix, { rootDir: root });
    assert.equal(res.valid, false);
    assert.ok(
      res.errors.some((e) => e.includes("Unverified promotion blocked for 'codex'")),
      `Expected unverified promotion error for codex, got: ${res.errors.join('; ')}`,
    );
    assert.ok(
      res.errors.some((e) => e.includes("must be a normalized Markdown path strictly under docs/evals/")),
      `Expected docs/evals/ path confinement error for docs/adapters/codex.md, got: ${res.errors.join('; ')}`,
    );
  });

  it('Scenario 7: rejects promoting a target using the old generic dry-run report or Phase 7 report when that report does not record Pass/verified-read for that target', () => {
    for (const [targetId, reportPath] of [
      ['cursor', 'docs/evals/adapter-install-v0-dry-run.md'],
      ['codex', 'docs/evals/adapter-install-v0-dry-run.md'],
      ['opencode', 'docs/evals/adapter-install-v0-dry-run.md'],
      ['cursor', 'docs/evals/adapter-empirical-verification-phase-7.md'],
      ['codex', 'docs/evals/adapter-empirical-verification-phase-7.md'],
      ['opencode', 'docs/evals/adapter-empirical-verification-phase-7.md'],
    ]) {
      const matrix = buildExpectedCompatibilityMatrix();
      matrix.summary.verifiedReadCount = 3;
      matrix.summary.linkedOnlyCount = 23;
      const entry = matrix.targets.find((t) => t.id === targetId);
      entry.evidenceLevel = 'verified-read';
      entry.verificationState = 'Verified Read (Repo-Local)';
      entry.verificationDate = '2026-10-31';
      entry.verificationEvidencePath = reportPath;

      const res = validateCompatibilityMatrixObject(matrix, { rootDir: root });
      assert.equal(res.valid, false);
      assert.ok(
        res.errors.some((e) =>
          e.includes(`does not record a passing verified-read empirical result for target '${targetId}'`),
        ),
        `Expected target-specific evidence rejection for '${targetId}' on '${reportPath}', got: ${res.errors.join('; ')}`,
      );
    }
  });

  it('Scenario 8: rejects promoting a target without a dedicated adapter document (adapterDocPath: null)', () => {
    // 8a: Promoting an install-only target ('aider') with adapterDocPath: null
    const matrixA = buildExpectedCompatibilityMatrix();
    matrixA.summary.verifiedReadCount = 3;
    matrixA.summary.linkedOnlyCount = 23;
    const aider = matrixA.targets.find((t) => t.id === 'aider');
    aider.evidenceLevel = 'verified-read';
    aider.verificationState = 'Verified Read (Repo-Local)';
    aider.verificationDate = '2026-10-31';
    aider.verificationEvidencePath = 'docs/evals/adapter-empirical-verification-phase-7.md';

    const resA = validateCompatibilityMatrixObject(matrixA, { rootDir: root });
    assert.equal(resA.valid, false);
    assert.ok(
      resA.errors.some((e) => e.includes("Target 'aider' claiming 'verified-read' must have a non-null adapterDocPath")),
      `Expected missing adapterDocPath error for aider, got: ${resA.errors.join('; ')}`,
    );

    // 8b: Removing adapterDocPath from an allowlisted target ('claude-code')
    const matrixB = buildExpectedCompatibilityMatrix();
    const claudeCode = matrixB.targets.find((t) => t.id === 'claude-code');
    claudeCode.adapterDocPath = null;
    const resB = validateCompatibilityMatrixObject(matrixB, { rootDir: root });
    assert.equal(resB.valid, false);
    assert.ok(
      resB.errors.some((e) =>
        e.includes("Target 'claude-code' claiming 'verified-read' must have a non-null adapterDocPath"),
      ),
      `Expected missing adapterDocPath error for claude-code, got: ${resB.errors.join('; ')}`,
    );
  });

  it('Scenario 9: rejects promoting with a missing evidence file under docs/evals/', () => {
    const matrix = buildExpectedCompatibilityMatrix();
    const claudeCode = matrix.targets.find((t) => t.id === 'claude-code');
    claudeCode.verificationEvidencePath = 'docs/evals/non-existent-verification-record.md';

    const res = validateCompatibilityMatrixObject(matrix, { rootDir: root });
    assert.equal(res.valid, false);
    assert.ok(
      res.errors.some((e) =>
        e.includes("must reference an existing verificationEvidencePath under docs/evals/ (missing: docs/evals/non-existent-verification-record.md)"),
      ),
      `Expected missing evidence file error, got: ${res.errors.join('; ')}`,
    );
  });

  it('Scenario 10: rejects promoting with an evidence path outside docs/evals/ or using path traversal', () => {
    const unsafePaths = [
      'README.md',
      'docs/README.md',
      'docs/evals/../README.md',
      'docs/evals/../../README.md',
      '../README.md',
      '/etc/passwd',
      'docs/evals/README.md',
      'docs\\evals\\adapter-install-v0-dry-run.md',
    ];

    for (const badPath of unsafePaths) {
      if (badPath !== 'docs/evals/README.md') {
        assert.equal(
          isSafeRepoSubpath(root, badPath, 'docs/evals'),
          false,
          `Expected isSafeRepoSubpath to reject '${badPath}'`,
        );
      }
      const matrix = buildExpectedCompatibilityMatrix();
      const claudeCode = matrix.targets.find((t) => t.id === 'claude-code');
      claudeCode.verificationEvidencePath = badPath;

      const res = validateCompatibilityMatrixObject(matrix, { rootDir: root });
      assert.equal(res.valid, false, `Expected matrix validation to reject verificationEvidencePath '${badPath}'`);
    }
  });

  it('Scenario 11: rejects malformed or impossible calendar verification dates', () => {
    const invalidDates = [
      '2026-02-30',
      '2026-02-29', // 2026 is not a leap year
      '2026-04-31',
      '2026-13-01',
      '2026-00-15',
      '2026-05-00',
      '2026-05-32',
      '2026/05/08',
      '08-05-2026',
      'not-a-date',
      '',
    ];

    for (const badDate of invalidDates) {
      assert.equal(
        isValidIsoCalendarDate(badDate),
        false,
        `Expected isValidIsoCalendarDate('${badDate}') to be false`,
      );

      const matrix = buildExpectedCompatibilityMatrix();
      const claudeCode = matrix.targets.find((t) => t.id === 'claude-code');
      claudeCode.verificationDate = badDate;

      const res = validateCompatibilityMatrixObject(matrix, { rootDir: root });
      assert.equal(res.valid, false, `Expected matrix validator to reject verificationDate '${badDate}'`);
      assert.ok(
        res.errors.some((e) => e.includes('must record a valid calendar ISO verificationDate')),
        `Expected calendar date error for '${badDate}', got: ${res.errors.join('; ')}`,
      );
    }

    assert.equal(isValidIsoCalendarDate('2026-05-08'), true);
    assert.equal(isValidIsoCalendarDate('2026-10-31'), true);
    assert.equal(isValidIsoCalendarDate('2024-02-29'), true);
  });

  it('Scenario 12: rejects promoting or mutating a target with an unsupported or untested capability', () => {
    // 12a: Unknown capability string
    const matrixUnknown = buildExpectedCompatibilityMatrix();
    const cc1 = matrixUnknown.targets.find((t) => t.id === 'claude-code');
    cc1.availableCapabilities.push('arbitrary-python-execution');
    const resUnknown = validateCompatibilityMatrixObject(matrixUnknown, { rootDir: root });
    assert.equal(resUnknown.valid, false);
    assert.ok(
      resUnknown.errors.some((e) =>
        e.includes("Target 'claude-code' declares unsupported capability 'arbitrary-python-execution'"),
      ),
      `Expected unsupported capability error, got: ${resUnknown.errors.join('; ')}`,
    );

    // 12b: Claiming an unverified schema capability ('mcp-path-1-host-a' or 'skills-zip-upload') on claude-code
    const matrixUnverifiedCap = buildExpectedCompatibilityMatrix();
    const cc2 = matrixUnverifiedCap.targets.find((t) => t.id === 'claude-code');
    cc2.availableCapabilities.push('mcp-path-1-host-a');
    const resUnverifiedCap = validateCompatibilityMatrixObject(matrixUnverifiedCap, { rootDir: root });
    assert.equal(resUnverifiedCap.valid, false);
    assert.ok(
      resUnverifiedCap.errors.some((e) =>
        e.includes("Target 'claude-code' claims unverified or unsupported capability 'mcp-path-1-host-a'"),
      ),
      `Expected unverified capability error, got: ${resUnverifiedCap.errors.join('; ')}`,
    );

    // 12c: Claiming 'project-local-skill-read' on a local LLM runner ('ollama') that only supports docs-only-reference
    const matrixOllamaCap = buildExpectedCompatibilityMatrix();
    const ollama = matrixOllamaCap.targets.find((t) => t.id === 'ollama');
    ollama.availableCapabilities.push('project-local-skill-read');
    const resOllamaCap = validateCompatibilityMatrixObject(matrixOllamaCap, { rootDir: root });
    assert.equal(resOllamaCap.valid, false);
    assert.ok(
      resOllamaCap.errors.some((e) =>
        e.includes("Target 'ollama' claims unverified or unsupported capability 'project-local-skill-read'"),
      ),
      `Expected unverified capability claim rejection on ollama, got: ${resOllamaCap.errors.join('; ')}`,
    );
  });

  it('Scenario 13: docs/audits/current/* records Phase 7 F-08 verification evidence and keeps auditedInputsSha256 synchronized', () => {
    const manifest = loadAuditedInputsManifest(root);
    assert.ok(
      manifest.requiredFiles.includes('scripts/test-phase7.mjs'),
      'audited-inputs.manifest.json must include scripts/test-phase7.mjs',
    );

    const currentFindings = JSON.parse(
      fs.readFileSync(path.join(root, 'docs', 'audits', 'current', 'findings.json'), 'utf8'),
    );
    const f08 = currentFindings.findings.find((f) => f.id === 'F-08');
    assert.ok(f08, 'F-08 must exist in findings.json');
    assert.equal(f08.currentLifecycleStatus, 'PARTIALLY_FIXED');
    assert.ok(
      f08.evidencePaths.includes('docs/evals/adapter-empirical-verification-phase-7.md'),
      'F-08 evidencePaths must include docs/evals/adapter-empirical-verification-phase-7.md',
    );
    assert.ok(
      f08.evidencePaths.includes('scripts/test-phase7.mjs'),
      'F-08 evidencePaths must include scripts/test-phase7.mjs',
    );

    const liveDigest = computeAuditedInputsDigest(root);
    assert.equal(currentFindings.auditProvenance.auditedInputsSha256, liveDigest);
  });
});
