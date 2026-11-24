// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import fs from 'node:fs';
import { sha256Hex } from './constants.mjs';
import { executeTypedOperationSequence, verifyRollbackRestoration } from './execution.mjs';
import { DEFAULT_REPO_ROOT } from './paths.mjs';
import { doesMatrixEntryMatchRuntimePath, getAjvValidator, isTrustedMockRuntimeFixture, normalizeUpstreamMatrixPath, qualifyUpstreamTool, resolveRuntimeGovernancePaths } from './qualification.mjs';
import { computeToolInventoryFingerprint, computeToolSchemaFingerprint } from './security.mjs';
import { discoverRuntimeSession } from './session.mjs';

/**
 * Controlled Upstream Runtime Qualification & Smoke Harness
 * Supports:
 * - Mode A: `offline_contract` (always runs in CI/repo/project-local mode; verifies real upstream tool contracts,
 *   schema fingerprints, unsafe tool blocking, and operation-to-tool mappings without claiming a live Blender connection).
 * - Mode B: `live_runtime` (requires explicit opt-in via `options.liveSmokeOptIn === true` or `BLENDOPS_LIVE_SMOKE_OPT_IN === '1'`;
 *   executes L0 read-only smoke or optional 6-gate disposable-scene L1 smoke).
 */
export function runRuntimeQualificationAndSmoke(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
  const registryDoc = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));
  const timestamp = options.timestamp || new Date().toISOString();

  const qualificationMode =
    options.mode === 'live_runtime' ? 'live_runtime' : 'offline_contract';
  const runtimePath = options.runtimePath || 'path-1-host-a';
  const matrixPath = normalizeUpstreamMatrixPath(runtimePath);
  const liveOptIn =
    options.liveSmokeOptIn === true ||
    process.env.BLENDOPS_LIVE_SMOKE_OPT_IN === '1';

  const runtimeClient = options.mockRuntime || options.liveTransportClient || null;
  const isMock = Boolean(options.mockRuntime?.isMockRuntime);
  const trustedMockFixture = isTrustedMockRuntimeFixture(
    runtimeClient,
    options.runtimeSession || null,
  );

  let session = null;
  let runtimeReachability = 'not_configured';
  let anySecretsRedacted = false;

  if (qualificationMode === 'live_runtime' && !liveOptIn) {
    session = discoverRuntimeSession({
      repoRoot,
      projectDir,
      runtimePath: 'none',
    });
    runtimeReachability = 'blocked_opt_in_missing';
  } else {
    session =
      options.runtimeSession ||
      discoverRuntimeSession({
        repoRoot,
        projectDir,
        runtimePath: runtimeClient ? runtimePath : options.runtimePath || 'none',
        mockRuntime: options.mockRuntime || null,
        liveTransportClient: options.liveTransportClient || null,
        endpoint: options.endpoint,
        allowRemoteEndpoint: options.allowRemoteEndpoint,
      });

    if (session.connection_status === 'connected' || session.connection_status === 'missing_required_tools') {
      runtimeReachability = 'reachable';
    } else if (session.connection_status === 'unreachable') {
      runtimeReachability = 'unreachable';
    } else if (session.connection_status === 'invalid_endpoint') {
      runtimeReachability = 'blocked_invalid_endpoint';
    } else if (session.connection_status === 'protocol_incompatible' || session.connection_status === 'invalid_tool_schema') {
      runtimeReachability = 'protocol_error';
    } else if (session.connection_status === 'identity_mismatch') {
      runtimeReachability = 'identity_mismatch';
    } else if (session.connection_status === 'version_unsupported') {
      runtimeReachability = 'version_unsupported';
    } else {
      runtimeReachability = 'not_configured';
    }
  }

  // Build upstream_tool_inventory from either the active runtime probe or the canonical audited matrix
  const runtimesMap = registryDoc.upstream_runtime_compatibility_matrix?.runtimes || {};
  const matrixCompat =
    runtimePath === 'path-2-community'
      ? runtimesMap['path-2-community-mcp-for-blender']
      : runtimesMap['path-1-official-blender-lab-mcp'];
  const canonicalMatrixTools = (registryDoc.upstream_tool_qualification_matrix || []).filter(
    (m) => doesMatrixEntryMatchRuntimePath(m, runtimePath === 'none' ? 'path-1-host-a' : runtimePath),
  );

  let rawProbeTools = null;
  if (runtimeClient && typeof runtimeClient.probeSession === 'function' && runtimeReachability === 'reachable') {
    try {
      const probe = runtimeClient.probeSession();
      rawProbeTools = Array.isArray(probe?.tools) ? probe.tools : [];
    } catch {
      rawProbeTools = [];
    }
  }

  const upstreamToolInventory = [];
  const unsafeToolInventory = [];

  if (rawProbeTools) {
    for (const rawTool of rawProbeTools) {
      const tName = rawTool?.name || rawTool?.tool_name || '';
      const q = qualifyUpstreamTool(rawTool, runtimePath, registryDoc, {
        strictSchemaFingerprint: options.strictSchemaFingerprint,
        trustedMockFixture,
      });
      const canonicalEntry = canonicalMatrixTools.find((m) => m.tool_name === tName);
      const inputSchema = rawTool?.inputSchema || rawTool?.input_schema || { type: 'object', properties: {} };
      const fp = q.actual_schema_fingerprint || computeToolSchemaFingerprint(tName, inputSchema);

      const item = {
        tool_name: tName,
        server_identity:
          session.addon_or_server_identity ||
          canonicalEntry?.server_identity ||
          matrixCompat?.server_package_name ||
          null,
        server_version:
          session.runtime_version ||
          canonicalEntry?.server_version ||
          matrixCompat?.server_version ||
          null,
        description:
          typeof rawTool?.description === 'string' && rawTool.description.trim()
            ? rawTool.description
            : canonicalEntry?.description || `MCP tool ${tName}`,
        input_schema: inputSchema,
        tool_schema_fingerprint: fp,
        output_shape_summary:
          canonicalEntry?.output_shape_summary || 'Structured JSON response payload.',
        side_effects:
          canonicalEntry?.side_effects ||
          (q.classification === 'unsafe_raw_code'
            ? 'arbitrary_code_execution'
            : q.classification === 'read_only_only'
              ? 'none'
              : q.classification === 'safe_direct' || q.classification === 'conditional'
                ? q.capability_tier === 'L2'
                  ? 'file_write'
                  : 'scene_mutation'
                : 'unknown_side_effects'),
        required_capability_tier: q.capability_tier,
        executes_arbitrary_code: q.classification === 'unsafe_raw_code',
        modifies_scene_state:
          canonicalEntry?.modifies_scene_state ??
          (q.classification === 'unsafe_raw_code' || q.capability_tier === 'L1'),
        reads_files: canonicalEntry?.reads_files ?? true,
        writes_files:
          canonicalEntry?.writes_files ??
          (q.classification === 'unsafe_raw_code' || q.capability_tier === 'L2'),
        accesses_external_services:
          canonicalEntry?.accesses_external_services ?? (q.classification === 'unsafe_raw_code'),
        bounded_and_independently_verifiable:
          canonicalEntry?.bounded_and_independently_verifiable ?? q.allowed_in_governed_execution,
        classification: q.classification,
        schema_drift_detected: q.schema_drift_detected,
        description_injection_detected: q.description_injection_detected,
        requalification_required: q.requalification_required,
        qualification_rationale: q.rationale,
      };
      upstreamToolInventory.push(item);

      if (
        q.classification === 'unsafe_raw_code' ||
        q.classification === 'unsupported' ||
        q.classification === 'unknown'
      ) {
        unsafeToolInventory.push({
          tool_name: tName,
          classification: q.classification,
          executes_arbitrary_code: q.classification === 'unsafe_raw_code',
          blocking_reason: q.rationale,
        });
      }
    }
  } else {
    for (const m of canonicalMatrixTools) {
      const mRationale = m.qualification_rationale || m.rationale || `Audited upstream tool ${m.tool_name}.`;
      upstreamToolInventory.push({
        tool_name: m.tool_name,
        server_identity: m.server_identity,
        server_version: m.server_version,
        description: m.description,
        input_schema: m.input_schema,
        tool_schema_fingerprint: m.tool_schema_fingerprint,
        output_shape_summary: m.output_shape_summary,
        side_effects: m.side_effects,
        required_capability_tier: m.required_capability_tier || m.capability_tier,
        executes_arbitrary_code: m.executes_arbitrary_code,
        modifies_scene_state: m.modifies_scene_state,
        reads_files: m.reads_files,
        writes_files: m.writes_files,
        accesses_external_services: m.accesses_external_services,
        bounded_and_independently_verifiable: m.bounded_and_independently_verifiable,
        classification: m.classification,
        schema_drift_detected: false,
        description_injection_detected: false,
        requalification_required: false,
        qualification_rationale: mRationale,
      });

      if (
        m.classification === 'unsafe_raw_code' ||
        m.classification === 'unsupported' ||
        m.classification === 'unknown'
      ) {
        unsafeToolInventory.push({
          tool_name: m.tool_name,
          classification: m.classification,
          executes_arbitrary_code: m.executes_arbitrary_code,
          blocking_reason: mRationale,
        });
      }
    }
  }

  const toolInventoryFingerprint =
    upstreamToolInventory.length > 0
      ? computeToolInventoryFingerprint(
          upstreamToolInventory.map((t) => ({
            name: t.tool_name,
            inputSchema: t.input_schema,
          })),
        )
      : null;

  // Build operation_to_tool_mappings for all 18 canonical operations + 3 permanently blocked L3 interfaces
  const effectivePathForMappings =
    runtimePath === 'none' ? 'path-1-host-a' : runtimePath;
  const operationToToolMappings = [];
  const qualifiedReadOnlyOps = [];
  const qualifiedMutationOps = [];
  const qualifiedExportImportOps = [];
  const blockedOps = [];

  for (const op of registryDoc.operations || []) {
    const m =
      op.runtime_tool_mappings?.[effectivePathForMappings] ||
      op.runtime_tool_mappings?.['path-1-host-a'];
    const reqArgs = Array.isArray(op.input_schema?.required) ? op.input_schema.required : [];
    const preconds = (op.required_preconditions || []).map(
      (p) => `${p.check_id}: ${p.description}`,
    );
    const postconds = (op.required_postconditions || []).map(
      (p) => `${p.check_id}: ${p.description}`,
    );

    let qualStatus = m?.upstream_qualification_status || 'blocked_runtime_unqualified';
    if (
      session.qualification_states?.read_only_qualified &&
      op.required_capability_tier === 'L0' &&
      session.supported_operations.includes(op.operation_id)
    ) {
      qualStatus = 'qualified_read_only';
    } else if (
      session.qualification_states?.mutation_qualified &&
      op.required_capability_tier === 'L1' &&
      session.supported_operations.includes(op.operation_id)
    ) {
      qualStatus = 'qualified_safe_direct';
    } else if (
      session.qualification_states?.export_import_qualified &&
      op.required_capability_tier === 'L2' &&
      session.supported_operations.includes(op.operation_id)
    ) {
      qualStatus = 'qualified_safe_direct';
    } else if (session.mcp_protocol_info?.schema_drift_detected) {
      qualStatus = 'blocked_schema_drift';
    }

    if (qualStatus === 'qualified_read_only') {
      qualifiedReadOnlyOps.push(op.operation_id);
    } else if (qualStatus === 'qualified_safe_direct' && op.required_capability_tier === 'L1') {
      qualifiedMutationOps.push(op.operation_id);
    } else if (qualStatus === 'qualified_safe_direct' && op.required_capability_tier === 'L2') {
      qualifiedExportImportOps.push(op.operation_id);
    } else {
      blockedOps.push(op.operation_id);
    }

    operationToToolMappings.push({
      operation_id: op.operation_id,
      required_capability_tier: op.required_capability_tier,
      runtime_path: effectivePathForMappings,
      exact_upstream_mcp_tool_name: m?.upstream_mcp_tool_name ?? null,
      tool_schema_fingerprint: m?.tool_schema_fingerprint ?? null,
      required_arguments: reqArgs,
      expected_side_effects:
        op.behavior === 'read_only'
          ? 'none (strictly read-only inspection)'
          : op.required_capability_tier === 'L1'
            ? 'bounded reversible scene datablock mutation after verified .blend checkpoint'
            : 'bounded artifact file write or license-cleared asset import',
      required_preconditions: preconds,
      required_postconditions: postconds,
      readback_strategy: `Independent L0 readback via ${(m?.readback_tools || []).join(', ') || 'none'}`,
      checkpoint_requirement: op.backup_requirement,
      rollback_strategy:
        m?.rollback_strategy ||
        'Not required for L0 read-only operations.',
      qualification_status: qualStatus,
      evidence_supporting_decision:
        m?.qualification_evidence ||
        'Audited against upstream MCP source code and tool qualification matrix.',
    });
  }

  const permanentlyBlockedL3Interfaces = (registryDoc.blocked_arbitrary_interfaces || []).map(
    (b) => b.interface_id || b.interface_name,
  );
  for (const b of registryDoc.blocked_arbitrary_interfaces || []) {
    const ifaceId = b.interface_id || b.interface_name;
    operationToToolMappings.push({
      operation_id: `blocked.l3.${ifaceId}`,
      required_capability_tier: 'L3',
      runtime_path: effectivePathForMappings,
      exact_upstream_mcp_tool_name: ifaceId,
      tool_schema_fingerprint: null,
      required_arguments: ['code'],
      expected_side_effects: 'unrestricted arbitrary Python execution inside Blender',
      required_preconditions: ['none (permanently blocked)'],
      required_postconditions: ['none (permanently blocked)'],
      readback_strategy: 'none — permanently blocked by laws/no-arbitrary-python-interface.md',
      checkpoint_requirement: 'none',
      rollback_strategy: 'none — execution prevented at MCP adapter security boundary',
      qualification_status: 'permanently_blocked_l3',
      evidence_supporting_decision: b.reason,
    });
  }

  // Execute smoke operations if connected or if live_runtime / mock smoke is requested
  const executedSmokeOperations = [];
  const readbackToolNames = [];
  let independentReadbackPerformed = false;
  let independentReadbackVerified = false;
  let checkpointDetails = null;
  let postconditionVerification = {
    checked: false,
    passed: false,
    details: 'No smoke operations executed.',
  };
  let rollbackVerification = {
    triggered: false,
    status: 'not_needed',
    details: 'No mutation smoke operations executed.',
  };

  const canRunSmoke =
    Boolean(runtimeClient) &&
    session.connection_status === 'connected' &&
    (qualificationMode === 'offline_contract' || liveOptIn);

  if (canRunSmoke && session.qualification_states.read_only_qualified) {
    const l0SmokeSteps = [
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
      {
        operation_id: 'op.inspect.camera-and-lighting',
        skill_id: 'blendops-camera',
        input: { camera_name: 'Camera', light_names: ['KeyLight'] },
      },
    ].filter((s) => session.supported_operations.includes(s.operation_id));

    if (l0SmokeSteps.length > 0) {
      const smokeSeq = executeTypedOperationSequence({
        repoRoot,
        projectDir,
        runtimeSession: session,
        runtimePath: session.runtime_path,
        mockRuntime: options.mockRuntime || null,
        liveTransportClient: options.liveTransportClient || null,
        grantedTier: 'L0',
        operations: l0SmokeSteps,
      });

      if (smokeSeq.ledger.secrets_redacted) anySecretsRedacted = true;
      for (const att of smokeSeq.ledger.operation_attempts) {
        executedSmokeOperations.push({
          operation_id: att.operation_id,
          mapped_tool_name: att.mapped_tool_name,
          tier: att.required_capability,
          status:
            att.status === 'committed'
              ? 'succeeded'
              : att.status === 'blocked'
                ? 'blocked'
                : 'failed',
          independent_readback_verified: Boolean(att.postcondition_result?.verified),
        });
        if (att.mapped_tool_name && !readbackToolNames.includes(att.mapped_tool_name)) {
          readbackToolNames.push(att.mapped_tool_name);
        }
      }

      independentReadbackPerformed = executedSmokeOperations.length > 0;
      independentReadbackVerified =
        executedSmokeOperations.length > 0 &&
        executedSmokeOperations.every((s) => s.independent_readback_verified);
      postconditionVerification = {
        checked: true,
        passed: independentReadbackVerified,
        details: `Verified ${executedSmokeOperations.length} read-only (L0) smoke operation(s) with zero mutations.`,
      };
    }

    // Optional L1 disposable-scene smoke test — requires 6 strict gates:
    // 1. liveSmokeOptIn === true
    // 2. options.disposableSceneConfirmed === true
    // 3. options.includeL1Smoke === true
    // 4. session.qualification_states.mutation_qualified === true (never via execute_blender_code!)
    // 5. Verified pre-mutation .blend checkpoint on disk
    // 6. Verified 7-check rollback/restore to baseline
    if (options.includeL1Smoke) {
      if (!liveOptIn || !options.disposableSceneConfirmed || !session.qualification_states.mutation_qualified) {
        executedSmokeOperations.push({
          operation_id: 'op.mutate.camera-transform-and-lens',
          mapped_tool_name: null,
          tier: 'L1',
          status: 'blocked',
          independent_readback_verified: false,
        });
        postconditionVerification = {
          checked: true,
          passed: false,
          details:
            'L1 disposable-scene mutation smoke was blocked: requires explicit liveSmokeOptIn, disposableSceneConfirmed, and a mutation-qualified runtime without execute_blender_code.',
        };
      } else {
        // Capture pre-mutation baseline scene snapshot for 7-check rollback verification
        let smokeBaselineSnapshot = null;
        try {
          const baseReadTool = session.runtime_path.startsWith('path-1')
            ? 'get_objects_summary'
            : 'get_scene_info';
          const baseRead = runtimeClient.invokeTool(baseReadTool, {});
          if (baseRead?.status === 'ok' && baseRead?.data) {
            smokeBaselineSnapshot = structuredClone(baseRead.data);
          }
        } catch {
          smokeBaselineSnapshot = null;
        }

        const l1Seq = executeTypedOperationSequence({
          repoRoot,
          projectDir,
          runtimeSession: session,
          runtimePath: session.runtime_path,
          mockRuntime: options.mockRuntime || null,
          liveTransportClient: options.liveTransportClient || null,
          sourceBlendPath: options.sourceBlendPath || runtimeClient?.blendFilePath,
          grantedTier: 'L1',
          operations: [
            {
              operation_id: 'op.mutate.camera-transform-and-lens',
              skill_id: 'blendops-camera',
              input: {
                camera_name: 'Camera',
                location: [0.1, -2.5, 0.5],
                rotation_euler_deg: [80.0, 0.0, 2.0],
                focal_length_mm: 85,
                dof_enabled: true,
                f_stop: 2.8,
              },
            },
          ],
        });

        if (l1Seq.ledger.checkpoint_record) {
          checkpointDetails = {
            required: true,
            verified_on_disk: Boolean(l1Seq.ledger.checkpoint_record.verifiedOnDisk),
            source_blend_path: l1Seq.ledger.checkpoint_record.sourceBlendPath,
            backup_path: l1Seq.ledger.checkpoint_record.backupPath,
            sha256: l1Seq.ledger.checkpoint_record.sha256,
          };
        }

        // Immediately restore disposable scene from verified checkpoint and run 7-check verification!
        if (checkpointDetails?.verified_on_disk && typeof runtimeClient.restoreCheckpoint === 'function') {
          const rbCheck = verifyRollbackRestoration({
            checkpointRecord: l1Seq.ledger.checkpoint_record,
            baselineSceneSnapshot: smokeBaselineSnapshot,
            runtimeClient,
            session,
          });
          if (rbCheck.secretsRedacted) anySecretsRedacted = true;
          rollbackVerification = {
            triggered: true,
            status: rbCheck.status,
            details: rbCheck.details,
          };
        } else {
          rollbackVerification = {
            triggered: true,
            status: 'rollback_failed',
            details: 'Pre-mutation checkpoint was not verified on disk or restoreCheckpoint was unavailable.',
          };
        }

        for (const att of l1Seq.ledger.operation_attempts) {
          const rbOk = rollbackVerification.status === 'rollback_verified';
          executedSmokeOperations.push({
            operation_id: att.operation_id,
            mapped_tool_name: att.mapped_tool_name,
            tier: att.required_capability,
            status:
              att.status === 'committed' && rbOk
                ? 'succeeded'
                : att.status === 'blocked'
                  ? 'blocked'
                  : 'failed',
            independent_readback_verified:
              Boolean(att.postcondition_result?.verified) && rbOk,
          });
        }

        if (rollbackVerification.status !== 'rollback_verified') {
          postconditionVerification = {
            checked: true,
            passed: false,
            details: `L1 disposable-scene smoke rollback failed verification (${rollbackVerification.status}): ${rollbackVerification.details}`,
          };
        }
      }
    }
  }

  // Compute evidence_classification and truth_states honestly
  let evidenceClassification = 'contract_verified';
  let runtimeStatus = 'Not Run';
  let liveQualification = 'Not Run';

  if (qualificationMode === 'live_runtime' && !liveOptIn) {
    evidenceClassification = 'not_run';
    runtimeStatus = 'Not Run';
    liveQualification = 'Not Run';
  } else if (isMock) {
    evidenceClassification = executedSmokeOperations.length > 0 ? 'mock_verified' : 'contract_verified';
    runtimeStatus = executedSmokeOperations.length > 0 ? 'Attempted' : 'Not Run';
    liveQualification = 'Not Run';
  } else if (runtimeClient && session.connection_status === 'connected') {
    const anyL1Succeeded =
      executedSmokeOperations.some(
        (s) => s.tier === 'L1' && s.status === 'succeeded' && s.independent_readback_verified,
      ) && rollbackVerification.status === 'rollback_verified';
    const anyL0Succeeded = executedSmokeOperations.some(
      (s) => s.tier === 'L0' && s.status === 'succeeded' && s.independent_readback_verified,
    );
    if (anyL1Succeeded) {
      evidenceClassification = 'live_mutation_verified';
      runtimeStatus = 'Verified';
      liveQualification = 'Mutation Verified';
    } else if (anyL0Succeeded) {
      evidenceClassification = 'live_read_only_verified';
      runtimeStatus = 'Verified';
      liveQualification = 'Read-Only Verified';
    } else {
      evidenceClassification = 'live_discovered';
      runtimeStatus = 'Attempted';
      liveQualification = 'Discovered Only';
    }
  } else if (qualificationMode === 'live_runtime' && runtimeReachability !== 'reachable') {
    evidenceClassification = 'not_run';
    runtimeStatus = 'Not Run';
    liveQualification = 'Not Run';
  }

  const qualificationStates = {
    ...(session.qualification_states || {
      runtime_discovered: false,
      runtime_reachable: false,
      runtime_identity_verified: false,
      protocol_compatible: false,
      blender_version_compatible: false,
      tool_inventory_verified: true,
      read_only_qualified: true,
      mutation_qualified: false,
      export_import_qualified: false,
      live_runtime_verified: false,
    }),
    live_runtime_verified:
      !isMock &&
      (liveQualification === 'Read-Only Verified' || liveQualification === 'Mutation Verified'),
  };

  // In offline_contract mode without an active mock/live client, reflect the canonical upstream contract qualification
  let effectiveVerdict = session.qualification_verdict || 'unqualified';
  if (!runtimeClient && qualificationMode === 'offline_contract') {
    const hasDriftOrUnknown = upstreamToolInventory.some(
      (t) => t.schema_drift_detected || t.classification === 'unknown',
    );
    qualificationStates.tool_inventory_verified =
      upstreamToolInventory.length > 0 && !hasDriftOrUnknown;
    qualificationStates.read_only_qualified =
      qualificationStates.tool_inventory_verified && qualifiedReadOnlyOps.length > 0;
    qualificationStates.mutation_qualified =
      qualificationStates.tool_inventory_verified && qualifiedMutationOps.length > 0;
    qualificationStates.export_import_qualified =
      qualificationStates.tool_inventory_verified && qualifiedExportImportOps.length > 0;

    if (
      qualificationStates.read_only_qualified &&
      qualificationStates.mutation_qualified &&
      qualificationStates.export_import_qualified
    ) {
      effectiveVerdict = 'fully_governed_qualified';
    } else if (
      qualificationStates.read_only_qualified &&
      qualificationStates.export_import_qualified
    ) {
      effectiveVerdict = 'read_only_and_export_qualified';
    } else if (qualificationStates.read_only_qualified) {
      effectiveVerdict = 'read_only_qualified';
    } else {
      effectiveVerdict = 'unqualified';
    }
  }

  let connectionLifecycleState = session.connection_lifecycle_state || 'configured';
  if (qualificationStates.live_runtime_verified) {
    connectionLifecycleState = 'live_read_only_verified';
  } else if (
    !runtimeClient &&
    qualificationMode === 'offline_contract' &&
    qualificationStates.tool_inventory_verified
  ) {
    connectionLifecycleState = 'contract_qualified';
  }

  const knownLimitations = [...(session.known_limitations || [])];
  if (qualificationMode === 'live_runtime' && !liveOptIn) {
    knownLimitations.unshift(
      'Mode B (live_runtime) smoke execution requires explicit opt-in via --live-smoke-opt-in or BLENDOPS_LIVE_SMOKE_OPT_IN=1; failed closed without probing.',
    );
  }
  if (!qualificationStates.mutation_qualified) {
    knownLimitations.push(
      'Upstream MCP server exposes only unrestricted Python execution (execute_blender_code) for scene mutations; BlendOps refuses to translate L1 typed mutations into raw Python, keeping mutation_qualified=false.',
    );
  }
  if (matrixPath.startsWith('path-1') && !qualificationStates.export_import_qualified) {
    knownLimitations.push(
      'Official Blender Lab MCP render_viewport_to_path and render_thumbnail_to_path are classified as conditional due to open upstream issues #12 (missing output directory validation) and #70 (render_thumbnail_to_path overwrites scene render filepath/resolution/format).',
    );
  }
  if (knownLimitations.length === 0) {
    knownLimitations.push(
      'Offline contract qualification verified upstream tool schemas and safety boundaries; no live Blender process was executed.',
    );
  }

  const reportId = `qual.${runtimePath === 'none' ? 'unconfigured' : runtimePath}-${sha256Hex(`${timestamp}:${runtimePath}:${qualificationMode}`).slice(0, 10)}`;

  const reportObj = {
    $schema: '../schemas/runtime-qualification-report.schema.json',
    schema_version: '1.0.0',
    report_id: reportId,
    timestamp,
    qualification_mode: qualificationMode,
    evidence_classification: evidenceClassification,
    runtime_path: runtimePath,
    runtime_server_identity:
      session.addon_or_server_identity || matrixCompat?.server_package_name || null,
    server_version:
      session.runtime_version || matrixCompat?.server_version || null,
    blender_version: session.blender_version || null,
    addon_version: matrixCompat?.addon_version || null,
    mcp_protocol_version:
      session.mcp_protocol_info?.protocol_version ||
      matrixCompat?.mcp_sdk_dependency ||
      null,
    transport_type:
      isMock
        ? 'mock-in-memory'
        : session.mcp_protocol_info?.transport_type &&
            session.mcp_protocol_info.transport_type !== 'none'
          ? session.mcp_protocol_info.transport_type
          : runtimePath === 'path-1-host-b'
            ? 'streamable-http'
            : runtimePath === 'none'
              ? 'unconfigured'
              : 'stdio',
    runtime_reachability: runtimeReachability,
    connection_lifecycle_state: connectionLifecycleState,
    provenance_verification: session.provenance_verification || {
      identity_matched: qualificationStates.runtime_identity_verified,
      provenance_verified: false,
      source: isMock ? 'mock_fixture' : 'unverified',
      commit_or_digest: matrixCompat?.source_commit_sha || null,
      executable_sha256: null,
    },
    tool_list_changed_events: session.mcp_protocol_info?.tool_list_changed_count || 0,
    qualification_states: qualificationStates,
    qualification_verdict: effectiveVerdict,
    upstream_tool_inventory: upstreamToolInventory,
    tool_inventory_fingerprint: toolInventoryFingerprint,
    unsafe_tool_inventory: unsafeToolInventory,
    operation_to_tool_mappings: operationToToolMappings,
    qualification_results: {
      total_canonical_operations: (registryDoc.operations || []).length,
      qualified_read_only_operations: qualifiedReadOnlyOps,
      qualified_mutation_operations: qualifiedMutationOps,
      qualified_export_import_operations: qualifiedExportImportOps,
      blocked_operations: blockedOps,
      permanently_blocked_l3_interfaces: permanentlyBlockedL3Interfaces,
    },
    executed_smoke_operations: executedSmokeOperations,
    independent_readback_evidence: {
      performed: independentReadbackPerformed,
      verified: independentReadbackVerified,
      readback_tool_names: readbackToolNames,
      summary: independentReadbackPerformed
        ? `Executed ${executedSmokeOperations.length} smoke operation(s) via ${readbackToolNames.join(', ')}.`
        : 'No live or mock smoke operations were executed during this qualification run.',
    },
    checkpoint_details: checkpointDetails,
    postcondition_verification: postconditionVerification,
    rollback_verification: rollbackVerification,
    secrets_redacted: anySecretsRedacted,
    truth_states: {
      runtime_status: runtimeStatus,
      artifact_status: 'Not Produced',
      live_qualification: liveQualification,
      is_mock_runtime: isMock,
    },
    known_limitations: knownLimitations,
  };

  const validateReport = getAjvValidator(paths.runtimeQualificationReportSchemaPath);
  if (!validateReport(reportObj)) {
    const errs = (validateReport.errors || []).map(
      (e) => `${e.instancePath || '/'} ${e.message}`,
    );
    throw new Error(
      `Runtime qualification report failed schema validation: ${errs.join('; ')}`,
    );
  }

  return reportObj;
}
/**
 * Real Asynchronous MCP Client & Transport Lifecycle
 * Uses the official `@modelcontextprotocol/sdk` (`Client`, `StdioClientTransport`, `StreamableHTTPClientTransport`)
 * to connect to real STDIO or Streamable HTTP MCP servers with:
 * - Strict STDIO command/arg/cwd validation (`validateStdioCommandConfig`) and sanitized environment
 * - Strict loopback-only Streamable HTTP validation (`validateRuntimeTransportEndpoint`) unless HTTPS remote opt-in
 * - 7-state connection lifecycle progression (`configured` -> `transport_connected` -> `initialized` ->
 *   `protocol_negotiated` -> `tools_discovered` -> `contract_qualified` -> `live_read_only_verified`)
 * - Bounded `tools/list` pagination (max pages, max total tools, max payload size)
 * - `notifications/tools/list_changed` subscription that immediately marks qualification stale until re-qualified
 * - Deterministic subprocess / transport cleanup on timeout or initialization error
 */
export function withAsyncTimeout(promise, timeoutMs, timeoutMessage) {
  let timer = null;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(timeoutMessage);
      err.code = 'ETIMEDOUT';
      reject(err);
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
