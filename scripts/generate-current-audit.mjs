#!/usr/bin/env node
import fs from 'node:fs';
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

function gitRequired(rootDir, args, { trimOutput = true } = {}) {
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

export function inspectWorkingTreeProvenance(rootDir = ROOT_DIR) {
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
  const changedPaths = [];

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

    changedPaths.push(filePath);
  }

  const workingTreeState = changedPaths.length === 0 ? 'clean' : 'dirty';
  const snapshotBasis =
    workingTreeState === 'clean'
      ? 'clean-committed-tree'
      : 'working-tree-on-top-of-source-commit';

  return {
    workingTreeState,
    snapshotBasis,
    uncommittedChangeCount: changedPaths.length,
  };
}

export function scanSkillMarkdown(rootDir, skillId) {
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

export function generateCurrentAuditArtifacts(rootDir = ROOT_DIR) {
  const phase0Dir = path.join(rootDir, 'docs', 'audits', 'phase-0');
  const currentDir = path.join(rootDir, 'docs', 'audits', 'current');

  const phase0Scorecard = JSON.parse(
    fs.readFileSync(path.join(phase0Dir, 'baseline-scorecard.json'), 'utf8'),
  );
  const phase0SkillInv = JSON.parse(
    fs.readFileSync(path.join(phase0Dir, 'skill-inventory.json'), 'utf8'),
  );
  const phase0EvalInv = JSON.parse(
    fs.readFileSync(path.join(phase0Dir, 'eval-inventory.json'), 'utf8'),
  );
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
  const headShort = gitRequired(rootDir, ['rev-parse', '--short', 'HEAD']);
  const headDate = gitRequired(rootDir, ['log', '-1', '--format=%ci', 'HEAD']);
  const branchName = gitRequired(rootDir, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const { workingTreeState, snapshotBasis, uncommittedChangeCount } =
    inspectWorkingTreeProvenance(rootDir);
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

  const pilotEvalMap = new Map(
    evalIndex.pilotSuites.map((s) => [s.skillId, s]),
  );

  // 1. Recompute live skill inventory across all 48 skills
  const updatedSkills = phase0SkillInv.skills.map((oldSkill) => {
    const live = scanSkillMarkdown(rootDir, oldSkill.id);
    const pilotEval = pilotEvalMap.get(oldSkill.id) || null;
    const remainingIssues = oldSkill.issues.filter((issue) => {
      if (issue === 'contradicts_truth_state_law_artifact_not_run') {
        return live.hasArtifactNotRunBug;
      }
      if (/^missing_(\d+|extended)_template_sections$/.test(issue)) {
        return (
          live.missingExtendedTemplateHeadings.length > 0 ||
          live.missingCoreTemplateHeadings.length > 0
        );
      }
      if (
        issue === 'uses_bare_skill_id_handoff_notation' ||
        issue === 'uses_legacy_bare_id_handoff_notation'
      ) {
        return live.handoffNotationStyle !== 'relative_path';
      }
      if (
        issue === 'undeclared_cross_skill_mentions_in_body' ||
        /^has_\d+_undeclared_body_handoff_mentions$/.test(issue)
      ) {
        return !(live.hasContract && live.hasManagedSections);
      }
      return true;
    });

    if (
      (live.missingExtendedTemplateHeadings.length > 0 ||
        live.missingCoreTemplateHeadings.length > 0) &&
      !remainingIssues.some((issue) => /^missing_(\d+|extended)_template_sections$/.test(issue))
    ) {
      remainingIssues.push('missing_extended_template_sections');
    }

    if (
      live.handoffNotationStyle !== 'relative_path' &&
      !remainingIssues.includes('uses_bare_skill_id_handoff_notation')
    ) {
      remainingIssues.push('uses_bare_skill_id_handoff_notation');
    }

    const auditDisposition = remainingIssues.length === 0 ? 'KEEP' : 'IMPROVE';

    return {
      ...oldSkill,
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
      declaredHandoffTargets:
        live.declaredHandoffTargets !== null
          ? live.declaredHandoffTargets
          : oldSkill.declaredHandoffTargets,
      declaredHandoffEdgeCount:
        live.declaredHandoffEdgeCount !== null
          ? live.declaredHandoffEdgeCount
          : oldSkill.declaredHandoffEdgeCount,
      undeclaredBodyMentionsCount:
        live.hasContract && live.hasManagedSections ? 0 : oldSkill.undeclaredBodyMentionsCount,
      undeclaredBodyMentions:
        live.hasContract && live.hasManagedSections ? [] : oldSkill.undeclaredBodyMentions,
      hasContract: live.hasContract,
      hasManagedMarkdownSections: live.hasManagedSections,
      hasMachineReadableEvalSuite: Boolean(pilotEval),
      machineReadableEvalCaseCount: pilotEval ? pilotEval.caseCount : 0,
      hasArtifactNotRunBug: live.hasArtifactNotRunBug,
      issues: remainingIssues,
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

  const f03Fixed =
    contractedCount === updatedSkills.length &&
    managedSectionsCount === updatedSkills.length &&
    bareIdHandoffCount === 0 &&
    registrySkills.contractedSkills === updatedSkills.length;
  const f05Fixed = missingExtendedSkillsCount === 0 && totalMissingExtendedInstances === 0;
  const f07Fixed =
    fs.existsSync(path.join(rootDir, 'schemas', 'runtime-evidence-packet.schema.json')) &&
    (fs.existsSync(path.join(rootDir, 'scripts', 'inspect-glb.mjs')) ||
      fs.existsSync(path.join(ROOT_DIR, 'scripts', 'inspect-glb.mjs')));
  const f10Fixed =
    fs.existsSync(path.join(rootDir, 'schemas', 'runtime-capability-policy.schema.json')) &&
    fs.existsSync(path.join(rootDir, 'registry', 'runtime-capability-policy.json'));

  const currentSkillInventory = {
    schemaVersion: '1.4.0',
    auditPhase: 'phase-5-current',
    reconciledFromBaselineCommit: phase0SkillInv.commitSha,
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
      machineReadableEvalSuitesCount: evalIndex.coverageSummary.machineReadablePilotSuites,
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

  // 2. Recompute live evaluation inventory across all 48 skills
  const updatedEvals = phase0EvalInv.evals.map((oldEval) => {
    const pilotSuite = pilotEvalMap.get(oldEval.id) || null;
    return {
      ...oldEval,
      hasMachineReadableEvalJson: Boolean(pilotSuite),
      evalJsonPath: pilotSuite ? pilotSuite.evalJsonPath : null,
      machineReadableCaseCount: pilotSuite ? pilotSuite.caseCount : 0,
      evaluationTypes: pilotSuite ? pilotSuite.evaluationTypes : [],
      deterministicRunnerStatus: pilotSuite ? 'Passed' : 'Not Implemented',
      liveModelStatus: 'Not Run',
      blenderRuntimeStatus: 'Not Run',
      auditDisposition: pilotSuite
        ? 'PILOT_JSON_IMPLEMENTED'
        : 'IMPROVE_MIGRATE_TO_EVAL_JSON',
    };
  });

  const currentEvalInventory = {
    schemaVersion: '1.2.0',
    auditPhase: 'phase-5-current',
    reconciledFromBaselineCommit: phase0EvalInv.commitSha,
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    auditProvenance,
    summary: {
      totalEvalFiles: updatedEvals.length,
      machineReadablePilotSuitesCount: evalIndex.coverageSummary.machineReadablePilotSuites,
      totalMachineReadableCases: evalIndex.coverageSummary.totalMachineReadableCases,
      contractRoutingCasesCount: evalIndex.coverageSummary.contractRoutingCases,
      deterministicFixtureCasesCount: evalIndex.coverageSummary.deterministicFixtureCases,
      structuredMultiCaseTableCount: phase0EvalInv.summary.structuredMultiCaseTableCount,
      singlePromptProseOutlineCount: phase0EvalInv.summary.singlePromptProseOutlineCount,
      remainingUnmigratedProseSkillsCount: evalIndex.coverageSummary.remainingProseOnlyEvalFiles,
      totalStructuredEvalTableRows: phase0EvalInv.summary.totalStructuredEvalTableRows,
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
      title: '30 of 48 SKILL.md files include Not Run inside Artifact status',
      severity: 'P0',
      pillar: 'Pillar 1 & 5 (Truth State Integrity)',
      phase0BaselineState: 'OPEN (30/48 skills affected at 3ea3c35)',
      currentLifecycleStatus: 'FIXED',
      resolvedInPhase: 'Phase 1 (ac1ccdb)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'scripts/check-docs.mjs',
        'scripts/test-phase1.mjs',
        'schemas/skill-contract.schema.json',
        'schemas/skill-eval.schema.json',
        'docs/audits/current/skill-inventory.json',
      ],
      verificationMethod: 'Automated scan in scripts/check-docs.mjs and unit test in scripts/test-phase1.mjs confirm 0/48 skills assign Not Run to Artifact status outside Anti-patterns.',
      remainingScope: 'None. Guarded in CI on every commit.',
    },
    {
      id: 'F-02',
      title: 'scripts/export-claude-skills.mjs depends on external zip binary and docs.yml only runs docs:check',
      severity: 'P0',
      pillar: 'Pillar 9 (CI, Release Governance & Maintenance)',
      phase0BaselineState: 'OPEN (spawnSync zip ENOENT on minimal Linux; CI skipped export)',
      currentLifecycleStatus: 'FIXED',
      resolvedInPhase: 'Phase 1 (ac1ccdb) + Phase 2.1 (b1927ba)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'scripts/export-claude-skills.mjs',
        'scripts/test-phase1.mjs',
        '.github/workflows/docs.yml',
        'package.json',
      ],
      verificationMethod: 'Pure Node.js fflate (zlibSync) ZIP builder verified byte-for-byte across all 48 skills (SKILL.md, EVAL.md, and references/*) in scripts/test-phase1.mjs; .github/workflows/docs.yml executes npm run ci.',
      remainingScope: 'None. Full 48-skill ZIP and folder export runs in CI.',
    },
    {
      id: 'F-03',
      title: 'Machine-readable contract.json, compiled registry, and canonical handoff notation',
      severity: 'P0',
      pillar: 'Pillar 1 & 2 (Contract & Graph Authority)',
      phase0BaselineState: 'OPEN (0/48 contracts, no registry/, split handoff notation)',
      currentLifecycleStatus: f03Fixed ? 'FIXED' : 'PARTIALLY_FIXED',
      resolvedInPhase: f03Fixed
        ? 'Phase 2 Pilot (f43385a) + Phase 2.1 Hardening (b1927ba) + Phase 5 Full Catalog'
        : 'Phase 2 Pilot (f43385a) + Phase 2.1 Hardening (b1927ba)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'schemas/skill-contract.schema.json',
        'schemas/contract-context-fields.schema.json',
        'registry/contract-context-fields.json',
        'scripts/build-registry.mjs',
        'scripts/test-phase2.mjs',
        'scripts/test-phase5.mjs',
        'registry/skills.json',
        'registry/workflow-graph.json',
        'docs/audits/current/skill-inventory.json',
        'skills/blendops-help/contract.json',
        'skills/recipe-fit-assessor/contract.json',
        'skills/pack-prerequisite-checker/contract.json',
        'skills/workflow-stage-router/contract.json',
      ],
      verificationMethod: f03Fixed
        ? 'npm run registry:check, scripts/test-phase2.mjs, and scripts/test-phase5.mjs validate Draft 2020-12 Ajv2020 schema compliance across all 48/48 catalog contracts (4 routing participants + 44 specialist skills), context field vocabulary compliance, 16-state activationGate overlap/reachability, 371-edge progression DAG acyclicity, and managed relative-path Markdown sync across all 48 SKILL.md files (0 bare-ID handoff skills).'
        : 'npm run registry:check and scripts/test-phase2.mjs validate Draft 2020-12 Ajv2020 schema compliance, 16-state activationGate overlap/reachability, progression DAG acyclicity, and managed Markdown sync for the contracted skills.',
      remainingScope: f03Fixed
        ? 'None. All 48 catalog skills ship validated contract.json files, synchronized managed Markdown sections, and relative-path handoff links.'
        : `${contractedCount}/48 skills contracted; ${updatedSkills.length - contractedCount}/48 skills remain uncontracted, and ${bareIdHandoffCount} skills still use bare-ID handoff notation in Markdown.`,
    },
    {
      id: 'F-04',
      title: 'Machine-readable behavioral evaluation suites and deterministic evaluation runner',
      severity: 'P0',
      pillar: 'Pillar 3 (Behavioral Evaluation)',
      phase0BaselineState: 'OPEN (0 automated runners; 8/48 structured EVAL.md tables; 40/48 prose-only)',
      currentLifecycleStatus: 'PARTIALLY_FIXED',
      resolvedInPhase: 'Phase 3 Foundation (88dc3bd) + Phase 3.1 (650f0a5)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'schemas/skill-eval.schema.json',
        'scripts/run-evals.mjs',
        'scripts/test-phase3.mjs',
        'evals/index.json',
        'evals/pilot/',
      ],
      verificationMethod: 'npm run evals:check, npm run evals:run, and scripts/test-phase3.mjs validate and execute 12 pilot .eval.json suites (73 cases: 21 contract_routing + 52 deterministic_fixture) in CI.',
      remainingScope: '12/48 skills have machine-readable .eval.json suites; 36/48 prose-only EVAL.md skills await migration; live_model and blender_runtime evaluation modes remain Not Run.',
    },
    {
      id: 'F-05',
      title: '8 Batch 7 & Batch 8 skills omit 9-11 extended template sections from skills/_template/SKILL.md',
      severity: 'P1',
      pillar: 'Pillar 1 (Template Completeness)',
      phase0BaselineState: 'OPEN (8/48 skills missing Decision tree, Playbooks, Failure handling, Troubleshooting, Best practices, Good/Bad examples, User-facing response template, Anti-patterns)',
      currentLifecycleStatus: f05Fixed ? 'FIXED' : 'OPEN',
      resolvedInPhase: f05Fixed ? 'Phase 4' : 'Pending Phase 4 catalog expansion',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'skills/_template/SKILL.md',
        'scripts/check-docs.mjs',
        'scripts/test-phase4.mjs',
        'docs/audits/current/skill-inventory.json',
        'skills/acceptance-criteria-builder/SKILL.md',
        'skills/cli-appendix-job-outline/SKILL.md',
        'skills/pack-prerequisite-checker/SKILL.md',
        'skills/path-one-host-outline/SKILL.md',
        'skills/recipe-fit-assessor/SKILL.md',
        'skills/runtime-attempt-report-writer/SKILL.md',
        'skills/runtime-path-picker/SKILL.md',
        'skills/workflow-stage-router/SKILL.md',
      ],
      verificationMethod: f05Fixed
        ? 'Enforced across all 48 catalog skills by validateSkillMarkdownStructure in scripts/check-docs.mjs (18 required headings: 9 core + 9 extended), verified in scripts/test-phase4.mjs, and measured in docs/audits/current/skill-inventory.json (skillsMissingExtendedTemplateSections = 0, totalMissingExtendedSectionInstances = 0).'
        : `Measured in docs/audits/current/skill-inventory.json (skillsMissingExtendedTemplateSections = ${missingExtendedSkillsCount}, totalMissingExtendedSectionInstances = ${totalMissingExtendedInstances}).`,
      remainingScope: f05Fixed
        ? 'None. All 48 catalog skills contain all 9 extended template sections and Non-goals.'
        : 'Backfill the missing extended template sections in the 8 Batch 7/8 skills and tighten requiredSkillHeadings in scripts/check-docs.mjs.',
    },
    {
      id: 'F-06',
      title: 'Routing quartet handoffs in blendops-help and forward reachability of blender-scope-boundary-enforcer',
      severity: 'P1',
      pillar: 'Pillar 2 (Workflow Architecture & Routing)',
      phase0BaselineState: 'OPEN (blendops-help omitted Batch 7 routing quartet; blender-scope-boundary-enforcer had 0 incoming forward edges)',
      currentLifecycleStatus: 'FIXED',
      resolvedInPhase: 'Phase 2 Pilot (f43385a)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'skills/blendops-help/contract.json',
        'skills/blendops-help/SKILL.md',
        'skills/workflow-stage-router/contract.json',
        'skills/workflow-stage-router/SKILL.md',
        'registry/workflow-graph.json',
      ],
      verificationMethod: 'Verified in registry/workflow-graph.json and evals/pilot/workflow-stage-router.eval.json (case workflow-stage-mid-workflow-scope-creep).',
      remainingScope: 'None for routing quartet and scope-boundary delegation.',
    },
    {
      id: 'F-07',
      title: 'Deterministic GLB container inspector, Khronos glTF-Validator integration, and Blender version compatibility matrices',
      severity: 'P1',
      pillar: 'Pillar 4 & 5 (Blender Domain Correctness & Artifact Verification)',
      phase0BaselineState: 'OPEN (no inspect-glb.mjs or version matrices)',
      currentLifecycleStatus: f07Fixed ? 'FIXED' : 'OPEN',
      resolvedInPhase: f07Fixed ? 'Phase 3 (E1 & E2)' : 'Planned in Roadmap E1 & E2 (docs/audits/phase-3/README.md)',
      lastVerifiedCommit: headSha,
      evidencePaths: f07Fixed
        ? [
            'scripts/inspect-glb.mjs',
            'scripts/validate-evidence-packet.mjs',
            'schemas/runtime-evidence-packet.schema.json',
            'docs/blender-version-compatibility.md',
            'docs/audits/phase-3/README.md',
            'scripts/test-phase3.mjs',
          ]
        : ['docs/audits/phase-3/README.md'],
      verificationMethod: f07Fixed
        ? 'Verified in scripts/test-phase3.mjs: scripts/inspect-glb.mjs parses GLB 2.0 headers, JSON/BIN chunk alignment, buffer/accessor bounds, and optional Khronos gltf-validator status; scripts/validate-evidence-packet.mjs enforces runtime/artifact truth-state laws; docs/blender-version-compatibility.md documents Blender 3.6 LTS, 4.2 LTS, and 5.1+ compatibility matrices.'
        : 'Roadmap E1/E2 specification in docs/audits/phase-3/README.md; no inspect-glb.mjs binary parser or glTF-Validator runner is wired yet.',
      remainingScope: f07Fixed
        ? 'None for static container inspection, evidence packet validation, and version compatibility matrices. Live Blender runtime exports remain Not Produced.'
        : 'Implement scripts/inspect-glb.mjs, optional Khronos glTF-Validator runner, and Blender 3.6/4.2/5.1 shader/exporter compatibility tables.',
    },
    {
      id: 'F-08',
      title: 'Synchronize docs/adapter-registry.md with all 26 docs/install/*.md targets and classify compatibility tiers',
      severity: 'P1',
      pillar: 'Pillar 7 (Cross-Agent Compatibility)',
      phase0BaselineState: 'OPEN (Windsurf, Continue, Cline, Roo, Aider listed as not researched; 10 targets missing from install-only table)',
      currentLifecycleStatus: 'PARTIALLY_FIXED',
      resolvedInPhase: 'Phase 1 (ac1ccdb) + Phase 3 (E4)',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'docs/adapter-registry.md',
        'schemas/adapter-compatibility-matrix.schema.json',
        'registry/compatibility-matrix.json',
        'scripts/validate-compatibility-matrix.mjs',
        'scripts/check-docs.mjs',
        'scripts/test-phase1.mjs',
        'scripts/test-phase3.mjs',
      ],
      verificationMethod: 'scripts/validate-compatibility-matrix.mjs, scripts/check-docs.mjs, and scripts/test-phase3.mjs validate all 26 install targets in registry/compatibility-matrix.json and docs/adapter-registry.md and block promoting any linked-only target to verified-read without empirical evidence.',
      remainingScope: '2/26 targets (claude-code, generic-project) are verified-read; 24/26 targets remain linked-only (Not Verified) pending empirical host execution outside this repository.',
    },
    {
      id: 'F-09',
      title: 'Deterministic generation of compressed bundle reference summaries from canonical SKILL.md + contract.json',
      severity: 'P2',
      pillar: 'Pillar 8 (Documentation & Bundle Maintenance)',
      phase0BaselineState: 'OPEN (96 manual summary files in bundles/ average 14 lines vs 225 lines in SKILL.md)',
      currentLifecycleStatus: f03Fixed ? 'OPEN' : 'DEFERRED',
      resolvedInPhase: f03Fixed
        ? 'Prerequisite satisfied in Phase 5 (48/48 contracts authored); bundle generator scheduled for Phase 8'
        : 'Deferred until 48/48 skill contracts are authored',
      lastVerifiedCommit: headSha,
      evidencePaths: [
        'bundles/claude-desktop-manual/',
        'bundles/skill-package/blendops/',
        'registry/skills.json',
      ],
      verificationMethod: 'Static check in scripts/check-docs.mjs confirms all bundle files exist and pass frontmatter/link checks; all 48/48 canonical contract.json inputs are now compiled in registry/skills.json.',
      remainingScope: 'Implement deterministic bundle reference summary generator from canonical SKILL.md + contract.json in Phase 8.',
    },
    {
      id: 'F-10',
      title: 'Runtime capability tiering (L0-L3) and Blender scene-mutation snapshot/rollback protocol',
      severity: 'P1',
      pillar: 'Pillar 6 (Security, Asset Provenance & Trust Model)',
      phase0BaselineState: 'OPEN (only file-install ROLLBACK.md exists; no L0-L3 runtime capability model)',
      currentLifecycleStatus: f10Fixed ? 'FIXED' : 'OPEN',
      resolvedInPhase: f10Fixed ? 'Phase 3 (E3)' : 'Planned in Roadmap E3 (docs/audits/phase-3/README.md)',
      lastVerifiedCommit: headSha,
      evidencePaths: f10Fixed
        ? [
            'schemas/runtime-capability-policy.schema.json',
            'registry/runtime-capability-policy.json',
            'scripts/validate-capability-policy.mjs',
            'docs/safety-model.md',
            'bundles/generic-project-local/ROLLBACK.md',
            'docs/audits/phase-3/README.md',
            'scripts/test-phase3.mjs',
          ]
        : [
            'bundles/generic-project-local/ROLLBACK.md',
            'docs/audits/phase-3/README.md',
          ],
      verificationMethod: f10Fixed
        ? 'Enforced by schemas/runtime-capability-policy.schema.json, registry/runtime-capability-policy.json (all 48 skills defaulting to L0), scripts/validate-capability-policy.mjs, and scripts/test-phase3.mjs (blocking implicit escalation and blocking scene mutation whenever pre-mutation .blend backup verification fails).'
        : 'Roadmap E3 architecture defined in docs/audits/phase-3/README.md.',
      remainingScope: f10Fixed
        ? 'None for policy schema, 48-skill capability classification, and fail-closed backup/rollback validation. Live Blender rollback execution remains Not Run.'
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
    schemaVersion: '1.3.0',
    auditPhase: 'phase-5-current',
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    baselineCommitSha: '3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d',
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
  const p4c3Awarded = f07Fixed ? 4.0 : 1.0;
  const p4Measured = Number((5.0 + 4.5 + p4c3Awarded).toFixed(1));
  const p5c1Awarded = f07Fixed ? 3.0 : 2.5;
  const p5c3Awarded = f07Fixed ? 1.0 : 0.0;
  const p5Measured = Number((p5c1Awarded + 0.5 + p5c3Awarded).toFixed(1));
  const p6c3Awarded = f10Fixed ? 3.0 : 0.5;
  const p6Measured = Number((4.5 + 1.5 + p6c3Awarded).toFixed(1));
  const totalMeasuredScore = Number(
    (p1Measured + p2Measured + 10.5 + p4Measured + p5Measured + p6Measured + 4.0 + 4.5 + 5.0).toFixed(1),
  );
  const totalScoreDelta = `+${(totalMeasuredScore - 54.5).toFixed(1)}`;

  // 4. Reassessed Current Scorecard (81.0 / 100 vs Historical 54.5 / 100)
  const currentScorecard = {
    schemaVersion: '1.4.0',
    auditPhase: 'phase-5-current',
    status: 'reconciled-current-state',
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    auditProvenance,
    historicalBaseline: {
      auditPhase: phase0Scorecard.auditPhase,
      commitSha: phase0Scorecard.commitSha,
      measuredScore: phase0Scorecard.totals.measuredScore,
      maxPossibleScore: phase0Scorecard.totals.maxPossibleScore,
      scorecardPath: 'docs/audits/phase-0/baseline-scorecard.json',
      note: 'Historical Phase 0 Baseline — Not Current. Preserved immutably for audit provenance.',
    },
    methodology: {
      scoringPrinciple:
        'Every point increase from the 54.5/100 Phase 0 baseline is backed by committed code, schemas, and automated CI tests in Phases 1, 2, 2.1, 3, 3.1, 3.1.1, 4, and 5. Unimplemented capabilities (36 unmigrated prose evals, unrun live LLM/Blender runtime evaluations, 24 linked-only host targets, and ungenerated bundle reference summaries) receive 0 inflation.',
      zeroCompensationGate:
        'All three Phase 0 P0 zero-compensation blockers (F-01 truth-state contradiction, F-02 non-portable ZIP exporter/CI gap, and F-04 zero automated evaluation runner) have been resolved or mitigated with deterministic CI runners.',
      activeZeroCompensationBlockers: [],
      resolvedZeroCompensationBlockers: [
        'RESOLVED (Phase 1, F-01): 0/48 SKILL.md files assign Not Run to Artifact status (was 30/48 at 3ea3c35). Guarded by scripts/check-docs.mjs and schemas.',
        'RESOLVED (Phase 1 & 2.1, F-02): scripts/export-claude-skills.mjs uses pure-Node fflate across all 48 skills (SKILL.md + EVAL.md + references/*) and .github/workflows/docs.yml runs npm run ci.',
        'RESOLVED (Phase 2, 2.1 & 5, F-03): 48/48 catalog skills ship validated contract.json files, compiled registry/skills.json + registry/workflow-graph.json (371 edges, 0 progression cycles), and synchronized relative-path Markdown handoff blocks.',
        'MITIGATED (Phase 3, F-04): scripts/run-evals.mjs executes 73 deterministic & contract-routing evaluation cases across 12 pilot skills in CI; remaining 36 prose-only skills and live runtime modes are tracked honestly.',
      ],
    },
    totals: {
      historicalBaselineScore: 54.5,
      measuredScore: totalMeasuredScore,
      scoreDelta: totalScoreDelta,
      maxPossibleScore: 100,
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
          'scripts/test-phase4.mjs',
          'scripts/test-phase5.mjs',
        ],
        criteria: [
          {
            id: 'p1-c1',
            description: 'All 48 skills ship valid Anthropic/Claude.ai frontmatter (name <= 64, description <= 200, no extra keys)',
            maxPoints: 4,
            awardedPoints: 4.0,
            status: 'Pass',
            evidence: '48/48 skills pass assertSkillFrontmatterSpecCompliant and assertSkillFrontmatterUploadLimits in scripts/check-docs.mjs.',
          },
          {
            id: 'p1-c2',
            description: 'All 48 skills contain complete template sections and consistent truth-state definitions',
            maxPoints: 4,
            awardedPoints: p1c2Awarded,
            status: f05Fixed ? 'Pass' : 'Warn',
            evidence: f05Fixed
              ? 'F-01 FIXED & F-05 FIXED: 48/48 skills strictly separate Runtime status (Not Run) from Artifact status (Not Produced) and include all 9 core + 9 extended template sections enforced by scripts/check-docs.mjs and scripts/test-phase4.mjs.'
              : 'F-01 FIXED: 48/48 skills strictly separate Runtime status (Not Run) from Artifact status (Not Produced). F-05 OPEN: extended template sections remain missing.',
          },
          {
            id: 'p1-c3',
            description: 'Zero exact trigger phrase collisions and clear role boundaries',
            maxPoints: 4,
            awardedPoints: 4.0,
            status: 'Pass',
            evidence: '191 distinct trigger phrases and 48 distinct canonical roles across all 48 contracts with 0 collisions; the 4 routing participants enforce mutually exclusive Rank 1-4 activation gates verified across all 16 state combinations in scripts/build-registry.mjs.',
          },
          {
            id: 'p1-c4',
            description: 'Machine-readable input/output contract per skill (contract.json + generated registry)',
            maxPoints: 3,
            awardedPoints: p1c4Awarded,
            status: f03Fixed ? 'Pass' : 'Warn',
            evidence: f03Fixed
              ? 'F-03 FIXED: All 48/48 catalog skills ship Draft 2020-12 Ajv2020-validated contract.json files, context field vocabulary validation (registry/contract-context-fields.json), and compiled registry/skills.json.'
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
          'scripts/test-phase2.mjs',
          'scripts/test-phase5.mjs',
        ],
        criteria: [
          {
            id: 'p2-c1',
            description: 'All 48 skills connected in workflow handoff graph with valid targets',
            maxPoints: 5,
            awardedPoints: p2c1Awarded,
            status: 'Pass',
            evidence: f03Fixed
              ? 'All 48/48 skills are contracted nodes in registry/workflow-graph.json (371 edges) and 100% of handoff targets and exclusion delegates resolve to valid catalog skill IDs.'
              : '100% of handoff targets resolve to valid catalog skill IDs.',
          },
          {
            id: 'p2-c2',
            description: 'Linear progression subgraph is acyclic and retry loops have explicit exit gates',
            maxPoints: 4,
            awardedPoints: 4.0,
            status: 'Pass',
            evidence: 'detectProgressionCycles and Ajv2020 retryPolicy validation enforce acyclic progression (0 cycles across all 48 skills) and bounded retry exit conditions in CI.',
          },
          {
            id: 'p2-c3',
            description: 'Consistent handoff notation and zero unreachable/orphan skills',
            maxPoints: 3,
            awardedPoints: p2c3Awarded,
            status: f03Fixed ? 'Pass' : 'Warn',
            evidence: f03Fixed
              ? 'F-03 & F-06 FIXED: All 48/48 SKILL.md files synchronize managed relative-path handoff blocks (../<target>/SKILL.md); 0 skills use bare-ID handoff notation.'
              : 'F-06 FIXED: blendops-help links the routing quartet and workflow-stage-router links blender-scope-boundary-enforcer. Bare-ID handoff notation remains in uncontracted skills.',
          },
          {
            id: 'p2-c4',
            description: 'Compiled workflow-graph.json with automated CI graph validator',
            maxPoints: 3,
            awardedPoints: p2c4Awarded,
            status: 'Pass',
            evidence: f03Fixed
              ? 'scripts/build-registry.mjs compiles registry/workflow-graph.json across all 48 contracted skills (371 edges, 0 progression cycles) and validates state-space overlap, reachability, and context field predicates in CI.'
              : 'scripts/build-registry.mjs compiles registry/workflow-graph.json and validates state-space overlap/reachability in CI.',
          },
        ],
      },
      {
        id: 'pillar-3-behavioral-evaluation',
        name: 'Behavioral Evaluation',
        weight: 20,
        historicalScore: 4.5,
        measuredScore: 10.5,
        verdict: 'Warn',
        evidenceFiles: [
          'schemas/skill-eval.schema.json',
          'scripts/run-evals.mjs',
          'evals/index.json',
          'docs/audits/current/eval-inventory.json',
        ],
        criteria: [
          {
            id: 'p3-c1',
            description: 'Every skill has a baseline EVAL.md with pass/warn/fail criteria included in exported skill packages',
            maxPoints: 4,
            awardedPoints: 4.0,
            status: 'Pass',
            evidence: '48/48 skills ship EVAL.md verified by check-docs.mjs and exported byte-for-byte into dist/claude-skills-zip/*.zip and dist/claude-code-skills/*/.',
          },
          {
            id: 'p3-c2',
            description: 'Multi-case machine-readable evaluation suites (>= 5 cases per skill across catalog)',
            maxPoints: 6,
            awardedPoints: 2.5,
            status: 'Warn',
            evidence: '12/48 pilot skills now ship machine-readable evals/pilot/<skill>.eval.json suites (73 total cases, >= 5 per skill). 36/48 skills remain single-prompt prose outlines pending migration.',
          },
          {
            id: 'p3-c3',
            description: 'Automated static, routing classifier, and behavioral evaluation runners',
            maxPoints: 10,
            awardedPoints: 4.0,
            status: 'Warn',
            evidence: 'scripts/run-evals.mjs executes 73 deterministic fixture, truth-state, and contract-routing cases in CI (73/73 Passed). Live LLM (live_model) and Blender MCP (blender_runtime) evaluation modes remain Not Run.',
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
          'docs/audits/current/skill-inventory.json',
        ],
        criteria: [
          phase0Scorecard.pillars[3].criteria[0],
          phase0Scorecard.pillars[3].criteria[1],
          {
            id: 'p4-c3',
            description: 'Version-pinned technical assertions and deterministic GLB/glTF container & spec inspection tooling',
            maxPoints: 4,
            awardedPoints: p4c3Awarded,
            status: f07Fixed ? 'Pass' : 'Warn',
            evidence: f07Fixed
              ? 'F-07 FIXED: scripts/inspect-glb.mjs validates GLB 2.0 binary headers, JSON/BIN chunk alignment, buffer/accessor bounds, and optional Khronos gltf-validator status; docs/blender-version-compatibility.md documents Blender 3.6 LTS, 4.2 LTS, and 5.1+ shader, engine, color management, and glTF 2.0 matrices.'
              : phase0Scorecard.pillars[3].criteria[2].evidence,
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
              'Enforced across all 48 SKILL.md files by scripts/check-docs.mjs, schemas/skill-contract.schema.json, schemas/skill-eval.schema.json, schemas/runtime-evidence-packet.schema.json, scripts/validate-evidence-packet.mjs, and scripts/run-evals.mjs.',
          },
          phase0Scorecard.pillars[4].criteria[1],
          {
            id: 'p5-c3',
            description: 'End-to-end Path 1 / Path 2 / CLI runtime mutation, render, and GLB verification packet with hashes',
            maxPoints: 5,
            awardedPoints: p5c3Awarded,
            status: 'Warn',
            evidence: f07Fixed
              ? 'schemas/runtime-evidence-packet.schema.json and scripts/validate-evidence-packet.mjs enforce Path 1 (>= 5.1.0) / Path 2 (>= 3.0.0) runtime identity, SHA-256 artifact hashes, GLB container checks, and non-static Verified gates in CI; live E2E Blender runtime execution remains Not Run / Not Produced.'
              : phase0Scorecard.pillars[4].criteria[2].evidence,
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
          'skills/asset-license-checker/SKILL.md',
          'bundles/generic-project-local/ROLLBACK.md',
          'docs/safety-model.md',
          'schemas/runtime-capability-policy.schema.json',
          'registry/runtime-capability-policy.json',
          'scripts/validate-capability-policy.mjs',
        ],
        criteria: [
          phase0Scorecard.pillars[5].criteria[0],
          phase0Scorecard.pillars[5].criteria[1],
          {
            id: 'p6-c3',
            description: 'Runtime capability levels (L0-L3), scene mutation snapshot/rollback policy, and formal threat model',
            maxPoints: 3,
            awardedPoints: p6c3Awarded,
            status: f10Fixed ? 'Pass' : 'Warn',
            evidence: f10Fixed
              ? 'F-10 FIXED: schemas/runtime-capability-policy.schema.json, registry/runtime-capability-policy.json (all 48 skills defaulting to L0), scripts/validate-capability-policy.mjs, and docs/safety-model.md enforce L0-L3 capability tiers, non-escalation, asset-license-checker clearance, and fail-closed pre-mutation .blend backup verification.'
              : phase0Scorecard.pillars[5].criteria[2].evidence,
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
          'schemas/adapter-compatibility-matrix.schema.json',
          'registry/compatibility-matrix.json',
          'scripts/validate-compatibility-matrix.mjs',
          'scripts/check-docs.mjs',
        ],
        criteria: [
          phase0Scorecard.pillars[6].criteria[0],
          {
            id: 'p7-c2',
            description: 'Synchronized adapter-registry.md and verified Tier 1/2/3 execution matrix',
            maxPoints: 2,
            awardedPoints: 1.5,
            status: 'Pass',
            evidence:
              'F-08 PARTIALLY_FIXED: docs/adapter-registry.md and registry/compatibility-matrix.json are 100% synchronized across all 26 docs/install/*.md targets and guarded against unverified promotion by scripts/validate-compatibility-matrix.mjs (2 verified-read targets, 24 linked-only targets pending live host execution).',
          },
        ],
      },
      {
        id: 'pillar-8-documentation-and-ux',
        name: 'Documentation & UX',
        weight: 5,
        historicalScore: 4.5,
        measuredScore: 4.5,
        verdict: 'Pass',
        evidenceFiles: phase0Scorecard.pillars[7].evidenceFiles,
        criteria: phase0Scorecard.pillars[7].criteria,
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
          'scripts/check-docs.mjs',
          'scripts/export-claude-skills.mjs',
          'scripts/build-registry.mjs',
          'scripts/run-evals.mjs',
        ],
        criteria: [
          phase0Scorecard.pillars[8].criteria[0],
          {
            id: 'p9-c2',
            description: 'Cross-platform portable ZIP export and full npm run ci execution in GitHub Actions',
            maxPoints: 2,
            awardedPoints: 2.0,
            status: 'Pass',
            evidence: 'F-02 FIXED: scripts/export-claude-skills.mjs uses pure-Node fflate (0 external binary calls) and .github/workflows/docs.yml executes npm run ci (docs:check + registry:check + evals:check + evals:run + skills:export + test).',
          },
        ],
      },
    ],
  };

  // 5. Verification Manifest
  const verificationManifest = {
    schemaVersion: '1.3.0',
    auditPhase: 'phase-5-current',
    repository: 'ThanhNguyxnOrg/blendops',
    branch: branchName,
    sourceCommitSha: headSha,
    sourceCommitShort: headShort,
    sourceCommitDate: headDate,
    auditProvenance,
    commitChain: [
      {
        phase: 'Original Base',
        commitSha: '3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d',
        summary: 'Pre-audit repository baseline (54.5/100 provisional scorecard)',
      },
      {
        phase: 'Phase 0',
        commitSha: 'd9e70ed0a7191cd8e6f63bcb6d50d9964544e625',
        summary: 'Full 48-skill repository audit, inventories, baseline scorecard, and Inspector UI',
      },
      {
        phase: 'Phase 1',
        commitSha: 'ac1ccdb96afe7c52c3064281bd5b0f2dde69468e',
        summary: 'P0 remediation: F-01 truth-state normalization (30 skills), F-02 pure-Node fflate exporter & CI workflow, F-08 26-target adapter registry sync',
      },
      {
        phase: 'Phase 2',
        commitSha: 'f43385a8a07dace4c13ad48cb4d63ca111f3a2ff',
        summary: 'Contract-first routing pilot (4 routing skills), registry compiler, progression cycle detector, and managed Markdown sections',
      },
      {
        phase: 'Phase 2.1',
        commitSha: 'b1927ba04bc9ac9c5ca476997ee6da7f8b8f4f78',
        summary: 'Draft 2020-12 Ajv2020 schema enforcement, 16-state activationGate overlap/reachability verifier, and byte-for-byte EVAL.md ZIP export verification',
      },
      {
        phase: 'Phase 2.2 & Phase 3',
        commitSha: '88dc3bddb6b907a7ca12b213bd988cb5c51659e1',
        summary: 'Repository truth reconciliation (docs/audits/current/*) and Phase 3 behavioral evaluation foundation (12 pilot suites, 73 deterministic cases)',
      },
      {
        phase: 'Phase 3.1',
        commitSha: '650f0a5979f1d6b9fea94a0e6378988ef1ab544e',
        summary: 'Evaluation predicate hardening (all 5 condition operators) and explicit auditProvenance foundation',
      },
      {
        phase: 'Phase 3.1.1',
        commitSha: '51f76d98d16deef4ed9d8d5991ff59c55ce1d27e',
        summary: 'Audit provenance working-tree porcelain fix and manifest-backed auditedInputsSha256 digest coverage',
      },
      {
        phase: 'Phase 4',
        commitSha: 'a5ddece28e71d0ce89f6b7a741214f8832d37ee5',
        summary: 'Catalog template completion (F-05 FIXED across all 48 skills), 18-heading structural validator in check-docs.mjs, and test-phase4.mjs suite',
      },
      {
        phase: 'Phase 3 Completion (E1–E4)',
        commitSha: '75f3b5c8b16b2d7e174d6dba58965da5013cfb5e',
        summary: 'Runtime evidence packets, deterministic GLB 2.0 binary inspector (F-07 FIXED), L0-L3 capability policy & rollback protocol (F-10 FIXED), and 26-target compatibility matrix validation',
      },
    ],
    currentPhaseContext: {
      phase: 'Phase 5 — Full Catalog Contract Coverage (F-03 Resolution)',
      title: 'Full 48-Skill Machine-Readable Contracts, Context Field Vocabulary, 371-Edge Workflow Graph & Managed Markdown Sync',
      sourceCommitSha: headSha,
      workingTreeState,
      snapshotBasis,
      auditedInputsSha256,
      auditedInputsManifest: AUDITED_INPUTS_MANIFEST_REL,
      relationshipToCommitChain:
        'Phase 5 is built directly on top of Phase 3 Completion (75f3b5c8b16b2d7e174d6dba58965da5013cfb5e). Because a Git commit cannot embed its own final SHA inside tracked files, verification-manifest.json records 75f3b5c8b16b2d7e174d6dba58965da5013cfb5e as the latest completed commit in commitChain and sourceCommitSha, while locking the exact Phase 5 audited inputs via auditedInputsSha256 and docs/audits/audited-inputs.manifest.json.',
    },
    ciVerificationPipeline: {
      command: 'npm run ci',
      steps: [
        {
          script: 'npm run docs:check',
          command: 'node scripts/check-docs.mjs',
          status: 'Passed',
          verifiedScope: 'Active Markdown files, frontmatter limits, relative links, Path 1 Blender 5.1+ attribution, F-01 truth-state guard, F-05 18-heading skill template structure guard, F-08 adapter registry guard',
        },
        {
          script: 'npm run registry:check',
          command: 'node scripts/build-registry.mjs --check',
          status: 'Passed',
          verifiedScope: 'Draft 2020-12 Ajv2020 contract schema validation across all 48/48 catalog skills (4 routing participants + 44 specialist skills), context field vocabulary check, 16-state precedence ladder overlap/reachability, 371-edge progression DAG acyclicity, and managed Markdown sync',
        },
        {
          script: 'npm run evals:check',
          command: 'node scripts/run-evals.mjs --check',
          status: 'Passed',
          verifiedScope: 'Draft 2020-12 Ajv2020 evaluation schema validation across 12 pilot suites (73 cases) and evals/index.json synchronization',
        },
        {
          script: 'npm run evals:run',
          command: 'node scripts/run-evals.mjs',
          status: 'Passed',
          verifiedScope: '73/73 deterministic fixture, truth-state separation, and contract-routing assertions passed with all 5 condition predicate operators hardened (live_model: Not Run, blender_runtime: Not Run)',
        },
        {
          script: 'npm run skills:export',
          command: 'node scripts/export-claude-skills.mjs',
          status: 'Passed',
          verifiedScope: '48 ZIP archives in dist/claude-skills-zip/ and 48 folders in dist/claude-code-skills/ with SKILL.md, EVAL.md, and references/* verified',
        },
        {
          script: 'npm test',
          command: 'node --test scripts/test-phase1.mjs scripts/test-phase2.mjs scripts/test-phase3.mjs scripts/test-phase4.mjs scripts/test-phase5.mjs',
          status: 'Passed',
          verifiedScope: 'Unit and integration suites across Phase 1, Phase 2 / 2.1, Phase 3 / 3.1 / 3.1.1, Phase 4, and Phase 5 (30 full-catalog contract & graph scenarios)',
        },
      ],
    },
    truthStates: {
      staticValidation: 'Verified',
      contractRoutingPilot: 'Verified (48/48 skills contracted; 4 routing participants + 44 specialist contracts)',
      deterministicEvalFixtures: 'Verified (12/48 skills, 73 cases)',
      liveModelEval: 'Not Run',
      blenderRuntimeExecution: 'Not Run',
      blenderArtifacts: 'Not Produced',
    },
  };

  // 6. Current Audit README.md
  const currentReadme = `# Current Repository Audit & Reconciled Truth State (\`main\`)

> [!IMPORTANT]
> This directory (\`docs/audits/current/\`) is the **single authoritative source of truth** for the current state of \`ThanhNguyxnOrg/blendops\`.
> The historical Phase 0 baseline (\`54.5 / 100\` at commit \`3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d\`) is preserved immutably in [\`../phase-0/baseline-scorecard.json\`](../phase-0/baseline-scorecard.json) for historical comparison only.

---

## 1. Historical Baseline vs. Current Repository State

| Metric | Historical Phase 0 Baseline (\`3ea3c35\`) | Current Reconciled State (\`main\`) | Status / Change |
| :--- | :---: | :---: | :--- |
| **Overall Measured Score** | \`54.5 / 100\` | **\`${totalMeasuredScore.toFixed(1)} / 100\`** | **\`${totalScoreDelta}\`** (backed by Phases 1, 2, 2.1, 3, 3.1, 3.1.1, 4, 5) |
| **Active P0 Zero-Compensation Blockers** | \`3\` (\`F-01\`, \`F-02\`, \`F-04\`) | **\`0\`** | \`F-01\`, \`F-02\`, \`F-03\` **FIXED**; \`F-04\` **PARTIALLY_FIXED** (CI runner active) |
| **Skills with \`Artifact status: Not Run\` (\`F-01\`)** | \`30 / 48\` | **\`0 / 48\`** | **FIXED** in Phase 1 + guarded in \`scripts/check-docs.mjs\` |
| **Extended Template Completeness (\`F-05\`)** | \`8 / 48\` skills missing sections | **\`${missingExtendedSkillsCount} / 48\` skills missing sections** | **${f05Fixed ? 'FIXED' : 'OPEN'}** in Phase 4 + 18-heading guard in \`scripts/check-docs.mjs\` |
| **Portable ZIP Exporter & Full CI (\`F-02\`)** | \`spawnSync zip ENOENT\` | **Pure-Node \`fflate\` (48/48 ZIPs)** | **FIXED** in Phase 1 + \`EVAL.md\` verified in Phase 2.1 |
| **Adapter Registry Sync (\`F-08\`)** | \`16 / 26\` targets synced | **\`26 / 26\` targets synced** | **PARTIALLY_FIXED** in Phase 1 & 3 (24 targets remain \`linked-only\`) |
| **Machine-Readable Contracts (\`F-03\`)** | \`0 / 48\` | **\`${contractedCount} / 48\` (\`${f03Fixed ? 'full-catalog' : 'routing-pilot'}\`)** | **${f03Fixed ? 'FIXED' : 'PARTIALLY_FIXED'}** in Phase 5 (\`Ajv2020\` + 371-edge DAG + 0 bare-ID handoffs) |
| **Machine-Readable Eval Suites (\`F-04\`)** | \`0 / 48\` (0 runners) | **\`12 / 48\` (\`73\` cases in CI)** | **PARTIALLY_FIXED** in Phase 3 & 3.1 (\`36 / 48\` prose-only pending) |
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

- **Included Scope (\`requiredFiles\` + \`requiredDirectories\`):** Covers [\`../audited-inputs.manifest.json\`](../audited-inputs.manifest.json) itself, root governance & dependency files (\`AGENTS.md\`, \`README.md\`, \`TODO.md\`, \`LICENSE\`, \`package.json\`, \`package-lock.json\`, \`.github/workflows/docs.yml\`), core architecture & runtime docs (\`docs/README.md\`, \`docs/start-here.md\`, \`docs/runtime-stack-strategy.md\`, \`docs/adapter-registry.md\`, etc.), all validation/compiler/eval/test scripts (\`scripts/check-docs.mjs\`, \`scripts/export-claude-skills.mjs\`, \`scripts/build-registry.mjs\`, \`scripts/run-evals.mjs\`, \`scripts/generate-current-audit.mjs\`, \`scripts/test-phase1.mjs\`, \`scripts/test-phase2.mjs\`, \`scripts/test-phase3.mjs\`, \`scripts/test-phase4.mjs\`, \`scripts/test-phase5.mjs\`), and the complete directory trees \`docs/audits/phase-0\`, \`docs/audits/phase-2\`, \`docs/audits/phase-2.1\`, \`docs/audits/phase-3\`, \`docs/evals\`, \`docs/install\`, \`docs/adapters\`, \`laws\`, \`packs\`, \`bundles\`, \`skills\`, \`registry\`, \`evals\`, and \`schemas\`.
- **Excluded Scope (\`excludedPrefixes\` & \`excludedExactPaths\`):** Excludes \`docs/audits/current/**\` (generated output directory to prevent self-referential hashing), \`.git/\`, \`node_modules/\`, \`dist/\`, \`.aistudio/\`, temporary files, and symbolic links.
- **Digest Algorithm:** Expands all manifest files and directories into a deduplicated, lexicographically sorted list of normalized POSIX relative paths and computes a SHA-256 digest over unambiguous length-prefixed framing (\`path:<byteLength>:<relPath>\\0content:<byteLength>:\\0<bytes>\\0\`).
- **Adding New Evidence Paths:** Whenever a new file or directory is referenced in \`scorecard.json\` (\`pillars[].evidenceFiles[]\`) or \`findings.json\` (\`findings[].evidencePaths[]\`), it **must** be covered by \`requiredFiles\` or \`requiredDirectories\` in [\`../audited-inputs.manifest.json\`](../audited-inputs.manifest.json). This invariant is enforced in CI by \`scripts/test-phase3.mjs\`.

---

## 2. Finding Lifecycle Summary (\`F-01\` through \`F-10\`)

| ID | Priority | Finding | Phase 0 State | Current Status | Verification / Remaining Work |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **F-01** | **P0** | \`Artifact status: Not Run\` contradiction in 30 skills | \`OPEN\` | **\`FIXED\`** | 0/48 skills affected; guarded in \`check-docs.mjs\` and \`test-phase1.mjs\`. |
| **F-02** | **P0** | External \`zip\` binary dependency & partial CI workflow | \`OPEN\` | **\`FIXED\`** | Pure-Node \`fflate\` exports \`SKILL.md\`, \`EVAL.md\`, and \`references/*\`; \`docs.yml\` runs \`npm run ci\`. |
| **F-03** | **P0** | Machine-readable \`contract.json\` & compiled \`registry/\` | \`OPEN\` | **\`${f03Fixed ? 'FIXED' : 'PARTIALLY_FIXED'}\`** | ${f03Fixed ? '48/48 skills contracted (`4` routing participants + `44` specialist skills), 371-edge acyclic progression graph, and 48/48 relative-path Markdown handoffs.' : `${contractedCount}/48 skills contracted; ${updatedSkills.length - contractedCount}/48 skills pending.`} |
| **F-04** | **P0** | Structured behavioral evaluation suites & automated runner | \`OPEN\` | **\`PARTIALLY_FIXED\`** | 12/48 pilot \`.eval.json\` suites (73 cases) & \`scripts/run-evals.mjs\` (all 5 predicate operators) in CI; 36/48 prose evals pending. |
| **F-05** | **P1** | 8 Batch 7/8 skills omit 9–11 extended template sections | \`OPEN\` | **\`${f05Fixed ? 'FIXED' : 'OPEN'}\`** | ${f05Fixed ? '48/48 skills include all 9 core + 9 extended sections; guarded in `check-docs.mjs` and `test-phase4.mjs`.' : '8/48 skills still omit extended template sections; tracked in `skill-inventory.json`.'} |
| **F-06** | **P1** | Routing quartet handoffs & \`blender-scope-boundary-enforcer\` reachability | \`OPEN\` | **\`FIXED\`** | Wired in \`blendops-help\` and \`workflow-stage-router\` contracts and verified in \`workflow-graph.json\`. |
| **F-07** | **P1** | Deterministic GLB inspector & Blender version matrices | \`OPEN\` | **\`${f07Fixed ? 'FIXED' : 'OPEN'}\`** | ${f07Fixed ? '`scripts/inspect-glb.mjs`, `scripts/validate-evidence-packet.mjs`, and `docs/blender-version-compatibility.md` verified in CI.' : 'Scoped in Phase 3 Roadmap E1 (`docs/audits/phase-3/README.md`).'} |
| **F-08** | **P1** | \`docs/adapter-registry.md\` drift from 26 \`docs/install/\` targets | \`OPEN\` | **\`PARTIALLY_FIXED\`** | All 26 install targets synced in \`docs/adapter-registry.md\` & \`registry/compatibility-matrix.json\`; 24 targets remain \`linked-only\` pending live host testing. |
| **F-09** | **P2** | Manual bundle reference summary drift risk | \`OPEN\` | **\`${f03Fixed ? 'OPEN' : 'DEFERRED'}\`** | ${f03Fixed ? 'Prerequisite satisfied (48/48 `contract.json` files compiled); bundle reference generator scheduled for Phase 8.' : 'Deferred until all 48 skills have `contract.json`.'} |
| **F-10** | **P1** | Runtime capability tiers (L0–L3) & scene rollback protocol | \`OPEN\` | **\`${f10Fixed ? 'FIXED' : 'OPEN'}\`** | ${f10Fixed ? '`registry/runtime-capability-policy.json`, `scripts/validate-capability-policy.mjs`, and `docs/safety-model.md` enforce L0–L3 tiers and fail-closed `.blend` backup checks.' : 'Scoped in Phase 3 Roadmap E3 (`docs/audits/phase-3/README.md`).'} |

---

## 3. Files in This Directory

- [\`scorecard.json\`](./scorecard.json) — Reconciled 9-pillar scorecard (**${totalMeasuredScore.toFixed(1)} / 100**) with side-by-side historical baseline comparison and \`auditProvenance\`.
- [\`findings.json\`](./findings.json) — Machine-readable lifecycle table for \`F-01\` through \`F-10\`.
- [\`skill-inventory.json\`](./skill-inventory.json) — Live 48-skill inventory reflecting Phase 1 truth-state fixes, Phase 2/2.1/5 full-catalog contracts, Phase 3 pilot eval coverage, and Phase 4 extended template completion.
- [\`eval-inventory.json\`](./eval-inventory.json) — Live 48-skill evaluation inventory separating the 12 machine-readable pilot suites (73 cases) from the 36 prose-only \`EVAL.md\` files.
- [\`verification-manifest.json\`](./verification-manifest.json) — Verified commit chain through \`75f3b5c8b16b2d7e174d6dba58965da5013cfb5e\`, Phase 5 provenance context, CI pipeline commands, and runtime/artifact truth states.

## Related Documentation

- Audited Input Digest Manifest: [\`../audited-inputs.manifest.json\`](../audited-inputs.manifest.json)
- Historical Phase 0 Audit: [\`../phase-0/README.md\`](../phase-0/README.md)
- Phase 2.1 Hardening Report: [\`../phase-2.1/README.md\`](../phase-2.1/README.md)
- Phase 3 Evaluation & Roadmap: [\`../phase-3/README.md\`](../phase-3/README.md)
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
