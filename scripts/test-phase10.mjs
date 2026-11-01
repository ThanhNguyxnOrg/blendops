import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  runInstaller,
  parseInstallerArgs,
  detectProjectTargetMarkers,
  validateDestinationRoot,
  validatePlanStoreDirectory,
  validateRollbackManifestSchema,
  recoverPendingTransactionJournal,
  computeBlendOpsSourceFingerprint,
  formatInstallerReport,
  formatInstallerHelp,
  SUPPORTED_TARGETS,
  INSTALLER_VERSION,
  MANAGED_SECTION_START,
  MANAGED_SECTION_END,
} from './install-skills.mjs';

import {
  validateBundleCachePath,
  parseBundleListHeadsOutput,
  inspectAndVerifyBundleFile,
} from './dev-server.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function makeTempDir(prefix = 'blendops-test-phase10-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function assertHonestTruthStates(result) {
  assert.equal(result.runtimeStatus, 'Not Run', 'runtimeStatus must always be Not Run');
  assert.equal(result.artifactStatus, 'Not Produced', 'artifactStatus must always be Not Produced');
  const formatted = formatInstallerReport(result);
  assert.match(formatted, /Target requested:/);
  assert.match(formatted, /Target selected:/);
  assert.match(formatted, /Resolved install mode:/);
  assert.match(formatted, /Runtime status: Not Run/);
  assert.match(formatted, /Artifact status: Not Produced/);
}

test('Scenario 1: --doctor is read-only and reports repository/target readiness without mutating files', () => {
  const tempBase = makeTempDir('blendops-p10-doctor-');
  const projectDir = path.join(tempBase, 'sample-project');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });
  fs.writeFileSync(path.join(projectDir, 'README.md'), '# Sample Project\n', 'utf8');

  try {
    const beforeEntries = fs.readdirSync(projectDir);
    const result = runInstaller(
      ['--doctor', '--target', 'auto', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );

    assert.equal(result.ok, true);
    assert.equal(result.mode, 'doctor');
    assert.equal(result.targetSelected, 'auto');
    assert.equal(result.filesCreated.length, 0);
    assert.equal(result.filesModified.length, 0);
    assert.ok(
      result.limitations.some((l) => l.includes('48 canonical skills verified')),
      'doctor should report 48 canonical skills verified'
    );
    assertHonestTruthStates(result);

    const afterEntries = fs.readdirSync(projectDir);
    assert.deepEqual(afterEntries, beforeEntries, '--doctor must not create or modify any files in projectDir');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 2: --target auto selects generic-project when no markers exist', () => {
  const tempBase = makeTempDir('blendops-p10-auto-none-');
  const projectDir = path.join(tempBase, 'clean-project');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    const detected = detectProjectTargetMarkers(projectDir);
    assert.equal(detected.length, 0);

    const result = runInstaller(
      ['--dry-run', '--target', 'auto', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(result.ok, true);
    assert.equal(result.targetSelected, 'generic-project');
    assert.ok(
      result.limitations.some((l) => l.includes('No tool-specific project markers detected')),
      'should explain fallback to generic-project'
    );
    assertHonestTruthStates(result);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 3: --target auto selects a single confident target when one marker exists', () => {
  const tempBase = makeTempDir('blendops-p10-auto-one-');
  const claudeProject = path.join(tempBase, 'claude-project');
  const cursorProject = path.join(tempBase, 'cursor-project');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(path.join(claudeProject, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(cursorProject, '.cursor'), { recursive: true });

  try {
    const claudeRes = runInstaller(
      ['--dry-run', '--target', 'auto', '--project', claudeProject],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(claudeRes.ok, true);
    assert.equal(claudeRes.targetSelected, 'claude-code');
    assertHonestTruthStates(claudeRes);

    const cursorRes = runInstaller(
      ['--dry-run', '--target', 'auto', '--project', cursorProject],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(cursorRes.ok, true);
    assert.equal(cursorRes.targetSelected, 'cursor');
    assert.ok(
      cursorRes.limitations.some((l) => l.includes("Detected 'cursor' marker") && l.includes('linked-only')),
      'should note linked-only cursor marker and generic fallback'
    );
    assertHonestTruthStates(cursorRes);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 4: --target auto fails closed when multiple target markers exist', () => {
  const tempBase = makeTempDir('blendops-p10-auto-multi-');
  const projectDir = path.join(tempBase, 'multi-marker-project');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(path.join(projectDir, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(projectDir, '.cursor'), { recursive: true });

  try {
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'auto', '--project', projectDir],
          { repoRoot: ROOT, planDir }
        ),
      /Ambiguous target detection: multiple target markers found/
    );
    assert.deepEqual(fs.readdirSync(projectDir).sort(), ['.claude', '.cursor']);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 5: Explicit --target overrides auto-detection even when multiple markers exist', () => {
  const tempBase = makeTempDir('blendops-p10-explicit-override-');
  const projectDir = path.join(tempBase, 'multi-marker-project');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(path.join(projectDir, '.claude'), { recursive: true });
  fs.mkdirSync(path.join(projectDir, '.cursor'), { recursive: true });

  try {
    const result = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(result.ok, true);
    assert.equal(result.targetSelected, 'generic-project');
    assertHonestTruthStates(result);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 6: --target generic-project --dry-run creates zero project files and records a valid plan', () => {
  const tempBase = makeTempDir('blendops-p10-dryrun-');
  const projectDir = path.join(tempBase, 'generic-proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    const result = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(result.ok, true);
    assert.equal(result.mode, 'dry-run');
    assert.deepEqual(fs.readdirSync(projectDir), [], 'dry-run must write zero files inside --project');
    assert.ok(result.planFilePath && fs.existsSync(result.planFilePath), 'dry-run plan file must exist in planDir');
    const savedPlan = JSON.parse(fs.readFileSync(result.planFilePath, 'utf8'));
    assert.equal(savedPlan.selectedTarget, 'generic-project');
    assert.equal(savedPlan.projectPath, fs.realpathSync(projectDir));
    assertHonestTruthStates(result);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 7: --target generic-project --write fails closed before --dry-run', () => {
  const tempBase = makeTempDir('blendops-p10-write-no-dryrun-');
  const projectDir = path.join(tempBase, 'generic-proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: ROOT, planDir }
        ),
      /Write mode refused: no prior --dry-run plan exists/
    );
    assert.deepEqual(fs.readdirSync(projectDir), [], 'failed --write must leave project untouched');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 8: --target generic-project --write succeeds after --dry-run and creates expected files', () => {
  const tempBase = makeTempDir('blendops-p10-write-ok-');
  const projectDir = path.join(tempBase, 'generic-proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    const dryRes = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dryRes.ok, true);

    const writeRes = runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(writeRes.ok, true);
    assert.equal(writeRes.mode, 'write');
    assertHonestTruthStates(writeRes);

    const blendopsMdPath = path.join(projectDir, 'BLENDOPS.md');
    const manifestPath = path.join(projectDir, '.blendops', 'install-manifest.json');
    const reportPath = path.join(projectDir, '.blendops', 'INSTALL_REPORT.md');

    assert.ok(fs.existsSync(blendopsMdPath), 'BLENDOPS.md must be created');
    assert.ok(fs.existsSync(manifestPath), '.blendops/install-manifest.json must be created');
    assert.ok(fs.existsSync(reportPath), '.blendops/INSTALL_REPORT.md must be created');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(manifest.installer_version, INSTALLER_VERSION);
    assert.equal(manifest.target, 'generic-project');
    assert.equal(manifest.runtime_status, 'Not Run');
    assert.equal(manifest.artifact_status, 'Not Produced');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 9 & 10: Existing AGENTS.md is backed up before managed-section patching and re-running --dry-run + --write is idempotent without clobbering original backup', () => {
  const tempBase = makeTempDir('blendops-p10-agents-backup-');
  const projectDir = path.join(tempBase, 'generic-proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  const agentsPath = path.join(projectDir, 'AGENTS.md');
  const originalAgentsContent = '# Project Agents Guide\n\nKeep existing project rules intact.\n';
  fs.writeFileSync(agentsPath, originalAgentsContent, 'utf8');
  const originalSha = sha256File(agentsPath);

  try {
    // First dry-run + write with --patch-agents-md
    const dry1 = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dry1.ok, true);
    assert.equal(sha256File(agentsPath), originalSha, 'dry-run must not modify AGENTS.md');

    const write1 = runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(write1.ok, true);
    assert.ok(write1.filesModified.includes('AGENTS.md'));
    assert.ok(write1.backups.length >= 1, 'backup must be created for AGENTS.md');

    const patchedContent1 = fs.readFileSync(agentsPath, 'utf8');
    assert.ok(patchedContent1.startsWith(originalAgentsContent.trimEnd()));
    assert.ok(patchedContent1.includes(MANAGED_SECTION_START));
    assert.ok(patchedContent1.includes(MANAGED_SECTION_END));

    const backupRel = write1.backups[0].backup_path;
    const backupAbs = path.join(projectDir, backupRel);
    assert.equal(sha256File(backupAbs), originalSha, 'backup must match original AGENTS.md byte-for-byte');

    // Second dry-run + write (idempotency check)
    const dry2 = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dry2.ok, true);

    const write2 = runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(write2.ok, true);
    assert.equal(write2.filesModified.length, 0, 'second write must be a no-op for already-installed files');
    assert.equal(fs.readFileSync(agentsPath, 'utf8'), patchedContent1, 'managed section must not be duplicated');
    assert.equal(sha256File(backupAbs), originalSha, 'original pre-install backup must be preserved across re-runs');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 11: Modifying a target file after --dry-run invalidates the plan and causes --write to fail closed', () => {
  const tempBase = makeTempDir('blendops-p10-stale-plan-');
  const projectDir = path.join(tempBase, 'generic-proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  const agentsPath = path.join(projectDir, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Initial AGENTS.md\n', 'utf8');

  try {
    const dryRes = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dryRes.ok, true);

    // Mutate AGENTS.md after dry-run
    fs.writeFileSync(agentsPath, '# Modified after dry-run\n', 'utf8');

    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
          { repoRoot: ROOT, planDir }
        ),
      /stale dry-run plan/i
    );
    assert.ok(!fs.existsSync(path.join(projectDir, 'BLENDOPS.md')), 'BLENDOPS.md must not be written when plan is stale');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 12: --rollback restores modified files byte-for-byte, removes only installer-owned files, preserves unrelated user data in .blendops, and removes .blendops when empty', () => {
  const tempBase = makeTempDir('blendops-p10-rollback-');
  const projectDir = path.join(tempBase, 'generic-proj');
  const projectWithUserMeta = path.join(tempBase, 'proj-with-user-blendops');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });
  fs.mkdirSync(projectWithUserMeta, { recursive: true });

  const agentsPath = path.join(projectDir, 'AGENTS.md');
  const originalAgentsBytes = Buffer.from('# Custom Team Rules\n\nLine 1\r\nLine 2\n', 'utf8');
  fs.writeFileSync(agentsPath, originalAgentsBytes);
  const originalSha = sha256File(agentsPath);

  try {
    // 12a: Standard project where .blendops has only installer-owned files -> .blendops is removed when empty
    runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    const writeRes = runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(writeRes.ok, true);
    assert.notEqual(sha256File(agentsPath), originalSha);
    assert.ok(fs.existsSync(path.join(projectDir, 'BLENDOPS.md')));

    const rollbackRes = runInstaller(
      ['--rollback', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(rollbackRes.ok, true);
    assert.equal(rollbackRes.mode, 'rollback');
    assertHonestTruthStates(rollbackRes);

    assert.equal(sha256File(agentsPath), originalSha, 'AGENTS.md must be restored byte-for-byte');
    assert.ok(!fs.existsSync(path.join(projectDir, 'BLENDOPS.md')), 'BLENDOPS.md must be removed on rollback');
    assert.ok(!fs.existsSync(path.join(projectDir, '.blendops')), '.blendops directory must be removed when empty after owned files are deleted');

    // 12b: Project where user also has unrelated files/dirs inside .blendops/ -> installer-owned files are removed while user data in .blendops survives
    const agentsPath2 = path.join(projectWithUserMeta, 'AGENTS.md');
    fs.writeFileSync(agentsPath2, originalAgentsBytes);
    const userNotePath = path.join(projectWithUserMeta, '.blendops', 'user-notes.md');
    const userNestedPath = path.join(projectWithUserMeta, '.blendops', 'custom', 'settings.json');
    fs.mkdirSync(path.dirname(userNestedPath), { recursive: true });
    fs.writeFileSync(userNotePath, '# User local notes inside .blendops\n', 'utf8');
    fs.writeFileSync(userNestedPath, '{"preserve":true}\n', 'utf8');

    runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectWithUserMeta, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectWithUserMeta, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );

    const rollbackRes2 = runInstaller(
      ['--rollback', '--project', projectWithUserMeta],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(rollbackRes2.ok, true);
    assert.equal(sha256File(agentsPath2), originalSha);
    assert.ok(!fs.existsSync(path.join(projectWithUserMeta, 'BLENDOPS.md')));
    assert.ok(!fs.existsSync(path.join(projectWithUserMeta, '.blendops', 'install-manifest.json')), 'installer manifest must be removed');
    assert.ok(!fs.existsSync(path.join(projectWithUserMeta, '.blendops', 'INSTALL_REPORT.md')), 'installer report must be removed');
    assert.ok(!fs.existsSync(path.join(projectWithUserMeta, '.blendops', 'backups')), 'empty .blendops/backups must be removed');
    assert.equal(fs.readFileSync(userNotePath, 'utf8'), '# User local notes inside .blendops\n', 'unrelated user file in .blendops must survive rollback');
    assert.equal(fs.readFileSync(userNestedPath, 'utf8'), '{"preserve":true}\n', 'unrelated nested user file in .blendops must survive rollback');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 13: --rollback refuses to overwrite post-install user-modified files unless forced', () => {
  const tempBase = makeTempDir('blendops-p10-rollback-drift-');
  const projectDir = path.join(tempBase, 'generic-proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  const agentsPath = path.join(projectDir, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Original AGENTS\n', 'utf8');
  const originalSha = sha256File(agentsPath);

  try {
    runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );

    // User edits AGENTS.md after install
    const userEditedAgents = fs.readFileSync(agentsPath, 'utf8') + '\n# User added custom post-install section\n';
    fs.writeFileSync(agentsPath, userEditedAgents, 'utf8');

    assert.throws(
      () =>
        runInstaller(
          ['--rollback', '--project', projectDir],
          { repoRoot: ROOT, planDir }
        ),
      /Rollback refused: modified file 'AGENTS\.md' was edited by the user after installation/
    );
    assert.equal(fs.readFileSync(agentsPath, 'utf8'), userEditedAgents, 'user edits must remain untouched');

    // Force rollback succeeds when explicitly requested
    const forcedRollback = runInstaller(
      ['--rollback', '--force-rollback', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(forcedRollback.ok, true);
    assert.equal(sha256File(agentsPath), originalSha, 'forced rollback restores original pre-install backup');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 14: --target claude-code uses project-local CLAUDE.md + BLENDOPS.md attachment and skips .claude/skills/ without claiming native loader verification', () => {
  const tempBase = makeTempDir('blendops-p10-claude-code-');
  const projectDir = path.join(tempBase, 'claude-proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    const dryRes = runInstaller(
      ['--dry-run', '--target', 'claude-code', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dryRes.ok, true);

    const writeRes = runInstaller(
      ['--write', '--target', 'claude-code', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(writeRes.ok, true);
    assertHonestTruthStates(writeRes);

    assert.ok(fs.existsSync(path.join(projectDir, 'BLENDOPS.md')), 'BLENDOPS.md must exist');
    assert.ok(fs.existsSync(path.join(projectDir, 'CLAUDE.md')), 'CLAUDE.md must exist');
    assert.ok(!fs.existsSync(path.join(projectDir, '.claude', 'skills')), '.claude/skills/ must not be written');
    assert.ok(
      writeRes.filesSkipped.some((s) => s.path === '.claude/skills/' && s.reason.includes('unverified')),
      'must skip .claude/skills/ and explain native loader path is unverified'
    );
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 15: --target cursor never writes plain .md into .cursor/rules/; uses BLENDOPS.md fallback by default and writes .cursor/rules/blendops.mdc only with --confirm-target-path', () => {
  const tempBase = makeTempDir('blendops-p10-cursor-');
  const defaultProj = path.join(tempBase, 'cursor-default');
  const confirmedProj = path.join(tempBase, 'cursor-confirmed');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(defaultProj, { recursive: true });
  fs.mkdirSync(confirmedProj, { recursive: true });

  try {
    // Default (without --confirm-target-path): uses BLENDOPS.md fallback
    runInstaller(['--dry-run', '--target', 'cursor', '--project', defaultProj], { repoRoot: ROOT, planDir });
    const defaultWrite = runInstaller(['--write', '--target', 'cursor', '--project', defaultProj], { repoRoot: ROOT, planDir });
    assert.equal(defaultWrite.ok, true);
    assert.ok(fs.existsSync(path.join(defaultProj, 'BLENDOPS.md')));
    assert.ok(!fs.existsSync(path.join(defaultProj, '.cursor', 'rules')), 'default cursor install must not create .cursor/rules');

    // Confirmed (--confirm-target-path): creates .cursor/rules/blendops.mdc with frontmatter, never .md
    runInstaller(
      ['--dry-run', '--target', 'cursor', '--project', confirmedProj, '--confirm-target-path'],
      { repoRoot: ROOT, planDir }
    );
    const confirmedWrite = runInstaller(
      ['--write', '--target', 'cursor', '--project', confirmedProj, '--confirm-target-path'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(confirmedWrite.ok, true);
    const mdcPath = path.join(confirmedProj, '.cursor', 'rules', 'blendops.mdc');
    assert.ok(fs.existsSync(mdcPath), '.cursor/rules/blendops.mdc must be created when --confirm-target-path is set');
    const rulesEntries = fs.readdirSync(path.join(confirmedProj, '.cursor', 'rules'));
    assert.ok(rulesEntries.every((f) => !f.endsWith('.md')), 'never write plain .md into .cursor/rules/');
    const mdcContent = fs.readFileSync(mdcPath, 'utf8');
    assert.match(mdcContent, /^---\ndescription: BlendOps project-local workflow guidance/);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 16: --target codex never claims BLENDOPS.md is auto-read without AGENTS.md; patches/creates AGENTS.md with backup when confirmed', () => {
  const tempBase = makeTempDir('blendops-p10-codex-');
  const defaultProj = path.join(tempBase, 'codex-default');
  const confirmedProj = path.join(tempBase, 'codex-confirmed');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(defaultProj, { recursive: true });
  fs.mkdirSync(confirmedProj, { recursive: true });
  fs.writeFileSync(path.join(confirmedProj, 'AGENTS.md'), '# Existing Codex Instructions\n', 'utf8');

  try {
    // Without confirmation: writes BLENDOPS.md and explicitly warns that Codex does NOT auto-discover BLENDOPS.md
    runInstaller(['--dry-run', '--target', 'codex', '--project', defaultProj], { repoRoot: ROOT, planDir });
    const defaultWrite = runInstaller(['--write', '--target', 'codex', '--project', defaultProj], { repoRoot: ROOT, planDir });
    assert.equal(defaultWrite.ok, true);
    assert.ok(fs.existsSync(path.join(defaultProj, 'BLENDOPS.md')));
    assert.ok(!fs.existsSync(path.join(defaultProj, 'AGENTS.md')));
    assert.ok(
      defaultWrite.limitations.some((l) => l.includes('BLENDOPS.md alone is NOT auto-discovered by Codex')),
      'must explicitly warn that BLENDOPS.md alone is not auto-discovered by Codex without AGENTS.md'
    );

    // With --confirm-target-path: backs up and patches AGENTS.md
    runInstaller(
      ['--dry-run', '--target', 'codex', '--project', confirmedProj, '--confirm-target-path'],
      { repoRoot: ROOT, planDir }
    );
    const confirmedWrite = runInstaller(
      ['--write', '--target', 'codex', '--project', confirmedProj, '--confirm-target-path'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(confirmedWrite.ok, true);
    assert.ok(confirmedWrite.filesModified.includes('AGENTS.md'));
    assert.ok(confirmedWrite.backups.length >= 1, 'must back up existing AGENTS.md before patching');
    const agentsText = fs.readFileSync(path.join(confirmedProj, 'AGENTS.md'), 'utf8');
    assert.ok(agentsText.includes('# Existing Codex Instructions'));
    assert.ok(agentsText.includes(MANAGED_SECTION_START));
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 17: --target opencode, gemini, antigravity, and github-copilot use conservative project-local BLENDOPS.md fallback and never invent unverified native skill-loader directories', () => {
  const tempBase = makeTempDir('blendops-p10-conservative-targets-');
  const planDir = path.join(tempBase, 'plans');
  const conservativeTargets = ['opencode', 'gemini', 'antigravity', 'github-copilot'];

  try {
    for (const target of conservativeTargets) {
      const projDir = path.join(tempBase, `proj-${target}`);
      fs.mkdirSync(projDir, { recursive: true });

      runInstaller(
        ['--dry-run', '--target', target, '--project', projDir, '--confirm-target-path'],
        { repoRoot: ROOT, planDir }
      );
      const writeRes = runInstaller(
        ['--write', '--target', target, '--project', projDir, '--confirm-target-path'],
        { repoRoot: ROOT, planDir }
      );
      assert.equal(writeRes.ok, true, `${target} install should succeed`);
      assertHonestTruthStates(writeRes);

      const entries = fs.readdirSync(projDir).sort();
      assert.deepEqual(
        entries,
        ['.blendops', 'BLENDOPS.md'],
        `${target} must only create .blendops and BLENDOPS.md (no invented native skill directories)`
      );
      assert.ok(
        writeRes.limitations.some((l) => l.includes('linked-only')),
        `${target} must report linked-only status in limitations`
      );
    }
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 18: --target claude-desktop --out <tempDir> generates verified manual upload outputs without claiming UI import or runtime setup', () => {
  const tempBase = makeTempDir('blendops-p10-claude-desktop-');
  const outDir = path.join(tempBase, 'desktop-export');
  const planDir = path.join(tempBase, 'plans');

  try {
    const dryRes = runInstaller(
      ['--dry-run', '--target', 'claude-desktop', '--out', outDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dryRes.ok, true);
    assert.ok(!fs.existsSync(outDir), 'dry-run must not create --out directory');

    const writeRes = runInstaller(
      ['--write', '--target', 'claude-desktop', '--out', outDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(writeRes.ok, true);
    assertHonestTruthStates(writeRes);

    const zipDir = path.join(outDir, 'desktop-zips');
    const skillsDir = path.join(outDir, 'claude-code-skills');
    const manualDir = path.join(outDir, 'claude-desktop-manual');
    const topReadmePath = path.join(outDir, 'README.md');
    const exportManifestPath = path.join(outDir, 'manifest.json');
    const installManifestPath = path.join(outDir, '.blendops', 'install-manifest.json');

    assert.ok(fs.existsSync(zipDir), 'desktop-zips directory must exist');
    assert.ok(fs.existsSync(skillsDir), 'claude-code-skills directory must exist');
    assert.ok(fs.existsSync(manualDir), 'claude-desktop-manual bundle directory must exist');
    assert.ok(fs.existsSync(topReadmePath), 'top-level README.md must exist');
    assert.ok(fs.existsSync(exportManifestPath), 'export manifest.json must exist');
    assert.ok(fs.existsSync(installManifestPath), '.blendops/install-manifest.json must exist');

    const topReadmeText = fs.readFileSync(topReadmePath, 'utf8');
    assert.match(topReadmeText, /Runtime status: `Not Run`/);
    assert.match(topReadmeText, /Artifact status: `Not Produced`/);

    const zipFiles = fs.readdirSync(zipDir).filter((f) => f.endsWith('.zip'));
    assert.equal(zipFiles.length, 48, 'must export all 48 skill ZIP archives');
    assert.ok(
      writeRes.limitations.some((l) => l.includes('Does not automate Claude Desktop UI import')),
      'must include limitation stating it does not automate Claude Desktop UI import'
    );

    // Verify rollback on --out directory
    const rollbackRes = runInstaller(
      ['--rollback', '--out', outDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(rollbackRes.ok, true);
    assert.ok(!fs.existsSync(zipDir), 'desktop-zips must be removed on rollback');
    assert.ok(!fs.existsSync(topReadmePath), 'top-level README.md must be removed on rollback');
    assert.ok(!fs.existsSync(path.join(outDir, '.blendops')), '.blendops must be removed on rollback');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 19: --allow-global and global home-directory destination paths are rejected', () => {
  const tempBase = makeTempDir('blendops-p10-global-reject-');
  const projectDir = path.join(tempBase, 'proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    // 1. --allow-global flag
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--allow-global'],
          { repoRoot: ROOT, planDir }
        ),
      /Global installation \(--allow-global\) is disabled in Phase 10/
    );

    // 2. Home directory and global dot-directories
    const homeDir = os.homedir();
    for (const forbidden of [
      '~',
      homeDir,
      path.join(homeDir, '.claude'),
      path.join(homeDir, '.cursor'),
      '/',
      os.tmpdir(),
    ]) {
      assert.throws(
        () => validateDestinationRoot(forbidden, { kind: 'project', repoRoot: ROOT }),
        /(Global|Unsafe)/
      );
    }
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 20: Symlink escape, hardlinked target files, directory/file type confusion, and path traversal attempts are rejected', () => {
  const tempBase = makeTempDir('blendops-p10-security-');
  const outsideDir = path.join(tempBase, 'outside');
  const projectDir = path.join(tempBase, 'project');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(outsideDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  const outsideSecret = path.join(outsideDir, 'secret.md');
  fs.writeFileSync(outsideSecret, 'TOP SECRET USER FILE\n', 'utf8');

  try {
    // 1. Symlinked --project root
    const symlinkProj = path.join(tempBase, 'symlink-project');
    fs.symlinkSync(projectDir, symlinkProj);
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', symlinkProj],
          { repoRoot: ROOT, planDir }
        ),
      /Refusing symbolic link for --project path/
    );

    // 2. Symlinked BLENDOPS.md inside project pointing outside
    const symlinkBlendops = path.join(projectDir, 'BLENDOPS.md');
    fs.symlinkSync(outsideSecret, symlinkBlendops);
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: ROOT, planDir }
        ),
      /Refusing symbolic link.*BLENDOPS\.md/
    );
    fs.unlinkSync(symlinkBlendops);

    // 3. Hardlinked AGENTS.md pointing to outsideSecret
    const hardlinkAgents = path.join(projectDir, 'AGENTS.md');
    fs.linkSync(outsideSecret, hardlinkAgents);
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
          { repoRoot: ROOT, planDir }
        ),
      /Refusing to modify hardlinked file \(AGENTS\.md/
    );
    fs.unlinkSync(hardlinkAgents);

    // 4. Directory/file type confusion: BLENDOPS.md is a directory
    fs.mkdirSync(symlinkBlendops);
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: ROOT, planDir }
        ),
      /Type confusion: target file path is a directory: BLENDOPS\.md/
    );
    fs.rmdirSync(symlinkBlendops);

    assert.equal(fs.readFileSync(outsideSecret, 'utf8'), 'TOP SECRET USER FILE\n', 'outside file must never be modified');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 21: CLI execution via child_process reports honest truth states across --doctor, --dry-run, --write, --rollback, and diagnostic outputs', () => {
  const tempBase = makeTempDir('blendops-p10-cli-');
  const projectDir = path.join(tempBase, 'cli-proj');
  fs.mkdirSync(projectDir, { recursive: true });
  const scriptPath = path.join(ROOT, 'scripts', 'install-skills.mjs');

  try {
    const doctorOut = execFileSync(
      process.execPath,
      [scriptPath, '--doctor', '--target', 'generic-project', '--project', projectDir],
      { encoding: 'utf8' }
    );
    assert.match(doctorOut, /Runtime status: Not Run/);
    assert.match(doctorOut, /Artifact status: Not Produced/);

    const dryOut = execFileSync(
      process.execPath,
      [scriptPath, '--dry-run', '--target', 'generic-project', '--project', projectDir],
      { encoding: 'utf8' }
    );
    assert.match(dryOut, /Runtime status: Not Run/);
    assert.match(dryOut, /Artifact status: Not Produced/);

    const writeOut = execFileSync(
      process.execPath,
      [scriptPath, '--write', '--target', 'generic-project', '--project', projectDir],
      { encoding: 'utf8' }
    );
    assert.match(writeOut, /Runtime status: Not Run/);
    assert.match(writeOut, /Artifact status: Not Produced/);

    const rollbackOut = execFileSync(
      process.execPath,
      [scriptPath, '--rollback', '--project', projectDir],
      { encoding: 'utf8' }
    );
    assert.match(rollbackOut, /Runtime status: Not Run/);
    assert.match(rollbackOut, /Artifact status: Not Produced/);

    // Error output on stderr also includes Runtime status: Not Run and Artifact status: Not Produced
    let errStderr = '';
    try {
      execFileSync(
        process.execPath,
        [scriptPath, '--allow-global'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
      );
      assert.fail('Expected --allow-global CLI call to exit non-zero');
    } catch (err) {
      errStderr = String(err.stderr || '');
    }
    assert.match(errStderr, /Runtime status: Not Run/);
    assert.match(errStderr, /Artifact status: Not Produced/);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 22: dev-server bundle cache path validation and exact advertised ref set hardening', () => {
  const tempBase = makeTempDir('blendops-p10-devserver-');
  try {
    // 1. Repository paths inside ROOT are rejected
    assert.throws(
      () => validateBundleCachePath(path.join(ROOT, 'README.md'), ROOT),
      /Refusing bundle cache path inside repository root/
    );

    // 2. Existing non-bundle user file is rejected when passed as custom BLENDOPS_BUNDLE_PATH
    const userFile = path.join(tempBase, 'important-notes.txt');
    fs.writeFileSync(userFile, 'do not delete me\n', 'utf8');
    assert.throws(
      () => validateBundleCachePath(userFile, ROOT),
      /Refusing to overwrite existing non-bundle file/
    );
    assert.equal(fs.readFileSync(userFile, 'utf8'), 'do not delete me\n');

    // 3. Symlinked bundle path is rejected
    const symlinkBundle = path.join(tempBase, 'symlink.bundle');
    fs.symlinkSync(userFile, symlinkBundle);
    assert.throws(
      () => validateBundleCachePath(symlinkBundle, ROOT),
      /Refusing symbolic link at bundle cache path/
    );

    // 4. Exact advertised ref set validation rejects duplicate refs
    const headSha = 'f06fce82e5dae19f3ea9449c460e2fe2083c474d';
    const validHeads = `${headSha} HEAD\n${headSha} refs/heads/main\n`;
    const parsedValid = parseBundleListHeadsOutput(validHeads);
    assert.deepEqual(Object.keys(parsedValid).sort(), ['HEAD', 'refs/heads/main']);

    assert.throws(
      () => parseBundleListHeadsOutput(`${headSha} HEAD\n${headSha} HEAD\n`),
      /Duplicate advertised ref/
    );
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 23: --help / -h output, invalid CLI arguments, unknown targets, and zero writes when no valid mode is selected', () => {
  const tempBase = makeTempDir('blendops-p10-help-cli-');
  const projectDir = path.join(tempBase, 'proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });
  const scriptPath = path.join(ROOT, 'scripts', 'install-skills.mjs');

  try {
    // 1. Programmatic --help and -h
    const helpRes = runInstaller(['--help'], { repoRoot: ROOT, planDir });
    assert.equal(helpRes.ok, true);
    assert.equal(helpRes.mode, 'help');
    assert.equal(helpRes.runtimeStatus, 'Not Run');
    assert.equal(helpRes.artifactStatus, 'Not Produced');
    assert.match(helpRes.report, /--target <name>/);
    assert.match(helpRes.report, /--project <path>/);
    assert.match(helpRes.report, /--out <path>/);
    assert.match(helpRes.report, /--doctor/);
    assert.match(helpRes.report, /--dry-run/);
    assert.match(helpRes.report, /--write/);
    assert.match(helpRes.report, /--allow-global/);
    assert.match(helpRes.report, /Runtime status: Not Run/);
    assert.match(helpRes.report, /Artifact status: Not Produced/);

    const shortHelpOut = execFileSync(process.execPath, [scriptPath, '-h'], {
      encoding: 'utf8',
    });
    assert.equal(shortHelpOut, formatInstallerHelp());

    // 2. Invalid CLI arguments, missing mode, conflicting modes, unknown target
    assert.throws(
      () => parseInstallerArgs([]),
      /Missing operation mode/
    );
    assert.throws(
      () => parseInstallerArgs(['--dry-run', '--write', '--target', 'auto', '--project', projectDir]),
      /Conflicting operation modes/
    );
    assert.throws(
      () => parseInstallerArgs(['--unknown-flag']),
      /Unknown or malformed CLI argument: --unknown-flag/
    );
    assert.throws(
      () => parseInstallerArgs(['--dry-run', '--target', 'non-existent-ide', '--project', projectDir]),
      /Unsupported --target 'non-existent-ide'/
    );
    assert.throws(
      () => parseInstallerArgs(['--dry-run', '--target', 'claude-desktop', '--project', projectDir]),
      /Target 'claude-desktop' requires --out <path>/
    );
    assert.throws(
      () => parseInstallerArgs(['--dry-run', '--target', 'generic-project', '--out', projectDir]),
      /Target 'generic-project' requires --project <path>/
    );

    assert.deepEqual(
      fs.readdirSync(projectDir),
      [],
      'failed or help CLI invocations must perform zero writes to projectDir'
    );
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 24: Write mode rejects tampered dry-run plans and plans requesting unsupported global writes', () => {
  const tempBase = makeTempDir('blendops-p10-tampered-plan-');
  const projectDir = path.join(tempBase, 'proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    const dryRes = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dryRes.ok, true);

    // 1. Tamper with operations inside the recorded plan while keeping planHash unchanged
    const rawPlan = JSON.parse(fs.readFileSync(dryRes.planFilePath, 'utf8'));
    const tamperedPlan = {
      ...rawPlan,
      filesToCreate: ['BLENDOPS.md', 'UNEXPECTED.md'],
    };
    fs.writeFileSync(dryRes.planFilePath, JSON.stringify(tamperedPlan, null, 2), 'utf8');

    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: ROOT, planDir }
        ),
      /failed integrity verification \(tampered or invalid plan\)/
    );

    // 2. Plan that claims globalTouched: true or scope: 'global' is rejected immediately
    const globalPlan = {
      ...rawPlan,
      globalTouched: true,
    };
    fs.writeFileSync(dryRes.planFilePath, JSON.stringify(globalPlan, null, 2), 'utf8');

    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: ROOT, planDir }
        ),
      /recorded dry-run plan requests an unsupported global write/
    );

    assert.deepEqual(fs.readdirSync(projectDir), [], 'zero target writes after tampered/global plan rejection');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 25: Malformed manifests, missing sources, Windows-style path edge cases, and blocked rollback metadata creation fail closed with zero target writes', () => {
  const tempBase = makeTempDir('blendops-p10-fail-closed-');
  const projectDir = path.join(tempBase, 'proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    // 1. Windows-style path edge cases
    for (const winBad of ['~\\AppData\\Local', 'C:\\', 'C:/', '\\\\server\\share\\proj']) {
      assert.throws(
        () => validateDestinationRoot(winBad, { kind: 'project', repoRoot: ROOT }),
        /(Global|Unsafe)/
      );
    }

    // Backslash-separated valid path resolves cleanly to projectDir
    const winStyleSubPath = `${tempBase}\\proj`;
    const resolvedWin = validateDestinationRoot(winStyleSubPath, {
      kind: 'project',
      repoRoot: ROOT,
      mustExist: true,
    });
    assert.equal(resolvedWin, fs.realpathSync(projectDir));

    // 2. Failure to create rollback metadata (.blendops is a regular file blocking directory creation) results in zero target writes
    const dryRes = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dryRes.ok, true);

    const blendopsBlocker = path.join(projectDir, '.blendops');
    fs.writeFileSync(blendopsBlocker, 'blocker file\n', 'utf8');

    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: ROOT, planDir }
        ),
      /(Path type confusion: ancestor segment is not a directory|Unsafe \.blendops metadata path)/
    );
    assert.ok(
      !fs.existsSync(path.join(projectDir, 'BLENDOPS.md')),
      'BLENDOPS.md must not be written when rollback metadata cannot be created'
    );
    fs.unlinkSync(blendopsBlocker);

    // 3. Malformed rollback manifest in --rollback mode fails closed
    fs.mkdirSync(path.join(projectDir, '.blendops'), { recursive: true });
    fs.writeFileSync(
      path.join(projectDir, '.blendops', 'install-manifest.json'),
      '{not-valid-json',
      'utf8'
    );
    assert.throws(
      () => runInstaller(['--rollback', '--project', projectDir], { repoRoot: ROOT, planDir }),
      /malformed rollback manifest JSON/
    );
    fs.writeFileSync(
      path.join(projectDir, '.blendops', 'install-manifest.json'),
      JSON.stringify({ invalid: true }),
      'utf8'
    );
    assert.throws(
      () => runInstaller(['--rollback', '--project', projectDir], { repoRoot: ROOT, planDir }),
      /invalid rollback manifest schema/
    );

    // 4. Missing sources and malformed bundle manifests in repoRoot fail closed
    const fakeRepo = path.join(tempBase, 'fake-repo');
    fs.mkdirSync(fakeRepo, { recursive: true });
    assert.throws(
      () => computeBlendOpsSourceFingerprint(fakeRepo),
      /Missing required BlendOps source file/
    );

    fs.mkdirSync(path.join(fakeRepo, 'bundles', 'generic-project-local'), { recursive: true });
    fs.mkdirSync(path.join(fakeRepo, 'bundles', 'claude-desktop-manual'), { recursive: true });
    fs.mkdirSync(path.join(fakeRepo, 'scripts'), { recursive: true });
    fs.writeFileSync(path.join(fakeRepo, 'bundles', 'generic-project-local', 'BLENDOPS.md'), '# test\n');
    fs.writeFileSync(path.join(fakeRepo, 'bundles', 'generic-project-local', 'ROLLBACK.md'), '# test\n');
    fs.writeFileSync(path.join(fakeRepo, 'bundles', 'generic-project-local', 'INSTALL_REPORT_TEMPLATE.md'), '# test\n');
    fs.writeFileSync(path.join(fakeRepo, 'bundles', 'generic-project-local', 'manifest.json'), '{bad json');
    fs.writeFileSync(path.join(fakeRepo, 'bundles', 'claude-desktop-manual', 'manifest.json'), '{}');
    fs.writeFileSync(path.join(fakeRepo, 'scripts', 'export-claude-skills.mjs'), '// exporter\n');

    assert.throws(
      () => computeBlendOpsSourceFingerprint(fakeRepo),
      /Malformed JSON in BlendOps source manifest/
    );
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 26: Current-state audit artifacts record active auditPhase phase-12-current (forbidding stale phase-10-current) and preserve F-08 = PARTIALLY_FIXED and F-09 = FIXED', () => {
  const scorecard = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'audits', 'current', 'scorecard.json'), 'utf8')
  );
  const findings = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'audits', 'current', 'findings.json'), 'utf8')
  );
  const skillInventory = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'audits', 'current', 'skill-inventory.json'), 'utf8')
  );
  const evalInventory = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'audits', 'current', 'eval-inventory.json'), 'utf8')
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'audits', 'current', 'verification-manifest.json'), 'utf8')
  );

  for (const doc of [scorecard, findings, skillInventory, evalInventory, manifest]) {
    assert.equal(doc.auditPhase, 'phase-12-current');
    assert.notEqual(doc.auditPhase, 'phase-10-current');
  }

  const f08 = findings.findings.find((f) => f.id === 'F-08');
  const f09 = findings.findings.find((f) => f.id === 'F-09');
  assert.equal(f08.currentLifecycleStatus, 'PARTIALLY_FIXED', 'F-08 must remain PARTIALLY_FIXED until 24 linked-only adapters receive live host verification');
  assert.equal(f09.currentLifecycleStatus, 'FIXED', 'F-09 must remain FIXED');
  assert.equal(manifest.truthStates.liveModelEval, 'Not Run');
  assert.equal(manifest.truthStates.blenderRuntimeExecution, 'Not Run');
  assert.equal(manifest.truthStates.blenderArtifacts, 'Not Produced');
});

function createMinimalFixtureRepo(baseDir) {
  const repoDir = path.join(baseDir, 'fixture-repo');
  fs.mkdirSync(repoDir, { recursive: true });
  for (const rel of [
    'skills',
    'laws',
    'packs',
    'bundles/generic-project-local',
    'bundles/claude-desktop-manual',
    'scripts',
  ]) {
    const src = path.join(ROOT, rel);
    const dest = path.join(repoDir, rel);
    if (rel === 'scripts') {
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(
        path.join(src, 'export-claude-skills.mjs'),
        path.join(dest, 'export-claude-skills.mjs'),
      );
    } else {
      fs.cpSync(src, dest, { recursive: true });
    }
  }
  return repoDir;
}

test('Scenario 27 (Phase 10.1 P1): Claude Desktop export never deletes pre-existing --out directories, stages output safely, rejects destinations created after --dry-run, and cleans up aborted staging', () => {
  const tempBase = makeTempDir('blendops-p10-1-cd-safety-');
  const planDir = path.join(tempBase, 'plans');

  try {
    // 1. Pre-existing non-empty --out directory is rejected during --dry-run and user files survive untouched
    const existingOut = path.join(tempBase, 'existing-user-out');
    fs.mkdirSync(existingOut, { recursive: true });
    const preciousFile = path.join(existingOut, 'precious-work.blend.txt');
    fs.writeFileSync(preciousFile, 'DO NOT DELETE USER WORK\n', 'utf8');

    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'claude-desktop', '--out', existingOut],
          { repoRoot: ROOT, planDir }
        ),
      /Refusing to use existing --out destination/
    );
    assert.equal(
      fs.readFileSync(preciousFile, 'utf8'),
      'DO NOT DELETE USER WORK\n',
      'existing user file in --out must remain untouched when --dry-run rejects existing destination'
    );

    // 2. Destination created after --dry-run before --write is rejected and user files survive untouched
    const raceOut = path.join(tempBase, 'race-out');
    const dryRace = runInstaller(
      ['--dry-run', '--target', 'claude-desktop', '--out', raceOut],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(dryRace.ok, true);

    fs.mkdirSync(raceOut, { recursive: true });
    const raceUserFile = path.join(raceOut, 'created-after-dryrun.txt');
    fs.writeFileSync(raceUserFile, 'USER CREATED AFTER DRY RUN\n', 'utf8');

    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'claude-desktop', '--out', raceOut],
          { repoRoot: ROOT, planDir }
        ),
      /was created after --dry-run was recorded \(stale dry-run plan\); refusing to overwrite existing destination/
    );
    assert.equal(
      fs.readFileSync(raceUserFile, 'utf8'),
      'USER CREATED AFTER DRY RUN\n',
      'user file created after --dry-run must never be deleted by --write'
    );
    assert.deepEqual(fs.readdirSync(raceOut), ['created-after-dryrun.txt']);

    // 3. Direct invocation of export-claude-skills.mjs against a non-empty --output-root refuses to delete user files
    const exporterScript = path.join(ROOT, 'scripts', 'export-claude-skills.mjs');
    assert.throws(
      () =>
        execFileSync(process.execPath, [exporterScript, '--output-root', existingOut], {
          cwd: ROOT,
          stdio: 'pipe',
        }),
      /refusing to overwrite non-empty directory/i
    );
    assert.equal(
      fs.readFileSync(preciousFile, 'utf8'),
      'DO NOT DELETE USER WORK\n',
      'export-claude-skills.mjs must never delete files in a non-empty --output-root'
    );

    // 4. Failed staging export cleans up only the temporary staging directory and never creates --out
    const brokenRepo = createMinimalFixtureRepo(tempBase);
    const brokenOutParent = path.join(tempBase, 'staging-cleanup-parent');
    fs.mkdirSync(brokenOutParent, { recursive: true });
    const siblingKeepFile = path.join(brokenOutParent, 'keep-sibling.txt');
    fs.writeFileSync(siblingKeepFile, 'keep me\n', 'utf8');
    const brokenOut = path.join(brokenOutParent, 'failed-export-dest');

    const dryBroken = runInstaller(
      ['--dry-run', '--target', 'claude-desktop', '--out', brokenOut],
      { repoRoot: brokenRepo, planDir }
    );
    assert.equal(dryBroken.ok, true);

    // Corrupt bundles/claude-desktop-manual/IMPORT_STEPS.md after dry-run? Wait: that would trigger sourceFingerprint mismatch before executeWriteClaudeDesktopPlan!
    // To fail inside executeWriteClaudeDesktopPlan during staging verification, let's make export-claude-skills.mjs write an invalid skillCount in manifest.json? Wait: export-claude-skills.mjs is hashed in sourceFingerprint!
    // What if a directory with the same name as outReal is created by a custom exporter? No, what if parentDir becomes read-only or we check that after normal write zero staging directories exist, and if staging fails (e.g., if we test executeWriteClaudeDesktopPlan failure by creating outReal via a race or making a non-hashed path fail)?
    // Wait: during executeWriteClaudeDesktopPlan, node_modules is resolved from repoRootReal! In brokenRepo, node_modules does NOT exist unless linked, or if fflate is resolved from ROOT/node_modules. What if we place a broken fflate inside brokenRepo/node_modules/fflate/package.json so export-claude-skills.mjs fails when executed in brokenRepo (since node_modules is not in sourceFingerprint)?
    const fakeFflateDir = path.join(brokenRepo, 'node_modules', 'fflate');
    fs.mkdirSync(fakeFflateDir, { recursive: true });
    fs.writeFileSync(path.join(fakeFflateDir, 'package.json'), '{"name":"fflate","main":"./missing.js"}\n', 'utf8');

    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'claude-desktop', '--out', brokenOut],
          { repoRoot: brokenRepo, planDir }
        )
    );
    assert.ok(!fs.existsSync(brokenOut), 'failed staging export must not publish --out');
    assert.deepEqual(
      fs.readdirSync(brokenOutParent),
      ['keep-sibling.txt'],
      'failed staging export must clean up temporary staging directory and preserve sibling files'
    );
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 28 (Phase 10.1 P1): Ownership-aware rollback verifies backup and metadata hashes before deletion and refuses to delete modified backups or unowned files', () => {
  const tempBase = makeTempDir('blendops-p10-1-rollback-own-');
  const projectDir = path.join(tempBase, 'proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  const agentsPath = path.join(projectDir, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Original Team AGENTS\n', 'utf8');

  try {
    runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );

    const backupPath = path.join(projectDir, '.blendops', 'backups', 'AGENTS.md.bak');
    const reportPath = path.join(projectDir, '.blendops', 'INSTALL_REPORT.md');
    const origBackupBytes = fs.readFileSync(backupPath);
    const origReportBytes = fs.readFileSync(reportPath);

    // 1. Corrupting backup file causes rollback to fail closed (even with --force-rollback) without deleting the backup
    fs.writeFileSync(backupPath, '# Tampered backup content\n', 'utf8');
    assert.throws(
      () => runInstaller(['--rollback', '--project', projectDir], { repoRoot: ROOT, planDir }),
      /backup file '\.blendops\/backups\/AGENTS\.md\.bak' failed SHA-256 integrity verification/
    );
    assert.throws(
      () => runInstaller(['--rollback', '--force-rollback', '--project', projectDir], { repoRoot: ROOT, planDir }),
      /backup file '\.blendops\/backups\/AGENTS\.md\.bak' failed SHA-256 integrity verification/
    );
    assert.ok(fs.existsSync(backupPath), 'tampered backup file must not be deleted');
    fs.writeFileSync(backupPath, origBackupBytes);

    // 2. Modifying .blendops/INSTALL_REPORT.md causes rollback to refuse deletion and report the exact path
    fs.writeFileSync(reportPath, '# User edited install report\n', 'utf8');
    assert.throws(
      () => runInstaller(['--rollback', '--project', projectDir], { repoRoot: ROOT, planDir }),
      /installer metadata file '\.blendops\/INSTALL_REPORT\.md' was modified and failed SHA-256 verification/
    );
    assert.ok(fs.existsSync(reportPath), 'modified INSTALL_REPORT.md must not be deleted');
    fs.writeFileSync(reportPath, origReportBytes);

    // 3. Unowned file inside .blendops/backups/ is preserved when rollback succeeds
    const unownedBackup = path.join(projectDir, '.blendops', 'backups', 'user-manual-snapshot.bak');
    fs.writeFileSync(unownedBackup, 'user snapshot\n', 'utf8');

    const rollbackOk = runInstaller(['--rollback', '--project', projectDir], { repoRoot: ROOT, planDir });
    assert.equal(rollbackOk.ok, true);
    assert.ok(!fs.existsSync(backupPath), 'verified installer backup must be removed');
    assert.ok(fs.existsSync(unownedBackup), 'unowned file in .blendops/backups must be preserved');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 29 (Phase 10.1 P1): Rollback requires complete integrity metadata and rejects missing hashes, malformed digests, duplicate/overlapping entries, and unsafe paths even with --force-rollback', () => {
  const tempBase = makeTempDir('blendops-p10-1-manifest-schema-');
  const projectDir = path.join(tempBase, 'proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  const agentsPath = path.join(projectDir, 'AGENTS.md');
  fs.writeFileSync(agentsPath, '# Original AGENTS\n', 'utf8');

  try {
    runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );

    const manifestPath = path.join(projectDir, '.blendops', 'install-manifest.json');
    const validManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const invalidManifestCases = [
      {
        name: 'missing created_file_hashes entry for files_created item',
        mutate: (m) => {
          delete m.created_file_hashes['BLENDOPS.md'];
        },
        pattern: /missing or invalid SHA-256 hash in created_file_hashes for 'BLENDOPS\.md'/,
      },
      {
        name: 'malformed non-hex digest in created_file_hashes',
        mutate: (m) => {
          m.created_file_hashes['BLENDOPS.md'] = 'not-a-valid-sha256-digest';
        },
        pattern: /missing or invalid SHA-256 hash in created_file_hashes for 'BLENDOPS\.md'/,
      },
      {
        name: 'missing post_install_sha256 in modified_file_hashes',
        mutate: (m) => {
          delete m.modified_file_hashes['AGENTS.md'].post_install_sha256;
        },
        pattern: /missing or invalid post_install_sha256 for 'AGENTS\.md'/,
      },
      {
        name: 'overlapping entry in both files_created and files_modified',
        mutate: (m) => {
          m.files_created.push('AGENTS.md');
          m.created_file_hashes['AGENTS.md'] = m.modified_file_hashes['AGENTS.md'].post_install_sha256;
        },
        pattern: /overlapping path 'AGENTS\.md' present in both files_created and files_modified/,
      },
      {
        name: 'duplicate entry in files_created',
        mutate: (m) => {
          m.files_created.push('BLENDOPS.md');
        },
        pattern: /duplicate files_created entry 'BLENDOPS\.md'/,
      },
      {
        name: 'path traversal in files_created',
        mutate: (m) => {
          m.files_created.push('../outside.md');
          m.created_file_hashes['../outside.md'] = 'a'.repeat(64);
        },
        pattern: /path traversal or empty segment in manifest/,
      },
      {
        name: 'internal .blendops path injected into files_created',
        mutate: (m) => {
          m.files_created.push('.blendops/user-file.txt');
          m.created_file_hashes['.blendops/user-file.txt'] = 'a'.repeat(64);
        },
        pattern: /cannot reference internal \.blendops metadata directory/,
      },
      {
        name: 'inconsistent backups array vs files_modified',
        mutate: (m) => {
          m.backups = [];
        },
        pattern: /inconsistent backups array length/,
      },
    ];

    for (const tc of invalidManifestCases) {
      const candidate = structuredClone(validManifest);
      tc.mutate(candidate);
      fs.writeFileSync(manifestPath, JSON.stringify(candidate, null, 2), 'utf8');

      assert.throws(
        () => validateRollbackManifestSchema(candidate, manifestPath),
        tc.pattern,
        `Expected schema validator to reject: ${tc.name}`
      );
      assert.throws(
        () =>
          runInstaller(
            ['--rollback', '--force-rollback', '--project', projectDir],
            { repoRoot: ROOT, planDir }
          ),
        tc.pattern,
        `Expected --rollback --force-rollback to fail closed on: ${tc.name}`
      );
    }

    // Restore valid manifest and verify nothing was deleted during failed checks
    fs.writeFileSync(manifestPath, JSON.stringify(validManifest, null, 2), 'utf8');
    assert.ok(fs.existsSync(path.join(projectDir, 'BLENDOPS.md')));
    assert.ok(fs.existsSync(agentsPath));
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 30 (Phase 10.1 P2): Source fingerprinting hashes all skill files, references, and bundle files recursively and rejects symlinks in the source tree', () => {
  const tempBase = makeTempDir('blendops-p10-1-fingerprint-');
  const projectDir = path.join(tempBase, 'proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    const fixtureRepo = createMinimalFixtureRepo(tempBase);
    const baseInfo = computeBlendOpsSourceFingerprint(fixtureRepo);
    assert.equal(baseInfo.skillCount, 48);
    assert.ok(baseInfo.sourceFileCount > 250, 'must hash all recursive skill and bundle files');

    // 1. Modifying a skill SKILL.md changes the fingerprint and invalidates a prior --dry-run plan
    const dryRes = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir],
      { repoRoot: fixtureRepo, planDir }
    );
    assert.equal(dryRes.ok, true);

    const helpSkillMd = path.join(fixtureRepo, 'skills', 'blendops-help', 'SKILL.md');
    const origHelpMd = fs.readFileSync(helpSkillMd, 'utf8');
    fs.writeFileSync(helpSkillMd, `${origHelpMd}\n<!-- fingerprint test edit -->\n`, 'utf8');

    const afterSkillEdit = computeBlendOpsSourceFingerprint(fixtureRepo);
    assert.notEqual(afterSkillEdit.fingerprint, baseInfo.fingerprint, 'SKILL.md edit must change fingerprint');

    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: fixtureRepo, planDir }
        ),
      /BlendOps source files changed since --dry-run was recorded/
    );
    fs.writeFileSync(helpSkillMd, origHelpMd, 'utf8');
    assert.equal(computeBlendOpsSourceFingerprint(fixtureRepo).fingerprint, baseInfo.fingerprint);

    // 2. Modifying a skill EVAL.md changes the fingerprint
    const helpEvalMd = path.join(fixtureRepo, 'skills', 'blendops-help', 'EVAL.md');
    const origEvalMd = fs.readFileSync(helpEvalMd, 'utf8');
    fs.writeFileSync(helpEvalMd, `${origEvalMd}\n<!-- eval edit -->\n`, 'utf8');
    assert.notEqual(computeBlendOpsSourceFingerprint(fixtureRepo).fingerprint, baseInfo.fingerprint);
    fs.writeFileSync(helpEvalMd, origEvalMd, 'utf8');

    // 3. Modifying a nested skill reference file changes the fingerprint
    const refFile = path.join(
      fixtureRepo,
      'bundles',
      'claude-desktop-manual',
      'references',
      'skills',
      'blendops-help.md'
    );
    const origRef = fs.readFileSync(refFile, 'utf8');
    fs.writeFileSync(refFile, `${origRef}\n<!-- bundle ref edit -->\n`, 'utf8');
    assert.notEqual(computeBlendOpsSourceFingerprint(fixtureRepo).fingerprint, baseInfo.fingerprint);
    fs.writeFileSync(refFile, origRef, 'utf8');

    // 4. Symlink inside skills/ or bundles/ fails closed
    const rogueSymlink = path.join(fixtureRepo, 'skills', 'blendops-help', 'rogue-link.md');
    fs.symlinkSync(helpSkillMd, rogueSymlink);
    assert.throws(
      () => computeBlendOpsSourceFingerprint(fixtureRepo),
      /Unsafe symbolic link in BlendOps source tree/
    );
    fs.unlinkSync(rogueSymlink);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 31 (Phase 10.1 P2): Public CLI rejects --plan-dir and programmatic planDir enforces strict path and file safety', () => {
  const tempBase = makeTempDir('blendops-p10-1-plandir-');
  const projectDir = path.join(tempBase, 'proj');
  fs.mkdirSync(projectDir, { recursive: true });

  try {
    // 1. Public CLI rejects --plan-dir and --plan-dir=...
    assert.throws(
      () => parseInstallerArgs(['--dry-run', '--target', 'generic-project', '--project', projectDir, '--plan-dir', tempBase]),
      /Unknown or malformed CLI argument: --plan-dir/
    );
    assert.throws(
      () => parseInstallerArgs(['--dry-run', '--target', 'generic-project', '--project', projectDir, `--plan-dir=${tempBase}`]),
      /Unknown or malformed CLI argument: --plan-dir=/
    );

    // 2. Programmatic validatePlanStoreDirectory rejects unsafe locations
    const homeDir = os.homedir();
    for (const unsafePlanDir of [
      '~',
      homeDir,
      path.join(homeDir, '.claude'),
      '/',
      os.tmpdir(),
      ROOT,
      path.join(ROOT, 'scripts'),
      projectDir,
      path.join(projectDir, '.blendops'),
    ]) {
      assert.throws(
        () =>
          validatePlanStoreDirectory(unsafePlanDir, {
            repoRootReal: ROOT,
            targetRootReal: fs.realpathSync(projectDir),
          }),
        /(Global|Unsafe)/
      );
    }

    // 3. Symlinked planDir is rejected
    const realPlanDir = path.join(tempBase, 'real-plans');
    const symlinkPlanDir = path.join(tempBase, 'symlink-plans');
    fs.mkdirSync(realPlanDir, { recursive: true });
    fs.symlinkSync(realPlanDir, symlinkPlanDir);
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: ROOT, planDir: symlinkPlanDir }
        ),
      /Refusing symbolic link in planDir path/
    );

    // 4. Existing unrelated file at planFilePath is never overwritten
    const dryRes = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir],
      { repoRoot: ROOT, planDir: realPlanDir }
    );
    fs.writeFileSync(dryRes.planFilePath, '{"unrelated_user_file": true}\n', 'utf8');
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projectDir],
          { repoRoot: ROOT, planDir: realPlanDir }
        ),
      /Refusing to overwrite existing non-plan file/
    );
    assert.equal(fs.readFileSync(dryRes.planFilePath, 'utf8'), '{"unrelated_user_file": true}\n');
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 32 (Phase 10.1 P2): Reruns fail closed if a prior backup recorded in .blendops/install-manifest.json is missing or corrupted rather than overwriting original backup state', () => {
  const tempBase = makeTempDir('blendops-p10-1-backup-preserve-');
  const projectDir = path.join(tempBase, 'proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  const agentsPath = path.join(projectDir, 'AGENTS.md');
  const originalContent = '# Original Pre-Install AGENTS.md\n';
  fs.writeFileSync(agentsPath, originalContent, 'utf8');

  try {
    // Initial install with --target generic-project --patch-agents-md
    runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );
    runInstaller(
      ['--write', '--target', 'generic-project', '--project', projectDir, '--patch-agents-md'],
      { repoRoot: ROOT, planDir }
    );

    const backupPath = path.join(projectDir, '.blendops', 'backups', 'AGENTS.md.bak');
    const origBackupBytes = fs.readFileSync(backupPath);
    assert.equal(origBackupBytes.toString('utf8'), originalContent);

    // 1. Delete the backup file on disk while keeping it referenced in .blendops/install-manifest.json,
    // then attempt a second install with --target codex --confirm-target-path (which modifies AGENTS.md again)
    fs.unlinkSync(backupPath);

    runInstaller(
      ['--dry-run', '--target', 'codex', '--project', projectDir, '--confirm-target-path'],
      { repoRoot: ROOT, planDir }
    );
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'codex', '--project', projectDir, '--confirm-target-path'],
          { repoRoot: ROOT, planDir }
        ),
      /Existing backup file '\.blendops\/backups\/AGENTS\.md\.bak' referenced by prior install manifest is missing on disk/
    );
    assert.ok(
      !fs.existsSync(backupPath),
      'installer must not recreate a missing backup from post-install AGENTS.md'
    );

    // 2. Restore backup file with corrupted bytes -> rerun fails closed
    fs.writeFileSync(backupPath, '# Corrupted backup bytes\n', 'utf8');
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'codex', '--project', projectDir, '--confirm-target-path'],
          { repoRoot: ROOT, planDir }
        ),
      /Existing backup file '\.blendops\/backups\/AGENTS\.md\.bak' failed SHA-256 verification against prior install manifest/
    );

    // 3. Restore authentic backup bytes -> rerun succeeds and preserves original pre-install backup byte-for-byte
    fs.writeFileSync(backupPath, origBackupBytes);
    const writeCodex = runInstaller(
      ['--write', '--target', 'codex', '--project', projectDir, '--confirm-target-path'],
      { repoRoot: ROOT, planDir }
    );
    assert.equal(writeCodex.ok, true);
    assert.equal(
      fs.readFileSync(backupPath, 'utf8'),
      originalContent,
      'original pre-install backup must remain preserved after target switch rerun'
    );

    // And rollback after the second install restores the original pre-install AGENTS.md byte-for-byte!
    const rollbackRes = runInstaller(['--rollback', '--project', projectDir], {
      repoRoot: ROOT,
      planDir,
    });
    assert.equal(rollbackRes.ok, true);
    assert.equal(fs.readFileSync(agentsPath, 'utf8'), originalContent);
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 33 (Phase 10.2 P1): Transactional write recovery restores target files, manifest, report, and backups consistently across first-install, rerun, report-write, and interrupted writes', () => {
  const tempBase = makeTempDir('blendops-p10-2-tx-recovery-');
  const planDir = path.join(tempBase, 'plans');

  try {
    // Part A: First-install failure when no previous manifest or report exists
    const firstProj = path.join(tempBase, 'first-install-proj');
    fs.mkdirSync(firstProj, { recursive: true });
    const firstAgentsPath = path.join(firstProj, 'AGENTS.md');
    const origFirstAgents = '# Original Pre-Install AGENTS\n';
    fs.writeFileSync(firstAgentsPath, origFirstAgents, 'utf8');
    const origFirstAgentsSha = sha256File(firstAgentsPath);

    runInstaller(
      ['--dry-run', '--target', 'claude-code', '--project', firstProj, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );

    // Fail on the 2nd target operation ('CLAUDE.md') after 'BLENDOPS.md', '.blendops/backups/AGENTS.md.bak', and provisional manifest were already written
    let blendopsExistedMidTx = false;
    let provisionalManifestExistedMidTx = false;
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'claude-code', '--project', firstProj, '--patch-agents-md'],
          {
            repoRoot: ROOT,
            planDir,
            faultInjection: {
              beforeTargetOperation: ({ index }) => {
                if (index === 1) {
                  blendopsExistedMidTx = fs.existsSync(path.join(firstProj, 'BLENDOPS.md'));
                  provisionalManifestExistedMidTx = fs.existsSync(
                    path.join(firstProj, '.blendops', 'install-manifest.json'),
                  );
                  throw new Error('Simulated mid-transaction failure on second target file');
                }
              },
            },
          },
        ),
      /Simulated mid-transaction failure on second target file/,
    );
    assert.equal(blendopsExistedMidTx, true, 'first target file was written before failure on second target');
    assert.equal(provisionalManifestExistedMidTx, true, 'provisional manifest was persisted before target mutation');
    assert.ok(!fs.existsSync(path.join(firstProj, 'BLENDOPS.md')), 'created BLENDOPS.md must be removed on failed first install');
    assert.ok(!fs.existsSync(path.join(firstProj, 'CLAUDE.md')), 'CLAUDE.md must not exist');
    assert.equal(sha256File(firstAgentsPath), origFirstAgentsSha, 'AGENTS.md must remain byte-for-byte identical');
    assert.ok(!fs.existsSync(path.join(firstProj, '.blendops')), 'provisional manifest, new backups, and .blendops must be removed on failed first install');

    // Also test first-install failure during report write AFTER all target files were mutated
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'claude-code', '--project', firstProj, '--patch-agents-md'],
          {
            repoRoot: ROOT,
            planDir,
            faultInjection: {
              afterReportWriteBeforeVerify: ({ reportAbsPath }) => {
                fs.writeFileSync(reportAbsPath, 'corrupted report bytes', 'utf8');
              },
            },
          },
        ),
      /Post-write hash verification failed for \.blendops\/INSTALL_REPORT\.md/,
    );
    assert.ok(!fs.existsSync(path.join(firstProj, 'BLENDOPS.md')), 'created BLENDOPS.md must be rolled back when report verification fails');
    assert.ok(!fs.existsSync(path.join(firstProj, 'CLAUDE.md')), 'created CLAUDE.md must be rolled back when report verification fails');
    assert.equal(sha256File(firstAgentsPath), origFirstAgentsSha, 'modified AGENTS.md must be restored byte-for-byte when report verification fails');
    assert.ok(!fs.existsSync(path.join(firstProj, '.blendops')), 'all metadata and backups must be cleaned up when first-install report fails');

    // Verify normal write and rollback succeed after simulated first-install failures
    const cleanFirstWrite = runInstaller(
      ['--write', '--target', 'claude-code', '--project', firstProj, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(cleanFirstWrite.ok, true);
    const cleanFirstRollback = runInstaller(
      ['--rollback', '--project', firstProj],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(cleanFirstRollback.ok, true);
    assert.equal(sha256File(firstAgentsPath), origFirstAgentsSha);

    // Part B: Rerun failure on second target file after first target file was modified on disk
    const rerunProj = path.join(tempBase, 'rerun-proj');
    fs.mkdirSync(rerunProj, { recursive: true });
    const rerunAgentsPath = path.join(rerunProj, 'AGENTS.md');
    const rerunClaudePath = path.join(rerunProj, 'CLAUDE.md');
    const origRerunAgents = '# Pre-Existing Team AGENTS\n';
    const origRerunClaude = '# Pre-Existing Team CLAUDE\n';
    fs.writeFileSync(rerunAgentsPath, origRerunAgents, 'utf8');
    fs.writeFileSync(rerunClaudePath, origRerunClaude, 'utf8');
    const origRerunAgentsSha = sha256File(rerunAgentsPath);
    const origRerunClaudeSha = sha256File(rerunClaudePath);

    // Install #1: generic-project + --patch-agents-md (creates BLENDOPS.md, modifies AGENTS.md, creates .blendops/backups/AGENTS.md.bak)
    runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', rerunProj, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );
    runInstaller(
      ['--write', '--target', 'generic-project', '--project', rerunProj, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );

    const blendopsPath = path.join(rerunProj, 'BLENDOPS.md');
    const manifestPath = path.join(rerunProj, '.blendops', 'install-manifest.json');
    const reportPath = path.join(rerunProj, '.blendops', 'INSTALL_REPORT.md');
    const agentsBackupPath = path.join(rerunProj, '.blendops', 'backups', 'AGENTS.md.bak');
    const claudeBackupPath = path.join(rerunProj, '.blendops', 'backups', 'CLAUDE.md.bak');

    const preRerunBlendopsSha = sha256File(blendopsPath);
    const preRerunAgentsSha = sha256File(rerunAgentsPath);
    const preRerunManifestSha = sha256File(manifestPath);
    const preRerunReportSha = sha256File(reportPath);
    const preRerunAgentsBackupSha = sha256File(agentsBackupPath);

    // Prepare Install #2: --target claude-code --patch-agents-md
    // Operations in Install #2:
    // op[0]: modify BLENDOPS.md (changes attachment metadata from generic-project to claude-code)
    // op[1]: modify CLAUDE.md (creates new backup .blendops/backups/CLAUDE.md.bak and patches CLAUDE.md)
    // op[2]: modify AGENTS.md (updates managed section for claude-code)
    runInstaller(
      ['--dry-run', '--target', 'claude-code', '--project', rerunProj, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );

    // 1. Fail on op[1] (CLAUDE.md) AFTER op[0] (BLENDOPS.md), provisional manifest, and new CLAUDE.md.bak were written to disk
    let blendopsChangedMidRerun = false;
    let claudeBackupExistedMidRerun = false;
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'claude-code', '--project', rerunProj, '--patch-agents-md'],
          {
            repoRoot: ROOT,
            planDir,
            faultInjection: {
              beforeTargetOperation: ({ index }) => {
                if (index === 1) {
                  blendopsChangedMidRerun = sha256File(blendopsPath) !== preRerunBlendopsSha;
                  claudeBackupExistedMidRerun = fs.existsSync(claudeBackupPath);
                  throw new Error('Simulated failure on 2nd target during rerun');
                }
              },
            },
          },
        ),
      /Simulated failure on 2nd target during rerun/,
    );
    assert.equal(blendopsChangedMidRerun, true, '1st target (BLENDOPS.md) was mutated on disk before 2nd target failed');
    assert.equal(claudeBackupExistedMidRerun, true, 'new backup CLAUDE.md.bak was created before 2nd target failed');
    assert.equal(sha256File(blendopsPath), preRerunBlendopsSha, '1st target (BLENDOPS.md) must be restored byte-for-byte');
    assert.equal(sha256File(rerunClaudePath), origRerunClaudeSha, '2nd target (CLAUDE.md) must remain unchanged');
    assert.equal(sha256File(rerunAgentsPath), preRerunAgentsSha, '3rd target (AGENTS.md) must remain unchanged');
    assert.equal(sha256File(manifestPath), preRerunManifestSha, 'previous install-manifest.json must be restored byte-for-byte');
    assert.equal(sha256File(reportPath), preRerunReportSha, 'previous INSTALL_REPORT.md must be restored byte-for-byte');
    assert.ok(!fs.existsSync(claudeBackupPath), 'newly created CLAUDE.md.bak from failed transaction must be removed');
    assert.equal(sha256File(agentsBackupPath), preRerunAgentsBackupSha, 'pre-existing AGENTS.md.bak from install #1 must survive untouched');

    // 2. Fail during report write AFTER all 3 target files were mutated on disk
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'claude-code', '--project', rerunProj, '--patch-agents-md'],
          {
            repoRoot: ROOT,
            planDir,
            faultInjection: {
              beforeReportWrite: () => {
                throw new Error('Simulated report write failure on rerun');
              },
            },
          },
        ),
      /Simulated report write failure on rerun/,
    );
    assert.equal(sha256File(blendopsPath), preRerunBlendopsSha, 'BLENDOPS.md restored byte-for-byte after report failure');
    assert.equal(sha256File(rerunClaudePath), origRerunClaudeSha, 'CLAUDE.md restored byte-for-byte after report failure');
    assert.equal(sha256File(rerunAgentsPath), preRerunAgentsSha, 'AGENTS.md restored byte-for-byte after report failure');
    assert.equal(sha256File(manifestPath), preRerunManifestSha, 'previous manifest restored byte-for-byte after report failure');
    assert.equal(sha256File(reportPath), preRerunReportSha, 'previous report restored byte-for-byte after report failure');
    assert.ok(!fs.existsSync(claudeBackupPath), 'new backup removed after report failure');
    assert.equal(sha256File(agentsBackupPath), preRerunAgentsBackupSha, 'prior backup preserved after report failure');

    // 3. Simulate process crash mid-transaction (leaving .blendops/transaction-journal.json on disk) and verify automatic journal recovery
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'claude-code', '--project', rerunProj, '--patch-agents-md'],
          {
            repoRoot: ROOT,
            planDir,
            faultInjection: {
              simulateProcessCrashOnFailure: true,
              afterTargetOperation: ({ index }) => {
                if (index === 1) {
                  throw new Error('Simulated process crash after modifying BLENDOPS.md and CLAUDE.md');
                }
              },
            },
          },
        ),
      /Simulated process crash/,
    );
    assert.ok(fs.existsSync(path.join(rerunProj, '.blendops', 'transaction-journal.json')), 'journal remains on disk after simulated crash');
    const recoveryRes = recoverPendingTransactionJournal(fs.realpathSync(rerunProj));
    assert.equal(recoveryRes.recovered, true);
    assert.equal(sha256File(blendopsPath), preRerunBlendopsSha, 'journal recovery restores BLENDOPS.md');
    assert.equal(sha256File(rerunClaudePath), origRerunClaudeSha, 'journal recovery restores CLAUDE.md');
    assert.equal(sha256File(manifestPath), preRerunManifestSha, 'journal recovery restores previous manifest');
    assert.equal(sha256File(reportPath), preRerunReportSha, 'journal recovery restores previous report');
    assert.ok(!fs.existsSync(claudeBackupPath), 'journal recovery removes new backup');

    // 4. Verify cleanup/restoration failures are explicitly surfaced and never silently swallowed
    assert.throws(
      () =>
        runInstaller(
          ['--write', '--target', 'claude-code', '--project', rerunProj, '--patch-agents-md'],
          {
            repoRoot: ROOT,
            planDir,
            faultInjection: {
              beforeReportWrite: () => {
                throw new Error('Primary write error');
              },
              afterRollbackTargetWrite: (rec) => {
                if (rec.relPath === 'CLAUDE.md') {
                  fs.writeFileSync(rec.absPath, 'corrupted during rollback', 'utf8');
                }
              },
            },
          },
        ),
      /Transactional rollback incomplete after write failure \(Primary write error\): .*Post-rollback SHA-256 verification failed for target 'CLAUDE\.md'/,
    );
    // Recover from the still-present journal after fixing the fault
    recoverPendingTransactionJournal(fs.realpathSync(rerunProj));
    assert.equal(sha256File(rerunClaudePath), origRerunClaudeSha);

    // 5. Verify subsequent normal --write and --rollback succeed cleanly after all simulated failures
    const rerunWriteOk = runInstaller(
      ['--write', '--target', 'claude-code', '--project', rerunProj, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(rerunWriteOk.ok, true);
    const finalRollbackOk = runInstaller(
      ['--rollback', '--project', rerunProj],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(finalRollbackOk.ok, true);
    assert.equal(sha256File(rerunAgentsPath), origRerunAgentsSha);
    assert.equal(sha256File(rerunClaudePath), origRerunClaudeSha);
    assert.ok(!fs.existsSync(blendopsPath));
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});

test('Scenario 34 (Phase 10.2 P1): User edits on installer-created files (BLENDOPS.md, AGENTS.md, CLAUDE.md, .cursor/rules/blendops.mdc) are preserved across reruns and survive rollback instead of being deleted', () => {
  const tempBase = makeTempDir('blendops-p10-2-user-edits-');
  const planDir = path.join(tempBase, 'plans');

  try {
    // 1. BLENDOPS.md created by installer -> user adds custom section outside managed block -> rerun --dry-run + --write -> custom section preserved -> --rollback preserves user content instead of deleting BLENDOPS.md
    const proj1 = path.join(tempBase, 'proj-blendops-edited');
    fs.mkdirSync(proj1, { recursive: true });

    runInstaller(['--dry-run', '--target', 'generic-project', '--project', proj1], { repoRoot: ROOT, planDir });
    runInstaller(['--write', '--target', 'generic-project', '--project', proj1], { repoRoot: ROOT, planDir });

    const blendops1Path = path.join(proj1, 'BLENDOPS.md');
    const manifest1Path = path.join(proj1, '.blendops', 'install-manifest.json');
    const initialManifest1 = JSON.parse(fs.readFileSync(manifest1Path, 'utf8'));
    assert.ok(initialManifest1.files_created.includes('BLENDOPS.md'));

    const userCustomNotes = '\n## Studio Custom Conventions\n\n- Keep lighting rigs in `Collection_Lights`.\n- Export scale: 1.0 meters.\n';
    const userEditedBlendops1 = `${fs.readFileSync(blendops1Path, 'utf8')}${userCustomNotes}`;
    fs.writeFileSync(blendops1Path, userEditedBlendops1, 'utf8');
    const userEditedBlendops1Sha = sha256File(blendops1Path);

    // Rerun with same target (generic-project) AND then rerun with target switch (claude-code)
    const dryRerunSame = runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', proj1],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(dryRerunSame.ok, true);
    assert.ok(dryRerunSame.filesModified.includes('BLENDOPS.md'), 'user-edited BLENDOPS.md must be planned as modify to transition ownership');

    const writeRerunSame = runInstaller(
      ['--write', '--target', 'generic-project', '--project', proj1],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(writeRerunSame.ok, true);
    assert.ok(fs.readFileSync(blendops1Path, 'utf8').includes('## Studio Custom Conventions'), 'custom section must remain intact after rerun');

    const manifestAfterRerun = JSON.parse(fs.readFileSync(manifest1Path, 'utf8'));
    assert.ok(!manifestAfterRerun.files_created.includes('BLENDOPS.md'), 'user-edited BLENDOPS.md must be removed from files_created');
    assert.ok(manifestAfterRerun.files_modified.includes('BLENDOPS.md'), 'user-edited BLENDOPS.md must transition to files_modified');
    assert.equal(
      sha256File(path.join(proj1, '.blendops', 'backups', 'BLENDOPS.md.bak')),
      userEditedBlendops1Sha,
      'backup must capture exact pre-rerun user-edited BLENDOPS.md bytes',
    );

    // Switching target to claude-code updates the managed block while preserving the user custom section and original user-edited backup
    runInstaller(['--dry-run', '--target', 'claude-code', '--project', proj1], { repoRoot: ROOT, planDir });
    runInstaller(['--write', '--target', 'claude-code', '--project', proj1], { repoRoot: ROOT, planDir });
    const blendopsAfterSwitch = fs.readFileSync(blendops1Path, 'utf8');
    assert.ok(blendopsAfterSwitch.includes('## Studio Custom Conventions'), 'custom section preserved after target switch');
    assert.ok(blendopsAfterSwitch.includes('Target selected: `claude-code`'), 'managed section updated to claude-code');

    // Rollback restores the user's edited BLENDOPS.md instead of deleting it!
    const rollback1 = runInstaller(['--rollback', '--project', proj1], { repoRoot: ROOT, planDir });
    assert.equal(rollback1.ok, true);
    assert.ok(fs.existsSync(blendops1Path), 'user-edited BLENDOPS.md must NOT be deleted on rollback');
    assert.equal(
      sha256File(blendops1Path),
      userEditedBlendops1Sha,
      'rollback must restore user-edited BLENDOPS.md byte-for-byte',
    );
    assert.ok(!fs.existsSync(path.join(proj1, 'CLAUDE.md')), 'unedited installer-created CLAUDE.md must be removed on rollback');

    // 2. Repeat the same protection test with installer-created CLAUDE.md, AGENTS.md, and .cursor/rules/blendops.mdc
    const proj2 = path.join(tempBase, 'proj-claude-agents-edited');
    fs.mkdirSync(proj2, { recursive: true });

    runInstaller(
      ['--dry-run', '--target', 'claude-code', '--project', proj2, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );
    runInstaller(
      ['--write', '--target', 'claude-code', '--project', proj2, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );

    const claude2Path = path.join(proj2, 'CLAUDE.md');
    const agents2Path = path.join(proj2, 'AGENTS.md');
    const blendops2Path = path.join(proj2, 'BLENDOPS.md');

    const editedClaude2 = `${fs.readFileSync(claude2Path, 'utf8')}\n## Custom Claude Team Rules\nPrefer non-destructive modifiers.\n`;
    const editedAgents2 = `# Team Pre-Header\n\n${fs.readFileSync(agents2Path, 'utf8')}\n## Custom Agent Footer\nKeep scene units metric.\n`;
    fs.writeFileSync(claude2Path, editedClaude2, 'utf8');
    fs.writeFileSync(agents2Path, editedAgents2, 'utf8');
    const editedClaude2Sha = sha256File(claude2Path);
    const editedAgents2Sha = sha256File(agents2Path);

    // Rerun installer on proj2 (BLENDOPS.md is unchanged; CLAUDE.md and AGENTS.md were edited by user)
    const dry2 = runInstaller(
      ['--dry-run', '--target', 'claude-code', '--project', proj2, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(dry2.ok, true);
    assert.deepEqual(dry2.filesModified.sort(), ['AGENTS.md', 'CLAUDE.md']);

    const write2 = runInstaller(
      ['--write', '--target', 'claude-code', '--project', proj2, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(write2.ok, true);
    assert.ok(fs.readFileSync(claude2Path, 'utf8').includes('## Custom Claude Team Rules'));
    assert.ok(fs.readFileSync(agents2Path, 'utf8').includes('## Custom Agent Footer'));

    // Subsequent rerun with no new edits is idempotent
    const dry2Idempotent = runInstaller(
      ['--dry-run', '--target', 'claude-code', '--project', proj2, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );
    assert.equal(dry2Idempotent.filesModified.length, 0, 'subsequent rerun without new edits must be idempotent');

    // Rollback on proj2 removes unedited BLENDOPS.md and restores user-edited CLAUDE.md and AGENTS.md
    const rollback2 = runInstaller(['--rollback', '--project', proj2], { repoRoot: ROOT, planDir });
    assert.equal(rollback2.ok, true);
    assert.ok(!fs.existsSync(blendops2Path), 'unedited BLENDOPS.md must be deleted on rollback');
    assert.equal(sha256File(claude2Path), editedClaude2Sha, 'user-edited CLAUDE.md must survive rollback byte-for-byte');
    assert.equal(sha256File(agents2Path), editedAgents2Sha, 'user-edited AGENTS.md must survive rollback byte-for-byte');

    // Also verify .cursor/rules/blendops.mdc user edits outside managed block are preserved across rerun & rollback
    const projCursor = path.join(tempBase, 'proj-cursor-edited');
    fs.mkdirSync(projCursor, { recursive: true });
    runInstaller(
      ['--dry-run', '--target', 'cursor', '--project', projCursor, '--confirm-target-path'],
      { repoRoot: ROOT, planDir },
    );
    runInstaller(
      ['--write', '--target', 'cursor', '--project', projCursor, '--confirm-target-path'],
      { repoRoot: ROOT, planDir },
    );
    const mdcPath = path.join(projCursor, '.cursor', 'rules', 'blendops.mdc');
    const editedMdc = `${fs.readFileSync(mdcPath, 'utf8')}\n## Custom Cursor Note\nPreserve naming conventions.\n`;
    fs.writeFileSync(mdcPath, editedMdc, 'utf8');
    const editedMdcSha = sha256File(mdcPath);

    runInstaller(
      ['--dry-run', '--target', 'cursor', '--project', projCursor, '--confirm-target-path'],
      { repoRoot: ROOT, planDir },
    );
    runInstaller(
      ['--write', '--target', 'cursor', '--project', projCursor, '--confirm-target-path'],
      { repoRoot: ROOT, planDir },
    );
    assert.ok(fs.readFileSync(mdcPath, 'utf8').includes('## Custom Cursor Note'));
    runInstaller(['--rollback', '--project', projCursor], { repoRoot: ROOT, planDir });
    assert.equal(sha256File(mdcPath), editedMdcSha, 'user-edited .cursor/rules/blendops.mdc must survive rollback');

    // 3. Fail closed when preservation cannot be guaranteed (missing markers, duplicated markers, edits inside managed block, or post-install edits on files_modified)
    const projFailClosed = path.join(tempBase, 'proj-fail-closed');
    fs.mkdirSync(projFailClosed, { recursive: true });
    runInstaller(
      ['--dry-run', '--target', 'generic-project', '--project', projFailClosed, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );
    runInstaller(
      ['--write', '--target', 'generic-project', '--project', projFailClosed, '--patch-agents-md'],
      { repoRoot: ROOT, planDir },
    );

    const fcBlendopsPath = path.join(projFailClosed, 'BLENDOPS.md');
    const fcManifestPath = path.join(projFailClosed, '.blendops', 'install-manifest.json');
    const origFcBlendops = fs.readFileSync(fcBlendopsPath, 'utf8');
    const origFcManifest = fs.readFileSync(fcManifestPath, 'utf8');

    // Case 3a: User removes managed markers from installer-created file
    fs.writeFileSync(fcBlendopsPath, '# User replaced whole file without markers\n', 'utf8');
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projFailClosed, '--patch-agents-md'],
          { repoRoot: ROOT, planDir },
        ),
      /managed BlendOps section markers were removed, so user edits cannot be safely preserved/,
    );
    assert.equal(fs.readFileSync(fcManifestPath, 'utf8'), origFcManifest, 'ownership hashes must not be refreshed on failed check');

    // Case 3b: Duplicated markers
    fs.writeFileSync(fcBlendopsPath, `${origFcBlendops}\n${MANAGED_SECTION_START}\n${MANAGED_SECTION_END}\n`, 'utf8');
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projFailClosed, '--patch-agents-md'],
          { repoRoot: ROOT, planDir },
        ),
      /managed BlendOps section markers are malformed or duplicated/,
    );

    // Case 3c: User edits INSIDE the managed block of an installer-created file
    fs.writeFileSync(
      fcBlendopsPath,
      origFcBlendops.replace('Target selected: `generic-project`', 'Target selected: `generic-project` (USER INNER EDIT)'),
      'utf8',
    );
    assert.throws(
      () =>
        runInstaller(
          ['--dry-run', '--target', 'generic-project', '--project', projFailClosed, '--patch-agents-md'],
          { repoRoot: ROOT, planDir },
        ),
      /installer-created file was edited inside the managed BlendOps section, so preservation of user edits cannot be guaranteed/,
    );
  } finally {
    fs.rmSync(tempBase, { recursive: true, force: true });
  }
});
