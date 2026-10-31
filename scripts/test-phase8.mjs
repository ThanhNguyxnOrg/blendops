import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  EXPECTED_CANONICAL_SKILL_COUNT,
  CLAUDE_DESKTOP_SKILLS_REL_DIR,
  PORTABLE_PACKAGE_REFS_REL_DIR,
  CLAUDE_DESKTOP_MANIFEST_REL_PATH,
  PRESERVED_BUNDLE_FILES,
  assertSafePathWithinRoot,
  buildGeneratedFileNotice,
  discoverCanonicalSkillIds,
  loadAndValidateSkillSourcePair,
  computeBundleSummaryPlan,
  generateBundleReferenceSummaries,
  checkBundleReferenceSummaries,
} from './generate-bundle-reference-summaries.mjs';
import { runDocsCheck } from './check-docs.mjs';

const root = process.cwd();
const generatorScript = path.join(root, 'scripts', 'generate-bundle-reference-summaries.mjs');

function createIsolatedFixtureRepo() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-phase8-test-'));
  for (const dirRel of ['skills', 'bundles']) {
    fs.cpSync(path.join(root, dirRel), path.join(tempRoot, dirRel), { recursive: true });
  }
  return tempRoot;
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

    // Profile A required headings & fields
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

    // Profile B required headings & fields
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

    // Both profiles must contain identical canonical metadata, purpose, triggers, inputs, outputs, exclusions, and handoffs
    for (const token of [
      model.purpose,
      `\`${model.category}\``,
      `\`${model.role}\``,
      `\`${model.capabilityTier}\``,
      ...model.triggers.map((t) => `"${t}"`),
      ...model.inputs.required.map((inp) => `\`${inp.name}\``),
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

    // Profile-specific relative reference conventions
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
    // Baseline check passes with skill-map.md present in both bundles
    const baseCheck = checkBundleReferenceSummaries(tempRoot);
    assert.equal(baseCheck.ok, true, `Baseline check failed: ${baseCheck.errors.join('; ')}`);

    // Add an extra rogue skill-*.md in portable package and skills/rogue.md in Claude Desktop bundle
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
    // Must never misclassify skill-map.md as an unexpected skill summary
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

    // Verify all 48 generated skill paths and unrelated entries exist in the valid manifest
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

    // Mutate manifest to introduce a duplicate entry, a missing entry, and a stale entry
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

    // File on disk must remain untouched by check mode
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
  // Verify all preserved non-skill bundle files exist in the repository and docs:check passes
  for (const preservedRel of PRESERVED_BUNDLE_FILES) {
    assert.equal(
      fs.existsSync(path.join(root, preservedRel)),
      true,
      `Preserved bundle file missing: ${preservedRel}`,
    );
  }
  const docsCheck = runDocsCheck(root);
  assert.equal(docsCheck.ok, true, `runDocsCheck failed: ${docsCheck.errors.join('; ')}`);

  // Verify CLI --check passes on clean repo
  const cleanCli = spawnSync(process.execPath, [generatorScript, '--check'], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(cleanCli.status, 0, `CLI --check failed: ${cleanCli.stderr}`);
  assert.match(cleanCli.stdout, /bundles:summaries:check passed/);

  // Verify CLI --check and build exit non-zero on invalid source in isolated temp repo
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
