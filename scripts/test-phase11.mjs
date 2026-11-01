import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  INSTALLER_VERSION,
  MANAGED_SECTION_START,
  MANAGED_SECTION_END,
} from './install-skills.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

describe('Phase 11 — Distributable CLI & Package Readiness', () => {
  let suiteTmpDir;
  let packDir;
  let consumerDir;
  let unrelatedCwd;
  let packMetadata;
  let tarballPath;
  let installedBinPath;
  let installedPkgRoot;

  before(() => {
    suiteTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-test-phase11-'));
    packDir = path.join(suiteTmpDir, 'pack');
    consumerDir = path.join(suiteTmpDir, 'consumer');
    unrelatedCwd = path.join(suiteTmpDir, 'unrelated-cwd');

    fs.mkdirSync(packDir, { recursive: true });
    fs.mkdirSync(consumerDir, { recursive: true });
    fs.mkdirSync(unrelatedCwd, { recursive: true });

    fs.writeFileSync(
      path.join(consumerDir, 'package.json'),
      `${JSON.stringify({ name: 'phase11-consumer-fixture', version: '1.0.0', private: true }, null, 2)}\n`,
      'utf8',
    );

    const packJsonRaw = execFileSync(
      'npm',
      ['pack', '--pack-destination', packDir, '--json'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    const parsedPack = JSON.parse(packJsonRaw);
    assert.ok(Array.isArray(parsedPack) && parsedPack.length === 1, 'npm pack --json must return 1 package entry');
    packMetadata = parsedPack[0];
    tarballPath = path.join(packDir, packMetadata.filename);
    assert.ok(fs.existsSync(tarballPath), `Packed tarball must exist at ${tarballPath}`);

    execFileSync(
      'npm',
      ['install', '--prefer-offline', '--no-audit', '--no-fund', tarballPath],
      { cwd: consumerDir, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    installedBinPath = path.join(
      consumerDir,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'blendops.cmd' : 'blendops',
    );
    installedPkgRoot = path.join(consumerDir, 'node_modules', 'blendops');
  });

  after(() => {
    if (suiteTmpDir && fs.existsSync(suiteTmpDir)) {
      fs.rmSync(suiteTmpDir, { recursive: true, force: true });
    }
  });

  function runInstalledCli(args, { cwd = unrelatedCwd, env = {} } = {}) {
    return execFileSync(installedBinPath, args, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  function runInstalledCliExpectFailure(args, { cwd = unrelatedCwd, env = {} } = {}) {
    try {
      execFileSync(installedBinPath, args, {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      assert.fail(`Expected blendops ${args.join(' ')} to fail with non-zero exit code`);
    } catch (err) {
      if (err && err.code === 'ERR_ASSERTION') {
        throw err;
      }
      return {
        status: err.status,
        stdout: String(err.stdout || ''),
        stderr: String(err.stderr || ''),
      };
    }
  }

  test('Scenario A: CLI contract (--version, -v, --help, -h, subcommand help, and invalid commands/flags fail with non-zero exit code and zero writes)', () => {
    const emptyTargetDir = path.join(suiteTmpDir, 'scenario-a-empty');
    fs.mkdirSync(emptyTargetDir, { recursive: true });

    // 1. --version, -v, and version subcommand
    for (const verArgs of [['--version'], ['-v'], ['version']]) {
      const out = runInstalledCli(verArgs);
      assert.equal(out.trim(), `blendops ${INSTALLER_VERSION}`);
    }

    // 2. --help, -h, help subcommand, and subcommand --help
    for (const helpArgs of [
      ['--help'],
      ['-h'],
      ['help'],
      ['doctor', '--help'],
      ['install', '--help'],
      ['rollback', '--help'],
    ]) {
      const helpOut = runInstalledCli(helpArgs);
      assert.match(helpOut, /blendops doctor/);
      assert.match(helpOut, /blendops install/);
      assert.match(helpOut, /blendops rollback/);
      assert.match(helpOut, /Runtime status: Not Run/);
      assert.match(helpOut, /Artifact status: Not Produced/);
    }

    // 3. Invalid commands and flags fail closed with non-zero exit code and write nothing
    const invalidInvocations = [
      { args: [], match: /Missing operation mode/ },
      { args: ['unknown-subcommand'], match: /Unknown or malformed CLI argument: unknown-subcommand/ },
      { args: ['install', '--project', emptyTargetDir], match: /Missing operation mode for 'install'/ },
      {
        args: ['install', '--project', emptyTargetDir, '--dry-run', '--write'],
        match: /Conflicting operation modes/,
      },
      {
        args: ['install', '--project', emptyTargetDir, '--doctor'],
        match: /Conflicting operation modes/,
      },
      {
        args: ['install', '--project', emptyTargetDir, '--dry-run', '--allow-global'],
        match: /Global installation \(--allow-global\) is disabled/,
      },
      {
        args: ['rollback'],
        match: /--rollback requires --project <path> \(or --out <path>\)/,
      },
      {
        args: ['install', '--target', 'unknown-agent', '--project', emptyTargetDir, '--dry-run'],
        match: /Unsupported --target 'unknown-agent'/,
      },
    ];

    for (const { args, match } of invalidInvocations) {
      const failed = runInstalledCliExpectFailure(args);
      assert.notEqual(failed.status, 0);
      assert.match(failed.stderr, match);
      assert.match(failed.stderr, /Runtime status: Not Run/);
      assert.match(failed.stderr, /Artifact status: Not Produced/);
    }

    assert.deepEqual(
      fs.readdirSync(emptyTargetDir),
      [],
      'Invalid or help/version CLI invocations must write zero files to target directory',
    );
  });

  test('Scenario B: Packed-package integrity (npm pack contains all required runtime/content assets and excludes tests, dev-server, audits, and git artifacts)', () => {
    assert.equal(packMetadata.name, 'blendops');
    assert.equal(packMetadata.version, INSTALLER_VERSION);

    const packedPaths = new Set(packMetadata.files.map((f) => f.path));

    // Required top-level and runtime files
    const requiredFiles = [
      'package.json',
      'README.md',
      'LICENSE',
      'CHANGELOG.md',
      'bin/blendops.mjs',
      'scripts/install-skills.mjs',
      'scripts/export-claude-skills.mjs',
      'laws/README.md',
      'packs/README.md',
      'bundles/generic-project-local/BLENDOPS.md',
      'bundles/generic-project-local/ROLLBACK.md',
      'bundles/generic-project-local/INSTALL_REPORT_TEMPLATE.md',
      'bundles/generic-project-local/manifest.json',
      'bundles/claude-desktop-manual/README.md',
      'bundles/claude-desktop-manual/SKILL.md',
      'bundles/claude-desktop-manual/BLENDOPS_SINGLE_FILE.md',
      'bundles/claude-desktop-manual/IMPORT_STEPS.md',
      'bundles/claude-desktop-manual/manifest.json',
      'registry/compatibility-matrix.json',
      'registry/skills.json',
    ];

    for (const reqPath of requiredFiles) {
      assert.ok(packedPaths.has(reqPath), `Packed tarball must include required file '${reqPath}'`);
    }

    // All 48 canonical skills must have both SKILL.md and EVAL.md in the packed tarball
    const skillDirs = fs
      .readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '_template')
      .map((d) => d.name)
      .sort();
    assert.equal(skillDirs.length, 48, 'Repository must have 48 canonical skills');

    for (const skillName of skillDirs) {
      assert.ok(
        packedPaths.has(`skills/${skillName}/SKILL.md`),
        `Packed tarball missing skills/${skillName}/SKILL.md`,
      );
      assert.ok(
        packedPaths.has(`skills/${skillName}/EVAL.md`),
        `Packed tarball missing skills/${skillName}/EVAL.md`,
      );
    }

    // Excluded repository-internal files must NOT be in the packed tarball
    for (const filePath of packedPaths) {
      assert.ok(
        !filePath.startsWith('scripts/test-'),
        `Packed tarball must not include test script: ${filePath}`,
      );
      assert.notEqual(
        filePath,
        'scripts/dev-server.mjs',
        'Packed tarball must not include scripts/dev-server.mjs',
      );
      assert.ok(
        !filePath.startsWith('docs/audits/'),
        `Packed tarball must not include audit snapshots: ${filePath}`,
      );
      assert.ok(
        !filePath.startsWith('dist/'),
        `Packed tarball must not include dist/ artifacts: ${filePath}`,
      );
      assert.ok(
        !filePath.startsWith('.aistudio/'),
        `Packed tarball must not include .aistudio/ artifacts: ${filePath}`,
      );
      assert.ok(
        !filePath.startsWith('.git/'),
        `Packed tarball must not include .git/ metadata: ${filePath}`,
      );
    }
  });

  test('Scenario C: Consumer installation works from an unrelated working directory via both node_modules/.bin/blendops and npx --no-install blendops', () => {
    assert.ok(fs.existsSync(installedBinPath), 'node_modules/.bin/blendops must exist in consumer project');
    assert.ok(fs.existsSync(installedPkgRoot), 'node_modules/blendops must exist in consumer project');
    assert.ok(
      fs.existsSync(path.join(consumerDir, 'node_modules', 'fflate')),
      'Runtime dependency fflate must be installed in consumer node_modules',
    );

    // Invoke via node_modules/.bin/blendops from an unrelated working directory
    const binVer = runInstalledCli(['--version'], { cwd: unrelatedCwd });
    assert.equal(binVer.trim(), `blendops ${INSTALLER_VERSION}`);

    // Invoke via npx --no-install blendops inside consumerDir
    const npxVer = execFileSync('npx', ['--no-install', 'blendops', '--version'], {
      cwd: consumerDir,
      encoding: 'utf8',
    });
    assert.equal(npxVer.trim(), `blendops ${INSTALLER_VERSION}`);

    // Verify backward-compatible npm run skills:install -- --help in the source repository
    const repoScriptHelp = execFileSync(
      process.execPath,
      [path.join(ROOT, 'scripts', 'install-skills.mjs'), '--help'],
      { cwd: unrelatedCwd, encoding: 'utf8' },
    );
    assert.match(repoScriptHelp, /blendops install/);
  });

  test('Scenario D: Doctor mode from installed tarball inspects package health, target markers, manifests, and journals with zero target mutations', () => {
    const docBase = path.join(suiteTmpDir, 'scenario-d');
    const cleanProj = path.join(docBase, 'clean-proj');
    const cursorProj = path.join(docBase, 'cursor-proj');
    const ambiguousProj = path.join(docBase, 'ambiguous-proj');
    const journalProj = path.join(docBase, 'journal-proj');

    fs.mkdirSync(cleanProj, { recursive: true });
    fs.mkdirSync(path.join(cursorProj, '.cursor'), { recursive: true });
    fs.mkdirSync(path.join(ambiguousProj, '.claude'), { recursive: true });
    fs.mkdirSync(path.join(ambiguousProj, '.cursor'), { recursive: true });
    fs.mkdirSync(path.join(journalProj, '.blendops'), { recursive: true });
    fs.writeFileSync(
      path.join(journalProj, '.blendops', 'transaction-journal.json'),
      JSON.stringify({ installer_version: INSTALLER_VERSION }),
      'utf8',
    );

    // 1. Package-level doctor without --project
    const pkgDocOut = runInstalledCli(['doctor']);
    assert.match(pkgDocOut, /Mode: doctor/);
    assert.match(pkgDocOut, /48 canonical skills verified/);
    assert.match(pkgDocOut, /Runtime status: Not Run/);
    assert.match(pkgDocOut, /Artifact status: Not Produced/);

    // 2. Clean project doctor
    const cleanDocOut = runInstalledCli(['doctor', '--project', cleanProj]);
    assert.match(cleanDocOut, /Target selected: generic-project/);
    assert.match(cleanDocOut, /Detected markers: none/);
    assert.deepEqual(fs.readdirSync(cleanProj), [], 'doctor must not mutate cleanProj');

    // 3. Single-marker project doctor
    const cursorDocOut = runInstalledCli(['doctor', '--project', cursorProj]);
    assert.match(cursorDocOut, /Target selected: cursor/);
    assert.match(cursorDocOut, /Detected markers: cursor \(\.cursor\)/);
    assert.deepEqual(fs.readdirSync(cursorProj), ['.cursor'], 'doctor must not mutate cursorProj');

    // 4. Ambiguous multi-marker project doctor
    const ambigDocOut = runInstalledCli(['doctor', '--project', ambiguousProj]);
    assert.match(ambigDocOut, /Multiple target markers detected \(claude-code, cursor\)/);
    assert.deepEqual(
      fs.readdirSync(ambiguousProj).sort(),
      ['.claude', '.cursor'],
      'doctor must not mutate ambiguousProj',
    );

    // 5. Pending transaction journal detection (strictly read-only!)
    const journalDocOut = runInstalledCli(['doctor', '--project', journalProj]);
    assert.match(journalDocOut, /Pending transaction journal detected/);
    assert.ok(
      fs.existsSync(path.join(journalProj, '.blendops', 'transaction-journal.json')),
      'doctor must remain strictly read-only and not delete transaction-journal.json',
    );
  });

  test('Scenario E: Full install lifecycle from installed tarball (dry-run gate, stale-plan rejection, write, idempotent rerun, and user-edit preservation)', () => {
    const envPlans = { BLENDOPS_INSTALLER_PLAN_DIR: path.join(suiteTmpDir, 'plans-e') };
    const projDir = path.join(suiteTmpDir, 'scenario-e-proj');
    fs.mkdirSync(projDir, { recursive: true });

    const origAgents = '# Consumer Project Agents\n\nKeep this header intact.\n';
    fs.writeFileSync(path.join(projDir, 'AGENTS.md'), origAgents, 'utf8');
    const origAgentsSha = sha256File(path.join(projDir, 'AGENTS.md'));

    // 1. --write before --dry-run fails closed
    const writeBeforeDry = runInstalledCliExpectFailure(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--write'],
      { env: envPlans },
    );
    assert.match(writeBeforeDry.stderr, /no prior --dry-run plan exists/);
    assert.ok(!fs.existsSync(path.join(projDir, 'BLENDOPS.md')));

    // 2. --dry-run records plan without modifying target files
    const dryOut = runInstalledCli(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--dry-run'],
      { env: envPlans },
    );
    assert.match(dryOut, /Mode: dry-run/);
    assert.match(dryOut, /Files created: BLENDOPS\.md/);
    assert.match(dryOut, /Files modified: AGENTS\.md/);
    assert.ok(!fs.existsSync(path.join(projDir, 'BLENDOPS.md')));
    assert.equal(sha256File(path.join(projDir, 'AGENTS.md')), origAgentsSha);

    // 3. Stale plan rejection when target file changes between --dry-run and --write
    fs.writeFileSync(path.join(projDir, 'AGENTS.md'), `${origAgents}\nExtra line before write.\n`, 'utf8');
    const staleWrite = runInstalledCliExpectFailure(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--write'],
      { env: envPlans },
    );
    assert.match(staleWrite.stderr, /stale dry-run plan/);
    fs.writeFileSync(path.join(projDir, 'AGENTS.md'), origAgents, 'utf8');

    // 4. Fresh --dry-run followed by --write succeeds
    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--dry-run'],
      { env: envPlans },
    );
    const writeOut = runInstalledCli(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--write'],
      { env: envPlans },
    );
    assert.match(writeOut, /Mode: write/);
    assert.match(writeOut, /Runtime status: Not Run/);
    assert.match(writeOut, /Artifact status: Not Produced/);

    assert.ok(fs.existsSync(path.join(projDir, 'BLENDOPS.md')));
    assert.ok(fs.existsSync(path.join(projDir, '.blendops', 'install-manifest.json')));
    assert.ok(fs.existsSync(path.join(projDir, '.blendops', 'INSTALL_REPORT.md')));
    assert.ok(fs.existsSync(path.join(projDir, '.blendops', 'backups', 'AGENTS.md.bak')));
    assert.equal(sha256File(path.join(projDir, '.blendops', 'backups', 'AGENTS.md.bak')), origAgentsSha);

    const patchedAgents = fs.readFileSync(path.join(projDir, 'AGENTS.md'), 'utf8');
    assert.ok(patchedAgents.includes(origAgents.trim()));
    assert.ok(patchedAgents.includes(MANAGED_SECTION_START));
    assert.ok(patchedAgents.includes(MANAGED_SECTION_END));

    // 5. Rerun is idempotent
    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--dry-run'],
      { env: envPlans },
    );
    const rerunWriteOut = runInstalledCli(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--write'],
      { env: envPlans },
    );
    assert.match(rerunWriteOut, /Files created: none/);
    assert.match(rerunWriteOut, /Files modified: none/);

    // 6. User edits outside the managed section in installer-created BLENDOPS.md transition it to files_modified with backup
    const userNote = '\n## Custom Team Notes\nDo not delete our team notes.\n';
    fs.appendFileSync(path.join(projDir, 'BLENDOPS.md'), userNote, 'utf8');
    const userEditedBlendopsSha = sha256File(path.join(projDir, 'BLENDOPS.md'));

    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--dry-run'],
      { env: envPlans },
    );
    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', projDir, '--patch-agents-md', '--write'],
      { env: envPlans },
    );

    const updatedManifest = JSON.parse(
      fs.readFileSync(path.join(projDir, '.blendops', 'install-manifest.json'), 'utf8'),
    );
    assert.ok(!updatedManifest.files_created.includes('BLENDOPS.md'));
    assert.ok(updatedManifest.files_modified.includes('BLENDOPS.md'));
    assert.equal(
      sha256File(path.join(projDir, '.blendops', 'backups', 'BLENDOPS.md.bak')),
      userEditedBlendopsSha,
    );
  });

  test('Scenario F: Rollback lifecycle from installed tarball restores modified files, removes eligible created files, preserves unrelated files, and guards against post-install drift', () => {
    const envPlans = { BLENDOPS_INSTALLER_PLAN_DIR: path.join(suiteTmpDir, 'plans-f') };
    const projDir = path.join(suiteTmpDir, 'scenario-f-proj');
    fs.mkdirSync(projDir, { recursive: true });

    const origClaude = '# Existing Claude Code Config\n\nProject-specific notes.\n';
    const unrelatedReadme = '# Unrelated App README\n';
    fs.writeFileSync(path.join(projDir, 'CLAUDE.md'), origClaude, 'utf8');
    fs.writeFileSync(path.join(projDir, 'README.md'), unrelatedReadme, 'utf8');
    const origClaudeSha = sha256File(path.join(projDir, 'CLAUDE.md'));
    const origReadmeSha = sha256File(path.join(projDir, 'README.md'));

    // Install claude-code target (creates BLENDOPS.md, modifies CLAUDE.md with backup)
    runInstalledCli(
      ['install', '--target', 'claude-code', '--project', projDir, '--dry-run'],
      { env: envPlans },
    );
    runInstalledCli(
      ['install', '--target', 'claude-code', '--project', projDir, '--write'],
      { env: envPlans },
    );

    assert.ok(fs.existsSync(path.join(projDir, 'BLENDOPS.md')));
    assert.notEqual(sha256File(path.join(projDir, 'CLAUDE.md')), origClaudeSha);

    // 1. Simulate post-install user edit to BLENDOPS.md: rollback without --force-rollback must refuse
    const postInstallBlendops = fs.readFileSync(path.join(projDir, 'BLENDOPS.md'), 'utf8');
    fs.writeFileSync(path.join(projDir, 'BLENDOPS.md'), `${postInstallBlendops}\nUser edit after install\n`, 'utf8');

    const refusedRollback = runInstalledCliExpectFailure(
      ['rollback', '--project', projDir],
      { env: envPlans },
    );
    assert.match(refusedRollback.stderr, /modified after installation/);
    assert.ok(fs.existsSync(path.join(projDir, 'BLENDOPS.md')), 'BLENDOPS.md must remain after refused rollback');

    // Restore exact post-install BLENDOPS.md and perform clean rollback
    fs.writeFileSync(path.join(projDir, 'BLENDOPS.md'), postInstallBlendops, 'utf8');
    const rollbackOut = runInstalledCli(['rollback', '--project', projDir], { env: envPlans });
    assert.match(rollbackOut, /Mode: rollback/);
    assert.match(rollbackOut, /Runtime status: Not Run/);
    assert.match(rollbackOut, /Artifact status: Not Produced/);

    assert.ok(!fs.existsSync(path.join(projDir, 'BLENDOPS.md')), 'BLENDOPS.md must be removed on rollback');
    assert.ok(!fs.existsSync(path.join(projDir, '.blendops')), '.blendops directory must be pruned on clean rollback');
    assert.equal(
      sha256File(path.join(projDir, 'CLAUDE.md')),
      origClaudeSha,
      'CLAUDE.md must be restored byte-for-byte to pre-install SHA-256',
    );
    assert.equal(
      sha256File(path.join(projDir, 'README.md')),
      origReadmeSha,
      'Unrelated README.md must remain untouched',
    );
  });

  test('Scenario G: Failure and recovery from installed tarball (interrupted transaction journal recovery and corrupted package asset fail-closed check)', () => {
    const envPlans = { BLENDOPS_INSTALLER_PLAN_DIR: path.join(suiteTmpDir, 'plans-g') };
    const projDir = path.join(suiteTmpDir, 'scenario-g-proj');
    fs.mkdirSync(projDir, { recursive: true });

    const origAgents = '# Original Pre-Crash AGENTS.md\n';
    fs.writeFileSync(path.join(projDir, 'AGENTS.md'), origAgents, 'utf8');
    const origAgentsSha = sha256File(path.join(projDir, 'AGENTS.md'));

    // 1. Simulate an interrupted write transaction with a valid pending transaction-journal.json
    const blendopsDir = path.join(projDir, '.blendops');
    const txStagingDir = path.join(blendopsDir, 'tx-staging');
    const backupsDir = path.join(blendopsDir, 'backups');
    fs.mkdirSync(txStagingDir, { recursive: true });
    fs.mkdirSync(backupsDir, { recursive: true });

    fs.writeFileSync(path.join(txStagingDir, 'target-0-AGENTS.md.bin'), origAgents, 'utf8');
    fs.writeFileSync(path.join(backupsDir, 'AGENTS.md.bak'), origAgents, 'utf8');
    fs.writeFileSync(path.join(projDir, 'AGENTS.md'), '# Partial Corrupted Write\n', 'utf8');
    fs.writeFileSync(path.join(projDir, 'BLENDOPS.md'), '# Partial Created File\n', 'utf8');
    fs.writeFileSync(path.join(blendopsDir, 'install-manifest.json'), '{"provisional":true}\n', 'utf8');

    const journal = {
      installer_version: INSTALLER_VERSION,
      started_at: new Date().toISOString(),
      project: fs.realpathSync(projDir),
      blendops_existed_before: false,
      backups_dir_existed_before: false,
      manifest_state: {
        rel_path: '.blendops/install-manifest.json',
        existed_before: false,
        pre_sha256: null,
        staging_rel_path: null,
      },
      report_state: {
        rel_path: '.blendops/INSTALL_REPORT.md',
        existed_before: false,
        pre_sha256: null,
        staging_rel_path: null,
      },
      newly_created_backups: [
        {
          target_rel_path: 'AGENTS.md',
          backup_rel_path: '.blendops/backups/AGENTS.md.bak',
          sha256: origAgentsSha,
        },
      ],
      target_records: [
        {
          rel_path: 'AGENTS.md',
          action: 'modify',
          existed_before: true,
          pre_sha256: origAgentsSha,
          desired_sha256: '0'.repeat(64),
          staging_rel_path: '.blendops/tx-staging/target-0-AGENTS.md.bin',
        },
        {
          rel_path: 'BLENDOPS.md',
          action: 'create',
          existed_before: false,
          pre_sha256: null,
          desired_sha256: '1'.repeat(64),
          staging_rel_path: null,
        },
      ],
    };
    fs.writeFileSync(
      path.join(blendopsDir, 'transaction-journal.json'),
      `${JSON.stringify(journal, null, 2)}\n`,
      'utf8',
    );

    // Running blendops install --dry-run automatically recovers the interrupted journal before planning
    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', projDir, '--dry-run'],
      { env: envPlans },
    );
    assert.equal(
      sha256File(path.join(projDir, 'AGENTS.md')),
      origAgentsSha,
      'Interrupted transaction recovery must restore AGENTS.md byte-for-byte',
    );
    assert.ok(
      !fs.existsSync(path.join(projDir, 'BLENDOPS.md')),
      'Interrupted transaction recovery must remove partially created BLENDOPS.md',
    );
    assert.ok(
      !fs.existsSync(path.join(projDir, '.blendops')),
      'Interrupted transaction recovery must prune .blendops metadata directory',
    );

    // 2. Missing/corrupted package asset inside a mutated unpacked copy fails closed with zero target writes
    const brokenConsumerDir = path.join(suiteTmpDir, 'broken-consumer');
    fs.cpSync(consumerDir, brokenConsumerDir, { recursive: true });
    const brokenBlendopsMd = path.join(
      brokenConsumerDir,
      'node_modules',
      'blendops',
      'bundles',
      'generic-project-local',
      'BLENDOPS.md',
    );
    fs.unlinkSync(brokenBlendopsMd);

    const brokenBin = path.join(
      brokenConsumerDir,
      'node_modules',
      'blendops',
      'bin',
      'blendops.mjs',
    );
    const cleanTarget = path.join(suiteTmpDir, 'scenario-g-clean-target');
    fs.mkdirSync(cleanTarget, { recursive: true });

    try {
      execFileSync(
        process.execPath,
        [brokenBin, 'install', '--target', 'generic-project', '--project', cleanTarget, '--dry-run'],
        { cwd: unrelatedCwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      );
      assert.fail('Expected broken package asset to fail closed');
    } catch (err) {
      assert.match(String(err.stderr || ''), /Missing required BlendOps source file/);
    }
    assert.deepEqual(fs.readdirSync(cleanTarget), [], 'Corrupted package must write zero files to target');
  });

  test('Scenario H: Claude Desktop export from installed tarball (dry-run, existing --out refusal, write 48 ZIPs + manual bundle, and rollback)', () => {
    const envPlans = { BLENDOPS_INSTALLER_PLAN_DIR: path.join(suiteTmpDir, 'plans-h') };
    const existingOutDir = path.join(suiteTmpDir, 'scenario-h-existing-out');
    fs.mkdirSync(existingOutDir, { recursive: true });
    fs.writeFileSync(path.join(existingOutDir, 'keep.txt'), 'preserve user file\n', 'utf8');

    // 1. Existing --out directory is refused in --dry-run without modifying keep.txt
    const refusedExisting = runInstalledCliExpectFailure(
      ['install', '--target', 'claude-desktop', '--out', existingOutDir, '--dry-run'],
      { env: envPlans },
    );
    assert.match(refusedExisting.stderr, /Refusing to use existing --out destination/);
    assert.equal(fs.readFileSync(path.join(existingOutDir, 'keep.txt'), 'utf8'), 'preserve user file\n');

    // 2. Non-existent --out directory succeeds in --dry-run and --write, then rolls back cleanly
    const outDir = path.join(suiteTmpDir, 'scenario-h-desktop-out');
    const dryOut = runInstalledCli(
      ['install', '--target', 'claude-desktop', '--output', outDir, '--dry-run'],
      { env: envPlans },
    );
    assert.match(dryOut, /Mode: dry-run/);
    assert.match(dryOut, /SKILL\.md count if ZIP mode: 1 per ZIP \(48 ZIPs\)/);
    assert.ok(!fs.existsSync(outDir), '--dry-run must not create --out directory');

    const writeOut = runInstalledCli(
      ['install', '--target', 'claude-desktop', '--output', outDir, '--write'],
      { env: envPlans },
    );
    assert.match(writeOut, /Mode: write/);
    assert.match(writeOut, /Runtime status: Not Run/);
    assert.match(writeOut, /Artifact status: Not Produced/);

    const zipFiles = fs.readdirSync(path.join(outDir, 'desktop-zips')).filter((f) => f.endsWith('.zip'));
    assert.equal(zipFiles.length, 48, 'Must generate all 48 per-skill ZIP archives from installed tarball');
    assert.ok(fs.existsSync(path.join(outDir, 'claude-desktop-manual', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(outDir, 'manifest.json')));
    assert.ok(fs.existsSync(path.join(outDir, '.blendops', 'install-manifest.json')));
    assert.ok(fs.existsSync(path.join(outDir, '.blendops', 'INSTALL_REPORT.md')));

    const rollbackOut = runInstalledCli(['rollback', '--out', outDir], { env: envPlans });
    assert.match(rollbackOut, /Mode: rollback/);
    assert.deepEqual(
      fs.readdirSync(outDir),
      [],
      'Clean Claude Desktop bundle rollback must remove all generated bundle files and .blendops metadata',
    );
  });
});
