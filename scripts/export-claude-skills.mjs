#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { buildSharedCatalogFilesMap } from './build-knowledge-catalog.mjs';

const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = fs.existsSync(path.join(process.cwd(), 'skills')) ? process.cwd() : scriptRoot;
const skillsDir = path.join(root, 'skills');

const PROTECTED_REPO_ENTRIES = new Set([
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
  'AGENTS.md',
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'README.md',
  'SECURITY.md',
  'SUPPORT.md',
  'TODO.md',
  'package.json',
  'package-lock.json',
]);

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

function parseCliArgs(argv) {
  let outputRootArg = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--output-root') {
      if (outputRootArg !== null) {
        throw new Error('Duplicate --output-root argument');
      }
      if (i + 1 >= argv.length) {
        throw new Error('Missing value for --output-root');
      }
      const nextVal = argv[i + 1];
      if (typeof nextVal !== 'string' || nextVal.trim() === '' || nextVal.startsWith('-')) {
        throw new Error(`Invalid path value for --output-root: ${String(nextVal)}`);
      }
      outputRootArg = nextVal;
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--output-root=')) {
      if (outputRootArg !== null) {
        throw new Error('Duplicate --output-root argument');
      }
      const eqVal = arg.slice('--output-root='.length);
      if (eqVal.trim() === '' || eqVal.startsWith('-')) {
        throw new Error(`Invalid path value for --output-root: ${eqVal}`);
      }
      outputRootArg = eqVal;
    } else {
      throw new Error(`Unknown or malformed CLI argument: ${String(arg)}`);
    }
  }

  return { outputRootArg };
}

function resolveSafeOutputRoot(rawOutputRoot, rootDir = root) {
  if (rawOutputRoot === null || rawOutputRoot === undefined) {
    return path.join(rootDir, 'dist', 'claude-skills');
  }
  if (
    typeof rawOutputRoot !== 'string' ||
    rawOutputRoot.trim() === '' ||
    rawOutputRoot.includes('\0')
  ) {
    throw new Error('Invalid --output-root path');
  }

  const realRoot = fs.realpathSync(rootDir);
  const resolvedCandidate = path.resolve(rootDir, rawOutputRoot.trim());
  const effectiveTarget = resolveWithExistingAncestorRealpath(resolvedCandidate);

  if (
    resolvedCandidate === path.parse(resolvedCandidate).root ||
    effectiveTarget === path.parse(effectiveTarget).root
  ) {
    throw new Error(`Unsafe --output-root destination (filesystem root): ${rawOutputRoot}`);
  }

  const tmpResolved = path.resolve(os.tmpdir());
  const tmpReal = fs.existsSync(tmpResolved) ? fs.realpathSync(tmpResolved) : tmpResolved;
  if (resolvedCandidate === tmpResolved || effectiveTarget === tmpReal) {
    throw new Error(`Unsafe --output-root destination (OS temp root itself): ${rawOutputRoot}`);
  }

  const relFromTargetToRoot = path.relative(effectiveTarget, realRoot);
  if (
    relFromTargetToRoot === '' ||
    (!relFromTargetToRoot.startsWith('..') && !path.isAbsolute(relFromTargetToRoot))
  ) {
    throw new Error(
      `Unsafe --output-root destination (repository root or ancestor): ${rawOutputRoot}`,
    );
  }

  const relFromRootToTarget = path.relative(realRoot, effectiveTarget);
  const isInsideRepo =
    relFromRootToTarget !== '' &&
    !relFromRootToTarget.startsWith('..') &&
    !path.isAbsolute(relFromRootToTarget);

  if (isInsideRepo) {
    const segments = relFromRootToTarget.split(path.sep);
    const topSegment = segments[0];
    if (PROTECTED_REPO_ENTRIES.has(topSegment)) {
      throw new Error(
        `Unsafe --output-root destination (protected repository path '${topSegment}'): ${rawOutputRoot}`,
      );
    }
    if (topSegment === 'dist' && segments.length < 2) {
      throw new Error(
        `Unsafe --output-root destination (must be a subdirectory inside dist/, not dist/ itself): ${rawOutputRoot}`,
      );
    }
  }

  if (fs.existsSync(resolvedCandidate)) {
    const candLstat = fs.lstatSync(resolvedCandidate);
    if (candLstat.isSymbolicLink()) {
      throw new Error(`Unsafe --output-root destination (symbolic link): ${rawOutputRoot}`);
    }
  }

  if (fs.existsSync(effectiveTarget)) {
    const targetLstat = fs.lstatSync(effectiveTarget);
    if (targetLstat.isSymbolicLink()) {
      throw new Error(`Unsafe --output-root destination (symbolic link): ${rawOutputRoot}`);
    }
    if (!targetLstat.isDirectory()) {
      throw new Error(`Unsafe --output-root destination (existing file): ${rawOutputRoot}`);
    }
    const existingEntries = fs.readdirSync(effectiveTarget);
    if (existingEntries.length > 0) {
      throw new Error(
        `Unsafe --output-root destination (refusing to overwrite non-empty directory): ${rawOutputRoot}`,
      );
    }
  }

  return resolvedCandidate;
}

function formatManifestOutputPrefix(targetPath, rootDir = root) {
  const rel = path.relative(rootDir, targetPath);
  if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
    return rel.split(path.sep).join('/');
  }
  return targetPath.split(path.sep).join('/');
}

export const DETERMINISTIC_ZIP_TIMESTAMP_ISO = '1980-01-01T00:00:00.000Z';
export const DETERMINISTIC_ZIP_DOS_TIME = 0x0000; // 00:00:00
export const DETERMINISTIC_ZIP_DOS_DATE = 0x0021; // 1980-01-01 ((1980 - 1980) << 9 | (1 << 5) | 1)
export const DETERMINISTIC_ZIP_COMPRESSION_LEVEL = 6;
export const DETERMINISTIC_ZIP_OS = 0; // MS-DOS / FAT portable OS byte
export const DETERMINISTIC_ZIP_ATTRS = 0; // Normalized external file attributes

/**
 * fflate's ZIP header writer (wzh) reads local Date getters (getFullYear, getMonth,
 * getDate, getHours, getMinutes, getSeconds) to encode the MS-DOS 32-bit timestamp.
 * Constructing a Date from the UTC components of DETERMINISTIC_ZIP_TIMESTAMP_ISO
 * guarantees that fflate writes dosDate=0x0021 (1980-01-01) and dosTime=0x0000 (00:00:00)
 * deterministically across all host timezones and operating systems.
 */
export function getDeterministicZipMtime() {
  const utc = new Date(DETERMINISTIC_ZIP_TIMESTAMP_ISO);
  return new Date(
    utc.getUTCFullYear(),
    utc.getUTCMonth(),
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
    utc.getUTCMilliseconds(),
  );
}

export function compareCodeUnitOrder(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function mkdirp(target) {
  fs.mkdirSync(target, { recursive: true });
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function collectZipFileList(dir, baseDir, fileList = []) {
  const dirStat = fs.lstatSync(dir);
  if (dirStat.isSymbolicLink()) {
    throw new Error(`Unsafe symbolic link directory encountered during ZIP packaging: ${dir}`);
  }
  const items = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => compareCodeUnitOrder(a.name, b.name));

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const itemLstat = fs.lstatSync(fullPath);
    if (item.isSymbolicLink() || itemLstat.isSymbolicLink()) {
      throw new Error(`Unsafe symbolic link encountered during ZIP packaging: ${fullPath}`);
    }
    if (item.isDirectory()) {
      collectZipFileList(fullPath, baseDir, fileList);
    } else if (item.isFile()) {
      const relPath = path.relative(baseDir, fullPath).split(path.sep).join('/');
      fileList.push({ relPath, fullPath });
    }
  }
  return fileList;
}

export function collectZipEntries(dir, baseDir, entries = {}) {
  const sortedFiles = collectZipFileList(dir, baseDir).sort((a, b) =>
    compareCodeUnitOrder(a.relPath, b.relPath),
  );
  const mtime = getDeterministicZipMtime();

  for (const { relPath, fullPath } of sortedFiles) {
    entries[relPath] = [
      new Uint8Array(fs.readFileSync(fullPath)),
      {
        level: DETERMINISTIC_ZIP_COMPRESSION_LEVEL,
        mtime,
        os: DETERMINISTIC_ZIP_OS,
        attrs: DETERMINISTIC_ZIP_ATTRS,
      },
    ];
  }
  return entries;
}

export function zipDir(srcDir, zipPath) {
  const parent = path.dirname(srcDir);
  const entries = collectZipEntries(srcDir, parent);
  const mtime = getDeterministicZipMtime();
  const zipped = zipSync(entries, {
    level: DETERMINISTIC_ZIP_COMPRESSION_LEVEL,
    mtime,
    os: DETERMINISTIC_ZIP_OS,
    attrs: DETERMINISTIC_ZIP_ATTRS,
  });
  fs.writeFileSync(zipPath, Buffer.from(zipped));
}

export function inspectZipMetadata(zipBuffer) {
  const buf = Buffer.isBuffer(zipBuffer) ? zipBuffer : Buffer.from(zipBuffer);
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  while (offset + 4 <= buf.length) {
    const sig = buf.readUInt32LE(offset);
    if (sig === 0x04034b50) {
      const versionNeeded = buf.readUInt16LE(offset + 4);
      const flags = buf.readUInt16LE(offset + 6);
      const compression = buf.readUInt16LE(offset + 8);
      const dosTime = buf.readUInt16LE(offset + 10);
      const dosDate = buf.readUInt16LE(offset + 12);
      const crc32 = buf.readUInt32LE(offset + 14);
      const compressedSize = buf.readUInt32LE(offset + 18);
      const uncompressedSize = buf.readUInt32LE(offset + 22);
      const fileNameLength = buf.readUInt16LE(offset + 26);
      const extraLength = buf.readUInt16LE(offset + 28);
      const fileName = buf.subarray(offset + 30, offset + 30 + fileNameLength).toString('utf8');
      localHeaders.push({
        fileName,
        versionNeeded,
        flags,
        compression,
        dosTime,
        dosDate,
        crc32,
        compressedSize,
        uncompressedSize,
        extraLength,
      });
      offset += 30 + fileNameLength + extraLength + compressedSize;
    } else if (sig === 0x02014b50) {
      const versionMadeBy = buf.readUInt8(offset + 4);
      const os = buf.readUInt8(offset + 5);
      const versionNeeded = buf.readUInt16LE(offset + 6);
      const flags = buf.readUInt16LE(offset + 8);
      const compression = buf.readUInt16LE(offset + 10);
      const dosTime = buf.readUInt16LE(offset + 12);
      const dosDate = buf.readUInt16LE(offset + 14);
      const crc32 = buf.readUInt32LE(offset + 16);
      const compressedSize = buf.readUInt32LE(offset + 20);
      const uncompressedSize = buf.readUInt32LE(offset + 24);
      const fileNameLength = buf.readUInt16LE(offset + 28);
      const extraLength = buf.readUInt16LE(offset + 30);
      const commentLength = buf.readUInt16LE(offset + 32);
      const externalAttrs = buf.readUInt32LE(offset + 38);
      const localHeaderOffset = buf.readUInt32LE(offset + 42);
      const fileName = buf.subarray(offset + 46, offset + 46 + fileNameLength).toString('utf8');
      centralHeaders.push({
        fileName,
        versionMadeBy,
        os,
        versionNeeded,
        flags,
        compression,
        dosTime,
        dosDate,
        crc32,
        compressedSize,
        uncompressedSize,
        extraLength,
        commentLength,
        externalAttrs,
        localHeaderOffset,
      });
      offset += 46 + fileNameLength + extraLength + commentLength;
    } else if (sig === 0x06054b50) {
      break;
    } else {
      throw new Error(`Unexpected ZIP header signature 0x${sig.toString(16)} at offset ${offset}`);
    }
  }

  return { localHeaders, centralHeaders };
}

function listSkillDirs() {
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== '_template')
    .filter((name) => fs.existsSync(path.join(skillsDir, name, 'SKILL.md')))
    .sort(compareCodeUnitOrder);
}

const ALLOWED_EXISTING_SHARED_CATALOG_FILES = new Set([
  'README.md',
  'manifest.json',
  'blendops-knowledge-and-recipes.zip',
]);

export function resolveSafeSharedCatalogDir(rawSharedCatalogDir, rootDir = root) {
  if (
    typeof rawSharedCatalogDir !== 'string' ||
    rawSharedCatalogDir.trim() === '' ||
    rawSharedCatalogDir.includes('\0')
  ) {
    throw new Error('Invalid sharedCatalogDir path');
  }

  const realRoot = fs.realpathSync(rootDir);
  const resolvedCandidate = path.resolve(rootDir, rawSharedCatalogDir.trim());
  const effectiveTarget = resolveWithExistingAncestorRealpath(resolvedCandidate);

  if (
    resolvedCandidate === path.parse(resolvedCandidate).root ||
    effectiveTarget === path.parse(effectiveTarget).root
  ) {
    throw new Error(
      `Unsafe sharedCatalogDir destination (filesystem root): ${rawSharedCatalogDir}`,
    );
  }

  const tmpResolved = path.resolve(os.tmpdir());
  const tmpReal = fs.existsSync(tmpResolved) ? fs.realpathSync(tmpResolved) : tmpResolved;
  if (resolvedCandidate === tmpResolved || effectiveTarget === tmpReal) {
    throw new Error(
      `Unsafe sharedCatalogDir destination (OS temp root itself): ${rawSharedCatalogDir}`,
    );
  }

  const relFromTargetToRoot = path.relative(effectiveTarget, realRoot);
  if (
    relFromTargetToRoot === '' ||
    (!relFromTargetToRoot.startsWith('..') && !path.isAbsolute(relFromTargetToRoot))
  ) {
    throw new Error(
      `Unsafe sharedCatalogDir destination (repository root or ancestor): ${rawSharedCatalogDir}`,
    );
  }

  const relFromRootToTarget = path.relative(realRoot, effectiveTarget);
  const isInsideRepo =
    relFromRootToTarget !== '' &&
    !relFromRootToTarget.startsWith('..') &&
    !path.isAbsolute(relFromRootToTarget);

  if (isInsideRepo) {
    const segments = relFromRootToTarget.split(path.sep);
    const topSegment = segments[0];
    if (PROTECTED_REPO_ENTRIES.has(topSegment)) {
      throw new Error(
        `Unsafe sharedCatalogDir destination (protected repository path '${topSegment}'): ${rawSharedCatalogDir}`,
      );
    }
    if (topSegment === 'dist' && segments.length < 2) {
      throw new Error(
        `Unsafe sharedCatalogDir destination (must be a subdirectory inside dist/, not dist/ itself): ${rawSharedCatalogDir}`,
      );
    }
  }

  // Check for symbolic links anywhere along resolvedCandidate
  const parsed = path.parse(resolvedCandidate);
  const parts = resolvedCandidate.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let cur = parsed.root;
  for (const part of parts) {
    cur = path.join(cur, part);
    try {
      const st = fs.lstatSync(cur);
      if (st.isSymbolicLink()) {
        throw new Error(
          `Unsafe sharedCatalogDir destination (symbolic link at ${cur}): ${rawSharedCatalogDir}`,
        );
      }
    } catch (err) {
      if (err.message && err.message.startsWith('Unsafe sharedCatalogDir')) throw err;
    }
  }

  if (fs.existsSync(effectiveTarget)) {
    const targetLstat = fs.lstatSync(effectiveTarget);
    if (targetLstat.isSymbolicLink()) {
      throw new Error(
        `Unsafe sharedCatalogDir destination (symbolic link): ${rawSharedCatalogDir}`,
      );
    }
    if (!targetLstat.isDirectory()) {
      throw new Error(
        `Unsafe sharedCatalogDir destination (existing file): ${rawSharedCatalogDir}`,
      );
    }
    const existingEntries = fs.readdirSync(effectiveTarget);
    for (const entryName of existingEntries) {
      const entryFull = path.join(effectiveTarget, entryName);
      const entryStat = fs.lstatSync(entryFull);
      if (
        !ALLOWED_EXISTING_SHARED_CATALOG_FILES.has(entryName) ||
        entryStat.isSymbolicLink() ||
        entryStat.isDirectory()
      ) {
        throw new Error(
          `Unsafe sharedCatalogDir destination (refusing to delete directory containing unrelated entry '${entryName}'): ${rawSharedCatalogDir}`,
        );
      }
    }
  }

  return resolvedCandidate;
}

export function exportSharedCatalogArchive(
  rootDir = root,
  sharedCatalogDir = path.join(rootDir, 'dist', 'shared-catalog'),
) {
  const safeSharedCatalogDir = resolveSafeSharedCatalogDir(sharedCatalogDir, rootDir);
  const knowledgeCatalogPath = path.join(rootDir, 'registry', 'knowledge-catalog.json');
  if (!fs.existsSync(knowledgeCatalogPath)) {
    return null;
  }
  const filesMap = buildSharedCatalogFilesMap(rootDir);
  rmrf(safeSharedCatalogDir);
  mkdirp(safeSharedCatalogDir);

  fs.writeFileSync(path.join(safeSharedCatalogDir, 'README.md'), filesMap['README.md'], 'utf8');
  fs.writeFileSync(
    path.join(safeSharedCatalogDir, 'manifest.json'),
    filesMap['manifest.json'],
    'utf8',
  );

  const mtime = getDeterministicZipMtime();
  const zipEntries = {};
  const sortedRelPaths = Object.keys(filesMap).sort(compareCodeUnitOrder);
  for (const relPath of sortedRelPaths) {
    const entryName = `blendops-knowledge-and-recipes/${relPath}`;
    zipEntries[entryName] = [
      new Uint8Array(Buffer.from(filesMap[relPath], 'utf8')),
      {
        level: DETERMINISTIC_ZIP_COMPRESSION_LEVEL,
        mtime,
        os: DETERMINISTIC_ZIP_OS,
        attrs: DETERMINISTIC_ZIP_ATTRS,
      },
    ];
  }

  const zipped = zipSync(zipEntries, {
    level: DETERMINISTIC_ZIP_COMPRESSION_LEVEL,
    mtime,
    os: DETERMINISTIC_ZIP_OS,
    attrs: DETERMINISTIC_ZIP_ATTRS,
  });
  const zipPath = path.join(safeSharedCatalogDir, 'blendops-knowledge-and-recipes.zip');
  fs.writeFileSync(zipPath, Buffer.from(zipped));
  return {
    sharedCatalogDir: safeSharedCatalogDir,
    zipPath,
    files: sortedRelPaths,
  };
}

const isDirectExecution =
  process.argv[1] &&
  fs.existsSync(process.argv[1]) &&
  fs.realpathSync(path.resolve(process.argv[1])) ===
    fs.realpathSync(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  let outRoot;
  let isCustomOutputRoot = false;
  try {
    const { outputRootArg } = parseCliArgs(process.argv.slice(2));
    isCustomOutputRoot = outputRootArg !== null && outputRootArg !== undefined;
    outRoot = resolveSafeOutputRoot(outputRootArg, root);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const desktopDir = path.join(outRoot, 'desktop-zips');
  const codeDir = path.join(outRoot, 'claude-code-skills');

  if (!fs.existsSync(skillsDir)) {
    console.error(`Missing skills directory: ${skillsDir}`);
    process.exit(1);
  }

  const skillNames = listSkillDirs();

  for (const name of skillNames) {
    const skillMdPath = path.join(skillsDir, name, 'SKILL.md');
    const evalMdPath = path.join(skillsDir, name, 'EVAL.md');
    if (!fs.existsSync(skillMdPath)) {
      console.error(`Missing required SKILL.md for skill '${name}': ${skillMdPath}`);
      process.exit(1);
    }
    if (!fs.existsSync(evalMdPath)) {
      console.error(`Missing required EVAL.md for skill '${name}': ${evalMdPath}`);
      process.exit(1);
    }
  }

  if (isCustomOutputRoot) {
    if (fs.existsSync(outRoot) && fs.readdirSync(outRoot).length > 0) {
      console.error(
        `Refusing to overwrite non-empty --output-root directory: ${outRoot}`,
      );
      process.exit(1);
    }
  } else {
    rmrf(desktopDir);
    rmrf(codeDir);
    fs.rmSync(path.join(outRoot, 'manifest.json'), { force: true });
  }
  mkdirp(desktopDir);
  mkdirp(codeDir);

  for (const name of skillNames) {
    const src = path.join(skillsDir, name);
    const codeDest = path.join(codeDir, name);
    copyDir(src, codeDest);
    zipDir(codeDest, path.join(desktopDir, `${name}.zip`));
  }

  const desktopDisplay = formatManifestOutputPrefix(desktopDir, root);
  const codeDisplay = formatManifestOutputPrefix(codeDir, root);

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'skills/*/SKILL.md',
    skillCount: skillNames.length,
    outputs: {
      claudeDesktop: `${desktopDisplay}/*.zip`,
      claudeCode: `${codeDisplay}/*/SKILL.md`,
    },
    skills: skillNames,
  };

  fs.writeFileSync(path.join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`Exported ${skillNames.length} Claude skill zips to ${desktopDisplay}`);
  console.log(`Exported ${skillNames.length} Claude Code skill folders to ${codeDisplay}`);

  if (!isCustomOutputRoot) {
    const sharedRes = exportSharedCatalogArchive(root, path.join(root, 'dist', 'shared-catalog'));
    if (sharedRes) {
      const sharedDisplay = formatManifestOutputPrefix(sharedRes.zipPath, root);
      console.log(`Exported shared knowledge & recipe catalog archive to ${sharedDisplay}`);
    }
  }
}


