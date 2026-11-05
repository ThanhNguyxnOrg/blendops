#!/usr/bin/env node
/**
 * BlendOps — Phase 13 Regression & Acceptance Test Suite
 *
 * Covers:
 * 1. Complete repository inventory & 7-category classification (`docs/audits/current/repository-inventory.json`).
 * 2. Root-level file & directory policy (`.editorconfig`, `.gitattributes`, `.gitignore`, governance files, no stray root files).
 * 3. Naming conventions and duplicate analysis (verifying only approved intentional duplicates exist and unapproved duplicates fail closed).
 * 4. Internal reference integrity across Markdown links, HTML assets, relative ESM imports, JSON Schemas (Ajv2020),
 *    package.json scripts/files, GitHub Actions workflows, and `docs/audits/audited-inputs.manifest.json` (plus negative tests).
 * 5. Windows CI regression closure (Windows drive roots `C:\`, `D:\`, UNC paths `\\server\share`, POSIX `/`,
 *    and `test-phase11.mjs` import guard preventing duplicate suite execution when imported by `test-phase12.mjs`).
 * 6. Skills (48), laws (4), packs (1), bundles (3), install targets (26), registry, and bundle reference summary determinism.
 * 7. Historical audit snapshot preservation (`phase-0`, `phase-2`, `phase-2.1`, `phase-3`, `release-readiness-rollup-v0.md`)
 *    and current-state (`phase-13-current`) audit provenance (`87.0/100`, `F-08 = PARTIALLY_FIXED`, `Not Run` / `Not Produced` / `Not Published`).
 * 8. `npm pack` tarball file list audit (`"private": true` preserved, no test/audit bloat) and isolated consumer CLI execution.
 */

import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';
import {
  DETERMINISTIC_ZIP_TIMESTAMP_ISO,
  DETERMINISTIC_ZIP_DOS_TIME,
  DETERMINISTIC_ZIP_DOS_DATE,
  DETERMINISTIC_ZIP_COMPRESSION_LEVEL,
  DETERMINISTIC_ZIP_OS,
  DETERMINISTIC_ZIP_ATTRS,
  compareCodeUnitOrder,
  inspectZipMetadata,
} from './export-claude-skills.mjs';

import {
  VALID_CLASSIFICATIONS,
  ALLOWED_ROOT_FILES,
  ALLOWED_ROOT_DIRECTORIES,
  classifyTrackedFile,
  validateInternalRepositoryReferences,
  buildRepositoryArchitectureReport,
  writeOrCheckRepositoryInventory,
} from './validate-repository-architecture.mjs';
import {
  validateSafeReportOutputDir,
} from './generate-glb-handoff-report.mjs';
import {
  buildMinimalValidGlbBuffer,
} from './inspect-glb.mjs';
import { execNpmTool } from './test-phase11.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

describe('Phase 13 — Repository Architecture, Organization & Finalization', () => {
  let suiteTmpDir;

  before(() => {
    suiteTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p13-test-'));
  });

  after(() => {
    if (suiteTmpDir && fs.existsSync(suiteTmpDir)) {
      fs.rmSync(suiteTmpDir, { recursive: true, force: true });
    }
  });

  test('Scenario 1: Repository inventory classifies 100% of tracked files into the 7 canonical categories and matches docs/audits/current/repository-inventory.json', () => {
    const report = buildRepositoryArchitectureReport(ROOT);
    assert.equal(
      report.ok,
      true,
      `Expected valid repository architecture report, got errors:\n${report.errors.join('\n')}`,
    );
    const total = report.inventory.summary.totalTrackedFiles;
    assert.ok(total >= 650, `Expected >= 650 tracked files, got ${total}`);
    assert.equal(report.inventory.files.length, total);

    for (const cat of VALID_CLASSIFICATIONS) {
      assert.ok(
        report.inventory.summary.classificationCounts[cat] > 0,
        `Category ${cat} must have at least 1 tracked file (got ${report.inventory.summary.classificationCounts[cat]})`,
      );
    }

    const sumOfCategories = Object.values(report.inventory.summary.classificationCounts).reduce(
      (acc, n) => acc + n,
      0,
    );
    assert.equal(
      sumOfCategories,
      total,
      'Sum of category counts must equal totalTrackedFiles',
    );

    // Check deterministic synchronization with docs/audits/current/repository-inventory.json
    const checkRes = writeOrCheckRepositoryInventory(ROOT, { checkOnly: true });
    assert.equal(checkRes.ok, true, `Expected arch:check to pass, got: ${checkRes.errors.join('; ')}`);
  });

  test('Scenario 2: Root-level file & directory policy enforces governance/hygiene files and .gitattributes / .editorconfig / .gitignore standards', () => {
    for (const requiredRootFile of [
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
      'package.json',
      'package-lock.json',
    ]) {
      assert.ok(ALLOWED_ROOT_FILES.has(requiredRootFile), `${requiredRootFile} must be in ALLOWED_ROOT_FILES`);
      assert.ok(fs.existsSync(path.join(ROOT, requiredRootFile)), `${requiredRootFile} must exist at repository root`);
    }

    for (const requiredDir of [
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
    ]) {
      assert.ok(ALLOWED_ROOT_DIRECTORIES.has(requiredDir));
      assert.ok(fs.existsSync(path.join(ROOT, requiredDir)));
    }

    // Verify .gitattributes enforces LF for text/code and binary for .glb/.bundle/.zip
    const gitattributes = fs.readFileSync(path.join(ROOT, '.gitattributes'), 'utf8');
    assert.match(gitattributes, /\* text=auto eol=lf/);
    assert.match(gitattributes, /\*\.glb binary/);
    assert.match(gitattributes, /\*\.bundle binary/);
    assert.match(gitattributes, /\*\.zip binary/);

    // Verify .editorconfig enforces UTF-8, LF, 2-space indent
    const editorconfig = fs.readFileSync(path.join(ROOT, '.editorconfig'), 'utf8');
    assert.match(editorconfig, /root = true/);
    assert.match(editorconfig, /end_of_line = lf/);
    assert.match(editorconfig, /charset = utf-8/);
    assert.match(editorconfig, /indent_size = 2/);

    // Verify .gitignore covers local temp/cache artifacts and dist/ build outputs
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    assert.match(gitignore, /\.aistudio\//);
    assert.match(gitignore, /\.playwright-cli\//);
    assert.match(gitignore, /\.blendops\//);
    assert.match(gitignore, /dist\//);
  });

  test('Scenario 3: Naming conventions and duplicate analysis confirm only the approved LICENSE <-> bundles/skill-package/blendops/LICENSE.txt duplicate exists', () => {
    const report = buildRepositoryArchitectureReport(ROOT);
    assert.equal(report.ok, true);

    const dupGroups = report.inventory.duplicateAnalysis.exactDuplicateGroups;
    assert.equal(dupGroups.length, 1);
    assert.deepEqual(dupGroups[0].paths, [
      'LICENSE',
      'bundles/skill-package/blendops/LICENSE.txt',
    ]);
    assert.equal(dupGroups[0].approved, true);
    assert.deepEqual(report.inventory.duplicateAnalysis.deletedObsoleteFilesInPhase13, []);
  });

  test('Scenario 4: Internal reference integrity validates Markdown links, HTML assets, ESM imports, JSON Schemas, workflows, and audited-inputs manifest (including negative tests)', () => {
    const report = buildRepositoryArchitectureReport(ROOT);
    assert.equal(report.ok, true);
    const refCounts = report.inventory.summary.referenceIntegrity;
    assert.ok(refCounts.markdownFiles >= 350);
    assert.ok(refCounts.jsModules >= 20);
    assert.ok(refCounts.schemas >= 10);
    assert.equal(refCounts.workflows, 3);

    // Negative test: synthetic repo with broken Markdown link, broken HTML asset, broken ESM import, and missing manifest entry fails closed
    const badRefRepo = path.join(suiteTmpDir, 'bad-ref-repo');
    fs.mkdirSync(path.join(badRefRepo, 'docs', 'audits'), { recursive: true });
    fs.mkdirSync(path.join(badRefRepo, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(badRefRepo, 'schemas'), { recursive: true });
    fs.mkdirSync(path.join(badRefRepo, '.github', 'workflows'), { recursive: true });

    fs.writeFileSync(
      path.join(badRefRepo, 'package.json'),
      JSON.stringify({
        name: 'bad-ref-test',
        bin: { blendops: 'bin/missing-bin.mjs' },
        files: ['missing-pack-file.md'],
        scripts: { test: 'node scripts/missing-script.mjs' },
      }),
    );
    fs.writeFileSync(
      path.join(badRefRepo, 'docs', 'broken.md'),
      '# Broken\nSee [Missing](./does-not-exist.md) and <img src="./missing-img.png" /> for details.\n',
    );
    const badImportLine = ['import { foo }', 'from', "'./non-existent-module.mjs';"].join(' ');
    fs.writeFileSync(path.join(badRefRepo, 'scripts', 'bad.mjs'), `${badImportLine}\n`);
    fs.writeFileSync(
      path.join(badRefRepo, 'docs', 'audits', 'audited-inputs.manifest.json'),
      JSON.stringify({
        requiredFiles: ['missing-required.md'],
        requiredDirectories: ['missing-dir'],
      }),
    );
    fs.writeFileSync(
      path.join(badRefRepo, '.github', 'workflows', 'ci.yml'),
      'steps:\n  - run: node scripts/missing-ci-script.mjs\n',
    );

    const badRefs = validateInternalRepositoryReferences(badRefRepo, [
      'package.json',
      'docs/broken.md',
      'scripts/bad.mjs',
      'docs/audits/audited-inputs.manifest.json',
      '.github/workflows/ci.yml',
    ]);
    assert.equal(badRefs.ok, false);
    assert.ok(badRefs.errors.some((e) => e.includes('Broken internal markdown link in docs/broken.md')));
    assert.ok(badRefs.errors.some((e) => e.includes('Broken HTML asset reference in docs/broken.md')));
    assert.ok(badRefs.errors.some((e) => e.includes('Broken relative ESM import in scripts/bad.mjs')));
    assert.ok(badRefs.errors.some((e) => e.includes('package.json bin.blendops points to missing file')));
    assert.ok(badRefs.errors.some((e) => e.includes('requiredFiles entry missing: missing-required.md')));
    assert.ok(badRefs.errors.some((e) => e.includes('GitHub workflow .github/workflows/ci.yml references missing script')));
  });

  test('Scenario 5: Windows CI regression closure — drive roots (C:\\, D:\\), UNC paths, POSIX root, and test-phase11 import isolation', () => {
    // 1. Verify validateSafeReportOutputDir rejects POSIX root, Windows drive roots, and UNC roots with unified error message
    for (const rootCandidate of [path.parse(ROOT).root, '/', 'C:\\', 'D:\\', 'c:/', '\\\\server\\share']) {
      assert.throws(
        () => validateSafeReportOutputDir(rootCandidate, { repoRoot: ROOT }),
        /filesystem root|drive root/,
        `Expected ${rootCandidate} to be rejected with unified filesystem/drive root error`,
      );
    }

    // 2. Verify importing execNpmTool from test-phase11.mjs does NOT register Phase 11 describe() suites in another test file
    assert.equal(typeof execNpmTool, 'function');
    const phase11Source = fs.readFileSync(path.join(ROOT, 'scripts', 'test-phase11.mjs'), 'utf8');
    assert.match(phase11Source, /const IS_DIRECT_PHASE11_TEST =/);
    assert.match(phase11Source, /if \(IS_DIRECT_PHASE11_TEST\) \{\s*describe\(/);
  });

  test('Scenario 6: Skills (48), laws (4), packs (1), bundles (3), install targets (26), registry, and bundle summaries remain intact', () => {
    const skillsDirs = fs
      .readdirSync(path.join(ROOT, 'skills'), { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '_template')
      .map((d) => d.name)
      .sort();
    assert.equal(skillsDirs.length, 48);

    for (const skillId of skillsDirs) {
      const skillDir = path.join(ROOT, 'skills', skillId);
      assert.ok(fs.existsSync(path.join(skillDir, 'SKILL.md')), `Missing SKILL.md in ${skillId}`);
      assert.ok(fs.existsSync(path.join(skillDir, 'EVAL.md')), `Missing EVAL.md in ${skillId}`);
      assert.ok(fs.existsSync(path.join(skillDir, 'contract.json')), `Missing contract.json in ${skillId}`);
      assert.ok(
        fs.existsSync(path.join(ROOT, 'evals', 'suites', `${skillId}.eval.json`)),
        `Missing evals/suites/${skillId}.eval.json`,
      );
      const refsDir = path.join(skillDir, 'references');
      assert.ok(fs.existsSync(refsDir) && fs.statSync(refsDir).isDirectory(), `Missing references/ in ${skillId}`);
      const refFiles = fs.readdirSync(refsDir).filter((f) => f.endsWith('.md'));
      assert.ok(refFiles.length >= 1, `Expected >= 1 reference markdown in ${skillId}/references`);
    }

    const lawFiles = fs
      .readdirSync(path.join(ROOT, 'laws'))
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .sort();
    assert.deepEqual(lawFiles, [
      'evidence-before-done.md',
      'no-arbitrary-python-interface.md',
      'non-blender-user-language.md',
      'official-runtime-only.md',
    ]);

    const packDirs = fs
      .readdirSync(path.join(ROOT, 'packs'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    assert.deepEqual(packDirs, ['product-hero-v0']);
    assert.ok(fs.existsSync(path.join(ROOT, 'packs', 'product-hero-v0', 'PACK.md')));

    for (const bundleRel of [
      'bundles/generic-project-local/BLENDOPS.md',
      'bundles/claude-desktop-manual/BLENDOPS_SINGLE_FILE.md',
      'bundles/claude-desktop-manual/SKILL.md',
      'bundles/skill-package/blendops/SKILL.md',
      'bundles/skill-package/blendops/LICENSE.txt',
    ]) {
      assert.ok(fs.existsSync(path.join(ROOT, bundleRel)), `Missing bundle file: ${bundleRel}`);
    }

    const installTargets = fs
      .readdirSync(path.join(ROOT, 'docs', 'install'))
      .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'installer-spec.md');
    assert.equal(installTargets.length, 26);

    assert.equal(DETERMINISTIC_ZIP_TIMESTAMP_ISO, '1980-01-01T00:00:00.000Z');
    assert.equal(DETERMINISTIC_ZIP_DOS_TIME, 0x0000);
    assert.equal(DETERMINISTIC_ZIP_DOS_DATE, 0x0021);
    assert.equal(DETERMINISTIC_ZIP_COMPRESSION_LEVEL, 6);
    assert.equal(DETERMINISTIC_ZIP_OS, 0);
    assert.equal(DETERMINISTIC_ZIP_ATTRS, 0);

    const exportOut1 = path.join(suiteTmpDir, 'claude-skills-export-1');
    const exportOut2 = path.join(suiteTmpDir, 'claude-skills-export-2');
    execFileSync(
      process.execPath,
      [path.join(ROOT, 'scripts', 'export-claude-skills.mjs'), '--output-root', exportOut1],
      { cwd: ROOT, env: { ...process.env, TZ: 'UTC' }, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    execFileSync(
      process.execPath,
      [path.join(ROOT, 'scripts', 'export-claude-skills.mjs'), '--output-root', exportOut2],
      { cwd: ROOT, env: { ...process.env, TZ: 'America/Los_Angeles' }, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    // Refuses to overwrite non-empty --output-root directory
    assert.throws(
      () =>
        execFileSync(
          process.execPath,
          [path.join(ROOT, 'scripts', 'export-claude-skills.mjs'), '--output-root', exportOut1],
          { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
        ),
      /non-empty/,
    );

    const manifest1 = JSON.parse(fs.readFileSync(path.join(exportOut1, 'manifest.json'), 'utf8'));
    const manifest2 = JSON.parse(fs.readFileSync(path.join(exportOut2, 'manifest.json'), 'utf8'));
    assert.equal(manifest1.skillCount, 48);
    assert.equal(manifest2.skillCount, 48);
    assert.deepEqual(manifest1.skills, skillsDirs);
    assert.deepEqual(manifest2.skills, skillsDirs);

    const zipsDir1 = path.join(exportOut1, 'desktop-zips');
    const zipsDir2 = path.join(exportOut2, 'desktop-zips');
    const codeSkillsDir1 = path.join(exportOut1, 'claude-code-skills');
    const codeSkillsDir2 = path.join(exportOut2, 'claude-code-skills');
    const claudeSkillsZips = fs.readdirSync(zipsDir1).filter((f) => f.endsWith('.zip')).sort(compareCodeUnitOrder);
    const claudeSkillsZips2 = fs.readdirSync(zipsDir2).filter((f) => f.endsWith('.zip')).sort(compareCodeUnitOrder);
    const claudeCodeFolders = fs.readdirSync(codeSkillsDir1).sort(compareCodeUnitOrder);
    const claudeCodeFolders2 = fs.readdirSync(codeSkillsDir2).sort(compareCodeUnitOrder);
    assert.equal(claudeSkillsZips.length, 48);
    assert.deepEqual(claudeSkillsZips, claudeSkillsZips2);
    assert.equal(claudeCodeFolders.length, 48);
    assert.deepEqual(claudeCodeFolders, claudeCodeFolders2);

    for (const zipName of claudeSkillsZips) {
      const skillId = zipName.replace(/\.zip$/, '');
      const buf1 = fs.readFileSync(path.join(zipsDir1, zipName));
      const buf2 = fs.readFileSync(path.join(zipsDir2, zipName));
      assert.equal(buf1.equals(buf2), true, `Expected deterministic zip output for ${zipName}`);

      const sha1 = crypto.createHash('sha256').update(buf1).digest('hex');
      const sha2 = crypto.createHash('sha256').update(buf2).digest('hex');
      assert.equal(sha1, sha2, `Expected identical ZIP SHA-256 across repeated exports for ${zipName}`);

      const meta = inspectZipMetadata(buf1);
      assert.ok(meta.localHeaders.length >= 4, `Expected >= 4 files inside ${zipName}`);
      assert.equal(meta.localHeaders.length, meta.centralHeaders.length);

      const headerNames = meta.centralHeaders.map((h) => h.fileName);
      const sortedHeaderNames = [...headerNames].sort(compareCodeUnitOrder);
      assert.deepEqual(
        headerNames,
        sortedHeaderNames,
        `Expected locale-independent deterministic entry order in ${zipName}`,
      );

      for (let i = 0; i < meta.localHeaders.length; i += 1) {
        const lh = meta.localHeaders[i];
        const ch = meta.centralHeaders[i];
        assert.equal(lh.fileName, ch.fileName);
        assert.equal(
          lh.dosTime,
          DETERMINISTIC_ZIP_DOS_TIME,
          `Expected deterministic DOS time 0x0000 in local header for ${lh.fileName} (${zipName})`,
        );
        assert.equal(
          lh.dosDate,
          DETERMINISTIC_ZIP_DOS_DATE,
          `Expected deterministic DOS date 0x0021 (1980-01-01) in local header for ${lh.fileName} (${zipName})`,
        );
        assert.equal(
          ch.dosTime,
          DETERMINISTIC_ZIP_DOS_TIME,
          `Expected deterministic DOS time 0x0000 in central header for ${ch.fileName} (${zipName})`,
        );
        assert.equal(
          ch.dosDate,
          DETERMINISTIC_ZIP_DOS_DATE,
          `Expected deterministic DOS date 0x0021 (1980-01-01) in central header for ${ch.fileName} (${zipName})`,
        );
        assert.equal(ch.os, DETERMINISTIC_ZIP_OS, `Expected normalized OS=0 for ${ch.fileName} (${zipName})`);
        assert.equal(
          ch.externalAttrs,
          DETERMINISTIC_ZIP_ATTRS,
          `Expected normalized externalAttrs=0 for ${ch.fileName} (${zipName})`,
        );
      }

      const entries = unzipSync(new Uint8Array(buf1));
      for (const reqEntry of ['SKILL.md', 'EVAL.md', 'contract.json']) {
        const entryKey = `${skillId}/${reqEntry}`;
        assert.ok(entries[entryKey], `Missing ${entryKey} in ${zipName}`);
        const srcBytes = fs.readFileSync(path.join(ROOT, 'skills', skillId, reqEntry));
        assert.equal(
          Buffer.from(entries[entryKey]).equals(srcBytes),
          true,
          `Expected byte-identical ${entryKey} in ${zipName}`,
        );
      }
    }
  });

  test('Scenario 7: Historical audit snapshots remain immutable and current-state audit artifacts record phase-13-current on 112ecf75a04ab5864b3dc3656b9a27f09d1e8dcd', () => {
    // 1. Historical snapshots exist and are classified as historical_record
    for (const histRel of [
      'docs/audits/phase-0/README.md',
      'docs/audits/phase-0/baseline-scorecard.json',
      'docs/audits/phase-0/findings-and-roadmap.md',
      'docs/audits/phase-2/README.md',
      'docs/audits/phase-2.1/README.md',
      'docs/audits/phase-3/README.md',
      'docs/release-readiness-rollup-v0.md',
    ]) {
      assert.ok(fs.existsSync(path.join(ROOT, histRel)), `Missing historical record: ${histRel}`);
      assert.equal(classifyTrackedFile(histRel).classification, 'historical_record');
    }

    // 2. Verify docs/release-readiness-rollup-v0.md carries explicit historical header
    const rollupV0 = fs.readFileSync(path.join(ROOT, 'docs', 'release-readiness-rollup-v0.md'), 'utf8');
    assert.match(rollupV0, /Historical Snapshot Notice \(v0/);

    // 3. Current-state audit artifacts
    const currentDir = path.join(ROOT, 'docs', 'audits', 'current');
    const scorecard = JSON.parse(fs.readFileSync(path.join(currentDir, 'scorecard.json'), 'utf8'));
    const findings = JSON.parse(fs.readFileSync(path.join(currentDir, 'findings.json'), 'utf8'));
    const skillInv = JSON.parse(fs.readFileSync(path.join(currentDir, 'skill-inventory.json'), 'utf8'));
    const evalInv = JSON.parse(fs.readFileSync(path.join(currentDir, 'eval-inventory.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(currentDir, 'verification-manifest.json'), 'utf8'));
    const repoInv = JSON.parse(fs.readFileSync(path.join(currentDir, 'repository-inventory.json'), 'utf8'));

    const headCommitSha = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    const validCommitShas = new Set([
      '112ecf75a04ab5864b3dc3656b9a27f09d1e8dcd',
      headCommitSha,
    ]);

    for (const doc of [scorecard, findings, skillInv, evalInv, manifest]) {
      assert.equal(doc.auditPhase, 'phase-13-current');
      assert.ok(validCommitShas.has(doc.sourceCommitSha));
      assert.equal(doc.auditProvenance.sourceCommitShort, doc.sourceCommitSha.slice(0, 7));
    }

    assert.equal(scorecard.totals.measuredScore, 87.0);
    assert.equal(scorecard.totals.historicalBaselineScore, 54.5);
    assert.equal(manifest.truthStates.liveModelEval, 'Not Run');
    assert.equal(manifest.truthStates.blenderRuntimeExecution, 'Not Run');
    assert.equal(manifest.truthStates.blenderArtifacts, 'Not Produced');

    const f08 = findings.findings.find((f) => f.id === 'F-08');
    assert.equal(f08.currentLifecycleStatus, 'PARTIALLY_FIXED');

    assert.equal(repoInv.schemaVersion, '1.0.0');
    assert.equal(repoInv.auditPhase, 'phase-13-current');
  });

  test('Scenario 8: npm pack tarball audit and isolated consumer execution preserve "private": true and clean distribution boundary', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    assert.equal(pkg.private, true, 'package.json must retain "private": true (npm package Status: Not Published)');

    const packDir = path.join(suiteTmpDir, 'pack');
    const consumerDir = path.join(suiteTmpDir, 'consumer');
    fs.mkdirSync(packDir, { recursive: true });
    fs.mkdirSync(consumerDir, { recursive: true });
    fs.writeFileSync(
      path.join(consumerDir, 'package.json'),
      `${JSON.stringify({ name: 'phase13-consumer-test', version: '1.0.0', private: true }, null, 2)}\n`,
      'utf8',
    );

    const packJsonRaw = execNpmTool('npm', ['pack', '--pack-destination', packDir, '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    const packMeta = JSON.parse(packJsonRaw)[0];
    const tarballPath = path.join(packDir, packMeta.filename);
    const packedFiles = new Set(packMeta.files.map((f) => f.path));

    // Required runtime files must be present
    for (const requiredFile of [
      'bin/blendops.mjs',
      'scripts/install-skills.mjs',
      'scripts/export-claude-skills.mjs',
      'scripts/inspect-glb.mjs',
      'scripts/generate-glb-handoff-report.mjs',
      'schemas/glb-web-handoff-manifest.schema.json',
      'docs/examples/glb-web-handoff/README.md',
      'docs/examples/glb-web-handoff/threejs-glb-viewer.mjs',
      'docs/examples/glb-web-handoff/r3f-glb-viewer.tsx',
      'registry/skills.json',
      'registry/workflow-graph.json',
    ]) {
      assert.ok(packedFiles.has(requiredFile), `Expected ${requiredFile} in npm pack tarball`);
    }

    // Repo-only test suites, audits, and web preview files must NOT leak into the consumer tarball
    for (const forbiddenPrefix of [
      'scripts/test-phase',
      'scripts/validate-repository-architecture.mjs',
      'scripts/generate-current-audit.mjs',
      'docs/audits/',
      'evals/',
      'src/',
      '.github/',
    ]) {
      const leaked = [...packedFiles].filter((p) => p.startsWith(forbiddenPrefix));
      assert.deepEqual(
        leaked,
        [],
        `Consumer tarball must not include repo-only files under ${forbiddenPrefix}`,
      );
    }

    execNpmTool(
      'npm',
      ['install', '--prefer-offline', '--no-audit', '--no-fund', tarballPath],
      { cwd: consumerDir, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    const installedJs = path.join(consumerDir, 'node_modules', 'blendops', 'bin', 'blendops.mjs');
    const verOut = execFileSync(process.execPath, [installedJs, '--version'], {
      cwd: consumerDir,
      encoding: 'utf8',
    }).trim();
    assert.equal(verOut, `blendops ${pkg.version}`);

    // Run glb-inspect in isolated consumer
    const sampleGlb = path.join(suiteTmpDir, 'consumer-check.glb');
    fs.writeFileSync(sampleGlb, buildMinimalValidGlbBuffer());
    const inspectOut = execFileSync(process.execPath, [installedJs, 'glb-inspect', sampleGlb], {
      cwd: consumerDir,
      encoding: 'utf8',
    });
    assert.match(inspectOut, /Valid GLB 2\.0 container: Yes/);
    assert.match(inspectOut, /Runtime status: Not Run/);
    assert.match(inspectOut, /Artifact status: Not Produced/);
  });
});
