#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { zipSync } from 'fflate';

const root = process.cwd();
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

  if (fs.existsSync(effectiveTarget) && fs.statSync(effectiveTarget).isFile()) {
    throw new Error(`Unsafe --output-root destination (existing file): ${rawOutputRoot}`);
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

let outRoot;
try {
  const { outputRootArg } = parseCliArgs(process.argv.slice(2));
  outRoot = resolveSafeOutputRoot(outputRootArg, root);
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
}

const desktopDir = path.join(outRoot, 'desktop-zips');
const codeDir = path.join(outRoot, 'claude-code-skills');

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function mkdirp(target) {
  fs.mkdirSync(target, { recursive: true });
}

function copyDir(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

function collectZipEntries(dir, baseDir, entries = {}) {
  const items = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      collectZipEntries(fullPath, baseDir, entries);
    } else if (item.isFile()) {
      const relPath = path.relative(baseDir, fullPath).split(path.sep).join('/');
      entries[relPath] = new Uint8Array(fs.readFileSync(fullPath));
    }
  }
  return entries;
}

function zipDir(srcDir, zipPath) {
  const parent = path.dirname(srcDir);
  const entries = collectZipEntries(srcDir, parent);
  const zipped = zipSync(entries, { level: 6 });
  fs.writeFileSync(zipPath, Buffer.from(zipped));
}

function listSkillDirs() {
  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== '_template')
    .filter((name) => fs.existsSync(path.join(skillsDir, name, 'SKILL.md')))
    .sort();
}

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

rmrf(outRoot);
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
