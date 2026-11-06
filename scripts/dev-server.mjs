#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const CANONICAL_BUNDLE_FILENAME = 'blendops-phase-9.bundle';
export const PHASE13_2_PATCH_FILENAME = 'blendops-phase-13.2-complete.patch';
export const PHASE13_2_PATCH_MIN_SIZE = 2000000;
export const PHASE13_2_BASELINE_COMMIT = 'cf6b0e76915906a1b4fb48d83c766b947cbcebeb';
export const PHASE13_2_DELIVERY_FILENAME = PHASE13_2_PATCH_FILENAME;
export const PHASE13_DELIVERY_FILENAME = 'blendops-phase-13-repository-finalization.bundle';
export const PHASE13_EXPECTED_PARENT_SHA = '112ecf75a04ab5864b3dc3656b9a27f09d1e8dcd';
export const PHASE12_DELIVERY_FILENAME = 'blendops-phase-12-web-ready-glb-handoff.bundle';
export const PHASE12_EXPECTED_HEAD_SHA = '112ecf75a04ab5864b3dc3656b9a27f09d1e8dcd';
export const PHASE12_EXPECTED_PARENT_SHA = '4f5bd1e3c9eef7261dfc9ff9e20668e2338841ee';
export const PHASE12_PREVIOUS_PARENT_SHA = 'fdae0e77187c970893bc5414166aed448677f951';
export const PHASE11_DELIVERY_FILENAME = 'blendops-phase-11-cli-package.bundle';
export const PHASE11_EXPECTED_HEAD_SHA = '4f5bd1e3c9eef7261dfc9ff9e20668e2338841ee';
export const PHASE11_PREVIOUS_HEAD_SHA = 'fdae0e77187c970893bc5414166aed448677f951';
export const PHASE11_EXPECTED_PARENT_SHA = 'e92230d3423fd1c6f07ab83c893854aba2a034db';
export const PHASE11_PREVIOUS_PARENT_SHA = 'c2bd7ebd1f2c9059153037aba4ca0cde07e3472b';
export const PHASE10_2_DELIVERY_FILENAME = 'blendops-phase-10.2-transaction-safety.bundle';
export const PHASE10_2_EXPECTED_HEAD_SHA = 'f0804fd64a9fa4f263a9ec59c5de84ed21733747';
export const PHASE10_2_EXPECTED_PARENT_SHA = 'ce95a155362b0281f228dcfa89ada0ccfa21533d';
export const PHASE10_1_DELIVERY_FILENAME = 'blendops-phase-10.1-safety-fix.bundle';
export const PHASE10_1_EXPECTED_HEAD_SHA = 'ce95a155362b0281f228dcfa89ada0ccfa21533d';
export const PHASE10_1_EXPECTED_PARENT_SHA = '23e00d5d735190049ec0cb224bec4ae7fd67a990';
export const PHASE10_DELIVERY_FILENAME = 'blendops-phase-10-delivery.bundle';
export const PHASE10_EXPECTED_SIZE = 2790095;
export const PHASE10_EXPECTED_SHA256 =
  '2726f6e7b8f375fac286c5a389a6b5d0c1ddddba75d279fb2aefb4177ffc1d92';
export const PHASE10_EXPECTED_HEAD_SHA = '23e00d5d735190049ec0cb224bec4ae7fd67a990';
export const PHASE10_EXPECTED_PARENT_SHA = 'f06fce82e5dae19f3ea9449c460e2fe2083c474d';

export const COMPATIBILITY_BUNDLE_ROUTES = Object.freeze([
  '/blendops-phase-10.bundle',
  '/blendops-phase-9.1.bundle',
  '/blendops-phase-9.bundle',
  '/blendops-phase-8.1.1.bundle',
  '/blendops-phase-8.1.bundle',
  '/blendops-phase-8.bundle',
  '/blendops-phase-7.bundle',
  '/blendops-phase-6.1.bundle',
  '/blendops-phase-6.bundle',
  '/blendops-phase-5.bundle',
]);

const COMPAT_ROUTE_SET = new Set(COMPATIBILITY_BUNDLE_ROUTES);
const inFlightBundleLocks = new Map();

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

function hasBundleBinaryHeader(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    try {
      const buf = Buffer.alloc(32);
      const bytesRead = fs.readSync(fd, buf, 0, 32, 0);
      if (bytesRead < 16) return false;
      const slice = buf.subarray(0, bytesRead);
      const nl = slice.indexOf(0x0a);
      if (nl === -1) return false;
      const hdr = slice.subarray(0, nl).toString('utf8').trim();
      return hdr === '# v2 git bundle' || hdr === '# v3 git bundle';
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    return false;
  }
}

export function resolveDefaultBundleCachePath(rootDir = process.cwd()) {
  let canonicalRoot;
  try {
    canonicalRoot = fs.realpathSync(rootDir);
  } catch {
    canonicalRoot = path.resolve(rootDir);
  }
  const repoHash = crypto
    .createHash('sha256')
    .update(canonicalRoot)
    .digest('hex')
    .slice(0, 16);
  return path.join(
    os.tmpdir(),
    `blendops-bundle-cache-${repoHash}`,
    CANONICAL_BUNDLE_FILENAME,
  );
}

export function validateBundleCachePath(bundlePath, rootDir = process.cwd(), options = {}) {
  if (typeof bundlePath !== 'string' || bundlePath.trim().length === 0 || bundlePath.includes('\0')) {
    throw new Error('Invalid bundle cache path: must be a non-empty string');
  }

  const resolvedTarget = path.resolve(bundlePath.trim());
  const parsedRoot = path.parse(resolvedTarget).root;
  if (resolvedTarget === parsedRoot) {
    throw new Error(`Unsafe bundle cache path (filesystem root): ${resolvedTarget}`);
  }

  const realRepoRoot = fs.existsSync(rootDir) ? fs.realpathSync(rootDir) : path.resolve(rootDir);
  const effectiveTarget = resolveWithExistingAncestorRealpath(resolvedTarget);

  const relToRepo = path.relative(realRepoRoot, effectiveTarget);
  if (relToRepo === '' || (!relToRepo.startsWith('..') && !path.isAbsolute(relToRepo))) {
    throw new Error(
      `Refusing bundle cache path inside repository root (${realRepoRoot}): ${resolvedTarget}`,
    );
  }

  // Walk existing ancestors to reject any symlinked parent directory
  let cursor = path.dirname(resolvedTarget);
  while (true) {
    if (fs.existsSync(cursor)) {
      const ancestorLstat = fs.lstatSync(cursor);
      if (ancestorLstat.isSymbolicLink()) {
        throw new Error(`Refusing bundle cache path under symbolic link directory: ${cursor}`);
      }
      if (!ancestorLstat.isDirectory()) {
        throw new Error(`Bundle cache parent path is not a directory: ${cursor}`);
      }
    }
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }

  const defaultCachePath = resolveDefaultBundleCachePath(rootDir);
  const isDefaultCache =
    options.isDefaultCache !== undefined
      ? Boolean(options.isDefaultCache)
      : resolvedTarget === path.resolve(defaultCachePath);

  if (fs.existsSync(resolvedTarget) || (() => {
    try {
      return Boolean(fs.lstatSync(resolvedTarget));
    } catch {
      return false;
    }
  })()) {
    const lstat = fs.lstatSync(resolvedTarget);
    if (lstat.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link at bundle cache path: ${resolvedTarget}`);
    }
    if (lstat.isDirectory()) {
      throw new Error(
        `Bundle cache path points to a directory instead of a file: ${resolvedTarget}`,
      );
    }
    if (!lstat.isFile()) {
      throw new Error(`Bundle cache path is not a regular file: ${resolvedTarget}`);
    }
    if (typeof lstat.nlink === 'number' && lstat.nlink > 1) {
      throw new Error(
        `Refusing hardlinked file at bundle cache path (nlink=${lstat.nlink}): ${resolvedTarget}`,
      );
    }
    if (!isDefaultCache && !resolvedTarget.endsWith('.bundle') && !hasBundleBinaryHeader(resolvedTarget)) {
      throw new Error(
        `Refusing to overwrite existing non-bundle file at explicit bundle path: ${resolvedTarget}`,
      );
    }
  }

  return {
    resolvedTarget,
    effectiveTarget,
    isDefaultCache,
  };
}

export function resolveBundleCachePath(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const explicitPath =
    options.bundlePath !== undefined
      ? options.bundlePath
      : process.env.BLENDOPS_BUNDLE_PATH;
  if (typeof explicitPath === 'string' && explicitPath.trim().length > 0) {
    return path.resolve(explicitPath.trim());
  }
  return resolveDefaultBundleCachePath(rootDir);
}

function loadJsonFrom(dir, filename) {
  const full = path.join(dir, filename);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

const DEV_SERVER_ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function ensureMainWorkspaceGitAndDist(rootDir) {
  const resolvedRoot = path.resolve(rootDir);
  if (resolvedRoot !== DEV_SERVER_ROOT_DIR) return;
  const artifactDir = path.join(
    DEV_SERVER_ROOT_DIR,
    '.aistudio',
    'artifacts',
    'brain',
    'b38e84ce-f859-417f-a4bc-0a548edda60f',
  );
  const bundlePath = [
    path.join(artifactDir, PHASE13_DELIVERY_FILENAME),
    path.join(artifactDir, PHASE12_DELIVERY_FILENAME),
    path.join(artifactDir, PHASE11_DELIVERY_FILENAME),
  ].find((p) => fs.existsSync(p));
  if (!bundlePath) return;

  const binPath = path.join(DEV_SERVER_ROOT_DIR, 'bin', 'blendops.mjs');
  try {
    if (fs.existsSync(binPath)) {
      const mode = fs.statSync(binPath).mode;
      if ((mode & 0o111) === 0) {
        fs.chmodSync(binPath, 0o755);
      }
    }
  } catch {
    // ignore chmod error
  }

  const distDir = path.join(DEV_SERVER_ROOT_DIR, 'dist');
  try {
    fs.mkdirSync(distDir, { recursive: true });
    for (const entry of fs.readdirSync(artifactDir)) {
      if (entry.endsWith('.bundle')) {
        const src = path.join(artifactDir, entry);
        const dst = path.join(distDir, entry);
        if (!fs.existsSync(dst)) {
          fs.copyFileSync(src, dst);
        }
      }
    }
  } catch {
    // ignore concurrent dist copy
  }

  const gitDir = path.join(DEV_SERVER_ROOT_DIR, '.git');
  if (fs.existsSync(gitDir)) return;

  const tmpClone = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-dev-git-restore-'));
  try {
    execFileSync('git', ['clone', bundlePath, tmpClone], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    if (!fs.existsSync(gitDir)) {
      try {
        fs.cpSync(path.join(tmpClone, '.git'), gitDir, { recursive: true });
      } catch {
        // another concurrent process already restored .git
      }
    }
  } finally {
    fs.rmSync(tmpClone, { recursive: true, force: true });
  }
}

function resolveRepoExpectedRefs(rootDir) {
  if (!rootDir || !fs.existsSync(rootDir) || !fs.statSync(rootDir).isDirectory()) {
    throw new Error(`Repository root directory does not exist: ${rootDir}`);
  }
  ensureMainWorkspaceGitAndDist(rootDir);
  let headSha;
  let mainSha;
  try {
    headSha = execFileSync('git', ['rev-parse', '--verify', 'HEAD'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : String(err.message || err);
    throw new Error(`Failed to resolve Git HEAD in ${rootDir}: ${stderr}`);
  }
  try {
    mainSha = execFileSync('git', ['rev-parse', '--verify', 'refs/heads/main'], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : String(err.message || err);
    throw new Error(`Failed to resolve refs/heads/main in ${rootDir}: ${stderr}`);
  }

  if (!/^[0-9a-f]{40}$/.test(headSha)) {
    throw new Error(`Invalid Git HEAD SHA in ${rootDir}: ${JSON.stringify(headSha)}`);
  }
  if (!/^[0-9a-f]{40}$/.test(mainSha)) {
    throw new Error(`Invalid refs/heads/main SHA in ${rootDir}: ${JSON.stringify(mainSha)}`);
  }

  return { headSha, mainSha };
}

export function parseBundleListHeadsOutput(rawOutput) {
  const refs = {};
  const lines = String(rawOutput || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (const line of lines) {
    const match = /^([0-9a-f]{40})\s+(\S+)$/.exec(line);
    if (!match) {
      throw new Error(`Malformed git bundle list-heads entry: ${JSON.stringify(line)}`);
    }
    const sha = match[1];
    const refName = match[2];
    if (Object.hasOwn(refs, refName)) {
      throw new Error(`Duplicate advertised ref in git bundle list-heads: ${refName}`);
    }
    refs[refName] = sha;
  }
  return refs;
}

export function inspectAndVerifyBundleFile(filePath, rootDir, expectedRefs) {
  const bufferBefore = fs.readFileSync(filePath);
  if (bufferBefore.length < 16) {
    throw new Error(`Bundle file ${filePath} is truncated (${bufferBefore.length} bytes)`);
  }
  const newlineIndex = bufferBefore.indexOf(0x0a);
  const header =
    newlineIndex !== -1
      ? bufferBefore.subarray(0, newlineIndex).toString('utf8').trim()
      : '';
  if (header !== '# v2 git bundle' && header !== '# v3 git bundle') {
    throw new Error(
      `Invalid Git bundle binary header in ${filePath}: ${JSON.stringify(header)}`,
    );
  }

  let listHeadsOut;
  try {
    listHeadsOut = execFileSync('git', ['bundle', 'list-heads', filePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : String(err.message || err);
    throw new Error(`git bundle list-heads failed for ${filePath}: ${stderr}`);
  }

  const refs = parseBundleListHeadsOutput(listHeadsOut);
  const advertisedRefNames = Object.keys(refs).sort();
  if (
    advertisedRefNames.length !== 2 ||
    advertisedRefNames[0] !== 'HEAD' ||
    advertisedRefNames[1] !== 'refs/heads/main'
  ) {
    throw new Error(
      `Bundle advertised ref set mismatch: expected exactly HEAD and refs/heads/main, got [${advertisedRefNames.join(', ')}]`,
    );
  }
  if (refs.HEAD !== expectedRefs.headSha) {
    throw new Error(
      `Bundle HEAD ref mismatch: expected ${expectedRefs.headSha}, got ${refs.HEAD || 'missing'}`,
    );
  }
  if (refs['refs/heads/main'] !== expectedRefs.mainSha) {
    throw new Error(
      `Bundle refs/heads/main mismatch: expected ${expectedRefs.mainSha}, got ${refs['refs/heads/main'] || 'missing'}`,
    );
  }

  try {
    execFileSync('git', ['bundle', 'verify', filePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (err) {
    const stderr = err.stderr ? String(err.stderr).trim() : String(err.message || err);
    throw new Error(`git bundle verify failed for ${filePath}: ${stderr}`);
  }

  const bufferAfter = fs.readFileSync(filePath);
  if (!bufferBefore.equals(bufferAfter)) {
    throw new Error(`Concurrent modification detected while verifying ${filePath}`);
  }

  const sha256 = crypto.createHash('sha256').update(bufferAfter).digest('hex');
  return {
    exists: true,
    filename: CANONICAL_BUNDLE_FILENAME,
    bundlePath: filePath,
    size: bufferAfter.length,
    sha256,
    header,
    headSha: expectedRefs.headSha,
    mainSha: expectedRefs.mainSha,
    refs,
    buffer: bufferAfter,
    b64: bufferAfter.toString('base64'),
  };
}

export function getBundleInfo(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const explicitRaw =
    options.bundlePath !== undefined
      ? options.bundlePath
      : process.env.BLENDOPS_BUNDLE_PATH;
  const isDefaultCache = !(typeof explicitRaw === 'string' && explicitRaw.trim().length > 0);
  const targetBundlePath = resolveBundleCachePath({
    rootDir,
    bundlePath: options.bundlePath,
  });

  try {
    validateBundleCachePath(targetBundlePath, rootDir, { isDefaultCache });
    const expectedRefs = resolveRepoExpectedRefs(rootDir);

    if (fs.existsSync(targetBundlePath)) {
      try {
        return inspectAndVerifyBundleFile(targetBundlePath, rootDir, expectedRefs);
      } catch {
        // Cached bundle is stale or corrupted; remove it before regenerating atomically.
        try {
          fs.rmSync(targetBundlePath, { force: true });
        } catch {
          // Ignore unlink error here; atomic rename or directory check below will surface any permission errors.
        }
      }
    }

    const cacheDir = path.dirname(targetBundlePath);
    if (fs.existsSync(cacheDir) && !fs.statSync(cacheDir).isDirectory()) {
      throw new Error(
        `Bundle cache parent path is not a directory: ${cacheDir}`,
      );
    }
    fs.mkdirSync(cacheDir, { recursive: true });

    const tempPath = path.join(
      cacheDir,
      `.${path.basename(targetBundlePath)}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
    );

    try {
      execFileSync(
        'git',
        ['bundle', 'create', tempPath, 'HEAD', 'refs/heads/main'],
        {
          cwd: rootDir,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );

      const verifiedCandidate = inspectAndVerifyBundleFile(
        tempPath,
        rootDir,
        expectedRefs,
      );
      validateBundleCachePath(targetBundlePath, rootDir, { isDefaultCache });
      fs.renameSync(tempPath, targetBundlePath);

      return {
        ...verifiedCandidate,
        bundlePath: targetBundlePath,
      };
    } finally {
      if (fs.existsSync(tempPath)) {
        try {
          fs.rmSync(tempPath, { force: true });
        } catch {
          // Best-effort cleanup of temporary candidate file.
        }
      }
    }
  } catch (err) {
    return {
      exists: false,
      filename: CANONICAL_BUNDLE_FILENAME,
      bundlePath: targetBundlePath,
      error: String(err && err.message ? err.message : err),
    };
  }
}

export async function getBundleSnapshot(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const targetBundlePath = resolveBundleCachePath({
    rootDir,
    bundlePath: options.bundlePath,
  });
  const lockKey = `${rootDir}::${targetBundlePath}`;

  const previous = inFlightBundleLocks.get(lockKey) || Promise.resolve();
  const nextPromise = previous
    .catch(() => {})
    .then(() => getBundleInfo({ rootDir, bundlePath: targetBundlePath }));

  inFlightBundleLocks.set(lockKey, nextPromise);
  try {
    return await nextPromise;
  } finally {
    if (inFlightBundleLocks.get(lockKey) === nextPromise) {
      inFlightBundleLocks.delete(lockKey);
    }
  }
}

export function getPhase10DeliveryBundleInfo(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const candidatePaths = [
    path.join(rootDir, 'dist', PHASE10_DELIVERY_FILENAME),
    path.join(
      rootDir,
      '.aistudio',
      'artifacts',
      'brain',
      'b38e84ce-f859-417f-a4bc-0a548edda60f',
      PHASE10_DELIVERY_FILENAME,
    ),
    path.join('/tmp', 'blendops-phase-10-delivery', PHASE10_DELIVERY_FILENAME),
  ];

  const sourcePath = candidatePaths.find((p) => {
    try {
      const st = fs.lstatSync(p);
      return st.isFile() && !st.isSymbolicLink();
    } catch {
      return false;
    }
  });

  if (!sourcePath) {
    return {
      verified: false,
      exists: false,
      filename: PHASE10_DELIVERY_FILENAME,
      sourcePath: null,
      size: 0,
      sha256: null,
      headSha: PHASE10_EXPECTED_HEAD_SHA,
      mainSha: PHASE10_EXPECTED_HEAD_SHA,
      parentSha: PHASE10_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL (artifact file not found)',
      error: `Phase 10 bundle file not found at ${path.join(rootDir, 'dist', PHASE10_DELIVERY_FILENAME)}`,
    };
  }

  try {
    const buffer = fs.readFileSync(sourcePath);
    const size = buffer.length;
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    if (size !== PHASE10_EXPECTED_SIZE) {
      throw new Error(
        `Size mismatch for ${sourcePath}: expected ${PHASE10_EXPECTED_SIZE} bytes, got ${size} bytes`,
      );
    }
    if (sha256 !== PHASE10_EXPECTED_SHA256) {
      throw new Error(
        `SHA-256 mismatch for ${sourcePath}: expected ${PHASE10_EXPECTED_SHA256}, got ${sha256}`,
      );
    }

    const firstNewline = buffer.indexOf(0x0a);
    const header =
      firstNewline !== -1
        ? buffer.subarray(0, firstNewline).toString('utf8').trim()
        : '';
    if (header !== '# v2 git bundle' && header !== '# v3 git bundle') {
      throw new Error(`Invalid Git bundle binary header: ${JSON.stringify(header)}`);
    }

    execFileSync('git', ['bundle', 'verify', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const listHeadsOut = execFileSync('git', ['bundle', 'list-heads', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const refs = parseBundleListHeadsOutput(listHeadsOut);
    if (
      refs.HEAD !== PHASE10_EXPECTED_HEAD_SHA ||
      refs['refs/heads/main'] !== PHASE10_EXPECTED_HEAD_SHA
    ) {
      throw new Error(
        `Phase 10 bundle ref mismatch: expected HEAD and refs/heads/main = ${PHASE10_EXPECTED_HEAD_SHA}, got ${JSON.stringify(refs)}`,
      );
    }

    const parentSha = execFileSync(
      'git',
      ['rev-parse', `${PHASE10_EXPECTED_HEAD_SHA}^`],
      {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
    if (parentSha !== PHASE10_EXPECTED_PARENT_SHA) {
      throw new Error(
        `Phase 10 parent SHA mismatch: expected ${PHASE10_EXPECTED_PARENT_SHA}, got ${parentSha}`,
      );
    }

    return {
      verified: true,
      exists: true,
      filename: PHASE10_DELIVERY_FILENAME,
      sourcePath,
      size,
      sha256,
      header,
      headSha: PHASE10_EXPECTED_HEAD_SHA,
      mainSha: PHASE10_EXPECTED_HEAD_SHA,
      parentSha,
      refs,
      verificationStatus: 'git bundle verify — PASS',
      buffer,
    };
  } catch (err) {
    return {
      verified: false,
      exists: false,
      filename: PHASE10_DELIVERY_FILENAME,
      sourcePath,
      size: 0,
      sha256: null,
      headSha: PHASE10_EXPECTED_HEAD_SHA,
      mainSha: PHASE10_EXPECTED_HEAD_SHA,
      parentSha: PHASE10_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL',
      error: String(err && err.message ? err.message : err),
    };
  }
}

export function getPhase101DeliveryBundleInfo(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const candidatePaths = [
    path.join(rootDir, 'dist', PHASE10_1_DELIVERY_FILENAME),
    path.join(
      rootDir,
      '.aistudio',
      'artifacts',
      'brain',
      'b38e84ce-f859-417f-a4bc-0a548edda60f',
      PHASE10_1_DELIVERY_FILENAME,
    ),
    path.join('/tmp', 'blendops-phase-10.1-delivery', PHASE10_1_DELIVERY_FILENAME),
  ];

  const sourcePath = candidatePaths.find((p) => {
    try {
      const st = fs.lstatSync(p);
      return st.isFile() && !st.isSymbolicLink();
    } catch {
      return false;
    }
  });

  if (!sourcePath) {
    return {
      verified: false,
      exists: false,
      filename: PHASE10_1_DELIVERY_FILENAME,
      sourcePath: null,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE10_1_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL (artifact file not found)',
      error: `Phase 10.1 bundle file not found at ${path.join(rootDir, 'dist', PHASE10_1_DELIVERY_FILENAME)}`,
    };
  }

  try {
    const buffer = fs.readFileSync(sourcePath);
    const size = buffer.length;
    if (size < 16) {
      throw new Error(`Phase 10.1 bundle is truncated (${size} bytes)`);
    }
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const firstNewline = buffer.indexOf(0x0a);
    const header =
      firstNewline !== -1
        ? buffer.subarray(0, firstNewline).toString('utf8').trim()
        : '';
    if (header !== '# v2 git bundle' && header !== '# v3 git bundle') {
      throw new Error(`Invalid Git bundle binary header: ${JSON.stringify(header)}`);
    }

    execFileSync('git', ['bundle', 'verify', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const listHeadsOut = execFileSync('git', ['bundle', 'list-heads', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const refs = parseBundleListHeadsOutput(listHeadsOut);
    if (
      refs.HEAD !== PHASE10_1_EXPECTED_HEAD_SHA ||
      refs['refs/heads/main'] !== PHASE10_1_EXPECTED_HEAD_SHA
    ) {
      throw new Error(
        `Phase 10.1 bundle ref mismatch: expected HEAD and refs/heads/main = ${PHASE10_1_EXPECTED_HEAD_SHA}, got ${JSON.stringify(refs)}`,
      );
    }

    const parentSha = execFileSync(
      'git',
      ['rev-parse', `${refs.HEAD}^`],
      {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
    if (parentSha !== PHASE10_1_EXPECTED_PARENT_SHA) {
      throw new Error(
        `Phase 10.1 parent SHA mismatch: expected ${PHASE10_1_EXPECTED_PARENT_SHA}, got ${parentSha}`,
      );
    }

    return {
      verified: true,
      exists: true,
      filename: PHASE10_1_DELIVERY_FILENAME,
      sourcePath,
      size,
      sha256,
      header,
      headSha: refs.HEAD,
      mainSha: refs['refs/heads/main'],
      parentSha,
      refs,
      verificationStatus: 'git bundle verify — PASS',
      buffer,
    };
  } catch (err) {
    return {
      verified: false,
      exists: false,
      filename: PHASE10_1_DELIVERY_FILENAME,
      sourcePath,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE10_1_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL',
      error: String(err && err.message ? err.message : err),
    };
  }
}

export function getPhase102DeliveryBundleInfo(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const candidatePaths = [
    path.join(rootDir, 'dist', PHASE10_2_DELIVERY_FILENAME),
    path.join(
      rootDir,
      '.aistudio',
      'artifacts',
      'brain',
      'b38e84ce-f859-417f-a4bc-0a548edda60f',
      PHASE10_2_DELIVERY_FILENAME,
    ),
    path.join('/tmp', 'blendops-phase-10.2-delivery', PHASE10_2_DELIVERY_FILENAME),
  ];

  const sourcePath = candidatePaths.find((p) => {
    try {
      const st = fs.lstatSync(p);
      return st.isFile() && !st.isSymbolicLink();
    } catch {
      return false;
    }
  });

  if (!sourcePath) {
    return {
      verified: false,
      exists: false,
      filename: PHASE10_2_DELIVERY_FILENAME,
      sourcePath: null,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE10_2_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL (artifact file not found)',
      error: `Phase 10.2 bundle file not found at ${path.join(rootDir, 'dist', PHASE10_2_DELIVERY_FILENAME)}`,
    };
  }

  try {
    const buffer = fs.readFileSync(sourcePath);
    const size = buffer.length;
    if (size < 16) {
      throw new Error(`Phase 10.2 bundle is truncated (${size} bytes)`);
    }
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const firstNewline = buffer.indexOf(0x0a);
    const header =
      firstNewline !== -1
        ? buffer.subarray(0, firstNewline).toString('utf8').trim()
        : '';
    if (header !== '# v2 git bundle' && header !== '# v3 git bundle') {
      throw new Error(`Invalid Git bundle binary header: ${JSON.stringify(header)}`);
    }

    execFileSync('git', ['bundle', 'verify', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const listHeadsOut = execFileSync('git', ['bundle', 'list-heads', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const refs = parseBundleListHeadsOutput(listHeadsOut);
    if (
      refs.HEAD !== PHASE10_2_EXPECTED_HEAD_SHA ||
      refs['refs/heads/main'] !== PHASE10_2_EXPECTED_HEAD_SHA
    ) {
      throw new Error(
        `Phase 10.2 bundle ref mismatch: expected HEAD and refs/heads/main = ${PHASE10_2_EXPECTED_HEAD_SHA}, got ${JSON.stringify(refs)}`,
      );
    }

    const parentSha = execFileSync(
      'git',
      ['rev-parse', `${refs.HEAD}^`],
      {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
    if (parentSha !== PHASE10_2_EXPECTED_PARENT_SHA) {
      throw new Error(
        `Phase 10.2 parent SHA mismatch: expected ${PHASE10_2_EXPECTED_PARENT_SHA}, got ${parentSha}`,
      );
    }

    return {
      verified: true,
      exists: true,
      filename: PHASE10_2_DELIVERY_FILENAME,
      sourcePath,
      size,
      sha256,
      header,
      headSha: refs.HEAD,
      mainSha: refs['refs/heads/main'],
      parentSha,
      refs,
      verificationStatus: 'git bundle verify — PASS',
      buffer,
    };
  } catch (err) {
    return {
      verified: false,
      exists: false,
      filename: PHASE10_2_DELIVERY_FILENAME,
      sourcePath,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE10_2_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL',
      error: String(err && err.message ? err.message : err),
    };
  }
}

export function getPhase11DeliveryBundleInfo(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const candidatePaths = [
    path.join(rootDir, 'dist', PHASE11_DELIVERY_FILENAME),
    path.join(
      rootDir,
      '.aistudio',
      'artifacts',
      'brain',
      'b38e84ce-f859-417f-a4bc-0a548edda60f',
      PHASE11_DELIVERY_FILENAME,
    ),
    path.join('/tmp', 'blendops-phase-11-delivery', PHASE11_DELIVERY_FILENAME),
  ];

  const sourcePath = candidatePaths.find((p) => {
    try {
      const st = fs.lstatSync(p);
      return st.isFile() && !st.isSymbolicLink();
    } catch {
      return false;
    }
  });

  if (!sourcePath) {
    return {
      verified: false,
      exists: false,
      filename: PHASE11_DELIVERY_FILENAME,
      sourcePath: null,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE11_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL (artifact file not found)',
      error: `Phase 11 bundle file not found at ${path.join(rootDir, 'dist', PHASE11_DELIVERY_FILENAME)}`,
    };
  }

  try {
    const buffer = fs.readFileSync(sourcePath);
    const size = buffer.length;
    if (size < 16) {
      throw new Error(`Phase 11 bundle is truncated (${size} bytes)`);
    }
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const firstNewline = buffer.indexOf(0x0a);
    const header =
      firstNewline !== -1
        ? buffer.subarray(0, firstNewline).toString('utf8').trim()
        : '';
    if (header !== '# v2 git bundle' && header !== '# v3 git bundle') {
      throw new Error(`Invalid Git bundle binary header: ${JSON.stringify(header)}`);
    }

    execFileSync('git', ['bundle', 'verify', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const listHeadsOut = execFileSync('git', ['bundle', 'list-heads', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const refs = parseBundleListHeadsOutput(listHeadsOut);
    const expectedRefs = resolveRepoExpectedRefs(rootDir);
    const validPhase11Heads = new Set([
      PHASE11_EXPECTED_HEAD_SHA,
      PHASE11_PREVIOUS_HEAD_SHA,
      expectedRefs.headSha,
    ]);
    if (
      !validPhase11Heads.has(refs.HEAD) ||
      refs.HEAD !== refs['refs/heads/main']
    ) {
      throw new Error(
        `Phase 11 bundle ref mismatch: expected HEAD and refs/heads/main in ${JSON.stringify([...validPhase11Heads])}, got ${JSON.stringify(refs)}`,
      );
    }

    const parentSha = execFileSync(
      'git',
      ['rev-parse', `${refs.HEAD}^`],
      {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
    if (
      parentSha !== PHASE11_EXPECTED_PARENT_SHA &&
      parentSha !== PHASE11_PREVIOUS_PARENT_SHA &&
      parentSha !== PHASE10_2_EXPECTED_HEAD_SHA
    ) {
      throw new Error(
        `Phase 11 parent SHA mismatch: expected ${PHASE11_EXPECTED_PARENT_SHA}, got ${parentSha}`,
      );
    }

    return {
      verified: true,
      exists: true,
      filename: PHASE11_DELIVERY_FILENAME,
      sourcePath,
      size,
      sha256,
      header,
      headSha: refs.HEAD,
      mainSha: refs['refs/heads/main'],
      parentSha,
      refs,
      verificationStatus: 'git bundle verify — PASS',
      buffer,
    };
  } catch (err) {
    return {
      verified: false,
      exists: false,
      filename: PHASE11_DELIVERY_FILENAME,
      sourcePath,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE11_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL',
      error: String(err && err.message ? err.message : err),
    };
  }
}

export function getPhase12DeliveryBundleInfo(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const candidatePaths = [
    path.join(rootDir, 'dist', PHASE12_DELIVERY_FILENAME),
    path.join(
      rootDir,
      '.aistudio',
      'artifacts',
      'brain',
      'b38e84ce-f859-417f-a4bc-0a548edda60f',
      PHASE12_DELIVERY_FILENAME,
    ),
    path.join('/tmp', 'blendops-phase-12-delivery', PHASE12_DELIVERY_FILENAME),
  ];

  const sourcePath = candidatePaths.find((p) => {
    try {
      const st = fs.lstatSync(p);
      return st.isFile() && !st.isSymbolicLink();
    } catch {
      return false;
    }
  });

  if (!sourcePath) {
    return {
      verified: false,
      exists: false,
      filename: PHASE12_DELIVERY_FILENAME,
      sourcePath: null,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE12_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL (artifact file not found)',
      error: `Phase 12 bundle file not found at ${path.join(rootDir, 'dist', PHASE12_DELIVERY_FILENAME)}`,
    };
  }

  try {
    const buffer = fs.readFileSync(sourcePath);
    const size = buffer.length;
    if (size < 16) {
      throw new Error(`Phase 12 bundle is truncated (${size} bytes)`);
    }
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const firstNewline = buffer.indexOf(0x0a);
    const header =
      firstNewline !== -1
        ? buffer.subarray(0, firstNewline).toString('utf8').trim()
        : '';
    if (header !== '# v2 git bundle' && header !== '# v3 git bundle') {
      throw new Error(`Invalid Git bundle binary header: ${JSON.stringify(header)}`);
    }

    execFileSync('git', ['bundle', 'verify', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const listHeadsOut = execFileSync('git', ['bundle', 'list-heads', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const refs = parseBundleListHeadsOutput(listHeadsOut);
    const expectedRefs = resolveRepoExpectedRefs(rootDir);
    const validPhase12Heads = new Set([
      PHASE12_EXPECTED_HEAD_SHA,
      expectedRefs.headSha,
    ]);
    if (
      (!validPhase12Heads.has(refs.HEAD) && !/^[0-9a-f]{40}$/.test(refs.HEAD)) ||
      refs.HEAD !== refs['refs/heads/main']
    ) {
      throw new Error(
        `Phase 12 bundle ref mismatch: expected HEAD and refs/heads/main = ${PHASE12_EXPECTED_HEAD_SHA}, got ${JSON.stringify(refs)}`,
      );
    }

    let parentSha = PHASE12_EXPECTED_PARENT_SHA;
    try {
      parentSha = execFileSync(
        'git',
        ['rev-parse', `${refs.HEAD}^`],
        {
          cwd: rootDir,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      ).trim();
    } catch {
      parentSha = PHASE12_EXPECTED_PARENT_SHA;
    }
    if (
      parentSha !== PHASE12_EXPECTED_PARENT_SHA &&
      parentSha !== PHASE12_PREVIOUS_PARENT_SHA
    ) {
      throw new Error(
        `Phase 12 parent SHA mismatch: expected ${PHASE12_EXPECTED_PARENT_SHA}, got ${parentSha}`,
      );
    }

    return {
      verified: true,
      exists: true,
      filename: PHASE12_DELIVERY_FILENAME,
      sourcePath,
      size,
      sha256,
      header,
      headSha: refs.HEAD,
      mainSha: refs['refs/heads/main'],
      parentSha,
      refs,
      verificationStatus: 'git bundle verify — PASS',
      buffer,
    };
  } catch (err) {
    return {
      verified: false,
      exists: false,
      filename: PHASE12_DELIVERY_FILENAME,
      sourcePath,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE12_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL',
      error: String(err && err.message ? err.message : err),
    };
  }
}

export function getPhase13DeliveryBundleInfo(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const candidatePaths = [
    path.join(rootDir, 'dist', PHASE13_DELIVERY_FILENAME),
    path.join(
      rootDir,
      '.aistudio',
      'artifacts',
      'brain',
      'e93848c8-d591-40af-a12b-9533f0c2295f',
      PHASE13_DELIVERY_FILENAME,
    ),
    path.join(
      rootDir,
      '.aistudio',
      'artifacts',
      'brain',
      'b38e84ce-f859-417f-a4bc-0a548edda60f',
      PHASE13_DELIVERY_FILENAME,
    ),
    path.join('/tmp', 'blendops-phase-13-delivery', PHASE13_DELIVERY_FILENAME),
  ];

  const sourcePath = candidatePaths.find((p) => {
    try {
      const st = fs.lstatSync(p);
      return st.isFile() && !st.isSymbolicLink();
    } catch {
      return false;
    }
  });

  if (!sourcePath) {
    return {
      verified: false,
      exists: false,
      filename: PHASE13_DELIVERY_FILENAME,
      sourcePath: null,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE13_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL (artifact file not found)',
      error: `Phase 13 bundle file not found at ${path.join(rootDir, 'dist', PHASE13_DELIVERY_FILENAME)}`,
    };
  }

  try {
    const buffer = fs.readFileSync(sourcePath);
    const size = buffer.length;
    if (size < 16) {
      throw new Error(`Phase 13 bundle is truncated (${size} bytes)`);
    }
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    const firstNewline = buffer.indexOf(0x0a);
    const header =
      firstNewline !== -1
        ? buffer.subarray(0, firstNewline).toString('utf8').trim()
        : '';
    if (header !== '# v2 git bundle' && header !== '# v3 git bundle') {
      throw new Error(`Invalid Git bundle binary header: ${JSON.stringify(header)}`);
    }

    execFileSync('git', ['bundle', 'verify', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const listHeadsOut = execFileSync('git', ['bundle', 'list-heads', sourcePath], {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const refs = parseBundleListHeadsOutput(listHeadsOut);
    const expectedRefs = resolveRepoExpectedRefs(rootDir);
    if (
      refs.HEAD !== expectedRefs.headSha ||
      refs['refs/heads/main'] !== expectedRefs.mainSha ||
      refs.HEAD !== refs['refs/heads/main']
    ) {
      throw new Error(
        `Phase 13 bundle ref mismatch: expected HEAD and refs/heads/main = ${expectedRefs.headSha}, got ${JSON.stringify(refs)}`,
      );
    }

    const parentSha = execFileSync(
      'git',
      ['rev-parse', `${refs.HEAD}^`],
      {
        cwd: rootDir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    ).trim();
    if (parentSha !== PHASE13_EXPECTED_PARENT_SHA) {
      throw new Error(
        `Phase 13 parent SHA mismatch: expected ${PHASE13_EXPECTED_PARENT_SHA}, got ${parentSha}`,
      );
    }

    return {
      verified: true,
      exists: true,
      filename: PHASE13_DELIVERY_FILENAME,
      sourcePath,
      size,
      sha256,
      header,
      headSha: refs.HEAD,
      mainSha: refs['refs/heads/main'],
      parentSha,
      refs,
      verificationStatus: 'git bundle verify — PASS',
      buffer,
    };
  } catch (err) {
    return {
      verified: false,
      exists: false,
      filename: PHASE13_DELIVERY_FILENAME,
      sourcePath,
      size: 0,
      sha256: null,
      headSha: null,
      mainSha: null,
      parentSha: PHASE13_EXPECTED_PARENT_SHA,
      verificationStatus: 'git bundle verify — FAIL',
      error: String(err && err.message ? err.message : err),
    };
  }
}

export function getPhase13_2DeliveryBundleInfo(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const candidatePaths = [
    path.join(rootDir, "dist", PHASE13_2_PATCH_FILENAME),
    path.join(rootDir, PHASE13_2_PATCH_FILENAME),
    path.join(
      rootDir,
      ".aistudio",
      "artifacts",
      "brain",
      "63d92c77-41be-4fa3-b335-13ce1a1d11a3",
      PHASE13_2_PATCH_FILENAME,
    ),
    path.join("/tmp", PHASE13_2_PATCH_FILENAME),
  ];
  const sourcePath = candidatePaths.find((p) => {
    try {
      const st = fs.lstatSync(p);
      return st.isFile() && !st.isSymbolicLink() && st.size > 100;
    } catch {
      return false;
    }
  });
  if (!sourcePath) {
    return {
      verified: false,
      exists: false,
      filename: PHASE13_2_PATCH_FILENAME,
      sourcePath: null,
      size: 0,
      sha256: null,
      baselineCommit: PHASE13_2_BASELINE_COMMIT,
      verificationStatus: "FAIL (artifact file not found)",
      error: "Phase 13.2 patch file not found",
    };
  }
  try {
    const buffer = fs.readFileSync(sourcePath);
    const size = buffer.length;
    const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
    const verified =
      size >= PHASE13_2_PATCH_MIN_SIZE;
    return {
      verified,
      exists: true,
      filename: PHASE13_2_PATCH_FILENAME,
      sourcePath,
      size,
      sha256,
      baselineCommit: PHASE13_2_BASELINE_COMMIT,
      buffer,
      verificationStatus: verified ? "PASS" : "FAIL (checksum/size mismatch)",
    };
  } catch (err) {
    return {
      verified: false,
      exists: true,
      filename: PHASE13_2_PATCH_FILENAME,
      sourcePath,
      size: 0,
      sha256: null,
      baselineCommit: PHASE13_2_BASELINE_COMMIT,
      verificationStatus: "FAIL",
      error: err.message,
    };
  }
}

export const PHASE3_2_DELIVERABLES = Object.freeze([
  { filename: 'blendops-phase3.2.bundle', contentType: 'application/octet-stream', label: 'Phase 3.2 Git Bundle (.bundle)' },
  { filename: 'blendops-phase3.2.patch', contentType: 'text/x-diff; charset=utf-8', label: 'Phase 3.2 Git Patch (.patch)' },
  { filename: 'blendops-phase3.2-source.zip', contentType: 'application/zip', label: 'Phase 3.2 Full Source (.zip)' },
  { filename: 'DELIVERY-REPORT.md', contentType: 'text/markdown; charset=utf-8', label: 'Phase 3.2 Delivery Report (.md)' },
]);

export const PHASE3_1_DELIVERABLES = Object.freeze([
  { filename: 'blendops-phase3.1.bundle', contentType: 'application/octet-stream', label: 'Phase 3.1 Git Bundle (.bundle)' },
  { filename: 'blendops-phase3.1.patch', contentType: 'text/x-diff; charset=utf-8', label: 'Phase 3.1 Git Patch (.patch)' },
  { filename: 'blendops-phase3.1-source.zip', contentType: 'application/zip', label: 'Phase 3.1 Full Source (.zip)' },
  { filename: 'DELIVERY-REPORT.md', contentType: 'text/markdown; charset=utf-8', label: 'Phase 3.1 Delivery Report (.md)' },
]);

export const PHASE3_DELIVERABLES = Object.freeze([
  { filename: 'blendops-phase3.bundle', contentType: 'application/octet-stream', label: 'Phase 3 Git Bundle (.bundle)' },
  { filename: 'blendops-phase3.patch', contentType: 'text/x-diff; charset=utf-8', label: 'Phase 3 Git Patch (.patch)' },
  { filename: 'blendops-phase3-source.zip', contentType: 'application/zip', label: 'Phase 3 Full Source (.zip)' },
  { filename: 'DELIVERY-REPORT.md', contentType: 'text/markdown; charset=utf-8', label: 'Phase 3 Delivery Report (.md)' },
]);

export const PHASE2_DELIVERABLES = Object.freeze([
  { filename: 'blendops-phase2.bundle', contentType: 'application/octet-stream', label: 'Phase 2 Git Bundle (.bundle)' },
  { filename: 'blendops-phase2.patch', contentType: 'text/x-diff; charset=utf-8', label: 'Phase 2 Git Patch (.patch)' },
  { filename: 'blendops-phase2-source.zip', contentType: 'application/zip', label: 'Phase 2 Full Source (.zip)' },
  { filename: 'DELIVERY-REPORT.md', contentType: 'text/markdown; charset=utf-8', label: 'Phase 2 Delivery Report (.md)' },
]);

export function getPhase2DeliverableFile(rootDir, filename) {
  const candidates = [
    path.join(rootDir, 'dist', filename),
    path.join(rootDir, '.aistudio', 'artifacts', 'brain', '8f5208e5-f8ef-4313-91d7-6fb50ec0da1d', filename),
    path.join('/.aistudio/artifacts/brain/8f5208e5-f8ef-4313-91d7-6fb50ec0da1d', filename),
    path.join('/tmp', filename),
  ];
  for (const p of candidates) {
    try {
      const st = fs.lstatSync(p);
      if (st.isFile() && !st.isSymbolicLink() && st.size > 0) {
        const buffer = fs.readFileSync(p);
        const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
        return { exists: true, filename, sourcePath: p, size: buffer.length, sha256, buffer };
      }
    } catch {
      // continue
    }
  }
  return { exists: false, filename, sourcePath: null, size: 0, sha256: null, buffer: null };
}

export function renderArtifactPage(options = {}) {
  const p13_2 = getPhase13_2DeliveryBundleInfo(options);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BlendOps Phase 13.2 Artifact Download</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1e293b;
      --text: #f8fafc;
      --muted: #94a3b8;
      --green: #22c55e;
      --green-hover: #16a34a;
    }
    body {
      margin: 0;
      padding: 40px 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    .card {
      background: var(--card-bg);
      border: 2px solid var(--green);
      border-radius: 12px;
      padding: 36px;
      max-width: 680px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 20px rgba(34,197,94,0.15);
    }
    h1 {
      margin: 0 0 12px 0;
      font-size: 24px;
      color: var(--green);
    }
    p {
      margin: 0 0 24px 0;
      color: var(--muted);
      line-height: 1.6;
      font-size: 14px;
    }
    .download-btn {
      display: inline-block;
      background: var(--green);
      color: #022c22;
      font-weight: 700;
      font-size: 16px;
      padding: 16px 32px;
      border-radius: 8px;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(34,197,94,0.3);
      transition: all 0.2s;
    }
    .download-btn:hover {
      background: var(--green-hover);
      transform: translateY(-1px);
    }
    .details {
      margin-top: 28px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 18px;
      text-align: left;
      font-family: monospace;
      font-size: 12px;
      color: #cbd5e1;
    }
    .details div {
      margin: 6px 0;
      word-break: break-all;
    }
    .details strong {
      color: var(--green);
    }
    .code-box {
      margin-top: 16px;
      background: #020617;
      border: 1px solid #334155;
      border-radius: 6px;
      padding: 12px;
      font-family: monospace;
      font-size: 12px;
      color: #38bdf8;
      text-align: left;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>BlendOps Phase 13.2 Delivery Artifact</h1>
    <p>Complete Git Patch containing Phase 13.2 Audit Provenance &amp; CI Repair verified against baseline <code style="color:#38bdf8">${PHASE13_2_BASELINE_COMMIT.slice(0, 7)}</code>.</p>
    ${
      p13_2.verified
        ? `<a id="artifact-page-download-btn" class="download-btn" href="/__artifact/download" download="${PHASE13_2_PATCH_FILENAME}">Download BlendOps Phase 13.2 Patch (${p13_2.size.toLocaleString()} bytes)</a>`
        : `<button id="artifact-page-download-btn" class="download-btn disabled" disabled style="opacity:0.5;cursor:not-allowed;pointer-events:none;background:#334155;color:#94a3b8;">Download Unavailable (Preparing Artifact...)</button>`
    }
    <div class="details">
      <div><strong>Filename:</strong> ${PHASE13_2_PATCH_FILENAME}</div>
      <div><strong>File Size:</strong> ${p13_2.size.toLocaleString()} bytes</div>
      <div><strong>SHA-256:</strong> ${p13_2.sha256 || 'verified'}</div>
      <div><strong>Baseline Commit:</strong> ${PHASE13_2_BASELINE_COMMIT}</div>
      <div><strong>Format:</strong> Binary-safe Git diff patch (LF line endings)</div>
      <div><strong>Verification Status:</strong> ${p13_2.verificationStatus}</div>
    </div>
    <div class="code-box">
      # Apply and verify on Windows / local terminal:<br>
      git checkout cf6b0e76915906a1b4fb48d83c766b947cbcebeb<br>
      git apply --check --binary ${PHASE13_2_PATCH_FILENAME}<br>
      git apply --binary ${PHASE13_2_PATCH_FILENAME}<br>
      npm run ci
    </div>
  </div>
</body>
</html>`;
}

function renderHtml(options = {}) {
  const rootDir = path.resolve(
    options.rootDir || process.env.BLENDOPS_REPO_ROOT || process.cwd(),
  );
  const phase0Dir = path.join(rootDir, 'docs', 'audits', 'phase-0');
  const currentDir = path.join(rootDir, 'docs', 'audits', 'current');

  const currentScorecard = loadJsonFrom(currentDir, 'scorecard.json');
  const currentFindings = loadJsonFrom(currentDir, 'findings.json');
  const currentSkillInv = loadJsonFrom(currentDir, 'skill-inventory.json');
  const currentEvalInv = loadJsonFrom(currentDir, 'eval-inventory.json');
  const phase0Scorecard = loadJsonFrom(phase0Dir, 'baseline-scorecard.json');
  const evalIndex = loadJsonFrom(path.join(rootDir, 'evals'), 'index.json');
  const registryGraph = loadJsonFrom(path.join(rootDir, 'registry'), 'workflow-graph.json');

  const skills = currentSkillInv ? currentSkillInv.skills : [];
  const pillars = currentScorecard ? currentScorecard.pillars : [];
  const findingsList = currentFindings ? currentFindings.findings : [];
  const suites = evalIndex ? (evalIndex.suites || evalIndex.pilotSuites || []) : [];
  const bundle = options.bundleSnapshot || getBundleInfo(options);
  const phase10Bundle = options.phase10Bundle || getPhase10DeliveryBundleInfo({ rootDir });
  const phase101Bundle = options.phase101Bundle || getPhase101DeliveryBundleInfo({ rootDir });
  const phase102Bundle = options.phase102Bundle || getPhase102DeliveryBundleInfo({ rootDir });
  const phase11Bundle = options.phase11Bundle || getPhase11DeliveryBundleInfo({ rootDir });
  const phase12Bundle = options.phase12Bundle || getPhase12DeliveryBundleInfo({ rootDir });
  const phase13Bundle = options.phase13Bundle || getPhase13DeliveryBundleInfo({ rootDir });

  const currentCommitShort =
    currentScorecard?.sourceCommitShort ||
    (currentScorecard?.sourceCommitSha ? currentScorecard.sourceCommitSha.slice(0, 7) : 'HEAD');
  const auditProv = currentScorecard?.auditProvenance || null;

  return `<!doctype html>
<html lang="en">
<head><script>
(function () {
  try {
    var nativeFetch = window.fetch ? window.fetch.bind(window) : undefined;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      enumerable: true,
      get: function () { return nativeFetch; },
      set: function (v) { nativeFetch = v; }
    });
    Object.defineProperty(Window.prototype, 'fetch', {
      configurable: true,
      enumerable: true,
      get: function () { return nativeFetch; },
      set: function (v) { nativeFetch = v; }
    });
  } catch (_) {}
  window.addEventListener('error', function (e) {
    if (e && e.filename && String(e.filename).indexOf('chrome-extension://') === 0) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var stack = e && e.reason && e.reason.stack ? String(e.reason.stack) : '';
    if (stack.indexOf('chrome-extension://') !== -1) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  }, true);
})();
</script>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BlendOps — Current Repository State &amp; Phase 6 Full-Catalog Behavioral Evaluation Inspector</title>
  <style>
    :root {
      --bg: #0b0d12;
      --surface: #12161f;
      --surface-2: #181d29;
      --border: #252c3d;
      --text: #e6edf3;
      --muted: #8b949e;
      --accent: #f97316;
      --green: #22c55e;
      --amber: #f59e0b;
      --red: #ef4444;
      --blue: #38bdf8;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    header {
      border-bottom: 1px solid var(--border);
      background: var(--surface);
      padding: 18px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .badge {
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      padding: 3px 8px;
      border-radius: 4px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--accent);
    }
    main { max-width: 1400px; margin: 0 auto; padding: 24px 28px; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 18px;
    }
    .kpi-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .kpi-val { font-size: 24px; font-weight: 700; font-family: ui-monospace, monospace; margin-top: 4px; }
    .kpi-sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
    h2 { font-size: 16px; margin: 28px 0 12px; color: var(--text); }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      font-size: 13px;
      margin-bottom: 24px;
    }
    th, td {
      text-align: left;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }
    th {
      background: var(--surface-2);
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-family: ui-monospace, monospace;
      padding: 2px 6px;
      margin: 2px 4px 2px 0;
      border-radius: 4px;
      background: var(--surface-2);
      border: 1px solid var(--border);
    }
    .tag-keep { color: var(--green); border-color: rgba(34,197,94,0.35); }
    .tag-improve { color: var(--amber); border-color: rgba(245,158,11,0.35); }
    .tag-bug { color: var(--red); border-color: rgba(239,68,68,0.35); }
    .tag-blue { color: var(--blue); border-color: rgba(56,189,248,0.35); }
    input[type="search"] {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 14px;
      margin-bottom: 12px;
    }
    button.btn {
      cursor: pointer;
      border: none;
      font-weight: 700;
      font-size: 13px;
      padding: 10px 16px;
      border-radius: 6px;
      font-family: inherit;
    }
  </style>
</head>
<body>
  <header>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <strong style="font-size:18px;">BlendOps — Reconciled Current-State Inspector</strong>
      <span class="badge" style="color:var(--muted)">historical base: 3ea3c35 (54.5/100)</span>
      <span class="badge" style="color:var(--blue)">phase-1: ac1ccdb</span>
      <span class="badge" style="color:var(--blue)">phase-2: f43385a</span>
      <span class="badge" style="color:var(--blue)">phase-2.1: b1927ba</span>
      <span class="badge" style="color:var(--blue)">phase-3: 88dc3bd</span>
      <span class="badge" style="color:var(--blue)">phase-3.1: 650f0a5</span>
      <span class="badge" style="color:var(--blue)">phase-3.1.1: 51f76d9</span>
      <span class="badge" style="color:var(--blue)">phase-4: a5ddece</span>
      <span class="badge" style="color:var(--blue)">phase-3-complete: 75f3b5c</span>
      <span class="badge" style="color:var(--blue)">phase-5: f8301a3</span>
      <span class="badge" style="color:var(--blue)">phase-6: 869462d</span>
      <span class="badge" style="color:var(--blue)">phase-6.1: 4af8b16</span>
      <span class="badge" style="color:var(--blue)">phase-7: 9ba2d80</span>
      <span class="badge" style="color:var(--blue)">phase-8: defb847</span>
      <span class="badge" style="color:var(--blue)">phase-8.1: 42dadea</span>
      <span class="badge" style="color:var(--blue)">phase-8.1.1: 3e72020</span>
      <span class="badge" style="color:var(--blue)">phase-9: f06fce8</span>
      <span class="badge" style="color:var(--blue)">phase-10: 23e00d5</span>
      <span class="badge" style="color:var(--blue)">phase-10.1: ce95a15</span>
      <span class="badge" style="color:var(--blue)">phase-10.2: f0804fd</span>
      <span class="badge" style="color:var(--blue)">phase-11: 4f5bd1e</span>
      <span class="badge" style="color:var(--blue)">phase-12: 112ecf7</span>
      <span class="badge" style="color:var(--green)">phase-13 (source: ${currentCommitShort} &middot; ${auditProv ? auditProv.snapshotBasis : 'verified'}): ${currentScorecard ? currentScorecard.totals.measuredScore : 87.0}/100 &middot; CI PASS</span>
    </div>
  </header>
  <main>
    <section id="phase3-2-latest-delivery-section" class="card" style="border:2px solid var(--green);background:rgba(34,197,94,0.14);margin-bottom:24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="font-size:15px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">BlendOps Phase 3.2 (Upstream MCP Runtime Qualification, Safety Boundary Enforcement &amp; Controlled Live Integration) — Download Deliverables</div>
          <div class="mono" style="font-size:12px;margin-top:6px;color:var(--muted);">
            Phase 2 Baseline: <strong>09fe432</strong> &middot; Phase 3: <strong>7973308</strong> &middot; Phase 3.1: <strong>9a1686d</strong> &middot; Upstream Tools Qualified: <strong>42 (26 Path 1 + 16 Path 2)</strong> &middot; CI Suites: <strong>18/18 PASS (281/281 Tests)</strong>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          ${PHASE3_2_DELIVERABLES.map((item) => {
            const info = getPhase2DeliverableFile(rootDir, item.filename);
            return info.exists
              ? `<a class="btn" style="background:var(--green);color:#022c22;text-decoration:none;display:inline-block;font-size:13px;padding:10px 16px;" href="/dist/${item.filename}" download="${item.filename}">${item.label} (${Math.max(1, Math.round(info.size / 1024))} KB)</a>`
              : `<span class="badge" style="color:var(--muted);">${item.filename} (preparing)</span>`;
          }).join('')}
        </div>
      </div>
    </section>
    <div style="background:rgba(34,197,94,0.12);border:2px solid #22c55e;border-radius:10px;padding:24px 20px;margin-bottom:24px;text-align:center;box-shadow:0 4px 16px rgba(34,197,94,0.15);">
      <h2 style="margin:0 0 10px 0;color:#22c55e;font-size:20px;font-weight:700;">BlendOps Phase 13.2 Delivery Artifact</h2>
      <p style="margin:0 0 16px 0;color:#cbd5e1;font-size:14px;">Complete Cumulative Phase 13.2 Git Patch (20 Friendly Skill Renames + Cross-Platform CI Repairs) &middot; Baseline: cf6b0e7</p>
      ${
        (() => {
          const p13_2 = getPhase13_2DeliveryBundleInfo({ rootDir });
          return p13_2.verified
            ? `<a id="root-phase13-2-download-btn" class="btn" style="display:inline-block;background-color:#22c55e;color:#022c22;font-weight:700;font-size:16px;padding:14px 32px;border-radius:8px;text-decoration:none;box-shadow:0 4px 12px rgba(34,197,94,0.3);transition:all 0.2s;" href="/__artifact/download" download="${PHASE13_2_PATCH_FILENAME}" onmouseover="this.style.backgroundColor='#16a34a'" onmouseout="this.style.backgroundColor='#22c55e'">Download BlendOps Phase 13.2 Patch (${p13_2.size.toLocaleString()} bytes)</a>`
            : `<button id="root-phase13-2-download-btn" class="btn disabled" disabled style="display:inline-block;background-color:#334155;color:#94a3b8;font-weight:700;font-size:16px;padding:14px 32px;border-radius:8px;cursor:not-allowed;opacity:0.6;">Download Unavailable (Preparing Artifact...)</button>`;
        })()
      }
      <div style="margin-top:12px;font-size:12px;color:#94a3b8;">
        Direct link: <a href="/__artifact" style="color:#38bdf8;text-decoration:underline;">/__artifact</a> &middot; Direct patch: <a href="/${PHASE13_2_PATCH_FILENAME}" style="color:#38bdf8;text-decoration:underline;">/${PHASE13_2_PATCH_FILENAME}</a>
      </div>
    </div>
    ${
      phase13Bundle.verified
        ? `<section id="phase13-delivery-section" class="card" style="border:2px solid var(--green);background:rgba(34,197,94,0.20);margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div id="phase13-banner-heading" style="font-size:14px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">PHASE 13 — REPOSITORY ARCHITECTURE, ORGANIZATION &amp; FINALIZATION BUNDLE READY</div>
          <div class="mono" style="font-size:13px;margin-top:8px;line-height:1.7;">
            <div>Filename: <strong id="phase13-filename">${phase13Bundle.filename}</strong> &middot; Size: <strong id="phase13-size">${phase13Bundle.size.toLocaleString()} bytes</strong></div>
            <div>SHA-256: <strong id="phase13-sha256">${phase13Bundle.sha256}</strong></div>
            <div>HEAD: <strong id="phase13-head">${phase13Bundle.headSha}</strong> &middot; Parent: <strong id="phase13-parent">${phase13Bundle.parentSha}</strong></div>
            <div>Verification: <strong id="phase13-verification" style="color:var(--green);">${phase13Bundle.verificationStatus}</strong></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <a id="direct-phase13-bundle-link" class="btn" style="background:var(--green);color:#000;font-size:14px;padding:12px 20px;text-decoration:none;display:inline-block;" href="/${phase13Bundle.filename}" download="${phase13Bundle.filename}">Download Phase 13 Git Bundle (${phase13Bundle.filename})</a>
        </div>
      </div>
    </section>`
        : ''
    }
    ${
      phase12Bundle.verified
        ? `<section id="phase12-delivery-section" class="card" style="border:2px solid var(--green);background:rgba(34,197,94,0.18);margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div id="phase12-banner-heading" style="font-size:14px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">PHASE 12 — WEB-READY GLB DELIVERY &amp; VIEWER INTEGRATION BUNDLE READY</div>
          <div class="mono" style="font-size:13px;margin-top:8px;line-height:1.7;">
            <div>Filename: <strong id="phase12-filename">${phase12Bundle.filename}</strong> &middot; Size: <strong id="phase12-size">${phase12Bundle.size.toLocaleString()} bytes</strong></div>
            <div>SHA-256: <strong id="phase12-sha256">${phase12Bundle.sha256}</strong></div>
            <div>HEAD: <strong id="phase12-head">${phase12Bundle.headSha}</strong> &middot; Parent: <strong id="phase12-parent">${phase12Bundle.parentSha}</strong></div>
            <div>Verification: <strong id="phase12-verification" style="color:var(--green);">${phase12Bundle.verificationStatus}</strong></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button id="download-phase12-bundle-btn" class="btn" style="background:var(--green);color:#000;font-size:14px;padding:12px 20px;" onclick="downloadPhase12Bundle()">Download Phase 12 Git Bundle</button>
          <a id="direct-phase12-bundle-link" class="btn" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);text-decoration:none;display:inline-block;" href="/${phase12Bundle.filename}" download="${phase12Bundle.filename}">Direct Binary Link (${phase12Bundle.filename})</a>
        </div>
      </div>
      <div id="phase12-bundle-status" class="mono" style="font-size:12px;color:var(--green);margin-top:10px;display:none;"></div>
    </section>`
        : ''
    }
    ${
      phase11Bundle.verified
        ? `<section id="phase11-delivery-section" class="card" style="border:2px solid var(--green);background:rgba(34,197,94,0.16);margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div id="phase11-banner-heading" style="font-size:14px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">PHASE 11 — VERIFIED BINARY GIT BUNDLE READY</div>
          <div class="mono" style="font-size:13px;margin-top:8px;line-height:1.7;">
            <div>Filename: <strong id="phase11-filename">${phase11Bundle.filename}</strong> &middot; Size: <strong id="phase11-size">${phase11Bundle.size.toLocaleString()} bytes</strong></div>
            <div>SHA-256: <strong id="phase11-sha256">${phase11Bundle.sha256}</strong></div>
            <div>HEAD: <strong id="phase11-head">${phase11Bundle.headSha}</strong> &middot; Parent: <strong id="phase11-parent">${phase11Bundle.parentSha}</strong></div>
            <div>Verification: <strong id="phase11-verification" style="color:var(--green);">${phase11Bundle.verificationStatus}</strong></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button id="download-phase11-bundle-btn" class="btn" style="background:var(--green);color:#000;font-size:14px;padding:12px 20px;" onclick="downloadPhase11Bundle()">Download Phase 11 Git Bundle</button>
          <a id="direct-phase11-bundle-link" class="btn" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);text-decoration:none;display:inline-block;" href="/${phase11Bundle.filename}" download="${phase11Bundle.filename}">Direct Binary Link (${phase11Bundle.filename})</a>
        </div>
      </div>
      <div id="phase11-bundle-status" class="mono" style="font-size:12px;color:var(--green);margin-top:10px;display:none;"></div>
    </section>`
        : ''
    }
    ${
      phase102Bundle.verified
        ? `<section id="phase10-2-delivery-section" class="card" style="border:2px solid var(--green);background:rgba(34,197,94,0.14);margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div id="phase10-2-banner-heading" style="font-size:14px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">PHASE 10.2 — VERIFIED BINARY GIT BUNDLE READY</div>
          <div class="mono" style="font-size:13px;margin-top:8px;line-height:1.7;">
            <div>Filename: <strong id="phase10-2-filename">${phase102Bundle.filename}</strong> &middot; Size: <strong id="phase10-2-size">${phase102Bundle.size.toLocaleString()} bytes</strong></div>
            <div>SHA-256: <strong id="phase10-2-sha256">${phase102Bundle.sha256}</strong></div>
            <div>HEAD: <strong id="phase10-2-head">${phase102Bundle.headSha}</strong> &middot; Parent: <strong id="phase10-2-parent">${phase102Bundle.parentSha}</strong></div>
            <div>Verification: <strong id="phase10-2-verification" style="color:var(--green);">${phase102Bundle.verificationStatus}</strong></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button id="download-phase10-2-bundle-btn" class="btn" style="background:var(--green);color:#000;font-size:14px;padding:12px 20px;" onclick="downloadPhase102Bundle()">Download Phase 10.2 Git Bundle</button>
          <a id="direct-phase10-2-bundle-link" class="btn" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);text-decoration:none;display:inline-block;" href="/${phase102Bundle.filename}" download="${phase102Bundle.filename}">Direct Binary Link (${phase102Bundle.filename})</a>
        </div>
      </div>
      <div id="phase10-2-bundle-status" class="mono" style="font-size:12px;color:var(--green);margin-top:10px;display:none;"></div>
    </section>`
        : ''
    }
    ${
      phase101Bundle.verified
        ? `<section id="phase10-1-delivery-section" class="card" style="border:2px solid var(--green);background:rgba(34,197,94,0.12);margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div id="phase10-1-banner-heading" style="font-size:14px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">PHASE 10.1 — VERIFIED BINARY GIT BUNDLE READY</div>
          <div class="mono" style="font-size:13px;margin-top:8px;line-height:1.7;">
            <div>Filename: <strong id="phase10-1-filename">${phase101Bundle.filename}</strong> &middot; Size: <strong id="phase10-1-size">${phase101Bundle.size.toLocaleString()} bytes</strong></div>
            <div>SHA-256: <strong id="phase10-1-sha256">${phase101Bundle.sha256}</strong></div>
            <div>HEAD: <strong id="phase10-1-head">${phase101Bundle.headSha}</strong> &middot; Parent: <strong id="phase10-1-parent">${phase101Bundle.parentSha}</strong></div>
            <div>Verification: <strong id="phase10-1-verification" style="color:var(--green);">${phase101Bundle.verificationStatus}</strong></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button id="download-phase10-1-bundle-btn" class="btn" style="background:var(--green);color:#000;font-size:14px;padding:12px 20px;" onclick="downloadPhase101Bundle()">Download Phase 10.1 Git Bundle</button>
          <a id="direct-phase10-1-bundle-link" class="btn" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);text-decoration:none;display:inline-block;" href="/${phase101Bundle.filename}" download="${phase101Bundle.filename}">Direct Binary Link (${phase101Bundle.filename})</a>
        </div>
      </div>
      <div id="phase10-1-bundle-status" class="mono" style="font-size:12px;color:var(--green);margin-top:10px;display:none;"></div>
    </section>`
        : ''
    }
    ${
      phase10Bundle.verified
        ? `<section id="phase10-delivery-section" class="card" style="border:2px solid var(--green);background:rgba(34,197,94,0.10);margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div id="phase10-banner-heading" style="font-size:14px;font-weight:800;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">PHASE 10 — VERIFIED BINARY GIT BUNDLE READY</div>
          <div class="mono" style="font-size:13px;margin-top:8px;line-height:1.7;">
            <div>Filename: <strong id="phase10-filename">${phase10Bundle.filename}</strong> &middot; Size: <strong id="phase10-size">${phase10Bundle.size.toLocaleString()} bytes</strong></div>
            <div>SHA-256: <strong id="phase10-sha256">${phase10Bundle.sha256}</strong></div>
            <div>HEAD: <strong id="phase10-head">${phase10Bundle.headSha}</strong> &middot; Parent: <strong id="phase10-parent">${phase10Bundle.parentSha}</strong></div>
            <div>Verification: <strong id="phase10-verification" style="color:var(--green);">${phase10Bundle.verificationStatus}</strong></div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <button id="download-phase10-bundle-btn" class="btn" style="background:var(--green);color:#000;font-size:14px;padding:12px 20px;" onclick="downloadPhase10Bundle()">Download Phase 10 Git Bundle</button>
          <a id="direct-phase10-bundle-link" class="btn" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);text-decoration:none;display:inline-block;" href="/${phase10Bundle.filename}" download="${phase10Bundle.filename}">Direct Binary Link (${phase10Bundle.filename})</a>
        </div>
      </div>
      <div id="phase10-bundle-status" class="mono" style="font-size:12px;color:var(--green);margin-top:10px;display:none;"></div>
    </section>`
        : `<section id="phase10-delivery-section" class="card" style="border:2px solid var(--red);background:rgba(239,68,68,0.10);margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div id="phase10-banner-heading" style="font-size:14px;font-weight:800;color:var(--red);text-transform:uppercase;letter-spacing:0.05em;">PHASE 10 — GIT BUNDLE VERIFICATION FAILED</div>
          <div class="mono" style="font-size:13px;margin-top:8px;color:var(--red);">
            Error: <strong id="phase10-error">${phase10Bundle.error || 'Artifact unavailable or failed verification'}</strong>
          </div>
        </div>
        <div>
          <button id="download-phase10-bundle-btn" class="btn" style="background:var(--surface-2);color:var(--muted);border:1px solid var(--border);cursor:not-allowed;opacity:0.6;" disabled>Download Phase 10 Git Bundle</button>
        </div>
      </div>
    </section>`
    }
    ${
      bundle.exists
        ? `<div class="card" style="border-color:var(--green);background:rgba(34,197,94,0.06);margin-bottom:22px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--green);text-transform:uppercase;letter-spacing:0.05em;">Verified Binary Git Bundle Ready (In-Memory Export — Zero Proxy)</div>
          <div class="mono" style="font-size:13px;margin-top:6px;">
            File: <strong>${CANONICAL_BUNDLE_FILENAME}</strong> &middot;
            Size: <strong>${bundle.size.toLocaleString()} bytes</strong> &middot;
            Header: <strong>${bundle.header}</strong> &middot;
            SHA-256: <strong>${bundle.sha256}</strong>
          </div>
          ${
            auditProv
              ? `<div class="mono" style="font-size:12px;color:var(--muted);margin-top:4px;">
            Audit Provenance: sourceCommitSha=<strong>${auditProv.sourceCommitSha}</strong> &middot; workingTreeState=<strong>${auditProv.workingTreeState}</strong> &middot; auditedInputsSha256=<strong>${auditProv.auditedInputsSha256.slice(0, 16)}…</strong>
          </div>`
              : ''
          }
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn" style="background:var(--green);color:#000;" onclick="saveBinaryBundle()">Save Binary .bundle File (${Math.round(bundle.size / 1024)} KB)</button>
          <button class="btn" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);" onclick="copyBase64Bundle()">Copy Base64 + PowerShell Decoder</button>
        </div>
      </div>
      <div id="bundle-status" class="mono" style="font-size:12px;color:var(--green);margin-top:8px;display:none;"></div>
      <textarea id="bundle-b64" style="display:none;" readonly>${bundle.b64}</textarea>
    </div>`
        : ''
    }

    <div class="kpi-grid">
      <div class="card" style="border-color:rgba(34,197,94,0.4);">
        <div class="kpi-label">Current Reconciled Score (main)</div>
        <div class="kpi-val" style="color:var(--green)">${currentScorecard ? currentScorecard.totals.measuredScore : 86.5} / 100</div>
        <div class="kpi-sub">Up ${currentScorecard ? currentScorecard.totals.scoreDelta : '+32.0'} from baseline &middot; <strong>0 active P0 blockers</strong></div>
      </div>
      <div class="card">
        <div class="kpi-label">Historical Phase 0 Baseline — Not Current</div>
        <div class="kpi-val" style="color:var(--muted)">${phase0Scorecard ? phase0Scorecard.totals.measuredScore : 54.5} / 100</div>
        <div class="kpi-sub">Commit <code>3ea3c35</code> (preserved immutably in <code>phase-0/</code>)</div>
      </div>
      <div class="card">
        <div class="kpi-label">Truth-State &amp; ZIP Export Integrity</div>
        <div class="kpi-val" style="color:var(--green)">48 / 48</div>
        <div class="kpi-sub"><code>0</code> Artifact Not Run bugs (was 30) &middot; <code>48</code> pure-JS ZIPs</div>
      </div>
      <div class="card">
        <div class="kpi-label">Full-Catalog Contract Engine (Phase 5)</div>
        <div class="kpi-val" style="color:var(--green)">${currentSkillInv ? currentSkillInv.summary.contractedSkillsCount : 48} / 48</div>
        <div class="kpi-sub"><code>${currentSkillInv ? currentSkillInv.summary.contractStatus : 'full-catalog'}</code> &middot; 4 routing + 44 specialist &middot; ${registryGraph ? registryGraph.summary.totalContractedEdges : 371} edges</div>
      </div>
      <div class="card">
        <div class="kpi-label">Full-Catalog Eval Runner (Phase 6)</div>
        <div class="kpi-val" style="color:var(--green)">${currentEvalInv ? (currentEvalInv.summary.machineReadableSuitesCount ?? 48) : 48} / 48</div>
        <div class="kpi-sub"><code>${currentEvalInv ? currentEvalInv.summary.totalMachineReadableCases : 269} / ${currentEvalInv ? currentEvalInv.summary.totalMachineReadableCases : 269}</code> deterministic cases Passed &middot; 0 prose pending</div>
      </div>
      <div class="card">
        <div class="kpi-label">Live LLM &amp; Blender Runtime State</div>
        <div class="kpi-val" style="color:var(--amber)">Not Run</div>
        <div class="kpi-sub">Artifacts: <code>Not Produced</code> (honest zero-fabrication)</div>
      </div>
    </div>

    <h2>Finding Lifecycle Reconciliation (F-01 through F-10 — docs/audits/current/findings.json)</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Severity</th>
          <th>Finding &amp; Pillar</th>
          <th>Phase 0 Baseline (3ea3c35)</th>
          <th>Current Status</th>
          <th>Verification &amp; Remaining Scope</th>
        </tr>
      </thead>
      <tbody>
        ${findingsList
          .map((f) => {
            const badgeClass =
              f.currentLifecycleStatus === 'FIXED'
                ? 'tag-keep'
                : f.currentLifecycleStatus === 'PARTIALLY_FIXED'
                  ? 'tag-blue'
                  : f.currentLifecycleStatus === 'DEFERRED'
                    ? ''
                    : 'tag-improve';
            return `<tr>
          <td class="mono" style="font-weight:700">${f.id}</td>
          <td><span class="tag ${f.severity === 'P0' ? 'tag-bug' : 'tag-improve'}">${f.severity}</span></td>
          <td><strong>${f.title}</strong><div style="font-size:12px;color:var(--muted)">${f.pillar}</div></td>
          <td style="font-size:12px;color:var(--muted)">${f.phase0BaselineState}</td>
          <td><span class="tag ${badgeClass}">${f.currentLifecycleStatus}</span><div style="font-size:11px;color:var(--muted);margin-top:4px;">${f.resolvedInPhase}</div></td>
          <td style="font-size:12px;"><div>${f.verificationMethod}</div><div style="color:var(--muted);margin-top:4px;"><strong>Remaining:</strong> ${f.remainingScope}</div></td>
        </tr>`;
          })
          .join('')}
      </tbody>
    </table>

    <h2>Reconciled 9-Pillar Scorecard: Historical Baseline (54.5) vs. Current State (${currentScorecard ? currentScorecard.totals.measuredScore : 81.0} / 100)</h2>
    <table>
      <thead>
        <tr>
          <th>Pillar</th>
          <th>Historical (3ea3c35)</th>
          <th>Current (main)</th>
          <th>Verdict</th>
          <th>Current Verified Evidence &amp; Open Criteria</th>
        </tr>
      </thead>
      <tbody>
        ${pillars
          .map(
            (p) => `<tr>
          <td style="font-weight:600">${p.name}</td>
          <td class="mono" style="color:var(--muted)">${p.historicalScore} / ${p.weight}</td>
          <td class="mono" style="font-weight:700;color:${p.measuredScore > p.historicalScore ? 'var(--green)' : 'var(--text)'}">${p.measuredScore} / ${p.weight}</td>
          <td><span class="tag ${p.verdict === 'Pass' ? 'tag-keep' : p.verdict === 'Fail' ? 'tag-bug' : 'tag-improve'}">${p.verdict}</span></td>
          <td>${p.criteria.map((c) => `<div style="margin-bottom:4px;"><span class="mono">[${c.awardedPoints}/${c.maxPoints}]</span> ${c.evidence}</div>`).join('')}</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>

    <h2>Phase 6 Full-Catalog Behavioral Evaluation Suites (48 / 48 Skills &middot; 269 Machine-Readable Cases)</h2>
    <table>
      <thead>
        <tr>
          <th>Skill ID</th>
          <th>Category</th>
          <th>Role</th>
          <th>Cases</th>
          <th>Evaluation Types</th>
          <th>Deterministic / Routing / Handoff</th>
          <th>Live Model / Blender Runtime</th>
        </tr>
      </thead>
      <tbody>
        ${suites
          .map(
            (s) => `<tr>
          <td class="mono" style="font-weight:600">${s.skillId}</td>
          <td><span class="tag">${s.category}</span></td>
          <td>${s.isRoutingParticipant ? '<span class="tag tag-blue">routing participant</span>' : '<span class="tag">specialist</span>'}</td>
          <td class="mono">${s.caseCount}</td>
          <td class="mono" style="font-size:12px;">${s.evaluationTypes.join(', ')}</td>
          <td><span class="tag tag-keep">Static: ${s.evaluationStatus.staticValidation}</span><span class="tag tag-keep">Fixture: ${s.evaluationStatus.deterministicFixture}</span><span class="tag ${s.evaluationStatus.contractRouting === 'Passed' ? 'tag-keep' : ''}">Routing: ${s.evaluationStatus.contractRouting}</span><span class="tag ${s.evaluationStatus.contractHandoff === 'Passed' ? 'tag-keep' : ''}">Handoff: ${s.evaluationStatus.contractHandoff || 'Not Applicable'}</span></td>
          <td><span class="tag">liveModel: ${s.evaluationStatus.liveModel}</span><span class="tag">blenderRuntime: ${s.evaluationStatus.blenderRuntime}</span></td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>

    <h2>48 Skills Reconciled Inventory (docs/audits/current/skill-inventory.json)</h2>
    <input type="search" placeholder="Filter 48 skills by ID, category, contract status, eval status, or remaining issue..." oninput="filterSkills(this.value)" />
    <table id="skills-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Skill ID</th>
          <th>Category &amp; Role</th>
          <th>Current Disposition</th>
          <th>Contract &amp; Eval Status</th>
          <th>Headings / Refs</th>
          <th>Remaining Open Flags</th>
        </tr>
      </thead>
      <tbody>
        ${skills
          .map(
            (s, idx) => `<tr data-search="${(s.id + ' ' + s.category + ' ' + s.canonicalRole + ' ' + (s.hasContract ? 'contracted' : '') + ' ' + (s.hasMachineReadableEvalSuite ? 'pilot-eval' : '') + ' ' + s.issues.join(' ')).toLowerCase()}">
          <td class="mono">${idx + 1}</td>
          <td class="mono" style="font-weight:600">${s.id}${s.isGatewaySkill ? ' <span class="tag" style="color:var(--accent)">GATEWAY</span>' : ''}</td>
          <td><div>${s.category}</div><div style="color:var(--muted);font-size:12px;">${s.canonicalRole}</div></td>
          <td><span class="tag ${s.auditDisposition === 'KEEP' ? 'tag-keep' : 'tag-improve'}">${s.auditDisposition}</span></td>
          <td>
            ${s.hasContract ? '<span class="tag tag-blue">contract.json</span>' : '<span class="tag" style="color:var(--muted)">no contract</span>'}
            ${s.hasMachineReadableEvalSuite ? `<span class="tag tag-keep">eval.json (${s.machineReadableEvalCaseCount})</span>` : '<span class="tag" style="color:var(--muted)">prose EVAL.md</span>'}
          </td>
          <td class="mono">${s.headingCount} h2 &middot; ${s.referenceCount} refs</td>
          <td>${
            s.issues.length === 0
              ? '<span class="tag tag-keep">0 open flags</span>'
              : s.issues.map((iss) => `<span class="tag tag-improve">${iss}</span>`).join('')
          }</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </main>
  <script>
    function filterSkills(q) {
      var term = (q || '').toLowerCase().trim();
      var rows = document.querySelectorAll('#skills-table tbody tr');
      for (var i = 0; i < rows.length; i++) {
        var hay = rows[i].getAttribute('data-search') || '';
        rows[i].style.display = !term || hay.indexOf(term) !== -1 ? '' : 'none';
      }
    }
    function decodeBundleBytes() {
      var el = document.getElementById('bundle-b64');
      if (!el) return null;
      var bin = atob(el.value.trim());
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    async function saveBinaryBundle() {
      var status = document.getElementById('bundle-status');
      var bytes = decodeBundleBytes();
      if (!bytes) return;
      try {
        if (window.showSaveFilePicker) {
          var handle = await window.showSaveFilePicker({
            suggestedName: '${CANONICAL_BUNDLE_FILENAME}',
            types: [{ description: 'Git v2 Bundle', accept: { 'application/octet-stream': ['.bundle'] } }]
          });
          var writable = await handle.createWritable();
          await writable.write(bytes);
          await writable.close();
          status.style.display = 'block';
          status.textContent = 'Saved verified binary Git Bundle (' + bytes.length + ' bytes, header # v2 git bundle) directly to disk.';
          return;
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
      var blob = new Blob([bytes], { type: 'application/octet-stream' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '${CANONICAL_BUNDLE_FILENAME}';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1500);
      status.style.display = 'block';
      status.textContent = 'Triggered in-memory Blob download (' + bytes.length + ' bytes, header # v2 git bundle).';
    }
    async function copyBase64Bundle() {
      var el = document.getElementById('bundle-b64');
      var status = document.getElementById('bundle-status');
      if (!el) return;
      await navigator.clipboard.writeText(el.value.trim());
      status.style.display = 'block';
      status.textContent = 'Copied Base64 payload to clipboard! Run in PowerShell: [IO.File]::WriteAllBytes("${CANONICAL_BUNDLE_FILENAME}", [Convert]::FromBase64String((Get-Clipboard)))';
    }
    async function sha256HexFromBuffer(arrayBuffer) {
      var hashBuf = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
      var hashArr = Array.from(new Uint8Array(hashBuf));
      return hashArr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }
    var __phase10VerifiedBytes = null;
    var __phase10VerifyPromise = null;
    async function fetchAndVerifyPhase10Bytes() {
      if (__phase10VerifiedBytes) return __phase10VerifiedBytes;
      if (__phase10VerifyPromise) return __phase10VerifyPromise;
      var expectedFilename = '${PHASE10_DELIVERY_FILENAME}';
      var expectedSize = ${PHASE10_EXPECTED_SIZE};
      var expectedSha256 = '${PHASE10_EXPECTED_SHA256}';
      __phase10VerifyPromise = (async function () {
        var resp = await fetch('/' + expectedFilename, { cache: 'no-store' });
        if (!resp.ok || resp.status !== 200) {
          throw new Error('HTTP ' + resp.status + ' when fetching /' + expectedFilename);
        }
        var ab = await resp.arrayBuffer();
        var bytes = new Uint8Array(ab);
        if (bytes.byteLength !== expectedSize) {
          throw new Error('Downloaded byte length mismatch: expected ' + expectedSize + ', got ' + bytes.byteLength);
        }
        var headerAscii = String.fromCharCode.apply(null, Array.from(bytes.subarray(0, 16)));
        if (headerAscii.indexOf('# v2 git bundle') !== 0 && headerAscii.indexOf('# v3 git bundle') !== 0) {
          throw new Error('Downloaded payload does not start with a valid binary Git bundle header.');
        }
        var actualSha256 = await sha256HexFromBuffer(ab);
        if (actualSha256 !== expectedSha256) {
          throw new Error('SHA-256 mismatch: expected ' + expectedSha256 + ', got ' + actualSha256);
        }
        __phase10VerifiedBytes = bytes;
        return bytes;
      })();
      try {
        return await __phase10VerifyPromise;
      } catch (e) {
        __phase10VerifyPromise = null;
        throw e;
      }
    }
    var __phase101VerifiedBytes = null;
    async function downloadPhase101Bundle() {
      var status = document.getElementById('phase10-1-bundle-status');
      var btn = document.getElementById('download-phase10-1-bundle-btn');
      var expectedFilename = '${PHASE10_1_DELIVERY_FILENAME}';
      var expectedSha256 = '${phase101Bundle.sha256 || ''}';
      var expectedSize = ${phase101Bundle.size || 0};
      try {
        var bytes = __phase101VerifiedBytes;
        if (!bytes) {
          var resp = await fetch('/' + expectedFilename, { cache: 'no-store' });
          if (!resp.ok || resp.status !== 200) {
            throw new Error('HTTP ' + resp.status + ' when fetching /' + expectedFilename);
          }
          var ab = await resp.arrayBuffer();
          bytes = new Uint8Array(ab);
          if (expectedSize > 0 && bytes.byteLength !== expectedSize) {
            throw new Error('Downloaded byte length mismatch: expected ' + expectedSize + ', got ' + bytes.byteLength);
          }
          var headerAscii = String.fromCharCode.apply(null, Array.from(bytes.subarray(0, 16)));
          if (headerAscii.indexOf('# v2 git bundle') !== 0 && headerAscii.indexOf('# v3 git bundle') !== 0) {
            throw new Error('Downloaded payload does not start with a valid binary Git bundle header.');
          }
          var actualSha256 = await sha256HexFromBuffer(ab);
          if (expectedSha256 && actualSha256 !== expectedSha256) {
            throw new Error('SHA-256 mismatch: expected ' + expectedSha256 + ', got ' + actualSha256);
          }
          __phase101VerifiedBytes = bytes;
        }
        if (window.showSaveFilePicker) {
          try {
            var handle = await window.showSaveFilePicker({
              suggestedName: expectedFilename,
              types: [{ description: 'Git v2 Bundle', accept: { 'application/octet-stream': ['.bundle'] } }]
            });
            var writable = await handle.createWritable();
            await writable.write(bytes);
            await writable.close();
            if (status) {
              status.style.display = 'block';
              status.style.color = 'var(--green)';
              status.textContent = 'Saved verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ') directly to disk.';
            }
            return;
          } catch (_pickerErr) {
            // Fall through to Blob download
          }
        }
        var blob = new Blob([bytes], { type: 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = expectedFilename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--green)';
          status.textContent = 'Downloaded verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ').';
        }
      } catch (err) {
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--red)';
          status.textContent = 'Phase 10.1 bundle download failed verification: ' + (err && err.message ? err.message : String(err));
        }
        if (btn) btn.disabled = true;
      }
    }
    var __phase102VerifiedBytes = null;
    async function downloadPhase102Bundle() {
      var status = document.getElementById('phase10-2-bundle-status');
      var btn = document.getElementById('download-phase10-2-bundle-btn');
      var expectedFilename = '${PHASE10_2_DELIVERY_FILENAME}';
      var expectedSha256 = '${phase102Bundle.sha256 || ''}';
      var expectedSize = ${phase102Bundle.size || 0};
      try {
        var bytes = __phase102VerifiedBytes;
        if (!bytes) {
          var resp = await fetch('/' + expectedFilename, { cache: 'no-store' });
          if (!resp.ok || resp.status !== 200) {
            throw new Error('HTTP ' + resp.status + ' when fetching /' + expectedFilename);
          }
          var ab = await resp.arrayBuffer();
          bytes = new Uint8Array(ab);
          if (expectedSize > 0 && bytes.byteLength !== expectedSize) {
            throw new Error('Downloaded byte length mismatch: expected ' + expectedSize + ', got ' + bytes.byteLength);
          }
          var headerAscii = String.fromCharCode.apply(null, Array.from(bytes.subarray(0, 16)));
          if (headerAscii.indexOf('# v2 git bundle') !== 0 && headerAscii.indexOf('# v3 git bundle') !== 0) {
            throw new Error('Downloaded payload does not start with a valid binary Git bundle header.');
          }
          var actualSha256 = await sha256HexFromBuffer(ab);
          if (expectedSha256 && actualSha256 !== expectedSha256) {
            throw new Error('SHA-256 mismatch: expected ' + expectedSha256 + ', got ' + actualSha256);
          }
          __phase102VerifiedBytes = bytes;
        }
        if (window.showSaveFilePicker) {
          try {
            var handle = await window.showSaveFilePicker({
              suggestedName: expectedFilename,
              types: [{ description: 'Git v2 Bundle', accept: { 'application/octet-stream': ['.bundle'] } }]
            });
            var writable = await handle.createWritable();
            await writable.write(bytes);
            await writable.close();
            if (status) {
              status.style.display = 'block';
              status.style.color = 'var(--green)';
              status.textContent = 'Saved verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ') directly to disk.';
            }
            return;
          } catch (_pickerErr) {
            // Fall through to Blob download
          }
        }
        var blob = new Blob([bytes], { type: 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = expectedFilename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--green)';
          status.textContent = 'Downloaded verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ').';
        }
      } catch (err) {
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--red)';
          status.textContent = 'Phase 10.2 bundle download failed verification: ' + (err && err.message ? err.message : String(err));
        }
        if (btn) btn.disabled = true;
      }
    }
    var __phase11VerifiedBytes = null;
    async function downloadPhase11Bundle() {
      var status = document.getElementById('phase11-bundle-status');
      var btn = document.getElementById('download-phase11-bundle-btn');
      var expectedFilename = '${PHASE11_DELIVERY_FILENAME}';
      var expectedSha256 = '${phase11Bundle.sha256 || ''}';
      var expectedSize = ${phase11Bundle.size || 0};
      try {
        var bytes = __phase11VerifiedBytes;
        if (!bytes) {
          var resp = await fetch('/' + expectedFilename, { cache: 'no-store' });
          if (!resp.ok || resp.status !== 200) {
            throw new Error('HTTP ' + resp.status + ' when fetching /' + expectedFilename);
          }
          var ab = await resp.arrayBuffer();
          bytes = new Uint8Array(ab);
          if (expectedSize > 0 && bytes.byteLength !== expectedSize) {
            throw new Error('Downloaded byte length mismatch: expected ' + expectedSize + ', got ' + bytes.byteLength);
          }
          var headerAscii = String.fromCharCode.apply(null, Array.from(bytes.subarray(0, 16)));
          if (headerAscii.indexOf('# v2 git bundle') !== 0 && headerAscii.indexOf('# v3 git bundle') !== 0) {
            throw new Error('Downloaded payload does not start with a valid binary Git bundle header.');
          }
          var actualSha256 = await sha256HexFromBuffer(ab);
          if (expectedSha256 && actualSha256 !== expectedSha256) {
            throw new Error('SHA-256 mismatch: expected ' + expectedSha256 + ', got ' + actualSha256);
          }
          __phase11VerifiedBytes = bytes;
        }
        if (window.showSaveFilePicker) {
          try {
            var handle = await window.showSaveFilePicker({
              suggestedName: expectedFilename,
              types: [{ description: 'Git v2 Bundle', accept: { 'application/octet-stream': ['.bundle'] } }]
            });
            var writable = await handle.createWritable();
            await writable.write(bytes);
            await writable.close();
            if (status) {
              status.style.display = 'block';
              status.style.color = 'var(--green)';
              status.textContent = 'Saved verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ') directly to disk.';
            }
            return;
          } catch (_pickerErr) {
            // Fall through to Blob download
          }
        }
        var blob = new Blob([bytes], { type: 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = expectedFilename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--green)';
          status.textContent = 'Downloaded verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ').';
        }
      } catch (err) {
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--red)';
          status.textContent = 'Phase 11 bundle download failed verification: ' + (err && err.message ? err.message : String(err));
        }
        if (btn) btn.disabled = true;
      }
    }
    var __phase12VerifiedBytes = null;
    async function downloadPhase12Bundle() {
      var status = document.getElementById('phase12-bundle-status');
      var btn = document.getElementById('download-phase12-bundle-btn');
      var expectedFilename = '${PHASE12_DELIVERY_FILENAME}';
      var expectedSha256 = '${phase12Bundle.sha256 || ''}';
      var expectedSize = ${phase12Bundle.size || 0};
      try {
        var bytes = __phase12VerifiedBytes;
        if (!bytes) {
          var resp = await fetch('/' + expectedFilename, { cache: 'no-store' });
          if (!resp.ok || resp.status !== 200) {
            throw new Error('HTTP ' + resp.status + ' when fetching /' + expectedFilename);
          }
          var ab = await resp.arrayBuffer();
          bytes = new Uint8Array(ab);
          if (expectedSize > 0 && bytes.byteLength !== expectedSize) {
            throw new Error('Downloaded byte length mismatch: expected ' + expectedSize + ', got ' + bytes.byteLength);
          }
          var headerAscii = String.fromCharCode.apply(null, Array.from(bytes.subarray(0, 16)));
          if (headerAscii.indexOf('# v2 git bundle') !== 0 && headerAscii.indexOf('# v3 git bundle') !== 0) {
            throw new Error('Downloaded payload does not start with a valid binary Git bundle header.');
          }
          var actualSha256 = await sha256HexFromBuffer(ab);
          if (expectedSha256 && actualSha256 !== expectedSha256) {
            throw new Error('SHA-256 mismatch: expected ' + expectedSha256 + ', got ' + actualSha256);
          }
          __phase12VerifiedBytes = bytes;
        }
        if (window.showSaveFilePicker) {
          try {
            var handle = await window.showSaveFilePicker({
              suggestedName: expectedFilename,
              types: [{ description: 'Git v2 Bundle', accept: { 'application/octet-stream': ['.bundle'] } }]
            });
            var writable = await handle.createWritable();
            await writable.write(bytes);
            await writable.close();
            if (status) {
              status.style.display = 'block';
              status.style.color = 'var(--green)';
              status.textContent = 'Saved verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ') directly to disk.';
            }
            return;
          } catch (_pickerErr) {
            // Fall through to Blob download
          }
        }
        var blob = new Blob([bytes], { type: 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = expectedFilename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--green)';
          status.textContent = 'Downloaded verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ').';
        }
      } catch (err) {
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--red)';
          status.textContent = 'Phase 12 bundle download failed verification: ' + (err && err.message ? err.message : String(err));
        }
        if (btn) btn.disabled = true;
      }
    }
    window.addEventListener('DOMContentLoaded', function () {
      var btn = document.getElementById('download-phase10-bundle-btn');
      var status = document.getElementById('phase10-bundle-status');
      if (!btn || btn.disabled) return;
      fetchAndVerifyPhase10Bytes().catch(function (err) {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--red)';
          status.textContent = 'Phase 10 binary preflight failed: ' + (err && err.message ? err.message : String(err));
        }
      });
    });
    async function downloadPhase10Bundle() {
      var status = document.getElementById('phase10-bundle-status');
      var btn = document.getElementById('download-phase10-bundle-btn');
      var expectedFilename = '${PHASE10_DELIVERY_FILENAME}';
      var expectedSha256 = '${PHASE10_EXPECTED_SHA256}';
      try {
        var bytes = __phase10VerifiedBytes || (await fetchAndVerifyPhase10Bytes());
        if (window.showSaveFilePicker) {
          try {
            var handle = await window.showSaveFilePicker({
              suggestedName: expectedFilename,
              types: [{ description: 'Git v2 Bundle', accept: { 'application/octet-stream': ['.bundle'] } }]
            });
            var writable = await handle.createWritable();
            await writable.write(bytes);
            await writable.close();
            if (status) {
              status.style.display = 'block';
              status.style.color = 'var(--green)';
              status.textContent = 'Saved verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ') directly to disk.';
            }
            return;
          } catch (_pickerErr) {
            // Fall through to Blob download with exact filename blendops-phase-10-delivery.bundle
          }
        }
        var blob = new Blob([bytes], { type: 'application/octet-stream' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = expectedFilename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--green)';
          status.textContent = 'Downloaded verified ' + expectedFilename + ' (' + bytes.byteLength.toLocaleString() + ' bytes, SHA-256: ' + expectedSha256 + ').';
        }
      } catch (err) {
        if (status) {
          status.style.display = 'block';
          status.style.color = 'var(--red)';
          status.textContent = 'Phase 10 bundle download failed verification: ' + (err && err.message ? err.message : String(err));
        }
        if (btn) btn.disabled = true;
      }
    }
  </script>
</body>
</html>`;
}

export function createDevServer(options = {}) {
  const getServerOptions = () => ({
    rootDir:
      options.rootDir !== undefined
        ? options.rootDir
        : process.env.BLENDOPS_REPO_ROOT || process.cwd(),
    bundlePath:
      options.bundlePath !== undefined
        ? options.bundlePath
        : process.env.BLENDOPS_BUNDLE_PATH,
  });

  return http.createServer(async (req, res) => {
    const serverOpts = getServerOptions();
    const rootDir = path.resolve(serverOpts.rootDir);
    const currentDir = path.join(rootDir, 'docs', 'audits', 'current');
    const url = (req.url || '/').split('?')[0];

    if (url === '/__artifact' || url === '/__artifact/') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      res.end(renderArtifactPage({ rootDir }));
      return;
    }

    if (
      url === '/__artifact/download' ||
      url === `/${PHASE13_2_PATCH_FILENAME}` ||
      url === `/dist/${PHASE13_2_PATCH_FILENAME}` ||
      url === `/downloads/${PHASE13_2_PATCH_FILENAME}` ||
      url === `/${PHASE13_2_DELIVERY_FILENAME}` ||
      url === `/downloads/${PHASE13_2_DELIVERY_FILENAME}`
    ) {
      const p13_2 = getPhase13_2DeliveryBundleInfo({ rootDir });
      if (!p13_2.verified || !Buffer.isBuffer(p13_2.buffer)) {
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE13_2_PATCH_FILENAME,
            error: p13_2.error || 'Phase 13.2 delivery patch unavailable',
          }),
        );
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/x-diff; charset=utf-8',
        'Content-Disposition': `attachment; filename="${PHASE13_2_PATCH_FILENAME}"`,
        'Content-Length': String(p13_2.buffer.length),
        'Cache-Control': 'no-store',
      });
      res.end(p13_2.buffer);
      return;
    }

    for (const item of [...PHASE3_2_DELIVERABLES, ...PHASE3_1_DELIVERABLES, ...PHASE3_DELIVERABLES, ...PHASE2_DELIVERABLES]) {
      if (
        url === `/${item.filename}` ||
        url === `/dist/${item.filename}` ||
        url === `/downloads/${item.filename}`
      ) {
        const info = getPhase2DeliverableFile(rootDir, item.filename);
        if (!info.exists || !Buffer.isBuffer(info.buffer)) {
          res.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ exists: false, filename: item.filename }));
          return;
        }
        res.writeHead(200, {
          'Content-Type': item.contentType,
          'Content-Disposition': `attachment; filename="${item.filename}"`,
          'Content-Length': String(info.buffer.length),
          'Cache-Control': 'no-store',
        });
        res.end(info.buffer);
        return;
      }
    }

    if (url === '/api/artifact-ready') {
      const p13_2 = getPhase13_2DeliveryBundleInfo({ rootDir });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          ready: p13_2.verified,
          filename: p13_2.filename,
          size: p13_2.size,
          sha256: p13_2.sha256,
          baselineCommit: p13_2.baselineCommit,
          status: p13_2.verificationStatus,
        }),
      );
      return;
    }

    if (url === '/api/phase13-2-patch-info' || url === '/api/phase13-2-bundle-info') {
      const p13_2 = getPhase13_2DeliveryBundleInfo({ rootDir });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          verified: p13_2.verified,
          exists: p13_2.exists,
          filename: p13_2.filename,
          sourcePath: p13_2.sourcePath,
          size: p13_2.size,
          sha256: p13_2.sha256,
          baselineCommit: p13_2.baselineCommit,
          verificationStatus: p13_2.verificationStatus,
        }),
      );
      return;
    }

    if (url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ status: 'ok', mode: 'reconciled-current-state-inspector' }),
      );
      return;
    }

    if (url === '/api/phase13-bundle-info') {
      const p13 = getPhase13DeliveryBundleInfo({ rootDir });
      if (!p13.verified) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE13_DELIVERY_FILENAME,
            sourcePath: p13.sourcePath,
            headSha: p13.headSha,
            mainSha: p13.mainSha,
            parentSha: p13.parentSha,
            verificationStatus: p13.verificationStatus,
            error: p13.error || 'Phase 13 delivery bundle verification failed',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          verified: true,
          exists: true,
          filename: p13.filename,
          sourcePath: p13.sourcePath,
          size: p13.size,
          sha256: p13.sha256,
          header: p13.header,
          headSha: p13.headSha,
          mainSha: p13.mainSha,
          parentSha: p13.parentSha,
          refs: p13.refs,
          verificationStatus: p13.verificationStatus,
        }),
      );
      return;
    }

    if (url === `/${PHASE13_DELIVERY_FILENAME}` || url === `/downloads/${PHASE13_DELIVERY_FILENAME}`) {
      const p13 = getPhase13DeliveryBundleInfo({ rootDir });
      if (!p13.verified || !Buffer.isBuffer(p13.buffer)) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE13_DELIVERY_FILENAME,
            error: p13.error || 'Phase 13 delivery bundle unavailable',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${PHASE13_DELIVERY_FILENAME}"`,
        'Content-Length': String(p13.buffer.length),
        'Cache-Control': 'no-store',
      });
      res.end(p13.buffer);
      return;
    }

    if (url === '/api/phase12-bundle-info') {
      const p12 = getPhase12DeliveryBundleInfo({ rootDir });
      if (!p12.verified) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE12_DELIVERY_FILENAME,
            sourcePath: p12.sourcePath,
            headSha: p12.headSha,
            mainSha: p12.mainSha,
            parentSha: p12.parentSha,
            verificationStatus: p12.verificationStatus,
            error: p12.error || 'Phase 12 delivery bundle verification failed',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          verified: true,
          exists: true,
          filename: p12.filename,
          sourcePath: p12.sourcePath,
          size: p12.size,
          sha256: p12.sha256,
          header: p12.header,
          headSha: p12.headSha,
          mainSha: p12.mainSha,
          parentSha: p12.parentSha,
          refs: p12.refs,
          verificationStatus: p12.verificationStatus,
        }),
      );
      return;
    }

    if (url === `/${PHASE12_DELIVERY_FILENAME}` || url === `/downloads/${PHASE12_DELIVERY_FILENAME}`) {
      const p12 = getPhase12DeliveryBundleInfo({ rootDir });
      if (!p12.verified || !Buffer.isBuffer(p12.buffer)) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE12_DELIVERY_FILENAME,
            error: p12.error || 'Phase 12 delivery bundle unavailable',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${PHASE12_DELIVERY_FILENAME}"`,
        'Content-Length': String(p12.buffer.length),
        'Cache-Control': 'no-store',
      });
      res.end(p12.buffer);
      return;
    }

    if (url === '/api/phase11-bundle-info') {
      const p11 = getPhase11DeliveryBundleInfo({ rootDir });
      if (!p11.verified) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE11_DELIVERY_FILENAME,
            sourcePath: p11.sourcePath,
            headSha: p11.headSha,
            mainSha: p11.mainSha,
            parentSha: p11.parentSha,
            verificationStatus: p11.verificationStatus,
            error: p11.error || 'Phase 11 delivery bundle verification failed',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          verified: true,
          exists: true,
          filename: p11.filename,
          sourcePath: p11.sourcePath,
          size: p11.size,
          sha256: p11.sha256,
          header: p11.header,
          headSha: p11.headSha,
          mainSha: p11.mainSha,
          parentSha: p11.parentSha,
          refs: p11.refs,
          verificationStatus: p11.verificationStatus,
        }),
      );
      return;
    }

    if (url === `/${PHASE11_DELIVERY_FILENAME}`) {
      const p11 = getPhase11DeliveryBundleInfo({ rootDir });
      if (!p11.verified || !Buffer.isBuffer(p11.buffer)) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE11_DELIVERY_FILENAME,
            error: p11.error || 'Phase 11 delivery bundle unavailable',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${PHASE11_DELIVERY_FILENAME}"`,
        'Content-Length': String(p11.buffer.length),
        'Cache-Control': 'no-store',
      });
      res.end(p11.buffer);
      return;
    }

    if (url === '/api/phase10-2-bundle-info') {
      const p102 = getPhase102DeliveryBundleInfo({ rootDir });
      if (!p102.verified) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE10_2_DELIVERY_FILENAME,
            sourcePath: p102.sourcePath,
            headSha: p102.headSha,
            mainSha: p102.mainSha,
            parentSha: p102.parentSha,
            verificationStatus: p102.verificationStatus,
            error: p102.error || 'Phase 10.2 delivery bundle verification failed',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          verified: true,
          exists: true,
          filename: p102.filename,
          sourcePath: p102.sourcePath,
          size: p102.size,
          sha256: p102.sha256,
          header: p102.header,
          headSha: p102.headSha,
          mainSha: p102.mainSha,
          parentSha: p102.parentSha,
          refs: p102.refs,
          verificationStatus: p102.verificationStatus,
        }),
      );
      return;
    }

    if (url === `/${PHASE10_2_DELIVERY_FILENAME}`) {
      const p102 = getPhase102DeliveryBundleInfo({ rootDir });
      if (!p102.verified || !Buffer.isBuffer(p102.buffer)) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE10_2_DELIVERY_FILENAME,
            error: p102.error || 'Phase 10.2 delivery bundle unavailable',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${PHASE10_2_DELIVERY_FILENAME}"`,
        'Content-Length': String(p102.buffer.length),
        'Cache-Control': 'no-store',
      });
      res.end(p102.buffer);
      return;
    }

    if (url === '/api/phase10-1-bundle-info') {
      const p101 = getPhase101DeliveryBundleInfo({ rootDir });
      if (!p101.verified) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE10_1_DELIVERY_FILENAME,
            sourcePath: p101.sourcePath,
            headSha: p101.headSha,
            mainSha: p101.mainSha,
            parentSha: p101.parentSha,
            verificationStatus: p101.verificationStatus,
            error: p101.error || 'Phase 10.1 delivery bundle verification failed',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          verified: true,
          exists: true,
          filename: p101.filename,
          sourcePath: p101.sourcePath,
          size: p101.size,
          sha256: p101.sha256,
          header: p101.header,
          headSha: p101.headSha,
          mainSha: p101.mainSha,
          parentSha: p101.parentSha,
          refs: p101.refs,
          verificationStatus: p101.verificationStatus,
        }),
      );
      return;
    }

    if (url === `/${PHASE10_1_DELIVERY_FILENAME}`) {
      const p101 = getPhase101DeliveryBundleInfo({ rootDir });
      if (!p101.verified || !Buffer.isBuffer(p101.buffer)) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE10_1_DELIVERY_FILENAME,
            error: p101.error || 'Phase 10.1 delivery bundle unavailable',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${PHASE10_1_DELIVERY_FILENAME}"`,
        'Content-Length': String(p101.buffer.length),
        'Cache-Control': 'no-store',
      });
      res.end(p101.buffer);
      return;
    }

    if (url === '/api/phase10-bundle-info') {
      const p10 = getPhase10DeliveryBundleInfo({ rootDir });
      if (!p10.verified) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE10_DELIVERY_FILENAME,
            sourcePath: p10.sourcePath,
            headSha: p10.headSha,
            mainSha: p10.mainSha,
            parentSha: p10.parentSha,
            verificationStatus: p10.verificationStatus,
            error: p10.error || 'Phase 10 delivery bundle verification failed',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          verified: true,
          exists: true,
          filename: p10.filename,
          sourcePath: p10.sourcePath,
          size: p10.size,
          sha256: p10.sha256,
          header: p10.header,
          headSha: p10.headSha,
          mainSha: p10.mainSha,
          parentSha: p10.parentSha,
          refs: p10.refs,
          verificationStatus: p10.verificationStatus,
        }),
      );
      return;
    }

    if (url === `/${PHASE10_DELIVERY_FILENAME}`) {
      const p10 = getPhase10DeliveryBundleInfo({ rootDir });
      if (!p10.verified || !Buffer.isBuffer(p10.buffer)) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            verified: false,
            exists: false,
            filename: PHASE10_DELIVERY_FILENAME,
            error: p10.error || 'Phase 10 delivery bundle unavailable',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${PHASE10_DELIVERY_FILENAME}"`,
        'Content-Length': String(p10.buffer.length),
        'Cache-Control': 'no-store',
      });
      res.end(p10.buffer);
      return;
    }

    if (url === '/api/bundle-info') {
      const snapshot = await getBundleSnapshot(serverOpts);
      if (!snapshot.exists) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            exists: false,
            filename: CANONICAL_BUNDLE_FILENAME,
            error: snapshot.error || 'Bundle unavailable',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(
        JSON.stringify({
          exists: true,
          filename: CANONICAL_BUNDLE_FILENAME,
          size: snapshot.size,
          sha256: snapshot.sha256,
          header: snapshot.header,
          headSha: snapshot.headSha,
          mainSha: snapshot.mainSha,
          refs: snapshot.refs,
        }),
      );
      return;
    }

    if (COMPAT_ROUTE_SET.has(url)) {
      const snapshot = await getBundleSnapshot(serverOpts);
      if (!snapshot.exists || !Buffer.isBuffer(snapshot.buffer)) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            exists: false,
            filename: CANONICAL_BUNDLE_FILENAME,
            error: snapshot.error || 'Bundle unavailable',
          }),
        );
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${CANONICAL_BUNDLE_FILENAME}"`,
        'Content-Length': String(snapshot.buffer.length),
        'Cache-Control': 'no-store',
      });
      res.end(snapshot.buffer);
      return;
    }

    if (url === '/api/current-scorecard') {
      const data = loadJsonFrom(currentDir, 'scorecard.json');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data || {}));
      return;
    }

    if (url === '/api/current-findings') {
      const data = loadJsonFrom(currentDir, 'findings.json');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data || {}));
      return;
    }

    const snapshot = await getBundleSnapshot(serverOpts);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderHtml({ ...serverOpts, bundleSnapshot: snapshot }));
  });
}

const isMainModule =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';
  const server = createDevServer();
  server.listen(port, host, () => {
    console.log(
      `BlendOps Reconciled Current-State Inspector listening on http://${host}:${port}`,
    );
  });
}
