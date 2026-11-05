#!/usr/bin/env node
/**
 * BlendOps — Phase 3 (Phase 16 Suite): Blender Production Layer & Safe Runtime Integration
 *
 * Covers all 21 required deterministic automated scenarios plus the real-runtime smoke check gate:
 *  1. Runtime discovery across supported paths (`path-1-host-a`, `path-1-host-b`, `path-2-community`, `cli-appendix`).
 *  2. Unknown runtime path rejection.
 *  3. Version incompatibility detection (Blender 5.0.0 on Path 1 5.1+ floor, Blender 3.6.0 valid on Path 2, Blender 2.93 on Path 2 3.0+ floor).
 *  4. Missing tool detection (`missing_required_tools`).
 *  5. Invalid tool schema / malformed tool response detection (`invalid_tool_schema`).
 *  6. Bridge conflict detection (`bridge_conflict`, including concurrent Path 1 + Path 2 tools on the same Blender instance).
 *  7. Host-context-only vs executable runtime distinction (`host_context_only`).
 *  8. Config-file-only non-connection enforcement (never reports `connected` from config alone; zero discovery mutations).
 *  9. Read-only (`L0`) inspection operation execution and postcondition verification.
 * 10. Capability-policy and allowlist enforcement (unknown op, blocked L3 arbitrary Python/shell, unapproved L2 export).
 * 11. Pre-mutation `.blend` backup failure handling (fails closed before any mutation executes).
 * 12. Pre-mutation `.blend` backup SHA-256 mismatch handling (fails closed before any mutation executes).
 * 13. Mutation timeout handling with strictly zero blind retries (`getMutationCallCount() === 1`).
 * 14. Ambiguous mutation result handling with automatic rollback.
 * 15. Duplicate / idempotency key collision handling within an execution session (`skipped_duplicate`).
 * 16. Postcondition failure detection after mutation and automatic rollback.
 * 17. Rollback restoration success (`rollback_verified` + restored scene verification).
 * 18. Rollback failure & unverified handling (`rollback_failed` / `rollback_unverified` with manual recovery guidance).
 * 19. Partial multi-step execution & rollback (Step 1 camera mutation succeeds, Step 2 light mutation fails -> rollback restores Step 1 camera state).
 * 20. Evidence packet & operation ledger generation, schema validation, static/mock fixture promotion gate, and secret redaction.
 * 21. Project-local runtime catalog/config resolution, CLI commands (`runtime doctor|inspect|capabilities`, `operation list|validate`, `execution preflight|report|inspect`) in human + `--json` modes.
 * 22. Phase 3D End-to-End Safe Blender Production Vertical Slice (`product-hero-sneaker` SceneSpec -> ExecutionPlan -> Runtime Readiness -> Pre-Mutation Checkpoint -> Camera & Light Mutations -> Readback & Postconditions -> Evidence Report) across Path 1 and Path 2 mock runtimes, plus Real-Runtime Smoke Check Gate (`Not Run` in container without Blender).
 */

import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

import {
  RUNTIME_CLI_SUBCOMMANDS,
  RECOGNIZED_RUNTIME_PATHS,
  resolveRuntimeGovernancePaths,
  discoverRuntimeSession,
  validateRuntimeOperationsRegistry,
  listRuntimeOperations,
  getRuntimeOperation,
  runExecutionPreflight,
  executeTypedOperationSequence,
  runProductSceneVerticalSlice,
  createMockMcpRuntime,
  redactSensitiveData,
  runRuntimeAndExecutionCliSubcommand,
  runInstaller,
  compileExecutionPlan,
} from './install-skills.mjs';
import { validateEvidencePacket } from './validate-evidence-packet.mjs';
import { execNpmTool } from './test-phase11.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function loadSchemaValidator(schemaRelPath) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, schemaRelPath), 'utf8'));
  return ajv.compile(schema);
}

describe('Phase 3 (Suite 16) — Blender Production Layer & Safe Runtime Integration', () => {
  let suiteTmpDir;
  let validateRuntimeSessionSchema;
  let validateRuntimeOperationsSchema;
  let validateOperationLedgerSchema;

  before(() => {
    suiteTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-p16-test-'));
    validateRuntimeSessionSchema = loadSchemaValidator('schemas/runtime-session.schema.json');
    validateRuntimeOperationsSchema = loadSchemaValidator('schemas/runtime-operations.schema.json');
    validateOperationLedgerSchema = loadSchemaValidator('schemas/operation-execution-ledger.schema.json');
  });

  after(() => {
    if (suiteTmpDir && fs.existsSync(suiteTmpDir)) {
      fs.rmSync(suiteTmpDir, { recursive: true, force: true });
    }
  });

  test('Scenario 1: Runtime discovery across supported paths (Path 1 Option A/B, Path 2, CLI Appendix) with zero discovery mutations', () => {
    assert.ok(RECOGNIZED_RUNTIME_PATHS['path-1-host-a']);
    assert.ok(RECOGNIZED_RUNTIME_PATHS['path-1-host-b']);
    assert.ok(RECOGNIZED_RUNTIME_PATHS['path-2-community']);
    assert.ok(RECOGNIZED_RUNTIME_PATHS['cli-appendix']);

    const p1A = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      blenderVersion: '5.1.0',
      tempDir: path.join(suiteTmpDir, 'rt-1a'),
    });
    const session1A = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p1A });
    assert.equal(validateRuntimeSessionSchema(session1A), true, JSON.stringify(validateRuntimeSessionSchema.errors));
    assert.equal(session1A.connection_status, 'connected');
    assert.equal(session1A.runtime_path, 'path-1-host-a');
    assert.equal(session1A.discovery_mutations_executed, 0);
    assert.equal(session1A.readiness_flags.read_only_available, true);
    assert.equal(session1A.readiness_flags.mutation_available, true);
    assert.equal(session1A.readiness_flags.backup_supported, true);
    assert.equal(session1A.readiness_flags.restore_supported, true);
    assert.equal(p1A.getMutationCallCount(), 0);

    const p1B = createMockMcpRuntime({
      runtimePath: 'path-1-host-b',
      blenderVersion: '5.2.0',
      tempDir: path.join(suiteTmpDir, 'rt-1b'),
    });
    const session1B = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p1B });
    assert.equal(validateRuntimeSessionSchema(session1B), true);
    assert.equal(session1B.connection_status, 'connected');
    assert.equal(session1B.runtime_path, 'path-1-host-b');
    assert.equal(session1B.discovery_mutations_executed, 0);

    const p2 = createMockMcpRuntime({
      runtimePath: 'path-2-community',
      blenderVersion: '4.2.3',
      tempDir: path.join(suiteTmpDir, 'rt-2'),
    });
    const session2 = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p2 });
    assert.equal(validateRuntimeSessionSchema(session2), true);
    assert.equal(session2.connection_status, 'connected');
    assert.equal(session2.runtime_path, 'path-2-community');
    assert.equal(session2.discovery_mutations_executed, 0);
    assert.equal(session2.readiness_flags.read_only_available, true);
    assert.equal(session2.readiness_flags.mutation_available, true);

    const cliSession = discoverRuntimeSession({
      repoRoot: ROOT,
      runtimePath: 'cli-appendix',
    });
    assert.equal(validateRuntimeSessionSchema(cliSession), true);
    assert.equal(cliSession.connection_status, 'configured_unreachable');
    assert.equal(cliSession.discovery_mutations_executed, 0);
  });

  test('Scenario 2: Unknown runtime path rejection fails closed', () => {
    assert.throws(
      () =>
        discoverRuntimeSession({
          repoRoot: ROOT,
          runtimePath: 'custom-blendops-daemon-mcp',
        }),
      /Unsupported or unrecognized runtime path/,
    );
  });

  test('Scenario 3: Version incompatibility detection enforces Blender 5.1+ floor on Path 1 and 3.0+ floor on Path 2 without cross-applying 5.1+ to Path 2', () => {
    // Path 1 with Blender 5.0.0 -> version_unsupported
    const p1Old = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      blenderVersion: '5.0.0',
      tempDir: path.join(suiteTmpDir, 'rt-1-old'),
    });
    const s1Old = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p1Old });
    assert.equal(validateRuntimeSessionSchema(s1Old), true);
    assert.equal(s1Old.connection_status, 'version_unsupported');
    assert.equal(s1Old.readiness_flags.read_only_available, false);
    assert.equal(s1Old.readiness_flags.mutation_available, false);

    // Path 2 with Blender 3.6.0 -> connected (5.1+ floor is NOT applied to Path 2)
    const p2Valid = createMockMcpRuntime({
      runtimePath: 'path-2-community',
      blenderVersion: '3.6.0',
      tempDir: path.join(suiteTmpDir, 'rt-2-36'),
    });
    const s2Valid = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p2Valid });
    assert.equal(s2Valid.connection_status, 'connected');
    assert.equal(s2Valid.readiness_flags.read_only_available, true);

    // Path 2 with Blender 2.93.0 -> version_unsupported
    const p2Old = createMockMcpRuntime({
      runtimePath: 'path-2-community',
      scenario: 'unsupported_version',
      tempDir: path.join(suiteTmpDir, 'rt-2-old'),
    });
    const s2Old = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p2Old });
    assert.equal(s2Old.connection_status, 'version_unsupported');
    assert.equal(s2Old.readiness_flags.read_only_available, false);
  });

  test('Scenario 4: Missing required tool detection reports missing_required_tools and blocks execution', () => {
    const p1Missing = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'missing_tools',
      tempDir: path.join(suiteTmpDir, 'rt-missing-tools'),
    });
    const session = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p1Missing });
    assert.equal(validateRuntimeSessionSchema(session), true);
    assert.equal(session.connection_status, 'missing_required_tools');
    assert.equal(session.readiness_flags.read_only_available, false);
    assert.equal(session.readiness_flags.mutation_available, false);
  });

  test('Scenario 5: Invalid tool schema detection reports invalid_tool_schema and blocks execution', () => {
    const p1InvalidSchema = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'invalid_tool_schema',
      tempDir: path.join(suiteTmpDir, 'rt-invalid-schema'),
    });
    const session = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p1InvalidSchema });
    assert.equal(validateRuntimeSessionSchema(session), true);
    assert.equal(session.connection_status, 'invalid_tool_schema');
    assert.ok(session.rejected_or_ambiguous_tools.length >= 1);
    assert.equal(session.readiness_flags.read_only_available, false);
    assert.equal(session.readiness_flags.mutation_available, false);
  });

  test('Scenario 6: Bridge conflict detection catches dual Path 1 + Path 2 tools active on the same Blender instance', () => {
    const p1Conflict = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'bridge_conflict',
      tempDir: path.join(suiteTmpDir, 'rt-bridge-conflict'),
    });
    const session = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p1Conflict });
    assert.equal(validateRuntimeSessionSchema(session), true);
    assert.equal(session.connection_status, 'bridge_conflict');
    assert.equal(session.provenance.single_bridge_verified, false);
    assert.equal(session.readiness_flags.read_only_available, false);
    assert.equal(session.readiness_flags.mutation_available, false);
  });

  test('Scenario 7: Host-context-only vs executable runtime distinction', () => {
    const p1HostContext = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'host_context_only',
      tempDir: path.join(suiteTmpDir, 'rt-host-ctx'),
    });
    const session = discoverRuntimeSession({ repoRoot: ROOT, mockRuntime: p1HostContext });
    assert.equal(validateRuntimeSessionSchema(session), true);
    assert.equal(session.connection_status, 'host_context_only');
    assert.equal(session.readiness_flags.read_only_available, false);
    assert.equal(session.readiness_flags.mutation_available, false);
    assert.equal(session.truth_states.runtime_status, 'Not Run');
  });

  test('Scenario 8: Config-file-only non-connection enforcement — inspecting a config file alone NEVER reports connected', () => {
    const cfgPath = path.join(suiteTmpDir, 'runtime-config.json');
    fs.writeFileSync(
      cfgPath,
      JSON.stringify({
        runtime_path: 'path-1-host-a',
        host_identity: 'Claude Desktop',
        blender_version: '5.1.0',
        connection_status: 'connected',
      }),
    );
    const session = discoverRuntimeSession({
      repoRoot: ROOT,
      configPath: cfgPath,
    });
    assert.equal(validateRuntimeSessionSchema(session), true);
    assert.equal(session.connection_status, 'configured_unreachable');
    assert.notEqual(session.connection_status, 'connected');
    assert.equal(session.provenance.discovery_mode, 'config_file_inspection_only');
    assert.equal(session.readiness_flags.read_only_available, false);
    assert.equal(session.readiness_flags.mutation_available, false);
    assert.equal(session.discovery_mutations_executed, 0);
  });

  test('Scenario 9: Typed Operation Registry validation & L0 read-only inspection execution', () => {
    const regCheck = validateRuntimeOperationsRegistry(ROOT);
    assert.equal(regCheck.valid, true, regCheck.errors.join('; '));
    assert.equal(regCheck.operation_count, 18);
    assert.equal(regCheck.counts_by_tier.L0, 11);
    assert.equal(regCheck.counts_by_tier.L1, 4);
    assert.equal(regCheck.counts_by_tier.L2, 3);

    const rawRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/runtime-operations.json'), 'utf8'));
    assert.equal(validateRuntimeOperationsSchema(rawRegistry), true);
    assert.equal(rawRegistry.blocked_arbitrary_interfaces.length, 3);

    // Execute L0 read-only operations against mock runtime
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      blenderVersion: '5.1.0',
      tempDir: path.join(suiteTmpDir, 'rt-l0'),
    });
    const execRes = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      operations: [
        {
          operation_id: 'op.inspect.blendfile-summary',
          skill_id: 'scene-readiness',
          input: { include_datablock_counts: true },
        },
        {
          operation_id: 'op.inspect.object-list',
          skill_id: 'scene-readiness',
          input: { filter_type: 'ALL' },
        },
        {
          operation_id: 'op.inspect.camera-and-lighting',
          skill_id: 'camera-composition',
          input: { camera_name: 'Camera', light_names: ['KeyLight', 'FillLight', 'RimLight'] },
        },
      ],
    });
    assert.equal(execRes.ok, true);
    assert.equal(validateOperationLedgerSchema(execRes.ledger), true, JSON.stringify(validateOperationLedgerSchema.errors));
    assert.equal(execRes.ledger.lifecycle_status, 'committed');
    assert.equal(execRes.ledger.operation_attempts.length, 3);
    assert.equal(execRes.ledger.checkpoint_record, null); // L0 requires no checkpoint and performs 0 mutations
    assert.equal(mockRuntime.getMutationCallCount(), 0);
  });

  test('Scenario 10: Capability-policy and allowlist enforcement blocks unknown operations, blocked L3 operations, and unapproved L2 exports', () => {
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      blenderVersion: '5.1.0',
      tempDir: path.join(suiteTmpDir, 'rt-10'),
    });

    // 10a. Blocked L3 arbitrary Python operation
    const blockedRes = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      operations: [
        {
          operation_id: 'op.blocked.arbitrary-python',
          skill_id: 'scene-blockout-plan',
          input: { code: 'import bpy; bpy.ops.wm.read_factory_settings()' },
        },
      ],
    });
    assert.equal(blockedRes.ok, false);
    assert.equal(blockedRes.ledger.lifecycle_status, 'blocked');
    assert.equal(blockedRes.ledger.preflight_result.passed, false);
    assert.equal(mockRuntime.getMutationCallCount(), 0);

    // 10b. Unknown operation ID
    const unknownRes = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      operations: [
        {
          operation_id: 'op.mutate.unregistered-geometry-nodes',
          skill_id: 'scene-blockout-plan',
          input: {},
        },
      ],
    });
    assert.equal(unknownRes.ok, false);
    assert.equal(unknownRes.ledger.lifecycle_status, 'blocked');
    assert.equal(unknownRes.ledger.preflight_result.operation_allowlisted, false);

    // 10c. L2 export without L2 granted tier or export tools enabled
    const unapprovedExport = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.export.glb-asset',
          skill_id: 'glb-web-handoff',
          input: {
            output_path: path.join(suiteTmpDir, 'out.glb'),
            export_format: 'GLB',
          },
        },
      ],
    });
    assert.equal(unapprovedExport.ok, false);
    assert.equal(unapprovedExport.ledger.lifecycle_status, 'blocked');
  });

  test('Scenario 11: Pre-mutation .blend backup failure blocks L1 mutation fail-closed', () => {
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'backup_failure',
      tempDir: path.join(suiteTmpDir, 'rt-backup-fail'),
    });
    const res = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          input: {
            camera_name: 'Camera',
            location: [0, -3.2, 1.4],
            rotation_euler_deg: [72, 0, 0],
            focal_length_mm: 85,
          },
        },
      ],
    });
    assert.equal(res.ok, false);
    assert.equal(validateOperationLedgerSchema(res.ledger), true);
    assert.equal(res.ledger.lifecycle_status, 'blocked');
    assert.equal(res.ledger.preflight_result.backup_gate_ready, false);
    assert.equal(mockRuntime.getMutationCallCount(), 0);
  });

  test('Scenario 12: Pre-mutation .blend backup SHA-256 mismatch blocks L1 mutation fail-closed', () => {
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'backup_sha_mismatch',
      tempDir: path.join(suiteTmpDir, 'rt-backup-sha'),
    });
    const res = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          input: {
            camera_name: 'Camera',
            location: [0, -3.2, 1.4],
            rotation_euler_deg: [72, 0, 0],
            focal_length_mm: 85,
          },
        },
      ],
    });
    assert.equal(res.ok, false);
    assert.equal(validateOperationLedgerSchema(res.ledger), true);
    assert.equal(res.ledger.lifecycle_status, 'blocked');
    assert.ok(res.ledger.preflight_result.blocking_reasons.some((r) => r.includes('Checkpoint SHA-256 verification failed')));
    assert.equal(mockRuntime.getMutationCallCount(), 0);
  });

  test('Scenario 13: Mutation timeout performs zero blind retries and triggers verified rollback', () => {
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'mutation_timeout',
      tempDir: path.join(suiteTmpDir, 'rt-timeout'),
    });
    const res = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          input: {
            camera_name: 'Camera',
            location: [0, -3.2, 1.4],
            rotation_euler_deg: [72, 0, 0],
            focal_length_mm: 85,
          },
        },
      ],
    });
    assert.equal(res.ok, false);
    assert.equal(validateOperationLedgerSchema(res.ledger), true);
    assert.equal(res.ledger.operation_attempts[0].status, 'attempted');
    assert.equal(res.ledger.operation_attempts[0].tool_result.timeout_no_blind_retry, true);
    assert.equal(res.ledger.lifecycle_status, 'rollback_verified');
    assert.equal(res.ledger.rollback_summary.triggered, true);
    assert.equal(res.ledger.rollback_summary.status, 'rollback_verified');
    // Exactly 1 mutation attempt, 0 blind retries
    assert.equal(mockRuntime.getMutationCallCount(), 1);
  });

  test('Scenario 14: Ambiguous mutation result is rejected without blind retry and rolled back cleanly', () => {
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'ambiguous_mutation_result',
      tempDir: path.join(suiteTmpDir, 'rt-ambiguous'),
    });
    const res = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          input: {
            camera_name: 'Camera',
            location: [0, -3.2, 1.4],
            rotation_euler_deg: [72, 0, 0],
            focal_length_mm: 85,
          },
        },
      ],
    });
    assert.equal(res.ok, false);
    assert.equal(res.ledger.operation_attempts[0].status, 'failed');
    assert.equal(res.ledger.lifecycle_status, 'rollback_verified');
    assert.equal(mockRuntime.getMutationCallCount(), 1);
  });

  test('Scenario 15: Duplicate idempotency key within an execution session is skipped safely without re-mutating', () => {
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      tempDir: path.join(suiteTmpDir, 'rt-idemp'),
    });
    const identicalStep = {
      operation_id: 'op.mutate.camera-transform-and-lens',
      skill_id: 'camera-composition',
      input: {
        camera_name: 'Camera',
        location: [0, -3.2, 1.4],
        rotation_euler_deg: [72, 0, 0],
        focal_length_mm: 85,
      },
    };
    const res = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      grantedTier: 'L1',
      operations: [identicalStep, identicalStep],
    });
    assert.equal(res.ok, true);
    assert.equal(res.ledger.operation_attempts[0].status, 'committed');
    assert.equal(res.ledger.operation_attempts[1].status, 'skipped_duplicate');
    assert.equal(res.ledger.operation_attempts[0].idempotency_key, res.ledger.operation_attempts[1].idempotency_key);
    assert.equal(mockRuntime.getMutationCallCount(), 1);
  });

  test('Scenario 16 & 17: Postcondition failure after mutation triggers automatic rollback and verifies restored scene state', () => {
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'postcondition_mismatch',
      tempDir: path.join(suiteTmpDir, 'rt-postcond'),
    });
    const initialFocal = mockRuntime.getSceneState().objects.find((o) => o.name === 'Camera').focal_length_mm;
    assert.equal(initialFocal, 50);

    const res = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          input: {
            camera_name: 'Camera',
            location: [0, -3.2, 1.4],
            rotation_euler_deg: [72, 0, 0],
            focal_length_mm: 85,
          },
        },
      ],
    });
    assert.equal(res.ok, false);
    assert.equal(res.ledger.operation_attempts[0].status, 'failed');
    assert.equal(res.ledger.operation_attempts[0].postcondition_result.verified, false);
    assert.equal(res.ledger.lifecycle_status, 'rollback_verified');
    assert.equal(res.ledger.rollback_summary.status, 'rollback_verified');
    assert.equal(res.ledger.rollback_summary.restored_sha256_verified, true);
    assert.equal(res.ledger.rollback_summary.scene_readback_verified, true);

    const restoredFocal = mockRuntime.getSceneState().objects.find((o) => o.name === 'Camera').focal_length_mm;
    assert.equal(restoredFocal, 50);
  });

  test('Scenario 18: Rollback failure handling surfaces explicit manual recovery guidance and preserved checkpoint path', () => {
    const mockFailRollback = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'rollback_failure',
      tempDir: path.join(suiteTmpDir, 'rt-rbfail'),
    });
    const resFail = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime: mockFailRollback,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.light-parameters',
          skill_id: 'lighting-material-plan',
          input: {
            light_name: 'KeyLight',
            energy_watts: 350,
            color_rgb: [1.0, 0.96, 0.92],
          },
        },
      ],
    });
    assert.equal(resFail.ok, false);
    assert.equal(resFail.ledger.lifecycle_status, 'rollback_failed');
    assert.equal(resFail.ledger.rollback_summary.status, 'rollback_failed');
    assert.match(resFail.ledger.rollback_summary.recovery_guidance, /manually open the preserved pre-mutation backup/i);
  });

  test('Scenario 19: Partial multi-step execution & rollback restores earlier committed mutations when a later step fails', () => {
    const mockRuntime = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      scenario: 'partial_multi_step_failure',
      tempDir: path.join(suiteTmpDir, 'rt-partial'),
    });
    const res = executeTypedOperationSequence({
      repoRoot: ROOT,
      mockRuntime,
      grantedTier: 'L1',
      operations: [
        {
          operation_id: 'op.mutate.camera-transform-and-lens',
          skill_id: 'camera-composition',
          input: {
            camera_name: 'Camera',
            location: [0, -3.2, 1.4],
            rotation_euler_deg: [72, 0, 0],
            focal_length_mm: 85,
          },
        },
        {
          operation_id: 'op.mutate.light-parameters',
          skill_id: 'lighting-material-plan',
          input: {
            light_name: 'KeyLight',
            energy_watts: 350,
            color_rgb: [1.0, 0.96, 0.92],
          },
        },
      ],
    });
    assert.equal(res.ok, false);
    assert.equal(res.ledger.operation_attempts[0].status, 'committed');
    assert.equal(res.ledger.operation_attempts[1].status, 'failed');
    assert.equal(res.ledger.lifecycle_status, 'rollback_verified');
    assert.equal(res.ledger.rollback_summary.triggered, true);
    assert.equal(res.ledger.rollback_summary.status, 'rollback_verified');

    // Step 1's committed camera change (85mm) must have been rolled back to 50mm!
    const cam = mockRuntime.getSceneState().objects.find((o) => o.name === 'Camera');
    assert.equal(cam.focal_length_mm, 50);
  });

  test('Scenario 20: Secret redaction strips credentials, tokens, and API keys from runtime diagnostics and ledgers', () => {
    const rawPayload = {
      authorization: 'Bearer sk-ant-api03-secretTokenValue1234567890',
      api_key: 'AIzaSySecretGoogleKeyValue987654321',
      nested: {
        message: 'Connected with token=ghp_1234567890abcdefghijklmnopqrstuvwx and Bearer secret_jwt_token_value',
      },
    };
    const { redacted, secretsRedacted } = redactSensitiveData(rawPayload);
    assert.equal(secretsRedacted, true);
    assert.equal(redacted.authorization, '[REDACTED]');
    assert.equal(redacted.api_key, '[REDACTED]');
    assert.doesNotMatch(redacted.nested.message, /ghp_1234567890/);
    assert.doesNotMatch(redacted.nested.message, /secret_jwt_token_value/);
    assert.match(redacted.nested.message, /\[REDACTED\]/);
  });

  test('Scenario 21: Project-local runtime catalog/config resolution and CLI commands (human + --json)', () => {
    const projDir = path.join(suiteTmpDir, 'local-project');
    fs.mkdirSync(projDir, { recursive: true });

    // Install BlendOps project-locally via dry-run + write
    const dryRes = runInstaller(['install', '--target', 'generic-project', '--project', projDir, '--dry-run'], {
      repoRoot: ROOT,
    });
    assert.equal(dryRes.mode, 'dry-run');
    const writeRes = runInstaller(['install', '--target', 'generic-project', '--project', projDir, '--write'], {
      repoRoot: ROOT,
    });
    assert.equal(writeRes.mode, 'write');

    // Verify .blendops/catalog/runtime-operations.json and schemas were installed
    const govPaths = resolveRuntimeGovernancePaths(ROOT, projDir);
    assert.equal(govPaths.sourceMode, 'project-local');
    assert.ok(fs.existsSync(govPaths.runtimeOperationsPath));
    assert.ok(fs.existsSync(govPaths.capabilityPolicyPath));
    assert.ok(fs.existsSync(govPaths.runtimeSessionSchemaPath));
    assert.ok(fs.existsSync(govPaths.runtimeOperationsSchemaPath));
    assert.ok(fs.existsSync(govPaths.operationLedgerSchemaPath));

    // Test CLI commands against projectDir
    const docCliJson = runRuntimeAndExecutionCliSubcommand(['runtime', 'doctor', '--project', projDir, '--json'], {
      repoRoot: ROOT,
    });
    assert.equal(docCliJson.ok, true);
    const parsedDoc = JSON.parse(docCliJson.report);
    assert.equal(parsedDoc.connection_status, 'not_configured');

    const docCliHuman = runRuntimeAndExecutionCliSubcommand(['runtime', 'doctor', '--project', projDir], {
      repoRoot: ROOT,
    });
    assert.match(docCliHuman.report, /BlendOps Runtime Doctor/);
    assert.match(docCliHuman.report, /Runtime status: Not Run/);

    const capCliJson = runRuntimeAndExecutionCliSubcommand(
      ['runtime', 'capabilities', '--project', projDir, '--mock-runtime', 'healthy', '--json'],
      { repoRoot: ROOT },
    );
    const parsedCap = JSON.parse(capCliJson.report);
    assert.equal(parsedCap.connection_status, 'connected');
    assert.equal(parsedCap.discovery_mutations_executed, 0);

    const opListJson = runRuntimeAndExecutionCliSubcommand(
      ['operation', 'list', '--project', projDir, '--tier', 'L1', '--json'],
      { repoRoot: ROOT },
    );
    assert.equal(opListJson.ok, true);
    const parsedOps = JSON.parse(opListJson.report);
    assert.equal(parsedOps.total_operations, 4);

    const opValJson = runRuntimeAndExecutionCliSubcommand(['operation', 'validate', '--project', projDir, '--json'], {
      repoRoot: ROOT,
    });
    assert.equal(opValJson.ok, true);
    assert.equal(JSON.parse(opValJson.report).valid, true);
    assert.equal(JSON.parse(opValJson.report).source_mode, 'project-local');

    // Compile a plan and run execution preflight via CLI
    const specPath = path.join(ROOT, 'evals/scene-specs/product-hero-sneaker.scene-spec.json');
    const planOutPath = path.join(suiteTmpDir, 'sneaker.plan.json');
    const planRes = compileExecutionPlan(specPath, { repoRoot: ROOT });
    fs.writeFileSync(planOutPath, JSON.stringify(planRes.plan, null, 2));

    const preflightOffline = runRuntimeAndExecutionCliSubcommand(
      ['execution', 'preflight', '--plan', planOutPath, '--project', projDir, '--json'],
      { repoRoot: ROOT },
    );
    assert.equal(preflightOffline.ok, false); // offline -> runtime_ready: false
    const parsedPreflight = JSON.parse(preflightOffline.report);
    assert.equal(parsedPreflight.execution_plan_valid, true);
    assert.equal(parsedPreflight.runtime_ready, false);
    assert.equal(parsedPreflight.passed, false);
  });

  test('Scenario 22: Phase 3D Safe Blender Production Vertical Slice end-to-end (Path 1 & Path 2 mock runtimes) + Real-Runtime Smoke Check Gate', () => {
    const specPath = path.join(ROOT, 'evals/scene-specs/product-hero-sneaker.scene-spec.json');

    // Run vertical slice on Path 1 (Official Blender Lab MCP)
    const mockP1 = createMockMcpRuntime({
      runtimePath: 'path-1-host-a',
      blenderVersion: '5.1.0',
      tempDir: path.join(suiteTmpDir, 'slice-path1'),
    });
    const slice1 = runProductSceneVerticalSlice({
      repoRoot: ROOT,
      sceneSpecPath: specPath,
      runtimePath: 'path-1-host-a',
      mockRuntime: mockP1,
    });
    assert.equal(slice1.ok, true);
    assert.equal(validateRuntimeSessionSchema(slice1.session), true);
    assert.equal(validateOperationLedgerSchema(slice1.ledger), true);

    const evVal = validateEvidencePacket(slice1.ledger.evidence_packet);
    assert.equal(evVal.valid, true, evVal.errors.join('; '));
    assert.equal(slice1.ledger.is_mock_runtime, true);
    assert.equal(slice1.ledger.truth_states.evidence_promotion_allowed, false);
    assert.equal(slice1.ledger.operation_attempts.length, 5);
    assert.ok(slice1.ledger.operation_attempts.every((a) => a.status === 'committed'));
    assert.equal(slice1.ledger.checkpoint_record.verifiedOnDisk, true);
    assert.equal(slice1.ledger.checkpoint_record.createdBeforeMutation, true);
    assert.ok(slice1.ledger.checkpoint_record.byteSize > 0);
    assert.match(slice1.ledger.checkpoint_record.sha256, /^[a-f0-9]{64}$/);

    // Verify camera and lighting state changes in mock runtime after vertical slice
    const finalState1 = mockP1.getSceneState();
    const cam1 = finalState1.objects.find((o) => o.name === 'Camera');
    assert.equal(cam1.focal_length_mm, 85);
    assert.deepEqual(cam1.location, [0.15, -2.45, 0.52]);
    const key1 = finalState1.objects.find((o) => o.name === 'KeyLight');
    assert.equal(key1.energy_watts, 320);

    // Write ledger via CLI `execution report` and inspect via `execution inspect`
    const ledgerFile = path.join(suiteTmpDir, 'vertical-slice-ledger.json');
    const reportCli = runRuntimeAndExecutionCliSubcommand(
      ['execution', 'report', '--spec', specPath, '--mock-runtime', 'healthy', '--out', ledgerFile],
      { repoRoot: ROOT },
    );
    assert.equal(reportCli.ok, true);
    assert.ok(fs.existsSync(ledgerFile));
    assert.match(reportCli.report, /BlendOps Execution Report & Operation Ledger/);
    assert.match(reportCli.report, /Mock Runtime Simulation: Yes/);

    const inspectCli = runRuntimeAndExecutionCliSubcommand(
      ['execution', 'inspect', ledgerFile, '--json'],
      { repoRoot: ROOT },
    );
    assert.equal(inspectCli.ok, true);
    assert.equal(JSON.parse(inspectCli.report).valid, true);

    // Run vertical slice on Path 2 (Community mcp-for-blender)
    const mockP2 = createMockMcpRuntime({
      runtimePath: 'path-2-community',
      blenderVersion: '4.2.3',
      tempDir: path.join(suiteTmpDir, 'slice-path2'),
    });
    const slice2 = runProductSceneVerticalSlice({
      repoRoot: ROOT,
      sceneSpecPath: specPath,
      runtimePath: 'path-2-community',
      mockRuntime: mockP2,
    });
    assert.equal(slice2.ok, true);
    assert.equal(slice2.session.runtime_path, 'path-2-community');
    assert.equal(slice2.ledger.operation_attempts.length, 5);
    assert.ok(slice2.ledger.operation_attempts.every((a) => a.status === 'committed'));

    // Real-Runtime Smoke Check Gate: check if a live Blender binary exists in the environment
    const whichBlender = spawnSync('which', ['blender'], { encoding: 'utf8' });
    const hasLiveBlender = whichBlender.status === 0 && Boolean(whichBlender.stdout?.trim());
    if (!hasLiveBlender) {
      // Honest reporting when no Blender binary is installed in the test environment
      const liveSession = discoverRuntimeSession({ repoRoot: ROOT });
      assert.equal(liveSession.connection_status, 'not_configured');
      assert.equal(liveSession.truth_states.runtime_status, 'Not Run');
      assert.equal(liveSession.truth_states.artifact_status, 'Not Produced');
    }
  });
});
