import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  EXPECTED_CANONICAL_SKILL_COUNT,
  VALID_CAPABILITY_TIERS,
  VALID_GATE_GOAL_CLARITIES,
  ROUTING_PARTICIPANT_IDS,
  CLAUDE_DESKTOP_SKILLS_REL_DIR,
  PORTABLE_PACKAGE_REFS_REL_DIR,
  CLAUDE_DESKTOP_MANIFEST_REL_PATH,
  PRESERVED_BUNDLE_FILES,
  assertSafePathWithinRoot,
  buildGeneratedFileNotice,
  discoverCanonicalSkillIds,
  loadAndValidateSkillSourcePair,
  formatConditionGroupExpression,
  parseConditionGroupExpression,
  renderClaudeDesktopSummary,
  renderPortablePackageSummary,
  extractSummaryRoutingSemantics,
  computeBundleSummaryPlan,
  generateBundleReferenceSummaries,
  checkBundleReferenceSummaries,
} from './generate-bundle-reference-summaries.mjs';
import { runDocsCheck } from './check-docs.mjs';
import {
  generateCurrentAuditArtifacts,
  AUDITED_INPUTS_MANIFEST_REL,
} from './generate-current-audit.mjs';

const root = process.cwd();
const generatorScript = path.join(root, 'scripts', 'generate-bundle-reference-summaries.mjs');

function createIsolatedFixtureRepo({ includeSchemas = true } = {}) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase8-test-'));
  const dirs = includeSchemas ? ['skills', 'bundles', 'schemas'] : ['skills', 'bundles'];
  for (const dirRel of dirs) {
    fs.cpSync(path.join(root, dirRel), path.join(tempRoot, dirRel), { recursive: true });
  }
  return tempRoot;
}

function snapshotRepoTree(repoDir) {
  const snapshot = new Map();
  function walk(currDir) {
    for (const ent of fs.readdirSync(currDir, { withFileTypes: true })) {
      const abs = path.join(currDir, ent.name);
      const rel = path.relative(repoDir, abs).replace(/\\/g, '/');
      const lstat = fs.lstatSync(abs);
      if (lstat.isSymbolicLink()) {
        snapshot.set(`symlink:${rel}`, fs.readlinkSync(abs));
      } else if (lstat.isDirectory()) {
        walk(abs);
      } else if (lstat.isFile()) {
        snapshot.set(rel, fs.readFileSync(abs));
      }
    }
  }
  walk(repoDir);
  return snapshot;
}

function assertSnapshotsEqual(beforeSnap, afterSnap, contextMessage) {
  assert.deepEqual(
    [...afterSnap.keys()].sort(),
    [...beforeSnap.keys()].sort(),
    `${contextMessage}: file set changed`,
  );
  for (const [k, bufBefore] of beforeSnap.entries()) {
    const bufAfter = afterSnap.get(k);
    if (Buffer.isBuffer(bufBefore)) {
      assert.equal(
        Buffer.compare(bufBefore, bufAfter),
        0,
        `${contextMessage}: file content mutated at ${k}`,
      );
    } else {
      assert.equal(bufAfter, bufBefore, `${contextMessage}: symlink mutated at ${k}`);
    }
  }
}

test('Scenario 1: Canonical discovery finds 48 valid SKILL.md + contract.json pairs', () => {
  const discovery = discoverCanonicalSkillIds(root);
  assert.equal(discovery.ok, true, `Discovery errors: ${discovery.errors.join('; ')}`);
  assert.equal(discovery.skillIds.length, EXPECTED_CANONICAL_SKILL_COUNT);
  assert.equal(discovery.skillIds.includes('_template'), false);

  const sortedCopy = [...discovery.skillIds].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(discovery.skillIds, sortedCopy, 'Skill IDs must be deterministically sorted');

  const catalogSet = new Set(discovery.skillIds);
  for (const skillId of discovery.skillIds) {
    const res = loadAndValidateSkillSourcePair(skillId, catalogSet, root);
    assert.equal(res.ok, true, `Validation failed for ${skillId}: ${res.errors.join('; ')}`);
    assert.ok(res.model);
    assert.equal(res.model.id, skillId);
  }
});

test('Scenario 2: Generator emits 48 Claude Desktop summaries and 48 portable package summaries (96 total)', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const res = generateBundleReferenceSummaries(tempRoot);
    assert.equal(res.ok, true, `Build errors: ${res.errors.join('; ')}`);
    assert.equal(res.skillCount, 48);
    assert.equal(res.generatedCount, 96);
    assert.equal(res.writtenFiles.length, 96);

    const claudeFiles = fs
      .readdirSync(path.join(tempRoot, CLAUDE_DESKTOP_SKILLS_REL_DIR))
      .filter((f) => f.endsWith('.md'))
      .sort();
    assert.equal(claudeFiles.length, 48);

    const portableSkillFiles = fs
      .readdirSync(path.join(tempRoot, PORTABLE_PACKAGE_REFS_REL_DIR))
      .filter((f) => f.startsWith('skill-') && f !== 'skill-map.md' && f.endsWith('.md'))
      .sort();
    assert.equal(portableSkillFiles.length, 48);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 3: Every generated summary maps 1-to-1 to an exact canonical skill ID', () => {
  const discovery = discoverCanonicalSkillIds(root);
  assert.equal(discovery.ok, true);

  const claudeFiles = fs
    .readdirSync(path.join(root, CLAUDE_DESKTOP_SKILLS_REL_DIR))
    .filter((f) => f.endsWith('.md'))
    .sort();
  assert.deepEqual(
    claudeFiles,
    discovery.skillIds.map((id) => `${id}.md`),
  );

  const portableSkillFiles = fs
    .readdirSync(path.join(root, PORTABLE_PACKAGE_REFS_REL_DIR))
    .filter((f) => f.startsWith('skill-') && f !== 'skill-map.md' && f.endsWith('.md'))
    .sort();
  assert.deepEqual(
    portableSkillFiles,
    discovery.skillIds.map((id) => `skill-${id}.md`),
  );
});

test('Scenario 4: Every generated summary includes required operational sections and truth-state policy fields', () => {
  const plan = computeBundleSummaryPlan(root);
  assert.equal(plan.ok, true);

  for (const model of plan.models) {
    const claudeRel = `${CLAUDE_DESKTOP_SKILLS_REL_DIR}/${model.id}.md`;
    const portableRel = `${PORTABLE_PACKAGE_REFS_REL_DIR}/skill-${model.id}.md`;
    const claudeTxt = fs.readFileSync(path.join(root, claudeRel), 'utf8');
    const portableTxt = fs.readFileSync(path.join(root, portableRel), 'utf8');

    for (const heading of [
      `# ${model.id} (reference summary)`,
      '## Purpose',
      '## Metadata & truth boundary',
      '## When to use',
      '## Trigger cues',
      '## When not to use',
      '## Inputs & output/evidence contract',
      '## Quick-start procedure',
      '## Handoff notes',
      '## Safety boundaries & non-goals',
    ]) {
      assert.equal(
        claudeTxt.includes(heading),
        true,
        `Missing "${heading}" in ${claudeRel}`,
      );
    }
    assert.match(claudeTxt, /Runtime status defaults to `Not Run`/);
    assert.match(claudeTxt, /Artifact status defaults to `Not Produced`/);
    assert.match(claudeTxt, /mutation rule is `downgrade_only`/);

    for (const heading of [
      `# ${model.id}`,
      `Purpose: ${model.purpose}`,
      '## When to use & trigger cues',
      '## When not to use (delegation boundaries)',
      '## Input & output contract',
      '## Quick-start steps',
      '## Cross-skill handoffs',
      '## Safety boundaries & non-goals',
    ]) {
      assert.equal(
        portableTxt.includes(heading),
        true,
        `Missing "${heading}" in ${portableRel}`,
      );
    }
    assert.match(portableTxt, /Runtime default `Not Run`/);
    assert.match(portableTxt, /Artifact default `Not Produced`/);
    assert.match(portableTxt, /Mutation `downgrade_only`/);
  }
});

test('Scenario 5: Both profiles remain semantically aligned across all 48 skills', () => {
  const plan = computeBundleSummaryPlan(root);
  assert.equal(plan.ok, true);

  for (const model of plan.models) {
    const claudeTxt = fs.readFileSync(
      path.join(root, `${CLAUDE_DESKTOP_SKILLS_REL_DIR}/${model.id}.md`),
      'utf8',
    );
    const portableTxt = fs.readFileSync(
      path.join(root, `${PORTABLE_PACKAGE_REFS_REL_DIR}/skill-${model.id}.md`),
      'utf8',
    );

    for (const token of [
      model.purpose,
      `\`v${model.version}\``,
      `\`${model.category}\``,
      `\`${model.role}\``,
      `\`${model.capabilityTier}\``,
      ...model.triggers.map((t) => `"${t}"`),
      ...model.inputs.required.map((inp) => `\`${inp.name}\` (\`${inp.type}\`)`),
      ...model.inputs.optional.map((inp) => `\`${inp.name}\` (\`${inp.type}\`)`),
      ...model.outputs.primary.map((out) => `\`${out}\``),
      ...model.exclusions.map((ex) => `\`${ex.delegateTo}\``),
      ...model.handoffs.map((h) => `\`${h.target}\``),
    ]) {
      assert.equal(
        claudeTxt.includes(token),
        true,
        `Claude Desktop summary for ${model.id} missing semantic token: ${token}`,
      );
      assert.equal(
        portableTxt.includes(token),
        true,
        `Portable package summary for ${model.id} missing semantic token: ${token}`,
      );
    }

    for (const ex of model.exclusions) {
      assert.equal(
        claudeTxt.includes(`references/skills/${ex.delegateTo}.md`),
        true,
        `Claude Desktop summary for ${model.id} must link to references/skills/${ex.delegateTo}.md`,
      );
      assert.equal(
        portableTxt.includes(`references/skill-${ex.delegateTo}.md`),
        true,
        `Portable summary for ${model.id} must link to references/skill-${ex.delegateTo}.md`,
      );
    }
  }
});

test('Scenario 6: Missing SKILL.md fails closed', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    fs.unlinkSync(path.join(tempRoot, 'skills', 'blendops-help', 'SKILL.md'));
    const buildRes = generateBundleReferenceSummaries(tempRoot);
    assert.equal(buildRes.ok, false);
    assert.equal(
      buildRes.errors.some((e) => e.includes('Missing canonical SKILL.md: skills/blendops-help/SKILL.md')),
      true,
    );

    const checkRes = checkBundleReferenceSummaries(tempRoot);
    assert.equal(checkRes.ok, false);
    assert.equal(
      checkRes.errors.some((e) => e.includes('Missing canonical SKILL.md: skills/blendops-help/SKILL.md')),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 7: Missing or malformed contract.json fails closed', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    fs.writeFileSync(contractPath, '{ invalid json', 'utf8');
    const malformedRes = generateBundleReferenceSummaries(tempRoot);
    assert.equal(malformedRes.ok, false);
    assert.equal(
      malformedRes.errors.some((e) => e.includes('Malformed JSON in skills/blendops-help/contract.json')),
      true,
    );

    fs.unlinkSync(contractPath);
    const missingRes = generateBundleReferenceSummaries(tempRoot);
    assert.equal(missingRes.ok, false);
    assert.equal(
      missingRes.errors.some((e) => e.includes('Missing canonical contract.json: skills/blendops-help/contract.json')),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 8: Skill/contract ID mismatch fails closed', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    contract.id = 'wrong-skill-id';
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const res = generateBundleReferenceSummaries(tempRoot);
    assert.equal(res.ok, false);
    assert.equal(
      res.errors.some((e) => e.includes('Contract ID mismatch in skills/blendops-help/contract.json')),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 9: Invalid handoff or exclusion target fails closed', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    contract.handoffs[0].target = 'non-existent-skill-target';
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const res = generateBundleReferenceSummaries(tempRoot);
    assert.equal(res.ok, false);
    assert.equal(
      res.errors.some((e) => e.includes('Unknown handoff target "non-existent-skill-target"')),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 10: Unsupported capability tier or invalid truth-state policy fails closed', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    contract.capabilityTier = 'L99';
    contract.outputs.truthStatePolicy.artifactDefault = 'Not Run';
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const res = generateBundleReferenceSummaries(tempRoot);
    assert.equal(res.ok, false);
    assert.equal(
      res.errors.some((e) => e.includes('Unsupported capabilityTier "L99"')),
      true,
    );
    assert.equal(
      res.errors.some((e) => e.includes('Invalid outputs.truthStatePolicy.artifactDefault')),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 11: Check mode detects a missing generated summary in either bundle profile', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    fs.unlinkSync(
      path.join(tempRoot, CLAUDE_DESKTOP_SKILLS_REL_DIR, 'blendops-help.md'),
    );
    const resA = checkBundleReferenceSummaries(tempRoot);
    assert.equal(resA.ok, false);
    assert.equal(
      resA.errors.some((e) =>
        e.includes('Missing generated bundle summary: bundles/claude-desktop-manual/references/skills/blendops-help.md'),
      ),
      true,
    );

    generateBundleReferenceSummaries(tempRoot);
    fs.unlinkSync(
      path.join(tempRoot, PORTABLE_PACKAGE_REFS_REL_DIR, 'skill-blendops-help.md'),
    );
    const resB = checkBundleReferenceSummaries(tempRoot);
    assert.equal(resB.ok, false);
    assert.equal(
      resB.errors.some((e) =>
        e.includes('Missing generated bundle summary: bundles/skill-package/blendops/references/skill-blendops-help.md'),
      ),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 12: Check mode detects a stale or manually modified generated summary', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const targetFile = path.join(
      tempRoot,
      PORTABLE_PACKAGE_REFS_REL_DIR,
      'skill-acceptance-criteria-builder.md',
    );
    const original = fs.readFileSync(targetFile, 'utf8');
    fs.writeFileSync(targetFile, `${original}\n<!-- manual drift -->\n`, 'utf8');

    const res = checkBundleReferenceSummaries(tempRoot);
    assert.equal(res.ok, false);
    assert.equal(
      res.errors.some((e) =>
        e.includes(
          'Stale or manually modified bundle summary: bundles/skill-package/blendops/references/skill-acceptance-criteria-builder.md',
        ),
      ),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 13: Check mode detects an unexpected extra skill-*.md or skills/*.md file without misclassifying skill-map.md', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const baseCheck = checkBundleReferenceSummaries(tempRoot);
    assert.equal(baseCheck.ok, true, `Baseline check failed: ${baseCheck.errors.join('; ')}`);

    const roguePortable = path.join(
      tempRoot,
      PORTABLE_PACKAGE_REFS_REL_DIR,
      'skill-rogue-extra.md',
    );
    const rogueClaude = path.join(
      tempRoot,
      CLAUDE_DESKTOP_SKILLS_REL_DIR,
      'rogue-extra.md',
    );
    fs.writeFileSync(roguePortable, '# rogue\n', 'utf8');
    fs.writeFileSync(rogueClaude, '# rogue\n', 'utf8');

    const failCheck = checkBundleReferenceSummaries(tempRoot);
    assert.equal(failCheck.ok, false);
    assert.equal(
      failCheck.errors.some((e) => e.includes('skill-rogue-extra.md')),
      true,
    );
    assert.equal(
      failCheck.errors.some((e) => e.includes('rogue-extra.md')),
      true,
    );
    assert.equal(
      failCheck.errors.some((e) => e.includes('skill-map.md')),
      false,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 14: Bundle manifest check verifies completeness, uniqueness, and preservation of unrelated entries', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const manifestPath = path.join(tempRoot, CLAUDE_DESKTOP_MANIFEST_REL_PATH);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const skillEntries = manifest.files.filter((f) => f.path.startsWith('references/skills/'));
    assert.equal(skillEntries.length, 48);
    const nonSkillPaths = manifest.files
      .filter((f) => !f.path.startsWith('references/skills/'))
      .map((f) => f.path);
    assert.deepEqual(nonSkillPaths, [
      'README.md',
      'IMPORT_STEPS.md',
      'SKILL.md',
      'BLENDOPS_SINGLE_FILE.md',
      'references/skill-map.md',
      'references/runtime-stacks.md',
      'references/evidence-rules.md',
      'references/install-boundary.md',
      'references/laws/evidence-before-done.md',
      'references/laws/official-runtime-only.md',
      'references/laws/no-arbitrary-python-interface.md',
      'references/laws/non-blender-user-language.md',
      'references/packs/product-hero-v0.md',
      'INSTALL_REPORT_TEMPLATE.md',
      'manifest.json',
    ]);

    const mutated = structuredClone(manifest);
    mutated.files = mutated.files.filter(
      (f) => f.path !== 'references/skills/blendops-help.md',
    );
    mutated.files.push({
      path: 'references/skills/acceptance-criteria-builder.md',
      purpose: 'Duplicate entry',
    });
    mutated.files.push({
      path: 'references/skills/stale-deleted-skill.md',
      purpose: 'Stale entry',
    });
    fs.writeFileSync(manifestPath, JSON.stringify(mutated, null, 2), 'utf8');

    const checkRes = checkBundleReferenceSummaries(tempRoot);
    assert.equal(checkRes.ok, false);
    assert.equal(
      checkRes.errors.some((e) =>
        e.includes('Missing generated skill summary entry in bundles/claude-desktop-manual/manifest.json: "references/skills/blendops-help.md"'),
      ),
      true,
    );
    assert.equal(
      checkRes.errors.some((e) =>
        e.includes('Duplicate generated skill summary entry in bundles/claude-desktop-manual/manifest.json: "references/skills/acceptance-criteria-builder.md"'),
      ),
      true,
    );
    assert.equal(
      checkRes.errors.some((e) =>
        e.includes('Stale or unknown skill summary entry in bundles/claude-desktop-manual/manifest.json: "references/skills/stale-deleted-skill.md"'),
      ),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 15: Repeat builds are byte-identical across all 96 generated summaries and manifest.json', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const firstBuild = generateBundleReferenceSummaries(tempRoot);
    assert.equal(firstBuild.ok, true);

    const snapshotA = new Map();
    for (const rel of [...firstBuild.writtenFiles, CLAUDE_DESKTOP_MANIFEST_REL_PATH]) {
      snapshotA.set(rel, fs.readFileSync(path.join(tempRoot, rel)));
    }

    const secondBuild = generateBundleReferenceSummaries(tempRoot);
    assert.equal(secondBuild.ok, true);

    for (const [rel, bufA] of snapshotA.entries()) {
      const bufB = fs.readFileSync(path.join(tempRoot, rel));
      assert.equal(
        Buffer.compare(bufA, bufB),
        0,
        `Byte mismatch on repeat build for ${rel}`,
      );
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 16: Check mode is strictly read-only and never modifies files on disk', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const targetPath = path.join(
      tempRoot,
      CLAUDE_DESKTOP_SKILLS_REL_DIR,
      'blendops-help.md',
    );
    const driftedContent = '# manually drifted content\n';
    fs.writeFileSync(targetPath, driftedContent, 'utf8');

    const checkRes = checkBundleReferenceSummaries(tempRoot);
    assert.equal(checkRes.ok, false);

    assert.equal(fs.readFileSync(targetPath, 'utf8'), driftedContent);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 17: Path-traversal protection rejects out-of-root paths and invalid skill IDs', () => {
  assert.throws(
    () => assertSafePathWithinRoot(path.join(root, '..', 'outside-file.md'), root),
    /Unsafe path outside repository root rejected/,
  );
  assert.throws(
    () => assertSafePathWithinRoot(root, root),
    /Unsafe path outside repository root rejected/,
  );

  const traversalRes = loadAndValidateSkillSourcePair(
    '../outside',
    new Set(['blendops-help']),
    root,
  );
  assert.equal(traversalRes.ok, false);
  assert.match(traversalRes.errors[0], /Unsafe or invalid skill ID/);
});

test('Scenario 18: Generated summaries contain zero timestamps, ISO dates, or random UUIDs', () => {
  const plan = computeBundleSummaryPlan(root);
  assert.equal(plan.ok, true);

  const isoTimestampRe = /\b20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  const uuidRe = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

  for (const [relPath] of plan.expectedFiles.entries()) {
    const content = fs.readFileSync(path.join(root, relPath), 'utf8');
    assert.equal(
      isoTimestampRe.test(content),
      false,
      `Unexpected ISO timestamp in ${relPath}`,
    );
    assert.equal(
      uuidRe.test(content),
      false,
      `Unexpected UUID in ${relPath}`,
    );
  }
});

test('Scenario 19: Every generated summary begins with the canonical generated-file notice', () => {
  const plan = computeBundleSummaryPlan(root);
  assert.equal(plan.ok, true);

  for (const model of plan.models) {
    const expectedNotice = buildGeneratedFileNotice(model.id);
    for (const relPath of [
      `${CLAUDE_DESKTOP_SKILLS_REL_DIR}/${model.id}.md`,
      `${PORTABLE_PACKAGE_REFS_REL_DIR}/skill-${model.id}.md`,
    ]) {
      const content = fs.readFileSync(path.join(root, relPath), 'utf8');
      assert.equal(
        content.startsWith(`${expectedNotice}\n`),
        true,
        `Missing or malformed generated-file notice at top of ${relPath}`,
      );
    }
  }
});

test('Scenario 20: CLI check and build modes return non-zero exit codes on invalid sources and preserve existing bundle maps/policies/references', () => {
  for (const preservedRel of PRESERVED_BUNDLE_FILES) {
    assert.equal(
      fs.existsSync(path.join(root, preservedRel)),
      true,
      `Preserved bundle file missing: ${preservedRel}`,
    );
  }
  const docsCheck = runDocsCheck(root);
  assert.equal(docsCheck.ok, true, `runDocsCheck failed: ${docsCheck.errors.join('; ')}`);

  const cleanCli = spawnSync(process.execPath, [generatorScript, '--check'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(cleanCli.status, 0, `CLI --check failed: ${cleanCli.stderr}`);
  assert.match(cleanCli.stdout, /bundles:summaries:check passed/);

  const tempRoot = createIsolatedFixtureRepo();
  try {
    fs.unlinkSync(path.join(tempRoot, 'skills', 'blendops-help', 'contract.json'));

    const badBuildCli = spawnSync(
      process.execPath,
      [generatorScript, '--root', tempRoot],
      { cwd: root, encoding: 'utf8' },
    );
    assert.notEqual(badBuildCli.status, 0);
    assert.match(badBuildCli.stderr, /bundles:summaries:build failed/);

    const badCheckCli = spawnSync(
      process.execPath,
      [generatorScript, '--check', `--root=${tempRoot}`],
      { cwd: root, encoding: 'utf8' },
    );
    assert.notEqual(badCheckCli.status, 0);
    assert.match(badCheckCli.stderr, /bundles:summaries:check failed/);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

// ============================================================================
// Phase 8.1 Regression Scenarios (21 through 35)
// ============================================================================

test('Scenario 21 (Phase 8.1 #1 & #2): Handoff condition when.all and when.any modes plus every predicate field, operator, and scalar/array/boolean value are preserved in both profiles across all 48 skills', () => {
  const discovery = discoverCanonicalSkillIds(root);
  assert.equal(discovery.ok, true);

  let observedWhenAllCount = 0;
  let observedWhenAnyCount = 0;
  let observedArrayValuePredicates = 0;
  let observedBooleanValuePredicates = 0;
  let observedStringValuePredicates = 0;
  let observedNotEqualsPredicates = 0;

  for (const skillId of discovery.skillIds) {
    const contract = JSON.parse(
      fs.readFileSync(path.join(root, 'skills', skillId, 'contract.json'), 'utf8'),
    );
    const claudeMd = fs.readFileSync(
      path.join(root, CLAUDE_DESKTOP_SKILLS_REL_DIR, `${skillId}.md`),
      'utf8',
    );
    const portableMd = fs.readFileSync(
      path.join(root, PORTABLE_PACKAGE_REFS_REL_DIR, `skill-${skillId}.md`),
      'utf8',
    );

    const claudeExtracted = extractSummaryRoutingSemantics(claudeMd);
    const portableExtracted = extractSummaryRoutingSemantics(portableMd);

    assert.equal(claudeExtracted.handoffs.length, contract.handoffs.length);
    assert.equal(portableExtracted.handoffs.length, contract.handoffs.length);

    for (let i = 0; i < contract.handoffs.length; i++) {
      const canonicalHandoff = contract.handoffs[i];
      const claudeHandoff = claudeExtracted.handoffs[i];
      const portableHandoff = portableExtracted.handoffs[i];

      assert.equal(claudeHandoff.target, canonicalHandoff.target);
      assert.equal(claudeHandoff.type, canonicalHandoff.type);
      assert.equal(claudeHandoff.label, canonicalHandoff.label);
      assert.deepEqual(
        claudeHandoff.when,
        canonicalHandoff.when,
        `Claude Desktop summary for ${skillId} handoffs[${i}] lost when semantics`,
      );

      assert.equal(portableHandoff.target, canonicalHandoff.target);
      assert.equal(portableHandoff.type, canonicalHandoff.type);
      assert.equal(portableHandoff.label, canonicalHandoff.label);
      assert.deepEqual(
        portableHandoff.when,
        canonicalHandoff.when,
        `Portable package summary for ${skillId} handoffs[${i}] lost when semantics`,
      );

      if (canonicalHandoff.when.all) observedWhenAllCount++;
      if (canonicalHandoff.when.any) observedWhenAnyCount++;
      const preds = canonicalHandoff.when.all || canonicalHandoff.when.any || [];
      for (const p of preds) {
        if (Array.isArray(p.value)) observedArrayValuePredicates++;
        else if (typeof p.value === 'boolean') observedBooleanValuePredicates++;
        else if (typeof p.value === 'string') observedStringValuePredicates++;
        if (p.operator === 'not_equals') observedNotEqualsPredicates++;
      }
    }
  }

  assert.ok(observedWhenAllCount > 300, 'Expected > 300 when.all handoffs across catalog');
  assert.ok(observedWhenAnyCount >= 3, 'Expected >= 3 when.any handoffs across catalog');
  assert.ok(observedArrayValuePredicates >= 4, 'Expected array-valued in/not_in predicates');
  assert.ok(observedBooleanValuePredicates > 50, 'Expected boolean-valued predicates');
  assert.ok(observedStringValuePredicates > 100, 'Expected string-valued predicates');
  assert.ok(observedNotEqualsPredicates >= 10, 'Expected not_equals predicates');
});

test('Scenario 22 (Phase 8.1 #3): Routing participant activationGate fields (goalClarity, recipeSelected, preflightPassed, hasStageOrArtifactInventory) are preserved in both profiles for all 4 routers', () => {
  const discovery = discoverCanonicalSkillIds(root);
  assert.equal(discovery.ok, true);

  let routerCount = 0;
  for (const skillId of discovery.skillIds) {
    const contract = JSON.parse(
      fs.readFileSync(path.join(root, 'skills', skillId, 'contract.json'), 'utf8'),
    );
    const claudeMd = fs.readFileSync(
      path.join(root, CLAUDE_DESKTOP_SKILLS_REL_DIR, `${skillId}.md`),
      'utf8',
    );
    const portableMd = fs.readFileSync(
      path.join(root, PORTABLE_PACKAGE_REFS_REL_DIR, `skill-${skillId}.md`),
      'utf8',
    );

    const claudeExtracted = extractSummaryRoutingSemantics(claudeMd);
    const portableExtracted = extractSummaryRoutingSemantics(portableMd);

    if (ROUTING_PARTICIPANT_IDS.has(skillId)) {
      routerCount++;
      assert.ok(contract.routingPrecedence, `Expected routingPrecedence in ${skillId}`);
      assert.deepEqual(
        claudeExtracted.routingPrecedence,
        contract.routingPrecedence,
        `Claude Desktop summary for ${skillId} did not preserve full routingPrecedence.activationGate`,
      );
      assert.deepEqual(
        portableExtracted.routingPrecedence,
        contract.routingPrecedence,
        `Portable package summary for ${skillId} did not preserve full routingPrecedence.activationGate`,
      );
    } else {
      assert.equal(claudeExtracted.routingPrecedence, null);
      assert.equal(portableExtracted.routingPrecedence, null);
    }
  }
  assert.equal(routerCount, 4);
});

test('Scenario 23 (Phase 8.1 #4): retryPolicy.maxAttempts and retryPolicy.exitCondition are preserved in both profiles when present', () => {
  const discovery = discoverCanonicalSkillIds(root);
  assert.equal(discovery.ok, true);

  let retryHandoffCount = 0;
  for (const skillId of discovery.skillIds) {
    const contract = JSON.parse(
      fs.readFileSync(path.join(root, 'skills', skillId, 'contract.json'), 'utf8'),
    );
    const claudeMd = fs.readFileSync(
      path.join(root, CLAUDE_DESKTOP_SKILLS_REL_DIR, `${skillId}.md`),
      'utf8',
    );
    const portableMd = fs.readFileSync(
      path.join(root, PORTABLE_PACKAGE_REFS_REL_DIR, `skill-${skillId}.md`),
      'utf8',
    );

    const claudeExtracted = extractSummaryRoutingSemantics(claudeMd);
    const portableExtracted = extractSummaryRoutingSemantics(portableMd);

    for (let i = 0; i < contract.handoffs.length; i++) {
      const canonicalHandoff = contract.handoffs[i];
      if (canonicalHandoff.type === 'retry') {
        retryHandoffCount++;
        assert.ok(canonicalHandoff.retryPolicy);
        assert.deepEqual(
          claudeExtracted.handoffs[i].retryPolicy,
          canonicalHandoff.retryPolicy,
          `Claude summary for ${skillId} handoffs[${i}] lost retryPolicy.exitCondition`,
        );
        assert.deepEqual(
          portableExtracted.handoffs[i].retryPolicy,
          canonicalHandoff.retryPolicy,
          `Portable summary for ${skillId} handoffs[${i}] lost retryPolicy.exitCondition`,
        );
      } else {
        assert.equal(claudeExtracted.handoffs[i].retryPolicy, undefined);
        assert.equal(portableExtracted.handoffs[i].retryPolicy, undefined);
      }
    }
  }
  assert.equal(retryHandoffCount, 4);
});

test('Scenario 24 (Phase 8.1 #5): Malformed or incomplete optional inputs fail closed with a clear diagnostic', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const baseContract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // Case A: null entry in inputs.optional (must not throw TypeError)
    const nullOpt = structuredClone(baseContract);
    nullOpt.inputs.optional = [null];
    fs.writeFileSync(contractPath, JSON.stringify(nullOpt, null, 2), 'utf8');
    const resNull = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resNull.ok, false);
    assert.equal(
      resNull.errors.some((e) => e.includes('Invalid optional input at inputs.optional[0]')),
      true,
    );

    // Case B: missing type in inputs.optional[0]
    const missingTypeOpt = structuredClone(baseContract);
    missingTypeOpt.inputs.optional = [
      { name: 'opt_context', description: 'Valid description without type' },
    ];
    fs.writeFileSync(contractPath, JSON.stringify(missingTypeOpt, null, 2), 'utf8');
    const resNoType = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resNoType.ok, false);
    assert.equal(
      resNoType.errors.some((e) => e.includes('Invalid or missing "type" at inputs.optional[0]')),
      true,
    );

    // Case C: missing description in inputs.optional[0]
    const missingDescOpt = structuredClone(baseContract);
    missingDescOpt.inputs.optional = [{ name: 'opt_context', type: 'object' }];
    fs.writeFileSync(contractPath, JSON.stringify(missingDescOpt, null, 2), 'utf8');
    const resNoDesc = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resNoDesc.ok, false);
    assert.equal(
      resNoDesc.errors.some((e) =>
        e.includes('Invalid or missing "description" at inputs.optional[0]'),
      ),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 25 (Phase 8.1 #6): Missing required input type fails closed instead of defaulting to string', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    delete contract.inputs.required[0].type;
    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const res = generateBundleReferenceSummaries(tempRoot);
    assert.equal(res.ok, false);
    assert.equal(
      res.errors.some((e) =>
        e.includes('Invalid or missing "type" at inputs.required[0]'),
      ),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 26 (Phase 8.1 #7): Missing or invalid version fails closed instead of defaulting to 1.0.0', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const baseContract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // Missing version
    const missingVer = structuredClone(baseContract);
    delete missingVer.version;
    fs.writeFileSync(contractPath, JSON.stringify(missingVer, null, 2), 'utf8');
    const resMissing = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resMissing.ok, false);
    assert.equal(
      resMissing.errors.some((e) => e.includes('Missing or invalid required "version"')),
      true,
    );

    // Invalid semver version
    const badVer = structuredClone(baseContract);
    badVer.version = 'v1.0';
    fs.writeFileSync(contractPath, JSON.stringify(badVer, null, 2), 'utf8');
    const resBad = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resBad.ok, false);
    assert.equal(
      resBad.errors.some((e) => e.includes('Missing or invalid required "version"')),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 27 (Phase 8.1 #8): L4 capability tier fails closed while valid schema tiers (L0, L1, L2, L3) are accepted', () => {
  assert.deepEqual([...VALID_CAPABILITY_TIERS], ['L0', 'L1', 'L2', 'L3']);

  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const baseContract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const catalogSet = new Set(discoverCanonicalSkillIds(tempRoot).skillIds);

    // L0, L1, L2, L3 are accepted by canonical schema
    for (const validTier of ['L0', 'L1', 'L2', 'L3']) {
      const validCopy = structuredClone(baseContract);
      validCopy.capabilityTier = validTier;
      fs.writeFileSync(contractPath, JSON.stringify(validCopy, null, 2), 'utf8');
      const pairRes = loadAndValidateSkillSourcePair('blendops-help', catalogSet, tempRoot);
      assert.equal(
        pairRes.ok,
        true,
        `Expected capabilityTier "${validTier}" to pass validation, got: ${pairRes.errors.join('; ')}`,
      );
      assert.equal(pairRes.model.capabilityTier, validTier);
    }

    // L4 must fail closed
    const invalidL4 = structuredClone(baseContract);
    invalidL4.capabilityTier = 'L4';
    fs.writeFileSync(contractPath, JSON.stringify(invalidL4, null, 2), 'utf8');
    const failL4 = generateBundleReferenceSummaries(tempRoot);
    assert.equal(failL4.ok, false);
    assert.equal(
      failL4.errors.some((e) => e.includes('Unsupported capabilityTier "L4"')),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 28 (Phase 8.1 #9): Symlink escape attempts for source, output, and manifest paths fail closed', () => {
  const tempRoot = createIsolatedFixtureRepo();
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-outside-target-'));
  const outsideFile = path.join(outsideDir, 'outside-secret.md');
  fs.writeFileSync(outsideFile, '# secret outside file\n', 'utf8');

  try {
    // 1. Symlinked source SKILL.md pointing outside rootDir
    const skillMdPath = path.join(tempRoot, 'skills', 'blendops-help', 'SKILL.md');
    const origSkillMd = fs.readFileSync(skillMdPath);
    fs.unlinkSync(skillMdPath);
    fs.symlinkSync(outsideFile, skillMdPath);

    const resSourceSymlink = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resSourceSymlink.ok, false);
    assert.equal(
      resSourceSymlink.errors.some((e) => e.includes('symbolic link')),
      true,
    );
    assert.equal(fs.readFileSync(outsideFile, 'utf8'), '# secret outside file\n');

    // Restore SKILL.md
    fs.unlinkSync(skillMdPath);
    fs.writeFileSync(skillMdPath, origSkillMd);

    // 2. Symlinked output summary file pointing outside rootDir
    const outSummaryPath = path.join(
      tempRoot,
      CLAUDE_DESKTOP_SKILLS_REL_DIR,
      'blendops-help.md',
    );
    const origOutSummary = fs.readFileSync(outSummaryPath);
    fs.unlinkSync(outSummaryPath);
    fs.symlinkSync(outsideFile, outSummaryPath);

    const resOutputSymlink = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resOutputSymlink.ok, false);
    assert.equal(
      resOutputSymlink.errors.some((e) => e.includes('symbolic link')),
      true,
    );
    assert.equal(
      fs.readFileSync(outsideFile, 'utf8'),
      '# secret outside file\n',
      'Outside file must never be overwritten via symlink',
    );

    const checkOutputSymlink = checkBundleReferenceSummaries(tempRoot);
    assert.equal(checkOutputSymlink.ok, false);
    assert.equal(
      checkOutputSymlink.errors.some((e) => e.includes('symbolic link')),
      true,
    );

    // Restore output summary
    fs.unlinkSync(outSummaryPath);
    fs.writeFileSync(outSummaryPath, origOutSummary);

    // 3. Symlinked stale summary file pointing outside rootDir (must not unlink outside target or fail open)
    const staleSymlinkPath = path.join(
      tempRoot,
      CLAUDE_DESKTOP_SKILLS_REL_DIR,
      'stale-symlink-skill.md',
    );
    fs.symlinkSync(outsideFile, staleSymlinkPath);
    const resStaleSymlink = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resStaleSymlink.ok, false);
    assert.equal(
      resStaleSymlink.errors.some((e) => e.includes('symbolic link')),
      true,
    );
    assert.equal(fs.existsSync(outsideFile), true);
    fs.unlinkSync(staleSymlinkPath);

    // 4. Symlinked manifest.json pointing outside rootDir
    const manifestPath = path.join(tempRoot, CLAUDE_DESKTOP_MANIFEST_REL_PATH);
    const origManifest = fs.readFileSync(manifestPath);
    fs.unlinkSync(manifestPath);
    fs.symlinkSync(outsideFile, manifestPath);

    const resManifestSymlink = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resManifestSymlink.ok, false);
    assert.equal(
      resManifestSymlink.errors.some((e) => e.includes('symbolic link')),
      true,
    );
    assert.equal(fs.readFileSync(outsideFile, 'utf8'), '# secret outside file\n');

    fs.unlinkSync(manifestPath);
    fs.writeFileSync(manifestPath, origManifest);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    fs.rmSync(outsideDir, { recursive: true, force: true });
  }
});

test('Scenario 29 (Phase 8.1 #10): Manifest with a null, string, or missing-path entry fails closed without modifying existing files', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const manifestPath = path.join(tempRoot, CLAUDE_DESKTOP_MANIFEST_REL_PATH);
    const baseManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    for (const [label, badEntry] of [
      ['null', null],
      ['string', 'README.md'],
      ['missing-path', { purpose: 'Missing path field' }],
    ]) {
      const badManifest = structuredClone(baseManifest);
      badManifest.files.splice(2, 0, badEntry);
      fs.writeFileSync(manifestPath, JSON.stringify(badManifest, null, 2), 'utf8');

      const beforeSnap = snapshotRepoTree(tempRoot);
      const res = generateBundleReferenceSummaries(tempRoot);
      assert.equal(res.ok, false, `Expected manifest with ${label} entry to fail`);
      assert.equal(
        res.errors.some(
          (e) =>
            e.includes('bundles/claude-desktop-manual/manifest.json') &&
            e.includes('files[2]'),
        ),
        true,
        `Expected error naming manifest path and files[2], got: ${res.errors.join('; ')}`,
      );
      const afterSnap = snapshotRepoTree(tempRoot);
      assertSnapshotsEqual(
        beforeSnap,
        afterSnap,
        `Failed build on ${label} manifest entry must not modify any file`,
      );
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 30 (Phase 8.1 #11): Manifest with duplicate paths or malformed JSON fails closed without modifying existing files', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const manifestPath = path.join(tempRoot, CLAUDE_DESKTOP_MANIFEST_REL_PATH);
    const baseManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // 1. Duplicate path in manifest.files
    const dupManifest = structuredClone(baseManifest);
    dupManifest.files.push({
      path: 'README.md',
      purpose: 'Duplicate README entry',
    });
    fs.writeFileSync(manifestPath, JSON.stringify(dupManifest, null, 2), 'utf8');

    const beforeDupSnap = snapshotRepoTree(tempRoot);
    const dupRes = generateBundleReferenceSummaries(tempRoot);
    assert.equal(dupRes.ok, false);
    assert.equal(
      dupRes.errors.some((e) => e.includes('Duplicate manifest entry path "README.md"')),
      true,
    );
    assertSnapshotsEqual(
      beforeDupSnap,
      snapshotRepoTree(tempRoot),
      'Duplicate manifest entry failure must not mutate files',
    );

    // 2. Malformed JSON in manifest.json
    fs.writeFileSync(manifestPath, '{ "bundleId": "broken", ', 'utf8');
    const beforeMalformedSnap = snapshotRepoTree(tempRoot);
    const malformedRes = generateBundleReferenceSummaries(tempRoot);
    assert.equal(malformedRes.ok, false);
    assert.equal(
      malformedRes.errors.some((e) => e.includes('bundles/claude-desktop-manual/manifest.json')),
      true,
    );
    assertSnapshotsEqual(
      beforeMalformedSnap,
      snapshotRepoTree(tempRoot),
      'Malformed manifest JSON failure must not mutate files',
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 31 (Phase 8.1 #12): Aborted builds do not partially write or delete bundle summary files', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    // Seed a stale summary file that would be unlinked on a successful build
    const staleSummaryPath = path.join(
      tempRoot,
      CLAUDE_DESKTOP_SKILLS_REL_DIR,
      'obsolete-old-skill.md',
    );
    fs.writeFileSync(staleSummaryPath, '# obsolete skill summary\n', 'utf8');

    // Break the 48th skill contract (workflow-stage-router) so preflight fails after earlier skills
    const routerContractPath = path.join(
      tempRoot,
      'skills',
      'workflow-stage-router',
      'contract.json',
    );
    const routerContract = JSON.parse(fs.readFileSync(routerContractPath, 'utf8'));
    delete routerContract.routingPrecedence.activationGate.hasStageOrArtifactInventory;
    fs.writeFileSync(routerContractPath, JSON.stringify(routerContract, null, 2), 'utf8');

    const beforeSnap = snapshotRepoTree(tempRoot);
    const res = generateBundleReferenceSummaries(tempRoot);
    assert.equal(res.ok, false);
    assert.equal(res.writtenFiles.length, 0);
    assert.equal(res.removedStaleFiles.length, 0);
    assert.equal(
      res.errors.some((e) => e.includes('hasStageOrArtifactInventory')),
      true,
    );

    // Verify zero files were written or unlinked (including obsolete-old-skill.md)
    assert.equal(fs.existsSync(staleSummaryPath), true);
    assertSnapshotsEqual(
      beforeSnap,
      snapshotRepoTree(tempRoot),
      'Failed build must leave the entire repository tree untouched',
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 32 (Phase 8.1 #13): Existing unrelated bundle files, maps, laws, packs, and templates remain untouched across builds', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const preservedSnapshots = new Map();
    for (const relPath of PRESERVED_BUNDLE_FILES) {
      if (relPath === CLAUDE_DESKTOP_MANIFEST_REL_PATH) continue;
      preservedSnapshots.set(relPath, fs.readFileSync(path.join(tempRoot, relPath)));
    }

    // Also add custom metadata on an unrelated entry in manifest.json and verify it is preserved
    const manifestPath = path.join(tempRoot, CLAUDE_DESKTOP_MANIFEST_REL_PATH);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifest.files[0].customTag = 'preserved-metadata-value';
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    const buildRes = generateBundleReferenceSummaries(tempRoot);
    assert.equal(buildRes.ok, true);

    for (const [relPath, bufBefore] of preservedSnapshots.entries()) {
      const bufAfter = fs.readFileSync(path.join(tempRoot, relPath));
      assert.equal(
        Buffer.compare(bufBefore, bufAfter),
        0,
        `Unrelated bundle file was modified by build: ${relPath}`,
      );
    }

    const updatedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert.equal(updatedManifest.files[0].path, 'README.md');
    assert.equal(updatedManifest.files[0].customTag, 'preserved-metadata-value');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 33 (Phase 8.1 #14): F-09 audit status is OPEN (not FIXED) when either bundle summary directory is missing', () => {
  for (const missingDirRel of [
    CLAUDE_DESKTOP_SKILLS_REL_DIR,
    PORTABLE_PACKAGE_REFS_REL_DIR,
  ]) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase81-f09-audit-'));
    try {
      for (const relDir of [
        path.join('docs', 'audits', 'phase-0'),
        'registry',
        'evals',
        'schemas',
        'skills',
        'bundles',
      ]) {
        fs.cpSync(path.join(root, relDir), path.join(tempDir, relDir), { recursive: true });
      }
      // Remove one of the two required bundle summary directories
      fs.rmSync(path.join(tempDir, missingDirRel), { recursive: true, force: true });

      fs.writeFileSync(
        path.join(tempDir, AUDITED_INPUTS_MANIFEST_REL),
        JSON.stringify(
          {
            schemaVersion: '1.0.0',
            requiredFiles: [AUDITED_INPUTS_MANIFEST_REL],
            requiredDirectories: [
              'docs/audits/phase-0',
              'registry',
              'evals',
              'schemas',
              'skills',
            ],
          },
          null,
          2,
        ) + '\n',
        'utf8',
      );

      execFileSync('git', ['init', '-b', 'main'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.name', 'Temp Audit Tester'], { cwd: tempDir });
      execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: tempDir });
      execFileSync('git', ['add', '.'], { cwd: tempDir });
      execFileSync('git', ['commit', '-m', 'Initial temp commit'], { cwd: tempDir });

      const auditRes = generateCurrentAuditArtifacts(tempDir);
      const f03 = auditRes.findings.findings.find((f) => f.id === 'F-03');
      const f09 = auditRes.findings.findings.find((f) => f.id === 'F-09');
      assert.equal(f03?.currentLifecycleStatus, 'FIXED');
      assert.equal(
        f09?.currentLifecycleStatus,
        'OPEN',
        `Expected F-09 to be OPEN when ${missingDirRel} is missing, got ${f09?.currentLifecycleStatus}`,
      );
      const p8 = auditRes.currentScorecard.pillars.find(
        (p) => p.id === 'pillar-8-documentation-and-ux',
      );
      assert.equal(p8?.measuredScore, 4.5);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('Scenario 34 (Phase 8.1 #15): Both profiles remain 100% semantically equivalent to each other and to contract.json across all 48 skills', () => {
  const discovery = discoverCanonicalSkillIds(root);
  assert.equal(discovery.ok, true);

  for (const skillId of discovery.skillIds) {
    const contract = JSON.parse(
      fs.readFileSync(path.join(root, 'skills', skillId, 'contract.json'), 'utf8'),
    );
    const claudeMd = fs.readFileSync(
      path.join(root, CLAUDE_DESKTOP_SKILLS_REL_DIR, `${skillId}.md`),
      'utf8',
    );
    const portableMd = fs.readFileSync(
      path.join(root, PORTABLE_PACKAGE_REFS_REL_DIR, `skill-${skillId}.md`),
      'utf8',
    );

    const claudeSemantics = extractSummaryRoutingSemantics(claudeMd);
    const portableSemantics = extractSummaryRoutingSemantics(portableMd);

    assert.deepEqual(
      claudeSemantics,
      portableSemantics,
      `Profile A and Profile B routing/handoff semantics diverged for ${skillId}`,
    );

    const expectedSemantics = {
      routingPrecedence: contract.routingPrecedence || null,
      handoffs: contract.handoffs.map((h) => {
        const item = {
          target: h.target,
          type: h.type,
          label: h.label,
          when: h.when,
        };
        if (h.retryPolicy) {
          item.retryPolicy = h.retryPolicy;
        }
        return item;
      }),
    };

    assert.deepEqual(
      claudeSemantics,
      expectedSemantics,
      `Generated summary semantics diverged from skills/${skillId}/contract.json`,
    );
  }
});

test('Scenario 35: Contract validation rejects malformed handoff when conditions, missing retryPolicy on retry handoffs, and unexpected retryPolicy on non-retry handoffs', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const baseContract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    // 1. Missing handoff.when
    const noWhen = structuredClone(baseContract);
    delete noWhen.handoffs[0].when;
    fs.writeFileSync(contractPath, JSON.stringify(noWhen, null, 2), 'utf8');
    const resNoWhen = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resNoWhen.ok, false);
    assert.equal(
      resNoWhen.errors.some((e) => e.includes('handoffs[0].when')),
      true,
    );

    // 2. Retry handoff without retryPolicy
    const retryNoPolicy = structuredClone(baseContract);
    retryNoPolicy.handoffs[0].type = 'retry';
    fs.writeFileSync(contractPath, JSON.stringify(retryNoPolicy, null, 2), 'utf8');
    const resRetryNoPolicy = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resRetryNoPolicy.ok, false);
    assert.equal(
      resRetryNoPolicy.errors.some((e) =>
        e.includes('Missing required "retryPolicy" for retry handoff at handoffs[0]'),
      ),
      true,
    );

    // 3. Non-retry handoff with retryPolicy
    const nonRetryWithPolicy = structuredClone(baseContract);
    nonRetryWithPolicy.handoffs[0].retryPolicy = {
      maxAttempts: 2,
      exitCondition: {
        all: [{ field: 'quality.verdict', operator: 'equals', value: 'Pass' }],
      },
    };
    fs.writeFileSync(contractPath, JSON.stringify(nonRetryWithPolicy, null, 2), 'utf8');
    const resNonRetryPolicy = generateBundleReferenceSummaries(tempRoot);
    assert.equal(resNonRetryPolicy.ok, false);
    assert.equal(
      resNonRetryPolicy.errors.some((e) =>
        e.includes('Unexpected "retryPolicy" on non-retry handoff'),
      ),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

// ============================================================================
// Phase 8.1.1 Regression Scenarios (36 through 41)
// ============================================================================

test('Scenario 36 (Phase 8.1.1 Fix A): Condition expressions with single/multiple semicolons, escaped quotes, backslashes, Unicode, and array elements survive formatter -> summary -> extractor round trips in both profiles', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));

    contract.handoffs = [
      {
        target: 'recipe-fit-assessor',
        type: 'progression',
        label: 'Single semicolon string predicate in when.all',
        when: {
          all: [{ field: 'stage.status', operator: 'equals', value: 'ready;approved' }],
        },
      },
      {
        target: 'pack-prerequisite-checker',
        type: 'conditional',
        label: 'Multiple semicolons, escaped quotes, backslashes, and Unicode in when.any',
        when: {
          any: [
            {
              field: 'review.note',
              operator: 'equals',
              value: 'draft; pending; review',
            },
            {
              field: 'asset.path',
              operator: 'not_equals',
              value: 'C:\\scenes\\hero;v2\\"quoted;segment"\\final\\\\',
            },
            {
              field: 'locale.tag',
              operator: 'equals',
              value: '日本語;テスト — café;v1 🎯',
            },
          ],
        },
      },
      {
        target: 'workflow-stage-router',
        type: 'conditional',
        label: 'Array values with semicolons and mixed multi-predicate when.all',
        when: {
          all: [
            {
              field: 'stage.phase',
              operator: 'in',
              value: [
                'ready;approved',
                'draft; pending; review',
                'quote:"a;b"\\path;ok',
              ],
            },
            {
              field: 'runtime.ready',
              operator: 'equals',
              value: true,
            },
            {
              field: 'quality.flags',
              operator: 'not_in',
              value: ['blocked;critical', 'failed;retry;later'],
            },
          ],
        },
      },
      {
        target: 'blender-troubleshooting',
        type: 'retry',
        label: 'Retry handoff with semicolon strings in both when.any and exitCondition.all',
        when: {
          any: [
            {
              field: 'bridge.error',
              operator: 'equals',
              value: 'timeout;connection_reset;retryable',
            },
            {
              field: 'bridge.code',
              operator: 'in',
              value: ['ECONNRESET;502', 'ETIMEDOUT;504'],
            },
          ],
        },
        retryPolicy: {
          maxAttempts: 3,
          exitCondition: {
            all: [
              {
                field: 'bridge.status',
                operator: 'equals',
                value: 'connected;verified',
              },
              {
                field: 'bridge.healthy',
                operator: 'exists',
                value: true,
              },
            ],
          },
        },
      },
    ];

    fs.writeFileSync(contractPath, JSON.stringify(contract, null, 2), 'utf8');

    const buildRes = generateBundleReferenceSummaries(tempRoot);
    assert.equal(
      buildRes.ok,
      true,
      `Expected build with semicolon condition values to succeed, got: ${buildRes.errors.join('; ')}`,
    );

    const checkRes = checkBundleReferenceSummaries(tempRoot);
    assert.equal(checkRes.ok, true, `Check mode failed: ${checkRes.errors.join('; ')}`);

    const claudeMd = fs.readFileSync(
      path.join(tempRoot, CLAUDE_DESKTOP_SKILLS_REL_DIR, 'blendops-help.md'),
      'utf8',
    );
    const portableMd = fs.readFileSync(
      path.join(tempRoot, PORTABLE_PACKAGE_REFS_REL_DIR, 'skill-blendops-help.md'),
      'utf8',
    );

    const claudeSemantics = extractSummaryRoutingSemantics(claudeMd);
    const portableSemantics = extractSummaryRoutingSemantics(portableMd);

    assert.deepEqual(claudeSemantics, portableSemantics);
    assert.deepEqual(claudeSemantics.handoffs, contract.handoffs);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 37 (Phase 8.1.1 Fix A): Malformed condition expressions are rejected with actionable diagnostics and never use unsafe evaluation', () => {
  // 1. Empty expression
  assert.throws(
    () => parseConditionGroupExpression('all', '   '),
    /expected at least one predicate/,
  );

  // 2. Invalid condition mode
  assert.throws(
    () => parseConditionGroupExpression('none', 'stage.status equals "ready"'),
    /Invalid condition group mode "none"/,
  );

  // 3. Unterminated JSON string literal
  assert.throws(
    () => parseConditionGroupExpression('all', 'stage.status equals "ready;unterminated'),
    /unterminated JSON string literal/,
  );

  // 4. Trailing semicolon / empty predicate segment
  assert.throws(
    () => parseConditionGroupExpression('all', 'stage.status equals "ready"; '),
    /trailing semicolon or empty predicate/,
  );
  assert.throws(
    () =>
      parseConditionGroupExpression(
        'all',
        'stage.status equals "ready"; ; runtime.ready equals true',
      ),
    /empty predicate segment/,
  );

  // 5. Unbalanced brackets
  assert.throws(
    () => parseConditionGroupExpression('any', 'stage.status in ["ready;a", "b"'),
    /unbalanced brackets/,
  );
  assert.throws(
    () => parseConditionGroupExpression('any', 'stage.status in "ready"]'),
    /unexpected closing bracket/,
  );

  // 6. Malformed JSON value or invalid operator value type
  assert.throws(
    () => parseConditionGroupExpression('all', 'stage.status equals invalid_json'),
    /Malformed JSON value/,
  );
  assert.throws(
    () => parseConditionGroupExpression('all', 'stage.status in "not-an-array"'),
    /expected non-empty array of scalar values/,
  );
  assert.throws(
    () => parseConditionGroupExpression('all', 'stage.status exists "yes"'),
    /expected boolean/,
  );

  // 7. Formatted condition group round-trip check
  const group = {
    any: [
      { field: 'a.b', operator: 'equals', value: 'x;y;z' },
      { field: 'c.d', operator: 'in', value: ['p;q', 'r;"s";t'] },
    ],
  };
  const formatted = formatConditionGroupExpression(group, 'when');
  const innerMatch = formatted.match(/^`when\.(all|any): \[([\s\S]+)\]`$/);
  assert.ok(innerMatch);
  assert.deepEqual(parseConditionGroupExpression(innerMatch[1], innerMatch[2]), group);
});

test('Scenario 38 (Phase 8.1.1 Fix B): Routing precedence rank boundaries (1, 4, 100 accepted; 0, 101, non-integer rejected) match canonical schema', () => {
  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const baseContract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const catalogSet = new Set(discoverCanonicalSkillIds(tempRoot).skillIds);

    // Ranks 1, 4, and 100 must be accepted and survive summary rendering + extraction
    for (const validRank of [1, 4, 100]) {
      const candidate = structuredClone(baseContract);
      candidate.routingPrecedence.rank = validRank;
      fs.writeFileSync(contractPath, JSON.stringify(candidate, null, 2), 'utf8');

      const res = loadAndValidateSkillSourcePair('blendops-help', catalogSet, tempRoot);
      assert.equal(
        res.ok,
        true,
        `Expected rank ${validRank} to be accepted, got errors: ${res.errors.join('; ')}`,
      );
      assert.equal(res.model.routingPrecedence.rank, validRank);

      const claudeMd = renderClaudeDesktopSummary(res.model);
      const portableMd = renderPortablePackageSummary(res.model);
      assert.equal(extractSummaryRoutingSemantics(claudeMd).routingPrecedence.rank, validRank);
      assert.equal(extractSummaryRoutingSemantics(portableMd).routingPrecedence.rank, validRank);
    }

    // Ranks 0, 101, and non-integers must be rejected
    for (const invalidRank of [0, 101, -1, 2.5, '4', null]) {
      const candidate = structuredClone(baseContract);
      candidate.routingPrecedence.rank = invalidRank;
      fs.writeFileSync(contractPath, JSON.stringify(candidate, null, 2), 'utf8');

      const res = loadAndValidateSkillSourcePair('blendops-help', catalogSet, tempRoot);
      assert.equal(res.ok, false, `Expected invalid rank ${JSON.stringify(invalidRank)} to fail`);
      assert.equal(
        res.errors.some((e) => e.includes('Invalid routingPrecedence.rank')),
        true,
        `Expected rank diagnostic for ${JSON.stringify(invalidRank)}, got: ${res.errors.join('; ')}`,
      );
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 39 (Phase 8.1.1 Fix B): Activation gate goalClarity accepts ambiguous_or_mixed, clear, and any while rejecting unsupported values and non-boolean gate fields', () => {
  assert.deepEqual(
    [...VALID_GATE_GOAL_CLARITIES],
    ['ambiguous_or_mixed', 'clear', 'any'],
  );

  const tempRoot = createIsolatedFixtureRepo();
  try {
    const contractPath = path.join(tempRoot, 'skills', 'blendops-help', 'contract.json');
    const baseContract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const catalogSet = new Set(discoverCanonicalSkillIds(tempRoot).skillIds);

    for (const validClarity of ['ambiguous_or_mixed', 'clear', 'any']) {
      const candidate = structuredClone(baseContract);
      candidate.routingPrecedence.activationGate.goalClarity = validClarity;
      fs.writeFileSync(contractPath, JSON.stringify(candidate, null, 2), 'utf8');

      const res = loadAndValidateSkillSourcePair('blendops-help', catalogSet, tempRoot);
      assert.equal(
        res.ok,
        true,
        `Expected goalClarity "${validClarity}" to be accepted, got: ${res.errors.join('; ')}`,
      );
      assert.equal(res.model.routingPrecedence.activationGate.goalClarity, validClarity);

      const claudeMd = renderClaudeDesktopSummary(res.model);
      const portableMd = renderPortablePackageSummary(res.model);
      assert.equal(
        extractSummaryRoutingSemantics(claudeMd).routingPrecedence.activationGate.goalClarity,
        validClarity,
      );
      assert.equal(
        extractSummaryRoutingSemantics(portableMd).routingPrecedence.activationGate.goalClarity,
        validClarity,
      );
    }

    for (const invalidClarity of ['unknown_clarity', '', 'mixed', null, true]) {
      const candidate = structuredClone(baseContract);
      candidate.routingPrecedence.activationGate.goalClarity = invalidClarity;
      fs.writeFileSync(contractPath, JSON.stringify(candidate, null, 2), 'utf8');

      const res = loadAndValidateSkillSourcePair('blendops-help', catalogSet, tempRoot);
      assert.equal(
        res.ok,
        false,
        `Expected invalid goalClarity ${JSON.stringify(invalidClarity)} to fail`,
      );
      assert.equal(
        res.errors.some((e) =>
          e.includes('Invalid routingPrecedence.activationGate.goalClarity'),
        ),
        true,
      );
    }

    // Strict boolean checks and unexpected property checks remain enforced
    const badBool = structuredClone(baseContract);
    badBool.routingPrecedence.activationGate.recipeSelected = 'true';
    badBool.routingPrecedence.activationGate.extraGateFlag = true;
    badBool.routingPrecedence.extraTopFlag = true;
    fs.writeFileSync(contractPath, JSON.stringify(badBool, null, 2), 'utf8');
    const resBadBool = loadAndValidateSkillSourcePair('blendops-help', catalogSet, tempRoot);
    assert.equal(resBadBool.ok, false);
    assert.equal(
      resBadBool.errors.some((e) =>
        e.includes('Invalid routingPrecedence.activationGate.recipeSelected'),
      ),
      true,
    );
    assert.equal(
      resBadBool.errors.some((e) =>
        e.includes('Unknown property "routingPrecedence.activationGate.extraGateFlag"'),
      ),
      true,
    );
    assert.equal(
      resBadBool.errors.some((e) =>
        e.includes('Unknown property "routingPrecedence.extraTopFlag"'),
      ),
      true,
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test('Scenario 40 (Phase 8.1.1 Fix C): dev-server.mjs uses a single canonical bundle filename consistently across suggestedName, download attribute, PowerShell command, /api/bundle-info, and Content-Disposition while preserving Phase 8.1.1 compatibility routes', () => {
  const devServerPath = path.join(root, 'scripts', 'dev-server.mjs');
  const devServerSource = fs.readFileSync(devServerPath, 'utf8');

  assert.match(
    devServerSource,
    /export const CANONICAL_BUNDLE_FILENAME = 'blendops-phase-9\.bundle';/,
    'CANONICAL_BUNDLE_FILENAME must be defined once as the single source of truth',
  );
  assert.match(
    devServerSource,
    /suggestedName:\s*'\$\{CANONICAL_BUNDLE_FILENAME\}'/,
    'showSaveFilePicker.suggestedName must use CANONICAL_BUNDLE_FILENAME',
  );
  assert.match(
    devServerSource,
    /a\.download\s*=\s*'\$\{CANONICAL_BUNDLE_FILENAME\}'/,
    'Browser download filename must use CANONICAL_BUNDLE_FILENAME',
  );
  assert.match(
    devServerSource,
    /WriteAllBytes\("\$\{CANONICAL_BUNDLE_FILENAME\}"/,
    'PowerShell Base64 decoder instructions must use CANONICAL_BUNDLE_FILENAME',
  );
  assert.match(
    devServerSource,
    /filename:\s*CANONICAL_BUNDLE_FILENAME/,
    '/api/bundle-info metadata filename must use CANONICAL_BUNDLE_FILENAME',
  );
  assert.match(
    devServerSource,
    /'Content-Disposition':\s*`attachment; filename="\$\{CANONICAL_BUNDLE_FILENAME\}"`/,
    'Content-Disposition header must use CANONICAL_BUNDLE_FILENAME',
  );
  // Ensure compatibility routes for Phase 9, 8.1.1, 8.1, and 8 are preserved
  assert.match(devServerSource, /'\/blendops-phase-9\.bundle'/);
  assert.match(devServerSource, /'\/blendops-phase-8\.1\.1\.bundle'/);
  assert.match(devServerSource, /'\/blendops-phase-8\.1\.bundle'/);
  assert.match(devServerSource, /'\/blendops-phase-8\.bundle'/);

  // Ensure no hardcoded stale suggestedName or active download filename remains
  assert.equal(
    devServerSource.includes("suggestedName: 'blendops-phase-8.bundle'"),
    false,
  );
  assert.equal(
    devServerSource.includes("suggestedName: 'blendops-phase-8.1.bundle'"),
    false,
  );
  assert.equal(
    devServerSource.includes("a.download = 'blendops-phase-8.1.bundle'"),
    false,
  );
});
