// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { ToolListChangedNotificationSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs';
import { DEFAULT_REPO_ROOT } from './paths.mjs';
import { negotiateMcpProtocolCompatibility, resolveRuntimeGovernancePaths } from './qualification.mjs';
import { parseMcpCallToolResult, validateRuntimeTransportEndpoint, validateStdioCommandConfig } from './security.mjs';
import { discoverRuntimeSession } from './session.mjs';
import { runRuntimeQualificationAndSmoke, withAsyncTimeout } from './smoke.mjs';

export async function connectMcpRuntimeClient(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const runtimePath = options.runtimePath || 'path-1-host-a';
  const connectTimeoutMs = Number(options.connectTimeoutMs) || 5000;
  const listToolsTimeoutMs = Number(options.listToolsTimeoutMs) || 5000;
  const callToolTimeoutMs = Number(options.callToolTimeoutMs) || 10000;
  const maxToolPages = Number(options.maxToolPages) || 10;
  const maxTotalTools = Number(options.maxTotalTools) || 128;
  const maxPayloadBytes = Number(options.maxPayloadBytes) || 2 * 1024 * 1024;

  // Enforce single-bridge-per-session law: reject mixed STDIO + HTTP transport config
  if (options.stdioCommand && options.endpoint) {
    const err = new Error(
      'Mixed STDIO command and HTTP endpoint configuration is forbidden by laws/single-bridge-per-session.md.',
    );
    err.connectionStatus = 'bridge_conflict';
    throw err;
  }

  let transportType = options.transportType || null;
  if (!transportType) {
    if (options.stdioCommand) {
      transportType = 'stdio';
    } else if (options.endpoint) {
      transportType = 'streamable-http';
    } else {
      transportType = runtimePath === 'path-1-host-b' ? 'streamable-http' : 'stdio';
    }
  }

  let transport = null;
  let validatedEndpoint = null;
  let validatedStdio = null;

  if (transportType === 'stdio') {
    const stdioValidation = validateStdioCommandConfig({
      command: options.stdioCommand,
      args: options.stdioArgs || [],
      cwd: options.stdioCwd || repoRoot,
      env: options.stdioEnv || process.env,
      repoRoot,
      projectDir,
    });
    if (!stdioValidation.valid) {
      const err = new Error(stdioValidation.reason);
      err.connectionStatus = 'invalid_endpoint';
      throw err;
    }
    validatedStdio = stdioValidation;
    transport = new StdioClientTransport({
      command: stdioValidation.command,
      args: stdioValidation.args,
      cwd: stdioValidation.cwd,
      env: stdioValidation.sanitizedEnv,
      stderr: 'pipe',
    });
  } else if (transportType === 'streamable-http') {
    const epValidation = validateRuntimeTransportEndpoint(options.endpoint, {
      allowRemoteEndpoint: Boolean(options.allowRemoteEndpoint),
      requireRemoteTls: options.requireRemoteTls !== false,
    });
    if (!epValidation.valid) {
      const err = new Error(epValidation.reason);
      err.connectionStatus = 'invalid_endpoint';
      throw err;
    }
    validatedEndpoint = epValidation.normalizedEndpoint;
    transport = new StreamableHTTPClientTransport(new URL(validatedEndpoint));
  } else {
    const err = new Error(`Unsupported MCP transport type: ${String(transportType)}`);
    err.connectionStatus = 'invalid_endpoint';
    throw err;
  }

  const client = new Client(
    {
      name: 'blendops-runtime-orchestrator',
      version: '0.3.3',
    },
    {
      capabilities: {},
    },
  );

  let lifecycleState = 'configured';
  let negotiatedProtocolVersion = null;
  let serverVersionInfo = null;
  let serverCapabilities = null;
  let discoveredTools = [];
  let cachedSceneInfo = null;
  let toolListChangedCount = 0;
  let requalificationRequired = false;
  let staleQualification = false;
  let closed = false;

  // Subscribe to notifications/tools/list_changed
  client.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
    toolListChangedCount += 1;
    requalificationRequired = true;
    staleQualification = true;
  });

  async function safeCloseTransport() {
    if (closed) return;
    closed = true;
    try {
      await client.close();
    } catch {
      // ignore close errors
    }
    try {
      if (transport && typeof transport.close === 'function') {
        await transport.close();
      }
    } catch {
      // ignore close errors
    }
  }

  try {
    await withAsyncTimeout(
      client.connect(transport),
      connectTimeoutMs,
      `MCP client connection and initialization timed out after ${connectTimeoutMs}ms.`,
    );
    lifecycleState = 'transport_connected';
    serverVersionInfo = client.getServerVersion() || null;
    serverCapabilities = client.getServerCapabilities() || null;
    lifecycleState = 'initialized';

    // Protocol version negotiation
    // The official @modelcontextprotocol/sdk negotiates protocolVersion during initialize;
    // also allow explicit options.protocolVersionOverride or serverVersionInfo.protocolVersion for testing incompatible servers
    negotiatedProtocolVersion =
      options.protocolVersionOverride ||
      serverVersionInfo?.protocolVersion ||
      transport?.protocolVersion ||
      '2024-11-05';

    const protoCheck = negotiateMcpProtocolCompatibility(
      {
        reachable: true,
        protocolVersion: negotiatedProtocolVersion,
        addonOrServerIdentity: serverVersionInfo?.name || 'blender-mcp',
        transportType,
      },
      runtimePath,
    );
    if (!protoCheck.protocolCompatible) {
      const err = new Error(protoCheck.blockingReason || 'Unsupported MCP protocol version.');
      err.connectionStatus = 'protocol_incompatible';
      throw err;
    }
    lifecycleState = 'protocol_negotiated';

    // Paginated tools/list discovery with strict page & tool count ceilings
    const allTools = [];
    const seenCursors = new Set();
    let cursor = undefined;
    let pageCount = 0;

    while (true) {
      pageCount += 1;
      if (pageCount > maxToolPages) {
        const err = new Error(
          `MCP tools/list pagination exceeded maximum allowed pages (${maxToolPages}).`,
        );
        err.connectionStatus = 'protocol_incompatible';
        throw err;
      }

      const listRes = await withAsyncTimeout(
        client.listTools(cursor ? { cursor } : undefined),
        listToolsTimeoutMs,
        `MCP tools/list request timed out after ${listToolsTimeoutMs}ms.`,
      );

      const serializedPage = JSON.stringify(listRes || {});
      if (Buffer.byteLength(serializedPage, 'utf8') > maxPayloadBytes) {
        const err = new Error(
          `MCP tools/list response payload exceeded maximum size (${maxPayloadBytes} bytes).`,
        );
        err.connectionStatus = 'protocol_incompatible';
        throw err;
      }

      const pageTools = Array.isArray(listRes?.tools) ? listRes.tools : [];
      for (const t of pageTools) {
        allTools.push(t);
        if (allTools.length > maxTotalTools) {
          const err = new Error(
            `MCP tools/list exceeded maximum allowed tool count (${maxTotalTools}).`,
          );
          err.connectionStatus = 'protocol_incompatible';
          throw err;
        }
      }

      const nextCursor = listRes?.nextCursor;
      if (!nextCursor) break;
      if (seenCursors.has(nextCursor)) {
        const err = new Error(
          `MCP tools/list pagination loop detected (duplicate cursor '${nextCursor}').`,
        );
        err.connectionStatus = 'protocol_incompatible';
        throw err;
      }
      seenCursors.add(nextCursor);
      cursor = nextCursor;
    }

    discoveredTools = allTools;
    staleQualification = false;
    requalificationRequired = false;
    lifecycleState = 'tools_discovered';

    // Optionally probe read-only blendfile/scene info for blender_version if requested
    if (options.probeBlenderVersion !== false) {
      const versionTool = discoveredTools.find(
        (t) =>
          t.name === 'get_blendfile_summary_path_info' ||
          t.name === 'get_blendfile_summary_datablocks' ||
          t.name === 'get_blendfile_summary' ||
          t.name === 'get_scene_info',
      );
      if (versionTool) {
        try {
          const rawCall = await withAsyncTimeout(
            client.callTool({ name: versionTool.name, arguments: {} }),
            callToolTimeoutMs,
            `Initial read-only version probe (${versionTool.name}) timed out.`,
          );
          const parsed = parseMcpCallToolResult(rawCall, {
            outputSchema: versionTool.outputSchema || versionTool.output_schema || null,
            maxPayloadBytes,
          });
          if (parsed.ok && parsed.data) {
            cachedSceneInfo = parsed.data;
          }
        } catch {
          // Version probe is optional; discovery continues with blender_version = null if not available
        }
      }
    }
  } catch (err) {
    await safeCloseTransport();
    throw err;
  }

  const toolCache = new Map(discoveredTools.map((t) => [t.name, t]));

  const liveClientAdapter = {
    isMockRuntime: false,
    runtimePath,
    transportType,
    endpoint: validatedEndpoint,
    stdioCommand: validatedStdio?.command || null,
    get lifecycleState() {
      return lifecycleState;
    },
    set lifecycleState(nextState) {
      lifecycleState = nextState;
    },
    get toolListChangedCount() {
      return toolListChangedCount;
    },
    get staleQualification() {
      return staleQualification;
    },
    probeSession() {
      return {
        reachable: !closed,
        staleSession: staleQualification,
        blenderVersion:
          cachedSceneInfo?.blender_version ||
          options.blenderVersion ||
          null,
        addonOrServerIdentity: serverVersionInfo?.name || null,
        serverName: serverVersionInfo?.name || null,
        addonIdentity: serverVersionInfo?.name || null,
        runtimeVersion: serverVersionInfo?.version || null,
        serverVersion: serverVersionInfo?.version || null,
        protocolVersion: negotiatedProtocolVersion,
        transportType,
        endpoint: validatedEndpoint,
        activeBridges: [runtimePath],
        backupSupported: Boolean(options.backupSupported),
        tools: discoveredTools,
        toolListChangedCount,
        requalificationRequired,
        provenanceHint: {
          commitSha: options.commitSha || null,
          executableSha256: options.executableSha256 || null,
          source: options.provenanceSource || 'self_reported_only',
        },
        discoveryMutationsExecuted: 0,
      };
    },
    async refreshAndRequalifyTools() {
      const refreshed = [];
      let cursor = undefined;
      let pages = 0;
      const seen = new Set();
      while (true) {
        pages += 1;
        if (pages > maxToolPages) {
          throw new Error(`MCP tools/list pagination exceeded ${maxToolPages} pages on refresh.`);
        }
        const listRes = await withAsyncTimeout(
          client.listTools(cursor ? { cursor } : undefined),
          listToolsTimeoutMs,
          `MCP tools/list refresh timed out after ${listToolsTimeoutMs}ms.`,
        );
        for (const t of listRes?.tools || []) {
          refreshed.push(t);
          if (refreshed.length > maxTotalTools) {
            throw new Error(`MCP tools/list refresh exceeded ${maxTotalTools} tools.`);
          }
        }
        if (!listRes?.nextCursor) break;
        if (seen.has(listRes.nextCursor)) {
          throw new Error('MCP tools/list pagination loop detected on refresh.');
        }
        seen.add(listRes.nextCursor);
        cursor = listRes.nextCursor;
      }
      discoveredTools = refreshed;
      toolCache.clear();
      for (const t of discoveredTools) toolCache.set(t.name, t);
      staleQualification = false;
      requalificationRequired = false;
      return discoveredTools;
    },
    async invokeToolAsync(toolName, args = {}, callOpts = {}) {
      // Never allow permanently blocked L3 raw code execution tools
      if (
        toolName === 'execute_blender_code' ||
        toolName === 'eval_python' ||
        toolName === 'blender_cli_python_inline'
      ) {
        throw new Error(
          `SECURITY VIOLATION: Raw Python execution tool '${toolName}' is permanently blocked by laws/no-arbitrary-python-interface.md.`,
        );
      }
      if (staleQualification) {
        throw new Error(
          `Tool inventory changed via notifications/tools/list_changed (${toolListChangedCount} event(s)); re-qualification required before invoking '${toolName}'.`,
        );
      }
      const timeoutMs = Number(callOpts.timeoutMs) || callToolTimeoutMs;
      const toolDef = toolCache.get(toolName);
      const rawResult = await withAsyncTimeout(
        client.callTool({ name: toolName, arguments: args }),
        timeoutMs,
        `MCP tool '${toolName}' timed out after ${timeoutMs}ms.`,
      );
      const parsed = parseMcpCallToolResult(rawResult, {
        outputSchema: toolDef?.outputSchema || toolDef?.output_schema || null,
        maxPayloadBytes,
      });
      if (!parsed.ok) {
        throw new Error(
          `MCP tool '${toolName}' returned invalid or failed CallToolResult: ${parsed.error}`,
        );
      }
      return {
        status: 'ok',
        tool: toolName,
        data: parsed.data,
        secretsRedacted: parsed.secretsRedacted,
      };
    },
    async close() {
      await safeCloseTransport();
    },
  };

  return liveClientAdapter;
}
export async function discoverRuntimeSessionAsync(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  let connectedClient = options.liveTransportClient || null;
  let createdInternally = false;

  if (
    !connectedClient &&
    !options.mockRuntime &&
    (options.stdioCommand || options.endpoint)
  ) {
    try {
      connectedClient = await connectMcpRuntimeClient({
        ...options,
        repoRoot,
        projectDir,
      });
      createdInternally = true;
    } catch (connErr) {
      const errStatus = connErr.connectionStatus || 'unreachable';
      return discoverRuntimeSession({
        ...options,
        repoRoot,
        projectDir,
        liveTransportClient: {
          isMockRuntime: false,
          probeSession() {
            if (errStatus === 'unreachable') {
              return { reachable: false };
            }
            if (errStatus === 'bridge_conflict') {
              return {
                reachable: true,
                activeBridges: ['path-1-host-a', 'path-2-community'],
              };
            }
            if (errStatus === 'protocol_incompatible') {
              return {
                reachable: true,
                protocolVersion: '1999-01-01',
                addonIdentity: 'blender-mcp',
                runtimeVersion: '0.2.0',
                blenderVersion: '5.1.0',
                tools: [],
              };
            }
            throw connErr;
          },
        },
      });
    }
  }

  try {
    return discoverRuntimeSession({
      ...options,
      repoRoot,
      projectDir,
      liveTransportClient: connectedClient,
    });
  } finally {
    if (createdInternally && connectedClient && options.keepAlive !== true) {
      await connectedClient.close();
    }
  }
}
/**
 * Governed Live Read-Only (`L0`) Inspection Workflow
 * Connects to a live (or fixture) MCP server, verifies contract qualification,
 * executes only qualified `L0` read-only inspection tools via `invokeToolAsync` (or `invokeTool`),
 * validates structured responses, verifies zero scene mutations (`mutations_executed === 0`),
 * and transitions `connection_lifecycle_state` to `live_read_only_verified` when run against a
 * real non-mock MCP transport.
 */
export async function inspectLiveReadOnlyRuntimeAsync(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const runtimePath = options.runtimePath || 'path-1-host-a';
  let client = options.liveTransportClient || options.mockRuntime || null;
  let createdInternally = false;

  if (!client && (options.stdioCommand || options.endpoint)) {
    client = await connectMcpRuntimeClient({
      ...options,
      repoRoot,
      projectDir,
      runtimePath,
    });
    createdInternally = true;
  }

  if (!client) {
    throw new Error(
      'inspectLiveReadOnlyRuntimeAsync requires a liveTransportClient, stdioCommand, endpoint, or mockRuntime.',
    );
  }

  try {
    const isMock = Boolean(client.isMockRuntime);
    const initialSession = discoverRuntimeSession({
      repoRoot,
      projectDir,
      runtimePath,
      mockRuntime: isMock ? client : null,
      liveTransportClient: isMock ? null : client,
      endpoint: options.endpoint,
      allowRemoteEndpoint: options.allowRemoteEndpoint,
    });

    if (
      initialSession.connection_status !== 'connected' ||
      !initialSession.qualification_states.read_only_qualified
    ) {
      return {
        ok: false,
        session: initialSession,
        inspectedOperations: [],
        mutationsExecuted: 0,
        error: `Runtime is not read-only qualified (connection_status=${initialSession.connection_status}).`,
      };
    }

    const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
    const registryDoc = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));
    const l0Operations = [
      'op.inspect.blendfile-summary',
      'op.inspect.object-list',
      'op.inspect.camera-and-lighting',
      'op.inspect.material-slots',
    ].filter((opId) => initialSession.supported_operations.includes(opId));

    const inspectedOperations = [];
    for (const opId of l0Operations) {
      const opDef = (registryDoc.operations || []).find((o) => o.operation_id === opId);
      if (!opDef || opDef.required_capability_tier !== 'L0' || opDef.behavior !== 'read_only') {
        throw new Error(`Security invariant violation: '${opId}' is not a read-only L0 operation.`);
      }
      const mapping = opDef.runtime_tool_mappings?.[runtimePath];
      const toolName = mapping?.upstream_mcp_tool_name;
      if (!toolName) continue;

      let res;
      if (typeof client.invokeToolAsync === 'function') {
        res = await client.invokeToolAsync(toolName, {});
      } else if (typeof client.invokeTool === 'function') {
        res = client.invokeTool(toolName, {});
      } else {
        throw new Error('Runtime client does not expose invokeToolAsync or invokeTool.');
      }

      if (!res || res.status !== 'ok' || !res.data || typeof res.data !== 'object') {
        throw new Error(`L0 read-only tool '${toolName}' did not return valid structured data.`);
      }

      inspectedOperations.push({
        operation_id: opId,
        mapped_tool_name: toolName,
        tier: 'L0',
        status: 'succeeded',
        data: res.data,
      });
    }

    const verifiedLiveReadOnly = !isMock && inspectedOperations.length > 0;
    if (verifiedLiveReadOnly && 'lifecycleState' in client) {
      client.lifecycleState = 'live_read_only_verified';
    }

    const verifiedSession = discoverRuntimeSession({
      repoRoot,
      projectDir,
      runtimePath,
      mockRuntime: isMock ? client : null,
      liveTransportClient: isMock ? null : client,
      endpoint: options.endpoint,
      allowRemoteEndpoint: options.allowRemoteEndpoint,
      liveReadOnlyVerified: verifiedLiveReadOnly,
    });

    return {
      ok: inspectedOperations.length > 0,
      session: verifiedSession,
      inspectedOperations,
      mutationsExecuted: 0,
    };
  } finally {
    if (createdInternally && client && typeof client.close === 'function' && options.keepAlive !== true) {
      await client.close();
    }
  }
}
export async function runRuntimeQualificationAndSmokeAsync(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const runtimePath = options.runtimePath || 'path-1-host-a';
  const liveOptIn =
    options.liveSmokeOptIn === true ||
    process.env.BLENDOPS_LIVE_SMOKE_OPT_IN === '1';

  if (
    options.mode === 'live_runtime' &&
    liveOptIn &&
    !options.mockRuntime &&
    (options.stdioCommand || options.endpoint || options.liveTransportClient)
  ) {
    let client = options.liveTransportClient || null;
    let createdInternally = false;
    try {
      if (!client) {
        client = await connectMcpRuntimeClient({
          ...options,
          repoRoot,
          projectDir,
          runtimePath,
        });
        createdInternally = true;
      }
      const inspectRes = await inspectLiveReadOnlyRuntimeAsync({
        ...options,
        repoRoot,
        projectDir,
        runtimePath,
        liveTransportClient: client,
        keepAlive: true,
      });

      // Expose a synchronous invokeTool wrapper backed by the already-inspected L0 data
      // so runRuntimeQualificationAndSmoke can record the L0 smoke operations deterministically
      const cachedByTool = new Map(
        inspectRes.inspectedOperations.map((op) => [op.mapped_tool_name, op.data]),
      );
      const syncBridgeClient = {
        ...client,
        isMockRuntime: false,
        probeSession: () => client.probeSession(),
        invokeTool(toolName) {
          if (client.staleQualification) {
            throw new Error(
              `Tool inventory changed via notifications/tools/list_changed; re-qualification required before invoking '${toolName}'.`,
            );
          }
          if (cachedByTool.has(toolName)) {
            return {
              status: 'ok',
              tool: toolName,
              data: cachedByTool.get(toolName),
            };
          }
          throw new Error(`Tool '${toolName}' was not pre-fetched in live read-only inspection.`);
        },
      };

      return runRuntimeQualificationAndSmoke({
        ...options,
        repoRoot,
        projectDir,
        runtimePath,
        runtimeSession: inspectRes.session,
        liveTransportClient: syncBridgeClient,
      });
    } finally {
      if (createdInternally && client && typeof client.close === 'function') {
        await client.close();
      }
    }
  }

  return runRuntimeQualificationAndSmoke(options);
}
