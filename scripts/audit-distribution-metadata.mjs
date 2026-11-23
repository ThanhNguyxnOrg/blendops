#!/usr/bin/env node
/**
 * Audit BlendOps distribution metadata against its local sources and public registries.
 * Local mode is deterministic/offline and belongs in CI.
 * Live mode reads public npm and skills.sh metadata; it never publishes or rewrites sources.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSkillsShConfig } from './install-skills.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPOSITORY = 'ThanhNguyxnOrg/blendops';
const NPM_REGISTRY_URL = 'https://registry.npmjs.org/blendops';
const SKILLS_SH_URL = 'https://skills.sh/ThanhNguyxnOrg/blendops';
const NUMERIC_IDENTIFIER_RE = /^(0|[1-9]\d*)$/;
const ALLOWED_NODE_ENGINES = new Set(['>=20.0.0', '>=22.14.0']);

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push('Cannot read ' + filePath + ': ' + error.message);
    return null;
  }
}

function compareAscii(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function comparePrereleaseIdentifiers(left, right) {
  const leftParts = left.split('.');
  const rightParts = right.split('.');
  const len = Math.max(leftParts.length, rightParts.length);

  for (let i = 0; i < len; i += 1) {
    if (i >= leftParts.length) return -1;
    if (i >= rightParts.length) return 1;
    const a = leftParts[i];
    const b = rightParts[i];
    if (a === b) continue;

    const aNum = NUMERIC_IDENTIFIER_RE.test(a);
    const bNum = NUMERIC_IDENTIFIER_RE.test(b);
    if (aNum && bNum) {
      const diff = BigInt(a) - BigInt(b);
      return diff < 0n ? -1 : 1;
    }
    if (aNum !== bNum) return aNum ? -1 : 1;
    return compareAscii(a, b);
  }
  return 0;
}

export function compareVersions(left, right) {
  const parse = (value) => {
    const match = String(value || '').match(/^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/);
    if (!match) return null;
    return {
      major: Number(match[1]),
      minor: Number(match[2]),
      patch: Number(match[3]),
      prerelease: match[4] || '',
    };
  };
  const a = parse(left);
  const b = parse(right);
  if (!a || !b) return null;
  for (const key of ['major', 'minor', 'patch']) {
    if (a[key] < b[key]) return -1;
    if (a[key] > b[key]) return 1;
  }
  if (!a.prerelease && !b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  return comparePrereleaseIdentifiers(a.prerelease, b.prerelease);
}

function normalizeRepositoryUrl(value) {
  return String(value || '').replace(/^git\+/, '').replace(/\/$/, '').toLowerCase();
}

function stableJson(value) {
  return JSON.stringify(value === undefined ? null : value);
}

export function manifestDifferences(source, published) {
  const fields = ['name', 'version', 'description', 'homepage', 'bugs', 'license', 'keywords', 'engines', 'bin'];
  const differences = [];
  for (const field of fields) {
    if (stableJson(source[field]) === stableJson(published[field])) continue;

    // Historical npm registry metadata (e.g. v1.0.0) truncated descriptions at 255 chars.
    if (
      field === 'description' &&
      typeof source.description === 'string' &&
      typeof published.description === 'string' &&
      published.description.length === 255 &&
      source.description.startsWith(published.description)
    ) {
      continue;
    }
    differences.push(field);
  }
  if (normalizeRepositoryUrl(source.repository?.url) !== normalizeRepositoryUrl(published.repository?.url)) {
    differences.push('repository.url');
  }
  return differences;
}

export function auditLocalDistributionMetadata(rootDir = ROOT) {
  const root = path.resolve(rootDir);
  const errors = [];
  const pkg = readJson(path.join(root, 'package.json'), errors) || {};
  const lock = readJson(path.join(root, 'package-lock.json'), errors) || {};
  const skillsValidation = validateSkillsShConfig(root);

  if (pkg.name !== 'blendops') errors.push("package.json name must be 'blendops'");
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(String(pkg.version || ''))) {
    errors.push('package.json version must be a valid semantic version');
  }
  if (typeof pkg.description !== 'string' || pkg.description.trim().length === 0) {
    errors.push('package.json description must be a non-empty string');
  } else if (pkg.description.length > 255) {
    errors.push('package.json description must be at most 255 characters so npm registry metadata does not truncate it');
  }
  const describedSkillCount = /\b(\d+) Anthropic Skills\b/.exec(String(pkg.description || ''));
  const skillsRoot = path.join(root, 'skills');
  const canonicalSkillCount = fs.existsSync(skillsRoot) && fs.statSync(skillsRoot).isDirectory()
    ? fs
        .readdirSync(skillsRoot, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(skillsRoot, d.name, 'SKILL.md'))).length
    : null;
  if (describedSkillCount && canonicalSkillCount !== null && Number(describedSkillCount[1]) !== canonicalSkillCount) {
    errors.push(`package.json description says ${describedSkillCount[1]} Anthropic Skills but skills/ has ${canonicalSkillCount}`);
  }
  if (pkg.private === true) errors.push('package.json must not set private: true');
  if (pkg.publishConfig?.access !== 'public') errors.push("package.json publishConfig.access must be 'public'");
  if (
    pkg.repository?.type !== 'git' ||
    normalizeRepositoryUrl(pkg.repository?.url) !== 'https://github.com/' + REPOSITORY.toLowerCase() + '.git'
  ) {
    errors.push('package.json repository must point to https://github.com/' + REPOSITORY + '.git');
  }
  if (pkg.homepage !== 'https://github.com/' + REPOSITORY + '#readme') {
    errors.push('package.json homepage does not point to the canonical repository README');
  }
  if (pkg.bugs?.url !== 'https://github.com/' + REPOSITORY + '/issues') {
    errors.push('package.json bugs.url does not point to the canonical repository issues');
  }
  if (pkg.license !== 'MIT') errors.push("package.json license must be 'MIT'");
  if (!ALLOWED_NODE_ENGINES.has(pkg.engines?.node)) {
    errors.push("package.json engines.node must be '>=20.0.0' or '>=22.14.0'");
  }
  if (pkg.bin?.blendops !== 'bin/blendops.mjs') errors.push("package.json bin.blendops must be 'bin/blendops.mjs'");
  if (
    !Array.isArray(pkg.files) ||
    !pkg.files.includes('skills/') ||
    !pkg.files.includes('skills.sh.json') ||
    !pkg.files.includes('README.md')
  ) {
    errors.push('package.json files allowlist must include skills/, skills.sh.json, and README.md');
  }
  if (!fs.existsSync(path.join(root, 'bin/blendops.mjs'))) {
    errors.push('Missing bin/blendops.mjs referenced by package.json');
  }
  if (lock.name !== pkg.name || lock.version !== pkg.version) {
    errors.push('package-lock.json root name/version do not match package.json');
  }
  if (lock.packages?.['']?.name !== pkg.name || lock.packages?.['']?.version !== pkg.version) {
    errors.push('package-lock.json packages[""] name/version do not match package.json');
  }
  if (lock.packages?.['']?.engines?.node !== pkg.engines?.node) {
    errors.push('package-lock.json packages[""].engines.node must match package.json');
  }

  for (const error of skillsValidation.errors) errors.push(error);

  return {
    valid: errors.length === 0,
    errors,
    package: {
      name: pkg.name || null,
      version: pkg.version || null,
      repository: pkg.repository?.url || null,
      nodeEngine: pkg.engines?.node || null,
      cliEntry: pkg.bin?.blendops || null,
      publicAccess: pkg.publishConfig?.access === 'public',
    },
    skills: {
      groupCount: skillsValidation.groupCount,
      canonicalSkillCount: skillsValidation.skillCount,
      groupsValid: skillsValidation.valid,
      groupedSkills: skillsValidation.skills,
    },
  };
}

async function fetchText(url, fetchImpl) {
  const init = {
    headers: {
      accept: 'application/json, text/html;q=0.9, */*;q=0.8',
      'user-agent': 'BlendOps-Distribution-Metadata-Audit/1.0',
    },
  };
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    init.signal = AbortSignal.timeout(20000);
  }
  const response = await fetchImpl(url, init);
  if (!response.ok) throw new Error('HTTP ' + response.status + ' ' + response.statusText);
  return response.text();
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeReadme(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function hasSkillsShRoute(html, slug) {
  const normalizedHtml = String(html || '').toLowerCase();
  const normalizedSlug = String(slug || '').toLowerCase();
  if (!normalizedSlug) return false;
  const pattern = new RegExp(`/${escapeRegExp(normalizedSlug)}(?:["'/?#\\s<]|$)`);
  return pattern.test(normalizedHtml);
}

export async function auditLiveDistributionMetadata(rootDir = ROOT, fetchImpl = fetch) {
  const root = path.resolve(rootDir);
  const pkg = readJson(path.join(root, 'package.json'), []) || {};
  const readme = fs.existsSync(path.join(root, 'README.md'))
    ? fs.readFileSync(path.join(root, 'README.md'), 'utf8')
    : '';
  const skillsConfig = readJson(path.join(root, 'skills.sh.json'), []) || {};
  const groupings = Array.isArray(skillsConfig.groupings) ? skillsConfig.groupings : [];
  const expectedSkills = groupings.flatMap((group) => Array.isArray(group.skills) ? group.skills : []);

  let npm;
  try {
    const registry = JSON.parse(await fetchText(NPM_REGISTRY_URL, fetchImpl));
    const latestVersion = registry['dist-tags']?.latest || null;
    const localVersion = pkg.version || null;
    const versionComparison = latestVersion && localVersion ? compareVersions(localVersion, latestVersion) : null;
    const publishedRelease = localVersion ? registry.versions?.[localVersion] : null;
    const latestRelease = latestVersion ? registry.versions?.[latestVersion] : null;
    const comparisonTarget = publishedRelease || latestRelease;
    let versionStatus = 'unknown';
    if (versionComparison === 0) versionStatus = 'aligned';
    else if (versionComparison > 0) versionStatus = 'local-version-ahead-awaiting-publish';
    else if (versionComparison < 0) versionStatus = 'repository-version-behind-registry';

    const metadataDiffs = comparisonTarget
      ? manifestDifferences(pkg, comparisonTarget)
      : ['published-version-manifest-not-found'];
    const publishedReadme = typeof registry.readme === 'string' ? registry.readme : null;
    const readmeMatches = publishedReadme === null
      ? null
      : normalizeReadme(publishedReadme) === normalizeReadme(readme);

    npm = {
      reachable: true,
      packageUrl: 'https://www.npmjs.com/package/blendops',
      latestVersion,
      localVersion,
      localVersionStatus: versionStatus,
      currentVersionPublished: Boolean(publishedRelease),
      publishedVersionGitHead: publishedRelease?.gitHead || null,
      latestTarball: latestRelease?.dist?.tarball || null,
      latestFileCount: latestRelease?.dist?.fileCount || null,
      manifestDiffs: metadataDiffs,
      publishedReadmeMatchesRepository: readmeMatches,
      readmeStatus: readmeMatches === true
        ? 'in-sync'
        : readmeMatches === false
          ? 'repository-readme-changed-since-published-version'
          : 'unavailable',
      historicalStagePlaceholderPresent: Boolean(registry.versions?.['0.0.0-stage']),
      error: null,
    };
  } catch (error) {
    npm = {
      reachable: false,
      packageUrl: 'https://www.npmjs.com/package/blendops',
      latestVersion: null,
      localVersion: pkg.version || null,
      localVersionStatus: 'unavailable',
      currentVersionPublished: false,
      manifestDiffs: [],
      publishedReadmeMatchesRepository: null,
      readmeStatus: 'unavailable',
      historicalStagePlaceholderPresent: null,
      error: error.message,
    };
  }

  let skillsSh;
  try {
    const html = await fetchText(SKILLS_SH_URL, fetchImpl);
    const visibleText = stripHtml(html).toLowerCase();
    const missingSkills = expectedSkills.filter((slug) => !hasSkillsShRoute(html, slug));
    const missingGroups = groupings
      .map((group) => String(group.title || ''))
      .filter((title) => !visibleText.includes(title.toLowerCase()));
    const metricMatch = visibleText.match(/(\d+)\s*skills\b/i);
    skillsSh = {
      reachable: true,
      listingUrl: SKILLS_SH_URL,
      status: missingSkills.length === 0 && missingGroups.length === 0 ? 'in-sync' : 'listing-may-be-stale',
      canonicalSkillCount: expectedSkills.length,
      groupedSkillCount: expectedSkills.length,
      groupCount: groupings.length,
      missingGroupedSkills: missingSkills,
      missingGroups,
      displayedListingMetric: metricMatch ? Number(metricMatch[1]) : null,
      otherSkillsSectionVisible: visibleText.includes('other skills'),
      metricIsCanonicalInventory: false,
      error: null,
    };
  } catch (error) {
    skillsSh = {
      reachable: false,
      listingUrl: SKILLS_SH_URL,
      status: 'unavailable',
      canonicalSkillCount: expectedSkills.length,
      groupedSkillCount: expectedSkills.length,
      groupCount: groupings.length,
      missingGroupedSkills: [],
      missingGroups: [],
      displayedListingMetric: null,
      otherSkillsSectionVisible: null,
      metricIsCanonicalInventory: false,
      error: error.message,
    };
  }

  return { npm, skillsSh };
}

export function buildDistributionReport(local, live = null) {
  return {
    schemaVersion: 1,
    repository: REPOSITORY,
    generatedBy: 'scripts/audit-distribution-metadata.mjs',
    sourceOfTruth: {
      npmManifest: 'package.json',
      npmLock: 'package-lock.json',
      skillsManifest: 'skills.sh.json',
      canonicalSkills: 'skills/*/SKILL.md',
    },
    local,
    live,
    interpretation: {
      npmPackageIsImmutablePerVersion: true,
      skillsShListingIsDiscoveredFromPublicGitHubSource: true,
      skillsShListingMetricsAreNotCanonicalSkillInventory: true,
      neverAutoBumpOrPublishNpmVersion: true,
      neverAutoRewriteCuratedSkillGroups: true,
    },
  };
}

function formatSummary(report) {
  const lines = [
    '## BlendOps distribution metadata audit',
    '',
    '- Local source contracts: ' + (report.local.valid ? 'PASS' : 'FAIL'),
    '- npm source version: ' + (report.local.package.version || 'unknown'),
    '- Canonical skills: ' + report.local.skills.canonicalSkillCount,
    '- skills.sh groups: ' + report.local.skills.groupCount,
  ];
  if (report.live?.npm) {
    lines.push('- npm latest: ' + (report.live.npm.latestVersion || 'unavailable'));
    lines.push('- npm version relation: ' + report.live.npm.localVersionStatus);
    lines.push('- npm README: ' + report.live.npm.readmeStatus);
    if (report.live.npm.manifestDiffs.length) {
      lines.push('- npm manifest differences: ' + report.live.npm.manifestDiffs.join(', '));
    }
  }
  if (report.live?.skillsSh) {
    lines.push('- skills.sh listing: ' + report.live.skillsSh.status);
    lines.push('- skills.sh displayed metric (not canonical inventory): ' +
      (report.live.skillsSh.displayedListingMetric ?? 'unavailable'));
    if (report.live.skillsSh.missingGroupedSkills.length) {
      lines.push('- Missing grouped skill links: ' + report.live.skillsSh.missingGroupedSkills.join(', '));
    }
    if (report.live.skillsSh.missingGroups.length) {
      lines.push('- Missing group headings: ' + report.live.skillsSh.missingGroups.join(', '));
    }
  }
  if (report.local.errors.length) {
    lines.push('', '### Local validation errors', ...report.local.errors.map((error) => '- ' + error));
  }
  return lines.join('\n') + '\n';
}

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes('--live');
  const writeIndex = args.indexOf('--write-report');
  const outputPath = writeIndex >= 0 ? args[writeIndex + 1] : null;
  const local = auditLocalDistributionMetadata(ROOT);
  const remote = live ? await auditLiveDistributionMetadata(ROOT) : null;
  const report = buildDistributionReport(local, remote);
  const json = JSON.stringify(report, null, 2) + '\n';

  if (outputPath) {
    const absolute = path.resolve(ROOT, outputPath);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, json);
    console.log('Wrote ' + path.relative(ROOT, absolute).replaceAll('\\', '/'));
  }

  const summary = formatSummary(report);
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
  if (!local.valid) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
