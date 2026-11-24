// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import fs from 'node:fs';
import path from 'node:path';
import { compileExecutionPlan, writeFileAtomicallySafe } from '../compile-scene-plan.mjs';
import { executeTypedOperationSequence, runExecutionPreflight } from './execution.mjs';
import { createMockMcpRuntime } from './mock-runtime.mjs';
import { DEFAULT_REPO_ROOT } from './paths.mjs';
import { doesMatrixEntryMatchRuntimePath, evaluateOperationMappingsAgainstUpstream, getAjvValidator, isTrustedMockRuntimeFixture, listRuntimeOperations, qualifyUpstreamToolInventory, resolveRuntimeGovernancePaths, validateRuntimeOperationsRegistry } from './qualification.mjs';
import { computeRuntimeCliExitCode, formatQualificationReportMarkdown } from './report.mjs';
import { discoverRuntimeSession } from './session.mjs';
import { runRuntimeQualificationAndSmoke } from './smoke.mjs';
import { formatLedgerMarkdown, formatSessionMarkdown, runProductSceneVerticalSlice } from './vertical-slice.mjs';

/**
 * CLI Subcommand Runner (`runtime`, `operation`, `execution`).
 */
export function runRuntimeAndExecutionCliSubcommand(argv = [], options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const rawFirst = argv[0];
  let subcommand = rawFirst;
  let rest = argv.slice(1);

  if (rawFirst === 'runtime' || rawFirst === 'operation' || rawFirst === 'execution') {
    const action = rest[0] || '';
    subcommand = `${rawFirst}-${action}`;
    rest = rest.slice(1);
  }

  let jsonOutput = false;
  let runtimePath = null;
  let projectDir = null;
  let configPath = null;
  let specPath = null;
  let planPath = null;
  let ledgerPath = null;
  let outPath = null;
  let tierFilter = null;
  let operationId = null;
  let mockScenario = null;
  let smokeMode = 'offline_contract';
  let liveSmokeOptIn = false;
  let disposableSceneConfirmed = false;
  let includeL1Smoke = false;
  let endpoint = null;
  let allowRemoteEndpoint = false;
  let liveReadOnly = false;
  let detailedExitCodes = false;

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--detailed-exit-codes') {
      detailedExitCodes = true;
    } else if (arg === '--live-read-only') {
      liveReadOnly = true;
    } else if (arg === '--allow-remote-endpoint') {
      allowRemoteEndpoint = true;
    } else if (arg === '--endpoint' && i + 1 < rest.length) {
      endpoint = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--endpoint=')) {
      endpoint = arg.slice('--endpoint='.length).trim();
    } else if (arg === '--runtime-path' && i + 1 < rest.length) {
      runtimePath = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--runtime-path=')) {
      runtimePath = arg.slice('--runtime-path='.length).trim();
    } else if ((arg === '--project' || arg === '--project-dir') && i + 1 < rest.length) {
      projectDir = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--project=')) {
      projectDir = arg.slice('--project='.length).trim();
    } else if (typeof arg === 'string' && arg.startsWith('--project-dir=')) {
      projectDir = arg.slice('--project-dir='.length).trim();
    } else if (arg === '--config' && i + 1 < rest.length) {
      configPath = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--config=')) {
      configPath = arg.slice('--config='.length).trim();
    } else if (arg === '--spec' && i + 1 < rest.length) {
      specPath = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--spec=')) {
      specPath = arg.slice('--spec='.length).trim();
    } else if (arg === '--plan' && i + 1 < rest.length) {
      planPath = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--plan=')) {
      planPath = arg.slice('--plan='.length).trim();
    } else if (arg === '--ledger' && i + 1 < rest.length) {
      ledgerPath = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--ledger=')) {
      ledgerPath = arg.slice('--ledger='.length).trim();
    } else if (arg === '--out' && i + 1 < rest.length) {
      outPath = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--out=')) {
      outPath = arg.slice('--out='.length).trim();
    } else if (arg === '--tier' && i + 1 < rest.length) {
      tierFilter = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--tier=')) {
      tierFilter = arg.slice('--tier='.length).trim();
    } else if (arg === '--operation' && i + 1 < rest.length) {
      operationId = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--operation=')) {
      operationId = arg.slice('--operation='.length).trim();
    } else if (arg === '--mode' && i + 1 < rest.length) {
      smokeMode = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--mode=')) {
      smokeMode = arg.slice('--mode='.length).trim();
    } else if (arg === '--live-smoke-opt-in') {
      liveSmokeOptIn = true;
    } else if (arg === '--disposable-scene') {
      disposableSceneConfirmed = true;
    } else if (arg === '--include-l1-smoke') {
      includeL1Smoke = true;
    } else if (arg === '--mock-runtime') {
      if (i + 1 < rest.length && !rest[i + 1].startsWith('-')) {
        mockScenario = rest[++i];
      } else {
        mockScenario = 'healthy';
      }
    } else if (typeof arg === 'string' && arg.startsWith('--mock-runtime=')) {
      mockScenario = arg.slice('--mock-runtime='.length).trim() || 'healthy';
    } else if (!arg.startsWith('-') && !ledgerPath && subcommand === 'execution-inspect') {
      ledgerPath = arg;
    } else if (!arg.startsWith('-') && !specPath && (subcommand === 'execution-preflight' || subcommand === 'execution-report')) {
      specPath = arg;
    } else {
      throw new Error(`Unknown or malformed argument for ${subcommand}: ${String(arg)}`);
    }
  }

  const mockRuntime = mockScenario
    ? createMockMcpRuntime({
        runtimePath: runtimePath || 'path-1-host-a',
        scenario: mockScenario,
      })
    : null;

  try {
    if (
      subcommand === 'runtime-doctor' ||
      subcommand === 'runtime-inspect' ||
      subcommand === 'runtime-capabilities' ||
      subcommand === 'runtime-connect'
    ) {
      const executionPlan = planPath
        ? JSON.parse(fs.readFileSync(path.resolve(planPath), 'utf8'))
        : specPath
          ? compileExecutionPlan(path.resolve(specPath), { repoRoot, projectDir }).plan
          : null;

      const session = discoverRuntimeSession({
        repoRoot,
        projectDir,
        configPath,
        runtimePath: runtimePath || (mockRuntime ? mockRuntime.runtimePath : 'none'),
        mockRuntime,
        executionPlan,
        endpoint,
        allowRemoteEndpoint,
      });

      const heading =
        subcommand === 'runtime-doctor'
          ? '## BlendOps Runtime Doctor'
          : subcommand === 'runtime-inspect'
            ? '## BlendOps Runtime Session Inspection'
            : subcommand === 'runtime-connect'
              ? '## BlendOps MCP Runtime Connection & Qualification'
              : '## BlendOps Runtime Capabilities Negotiation';

      const report = jsonOutput
        ? `${JSON.stringify(session, null, 2)}\n`
        : formatSessionMarkdown(session, heading);

      const isErrorState = [
        'unreachable',
        'version_unsupported',
        'missing_required_tools',
        'invalid_tool_schema',
        'bridge_conflict',
        'incompatible_with_plan',
        'stale_session',
        'invalid_endpoint',
        'protocol_incompatible',
        'identity_mismatch',
        ...(subcommand === 'runtime-connect' ? ['configured_unreachable'] : []),
      ].includes(session.connection_status);

      const detailedCode = computeRuntimeCliExitCode({ subcommand, session });
      const exitCode =
        detailedExitCodes || subcommand === 'runtime-connect'
          ? detailedCode
          : isErrorState
            ? 2
            : 0;

      return {
        ok: !isErrorState,
        exitCode,
        detailedExitCode: detailedCode,
        mode: subcommand,
        session,
        globalTouched: false,
        runtimeStatus: session.truth_states.runtime_status,
        artifactStatus: session.truth_states.artifact_status,
        report,
      };
    }

    if (subcommand === 'runtime-qualify' || subcommand === 'runtime-smoke') {
      const qualReport = runRuntimeQualificationAndSmoke({
        repoRoot,
        projectDir,
        runtimePath: runtimePath || (mockRuntime ? mockRuntime.runtimePath : 'path-1-host-a'),
        mode: smokeMode,
        liveSmokeOptIn,
        disposableSceneConfirmed,
        includeL1Smoke,
        mockRuntime,
        endpoint,
        allowRemoteEndpoint,
      });

      if (outPath) {
        writeFileAtomicallySafe(outPath, `${JSON.stringify(qualReport, null, 2)}\n`, {
          repoRoot,
          projectDir,
        });
      }

      const heading =
        subcommand === 'runtime-qualify'
          ? '## BlendOps Upstream MCP Runtime Qualification Report'
          : '## BlendOps Controlled Runtime Smoke Report';

      const report = jsonOutput
        ? `${JSON.stringify(qualReport, null, 2)}\n`
        : formatQualificationReportMarkdown(qualReport, heading);

      const blockedByMissingOptIn =
        qualReport.runtime_reachability === 'blocked_opt_in_missing';
      const failedInventory =
        !qualReport.qualification_states.tool_inventory_verified;

      const detailedCode = computeRuntimeCliExitCode({ subcommand, qualReport });
      const exitCode = detailedExitCodes
        ? detailedCode
        : blockedByMissingOptIn || failedInventory
          ? 2
          : 0;

      return {
        ok: exitCode === 0,
        exitCode,
        detailedExitCode: detailedCode,
        mode: subcommand,
        qualificationReport: qualReport,
        globalTouched: false,
        runtimeStatus: qualReport.truth_states.runtime_status,
        artifactStatus: qualReport.truth_states.artifact_status,
        report,
      };
    }

    if (subcommand === 'runtime-tools') {
      const targetPath = runtimePath || (mockRuntime ? mockRuntime.runtimePath : 'path-1-host-a');
      const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
      const registryDoc = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));

      const rawTools = mockRuntime
        ? mockRuntime.probeSession().tools || []
        : (registryDoc.upstream_tool_qualification_matrix || [])
            .filter((m) => doesMatrixEntryMatchRuntimePath(m, targetPath))
            .map((m) => ({
              name: m.tool_name,
              description: m.description,
              inputSchema: m.input_schema,
            }));

      const inv = qualifyUpstreamToolInventory(rawTools, targetPath, {
        repoRoot,
        projectDir,
        strictSchemaFingerprint: !mockRuntime || mockScenario?.startsWith('upstream_'),
        trustedMockFixture: isTrustedMockRuntimeFixture(mockRuntime),
      });

      const report = jsonOutput
        ? `${JSON.stringify(inv, null, 2)}\n`
        : [
            '## BlendOps Upstream MCP Tool Qualification Inventory',
            '',
            `- Runtime Path: \`${inv.runtime_path}\``,
            `- Tool Inventory Fingerprint: \`${inv.tool_inventory_fingerprint}\``,
            `- Total Tools Audited: ${inv.qualified_tools.length}`,
            `- Schema Drift Detected: ${inv.schema_drift_detected ? 'Yes' : 'No'}`,
            `- Requalification Required: ${inv.requalification_required ? 'Yes' : 'No'}`,
            `- Unsafe Raw Code Tools Blocked (${inv.unsafe_raw_code_tools_blocked.length}): ${inv.unsafe_raw_code_tools_blocked.map((t) => `\`${t}\``).join(', ') || 'none'}`,
            `- Unsupported Tools Blocked (${inv.unsupported_tools_blocked.length}): ${inv.unsupported_tools_blocked.map((t) => `\`${t}\``).join(', ') || 'none'}`,
            `- Unknown Tools Blocked (${inv.unknown_tools_blocked.length}): ${inv.unknown_tools_blocked.map((t) => `\`${t}\``).join(', ') || 'none'}`,
            '',
            '### Tool Classifications',
            ...inv.qualified_tools.map(
              (qt, idx) =>
                `${idx + 1}. \`${qt.tool_name}\` -> \`${qt.classification}\` [${qt.capability_tier}] (Allowed in governed execution: ${qt.allowed_in_governed_execution ? 'Yes' : 'No'}, Fingerprint: \`${(qt.actual_schema_fingerprint || '').slice(0, 16)}...\`)`,
            ),
            '',
            '- Global files touched: No',
            '- Runtime status: Not Run',
            '- Artifact status: Not Produced',
            '',
          ].join('\n');

      const ok = !inv.schema_drift_detected && inv.unknown_tools_blocked.length === 0;
      const detailedCode = computeRuntimeCliExitCode({ subcommand, toolInventory: inv });
      return {
        ok,
        exitCode: detailedExitCodes ? detailedCode : ok ? 0 : 2,
        detailedExitCode: detailedCode,
        mode: 'runtime-tools',
        toolInventory: inv,
        globalTouched: false,
        runtimeStatus: 'Not Run',
        artifactStatus: 'Not Produced',
        report,
      };
    }

    if (subcommand === 'operation-mappings') {
      const evalRes = evaluateOperationMappingsAgainstUpstream(repoRoot, {
        projectDir,
        runtimePath,
      });

      const report = jsonOutput
        ? `${JSON.stringify(evalRes, null, 2)}\n`
        : [
            '## BlendOps Canonical Operation-to-Upstream-MCP-Tool Mappings',
            '',
            `- Valid: ${evalRes.valid ? 'Yes' : 'No'}`,
            `- Total Mappings Evaluated: ${evalRes.total_mappings}`,
            `- Permanently Blocked L3 Interfaces: ${evalRes.blocked_arbitrary_interfaces.map((b) => `\`${b.interface_id || b.interface_name}\``).join(', ')}`,
            '',
            '### Operation Mappings',
            ...evalRes.mappings.map(
              (m, idx) =>
                `${idx + 1}. \`${m.operation_id}\` [${m.required_capability_tier}] on \`${m.runtime_path}\` -> upstream: \`${m.upstream_mcp_tool_name || 'none'}\` | status: \`${m.upstream_qualification_status}\` | readback: ${m.readback_tools.map((r) => `\`${r}\``).join(', ')}`,
            ),
            '',
            '- Global files touched: No',
            '- Runtime status: Not Run',
            '- Artifact status: Not Produced',
            '',
          ].join('\n');

      return {
        ok: evalRes.valid,
        exitCode: evalRes.valid ? 0 : 2,
        detailedExitCode: evalRes.valid ? 0 : 4,
        mode: 'operation-mappings',
        mappingsResult: evalRes,
        globalTouched: false,
        runtimeStatus: 'Not Run',
        artifactStatus: 'Not Produced',
        report,
      };
    }

    if (subcommand === 'operation-list') {
      const listRes = listRuntimeOperations(repoRoot, {
        projectDir,
        tier: tierFilter,
        runtimePath,
      });
      const report = jsonOutput
        ? `${JSON.stringify(listRes, null, 2)}\n`
        : [
            '## BlendOps Typed Runtime Operations Registry',
            '',
            `- Total Operations: ${listRes.total_operations}`,
            ...listRes.operations.map(
              (op, idx) =>
                `${idx + 1}. \`${op.operation_id}\` [${op.required_capability_tier}, ${op.behavior}] — ${op.display_name} (Paths: ${op.supported_runtime_paths.join(', ')})`,
            ),
            '',
            '- Global files touched: No',
            '- Runtime status: Not Run',
            '- Artifact status: Not Produced',
            '',
          ].join('\n');

      return {
        ok: true,
        exitCode: 0,
        detailedExitCode: 0,
        mode: 'operation-list',
        listRes,
        globalTouched: false,
        runtimeStatus: 'Not Run',
        artifactStatus: 'Not Produced',
        report,
      };
    }

    if (subcommand === 'operation-validate') {
      const valRes = validateRuntimeOperationsRegistry(repoRoot, { projectDir });
      if (!valRes.valid && !jsonOutput) {
        throw new Error(`Runtime operations registry validation failed: ${valRes.errors.join('; ')}`);
      }
      const report = jsonOutput
        ? `${JSON.stringify(valRes, null, 2)}\n`
        : [
            '## BlendOps Typed Runtime Operations Registry Validation',
            '',
            `- Valid: ${valRes.valid ? 'Yes' : 'No'}`,
            `- Total Operations: ${valRes.operation_count} (L0: ${valRes.counts_by_tier.L0}, L1: ${valRes.counts_by_tier.L1}, L2: ${valRes.counts_by_tier.L2})`,
            `- Source Mode: \`${valRes.source_mode}\``,
            '- Global files touched: No',
            '- Runtime status: Not Run',
            '- Artifact status: Not Produced',
            '',
          ].join('\n');

      return {
        ok: valRes.valid,
        exitCode: valRes.valid ? 0 : 1,
        detailedExitCode: valRes.valid ? 0 : 1,
        mode: 'operation-validate',
        validation: valRes,
        globalTouched: false,
        runtimeStatus: 'Not Run',
        artifactStatus: 'Not Produced',
        report,
      };
    }

    if (subcommand === 'execution-preflight') {
      const sceneSpec = specPath
        ? JSON.parse(fs.readFileSync(path.resolve(specPath), 'utf8'))
        : null;
      const executionPlan = planPath
        ? JSON.parse(fs.readFileSync(path.resolve(planPath), 'utf8'))
        : null;

      const pf = runExecutionPreflight({
        repoRoot,
        projectDir,
        sceneSpec,
        executionPlan,
        runtimePath: runtimePath || (mockRuntime ? mockRuntime.runtimePath : 'none'),
        operationId: operationId || 'op.inspect.blendfile-summary',
        mockRuntime,
      });

      const report = jsonOutput
        ? `${JSON.stringify(pf, null, 2)}\n`
        : [
            '## BlendOps Execution Preflight Report',
            '',
            `- Preflight Passed: ${pf.passed ? 'Yes' : 'No'}`,
            `- SceneSpec Valid: ${pf.scene_spec_valid ? 'Yes' : 'No'}`,
            `- ExecutionPlan Valid: ${pf.execution_plan_valid ? 'Yes' : 'No'}`,
            `- Runtime Ready: ${pf.runtime_ready ? 'Yes' : 'No'}`,
            `- Version Compatible: ${pf.version_compatible ? 'Yes' : 'No'}`,
            `- Tool Mapping Available: ${pf.tool_mapping_available ? 'Yes' : 'No'}`,
            `- Capability Tier Granted: \`${pf.capability_tier_granted}\``,
            ...(pf.blocking_reasons.length > 0
              ? ['', '### Blocking Reasons', ...pf.blocking_reasons.map((r) => `- ${r}`)]
              : []),
            '',
            '- Global files touched: No',
            '- Runtime status: Not Run',
            '- Artifact status: Not Produced',
            '',
          ].join('\n');

      const detailedCode = computeRuntimeCliExitCode({ subcommand, preflight: pf });
      return {
        ok: pf.passed,
        exitCode: detailedExitCodes ? detailedCode : pf.passed ? 0 : 2,
        detailedExitCode: detailedCode,
        mode: 'execution-preflight',
        preflight: pf,
        globalTouched: false,
        runtimeStatus: 'Not Run',
        artifactStatus: 'Not Produced',
        report,
      };
    }

    if (subcommand === 'execution-report') {
      const sliceRes = runProductSceneVerticalSlice({
        repoRoot,
        projectDir,
        sceneSpecPath: specPath ? path.resolve(specPath) : undefined,
        runtimePath: runtimePath || (mockRuntime ? mockRuntime.runtimePath : 'none'),
        mockRuntime,
      });

      if (outPath) {
        writeFileAtomicallySafe(outPath, `${JSON.stringify(sliceRes.ledger, null, 2)}\n`, {
          repoRoot,
          projectDir,
        });
      }

      const report = jsonOutput
        ? `${JSON.stringify(sliceRes.ledger, null, 2)}\n`
        : formatLedgerMarkdown(sliceRes.ledger);

      const detailedCode = computeRuntimeCliExitCode({
        subcommand,
        ledger: sliceRes.ledger,
      });
      const exitCode = detailedExitCodes
        ? detailedCode
        : sliceRes.ledger.lifecycle_status === 'committed'
          ? 0
          : sliceRes.ledger.lifecycle_status === 'blocked'
            ? 2
            : 1;

      return {
        ok: sliceRes.ok,
        exitCode,
        detailedExitCode: detailedCode,
        mode: 'execution-report',
        ledger: sliceRes.ledger,
        globalTouched: false,
        runtimeStatus: sliceRes.ledger.truth_states.runtime_status,
        artifactStatus: sliceRes.ledger.truth_states.artifact_status,
        report,
      };
    }

    if (subcommand === 'execution-inspect') {
      if (liveReadOnly) {
        const l0Seq = executeTypedOperationSequence({
          repoRoot,
          projectDir,
          runtimePath: runtimePath || (mockRuntime ? mockRuntime.runtimePath : 'none'),
          mockRuntime,
          grantedTier: 'L0',
          operations: [
            {
              operation_id: 'op.inspect.blendfile-summary',
              skill_id: 'blendops-final-check',
              input: { include_datablock_counts: true },
            },
            {
              operation_id: 'op.inspect.object-list',
              skill_id: 'blendops-final-check',
              input: { filter_type: 'ALL' },
            },
          ],
        });
        const report = jsonOutput
          ? `${JSON.stringify(l0Seq.ledger, null, 2)}\n`
          : formatLedgerMarkdown(l0Seq.ledger);
        const detailedCode = computeRuntimeCliExitCode({
          subcommand,
          ledger: l0Seq.ledger,
        });
        return {
          ok: l0Seq.ok,
          exitCode: detailedExitCodes ? detailedCode : l0Seq.ok ? 0 : 2,
          detailedExitCode: detailedCode,
          mode: 'execution-inspect',
          ledger: l0Seq.ledger,
          globalTouched: false,
          runtimeStatus: l0Seq.ledger.truth_states.runtime_status,
          artifactStatus: l0Seq.ledger.truth_states.artifact_status,
          report,
        };
      }

      if (!ledgerPath) {
        throw new Error('execution-inspect requires a <ledger.json> path, --ledger <file>, or --live-read-only.');
      }
      const absLedger = path.resolve(ledgerPath);
      if (!fs.existsSync(absLedger)) {
        throw new Error(`Operation execution ledger file not found: ${ledgerPath}`);
      }
      const ledger = JSON.parse(fs.readFileSync(absLedger, 'utf8'));
      const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
      const validateLedger = getAjvValidator(paths.operationLedgerSchemaPath);
      const valid = Boolean(validateLedger(ledger));
      if (!valid && !jsonOutput) {
        const errs = (validateLedger.errors || []).map(
          (e) => `${e.instancePath || '/'} ${e.message}`,
        );
        throw new Error(`Invalid operation execution ledger: ${errs.join('; ')}`);
      }

      const report = jsonOutput
        ? `${JSON.stringify({ valid, ledger }, null, 2)}\n`
        : formatLedgerMarkdown(ledger);

      return {
        ok: valid,
        exitCode: valid ? 0 : 1,
        detailedExitCode: valid ? 0 : 1,
        mode: 'execution-inspect',
        ledger,
        globalTouched: false,
        runtimeStatus: ledger.truth_states?.runtime_status || 'Not Run',
        artifactStatus: ledger.truth_states?.artifact_status || 'Not Produced',
        report,
      };
    }

    throw new Error(`Unknown runtime/operation/execution subcommand: ${subcommand}`);
  } finally {
    if (mockRuntime && mockRuntime.tempDir && fs.existsSync(mockRuntime.tempDir)) {
      try {
        fs.rmSync(mockRuntime.tempDir, { recursive: true, force: true });
      } catch {
        // ignore temp cleanup errors
      }
    }
  }
}
