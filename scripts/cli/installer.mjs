import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_REPO_ROOT, INSTALLER_VERSION } from './constants.mjs';
import { sha256String, validateDestinationRoot } from './path-safety.mjs';
import { parseInstallerArgs } from './args.mjs';
import { buildClaudeDesktopPlan, buildProjectInstallPlan, resolvePlanStorePath, writeAtomicFile } from './install-plan.mjs';
import { formatInstallerHelp, formatInstallerReport } from './report.mjs';
import { runDoctorMode } from './doctor.mjs';
import { executeRollbackMode } from './rollback.mjs';
import { executeWriteProjectPlan } from './write-project.mjs';
import { executeWriteClaudeDesktopPlan } from './write-claude-desktop.mjs';

export function runInstaller(rawArgsOrOptions, options = {}) {
  const repoRoot = path.resolve(options.repoRoot || DEFAULT_REPO_ROOT);
  const repoRootReal = fs.existsSync(repoRoot) ? fs.realpathSync(repoRoot) : repoRoot;

  const parsed = Array.isArray(rawArgsOrOptions)
    ? parseInstallerArgs(rawArgsOrOptions)
    : parseInstallerArgsFromObject(rawArgsOrOptions);

  const programmaticPlanDir =
    options.planDir ||
    (!Array.isArray(rawArgsOrOptions) && rawArgsOrOptions && typeof rawArgsOrOptions === 'object'
      ? rawArgsOrOptions.planDir
      : null);

  if (parsed.mode === 'version') {
    return {
      ok: true,
      mode: 'version',
      version: INSTALLER_VERSION,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report: `blendops ${INSTALLER_VERSION}\n`,
    };
  }

  if (parsed.mode === 'help') {
    return {
      ok: true,
      mode: 'help',
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report: formatInstallerHelp(),
    };
  }

  if (parsed.mode === 'doctor') {
    return runDoctorMode({
      repoRootReal,
      project: parsed.project,
      target: parsed.target,
    });
  }

  if (parsed.mode === 'rollback') {
    return executeRollbackMode({
      repoRootReal,
      project: parsed.project,
      out: parsed.out,
      forceRollback: parsed.forceRollback,
    });
  }

  const isBundleTarget = parsed.target === 'claude-desktop';
  const destinationReal = isBundleTarget
    ? validateDestinationRoot(parsed.out, {
        kind: 'out',
        repoRoot: repoRootReal,
        mustExist: false,
      })
    : validateDestinationRoot(parsed.project, {
        kind: 'project',
        repoRoot: repoRootReal,
        mustExist: true,
      });

  const planFilePath = resolvePlanStorePath({
    planDir: programmaticPlanDir,
    repoRootReal,
    targetRootReal: destinationReal,
    requestedTarget: parsed.target,
  });

  if (parsed.mode === 'dry-run') {
    const livePlan = isBundleTarget
      ? buildClaudeDesktopPlan({
          repoRootReal,
          outReal: destinationReal,
          requestedTarget: parsed.target,
        })
      : buildProjectInstallPlan({
          repoRootReal,
          projectReal: destinationReal,
          requestedTarget: parsed.target,
          confirmTargetPath: parsed.confirmTargetPath,
          patchAgentsMd: parsed.patchAgentsMd,
          patchClaudeMd: parsed.patchClaudeMd,
          withSkillsDir: Boolean(parsed.withSkillsDir),
          skillsFilter: parsed.skillsFilter || null,
        });

    if (fs.existsSync(planFilePath)) {
      let existingPlanObj = null;
      try {
        existingPlanObj = JSON.parse(fs.readFileSync(planFilePath, 'utf8'));
      } catch {
        throw new Error(
          `Refusing to overwrite existing non-plan file at ${planFilePath}`,
        );
      }
      if (
        !existingPlanObj ||
        typeof existingPlanObj !== 'object' ||
        Array.isArray(existingPlanObj) ||
        typeof existingPlanObj.installerVersion !== 'string' ||
        typeof existingPlanObj.planHash !== 'string'
      ) {
        throw new Error(
          `Refusing to overwrite existing non-plan file at ${planFilePath}`,
        );
      }
    }

    const rollbackManifestFullPath = path.join(destinationReal, livePlan.rollbackManifestRel);
    const planRecord = {
      ...livePlan,
      recordedAt: new Date().toISOString(),
    };
    writeAtomicFile(planFilePath, `${JSON.stringify(planRecord, null, 2)}\n`);

    const result = {
      ok: true,
      mode: 'dry-run',
      targetRequested: livePlan.requestedTarget,
      targetSelected: livePlan.selectedTarget,
      resolvedInstallMode: livePlan.effectiveBehavior,
      confidence: livePlan.confidence,
      scope: livePlan.scope,
      projectOrOutPath: destinationReal,
      detectedMarkers: livePlan.detectedMarkers,
      filesCreated: livePlan.filesToCreate,
      filesModified: livePlan.filesToModify,
      filesSkipped: livePlan.filesToSkip,
      backups: livePlan.backupsToCreate,
      rollbackManifestPath: rollbackManifestFullPath,
      planFilePath,
      planHash: livePlan.planHash,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      limitations: livePlan.limitations,
    };
    if (isBundleTarget) {
      result.skillMdCountPerZip = 1;
      result.zipCount = livePlan.skillCount || 16;
    }
    result.report = formatInstallerReport(result);
    return result;
  }

  // Mode === 'write': enforce mandatory dry-run gate BEFORE building or executing write plan
  if (!fs.existsSync(planFilePath)) {
    throw new Error(
      `Write mode refused: no prior --dry-run plan exists for target '${parsed.target}' at '${destinationReal}'. Run with --dry-run first.`,
    );
  }

  let savedPlan;
  try {
    savedPlan = JSON.parse(fs.readFileSync(planFilePath, 'utf8'));
  } catch {
    throw new Error(
      `Write mode refused: recorded dry-run plan at ${planFilePath} is corrupted. Re-run --dry-run first.`,
    );
  }

  if (!savedPlan || typeof savedPlan !== 'object' || Array.isArray(savedPlan)) {
    throw new Error(
      `Write mode refused: recorded dry-run plan at ${planFilePath} is invalid. Re-run --dry-run first.`,
    );
  }

  if (savedPlan.globalTouched === true || savedPlan.scope === 'global') {
    throw new Error(
      'Write mode refused: recorded dry-run plan requests an unsupported global write.',
    );
  }

  const { planHash: savedHash, recordedAt: _ignoredRecordedAt, ...savedPayload } = savedPlan;
  const recomputedSavedHash = sha256String(JSON.stringify(savedPayload));
  if (!savedHash || savedHash !== recomputedSavedHash) {
    throw new Error(
      `Write mode refused: recorded dry-run plan at ${planFilePath} failed integrity verification (tampered or invalid plan). Re-run --dry-run first.`,
    );
  }

  let livePlan;
  try {
    livePlan = isBundleTarget
      ? buildClaudeDesktopPlan({
          repoRootReal,
          outReal: destinationReal,
          requestedTarget: parsed.target,
        })
      : buildProjectInstallPlan({
          repoRootReal,
          projectReal: destinationReal,
          requestedTarget: parsed.target,
          confirmTargetPath: parsed.confirmTargetPath,
          patchAgentsMd: parsed.patchAgentsMd,
          patchClaudeMd: parsed.patchClaudeMd,
          withSkillsDir: Boolean(parsed.withSkillsDir),
          skillsFilter: parsed.skillsFilter || null,
        });
  } catch (err) {
    if (
      isBundleTarget &&
      err instanceof Error &&
      err.message.includes('Refusing to use existing --out destination')
    ) {
      throw new Error(
        `Write mode refused: target --out directory (${destinationReal}) was created after --dry-run was recorded (stale dry-run plan); refusing to overwrite existing destination.`,
      );
    }
    throw err;
  }

  if (
    savedPlan.requestedTarget !== livePlan.requestedTarget ||
    savedPlan.selectedTarget !== livePlan.selectedTarget ||
    savedPlan.projectPath !== livePlan.projectPath ||
    savedPlan.confirmTargetPath !== livePlan.confirmTargetPath ||
    savedPlan.patchAgentsMd !== livePlan.patchAgentsMd ||
    Boolean(savedPlan.patchClaudeMd) !== Boolean(livePlan.patchClaudeMd) ||
    Boolean(savedPlan.withSkillsDir) !== Boolean(livePlan.withSkillsDir) ||
    JSON.stringify(savedPlan.skillsFilter || null) !== JSON.stringify(livePlan.skillsFilter || null)
  ) {
    throw new Error(
      'Write mode refused: options or resolved target do not match the recorded --dry-run plan. Re-run --dry-run with matching arguments.',
    );
  }

  if (savedPlan.sourceFingerprint !== livePlan.sourceFingerprint) {
    throw new Error(
      'Write mode refused: BlendOps source files changed since --dry-run was recorded. Re-run --dry-run first.',
    );
  }

  if (
    JSON.stringify(savedPlan.targetStateSnapshot) !==
      JSON.stringify(livePlan.targetStateSnapshot) ||
    savedPlan.planHash !== livePlan.planHash
  ) {
    throw new Error(
      'Write mode refused: target project files or markers changed since --dry-run was recorded (stale dry-run plan). Re-run --dry-run first.',
    );
  }

  if (isBundleTarget) {
    return executeWriteClaudeDesktopPlan(livePlan);
  }
  return executeWriteProjectPlan(livePlan, {
    faultInjection: options.faultInjection || null,
  });
}

export function parseInstallerArgsFromObject(obj = {}) {
  const argv = [];
  if (obj.subcommand) argv.push(String(obj.subcommand));
  if (obj.version) argv.push('--version');
  if (obj.help) argv.push('--help');
  if (obj.target) argv.push('--target', String(obj.target));
  if (obj.project) argv.push('--project', String(obj.project));
  if (obj.out) argv.push('--out', String(obj.out));
  if (obj.doctor) argv.push('--doctor');
  if (obj.dryRun) argv.push('--dry-run');
  if (obj.write) argv.push('--write');
  if (obj.rollback) argv.push('--rollback');
  if (obj.forceRollback) argv.push('--force-rollback');
  if (obj.allowGlobal) argv.push('--allow-global');
  if (obj.confirmTargetPath) argv.push('--confirm-target-path');
  if (obj.patchAgentsMd) argv.push('--patch-agents-md');
  if (obj.patchClaudeMd) argv.push('--patch-claude-md');
  if (obj.withSkillsDir || obj.skillsSh) argv.push('--with-skills-dir');
  if (Array.isArray(obj.skillsFilter) && obj.skillsFilter.length > 0) {
    argv.push('--skill', obj.skillsFilter.join(','));
  } else if (typeof obj.skill === 'string' && obj.skill.trim()) {
    argv.push('--skill', obj.skill.trim());
  }
  return parseInstallerArgs(argv);
}
