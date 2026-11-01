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
  let target = null;
  let project = null;
  let out = null;
  let planDir = null;
  let doctor = false;
  let dryRun = false;
  let write = false;
  let rollback = false;
  let forceRollback = false;
  let allowGlobal = false;
  let confirmTargetPath = false;
  let patchAgentsMd = false;
  let help = false;

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

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
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
    } else if (arg === '--out') {
      out = takeValue('--out', out, argv, i);
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--out=')) {
      out = takeEqValue('--out', out, arg);
    } else if (arg === '--plan-dir') {
      planDir = takeValue('--plan-dir', planDir, argv, i);
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--plan-dir=')) {
      planDir = takeEqValue('--plan-dir', planDir, arg);
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
      target,
      project,
      out,
      planDir,
      forceRollback,
      confirmTargetPath,
      patchAgentsMd,
    };
  }

  const activeModes = [
    doctor ? 'doctor' : null,
    dryRun ? 'dry-run' : null,
    write ? 'write' : null,
    rollback ? 'rollback' : null,
  ].filter(Boolean);

  if (activeModes.length === 0) {
    throw new Error(
      'Missing operation mode: specify exactly one of --doctor, --dry-run, --write, --rollback, or --help.',
    );
  }
  if (activeModes.length > 1) {
    throw new Error(
      `Conflicting operation modes (${activeModes.join(', ')}): specify exactly one mode per invocation.`,
    );
  }

  const mode = activeModes[0];

  if (forceRollback && mode !== 'rollback') {
    throw new Error('--force / --force-rollback is only valid with --rollback.');
  }

  if (mode === 'dry-run' || mode === 'write') {
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
    target,
    project,
    out,
    planDir,
    forceRollback,
    confirmTargetPath,
    patchAgentsMd,
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

export function computeBlendOpsSourceFingerprint(repoRoot = DEFAULT_REPO_ROOT) {
  const requiredFiles = [
    'bundles/generic-project-local/BLENDOPS.md',
    'bundles/generic-project-local/ROLLBACK.md',
    'bundles/generic-project-local/INSTALL_REPORT_TEMPLATE.md',
    'bundles/generic-project-local/manifest.json',
    'bundles/claude-desktop-manual/manifest.json',
    'scripts/export-claude-skills.mjs',
  ];
  const hash = crypto.createHash('sha256');
  for (const rel of requiredFiles) {
    const abs = path.join(repoRoot, rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`Missing required BlendOps source file: ${rel}`);
    }
    const lstat = fs.lstatSync(abs);
    if (lstat.isSymbolicLink() || !lstat.isFile()) {
      throw new Error(`Unsafe or non-regular BlendOps source file: ${rel}`);
    }
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
        (typeof parsed.bundle_name !== 'string' || typeof parsed.target !== 'string' || !Array.isArray(parsed.files))
      ) {
        throw new Error(`Malformed claude-desktop-manual manifest schema in ${rel}`);
      }
    }
    hash.update(`file:${rel}:${content.length}:`);
    hash.update(content);
    hash.update('\0');
  }
  const skillsDir = path.join(repoRoot, 'skills');
  if (!fs.existsSync(skillsDir)) {
    throw new Error(`Missing required BlendOps skills directory: ${skillsDir}`);
  }
  const skillDirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .sort();
  if (skillDirs.length === 0) {
    throw new Error(`No canonical skills found in ${skillsDir}`);
  }
  const skillNames = [];
  for (const name of skillDirs) {
    const skillMdAbs = path.join(skillsDir, name, 'SKILL.md');
    if (!fs.existsSync(skillMdAbs)) {
      throw new Error(`Missing SKILL.md for canonical skill '${name}' in ${skillsDir}`);
    }
    skillNames.push(name);
  }
  hash.update(`skills:${skillNames.length}:${skillNames.join(',')}\0`);
  return {
    fingerprint: hash.digest('hex'),
    skillCount: skillNames.length,
    skillNames,
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

function buildCursorRuleMdcContent({ selectedTarget, confidence }) {
  return [
    '---',
    'description: BlendOps project-local workflow guidance for Blender planning, readiness, evidence, and handoff (Runtime: Not Run, Artifacts: Not Produced)',
    'globs:',
    'alwaysApply: false',
    '---',
    '',
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
    '',
  ].join('\n');
}

function applyManagedBlockToDocument(existingContent, managedBlock, defaultHeaderTitle) {
  if (existingContent === null || existingContent === undefined) {
    if (!defaultHeaderTitle) {
      return managedBlock.endsWith('\n') ? managedBlock : `${managedBlock}\n`;
    }
    return `${defaultHeaderTitle}\n\n${managedBlock.trim()}\n`;
  }

  const startIdx = existingContent.indexOf(MANAGED_SECTION_START);
  const endIdx = existingContent.indexOf(MANAGED_SECTION_END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existingContent.slice(0, startIdx);
    const after = existingContent.slice(endIdx + MANAGED_SECTION_END.length);
    return `${before}${managedBlock.trim()}${after}`;
  }

  const trimmed = existingContent.replace(/\s+$/, '');
  return `${trimmed}\n\n${managedBlock.trim()}\n`;
}

function planSingleFileOperation(projectReal, relPath, desiredContent) {
  const { norm, absTarget, exists } = validateSafeRelativeTargetFile(projectReal, relPath);
  const desiredBuf = Buffer.from(desiredContent, 'utf8');
  const desiredSha256 = sha256Buffer(desiredBuf);

  if (!exists) {
    return {
      action: 'create',
      path: norm,
      absPath: absTarget,
      desiredContent,
      desiredSha256,
      preExistingSha256: null,
      backupRelPath: null,
    };
  }

  const currentBuf = fs.readFileSync(absTarget);
  const currentSha256 = sha256Buffer(currentBuf);

  if (currentSha256 === desiredSha256 && currentBuf.equals(desiredBuf)) {
    return {
      action: 'skip',
      path: norm,
      absPath: absTarget,
      reason: 'Already up to date (idempotent)',
      desiredContent,
      desiredSha256,
      preExistingSha256: currentSha256,
      backupRelPath: null,
    };
  }

  const currentText = currentBuf.toString('utf8');
  const mergedText = applyManagedBlockToDocument(currentText, desiredContent, null);
  const mergedBuf = Buffer.from(mergedText, 'utf8');
  const mergedSha256 = sha256Buffer(mergedBuf);

  if (currentSha256 === mergedSha256 && currentBuf.equals(mergedBuf)) {
    return {
      action: 'skip',
      path: norm,
      absPath: absTarget,
      reason: 'Managed section already up to date (idempotent)',
      desiredContent: mergedText,
      desiredSha256: mergedSha256,
      preExistingSha256: currentSha256,
      backupRelPath: null,
    };
  }

  const encodedBackupName = `${norm.replace(/\//g, '__')}.bak`;
  const backupRelPath = `.blendops/backups/${encodedBackupName}`;

  return {
    action: 'modify',
    path: norm,
    absPath: absTarget,
    desiredContent: mergedText,
    desiredSha256: mergedSha256,
    preExistingSha256: currentSha256,
    backupRelPath,
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

function resolvePlanStorePath({
  planDir,
  repoRootReal,
  targetRootReal,
  requestedTarget,
}) {
  const basePlanDir = path.resolve(
    planDir ||
      process.env.BLENDOPS_INSTALLER_PLAN_DIR ||
      path.join(os.tmpdir(), 'blendops-installer-plans'),
  );
  const key = sha256String(`${repoRootReal}::${targetRootReal}::${requestedTarget}`).slice(0, 24);
  return path.join(basePlanDir, `plan-${key}.json`);
}

function buildProjectInstallPlan({
  repoRootReal,
  projectReal,
  requestedTarget,
  confirmTargetPath,
  patchAgentsMd,
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

  const operations = [];
  const blendopsMdContent = buildCanonicalBlendOpsMd(repoRootReal, {
    selectedTarget,
    confidence,
    effectiveBehavior,
  });
  operations.push(planSingleFileOperation(projectReal, 'BLENDOPS.md', blendopsMdContent));

  const managedSection = buildManagedBlendOpsSection({
    selectedTarget,
    effectiveBehavior,
  });

  if (selectedTarget === 'claude-code') {
    const claudeMdDesired = applyManagedBlockToDocument(
      fs.existsSync(path.join(projectReal, 'CLAUDE.md'))
        ? fs.readFileSync(path.join(projectReal, 'CLAUDE.md'), 'utf8')
        : null,
      managedSection,
      '# CLAUDE.md',
    );
    operations.push(planSingleFileOperation(projectReal, 'CLAUDE.md', claudeMdDesired));
    skippedEntries.push({
      path: '.claude/skills/',
      reason:
        'Claude Code native .claude/skills/ loader path is unverified in this environment; using project-local CLAUDE.md + BLENDOPS.md attachment.',
    });
    limitations.push(
      'Claude Code project-local adapter (CLAUDE.md / BLENDOPS.md) is verified-read; native .claude/skills/ loader and live claude CLI execution remain unverified.',
    );
  }

  if (selectedTarget === 'cursor') {
    skippedEntries.push({
      path: '.cursor/rules/*.md',
      reason: 'Plain .md files under .cursor/rules/ are ignored by Cursor and are never written.',
    });
    if (effectiveBehavior === 'cursor-mdc-project-local') {
      const mdcContent = buildCursorRuleMdcContent({ selectedTarget, confidence });
      operations.push(
        planSingleFileOperation(projectReal, '.cursor/rules/blendops.mdc', mdcContent),
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
      const agentsDesired = applyManagedBlockToDocument(
        fs.existsSync(path.join(projectReal, 'AGENTS.md'))
          ? fs.readFileSync(path.join(projectReal, 'AGENTS.md'), 'utf8')
          : null,
        managedSection,
        '# AGENTS.md',
      );
      operations.push(planSingleFileOperation(projectReal, 'AGENTS.md', agentsDesired));
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
    const agentsDesired = applyManagedBlockToDocument(
      fs.existsSync(path.join(projectReal, 'AGENTS.md'))
        ? fs.readFileSync(path.join(projectReal, 'AGENTS.md'), 'utf8')
        : null,
      managedSection,
      '# AGENTS.md',
    );
    operations.push(planSingleFileOperation(projectReal, 'AGENTS.md', agentsDesired));
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
    .filter((op) => op.action === 'modify')
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

  const rollbackManifestRel = '.blendops/install-manifest.json';
  const installReportRel = '.blendops/INSTALL_REPORT.md';

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
    sourceFingerprint: sourceInfo.fingerprint,
    detectedMarkers,
    targetStateSnapshot,
    operations: operations.map((op) => ({
      action: op.action,
      path: op.path,
      desiredSha256: op.desiredSha256,
      desiredContent: op.desiredContent,
      preExistingSha256: op.preExistingSha256,
      backupRelPath: op.backupRelPath,
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

  const existingEntries = fs.existsSync(outReal)
    ? fs.readdirSync(outReal).sort()
    : [];
  const targetStateSnapshot = {
    outExists: fs.existsSync(outReal),
    existingEntries,
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
    '## BlendOps Safe Project-Local Installer (`scripts/install-skills.mjs`)',
    '',
    'Usage:',
    '  node scripts/install-skills.mjs --doctor [--target <name>] [--project <path>]',
    '  node scripts/install-skills.mjs --target <name> --project <path> [--confirm-target-path] [--patch-agents-md] --dry-run',
    '  node scripts/install-skills.mjs --target <name> --project <path> [--confirm-target-path] [--patch-agents-md] --write',
    '  node scripts/install-skills.mjs --target claude-desktop --out <path> --dry-run',
    '  node scripts/install-skills.mjs --target claude-desktop --out <path> --write',
    '  node scripts/install-skills.mjs --rollback (--project <path> | --out <path>) [--force-rollback]',
    '  node scripts/install-skills.mjs --help',
    '',
    'Options:',
    '  --target <name>         Target profile (auto, claude-code, opencode, cursor, codex, gemini, antigravity, github-copilot, generic-project, claude-desktop)',
    '  --project <path>        Target project root directory (required for project-local targets)',
    '  --out <path>            Output directory for bundle targets (--target claude-desktop)',
    '  --doctor                Run strictly read-only repository and target diagnostics',
    '  --dry-run               Inspect target and record a verified dry-run plan without modifying target files',
    '  --write                 Execute a previously recorded, non-stale dry-run plan with atomic writes and backups',
    '  --rollback              Restore pre-install backups and remove installer-created files from .blendops/install-manifest.json',
    '  --force-rollback        Override post-install file edit protection during --rollback',
    '  --confirm-target-path   Confirm target-specific writes for documented linked-only targets (cursor .mdc, codex AGENTS.md)',
    '  --patch-agents-md       Create or append a managed BlendOps section in AGENTS.md with backup',
    '  --allow-global          Rejected in Phase 10 (global writes are disabled)',
    '  --help, -h              Show this help output and exit without writing files',
    '',
    'Supported targets:',
    ...targetLines,
    '',
    'Boundaries:',
    '- Local repository content installer only (no npm/npx package, no marketplace listing, no Blender install or MCP setup).',
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
    `Read-only diagnostics completed (${sourceInfo.skillCount} canonical skills verified). No files were written, no runtime was configured or executed, and no artifacts were produced.`,
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

function executeWriteProjectPlan(livePlan, planFilePath) {
  const projectReal = livePlan.projectPath;
  const blendopsDir = path.join(projectReal, '.blendops');
  const backupsDir = path.join(blendopsDir, 'backups');
  const manifestAbsPath = path.join(projectReal, livePlan.rollbackManifestRel);
  const reportAbsPath = path.join(projectReal, livePlan.installReportRel);

  // Check if .blendops or its children are symlinks or non-directories before touching anything
  assertNoSymlinkedAncestorsWithin(projectReal, manifestAbsPath);
  assertNoSymlinkedAncestorsWithin(projectReal, reportAbsPath);

  if (fs.existsSync(blendopsDir)) {
    const blendopsLstat = fs.lstatSync(blendopsDir);
    if (blendopsLstat.isSymbolicLink() || !blendopsLstat.isDirectory()) {
      throw new Error(`Unsafe .blendops metadata path at ${blendopsDir}: must be a regular directory`);
    }
  }
  if (fs.existsSync(backupsDir)) {
    const backupsLstat = fs.lstatSync(backupsDir);
    if (backupsLstat.isSymbolicLink() || !backupsLstat.isDirectory()) {
      throw new Error(`Unsafe .blendops/backups path at ${backupsDir}: must be a regular directory`);
    }
  }

  // Load any prior install manifest so idempotent re-runs preserve initial backups & created-file tracking
  let previousManifest = null;
  if (fs.existsSync(manifestAbsPath)) {
    const lstat = fs.lstatSync(manifestAbsPath);
    if (lstat.isSymbolicLink() || !lstat.isFile() || lstat.nlink > 1) {
      throw new Error(`Unsafe existing rollback manifest at ${manifestAbsPath}`);
    }
    try {
      previousManifest = JSON.parse(fs.readFileSync(manifestAbsPath, 'utf8'));
    } catch {
      throw new Error(`Malformed existing rollback manifest JSON at ${manifestAbsPath}`);
    }
    if (
      !previousManifest ||
      typeof previousManifest !== 'object' ||
      Array.isArray(previousManifest) ||
      !Array.isArray(previousManifest.files_created)
    ) {
      throw new Error(`Malformed existing rollback manifest schema at ${manifestAbsPath}`);
    }
  }

  fs.mkdirSync(blendopsDir, { recursive: true });

  const createdFilesSet = new Set(previousManifest ? previousManifest.files_created || [] : []);
  const modifiedFilesSet = new Set(previousManifest ? previousManifest.files_modified || [] : []);
  const createdFileHashes = { ...(previousManifest?.created_file_hashes || {}) };
  const modifiedFileHashes = { ...(previousManifest?.modified_file_hashes || {}) };
  const backupsMap = new Map();
  if (previousManifest && Array.isArray(previousManifest.backups)) {
    for (const b of previousManifest.backups) {
      if (b && typeof b === 'object' && b.path) {
        backupsMap.set(b.path, b);
      }
    }
  }

  // Step 1: Create byte-identical backups for all files to be modified BEFORE mutating any target file
  for (const op of livePlan.operations) {
    if (op.action !== 'modify') continue;
    const { absTarget } = validateSafeRelativeTargetFile(projectReal, op.path);
    const currentBytes = fs.readFileSync(absTarget);
    const currentHash = sha256Buffer(currentBytes);
    if (currentHash !== op.preExistingSha256) {
      throw new Error(
        `Target file '${op.path}' changed before backup could be recorded; aborting write.`,
      );
    }

    const backupAbsPath = path.join(projectReal, op.backupRelPath);
    assertNoSymlinkedAncestorsWithin(projectReal, backupAbsPath);
    fs.mkdirSync(path.dirname(backupAbsPath), { recursive: true });

    // Only write backup if a prior install didn't already back up the original pre-install state
    if (!backupsMap.has(op.path) || !fs.existsSync(backupAbsPath)) {
      writeAtomicFile(backupAbsPath, currentBytes);
      const verifyBackupHash = sha256Buffer(fs.readFileSync(backupAbsPath));
      if (verifyBackupHash !== currentHash) {
        throw new Error(`Backup verification failed for ${op.backupRelPath}`);
      }
      backupsMap.set(op.path, {
        path: op.path,
        backup_path: op.backupRelPath,
        pre_install_sha256: currentHash,
        post_install_sha256: op.desiredSha256,
      });
      modifiedFileHashes[op.path] = {
        pre_install_sha256: currentHash,
        post_install_sha256: op.desiredSha256,
        backup_path: op.backupRelPath,
      };
    } else {
      const existingEntry = backupsMap.get(op.path);
      existingEntry.post_install_sha256 = op.desiredSha256;
      modifiedFileHashes[op.path] = {
        pre_install_sha256: existingEntry.pre_install_sha256,
        post_install_sha256: op.desiredSha256,
        backup_path: existingEntry.backup_path,
      };
    }

    if (createdFilesSet.has(op.path)) {
      createdFileHashes[op.path] = op.desiredSha256;
    } else {
      modifiedFilesSet.add(op.path);
    }
  }

  for (const op of livePlan.operations) {
    if (op.action !== 'create') continue;
    createdFilesSet.add(op.path);
    createdFileHashes[op.path] = op.desiredSha256;
  }

  const finalFilesCreated = [...createdFilesSet];
  const finalFilesModified = [...modifiedFilesSet].filter((p) => !createdFilesSet.has(p));
  const finalBackups = [...backupsMap.values()].filter((b) => !createdFilesSet.has(b.path));

  const rollbackSteps = [
    `node scripts/install-skills.mjs --rollback --project "${projectReal}"`,
    ...finalBackups.map((b) => `cp "${b.backup_path}" "${b.path}"`),
    ...finalFilesCreated.map((f) => `rm -f "${f}"`),
    'rm -rf .blendops',
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
    global_touched: false,
    runtime_status: 'Not Run',
    artifact_status: 'Not Produced',
    rollback_steps: rollbackSteps,
  };

  // Step 2: Persist rollback manifest BEFORE mutating any target project instruction files
  writeAtomicFile(manifestAbsPath, `${JSON.stringify(manifestData, null, 2)}\n`);

  // Step 3: Atomically write created and modified target files
  const newlyAppliedBackups = [];
  const newlyCreatedPaths = [];
  try {
    for (const op of livePlan.operations) {
      if (op.action !== 'create' && op.action !== 'modify') continue;
      const { absTarget, exists } = validateSafeRelativeTargetFile(projectReal, op.path);
      if (op.action === 'create' && !exists) {
        newlyCreatedPaths.push(absTarget);
      } else if (op.action === 'modify') {
        newlyAppliedBackups.push({
          absTarget,
          backupAbsPath: path.join(projectReal, op.backupRelPath),
        });
      }
      writeAtomicFile(absTarget, op.desiredContent);
      const writtenHash = sha256Buffer(fs.readFileSync(absTarget));
      if (writtenHash !== op.desiredSha256) {
        throw new Error(`Post-write hash verification failed for ${op.path}`);
      }
    }
  } catch (writeErr) {
    // Best-effort transactional rollback if an unexpected error occurs mid-write
    for (const createdAbs of newlyCreatedPaths) {
      try {
        fs.rmSync(createdAbs, { force: true });
      } catch {
        // Ignore cleanup error
      }
    }
    for (const item of newlyAppliedBackups) {
      try {
        if (fs.existsSync(item.backupAbsPath)) {
          fs.copyFileSync(item.backupAbsPath, item.absTarget);
        }
      } catch {
        // Ignore cleanup error
      }
    }
    throw writeErr;
  }

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
  writeAtomicFile(reportAbsPath, result.report);

  return result;
}

function executeWriteClaudeDesktopPlan(livePlan) {
  const outReal = livePlan.projectPath;
  const repoRootReal = livePlan.repoRootPath;
  const sourceInfo = computeBlendOpsSourceFingerprint(repoRootReal);

  fs.mkdirSync(outReal, { recursive: true });
  const exporterPath = path.join(repoRootReal, 'scripts', 'export-claude-skills.mjs');
  execFileSync(process.execPath, [exporterPath, '--output-root', outReal], {
    cwd: repoRootReal,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const manualSrc = path.join(repoRootReal, 'bundles', 'claude-desktop-manual');
  const manualDest = path.join(outReal, 'claude-desktop-manual');
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
  writeAtomicFile(path.join(outReal, 'README.md'), topReadmeContent);

  // Verify exported manifest, README, and all 48 ZIP outputs + folder outputs
  const topManifestAbs = path.join(outReal, 'manifest.json');
  if (!fs.existsSync(topManifestAbs)) {
    throw new Error(`Claude Desktop bundle verification failed: missing ${topManifestAbs}`);
  }
  const topManifest = JSON.parse(fs.readFileSync(topManifestAbs, 'utf8'));
  if (topManifest.skillCount !== sourceInfo.skillCount) {
    throw new Error(
      `Claude Desktop bundle verification failed: expected ${sourceInfo.skillCount} skills in manifest.json, got ${topManifest.skillCount}`,
    );
  }
  for (const skillName of sourceInfo.skillNames) {
    const zipAbs = path.join(outReal, 'desktop-zips', `${skillName}.zip`);
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
    const skillMdAbs = path.join(outReal, 'claude-code-skills', skillName, 'SKILL.md');
    if (!fs.existsSync(skillMdAbs)) {
      throw new Error(
        `Claude Desktop bundle verification failed: missing exported SKILL.md at ${skillMdAbs}`,
      );
    }
  }
  if (!fs.existsSync(path.join(outReal, 'claude-desktop-manual', 'README.md'))) {
    throw new Error('Claude Desktop bundle verification failed: missing claude-desktop-manual/README.md');
  }

  // Collect hashes of all generated files for rollback safety
  const createdFiles = [];
  const createdFileHashes = {};
  function walkGenerated(dirAbs) {
    for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absChild = path.join(dirAbs, entry.name);
      const relChild = path.relative(outReal, absChild).split(path.sep).join('/');
      if (relChild === '.blendops' || relChild.startsWith('.blendops/')) continue;
      if (entry.isDirectory()) {
        walkGenerated(absChild);
      } else if (entry.isFile()) {
        createdFiles.push(relChild);
        createdFileHashes[relChild] = sha256Buffer(fs.readFileSync(absChild));
      }
    }
  }
  walkGenerated(outReal);

  const manifestAbsPath = path.join(outReal, livePlan.rollbackManifestRel);
  const reportAbsPath = path.join(outReal, livePlan.installReportRel);

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
    global_touched: false,
    runtime_status: 'Not Run',
    artifact_status: 'Not Produced',
    rollback_steps: [
      `node scripts/install-skills.mjs --rollback --out "${outReal}"`,
      `rm -rf "${outReal}"`,
    ],
  };

  writeAtomicFile(manifestAbsPath, `${JSON.stringify(manifestData, null, 2)}\n`);

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
    rollbackManifestPath: manifestAbsPath,
    skillMdCountPerZip: 1,
    zipCount: sourceInfo.skillCount,
    globalTouched: false,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    limitations: livePlan.limitations,
  };

  result.report = formatInstallerReport(result);
  writeAtomicFile(reportAbsPath, result.report);
  return result;
}

function executeRollbackMode({ repoRootReal, project, out, forceRollback = false }) {
  const rawRoot = project || out;
  const kind = project ? 'project' : 'out';
  const targetRootReal = validateDestinationRoot(rawRoot, {
    kind,
    repoRoot: repoRootReal,
    mustExist: true,
  });

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
  if (
    !manifest ||
    typeof manifest !== 'object' ||
    Array.isArray(manifest) ||
    !Array.isArray(manifest.files_created) ||
    !Array.isArray(manifest.files_modified) ||
    typeof manifest.target !== 'string'
  ) {
    throw new Error(`Rollback refused: invalid rollback manifest schema at ${manifestAbs}`);
  }
  const filesCreated = manifest.files_created;
  const filesModified = manifest.files_modified;
  const createdHashes = manifest.created_file_hashes || {};
  const modifiedHashes = manifest.modified_file_hashes || {};

  // Phase 1: Preflight verification before deleting or restoring anything
  for (const relPath of filesCreated) {
    const { absTarget, exists } = validateSafeRelativeTargetFile(targetRootReal, relPath);
    if (!exists) continue;
    const currentHash = sha256Buffer(fs.readFileSync(absTarget));
    const expectedHash = createdHashes[relPath];
    if (expectedHash && currentHash !== expectedHash && !forceRollback) {
      throw new Error(
        `Rollback refused: installer-created file '${relPath}' was modified after installation (expected SHA-256 ${expectedHash.slice(0, 12)}, got ${currentHash.slice(0, 12)}). Inspect changes manually or pass --force-rollback.`,
      );
    }
  }

  const restoreTasks = [];
  for (const relPath of filesModified) {
    const { absTarget, exists } = validateSafeRelativeTargetFile(targetRootReal, relPath);
    const meta = modifiedHashes[relPath];
    if (!meta || !meta.backup_path || !meta.pre_install_sha256) {
      throw new Error(`Rollback refused: missing backup metadata in manifest for '${relPath}'`);
    }
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

    if (exists && meta.post_install_sha256 && !forceRollback) {
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
      backupBytes,
      expectedPreHash: meta.pre_install_sha256,
    });
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

  // Phase 3: Remove installer-created files and clean up empty directories
  const removedPaths = [];
  for (const relPath of filesCreated) {
    const absTarget = path.join(targetRootReal, relPath);
    if (fs.existsSync(absTarget)) {
      fs.rmSync(absTarget, { force: true });
      removedPaths.push(relPath);
    }
    // Clean up empty parent directories inside targetRootReal if created by installer (e.g., .cursor/rules or desktop-zips)
    let parentDir = path.dirname(absTarget);
    while (parentDir !== targetRootReal && parentDir.startsWith(targetRootReal)) {
      if (fs.existsSync(parentDir) && fs.readdirSync(parentDir).length === 0) {
        fs.rmdirSync(parentDir);
        parentDir = path.dirname(parentDir);
      } else {
        break;
      }
    }
  }

  // Phase 4: Remove .blendops metadata directory
  const blendopsDir = path.join(targetRootReal, '.blendops');
  if (fs.existsSync(blendopsDir)) {
    fs.rmSync(blendopsDir, { recursive: true, force: true });
  }

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
      });

  const planFilePath = resolvePlanStorePath({
    planDir: parsed.planDir || options.planDir,
    repoRootReal,
    targetRootReal: destinationReal,
    requestedTarget: parsed.target,
  });

  const rollbackManifestFullPath = path.join(destinationReal, livePlan.rollbackManifestRel);

  if (parsed.mode === 'dry-run') {
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

  // Mode === 'write': enforce mandatory dry-run gate
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

  if (
    savedPlan.requestedTarget !== livePlan.requestedTarget ||
    savedPlan.selectedTarget !== livePlan.selectedTarget ||
    savedPlan.projectPath !== livePlan.projectPath ||
    savedPlan.confirmTargetPath !== livePlan.confirmTargetPath ||
    savedPlan.patchAgentsMd !== livePlan.patchAgentsMd
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
  return executeWriteProjectPlan(livePlan, planFilePath);
}

function parseInstallerArgsFromObject(obj = {}) {
  const argv = [];
  if (obj.help) argv.push('--help');
  if (obj.target) argv.push('--target', String(obj.target));
  if (obj.project) argv.push('--project', String(obj.project));
  if (obj.out) argv.push('--out', String(obj.out));
  if (obj.planDir) argv.push('--plan-dir', String(obj.planDir));
  if (obj.doctor) argv.push('--doctor');
  if (obj.dryRun) argv.push('--dry-run');
  if (obj.write) argv.push('--write');
  if (obj.rollback) argv.push('--rollback');
  if (obj.forceRollback) argv.push('--force-rollback');
  if (obj.allowGlobal) argv.push('--allow-global');
  if (obj.confirmTargetPath) argv.push('--confirm-target-path');
  if (obj.patchAgentsMd) argv.push('--patch-agents-md');
  return parseInstallerArgs(argv);
}

const isMainModule =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  try {
    const res = runInstaller(process.argv.slice(2));
    process.stdout.write(res.report);
    process.exit(0);
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
    process.exit(1);
  }
}
