// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import { CLI_EXIT_CODES } from './constants.mjs';

/**
 * Standardized Deterministic CLI Exit Codes
 * 0: Success
 * 1: CLI usage / argument / schema validation error
 * 2: Runtime unreachable / transport connection failure / missing live opt-in
 * 3: Protocol version or Blender/server version/identity incompatibility
 * 4: Tool qualification failure / schema drift / unknown or unsafe tools blocked
 * 5: Operation blocked by capability tier policy or permanent L3 raw-code boundary
 * 6: Execution preflight or pre-mutation .blend checkpoint failure
 * 7: Execution failure, postcondition mismatch, or rollback failure/unverified
 */
export function computeRuntimeCliExitCode(context = {}) {
  const { subcommand, session, qualReport, toolInventory, preflight, ledger, valid } = context;

  if (subcommand === 'operation-validate' || subcommand === 'execution-inspect') {
    return valid ? CLI_EXIT_CODES.SUCCESS : CLI_EXIT_CODES.CLI_USAGE_OR_VALIDATION_ERROR;
  }

  if (session) {
    const cs = session.connection_status;
    if (cs === 'connected' || cs === 'not_configured') {
      return CLI_EXIT_CODES.SUCCESS;
    }
    if (
      cs === 'unreachable' ||
      cs === 'configured_unreachable' ||
      cs === 'invalid_endpoint' ||
      cs === 'bridge_conflict' ||
      cs === 'stale_session'
    ) {
      return CLI_EXIT_CODES.RUNTIME_UNREACHABLE_OR_TRANSPORT_FAILURE;
    }
    if (
      cs === 'protocol_incompatible' ||
      cs === 'version_unsupported' ||
      cs === 'identity_mismatch' ||
      cs === 'incompatible_with_plan'
    ) {
      return CLI_EXIT_CODES.PROTOCOL_OR_VERSION_INCOMPATIBLE;
    }
    if (cs === 'missing_required_tools' || cs === 'invalid_tool_schema') {
      return CLI_EXIT_CODES.TOOL_QUALIFICATION_OR_SCHEMA_DRIFT_FAILURE;
    }
  }

  if (qualReport) {
    if (
      qualReport.runtime_reachability === 'blocked_opt_in_missing' ||
      qualReport.runtime_reachability === 'unreachable' ||
      qualReport.runtime_reachability === 'blocked_invalid_endpoint'
    ) {
      return CLI_EXIT_CODES.RUNTIME_UNREACHABLE_OR_TRANSPORT_FAILURE;
    }
    if (
      qualReport.runtime_reachability === 'protocol_error' ||
      qualReport.runtime_reachability === 'identity_mismatch' ||
      qualReport.runtime_reachability === 'version_unsupported'
    ) {
      return CLI_EXIT_CODES.PROTOCOL_OR_VERSION_INCOMPATIBLE;
    }
    if (!qualReport.qualification_states?.tool_inventory_verified) {
      return CLI_EXIT_CODES.TOOL_QUALIFICATION_OR_SCHEMA_DRIFT_FAILURE;
    }
    return CLI_EXIT_CODES.SUCCESS;
  }

  if (toolInventory) {
    if (toolInventory.schema_drift_detected || toolInventory.unknown_tools_blocked?.length > 0) {
      return CLI_EXIT_CODES.TOOL_QUALIFICATION_OR_SCHEMA_DRIFT_FAILURE;
    }
    return CLI_EXIT_CODES.SUCCESS;
  }

  if (preflight) {
    return preflight.passed
      ? CLI_EXIT_CODES.SUCCESS
      : CLI_EXIT_CODES.PREFLIGHT_OR_CHECKPOINT_FAILURE;
  }

  if (ledger) {
    if (ledger.lifecycle_status === 'committed') return CLI_EXIT_CODES.SUCCESS;
    if (ledger.lifecycle_status === 'rejected') {
      return CLI_EXIT_CODES.OPERATION_BLOCKED_BY_CAPABILITY_OR_L3;
    }
    if (ledger.lifecycle_status === 'blocked') {
      return CLI_EXIT_CODES.PREFLIGHT_OR_CHECKPOINT_FAILURE;
    }
    return CLI_EXIT_CODES.EXECUTION_OR_POSTCONDITION_OR_ROLLBACK_FAILURE;
  }

  return CLI_EXIT_CODES.SUCCESS;
}
export function formatQualificationReportMarkdown(report, heading = '## BlendOps Upstream MCP Runtime Qualification Report') {
  const qs = report.qualification_states;
  return [
    heading,
    '',
    `- Report ID: \`${report.report_id}\``,
    `- Qualification Mode: \`${report.qualification_mode}\``,
    `- Evidence Classification: \`${report.evidence_classification}\``,
    `- Runtime Path: \`${report.runtime_path}\``,
    `- Server Identity: ${report.runtime_server_identity || 'Not Connected'} (v\`${report.server_version || 'unknown'}\`)`,
    `- Blender Version: \`${report.blender_version || 'Not Observed'}\` (Add-on v\`${report.addon_version || 'unknown'}\`)`,
    `- Transport & Reachability: \`${report.transport_type}\` / \`${report.runtime_reachability}\``,
    `- Connection Lifecycle State: \`${report.connection_lifecycle_state || 'configured'}\``,
    `- Qualification Verdict: \`${report.qualification_verdict}\``,
    `- Tool Inventory Fingerprint: \`${report.tool_inventory_fingerprint || 'none'}\``,
    '',
    '### 10-State Runtime Qualification Model',
    `- runtime_discovered: \`${qs.runtime_discovered}\``,
    `- runtime_reachable: \`${qs.runtime_reachable}\``,
    `- runtime_identity_verified: \`${qs.runtime_identity_verified}\``,
    `- protocol_compatible: \`${qs.protocol_compatible}\``,
    `- blender_version_compatible: \`${qs.blender_version_compatible}\``,
    `- tool_inventory_verified: \`${qs.tool_inventory_verified}\``,
    `- read_only_qualified: \`${qs.read_only_qualified}\``,
    `- mutation_qualified: \`${qs.mutation_qualified}\``,
    `- export_import_qualified: \`${qs.export_import_qualified}\``,
    `- live_runtime_verified: \`${qs.live_runtime_verified}\``,
    '',
    '### Qualification Summary',
    `- Audited Upstream Tools: ${report.upstream_tool_inventory.length}`,
    `- Unsafe / Unbounded Tools Blocked (${report.unsafe_tool_inventory.length}): ${report.unsafe_tool_inventory.map((u) => `\`${u.tool_name}\` [${u.classification}]`).join(', ') || 'none'}`,
    `- Qualified Read-Only (L0) Operations (${report.qualification_results.qualified_read_only_operations.length}): ${report.qualification_results.qualified_read_only_operations.map((o) => `\`${o}\``).join(', ') || 'none'}`,
    `- Qualified Mutation (L1) Operations (${report.qualification_results.qualified_mutation_operations.length}): ${report.qualification_results.qualified_mutation_operations.map((o) => `\`${o}\``).join(', ') || 'none (blocked upstream — no bounded L1 tool without execute_blender_code)'}`,
    `- Qualified Export/Import (L2) Operations (${report.qualification_results.qualified_export_import_operations.length}): ${report.qualification_results.qualified_export_import_operations.map((o) => `\`${o}\``).join(', ') || 'none'}`,
    `- Permanently Blocked L3 Interfaces: ${report.qualification_results.permanently_blocked_l3_interfaces.map((i) => `\`${i}\``).join(', ')}`,
    '',
    '### Known Limitations & Safety Boundary Notes',
    ...report.known_limitations.map((l) => `- ${l}`),
    '',
    '- Global files touched: No',
    `- Runtime status: ${report.truth_states.runtime_status}`,
    `- Artifact status: ${report.truth_states.artifact_status}`,
    `- Live qualification: ${report.truth_states.live_qualification}`,
    '',
  ].join('\n');
}
export const DEFAULT_PRODUCT_HERO_SCENE_SPEC = {
  schema_version: '1.0.0',
  id: 'scene-spec.product-hero-sneaker',
  title: 'Athletic Sneaker Product Hero Studio Presentation + Web GLB',
  language: 'en',
  intent: {
    summary:
      'Create a clean 3-point studio product hero presentation of an athletic sneaker with a curved cyclorama backdrop, producing a 4K Cycles AgX still render and a Three.js/R3F web-ready GLB.',
    primary_goal: 'product_hero_presentation',
    target_audience_or_platform:
      'E-commerce product page hero banner and interactive Three.js 3D viewer',
    workflow_entry_stage: 'discover',
    explicit_recipe_override: null,
  },
  blender_version_target: {
    min: '4.2',
    tested_range: '4.2 - 5.1',
    recommended: '5.1',
  },
  runtime_preference: {
    preferred_path: 'path-1-official-blender-lab-mcp',
    allow_cli_fallback: true,
  },
  objects_and_subjects: [
    {
      id: 'hero_sneaker',
      name: 'Athletic_Sneaker_Hero',
      role: 'hero',
      source_type: 'existing_asset',
      poly_budget_triangles: 42000,
      transforms_applied: true,
      scale_factors: [1.0, 1.0, 1.0],
      uv_strategy: 'single_0_1_atlas',
      modifiers: ['WeightedNormal'],
      has_non_manifold_or_scan_noise: false,
    },
    {
      id: 'studio_cyclorama',
      name: 'Curved_Studio_Cyclorama',
      role: 'backdrop',
      source_type: 'procedural_primitive',
      poly_budget_triangles: 2400,
      transforms_applied: true,
      scale_factors: [1.0, 1.0, 1.0],
      uv_strategy: 'single_0_1_atlas',
      modifiers: ['Bevel', 'Subdivision'],
      has_non_manifold_or_scan_noise: false,
    },
  ],
  style_and_materials: {
    aesthetic_style:
      'Clean athletic studio product photography with subtle micro-roughness contrast',
    shader_workflow: 'principled_bsdf_pbr',
    uv_packing: 'single_0_1_atlas',
    udim_tile_count: 1,
    bake_procedural_to_pbr: true,
    channel_packing: 'orm_rgb',
    max_texture_resolution: 2048,
    normal_map_space: 'tangent_mikktspace',
  },
  lighting_and_environment: {
    rig_type: 'studio_plus_hdri',
    key_to_fill_ratio: 3.5,
    hdri_lighting: true,
    volumetric_effects: {
      enabled: false,
      bake_or_card_fallback_for_realtime: false,
    },
  },
  camera_and_framing: {
    focal_length_mm: 85,
    sensor_width_mm: 36,
    aspect_ratio: '4:5',
    resolution_px: {
      width: 2160,
      height: 2700,
    },
    depth_of_field: {
      enabled: true,
      f_stop: 5.6,
    },
    clip_start_m: 0.05,
    clip_end_m: 50.0,
    framing_style: 'Three-quarter hero product angle with 15% breathing margin',
  },
  render_and_color: {
    engine: 'CYCLES',
    view_transform: 'AgX',
    look: 'AgX - Medium High Contrast',
    samples: 256,
    denoiser: 'OPENIMAGEDENOISE',
  },
  animation_and_rigging: {
    enabled: false,
    has_armature: false,
    max_bone_influences_per_vertex: 0,
    bake_nla_to_linear_keyframes: false,
    has_shape_keys: false,
    apply_modifiers_with_shape_keys: false,
    frame_rate_fps: 30,
    frame_range: [1, 1],
  },
  optimization_and_budgets: {
    target_tier: 'hybrid_render_and_web',
    max_triangles: 65000,
    max_draw_calls: 15,
    max_vram_mb: 128,
    max_file_size_mb: 10.0,
    mesh_compression: 'draco',
    texture_compression: 'ktx2_basisu',
    generate_lods: false,
  },
  simulation_and_vfx: {
    enabled: false,
    simulation_types: [],
    geometry_nodes_realize_instances: false,
    bake_to_alembic_or_keyframes: false,
  },
  deliverables: {
    formats: ['png_still', 'glb_web_standard'],
    target_consumers: ['ecommerce_cdn', 'threejs_r3f'],
    requires_standard_khronos_gltf_2_0: true,
  },
  quality_gates: [
    'All object transforms applied to unit scale (1, 1, 1) and zero rotation',
    'PBR albedo values remain within 0.04-0.90 linear sRGB and metallic is binary 0 or 1',
    'Key-to-fill studio lighting ratio preserves highlight rolloff under AgX',
    'Exported GLB passes Khronos glTF-Validator with zero errors and <= 65k triangles',
  ],
  truth_state_defaults: {
    runtime_status: 'Not Run',
    artifact_status: 'Not Produced',
  },
};
