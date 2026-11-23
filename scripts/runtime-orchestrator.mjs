#!/usr/bin/env node
/**
 * BlendOps Runtime Orchestrator — Blender Production Layer & Safe MCP Integration
 *
 * Implements:
 * - Runtime Discovery, Session Contract & Capability Negotiation
 * - Canonical Typed Operation Registry Validation & Lookup
 * - Execution Safety State Machine, Pre-Mutation .blend Checkpoints,
 *   Idempotency, Independent Readback, Postcondition Verification & Rollback
 * - Safe Blender Production Vertical Slice (L0 Inspection + Bounded L1 Camera/Light Mutation)
 * - Redacted Operation Execution Ledger & Runtime Evidence Packet Integration
 * - CLI Subcommands (runtime doctor/inspect/capabilities, operation list/validate, execution preflight/report/inspect)
 * - Deterministic Mock MCP Runtime (with adversarial fault injection)
 *
 * The implementation lives in scripts/runtime/; this file is the public API and CLI entry.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_REPO_ROOT } from './runtime/paths.mjs';
export {
  runCliFallbackEval,
} from './runtime/cli-fallback.mjs';
export {
  CLI_EXIT_CODES,
  RUNTIME_CLI_SUBCOMMANDS,
  RECOGNIZED_RUNTIME_PATHS,
} from './runtime/constants.mjs';
export {
  redactSensitiveData,
  validateRuntimeTransportEndpoint,
  validateStdioCommandConfig,
  detectIndirectCodeInjection,
  computeToolSchemaFingerprint,
  computeFullToolContractFingerprints,
  inspectJsonSchemaSafety,
  computeToolInventoryFingerprint,
  detectToolDescriptionInjection,
  detectArbitraryCodeSchemaParameters,
  parseMcpCallToolResult,
} from './runtime/security.mjs';
export {
  negotiateMcpProtocolCompatibility,
  evaluateRuntimeProvenance,
  validateSafeBlendCheckpointPaths,
  resolveRuntimeGovernancePaths,
  SYNTHETIC_GOVERNED_TOOL_SCHEMAS,
  isTrustedMockRuntimeFixture,
  qualifyUpstreamTool,
  qualifyUpstreamToolInventory,
  evaluateOperationMappingsAgainstUpstream,
  validateRuntimeOperationsRegistry,
  listRuntimeOperations,
  getRuntimeOperation,
} from './runtime/qualification.mjs';
export {
  createMockMcpRuntime,
  createUpstreamRealityMockRuntime,
} from './runtime/mock-runtime.mjs';
export {
  discoverRuntimeSession,
} from './runtime/session.mjs';
export {
  runExecutionPreflight,
  executeTypedOperationSequence,
  verifyRollbackRestoration,
  evaluateGltfValidatorReport,
  verifyStagedOutputArtifact,
} from './runtime/execution.mjs';
export {
  runRuntimeQualificationAndSmoke,
} from './runtime/smoke.mjs';
export {
  connectMcpRuntimeClient,
  discoverRuntimeSessionAsync,
  inspectLiveReadOnlyRuntimeAsync,
  runRuntimeQualificationAndSmokeAsync,
} from './runtime/live-client.mjs';
export {
  computeRuntimeCliExitCode,
  formatQualificationReportMarkdown,
} from './runtime/report.mjs';
export {
  runProductSceneVerticalSlice,
} from './runtime/vertical-slice.mjs';
export {
  runRuntimeAndExecutionCliSubcommand,
} from './runtime/cli.mjs';
import { validateRuntimeOperationsRegistry } from './runtime/qualification.mjs';
import { runRuntimeAndExecutionCliSubcommand } from './runtime/cli.mjs';

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    const res = validateRuntimeOperationsRegistry(DEFAULT_REPO_ROOT);
    if (!res.valid) {
      console.error('Runtime operations registry check failed:');
      for (const e of res.errors) console.error(`- ${e}`);
      process.exit(1);
    }
    console.log(
      `Runtime operations check passed (${res.operation_count} operations: L0=${res.counts_by_tier.L0}, L1=${res.counts_by_tier.L1}, L2=${res.counts_by_tier.L2}).`,
    );
  } else {
    const res = runRuntimeAndExecutionCliSubcommand(args);
    process.stdout.write(res.report);
    process.exitCode = res.exitCode;
  }
}
