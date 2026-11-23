#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  auditLocalDistributionMetadata,
  compareVersions,
  buildDistributionReport,
  manifestDifferences,
  hasSkillsShRoute,
  auditLiveDistributionMetadata,
} from './audit-distribution-metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('local npm and skills.sh source manifests are internally aligned', () => {
  const result = auditLocalDistributionMetadata(root);
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.package.name, 'blendops');
  assert.equal(result.package.version, packageJson.version);
  assert.equal(result.skills.groupCount, 4);
  assert.equal(result.skills.canonicalSkillCount, 15);
});

test('semantic version comparison follows SemVer 2.0.0 prerelease precedence', () => {
  assert.equal(compareVersions('1.0.1', '1.0.0'), 1);
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
  assert.equal(compareVersions('1.0.0', '1.0.1'), -1);
  assert.equal(compareVersions('1.0.0', '1.0.0-beta.1'), 1);
  assert.equal(compareVersions('1.0.0-beta.2', '1.0.0-beta.1'), 1);
  assert.equal(compareVersions('1.0.0-beta.10', '1.0.0-beta.2'), 1);
  assert.equal(compareVersions('1.0.0-beta.2', '1.0.0-beta.10'), -1);
  assert.equal(compareVersions('1.0.0-alpha.beta', '1.0.0-alpha.1'), 1);
  assert.equal(compareVersions('1.0.0-alpha.1', '1.0.0-alpha'), 1);
  assert.equal(compareVersions('not-semver', '1.0.0'), null);
});

test('skills.sh route matching enforces slug boundaries and avoids prefix false positives', async () => {
  const html = '<a href="/ThanhNguyxnOrg/blendops/blendops-done-criteria">Stage Gates</a>';
  assert.equal(hasSkillsShRoute(html, 'blendops-done-criteria'), true);
  assert.equal(hasSkillsShRoute(html, 'stage'), false);

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-dist-audit-'));
  try {
    fs.writeFileSync(
      path.join(tmpRoot, 'package.json'),
      JSON.stringify({ name: 'blendops', version: '1.0.0' }),
    );
    fs.writeFileSync(path.join(tmpRoot, 'README.md'), '# BlendOps\n');
    fs.writeFileSync(
      path.join(tmpRoot, 'skills.sh.json'),
      JSON.stringify({
        groupings: [
          {
            title: 'Stage Gates',
            skills: ['stage', 'blendops-done-criteria'],
          },
        ],
      }),
    );

    const live = await auditLiveDistributionMetadata(tmpRoot, async (url) => {
      const parsed = new URL(String(url));
      if (parsed.hostname === 'registry.npmjs.org') {
        return {
          ok: true,
          text: async () => JSON.stringify({
            'dist-tags': { latest: '1.0.0' },
            versions: { '1.0.0': { name: 'blendops', version: '1.0.0' } },
          }),
        };
      }
      return {
        ok: true,
        text: async () => '<a href="/ThanhNguyxnOrg/blendops/blendops-done-criteria">Stage Gates</a>',
      };
    });
    assert.deepEqual(live.skillsSh.missingGroupedSkills, ['stage']);
    assert.equal(live.skillsSh.missingGroupedSkills.includes('blendops-done-criteria'), false);
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
});

test('published npm manifest comparison tolerates URL case and historical 255-character truncation only', () => {
  const fullDescription = 'x'.repeat(280);
  const published = {
    name: 'blendops',
    version: '1.0.0',
    description: fullDescription.slice(0, 255),
    repository: { url: 'git+https://github.com/ThanhNguyxnOrg/blendops.git' },
  };
  const source = {
    name: 'blendops',
    version: '1.0.0',
    description: fullDescription,
    repository: { url: 'https://github.com/ThanhNguyxnOrg/blendops.git' },
  };
  assert.deepEqual(manifestDifferences(source, published), []);

  assert.deepEqual(
    manifestDifferences({ ...source, description: 'different description' }, published),
    ['description'],
  );
});

test('distribution report keeps skills.sh display metrics separate from canonical inventory', () => {
  const local = auditLocalDistributionMetadata(root);
  const report = buildDistributionReport(local, {
    npm: { reachable: true, latestVersion: '1.0.0' },
    skillsSh: {
      reachable: true,
      displayedListingMetric: 69,
      canonicalSkillCount: 15,
      groupedSkillCount: 15,
      metricIsCanonicalInventory: false,
    },
  });
  assert.equal(report.interpretation.skillsShListingMetricsAreNotCanonicalSkillInventory, true);
  assert.equal(report.live.skillsSh.metricIsCanonicalInventory, false);
});
