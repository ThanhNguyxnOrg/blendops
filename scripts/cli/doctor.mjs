import fs from 'node:fs';
import path from 'node:path';
import { SUPPORTED_TARGETS } from './constants.mjs';
import { validateDestinationRoot } from './path-safety.mjs';
import { detectProjectTargetMarkers } from './args.mjs';
import { computeBlendOpsSourceFingerprint } from './source-fingerprint.mjs';
import { formatInstallerReport } from './report.mjs';
import { validateRollbackManifestSchema } from './rollback.mjs';

export function runDoctorMode({ repoRootReal, project, target }) {
  const sourceChecks = [];
  const requiredRepoPaths = [
    'skills',
    'laws',
    'packs',
    'bundles/generic-project-local/BLENDOPS.md',
    'bundles/generic-project-local/ROLLBACK.md',
    'bundles/claude-desktop-manual/manifest.json',
    'scripts/export-claude-skills.mjs',
  ];
  for (const rel of requiredRepoPaths) {
    const exists = fs.existsSync(path.join(repoRootReal, rel));
    sourceChecks.push({ path: rel, exists });
    if (!exists) {
      throw new Error(`Doctor check failed: missing required BlendOps source path: ${rel}`);
    }
  }

  for (const forbiddenStaleDir of ['docs/skills', 'docs/laws', 'docs/packs']) {
    if (fs.existsSync(path.join(repoRootReal, forbiddenStaleDir))) {
      throw new Error(
        `Doctor check failed: forbidden duplicate collection directory exists: ${forbiddenStaleDir}`,
      );
    }
  }

  const sourceInfo = computeBlendOpsSourceFingerprint(repoRootReal);
  let inspectedProjectPath = repoRootReal;
  let detectedMarkers = [];
  const limitations = [
    `Read-only diagnostics completed (${sourceInfo.skillCount} canonical skills verified, Node.js ${process.versions.node}). No files were written, no runtime was configured or executed, and no artifacts were produced.`,
  ];

  if (project) {
    const projectReal = validateDestinationRoot(project, {
      kind: 'project',
      repoRoot: repoRootReal,
      mustExist: true,
    });
    inspectedProjectPath = projectReal;
    detectedMarkers = detectProjectTargetMarkers(projectReal);
    if (detectedMarkers.length > 1) {
      limitations.push(
        `Multiple target markers detected (${detectedMarkers.map((d) => d.target).join(', ')}); an explicit --target <name> will be required before installing.`,
      );
    }

    // Read-only inspection of existing .blendops state (never mutates target files)
    const journalPath = path.join(projectReal, '.blendops', 'transaction-journal.json');
    try {
      const journalStat = fs.lstatSync(journalPath);
      if (journalStat.isSymbolicLink()) {
        limitations.push(
          'Warning: .blendops/transaction-journal.json is a symbolic link; inspect and remove unsafe symlink before installing.',
        );
      } else if (journalStat.isFile()) {
        limitations.push(
          'Pending transaction journal detected (.blendops/transaction-journal.json); run blendops install --dry-run or blendops rollback --project <path> to recover interrupted transaction state.',
        );
      }
    } catch (err) {
      if (!err || (err.code !== 'ENOENT' && err.code !== 'ENOTDIR')) {
        throw err;
      }
    }

    const manifestPath = path.join(projectReal, '.blendops', 'install-manifest.json');
    try {
      const manifestStat = fs.lstatSync(manifestPath);
      if (manifestStat.isSymbolicLink()) {
        limitations.push(
          'Warning: .blendops/install-manifest.json is a symbolic link; inspect and remove unsafe symlink before installing.',
        );
      } else if (manifestStat.isFile()) {
        try {
          const parsedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          validateRollbackManifestSchema(parsedManifest, manifestPath);
          limitations.push(
            `Existing install manifest verified (.blendops/install-manifest.json, target=${parsedManifest.target}).`,
          );
        } catch (manifestErr) {
          const msg = manifestErr instanceof Error ? manifestErr.message : String(manifestErr);
          limitations.push(
            `Warning: existing .blendops/install-manifest.json failed validation (${msg}).`,
          );
        }
      }
    } catch (err) {
      if (!err || (err.code !== 'ENOENT' && err.code !== 'ENOTDIR')) {
        throw err;
      }
    }
  }

  const targetSelected = target || (detectedMarkers.length === 1 ? detectedMarkers[0].target : 'generic-project');
  const confidence = SUPPORTED_TARGETS[targetSelected]
    ? SUPPORTED_TARGETS[targetSelected].confidence
    : 'verified-read';

  const result = {
    ok: true,
    mode: 'doctor',
    targetRequested: target || 'auto',
    targetSelected,
    resolvedInstallMode: 'read-only-diagnostics',
    confidence,
    scope: 'read-only',
    projectOrOutPath: inspectedProjectPath,
    detectedMarkers,
    filesCreated: [],
    filesModified: [],
    filesSkipped: [],
    backups: [],
    rollbackManifestPath: 'none (read-only doctor mode)',
    globalTouched: false,
    runtimeStatus: 'Not Run',
    artifactStatus: 'Not Produced',
    limitations,
  };

  result.report = formatInstallerReport(result);
  return result;
}
