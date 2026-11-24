// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import fs from 'node:fs';
import path from 'node:path';
import { isVersionAtLeast } from '../validate-evidence-packet.mjs';
import { RECOGNIZED_RUNTIME_PATHS, sha256Hex } from './constants.mjs';
import { DEFAULT_REPO_ROOT } from './paths.mjs';
import { TRUSTED_MOCK_FIXTURE_TOKEN, TRUSTED_MOCK_SESSION_INSTANCES, evaluateRuntimeProvenance, getAjvValidator, isTrustedMockRuntimeFixture, negotiateMcpProtocolCompatibility, qualifyUpstreamTool, resolveRuntimeGovernancePaths } from './qualification.mjs';
import { computeToolInventoryFingerprint, inspectJsonSchemaSafety, validateRuntimeTransportEndpoint } from './security.mjs';

/**
 * Discovers runtime session state, performs MCP protocol/identity/schema qualification,
 * and computes the 10-state qualification model.
 * Never claims an active connection when only inspecting a config file or when no runtime responds.
 * Never executes Blender mutations during discovery.
 */
export function discoverRuntimeSession(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
  const registryDoc = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));
  const allOperations = registryDoc.operations || [];

  // Check optional project-local or explicit runtime config file
  let configData = null;
  const candidateConfigPath =
    options.configPath ||
    (projectDir
      ? path.join(path.resolve(projectDir), '.blendops', 'runtime-config.json')
      : null);
  if (candidateConfigPath && fs.existsSync(candidateConfigPath)) {
    try {
      configData = JSON.parse(fs.readFileSync(candidateConfigPath, 'utf8'));
    } catch {
      configData = { invalidJson: true, path: candidateConfigPath };
    }
  }

  const requestedPath =
    options.runtimePath ||
    options.mockRuntime?.runtimePath ||
    configData?.runtime_path ||
    'none';

  const timestamp = options.timestamp || new Date().toISOString();
  const sessionId =
    options.sessionId ||
    `session.${requestedPath === 'none' ? 'unconfigured' : requestedPath}-${sha256Hex(`${requestedPath}:${timestamp}`).slice(0, 8)}`;

  // 1. Unknown runtime path rejection
  if (requestedPath !== 'none' && !RECOGNIZED_RUNTIME_PATHS[requestedPath]) {
    throw new Error(
      `Unsupported or unrecognized runtime path '${requestedPath}'. Recognized paths: ${Object.keys(RECOGNIZED_RUNTIME_PATHS).join(', ')}.`,
    );
  }

  const pathSpec = RECOGNIZED_RUNTIME_PATHS[requestedPath] || null;
  const executionPlan = options.executionPlan || null;

  // Validate transport endpoint if supplied via options or config file
  const configuredEndpoint = options.endpoint ?? configData?.endpoint ?? null;
  let endpointValidationError = null;
  if (configuredEndpoint !== null && configuredEndpoint !== undefined) {
    const epVal = validateRuntimeTransportEndpoint(configuredEndpoint, {
      allowRemoteEndpoint: Boolean(options.allowRemoteEndpoint),
    });
    if (!epVal.valid) {
      endpointValidationError = epVal.reason;
    }
  }

  // 2. If no mockRuntime or liveTransportClient is supplied, never pretend a live runtime is connected!
  const runtimeClient = options.mockRuntime || options.liveTransportClient || null;

  let connectionStatus = 'not_configured';
  let connectionLifecycleState = 'configured';
  let hostIdentity = null;
  let addonOrServerIdentity = null;
  let blenderVersion = null;
  let runtimeVersion = null;
  let discoveryMode = 'unconfigured';
  let singleBridgeVerified = true;
  let backupSupported = false;
  let restoreSupported = false;
  const availableToolManifest = [];
  const supportedOperations = [];
  const rejectedOrAmbiguousTools = [];
  const knownLimitations = [];

  let runtimeDiscovered = false;
  let runtimeReachable = false;
  let runtimeIdentityVerified = false;
  let protocolCompatible = false;
  let blenderVersionCompatible = false;
  let toolInventoryVerified = false;
  let anySchemaDrift = false;
  let driftSeverity = 'none';
  let anyRequalificationRequired = false;
  let toolInventoryFingerprint = null;
  let conditionalExportAvailable = false;
  let probeSnapshot = null;
  let mcpProtocolInfo = {
    protocol_version: null,
    transport_type: 'none',
    session_id_header_used: false,
    server_name: null,
    server_version: null,
    addon_version: null,
    tool_list_changed_supported: false,
    tool_list_changed_events_received: 0,
    drift_severity: 'none',
    schema_drift_detected: false,
    requalification_required: false,
    tool_inventory_fingerprint: null,
  };

  if (endpointValidationError) {
    connectionStatus = 'invalid_endpoint';
    connectionLifecycleState = 'configured';
    discoveryMode = 'config_file_inspection_only';
    knownLimitations.push(endpointValidationError);
  } else if (!runtimeClient) {
    if (options.hostCapabilityContext) {
      connectionStatus = 'host_context_only';
      connectionLifecycleState = 'configured';
      discoveryMode = 'host_capability_context';
      hostIdentity = options.hostCapabilityContext.hostIdentity || 'MCP Host (Capability Context Only)';
      knownLimitations.push(
        'Host does not expose direct runtime discovery to BlendOps CLI; using host-provided capability context without claiming an active Blender connection.',
      );
    } else if (configData || requestedPath !== 'none') {
      runtimeDiscovered = true;
      connectionStatus = 'configured_unreachable';
      connectionLifecycleState = 'configured';
      discoveryMode = 'config_file_inspection_only';
      hostIdentity = configData?.host_identity || null;
      knownLimitations.push(
        'Runtime configuration was inspected on disk, but no live Blender MCP transport responded. Inspecting a config file never reports a connected runtime.',
      );
    } else {
      connectionStatus = 'not_configured';
      connectionLifecycleState = 'configured';
      discoveryMode = 'unconfigured';
      knownLimitations.push(
        'No external Blender MCP runtime is configured or connected in this environment (Runtime status: Not Run).',
      );
    }
  } else {
    runtimeDiscovered = true;
    discoveryMode = runtimeClient.isMockRuntime
      ? 'mock_mcp_transport_probe'
      : 'live_mcp_transport_probe';
    const probe = runtimeClient.probeSession();
    probeSnapshot = probe;

    const isStaleProbe =
      probe.stale === true ||
      (typeof probe.lastHeartbeatMs === 'number' &&
        typeof probe.sessionTtlMs === 'number' &&
        Date.now() - probe.lastHeartbeatMs > probe.sessionTtlMs);

    if (probe.hostContextOnly) {
      runtimeDiscovered = false;
      connectionStatus = 'host_context_only';
      connectionLifecycleState = 'configured';
      discoveryMode = 'host_capability_context';
      hostIdentity = probe.hostIdentity || 'MCP Host (Context Only)';
      if (probe.knownLimitation) knownLimitations.push(probe.knownLimitation);
    } else if (!probe.reachable) {
      connectionStatus = 'configured_unreachable';
      connectionLifecycleState = 'configured';
      knownLimitations.push(
        probe.error || 'Configured MCP transport endpoint is unreachable.',
      );
    } else if (isStaleProbe) {
      runtimeReachable = true;
      connectionStatus = 'stale_session';
      connectionLifecycleState = 'transport_connected';
      hostIdentity = probe.hostIdentity || null;
      addonOrServerIdentity = probe.addonOrServerIdentity || null;
      blenderVersion = probe.blenderVersion || null;
      runtimeVersion = probe.runtimeVersion || null;
      knownLimitations.push(
        'Runtime session is stale or its heartbeat TTL expired; failing closed until a fresh session probe succeeds.',
      );
    } else {
      runtimeReachable = true;
      connectionLifecycleState = 'initialized';
      hostIdentity = probe.hostIdentity || null;
      addonOrServerIdentity = probe.addonOrServerIdentity || null;
      blenderVersion = probe.blenderVersion || null;
      runtimeVersion = probe.runtimeVersion || null;
      singleBridgeVerified = probe.singleBridgeVerified !== false;
      backupSupported = Boolean(probe.backupSupported);
      restoreSupported = Boolean(probe.restoreSupported);

      const protoNeg = negotiateMcpProtocolCompatibility(probe, requestedPath);
      protocolCompatible = protoNeg.protocolCompatible;
      runtimeIdentityVerified = protoNeg.identityVerified;
      if (protocolCompatible) {
        connectionLifecycleState = 'protocol_negotiated';
      }

      const rawTools = Array.isArray(probe.tools) ? probe.tools : [];
      if (protocolCompatible && rawTools.length > 0) {
        connectionLifecycleState = 'tools_discovered';
      }
      toolInventoryFingerprint = computeToolInventoryFingerprint(rawTools);
      const observedAllowedToolNames = new Set();
      let hasInvalidSchema = false;
      let hasBridgeConflict = !singleBridgeVerified;
      let hasSpoofedOrInjectedTool = false;

      // Detect duplicate tool names in rawTools
      const seenRawToolNames = new Set();
      for (const t of rawTools) {
        if (!t || typeof t.name !== 'string' || t.name.trim().length === 0) {
          hasInvalidSchema = true;
          rejectedOrAmbiguousTools.push({
            tool_name: String(t?.name || 'unknown'),
            reason: 'Malformed tool entry missing valid tool name',
          });
          continue;
        }
        const toolName = t.name.trim();
        if (seenRawToolNames.has(toolName)) {
          hasInvalidSchema = true;
          anySchemaDrift = true;
          driftSeverity = 'breaking_contract_drift';
          anyRequalificationRequired = true;
          rejectedOrAmbiguousTools.push({
            tool_name: toolName,
            reason: `Duplicate tool definition '${toolName}' advertised in MCP tools/list response`,
          });
          continue;
        }
        seenRawToolNames.add(toolName);

        if (pathSpec && pathSpec.exclusiveOpponentTools.has(toolName)) {
          hasBridgeConflict = true;
          rejectedOrAmbiguousTools.push({
            tool_name: toolName,
            reason: `Tool '${toolName}' belongs to a conflicting MCP bridge surface for ${requestedPath} (single-bridge violation)`,
          });
          continue;
        }

        const safetyCheck = inspectJsonSchemaSafety(t.inputSchema);
        if (!safetyCheck.valid) {
          hasInvalidSchema = true;
          rejectedOrAmbiguousTools.push({
            tool_name: toolName,
            reason: safetyCheck.reason || 'Tool inputSchema is missing or not a valid JSON Schema object',
          });
          continue;
        }

        const qualified = qualifyUpstreamTool(t, requestedPath, registryDoc, {
          ...options,
          trustedMockRuntime: isTrustedMockRuntimeFixture(options.mockRuntime) ? options.mockRuntime : null,
          isLiveRuntime: Boolean(options.liveTransportClient || runtimeClient?.isLiveMcpClient || !runtimeClient?.isMockRuntime),
        });
        if (qualified.schema_drift_detected) {
          anySchemaDrift = true;
          driftSeverity = 'breaking_contract_drift';
        } else if (qualified.drift_severity === 'metadata_only' && driftSeverity === 'none') {
          driftSeverity = 'metadata_only';
        }
        if (qualified.requalification_required) {
          anyRequalificationRequired = true;
        }
        if (qualified.spoofed_safe_tool_name || qualified.description_injection_detected) {
          hasSpoofedOrInjectedTool = true;
        }
        if (qualified.classification === 'conditional' && !qualified.schema_drift_detected) {
          conditionalExportAvailable = true;
        }

        if (!qualified.allowed_in_governed_execution) {
          rejectedOrAmbiguousTools.push({
            tool_name: toolName,
            reason: qualified.rationale,
          });
          continue;
        }

        observedAllowedToolNames.add(toolName);
        availableToolManifest.push({
          tool_name: toolName,
          title: t.title || null,
          description: t.description || `MCP tool ${toolName}`,
          schema_valid: true,
          input_schema: t.inputSchema,
          output_schema: t.outputSchema || t.output_schema || null,
          annotations: t.annotations || null,
          icons: Array.isArray(t.icons) ? t.icons : null,
          execution_metadata: t.execution || t.execution_metadata || null,
          contract_fingerprints: qualified.contract_fingerprints || null,
          mapped_operation_ids: qualified.mapped_operation_ids,
        });
      }

      mcpProtocolInfo = {
        protocol_version: protoNeg.protocolVersion,
        transport_type: protoNeg.transportType,
        session_id_header_used: protoNeg.sessionIdHeaderUsed,
        server_name: protoNeg.serverName,
        server_version: protoNeg.serverVersion,
        addon_version: probe.addonVersion ?? null,
        tool_list_changed_supported: Boolean(probe.toolListChangedSupported),
        tool_list_changed_events_received:
          typeof probe.toolListChangedEventsReceived === 'number'
            ? probe.toolListChangedEventsReceived
            : 0,
        drift_severity: driftSeverity,
        schema_drift_detected: anySchemaDrift,
        requalification_required: anyRequalificationRequired,
        tool_inventory_fingerprint: toolInventoryFingerprint,
      };

      // Check version compatibility
      blenderVersionCompatible =
        Boolean(blenderVersion) &&
        Boolean(pathSpec) &&
        isVersionAtLeast(blenderVersion, pathSpec.minBlenderTuple);

      // Check required read-only tools against allowed/qualified tools
      const missingRequiredReadOnly = (pathSpec?.requiredReadOnlyTools || []).filter(
        (reqTool) => !observedAllowedToolNames.has(reqTool),
      );

      if (!protocolCompatible) {
        connectionStatus = 'protocol_incompatible';
        knownLimitations.push(
          protoNeg.blockingReason || 'MCP protocol negotiation failed; runtime protocol is incompatible.',
        );
      } else if (!runtimeIdentityVerified) {
        connectionStatus = 'identity_mismatch';
        knownLimitations.push(
          protoNeg.blockingReason || 'MCP server/add-on identity does not match selected runtime path.',
        );
      } else if (hasBridgeConflict) {
        connectionStatus = 'bridge_conflict';
        knownLimitations.push(
          'Single-bridge conflict detected: Path 1 (Lab MCP) and Path 2 (mcp-for-blender) tools or multiple hosts are active on the same Blender instance.',
        );
      } else if (hasInvalidSchema || hasSpoofedOrInjectedTool || anySchemaDrift) {
        connectionStatus = 'invalid_tool_schema';
        if (anySchemaDrift) {
          knownLimitations.push(
            'Upstream tool schema drift detected against audited SHA-256 schema fingerprint; requalification_required before execution.',
          );
        }
        if (hasSpoofedOrInjectedTool) {
          knownLimitations.push(
            'Security boundary blocked spoofed safe tool name or tool description prompt/command injection.',
          );
        }
        if (hasInvalidSchema) {
          knownLimitations.push(
            'One or more tools advertised by the MCP runtime had invalid or corrupt input schemas; failing closed.',
          );
        }
      } else if (!blenderVersionCompatible) {
        connectionStatus = 'version_unsupported';
        knownLimitations.push(
          `Blender version '${blenderVersion || 'unknown'}' does not satisfy ${requestedPath} floor (${pathSpec?.minBlenderString || '5.1.0'}).`,
        );
      } else if (missingRequiredReadOnly.length > 0) {
        connectionStatus = 'missing_required_tools';
        knownLimitations.push(
          `Connected runtime is missing required read-only inspection tools for ${requestedPath}: ${missingRequiredReadOnly.join(', ')}.`,
        );
      } else {
        toolInventoryVerified = true;
        connectionStatus = 'connected';
        connectionLifecycleState =
          options.liveReadOnlyVerified === true
            ? 'live_read_only_verified'
            : 'contract_qualified';
        // Compute supported operations where primary_tool and all readback_tools are present in observedAllowedToolNames
        for (const op of allOperations) {
          if (!op.supported_runtime_paths.includes(requestedPath)) continue;
          const mapping = op.runtime_tool_mappings?.[requestedPath];
          if (!mapping) continue;
          const primaryAvailable = observedAllowedToolNames.has(mapping.primary_tool);
          const readbackAvailable = (mapping.readback_tools || []).every((rt) =>
            observedAllowedToolNames.has(rt),
          );
          if (primaryAvailable && readbackAvailable) {
            if (op.behavior === 'mutating' && !backupSupported) {
              continue;
            }
            supportedOperations.push(op.operation_id);
          }
        }
      }
    }
  }

  const readOnlyAvailable =
    connectionStatus === 'connected' &&
    supportedOperations.some((id) => id.startsWith('op.inspect.'));
  const mutationAvailable =
    connectionStatus === 'connected' &&
    backupSupported &&
    supportedOperations.some((id) => id.startsWith('op.mutate.'));
  const exportAvailable =
    connectionStatus === 'connected' &&
    backupSupported &&
    supportedOperations.some((id) => id.startsWith('op.export.'));
  const liveRuntimeVerified =
    connectionStatus === 'connected' &&
    !runtimeClient?.isMockRuntime &&
    Boolean(options.liveReadOnlyVerified);

  let planCompatible = true;
  if (executionPlan) {
    if (executionPlan.status === 'blocked' || executionPlan.can_proceed_to_runtime === false) {
      planCompatible = false;
      if (connectionStatus === 'connected') {
        connectionStatus = 'incompatible_with_plan';
      }
      knownLimitations.push(
        `ExecutionPlan '${executionPlan.plan_id}' is blocked or not runtime-executable (status='${executionPlan.status}', can_proceed_to_runtime=${executionPlan.can_proceed_to_runtime}) and cannot proceed to runtime.`,
      );
    } else if (connectionStatus === 'connected') {
      const requiresMutation = Boolean(options.requireMutationCapability) && !mutationAvailable;
      if (requiresMutation) {
        planCompatible = false;
        connectionStatus = 'incompatible_with_plan';
        knownLimitations.push(
          'Connected runtime supports read-only inspection (L0) only, but the requested execution flow requires bounded scene mutation (L1) and verified backup support.',
        );
      }
    } else {
      planCompatible = false;
    }
  }

  let negotiatedTier = 'L0';
  if (connectionStatus === 'connected') {
    if (exportAvailable) {
      negotiatedTier = 'L2';
    } else if (mutationAvailable) {
      negotiatedTier = 'L1';
    } else {
      negotiatedTier = 'L0';
    }
  }

  let qualificationVerdict = 'unqualified';
  if (connectionStatus === 'connected') {
    if (readOnlyAvailable && mutationAvailable && exportAvailable) {
      qualificationVerdict = 'fully_qualified';
    } else if (readOnlyAvailable && mutationAvailable) {
      qualificationVerdict = 'read_only_and_mutation_qualified';
    } else if (readOnlyAvailable && exportAvailable) {
      qualificationVerdict = 'read_only_and_export_qualified';
    } else if (readOnlyAvailable) {
      qualificationVerdict = 'read_only_qualified';
    } else {
      qualificationVerdict = 'connected_unqualified';
    }
  } else if (runtimeReachable) {
    qualificationVerdict = 'connected_unqualified';
  }

  if (knownLimitations.length === 0) {
    if (runtimeClient?.isUpstreamRealitySimulation && !mutationAvailable) {
      knownLimitations.push(
        `Real upstream ${requestedPath} exposes raw Python execution (execute_blender_code) rather than bounded L1 mutation tools; qualified as read_only_qualified (L0=${readOnlyAvailable}, L1=${mutationAvailable}).`,
      );
    } else {
      knownLimitations.push(
        runtimeClient?.isMockRuntime
          ? 'Session negotiated against deterministic mock MCP runtime; does not constitute live Blender execution evidence.'
          : 'Session negotiated for read-only (L0) and bounded reversible (L1) operations; L3 arbitrary Python execution remains permanently blocked.',
      );
    }
  }

  const provenanceDetails = evaluateRuntimeProvenance(probeSnapshot || {}, requestedPath, {
    toolInventoryVerified,
    schemaDriftDetected: anySchemaDrift,
    processProvenanceVerified: Boolean(
      probeSnapshot?.processProvenanceVerified || isTrustedMockRuntimeFixture(options.mockRuntime),
    ),
  });

  const session = {
    $schema: '../schemas/runtime-session.schema.json',
    schema_version: '1.0.0',
    session_id: sessionId,
    runtime_path: requestedPath,
    host_identity: hostIdentity,
    addon_or_server_identity: addonOrServerIdentity,
    blender_version: blenderVersion,
    runtime_version: runtimeVersion,
    connection_status: connectionStatus,
    connection_lifecycle_state: connectionLifecycleState,
    readiness_flags: {
      read_only_available: readOnlyAvailable,
      mutation_available: mutationAvailable,
      export_available: exportAvailable,
      conditional_export_available: conditionalExportAvailable,
      backup_supported: backupSupported,
      restore_supported: restoreSupported,
      plan_compatible: planCompatible,
      live_runtime_verified: liveRuntimeVerified,
    },
    qualification_states: {
      runtime_discovered: runtimeDiscovered,
      runtime_reachable: runtimeReachable,
      runtime_identity_verified: runtimeIdentityVerified,
      protocol_compatible: protocolCompatible,
      blender_version_compatible: blenderVersionCompatible,
      tool_inventory_verified: toolInventoryVerified,
      read_only_qualified: readOnlyAvailable,
      mutation_qualified: mutationAvailable,
      export_import_qualified: exportAvailable,
      live_runtime_verified: liveRuntimeVerified,
    },
    qualification_verdict: qualificationVerdict,
    mcp_protocol_info: mcpProtocolInfo,
    negotiated_capability_tier: negotiatedTier,
    governed_runtime_ceiling: options.governedRuntimeCeiling || 'L1',
    available_tool_manifest: availableToolManifest,
    supported_operations: supportedOperations,
    rejected_or_ambiguous_tools: rejectedOrAmbiguousTools,
    discovery_timestamp: timestamp,
    discovery_mutations_executed: 0,
    provenance: {
      discovery_mode: discoveryMode,
      upstream_owner: pathSpec
        ? pathSpec.upstreamOwner
        : 'None (external runtime not configured)',
      source_confidence: 'verified-read',
      version_floor_rule: pathSpec
        ? pathSpec.versionFloorRule
        : 'Path 1 requires Blender 5.1.0+; Path 2 supports Blender 3.0.0+; CLI appendix recommends 4.2.0+',
      single_bridge_verified: singleBridgeVerified,
      ...provenanceDetails,
    },
    known_limitations: knownLimitations,
    truth_states: {
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
      is_mock_runtime: Boolean(runtimeClient?.isMockRuntime),
    },
  };

  if (isTrustedMockRuntimeFixture(options.mockRuntime)) {
    Object.defineProperty(session, TRUSTED_MOCK_FIXTURE_TOKEN, {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false,
    });
    TRUSTED_MOCK_SESSION_INSTANCES.add(session);
  }

  const validateSession = getAjvValidator(paths.runtimeSessionSchemaPath);
  if (!validateSession(session)) {
    const errs = (validateSession.errors || []).map(
      (e) => `${e.instancePath || '/'} ${e.message}`,
    );
    throw new Error(`Runtime session failed schema validation: ${errs.join('; ')}`);
  }

  return session;
}
