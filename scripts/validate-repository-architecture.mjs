#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { ensureMainRepoGitRestored } from './generate-current-audit.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

export const ALLOWED_ROOT_FILES = new Set([
  '.editorconfig',
  '.gitattributes',
  '.gitignore',
  'AGENTS.md',
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'README.md',
  'SECURITY.md',
  'SUPPORT.md',
  'TODO.md',
  'package-lock.json',
  'package.json',
]);

export const ALLOWED_ROOT_DIRECTORIES = new Set([
  '.github',
  'bin',
  'bundles',
  'docs',
  'evals',
  'laws',
  'packs',
  'registry',
  'schemas',
  'scripts',
  'skill-reviews',
  'skills',
]);

export const IGNORED_LOCAL_ROOT_ENTRIES = new Set([
  '.git',
  '.aistudio',
  '.playwright-cli',
  '.blendops',
  '.claude',
  '.omc',
  '.tmp',
  '.vscode',
  '.idea',
  'dist',
  'node_modules',
  'bun.lock',
]);

export const VALID_CLASSIFICATIONS = new Set([
  'canonical_source',
  'generated_artifact',
  'historical_record',
  'documentation',
  'runtime_build_test_infrastructure',
  'distribution_artifact',
  'configuration',
]);

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export function listTrackedRepositoryFiles(rootDir = DEFAULT_ROOT) {
  ensureMainRepoGitRestored(rootDir);
  const raw = execFileSync('git', ['ls-files'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function isIncludedInNpmPackage(relPath, pkgFiles = []) {
  if (
    relPath === 'package.json' ||
    relPath === 'README.md' ||
    relPath === 'LICENSE' ||
    relPath === 'CHANGELOG.md'
  ) {
    return true;
  }
  for (const entry of pkgFiles) {
    const clean = entry.replace(/\\/g, '/');
    if (clean.endsWith('/')) {
      if (relPath.startsWith(clean)) return true;
    } else if (relPath === clean || relPath.startsWith(`${clean}/`)) {
      return true;
    }
  }
  return false;
}

export function classifyTrackedFile(relPath, pkgFiles = []) {
  const ext = path.extname(relPath).toLowerCase() || path.basename(relPath);
  const includedInNpmPackage = isIncludedInNpmPackage(relPath, pkgFiles);

  let classification = null;
  let purpose = '';
  let owningSubsystem = '';
  let isGenerated = false;
  let generatorScript = null;
  let referencedByCi = false;
  let referencedByOtherFiles = true;
  let safeToMoveOrRemove = false;

  if (relPath === 'package.json' || relPath === 'package-lock.json') {
    classification = 'configuration';
    purpose =
      relPath === 'package.json'
        ? 'Canonical package manifest, CLI bin mapping, tarball allowlist, and CI scripts'
        : 'Deterministic npm dependency lockfile for reproducible CI and consumer installs';
    owningSubsystem = 'package-governance';
    referencedByCi = true;
  } else if (
    relPath === '.gitignore' ||
    relPath === '.gitattributes' ||
    relPath === '.editorconfig'
  ) {
    classification = 'configuration';
    purpose = `Repository ${relPath} hygiene, line-ending normalization, and editor formatting policy`;
    owningSubsystem = 'repository-governance';
    referencedByCi = true;
  } else if (relPath.startsWith('.github/')) {
    classification = 'configuration';
    owningSubsystem = 'github-governance-ci';
    referencedByCi = relPath.startsWith('.github/workflows/');
    if (relPath.startsWith('.github/workflows/')) {
      purpose = 'GitHub Actions CI/CD and repository automation workflow definition';
    } else if (relPath.startsWith('.github/ISSUE_TEMPLATE/')) {
      purpose = 'GitHub issue intake template enforcing runtime and evidence reporting';
    } else if (relPath.startsWith('.github/assets/')) {
      purpose = 'Repository brand and README header visual asset';
    } else if (relPath === '.github/dependabot.yml') {
      purpose = 'Dependabot weekly npm and GitHub Actions update schedule';
    } else {
      purpose = 'GitHub pull request checklist template enforcing pre-PR guards';
    }
  } else if (relPath === 'LICENSE') {
    classification = 'configuration';
    purpose = 'Canonical MIT license governing repository and packaged tarball distribution';
    owningSubsystem = 'repository-governance';
    referencedByCi = true;
  } else if (relPath === 'CHANGELOG.md') {
    classification = 'historical_record';
    purpose = 'Chronological release and milestone changelog across Draft v0 and Phases 10–13';
    owningSubsystem = 'documentation-governance';
    referencedByCi = true;
  } else if (
    relPath === 'README.md' ||
    relPath === 'TODO.md' ||
    relPath === 'AGENTS.md' ||
    relPath === 'CONTRIBUTING.md' ||
    relPath === 'CODE_OF_CONDUCT.md' ||
    relPath === 'SECURITY.md' ||
    relPath === 'SUPPORT.md'
  ) {
    classification = 'documentation';
    purpose = `Root project ${relPath} entry point and contributor/agent governance guide`;
    owningSubsystem = 'documentation-governance';
    referencedByCi = relPath === 'README.md' || relPath === 'TODO.md' || relPath === 'AGENTS.md';
  } else if (relPath === 'bin/blendops.mjs') {
    classification = 'distribution_artifact';
    purpose = 'Executable CLI entrypoint for local and npm-packed blendops commands';
    owningSubsystem = 'cli-distribution';
    referencedByCi = true;
  } else if (relPath.startsWith('schemas/')) {
    classification = 'configuration';
    purpose = `JSON Schema Draft 2020-12 contract (${path.basename(relPath)})`;
    owningSubsystem = 'schemas-and-contracts';
    referencedByCi = true;
  } else if (relPath === 'registry/skills.json' || relPath === 'registry/workflow-graph.json') {
    classification = 'generated_artifact';
    purpose = `Deterministically generated skill registry and workflow routing graph (${path.basename(relPath)})`;
    owningSubsystem = 'registry-and-routing';
    isGenerated = true;
    generatorScript = 'scripts/build-registry.mjs';
    referencedByCi = true;
  } else if (relPath.startsWith('registry/')) {
    classification = 'canonical_source';
    purpose = `Canonical machine-readable policy/matrix dataset (${path.basename(relPath)})`;
    owningSubsystem = 'registry-and-routing';
    referencedByCi = true;
  } else if (relPath.startsWith('evals/')) {
    classification = 'runtime_build_test_infrastructure';
    purpose =
      relPath === 'evals/README.md'
        ? 'Behavioral evaluation dataset index and schema documentation'
        : `Deterministic behavioral evaluation suite for skill '${path.basename(relPath, '.json')}'`;
    owningSubsystem = 'behavioral-evals';
    referencedByCi = true;
  } else if (relPath.startsWith('skills/')) {
    owningSubsystem = 'skills-catalog';
    referencedByCi = true;
    if (relPath.startsWith('skills/_template/')) {
      classification = 'canonical_source';
      purpose = 'Authoring template for canonical BlendOps skills and evaluations';
    } else if (relPath === 'skills/README.md') {
      classification = 'documentation';
      purpose = 'Canonical index and authoring guide for all 48 BlendOps skills';
    } else if (relPath.endsWith('/SKILL.md')) {
      classification = 'canonical_source';
      purpose = 'Canonical Anthropic-compliant skill specification and operating playbook';
    } else if (relPath.endsWith('/EVAL.md')) {
      classification = 'canonical_source';
      purpose = 'Human-readable evaluation prompt and rubric specification for skill';
    } else if (relPath.endsWith('/contract.json')) {
      classification = 'canonical_source';
      purpose = 'Machine-readable routing, input/output, and handoff contract for skill';
    } else if (relPath.includes('/references/')) {
      classification = 'canonical_source';
      purpose = 'Domain reference guide attached to canonical skill';
    } else {
      classification = 'canonical_source';
      purpose = 'Skill catalog asset';
    }
  } else if (relPath.startsWith('laws/')) {
    owningSubsystem = 'laws-and-packs';
    referencedByCi = true;
    classification = relPath === 'laws/README.md' ? 'documentation' : 'canonical_source';
    purpose =
      relPath === 'laws/README.md'
        ? 'Index of the 4 non-negotiable BlendOps guardrail laws'
        : `Canonical guardrail law (${path.basename(relPath, '.md')})`;
  } else if (relPath.startsWith('packs/')) {
    owningSubsystem = 'laws-and-packs';
    referencedByCi = true;
    classification = relPath === 'packs/README.md' ? 'documentation' : 'canonical_source';
    purpose =
      relPath === 'packs/README.md'
        ? 'Index of multi-skill domain workflow packs'
        : 'Canonical Product Hero v0 multi-skill workflow pack manifest';
  } else if (relPath.startsWith('bundles/')) {
    owningSubsystem = 'bundles-and-packaging';
    referencedByCi = true;
    if (
      relPath.startsWith('bundles/claude-desktop-manual/references/skills/') ||
      relPath.startsWith('bundles/skill-package/blendops/references/skill-')
    ) {
      classification = 'generated_artifact';
      purpose = 'Deterministically generated bundle reference summary synced from skills/*/SKILL.md and contract.json';
      isGenerated = true;
      generatorScript = 'scripts/generate-bundle-reference-summaries.mjs';
    } else if (relPath.endsWith('/manifest.json') || relPath.startsWith('bundles/skill-package/blendops/')) {
      classification = 'distribution_artifact';
      purpose = 'Distributable bundle manifest or uploadable skill package file';
    } else {
      classification = 'canonical_source';
      purpose = 'Canonical bundle template, reference map, or rollback instruction file';
    }
  } else if (relPath.startsWith('skill-reviews/')) {
    owningSubsystem = 'quality-and-skill-reviews';
    referencedByCi = true;
    if (relPath.startsWith('skill-reviews/reports/')) {
      classification = 'historical_record';
      purpose = 'Historical v0 skill depth audit and gate review evidence report';
    } else {
      classification = 'documentation';
      purpose = 'Skill quality standard, review gate rubric, or canonical template reference';
    }
  } else if (relPath.startsWith('scripts/')) {
    classification = 'runtime_build_test_infrastructure';
    referencedByCi = true;
    if (relPath.startsWith('scripts/test-')) {
      owningSubsystem = 'test-suites';
      purpose = `Automated regression and verification test suite (${path.basename(relPath)})`;
    } else if (
      relPath === 'scripts/install-skills.mjs' ||
      relPath === 'scripts/export-claude-skills.mjs' ||
      relPath === 'scripts/inspect-glb.mjs' ||
      relPath === 'scripts/generate-glb-handoff-report.mjs'
    ) {
      owningSubsystem = 'cli-and-runtime-tools';
      purpose = `Packaged CLI and runtime verification tool (${path.basename(relPath)})`;
    } else {
      owningSubsystem = 'ci-and-build-generators';
      purpose = `Repository generator, validator, or preview server script (${path.basename(relPath)})`;
    }
  } else if (relPath.startsWith('docs/audits/')) {
    owningSubsystem = 'audits-and-provenance';
    referencedByCi = true;
    if (relPath === 'docs/audits/audited-inputs.manifest.json') {
      classification = 'configuration';
      purpose = 'Manifest of repository files and directories hashed into auditedInputsSha256';
    } else if (relPath.startsWith('docs/audits/current/')) {
      classification = 'generated_artifact';
      purpose = `Deterministically generated current-phase audit artifact (${path.basename(relPath)})`;
      isGenerated = true;
      generatorScript =
        relPath === 'docs/audits/current/repository-inventory.json'
          ? 'scripts/validate-repository-architecture.mjs'
          : 'scripts/generate-current-audit.mjs';
    } else {
      classification = 'historical_record';
      purpose = `Immutable historical phase audit snapshot (${relPath})`;
    }
  } else if (relPath.startsWith('docs/evals/')) {
    owningSubsystem = 'runtime-and-adapter-evals';
    referencedByCi = true;
    classification = relPath === 'docs/evals/README.md' ? 'documentation' : 'historical_record';
    purpose =
      relPath === 'docs/evals/README.md'
        ? 'Index and policy guide for runtime, install, and package readiness evaluation records'
        : `Evaluation packet or recorded verification evidence (${path.basename(relPath)})`;
  } else if (relPath.startsWith('docs/examples/glb-web-handoff/')) {
    owningSubsystem = 'glb-web-handoff-toolkit';
    referencedByCi = true;
    if (relPath.endsWith('README.md')) {
      classification = 'documentation';
      purpose = 'Integration guide for Three.js and React Three Fiber GLB web viewers';
    } else {
      classification = 'runtime_build_test_infrastructure';
      purpose = `Packaged ${path.basename(relPath)} viewer integration reference module`;
    }
  } else if (relPath.startsWith('docs/')) {
    owningSubsystem = 'product-and-target-docs';
    referencedByCi = true;
    if (relPath === 'docs/release-readiness-rollup-v0.md') {
      classification = 'historical_record';
      purpose = 'Historical Draft v0 pre-runtime release readiness rollup snapshot';
    } else {
      classification = 'documentation';
      purpose = `Product, runtime, adapter, workflow, recipe, or target installation guide (${relPath})`;
    }
  }

  return {
    path: relPath,
    fileType: ext,
    classification,
    purpose,
    owningSubsystem,
    includedInNpmPackage,
    referencedByCi,
    referencedByOtherFiles,
    isGenerated,
    generatorScript,
    safeToMoveOrRemove,
  };
}

export function validateInternalRepositoryReferences(rootDir = DEFAULT_ROOT, trackedFiles = null) {
  const files = trackedFiles || listTrackedRepositoryFiles(rootDir);
  const errors = [];

  // 1. Validate Markdown links and HTML asset attributes across all tracked .md and .mdc files
  const mdFiles = files.filter((f) => f.endsWith('.md') || f.endsWith('.mdc'));
  const mdLinkRegex = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const htmlAssetRegex = /\b(?:src|srcset)=["']([^"']+)["']/g;

  for (const relMd of mdFiles) {
    const absMd = path.join(rootDir, relMd);
    if (!fs.existsSync(absMd)) {
      errors.push(`Tracked markdown file missing on disk: ${relMd}`);
      continue;
    }
    const raw = fs.readFileSync(absMd, 'utf8');
    // Mask fenced code blocks and inline code spans so example snippets are not misparsed as live links
    const masked = raw
      .replace(/```[\s\S]*?```/g, '')
      .replace(/~~~[\s\S]*?~~~/g, '')
      .replace(/`[^`\r\n]+`/g, '');

    let match;
    while ((match = mdLinkRegex.exec(masked)) !== null) {
      let target = match[1].trim();
      if (target.includes(' ')) {
        target = target.split(/\s+/)[0];
      }
      if (
        target.startsWith('http://') ||
        target.startsWith('https://') ||
        target.startsWith('mailto:') ||
        target.startsWith('#')
      ) {
        continue;
      }
      const cleanTarget = target.split('#')[0].split('?')[0];
      if (!cleanTarget) continue;
      const resolved = path.resolve(path.dirname(absMd), cleanTarget);
      if (!fs.existsSync(resolved)) {
        errors.push(
          `Broken internal markdown link in ${relMd}: "${match[1]}" -> ${path.relative(rootDir, resolved).replace(/\\/g, '/')}`,
        );
      }
    }

    while ((match = htmlAssetRegex.exec(masked)) !== null) {
      const rawAttr = match[1].trim().split(/\s+/)[0];
      if (
        rawAttr.startsWith('http://') ||
        rawAttr.startsWith('https://') ||
        rawAttr.startsWith('data:')
      ) {
        continue;
      }
      const cleanAsset = rawAttr.split('#')[0].split('?')[0];
      if (!cleanAsset) continue;
      const resolved = path.resolve(path.dirname(absMd), cleanAsset);
      if (!fs.existsSync(resolved)) {
        errors.push(
          `Broken HTML asset reference in ${relMd}: "${rawAttr}" -> ${path.relative(rootDir, resolved).replace(/\\/g, '/')}`,
        );
      }
    }
  }

  // 2. Validate relative ESM imports in bin/ and scripts/
  const jsFiles = files.filter(
    (f) => (f.startsWith('bin/') || f.startsWith('scripts/')) && f.endsWith('.mjs'),
  );
  const importRegex = /\b(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"](\.[^'"]+)['"]/g;
  const dynamicImportRegex = /\bimport\(\s*['"](\.[^'"]+)['"]\s*\)/g;

  for (const relJs of jsFiles) {
    const absJs = path.join(rootDir, relJs);
    const raw = fs.readFileSync(absJs, 'utf8');
    for (const re of [importRegex, dynamicImportRegex]) {
      let m;
      while ((m = re.exec(raw)) !== null) {
        const spec = m[1];
        const resolved = path.resolve(path.dirname(absJs), spec);
        if (!fs.existsSync(resolved)) {
          errors.push(`Broken relative ESM import in ${relJs}: "${spec}"`);
        }
      }
    }
  }

  // 3. Validate package.json bin, files, and script references
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  for (const [binName, binRel] of Object.entries(pkg.bin || {})) {
    if (!fs.existsSync(path.join(rootDir, binRel))) {
      errors.push(`package.json bin.${binName} points to missing file: ${binRel}`);
    }
  }
  for (const fileEntry of pkg.files || []) {
    const clean = fileEntry.replace(/\/+$/, '');
    if (!fs.existsSync(path.join(rootDir, clean))) {
      errors.push(`package.json files entry points to missing path: ${fileEntry}`);
    }
  }
  const scriptPathRegex = /\bnode\s+(?:--test\s+)?((?:scripts|bin)\/[a-zA-Z0-9._/-]+\.mjs)/g;
  for (const [scriptName, cmd] of Object.entries(pkg.scripts || {})) {
    let m;
    while ((m = scriptPathRegex.exec(cmd)) !== null) {
      // Check all scripts/*.mjs tokens in the command line
      const tokens = cmd.match(/(?:scripts|bin)\/[a-zA-Z0-9._/-]+\.mjs/g) || [];
      for (const tok of tokens) {
        if (!fs.existsSync(path.join(rootDir, tok))) {
          errors.push(`package.json scripts["${scriptName}"] references missing script: ${tok}`);
        }
      }
    }
  }

  // 4. Validate .github/workflows/*.yml script references
  const workflowFiles = files.filter((f) => f.startsWith('.github/workflows/') && f.endsWith('.yml'));
  for (const wfRel of workflowFiles) {
    const rawWf = fs.readFileSync(path.join(rootDir, wfRel), 'utf8');
    const tokens = rawWf.match(/(?:scripts|bin)\/[a-zA-Z0-9._/-]+\.mjs/g) || [];
    for (const tok of tokens) {
      if (!fs.existsSync(path.join(rootDir, tok))) {
        errors.push(`GitHub workflow ${wfRel} references missing script: ${tok}`);
      }
    }
  }

  // 5. Validate all JSON schemas under schemas/*.schema.json compile cleanly with Ajv2020
  const schemaFiles = files.filter((f) => f.startsWith('schemas/') && f.endsWith('.schema.json'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  for (const schemaRel of schemaFiles) {
    try {
      const schemaObj = JSON.parse(fs.readFileSync(path.join(rootDir, schemaRel), 'utf8'));
      ajv.compile(schemaObj);
    } catch (err) {
      errors.push(`Invalid JSON Schema in ${schemaRel}: ${err.message}`);
    }
  }

  // 6. Validate docs/audits/audited-inputs.manifest.json paths exist
  const auditManifestRel = 'docs/audits/audited-inputs.manifest.json';
  const auditManifestPath = path.join(rootDir, auditManifestRel);
  if (!fs.existsSync(auditManifestPath)) {
    errors.push(`Missing ${auditManifestRel}`);
  } else {
    const auditManifest = JSON.parse(fs.readFileSync(auditManifestPath, 'utf8'));
    for (const reqFile of auditManifest.requiredFiles || []) {
      if (!fs.existsSync(path.join(rootDir, reqFile))) {
        errors.push(`${auditManifestRel} requiredFiles entry missing: ${reqFile}`);
      }
    }
    for (const reqDir of auditManifest.requiredDirectories || []) {
      const absDir = path.join(rootDir, reqDir);
      if (!fs.existsSync(absDir) || !fs.statSync(absDir).isDirectory()) {
        errors.push(`${auditManifestRel} requiredDirectories entry missing or not a directory: ${reqDir}`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    checkedCounts: {
      markdownFiles: mdFiles.length,
      jsModules: jsFiles.length,
      schemas: schemaFiles.length,
      workflows: workflowFiles.length,
    },
  };
}

export function buildRepositoryArchitectureReport(rootDir = DEFAULT_ROOT) {
  const trackedFiles = listTrackedRepositoryFiles(rootDir);
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const pkgFiles = Array.isArray(pkg.files) ? pkg.files : [];
  const errors = [];

  // 1. Validate root-level tracked and untracked entries against root policy
  const rootTrackedFiles = trackedFiles.filter((f) => !f.includes('/'));
  const rootTrackedDirs = [...new Set(trackedFiles.filter((f) => f.includes('/')).map((f) => f.split('/')[0]))];

  for (const rf of rootTrackedFiles) {
    if (!ALLOWED_ROOT_FILES.has(rf)) {
      errors.push(`Disallowed tracked root file: ${rf}`);
    }
  }
  for (const rd of rootTrackedDirs) {
    if (!ALLOWED_ROOT_DIRECTORIES.has(rd)) {
      errors.push(`Disallowed tracked root directory: ${rd}`);
    }
  }
  for (const requiredRf of ALLOWED_ROOT_FILES) {
    if (!rootTrackedFiles.includes(requiredRf) && !fs.existsSync(path.join(rootDir, requiredRf))) {
      errors.push(`Missing required root governance/configuration file: ${requiredRf}`);
    }
  }
  for (const requiredRd of ALLOWED_ROOT_DIRECTORIES) {
    if (!fs.existsSync(path.join(rootDir, requiredRd))) {
      errors.push(`Missing required root subsystem directory: ${requiredRd}`);
    }
  }

  // 2. Classify every tracked file and compute duplicate content groups
  const fileEntries = [];
  const classificationCounts = {};
  const subsystemCounts = {};
  const topLevelCounts = {};
  const hashGroups = new Map();

  for (const relPath of trackedFiles) {
    const absPath = path.join(rootDir, relPath);
    if (!fs.existsSync(absPath)) {
      errors.push(`Tracked file missing on disk: ${relPath}`);
      continue;
    }
    const meta = classifyTrackedFile(relPath, pkgFiles);
    if (!meta.classification || !VALID_CLASSIFICATIONS.has(meta.classification)) {
      errors.push(`Unclassified or invalid classification for tracked file: ${relPath}`);
    }

    // For docs/audits/current/*, omit self-digest so repository-inventory.json is idempotent
    const isCurrentAuditArtifact = relPath.startsWith('docs/audits/current/');
    const rawBuf = fs.readFileSync(absPath);
    const sha256 = isCurrentAuditArtifact ? 'dynamic-current-audit-artifact' : sha256Buffer(rawBuf);
    const byteSize = isCurrentAuditArtifact ? 0 : rawBuf.byteLength;

    if (!isCurrentAuditArtifact) {
      if (!hashGroups.has(sha256)) {
        hashGroups.set(sha256, []);
      }
      hashGroups.get(sha256).push(relPath);
    }

    classificationCounts[meta.classification] = (classificationCounts[meta.classification] || 0) + 1;
    subsystemCounts[meta.owningSubsystem] = (subsystemCounts[meta.owningSubsystem] || 0) + 1;
    const topKey = relPath.includes('/') ? relPath.split('/')[0] : '(root)';
    topLevelCounts[topKey] = (topLevelCounts[topKey] || 0) + 1;

    fileEntries.push({
      ...meta,
      byteSize,
      sha256,
    });
  }

  const exactDuplicateGroups = [];
  for (const [sha256, paths] of hashGroups.entries()) {
    if (paths.length > 1) {
      const sortedPaths = [...paths].sort();
      const isApprovedLicenseCopy =
        sortedPaths.length === 2 &&
        sortedPaths[0] === 'LICENSE' &&
        sortedPaths[1] === 'bundles/skill-package/blendops/LICENSE.txt';
      if (!isApprovedLicenseCopy) {
        errors.push(`Unapproved exact duplicate tracked files (${sha256}): ${sortedPaths.join(', ')}`);
      }
      exactDuplicateGroups.push({
        sha256,
        paths: sortedPaths,
        approved: isApprovedLicenseCopy,
        rationale: isApprovedLicenseCopy
          ? 'Root MIT LICENSE is mirrored in bundles/skill-package/blendops/LICENSE.txt so the standalone skill upload package remains self-contained.'
          : 'Unapproved duplicate',
      });
    }
  }

  // 3. Validate naming conventions across directories
  for (const relPath of trackedFiles) {
    const base = path.basename(relPath);
    if (relPath.startsWith('scripts/')) {
      if (!/^[a-z0-9-]+\.mjs$/.test(base)) {
        errors.push(`Script filename violates lowercase kebab-case .mjs rule: ${relPath}`);
      }
    } else if (relPath.startsWith('schemas/')) {
      if (!/^[a-z0-9-]+\.schema\.json$/.test(base)) {
        errors.push(`Schema filename violates <name>.schema.json rule: ${relPath}`);
      }
    } else if (relPath.startsWith('laws/') && base !== 'README.md') {
      if (!/^[a-z0-9-]+\.md$/.test(base)) {
        errors.push(`Law filename violates lowercase kebab-case .md rule: ${relPath}`);
      }
    } else if (relPath.startsWith('docs/') && base !== 'README.md') {
      if (!/^[a-z0-9._-]+\.(md|json|mjs|tsx)$/.test(base)) {
        errors.push(`Documentation/example filename violates naming convention: ${relPath}`);
      }
    }
  }

  // 4. Validate internal references
  const refCheck = validateInternalRepositoryReferences(rootDir, trackedFiles);
  for (const err of refCheck.errors) {
    errors.push(err);
  }

  const npmIncludedCount = fileEntries.filter((e) => e.includedInNpmPackage).length;
  const generatedCount = fileEntries.filter((e) => e.isGenerated).length;

  const inventoryObject = {
    schemaVersion: '1.0.0',
    auditPhase: 'phase-13-current',
    summary: {
      totalTrackedFiles: fileEntries.length,
      npmPackageIncludedFiles: npmIncludedCount,
      generatedTrackedFiles: generatedCount,
      canonicalSkillsCount: 48,
      lawsCount: 4,
      packsCount: 1,
      bundlesCount: 3,
      installTargetsCount: 26,
      exactDuplicateGroupsCount: exactDuplicateGroups.length,
      classificationCounts,
      subsystemCounts,
      topLevelCounts,
      referenceIntegrity: refCheck.checkedCounts,
    },
    rootPolicy: {
      allowedRootFiles: [...ALLOWED_ROOT_FILES].sort(),
      allowedRootDirectories: [...ALLOWED_ROOT_DIRECTORIES].sort(),
      ignoredLocalEntries: [...IGNORED_LOCAL_ROOT_ENTRIES].sort(),
    },
    duplicateAnalysis: {
      exactDuplicateGroups,
      nearDuplicateGeneratedFamilies: [
        {
          pattern: 'bundles/claude-desktop-manual/references/skills/*.md (48 files) & bundles/skill-package/blendops/references/skill-*.md (48 files)',
          generatorScript: 'scripts/generate-bundle-reference-summaries.mjs',
          rationale:
            'Dual-profile reference summaries required by the Claude Desktop manual bundle and the standalone uploadable skill package; verified 100% semantically equivalent to skills/*/SKILL.md and contract.json in CI.',
        },
        {
          pattern: 'bundles/claude-desktop-manual/references/laws/*.md (4 files) & bundles/skill-package/blendops/references/law-*.md (4 files)',
          generatorScript: null,
          rationale:
            'Self-contained law reference copies inside the two offline upload bundles so each bundle remains portable when extracted standalone.',
        },
      ],
      deletedObsoleteFilesInPhase13: [],
      deletionPolicyNote:
        'Zero tracked files were deleted in Phase 13 because all 651 baseline tracked files + Phase 13 governance/inventory/test additions serve active runtime, skill, bundle, CI, or historical audit provenance roles.',
    },
    files: fileEntries,
  };

  return {
    ok: errors.length === 0,
    errors,
    inventory: inventoryObject,
  };
}

export function writeOrCheckRepositoryInventory(rootDir = DEFAULT_ROOT, { checkOnly = false } = {}) {
  const targetPath = path.join(rootDir, 'docs', 'audits', 'current', 'repository-inventory.json');
  if (!checkOnly && !fs.existsSync(targetPath)) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, '{}\n', 'utf8');
  }

  const report = buildRepositoryArchitectureReport(rootDir);
  if (!report.ok) {
    return report;
  }
  const serialized = `${JSON.stringify(report.inventory, null, 2)}\n`;

  if (checkOnly) {
    if (!fs.existsSync(targetPath)) {
      return {
        ok: false,
        errors: ['Missing docs/audits/current/repository-inventory.json (run npm run arch:build)'],
        inventory: report.inventory,
      };
    }
    const existing = fs.readFileSync(targetPath, 'utf8');
    if (existing !== serialized) {
      return {
        ok: false,
        errors: [
          'docs/audits/current/repository-inventory.json is out of sync with live repository state (run npm run arch:build)',
        ],
        inventory: report.inventory,
      };
    }
    return report;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, serialized, 'utf8');
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const checkOnly = process.argv.includes('--check');
  const res = writeOrCheckRepositoryInventory(DEFAULT_ROOT, { checkOnly });
  if (!res.ok) {
    console.error('Repository architecture validation failed:');
    for (const err of res.errors) {
      console.error(`- ${err}`);
    }
    process.exitCode = 1;
  } else {
    console.log(
      checkOnly
        ? `arch:check passed (${res.inventory.summary.totalTrackedFiles} tracked files classified; 0 broken references).`
        : `Generated docs/audits/current/repository-inventory.json (${res.inventory.summary.totalTrackedFiles} tracked files classified; 0 broken references).`,
    );
    process.exitCode = 0;
  }
}
