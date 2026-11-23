// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import crypto from 'node:crypto';

export const CLI_EXIT_CODES = Object.freeze({
  SUCCESS: 0,
  CLI_USAGE_OR_VALIDATION_ERROR: 1,
  RUNTIME_UNREACHABLE_OR_TRANSPORT_FAILURE: 2,
  PROTOCOL_OR_VERSION_INCOMPATIBLE: 3,
  TOOL_QUALIFICATION_OR_SCHEMA_DRIFT_FAILURE: 4,
  OPERATION_BLOCKED_BY_CAPABILITY_OR_L3: 5,
  PREFLIGHT_OR_CHECKPOINT_FAILURE: 6,
  EXECUTION_OR_POSTCONDITION_OR_ROLLBACK_FAILURE: 7,
  // Backward-compatible aliases
  VALIDATION_OR_CLI_ERROR: 1,
  PREFLIGHT_OR_QUALIFICATION_BLOCKED: 2,
  RUNTIME_UNREACHABLE_OR_TIMEOUT: 2,
  PROTOCOL_OR_TRANSPORT_INCOMPATIBLE: 3,
  IDENTITY_OR_PROVENANCE_MISMATCH: 3,
  SCHEMA_DRIFT_OR_UNQUALIFIED_TOOL: 4,
  CHECKPOINT_OR_BACKUP_GATE_FAILED: 6,
  POSTCONDITION_OR_ROLLBACK_FAILED: 7,
});
export const RUNTIME_CLI_SUBCOMMANDS = new Set([
  'runtime',
  'operation',
  'execution',
  'runtime-connect',
  'runtime-doctor',
  'runtime-inspect',
  'runtime-capabilities',
  'runtime-qualify',
  'runtime-tools',
  'runtime-smoke',
  'operation-list',
  'operation-validate',
  'operation-mappings',
  'execution-preflight',
  'execution-report',
  'execution-inspect',
]);
export const RECOGNIZED_RUNTIME_PATHS = Object.freeze({
  'path-1-host-a': {
    id: 'path-1-host-a',
    label: 'Path 1 — Official Blender Lab MCP (Host Option A: Anthropic Blender Connector)',
    upstreamOwner: 'Blender Foundation Lab (bpype/blender_mcp) + Anthropic Claude Desktop Connector host',
    minBlenderTuple: [5, 1, 0],
    minBlenderString: '5.1.0',
    versionFloorRule: 'Blender 5.1.0+ required by Blender Lab MCP add-on manifest (blender_version_min=5.1.0)',
    requiredReadOnlyTools: [
      'get_blendfile_summary_path_info',
      'get_blendfile_summary_datablocks',
      'get_objects_summary',
    ],
    optionalReadOnlyTools: [
      'get_blendfile_summary_missing_files',
      'get_blendfile_summary_of_linked_libraries',
    ],
    governedMutationTools: [
      'set_camera_properties_governed',
      'set_light_properties_governed',
      'set_material_pbr_governed',
      'set_object_transform_governed',
    ],
    governedExportTools: [
      'render_viewport_to_path',
      'render_thumbnail_to_path',
      'export_glb_governed',
    ],
    exclusiveOpponentTools: new Set([
      'get_scene_info',
      'get_object_info',
      'get_addon_status',
      'import_asset',
    ]),
  },
  'path-1-host-b': {
    id: 'path-1-host-b',
    label: 'Path 1 — Official Blender Lab MCP (Host Option B: Manual MCP Client)',
    upstreamOwner: 'Blender Foundation Lab (bpype/blender_mcp)',
    minBlenderTuple: [5, 1, 0],
    minBlenderString: '5.1.0',
    versionFloorRule: 'Blender 5.1.0+ required by Blender Lab MCP add-on manifest (blender_version_min=5.1.0)',
    requiredReadOnlyTools: [
      'get_blendfile_summary_path_info',
      'get_blendfile_summary_datablocks',
      'get_objects_summary',
    ],
    optionalReadOnlyTools: [
      'get_blendfile_summary_missing_files',
      'get_blendfile_summary_of_linked_libraries',
    ],
    governedMutationTools: [
      'set_camera_properties_governed',
      'set_light_properties_governed',
      'set_material_pbr_governed',
      'set_object_transform_governed',
    ],
    governedExportTools: [
      'render_viewport_to_path',
      'render_thumbnail_to_path',
      'export_glb_governed',
    ],
    exclusiveOpponentTools: new Set([
      'get_scene_info',
      'get_object_info',
      'get_addon_status',
      'import_asset',
    ]),
  },
  'path-2-community': {
    id: 'path-2-community',
    label: 'Path 2 — Community mcp-for-blender (ahujasid/mcp-for-blender)',
    upstreamOwner: 'Community Maintainer (ahujasid/mcp-for-blender, third-party prior art)',
    minBlenderTuple: [3, 0, 0],
    minBlenderString: '3.0.0',
    versionFloorRule: 'Blender 3.0.0+ supported per upstream mcp-for-blender documentation',
    requiredReadOnlyTools: [
      'get_scene_info',
      'get_object_info',
      'get_addon_status',
    ],
    optionalReadOnlyTools: ['look', 'search_assets'],
    governedMutationTools: [
      'set_camera_properties_governed',
      'set_light_properties_governed',
      'set_material_pbr_governed',
      'set_object_transform_governed',
    ],
    governedExportTools: [
      'render_still_governed',
      'export_glb_governed',
      'import_asset',
    ],
    exclusiveOpponentTools: new Set([
      'get_blendfile_summary_path_info',
      'get_blendfile_summary_datablocks',
      'get_objects_summary',
      'get_blendfile_summary_missing_files',
      'get_blendfile_summary_of_linked_libraries',
    ]),
  },
  'cli-appendix': {
    id: 'cli-appendix',
    label: 'CLI Fallback (Appendix) — Headless Blender CLI',
    upstreamOwner: 'Blender Foundation (upstream CLI surface; tracked as appendix in BlendOps)',
    minBlenderTuple: [4, 2, 0],
    minBlenderString: '4.2.0',
    versionFloorRule: 'Blender 4.2.0+ recommended (4.5.0+ for headless GLB export)',
    requiredReadOnlyTools: [],
    optionalReadOnlyTools: [],
    governedMutationTools: [],
    governedExportTools: ['blender_cli_render_still', 'blender_cli_export_glb'],
    exclusiveOpponentTools: new Set(),
  },
});
export const SECRET_KEY_PATTERN =
  /(password|passwd|secret|token|api[-_]?key|authorization|bearer|private[-_]?key|client[-_]?secret|credential|session[-_]?key|access[-_]?key|auth[-_]?header|cookie|set[-_]?cookie)/i;
const SECRET_VALUE_PATTERN =
  /(Bearer\s+[A-Za-z0-9._~+/=-]{6,}|Basic\s+[A-Za-z0-9+/=]{8,}|sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{10,}|github_pat_[A-Za-z0-9_]{10,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z-_]{12,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})/g;
const URL_USERINFO_PATTERN = /(?<![a-zA-Z0-9+.-])([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^/\s:@]+:[^/\s@]+)@/g;
const URL_QUERY_SECRET_PATTERN =
  /([?&](?:token|api_key|apikey|access_token|refresh_token|secret|password|passwd|auth|key|credential|client_secret|sig|signature)=)([^&#\s"']+)/gi;
const INLINE_ASSIGN_SECRET_PATTERN =
  /((?:password|passwd|secret|token|api[_-]?key|authorization|client[_-]?secret|private[_-]?key)\s*[:=]\s*["']?)([A-Za-z0-9._~+/=-]{6,})(["']?)/gi;
export function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}
export function stableCanonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableCanonicalJson(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableCanonicalJson(value[k])}`).join(',')}}`;
}
export function redactStringSecrets(str) {
  let out = str;
  let changed = false;

  const replaceTrack = (pattern, replacer) => {
    out = out.replace(pattern, (...args) => {
      changed = true;
      return typeof replacer === 'function' ? replacer(...args) : replacer;
    });
  };

  replaceTrack(URL_USERINFO_PATTERN, '$1[REDACTED]@');
  replaceTrack(URL_QUERY_SECRET_PATTERN, '$1[REDACTED]');
  replaceTrack(SECRET_VALUE_PATTERN, '[REDACTED]');
  replaceTrack(INLINE_ASSIGN_SECRET_PATTERN, '$1[REDACTED]$3');

  return { value: out, changed };
}
