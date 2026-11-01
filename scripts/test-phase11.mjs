import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  INSTALLER_VERSION,
  MANAGED_SECTION_START,
  MANAGED_SECTION_END,
} from './install-skills.mjs';
import { ensureMainRepoGitRestored } from './generate-current-audit.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

// Strict character allow/deny check for Windows .cmd batch invocation via cmd.exe /d /c call.
// Rejects cmd.exe metacharacters, variable expansion markers, quotes, and control characters
// so untrusted input can never inject shell commands, while permitting spaces and Unicode paths.
const UNSAFE_WINDOWS_CMD_METACHARS = /["%&|<>^()\r\n\0!;`]/;

export function assertSafeWindowsCmdArgs(executablePath, args = []) {
  if (typeof executablePath !== 'string' || executablePath.length === 0) {
    throw new Error('Windows .cmd executablePath must be a non-empty string');
  }
  if (UNSAFE_WINDOWS_CMD_METACHARS.test(executablePath)) {
    throw new Error(
      `Unsafe executable path rejected for Windows .cmd execution: ${JSON.stringify(executablePath)}`,
    );
  }
  if (!Array.isArray(args)) {
    throw new Error('Windows .cmd args must be an array of strings');
  }
  for (const arg of args) {
    if (typeof arg !== 'string') {
      throw new Error(`Windows .cmd argument must be a string, got ${typeof arg}`);
    }
    if (UNSAFE_WINDOWS_CMD_METACHARS.test(arg)) {
      throw new Error(
        `Unsafe argument rejected for Windows .cmd execution: ${JSON.stringify(arg)}`,
      );
    }
  }
}

export function resolveWindowsComSpec(env = process.env) {
  const candidate = env.ComSpec || env.COMSPEC;
  if (typeof candidate === 'string' && candidate.trim().length > 0) {
    return candidate.trim();
  }
  const sysRoot = env.SystemRoot || env.SYSTEMROOT || 'C:\\Windows';
  return path.win32.join(sysRoot, 'System32', 'cmd.exe');
}

export function resolveNpmCliScript(
  scriptName,
  { execPath = process.execPath, env = process.env } = {},
) {
  if (scriptName === 'npm-cli.js' && typeof env.npm_execpath === 'string' && env.npm_execpath.length > 0) {
    if (/\.[cm]?js$/i.test(env.npm_execpath) && fs.existsSync(env.npm_execpath)) {
      return env.npm_execpath;
    }
  }
  if (typeof env.npm_execpath === 'string' && env.npm_execpath.length > 0) {
    const sibling = path.join(path.dirname(env.npm_execpath), scriptName);
    if (fs.existsSync(sibling)) {
      return sibling;
    }
  }
  const execDir = path.dirname(execPath);
  const candidates = [
    path.join(execDir, 'node_modules', 'npm', 'bin', scriptName),
    path.join(execDir, '..', 'lib', 'node_modules', 'npm', 'bin', scriptName),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function buildSubprocessInvocation({
  platform = process.platform,
  executablePath,
  args = [],
  comSpec,
  env = process.env,
}) {
  if (typeof executablePath !== 'string' || executablePath.length === 0) {
    throw new Error('executablePath must be a non-empty string');
  }
  if (!Array.isArray(args) || !args.every((a) => typeof a === 'string')) {
    throw new Error('args must be an array of strings');
  }

  // On Windows, .cmd/.bat shims cannot be spawned directly by execFileSync without a command interpreter
  // (Node CVE-2024-27980 throws EINVAL). Using cmd.exe with ['/d', '/c', 'call', executablePath, ...args]
  // avoids shell: true and avoids string concatenation: 'call' ensures the first token after '/c' is not
  // a quote character so cmd.exe never strips quotes when both executablePath and args contain spaces.
  if (platform === 'win32' && /\.(?:cmd|bat)$/i.test(executablePath)) {
    assertSafeWindowsCmdArgs(executablePath, args);
    return {
      file: comSpec || resolveWindowsComSpec(env),
      args: ['/d', '/c', 'call', executablePath, ...args],
      windowsHide: true,
    };
  }

  return {
    file: executablePath,
    args: [...args],
    windowsHide: true,
  };
}

function execNpmTool(toolName, args, options = {}) {
  const scriptName = toolName === 'npx' ? 'npx-cli.js' : 'npm-cli.js';
  const cliJsPath = resolveNpmCliScript(scriptName);
  if (cliJsPath) {
    return execFileSync(process.execPath, [cliJsPath, ...args], {
      windowsHide: true,
      ...options,
    });
  }
  const executablePath = process.platform === 'win32' ? `${toolName}.cmd` : toolName;
  const invocation = buildSubprocessInvocation({ executablePath, args });
  return execFileSync(invocation.file, invocation.args, {
    windowsHide: invocation.windowsHide,
    ...options,
  });
}

describe('Phase 11 — Distributable CLI & Package Readiness', () => {
  let suiteTmpDir;
  let packDir;
  let consumerDir;
  let unrelatedCwd;
  let packMetadata;
  let tarballPath;
  let installedBinPath;
  let installedJsEntrypoint;
  let installedPkgRoot;

  before(() => {
    ensureMainRepoGitRestored(ROOT);
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

    const packJsonRaw = execNpmTool(
      'npm',
      ['pack', '--pack-destination', packDir, '--json'],
      { cwd: ROOT, encoding: 'utf8' },
    );
    const parsedPack = JSON.parse(packJsonRaw);
    assert.ok(Array.isArray(parsedPack) && parsedPack.length === 1, 'npm pack --json must return 1 package entry');
    packMetadata = parsedPack[0];
    tarballPath = path.join(packDir, packMetadata.filename);
    assert.ok(fs.existsSync(tarballPath), `Packed tarball must exist at ${tarballPath}`);

    execNpmTool(
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
    installedJsEntrypoint = path.join(installedPkgRoot, 'bin', 'blendops.mjs');
  });

  after(() => {
    if (suiteTmpDir && fs.existsSync(suiteTmpDir)) {
      fs.rmSync(suiteTmpDir, { recursive: true, force: true });
    }
  });

  function runInstalledCli(
    args,
    { cwd = unrelatedCwd, env = {}, via = 'shim', binPath = installedBinPath, jsEntrypoint = installedJsEntrypoint } = {},
  ) {
    if (via === 'js') {
      return execFileSync(process.execPath, [jsEntrypoint, ...args], {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, ...env },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    }
    const invocation = buildSubprocessInvocation({
      executablePath: binPath,
      args,
    });
    return execFileSync(invocation.file, invocation.args, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: invocation.windowsHide,
    });
  }

  function spawnInstalledCli(
    args,
    { cwd = unrelatedCwd, env = {}, via = 'shim', binPath = installedBinPath, jsEntrypoint = installedJsEntrypoint } = {},
  ) {
    const file = via === 'js' ? process.execPath : buildSubprocessInvocation({ executablePath: binPath, args }).file;
    const finalArgs =
      via === 'js'
        ? [jsEntrypoint, ...args]
        : buildSubprocessInvocation({ executablePath: binPath, args }).args;
    const spawned = spawnSync(file, finalArgs, {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
    });
    if (spawned.error) {
      throw spawned.error;
    }
    return {
      status: spawned.status,
      signal: spawned.signal,
      stdout: String(spawned.stdout || ''),
      stderr: String(spawned.stderr || ''),
    };
  }

  function runInstalledCliExpectFailure(
    args,
    { cwd = unrelatedCwd, env = {}, via = 'shim', binPath = installedBinPath, jsEntrypoint = installedJsEntrypoint } = {},
  ) {
    try {
      runInstalledCli(args, { cwd, env, via, binPath, jsEntrypoint });
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

  test('Scenario C: Consumer installation works from an unrelated working directory via node_modules/.bin shim, packaged bin/blendops.mjs entrypoint, and npx --no-install blendops', () => {
    assert.ok(fs.existsSync(installedBinPath), 'node_modules/.bin/blendops shim must exist in consumer project');
    assert.ok(fs.existsSync(installedJsEntrypoint), 'node_modules/blendops/bin/blendops.mjs must exist in consumer project');
    assert.ok(fs.existsSync(installedPkgRoot), 'node_modules/blendops must exist in consumer project');
    assert.ok(
      fs.existsSync(path.join(consumerDir, 'node_modules', 'fflate')),
      'Runtime dependency fflate must be installed in consumer node_modules',
    );

    // 1. Invoke via generated npm bin shim (node_modules/.bin/blendops or blendops.cmd on Windows) from an unrelated cwd
    const binVer = runInstalledCli(['--version'], { cwd: unrelatedCwd, via: 'shim' });
    assert.equal(binVer.trim(), `blendops ${INSTALLER_VERSION}`);

    // 2. Invoke via packaged JavaScript entrypoint (node_modules/blendops/bin/blendops.mjs) from an unrelated cwd
    const jsVer = runInstalledCli(['--version'], { cwd: unrelatedCwd, via: 'js' });
    assert.equal(jsVer.trim(), `blendops ${INSTALLER_VERSION}`);

    const jsDoc = runInstalledCli(['doctor'], { cwd: unrelatedCwd, via: 'js' });
    assert.match(jsDoc, /Mode: doctor/);
    assert.match(jsDoc, /48 canonical skills verified/);
    assert.match(jsDoc, /Runtime status: Not Run/);
    assert.match(jsDoc, /Artifact status: Not Produced/);

    // 3. Invoke via npx --no-install blendops inside consumerDir
    const npxVer = execNpmTool('npx', ['--no-install', 'blendops', '--version'], {
      cwd: consumerDir,
      encoding: 'utf8',
    });
    assert.equal(npxVer.trim(), `blendops ${INSTALLER_VERSION}`);

    // 4. Verify backward-compatible npm run skills:install -- --help in the source repository
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

  test('Scenario G: Transaction recovery and package integrity from installed tarball (interrupted transaction journal recovery and corrupted package asset fail-closed check)', () => {
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
    assert.match(writeOut, /Runtime setup: Separate; not performed/);

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

  test('Scenario I: Cross-platform paths with spaces and Unicode work end-to-end across npm install, packaged JS entrypoint, generated npm bin shim, and Windows .cmd invocation guard', () => {
    const unicodeBase = path.join(suiteTmpDir, 'unicode space suite — Tiếng Việt テスト αβγ');
    const unicodeConsumerDir = path.join(unicodeBase, 'consumer with spaces — 空間');
    const unicodeProjectJs = path.join(unicodeBase, 'target project js — Dự Án テスト');
    const unicodeProjectShim = path.join(unicodeBase, 'target project shim — Dự Án テスト');
    const unicodePlanDir = path.join(unicodeBase, 'plans with spaces — 計画');

    fs.mkdirSync(unicodeConsumerDir, { recursive: true });
    fs.mkdirSync(unicodeProjectJs, { recursive: true });
    fs.mkdirSync(unicodeProjectShim, { recursive: true });

    fs.writeFileSync(
      path.join(unicodeConsumerDir, 'package.json'),
      `${JSON.stringify({ name: 'unicode-space-consumer', version: '1.0.0', private: true }, null, 2)}\n`,
      'utf8',
    );

    // 1. npm install into a consumer path containing spaces and Unicode
    execNpmTool(
      'npm',
      ['install', '--prefer-offline', '--no-audit', '--no-fund', tarballPath],
      { cwd: unicodeConsumerDir, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    const unicodeBinShim = path.join(
      unicodeConsumerDir,
      'node_modules',
      '.bin',
      process.platform === 'win32' ? 'blendops.cmd' : 'blendops',
    );
    const unicodeJsEntry = path.join(
      unicodeConsumerDir,
      'node_modules',
      'blendops',
      'bin',
      'blendops.mjs',
    );
    assert.ok(fs.existsSync(unicodeBinShim), 'Generated npm command shim must exist in space+Unicode consumer path');
    assert.ok(fs.existsSync(unicodeJsEntry), 'Packaged JS entrypoint must exist in space+Unicode consumer path');

    const envUnicodePlans = { BLENDOPS_INSTALLER_PLAN_DIR: unicodePlanDir };

    // 2. Full lifecycle (doctor -> dry-run -> write -> rollback) via packaged JS entrypoint on space+Unicode paths
    const jsDoctor = runInstalledCli(['doctor', '--project', unicodeProjectJs], {
      via: 'js',
      jsEntrypoint: unicodeJsEntry,
      env: envUnicodePlans,
    });
    assert.match(jsDoctor, /Mode: doctor/);
    assert.match(jsDoctor, /Runtime status: Not Run/);

    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', unicodeProjectJs, '--dry-run'],
      { via: 'js', jsEntrypoint: unicodeJsEntry, env: envUnicodePlans },
    );
    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', unicodeProjectJs, '--write'],
      { via: 'js', jsEntrypoint: unicodeJsEntry, env: envUnicodePlans },
    );
    assert.ok(fs.existsSync(path.join(unicodeProjectJs, 'BLENDOPS.md')));
    runInstalledCli(['rollback', '--project', unicodeProjectJs], {
      via: 'js',
      jsEntrypoint: unicodeJsEntry,
      env: envUnicodePlans,
    });
    assert.deepEqual(fs.readdirSync(unicodeProjectJs), []);

    // 3. Full lifecycle (doctor -> dry-run -> write -> rollback) via generated npm command shim on space+Unicode paths
    const shimDoctor = runInstalledCli(['doctor', '--project', unicodeProjectShim], {
      via: 'shim',
      binPath: unicodeBinShim,
      env: envUnicodePlans,
    });
    assert.match(shimDoctor, /Mode: doctor/);
    assert.match(shimDoctor, /Runtime status: Not Run/);

    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', unicodeProjectShim, '--dry-run'],
      { via: 'shim', binPath: unicodeBinShim, env: envUnicodePlans },
    );
    runInstalledCli(
      ['install', '--target', 'generic-project', '--project', unicodeProjectShim, '--write'],
      { via: 'shim', binPath: unicodeBinShim, env: envUnicodePlans },
    );
    assert.ok(fs.existsSync(path.join(unicodeProjectShim, 'BLENDOPS.md')));
    runInstalledCli(['rollback', '--project', unicodeProjectShim], {
      via: 'shim',
      binPath: unicodeBinShim,
      env: envUnicodePlans,
    });
    assert.deepEqual(fs.readdirSync(unicodeProjectShim), []);

    // 4. Verify Windows .cmd invocation builder and strict untrusted-argument metacharacter rejection
    const winCmdPath = 'C:\\Users\\Test User — Tiếng Việt\\app\\node_modules\\.bin\\blendops.cmd';
    const winProjectPath = 'D:\\Workspaces\\Project With Spaces — テスト';
    const winInvocation = buildSubprocessInvocation({
      platform: 'win32',
      executablePath: winCmdPath,
      args: ['install', '--target', 'generic-project', '--project', winProjectPath, '--dry-run'],
      comSpec: 'C:\\Windows\\System32\\cmd.exe',
    });
    assert.equal(winInvocation.file, 'C:\\Windows\\System32\\cmd.exe');
    assert.deepEqual(winInvocation.args, [
      '/d',
      '/c',
      'call',
      winCmdPath,
      'install',
      '--target',
      'generic-project',
      '--project',
      winProjectPath,
      '--dry-run',
    ]);
    assert.equal(winInvocation.windowsHide, true);

    // Reject shell injection metacharacters fail-closed when building Windows .cmd invocations
    for (const unsafeArg of [
      'proj & calc.exe',
      'proj | whoami',
      'proj > out.txt',
      'proj < in.txt',
      'proj ^ escape',
      'proj %PATH%',
      'proj !VAR!',
      'proj "quoted"',
      'proj (subshell)',
      'proj ; semicolon',
      'proj `backtick`',
      'proj\ninjected',
      'proj\rinjected',
    ]) {
      assert.throws(
        () =>
          buildSubprocessInvocation({
            platform: 'win32',
            executablePath: winCmdPath,
            args: ['--project', unsafeArg],
          }),
        /Unsafe argument rejected for Windows \.cmd execution/,
      );
    }
  });

  test('Scenario J: Cross-platform CI workflow, Phase 11 audit identity (phase-11-current), and publishing/E404 boundaries remain enforced', () => {
    // 1. Verify .github/workflows/docs.yml preserves Ubuntu npm run ci and runs Phase 11 CLI tests on ubuntu-latest, windows-latest, and macos-latest
    const workflowYaml = fs.readFileSync(path.join(ROOT, '.github', 'workflows', 'docs.yml'), 'utf8');
    assert.match(workflowYaml, /runs-on:\s*ubuntu-latest/);
    assert.match(workflowYaml, /run:\s*npm run ci/);
    assert.match(workflowYaml, /cli-cross-platform:/);
    assert.match(workflowYaml, /-\s*ubuntu-latest/);
    assert.match(workflowYaml, /-\s*windows-latest/);
    assert.match(workflowYaml, /-\s*macos-latest/);
    assert.match(workflowYaml, /run:\s*node --test scripts\/test-phase11\.mjs/);

    // 2. Verify package.json preserves private: true and Node >=18
    const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    assert.equal(pkgJson.private, true, 'package.json must keep "private": true');
    assert.equal(pkgJson.engines?.node, '>=18', 'package.json must retain Node >=18 engine requirement');

    // 3. Verify docs/distribution-strategy.md documents the npm registry E404 boundary and Not Published posture
    const distDoc = fs.readFileSync(path.join(ROOT, 'docs', 'distribution-strategy.md'), 'utf8');
    assert.match(distDoc, /E404/);
    assert.match(distDoc, /does \*\*not\*\* guarantee reservation rights/i);
    assert.match(distDoc, /scope ownership/i);
    assert.match(distDoc, /"private":\s*true/);
    assert.match(distDoc, /Not Published/);

    // 4. Verify all generated docs/audits/current/* files use phase-11-current and never stale phase-10-current
    const currentAuditDir = path.join(ROOT, 'docs', 'audits', 'current');
    for (const jsonName of [
      'scorecard.json',
      'findings.json',
      'skill-inventory.json',
      'eval-inventory.json',
      'verification-manifest.json',
    ]) {
      const fullPath = path.join(currentAuditDir, jsonName);
      const raw = fs.readFileSync(fullPath, 'utf8');
      const parsed = JSON.parse(raw);
      assert.ok(
        parsed.auditPhase === 'phase-11-current' || parsed.auditPhase === 'phase-12-current',
        `${jsonName} must have auditPhase === 'phase-11-current' or 'phase-12-current'`,
      );
      assert.ok(
        !raw.includes('phase-10-current'),
        `${jsonName} must not contain stale 'phase-10-current' identifier`,
      );
      assert.ok(
        parsed.sourceCommitSha === 'f0804fd64a9fa4f263a9ec59c5de84ed21733747' ||
          parsed.sourceCommitSha === 'fdae0e77187c970893bc5414166aed448677f951',
        `${jsonName} must preserve verified sourceCommitSha`,
      );
    }

    const currentAuditReadme = fs.readFileSync(path.join(currentAuditDir, 'README.md'), 'utf8');
    assert.ok(
      !currentAuditReadme.includes('phase-10-current'),
      'docs/audits/current/README.md must not contain stale phase-10-current identifier',
    );
  });

  test('Scenario K: Large CLI output payloads drain completely across child process pipes with intact trailing truth-state lines and exit codes', () => {
    const envPlans = { BLENDOPS_INSTALLER_PLAN_DIR: path.join(suiteTmpDir, 'plans-k') };

    // 1. Verify real Claude Desktop export over a child-process pipe flushes full report with exit code 0 and empty stderr
    const desktopPipeOutDir = path.join(suiteTmpDir, 'scenario-k-desktop-pipe-out');
    const dryPipeRes = spawnInstalledCli(
      ['install', '--target', 'claude-desktop', '--out', desktopPipeOutDir, '--dry-run'],
      { via: 'shim', env: envPlans },
    );
    assert.equal(dryPipeRes.status, 0, 'Claude Desktop --dry-run must exit with status 0');
    assert.equal(dryPipeRes.stderr, '', 'Claude Desktop --dry-run must produce empty stderr');
    assert.match(dryPipeRes.stdout, /Runtime status: Not Run/);
    assert.match(dryPipeRes.stdout, /Artifact status: Not Produced/);
    assert.match(dryPipeRes.stdout, /Runtime setup: Separate; not performed/);

    const writePipeRes = spawnInstalledCli(
      ['install', '--target', 'claude-desktop', '--out', desktopPipeOutDir, '--write'],
      { via: 'shim', env: envPlans },
    );
    assert.equal(writePipeRes.status, 0, 'Claude Desktop --write must exit with status 0');
    assert.equal(writePipeRes.stderr, '', 'Claude Desktop --write must produce empty stderr');
    assert.ok(
      Buffer.byteLength(writePipeRes.stdout, 'utf8') > 16 * 1024,
      'Claude Desktop --write report must include full multi-kilobyte Files created output',
    );
    assert.match(writePipeRes.stdout, /- Files created:.*desktop-zips\/workflow-stage-router\.zip/);
    assert.match(writePipeRes.stdout, /Runtime status: Not Run/);
    assert.match(writePipeRes.stdout, /Artifact status: Not Produced/);
    assert.match(writePipeRes.stdout, /Runtime setup: Separate; not performed/);

    // 2. Verify >150 KB stdout payloads (exceeding 16 KB macOS and 64 KB Linux pipe buffers before trailing truth states)
    // drain completely for both the packaged JS entrypoint and the installed npm command shim
    for (const viaMode of ['js', 'shim']) {
      const largeStdoutProj = path.join(suiteTmpDir, `scenario-k-large-stdout-${viaMode}`);
      const blendopsMetaDir = path.join(largeStdoutProj, '.blendops');
      fs.mkdirSync(blendopsMetaDir, { recursive: true });

      const sampleContent = '# BlendOps Managed Fixture\n';
      const sampleSha = sha256Buffer(Buffer.from(sampleContent, 'utf8'));
      fs.writeFileSync(path.join(largeStdoutProj, 'BLENDOPS.md'), sampleContent, 'utf8');

      const largeRequestedTarget = `generic-project-${'a'.repeat(80000)}`;
      const largeConfidence = `verified-read-${'b'.repeat(80000)}`;
      const manifestObj = {
        installer_version: INSTALLER_VERSION,
        timestamp: new Date().toISOString(),
        target: 'generic-project',
        requested_target: largeRequestedTarget,
        confidence: largeConfidence,
        scope: 'project-local',
        project: largeStdoutProj,
        files_created: ['BLENDOPS.md'],
        files_modified: [],
        backups: [],
        files_skipped: [],
        created_file_hashes: {
          'BLENDOPS.md': sampleSha,
        },
        modified_file_hashes: {},
        global_touched: false,
        runtime_status: 'Not Run',
        artifact_status: 'Not Produced',
      };
      fs.writeFileSync(
        path.join(blendopsMetaDir, 'install-manifest.json'),
        `${JSON.stringify(manifestObj, null, 2)}\n`,
        'utf8',
      );

      const largeRes = spawnInstalledCli(['rollback', '--project', largeStdoutProj], {
        via: viaMode,
        env: envPlans,
      });
      assert.equal(largeRes.status, 0, `Large stdout CLI invocation (${viaMode}) must exit with code 0`);
      assert.equal(largeRes.stderr, '', `Large stdout CLI invocation (${viaMode}) must have empty stderr`);
      assert.ok(
        Buffer.byteLength(largeRes.stdout, 'utf8') > 150 * 1024,
        `Large stdout payload (${viaMode}) must exceed 150 KB pipe buffer threshold`,
      );
      assert.ok(
        largeRes.stdout.includes(largeRequestedTarget) && largeRes.stdout.includes(largeConfidence),
        `Large stdout payload (${viaMode}) must preserve full preceding report lines without truncation`,
      );
      assert.match(largeRes.stdout, /Runtime status: Not Run/);
      assert.match(largeRes.stdout, /Artifact status: Not Produced/);
      assert.match(largeRes.stdout, /Runtime setup: Separate; not performed/);
    }

    // 3. Verify >150 KB stderr diagnostic output on error path drains completely with nonzero exit code (1) and empty stdout
    for (const viaMode of ['js', 'shim']) {
      const largeStderrProj = path.join(suiteTmpDir, `scenario-k-large-stderr-${viaMode}`);
      const blendopsMetaDir = path.join(largeStderrProj, '.blendops');
      fs.mkdirSync(blendopsMetaDir, { recursive: true });

      const longFakeRelPath = `missing-hash-${'e'.repeat(160000)}.md`;
      const badManifestObj = {
        installer_version: INSTALLER_VERSION,
        timestamp: new Date().toISOString(),
        target: 'generic-project',
        scope: 'project-local',
        project: largeStderrProj,
        files_created: [longFakeRelPath],
        files_modified: [],
        backups: [],
        created_file_hashes: {},
        modified_file_hashes: {},
      };
      fs.writeFileSync(
        path.join(blendopsMetaDir, 'install-manifest.json'),
        `${JSON.stringify(badManifestObj, null, 2)}\n`,
        'utf8',
      );

      const errRes = spawnInstalledCli(['rollback', '--project', largeStderrProj], {
        via: viaMode,
        env: envPlans,
      });
      assert.equal(errRes.status, 1, `Large stderr CLI invocation (${viaMode}) must exit with code 1`);
      assert.equal(errRes.stdout, '', `Large stderr CLI invocation (${viaMode}) must produce empty stdout`);
      assert.ok(
        Buffer.byteLength(errRes.stderr, 'utf8') > 150 * 1024,
        `Large stderr payload (${viaMode}) must exceed 150 KB pipe buffer threshold`,
      );
      assert.match(errRes.stderr, /## BlendOps installer error/);
      assert.ok(
        errRes.stderr.includes(longFakeRelPath),
        `Large stderr payload (${viaMode}) must preserve the full diagnostic message`,
      );
      assert.match(errRes.stderr, /Global files touched: No/);
      assert.match(errRes.stderr, /Runtime status: Not Run/);
      assert.match(errRes.stderr, /Artifact status: Not Produced/);
    }
  });
});
