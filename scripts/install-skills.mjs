#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

export const INSTALLER_VERSION = '0.1.0-draft';
export const MANAGED_SECTION_START = '<!-- blendops:installer:start -->';
export const MANAGED_SECTION_END = '<!-- blendops:installer:end -->';

export const SUPPORTED_TARGETS = Object.freeze({
  auto: {
    id: 'auto',
    confidence: 'detection-dependent',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Auto-detect single confident target marker or fall back to generic-project; stop on ambiguity.',
  },
  'claude-code': {
    id: 'claude-code',
    confidence: 'verified-read',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Project-local CLAUDE.md + BLENDOPS.md attachment (verified-read); native .claude/skills/ path unresolved.',
  },
  opencode: {
    id: 'opencode',
    confidence: 'linked-only',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Project-local generic BLENDOPS.md fallback; candidate .opencode/ native path unverified.',
  },
  cursor: {
    id: 'cursor',
    confidence: 'linked-only',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Project-local BLENDOPS.md fallback by default; .cursor/rules/blendops.mdc with frontmatter only when explicitly confirmed.',
  },
  codex: {
    id: 'codex',
    confidence: 'linked-only',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Project-local BLENDOPS.md + optional backed-up AGENTS.md managed section when explicitly confirmed.',
  },
  gemini: {
    id: 'gemini',
    confidence: 'linked-only',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Project-local generic BLENDOPS.md fallback; native Gemini CLI path not researched/unverified.',
  },
  antigravity: {
    id: 'antigravity',
    confidence: 'linked-only',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Project-local generic BLENDOPS.md fallback; candidate .agent/skills/ path unverified.',
  },
  'github-copilot': {
    id: 'github-copilot',
    confidence: 'linked-only',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Project-local generic BLENDOPS.md fallback; no extension/marketplace claim.',
  },
  'generic-project': {
    id: 'generic-project',
    confidence: 'verified-read',
    scope: 'project-local',
    requiresProject: true,
    requiresOut: false,
    description: 'Project-root BLENDOPS.md and optional backed-up AGENTS.md managed section (verified-read fallback).',
  },
  'claude-desktop': {
    id: 'claude-desktop',
    confidence: 'linked-only/manual',
    scope: 'bundle-output',
    requiresProject: false,
    requiresOut: true,
    description: 'User-managed manual import/upload package under --out (48 per-skill ZIPs + manual bundle); no UI automation.',
  },
});

const TARGET_DETECTION_MARKERS = Object.freeze([
  {
    target: 'claude-code',
    markers: ['CLAUDE.md', '.claude'],
  },
  {
    target: 'cursor',
    markers: ['.cursor', '.cursorrules'],
  },
  {
    target: 'opencode',
    markers: ['.opencode', 'opencode.json'],
  },
  {
    target: 'codex',
    markers: ['.codex', 'AGENTS.override.md'],
  },
  {
    target: 'gemini',
    markers: ['.gemini', 'GEMINI.md'],
  },
  {
    target: 'antigravity',
    markers: ['.antigravity', '.agent'],
  },
  {
    target: 'github-copilot',
    markers: ['.github/copilot-instructions.md'],
  },
]);

const PROTECTED_BLENDOPS_REPO_ENTRIES = new Set([
  '.git',
  '.github',
  '.aistudio',
  'bundles',
  'docs',
  'evals',
  'laws',
  'node_modules',
  'packs',
  'registry',
  'schemas',
  'scripts',
  'skill-reviews',
  'skills',
]);

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256String(str) {
  return crypto.createHash('sha256').update(String(str), 'utf8').digest('hex');
}

function resolveWithExistingAncestorRealpath(targetPath) {
  const absTarget = path.resolve(targetPath);
  const tailSegments = [];
  let cursor = absTarget;

  while (!fs.existsSync(cursor)) {
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    tailSegments.unshift(path.basename(cursor));
    cursor = parent;
  }

  const baseReal = fs.existsSync(cursor) ? fs.realpathSync(cursor) : cursor;
  return tailSegments.length > 0 ? path.join(baseReal, ...tailSegments) : baseReal;
}

function assertNoSymlinkedAncestorsWithin(rootReal, targetAbs) {
  const rel = path.relative(rootReal, targetAbs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Path escapes root boundary (${rootReal}): ${targetAbs}`);
  }
  if (!rel) return;

  const segments = rel.split(path.sep).filter(Boolean);
  let cursor = rootReal;
  for (let i = 0; i < segments.length; i += 1) {
    cursor = path.join(cursor, segments[i]);
    let lstat = null;
    try {
      lstat = fs.lstatSync(cursor);
    } catch (err) {
      if (err && err.code === 'ENOENT') {
        break;
      }
      throw err;
    }
    if (lstat.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link path segment inside target root: ${cursor}`);
    }
    if (i < segments.length - 1 && !lstat.isDirectory()) {
      throw new Error(
        `Path type confusion: ancestor segment is not a directory: ${cursor}`,
      );
    }
  }
}

function isGlobalAgentPath(candidatePath) {
  const home = os.homedir ? path.resolve(os.homedir()) : '';
  if (!home) return false;
  const resolved = path.resolve(candidatePath);
  if (resolved === home) return true;
  const globalDirs = [
    path.join(home, '.claude'),
    path.join(home, '.cursor'),
    path.join(home, '.codex'),
    path.join(home, '.config', 'opencode'),
    path.join(home, '.gemini'),
    path.join(home, '.codeium'),
    path.join(home, '.augment'),
    path.join(home, '.openhands'),
    path.join(home, '.ollama'),
  ];
  for (const gDir of globalDirs) {
    const rel = path.relative(gDir, resolved);
    if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
      return true;
    }
  }
  return false;
}

export function validateDestinationRoot(rawPath, { kind = 'project', repoRoot = DEFAULT_REPO_ROOT, mustExist = true } = {}) {
  if (typeof rawPath !== 'string' || rawPath.trim().length === 0 || rawPath.includes('\0')) {
    throw new Error(`Invalid --${kind} path: must be a non-empty path string`);
  }
  const trimmed = rawPath.trim();
  if (trimmed === '~' || trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    throw new Error(
      `Global home-directory path (${trimmed}) is rejected in Phase 10; only project-local or explicit bundle output paths are allowed`,
    );
  }
  if (/^[a-zA-Z]:[\\/]?$/.test(trimmed) || trimmed.startsWith('\\\\')) {
    throw new Error(
      `Unsafe --${kind} path (Windows drive root or UNC path is forbidden): ${rawPath}`,
    );
  }

  const normalizedInput = trimmed.replace(/\\/g, path.sep);
  const absCandidate = path.resolve(normalizedInput);
  const parsedRoot = path.parse(absCandidate).root;
  if (absCandidate === parsedRoot) {
    throw new Error(`Unsafe --${kind} path (filesystem root is forbidden): ${rawPath}`);
  }

  const tmpResolved = path.resolve(os.tmpdir());
  const tmpReal = fs.existsSync(tmpResolved) ? fs.realpathSync(tmpResolved) : tmpResolved;
  const effectiveCandidate = resolveWithExistingAncestorRealpath(absCandidate);

  if (absCandidate === tmpResolved || effectiveCandidate === tmpReal) {
    throw new Error(`Unsafe --${kind} path (OS temp root itself is forbidden): ${rawPath}`);
  }

  if (isGlobalAgentPath(absCandidate) || isGlobalAgentPath(effectiveCandidate)) {
    throw new Error(
      `Global configuration destination (${rawPath}) is rejected in Phase 10; global writes are disabled`,
    );
  }

  const realRepoRoot = fs.existsSync(repoRoot) ? fs.realpathSync(repoRoot) : path.resolve(repoRoot);
  if (effectiveCandidate === realRepoRoot || absCandidate === realRepoRoot) {
    throw new Error(
      `Refusing to run installer directly against the canonical BlendOps source repository root (${realRepoRoot})`,
    );
  }

  const relFromRepo = path.relative(realRepoRoot, effectiveCandidate);
  const isInsideRepo =
    relFromRepo !== '' && !relFromRepo.startsWith('..') && !path.isAbsolute(relFromRepo);
  if (isInsideRepo) {
    const topSeg = relFromRepo.split(path.sep)[0];
    if (PROTECTED_BLENDOPS_REPO_ENTRIES.has(topSeg)) {
      throw new Error(
        `Unsafe --${kind} destination inside protected BlendOps repository path '${topSeg}': ${rawPath}`,
      );
    }
    if (kind === 'out' && topSeg === 'dist' && relFromRepo.split(path.sep).length < 2) {
      throw new Error(
        `Unsafe --out destination: must be a subdirectory inside dist/, not dist/ itself: ${rawPath}`,
      );
    }
  }

  // Check if any existing ancestor from filesystem root down to absCandidate is a symlink when absCandidate itself is a symlink
  let lstat = null;
  try {
    lstat = fs.lstatSync(absCandidate);
  } catch (err) {
    if (!err || err.code !== 'ENOENT') {
      throw err;
    }
  }

  if (lstat) {
    if (lstat.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link for --${kind} path: ${rawPath}`);
    }
    if (!lstat.isDirectory()) {
      throw new Error(`--${kind} path exists and is not a directory: ${rawPath}`);
    }
  } else if (mustExist) {
    throw new Error(`Target --${kind} directory does not exist: ${rawPath}`);
  } else {
    // Check nearest existing ancestor is a directory and not a symlink
    let cursor = path.dirname(absCandidate);
    while (!fs.existsSync(cursor)) {
      const parent = path.dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
    const ancestorLstat = fs.lstatSync(cursor);
    if (ancestorLstat.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link ancestor for --${kind} path: ${cursor}`);
    }
    if (!ancestorLstat.isDirectory()) {
      throw new Error(`Ancestor of --${kind} path is not a directory: ${cursor}`);
    }
  }

  return effectiveCandidate;
}

function validateSafeRelativeTargetFile(rootReal, relPath) {
  if (typeof relPath !== 'string' || relPath.trim().length === 0 || relPath.includes('\0')) {
    throw new Error(`Invalid relative target file path: ${JSON.stringify(relPath)}`);
  }
  const norm = relPath.replace(/\\/g, '/');
  if (norm.startsWith('/') || norm.split('/').includes('..') || norm.split('/').includes('.')) {
    throw new Error(`Path traversal or non-normalized relative path rejected: ${relPath}`);
  }
  // Never allow plain .md inside .cursor/rules/
  if (norm.startsWith('.cursor/rules/') && norm.endsWith('.md')) {
    throw new Error(
      `Forbidden Cursor rule path (${norm}): plain .md files inside .cursor/rules/ are ignored by Cursor; only .mdc with frontmatter is allowed`,
    );
  }

  const absTarget = path.resolve(rootReal, norm);
  assertNoSymlinkedAncestorsWithin(rootReal, absTarget);

  let lstat = null;
  try {
    lstat = fs.lstatSync(absTarget);
  } catch (err) {
    if (!err || err.code !== 'ENOENT') {
      throw err;
    }
  }

  if (lstat) {
    if (lstat.isSymbolicLink()) {
      throw new Error(`Refusing to read or write symbolic link target file: ${norm}`);
    }
    if (lstat.isDirectory()) {
      throw new Error(`Type confusion: target file path is a directory: ${norm}`);
    }
    if (!lstat.isFile()) {
      throw new Error(`Target path is not a regular file: ${norm}`);
    }
    if (typeof lstat.nlink === 'number' && lstat.nlink > 1) {
      throw new Error(
        `Refusing to modify hardlinked file (${norm} has nlink=${lstat.nlink})`,
      );
    }
  }

  return { norm, absTarget, exists: Boolean(lstat), lstat };
}

export function parseInstallerArgs(argv = []) {
  let subcommand = null;
  let target = null;
  let project = null;
  let out = null;
  let doctor = false;
  let dryRun = false;
  let write = false;
  let rollback = false;
  let forceRollback = false;
  let allowGlobal = false;
  let confirmTargetPath = false;
  let patchAgentsMd = false;
  let patchClaudeMd = false;
  let help = false;
  let version = false;

  const takeValue = (flagName, currentVal, args, index) => {
    if (currentVal !== null) {
      throw new Error(`Duplicate ${flagName} argument`);
    }
    if (index + 1 >= args.length) {
      throw new Error(`Missing value for ${flagName}`);
    }
    const next = args[index + 1];
    if (typeof next !== 'string' || next.trim() === '' || next.startsWith('-')) {
      throw new Error(`Invalid value for ${flagName}: ${String(next)}`);
    }
    return next.trim();
  };

  const takeEqValue = (flagName, currentVal, rawArg) => {
    if (currentVal !== null) {
      throw new Error(`Duplicate ${flagName} argument`);
    }
    const val = rawArg.slice(`${flagName}=`.length).trim();
    if (!val || val.startsWith('-')) {
      throw new Error(`Invalid value for ${flagName}: ${rawArg}`);
    }
    return val;
  };

  const KNOWN_SUBCOMMANDS = new Set(['doctor', 'install', 'rollback', 'version', 'help']);

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (i === 0 && typeof arg === 'string' && !arg.startsWith('-') && KNOWN_SUBCOMMANDS.has(arg)) {
      subcommand = arg;
      if (arg === 'doctor') {
        doctor = true;
      } else if (arg === 'rollback') {
        rollback = true;
      } else if (arg === 'version') {
        version = true;
      } else if (arg === 'help') {
        help = true;
      }
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--version' || arg === '-v') {
      version = true;
    } else if (arg === '--target') {
      target = takeValue('--target', target, argv, i);
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--target=')) {
      target = takeEqValue('--target', target, arg);
    } else if (arg === '--project') {
      project = takeValue('--project', project, argv, i);
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--project=')) {
      project = takeEqValue('--project', project, arg);
    } else if (arg === '--out' || arg === '--output') {
      out = takeValue('--out', out, argv, i);
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--out=')) {
      out = takeEqValue('--out', out, arg);
    } else if (typeof arg === 'string' && arg.startsWith('--output=')) {
      out = takeEqValue('--output', out, arg);
    } else if (arg === '--doctor') {
      doctor = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--write') {
      write = true;
    } else if (arg === '--rollback') {
      rollback = true;
    } else if (arg === '--force-rollback' || arg === '--force') {
      forceRollback = true;
    } else if (arg === '--allow-global') {
      allowGlobal = true;
    } else if (typeof arg === 'string' && arg.startsWith('--allow-global=')) {
      allowGlobal = true;
    } else if (arg === '--confirm-target-path') {
      confirmTargetPath = true;
    } else if (arg === '--patch-agents-md') {
      patchAgentsMd = true;
    } else if (arg === '--patch-claude-md') {
      patchClaudeMd = true;
    } else {
      throw new Error(`Unknown or malformed CLI argument: ${String(arg)}`);
    }
  }

  if (allowGlobal) {
    throw new Error(
      'Global installation (--allow-global) is disabled in Phase 10; BlendOps installer only supports project-local (--project) or bundle-output (--out) scopes.',
    );
  }

  if (help) {
    return {
      mode: 'help',
      subcommand,
      target,
      project,
      out,
      forceRollback,
      confirmTargetPath,
      patchAgentsMd,
      patchClaudeMd,
    };
  }

  const activeModes = [
    version ? 'version' : null,
    doctor ? 'doctor' : null,
    dryRun ? 'dry-run' : null,
    write ? 'write' : null,
    rollback ? 'rollback' : null,
  ].filter(Boolean);

  if (subcommand === 'install' && (doctor || rollback || version)) {
    throw new Error(
      `Conflicting operation modes (install, ${activeModes.join(', ')}): specify exactly one mode per invocation.`,
    );
  }

  if (activeModes.length === 0) {
    if (subcommand === 'install') {
      throw new Error(
        "Missing operation mode for 'install': specify either --dry-run or --write.",
      );
    }
    throw new Error(
      'Missing operation mode: specify a command (doctor, install, rollback) or one of --doctor, --dry-run, --write, --rollback, --version, or --help.',
    );
  }
  if (activeModes.length > 1) {
    throw new Error(
      `Conflicting operation modes (${activeModes.join(', ')}): specify exactly one mode per invocation.`,
    );
  }

  const mode = activeModes[0];

  if (mode === 'version') {
    return {
      mode: 'version',
      subcommand,
      target,
      project,
      out,
      forceRollback,
      confirmTargetPath,
      patchAgentsMd,
      patchClaudeMd,
    };
  }

  if (forceRollback && mode !== 'rollback') {
    throw new Error('--force / --force-rollback is only valid with --rollback.');
  }

  if (mode === 'dry-run' || mode === 'write') {
    if (!target && subcommand === 'install' && project && !out) {
      target = 'auto';
    }
    if (!target) {
      throw new Error(`Missing required --target <name> for --${mode}.`);
    }
    if (!Object.hasOwn(SUPPORTED_TARGETS, target)) {
      throw new Error(
        `Unsupported --target '${target}'. Supported targets: ${Object.keys(SUPPORTED_TARGETS).join(', ')}`,
      );
    }
    const targetSpec = SUPPORTED_TARGETS[target];
    if (targetSpec.requiresOut) {
      if (!out) {
        throw new Error(`Target '${target}' requires --out <path>.`);
      }
      if (project) {
        throw new Error(`Target '${target}' uses --out <path> and does not accept --project.`);
      }
    }
    if (targetSpec.requiresProject) {
      if (!project) {
        throw new Error(`Target '${target}' requires --project <path>.`);
      }
      if (out) {
        throw new Error(`Target '${target}' uses --project <path> and does not accept --out.`);
      }
    }
  } else if (mode === 'rollback') {
    if (!project && !out) {
      throw new Error('--rollback requires --project <path> (or --out <path>).');
    }
    if (project && out) {
      throw new Error('--rollback accepts either --project <path> or --out <path>, not both.');
    }
  } else if (mode === 'doctor') {
    if (target && !Object.hasOwn(SUPPORTED_TARGETS, target)) {
      throw new Error(
        `Unsupported --target '${target}'. Supported targets: ${Object.keys(SUPPORTED_TARGETS).join(', ')}`,
      );
    }
  }

  return {
    mode,
    subcommand,
    target,
    project,
    out,
    forceRollback,
    confirmTargetPath,
    patchAgentsMd,
    patchClaudeMd,
  };
}

export function detectProjectTargetMarkers(projectRoot) {
  const realProject = fs.realpathSync(projectRoot);
  const detectedByTarget = [];

  for (const entry of TARGET_DETECTION_MARKERS) {
    const matchedMarkers = [];
    for (const relMarker of entry.markers) {
      const absMarker = path.join(realProject, relMarker);
      try {
        const lstat = fs.lstatSync(absMarker);
        if (lstat.isSymbolicLink()) {
          throw new Error(
            `Refusing symbolic link project marker inside target project: ${relMarker}`,
          );
        }
        matchedMarkers.push(relMarker);
      } catch (err) {
        if (err && err.code === 'ENOENT') {
          continue;
        }
        throw err;
      }
    }
    if (matchedMarkers.length > 0) {
      detectedByTarget.push({
        target: entry.target,
        confidence: SUPPORTED_TARGETS[entry.target].confidence,
        markers: matchedMarkers,
      });
    }
  }

  return detectedByTarget;
}

function compareCodeUnitOrder(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function assertCanonicalInsideRepoRoot(realRepoRoot, absPath, relLabel) {
  const realTarget = fs.realpathSync(absPath);
  const rel = path.relative(realRepoRoot, realTarget);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(
      `BlendOps source file escapes canonical repository root (${realRepoRoot}): ${relLabel}`,
    );
  }
}

export function computeBlendOpsSourceFingerprint(repoRoot = DEFAULT_REPO_ROOT) {
  if (!fs.existsSync(repoRoot)) {
    throw new Error(`Missing BlendOps repository root: ${repoRoot}`);
  }
  const realRepoRoot = fs.realpathSync(repoRoot);
  const requiredExactFiles = [
    'bundles/generic-project-local/BLENDOPS.md',
    'bundles/generic-project-local/ROLLBACK.md',
    'bundles/generic-project-local/INSTALL_REPORT_TEMPLATE.md',
    'bundles/generic-project-local/manifest.json',
    'bundles/claude-desktop-manual/manifest.json',
    'scripts/export-claude-skills.mjs',
  ];

  for (const rel of requiredExactFiles) {
    const abs = path.join(realRepoRoot, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`Missing required BlendOps source file: ${rel}`);
    }
    const lstat = fs.lstatSync(abs);
    if (lstat.isSymbolicLink() || !lstat.isFile()) {
      throw new Error(`Unsafe or non-regular BlendOps source file: ${rel}`);
    }
    assertCanonicalInsideRepoRoot(realRepoRoot, abs, rel);
    const content = fs.readFileSync(abs);
    if (content.length === 0) {
      throw new Error(`Empty required BlendOps source file: ${rel}`);
    }
    if (rel.endsWith('.json')) {
      let parsed;
      try {
        parsed = JSON.parse(content.toString('utf8'));
      } catch {
        throw new Error(`Malformed JSON in BlendOps source manifest: ${rel}`);
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error(`Invalid BlendOps source manifest structure in ${rel}`);
      }
      if (
        rel === 'bundles/generic-project-local/manifest.json' &&
        (typeof parsed.target !== 'string' || !Array.isArray(parsed.files))
      ) {
        throw new Error(`Malformed generic-project-local manifest schema in ${rel}`);
      }
      if (
        rel === 'bundles/claude-desktop-manual/manifest.json' &&
        (typeof parsed.bundle_name !== 'string' ||
          typeof parsed.target !== 'string' ||
          !Array.isArray(parsed.files))
      ) {
        throw new Error(`Malformed claude-desktop-manual manifest schema in ${rel}`);
      }
    }
  }

  const collectedRelFiles = new Set(['scripts/export-claude-skills.mjs']);

  function walkSourceSubtree(relDir, { skipTopChildName = null } = {}) {
    const absDir = path.join(realRepoRoot, relDir);
    if (!fs.existsSync(absDir)) {
      throw new Error(`Missing required BlendOps source directory: ${relDir}`);
    }
    const dirLstat = fs.lstatSync(absDir);
    if (dirLstat.isSymbolicLink() || !dirLstat.isDirectory()) {
      throw new Error(`Unsafe or non-directory BlendOps source path: ${relDir}`);
    }
    assertCanonicalInsideRepoRoot(realRepoRoot, absDir, relDir);

    const entries = fs
      .readdirSync(absDir, { withFileTypes: true })
      .sort((a, b) => compareCodeUnitOrder(a.name, b.name));

    for (const entry of entries) {
      if (skipTopChildName && entry.name === skipTopChildName) {
        continue;
      }
      const childRel = `${relDir.replace(/\\/g, '/')}/${entry.name}`;
      const childAbs = path.join(absDir, entry.name);
      const childLstat = fs.lstatSync(childAbs);
      if (childLstat.isSymbolicLink()) {
        throw new Error(`Unsafe symbolic link in BlendOps source tree: ${childRel}`);
      }
      assertCanonicalInsideRepoRoot(realRepoRoot, childAbs, childRel);

      if (childLstat.isDirectory()) {
        walkSourceSubtree(childRel);
      } else if (childLstat.isFile()) {
        collectedRelFiles.add(childRel);
      } else {
        throw new Error(`Unsupported non-regular file in BlendOps source tree: ${childRel}`);
      }
    }
  }

  walkSourceSubtree('bundles/generic-project-local');
  walkSourceSubtree('bundles/claude-desktop-manual');
  walkSourceSubtree('skills', { skipTopChildName: '_template' });

  const skillsDir = path.join(realRepoRoot, 'skills');
  const skillDirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .sort(compareCodeUnitOrder);
  if (skillDirs.length === 0) {
    throw new Error(`No canonical skills found in ${skillsDir}`);
  }

  const skillNames = [];
  for (const name of skillDirs) {
    const skillMdRel = `skills/${name}/SKILL.md`;
    const evalMdRel = `skills/${name}/EVAL.md`;
    const skillMdAbs = path.join(realRepoRoot, skillMdRel);
    const evalMdAbs = path.join(realRepoRoot, evalMdRel);
    if (!fs.existsSync(skillMdAbs)) {
      throw new Error(`Missing SKILL.md for canonical skill '${name}' in ${skillsDir}`);
    }
    if (!fs.existsSync(evalMdAbs)) {
      throw new Error(`Missing EVAL.md for canonical skill '${name}' in ${skillsDir}`);
    }
    skillNames.push(name);
  }

  const sortedRelFiles = [...collectedRelFiles].sort(compareCodeUnitOrder);
  const hash = crypto.createHash('sha256');
  for (const relPosix of sortedRelFiles) {
    const absFile = path.join(realRepoRoot, relPosix);
    const content = fs.readFileSync(absFile);
    const fileDigest = sha256Buffer(content);
    hash.update(`file:${relPosix}:${content.length}:${fileDigest}\0`);
  }
  hash.update(`skills:${skillNames.length}:${skillNames.join(',')}\0`);

  return {
    fingerprint: hash.digest('hex'),
    skillCount: skillNames.length,
    skillNames,
    sourceFileCount: sortedRelFiles.length,
  };
}

function buildManagedBlendOpsSection({ selectedTarget, effectiveBehavior }) {
  return [
    MANAGED_SECTION_START,
    '## BlendOps Project-Local Guidance',
    '',
    `Target profile: \`${selectedTarget}\` (attachment mode: \`${effectiveBehavior}\`)`,
    '',
    'Read [`BLENDOPS.md`](./BLENDOPS.md) at the repository root for the canonical BlendOps workflow guidance, 2-path + CLI appendix runtime model, and evidence truth states.',
    '',
    '- Skill install is separate from Blender runtime setup.',
    '- Runtime status: `Not Run`',
    '- Artifact status: `Not Produced`',
    '- Do not claim preview, render, or GLB artifacts without verified evidence.',
    MANAGED_SECTION_END,
  ].join('\n');
}

function buildCanonicalBlendOpsMd(repoRoot, { selectedTarget, confidence, effectiveBehavior }) {
  const baseTemplate = fs
    .readFileSync(path.join(repoRoot, 'bundles', 'generic-project-local', 'BLENDOPS.md'), 'utf8')
    .trimEnd();
  return [
    MANAGED_SECTION_START,
    baseTemplate,
    '',
    '## Installer attachment metadata',
    '',
    `- Target selected: \`${selectedTarget}\``,
    `- Confidence: \`${confidence}\``,
    `- Attachment behavior: \`${effectiveBehavior}\``,
    '- Runtime status: `Not Run`',
    '- Artifact status: `Not Produced`',
    MANAGED_SECTION_END,
    '',
  ].join('\n');
}

function buildCursorRuleMdcManagedBlock({ selectedTarget, confidence }) {
  return [
    MANAGED_SECTION_START,
    '# BlendOps Cursor Project Rule',
    '',
    `Target profile: \`${selectedTarget}\` (\`${confidence}\`)`,
    '',
    'Refer to [`BLENDOPS.md`](../../BLENDOPS.md) at the project root for the full BlendOps workflow guidance, 2-path + CLI appendix runtime boundaries, and evidence truth states.',
    '',
    '- Skill install does not configure `.cursor/mcp.json`, install Blender, or run Blender.',
    '- Runtime status: `Not Run`',
    '- Artifact status: `Not Produced`',
    MANAGED_SECTION_END,
  ].join('\n');
}

function buildCursorRuleMdcContent({ selectedTarget, confidence }) {
  return [
    '---',
    'description: BlendOps project-local workflow guidance for Blender planning, readiness, evidence, and handoff (Runtime: Not Run, Artifacts: Not Produced)',
    'globs:',
    'alwaysApply: false',
    '---',
    '',
    buildCursorRuleMdcManagedBlock({ selectedTarget, confidence }),
    '',
  ].join('\n');
}

function countOccurrences(text, needle) {
  if (!needle) return 0;
  let count = 0;
  let pos = 0;
  while (true) {
    const idx = text.indexOf(needle, pos);
    if (idx === -1) break;
    count += 1;
    pos = idx + needle.length;
  }
  return count;
}

function inspectManagedMarkers(text) {
  const startCount = countOccurrences(text, MANAGED_SECTION_START);
  const endCount = countOccurrences(text, MANAGED_SECTION_END);

  if (startCount === 0 && endCount === 0) {
    return {
      status: 'none',
      startIdx: -1,
      endIdx: -1,
      managedBlock: null,
    };
  }
  if (startCount !== 1 || endCount !== 1) {
    return {
      status: 'malformed',
      reason: `expected exactly 1 '${MANAGED_SECTION_START}' and 1 '${MANAGED_SECTION_END}', found ${startCount} start and ${endCount} end marker(s)`,
      startIdx: -1,
      endIdx: -1,
      managedBlock: null,
    };
  }

  const startIdx = text.indexOf(MANAGED_SECTION_START);
  const endIdx = text.indexOf(MANAGED_SECTION_END);
  if (endIdx < startIdx) {
    return {
      status: 'malformed',
      reason: `'${MANAGED_SECTION_END}' appears before '${MANAGED_SECTION_START}'`,
      startIdx,
      endIdx,
      managedBlock: null,
    };
  }

  return {
    status: 'valid',
    startIdx,
    endIdx,
    managedBlock: text.slice(startIdx, endIdx + MANAGED_SECTION_END.length),
  };
}

function applyManagedBlockToDocument(existingContent, managedBlock, defaultHeaderTitle) {
  if (existingContent === null || existingContent === undefined) {
    if (!defaultHeaderTitle) {
      return managedBlock.endsWith('\n') ? managedBlock : `${managedBlock}\n`;
    }
    return `${defaultHeaderTitle}\n\n${managedBlock.trim()}\n`;
  }

  const markerInfo = inspectManagedMarkers(existingContent);
  if (markerInfo.status === 'malformed') {
    throw new Error(
      `Cannot apply managed BlendOps section: existing document has malformed markers (${markerInfo.reason}).`,
    );
  }

  if (markerInfo.status === 'valid') {
    const before = existingContent.slice(0, markerInfo.startIdx);
    const after = existingContent.slice(markerInfo.endIdx + MANAGED_SECTION_END.length);
    return `${before}${managedBlock.trim()}${after}`;
  }

  const trimmed = existingContent.replace(/\s+$/, '');
  return `${trimmed}\n\n${managedBlock.trim()}\n`;
}

function planSingleFileOperation(projectReal, relPath, desiredContent, options = {}) {
  const { norm, absTarget, exists } = validateSafeRelativeTargetFile(projectReal, relPath);
  const previousManifest = options.previousManifest || null;
  const initialFileContent =
    options.initialFileContent !== undefined ? options.initialFileContent : desiredContent;
  const extractedFromInitial = inspectManagedMarkers(initialFileContent);
  const canonicalManagedBlock = (
    options.managedBlock !== undefined
      ? options.managedBlock
      : extractedFromInitial.status === 'valid'
        ? extractedFromInitial.managedBlock
        : desiredContent
  ).trim();
  const desiredManagedBlockSha256 = sha256String(canonicalManagedBlock);

  const wasCreatedByInstaller = Boolean(
    previousManifest &&
      Array.isArray(previousManifest.files_created) &&
      previousManifest.files_created.includes(norm),
  );
  const wasModifiedByInstaller = Boolean(
    previousManifest &&
      Array.isArray(previousManifest.files_modified) &&
      previousManifest.files_modified.includes(norm),
  );
  const prevCreatedHash = wasCreatedByInstaller
    ? previousManifest.created_file_hashes?.[norm]
    : null;
  const prevModifiedMeta = wasModifiedByInstaller
    ? previousManifest.modified_file_hashes?.[norm]
    : null;

  if (!exists) {
    if (wasModifiedByInstaller) {
      throw new Error(
        `Refusing to modify '${norm}': previously modified target file is missing on disk; restore the file or run --rollback --force-rollback before re-running.`,
      );
    }
    const desiredBuf = Buffer.from(initialFileContent, 'utf8');
    const desiredSha256 = sha256Buffer(desiredBuf);
    return {
      action: 'create',
      path: norm,
      absPath: absTarget,
      desiredContent: initialFileContent,
      desiredSha256,
      desiredManagedBlockSha256,
      preExistingSha256: null,
      backupRelPath: null,
      transitionedFromCreated: false,
    };
  }

  const currentBuf = fs.readFileSync(absTarget);
  if (currentBuf.includes(0x00)) {
    throw new Error(
      `Refusing to modify binary or NUL-containing file '${norm}': preservation of user content cannot be guaranteed.`,
    );
  }
  const currentSha256 = sha256Buffer(currentBuf);
  const currentText = currentBuf.toString('utf8');

  const userEditedCreatedFile = Boolean(
    wasCreatedByInstaller && (!isSha256Hex(prevCreatedHash) || currentSha256 !== prevCreatedHash),
  );
  const userEditedModifiedFile = Boolean(
    wasModifiedByInstaller &&
      (!prevModifiedMeta ||
        !isSha256Hex(prevModifiedMeta.post_install_sha256) ||
        currentSha256 !== prevModifiedMeta.post_install_sha256),
  );

  const markerInfo = inspectManagedMarkers(currentText);
  if (markerInfo.status === 'malformed') {
    throw new Error(
      `Refusing to modify '${norm}': managed BlendOps section markers are malformed or duplicated (${markerInfo.reason}), so user edits cannot be safely preserved.`,
    );
  }

  if (markerInfo.status === 'none') {
    if (wasCreatedByInstaller || wasModifiedByInstaller) {
      throw new Error(
        `Refusing to modify '${norm}': file was modified after installation and its managed BlendOps section markers were removed, so user edits cannot be safely preserved.`,
      );
    }
  } else if (markerInfo.status === 'valid') {
    const currentManagedBlockHash = sha256String(markerInfo.managedBlock.trim());
    if (userEditedCreatedFile) {
      const expectedPrevManagedHash = previousManifest?.created_managed_block_hashes?.[norm];
      if (isSha256Hex(expectedPrevManagedHash) && currentManagedBlockHash !== expectedPrevManagedHash) {
        throw new Error(
          `Refusing to modify '${norm}': installer-created file was edited inside the managed BlendOps section, so preservation of user edits cannot be guaranteed.`,
        );
      }
      // Fallback check when created_managed_block_hashes was not recorded: if outside text matches initial template, edit was inside managed block
      const initialWithCurrentManaged = applyManagedBlockToDocument(
        initialFileContent,
        markerInfo.managedBlock,
        null,
      );
      if (currentText === initialWithCurrentManaged) {
        throw new Error(
          `Refusing to modify '${norm}': installer-created file was edited inside the managed BlendOps section, so preservation of user edits cannot be guaranteed.`,
        );
      }
    }
    if (userEditedModifiedFile) {
      throw new Error(
        `Refusing to modify '${norm}': file in files_modified was edited after installation (expected post-install SHA-256 ${prevModifiedMeta?.post_install_sha256?.slice(0, 12) || 'unknown'}, got ${currentSha256.slice(0, 12)}), so preserving both the original pre-install backup and new post-install user edits cannot be guaranteed.`,
      );
    }
  }

  const mergedText = applyManagedBlockToDocument(currentText, canonicalManagedBlock, null);
  const mergedBuf = Buffer.from(mergedText, 'utf8');
  const mergedSha256 = sha256Buffer(mergedBuf);
  const encodedBackupName = `${norm.replace(/\//g, '__')}.bak`;
  const backupRelPath = `.blendops/backups/${encodedBackupName}`;

  if (userEditedCreatedFile) {
    return {
      action: 'modify',
      path: norm,
      absPath: absTarget,
      desiredContent: mergedText,
      desiredSha256: mergedSha256,
      desiredManagedBlockSha256,
      preExistingSha256: currentSha256,
      backupRelPath,
      transitionedFromCreated: true,
    };
  }

  if (currentSha256 === mergedSha256 && currentBuf.equals(mergedBuf)) {
    return {
      action: 'skip',
      path: norm,
      absPath: absTarget,
      reason: 'Managed section already up to date (idempotent)',
      desiredContent: mergedText,
      desiredSha256: mergedSha256,
      desiredManagedBlockSha256,
      preExistingSha256: currentSha256,
      backupRelPath: null,
      transitionedFromCreated: false,
    };
  }

  return {
    action: 'modify',
    path: norm,
    absPath: absTarget,
    desiredContent: mergedText,
    desiredSha256: mergedSha256,
    desiredManagedBlockSha256,
    preExistingSha256: currentSha256,
    backupRelPath: wasCreatedByInstaller ? null : backupRelPath,
    transitionedFromCreated: false,
  };
}

function captureTargetStateSnapshot(targetRootReal, candidateRelPaths, detectedMarkers) {
  const fileStates = {};
  const sortedPaths = [...new Set(candidateRelPaths)].sort();

  for (const relPath of sortedPaths) {
    const { norm, absTarget, exists } = validateSafeRelativeTargetFile(targetRootReal, relPath);
    if (!exists) {
      fileStates[norm] = { exists: false, sha256: null, size: 0 };
    } else {
      const buf = fs.readFileSync(absTarget);
      fileStates[norm] = {
        exists: true,
        sha256: sha256Buffer(buf),
        size: buf.length,
      };
    }
  }

  return {
    detectedMarkers: detectedMarkers.map((d) => ({
      target: d.target,
      markers: [...d.markers].sort(),
    })),
    fileStates,
  };
}

export function validatePlanStoreDirectory(
  rawPlanDir,
  { repoRootReal = DEFAULT_REPO_ROOT, targetRootReal = null } = {},
) {
  if (typeof rawPlanDir !== 'string' || rawPlanDir.trim().length === 0 || rawPlanDir.includes('\0')) {
    throw new Error('Invalid planDir path: must be a non-empty path string');
  }
  const trimmed = rawPlanDir.trim();
  if (trimmed === '~' || trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    throw new Error(`Global home-directory planDir (${trimmed}) is rejected`);
  }
  if (/^[a-zA-Z]:[\\/]?$/.test(trimmed) || trimmed.startsWith('\\\\')) {
    throw new Error(`Unsafe planDir path (Windows drive root or UNC path is forbidden): ${rawPlanDir}`);
  }

  const normalizedInput = trimmed.replace(/\\/g, path.sep);
  const absCandidate = path.resolve(normalizedInput);
  const parsedRoot = path.parse(absCandidate).root;
  if (absCandidate === parsedRoot) {
    throw new Error(`Unsafe planDir path (filesystem root is forbidden): ${rawPlanDir}`);
  }

  const tmpResolved = path.resolve(os.tmpdir());
  const tmpReal = fs.existsSync(tmpResolved) ? fs.realpathSync(tmpResolved) : tmpResolved;
  const effectiveCandidate = resolveWithExistingAncestorRealpath(absCandidate);

  if (absCandidate === tmpResolved || effectiveCandidate === tmpReal) {
    throw new Error(`Unsafe planDir path (OS temp root itself is forbidden): ${rawPlanDir}`);
  }

  if (isGlobalAgentPath(absCandidate) || isGlobalAgentPath(effectiveCandidate)) {
    throw new Error(`Global configuration planDir (${rawPlanDir}) is rejected`);
  }

  const realRepo = fs.existsSync(repoRootReal) ? fs.realpathSync(repoRootReal) : path.resolve(repoRootReal);
  const relFromRepoToPlan = path.relative(realRepo, effectiveCandidate);
  const relFromPlanToRepo = path.relative(effectiveCandidate, realRepo);
  if (
    effectiveCandidate === realRepo ||
    (relFromRepoToPlan !== '' && !relFromRepoToPlan.startsWith('..') && !path.isAbsolute(relFromRepoToPlan)) ||
    (relFromPlanToRepo !== '' && !relFromPlanToRepo.startsWith('..') && !path.isAbsolute(relFromPlanToRepo))
  ) {
    throw new Error(
      `Unsafe planDir path (cannot be inside or an ancestor of the BlendOps repository root): ${rawPlanDir}`,
    );
  }

  if (targetRootReal) {
    const relFromTargetToPlan = path.relative(targetRootReal, effectiveCandidate);
    const relFromPlanToTarget = path.relative(effectiveCandidate, targetRootReal);
    if (
      effectiveCandidate === targetRootReal ||
      (relFromTargetToPlan !== '' &&
        !relFromTargetToPlan.startsWith('..') &&
        !path.isAbsolute(relFromTargetToPlan)) ||
      (relFromPlanToTarget !== '' &&
        !relFromPlanToTarget.startsWith('..') &&
        !path.isAbsolute(relFromPlanToTarget))
    ) {
      throw new Error(
        `Unsafe planDir path (cannot be inside or an ancestor of the target project/output root): ${rawPlanDir}`,
      );
    }
  }

  // Verify no existing segment from absCandidate up to its nearest existing directory is a symlink
  let cursor = absCandidate;
  while (true) {
    let lstat = null;
    try {
      lstat = fs.lstatSync(cursor);
    } catch (err) {
      if (!err || err.code !== 'ENOENT') {
        throw err;
      }
    }
    if (lstat) {
      if (lstat.isSymbolicLink()) {
        throw new Error(`Refusing symbolic link in planDir path: ${cursor}`);
      }
      if (!lstat.isDirectory()) {
        throw new Error(`Unsafe planDir path (existing non-directory at ${cursor})`);
      }
      break;
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  return effectiveCandidate;
}

function resolvePlanStorePath({
  planDir,
  repoRootReal,
  targetRootReal,
  requestedTarget,
}) {
  const defaultPlanDir = path.join(os.tmpdir(), 'blendops-installer-plans');
  const rawPlanDir = planDir || process.env.BLENDOPS_INSTALLER_PLAN_DIR || defaultPlanDir;
  const validatedPlanDir = validatePlanStoreDirectory(rawPlanDir, {
    repoRootReal,
    targetRootReal,
  });
  const key = sha256String(`${repoRootReal}::${targetRootReal}::${requestedTarget}`).slice(0, 24);
  const planFilePath = path.join(validatedPlanDir, `plan-${key}.json`);

  let existingLstat = null;
  try {
    existingLstat = fs.lstatSync(planFilePath);
  } catch (err) {
    if (!err || err.code !== 'ENOENT') {
      throw err;
    }
  }
  if (existingLstat) {
    if (
      existingLstat.isSymbolicLink() ||
      !existingLstat.isFile() ||
      (typeof existingLstat.nlink === 'number' && existingLstat.nlink > 1)
    ) {
      throw new Error(`Unsafe existing plan file at ${planFilePath}`);
    }
  }

  return planFilePath;
}

function buildProjectInstallPlan({
  repoRootReal,
  projectReal,
  requestedTarget,
  confirmTargetPath,
  patchAgentsMd,
  patchClaudeMd = false,
}) {
  const detectedMarkers = detectProjectTargetMarkers(projectReal);
  const sourceInfo = computeBlendOpsSourceFingerprint(repoRootReal);

  let selectedTarget = requestedTarget;
  let confidence = SUPPORTED_TARGETS[requestedTarget].confidence;
  let effectiveBehavior = 'generic-project';
  const limitations = [];
  const skippedEntries = [];

  if (requestedTarget === 'auto') {
    if (detectedMarkers.length > 1) {
      const choices = detectedMarkers.map((d) => `${d.target} (${d.markers.join(', ')})`).join('; ');
      throw new Error(
        `Ambiguous target detection: multiple target markers found in ${projectReal}: ${choices}. Stop before writing and specify an explicit --target <name>.`,
      );
    }
    if (detectedMarkers.length === 0) {
      selectedTarget = 'generic-project';
      confidence = 'verified-read';
      effectiveBehavior = 'generic-project';
      limitations.push(
        'No tool-specific project markers detected; using verified-read generic-project fallback (BLENDOPS.md).',
      );
    } else {
      const single = detectedMarkers[0];
      selectedTarget = single.target;
      confidence = single.confidence;
      if (single.target === 'claude-code') {
        effectiveBehavior = 'claude-code-project-local';
      } else {
        effectiveBehavior = 'generic-project';
        limitations.push(
          `Detected '${single.target}' marker (${single.markers.join(', ')}) with '${single.confidence}' confidence; using safe generic-project fallback (BLENDOPS.md) unless --target ${single.target} --confirm-target-path is explicitly specified.`,
        );
      }
    }
  } else {
    selectedTarget = requestedTarget;
    confidence = SUPPORTED_TARGETS[requestedTarget].confidence;
    if (selectedTarget === 'generic-project') {
      effectiveBehavior = 'generic-project';
    } else if (selectedTarget === 'claude-code') {
      effectiveBehavior = 'claude-code-project-local';
    } else if (selectedTarget === 'cursor') {
      if (confirmTargetPath) {
        effectiveBehavior = 'cursor-mdc-project-local';
      } else {
        effectiveBehavior = 'generic-project';
      }
    } else if (selectedTarget === 'codex') {
      if (confirmTargetPath || patchAgentsMd) {
        effectiveBehavior = 'codex-agents-project-local';
      } else {
        effectiveBehavior = 'generic-project';
      }
    } else {
      // opencode, gemini, antigravity, github-copilot: native paths are unverified/not researched
      effectiveBehavior = 'generic-project';
    }
  }

  const rollbackManifestRel = '.blendops/install-manifest.json';
  const installReportRel = '.blendops/INSTALL_REPORT.md';

  const journalCandidateAbs = path.join(projectReal, '.blendops', 'transaction-journal.json');
  try {
    if (fs.lstatSync(journalCandidateAbs).isFile()) {
      recoverPendingTransactionJournal(projectReal);
    }
  } catch (err) {
    if (!err || (err.code !== 'ENOENT' && err.code !== 'ENOTDIR')) {
      throw err;
    }
  }

  let previousManifest = null;
  const { absTarget: prevManifestAbs, exists: prevManifestExists } =
    validateSafeRelativeTargetFile(projectReal, rollbackManifestRel);
  if (prevManifestExists) {
    try {
      previousManifest = JSON.parse(fs.readFileSync(prevManifestAbs, 'utf8'));
    } catch {
      throw new Error(`Malformed existing rollback manifest JSON at ${prevManifestAbs}`);
    }
    validateRollbackManifestSchema(previousManifest, prevManifestAbs);
  }

  const operations = [];
  const blendopsMdContent = buildCanonicalBlendOpsMd(repoRootReal, {
    selectedTarget,
    confidence,
    effectiveBehavior,
  });
  operations.push(
    planSingleFileOperation(projectReal, 'BLENDOPS.md', blendopsMdContent, {
      managedBlock: blendopsMdContent.trim(),
      initialFileContent: blendopsMdContent,
      previousManifest,
    }),
  );

  const managedSection = buildManagedBlendOpsSection({
    selectedTarget,
    effectiveBehavior,
  });

  if (selectedTarget === 'claude-code') {
    const claudeInitial = applyManagedBlockToDocument(null, managedSection, '# CLAUDE.md');
    operations.push(
      planSingleFileOperation(projectReal, 'CLAUDE.md', claudeInitial, {
        managedBlock: managedSection,
        initialFileContent: claudeInitial,
        previousManifest,
      }),
    );
    skippedEntries.push({
      path: '.claude/skills/',
      reason:
        'Claude Code native .claude/skills/ loader path is unverified in this environment; using project-local CLAUDE.md + BLENDOPS.md attachment.',
    });
    limitations.push(
      'Claude Code project-local adapter (CLAUDE.md / BLENDOPS.md) is verified-read; native .claude/skills/ loader and live claude CLI execution remain unverified.',
    );
  } else if (patchClaudeMd) {
    const claudeInitial = applyManagedBlockToDocument(null, managedSection, '# CLAUDE.md');
    operations.push(
      planSingleFileOperation(projectReal, 'CLAUDE.md', claudeInitial, {
        managedBlock: managedSection,
        initialFileContent: claudeInitial,
        previousManifest,
      }),
    );
  }

  if (selectedTarget === 'cursor') {
    skippedEntries.push({
      path: '.cursor/rules/*.md',
      reason: 'Plain .md files under .cursor/rules/ are ignored by Cursor and are never written.',
    });
    if (effectiveBehavior === 'cursor-mdc-project-local') {
      const mdcManagedBlock = buildCursorRuleMdcManagedBlock({ selectedTarget, confidence });
      const mdcContent = buildCursorRuleMdcContent({ selectedTarget, confidence });
      operations.push(
        planSingleFileOperation(projectReal, '.cursor/rules/blendops.mdc', mdcContent, {
          managedBlock: mdcManagedBlock,
          initialFileContent: mdcContent,
          previousManifest,
        }),
      );
      limitations.push(
        'Cursor .cursor/rules/blendops.mdc is documented upstream (linked-only); live Cursor host verification and .cursor/mcp.json setup remain separate.',
      );
    } else {
      skippedEntries.push({
        path: '.cursor/rules/blendops.mdc',
        reason:
          'Cursor rule path (.cursor/rules/blendops.mdc) is linked-only; using generic BLENDOPS.md fallback unless --confirm-target-path is specified.',
      });
      limitations.push(
        'Cursor target is linked-only; installed BLENDOPS.md via generic-project fallback. Pass --confirm-target-path to also write .cursor/rules/blendops.mdc with frontmatter.',
      );
    }
  }

  const shouldPatchAgentsMd =
    patchAgentsMd ||
    (selectedTarget === 'codex' && (confirmTargetPath || effectiveBehavior === 'codex-agents-project-local'));

  if (selectedTarget === 'codex') {
    if (shouldPatchAgentsMd) {
      const agentsInitial = applyManagedBlockToDocument(null, managedSection, '# AGENTS.md');
      operations.push(
        planSingleFileOperation(projectReal, 'AGENTS.md', agentsInitial, {
          managedBlock: managedSection,
          initialFileContent: agentsInitial,
          previousManifest,
        }),
      );
      limitations.push(
        'Codex target is linked-only (no native Codex skills loader exists); AGENTS.md references BLENDOPS.md for Codex discovery.',
      );
    } else {
      skippedEntries.push({
        path: 'AGENTS.md',
        reason:
          'BLENDOPS.md alone is not auto-discovered by Codex; pass --patch-agents-md or --confirm-target-path to create/patch AGENTS.md with backup.',
      });
      limitations.push(
        'BLENDOPS.md alone is NOT auto-discovered by Codex unless referenced from AGENTS.md or added to project_doc_fallback_filenames; pass --patch-agents-md or --confirm-target-path to patch AGENTS.md with backup.',
      );
    }
  } else if (patchAgentsMd) {
    const agentsInitial = applyManagedBlockToDocument(null, managedSection, '# AGENTS.md');
    operations.push(
      planSingleFileOperation(projectReal, 'AGENTS.md', agentsInitial, {
        managedBlock: managedSection,
        initialFileContent: agentsInitial,
        previousManifest,
      }),
    );
  } else {
    skippedEntries.push({
      path: 'AGENTS.md',
      reason: 'Optional AGENTS.md patch not requested (pass --patch-agents-md to update with backup).',
    });
  }

  if (selectedTarget === 'opencode') {
    skippedEntries.push({
      path: '.opencode/',
      reason:
        'OpenCode native skill-loader path is candidate/unverified; using generic project-local BLENDOPS.md fallback.',
    });
    limitations.push(
      'OpenCode target is linked-only; no unverified .opencode/ native skill-loader directory was created.',
    );
  } else if (selectedTarget === 'gemini') {
    skippedEntries.push({
      path: 'GEMINI.md',
      reason:
        'Gemini CLI native adapter path is not researched/unverified; using generic project-local BLENDOPS.md fallback.',
    });
    limitations.push(
      'Gemini CLI target is linked-only/not researched; no unverified Gemini-native directory was created.',
    );
  } else if (selectedTarget === 'antigravity') {
    skippedEntries.push({
      path: '.agent/skills/',
      reason:
        'Antigravity candidate skill path (.agent/skills/) is unverified; using generic project-local BLENDOPS.md fallback.',
    });
    limitations.push(
      'Antigravity target is linked-only; no unverified .agent/skills/ directory was created.',
    );
  } else if (selectedTarget === 'github-copilot') {
    skippedEntries.push({
      path: '.github/copilot-instructions.md',
      reason:
        'GitHub Copilot native path is linked-only/unverified; using generic project-local BLENDOPS.md fallback.',
    });
    limitations.push(
      'GitHub Copilot target is linked-only/generic; no extension or marketplace listing exists.',
    );
  } else if (selectedTarget === 'generic-project' && limitations.length === 0) {
    limitations.push(
      'Project-local instruction attachment only; Blender runtime and MCP host setup remain separate.',
    );
  }

  const filesToCreate = operations.filter((op) => op.action === 'create').map((op) => op.path);
  const filesToModify = operations.filter((op) => op.action === 'modify').map((op) => op.path);
  const backupsToCreate = operations
    .filter((op) => op.action === 'modify' && Boolean(op.backupRelPath))
    .map((op) => ({
      path: op.path,
      backup_path: op.backupRelPath,
      pre_install_sha256: op.preExistingSha256,
    }));
  const filesToSkip = [
    ...operations
      .filter((op) => op.action === 'skip')
      .map((op) => ({ path: op.path, reason: op.reason })),
    ...skippedEntries,
  ];

  const inspectedRelPaths = [
    'BLENDOPS.md',
    'AGENTS.md',
    'CLAUDE.md',
    '.cursor/rules/blendops.mdc',
  ];
  const targetStateSnapshot = captureTargetStateSnapshot(
    projectReal,
    inspectedRelPaths,
    detectedMarkers,
  );

  const planPayload = {
    installerVersion: INSTALLER_VERSION,
    requestedTarget,
    selectedTarget,
    confidence,
    effectiveBehavior,
    scope: 'project-local',
    projectPath: projectReal,
    repoRootPath: repoRootReal,
    confirmTargetPath: Boolean(confirmTargetPath),
    patchAgentsMd: Boolean(patchAgentsMd),
    ...(patchClaudeMd ? { patchClaudeMd: true } : {}),
    sourceFingerprint: sourceInfo.fingerprint,
    detectedMarkers,
    targetStateSnapshot,
    operations: operations.map((op) => ({
      action: op.action,
      path: op.path,
      desiredSha256: op.desiredSha256,
      desiredManagedBlockSha256: op.desiredManagedBlockSha256,
      desiredContent: op.desiredContent,
      preExistingSha256: op.preExistingSha256,
      backupRelPath: op.backupRelPath,
      transitionedFromCreated: Boolean(op.transitionedFromCreated),
      reason: op.reason || null,
    })),
    filesToCreate,
    filesToModify,
    filesToSkip,
    backupsToCreate,
    rollbackManifestRel,
    installReportRel,
    limitations,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    globalTouched: false,
  };

  const planHash = sha256String(JSON.stringify(planPayload));
  return {
    ...planPayload,
    planHash,
  };
}

function buildClaudeDesktopPlan({ repoRootReal, outReal, requestedTarget }) {
  let outAlreadyExists = false;
  try {
    fs.lstatSync(outReal);
    outAlreadyExists = true;
  } catch (err) {
    if (!err || err.code !== 'ENOENT') {
      throw err;
    }
  }
  if (outAlreadyExists) {
    throw new Error(
      `Refusing to use existing --out destination (${outReal}): Claude Desktop export requires a non-existent output directory path so existing files are never overwritten or deleted.`,
    );
  }

  const sourceInfo = computeBlendOpsSourceFingerprint(repoRootReal);
  const filesToCreate = [
    ...sourceInfo.skillNames.map((name) => `desktop-zips/${name}.zip`),
    ...sourceInfo.skillNames.map((name) => `claude-code-skills/${name}/SKILL.md`),
    'README.md',
    'manifest.json',
    'claude-desktop-manual/README.md',
    'claude-desktop-manual/SKILL.md',
    'claude-desktop-manual/BLENDOPS_SINGLE_FILE.md',
    'claude-desktop-manual/IMPORT_STEPS.md',
    'claude-desktop-manual/manifest.json',
  ];

  const targetStateSnapshot = {
    outExists: false,
    existingEntries: [],
  };

  const limitations = [
    'Manual upload bundle only (48 per-skill ZIPs in desktop-zips/*.zip + claude-desktop-manual/). Does not automate Claude Desktop UI import, does not configure Anthropic Blender Connector or Lab MCP add-on, and does not run Blender.',
  ];

  const planPayload = {
    installerVersion: INSTALLER_VERSION,
    requestedTarget,
    selectedTarget: 'claude-desktop',
    confidence: 'linked-only/manual',
    effectiveBehavior: 'claude-desktop-bundle-output',
    scope: 'bundle-output',
    projectPath: outReal,
    repoRootPath: repoRootReal,
    confirmTargetPath: false,
    patchAgentsMd: false,
    sourceFingerprint: sourceInfo.fingerprint,
    skillCount: sourceInfo.skillCount,
    detectedMarkers: [],
    targetStateSnapshot,
    operations: [],
    filesToCreate,
    filesToModify: [],
    filesToSkip: [],
    backupsToCreate: [],
    rollbackManifestRel: '.blendops/install-manifest.json',
    installReportRel: '.blendops/INSTALL_REPORT.md',
    limitations,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    globalTouched: false,
  };

  const planHash = sha256String(JSON.stringify(planPayload));
  return {
    ...planPayload,
    planHash,
  };
}

function writeAtomicFile(targetAbsPath, contentBufferOrString) {
  const dir = path.dirname(targetAbsPath);
  fs.mkdirSync(dir, { recursive: true });
  const tempPath = path.join(
    dir,
    `.${path.basename(targetAbsPath)}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(tempPath, contentBufferOrString, { flag: 'wx' });
    fs.renameSync(tempPath, targetAbsPath);
  } finally {
    if (fs.existsSync(tempPath)) {
      try {
        fs.rmSync(tempPath, { force: true });
      } catch {
        // Best-effort cleanup
      }
    }
  }
}

export function formatInstallerHelp() {
  const targetLines = Object.values(SUPPORTED_TARGETS).map(
    (t) => `  - ${t.id.padEnd(16, ' ')} [${t.confidence}] ${t.description}`,
  );
  return [
    '## BlendOps Distributable CLI & Safe Project-Local Installer (`blendops` / `scripts/install-skills.mjs`)',
    '',
    'CLI Usage:',
    '  blendops --version',
    '  blendops --help',
    '  blendops doctor [--target <name>] [--project <path>]',
    '  blendops install [--target <name>] --project <path> [--confirm-target-path] [--patch-agents-md] [--patch-claude-md] --dry-run',
    '  blendops install [--target <name>] --project <path> [--confirm-target-path] [--patch-agents-md] [--patch-claude-md] --write',
    '  blendops install --target claude-desktop --out <path> --dry-run',
    '  blendops install --target claude-desktop --out <path> --write',
    '  blendops rollback (--project <path> | --out <path>) [--force-rollback]',
    '',
    'Repository Script Usage (equivalent):',
    '  node scripts/install-skills.mjs --doctor [--target <name>] [--project <path>]',
    '  node scripts/install-skills.mjs --target <name> --project <path> [--confirm-target-path] [--patch-agents-md] [--patch-claude-md] --dry-run',
    '  node scripts/install-skills.mjs --target <name> --project <path> [--confirm-target-path] [--patch-agents-md] [--patch-claude-md] --write',
    '  node scripts/install-skills.mjs --target claude-desktop --out <path> --dry-run',
    '  node scripts/install-skills.mjs --target claude-desktop --out <path> --write',
    '  node scripts/install-skills.mjs --rollback (--project <path> | --out <path>) [--force-rollback]',
    '  node scripts/install-skills.mjs --help',
    '',
    'Options:',
    '  --target <name>         Target profile (auto, claude-code, opencode, cursor, codex, gemini, antigravity, github-copilot, generic-project, claude-desktop)',
    '  --project <path>        Target project root directory (required for project-local targets)',
    '  --out, --output <path>  Output directory for bundle targets (--target claude-desktop)',
    '  --doctor                Run strictly read-only repository and target diagnostics',
    '  --dry-run               Inspect target and record a verified dry-run plan without modifying target files',
    '  --write                 Execute a previously recorded, non-stale dry-run plan with atomic writes and backups',
    '  --rollback              Restore pre-install backups and remove installer-created files from .blendops/install-manifest.json',
    '  --force-rollback        Override post-install file edit protection during --rollback (alias: --force)',
    '  --confirm-target-path   Confirm target-specific writes for documented linked-only targets (cursor .mdc, codex AGENTS.md)',
    '  --patch-agents-md       Create or append a managed BlendOps section in AGENTS.md with backup',
    '  --patch-claude-md       Create or append a managed BlendOps section in CLAUDE.md with backup',
    '  --allow-global          Rejected in Phase 10 (global writes are disabled)',
    '  --version, -v           Show CLI version and exit without writing files',
    '  --help, -h              Show this help output and exit without writing files',
    '',
    'Supported targets:',
    ...targetLines,
    '',
    'Boundaries:',
    '- Local content & CLI package installer only (unpublished npm package; no public npx registry release, no marketplace listing, no Blender install or MCP setup).',
    '- Global files touched: No',
    '- Runtime status: Not Run',
    '- Artifact status: Not Produced',
    '- Runtime setup: Separate; not performed',
    '',
  ].join('\n');
}

export function formatInstallerReport(result) {
  const createdStr =
    result.filesCreated && result.filesCreated.length > 0
      ? result.filesCreated.join(', ')
      : 'none';
  const modifiedStr =
    result.filesModified && result.filesModified.length > 0
      ? result.filesModified.join(', ')
      : 'none';
  const skippedStr =
    result.filesSkipped && result.filesSkipped.length > 0
      ? result.filesSkipped.map((s) => `${s.path} (${s.reason})`).join('; ')
      : 'none';
  const backupsStr =
    result.backups && result.backups.length > 0
      ? result.backups.map((b) => (typeof b === 'string' ? b : `${b.path} -> ${b.backup_path}`)).join(', ')
      : 'none';
  const limitationsStr =
    result.limitations && result.limitations.length > 0
      ? result.limitations.join(' ')
      : 'Skill install is separate from runtime setup.';

  const lines = [
    '## BlendOps installer report',
    '',
    `- Target requested: ${result.targetRequested || result.targetSelected}`,
    `- Target selected: ${result.targetSelected}`,
    `- Resolved install mode: ${result.resolvedInstallMode || result.scope}`,
    `- Confidence: ${result.confidence}`,
    `- Mode: ${result.mode}`,
    `- Scope: ${result.scope}`,
    `- Project/out path: ${result.projectOrOutPath}`,
    `- Detected markers: ${
      result.detectedMarkers && result.detectedMarkers.length > 0
        ? result.detectedMarkers.map((d) => `${d.target} (${d.markers.join(', ')})`).join('; ')
        : 'none'
    }`,
    `- Files created: ${createdStr}`,
    `- Files modified: ${modifiedStr}`,
    `- Files skipped: ${skippedStr}`,
    `- Backups: ${backupsStr}`,
    `- Rollback manifest: ${result.rollbackManifestPath || 'none'}`,
    '- Global files touched: No',
    '- Runtime status: Not Run',
    '- Artifact status: Not Produced',
    '- Runtime setup: Separate; not performed',
    `- Limitations: ${limitationsStr}`,
  ];

  if (result.skillMdCountPerZip !== undefined) {
    lines.push(`- SKILL.md count if ZIP mode: ${result.skillMdCountPerZip} per ZIP (${result.zipCount || 48} ZIPs)`);
  }

  return `${lines.join('\n')}\n`;
}

function runDoctorMode({ repoRootReal, project, target }) {
  const sourceChecks = [];
  const requiredRepoPaths = [
    'skills',
    'laws',
    'packs',
    'bundles/generic-project-local/BLENDOPS.md',
    'bundles/generic-project-local/ROLLBACK.md',
    'bundles/claude-desktop-manual/manifest.json',
    'scripts/export-claude-skills.mjs',
  ];
  for (const rel of requiredRepoPaths) {
    const exists = fs.existsSync(path.join(repoRootReal, rel));
    sourceChecks.push({ path: rel, exists });
    if (!exists) {
      throw new Error(`Doctor check failed: missing required BlendOps source path: ${rel}`);
    }
  }

  for (const forbiddenStaleDir of ['docs/skills', 'docs/laws', 'docs/packs']) {
    if (fs.existsSync(path.join(repoRootReal, forbiddenStaleDir))) {
      throw new Error(
        `Doctor check failed: forbidden duplicate collection directory exists: ${forbiddenStaleDir}`,
      );
    }
  }

  const sourceInfo = computeBlendOpsSourceFingerprint(repoRootReal);
  let inspectedProjectPath = repoRootReal;
  let detectedMarkers = [];
  const limitations = [
    `Read-only diagnostics completed (${sourceInfo.skillCount} canonical skills verified, Node.js ${process.versions.node}). No files were written, no runtime was configured or executed, and no artifacts were produced.`,
  ];

  if (project) {
    const projectReal = validateDestinationRoot(project, {
      kind: 'project',
      repoRoot: repoRootReal,
      mustExist: true,
    });
    inspectedProjectPath = projectReal;
    detectedMarkers = detectProjectTargetMarkers(projectReal);
    if (detectedMarkers.length > 1) {
      limitations.push(
        `Multiple target markers detected (${detectedMarkers.map((d) => d.target).join(', ')}); an explicit --target <name> will be required before installing.`,
      );
    }

    // Read-only inspection of existing .blendops state (never mutates target files)
    const journalPath = path.join(projectReal, '.blendops', 'transaction-journal.json');
    try {
      const journalStat = fs.lstatSync(journalPath);
      if (journalStat.isSymbolicLink()) {
        limitations.push(
          'Warning: .blendops/transaction-journal.json is a symbolic link; inspect and remove unsafe symlink before installing.',
        );
      } else if (journalStat.isFile()) {
        limitations.push(
          'Pending transaction journal detected (.blendops/transaction-journal.json); run blendops install --dry-run or blendops rollback --project <path> to recover interrupted transaction state.',
        );
      }
    } catch (err) {
      if (!err || (err.code !== 'ENOENT' && err.code !== 'ENOTDIR')) {
        throw err;
      }
    }

    const manifestPath = path.join(projectReal, '.blendops', 'install-manifest.json');
    try {
      const manifestStat = fs.lstatSync(manifestPath);
      if (manifestStat.isSymbolicLink()) {
        limitations.push(
          'Warning: .blendops/install-manifest.json is a symbolic link; inspect and remove unsafe symlink before installing.',
        );
      } else if (manifestStat.isFile()) {
        try {
          const parsedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          validateRollbackManifestSchema(parsedManifest, manifestPath);
          limitations.push(
            `Existing install manifest verified (.blendops/install-manifest.json, target=${parsedManifest.target}).`,
          );
        } catch (manifestErr) {
          const msg = manifestErr instanceof Error ? manifestErr.message : String(manifestErr);
          limitations.push(
            `Warning: existing .blendops/install-manifest.json failed validation (${msg}).`,
          );
        }
      }
    } catch (err) {
      if (!err || (err.code !== 'ENOENT' && err.code !== 'ENOTDIR')) {
        throw err;
      }
    }
  }

  const targetSelected = target || (detectedMarkers.length === 1 ? detectedMarkers[0].target : 'generic-project');
  const confidence = SUPPORTED_TARGETS[targetSelected]
    ? SUPPORTED_TARGETS[targetSelected].confidence
    : 'verified-read';

  const result = {
    ok: true,
    mode: 'doctor',
    targetRequested: target || 'auto',
    targetSelected,
    resolvedInstallMode: 'read-only-diagnostics',
    confidence,
    scope: 'read-only',
    projectOrOutPath: inspectedProjectPath,
    detectedMarkers,
    filesCreated: [],
    filesModified: [],
    filesSkipped: [],
    backups: [],
    rollbackManifestPath: 'none (read-only doctor mode)',
    globalTouched: false,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    limitations,
  };

  result.report = formatInstallerReport(result);
  return result;
}

function isSha256Hex(val) {
  return typeof val === 'string' && /^[0-9a-f]{64}$/.test(val);
}

function validateSafeRelativeManifestPath(relPath, { allowInsideBlendops = false } = {}) {
  if (typeof relPath !== 'string' || relPath.trim().length === 0 || relPath.includes('\0')) {
    throw new Error(`Rollback refused: invalid relative path in manifest: ${JSON.stringify(relPath)}`);
  }
  if (relPath.includes('\\') || relPath.startsWith('/') || /^[a-zA-Z]:/.test(relPath)) {
    throw new Error(
      `Rollback refused: non-normalized or absolute path in manifest: ${JSON.stringify(relPath)}`,
    );
  }
  const segments = relPath.split('/');
  if (segments.some((s) => s === '' || s === '.' || s === '..')) {
    throw new Error(
      `Rollback refused: path traversal or empty segment in manifest: ${JSON.stringify(relPath)}`,
    );
  }
  if (!allowInsideBlendops && (relPath === '.blendops' || relPath.startsWith('.blendops/'))) {
    throw new Error(
      `Rollback refused: target file entry cannot reference internal .blendops metadata directory: ${relPath}`,
    );
  }
}

export function validateRollbackManifestSchema(manifest, manifestAbs) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error(`Rollback refused: invalid rollback manifest schema at ${manifestAbs}`);
  }
  if (typeof manifest.target !== 'string' || manifest.target.trim().length === 0) {
    throw new Error(`Rollback refused: invalid rollback manifest schema (missing target) at ${manifestAbs}`);
  }
  if (manifest.scope !== 'project-local' && manifest.scope !== 'bundle-output') {
    throw new Error(`Rollback refused: invalid rollback manifest schema (invalid scope) at ${manifestAbs}`);
  }
  if (
    !Array.isArray(manifest.files_created) ||
    !Array.isArray(manifest.files_modified) ||
    !Array.isArray(manifest.backups)
  ) {
    throw new Error(
      `Rollback refused: invalid rollback manifest schema (files_created, files_modified, and backups must be arrays) at ${manifestAbs}`,
    );
  }
  if (
    !manifest.created_file_hashes ||
    typeof manifest.created_file_hashes !== 'object' ||
    Array.isArray(manifest.created_file_hashes)
  ) {
    throw new Error(
      `Rollback refused: invalid rollback manifest schema (missing created_file_hashes object) at ${manifestAbs}`,
    );
  }
  if (
    !manifest.modified_file_hashes ||
    typeof manifest.modified_file_hashes !== 'object' ||
    Array.isArray(manifest.modified_file_hashes)
  ) {
    throw new Error(
      `Rollback refused: invalid rollback manifest schema (missing modified_file_hashes object) at ${manifestAbs}`,
    );
  }

  const createdSet = new Set();
  for (const relPath of manifest.files_created) {
    validateSafeRelativeManifestPath(relPath, { allowInsideBlendops: false });
    if (createdSet.has(relPath)) {
      throw new Error(
        `Rollback refused: duplicate files_created entry '${relPath}' in manifest at ${manifestAbs}`,
      );
    }
    createdSet.add(relPath);
    const expectedDigest = manifest.created_file_hashes[relPath];
    if (!isSha256Hex(expectedDigest)) {
      throw new Error(
        `Rollback refused: missing or invalid SHA-256 hash in created_file_hashes for '${relPath}' at ${manifestAbs}`,
      );
    }
  }

  for (const hashKey of Object.keys(manifest.created_file_hashes)) {
    if (!createdSet.has(hashKey)) {
      throw new Error(
        `Rollback refused: inconsistent created_file_hashes entry '${hashKey}' not listed in files_created at ${manifestAbs}`,
      );
    }
  }

  const modifiedSet = new Set();
  for (const relPath of manifest.files_modified) {
    validateSafeRelativeManifestPath(relPath, { allowInsideBlendops: false });
    if (createdSet.has(relPath)) {
      throw new Error(
        `Rollback refused: overlapping path '${relPath}' present in both files_created and files_modified at ${manifestAbs}`,
      );
    }
    if (modifiedSet.has(relPath)) {
      throw new Error(
        `Rollback refused: duplicate files_modified entry '${relPath}' in manifest at ${manifestAbs}`,
      );
    }
    modifiedSet.add(relPath);

    const meta = manifest.modified_file_hashes[relPath];
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
      throw new Error(
        `Rollback refused: missing backup metadata in modified_file_hashes for '${relPath}' at ${manifestAbs}`,
      );
    }
    validateSafeRelativeManifestPath(meta.backup_path, { allowInsideBlendops: true });
    if (
      !meta.backup_path.startsWith('.blendops/backups/') ||
      meta.backup_path.slice('.blendops/backups/'.length).includes('/') ||
      !meta.backup_path.endsWith('.bak')
    ) {
      throw new Error(
        `Rollback refused: invalid backup_path '${meta.backup_path}' for '${relPath}' at ${manifestAbs}`,
      );
    }
    if (!isSha256Hex(meta.pre_install_sha256)) {
      throw new Error(
        `Rollback refused: missing or invalid pre_install_sha256 for '${relPath}' at ${manifestAbs}`,
      );
    }
    if (!isSha256Hex(meta.post_install_sha256)) {
      throw new Error(
        `Rollback refused: missing or invalid post_install_sha256 for '${relPath}' at ${manifestAbs}`,
      );
    }
  }

  for (const modKey of Object.keys(manifest.modified_file_hashes)) {
    if (!modifiedSet.has(modKey)) {
      throw new Error(
        `Rollback refused: inconsistent modified_file_hashes entry '${modKey}' not listed in files_modified at ${manifestAbs}`,
      );
    }
  }

  if (manifest.backups.length !== manifest.files_modified.length) {
    throw new Error(
      `Rollback refused: inconsistent backups array length (${manifest.backups.length}) vs files_modified (${manifest.files_modified.length}) at ${manifestAbs}`,
    );
  }

  const seenBackupTargets = new Set();
  const seenBackupPaths = new Set();
  for (const b of manifest.backups) {
    if (!b || typeof b !== 'object' || Array.isArray(b)) {
      throw new Error(`Rollback refused: malformed entry in backups array at ${manifestAbs}`);
    }
    if (!modifiedSet.has(b.path)) {
      throw new Error(
        `Rollback refused: backups entry for '${String(b.path)}' is not listed in files_modified at ${manifestAbs}`,
      );
    }
    if (seenBackupTargets.has(b.path)) {
      throw new Error(
        `Rollback refused: duplicate backups entry for target '${b.path}' at ${manifestAbs}`,
      );
    }
    seenBackupTargets.add(b.path);

    const meta = manifest.modified_file_hashes[b.path];
    if (
      b.backup_path !== meta.backup_path ||
      b.pre_install_sha256 !== meta.pre_install_sha256 ||
      (b.post_install_sha256 !== undefined && b.post_install_sha256 !== meta.post_install_sha256)
    ) {
      throw new Error(
        `Rollback refused: backups array entry for '${b.path}' disagrees with modified_file_hashes at ${manifestAbs}`,
      );
    }
    if (seenBackupPaths.has(b.backup_path)) {
      throw new Error(
        `Rollback refused: duplicate backup_path '${b.backup_path}' in backups array at ${manifestAbs}`,
      );
    }
    seenBackupPaths.add(b.backup_path);
  }

  if (manifest.created_managed_block_hashes !== undefined) {
    if (
      !manifest.created_managed_block_hashes ||
      typeof manifest.created_managed_block_hashes !== 'object' ||
      Array.isArray(manifest.created_managed_block_hashes)
    ) {
      throw new Error(
        `Rollback refused: invalid created_managed_block_hashes object at ${manifestAbs}`,
      );
    }
    for (const [key, val] of Object.entries(manifest.created_managed_block_hashes)) {
      if (!createdSet.has(key) || !isSha256Hex(val)) {
        throw new Error(
          `Rollback refused: invalid created_managed_block_hashes entry for '${key}' at ${manifestAbs}`,
        );
      }
    }
  }

  if (manifest.modified_managed_block_hashes !== undefined) {
    if (
      !manifest.modified_managed_block_hashes ||
      typeof manifest.modified_managed_block_hashes !== 'object' ||
      Array.isArray(manifest.modified_managed_block_hashes)
    ) {
      throw new Error(
        `Rollback refused: invalid modified_managed_block_hashes object at ${manifestAbs}`,
      );
    }
    for (const [key, val] of Object.entries(manifest.modified_managed_block_hashes)) {
      if (!modifiedSet.has(key) || !isSha256Hex(val)) {
        throw new Error(
          `Rollback refused: invalid modified_managed_block_hashes entry for '${key}' at ${manifestAbs}`,
        );
      }
    }
  }

  if (manifest.metadata_files !== undefined) {
    if (
      !manifest.metadata_files ||
      typeof manifest.metadata_files !== 'object' ||
      Array.isArray(manifest.metadata_files)
    ) {
      throw new Error(`Rollback refused: invalid metadata_files object at ${manifestAbs}`);
    }
    for (const [metaKey, metaVal] of Object.entries(manifest.metadata_files)) {
      if (metaKey === '.blendops/INSTALL_REPORT.md') {
        if (!isSha256Hex(metaVal)) {
          throw new Error(
            `Rollback refused: invalid SHA-256 hash for '.blendops/INSTALL_REPORT.md' in metadata_files at ${manifestAbs}`,
          );
        }
      } else if (metaKey === '.blendops/install-manifest.json') {
        if (metaVal !== 'self' && !isSha256Hex(metaVal)) {
          throw new Error(
            `Rollback refused: invalid metadata_files entry for '.blendops/install-manifest.json' at ${manifestAbs}`,
          );
        }
      } else {
        throw new Error(
          `Rollback refused: unexpected metadata_files path '${metaKey}' in manifest at ${manifestAbs}`,
        );
      }
    }
  }
}

function pruneEmptyParentDirectories(startFileAbs, stopRootReal) {
  let parentDir = path.dirname(startFileAbs);
  while (parentDir !== stopRootReal && parentDir.startsWith(stopRootReal)) {
    const rel = path.relative(stopRootReal, parentDir);
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
      break;
    }
    try {
      const lstat = fs.lstatSync(parentDir);
      if (lstat.isSymbolicLink() || !lstat.isDirectory()) {
        break;
      }
      if (fs.readdirSync(parentDir).length === 0) {
        fs.rmdirSync(parentDir);
        parentDir = path.dirname(parentDir);
      } else {
        break;
      }
    } catch {
      break;
    }
  }
}

function rollbackWriteTransaction(projectReal, txState, faultInjection = null) {
  const cleanupErrors = [];
  const blendopsDir = path.join(projectReal, '.blendops');
  const backupsDir = path.join(blendopsDir, 'backups');

  // 1. Restore modified target files or remove newly created target files
  for (const rec of txState.targetRecords) {
    try {
      if (faultInjection?.onRollbackTarget) {
        faultInjection.onRollbackTarget(rec);
      }
      if (!rec.existedBefore) {
        // Target file did not exist before transaction; remove only if created by this transaction
        if (fs.existsSync(rec.absPath)) {
          let shouldRemove = Boolean(rec.writeAttempted);
          if (!shouldRemove && rec.fromJournal) {
            try {
              const diskHash = sha256Buffer(fs.readFileSync(rec.absPath));
              if (diskHash === rec.desiredSha256) {
                shouldRemove = true;
              }
            } catch {
              shouldRemove = false;
            }
          }
          if (shouldRemove) {
            fs.rmSync(rec.absPath, { force: true });
            if (fs.existsSync(rec.absPath)) {
              throw new Error(`Failed to remove newly created target file '${rec.relPath}'`);
            }
            pruneEmptyParentDirectories(rec.absPath, projectReal);
          }
        }
      } else {
        // Target file existed before transaction; restore exact pre-transaction bytes and verify SHA-256
        let restoreBytes = rec.preBytes;
        if (!restoreBytes && rec.stagingAbsPath && fs.existsSync(rec.stagingAbsPath)) {
          restoreBytes = fs.readFileSync(rec.stagingAbsPath);
        }
        if (!restoreBytes) {
          throw new Error(
            `Missing pre-transaction snapshot bytes for modified target '${rec.relPath}'`,
          );
        }
        const preSnapshotHash = sha256Buffer(restoreBytes);
        if (preSnapshotHash !== rec.preSha256) {
          throw new Error(
            `Pre-transaction snapshot hash mismatch for '${rec.relPath}' (expected ${rec.preSha256}, got ${preSnapshotHash})`,
          );
        }
        writeAtomicFile(rec.absPath, restoreBytes);
        if (faultInjection?.afterRollbackTargetWrite) {
          faultInjection.afterRollbackTargetWrite(rec);
        }
        const diskHash = sha256Buffer(fs.readFileSync(rec.absPath));
        if (diskHash !== rec.preSha256) {
          throw new Error(
            `Post-rollback SHA-256 verification failed for target '${rec.relPath}' (expected ${rec.preSha256}, got ${diskHash})`,
          );
        }
      }
    } catch (err) {
      cleanupErrors.push(
        `target '${rec.relPath}': ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 2. Remove only backups newly created by the failed transaction
  for (const b of txState.newlyCreatedBackups) {
    try {
      if (faultInjection?.onRollbackBackup) {
        faultInjection.onRollbackBackup(b);
      }
      if (fs.existsSync(b.backupAbsPath)) {
        fs.rmSync(b.backupAbsPath, { force: true });
        if (fs.existsSync(b.backupAbsPath)) {
          throw new Error(`Failed to remove newly created backup '${b.backupRelPath}'`);
        }
      }
    } catch (err) {
      cleanupErrors.push(
        `backup '${b.backupRelPath}': ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // 3. Restore or remove .blendops/INSTALL_REPORT.md
  try {
    if (faultInjection?.onRollbackReport) {
      faultInjection.onRollbackReport(txState.reportState);
    }
    const rep = txState.reportState;
    if (rep.existedBefore) {
      let restoreBytes = rep.preBytes;
      if (!restoreBytes && rep.stagingAbsPath && fs.existsSync(rep.stagingAbsPath)) {
        restoreBytes = fs.readFileSync(rep.stagingAbsPath);
      }
      if (!restoreBytes) {
        throw new Error(`Missing pre-transaction snapshot bytes for '${rep.relPath}'`);
      }
      writeAtomicFile(rep.absPath, restoreBytes);
      if (faultInjection?.afterRollbackReportWrite) {
        faultInjection.afterRollbackReportWrite(rep);
      }
      const diskHash = sha256Buffer(fs.readFileSync(rep.absPath));
      if (diskHash !== rep.preSha256) {
        throw new Error(
          `Post-rollback SHA-256 verification failed for '${rep.relPath}' (expected ${rep.preSha256}, got ${diskHash})`,
        );
      }
    } else if (fs.existsSync(rep.absPath)) {
      fs.rmSync(rep.absPath, { force: true });
      if (fs.existsSync(rep.absPath)) {
        throw new Error(`Failed to remove newly written '${rep.relPath}'`);
      }
    }
  } catch (err) {
    cleanupErrors.push(
      `report '${txState.reportState.relPath}': ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 4. Restore or remove .blendops/install-manifest.json
  try {
    if (faultInjection?.onRollbackManifest) {
      faultInjection.onRollbackManifest(txState.manifestState);
    }
    const man = txState.manifestState;
    if (man.existedBefore) {
      let restoreBytes = man.preBytes;
      if (!restoreBytes && man.stagingAbsPath && fs.existsSync(man.stagingAbsPath)) {
        restoreBytes = fs.readFileSync(man.stagingAbsPath);
      }
      if (!restoreBytes) {
        throw new Error(`Missing pre-transaction snapshot bytes for '${man.relPath}'`);
      }
      writeAtomicFile(man.absPath, restoreBytes);
      if (faultInjection?.afterRollbackManifestWrite) {
        faultInjection.afterRollbackManifestWrite(man);
      }
      const diskHash = sha256Buffer(fs.readFileSync(man.absPath));
      if (diskHash !== man.preSha256) {
        throw new Error(
          `Post-rollback SHA-256 verification failed for '${man.relPath}' (expected ${man.preSha256}, got ${diskHash})`,
        );
      }
    } else if (fs.existsSync(man.absPath)) {
      fs.rmSync(man.absPath, { force: true });
      if (fs.existsSync(man.absPath)) {
        throw new Error(`Failed to remove provisional '${man.relPath}'`);
      }
    }
  } catch (err) {
    cleanupErrors.push(
      `manifest '${txState.manifestState.relPath}': ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // 5. Clean up transaction staging/journal and prune empty installer-created metadata directories only when all restorations succeeded
  if (cleanupErrors.length === 0) {
    try {
      if (txState.txStagingDir && fs.existsSync(txState.txStagingDir)) {
        fs.rmSync(txState.txStagingDir, { recursive: true, force: true });
      }
      if (txState.journalAbsPath && fs.existsSync(txState.journalAbsPath)) {
        fs.rmSync(txState.journalAbsPath, { force: true });
      }
      if (!txState.backupsDirExistedBefore && fs.existsSync(backupsDir)) {
        if (fs.readdirSync(backupsDir).length === 0) {
          fs.rmdirSync(backupsDir);
        }
      }
      if (!txState.blendopsExistedBefore && fs.existsSync(blendopsDir)) {
        if (fs.readdirSync(blendopsDir).length === 0) {
          fs.rmdirSync(blendopsDir);
        }
      }
    } catch (err) {
      cleanupErrors.push(
        `transaction metadata cleanup: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return cleanupErrors;
}

export function recoverPendingTransactionJournal(projectReal, options = {}) {
  const journalRel = '.blendops/transaction-journal.json';
  const { absTarget: journalAbsPath, exists: journalExists } = validateSafeRelativeTargetFile(
    projectReal,
    journalRel,
  );
  if (!journalExists) {
    return { recovered: false };
  }

  let journal;
  try {
    journal = JSON.parse(fs.readFileSync(journalAbsPath, 'utf8'));
  } catch {
    throw new Error(
      `Pending transaction recovery failed: malformed transaction journal JSON at ${journalAbsPath}`,
    );
  }
  if (!journal || typeof journal !== 'object' || Array.isArray(journal)) {
    throw new Error(
      `Pending transaction recovery failed: invalid transaction journal schema at ${journalAbsPath}`,
    );
  }

  const txStagingDir = path.join(projectReal, '.blendops', 'tx-staging');
  const txState = {
    journalAbsPath,
    txStagingDir,
    blendopsExistedBefore: Boolean(journal.blendops_existed_before),
    backupsDirExistedBefore: Boolean(journal.backups_dir_existed_before),
    manifestState: {
      relPath: journal.manifest_state.rel_path,
      absPath: path.join(projectReal, journal.manifest_state.rel_path),
      existedBefore: Boolean(journal.manifest_state.existed_before),
      preBytes: null,
      preSha256: journal.manifest_state.pre_sha256 || null,
      stagingAbsPath: journal.manifest_state.staging_rel_path
        ? path.join(projectReal, journal.manifest_state.staging_rel_path)
        : null,
    },
    reportState: {
      relPath: journal.report_state.rel_path,
      absPath: path.join(projectReal, journal.report_state.rel_path),
      existedBefore: Boolean(journal.report_state.existed_before),
      preBytes: null,
      preSha256: journal.report_state.pre_sha256 || null,
      stagingAbsPath: journal.report_state.staging_rel_path
        ? path.join(projectReal, journal.report_state.staging_rel_path)
        : null,
    },
    newlyCreatedBackups: (journal.newly_created_backups || []).map((b) => ({
      targetRelPath: b.target_rel_path,
      backupRelPath: b.backup_rel_path,
      backupAbsPath: path.join(projectReal, b.backup_rel_path),
    })),
    targetRecords: (journal.target_records || []).map((r) => ({
      relPath: r.rel_path,
      absPath: path.join(projectReal, r.rel_path),
      action: r.action,
      existedBefore: Boolean(r.existed_before),
      preBytes: null,
      preSha256: r.pre_sha256 || null,
      desiredSha256: r.desired_sha256 || null,
      stagingAbsPath: r.staging_rel_path ? path.join(projectReal, r.staging_rel_path) : null,
      writeAttempted: true,
      fromJournal: true,
    })),
  };

  const cleanupErrors = rollbackWriteTransaction(
    projectReal,
    txState,
    options.faultInjection || null,
  );
  if (cleanupErrors.length > 0) {
    throw new Error(
      `Pending transaction recovery failed for ${projectReal}: ${cleanupErrors.join('; ')}`,
    );
  }
  return { recovered: true };
}

function executeWriteProjectPlan(livePlan, options = {}) {
  const faultInjection = options.faultInjection || null;
  const projectReal = livePlan.projectPath;
  const blendopsDir = path.join(projectReal, '.blendops');
  const backupsDir = path.join(blendopsDir, 'backups');
  const manifestAbsPath = path.join(projectReal, livePlan.rollbackManifestRel);
  const reportAbsPath = path.join(projectReal, livePlan.installReportRel);

  // Check if .blendops or its children are symlinks or non-directories before touching anything
  assertNoSymlinkedAncestorsWithin(projectReal, manifestAbsPath);
  assertNoSymlinkedAncestorsWithin(projectReal, reportAbsPath);

  const blendopsExistedBefore = fs.existsSync(blendopsDir);
  if (blendopsExistedBefore) {
    const blendopsLstat = fs.lstatSync(blendopsDir);
    if (blendopsLstat.isSymbolicLink() || !blendopsLstat.isDirectory()) {
      throw new Error(`Unsafe .blendops metadata path at ${blendopsDir}: must be a regular directory`);
    }
  }
  const backupsDirExistedBefore = fs.existsSync(backupsDir);
  if (backupsDirExistedBefore) {
    const backupsLstat = fs.lstatSync(backupsDir);
    if (backupsLstat.isSymbolicLink() || !backupsLstat.isDirectory()) {
      throw new Error(`Unsafe .blendops/backups path at ${backupsDir}: must be a regular directory`);
    }
  }

  if (fs.existsSync(path.join(blendopsDir, 'transaction-journal.json'))) {
    recoverPendingTransactionJournal(projectReal);
  }

  // Capture exact pre-transaction bytes and existence state of .blendops/install-manifest.json and .blendops/INSTALL_REPORT.md
  let previousManifest = null;
  let prevManifestExisted = false;
  let prevManifestBytes = null;
  let prevManifestSha256 = null;

  if (fs.existsSync(manifestAbsPath)) {
    const lstat = fs.lstatSync(manifestAbsPath);
    if (lstat.isSymbolicLink() || !lstat.isFile() || lstat.nlink > 1) {
      throw new Error(`Unsafe existing rollback manifest at ${manifestAbsPath}`);
    }
    prevManifestExisted = true;
    prevManifestBytes = fs.readFileSync(manifestAbsPath);
    prevManifestSha256 = sha256Buffer(prevManifestBytes);
    try {
      previousManifest = JSON.parse(prevManifestBytes.toString('utf8'));
    } catch {
      throw new Error(`Malformed existing rollback manifest JSON at ${manifestAbsPath}`);
    }
    validateRollbackManifestSchema(previousManifest, manifestAbsPath);

    // Verify all previously recorded backup files exist, are safe regular files, and match pre_install_sha256
    for (const relPath of previousManifest.files_modified) {
      const prevMeta = previousManifest.modified_file_hashes[relPath];
      const { absTarget: prevBackupAbs, exists: prevBackupExists } =
        validateSafeRelativeTargetFile(projectReal, prevMeta.backup_path);
      if (!prevBackupExists) {
        throw new Error(
          `Existing backup file '${prevMeta.backup_path}' referenced by prior install manifest is missing on disk; refusing to overwrite original backup state.`,
        );
      }
      const prevBackupHash = sha256Buffer(fs.readFileSync(prevBackupAbs));
      if (prevBackupHash !== prevMeta.pre_install_sha256) {
        throw new Error(
          `Existing backup file '${prevMeta.backup_path}' failed SHA-256 verification against prior install manifest; refusing to overwrite corrupted backup.`,
        );
      }
    }
  }

  const { absTarget: prevReportAbs, exists: prevReportExists } = validateSafeRelativeTargetFile(
    projectReal,
    livePlan.installReportRel,
  );
  let prevReportBytes = null;
  let prevReportSha256 = null;
  if (prevReportExists) {
    prevReportBytes = fs.readFileSync(prevReportAbs);
    prevReportSha256 = sha256Buffer(prevReportBytes);
    if (prevManifestExisted) {
      if (previousManifest.metadata_files?.[livePlan.installReportRel]) {
        const expectedPrevReportHash = previousManifest.metadata_files[livePlan.installReportRel];
        if (prevReportSha256 !== expectedPrevReportHash) {
          throw new Error(
            `Existing installer report '${livePlan.installReportRel}' was modified after installation; refusing to overwrite user changes.`,
          );
        }
      }
    } else {
      throw new Error(
        `Refusing to overwrite pre-existing untracked file at '${livePlan.installReportRel}'`,
      );
    }
  }

  const createdFilesSet = new Set(previousManifest ? previousManifest.files_created : []);
  const modifiedFilesSet = new Set(previousManifest ? previousManifest.files_modified : []);
  const createdFileHashes = { ...(previousManifest?.created_file_hashes || {}) };
  const modifiedFileHashes = { ...(previousManifest?.modified_file_hashes || {}) };
  const createdManagedBlockHashes = { ...(previousManifest?.created_managed_block_hashes || {}) };
  const modifiedManagedBlockHashes = { ...(previousManifest?.modified_managed_block_hashes || {}) };
  const backupsMap = new Map();
  if (previousManifest) {
    for (const b of previousManifest.backups) {
      backupsMap.set(b.path, { ...b });
    }
  }

  // Capture exact pre-transaction state for all target files and newly created backups BEFORE any disk write
  const newlyCreatedBackups = [];
  const targetRecords = [];

  for (const op of livePlan.operations) {
    if (op.action === 'skip') {
      if (createdFilesSet.has(op.path) && isSha256Hex(op.desiredManagedBlockSha256)) {
        createdManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
      } else if (modifiedFilesSet.has(op.path) && isSha256Hex(op.desiredManagedBlockSha256)) {
        modifiedManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
      }
      continue;
    }

    if (op.action === 'create') {
      const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, op.path);
      if (exists) {
        throw new Error(
          `Target file '${op.path}' appeared after dry-run planning; aborting write.`,
        );
      }
      targetRecords.push({
        relPath: op.path,
        absPath: absTarget,
        action: 'create',
        existedBefore: false,
        preBytes: null,
        preSha256: null,
        desiredContent: op.desiredContent,
        desiredSha256: op.desiredSha256,
        stagingAbsPath: null,
        writeAttempted: false,
      });
      createdFilesSet.add(op.path);
      createdFileHashes[op.path] = op.desiredSha256;
      if (isSha256Hex(op.desiredManagedBlockSha256)) {
        createdManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
      }
      continue;
    }

    if (op.action !== 'modify') continue;

    const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, op.path);
    if (!exists) {
      throw new Error(
        `Target file '${op.path}' disappeared after dry-run planning; aborting write.`,
      );
    }
    const currentBytes = fs.readFileSync(absTarget);
    const currentHash = sha256Buffer(currentBytes);
    if (currentHash !== op.preExistingSha256) {
      throw new Error(
        `Target file '${op.path}' changed before backup could be recorded; aborting write.`,
      );
    }

    targetRecords.push({
      relPath: op.path,
      absPath: absTarget,
      action: 'modify',
      existedBefore: true,
      preBytes: currentBytes,
      preSha256: currentHash,
      desiredContent: op.desiredContent,
      desiredSha256: op.desiredSha256,
      stagingAbsPath: null,
      writeAttempted: false,
    });

    if (createdFilesSet.has(op.path)) {
      const prevCreatedHash = previousManifest?.created_file_hashes?.[op.path];
      const wasEditedByUser =
        Boolean(op.transitionedFromCreated) ||
        !isSha256Hex(prevCreatedHash) ||
        currentHash !== prevCreatedHash;
      if (!wasEditedByUser) {
        // File was not edited by the user; keep in files_created and refresh its hash
        createdFileHashes[op.path] = op.desiredSha256;
        if (isSha256Hex(op.desiredManagedBlockSha256)) {
          createdManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
        }
        continue;
      }
      // User edited an installer-created file: transition ownership from files_created to files_modified
      createdFilesSet.delete(op.path);
      delete createdFileHashes[op.path];
      delete createdManagedBlockHashes[op.path];
    }

    const encodedBackupName = `${op.path.replace(/\//g, '__')}.bak`;
    const backupRelPath = backupsMap.has(op.path)
      ? backupsMap.get(op.path).backup_path
      : op.backupRelPath || `.blendops/backups/${encodedBackupName}`;
    const { absTarget: backupAbsPath, exists: backupAlreadyExists } =
      validateSafeRelativeTargetFile(projectReal, backupRelPath);

    if (backupsMap.has(op.path)) {
      const existingEntry = backupsMap.get(op.path);
      if (!backupAlreadyExists) {
        throw new Error(
          `Original backup '${backupRelPath}' for '${op.path}' is missing on disk; refusing to overwrite original pre-install backup with post-install file content.`,
        );
      }
      const existingBackupHash = sha256Buffer(fs.readFileSync(backupAbsPath));
      if (existingBackupHash !== existingEntry.pre_install_sha256) {
        throw new Error(
          `Original backup '${backupRelPath}' for '${op.path}' failed SHA-256 integrity check; refusing to continue.`,
        );
      }
      existingEntry.post_install_sha256 = op.desiredSha256;
      modifiedFileHashes[op.path] = {
        pre_install_sha256: existingEntry.pre_install_sha256,
        post_install_sha256: op.desiredSha256,
        backup_path: existingEntry.backup_path,
      };
    } else {
      if (backupAlreadyExists) {
        throw new Error(
          `Refusing to overwrite unexpected pre-existing file at backup path '${backupRelPath}'`,
        );
      }
      newlyCreatedBackups.push({
        targetRelPath: op.path,
        backupRelPath,
        backupAbsPath,
        bytes: currentBytes,
        sha256: currentHash,
      });
      backupsMap.set(op.path, {
        path: op.path,
        backup_path: backupRelPath,
        pre_install_sha256: currentHash,
        post_install_sha256: op.desiredSha256,
      });
      modifiedFileHashes[op.path] = {
        pre_install_sha256: currentHash,
        post_install_sha256: op.desiredSha256,
        backup_path: backupRelPath,
      };
    }

    modifiedFilesSet.add(op.path);
    if (isSha256Hex(op.desiredManagedBlockSha256)) {
      modifiedManagedBlockHashes[op.path] = op.desiredManagedBlockSha256;
    }
  }

  // Ensure every created file in createdFilesSet has a valid SHA-256 in createdFileHashes
  for (const createdRel of createdFilesSet) {
    if (!isSha256Hex(createdFileHashes[createdRel])) {
      const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, createdRel);
      if (!exists) {
        throw new Error(`Missing hash and file for created path '${createdRel}'`);
      }
      createdFileHashes[createdRel] = sha256Buffer(fs.readFileSync(absTarget));
    }
  }

  for (const key of Object.keys(createdManagedBlockHashes)) {
    if (!createdFilesSet.has(key)) {
      delete createdManagedBlockHashes[key];
    }
  }

  // Ensure every modified file in modifiedFilesSet has up-to-date post_install_sha256
  for (const modRel of modifiedFilesSet) {
    if (createdFilesSet.has(modRel)) continue;
    const meta = modifiedFileHashes[modRel];
    const bEntry = backupsMap.get(modRel);
    if (!meta || !bEntry) {
      throw new Error(`Missing backup metadata for modified file '${modRel}'`);
    }
  }

  for (const key of Object.keys(modifiedManagedBlockHashes)) {
    if (!modifiedFilesSet.has(key) || createdFilesSet.has(key)) {
      delete modifiedManagedBlockHashes[key];
    }
  }

  const finalFilesCreated = [...createdFilesSet];
  const finalFilesModified = [...modifiedFilesSet].filter((p) => !createdFilesSet.has(p));
  const finalBackups = [...backupsMap.values()].filter((b) => !createdFilesSet.has(b.path));

  const result = {
    ok: true,
    mode: 'write',
    targetRequested: livePlan.requestedTarget,
    targetSelected: livePlan.selectedTarget,
    resolvedInstallMode: livePlan.effectiveBehavior,
    confidence: livePlan.confidence,
    scope: livePlan.scope,
    projectOrOutPath: projectReal,
    detectedMarkers: livePlan.detectedMarkers,
    filesCreated: livePlan.filesToCreate,
    filesModified: livePlan.filesToModify,
    filesSkipped: livePlan.filesToSkip,
    backups: livePlan.backupsToCreate,
    rollbackManifestPath: manifestAbsPath,
    globalTouched: false,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    limitations: livePlan.limitations,
  };

  result.report = formatInstallerReport(result);
  const reportSha256 = sha256Buffer(Buffer.from(result.report, 'utf8'));

  const rollbackSteps = [
    `node scripts/install-skills.mjs --rollback --project "${projectReal}"`,
    ...finalBackups.map((b) => `cp "${b.backup_path}" "${b.path}"`),
    ...finalFilesCreated.map((f) => `rm -f "${f}"`),
    ...finalBackups.map((b) => `rm -f "${b.backup_path}"`),
    'rm -f ".blendops/INSTALL_REPORT.md" ".blendops/install-manifest.json"',
    'rmdir ".blendops/backups" ".blendops" 2>/dev/null || true',
  ];

  const manifestData = {
    installer_version: INSTALLER_VERSION,
    timestamp: new Date().toISOString(),
    target: livePlan.selectedTarget,
    requested_target: livePlan.requestedTarget,
    confidence: livePlan.confidence,
    scope: livePlan.scope,
    project: projectReal,
    plan_hash: livePlan.planHash,
    source_fingerprint: livePlan.sourceFingerprint,
    files_created: finalFilesCreated,
    files_modified: finalFilesModified,
    backups: finalBackups,
    files_skipped: livePlan.filesToSkip,
    created_file_hashes: createdFileHashes,
    modified_file_hashes: modifiedFileHashes,
    created_managed_block_hashes: createdManagedBlockHashes,
    modified_managed_block_hashes: modifiedManagedBlockHashes,
    metadata_files: {
      [livePlan.installReportRel]: reportSha256,
      [livePlan.rollbackManifestRel]: 'self',
    },
    global_touched: false,
    runtime_status: 'Not Run',
    artifact_status: 'Not Produced',
    rollback_steps: rollbackSteps,
  };

  validateRollbackManifestSchema(manifestData, manifestAbsPath);

  const txStagingDir = path.join(blendopsDir, 'tx-staging');
  const journalAbsPath = path.join(blendopsDir, 'transaction-journal.json');

  const txState = {
    journalAbsPath,
    txStagingDir,
    blendopsExistedBefore,
    backupsDirExistedBefore,
    manifestState: {
      relPath: livePlan.rollbackManifestRel,
      absPath: manifestAbsPath,
      existedBefore: prevManifestExisted,
      preBytes: prevManifestBytes,
      preSha256: prevManifestSha256,
      stagingAbsPath: prevManifestExisted ? path.join(txStagingDir, 'prev-manifest.bin') : null,
    },
    reportState: {
      relPath: livePlan.installReportRel,
      absPath: reportAbsPath,
      existedBefore: prevReportExists,
      preBytes: prevReportBytes,
      preSha256: prevReportSha256,
      stagingAbsPath: prevReportExists ? path.join(txStagingDir, 'prev-report.bin') : null,
    },
    newlyCreatedBackups,
    targetRecords,
  };

  // Begin recoverable write transaction
  try {
    fs.mkdirSync(blendopsDir, { recursive: true });
    fs.mkdirSync(txStagingDir, { recursive: true });

    if (prevManifestExisted && prevManifestBytes) {
      writeAtomicFile(txState.manifestState.stagingAbsPath, prevManifestBytes);
    }
    if (prevReportExists && prevReportBytes) {
      writeAtomicFile(txState.reportState.stagingAbsPath, prevReportBytes);
    }
    for (let i = 0; i < targetRecords.length; i += 1) {
      const rec = targetRecords[i];
      if (rec.existedBefore && rec.preBytes) {
        const stagingFileName = `target-${i}-${rec.relPath.replace(/\//g, '__')}.bin`;
        rec.stagingAbsPath = path.join(txStagingDir, stagingFileName);
        writeAtomicFile(rec.stagingAbsPath, rec.preBytes);
      }
    }

    const journalData = {
      installer_version: INSTALLER_VERSION,
      started_at: new Date().toISOString(),
      project: projectReal,
      blendops_existed_before: blendopsExistedBefore,
      backups_dir_existed_before: backupsDirExistedBefore,
      manifest_state: {
        rel_path: livePlan.rollbackManifestRel,
        existed_before: prevManifestExisted,
        pre_sha256: prevManifestSha256,
        staging_rel_path: prevManifestExisted ? '.blendops/tx-staging/prev-manifest.bin' : null,
      },
      report_state: {
        rel_path: livePlan.installReportRel,
        existed_before: prevReportExists,
        pre_sha256: prevReportSha256,
        staging_rel_path: prevReportExists ? '.blendops/tx-staging/prev-report.bin' : null,
      },
      newly_created_backups: newlyCreatedBackups.map((b) => ({
        target_rel_path: b.targetRelPath,
        backup_rel_path: b.backupRelPath,
        sha256: b.sha256,
      })),
      target_records: targetRecords.map((rec, idx) => ({
        rel_path: rec.relPath,
        action: rec.action,
        existed_before: rec.existedBefore,
        pre_sha256: rec.preSha256,
        desired_sha256: rec.desiredSha256,
        staging_rel_path: rec.existedBefore
          ? `.blendops/tx-staging/target-${idx}-${rec.relPath.replace(/\//g, '__')}.bin`
          : null,
      })),
    };
    writeAtomicFile(journalAbsPath, `${JSON.stringify(journalData, null, 2)}\n`);

    // Step 1: Write and verify newly created backups before mutating manifest or targets
    for (const b of newlyCreatedBackups) {
      const { exists: nowExists } = validateSafeRelativeTargetFile(projectReal, b.backupRelPath);
      if (nowExists) {
        throw new Error(
          `Refusing to overwrite unexpected file at backup path '${b.backupRelPath}'`,
        );
      }
      fs.mkdirSync(path.dirname(b.backupAbsPath), { recursive: true });
      writeAtomicFile(b.backupAbsPath, b.bytes);
      const verifyBackupHash = sha256Buffer(fs.readFileSync(b.backupAbsPath));
      if (verifyBackupHash !== b.sha256) {
        throw new Error(`Backup verification failed for ${b.backupRelPath}`);
      }
      if (faultInjection?.afterBackupWrite) {
        faultInjection.afterBackupWrite({ backup: b, projectReal });
      }
    }

    // Step 2: Persist provisional rollback manifest BEFORE mutating any target project instruction files
    const manifestJsonText = `${JSON.stringify(manifestData, null, 2)}\n`;
    const expectedManifestSha = sha256Buffer(Buffer.from(manifestJsonText, 'utf8'));
    writeAtomicFile(manifestAbsPath, manifestJsonText);
    const writtenManifestSha = sha256Buffer(fs.readFileSync(manifestAbsPath));
    if (writtenManifestSha !== expectedManifestSha) {
      throw new Error(`Post-write hash verification failed for ${livePlan.rollbackManifestRel}`);
    }
    if (faultInjection?.afterProvisionalManifestWrite) {
      faultInjection.afterProvisionalManifestWrite({ manifestAbsPath, projectReal });
    }

    // Step 3: Atomically write created and modified target files with immediate pre-write revalidation
    for (let i = 0; i < targetRecords.length; i += 1) {
      const rec = targetRecords[i];
      if (faultInjection?.beforeTargetOperation) {
        faultInjection.beforeTargetOperation({ index: i, op: rec, projectReal });
      }
      const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, rec.relPath);
      if (rec.action === 'create') {
        if (exists) {
          throw new Error(
            `Target file '${rec.relPath}' appeared after planning right before write; aborting write.`,
          );
        }
      } else if (rec.action === 'modify') {
        if (!exists) {
          throw new Error(
            `Target file '${rec.relPath}' disappeared right before write; aborting write.`,
          );
        }
        const preWriteBytes = fs.readFileSync(absTarget);
        const preWriteHash = sha256Buffer(preWriteBytes);
        if (preWriteHash !== rec.preSha256) {
          throw new Error(
            `Target file '${rec.relPath}' changed right before atomic replacement; aborting write.`,
          );
        }
      }
      rec.writeAttempted = true;
      writeAtomicFile(absTarget, rec.desiredContent);
      if (faultInjection?.afterTargetWriteBeforeVerify) {
        faultInjection.afterTargetWriteBeforeVerify({ index: i, op: rec, projectReal });
      }
      const writtenHash = sha256Buffer(fs.readFileSync(absTarget));
      if (writtenHash !== rec.desiredSha256) {
        throw new Error(`Post-write hash verification failed for ${rec.relPath}`);
      }
      if (faultInjection?.afterTargetOperation) {
        faultInjection.afterTargetOperation({ index: i, op: rec, projectReal });
      }
    }

    // Step 4: Write and verify .blendops/INSTALL_REPORT.md inside the same transaction
    if (faultInjection?.beforeReportWrite) {
      faultInjection.beforeReportWrite({ reportAbsPath, projectReal });
    }
    validateSafeRelativeTargetFile(projectReal, livePlan.installReportRel);
    writeAtomicFile(reportAbsPath, result.report);
    if (faultInjection?.afterReportWriteBeforeVerify) {
      faultInjection.afterReportWriteBeforeVerify({ reportAbsPath, projectReal });
    }
    const writtenReportHash = sha256Buffer(fs.readFileSync(reportAbsPath));
    if (writtenReportHash !== reportSha256) {
      throw new Error(`Post-write hash verification failed for ${livePlan.installReportRel}`);
    }
    if (faultInjection?.afterReportOperation) {
      faultInjection.afterReportOperation({ reportAbsPath, projectReal });
    }

    // Step 5: Finalize transaction only after all steps succeed
    if (faultInjection?.beforeTransactionFinalize) {
      faultInjection.beforeTransactionFinalize({ journalAbsPath, projectReal });
    }
    if (fs.existsSync(txStagingDir)) {
      fs.rmSync(txStagingDir, { recursive: true, force: true });
    }
    if (fs.existsSync(journalAbsPath)) {
      fs.rmSync(journalAbsPath, { force: true });
    }
  } catch (txErr) {
    if (faultInjection?.simulateProcessCrashOnFailure) {
      throw txErr;
    }
    const cleanupErrors = rollbackWriteTransaction(projectReal, txState, faultInjection);
    if (cleanupErrors.length > 0) {
      const origMsg = txErr instanceof Error ? txErr.message : String(txErr);
      throw new Error(
        `Transactional rollback incomplete after write failure (${origMsg}): ${cleanupErrors.join('; ')}`,
      );
    }
    throw txErr;
  }

  return result;
}

function formatManifestOutputPrefix(targetPath, rootDir) {
  const rel = path.relative(rootDir, targetPath);
  if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
    return rel.split(path.sep).join('/');
  }
  return targetPath.split(path.sep).join('/');
}

function executeWriteClaudeDesktopPlan(livePlan) {
  const outReal = livePlan.projectPath;
  const repoRootReal = livePlan.repoRootPath;
  const sourceInfo = computeBlendOpsSourceFingerprint(repoRootReal);

  // Fail closed if destination already exists before staging
  let destExistsBefore = false;
  try {
    fs.lstatSync(outReal);
    destExistsBefore = true;
  } catch (err) {
    if (!err || err.code !== 'ENOENT') {
      throw err;
    }
  }
  if (destExistsBefore) {
    throw new Error(
      `Refusing to overwrite existing --out destination (${outReal}): destination must not exist prior to write.`,
    );
  }

  const parentDir = path.dirname(outReal);
  fs.mkdirSync(parentDir, { recursive: true });
  const parentLstat = fs.lstatSync(parentDir);
  if (parentLstat.isSymbolicLink() || !parentLstat.isDirectory()) {
    throw new Error(`Unsafe parent directory for --out destination: ${parentDir}`);
  }

  const stagingDir = path.join(
    parentDir,
    `.blendops-claude-desktop-staging-${process.pid}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
  );

  try {
    fs.mkdirSync(stagingDir, { recursive: false });
    const exporterPath = path.join(repoRootReal, 'scripts', 'export-claude-skills.mjs');
    execFileSync(process.execPath, [exporterPath, '--output-root', stagingDir], {
      cwd: repoRootReal,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Normalize manifest.json output paths inside stagingDir to reference the final outReal destination
    const stagingManifestAbs = path.join(stagingDir, 'manifest.json');
    if (!fs.existsSync(stagingManifestAbs)) {
      throw new Error(`Claude Desktop bundle verification failed: missing ${stagingManifestAbs}`);
    }
    const stagingManifest = JSON.parse(fs.readFileSync(stagingManifestAbs, 'utf8'));
    if (stagingManifest.skillCount !== sourceInfo.skillCount) {
      throw new Error(
        `Claude Desktop bundle verification failed: expected ${sourceInfo.skillCount} skills in manifest.json, got ${stagingManifest.skillCount}`,
      );
    }
    const desktopDisplay = formatManifestOutputPrefix(
      path.join(outReal, 'desktop-zips'),
      repoRootReal,
    );
    const codeDisplay = formatManifestOutputPrefix(
      path.join(outReal, 'claude-code-skills'),
      repoRootReal,
    );
    stagingManifest.outputs = {
      claudeDesktop: `${desktopDisplay}/*.zip`,
      claudeCode: `${codeDisplay}/*/SKILL.md`,
    };
    writeAtomicFile(stagingManifestAbs, `${JSON.stringify(stagingManifest, null, 2)}\n`);

    const manualSrc = path.join(repoRootReal, 'bundles', 'claude-desktop-manual');
    const manualDest = path.join(stagingDir, 'claude-desktop-manual');
    fs.cpSync(manualSrc, manualDest, { recursive: true });

    const topReadmeContent = [
      '# BlendOps — Claude Desktop Manual Upload Output',
      '',
      'This directory was generated by `node scripts/install-skills.mjs --target claude-desktop --out <path> --write`.',
      '',
      '## Contents',
      '',
      `- \`desktop-zips/*.zip\` — ${sourceInfo.skillCount} per-skill ZIP packages (each containing exactly one \`<skill-name>/SKILL.md\` at its root) for Claude.ai / Claude Desktop upload.`,
      `- \`claude-code-skills/<skill-name>/SKILL.md\` — ${sourceInfo.skillCount} extracted skill folders.`,
      '- `claude-desktop-manual/` — Single-skill manual upload bundle (`SKILL.md`, `BLENDOPS_SINGLE_FILE.md`, `IMPORT_STEPS.md`, `manifest.json`, and `references/`).',
      '- `manifest.json` — Export manifest listing all canonical skills and artifact paths.',
      '- `.blendops/install-manifest.json` — Rollback manifest for removing this output cleanly.',
      '',
      '## Truth-State & Runtime Boundaries',
      '',
      '- Global files touched: No',
      '- Runtime status: `Not Run`',
      '- Artifact status: `Not Produced`',
      '- Runtime setup: Separate; not performed by this installer.',
      '',
    ].join('\n');
    writeAtomicFile(path.join(stagingDir, 'README.md'), topReadmeContent);

    // Verify all 48 ZIPs, extracted skill folders, manual bundle, README, and manifest inside staging
    for (const skillName of sourceInfo.skillNames) {
      const zipAbs = path.join(stagingDir, 'desktop-zips', `${skillName}.zip`);
      if (!fs.existsSync(zipAbs)) {
        throw new Error(`Claude Desktop bundle verification failed: missing expected ZIP ${zipAbs}`);
      }
      const zipBuf = fs.readFileSync(zipAbs);
      if (
        zipBuf.length < 22 ||
        zipBuf[0] !== 0x50 ||
        zipBuf[1] !== 0x4b ||
        zipBuf[2] !== 0x03 ||
        zipBuf[3] !== 0x04
      ) {
        throw new Error(`Claude Desktop bundle verification failed: invalid ZIP header in ${zipAbs}`);
      }
      const skillMdAbs = path.join(stagingDir, 'claude-code-skills', skillName, 'SKILL.md');
      const evalMdAbs = path.join(stagingDir, 'claude-code-skills', skillName, 'EVAL.md');
      if (!fs.existsSync(skillMdAbs)) {
        throw new Error(
          `Claude Desktop bundle verification failed: missing exported SKILL.md at ${skillMdAbs}`,
        );
      }
      if (!fs.existsSync(evalMdAbs)) {
        throw new Error(
          `Claude Desktop bundle verification failed: missing exported EVAL.md at ${evalMdAbs}`,
        );
      }
    }
    for (const reqManualFile of [
      'README.md',
      'SKILL.md',
      'BLENDOPS_SINGLE_FILE.md',
      'IMPORT_STEPS.md',
      'manifest.json',
    ]) {
      if (!fs.existsSync(path.join(stagingDir, 'claude-desktop-manual', reqManualFile))) {
        throw new Error(
          `Claude Desktop bundle verification failed: missing claude-desktop-manual/${reqManualFile}`,
        );
      }
    }

    // Collect hashes of all generated files inside stagingDir for rollback safety
    const createdFiles = [];
    const createdFileHashes = {};
    function walkStaging(dirAbs) {
      const entries = fs
        .readdirSync(dirAbs, { withFileTypes: true })
        .sort((a, b) => compareCodeUnitOrder(a.name, b.name));
      for (const entry of entries) {
        const absChild = path.join(dirAbs, entry.name);
        const relChild = path.relative(stagingDir, absChild).split(path.sep).join('/');
        if (relChild === '.blendops' || relChild.startsWith('.blendops/')) continue;
        const childLstat = fs.lstatSync(absChild);
        if (childLstat.isSymbolicLink()) {
          throw new Error(`Refusing symbolic link inside staging output: ${relChild}`);
        }
        if (childLstat.isDirectory()) {
          walkStaging(absChild);
        } else if (childLstat.isFile()) {
          createdFiles.push(relChild);
          createdFileHashes[relChild] = sha256Buffer(fs.readFileSync(absChild));
        }
      }
    }
    walkStaging(stagingDir);

    const finalManifestAbsPath = path.join(outReal, livePlan.rollbackManifestRel);
    const stagingManifestMetaAbs = path.join(stagingDir, livePlan.rollbackManifestRel);
    const stagingReportMetaAbs = path.join(stagingDir, livePlan.installReportRel);

    const result = {
      ok: true,
      mode: 'write',
      targetRequested: livePlan.requestedTarget,
      targetSelected: 'claude-desktop',
      resolvedInstallMode: livePlan.effectiveBehavior,
      confidence: livePlan.confidence,
      scope: 'bundle-output',
      projectOrOutPath: outReal,
      detectedMarkers: [],
      filesCreated: createdFiles,
      filesModified: [],
      filesSkipped: [],
      backups: [],
      rollbackManifestPath: finalManifestAbsPath,
      skillMdCountPerZip: 1,
      zipCount: sourceInfo.skillCount,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      limitations: livePlan.limitations,
    };

    result.report = formatInstallerReport(result);
    const reportSha256 = sha256Buffer(Buffer.from(result.report, 'utf8'));

    const manifestData = {
      installer_version: INSTALLER_VERSION,
      timestamp: new Date().toISOString(),
      target: 'claude-desktop',
      requested_target: livePlan.requestedTarget,
      confidence: livePlan.confidence,
      scope: 'bundle-output',
      project: outReal,
      plan_hash: livePlan.planHash,
      source_fingerprint: livePlan.sourceFingerprint,
      files_created: createdFiles,
      files_modified: [],
      backups: [],
      files_skipped: [],
      created_file_hashes: createdFileHashes,
      modified_file_hashes: {},
      metadata_files: {
        [livePlan.installReportRel]: reportSha256,
        [livePlan.rollbackManifestRel]: 'self',
      },
      global_touched: false,
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
      rollback_steps: [
        `node scripts/install-skills.mjs --rollback --out "${outReal}"`,
      ],
    };

    validateRollbackManifestSchema(manifestData, stagingManifestMetaAbs);
    writeAtomicFile(stagingReportMetaAbs, result.report);
    writeAtomicFile(stagingManifestMetaAbs, `${JSON.stringify(manifestData, null, 2)}\n`);

    // Recheck destination state immediately before publishing so --out cannot be created after --dry-run
    let destExistsRightBeforePublish = false;
    try {
      fs.lstatSync(outReal);
      destExistsRightBeforePublish = true;
    } catch (err) {
      if (!err || err.code !== 'ENOENT') {
        throw err;
      }
    }
    if (destExistsRightBeforePublish) {
      throw new Error(
        `Destination --out directory appeared during staging (${outReal}); refusing to overwrite existing destination.`,
      );
    }

    fs.renameSync(stagingDir, outReal);
    return result;
  } finally {
    if (fs.existsSync(stagingDir)) {
      try {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } catch {
        // Best-effort cleanup of installer-owned staging directory only
      }
    }
  }
}

function executeRollbackMode({ repoRootReal, project, out, forceRollback = false }) {
  const rawRoot = project || out;
  const kind = project ? 'project' : 'out';
  const targetRootReal = validateDestinationRoot(rawRoot, {
    kind,
    repoRoot: repoRootReal,
    mustExist: true,
  });

  const blendopsDir = path.join(targetRootReal, '.blendops');
  const backupsDir = path.join(blendopsDir, 'backups');
  if (fs.existsSync(blendopsDir)) {
    const blendopsLstat = fs.lstatSync(blendopsDir);
    if (blendopsLstat.isSymbolicLink() || !blendopsLstat.isDirectory()) {
      throw new Error(`Rollback refused: unsafe .blendops path at ${blendopsDir}`);
    }
  }
  if (fs.existsSync(backupsDir)) {
    const backupsLstat = fs.lstatSync(backupsDir);
    if (backupsLstat.isSymbolicLink() || !backupsLstat.isDirectory()) {
      throw new Error(`Rollback refused: unsafe .blendops/backups path at ${backupsDir}`);
    }
  }

  if (fs.existsSync(path.join(blendopsDir, 'transaction-journal.json'))) {
    recoverPendingTransactionJournal(targetRootReal);
  }

  const manifestRel = '.blendops/install-manifest.json';
  const { absTarget: manifestAbs, exists: manifestExists } = validateSafeRelativeTargetFile(
    targetRootReal,
    manifestRel,
  );
  if (!manifestExists) {
    throw new Error(
      `Rollback failed: no rollback manifest found at ${path.join(targetRootReal, manifestRel)}`,
    );
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestAbs, 'utf8'));
  } catch {
    throw new Error(`Rollback refused: malformed rollback manifest JSON at ${manifestAbs}`);
  }

  // Schema & integrity metadata validation (--force-rollback never bypasses schema/hash metadata checks)
  validateRollbackManifestSchema(manifest, manifestAbs);

  const filesCreated = manifest.files_created;
  const filesModified = manifest.files_modified;
  const createdHashes = manifest.created_file_hashes;
  const modifiedHashes = manifest.modified_file_hashes;

  // Phase 1: Preflight verification before deleting or restoring anything
  const verifiedCreatedTargets = [];
  for (const relPath of filesCreated) {
    const { absTarget, exists } = validateSafeRelativeTargetFile(targetRootReal, relPath);
    const expectedHash = createdHashes[relPath];
    if (!exists) continue;
    const currentHash = sha256Buffer(fs.readFileSync(absTarget));
    if (currentHash !== expectedHash && !forceRollback) {
      throw new Error(
        `Rollback refused: installer-created file '${relPath}' was modified after installation (expected SHA-256 ${expectedHash.slice(0, 12)}, got ${currentHash.slice(0, 12)}). Inspect changes manually or pass --force-rollback.`,
      );
    }
    verifiedCreatedTargets.push({ relPath, absTarget });
  }

  const restoreTasks = [];
  for (const relPath of filesModified) {
    const { absTarget, exists } = validateSafeRelativeTargetFile(targetRootReal, relPath);
    const meta = modifiedHashes[relPath];
    const { absTarget: backupAbs, exists: backupExists } = validateSafeRelativeTargetFile(
      targetRootReal,
      meta.backup_path,
    );
    if (!backupExists) {
      throw new Error(`Rollback refused: backup file '${meta.backup_path}' is missing on disk`);
    }
    const backupBytes = fs.readFileSync(backupAbs);
    const backupHash = sha256Buffer(backupBytes);
    if (backupHash !== meta.pre_install_sha256) {
      throw new Error(
        `Rollback refused: backup file '${meta.backup_path}' failed SHA-256 integrity verification`,
      );
    }

    if (!exists && !forceRollback) {
      throw new Error(
        `Rollback refused: modified file '${relPath}' is missing on disk. Inspect changes manually or pass --force-rollback.`,
      );
    }

    if (exists && !forceRollback) {
      const currentHash = sha256Buffer(fs.readFileSync(absTarget));
      if (currentHash !== meta.post_install_sha256) {
        throw new Error(
          `Rollback refused: modified file '${relPath}' was edited by the user after installation (expected post-install SHA-256 ${meta.post_install_sha256.slice(0, 12)}, got ${currentHash.slice(0, 12)}). Inspect changes manually or pass --force-rollback.`,
        );
      }
    }

    restoreTasks.push({
      relPath,
      absTarget,
      backupRelPath: meta.backup_path,
      backupAbs,
      backupBytes,
      expectedPreHash: meta.pre_install_sha256,
    });
  }

  // Verify installer-owned .blendops/INSTALL_REPORT.md before deleting it
  const reportRel = '.blendops/INSTALL_REPORT.md';
  const { absTarget: reportAbs, exists: reportExists } = validateSafeRelativeTargetFile(
    targetRootReal,
    reportRel,
  );
  if (reportExists) {
    const expectedReportHash = manifest.metadata_files?.[reportRel];
    if (!isSha256Hex(expectedReportHash)) {
      throw new Error(
        `Rollback refused: missing expected SHA-256 hash for existing '${reportRel}' in rollback manifest at ${manifestAbs}`,
      );
    }
    const actualReportHash = sha256Buffer(fs.readFileSync(reportAbs));
    if (actualReportHash !== expectedReportHash) {
      throw new Error(
        `Rollback refused: installer metadata file '${reportRel}' was modified and failed SHA-256 verification at ${reportAbs}`,
      );
    }
  }

  // Phase 2: Execute restorations first
  const restoredPaths = [];
  for (const task of restoreTasks) {
    writeAtomicFile(task.absTarget, task.backupBytes);
    const restoredHash = sha256Buffer(fs.readFileSync(task.absTarget));
    if (restoredHash !== task.expectedPreHash) {
      throw new Error(`Rollback verification failed after restoring '${task.relPath}'`);
    }
    restoredPaths.push(task.relPath);
  }

  // Phase 3: Remove verified installer-created files and clean up empty parent directories
  const removedPaths = [];
  for (const item of verifiedCreatedTargets) {
    if (fs.existsSync(item.absTarget)) {
      fs.rmSync(item.absTarget, { force: true });
      removedPaths.push(item.relPath);
    }
    pruneEmptyParentDirectories(item.absTarget, targetRootReal);
  }

  // Phase 4: Ownership-aware cleanup of verified installer backups and metadata files inside .blendops
  for (const task of restoreTasks) {
    if (fs.existsSync(task.backupAbs)) {
      fs.rmSync(task.backupAbs, { force: true });
    }
    pruneEmptyParentDirectories(task.backupAbs, targetRootReal);
  }
  if (reportExists && fs.existsSync(reportAbs)) {
    fs.rmSync(reportAbs, { force: true });
  }
  if (fs.existsSync(manifestAbs)) {
    fs.rmSync(manifestAbs, { force: true });
  }
  pruneEmptyParentDirectories(manifestAbs, targetRootReal);

  const result = {
    ok: true,
    mode: 'rollback',
    targetRequested: manifest.requested_target || manifest.target || 'generic-project',
    targetSelected: manifest.target || 'generic-project',
    resolvedInstallMode: 'rollback',
    confidence: manifest.confidence || 'verified-read',
    scope: manifest.scope || 'project-local',
    projectOrOutPath: targetRootReal,
    detectedMarkers: [],
    filesCreated: [],
    filesModified: restoredPaths,
    filesSkipped: [],
    backups: [],
    removedFiles: removedPaths,
    restoredFiles: restoredPaths,
    rollbackManifestPath: manifestAbs,
    globalTouched: false,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    limitations: [
      `Rollback completed: restored ${restoredPaths.length} modified file(s) from verified backups and removed ${removedPaths.length} installer-created file(s).`,
    ],
  };

  result.report = formatInstallerReport(result);
  return result;
}

export function runInstaller(rawArgsOrOptions, options = {}) {
  const repoRoot = path.resolve(options.repoRoot || DEFAULT_REPO_ROOT);
  const repoRootReal = fs.existsSync(repoRoot) ? fs.realpathSync(repoRoot) : repoRoot;

  const parsed = Array.isArray(rawArgsOrOptions)
    ? parseInstallerArgs(rawArgsOrOptions)
    : parseInstallerArgsFromObject(rawArgsOrOptions);

  const programmaticPlanDir =
    options.planDir ||
    (!Array.isArray(rawArgsOrOptions) && rawArgsOrOptions && typeof rawArgsOrOptions === 'object'
      ? rawArgsOrOptions.planDir
      : null);

  if (parsed.mode === 'version') {
    return {
      ok: true,
      mode: 'version',
      version: INSTALLER_VERSION,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report: `blendops ${INSTALLER_VERSION}\n`,
    };
  }

  if (parsed.mode === 'help') {
    return {
      ok: true,
      mode: 'help',
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report: formatInstallerHelp(),
    };
  }

  if (parsed.mode === 'doctor') {
    return runDoctorMode({
      repoRootReal,
      project: parsed.project,
      target: parsed.target,
    });
  }

  if (parsed.mode === 'rollback') {
    return executeRollbackMode({
      repoRootReal,
      project: parsed.project,
      out: parsed.out,
      forceRollback: parsed.forceRollback,
    });
  }

  const isBundleTarget = parsed.target === 'claude-desktop';
  const destinationReal = isBundleTarget
    ? validateDestinationRoot(parsed.out, {
        kind: 'out',
        repoRoot: repoRootReal,
        mustExist: false,
      })
    : validateDestinationRoot(parsed.project, {
        kind: 'project',
        repoRoot: repoRootReal,
        mustExist: true,
      });

  const planFilePath = resolvePlanStorePath({
    planDir: programmaticPlanDir,
    repoRootReal,
    targetRootReal: destinationReal,
    requestedTarget: parsed.target,
  });

  if (parsed.mode === 'dry-run') {
    const livePlan = isBundleTarget
      ? buildClaudeDesktopPlan({
          repoRootReal,
          outReal: destinationReal,
          requestedTarget: parsed.target,
        })
      : buildProjectInstallPlan({
          repoRootReal,
          projectReal: destinationReal,
          requestedTarget: parsed.target,
          confirmTargetPath: parsed.confirmTargetPath,
          patchAgentsMd: parsed.patchAgentsMd,
          patchClaudeMd: parsed.patchClaudeMd,
        });

    if (fs.existsSync(planFilePath)) {
      let existingPlanObj = null;
      try {
        existingPlanObj = JSON.parse(fs.readFileSync(planFilePath, 'utf8'));
      } catch {
        throw new Error(
          `Refusing to overwrite existing non-plan file at ${planFilePath}`,
        );
      }
      if (
        !existingPlanObj ||
        typeof existingPlanObj !== 'object' ||
        Array.isArray(existingPlanObj) ||
        typeof existingPlanObj.installerVersion !== 'string' ||
        typeof existingPlanObj.planHash !== 'string'
      ) {
        throw new Error(
          `Refusing to overwrite existing non-plan file at ${planFilePath}`,
        );
      }
    }

    const rollbackManifestFullPath = path.join(destinationReal, livePlan.rollbackManifestRel);
    const planRecord = {
      ...livePlan,
      recordedAt: new Date().toISOString(),
    };
    writeAtomicFile(planFilePath, `${JSON.stringify(planRecord, null, 2)}\n`);

    const result = {
      ok: true,
      mode: 'dry-run',
      targetRequested: livePlan.requestedTarget,
      targetSelected: livePlan.selectedTarget,
      resolvedInstallMode: livePlan.effectiveBehavior,
      confidence: livePlan.confidence,
      scope: livePlan.scope,
      projectOrOutPath: destinationReal,
      detectedMarkers: livePlan.detectedMarkers,
      filesCreated: livePlan.filesToCreate,
      filesModified: livePlan.filesToModify,
      filesSkipped: livePlan.filesToSkip,
      backups: livePlan.backupsToCreate,
      rollbackManifestPath: rollbackManifestFullPath,
      planFilePath,
      planHash: livePlan.planHash,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      limitations: livePlan.limitations,
    };
    if (isBundleTarget) {
      result.skillMdCountPerZip = 1;
      result.zipCount = livePlan.skillCount || 48;
    }
    result.report = formatInstallerReport(result);
    return result;
  }

  // Mode === 'write': enforce mandatory dry-run gate BEFORE building or executing write plan
  if (!fs.existsSync(planFilePath)) {
    throw new Error(
      `Write mode refused: no prior --dry-run plan exists for target '${parsed.target}' at '${destinationReal}'. Run with --dry-run first.`,
    );
  }

  let savedPlan;
  try {
    savedPlan = JSON.parse(fs.readFileSync(planFilePath, 'utf8'));
  } catch {
    throw new Error(
      `Write mode refused: recorded dry-run plan at ${planFilePath} is corrupted. Re-run --dry-run first.`,
    );
  }

  if (!savedPlan || typeof savedPlan !== 'object' || Array.isArray(savedPlan)) {
    throw new Error(
      `Write mode refused: recorded dry-run plan at ${planFilePath} is invalid. Re-run --dry-run first.`,
    );
  }

  if (savedPlan.globalTouched === true || savedPlan.scope === 'global') {
    throw new Error(
      'Write mode refused: recorded dry-run plan requests an unsupported global write.',
    );
  }

  const { planHash: savedHash, recordedAt: _ignoredRecordedAt, ...savedPayload } = savedPlan;
  const recomputedSavedHash = sha256String(JSON.stringify(savedPayload));
  if (!savedHash || savedHash !== recomputedSavedHash) {
    throw new Error(
      `Write mode refused: recorded dry-run plan at ${planFilePath} failed integrity verification (tampered or invalid plan). Re-run --dry-run first.`,
    );
  }

  let livePlan;
  try {
    livePlan = isBundleTarget
      ? buildClaudeDesktopPlan({
          repoRootReal,
          outReal: destinationReal,
          requestedTarget: parsed.target,
        })
      : buildProjectInstallPlan({
          repoRootReal,
          projectReal: destinationReal,
          requestedTarget: parsed.target,
          confirmTargetPath: parsed.confirmTargetPath,
          patchAgentsMd: parsed.patchAgentsMd,
          patchClaudeMd: parsed.patchClaudeMd,
        });
  } catch (err) {
    if (
      isBundleTarget &&
      err instanceof Error &&
      err.message.includes('Refusing to use existing --out destination')
    ) {
      throw new Error(
        `Write mode refused: target --out directory (${destinationReal}) was created after --dry-run was recorded (stale dry-run plan); refusing to overwrite existing destination.`,
      );
    }
    throw err;
  }

  if (
    savedPlan.requestedTarget !== livePlan.requestedTarget ||
    savedPlan.selectedTarget !== livePlan.selectedTarget ||
    savedPlan.projectPath !== livePlan.projectPath ||
    savedPlan.confirmTargetPath !== livePlan.confirmTargetPath ||
    savedPlan.patchAgentsMd !== livePlan.patchAgentsMd ||
    Boolean(savedPlan.patchClaudeMd) !== Boolean(livePlan.patchClaudeMd)
  ) {
    throw new Error(
      'Write mode refused: options or resolved target do not match the recorded --dry-run plan. Re-run --dry-run with matching arguments.',
    );
  }

  if (savedPlan.sourceFingerprint !== livePlan.sourceFingerprint) {
    throw new Error(
      'Write mode refused: BlendOps source files changed since --dry-run was recorded. Re-run --dry-run first.',
    );
  }

  if (
    JSON.stringify(savedPlan.targetStateSnapshot) !==
      JSON.stringify(livePlan.targetStateSnapshot) ||
    savedPlan.planHash !== livePlan.planHash
  ) {
    throw new Error(
      'Write mode refused: target project files or markers changed since --dry-run was recorded (stale dry-run plan). Re-run --dry-run first.',
    );
  }

  if (isBundleTarget) {
    return executeWriteClaudeDesktopPlan(livePlan);
  }
  return executeWriteProjectPlan(livePlan, {
    faultInjection: options.faultInjection || null,
  });
}

function parseInstallerArgsFromObject(obj = {}) {
  const argv = [];
  if (obj.subcommand) argv.push(String(obj.subcommand));
  if (obj.version) argv.push('--version');
  if (obj.help) argv.push('--help');
  if (obj.target) argv.push('--target', String(obj.target));
  if (obj.project) argv.push('--project', String(obj.project));
  if (obj.out) argv.push('--out', String(obj.out));
  if (obj.doctor) argv.push('--doctor');
  if (obj.dryRun) argv.push('--dry-run');
  if (obj.write) argv.push('--write');
  if (obj.rollback) argv.push('--rollback');
  if (obj.forceRollback) argv.push('--force-rollback');
  if (obj.allowGlobal) argv.push('--allow-global');
  if (obj.confirmTargetPath) argv.push('--confirm-target-path');
  if (obj.patchAgentsMd) argv.push('--patch-agents-md');
  if (obj.patchClaudeMd) argv.push('--patch-claude-md');
  return parseInstallerArgs(argv);
}

export function runCli(argv = process.argv.slice(2), options = {}) {
  try {
    const res = runInstaller(argv, options);
    process.stdout.write(res.report);
    process.exitCode = 0;
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      [
        '## BlendOps installer error',
        '',
        `- Error: ${message}`,
        '- Global files touched: No',
        '- Runtime status: Not Run',
        '- Artifact status: Not Produced',
        '',
      ].join('\n'),
    );
    process.exitCode = 1;
    return null;
  }
}

const isMainModule =
  Boolean(process.argv[1]) &&
  (() => {
    try {
      return fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(__filename);
    } catch {
      return path.resolve(process.argv[1]) === __filename;
    }
  })();

if (isMainModule) {
  runCli(process.argv.slice(2));
}
