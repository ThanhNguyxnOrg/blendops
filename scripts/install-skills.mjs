#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRECEDENCE_HIERARCHY,
  resolveCatalogPaths,
  validateSceneSpec,
  compileExecutionPlan,
  inspectExecutionPlan,
  runPlanCliSubcommand,
} from './compile-scene-plan.mjs';
import {
  RUNTIME_CLI_SUBCOMMANDS,
  RECOGNIZED_RUNTIME_PATHS,
  CLI_EXIT_CODES,
  resolveRuntimeGovernancePaths,
  discoverRuntimeSession,
  discoverRuntimeSessionAsync,
  validateRuntimeOperationsRegistry,
  listRuntimeOperations,
  getRuntimeOperation,
  runExecutionPreflight,
  executeTypedOperationSequence,
  runProductSceneVerticalSlice,
  createMockMcpRuntime,
  createUpstreamRealityMockRuntime,
  isTrustedMockRuntimeFixture,
  redactSensitiveData,
  validateRuntimeTransportEndpoint,
  validateStdioCommandConfig,
  computeToolSchemaFingerprint,
  computeFullToolContractFingerprints,
  computeToolInventoryFingerprint,
  inspectJsonSchemaSafety,
  parseMcpCallToolResult,
  evaluateRuntimeProvenance,
  detectToolDescriptionInjection,
  detectArbitraryCodeSchemaParameters,
  negotiateMcpProtocolCompatibility,
  qualifyUpstreamTool,
  qualifyUpstreamToolInventory,
  evaluateOperationMappingsAgainstUpstream,
  verifyRollbackRestoration,
  evaluateGltfValidatorReport,
  verifyStagedOutputArtifact,
  connectMcpRuntimeClient,
  inspectLiveReadOnlyRuntimeAsync,
  runRuntimeQualificationAndSmoke,
  runRuntimeQualificationAndSmokeAsync,
  computeRuntimeCliExitCode,
  formatQualificationReportMarkdown,
  runRuntimeAndExecutionCliSubcommand,
} from './runtime-orchestrator.mjs';
import { runInstaller } from './cli/installer.mjs';
import { GLB_SUBCOMMANDS, runGlbCliSubcommand } from './cli/glb-command.mjs';
import { CATALOG_SUBCOMMANDS, PLAN_SUBCOMMANDS, runCatalogCliSubcommand } from './cli/catalog-command.mjs';

export {
  PRECEDENCE_HIERARCHY,
  resolveCatalogPaths,
  validateSceneSpec,
  compileExecutionPlan,
  inspectExecutionPlan,
  runPlanCliSubcommand,
  RUNTIME_CLI_SUBCOMMANDS,
  RECOGNIZED_RUNTIME_PATHS,
  CLI_EXIT_CODES,
  resolveRuntimeGovernancePaths,
  discoverRuntimeSession,
  discoverRuntimeSessionAsync,
  validateRuntimeOperationsRegistry,
  listRuntimeOperations,
  getRuntimeOperation,
  runExecutionPreflight,
  executeTypedOperationSequence,
  runProductSceneVerticalSlice,
  createMockMcpRuntime,
  createUpstreamRealityMockRuntime,
  isTrustedMockRuntimeFixture,
  redactSensitiveData,
  validateRuntimeTransportEndpoint,
  validateStdioCommandConfig,
  computeToolSchemaFingerprint,
  computeFullToolContractFingerprints,
  computeToolInventoryFingerprint,
  inspectJsonSchemaSafety,
  parseMcpCallToolResult,
  evaluateRuntimeProvenance,
  detectToolDescriptionInjection,
  detectArbitraryCodeSchemaParameters,
  negotiateMcpProtocolCompatibility,
  qualifyUpstreamTool,
  qualifyUpstreamToolInventory,
  evaluateOperationMappingsAgainstUpstream,
  verifyRollbackRestoration,
  evaluateGltfValidatorReport,
  verifyStagedOutputArtifact,
  connectMcpRuntimeClient,
  inspectLiveReadOnlyRuntimeAsync,
  runRuntimeQualificationAndSmoke,
  runRuntimeQualificationAndSmokeAsync,
  computeRuntimeCliExitCode,
  formatQualificationReportMarkdown,
  runRuntimeAndExecutionCliSubcommand,
};

export { INSTALLER_VERSION, MANAGED_SECTION_START, MANAGED_SECTION_END, SUPPORTED_TARGETS, AGENT_SKILLS_SH_DIRECTORY_MAP } from './cli/constants.mjs';
export { validateDestinationRoot } from './cli/path-safety.mjs';
export { parseInstallerArgs, detectProjectTargetMarkers } from './cli/args.mjs';
export { computeBlendOpsSourceFingerprint, computeSkillEntriesLockHash, computeSkillFolderLockHash, buildSkillsLockJsonV2, validateSkillsShConfig } from './cli/source-fingerprint.mjs';
export { validatePlanStoreDirectory } from './cli/install-plan.mjs';
export { formatInstallerHelp, formatInstallerReport } from './cli/report.mjs';
export { validateRollbackManifestSchema, recoverPendingTransactionJournal } from './cli/rollback.mjs';
export { runInstaller } from './cli/installer.mjs';
export { runGlbCliSubcommand } from './cli/glb-command.mjs';
export { runCatalogCliSubcommand } from './cli/catalog-command.mjs';

const __filename = fileURLToPath(import.meta.url);


export function runCli(argv = process.argv.slice(2), options = {}) {
  try {
    if (Array.isArray(argv) && argv.length > 0 && GLB_SUBCOMMANDS.has(argv[0])) {
      const res = runGlbCliSubcommand(argv, options);
      process.stdout.write(res.report);
      process.exitCode = res.ok ? 0 : 1;
      return res;
    }
    if (Array.isArray(argv) && argv.length > 0 && CATALOG_SUBCOMMANDS.has(argv[0])) {
      const res = runCatalogCliSubcommand(argv, options);
      process.stdout.write(res.report);
      process.exitCode = res.ok ? 0 : 1;
      return res;
    }
    if (Array.isArray(argv) && argv.length > 0 && PLAN_SUBCOMMANDS.has(argv[0])) {
      const res = runPlanCliSubcommand(argv, options);
      process.stdout.write(res.report);
      process.exitCode = typeof res.exitCode === 'number' ? res.exitCode : res.ok ? 0 : 1;
      return res;
    }
    if (Array.isArray(argv) && argv.length > 0 && RUNTIME_CLI_SUBCOMMANDS.has(argv[0])) {
      const res = runRuntimeAndExecutionCliSubcommand(argv, options);
      process.stdout.write(res.report);
      process.exitCode = typeof res.exitCode === 'number' ? res.exitCode : res.ok ? 0 : 1;
      return res;
    }
    const res = runInstaller(argv, options);
    process.stdout.write(res.report);
    process.exitCode = 0;
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    process.stderr.write(
      [
        '## BlendOps installer error',
        '',
        `- Error: ${message}`,
        '- Global files touched: No',
        '- Runtime status: Not Run',
        '- Artifact status: Not Produced',
        '',
      ].join('\n'),
    );
    process.exitCode = 1;
    return null;
  }
}

const isMainModule =
  Boolean(process.argv[1]) &&
  (() => {
    try {
      return fs.realpathSync(path.resolve(process.argv[1])) === fs.realpathSync(__filename);
    } catch {
      return path.resolve(process.argv[1]) === __filename;
    }
  })();

if (isMainModule) {
  runCli(process.argv.slice(2));
}
