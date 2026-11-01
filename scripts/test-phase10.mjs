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

test('Scenario 12: --rollback restores modified files byte-for-byte and removes installer-created files', () => {
  const tempBase = makeTempDir('blendops-p10-rollback-');
  const projectDir = path.join(tempBase, 'generic-proj');
  const planDir = path.join(tempBase, 'plans');
  fs.mkdirSync(projectDir, { recursive: true });

  const agentsPath = path.join(projectDir, 'AGENTS.md');
  const originalAgentsBytes = Buffer.from('# Custom Team Rules\n\nLine 1\r\nLine 2\n', 'utf8');
  fs.writeFileSync(agentsPath, originalAgentsBytes);
  const originalSha = sha256File(agentsPath);

  try {
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
    assert.ok(!fs.existsSync(path.join(projectDir, '.blendops')), '.blendops directory must be cleaned up on rollback');
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

test('Scenario 21: CLI execution via child_process reports honest truth states across --doctor, --dry-run, --write, --rollback, and error outputs', () => {
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

test('Scenario 25: Malformed manifests, missing sources, Windows-style path edge cases, and rollback metadata creation failure fail closed with zero target writes', () => {
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

test('Scenario 26: Current-state audit artifacts record active auditPhase phase-10-current and preserve F-08 = PARTIALLY_FIXED and F-09 = FIXED', () => {
  const scorecard = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'audits', 'current', 'scorecard.json'), 'utf8')
  );
  const findings = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'audits', 'current', 'findings.json'), 'utf8')
  );
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'docs', 'audits', 'current', 'verification-manifest.json'), 'utf8')
  );

  assert.equal(scorecard.auditPhase, 'phase-10-current');
  assert.equal(findings.auditPhase, 'phase-10-current');
  assert.equal(manifest.auditPhase, 'phase-10-current');

  const f08 = findings.findings.find((f) => f.id === 'F-08');
  const f09 = findings.findings.find((f) => f.id === 'F-09');
  assert.equal(f08.currentLifecycleStatus, 'PARTIALLY_FIXED', 'F-08 must remain PARTIALLY_FIXED until 24 linked-only adapters receive live host verification');
  assert.equal(f09.currentLifecycleStatus, 'FIXED', 'F-09 must remain FIXED');
  assert.equal(manifest.truthStates.liveModelEval, 'Not Run');
  assert.equal(manifest.truthStates.blenderRuntimeExecution, 'Not Run');
  assert.equal(manifest.truthStates.blenderArtifacts, 'Not Produced');
});

