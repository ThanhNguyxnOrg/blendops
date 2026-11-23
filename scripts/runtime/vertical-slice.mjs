// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import path from 'node:path';
import fs from 'node:fs';
import { compileExecutionPlan } from '../compile-scene-plan.mjs';
import { executeTypedOperationSequence } from './execution.mjs';
import { DEFAULT_REPO_ROOT } from './paths.mjs';
import { DEFAULT_PRODUCT_HERO_SCENE_SPEC } from './report.mjs';

/**
 * Safe Blender Production Vertical Slice:
 * Inspect an existing product scene -> validate camera/lighting adjustment plan ->
 * create pre-mutation .blend checkpoint -> apply bounded camera and lighting changes ->
 * inspect readback -> report verified result.
 */
export function runProductSceneVerticalSlice(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const defaultSpecPath = path.join(
    repoRoot,
    'evals',
    'scene-specs',
    'product-hero-sneaker.scene-spec.json',
  );
  const specPath = options.sceneSpecPath || defaultSpecPath;
  const sceneSpec = options.sceneSpecPath
    ? JSON.parse(fs.readFileSync(specPath, 'utf8'))
    : fs.existsSync(defaultSpecPath)
      ? JSON.parse(fs.readFileSync(defaultSpecPath, 'utf8'))
      : structuredClone(DEFAULT_PRODUCT_HERO_SCENE_SPEC);
  const compiled = compileExecutionPlan(sceneSpec, { repoRoot, projectDir });

  const operations = options.operations || [
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
      input: {
        camera_name: 'Camera',
        light_names: ['KeyLight', 'FillLight', 'RimLight'],
      },
    },
    {
      operation_id: 'op.mutate.camera-transform-and-lens',
      skill_id: 'blendops-camera',
      input: {
        camera_name: 'Camera',
        location: [0.15, -2.45, 0.52],
        rotation_euler_deg: [80.5, 0.0, 3.5],
        focal_length_mm: 85,
        dof_enabled: true,
        f_stop: 2.8,
      },
    },
    {
      operation_id: 'op.mutate.light-parameters',
      skill_id: 'blendops-lighting-materials',
      input: {
        light_name: 'KeyLight',
        energy_watts: 320,
        color_rgb: [1.0, 0.97, 0.94],
        location: [-1.25, -1.5, 1.95],
        area_size: 1.4,
      },
    },
  ];

  return executeTypedOperationSequence({
    repoRoot,
    projectDir,
    sceneSpec,
    executionPlan: compiled.plan,
    runtimePath: options.runtimePath || 'path-1-host-a',
    mockRuntime: options.mockRuntime || null,
    liveTransportClient: options.liveTransportClient || null,
    grantedTier: options.grantedTier || 'L1',
    operations,
  });
}
export function formatSessionMarkdown(session, heading = '## BlendOps Runtime Readiness & Capability Report') {
  return [
    heading,
    '',
    `- Session ID: \`${session.session_id}\``,
    `- Runtime Path: \`${session.runtime_path}\``,
    `- Connection Status: \`${session.connection_status}\``,
    `- Connection Lifecycle State: \`${session.connection_lifecycle_state || 'configured'}\``,
    `- Blender Version: \`${session.blender_version || 'Not Observed'}\``,
    `- Add-on / Server Identity: ${session.addon_or_server_identity || 'Not Connected'}`,
    `- Qualification Verdict: \`${session.qualification_verdict || 'unqualified'}\``,
    `- Negotiated Capability Tier: \`${session.negotiated_capability_tier}\` (Governed Ceiling: \`${session.governed_runtime_ceiling}\`)`,
    `- Read-Only (L0) Available: ${session.readiness_flags.read_only_available ? 'Yes' : 'No'}`,
    `- Reversible Mutation (L1) Available: ${session.readiness_flags.mutation_available ? 'Yes' : 'No'}`,
    `- Export / Import (L2) Available: ${session.readiness_flags.export_available ? 'Yes' : 'No'}`,
    `- Pre-Mutation .blend Backup Supported: ${session.readiness_flags.backup_supported ? 'Yes' : 'No'}`,
    `- Supported Operations (${session.supported_operations.length}): ${session.supported_operations.map((o) => `\`${o}\``).join(', ') || 'none'}`,
    `- Discovery Mutations Executed: ${session.discovery_mutations_executed}`,
    `- Mock Runtime Simulation: ${session.truth_states.is_mock_runtime ? 'Yes (static fixture; not live Blender evidence)' : 'No'}`,
    '',
    '### Known Limitations & Governance Notes',
    ...session.known_limitations.map((lim) => `- ${lim}`),
    '',
    '- Global files touched: No',
    `- Runtime status: ${session.truth_states.runtime_status}`,
    `- Artifact status: ${session.truth_states.artifact_status}`,
    '',
  ].join('\n');
}
export function formatLedgerMarkdown(ledger) {
  return [
    '## BlendOps Execution Report & Operation Ledger',
    '',
    `- Execution ID: \`${ledger.execution_id}\``,
    `- SceneSpec ID: \`${ledger.scene_spec_id || 'none'}\``,
    `- ExecutionPlan ID: \`${ledger.execution_plan_id || 'none'}\``,
    `- Selected Runtime Path: \`${ledger.selected_runtime_path}\``,
    `- Lifecycle Status: \`${ledger.lifecycle_status}\``,
    `- Lifecycle Progression: ${ledger.lifecycle_history.map((s) => `\`${s}\``).join(' -> ')}`,
    `- Preflight Passed: ${ledger.preflight_result.passed ? 'Yes' : 'No'}`,
    ...(ledger.preflight_result.blocking_reasons.length > 0
      ? [`- Blocking Reasons: ${ledger.preflight_result.blocking_reasons.join(' | ')}`]
      : []),
    ...(ledger.checkpoint_record
      ? [
          `- Pre-Mutation Checkpoint Verified: ${ledger.checkpoint_record.verifiedOnDisk ? 'Yes' : 'No'} (SHA-256: \`${ledger.checkpoint_record.sha256 || 'none'}\`)`,
        ]
      : ['- Pre-Mutation Checkpoint: Not Required (L0 read-only)']),
    `- Operations Attempted: ${ledger.operation_attempts.length}`,
    ...ledger.operation_attempts.map(
      (a) =>
        `  ${a.step_index}. \`${a.operation_id}\` [${a.required_capability}] via \`${a.mapped_tool_name}\` -> \`${a.status}\` (Postconditions verified: ${a.postcondition_result.verified ? 'Yes' : 'No'})`,
    ),
    `- Rollback Triggered: ${ledger.rollback_summary.triggered ? `Yes (\`${ledger.rollback_summary.status}\`)` : 'No'}`,
    `- Secrets Redacted: ${ledger.secrets_redacted ? 'Yes' : 'No'}`,
    `- Mock Runtime Simulation: ${ledger.is_mock_runtime ? 'Yes (deterministic mock; evidence promotion disabled)' : 'No'}`,
    '- Global files touched: No',
    `- Runtime status: ${ledger.truth_states.runtime_status}`,
    `- Artifact status: ${ledger.truth_states.artifact_status}`,
    '',
  ].join('\n');
}
