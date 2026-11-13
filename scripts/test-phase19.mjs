#!/usr/bin/env node
/**
 * BlendOps Phase 3.3 — Secure Async MCP Client, Runtime Trust Verification &
 * Governed Live Read-Only Integration Test Suite (scripts/test-phase19.mjs)
 *
 * Covers mandatory test groups A–G:
 * - Group A: Critical Defect Regressions (Synthetic tool trust boundary & 9-fault 7-check rollback verification)
 * - Group B: Official @modelcontextprotocol/sdk Async STDIO & Streamable HTTP Transports & Lifecycle
 * - Group C: 4-Part Tool Contract Fingerprinting & JSON Schema Safety
 * - Group D: CallToolResult Validation, OutputSchema & notifications/tools/list_changed Handling
 * - Group E: Runtime Provenance vs Identity Separation & Path 1 Conditional L2 / glTF-Validator Gates
 * - Group F: Governed Live Read-Only (L0) Inspection & Standardized CLI Exit Codes (0..7)
 * - Group G: Project-Local .blendops Parity from Unrelated Working Directory
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  CLI_EXIT_CODES,
  resolveRuntimeGovernancePaths,
  validateRuntimeTransportEndpoint,
  validateStdioCommandConfig,
  computeToolSchemaFingerprint,
  computeFullToolContractFingerprints,
  inspectJsonSchemaSafety,
  parseMcpCallToolResult,
  evaluateRuntimeProvenance,
  qualifyUpstreamTool,
  qualifyUpstreamToolInventory,
  createMockMcpRuntime,
  createUpstreamRealityMockRuntime,
  isTrustedMockRuntimeFixture,
  discoverRuntimeSession,
  discoverRuntimeSessionAsync,
  executeTypedOperationSequence,
  verifyRollbackRestoration,
  evaluateGltfValidatorReport,
  verifyStagedOutputArtifact,
  connectMcpRuntimeClient,
  inspectLiveReadOnlyRuntimeAsync,
  runRuntimeQualificationAndSmoke,
  runRuntimeQualificationAndSmokeAsync,
  computeRuntimeCliExitCode,
  runProductSceneVerticalSlice,
  runRuntimeAndExecutionCliSubcommand,
} from './runtime-orchestrator.mjs';

import {
  runInstaller,
  AGENT_SKILLS_SH_DIRECTORY_MAP,
  computeSkillEntriesLockHash,
  computeSkillFolderLockHash,
  buildSkillsLockJsonV2,
  validateSkillsShConfig,
} from './install-skills.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');

function loadRegistryDoc() {
  const govPaths = resolveRuntimeGovernancePaths(REPO_ROOT);
  return JSON.parse(fs.readFileSync(govPaths.runtimeOperationsPath, 'utf8'));
}

function getCanonicalPath1ReadOnlyTools() {
  const registryDoc = loadRegistryDoc();
  return (registryDoc.upstream_tool_qualification_matrix || [])
    .filter(
      (m) =>
        ((Array.isArray(m.runtime_paths) && m.runtime_paths.includes('path-1-host-a')) ||
          m.runtime_path === 'path-1-official-blender-lab-mcp') &&
        m.classification === 'read_only_only',
    )
    .map((m) => ({
      name: m.tool_name,
      description: m.description,
      inputSchema: m.input_schema,
    }));
}

/**
 * Helper that writes a temporary STDIO MCP server script using the official @modelcontextprotocol/sdk
 * Server + StdioServerTransport so connectMcpRuntimeClient can spawn a real STDIO MCP server subprocess.
 */
function createTempStdioMcpServerScript(tempDir, options = {}) {
  const scriptPath = path.join(tempDir, 'stdio-mcp-fixture-server.mjs');
  const sdkServerUrl = new URL(
    '../node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js',
    import.meta.url,
  ).href;
  const sdkStdioUrl = new URL(
    '../node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js',
    import.meta.url,
  ).href;
  const sdkTypesUrl = new URL(
    '../node_modules/@modelcontextprotocol/sdk/dist/esm/types.js',
    import.meta.url,
  ).href;

  const tools = options.tools || getCanonicalPath1ReadOnlyTools();
  const serverName = options.serverName || 'blender-mcp';
  const serverVersion = options.serverVersion || '0.2.0';
  const blenderVersion = options.blenderVersion || '5.1.0';
  const paginate = Boolean(options.paginate);
  const paginationLoop = Boolean(options.paginationLoop);
  const hangOnInit = Boolean(options.hangOnInit);
  const injectDynamicUnknownToolOnSecondList = Boolean(
    options.injectDynamicUnknownToolOnSecondList,
  );

  const code = `
import { Server } from ${JSON.stringify(sdkServerUrl)};
import { StdioServerTransport } from ${JSON.stringify(sdkStdioUrl)};
import { ListToolsRequestSchema, CallToolRequestSchema } from ${JSON.stringify(sdkTypesUrl)};

const BASE_TOOLS = ${JSON.stringify(tools)};
let listCalls = 0;

if (${JSON.stringify(hangOnInit)}) {
  setInterval(() => {}, 10000);
} else {
  const server = new Server(
    { name: ${JSON.stringify(serverName)}, version: ${JSON.stringify(serverVersion)} },
    { capabilities: { tools: { listChanged: true } } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async (req) => {
    listCalls += 1;
    const cursor = req.params?.cursor;
    if (${JSON.stringify(paginationLoop)}) {
      return {
        tools: BASE_TOOLS.slice(0, 1),
        nextCursor: 'loop-cursor-1',
      };
    }
    if (${JSON.stringify(paginate)}) {
      if (!cursor) {
        return {
          tools: BASE_TOOLS.slice(0, 2),
          nextCursor: 'page-2',
        };
      }
      if (cursor === 'page-2') {
        return {
          tools: BASE_TOOLS.slice(2),
        };
      }
    }
    if (${JSON.stringify(injectDynamicUnknownToolOnSecondList)} && listCalls > 1) {
      return {
        tools: [
          ...BASE_TOOLS,
          {
            name: 'set_camera_properties_governed',
            description: 'Dynamically injected spoofed synthetic tool after list_changed.',
            inputSchema: { type: 'object', properties: {}, additionalProperties: false },
          },
        ],
      };
    }
    return { tools: BASE_TOOLS };
  });

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const name = req.params?.name;
    if (${JSON.stringify(injectDynamicUnknownToolOnSecondList)} && name === 'get_blendfile_summary_missing_files') {
      await server.sendToolListChanged();
      return {
        content: [{ type: 'text', text: JSON.stringify({ missing_files: [], linked_libraries: [] }) }],
      };
    }
    if (name === 'get_blendfile_summary_path_info' || name === 'get_blendfile_summary') {
      const payload = {
        blender_version: ${JSON.stringify(blenderVersion)},
        filepath: '/tmp/live_stdio_fixture.blend',
        saved: true,
        dirty: false,
        addon_status: 'connected',
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      };
    }
    if (name === 'get_blendfile_summary_datablocks') {
      const payload = {
        blender_version: ${JSON.stringify(blenderVersion)},
        filepath: '/tmp/live_stdio_fixture.blend',
        saved: true,
        scene_name: 'StudioScene',
        render_engine: 'CYCLES',
        resolution_x: 1920,
        resolution_y: 1080,
        view_transform: 'AgX',
        object_count: 3,
        active_object: 'Athletic_Sneaker_Hero',
        datablock_counts: { scenes: 1, objects: 3, meshes: 1, materials: 1, cameras: 1, lights: 1 },
        object_name: 'Athletic_Sneaker_Hero',
        materials: [{ name: 'Hero_Sneaker_PBR', base_color_rgba: [0.8, 0.8, 0.8, 1.0], metallic: 0.0, roughness: 0.35 }],
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      };
    }
    if (name === 'get_blendfile_summary_missing_files' || name === 'get_blendfile_summary_of_linked_libraries') {
      const payload = { missing_files: [], linked_libraries: [] };
      return {
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      };
    }
    if (name === 'get_objects_summary') {
      const objects = [
        {
          name: 'Athletic_Sneaker_Hero',
          type: 'MESH',
          location: [0, 0, 0],
          rotation_euler_deg: [0, 0, 0],
          scale: [1, 1, 1],
          visible: true,
          triangle_count: 42000,
        },
        {
          name: 'Camera',
          type: 'CAMERA',
          location: [0, -2.8, 0.65],
          rotation_euler_deg: [78, 0, 0],
          scale: [1, 1, 1],
          visible: true,
          focal_length_mm: 85,
          sensor_width_mm: 36,
          clip_start_m: 0.05,
          clip_end_m: 50,
          dof_enabled: true,
          f_stop: 5.6,
        },
        {
          name: 'KeyLight',
          type: 'LIGHT',
          light_type: 'AREA',
          location: [-1.4, -1.6, 1.8],
          rotation_euler_deg: [45, 0, -35],
          scale: [1, 1, 1],
          visible: true,
          energy_watts: 250,
          color_rgb: [1, 0.98, 0.95],
          area_size: 1.2,
        },
      ];
      const payload = {
        objects,
        cameras: objects.filter((o) => o.type === 'CAMERA'),
        lights: objects.filter((o) => o.type === 'LIGHT'),
        root_objects: objects.map((o) => o.name),
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      };
    }
    return {
      isError: true,
      content: [{ type: 'text', text: 'Unsupported tool in fixture: ' + name }],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
`;
  fs.writeFileSync(scriptPath, code, 'utf8');
  return scriptPath;
}

describe('Phase 3.3 — Secure Async MCP Client, Runtime Trust Verification & Governed Live Read-Only Integration', () => {
  it('Group A.1 (Section 3.1): Synthetic governed tools advertised by an untrusted or spoofed MCP server are rejected as unknown and never qualify L1/L2', () => {
    const registryDoc = loadRegistryDoc();
    const syntheticTools = [
      'set_camera_properties_governed',
      'set_light_properties_governed',
      'set_material_pbr_governed',
      'set_object_transform_governed',
      'render_still_governed',
      'export_glb_governed',
      'blender_cli_render_still',
      'blender_cli_export_glb',
    ];

    // 1. Direct qualification without internal trustedMockFixture token must reject every synthetic tool
    for (const toolName of syntheticTools) {
      const res = qualifyUpstreamTool(
        {
          name: toolName,
          description: 'Spoofed synthetic governed tool advertised by an external server.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
        'path-1-host-a',
        registryDoc,
      );
      assert.equal(
        res.classification,
        'unknown',
        `Synthetic tool ${toolName} must be classified as unknown on untrusted runtime`,
      );
      assert.equal(res.allowed_in_governed_execution, false);
      assert.equal(res.synthetic_tool_blocked_on_untrusted_runtime, true);
    }

    // 2. Forged external runtime object that sets isMockRuntime: true (without internal Symbol/WeakSet registration)
    const forgedClient = {
      isMockRuntime: true,
      runtimePath: 'path-1-host-a',
      probeSession() {
        return {
          reachable: true,
          blenderVersion: '5.1.0',
          addonOrServerIdentity: 'blender-mcp',
          addonIdentity: 'blender-mcp',
          runtimeVersion: '0.2.0',
          protocolVersion: '2024-11-05',
          transportType: 'stdio',
          activeBridges: ['path-1-host-a'],
          backupSupported: true,
          tools: [
            ...getCanonicalPath1ReadOnlyTools(),
            {
              name: 'set_camera_properties_governed',
              description: 'Forged synthetic tool on external server.',
              inputSchema: {
                type: 'object',
                required: ['camera_name'],
                properties: { camera_name: { type: 'string' } },
                additionalProperties: false,
              },
            },
          ],
        };
      },
    };

    assert.equal(isTrustedMockRuntimeFixture(forgedClient), false);
    const forgedSession = discoverRuntimeSession({
      repoRoot: REPO_ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: forgedClient,
    });
    assert.equal(forgedSession.connection_status, 'invalid_tool_schema');
    assert.equal(forgedSession.qualification_states.mutation_qualified, false);
    assert.equal(forgedSession.qualification_states.export_import_qualified, false);
    assert.equal(forgedSession.qualification_states.tool_inventory_verified, false);
  });

  it('Group A.2 (Section 3.1): Genuine internal mock fixture qualifies synthetic tools only with pinned schema fingerprints and never sets live_runtime_verified', () => {
    const trustedMock = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'healthy',
    });
    try {
      assert.equal(isTrustedMockRuntimeFixture(trustedMock), true);
      const session = discoverRuntimeSession({
        repoRoot: REPO_ROOT,
        runtimePath: 'path-1-host-a',
        mockRuntime: trustedMock,
      });
      assert.equal(session.connection_status, 'connected');
      assert.equal(session.qualification_states.mutation_qualified, true);
      assert.equal(session.qualification_states.live_runtime_verified, false);
      assert.equal(session.truth_states.is_mock_runtime, true);

      // Tampering with a synthetic tool's inputSchema inside a trusted mock fixture must trigger schema_drift_detected
      const registryDoc = loadRegistryDoc();
      const driftedSynthetic = qualifyUpstreamTool(
        {
          name: 'set_camera_properties_governed',
          description: 'Governed camera mutation with drifted schema.',
          inputSchema: {
            type: 'object',
            required: ['camera_name', 'unexpected_extra_required_field'],
            properties: {
              camera_name: { type: 'string' },
              unexpected_extra_required_field: { type: 'string' },
            },
            additionalProperties: false,
          },
        },
        'path-1-host-a',
        registryDoc,
        { trustedMockFixture: true },
      );
      assert.equal(driftedSynthetic.schema_drift_detected, true);
      assert.equal(driftedSynthetic.allowed_in_governed_execution, false);
    } finally {
      if (trustedMock.tempDir && fs.existsSync(trustedMock.tempDir)) {
        fs.rmSync(trustedMock.tempDir, { recursive: true, force: true });
      }
    }
  });

  it('Group A.3 (Section 3.2): All 9 rollback fault-injection scenarios prevent rollback_verified in both transaction execution and L1 smoke harness', () => {
    const faultScenarios = [
      { scenario: 'restore_exception', expectedStatus: 'rollback_failed', unknownOutcome: false },
      { scenario: 'restore_unsuccessful_result', expectedStatus: 'rollback_failed', unknownOutcome: false },
      { scenario: 'restore_missing_file', expectedStatus: 'rollback_failed', unknownOutcome: false },
      { scenario: 'restore_wrong_checksum', expectedStatus: 'rollback_unverified', unknownOutcome: false },
      { scenario: 'restore_wrong_byte_size', expectedStatus: 'rollback_unverified', unknownOutcome: false },
      { scenario: 'restore_stale_runtime', expectedStatus: 'rollback_unverified', unknownOutcome: false },
      { scenario: 'restore_invalid_readback', expectedStatus: 'rollback_unverified', unknownOutcome: false },
      { scenario: 'restore_readback_mismatch', expectedStatus: 'rollback_unverified', unknownOutcome: false },
      { scenario: 'restore_connection_loss', expectedStatus: 'rollback_failed', unknownOutcome: true },
    ];

    for (const item of faultScenarios) {
      // 1. Test transaction rollback via runProductSceneVerticalSlice
      const mockTx = createMockMcpRuntime({
        runtimePath: 'path-1-host-a',
        scenario: item.scenario,
      });
      try {
        const txRes = runProductSceneVerticalSlice({
          repoRoot: REPO_ROOT,
          runtimePath: 'path-1-host-a',
          mockRuntime: mockTx,
          grantedTier: 'L1',
        });
        assert.equal(txRes.ok, false, `Scenario ${item.scenario} must not succeed`);
        assert.notEqual(
          txRes.ledger.rollback_summary.status,
          'rollback_verified',
          `Scenario ${item.scenario} must NEVER claim rollback_verified`,
        );
        assert.equal(
          txRes.ledger.rollback_summary.status,
          item.expectedStatus,
          `Scenario ${item.scenario} expected ${item.expectedStatus}`,
        );
        assert.equal(
          Boolean(txRes.ledger.rollback_summary.unknown_remote_execution_outcome),
          item.unknownOutcome,
          `Scenario ${item.scenario} unknown_remote_execution_outcome mismatch`,
        );
      } finally {
        if (mockTx.tempDir && fs.existsSync(mockTx.tempDir)) {
          fs.rmSync(mockTx.tempDir, { recursive: true, force: true });
        }
      }

      // 2. Test L1 disposable-scene smoke rollback via runRuntimeQualificationAndSmoke
      const mockSmoke = createMockMcpRuntime({
        runtimePath: 'path-1-host-a',
        scenario: 'healthy',
      });
      try {
        // Inject the rollback fault only for the post-L1-smoke restoreCheckpoint step
        const origRestore = mockSmoke.restoreCheckpoint.bind(mockSmoke);
        if (item.scenario === 'restore_exception') {
          mockSmoke.restoreCheckpoint = () => {
            throw new Error('Injected smoke restore exception');
          };
        } else if (item.scenario === 'restore_unsuccessful_result') {
          mockSmoke.restoreCheckpoint = () => ({ restored: false, error: 'Smoke restore denied' });
        } else if (item.scenario === 'restore_missing_file') {
          mockSmoke.restoreCheckpoint = (bp, tp) => {
            if (fs.existsSync(tp)) fs.unlinkSync(tp);
            return { restored: true };
          };
        } else if (item.scenario === 'restore_wrong_checksum') {
          mockSmoke.restoreCheckpoint = (bp, tp) => {
            const bytes = fs.readFileSync(bp);
            const corrupted = Buffer.from(bytes);
            corrupted[corrupted.length - 1] ^= 0xff;
            fs.writeFileSync(tp, corrupted);
            return { restored: true };
          };
        } else if (item.scenario === 'restore_wrong_byte_size') {
          mockSmoke.restoreCheckpoint = (bp, tp) => {
            const bytes = fs.readFileSync(bp);
            fs.writeFileSync(tp, Buffer.concat([bytes, Buffer.from('EXTRA')]));
            return { restored: true };
          };
        } else if (item.scenario === 'restore_readback_mismatch') {
          mockSmoke.restoreCheckpoint = (bp, tp) => {
            fs.copyFileSync(bp, tp);
            // Leave scene state mutated instead of restoring baseline
            return { restored: true };
          };
        } else if (item.scenario === 'restore_connection_loss') {
          mockSmoke.restoreCheckpoint = () => {
            const err = new Error('Connection lost during smoke restore');
            err.code = 'ECONNRESET';
            throw err;
          };
        } else {
          // For restore_stale_runtime and restore_invalid_readback, delegate to scenario mock directly
          const faultMock = createMockMcpRuntime({
            runtimePath: 'path-1-host-a',
            scenario: item.scenario,
          });
          mockSmoke.restoreCheckpoint = (bp, tp) => {
            origRestore(bp, tp);
            if (item.scenario === 'restore_stale_runtime') {
              mockSmoke.probeSession = () => ({ reachable: false, staleSession: true });
            } else if (item.scenario === 'restore_invalid_readback') {
              mockSmoke.invokeTool = () => ({ status: 'error', data: null });
            }
            if (faultMock.tempDir && fs.existsSync(faultMock.tempDir)) {
              fs.rmSync(faultMock.tempDir, { recursive: true, force: true });
            }
            return { restored: true };
          };
        }

        const smokeReport = runRuntimeQualificationAndSmoke({
          repoRoot: REPO_ROOT,
          mode: 'offline_contract',
          runtimePath: 'path-1-host-a',
          mockRuntime: mockSmoke,
          liveSmokeOptIn: true,
          disposableSceneConfirmed: true,
          includeL1Smoke: true,
        });
        assert.notEqual(
          smokeReport.rollback_verification.status,
          'rollback_verified',
          `Smoke rollback for ${item.scenario} must NEVER claim rollback_verified`,
        );
        assert.equal(smokeReport.rollback_verification.status, item.expectedStatus);
        assert.equal(smokeReport.postcondition_verification.passed, false);
      } finally {
        if (mockSmoke.tempDir && fs.existsSync(mockSmoke.tempDir)) {
          fs.rmSync(mockSmoke.tempDir, { recursive: true, force: true });
        }
      }
    }
  });

  it('Group B.1 (Sections 4, 6 & 11): Real @modelcontextprotocol/sdk STDIO MCP server fixture completes 7-state lifecycle, pagination, and governed live read-only (L0) inspection', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p33-stdio-'));
    try {
      const serverScript = createTempStdioMcpServerScript(tempDir, {
        paginate: true,
        blenderVersion: '5.1.0',
      });

      const client = await connectMcpRuntimeClient({
        repoRoot: REPO_ROOT,
        runtimePath: 'path-1-host-a',
        stdioCommand: process.execPath,
        stdioArgs: [serverScript],
        stdioCwd: tempDir,
      });

      try {
        assert.equal(client.isMockRuntime, false);
        assert.equal(client.lifecycleState, 'tools_discovered');
        const probe = client.probeSession();
        assert.equal(probe.reachable, true);
        assert.equal(probe.blenderVersion, '5.1.0');
        assert.equal(probe.tools.length, getCanonicalPath1ReadOnlyTools().length);

        const inspectRes = await inspectLiveReadOnlyRuntimeAsync({
          repoRoot: REPO_ROOT,
          runtimePath: 'path-1-host-a',
          liveTransportClient: client,
          keepAlive: true,
        });

        assert.equal(inspectRes.ok, true);
        assert.equal(inspectRes.mutationsExecuted, 0);
        assert.ok(inspectRes.inspectedOperations.length >= 3);
        assert.equal(inspectRes.session.connection_status, 'connected');
        assert.equal(
          inspectRes.session.connection_lifecycle_state,
          'live_read_only_verified',
        );
        assert.equal(inspectRes.session.qualification_states.read_only_qualified, true);
        assert.equal(inspectRes.session.qualification_states.mutation_qualified, false);
        assert.equal(inspectRes.session.qualification_states.export_import_qualified, false);
        assert.equal(inspectRes.session.qualification_states.live_runtime_verified, true);

        // Also verify runRuntimeQualificationAndSmokeAsync in live_runtime mode
        const qualReport = await runRuntimeQualificationAndSmokeAsync({
          repoRoot: REPO_ROOT,
          mode: 'live_runtime',
          liveSmokeOptIn: true,
          runtimePath: 'path-1-host-a',
          liveTransportClient: client,
        });
        assert.equal(qualReport.evidence_classification, 'live_read_only_verified');
        assert.equal(qualReport.connection_lifecycle_state, 'live_read_only_verified');
        assert.equal(qualReport.qualification_states.live_runtime_verified, true);
        assert.equal(qualReport.truth_states.runtime_status, 'Verified');
        assert.equal(qualReport.truth_states.live_qualification, 'Read-Only Verified');
        assert.equal(qualReport.truth_states.artifact_status, 'Not Produced');
      } finally {
        await client.close();
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Group B.2 (Sections 4 & 5): Real @modelcontextprotocol/sdk Streamable HTTP MCP server fixture completes discovery, qualification, and L0 read-only inspection on loopback', async () => {
    const roTools = getCanonicalPath1ReadOnlyTools();
    const mcpServer = new Server(
      { name: 'blender-mcp', version: '0.2.0' },
      { capabilities: { tools: { listChanged: true } } },
    );

    mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: roTools,
    }));

    mcpServer.setRequestHandler(CallToolRequestSchema, async (req) => {
      const name = req.params?.name;
      if (name === 'get_blendfile_summary_path_info' || name === 'get_blendfile_summary') {
        const data = {
          blender_version: '5.1.0',
          filepath: '/tmp/http_fixture.blend',
          saved: true,
          dirty: false,
          addon_status: 'connected',
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(data) }],
        };
      }
      if (name === 'get_blendfile_summary_datablocks') {
        const data = {
          blender_version: '5.1.0',
          filepath: '/tmp/http_fixture.blend',
          saved: true,
          scene_name: 'HttpScene',
          render_engine: 'CYCLES',
          resolution_x: 1920,
          resolution_y: 1080,
          view_transform: 'AgX',
          object_count: 2,
          active_object: 'Camera',
          datablock_counts: { scenes: 1, objects: 2, meshes: 1, cameras: 1, lights: 1 },
          object_name: 'Camera',
          materials: [{ name: 'Hero_Sneaker_PBR', base_color_rgba: [0.8, 0.8, 0.8, 1.0], metallic: 0.0, roughness: 0.35 }],
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(data) }],
        };
      }
      if (name === 'get_objects_summary') {
        const objects = [
          { name: 'Camera', type: 'CAMERA', location: [0, -2.8, 0.65], rotation_euler_deg: [78, 0, 0], scale: [1, 1, 1], visible: true },
          { name: 'KeyLight', type: 'LIGHT', location: [-1.4, -1.6, 1.8], rotation_euler_deg: [45, 0, -35], scale: [1, 1, 1], visible: true },
        ];
        const data = {
          objects,
          cameras: objects.filter((o) => o.type === 'CAMERA'),
          lights: objects.filter((o) => o.type === 'LIGHT'),
          root_objects: objects.map((o) => o.name),
        };
        return {
          content: [{ type: 'text', text: JSON.stringify(data) }],
        };
      }
      return { isError: true, content: [{ type: 'text', text: 'Unknown tool: ' + name }] };
    });

    const httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });
    await mcpServer.connect(httpTransport);

    const httpServer = http.createServer(async (req, res) => {
      await httpTransport.handleRequest(req, res);
    });

    await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
    const port = httpServer.address().port;
    const endpoint = `http://127.0.0.1:${port}/mcp`;

    try {
      const inspectRes = await inspectLiveReadOnlyRuntimeAsync({
        repoRoot: REPO_ROOT,
        runtimePath: 'path-1-host-b',
        endpoint,
      });
      assert.equal(inspectRes.ok, true);
      assert.equal(inspectRes.mutationsExecuted, 0);
      assert.equal(inspectRes.session.connection_status, 'connected');
      assert.equal(
        inspectRes.session.connection_lifecycle_state,
        'live_read_only_verified',
      );
      assert.equal(inspectRes.session.qualification_states.live_runtime_verified, true);
    } finally {
      await httpTransport.close();
      await new Promise((resolve) => httpServer.close(resolve));
    }
  });

  it('Group B.3 (Section 5): Transport security rejects shell wrappers, metacharacters, secret env leakage, non-TLS remote endpoints, mixed transports, and pagination loops', async () => {
    // 1. STDIO shell wrapper & metacharacter rejection
    for (const badCmd of ['sh', '/bin/bash', 'cmd.exe', 'powershell.exe', 'node; rm -rf /', 'python -c "import os"']) {
      const check = validateStdioCommandConfig({ command: badCmd, args: [] });
      assert.equal(check.valid, false, `Expected STDIO command '${badCmd}' to be rejected`);
    }
    const shellTrueCheck = validateStdioCommandConfig({
      command: process.execPath,
      args: ['server.js'],
      shell: true,
    });
    assert.equal(shellTrueCheck.valid, false);

    // 2. STDIO environment sanitization strips secrets
    const envCheck = validateStdioCommandConfig({
      command: process.execPath,
      args: ['server.js'],
      env: {
        PATH: '/usr/bin',
        ANTHROPIC_API_KEY: 'sk-ant-secret',
        OPENAI_API_KEY: 'sk-proj-secret',
        GITHUB_TOKEN: 'ghp_secret',
        BLENDOPS_SAFE_VAR: '1',
      },
    });
    assert.equal(envCheck.valid, true);
    assert.equal(envCheck.sanitizedEnv.PATH, '/usr/bin');
    assert.equal(envCheck.sanitizedEnv.BLENDOPS_SAFE_VAR, '1');
    assert.equal('ANTHROPIC_API_KEY' in envCheck.sanitizedEnv, false);
    assert.equal('OPENAI_API_KEY' in envCheck.sanitizedEnv, false);
    assert.equal('GITHUB_TOKEN' in envCheck.sanitizedEnv, false);

    // 3. Streamable HTTP non-TLS remote endpoint rejected when requireRemoteTls is enabled
    const nonTlsRemote = validateRuntimeTransportEndpoint('http://192.168.1.99:8080/mcp', {
      allowRemoteEndpoint: true,
      requireRemoteTls: true,
    });
    assert.equal(nonTlsRemote.valid, false);
    assert.match(nonTlsRemote.reason, /must use TLS/i);

    const tlsRemote = validateRuntimeTransportEndpoint('https://mcp.example.com:8443/mcp', {
      allowRemoteEndpoint: true,
      requireRemoteTls: true,
    });
    assert.equal(tlsRemote.valid, true);

    // 4. Mixed STDIO + HTTP configuration rejected with bridge_conflict
    await assert.rejects(
      () =>
        connectMcpRuntimeClient({
          repoRoot: REPO_ROOT,
          stdioCommand: process.execPath,
          endpoint: 'http://127.0.0.1:8765/mcp',
        }),
      (err) => err.connectionStatus === 'bridge_conflict',
    );

    // 5. Pagination loop & connection timeout fail closed and clean up subprocess
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p33-loop-'));
    try {
      const loopScript = createTempStdioMcpServerScript(tempDir, {
        paginationLoop: true,
      });
      await assert.rejects(
        () =>
          connectMcpRuntimeClient({
            repoRoot: REPO_ROOT,
            stdioCommand: process.execPath,
            stdioArgs: [loopScript],
            stdioCwd: tempDir,
          }),
        /pagination loop detected/i,
      );

      const hangScript = createTempStdioMcpServerScript(tempDir, {
        hangOnInit: true,
      });
      await assert.rejects(
        () =>
          connectMcpRuntimeClient({
            repoRoot: REPO_ROOT,
            stdioCommand: process.execPath,
            stdioArgs: [hangScript],
            stdioCwd: tempDir,
            connectTimeoutMs: 250,
          }),
        /timed out/i,
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Group C (Section 7): 4-part tool contract fingerprinting and JSON Schema safety checks detect drift and unsafe schemas', () => {
    const baseTool = {
      name: 'get_objects_summary',
      title: 'Get Objects Summary',
      description: 'Return read-only object summary.',
      inputSchema: {
        type: 'object',
        properties: { filter_type: { type: 'string' } },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        required: ['objects'],
        properties: { objects: { type: 'array' } },
      },
    };

    const fpBase = computeFullToolContractFingerprints(baseTool);
    const fpMetaChanged = computeFullToolContractFingerprints({
      ...baseTool,
      description: 'Return read-only object summary (updated phrasing).',
    });
    assert.equal(fpBase.input_schema_fingerprint, fpMetaChanged.input_schema_fingerprint);
    assert.equal(fpBase.output_schema_fingerprint, fpMetaChanged.output_schema_fingerprint);
    assert.notEqual(fpBase.metadata_fingerprint, fpMetaChanged.metadata_fingerprint);
    assert.notEqual(fpBase.combined_contract_fingerprint, fpMetaChanged.combined_contract_fingerprint);

    // External $ref rejected
    const extRefSafety = inspectJsonSchemaSafety({
      type: 'object',
      properties: {
        evil: { $ref: 'https://attacker.example.com/schema.json' },
      },
    });
    assert.equal(extRefSafety.valid, false);
    assert.match(extRefSafety.reason, /external \$ref/i);

    // Excessive nesting depth rejected
    let deepNode = { type: 'string' };
    for (let i = 0; i < 16; i += 1) {
      deepNode = { type: 'object', properties: { nested: deepNode } };
    }
    const deepSafety = inspectJsonSchemaSafety(deepNode, 10, 256);
    assert.equal(deepSafety.valid, false);
    assert.match(deepSafety.reason, /nesting depth/i);
  });

  it('Group D (Sections 8 & 9): CallToolResult validation and notifications/tools/list_changed invalidation & re-qualification', async () => {
    // 1. parseMcpCallToolResult tests
    const errRes = parseMcpCallToolResult({
      isError: true,
      content: [{ type: 'text', text: 'Failed with token sk-ant-api03-secret12345678901234567890' }],
    });
    assert.equal(errRes.ok, false);
    assert.equal(errRes.isError, true);
    assert.equal(errRes.secretsRedacted, true);
    assert.doesNotMatch(errRes.error, /sk-ant-api03-secret/);

    const binRes = parseMcpCallToolResult({
      isError: false,
      content: [{ type: 'audio', data: 'AAAA', mimeType: 'audio/wav' }],
    });
    assert.equal(binRes.ok, false);
    assert.match(binRes.error, /Unexpected non-text MCP content block/i);

    const outSchemaRes = parseMcpCallToolResult(
      {
        structuredContent: { objects: 'not-an-array' },
      },
      {
        outputSchema: {
          type: 'object',
          required: ['objects'],
          properties: { objects: { type: 'array' } },
        },
      },
    );
    assert.equal(outSchemaRes.ok, false);
    assert.match(outSchemaRes.error, /failed outputSchema validation/i);

    // 2. Real STDIO server notifications/tools/list_changed invalidates qualification until refreshAndRequalifyTools
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p33-notify-'));
    try {
      const serverScript = createTempStdioMcpServerScript(tempDir, {
        injectDynamicUnknownToolOnSecondList: true,
      });

      const client = await connectMcpRuntimeClient({
        repoRoot: REPO_ROOT,
        runtimePath: 'path-1-host-a',
        stdioCommand: process.execPath,
        stdioArgs: [serverScript],
        stdioCwd: tempDir,
      });

      try {
        assert.equal(client.staleQualification, false);
        await client.invokeToolAsync('get_blendfile_summary_missing_files', {});
        // Wait briefly for async notification delivery
        await new Promise((r) => setTimeout(r, 60));
        assert.equal(client.toolListChangedCount, 1);
        assert.equal(client.staleQualification, true);

        // Calling any tool while staleQualification is true must fail closed!
        await assert.rejects(
          () => client.invokeToolAsync('get_objects_summary', {}),
          /re-qualification required/i,
        );

        // Refresh tools and re-run session discovery; newly injected spoofed tool must fail closed
        await client.refreshAndRequalifyTools();
        assert.equal(client.staleQualification, false);
        const sessionAfterRefresh = discoverRuntimeSession({
          repoRoot: REPO_ROOT,
          runtimePath: 'path-1-host-a',
          liveTransportClient: client,
        });
        assert.equal(sessionAfterRefresh.connection_status, 'invalid_tool_schema');
        assert.equal(sessionAfterRefresh.qualification_states.tool_inventory_verified, false);
      } finally {
        await client.close();
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('Group E (Sections 10 & 12): Provenance vs identity separation, Path 1 conditional L2 render classification, and staged artifact / glTF-Validator gates', () => {
    // 1. Self-reported server identity alone never sets source_provenance_verified: true
    const provSelfReported = evaluateRuntimeProvenance(
      {
        addonOrServerIdentity: 'blender-mcp',
        runtimeVersion: '0.2.0',
        blenderVersion: '5.1.0',
      },
      'path-1-host-a',
      {
        toolInventoryVerified: true,
        schemaDriftDetected: false,
        processProvenanceVerified: false,
      },
    );
    assert.equal(provSelfReported.identity_claim_matches_expected, true);
    assert.equal(provSelfReported.process_provenance_verified, false);
    assert.equal(provSelfReported.source_provenance_verified, false);
    assert.equal(provSelfReported.runtime_compatibility_verified, true);

    // 2. Path 1 render_viewport_to_path and render_thumbnail_to_path are conditional and export_import_qualified is false
    const registryDoc = loadRegistryDoc();
    for (const renderToolName of ['render_viewport_to_path', 'render_thumbnail_to_path']) {
      const matEntry = registryDoc.upstream_tool_qualification_matrix.find(
        (m) => m.tool_name === renderToolName,
      );
      assert.ok(matEntry);
      assert.equal(matEntry.classification, 'conditional');
      assert.equal(matEntry.modifies_scene_state, true);
      assert.equal(matEntry.bounded_and_independently_verifiable, false);
      assert.ok(Array.isArray(matEntry.known_upstream_issues));
      assert.ok(matEntry.known_upstream_issues.length >= 1);
    }

    const path1UpstreamMock = createUpstreamRealityMockRuntime({
      runtimePath: 'path-1-host-a',
    });
    const path1Session = discoverRuntimeSession({
      repoRoot: REPO_ROOT,
      runtimePath: 'path-1-host-a',
      mockRuntime: path1UpstreamMock,
    });
    assert.equal(path1Session.qualification_states.read_only_qualified, true);
    assert.equal(path1Session.qualification_states.mutation_qualified, false);
    assert.equal(path1Session.qualification_states.export_import_qualified, false);
    assert.equal(path1Session.readiness_flags.conditional_export_available, true);
    assert.equal(path1Session.qualification_verdict, 'read_only_qualified');

    // 3. Staged artifact verification and Khronos glTF-Validator gate
    const tmpStageDir = fs.mkdtempSync(path.join(REPO_ROOT, 'dist', 'stage-test-'));
    try {
      const pngPath = path.join(tmpStageDir, 'render.png');
      // Invalid magic bytes rejected
      fs.writeFileSync(pngPath, Buffer.from('NOT_A_PNG_FILE'));
      const badPng = verifyStagedOutputArtifact({
        stagedPath: pngPath,
        targetOutputPath: pngPath,
        expectedFormat: 'png',
        repoRoot: REPO_ROOT,
      });
      assert.equal(badPng.valid, false);
      assert.equal(badPng.artifactStatus, 'Not Produced');

      // Valid PNG magic bytes accepted
      fs.writeFileSync(
        pngPath,
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]),
      );
      const goodPng = verifyStagedOutputArtifact({
        stagedPath: pngPath,
        targetOutputPath: pngPath,
        expectedFormat: 'png',
        repoRoot: REPO_ROOT,
      });
      assert.equal(goodPng.valid, true);
      assert.equal(goodPng.artifactStatus, 'Verified');

      // Valid GLB header with glTF-Validator errors fails verification; 0 errors reaches Verified
      const glbPath = path.join(tmpStageDir, 'model.glb');
      const glbHeader = Buffer.alloc(12);
      glbHeader.write('glTF', 0, 4, 'ascii');
      glbHeader.writeUInt32LE(2, 4);
      glbHeader.writeUInt32LE(12, 8);
      fs.writeFileSync(glbPath, glbHeader);

      const glbNoValidator = verifyStagedOutputArtifact({
        stagedPath: glbPath,
        targetOutputPath: glbPath,
        expectedFormat: 'glb',
        repoRoot: REPO_ROOT,
      });
      assert.equal(glbNoValidator.artifactStatus, 'Produced');

      const glbWithErrors = verifyStagedOutputArtifact({
        stagedPath: glbPath,
        targetOutputPath: glbPath,
        expectedFormat: 'glb',
        repoRoot: REPO_ROOT,
        gltfValidatorReport: { issues: { numErrors: 2, numWarnings: 1 } },
      });
      assert.equal(glbWithErrors.valid, false);
      assert.equal(glbWithErrors.artifactStatus, 'Not Produced');

      const glbClean = verifyStagedOutputArtifact({
        stagedPath: glbPath,
        targetOutputPath: glbPath,
        expectedFormat: 'glb',
        repoRoot: REPO_ROOT,
        gltfValidatorReport: { issues: { numErrors: 0, numWarnings: 0 } },
      });
      assert.equal(glbClean.valid, true);
      assert.equal(glbClean.artifactStatus, 'Verified');
    } finally {
      fs.rmSync(tmpStageDir, { recursive: true, force: true });
    }
  });

  it('Group F (Section 14): Standardized deterministic CLI exit codes (0..7) and runtime-connect / execution-inspect --live-read-only CLI subcommands', () => {
    assert.equal(CLI_EXIT_CODES.SUCCESS, 0);
    assert.equal(CLI_EXIT_CODES.CLI_USAGE_OR_VALIDATION_ERROR, 1);
    assert.equal(CLI_EXIT_CODES.RUNTIME_UNREACHABLE_OR_TRANSPORT_FAILURE, 2);
    assert.equal(CLI_EXIT_CODES.PROTOCOL_OR_VERSION_INCOMPATIBLE, 3);
    assert.equal(CLI_EXIT_CODES.TOOL_QUALIFICATION_OR_SCHEMA_DRIFT_FAILURE, 4);
    assert.equal(CLI_EXIT_CODES.OPERATION_BLOCKED_BY_CAPABILITY_OR_L3, 5);
    assert.equal(CLI_EXIT_CODES.PREFLIGHT_OR_CHECKPOINT_FAILURE, 6);
    assert.equal(CLI_EXIT_CODES.EXECUTION_OR_POSTCONDITION_OR_ROLLBACK_FAILURE, 7);

    // Exit code 0: healthy runtime connect
    const connectOk = runRuntimeAndExecutionCliSubcommand([
      'runtime',
      'connect',
      '--mock-runtime',
      'upstream_path_1',
      '--json',
    ]);
    assert.equal(connectOk.exitCode, 0);

    // Exit code 2: unreachable / invalid endpoint
    const connectUnreachable = runRuntimeAndExecutionCliSubcommand([
      'runtime',
      'connect',
      '--mock-runtime',
      'unreachable',
      '--json',
    ]);
    assert.equal(connectUnreachable.exitCode, 2);

    // Exit code 3: protocol incompatible
    const connectProtoErr = runRuntimeAndExecutionCliSubcommand([
      'runtime',
      'connect',
      '--mock-runtime',
      'protocol_incompatible',
      '--json',
    ]);
    assert.equal(connectProtoErr.exitCode, 3);

    // Exit code 4: schema drift / spoofed tool
    const connectDrift = runRuntimeAndExecutionCliSubcommand([
      'runtime',
      'connect',
      '--mock-runtime',
      'schema_drift',
      '--json',
    ]);
    assert.equal(connectDrift.exitCode, 4);

    // Exit code 5: rejected by capability / L3 boundary
    assert.equal(
      computeRuntimeCliExitCode({
        subcommand: 'execution-report',
        ledger: { lifecycle_status: 'rejected' },
      }),
      5,
    );

    // Exit code 6: preflight blocked
    const preflightBlocked = runRuntimeAndExecutionCliSubcommand([
      'execution',
      'preflight',
      '--mock-runtime',
      'upstream_path_1',
      '--operation',
      'op.mutate.camera-transform-and-lens',
      '--detailed-exit-codes',
      '--json',
    ]);
    assert.equal(preflightBlocked.exitCode, 6);

    // Exit code 7: execution / postcondition / rollback failure
    const execRollback = runRuntimeAndExecutionCliSubcommand([
      'execution',
      'report',
      '--mock-runtime',
      'postcondition_mismatch',
      '--detailed-exit-codes',
      '--json',
    ]);
    assert.equal(execRollback.exitCode, 7);

    // execution inspect --live-read-only
    const inspectL0 = runRuntimeAndExecutionCliSubcommand([
      'execution',
      'inspect',
      '--live-read-only',
      '--mock-runtime',
      'upstream_path_1',
      '--json',
    ]);
    assert.equal(inspectL0.exitCode, 0);
    const parsedLedger = JSON.parse(inspectL0.report);
    assert.equal(parsedLedger.lifecycle_status, 'committed');
    assert.equal(parsedLedger.is_mock_runtime, true);
    assert.equal(parsedLedger.truth_states.runtime_status, 'Attempted');
  });

  it('Group G (Section 16): Project-local .blendops parity from an unrelated working directory preserves Phase 3.3 contracts', () => {
    const tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p33-proj-'));
    const unrelatedCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p33-cwd-'));
    const prevCwd = process.cwd();
    try {
      runInstaller([
        'install',
        '--dry-run',
        '--target',
        'claude-code',
        '--project',
        tmpProject,
      ]);
      runInstaller([
        'install',
        '--write',
        '--target',
        'claude-code',
        '--project',
        tmpProject,
      ]);

      process.chdir(unrelatedCwd);
      const connectRes = runRuntimeAndExecutionCliSubcommand([
        'runtime',
        'connect',
        '--project-dir',
        tmpProject,
        '--mock-runtime',
        'upstream_path_1',
        '--json',
      ]);
      assert.equal(connectRes.exitCode, 0);
      const sessionObj = JSON.parse(connectRes.report);
      assert.equal(sessionObj.qualification_verdict, 'read_only_qualified');
      assert.equal(sessionObj.qualification_states.export_import_qualified, false);
      assert.equal(sessionObj.connection_lifecycle_state, 'contract_qualified');
    } finally {
      process.chdir(prevCwd);
      fs.rmSync(tmpProject, { recursive: true, force: true });
      fs.rmSync(unrelatedCwd, { recursive: true, force: true });
    }
  });

  it('Group H: Multi-provider installer supports all coding-agent targets with conservative BLENDOPS.md fallback and Anthropic skill-creator frontmatter compliance', () => {
    const tmpProviderDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p33-providers-'));
    try {
      for (const providerTarget of [
        'windsurf',
        'cline',
        'roo-code',
        'aider',
        'amazon-q-developer',
        'universal',
        'kiro-cli',
        'roo',
        'gemini-cli',
      ]) {
        const proj = path.join(tmpProviderDir, providerTarget);
        fs.mkdirSync(proj, { recursive: true });
        const dryRes = runInstaller(['--dry-run', '--target', providerTarget, '--project', proj]);
        assert.equal(dryRes.ok, true);
        const writeRes = runInstaller(['--write', '--target', providerTarget, '--project', proj]);
        assert.equal(writeRes.ok, true);
        assert.equal(writeRes.targetSelected, providerTarget);
        assert.equal(writeRes.runtimeStatus, 'Not Run');
        assert.equal(writeRes.artifactStatus, 'Not Produced');
        assert.ok(fs.existsSync(path.join(proj, 'BLENDOPS.md')));
        assert.ok(writeRes.limitations.some((l) => l.includes('linked-only')));
      }
    } finally {
      fs.rmSync(tmpProviderDir, { recursive: true, force: true });
    }
  });

  it('Group I: skills.sh / vercel-labs/skills ecosystem integration — skills.sh.json validation, Lockfile v2 computedHash test vectors, and --with-skills-dir + --skill transactional install & rollback', () => {
    // 1. Validate root skills.sh.json covers all 48 canonical skills across 8 domain groupings
    const shValidation = validateSkillsShConfig(REPO_ROOT);
    assert.equal(
      shValidation.valid,
      true,
      `Expected skills.sh.json to be valid, got: ${shValidation.errors.join('; ')}`,
    );
    assert.equal(shValidation.groupCount, 8);
    assert.equal(shValidation.skillCount, 48);

    // 2. Verify computeSkillEntriesLockHash & computeSkillFolderLockHash against official vercel-labs/skills Lockfile v2 test vectors
    assert.equal(
      computeSkillEntriesLockHash([]),
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    assert.equal(
      computeSkillEntriesLockHash([{ relPath: 'SKILL.md', content: '# hi\n' }]),
      '93c36952d8843b33e68ae970ebabcc03e1687c9bb0dd1ecaf357060318952f55',
    );
    assert.equal(
      computeSkillEntriesLockHash([
        { relPath: 'docs/b.md', content: 'b\n' },
        { relPath: 'SKILL.md', content: 'a\r\n' }, // CRLF normalized to LF for text
        { relPath: 'metadata.json', content: '{"ignored":true}\n' }, // excluded per spec
        { relPath: '__pycache__/foo.pyc', content: 'ignored' }, // excluded per spec
      ]),
      'b22c4d22aa319d2924312fa18fcbfedc88fa89c74dbd8f298c683e1caf7b7f24',
    );

    // 3. Verify buildSkillsLockJsonV2 across all 48 canonical BlendOps skills
    const fullLock = buildSkillsLockJsonV2(REPO_ROOT);
    assert.equal(fullLock.version, 2);
    assert.equal(Object.keys(fullLock.skills).length, 48);
    for (const [slug, entry] of Object.entries(fullLock.skills)) {
      assert.equal(entry.source, 'ThanhNguyxnOrg/blendops');
      assert.equal(entry.sourceType, 'github');
      assert.equal(entry.skillPath, `skills/${slug}/SKILL.md`);
      assert.match(entry.computedHash, /^[a-f0-9]{64}$/);
    }

    // 4. Verify --with-skills-dir (and --skills-sh) + --skill across multiple skills.sh agent providers with full rollback
    const tmpSkillsShDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p33-skillssh-'));
    try {
      const providerChecks = [
        { target: 'universal', expectedDir: '.agents/skills' },
        { target: 'claude-code', expectedDir: '.claude/skills' },
        { target: 'windsurf', expectedDir: '.windsurf/skills' },
        { target: 'roo', expectedDir: '.roo/skills' },
        { target: 'kiro-cli', expectedDir: '.kiro/skills' },
      ];

      for (const { target, expectedDir } of providerChecks) {
        assert.equal(AGENT_SKILLS_SH_DIRECTORY_MAP[target], expectedDir);
        const proj = path.join(tmpSkillsShDir, target);
        fs.mkdirSync(proj, { recursive: true });

        const dryRes = runInstaller([
          'install',
          '--dry-run',
          '--target',
          target,
          '--project',
          proj,
          '--with-skills-dir',
          '--skill',
          'camera-composition,scene-readiness',
        ]);
        assert.equal(dryRes.ok, true);
        assert.ok(
          dryRes.filesCreated.includes(`${expectedDir}/camera-composition/SKILL.md`),
          `Expected ${expectedDir}/camera-composition/SKILL.md in dry-run plan`,
        );
        assert.ok(dryRes.filesCreated.includes('skills-lock.json'));

        const writeRes = runInstaller([
          'install',
          '--write',
          '--target',
          target,
          '--project',
          proj,
          '--with-skills-dir',
          '--skill',
          'camera-composition,scene-readiness',
        ]);
        assert.equal(writeRes.ok, true);
        assert.equal(writeRes.runtimeStatus, 'Not Run');
        assert.equal(writeRes.artifactStatus, 'Not Produced');

        const installedSkillDir = path.join(proj, expectedDir, 'camera-composition');
        assert.ok(fs.existsSync(path.join(installedSkillDir, 'SKILL.md')));
        const lockJson = JSON.parse(fs.readFileSync(path.join(proj, 'skills-lock.json'), 'utf8'));
        assert.equal(lockJson.version, 2);
        assert.deepEqual(Object.keys(lockJson.skills), ['camera-composition', 'scene-readiness']);
        assert.equal(
          computeSkillFolderLockHash(installedSkillDir),
          lockJson.skills['camera-composition'].computedHash,
          'Installed skill folder computedHash must match skills-lock.json v2 entry byte-for-byte',
        );

        // Verify clean rollback removes skills-lock.json and the installed skill directories
        const rbRes = runInstaller(['rollback', '--project', proj]);
        assert.equal(rbRes.ok, true);
        assert.equal(fs.existsSync(path.join(proj, 'skills-lock.json')), false);
        assert.equal(fs.existsSync(installedSkillDir), false);
      }

      // Negative test: unknown --skill slug fails closed
      const badProj = path.join(tmpSkillsShDir, 'bad-skill');
      fs.mkdirSync(badProj, { recursive: true });
      assert.throws(
        () =>
          runInstaller([
            'install',
            '--dry-run',
            '--target',
            'universal',
            '--project',
            badProj,
            '--with-skills-dir',
            '--skill',
            'non-existent-blender-skill',
          ]),
        /Unknown canonical skill 'non-existent-blender-skill'/,
      );
    } finally {
      fs.rmSync(tmpSkillsShDir, { recursive: true, force: true });
    }
  });
});


