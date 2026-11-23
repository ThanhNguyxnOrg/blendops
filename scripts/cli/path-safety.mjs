import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { DEFAULT_REPO_ROOT, PROTECTED_BLENDOPS_REPO_ENTRIES } from './constants.mjs';

export function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function sha256String(str) {
  return crypto.createHash('sha256').update(String(str), 'utf8').digest('hex');
}

export function resolveWithExistingAncestorRealpath(targetPath) {
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

export function assertNoSymlinkedAncestorsWithin(rootReal, targetAbs) {
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

export function isGlobalAgentPath(candidatePath) {
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
      `Global home-directory path (${trimmed}) is rejected by BlendOps CLI; only project-local or explicit bundle output paths are allowed`,
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
      `Global configuration destination (${rawPath}) is rejected by BlendOps CLI; global writes are disabled`,
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

export function validateSafeRelativeTargetFile(rootReal, relPath) {
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
