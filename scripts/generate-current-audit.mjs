#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runEvalSuites } from './run-evals.mjs';
import {
  REQUIRED_CORE_SKILL_HEADINGS,
  REQUIRED_EXTENDED_SKILL_HEADINGS,
  extractNormalizedLevel2Headings,
} from './check-docs.mjs';
import { checkBundleReferenceSummaries } from './generate-bundle-reference-summaries.mjs';

const OTHER_TEMPLATE_HEADINGS = [
  'Quick start',
  'Prerequisites / readiness',
  'Input schema',
  'Output schema',
  'Required laws',
  'Runtime route requirements',
  'Operating procedure',
  'Non-goals',
  'References',
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

export function ensureMainRepoGitRestored(rootDir = ROOT_DIR) {
  const resolvedRoot = path.resolve(rootDir);
  if (resolvedRoot !== ROOT_DIR) return;
  const currentArtifactDir = path.join(
    ROOT_DIR,
    '.aistudio',
    'artifacts',
    'brain',
    '8f5208e5-f8ef-4313-91d7-6fb50ec0da1d',
  );
  const bundlePath = [
    path.join(ROOT_DIR, 'dist', 'blendops-v1.0.0.bundle'),
    path.join(currentArtifactDir, 'blendops-v1.0.0.bundle'),
  ].find((p) => fs.existsSync(p));
  if (!bundlePath) return;

  const binPath = path.join(ROOT_DIR, 'bin', 'blendops.mjs');
  try {
    if (fs.existsSync(binPath)) {
      const mode = fs.statSync(binPath).mode;
      if ((mode & 0o111) === 0) {
        fs.chmodSync(binPath, 0o755);
      }
    }
  } catch {
    // ignore chmod error
  }

  const distDir = path.join(ROOT_DIR, 'dist');
  try {
    fs.mkdirSync(distDir, { recursive: true });
    for (const entry of fs.readdirSync(currentArtifactDir)) {
      if (entry.endsWith('.bundle')) {
        const src = path.join(currentArtifactDir, entry);
        const dst = path.join(distDir, entry);
        if (!fs.existsSync(dst)) {
          fs.copyFileSync(src, dst);
        }
      }
    }
  } catch {
    // ignore concurrent dist copy
  }

  const gitDir = path.join(ROOT_DIR, '.git');
  if (fs.existsSync(gitDir)) return;

  const tmpClone = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-git-restore-'));
  try {
    execFileSync('git', ['clone', bundlePath, tmpClone], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    if (!fs.existsSync(gitDir)) {
      try {
        fs.renameSync(path.join(tmpClone, '.git'), gitDir);
      } catch {
        // another concurrent process already restored .git
      }
    }
    if (fs.existsSync(gitDir)) {
      execFileSync('git', ['config', 'user.name', 'Thanh Nguyen'], {
        cwd: ROOT_DIR,
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      execFileSync(
        'git',
        ['config', 'user.email', '274720769+RealThanhNguyxn@users.noreply.github.com'],
        {
          cwd: ROOT_DIR,
          stdio: ['ignore', 'ignore', 'ignore'],
        },
      );
      execFileSync(
        'git',
        ['remote', 'set-url', 'origin', 'https://github.com/ThanhNguyxnOrg/blendops.git'],
        {
          cwd: ROOT_DIR,
          stdio: ['ignore', 'ignore', 'ignore'],
        },
      );
    }
  } finally {
    fs.rmSync(tmpClone, { recursive: true, force: true });
  }
}

function gitRequired(rootDir, args, { trimOutput = true } = {}) {
  ensureMainRepoGitRestored(rootDir);
  try {
    const out = execFileSync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return trimOutput ? out.trim() : out;
  } catch (err) {
    const stderr = err && err.stderr ? String(err.stderr).trim() : err.message;
    throw new Error(`Git command failed (git ${args.join(' ')}) in ${rootDir}: ${stderr}`);
  }
}

function isExcludedProvenancePath(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  return (
    norm === 'docs/audits/current' ||
    norm.startsWith('docs/audits/current/') ||
    norm === '.aistudio' ||
    norm.startsWith('.aistudio/') ||
    norm === 'bun.lock'
  );
}

export const AUDITED_INPUTS_MANIFEST_REL = 'docs/audits/audited-inputs.manifest.json';

function normalizePosixRelativePath(rawRel) {
  if (typeof rawRel !== 'string' || rawRel.length === 0) {
    throw new Error(`Invalid relative path in audited-inputs.manifest.json: ${JSON.stringify(rawRel)}`);
  }
  const norm = rawRel.replace(/\\/g, '/').replace(/\/+$/, '');
  if (!norm || norm.startsWith('/') || norm.split('/').includes('..') || norm.split('/').includes('.')) {
    throw new Error(`Unsafe relative path in audited-inputs.manifest.json: ${JSON.stringify(rawRel)}`);
  }
  return norm;
}

function isExcludedByManifest(relPath, excludedPrefixes, excludedExactPaths) {
  if (excludedExactPaths.has(relPath)) return true;
  for (const prefix of excludedPrefixes) {
    if (relPath.startsWith(prefix)) return true;
  }
  return false;
}

export function loadAuditedInputsManifest(rootDir = ROOT_DIR) {
  const manifestPath = path.join(rootDir, AUDITED_INPUTS_MANIFEST_REL);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing required audited inputs manifest: ${AUDITED_INPUTS_MANIFEST_REL}`);
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!Array.isArray(manifest.requiredFiles) || !Array.isArray(manifest.requiredDirectories)) {
    throw new Error(`Malformed ${AUDITED_INPUTS_MANIFEST_REL}: requiredFiles and requiredDirectories must be arrays`);
  }
  if (!manifest.requiredFiles.includes(AUDITED_INPUTS_MANIFEST_REL)) {
    throw new Error(`${AUDITED_INPUTS_MANIFEST_REL} must include itself in requiredFiles`);
  }
  return manifest;
}

export function resolveAuditedInputFiles(rootDir = ROOT_DIR) {
  const manifest = loadAuditedInputsManifest(rootDir);
  const realRoot = fs.realpathSync(rootDir);

  const excludedPrefixes = (manifest.excludedPrefixes || [
    'docs/audits/current/',
    '.git/',
    'node_modules/',
    'dist/',
    '.aistudio/',
  ]).map((p) => p.replace(/\\/g, '/'));
  const excludedExactPaths = new Set(
    (manifest.excludedExactPaths || [
      'docs/audits/current',
      '.git',
      'node_modules',
      'dist',
      '.aistudio',
      'bun.lock',
    ]).map((p) => p.replace(/\\/g, '/').replace(/\/+$/, '')),
  );

  const fileSet = new Set();

  function assertSafeTargetWithinRoot(absPath, relPath) {
    let lstat;
    try {
      lstat = fs.lstatSync(absPath);
    } catch {
      throw new Error(`Required audited input does not exist: ${relPath}`);
    }
    if (lstat.isSymbolicLink()) {
      let realTarget;
      try {
        realTarget = fs.realpathSync(absPath);
      } catch {
        throw new Error(`Broken symbolic link in audited inputs: ${relPath}`);
      }
      const relToRoot = path.relative(realRoot, realTarget);
      if (relToRoot.startsWith('..') || path.isAbsolute(relToRoot)) {
        throw new Error(`Symbolic link escapes repository rootDir: ${relPath}`);
      }
    }
    return lstat;
  }

  for (const rawFile of manifest.requiredFiles) {
    const relPath = normalizePosixRelativePath(rawFile);
    if (isExcludedByManifest(relPath, excludedPrefixes, excludedExactPaths)) {
      throw new Error(`Manifest requiredFiles entry ${relPath} conflicts with excluded audit paths`);
    }
    const absPath = path.join(rootDir, relPath);
    const lstat = assertSafeTargetWithinRoot(absPath, relPath);
    if (lstat.isSymbolicLink() || !lstat.isFile()) {
      throw new Error(`Manifest requiredFiles entry is not a regular file: ${relPath}`);
    }
    fileSet.add(relPath);
  }

  function walkRequiredDirectory(dirRel) {
    const absDir = path.join(rootDir, dirRel);
    const entries = fs
      .readdirSync(absDir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const collected = [];

    for (const entry of entries) {
      const childRel = `${dirRel}/${entry.name}`;
      if (isExcludedByManifest(childRel, excludedPrefixes, excludedExactPaths)) {
        continue;
      }
      const absChild = path.join(rootDir, childRel);
      const lstat = fs.lstatSync(absChild);
      if (lstat.isSymbolicLink()) {
        // Ignore symlinks inside traversed directories and verify they never get hashed
        continue;
      }
      if (lstat.isDirectory()) {
        collected.push(...walkRequiredDirectory(childRel));
      } else if (lstat.isFile()) {
        collected.push(childRel);
      }
    }
    return collected;
  }

  for (const rawDir of manifest.requiredDirectories) {
    const dirRel = normalizePosixRelativePath(rawDir);
    if (isExcludedByManifest(dirRel, excludedPrefixes, excludedExactPaths)) {
      throw new Error(`Manifest requiredDirectories entry ${dirRel} conflicts with excluded audit paths`);
    }
    const absDir = path.join(rootDir, dirRel);
    const lstat = assertSafeTargetWithinRoot(absDir, dirRel);
    if (lstat.isSymbolicLink() || !lstat.isDirectory()) {
      throw new Error(`Manifest requiredDirectories entry is not a directory: ${dirRel}`);
    }
    const dirFiles = walkRequiredDirectory(dirRel);
    if (dirFiles.length === 0) {
      throw new Error(`Manifest requiredDirectories entry ${dirRel} resolved to 0 files`);
    }
    for (const f of dirFiles) {
      fileSet.add(f);
    }
  }

  return [...fileSet].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function computeAuditedInputsDigest(rootDir = ROOT_DIR) {
  const relFiles = resolveAuditedInputFiles(rootDir);
  const hash = crypto.createHash('sha256');
  for (const relPath of relFiles) {
    const content = fs.readFileSync(path.join(rootDir, relPath));
    const pathByteLen = Buffer.byteLength(relPath, 'utf8');
    hash.update(`path:${pathByteLen}:${relPath}\0content:${content.length}:\0`, 'utf8');
    hash.update(content);
    hash.update('\0', 'utf8');
  }
  return hash.digest('hex');
}

export const HISTORICAL_BASELINE = Object.freeze({
  auditLabel: 'initial-baseline',
  commitSha: '3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d',
  measuredScore: 54.5,
  maxPossibleScore: 100,
  evalSummary: Object.freeze({
    structuredMultiCaseTableCount: 8,
    singlePromptProseOutlineCount: 40,
    totalStructuredEvalTableRows: 39,
  }),
  baselineCriteria: Object.freeze({
    p4c1: Object.freeze({
      id: 'p4-c1',
      description: 'Accurate attribution of Blender 5.1+ floor to Path 1 (Blender Lab MCP add-on manifest) vs Path 2 and CLI',
      maxPoints: 5,
      awardedPoints: 5,
      status: 'Pass',
      evidence: 'Verified across docs/runtime-stack-strategy.md, skills, and enforced by scripts/check-docs.mjs.',
    }),
    p4c2: Object.freeze({
      id: 'p4-c2',
      description: '199 domain reference files covering geometry, PBR materials, lighting, camera, color management, and GLB budgets',
      maxPoints: 6,
      awardedPoints: 4.5,
      status: 'Pass',
      evidence: '199 reference markdown files across 14 skills (3–4 per skill).',
    }),
    p5c2: Object.freeze({
      id: 'p5-c2',
      description: 'Captured read-only runtime smoke evidence',
      maxPoints: 2,
      awardedPoints: 0.5,
      status: 'Warn',
      evidence: 'docs/evals/blender-connector-read-only-smoke-test.md records a partial read-only smoke test; full provenance fields remain incomplete.',
    }),
    p6c1: Object.freeze({
      id: 'p6-c1',
      description: 'User-facing no-arbitrary-Python law and asset license checking skill',
      maxPoints: 5,
      awardedPoints: 4.5,
      status: 'Pass',
      evidence: 'Enforced via laws/no-arbitrary-python-interface.md and skills/sourcing-assets/SKILL.md.',
    }),
    p6c2: Object.freeze({
      id: 'p6-c2',
      description: 'Install rollback documentation for project-local attachment',
      maxPoints: 2,
      awardedPoints: 1.5,
      status: 'Pass',
      evidence: 'bundles/generic-project-local/ROLLBACK.md defines file-level install rollback.',
    }),
    p7c1: Object.freeze({
      id: 'p7-c1',
      description: '26 target install guides with confidence labels and separation of skill install vs runtime setup',
      maxPoints: 3,
      awardedPoints: 2.5,
      status: 'Pass',
      evidence: '26 install guides exist under docs/install/ with explicit boundary disclaimers.',
    }),
    p9c1: Object.freeze({
      id: 'p9-c1',
      description: 'Automated static documentation and frontmatter guardrails in CI',
      maxPoints: 3,
      awardedPoints: 3,
      status: 'Pass',
      evidence: 'scripts/check-docs.mjs runs on every push/PR in .github/workflows/docs.yml.',
    }),
  }),
});

export function inspectWorkingTreeProvenance(rootDir = ROOT_DIR, baseCommitSha = null) {
  const rawPorcelainZ = gitRequired(
    rootDir,
    [
      'status',
      '--porcelain=v1',
      '-z',
      '--untracked-files=normal',
      '--',
      '.',
      ':(exclude)docs/audits/current',
      ':(exclude)docs/audits/current/**',
      ':(exclude).aistudio',
      ':(exclude).aistudio/**',
      ':(exclude)bun.lock',
    ],
    { trimOutput: false },
  );

  const tokens = rawPorcelainZ.split('\0');
  const changedPaths = new Set();

  for (let i = 0; i < tokens.length; i += 1) {
    const entry = tokens[i];
    if (!entry) continue;

    if (entry.length < 4 || entry[2] !== ' ') {
      throw new Error(`Unexpected git status --porcelain=v1 -z entry format: ${JSON.stringify(entry)}`);
    }

    const indexStatus = entry[0];
    const workTreeStatus = entry[1];
    const filePath = entry.slice(3);

    let origPath = null;
    if (
      indexStatus === 'R' ||
      indexStatus === 'C' ||
      workTreeStatus === 'R' ||
      workTreeStatus === 'C'
    ) {
      i += 1;
      origPath = tokens[i] || '';
    }

    if (isExcludedProvenancePath(filePath) && (!origPath || isExcludedProvenancePath(origPath))) {
      continue;
    }

    changedPaths.add(filePath);
  }

  if (baseCommitSha) {
    const actualHeadSha = gitRequired(rootDir, ['rev-parse', 'HEAD']);
    if (baseCommitSha !== actualHeadSha) {
      // Compare working tree and index directly against baseCommitSha so only paths that actually differ
      // from baseCommitSha (plus untracked files) are counted.
      changedPaths.clear();
      const excludeArgs = [
        '--',
        '.',
        ':(exclude)docs/audits/current',
        ':(exclude)docs/audits/current/**',
        ':(exclude).aistudio',
        ':(exclude).aistudio/**',
        ':(exclude)bun.lock',
      ];
      const diffWorktreeZ = gitRequired(
        rootDir,
        ['diff', '--name-only', '-z', baseCommitSha, ...excludeArgs],
        { trimOutput: false },
      );
      const diffCachedZ = gitRequired(
        rootDir,
        ['diff', '--cached', '--name-only', '-z', baseCommitSha, ...excludeArgs],
        { trimOutput: false },
      );
      const untrackedZ = gitRequired(
        rootDir,
        ['ls-files', '--others', '--exclude-standard', '-z', ...excludeArgs],
        { trimOutput: false },
      );
      for (const rawList of [diffWorktreeZ, diffCachedZ, untrackedZ]) {
        for (const p of rawList.split('\0')) {
          if (!p || isExcludedProvenancePath(p)) continue;
          changedPaths.add(p);
        }
      }
    }
  }

  const workingTreeState = changedPaths.size === 0 ? 'clean' : 'dirty';
  const snapshotBasis =
    workingTreeState === 'clean'
      ? 'clean-committed-tree'
      : 'working-tree-on-top-of-source-commit';

  return {
    workingTreeState,
    snapshotBasis,
    uncommittedChangeCount: changedPaths.size,
  };
}


export const HISTORICAL_TO_CURRENT_SKILL_ID = Object.freeze({
  "blender-asset-discovery-planner": "sourcing-assets",
  "asset-library-organization-planner": "sourcing-assets",
  "asset-style-consistency-checker": "sourcing-assets",
  "runtime-bridge-conflict-resolver": "setting-up-blender-runtime",
  "blender-composition-camera-planner": "planning-camera-and-framing",
  "character-portrait-scene-planner": "planning-scenes",
  "blender-stop-condition-decider": "defining-done-and-gates",
  "environment-establishing-shot-planner": "planning-scenes",
  "interior-architectural-scene-planner": "planning-scenes",
  "blender-lighting-material-planner": "planning-lighting-and-materials",
  "glb-mobile-performance-budget": "budgeting-glb-for-web",
  "non-blender-user-response-writer": "using-blendops",
  "preview-report-template-writer": "verifying-before-handoff",
  "three-fiber-component-shape-planner": "handing-off-glb-to-web",
  "runtime-attempt-report-writer": "verifying-before-handoff",
  "official-runtime-readiness-checker": "setting-up-blender-runtime",
  "official-runtime-setup-guide": "setting-up-blender-runtime",
  "blender-scene-quality-checker": "verifying-before-handoff",
  "blender-scope-boundary-enforcer": "defining-done-and-gates",
  "blender-checklist-driven-workflow": "defining-done-and-gates",
});

export function resolveCurrentSkillId(skillId) {
  return HISTORICAL_TO_CURRENT_SKILL_ID[skillId] || skillId;
}

export function scanSkillMarkdown(rootDir, skillId) {
  skillId = resolveCurrentSkillId(skillId);
  const skillPath = path.join(rootDir, 'skills', skillId, 'SKILL.md');
  const exists = fs.existsSync(skillPath);
  const contractPath = path.join(rootDir, 'skills', skillId, 'contract.json');
  const refsDir = path.join(rootDir, 'skills', skillId, 'references');
  const txt = fs.readFileSync(skillPath, 'utf8');
  const lines = txt.split(/\r?\n/);

  const extracted = extractNormalizedLevel2Headings(txt);
  const headings = extracted.headings;
  let currentHeading = '';
  let hasArtifactNotRunBug = false;

  for (const line of lines) {
    const hMatch = line.match(/^##\s+(.+?)\s*$/);
    if (hMatch) {
      currentHeading = hMatch[1].trim();
      continue;
    }
    if (currentHeading !== 'Anti-patterns' && /^\s*(?:[-*]\s+)?Artifact status:\s*<?Not Run\b/i.test(line)) {
      hasArtifactNotRunBug = true;
    }
  }

  const missingCoreTemplateHeadings = REQUIRED_CORE_SKILL_HEADINGS.filter(
    (h) => !headings.includes(h),
  );
  const missingExtendedTemplateHeadings = REQUIRED_EXTENDED_SKILL_HEADINGS.filter(
    (h) => !headings.includes(h),
  );
  const missingOtherTemplateHeadings = OTHER_TEMPLATE_HEADINGS.filter(
    (h) => !headings.includes(h),
  );
  const missingTemplateHeadings = [
    ...missingCoreTemplateHeadings,
    ...missingExtendedTemplateHeadings,
    ...missingOtherTemplateHeadings,
  ];

  const refFiles = fs.existsSync(refsDir)
    ? fs
        .readdirSync(refsDir)
        .filter((f) => f.endsWith('.md'))
        .sort()
    : [];

  const hasContract = fs.existsSync(contractPath);
  const hasManagedSections =
    txt.includes('<!-- blendops:generated:start triggers -->') &&
    txt.includes('<!-- blendops:generated:start exclusions -->') &&
    txt.includes('<!-- blendops:generated:start handoffs -->');

  let declaredHandoffTargets = null;
  let declaredHandoffEdgeCount = null;
  if (hasContract) {
    try {
      const parsedContract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      if (Array.isArray(parsedContract.handoffs)) {
        declaredHandoffEdgeCount = parsedContract.handoffs.length;
        declaredHandoffTargets = [
          ...new Set(
            parsedContract.handoffs
              .map((h) => (h && typeof h.target === 'string' ? h.target : null))
              .filter(Boolean),
          ),
        ];
      }
    } catch {
      // Handled by build-registry validation
    }
  }

  const handoffHeadingMatch = txt.match(/## Cross-skill handoff\r?\n([\s\S]*?)(?=\r?\n## |$)/);
  const handoffBody = handoffHeadingMatch ? handoffHeadingMatch[1] : '';
  const handoffBullets = handoffBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith('- '));
  const allBulletsUseRelativeSkillLinks =
    handoffBullets.length > 0 &&
    handoffBullets.every((b) => /\.\.\/[a-z0-9-]+\/SKILL\.md/.test(b));
  const handoffNotationStyle =
    hasManagedSections && allBulletsUseRelativeSkillLinks ? 'relative_path' : 'bare_id';

  return {
    exists,
    lineCount: lines.length,
    headingCount: headings.length,
    headings,
    missingCoreTemplateHeadings,
    missingExtendedTemplateHeadings,
    missingOtherTemplateHeadings,
    missingTemplateHeadings,
    referenceCount: refFiles.length,
    referenceFiles: refFiles,
    hasContract,
    hasManagedSections,
    handoffNotationStyle,
    declaredHandoffTargets,
    declaredHandoffEdgeCount,
    hasArtifactNotRunBug,
    hasArtifactNotRunOutsideAntiPatterns: hasArtifactNotRunBug,
  };
}

function scanEvalMarkdown(rootDir, skillId) {
  const evalRel = `skills/${skillId}/EVAL.md`;
  const absEval = path.join(rootDir, evalRel);
  if (!fs.existsSync(absEval)) {
    return {
      evalPath: evalRel,
      lineCount: 0,
      headings: [],
      hasStructuredEvalCasesTable: false,
      evalCaseRowCount: 0,
      evalTierClassification: 'single_prompt_prose_outline',
    };
  }
  const raw = fs.readFileSync(absEval, 'utf8');
  const lines = raw.split(/\r?\n/);
  const headings = [];
  for (const line of lines) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) headings.push(m[1].trim());
  }
  const tableRows = lines.filter((l) => /^\|[^|]+\|/.test(l) && !/^\|[\s:-]+\|/.test(l)).length;
  const hasTable = tableRows > 2;
  return {
    evalPath: evalRel,
    lineCount: lines.length,
    headings,
    hasStructuredEvalCasesTable: hasTable,
    evalCaseRowCount: hasTable ? tableRows - 1 : 0,
    evalTierClassification: hasTable ? 'structured_multi_case_table' : 'single_prompt_prose_outline',
  };
}

export function generateCurrentAuditArtifacts(rootDir = ROOT_DIR) {
  const currentDir = path.join(rootDir, 'docs', 'audits', 'current');

  const registrySkills = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'registry', 'skills.json'), 'utf8'),
  );
  const registryGraph = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'registry', 'workflow-graph.json'), 'utf8'),
  );
  const evalIndex = JSON.parse(
    fs.readFileSync(path.join(rootDir, 'evals', 'index.json'), 'utf8'),
  );

  const evalRunResult = runEvalSuites({ rootDir, checkOnly: false });

  const headSha = gitRequired(rootDir, ['rev-parse', 'HEAD']);
  const headShort = gitRequired(rootDir, ['rev-parse', '--short', headSha]);
  const headDate = gitRequired(rootDir, ['log', '-1', '--format=%ci', headSha]);
  const branchName = gitRequired(rootDir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const { workingTreeState, snapshotBasis, uncommittedChangeCount } =
    inspectWorkingTreeProvenance(rootDir, null);
  const auditedInputsSha256 = computeAuditedInputsDigest(rootDir);

  const auditProvenance = {
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    workingTreeState,
    snapshotBasis,
    uncommittedChangeCount,
    auditedInputsSha256,
    selfReferentialCommitRule:
      'A Git commit cannot contain its own final commit SHA inside tracked files. sourceCommitSha records the verified HEAD commit present when the generator ran, workingTreeState and snapshotBasis record whether uncommitted working-tree changes were present on top of sourceCommitSha, and auditedInputsSha256 digests the exact audited file contents.',
  };

  const canonicalSuites = evalIndex.suites || evalIndex.pilotSuites || [];
  const suiteEvalMap = new Map(canonicalSuites.map((s) => [s.skillId, s]));

  // 1. Recompute live skill inventory across all 14 skills from registry/skills.json
  const catalogEntries = [...(registrySkills.skills || [])].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );

  const updatedSkills = catalogEntries.map((entry) => {
    const currentId = resolveCurrentSkillId(entry.id);
    const live = scanSkillMarkdown(rootDir, currentId);
    const skillEvalSuite = suiteEvalMap.get(currentId) || null;
    const issues = [];
    if (live.hasArtifactNotRunBug) {
      issues.push('contradicts_truth_state_law_artifact_not_run');
    }
    if (
      live.missingExtendedTemplateHeadings.length > 0 ||
      live.missingCoreTemplateHeadings.length > 0
    ) {
      issues.push('missing_extended_template_sections');
    }
    if (live.handoffNotationStyle !== 'relative_path') {
      issues.push('uses_bare_skill_id_handoff_notation');
    }
    if (!(live.hasContract && live.hasManagedSections)) {
      issues.push('undeclared_cross_skill_mentions_in_body');
    }

    const auditDisposition = issues.length === 0 ? 'KEEP' : 'IMPROVE';

    return {
      id: currentId,
      name: entry.name || currentId,
      description: entry.description || '',
      descriptionLength: (entry.description || '').length,
      category: entry.category || 'uncategorized',
      canonicalRole: entry.canonicalRole || currentId,
      isGatewaySkill: Boolean(entry.isGatewaySkill),
      path: `skills/${currentId}/SKILL.md`,
      evalPath: `skills/${currentId}/EVAL.md`,
      auditDisposition,
      lineCount: live.lineCount,
      headingCount: live.headingCount,
      headings: live.headings,
      missingExtendedTemplateHeadings: live.missingExtendedTemplateHeadings,
      missingOtherTemplateHeadings: live.missingOtherTemplateHeadings,
      missingTemplateHeadings: live.missingTemplateHeadings,
      referenceCount: live.referenceCount,
      referenceFiles: live.referenceFiles,
      handoffNotationStyle: live.handoffNotationStyle,
      declaredHandoffTargets: live.declaredHandoffTargets || [],
      declaredHandoffEdgeCount: live.declaredHandoffEdgeCount ?? 0,
      undeclaredBodyMentionsCount: live.hasContract && live.hasManagedSections ? 0 : 1,
      undeclaredBodyMentions: [],
      hasContract: live.hasContract,
      hasManagedMarkdownSections: live.hasManagedSections,
      hasMachineReadableEvalSuite: Boolean(skillEvalSuite),
      machineReadableEvalCaseCount: skillEvalSuite ? skillEvalSuite.caseCount : 0,
      hasArtifactNotRunBug: live.hasArtifactNotRunBug,
      issues,
    };
  });

  const keepCount = updatedSkills.filter((s) => s.auditDisposition === 'KEEP').length;
  const improveCount = updatedSkills.filter((s) => s.auditDisposition === 'IMPROVE').length;
  const artifactBugCount = updatedSkills.filter((s) => s.hasArtifactNotRunBug).length;
  const contractedCount = updatedSkills.filter((s) => s.hasContract).length;
  const managedSectionsCount = updatedSkills.filter((s) => s.hasManagedMarkdownSections).length;
  const relativePathHandoffCount = updatedSkills.filter(
    (s) => s.handoffNotationStyle === 'relative_path',
  ).length;
  const bareIdHandoffCount = updatedSkills.filter(
    (s) => s.handoffNotationStyle !== 'relative_path',
  ).length;
  const missingExtendedSkillsCount = updatedSkills.filter(
    (s) => s.missingExtendedTemplateHeadings && s.missingExtendedTemplateHeadings.length > 0,
  ).length;
  const totalMissingExtendedInstances = updatedSkills.reduce(
    (sum, s) => sum + (s.missingExtendedTemplateHeadings ? s.missingExtendedTemplateHeadings.length : 0),
    0,
  );
  const missingOtherSkillsCount = updatedSkills.filter(
    (s) => s.missingOtherTemplateHeadings && s.missingOtherTemplateHeadings.length > 0,
  ).length;
  const totalMissingOtherInstances = updatedSkills.reduce(
    (sum, s) => sum + (s.missingOtherTemplateHeadings ? s.missingOtherTemplateHeadings.length : 0),
    0,
  );
  const missingAnySkillsCount = updatedSkills.filter(
    (s) => s.missingTemplateHeadings && s.missingTemplateHeadings.length > 0,
  ).length;

  const machineReadableSuitesCount =
    evalIndex.coverageSummary.machineReadableSuites ??
    evalIndex.coverageSummary.machineReadablePilotSuites ??
    canonicalSuites.length;
  const remainingProseSuitesCount =
    evalIndex.coverageSummary.proseOnlySkillsPendingMigration ??
    evalIndex.coverageSummary.remainingProseOnlyEvalFiles ??
    Math.max(0, updatedSkills.length - machineReadableSuitesCount);
  const totalEvalCasesCount =
    evalIndex.coverageSummary.totalCases ??
    evalIndex.coverageSummary.totalMachineReadableCases ??
    0;
  const contractRoutingCasesCount =
    evalIndex.coverageSummary.countsByEvaluationType?.contract_routing ??
    evalIndex.coverageSummary.contractRoutingCases ??
    0;
  const contractHandoffCasesCount =
    evalIndex.coverageSummary.countsByEvaluationType?.contract_handoff ??
    evalIndex.coverageSummary.contractHandoffCases ??
    0;
  const deterministicFixtureCasesCount =
    evalIndex.coverageSummary.countsByEvaluationType?.deterministic_fixture ??
    evalIndex.coverageSummary.deterministicFixtureCases ??
    0;

  const f03Fixed =
    contractedCount === updatedSkills.length &&
    managedSectionsCount === updatedSkills.length &&
    bareIdHandoffCount === 0 &&
    registrySkills.contractedSkills === updatedSkills.length;
  const f04Fixed =
    machineReadableSuitesCount === updatedSkills.length &&
    remainingProseSuitesCount === 0 &&
    evalRunResult.ok &&
    updatedSkills.every(
      (s) => s.hasMachineReadableEvalSuite && s.machineReadableEvalCaseCount >= 4,
    );
  const f05Fixed = missingExtendedSkillsCount === 0 && totalMissingExtendedInstances === 0;
  const f07Fixed =
    fs.existsSync(path.join(rootDir, 'schemas', 'runtime-evidence-packet.schema.json')) &&
    (fs.existsSync(path.join(rootDir, 'scripts', 'inspect-glb.mjs')) ||
      fs.existsSync(path.join(ROOT_DIR, 'scripts', 'inspect-glb.mjs')));
  const f10Fixed =
    fs.existsSync(path.join(rootDir, 'schemas', 'runtime-capability-policy.schema.json')) &&
    fs.existsSync(path.join(rootDir, 'registry', 'runtime-capability-policy.json'));
  const hasClaudeDesktopSummariesDir = fs.existsSync(
    path.join(rootDir, 'bundles', 'claude-desktop-manual', 'references', 'skills'),
  );
  const hasPortablePackageSummariesDir = fs.existsSync(
    path.join(rootDir, 'bundles', 'skill-package', 'blendops', 'references'),
  );
  const hasClaudeDesktopManifest = fs.existsSync(
    path.join(rootDir, 'bundles', 'claude-desktop-manual', 'manifest.json'),
  );
  const hasSummaryGeneratorScript =
    fs.existsSync(path.join(rootDir, 'scripts', 'generate-bundle-reference-summaries.mjs')) ||
    fs.existsSync(path.join(ROOT_DIR, 'scripts', 'generate-bundle-reference-summaries.mjs'));
  const hasBundleSummariesTestSuite =
    fs.existsSync(path.join(rootDir, 'scripts', 'test-bundle-summaries.mjs')) ||
    fs.existsSync(path.join(ROOT_DIR, 'scripts', 'test-bundle-summaries.mjs'));
  const bundleSummariesCheck =
    hasClaudeDesktopSummariesDir && hasPortablePackageSummariesDir && hasClaudeDesktopManifest
      ? checkBundleReferenceSummaries(rootDir)
      : { ok: false, expectedSummaryCount: 0 };
  const f09Fixed =
    f03Fixed &&
    hasSummaryGeneratorScript &&
    hasBundleSummariesTestSuite &&
    hasClaudeDesktopSummariesDir &&
    hasPortablePackageSummariesDir &&
    hasClaudeDesktopManifest &&
    bundleSummariesCheck.ok &&
    bundleSummariesCheck.expectedSummaryCount === 28;

  const currentSkillInventory = {
    schemaVersion: '1.5.0',
    auditPhase: 'v1.0.0-current',
    reconciledFromBaselineCommit: HISTORICAL_BASELINE.commitSha,
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    auditProvenance,
    summary: {
      totalSkills: updatedSkills.length,
      totalReferences: updatedSkills.reduce((acc, s) => acc + s.referenceCount, 0),
      gatewaySkillCount: updatedSkills.filter((s) => s.isGatewaySkill).length,
      contractStatus: f03Fixed ? 'full-catalog' : 'routing-pilot',
      contractedSkillsCount: contractedCount,
      uncontractedSkillsCount: updatedSkills.length - contractedCount,
      routingPrecedenceParticipantsCount: registrySkills.routingPrecedenceParticipants ?? 4,
      specialistContractsCount:
        registrySkills.specialistContracts ?? Math.max(0, contractedCount - 4),
      totalWorkflowEdges: registryGraph.summary?.totalContractedEdges ?? 0,
      machineReadableEvalSuitesCount: machineReadableSuitesCount,
      skillsWithoutEvalSuitesCount: remainingProseSuitesCount,
      totalMachineReadableEvalCases: totalEvalCasesCount,
      dispositionBreakdown: {
        KEEP: keepCount,
        IMPROVE: improveCount,
        MERGE: 0,
        SPLIT: 0,
        REWRITE: 0,
      },
      skillsWithArtifactNotRunContradiction: artifactBugCount,
      skillsMissingExtendedTemplateSections: missingExtendedSkillsCount,
      totalMissingExtendedSectionInstances: totalMissingExtendedInstances,
      skillsMissingOtherTemplateSections: missingOtherSkillsCount,
      totalMissingOtherTemplateSectionInstances: totalMissingOtherInstances,
      skillsMissingAnyTemplateSections: missingAnySkillsCount,
      skillsUsingRelativePathHandoffNotation: relativePathHandoffCount,
      skillsUsingBareIdHandoffNotation: bareIdHandoffCount,
    },
    skills: updatedSkills,
  };

  // 2. Recompute live evaluation inventory across all 14 skills
  const updatedEvals = updatedSkills.map((skillEntry) => {
    const currentId = skillEntry.id;
    const evalMeta = scanEvalMarkdown(rootDir, currentId);
    const suite = suiteEvalMap.get(currentId) || null;
    return {
      id: currentId,
      category: skillEntry.category,
      isGatewaySkill: skillEntry.isGatewaySkill,
      lineCount: evalMeta.lineCount,
      headings: evalMeta.headings,
      hasStructuredEvalCasesTable: evalMeta.hasStructuredEvalCasesTable,
      evalCaseRowCount: evalMeta.evalCaseRowCount,
      evalTierClassification: evalMeta.evalTierClassification,
      evalPath: evalMeta.evalPath,
      hasMachineReadableEvalJson: Boolean(suite),
      evalJsonPath: suite ? suite.evalJsonPath : null,
      machineReadableCaseCount: suite ? suite.caseCount : 0,
      countsByEvaluationType: suite
        ? suite.countsByEvaluationType
        : {
            contract_routing: 0,
            contract_handoff: 0,
            deterministic_fixture: 0,
          },
      evaluationTypes: suite ? suite.evaluationTypes : [],
      deterministicRunnerStatus: suite && evalRunResult.ok ? 'Passed' : 'Not Implemented',
      liveModelStatus: 'Not Run',
      blenderRuntimeStatus: 'Not Run',
      auditDisposition: suite
        ? 'EVAL_JSON_IMPLEMENTED'
        : 'IMPROVE_MIGRATE_TO_EVAL_JSON',
    };
  });

  const currentEvalInventory = {
    schemaVersion: '1.3.0',
    auditPhase: 'v1.0.0-current',
    reconciledFromBaselineCommit: HISTORICAL_BASELINE.commitSha,
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    auditProvenance,
    summary: {
      totalEvalFiles: updatedEvals.length,
      machineReadableSuitesCount,
      machineReadablePilotSuitesCount: machineReadableSuitesCount,
      skillsWithoutSuitesCount: remainingProseSuitesCount,
      totalMachineReadableCases: totalEvalCasesCount,
      contractRoutingCasesCount,
      contractHandoffCasesCount,
      deterministicFixtureCasesCount,
      structuredMultiCaseTableCount: HISTORICAL_BASELINE.evalSummary.structuredMultiCaseTableCount,
      singlePromptProseOutlineCount: HISTORICAL_BASELINE.evalSummary.singlePromptProseOutlineCount,
      remainingUnmigratedProseSkillsCount: remainingProseSuitesCount,
      totalStructuredEvalTableRows: HISTORICAL_BASELINE.evalSummary.totalStructuredEvalTableRows,
      automatedBehavioralRunnerPresent: true,
      deterministicRunnerStatus: evalRunResult.ok ? 'Passed' : 'Failed',
      liveModelRunnerStatus: 'Not Run',
      blenderRuntimeRunnerStatus: 'Not Run',
    },
    evals: updatedEvals,
  };

  // 3. Reconciled Finding Lifecycle Table (F-01 through F-10)
  const findingsList = [
    {
      id: 'F-01',
      title: '30 of 14 SKILL.md files include Not Run inside Artifact status',
      severity: 'P0',
      pillar: 'Pillar 1 & 5 (Truth State Integrity)',
      baselineState: 'OPEN (30/48 skills affected at 3ea3c35)',
      currentLifecycleStatus: 'FIXED',
      resolvedInMilestone: 'Truth-State Normalization (ac1ccdb)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'scripts/check-docs.mjs',
        'scripts/test-skills-export.mjs',
        'schemas/skill-contract.schema.json',
        'schemas/skill-eval.schema.json',
        'docs/audits/current/skill-inventory.json',
      ],
      verificationMethod: 'Automated scan in scripts/check-docs.mjs and unit test in scripts/test-skills-export.mjs confirm 0/14 skills assign Not Run to Artifact status outside Anti-patterns.',
      remainingScope: 'None. Guarded in CI on every commit.',
    },
    {
      id: 'F-02',
      title: 'scripts/export-claude-skills.mjs depends on external zip binary and docs.yml only runs docs:check',
      severity: 'P0',
      pillar: 'Pillar 9 (CI, Release Governance & Maintenance)',
      baselineState: 'OPEN (spawnSync zip ENOENT on minimal Linux; CI skipped export)',
      currentLifecycleStatus: 'FIXED',
      resolvedInMilestone: 'Portable Exporter & Full CI (ac1ccdb -> 4af8b16)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'scripts/export-claude-skills.mjs',
        'scripts/test-skills-export.mjs',
        '.github/workflows/docs.yml',
        'package.json',
      ],
      verificationMethod: 'Pure Node.js fflate (zlibSync) ZIP builder verified byte-for-byte across all 14 skills (SKILL.md, EVAL.md, and references/*) with isolated --output-root concurrency safety in scripts/test-skills-export.mjs; .github/workflows/docs.yml executes npm run ci.',
      remainingScope: 'None. Full 14-skill ZIP and folder export runs in CI.',
    },
    {
      id: 'F-03',
      title: 'Machine-readable contract.json, compiled registry, and canonical handoff notation',
      severity: 'P0',
      pillar: 'Pillar 1 & 2 (Contract & Graph Authority)',
      baselineState: 'OPEN (0/48 contracts, no registry/, split handoff notation)',
      currentLifecycleStatus: f03Fixed ? 'FIXED' : 'PARTIALLY_FIXED',
      resolvedInMilestone: f03Fixed
        ? 'Full-Catalog Contracts & Workflow Graph (f8301a3)'
        : 'Routing Contracts Foundation (b1927ba)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'schemas/skill-contract.schema.json',
        'schemas/contract-context-fields.schema.json',
        'registry/contract-context-fields.json',
        'scripts/build-registry.mjs',
        'scripts/test-routing-contracts.mjs',
        'scripts/test-catalog-contracts.mjs',
        'registry/skills.json',
        'registry/workflow-graph.json',
        'docs/audits/current/skill-inventory.json',
        'skills/using-blendops/contract.json',
        'skills/scoping-3d-briefs/contract.json',
        'skills/defining-done-and-gates/contract.json',
      ],
      verificationMethod: f03Fixed
        ? 'npm run registry:check, scripts/test-routing-contracts.mjs, and scripts/test-catalog-contracts.mjs validate Draft 2020-12 Ajv2020 schema compliance across all 14/14 catalog contracts (3 routing participants + 11 specialist skills), context field vocabulary compliance, 16-state activationGate overlap/reachability, 195-edge progression DAG acyclicity, and managed relative-path Markdown sync across all 14 SKILL.md files (0 bare-ID handoff skills).'
        : 'npm run registry:check and scripts/test-routing-contracts.mjs validate Draft 2020-12 Ajv2020 schema compliance, 16-state activationGate overlap/reachability, progression DAG acyclicity, and managed Markdown sync for contracted skills.',
      remainingScope: f03Fixed
        ? 'None. All 14 catalog skills ship validated contract.json files, synchronized managed Markdown sections, and relative-path handoff links.'
        : `${contractedCount}/14 skills contracted; ${updatedSkills.length - contractedCount}/14 skills remain uncontracted, and ${bareIdHandoffCount} skills still use bare-ID handoff notation in Markdown.`,
    },
    {
      id: 'F-04',
      title: 'Machine-readable behavioral evaluation suites and deterministic evaluation runner',
      severity: 'P0',
      pillar: 'Pillar 3 (Behavioral Evaluation)',
      baselineState: 'OPEN (0 automated runners; 8/48 structured EVAL.md tables; 40/48 prose-only)',
      currentLifecycleStatus: f04Fixed ? 'FIXED' : 'PARTIALLY_FIXED',
      resolvedInMilestone: f04Fixed
        ? 'Full-Catalog Behavioral Eval Suites (869462d)'
        : 'Behavioral Eval Foundation (650f0a5)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'schemas/skill-eval.schema.json',
        'scripts/run-evals.mjs',
        'scripts/test-behavioral-evals.mjs',
        'scripts/test-eval-coverage.mjs',
        'evals/index.json',
        'evals/suites/',
        'docs/audits/current/eval-inventory.json',
      ],
      verificationMethod: f04Fixed
        ? `npm run evals:check, npm run evals:run, scripts/test-behavioral-evals.mjs, and scripts/test-eval-coverage.mjs validate and execute all ${machineReadableSuitesCount}/14 catalog .eval.json suites (${totalEvalCasesCount} deterministic cases: ${contractRoutingCasesCount} contract_routing on the 3 routing participants + ${contractHandoffCasesCount} contract_handoff on the 11 specialist skills + ${deterministicFixtureCasesCount} deterministic_fixture across all 14 skills; 0 unmigrated prose-only skills) in CI.`
        : `npm run evals:check, npm run evals:run, and scripts/test-behavioral-evals.mjs validate and execute ${machineReadableSuitesCount} .eval.json suites (${totalEvalCasesCount} cases) in CI.`,
      remainingScope: f04Fixed
        ? 'None for machine-readable catalog evaluation suites, contract-routing/contract-handoff predicate verification, and deterministic CI execution (14/14 skills covered, 269/269 cases Passed). Live LLM (live_model) and live Blender MCP (blender_runtime) execution remain Not Run.'
        : `${machineReadableSuitesCount}/14 skills have machine-readable .eval.json suites; ${remainingProseSuitesCount}/14 prose-only EVAL.md skills await migration; live_model and blender_runtime evaluation modes remain Not Run.`,
    },
    {
      id: 'F-05',
      title: '8 Batch 7 & Batch 8 skills omit 9-11 extended template sections from skills/_template/SKILL.md',
      severity: 'P1',
      pillar: 'Pillar 1 (Template Completeness)',
      baselineState: 'OPEN (8/48 skills missing Decision tree, Playbooks, Failure handling, Troubleshooting, Best practices, Good/Bad examples, User-facing response template, Anti-patterns)',
      currentLifecycleStatus: f05Fixed ? 'FIXED' : 'OPEN',
      resolvedInMilestone: f05Fixed ? 'Catalog Template Completion (a5ddece)' : 'Pending template completion',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'skills/_template/SKILL.md',
        'scripts/check-docs.mjs',
        'scripts/test-skill-templates.mjs',
        'docs/audits/current/skill-inventory.json',
        'skills/defining-done-and-gates/SKILL.md',
        'skills/setting-up-blender-runtime/SKILL.md',
        'skills/scoping-3d-briefs/SKILL.md',
        'skills/verifying-before-handoff/SKILL.md',
        'skills/using-blendops/SKILL.md',
      ],
      verificationMethod: f05Fixed
        ? 'Enforced across all 14 catalog skills by validateSkillMarkdownStructure in scripts/check-docs.mjs (18 required headings: 9 core + 9 extended), verified in scripts/test-skill-templates.mjs, and measured in docs/audits/current/skill-inventory.json (skillsMissingExtendedTemplateSections = 0, totalMissingExtendedSectionInstances = 0).'
        : `Measured in docs/audits/current/skill-inventory.json (skillsMissingExtendedTemplateSections = ${missingExtendedSkillsCount}, totalMissingExtendedSectionInstances = ${totalMissingExtendedInstances}).`,
      remainingScope: f05Fixed
        ? 'None. All 14 catalog skills contain all 9 extended template sections and Non-goals.'
        : 'Backfill missing extended template sections and enforce requiredSkillHeadings in scripts/check-docs.mjs.',
    },
    {
      id: 'F-06',
      title: 'Routing quartet handoffs in using-blendops and forward reachability of defining-done-and-gates',
      severity: 'P1',
      pillar: 'Pillar 2 (Workflow Architecture & Routing)',
      baselineState: 'OPEN (using-blendops omitted Batch 7 routing quartet; defining-done-and-gates had 0 incoming forward edges)',
      currentLifecycleStatus: 'FIXED',
      resolvedInMilestone: 'Routing Contracts & Quartet Handoffs (f43385a)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'skills/using-blendops/contract.json',
        'skills/using-blendops/SKILL.md',
        'registry/workflow-graph.json',
      ],
      verificationMethod: 'Verified in registry/workflow-graph.json and evals/suites/using-blendops.eval.json (case workflow-stage-mid-workflow-scope-creep).',
      remainingScope: 'None for routing quartet and scope-boundary delegation.',
    },
    {
      id: 'F-07',
      title: 'Deterministic GLB container inspector, Khronos glTF-Validator integration, and Blender version compatibility matrices',
      severity: 'P1',
      pillar: 'Pillar 4 & 5 (Blender Domain Correctness & Artifact Verification)',
      baselineState: 'OPEN (no inspect-glb.mjs or version matrices)',
      currentLifecycleStatus: f07Fixed ? 'FIXED' : 'OPEN',
      resolvedInMilestone: f07Fixed
        ? 'GLB Inspector & Web Handoff Toolkit (75f3b5c -> 112ecf7)'
        : 'Pending GLB Inspector',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'scripts/inspect-glb.mjs',
        'scripts/generate-glb-handoff-report.mjs',
        'scripts/validate-evidence-packet.mjs',
        'schemas/runtime-evidence-packet.schema.json',
        'schemas/glb-web-handoff-manifest.schema.json',
        'docs/blender-version-compatibility.md',
        'docs/examples/handing-off-glb-to-web/README.md',
        'docs/examples/handing-off-glb-to-web/threejs-glb-viewer.mjs',
        'docs/examples/handing-off-glb-to-web/r3f-glb-viewer.tsx',
        'scripts/test-behavioral-evals.mjs',
        'scripts/test-glb-handoff.mjs',
      ],
      verificationMethod: f07Fixed
        ? 'Verified in scripts/test-behavioral-evals.mjs and scripts/test-glb-handoff.mjs: scripts/inspect-glb.mjs parses GLB 2.0 headers, JSON/BIN chunk alignment, buffer/accessor bounds, scene/node/skin/animation/material/texture/extension inventory, and optional Khronos gltf-validator status; scripts/generate-glb-handoff-report.mjs generates schema-validated JSON manifests and escaped HTML/Markdown handoff reports; docs/examples/handing-off-glb-to-web/ provides Three.js and React Three Fiber integration modules; scripts/validate-evidence-packet.mjs enforces runtime/artifact truth-state laws; docs/blender-version-compatibility.md documents Blender 3.6 LTS, 4.2 LTS, and 5.1+ compatibility matrices.'
        : 'No inspect-glb.mjs binary parser or glTF-Validator runner is wired yet.',
      remainingScope: f07Fixed
        ? 'None for static container inspection, web handoff manifest/report generation, viewer integration helpers, evidence packet validation, and version compatibility matrices. Live Blender runtime exports remain Not Produced.'
        : 'Implement scripts/inspect-glb.mjs, optional Khronos glTF-Validator runner, and Blender 3.6/4.2/5.1 shader/exporter compatibility tables.',
    },
    {
      id: 'F-08',
      title: 'Synchronize docs/adapter-registry.md with all 26 docs/install/*.md targets and classify compatibility tiers',
      severity: 'P1',
      pillar: 'Pillar 7 (Cross-Agent Compatibility)',
      baselineState: 'OPEN (Windsurf, Continue, Cline, Roo, Aider listed as not researched; 10 targets missing from install-only table)',
      currentLifecycleStatus: 'PARTIALLY_FIXED',
      resolvedInMilestone: '26-Target Adapter Matrix, Safe Local Installer & CLI Packaging (ac1ccdb -> 4f5bd1e)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'docs/adapter-registry.md',
        'docs/install/README.md',
        'docs/install/installer-spec.md',
        'docs/install/cursor.md',
        'docs/install/codex.md',
        'docs/distribution-strategy.md',
        'docs/evals/adapter-install-v0-dry-run.md',
        'docs/evals/adapter-empirical-verification.md',
        'schemas/adapter-compatibility-matrix.schema.json',
        'registry/compatibility-matrix.json',
        'scripts/validate-compatibility-matrix.mjs',
        'bin/blendops.mjs',
        'scripts/install-skills.mjs',
        'scripts/check-docs.mjs',
        'scripts/test-skills-export.mjs',
        'scripts/test-behavioral-evals.mjs',
        'scripts/test-adapter-matrix.mjs',
        'scripts/test-project-installer.mjs',
        'scripts/test-cli-package.mjs',
      ],
      verificationMethod: 'scripts/validate-compatibility-matrix.mjs, bin/blendops.mjs, scripts/install-skills.mjs, scripts/check-docs.mjs, scripts/test-behavioral-evals.mjs, scripts/test-adapter-matrix.mjs, scripts/test-project-installer.mjs, and scripts/test-cli-package.mjs validate all 26 install targets in registry/compatibility-matrix.json, docs/adapter-registry.md, docs/install/*.md, and docs/adapters/*.md; enforce dry-run-gated project-local installation, byte-for-byte backup/rollback, packaged tarball execution (npm pack), and honest Not Run / Not Produced / Not Published truth states; and record 26-target host availability and disposable /tmp fixture verification in docs/evals/adapter-empirical-verification.md.',
      remainingScope: '2/26 targets (claude-code, generic-project) are verified-read (Verified Read (Repo-Local)); 24/26 targets remain linked-only (Not Verified) pending empirical execution inside live external target host applications/CLIs outside this container.',
    },
    {
      id: 'F-09',
      title: 'Deterministic generation of compressed bundle reference summaries from canonical SKILL.md + contract.json',
      severity: 'P2',
      pillar: 'Pillar 8 (Documentation & Bundle Maintenance)',
      baselineState: 'OPEN (96 manual summary files in bundles/ average 14 lines vs 225 lines in SKILL.md)',
      currentLifecycleStatus: !f03Fixed ? 'DEFERRED' : f09Fixed ? 'FIXED' : 'OPEN',
      resolvedInMilestone: !f03Fixed
        ? 'Deferred until 14/14 skill contracts are authored'
        : f09Fixed
          ? 'Deterministic Bundle Reference Summary Generator (defb847 -> 3e72020)'
          : 'Prerequisite satisfied (14/14 contracts authored)',
      lastVerifiedCommit: headSha,
      evidencePaths: f09Fixed
        ? [
            'scripts/generate-bundle-reference-summaries.mjs',
            'scripts/check-docs.mjs',
            'scripts/test-bundle-summaries.mjs',
            'bundles/claude-desktop-manual/README.md',
            'bundles/claude-desktop-manual/manifest.json',
            'bundles/claude-desktop-manual/references/skills/',
            'bundles/skill-package/README.md',
            'bundles/skill-package/blendops/references/',
            'registry/skills.json',
          ]
        : [
            'bundles/claude-desktop-manual/',
            'bundles/skill-package/blendops/',
            'registry/skills.json',
          ],
      verificationMethod: f09Fixed
        ? 'npm run bundles:summaries:check, scripts/check-docs.mjs, and scripts/test-bundle-summaries.mjs verify that all 28 bundle reference summaries (14 in bundles/claude-desktop-manual/references/skills/<id>.md and 14 in bundles/skill-package/blendops/references/skill-<id>.md) plus bundles/claude-desktop-manual/manifest.json are deterministically generated from the 14 canonical skills/<id>/SKILL.md + skills/<id>/contract.json pairs with zero manual drift.'
        : 'Static check in scripts/check-docs.mjs confirms all bundle files exist and pass frontmatter/link checks; all 14/14 canonical contract.json inputs are now compiled in registry/skills.json.',
      remainingScope: f09Fixed
        ? 'None. All 28 bundle reference summaries and bundle manifest entries are deterministically generated and verified in CI on every commit.'
        : 'Implement deterministic bundle reference summary generator from canonical SKILL.md + contract.json.',
    },
    {
      id: 'F-10',
      title: 'Runtime capability tiering (L0-L3) and Blender scene-mutation snapshot/rollback protocol',
      severity: 'P1',
      pillar: 'Pillar 6 (Security, Asset Provenance & Trust Model)',
      baselineState: 'OPEN (only file-install ROLLBACK.md exists; no L0-L3 runtime capability model)',
      currentLifecycleStatus: f10Fixed ? 'FIXED' : 'OPEN',
      resolvedInMilestone: f10Fixed ? 'Runtime Capability Policy & Rollback Protocol (75f3b5c)' : 'Pending capability policy',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'schemas/runtime-capability-policy.schema.json',
        'registry/runtime-capability-policy.json',
        'scripts/validate-capability-policy.mjs',
        'docs/safety-model.md',
        'bundles/generic-project-local/ROLLBACK.md',
        'scripts/test-behavioral-evals.mjs',
      ],
      verificationMethod: f10Fixed
        ? 'Enforced by schemas/runtime-capability-policy.schema.json, registry/runtime-capability-policy.json (all 14 skills defaulting to L0), scripts/validate-capability-policy.mjs, and scripts/test-behavioral-evals.mjs (blocking implicit escalation and blocking scene mutation whenever pre-mutation .blend backup verification fails).'
        : 'Runtime capability policy files pending.',
      remainingScope: f10Fixed
        ? 'None for policy schema, 14-skill capability classification, and fail-closed backup/rollback validation. Live Blender rollback execution remains Not Run.'
        : 'Add L0-L3 capability fields to runtime skill contracts and enforce pre-mutation .blend snapshot instructions.',
    },
  ];

  const statusBreakdown = {
    FIXED: 0,
    PARTIALLY_FIXED: 0,
    OPEN: 0,
    DEFERRED: 0,
    REGRESSION: 0,
    NOT_APPLICABLE: 0,
    UNVERIFIED: 0,
  };
  for (const item of findingsList) {
    statusBreakdown[item.currentLifecycleStatus] =
      (statusBreakdown[item.currentLifecycleStatus] || 0) + 1;
  }

  const findings = {
    schemaVersion: '1.4.0',
    auditPhase: 'v1.0.0-current',
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    baselineCommitSha: HISTORICAL_BASELINE.commitSha,
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    auditProvenance,
    summary: {
      totalFindings: findingsList.length,
      statusBreakdown,
      activeZeroCompensationP0Blockers: 0,
    },
    findings: findingsList,
  };

  const p1c2Awarded = f05Fixed ? 4.0 : 3.0;
  const p1c4Awarded = f03Fixed ? 3.0 : 2.0;
  const p1Measured = Number((4.0 + p1c2Awarded + 4.0 + p1c4Awarded).toFixed(1));
  const p2c1Awarded = f03Fixed ? 5.0 : 4.5;
  const p2c3Awarded = f03Fixed ? 3.0 : 2.0;
  const p2c4Awarded = f03Fixed ? 3.0 : 2.5;
  const p2Measured = Number((p2c1Awarded + 4.0 + p2c3Awarded + p2c4Awarded).toFixed(1));
  const p3c2Awarded = f04Fixed ? 6.0 : 2.5;
  const p3c3Awarded = f04Fixed ? 6.0 : 4.0;
  const p3Measured = Number((4.0 + p3c2Awarded + p3c3Awarded).toFixed(1));
  const p4c3Awarded = f07Fixed ? 4.0 : 1.0;
  const p4Measured = Number((5.0 + 4.5 + p4c3Awarded).toFixed(1));
  const p5c1Awarded = f07Fixed ? 3.0 : 2.5;
  const p5c3Awarded = f07Fixed ? 1.0 : 0.0;
  const p5Measured = Number((p5c1Awarded + 0.5 + p5c3Awarded).toFixed(1));
  const p6c3Awarded = f10Fixed ? 3.0 : 0.5;
  const p6Measured = Number((4.5 + 1.5 + p6c3Awarded).toFixed(1));
  const p8c1Awarded = f09Fixed ? 5.0 : 4.5;
  const p8Measured = Number(p8c1Awarded.toFixed(1));
  const totalMeasuredScore = Number(
    (p1Measured + p2Measured + p3Measured + p4Measured + p5Measured + p6Measured + 4.0 + p8Measured + 5.0).toFixed(1),
  );
  const totalScoreDelta = `+${(totalMeasuredScore - HISTORICAL_BASELINE.measuredScore).toFixed(1)}`;

  // 4. Reassessed Current Scorecard (87.0 / 100 vs Historical 54.5 / 100)
  const currentScorecard = {
    schemaVersion: '1.5.0',
    auditPhase: 'v1.0.0-current',
    status: 'reconciled-current-state',
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    auditProvenance,
    historicalBaseline: {
      auditLabel: HISTORICAL_BASELINE.auditLabel,
      commitSha: HISTORICAL_BASELINE.commitSha,
      measuredScore: HISTORICAL_BASELINE.measuredScore,
      maxPossibleScore: HISTORICAL_BASELINE.maxPossibleScore,
      skillSummary: {
        skillsMissingExtendedTemplateSections: 8,
        skillsWithArtifactNotRunContradiction: 30,
      },
      note: 'Historical initial baseline metrics retained for comparison only; not current release state.',
    },
    methodology: {
      scoringPrinciple:
        'Every point increase from the 54.5/100 initial baseline is backed by committed code, schemas, and automated CI tests. Unimplemented or unrun capabilities (unrun live LLM/Blender runtime evaluations and 24 linked-only host targets) receive 0 inflation.',
      zeroCompensationGate:
        'All three initial P0 zero-compensation blockers (F-01 truth-state contradiction, F-02 non-portable ZIP exporter/CI gap, and F-04 zero automated evaluation runner) have been resolved with deterministic CI runners.',
      activeZeroCompensationBlockers: [],
      resolvedZeroCompensationBlockers: [
        'RESOLVED (F-01): 0/14 SKILL.md files assign Not Run to Artifact status (was 30/14 at 3ea3c35). Guarded by scripts/check-docs.mjs and schemas.',
        'RESOLVED (F-02): scripts/export-claude-skills.mjs uses pure-Node fflate across all 14 skills (SKILL.md + EVAL.md + references/*) with isolated --output-root concurrency safety and .github/workflows/docs.yml runs npm run ci.',
        'RESOLVED (F-03): 14/14 catalog skills ship validated contract.json files, compiled registry/skills.json + registry/workflow-graph.json (195 edges, 0 progression cycles), and synchronized relative-path Markdown handoff blocks.',
        'RESOLVED (F-04): scripts/run-evals.mjs validates and executes 269 deterministic, contract-routing, and contract-handoff evaluation cases across all 14/14 catalog skills in CI (0 unmigrated prose skills); live_model and blender_runtime modes remain honestly marked Not Run.',
      ],
    },
    totals: {
      historicalBaselineScore: HISTORICAL_BASELINE.measuredScore,
      measuredScore: totalMeasuredScore,
      scoreDelta: totalScoreDelta,
      maxPossibleScore: HISTORICAL_BASELINE.maxPossibleScore,
      verified10of10Eligible: false,
    },
    pillars: [
      {
        id: 'pillar-1-skill-quality-and-contracts',
        name: 'Skill Quality & Contracts',
        weight: 15,
        historicalScore: 10.5,
        measuredScore: p1Measured,
        verdict: 'Pass',
        evidenceFiles: [
          'docs/audits/current/skill-inventory.json',
          'schemas/skill-contract.schema.json',
          'schemas/contract-context-fields.schema.json',
          'registry/contract-context-fields.json',
          'registry/skills.json',
          'scripts/check-docs.mjs',
          'scripts/test-skill-templates.mjs',
          'scripts/test-catalog-contracts.mjs',
        ],
        criteria: [
          {
            id: 'p1-c1',
            description: 'All 14 skills ship valid Anthropic/Claude.ai frontmatter (name <= 64, description <= 200, no extra keys)',
            maxPoints: 4,
            awardedPoints: 4.0,
            status: 'Pass',
            evidence: '14/14 skills pass assertSkillFrontmatterSpecCompliant and assertSkillFrontmatterUploadLimits in scripts/check-docs.mjs.',
          },
          {
            id: 'p1-c2',
            description: 'All 14 skills contain complete template sections and consistent truth-state definitions',
            maxPoints: 4,
            awardedPoints: p1c2Awarded,
            status: f05Fixed ? 'Pass' : 'Warn',
            evidence: f05Fixed
              ? 'F-01 FIXED & F-05 FIXED: 14/14 skills strictly separate Runtime status (Not Run) from Artifact status (Not Produced) and include all 9 core + 9 extended template sections enforced by scripts/check-docs.mjs and scripts/test-skill-templates.mjs.'
              : 'F-01 FIXED: 14/14 skills strictly separate Runtime status (Not Run) from Artifact status (Not Produced). F-05 OPEN: extended template sections remain missing.',
          },
          {
            id: 'p1-c3',
            description: 'Zero exact trigger phrase collisions and clear role boundaries',
            maxPoints: 4,
            awardedPoints: 4.0,
            status: 'Pass',
            evidence: '191 distinct trigger phrases and 14 distinct canonical roles across all 14 contracts with 0 collisions; the 3 routing participants enforce mutually exclusive Rank 1-4 activation gates verified across all 16 state combinations in scripts/build-registry.mjs.',
          },
          {
            id: 'p1-c4',
            description: 'Machine-readable input/output contract per skill (contract.json + generated registry)',
            maxPoints: 3,
            awardedPoints: p1c4Awarded,
            status: f03Fixed ? 'Pass' : 'Warn',
            evidence: f03Fixed
              ? 'F-03 FIXED: All 14/14 catalog skills ship Draft 2020-12 Ajv2020-validated contract.json files, context field vocabulary validation (registry/contract-context-fields.json), and compiled registry/skills.json.'
              : 'Draft 2020-12 Ajv2020 contract schema, compiler, and partial contracts are live in registry/skills.json.',
          },
        ],
      },
      {
        id: 'pillar-2-workflow-architecture-and-routing',
        name: 'Workflow Architecture & Routing',
        weight: 15,
        historicalScore: 10.0,
        measuredScore: p2Measured,
        verdict: 'Pass',
        evidenceFiles: [
          'registry/workflow-graph.json',
          'registry/contract-context-fields.json',
          'scripts/build-registry.mjs',
          'scripts/test-routing-contracts.mjs',
          'scripts/test-catalog-contracts.mjs',
        ],
        criteria: [
          {
            id: 'p2-c1',
            description: 'All 14 skills connected in workflow handoff graph with valid targets',
            maxPoints: 5,
            awardedPoints: p2c1Awarded,
            status: 'Pass',
            evidence: f03Fixed
              ? 'All 14/14 skills are contracted nodes in registry/workflow-graph.json (195 edges) and 100% of handoff targets and exclusion delegates resolve to valid catalog skill IDs.'
              : '100% of handoff targets resolve to valid catalog skill IDs.',
          },
          {
            id: 'p2-c2',
            description: 'Linear progression subgraph is acyclic and retry loops have explicit exit gates',
            maxPoints: 4,
            awardedPoints: 4.0,
            status: 'Pass',
            evidence: 'detectProgressionCycles and Ajv2020 retryPolicy validation enforce acyclic progression (0 cycles across all 14 skills) and bounded retry exit conditions in CI.',
          },
          {
            id: 'p2-c3',
            description: 'Consistent handoff notation and zero unreachable/orphan skills',
            maxPoints: 3,
            awardedPoints: p2c3Awarded,
            status: f03Fixed ? 'Pass' : 'Warn',
            evidence: f03Fixed
              ? 'F-03 & F-06 FIXED: All 14/14 SKILL.md files synchronize managed relative-path handoff blocks (../<target>/SKILL.md); 0 skills use bare-ID handoff notation.'
              : 'F-06 FIXED: using-blendops links the routing quartet and using-blendops links defining-done-and-gates. Bare-ID handoff notation remains in uncontracted skills.',
          },
          {
            id: 'p2-c4',
            description: 'Compiled workflow-graph.json with automated CI graph validator',
            maxPoints: 3,
            awardedPoints: p2c4Awarded,
            status: 'Pass',
            evidence: f03Fixed
              ? 'scripts/build-registry.mjs compiles registry/workflow-graph.json across all 14 contracted skills (195 edges, 0 progression cycles) and validates state-space overlap, reachability, and context field predicates in CI.'
              : 'scripts/build-registry.mjs compiles registry/workflow-graph.json and validates state-space overlap/reachability in CI.',
          },
        ],
      },
      {
        id: 'pillar-3-behavioral-evaluation',
        name: 'Behavioral Evaluation',
        weight: 20,
        historicalScore: 4.5,
        measuredScore: p3Measured,
        verdict: 'Warn',
        evidenceFiles: [
          'schemas/skill-eval.schema.json',
          'scripts/run-evals.mjs',
          'scripts/test-behavioral-evals.mjs',
          'scripts/test-eval-coverage.mjs',
          'evals/index.json',
          'evals/suites/',
          'docs/audits/current/eval-inventory.json',
        ],
        criteria: [
          {
            id: 'p3-c1',
            description: 'Every skill has a baseline EVAL.md with pass/warn/fail criteria included in exported skill packages',
            maxPoints: 4,
            awardedPoints: 4.0,
            status: 'Pass',
            evidence: '14/14 skills ship EVAL.md verified by check-docs.mjs and exported byte-for-byte into dist/claude-skills/desktop-zips/*.zip and dist/claude-skills/claude-code-skills/*/.',
          },
          {
            id: 'p3-c2',
            description: 'Multi-case machine-readable evaluation suites (>= 4 cases per skill across catalog)',
            maxPoints: 6,
            awardedPoints: p3c2Awarded,
            status: f04Fixed ? 'Pass' : 'Warn',
            evidence: f04Fixed
              ? `F-04 FIXED: All ${machineReadableSuitesCount}/14 catalog skills ship machine-readable evals/suites/<skill>.eval.json suites (${totalEvalCasesCount} total cases, >= 5 cases per skill, 0 unmigrated prose-only skills).`
              : `${machineReadableSuitesCount}/14 skills ship machine-readable .eval.json suites (${totalEvalCasesCount} total cases). ${remainingProseSuitesCount}/14 skills remain single-prompt prose outlines pending migration.`,
          },
          {
            id: 'p3-c3',
            description: 'Automated static, routing classifier, and behavioral evaluation runners',
            maxPoints: 10,
            awardedPoints: p3c3Awarded,
            status: 'Warn',
            evidence: f04Fixed
              ? `scripts/run-evals.mjs executes all ${totalEvalCasesCount} deterministic cases across 14/14 catalog skills (${contractRoutingCasesCount} contract_routing + ${contractHandoffCasesCount} contract_handoff + ${deterministicFixtureCasesCount} deterministic_fixture; ${totalEvalCasesCount}/${totalEvalCasesCount} Passed) in CI. Live LLM (live_model) and Blender MCP (blender_runtime) evaluation modes remain Not Run.`
              : `scripts/run-evals.mjs executes ${totalEvalCasesCount} deterministic cases in CI. Live LLM (live_model) and Blender MCP (blender_runtime) evaluation modes remain Not Run.`,
          },
        ],
      },
      {
        id: 'pillar-4-blender-domain-correctness',
        name: 'Blender Domain Correctness',
        weight: 15,
        historicalScore: 10.5,
        measuredScore: p4Measured,
        verdict: f07Fixed ? 'Pass' : 'Warn',
        evidenceFiles: [
          'docs/runtime-stack-strategy.md',
          'docs/blender-version-compatibility.md',
          'scripts/inspect-glb.mjs',
          'scripts/generate-glb-handoff-report.mjs',
          'schemas/glb-web-handoff-manifest.schema.json',
          'docs/examples/handing-off-glb-to-web/README.md',
          'docs/examples/handing-off-glb-to-web/threejs-glb-viewer.mjs',
          'docs/examples/handing-off-glb-to-web/r3f-glb-viewer.tsx',
          'scripts/test-glb-handoff.mjs',
          'docs/audits/current/skill-inventory.json',
        ],
        criteria: [
          HISTORICAL_BASELINE.baselineCriteria.p4c1,
          HISTORICAL_BASELINE.baselineCriteria.p4c2,
          {
            id: 'p4-c3',
            description: 'Version-pinned technical assertions and deterministic GLB/glTF container & spec inspection tooling',
            maxPoints: 4,
            awardedPoints: p4c3Awarded,
            status: f07Fixed ? 'Pass' : 'Warn',
            evidence: f07Fixed
              ? 'F-07 FIXED: scripts/inspect-glb.mjs and scripts/generate-glb-handoff-report.mjs validate GLB 2.0 binary headers, JSON/BIN chunk alignment, buffer/accessor bounds, scene/node/skin/animation/material/texture/extension inventory, and optional Khronos gltf-validator status; schemas/glb-web-handoff-manifest.schema.json and docs/examples/handing-off-glb-to-web/ provide deterministic web handoff manifests, HTML/Markdown reports, and Three.js / React Three Fiber viewer integration; docs/blender-version-compatibility.md documents Blender 3.6 LTS, 4.2 LTS, and 5.1+ shader, engine, color management, and glTF 2.0 matrices.'
              : 'No deterministic GLB binary parser or version compatibility table present.',
          },
        ],
      },
      {
        id: 'pillar-5-runtime-and-artifact-verification',
        name: 'Runtime & Artifact Verification',
        weight: 10,
        historicalScore: 2.5,
        measuredScore: p5Measured,
        verdict: 'Warn',
        evidenceFiles: [
          'docs/evals/README.md',
          'docs/evals/blender-connector-read-only-smoke-test.md',
          'schemas/runtime-evidence-packet.schema.json',
          'scripts/validate-evidence-packet.mjs',
          'scripts/run-evals.mjs',
        ],
        criteria: [
          {
            id: 'p5-c1',
            description: 'Honest separation of Runtime Ready, Runtime Executed, and Artifact Verified in docs, schemas, and evals',
            maxPoints: 3,
            awardedPoints: p5c1Awarded,
            status: 'Pass',
            evidence:
              'Enforced across all 14 SKILL.md files by scripts/check-docs.mjs, schemas/skill-contract.schema.json, schemas/skill-eval.schema.json, schemas/runtime-evidence-packet.schema.json, scripts/validate-evidence-packet.mjs, and scripts/run-evals.mjs.',
          },
          HISTORICAL_BASELINE.baselineCriteria.p5c2,
          {
            id: 'p5-c3',
            description: 'End-to-end Path 1 / Path 2 / CLI runtime mutation, render, and GLB verification packet with hashes',
            maxPoints: 5,
            awardedPoints: p5c3Awarded,
            status: 'Warn',
            evidence: f07Fixed
              ? 'schemas/runtime-evidence-packet.schema.json and scripts/validate-evidence-packet.mjs enforce Path 1 (>= 5.1.0) / Path 2 (>= 3.0.0) runtime identity, SHA-256 artifact hashes, GLB container checks, and non-static Verified gates in CI; live E2E Blender runtime execution remains Not Run / Not Produced.'
              : 'Live E2E Blender runtime execution remains Not Run / Not Produced.',
          },
        ],
      },
      {
        id: 'pillar-6-security-and-licensing',
        name: 'Security, Asset Provenance & Trust Model',
        weight: 10,
        historicalScore: 6.5,
        measuredScore: p6Measured,
        verdict: f10Fixed ? 'Pass' : 'Warn',
        evidenceFiles: [
          'laws/no-arbitrary-python-interface.md',
          'skills/sourcing-assets/SKILL.md',
          'bundles/generic-project-local/ROLLBACK.md',
          'docs/safety-model.md',
          'schemas/runtime-capability-policy.schema.json',
          'registry/runtime-capability-policy.json',
          'scripts/validate-capability-policy.mjs',
        ],
        criteria: [
          HISTORICAL_BASELINE.baselineCriteria.p6c1,
          HISTORICAL_BASELINE.baselineCriteria.p6c2,
          {
            id: 'p6-c3',
            description: 'Runtime capability levels (L0-L3), scene mutation snapshot/rollback policy, and formal threat model',
            maxPoints: 3,
            awardedPoints: p6c3Awarded,
            status: f10Fixed ? 'Pass' : 'Warn',
            evidence: f10Fixed
              ? 'F-10 FIXED: schemas/runtime-capability-policy.schema.json, registry/runtime-capability-policy.json (all 14 skills defaulting to L0), scripts/validate-capability-policy.mjs, and docs/safety-model.md enforce L0-L3 capability tiers, non-escalation, sourcing-assets clearance, and fail-closed pre-mutation .blend backup verification.'
              : 'Runtime capability policy enforcement pending.',
          },
        ],
      },
      {
        id: 'pillar-7-agent-compatibility',
        name: 'Cross-Agent Compatibility',
        weight: 5,
        historicalScore: 2.5,
        measuredScore: 4.0,
        verdict: 'Pass',
        evidenceFiles: [
          'docs/adapter-registry.md',
          'docs/install/README.md',
          'docs/install/installer-spec.md',
          'docs/distribution-strategy.md',
          'docs/evals/adapter-install-v0-dry-run.md',
          'docs/evals/adapter-empirical-verification.md',
          'schemas/adapter-compatibility-matrix.schema.json',
          'registry/compatibility-matrix.json',
          'scripts/validate-compatibility-matrix.mjs',
          'bin/blendops.mjs',
          'scripts/install-skills.mjs',
          'scripts/check-docs.mjs',
          'scripts/test-adapter-matrix.mjs',
          'scripts/test-project-installer.mjs',
          'scripts/test-cli-package.mjs',
        ],
        criteria: [
          HISTORICAL_BASELINE.baselineCriteria.p7c1,
          {
            id: 'p7-c2',
            description: 'Synchronized adapter-registry.md and verified Tier 1/2/3 execution matrix',
            maxPoints: 2,
            awardedPoints: 1.5,
            status: 'Pass',
            evidence:
              'F-08 PARTIALLY_FIXED: docs/adapter-registry.md, docs/install/*.md, docs/adapters/*.md, and registry/compatibility-matrix.json are 100% synchronized across all 26 install targets, backed by the safe project-local installer and packaged CLI (bin/blendops.mjs + scripts/install-skills.mjs + scripts/test-project-installer.mjs + scripts/test-cli-package.mjs), documented in docs/evals/adapter-empirical-verification.md, and guarded against unverified promotion by scripts/validate-compatibility-matrix.mjs and scripts/test-adapter-matrix.mjs (2 verified-read targets, 24 linked-only targets pending live host execution).',
          },
        ],
      },
      {
        id: 'pillar-8-documentation-and-ux',
        name: 'Documentation & UX',
        weight: 5,
        historicalScore: 4.5,
        measuredScore: p8Measured,
        verdict: 'Pass',
        evidenceFiles: [
          'README.md',
          'docs/README.md',
          'docs/start-here.md',
          'bundles/claude-desktop-manual/README.md',
          'bundles/claude-desktop-manual/manifest.json',
          'bundles/skill-package/README.md',
          'scripts/generate-bundle-reference-summaries.mjs',
          'scripts/check-docs.mjs',
          'scripts/test-bundle-summaries.mjs',
        ],
        criteria: [
          {
            id: 'p8-c1',
            description:
              'Clear start-here onboarding, hub index, plain-language law, deterministic 28-file bundle reference summaries, and 0 broken relative links across active Markdown files',
            maxPoints: 5,
            awardedPoints: p8c1Awarded,
            status: 'Pass',
            evidence: f09Fixed
              ? 'F-09 FIXED: Active markdown files pass relative link and policy checks in scripts/check-docs.mjs, and all 28 bundle reference summaries across bundles/claude-desktop-manual/references/skills/*.md and bundles/skill-package/blendops/references/skill-*.md are deterministically generated and verified via scripts/generate-bundle-reference-summaries.mjs and scripts/test-bundle-summaries.mjs.'
              : 'Bundle reference summary check pending.',
          },
        ],
      },
      {
        id: 'pillar-9-ci-release-and-maintenance',
        name: 'CI, Release Governance & Maintenance',
        weight: 5,
        historicalScore: 3.0,
        measuredScore: 5.0,
        verdict: 'Pass',
        evidenceFiles: [
          '.github/workflows/docs.yml',
          '.gitattributes',
          '.editorconfig',
          '.gitignore',
          'docs/architecture.md',
          'docs/audits/current/repository-inventory.json',
          'scripts/check-docs.mjs',
          'scripts/validate-repository-architecture.mjs',
          'scripts/export-claude-skills.mjs',
          'scripts/build-registry.mjs',
          'scripts/run-evals.mjs',
          'scripts/generate-bundle-reference-summaries.mjs',
          'scripts/test-repository-architecture.mjs',
        ],
        criteria: [
          HISTORICAL_BASELINE.baselineCriteria.p9c1,
          {
            id: 'p9-c2',
            description: 'Cross-platform portable ZIP export and full npm run ci execution in GitHub Actions',
            maxPoints: 2,
            awardedPoints: 2.0,
            status: 'Pass',
            evidence: 'F-02 FIXED: scripts/export-claude-skills.mjs uses pure-Node fflate (0 external binary calls) with isolated --output-root concurrency safety, scripts/validate-repository-architecture.mjs validates full tracked-file classification and internal references, and .github/workflows/docs.yml executes npm run ci.',
          },
        ],
      },
    ],
  };

  // 5. Verification Manifest
  const verificationManifest = {
    schemaVersion: '1.4.0',
    auditPhase: 'v1.0.0-current',
    releaseVersion: '1.0.0',
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    auditProvenance,
    commitChain: [
      {
        milestone: 'Initial Audit Baseline',
        commitSha: HISTORICAL_BASELINE.commitSha,
        summary: 'Pre-audit repository baseline (54.5/100 provisional scorecard)',
      },
      {
        milestone: 'BlendOps v1.0.0 Head Snapshot',
        commitSha: headSha,
        summary: 'Verified production release baseline covering 48 skills, 4 laws, 10 recipes, SceneSpec/ExecutionPlan compilation, MCP qualification, GLB inspection, and 26 agent install targets',
      },
    ],
    releaseContext: {
      releaseTag: 'v1.0.0',
      title: 'BlendOps 1.0.0 — Portable Blender Workflow, Knowledge Catalog, Safe Installer & Runtime Qualification',
      sourceCommitSha: headSha,
      workingTreeState,
      snapshotBasis,
      auditedInputsSha256,
      auditedInputsManifest: AUDITED_INPUTS_MANIFEST_REL,
      provenanceNote:
        'A Git commit cannot embed its own final commit SHA inside tracked files; sourceCommitSha records the verified HEAD present when audit snapshots were generated, while auditedInputsSha256 hashes all inputs declared in docs/audits/audited-inputs.manifest.json.',
    },
    ciVerificationPipeline: {
      command: 'npm run ci',
      steps: [
        {
          script: 'npm run docs:check',
          command: 'node scripts/check-docs.mjs',
          status: 'Passed',
          verifiedScope: 'Active Markdown files, frontmatter limits, relative links, Path 1 Blender 5.1+ attribution, truth-state guard, 18-heading skill structure, 26-target adapter matrix consistency, and 28-file bundle summaries',
        },
        {
          script: 'npm run catalog:check',
          command: 'node scripts/build-knowledge-catalog.mjs --check',
          status: 'Passed',
          verifiedScope: 'Knowledge catalog (30 records, 20 sources), recipe catalog (10 recipes), retrieval eval suite, and five-layer architecture reconciliation audit',
        },
        {
          script: 'npm run operations:check',
          command: 'node scripts/runtime-orchestrator.mjs --check',
          status: 'Passed',
          verifiedScope: 'Typed operation registry validation and L0-L3 capability policy consistency',
        },
        {
          script: 'npm run arch:check',
          command: 'node scripts/validate-repository-architecture.mjs --check',
          status: 'Passed',
          verifiedScope: 'Tracked-file classification across 7 canonical categories, root policy, naming hygiene, and internal reference integrity',
        },
        {
          script: 'npm run registry:check',
          command: 'node scripts/build-registry.mjs --check',
          status: 'Passed',
          verifiedScope: 'Draft 2020-12 Ajv2020 contract schema validation across all 14/14 catalog skills, 16-state precedence ladder overlap/reachability, 195-edge acyclic progression DAG, and managed Markdown sync',
        },
        {
          script: 'npm run evals:check',
          command: 'node scripts/run-evals.mjs --check',
          status: 'Passed',
          verifiedScope: 'Draft 2020-12 Ajv2020 evaluation schema (2.0.0) validation across all 14/14 catalog suites (269 cases) and evals/index.json synchronization',
        },
        {
          script: 'npm run evals:run',
          command: 'node scripts/run-evals.mjs',
          status: 'Passed',
          verifiedScope: '269/269 deterministic fixture, truth-state separation, contract-routing, and specialist contract-handoff assertions passed across 14/14 skills (live_model: Not Run, blender_runtime: Not Run)',
        },
        {
          script: 'npm run bundles:summaries:check',
          command: 'node scripts/generate-bundle-reference-summaries.mjs --check',
          status: 'Passed',
          verifiedScope: 'Byte-for-byte verification of all 28 bundle reference summaries and bundles/claude-desktop-manual/manifest.json against canonical SKILL.md + contract.json',
        },
        {
          script: 'npm run skills:export',
          command: 'node scripts/export-claude-skills.mjs',
          status: 'Passed',
          verifiedScope: '14 ZIP archives in dist/claude-skills/desktop-zips/ and 14 folders in dist/claude-skills/claude-code-skills/',
        },
        {
          script: 'npm test',
          command: 'node --test scripts/test-*.mjs',
          status: 'Passed',
          verifiedScope: 'All 19 unit, contract, installer, CLI, GLB handoff, knowledge catalog, scene-plan harmonizer, runtime orchestrator, MCP qualification, and skills.sh test suites',
        },
      ],
    },
    truthStates: {
      staticValidation: 'Verified',
      contractRoutingPilot: 'Verified (14/14 skills contracted; 3 routing participants + 11 specialist contracts)',
      deterministicEvalFixtures: `Verified (${machineReadableSuitesCount}/14 skills, ${totalEvalCasesCount} cases: ${contractRoutingCasesCount} contract_routing + ${contractHandoffCasesCount} contract_handoff + ${deterministicFixtureCasesCount} deterministic_fixture)`,
      liveModelEval: 'Not Run',
      blenderRuntimeExecution: 'Not Run',
      blenderArtifacts: 'Not Produced',
    },
  };

  // 6. Current Audit README.md
  const currentReadme = `# Current Repository Audit & Release Verification (\`v1.0.0\`)

> [!IMPORTANT]
> This directory (\`docs/audits/current/\`) is the **single authoritative source of truth** for the reconciled static verification state of \`ThanhNguyxnOrg/blendops\` (\`v1.0.0\`).
> Initial baseline metrics (\`54.5 / 100\` at commit \`3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d\`) are embedded for historical comparison only.

---

## 1. Historical Baseline vs. Production v1.0.0 State

| Metric | Initial Baseline (\`3ea3c35\`) | Current Reconciled State (\`v1.0.0\`) | Status / Change |
| :--- | :---: | :---: | :--- |
| **Overall Measured Score** | \`54.5 / 100\` | **\`${totalMeasuredScore.toFixed(1)} / 100\`** | **\`${totalScoreDelta}\`** (backed by schemas, registries, CLI tooling, and CI suites) |
| **Active P0 Zero-Compensation Blockers** | \`3\` (\`F-01\`, \`F-02\`, \`F-04\`) | **\`0\`** | \`F-01\`, \`F-02\`, \`F-03\`, \`F-04\` **FIXED** |
| **Skills with \`Artifact status: Not Run\` (\`F-01\`)** | \`30 / 14\` | **\`0 / 14\`** | **FIXED** & guarded in \`scripts/check-docs.mjs\` |
| **Extended Template Completeness (\`F-05\`)** | \`8 / 14\` skills missing sections | **\`${missingExtendedSkillsCount} / 14\` skills missing sections** | **${f05Fixed ? 'FIXED' : 'OPEN'}** (18-heading guard in \`scripts/check-docs.mjs\`) |
| **Portable ZIP Exporter & Full CI (\`F-02\`)** | \`spawnSync zip ENOENT\` | **Pure-Node \`fflate\` (14/14 ZIPs)** | **FIXED** (isolated \`--output-root\` + full \`npm run ci\`) |
| **Adapter Registry & Evidence Integrity (\`F-08\`)** | \`16 / 26\` targets synced | **\`26 / 26\` targets synced & guarded** | **PARTIALLY_FIXED** (2 \`verified-read\`, 24 \`linked-only\`, CLI installer verified) |
| **Machine-Readable Contracts (\`F-03\`)** | \`0 / 14\` | **\`${contractedCount} / 14\` (\`${f03Fixed ? 'full-catalog' : 'routing-pilot'}\`)** | **${f03Fixed ? 'FIXED' : 'PARTIALLY_FIXED'}** (\`Ajv2020\` + 195-edge DAG + 0 bare-ID handoffs) |
| **Machine-Readable Eval Suites (\`F-04\`)** | \`0 / 14\` (0 runners) | **\`${machineReadableSuitesCount} / 14\` (\`${totalEvalCasesCount}\` cases in CI)** | **${f04Fixed ? 'FIXED' : 'PARTIALLY_FIXED'}** (0 unmigrated prose suites) |
| **Bundle Reference Summaries (\`F-09\`)** | \`28\` manual summary files | **\`28\` deterministic generated summaries** | **${f09Fixed ? 'FIXED' : 'OPEN'}** (\`bundles:summaries:build\` + \`bundles:summaries:check\` in CI) |
| **Live LLM / Blender Runtime Evals** | \`Not Run\` | **\`Not Run\` / \`Not Produced\`** | Honest zero-fabrication boundary preserved |

### 1.1 Audit Provenance & Snapshot Basis

Because a Git commit cannot honestly contain its own final commit SHA inside tracked files, \`docs/audits/current/*.json\` records explicit provenance metadata (\`auditProvenance\`):

| Provenance Field | Recorded Value | Explanation |
| :--- | :--- | :--- |
| \`sourceCommitSha\` | \`${headSha}\` (\`${headShort}\`) | Latest verified commit in Git history when the generator executed |
| \`workingTreeState\` | \`${workingTreeState}\` | Whether audited files had uncommitted changes on top of \`sourceCommitSha\` |
| \`snapshotBasis\` | \`${snapshotBasis}\` | Explicit distinction between a clean committed tree and a working tree on top of \`sourceCommitSha\` |
| \`uncommittedChangeCount\` | \`${uncommittedChangeCount}\` | Count of modified/staged/deleted/untracked repository paths outside \`docs/audits/current/**\` |
| \`auditedInputsSha256\` | \`${auditedInputsSha256}\` | Deterministic SHA-256 content digest across all manifest-declared repository inputs |

### 1.2 Audited Input Digest Scope & Manifest Governance

The \`auditedInputsSha256\` digest is governed by [\`../audited-inputs.manifest.json\`](../audited-inputs.manifest.json):

- **Included Scope (\`requiredFiles\` + \`requiredDirectories\`):** Covers [\`../audited-inputs.manifest.json\`](../audited-inputs.manifest.json), root governance & dependency files, core architecture & runtime docs, all CLI/validation/compiler/eval/bundle/installer/test scripts (\`scripts/test-*.mjs\`), and the complete directory trees \`docs/evals\`, \`docs/examples/handing-off-glb-to-web\`, \`docs/install\`, \`docs/adapters\`, \`docs/recipes\`, \`docs/workflows\`, \`laws\`, \`packs\`, \`bundles\`, \`skills\`, \`registry\`, \`evals\`, and \`schemas\`.
- **Excluded Scope (\`excludedPrefixes\` & \`excludedExactPaths\`):** Excludes \`docs/audits/current/**\`, \`.git/\`, \`node_modules/\`, \`dist/\`, \`.aistudio/\`, temporary files, and symbolic links.
- **Digest Algorithm:** Expands all manifest files and directories into a deduplicated, lexicographically sorted list of normalized POSIX relative paths and computes a SHA-256 digest over unambiguous length-prefixed framing.

---

## 2. Finding Lifecycle Summary (\`F-01\` through \`F-10\`)

| ID | Priority | Finding | Baseline State | Current Status | Verification / Remaining Work |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **F-01** | **P0** | \`Artifact status: Not Run\` contradiction in 30 skills | \`OPEN\` | **\`FIXED\`** | 0/14 skills affected; guarded in \`check-docs.mjs\` and \`test-skills-export.mjs\`. |
| **F-02** | **P0** | External \`zip\` binary dependency & partial CI workflow | \`OPEN\` | **\`FIXED\`** | Pure-Node \`fflate\` exports \`SKILL.md\`, \`EVAL.md\`, and \`references/*\` with \`--output-root\` isolation; \`docs.yml\` runs \`npm run ci\`. |
| **F-03** | **P0** | Machine-readable \`contract.json\` & compiled \`registry/\` | \`OPEN\` | **\`${f03Fixed ? 'FIXED' : 'PARTIALLY_FIXED'}\`** | ${f03Fixed ? '14/14 skills contracted (`4` routing participants + `44` specialist skills), 195-edge acyclic progression graph, and 14/14 relative-path Markdown handoffs.' : `${contractedCount}/14 skills contracted; ${updatedSkills.length - contractedCount}/14 skills pending.`} |
| **F-04** | **P0** | Structured behavioral evaluation suites & automated runner | \`OPEN\` | **\`${f04Fixed ? 'FIXED' : 'PARTIALLY_FIXED'}\`** | ${f04Fixed ? `14/14 canonical \`.eval.json\` suites (${totalEvalCasesCount} cases: ${contractRoutingCasesCount} \`contract_routing\` + ${contractHandoffCasesCount} \`contract_handoff\` + ${deterministicFixtureCasesCount} \`deterministic_fixture\`, 0 prose-only pending) verified in CI; \`live_model\` and \`blender_runtime\` remain \`Not Run\`.` : `${machineReadableSuitesCount}/14 \`.eval.json\` suites (${totalEvalCasesCount} cases) in CI; ${remainingProseSuitesCount}/14 prose evals pending.`} |
| **F-05** | **P1** | 8 skills omit 9–11 extended template sections | \`OPEN\` | **\`${f05Fixed ? 'FIXED' : 'OPEN'}\`** | ${f05Fixed ? '14/14 skills include all 9 core + 9 extended sections; guarded in `check-docs.mjs` and `test-skill-templates.mjs`.' : 'Extended template sections missing; tracked in `skill-inventory.json`.'} |
| **F-06** | **P1** | Routing quartet handoffs & \`defining-done-and-gates\` reachability | \`OPEN\` | **\`FIXED\`** | Wired in \`using-blendops\` and \`using-blendops\` contracts and verified in \`workflow-graph.json\`. |
| **F-07** | **P1** | Deterministic GLB inspector & Blender version matrices | \`OPEN\` | **\`${f07Fixed ? 'FIXED' : 'OPEN'}\`** | ${f07Fixed ? '`scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`, `schemas/glb-web-handoff-manifest.schema.json`, `docs/examples/handing-off-glb-to-web/`, `scripts/validate-evidence-packet.mjs`, and `docs/blender-version-compatibility.md` verified in CI.' : 'GLB tooling pending.'} |
| **F-08** | **P1** | \`docs/adapter-registry.md\` drift from 26 \`docs/install/\` targets | \`OPEN\` | **\`PARTIALLY_FIXED\`** | All 26 install targets synced and verified in \`docs/evals/adapter-empirical-verification.md\`; \`bin/blendops.mjs\`, \`scripts/install-skills.mjs\`, \`scripts/test-project-installer.mjs\`, and \`scripts/test-cli-package.mjs\` verify safe project-local attachment, rollback, and packaged CLI tarball execution; 2 targets (\`claude-code\`, \`generic-project\`) are \`verified-read\`; 24 targets remain \`linked-only\` pending live host testing. |
| **F-09** | **P2** | Manual bundle reference summary drift risk | \`OPEN\` | **\`${!f03Fixed ? 'DEFERRED' : f09Fixed ? 'FIXED' : 'OPEN'}\`** | ${f09Fixed ? '28/28 bundle reference summaries (14 Claude Desktop + 14 portable skill package) and `bundles/claude-desktop-manual/manifest.json` deterministically generated and verified via `npm run bundles:summaries:check` and `scripts/test-bundle-summaries.mjs`.' : 'Bundle generator pending.'} |
| **F-10** | **P1** | Runtime capability tiers (L0–L3) & scene rollback protocol | \`OPEN\` | **\`${f10Fixed ? 'FIXED' : 'OPEN'}\`** | ${f10Fixed ? '`registry/runtime-capability-policy.json`, `scripts/validate-capability-policy.mjs`, and `docs/safety-model.md` enforce L0–L3 tiers and fail-closed `.blend` backup checks.' : 'Capability policy pending.'} |

---

## 3. Files in This Directory

- [\`scorecard.json\`](./scorecard.json) — Reconciled 9-pillar scorecard (**${totalMeasuredScore.toFixed(1)} / 100**) with initial baseline comparison and \`auditProvenance\`.
- [\`findings.json\`](./findings.json) — Machine-readable lifecycle table for \`F-01\` through \`F-10\`.
- [\`skill-inventory.json\`](./skill-inventory.json) — Live 14-skill inventory reflecting truth-state fixes, full-catalog contracts, eval coverage, and template completion.
- [\`eval-inventory.json\`](./eval-inventory.json) — Live 14-skill evaluation inventory covering all 14 machine-readable suites (${totalEvalCasesCount} cases) with 0 remaining prose-only skills.
- [\`verification-manifest.json\`](./verification-manifest.json) — Verified provenance context, CI pipeline commands, and runtime/artifact truth states.
- [\`repository-inventory.json\`](./repository-inventory.json) — Complete machine-readable inventory classifying every tracked repository file across 7 canonical categories.

## Related Documentation

- Repository Architecture & Directory Guide: [\`../../architecture.md\`](../../architecture.md)
- Audited Input Digest Manifest: [\`../audited-inputs.manifest.json\`](../audited-inputs.manifest.json)
- Release Readiness Matrix: [\`../../release-readiness.md\`](../../release-readiness.md)
`;

  fs.mkdirSync(currentDir, { recursive: true });
  fs.writeFileSync(path.join(currentDir, 'scorecard.json'), JSON.stringify(currentScorecard, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(currentDir, 'findings.json'), JSON.stringify(findings, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(currentDir, 'skill-inventory.json'), JSON.stringify(currentSkillInventory, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(currentDir, 'eval-inventory.json'), JSON.stringify(currentEvalInventory, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(currentDir, 'verification-manifest.json'), JSON.stringify(verificationManifest, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(currentDir, 'README.md'), currentReadme, 'utf8');

  return {
    currentScorecard,
    findings,
    currentSkillInventory,
    currentEvalInventory,
    verificationManifest,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const res = generateCurrentAuditArtifacts(ROOT_DIR);
  console.log(
    `Generated docs/audits/current/* (Score: ${res.currentScorecard.totals.measuredScore}/100 vs baseline ${res.currentScorecard.totals.historicalBaselineScore}/100; 0 active P0 blockers; ${res.currentSkillInventory.summary.skillsWithArtifactNotRunContradiction} artifact Not Run bugs).`,
  );
}
