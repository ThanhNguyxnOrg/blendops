#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';

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
  const items = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => compareCodeUnitOrder(a.name, b.name));

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
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

function deriveSkillWorkflowStageForExport(skillObj) {
  const cat = String(skillObj.category || '').toLowerCase();
  if (cat.includes('intake') || cat.includes('brief') || cat.includes('scope')) return 'intake';
  if (cat.includes('plan') || cat.includes('camera') || cat.includes('light') || cat.includes('scene') || cat.includes('asset')) return 'planning';
  if (cat.includes('readiness') || cat.includes('runtime') || cat.includes('bridge')) return 'readiness';
  if (cat.includes('quality') || cat.includes('check') || cat.includes('budget')) return 'validation';
  if (cat.includes('evidence') || cat.includes('report') || cat.includes('done') || cat.includes('gate')) return 'evidence';
  if (cat.includes('handoff') || cat.includes('glb') || cat.includes('r3f') || cat.includes('output')) return 'handoff';
  return 'orchestration';
}

function buildSharedCatalogFilesMapForExport(rootDir = root) {
  const sourcesRaw = fs.readFileSync(path.join(rootDir, 'registry/knowledge-sources.json'), 'utf8');
  const knowledgeRaw = fs.readFileSync(path.join(rootDir, 'registry/knowledge-catalog.json'), 'utf8');
  const recipesRaw = fs.readFileSync(path.join(rootDir, 'registry/recipe-catalog.json'), 'utf8');
  const indexRaw = fs.readFileSync(path.join(rootDir, 'registry/catalog-index.json'), 'utf8');
  const indexData = JSON.parse(indexRaw);

  const skillsData = JSON.parse(fs.readFileSync(path.join(rootDir, 'registry/skills.json'), 'utf8'));
  const skillsSummary = {
    schemaVersion: '1.0.0',
    description: 'Compact canonical 48-skill summary for offline project-local and shared-catalog resolution.',
    skills: skillsData.skills.map((s) => ({
      id: s.id,
      version: s.version || '1.0.0',
      category: s.category,
      role: s.role,
      purpose: s.purpose,
      capabilityTier: s.capabilityTier,
      workflow_stage: deriveSkillWorkflowStageForExport(s),
    })),
  };
  const skillsSummaryRaw = `${JSON.stringify(skillsSummary, null, 2)}\n`;

  const sourcesSchemaRaw = fs.readFileSync(path.join(rootDir, 'schemas/knowledge-source-registry.schema.json'), 'utf8');
  const knowledgeSchemaRaw = fs.readFileSync(path.join(rootDir, 'schemas/knowledge-record.schema.json'), 'utf8');
  const recipeSchemaRaw = fs.readFileSync(path.join(rootDir, 'schemas/recipe-record.schema.json'), 'utf8');
  const sceneSpecSchemaPath = path.join(rootDir, 'schemas/scene-spec.schema.json');
  const executionPlanSchemaPath = path.join(rootDir, 'schemas/execution-plan.schema.json');
  const runtimeOperationsPath = path.join(rootDir, 'registry/runtime-operations.json');
  const runtimeCapabilityPolicyPath = path.join(rootDir, 'registry/runtime-capability-policy.json');
  const runtimeSessionSchemaPath = path.join(rootDir, 'schemas/runtime-session.schema.json');
  const runtimeOperationsSchemaPath = path.join(rootDir, 'schemas/runtime-operations.schema.json');
  const operationExecutionLedgerSchemaPath = path.join(rootDir, 'schemas/operation-execution-ledger.schema.json');
  const runtimeEvidencePacketSchemaPath = path.join(rootDir, 'schemas/runtime-evidence-packet.schema.json');
  const runtimeCapabilityPolicySchemaPath = path.join(rootDir, 'schemas/runtime-capability-policy.schema.json');

  const hasSceneSpecSchema = fs.existsSync(sceneSpecSchemaPath);
  const hasExecutionPlanSchema = fs.existsSync(executionPlanSchemaPath);
  const hasRuntimeOperations = fs.existsSync(runtimeOperationsPath);
  const hasRuntimeCapabilityPolicy = fs.existsSync(runtimeCapabilityPolicyPath);
  const hasRuntimeSessionSchema = fs.existsSync(runtimeSessionSchemaPath);
  const hasRuntimeOperationsSchema = fs.existsSync(runtimeOperationsSchemaPath);
  const hasOperationExecutionLedgerSchema = fs.existsSync(operationExecutionLedgerSchemaPath);
  const hasRuntimeEvidencePacketSchema = fs.existsSync(runtimeEvidencePacketSchemaPath);
  const hasRuntimeCapabilityPolicySchema = fs.existsSync(runtimeCapabilityPolicySchemaPath);

  const fileList = [
    'README.md',
    'manifest.json',
    'knowledge-sources.json',
    'knowledge-catalog.json',
    'recipe-catalog.json',
    'catalog-index.json',
    'skills-summary.json',
    ...(hasRuntimeOperations ? ['runtime-operations.json'] : []),
    ...(hasRuntimeCapabilityPolicy ? ['runtime-capability-policy.json'] : []),
    'schemas/knowledge-source-registry.schema.json',
    'schemas/knowledge-record.schema.json',
    'schemas/recipe-record.schema.json',
    ...(hasSceneSpecSchema ? ['schemas/scene-spec.schema.json'] : []),
    ...(hasExecutionPlanSchema ? ['schemas/execution-plan.schema.json'] : []),
    ...(hasRuntimeSessionSchema ? ['schemas/runtime-session.schema.json'] : []),
    ...(hasRuntimeOperationsSchema ? ['schemas/runtime-operations.schema.json'] : []),
    ...(hasOperationExecutionLedgerSchema ? ['schemas/operation-execution-ledger.schema.json'] : []),
    ...(hasRuntimeEvidencePacketSchema ? ['schemas/runtime-evidence-packet.schema.json'] : []),
    ...(hasRuntimeCapabilityPolicySchema ? ['schemas/runtime-capability-policy.schema.json'] : []),
  ];

  const manifestObj = {
    schema_version: '1.0.0',
    package_name: 'blendops-shared-knowledge-and-recipe-catalog',
    generated_from: [
      'registry/knowledge-sources.json',
      'registry/knowledge-catalog.json',
      'registry/recipe-catalog.json',
      'registry/catalog-index.json',
      'registry/skills.json',
      ...(hasRuntimeOperations ? ['registry/runtime-operations.json'] : []),
      ...(hasRuntimeCapabilityPolicy ? ['registry/runtime-capability-policy.json'] : []),
    ],
    counts: indexData.counts,
    version_baseline: JSON.parse(sourcesRaw).taxonomy.versionBaseline,
    truth_state_defaults: {
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
    },
    files: fileList,
  };

  const readmeContent = [
    '# BlendOps Shared Knowledge & Recipe Catalog',
    '',
    'This portable catalog package contains the canonical BlendOps **Knowledge Layer** (`knowledge.*`), **Recipe Layer** (`recipe.*`), **Authoritative Source Registry** (`source.*`), **Typed Runtime Operations Registry** (`op.*`), and **Deterministic Bilingual (EN+VI) Retrieval Index**.',
    '',
    '## Contents',
    '',
    '- `knowledge-sources.json` — 20 authoritative Blender / Khronos glTF 2.0.1 / OpenSubdiv / MikkTSpace / Filament / Three.js sources and controlled domain taxonomy.',
    '- `knowledge-catalog.json` — 30 canonical knowledge records across 11 3D/Blender domains.',
    '- `recipe-catalog.json` — 10 composable multi-stage construction recipes linking required skills, knowledge records, stage gates, validation criteria, and failure recovery modes.',
    '- `catalog-index.json` — Prebuilt deterministic bilingual (English + Vietnamese) search and cross-reference index.',
    '- `skills-summary.json` — Compact metadata for all 48 canonical BlendOps skills so local resolution works standalone without requiring the full BlendOps git repository.',
    '- `runtime-operations.json` — 18 canonical typed runtime operations (`op.inspect.*`, `op.mutate.*`, `op.export.*`, `op.import.*`) and blocked L3 interfaces.',
    '- `runtime-capability-policy.json` — Governed runtime capability tiers (`L0`–`L3`) and enforcement policy.',
    '- `schemas/` — JSON Schema Draft 2020-12 definitions for sources, knowledge records, recipes, SceneSpec, ExecutionPlan, RuntimeSession, RuntimeOperations, OperationExecutionLedger, RuntimeEvidencePacket, and RuntimeCapabilityPolicy.',
    '',
    '## How Agents Use This Catalog',
    '',
    '1. **Project-Local CLI Lookup** (when installed in `.blendops/catalog/`):',
    '   - Search by natural language (English or Vietnamese): `npx blendops catalog-search "<query>" [--project <project-dir>]`',
    '   - Resolve full record & links: `npx blendops catalog-resolve <knowledge.id | recipe.id | source.id> [--project <project-dir>]`',
    '   - Validate catalog integrity: `npx blendops catalog-validate [--project <project-dir>]`',
    '   - Validate SceneSpec & compile ExecutionPlan: `npx blendops scene-spec-validate <spec.json> [--project <project-dir>]` / `npx blendops plan-compile <spec.json> [--project <project-dir>]`',
    '   - Check runtime readiness & operations: `npx blendops runtime doctor [--project <project-dir>]` / `npx blendops operation list [--project <project-dir>]`',
    '2. **Direct File Consumption** (in Claude Desktop / Claude.ai Projects or offline agent context):',
    '   - Attach or inspect `catalog-index.json` to locate matching `knowledge.*` and `recipe.*` IDs by domain, skill, or keyword.',
    '   - Read the corresponding record in `knowledge-catalog.json` or `recipe-catalog.json` before planning or mutating a Blender scene.',
    '',
    '## Truth-State & Runtime Boundaries',
    '',
    '- **Runtime status**: `Not Run` (default unless backed by a validated runtime evidence packet)',
    '- **Artifact status**: `Not Produced` (default unless backed by verified on-disk artifact hashes)',
    '- **Global files touched**: `No`',
    '',
  ].join('\n');

  const filesMap = {
    'README.md': readmeContent,
    'manifest.json': `${JSON.stringify(manifestObj, null, 2)}\n`,
    'knowledge-sources.json': sourcesRaw,
    'knowledge-catalog.json': knowledgeRaw,
    'recipe-catalog.json': recipesRaw,
    'catalog-index.json': indexRaw,
    'skills-summary.json': skillsSummaryRaw,
    'schemas/knowledge-source-registry.schema.json': sourcesSchemaRaw,
    'schemas/knowledge-record.schema.json': knowledgeSchemaRaw,
    'schemas/recipe-record.schema.json': recipeSchemaRaw,
  };
  if (hasRuntimeOperations) {
    filesMap['runtime-operations.json'] = fs.readFileSync(runtimeOperationsPath, 'utf8');
  }
  if (hasRuntimeCapabilityPolicy) {
    filesMap['runtime-capability-policy.json'] = fs.readFileSync(runtimeCapabilityPolicyPath, 'utf8');
  }
  if (hasSceneSpecSchema) {
    filesMap['schemas/scene-spec.schema.json'] = fs.readFileSync(sceneSpecSchemaPath, 'utf8');
  }
  if (hasExecutionPlanSchema) {
    filesMap['schemas/execution-plan.schema.json'] = fs.readFileSync(executionPlanSchemaPath, 'utf8');
  }
  if (hasRuntimeSessionSchema) {
    filesMap['schemas/runtime-session.schema.json'] = fs.readFileSync(runtimeSessionSchemaPath, 'utf8');
  }
  if (hasRuntimeOperationsSchema) {
    filesMap['schemas/runtime-operations.schema.json'] = fs.readFileSync(runtimeOperationsSchemaPath, 'utf8');
  }
  if (hasOperationExecutionLedgerSchema) {
    filesMap['schemas/operation-execution-ledger.schema.json'] = fs.readFileSync(operationExecutionLedgerSchemaPath, 'utf8');
  }
  if (hasRuntimeEvidencePacketSchema) {
    filesMap['schemas/runtime-evidence-packet.schema.json'] = fs.readFileSync(runtimeEvidencePacketSchemaPath, 'utf8');
  }
  if (hasRuntimeCapabilityPolicySchema) {
    filesMap['schemas/runtime-capability-policy.schema.json'] = fs.readFileSync(runtimeCapabilityPolicySchemaPath, 'utf8');
  }
  return filesMap;
}

export function exportSharedCatalogArchive(
  rootDir = root,
  sharedCatalogDir = path.join(rootDir, 'dist', 'shared-catalog'),
) {
  const knowledgeCatalogPath = path.join(rootDir, 'registry', 'knowledge-catalog.json');
  if (!fs.existsSync(knowledgeCatalogPath)) {
    return null;
  }
  const filesMap = buildSharedCatalogFilesMapForExport(rootDir);
  rmrf(sharedCatalogDir);
  mkdirp(sharedCatalogDir);

  fs.writeFileSync(path.join(sharedCatalogDir, 'README.md'), filesMap['README.md'], 'utf8');
  fs.writeFileSync(path.join(sharedCatalogDir, 'manifest.json'), filesMap['manifest.json'], 'utf8');

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
  const zipPath = path.join(sharedCatalogDir, 'blendops-knowledge-and-recipes.zip');
  fs.writeFileSync(zipPath, Buffer.from(zipped));
  return {
    sharedCatalogDir,
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


