#!/usr/bin/env node
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import {
  auditLocalDistributionMetadata,
  compareVersions,
  buildDistributionReport,
} from './audit-distribution-metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('local npm and skills.sh source manifests are internally aligned', () => {
  const result = auditLocalDistributionMetadata(root);
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.package.name, 'blendops');
  assert.equal(result.package.version, '1.0.0');
  assert.equal(result.skills.groupCount, 8);
  assert.equal(result.skills.canonicalSkillCount, 48);
});

test('semantic version comparison distinguishes release order and prereleases', () => {
  assert.equal(compareVersions('1.0.1', '1.0.0'), 1);
  assert.equal(compareVersions('1.0.0', '1.0.0'), 0);
  assert.equal(compareVersions('1.0.0', '1.0.1'), -1);
  assert.equal(compareVersions('1.0.0', '1.0.0-beta.1'), 1);
  assert.equal(compareVersions('1.0.0-beta.2', '1.0.0-beta.1'), 1);
  assert.equal(compareVersions('not-semver', '1.0.0'), null);
});

test('distribution report keeps skills.sh display metrics separate from canonical inventory', () => {
  const local = auditLocalDistributionMetadata(root);
  const report = buildDistributionReport(local, {
    npm: { reachable: true, latestVersion: '1.0.0' },
    skillsSh: {
      reachable: true,
      displayedListingMetric: 69,
      canonicalSkillCount: 48,
      groupedSkillCount: 48,
      metricIsCanonicalInventory: false,
    },
  });
  assert.equal(report.interpretation.skillsShListingMetricsAreNotCanonicalSkillInventory, true);
  assert.equal(report.live.skillsSh.metricIsCanonicalInventory, false);
});
