import fs from 'node:fs';
import path from 'node:path';
import { inspectGlbBuffer } from '../inspect-glb.mjs';
import { generateGlbHandoffReportFromFileSync, validateGlbWebHandoffManifest } from '../generate-glb-handoff-report.mjs';
import { DEFAULT_REPO_ROOT } from './constants.mjs';
import { formatInstallerHelp } from './report.mjs';

export const GLB_SUBCOMMANDS = new Set([
  'glb-inspect',
  '--glb-inspect',
  'glb-handoff',
  '--glb-handoff',
  'glb-validate-manifest',
  '--glb-validate-manifest',
]);

export function runGlbCliSubcommand(argv = [], options = {}) {
  const repoRoot = path.resolve(options.repoRoot || DEFAULT_REPO_ROOT);
  const rawSub = String(argv[0] || '').replace(/^--/, '');
  const rest = argv.slice(1);

  if (rest.includes('--help') || rest.includes('-h')) {
    return {
      ok: true,
      mode: 'help',
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report: formatInstallerHelp(),
    };
  }

  if (rawSub === 'glb-inspect') {
    let glbPath = null;
    let strictBounds = false;
    let jsonOutput = false;

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--strict-bounds') {
        strictBounds = true;
      } else if (arg === '--json') {
        jsonOutput = true;
      } else if (arg === '--glb' && i + 1 < rest.length) {
        glbPath = rest[++i];
      } else if (!arg.startsWith('-') && !glbPath) {
        glbPath = arg;
      } else {
        throw new Error(`Unknown or malformed glb-inspect argument: ${String(arg)}`);
      }
    }

    if (!glbPath || typeof glbPath !== 'string' || glbPath.trim().length === 0) {
      throw new Error('glb-inspect requires a <file.glb> path.');
    }

    const resolved = path.resolve(glbPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`GLB file does not exist: ${glbPath}`);
    }
    const lstat = fs.lstatSync(resolved);
    if (lstat.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link for GLB input file: ${glbPath}`);
    }
    if (!lstat.isFile()) {
      throw new Error(`GLB path is not a regular file: ${glbPath}`);
    }

    const buf = fs.readFileSync(resolved);
    const inspection = inspectGlbBuffer(buf, { strictPositionBounds: strictBounds });
    inspection.filePath = resolved;

    if (!inspection.valid) {
      if (jsonOutput) {
        return {
          ok: false,
          mode: 'glb-inspect',
          inspection,
          globalTouched: false,
          runtimeStatus: 'Not Run',
          artifactStatus: 'Not Produced',
          report: `${JSON.stringify(inspection, null, 2)}\n`,
        };
      }
      throw new Error(
        `GLB structural inspection failed for '${path.basename(resolved)}': ${inspection.errors.join('; ')}`,
      );
    }

    const report = jsonOutput
      ? `${JSON.stringify(inspection, null, 2)}\n`
      : [
          '## BlendOps GLB 2.0 Structural Inspection Report',
          '',
          `- File: ${resolved}`,
          `- Valid GLB 2.0 container: ${inspection.valid ? 'Yes' : 'No'}`,
          `- Byte size: ${inspection.byteSize}`,
          `- SHA-256: ${inspection.sha256}`,
          `- Meshes: ${inspection.counts?.meshes ?? 0} (${inspection.counts?.primitives ?? 0} primitives, ${inspection.counts?.vertices ?? 0} vertices, ~${inspection.counts?.trianglesEstimate ?? 0} triangles)`,
          `- Materials: ${inspection.counts?.materials ?? 0} | Textures: ${inspection.counts?.textures ?? 0} | Animations: ${inspection.counts?.animations ?? 0}`,
          `- Tier 1 (Container Structural): ${inspection.validationTiers?.containerStructural?.status || 'Passed'}`,
          `- Tier 2 (Khronos glTF 2.0 Spec): ${inspection.validationTiers?.gltfSpecification?.status || 'Not Run'}`,
          `- Tier 3 (Visual Quality): ${inspection.validationTiers?.visualQuality?.status || 'Not Run'}`,
          `- Tier 4 (Live Blender Runtime): ${inspection.validationTiers?.liveRuntime?.status || 'Not Run'}`,
          '- Global files touched: No',
          '- Runtime status: Not Run',
          '- Artifact status: Not Produced',
          `- Warnings: ${inspection.warnings.length > 0 ? inspection.warnings.join('; ') : 'none'}`,
          '',
        ].join('\n');

    return {
      ok: true,
      mode: 'glb-inspect',
      inspection,
      globalTouched: false,
      runtimeStatus: 'Not Run',
      artifactStatus: 'Not Produced',
      report,
    };
  }

  if (rawSub === 'glb-handoff') {
    let glbPath = null;
    let outDir = null;
    let viewerStack = 'threejs';
    let syntheticFlag = false;
    let strictBounds = false;
    let jsonOutput = false;

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--json') {
        jsonOutput = true;
      } else if (arg === '--synthetic') {
        syntheticFlag = true;
      } else if (arg === '--strict-bounds') {
        strictBounds = true;
      } else if ((arg === '--out-dir' || arg === '--out' || arg === '--output') && i + 1 < rest.length) {
        outDir = rest[++i];
      } else if (typeof arg === 'string' && arg.startsWith('--out-dir=')) {
        outDir = arg.slice('--out-dir='.length).trim();
      } else if (arg === '--viewer' && i + 1 < rest.length) {
        viewerStack = rest[++i];
      } else if (typeof arg === 'string' && arg.startsWith('--viewer=')) {
        viewerStack = arg.slice('--viewer='.length).trim();
      } else if (arg === '--glb' && i + 1 < rest.length) {
        glbPath = rest[++i];
      } else if (!arg.startsWith('-') && !glbPath) {
        glbPath = arg;
      } else {
        throw new Error(`Unknown or malformed glb-handoff argument: ${String(arg)}`);
      }
    }

    if (!glbPath || typeof glbPath !== 'string' || glbPath.trim().length === 0) {
      throw new Error('glb-handoff requires a <file.glb> path.');
    }

    const res = generateGlbHandoffReportFromFileSync(glbPath, {
      outDir,
      targetViewerStack: viewerStack,
      sourceKind: syntheticFlag ? 'synthetic_fixture' : 'user_supplied',
      isSyntheticFixture: syntheticFlag,
      strictPositionBounds: strictBounds,
      repoRoot,
    });

    if (!res.ok) {
      if (jsonOutput) {
        return {
          ok: false,
          mode: 'glb-handoff',
          bundle: res,
          globalTouched: false,
          runtimeStatus: 'Not Run',
          artifactStatus: 'Not Produced',
          report: `${JSON.stringify(res.jsonReport, null, 2)}\n`,
        };
      }
      throw new Error(
        `GLB handoff validation failed for '${path.basename(glbPath)}': ${res.inspection.errors.join('; ')}`,
      );
    }

    const writtenAppendix = res.writtenFiles
      ? [
          '',
          '### Written Handoff Report Files',
          `- Manifest JSON: \`${res.writtenFiles.manifestPath}\``,
          `- Full JSON Report: \`${res.writtenFiles.jsonReportPath}\``,
          `- Interactive HTML Report: \`${res.writtenFiles.htmlReportPath}\``,
          `- Markdown Summary: \`${res.writtenFiles.markdownPath}\``,
          '',
        ].join('\n')
      : '';

    const report = jsonOutput
      ? `${JSON.stringify(res.jsonReport, null, 2)}\n`
      : `${res.markdownSummary}${writtenAppendix}`;

    return {
      ok: true,
      mode: 'glb-handoff',
      bundle: res,
      globalTouched: false,
      runtimeStatus: res.manifest.truthStates.runtimeStatus,
      artifactStatus: res.manifest.truthStates.artifactStatus,
      report,
    };
  }

  if (rawSub === 'glb-validate-manifest') {
    let manifestPath = null;
    let jsonOutput = false;

    for (let i = 0; i < rest.length; i += 1) {
      const arg = rest[i];
      if (arg === '--json') {
        jsonOutput = true;
      } else if (arg === '--manifest' && i + 1 < rest.length) {
        manifestPath = rest[++i];
      } else if (!arg.startsWith('-') && !manifestPath) {
        manifestPath = arg;
      } else {
        throw new Error(`Unknown or malformed glb-validate-manifest argument: ${String(arg)}`);
      }
    }

    if (!manifestPath || typeof manifestPath !== 'string' || manifestPath.trim().length === 0) {
      throw new Error('glb-validate-manifest requires a <manifest.json> path.');
    }

    const resolved = path.resolve(manifestPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Handoff manifest file does not exist: ${manifestPath}`);
    }
    const lstat = fs.lstatSync(resolved);
    if (lstat.isSymbolicLink() || !lstat.isFile()) {
      throw new Error(`Handoff manifest path must be a regular non-symlink file: ${manifestPath}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    } catch (err) {
      throw new Error(`Malformed JSON in handoff manifest '${manifestPath}': ${err.message}`);
    }

    const validation = validateGlbWebHandoffManifest(parsed);
    if (!validation.valid) {
      if (jsonOutput) {
        return {
          ok: false,
          mode: 'glb-validate-manifest',
          validation,
          globalTouched: false,
          runtimeStatus: 'Not Run',
          artifactStatus: 'Not Produced',
          report: `${JSON.stringify(validation, null, 2)}\n`,
        };
      }
      throw new Error(
        `Handoff manifest validation failed: ${validation.errors.join('; ')}`,
      );
    }

    const report = jsonOutput
      ? `${JSON.stringify(validation, null, 2)}\n`
      : [
          '## BlendOps GLB Web Handoff Manifest Validation',
          '',
          `- Manifest ID: ${parsed.manifestId}`,
          `- File: ${resolved}`,
          `- Schema & semantic validation: Passed`,
          `- Overall verdict: ${parsed.validationSummary?.overallVerdict}`,
          '- Global files touched: No',
          `- Runtime status: ${parsed.truthStates?.runtimeStatus || 'Not Run'}`,
          `- Artifact status: ${parsed.truthStates?.artifactStatus || 'Not Produced'}`,
          '',
        ].join('\n');

    return {
      ok: true,
      mode: 'glb-validate-manifest',
      validation,
      globalTouched: false,
      runtimeStatus: parsed.truthStates?.runtimeStatus || 'Not Run',
      artifactStatus: parsed.truthStates?.artifactStatus || 'Not Produced',
      report,
    };
  }

  throw new Error(`Unknown GLB subcommand: ${rawSub}`);
}
