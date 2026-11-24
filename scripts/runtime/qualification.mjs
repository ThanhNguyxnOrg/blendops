// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import { isVersionAtLeast } from '../validate-evidence-packet.mjs';
import path from 'node:path';
import fs from 'node:fs';
import { resolveCatalogPaths } from '../compile-scene-plan.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
import { TIER_RANKS } from '../validate-capability-policy.mjs';
import { RECOGNIZED_RUNTIME_PATHS } from './constants.mjs';
import { DEFAULT_REPO_ROOT } from './paths.mjs';
import { SUPPORTED_MCP_PROTOCOL_VERSIONS, computeFullToolContractFingerprints, computeToolInventoryFingerprint, computeToolSchemaFingerprint, detectArbitraryCodeSchemaParameters, detectToolDescriptionInjection, inspectJsonSchemaSafety } from './security.mjs';

/**
 * Validates MCP protocol version negotiation, transport compatibility, and upstream server identity.
 */
export function negotiateMcpProtocolCompatibility(probe = {}, runtimePath = 'none') {
  if (!probe || probe.reachable === false || runtimePath === 'none') {
    return {
      protocolCompatible: false,
      identityVerified: false,
      protocolVersion: null,
      transportType: 'none',
      sessionIdHeaderUsed: false,
      serverName: null,
      serverVersion: null,
      blockingReason: null,
    };
  }

  const protocolVersion = probe.protocolVersion || '2024-11-05';
  const transportType =
    probe.transportType ||
    (runtimePath === 'path-1-host-b' ? 'streamable-http' : 'stdio');
  const sessionIdHeaderUsed =
    typeof probe.sessionIdHeaderUsed === 'boolean'
      ? probe.sessionIdHeaderUsed
      : transportType === 'streamable-http';

  const protocolCompatible =
    typeof protocolVersion === 'string' &&
    SUPPORTED_MCP_PROTOCOL_VERSIONS.has(protocolVersion) &&
    probe.malformedJsonRpc !== true;

  const addonOrServer = String(probe.addonOrServerIdentity || probe.serverName || '');
  let identityVerified = Boolean(addonOrServer.trim());
  let identityReason = null;

  if (runtimePath.startsWith('path-1')) {
    if (/mcp-for-blender|ahujasid|rogue|unverified-third-party/i.test(addonOrServer)) {
      identityVerified = false;
      identityReason = `Runtime identity mismatch for ${runtimePath}: expected Official Blender Lab MCP (blender-mcp / id="mcp"), but observed '${addonOrServer}'.`;
    } else if (!/blender\s*lab\s*mcp|blender[-_]mcp|bpype\/blender_mcp|\bmcp\b/i.test(addonOrServer)) {
      identityVerified = false;
      identityReason = `Unrecognized server identity '${addonOrServer}' for ${runtimePath}.`;
    }
  } else if (runtimePath === 'path-2-community') {
    if (/blender\s*lab\s*mcp|bpype\/blender_mcp|rogue/i.test(addonOrServer)) {
      identityVerified = false;
      identityReason = `Runtime identity mismatch for ${runtimePath}: expected Community mcp-for-blender, but observed '${addonOrServer}'.`;
    } else if (!/mcp-for-blender|blender[-_]?mcp/i.test(addonOrServer)) {
      identityVerified = false;
      identityReason = `Unrecognized server identity '${addonOrServer}' for ${runtimePath}.`;
    }
  }

  let blockingReason = null;
  if (probe.malformedJsonRpc === true) {
    blockingReason = 'MCP transport returned malformed JSON-RPC payload during initialization/negotiation.';
  } else if (!protocolCompatible) {
    blockingReason = `Unsupported MCP protocol version '${String(protocolVersion)}'. Supported versions: ${[...SUPPORTED_MCP_PROTOCOL_VERSIONS].join(', ')}.`;
  } else if (!identityVerified) {
    blockingReason = identityReason;
  }

  return {
    protocolCompatible,
    identityVerified,
    protocolVersion: String(protocolVersion),
    transportType,
    sessionIdHeaderUsed,
    serverName: addonOrServer || null,
    serverVersion: probe.runtimeVersion || probe.serverVersion || null,
    blockingReason,
  };
}
/**
 * Separates self-reported MCP server identity from independently verified provenance.
 * Never fabricates addon_version or server_version when unobserved.
 */
export function evaluateRuntimeProvenance(probe = {}, runtimePath = 'none', options = {}) {
  const protoNeg = negotiateMcpProtocolCompatibility(probe, runtimePath);
  const pathSpec = RECOGNIZED_RUNTIME_PATHS[runtimePath] || null;
  const claimedIdentity = probe?.addonOrServerIdentity || probe?.serverName || null;
  const serverVersionObserved = probe?.runtimeVersion || probe?.serverVersion || null;
  const addonVersionObserved = probe?.addonVersion || null;
  const blenderVersionObserved = probe?.blenderVersion || null;
  const versionCompatible =
    Boolean(blenderVersionObserved) &&
    Boolean(pathSpec) &&
    isVersionAtLeast(blenderVersionObserved, pathSpec.minBlenderTuple);

  const processProvenanceVerified = Boolean(
    probe?.processProvenanceVerified === true ||
      options.processProvenanceVerified === true,
  );
  // Self-reported server name/version alone never sets source_provenance_verified: true
  const sourceProvenanceVerified = Boolean(
    probe?.sourceProvenanceVerified === true ||
      options.sourceProvenanceVerified === true,
  );

  return {
    identity_claimed: claimedIdentity,
    identity_claim_matches_expected: Boolean(protoNeg.identityVerified),
    server_version_observed: serverVersionObserved,
    addon_version_observed: addonVersionObserved,
    blender_version_observed: blenderVersionObserved,
    process_provenance_verified: processProvenanceVerified,
    source_provenance_verified: sourceProvenanceVerified,
    runtime_compatibility_verified: Boolean(
      protoNeg.protocolCompatible && protoNeg.identityVerified && versionCompatible,
    ),
    expected_vs_observed: {
      expected_runtime_path: runtimePath,
      expected_server_identity_pattern: runtimePath.startsWith('path-1')
        ? 'blender-mcp / Blender Lab MCP Add-on'
        : runtimePath === 'path-2-community'
          ? 'mcp-for-blender / blender-mcp'
          : 'none',
      observed_server_identity: claimedIdentity,
      expected_min_blender_version: pathSpec?.minBlenderString || null,
      observed_blender_version: blenderVersionObserved,
      observed_server_version: serverVersionObserved,
      observed_addon_version: addonVersionObserved,
    },
  };
}
/**
 * Validates that sourceBlendPath and backupPath are safe, non-symlink, non-hardlinked,
 * directory-contained `.blend` file paths before creating or restoring a checkpoint.
 */
export function validateSafeBlendCheckpointPaths(sourceBlendPath, backupPath = null) {
  if (
    !sourceBlendPath ||
    typeof sourceBlendPath !== 'string' ||
    sourceBlendPath.includes('\0') ||
    !sourceBlendPath.endsWith('.blend')
  ) {
    const msg = 'Source .blend path must be a non-empty string ending in .blend without null bytes.';
    return { valid: false, reason: msg, error: msg };
  }
  const rawSegments = sourceBlendPath.split(/[\\/]+/);
  if (rawSegments.includes('..')) {
    const msg = `Refusing source .blend path with parent directory traversal ('..'): ${sourceBlendPath}`;
    return { valid: false, reason: msg, error: msg };
  }

  const absSource = path.resolve(sourceBlendPath);
  let sourceStat;
  try {
    sourceStat = fs.lstatSync(absSource);
  } catch {
    const msg = `Source .blend file does not exist on disk: ${absSource}`;
    return { valid: false, reason: msg, error: msg };
  }
  if (sourceStat.isSymbolicLink()) {
    const msg = `Refusing symbolic link as source .blend checkpoint file: ${absSource}`;
    return { valid: false, reason: msg, error: msg };
  }
  if (!sourceStat.isFile()) {
    const msg = `Source .blend path is not a regular file: ${absSource}`;
    return { valid: false, reason: msg, error: msg };
  }
  if (typeof sourceStat.nlink === 'number' && sourceStat.nlink > 1) {
    const msg = `Refusing hardlinked source .blend file (nlink=${sourceStat.nlink}): ${absSource}`;
    return { valid: false, reason: msg, error: msg };
  }

  const sourceParentStat = fs.lstatSync(path.dirname(absSource));
  if (sourceParentStat.isSymbolicLink()) {
    const msg = `Source .blend parent directory is a symbolic link: ${path.dirname(absSource)}`;
    return { valid: false, reason: msg, error: msg };
  }

  if (backupPath !== null && backupPath !== undefined) {
    if (
      typeof backupPath !== 'string' ||
      backupPath.includes('\0') ||
      !backupPath.endsWith('.blend') ||
      backupPath.split(/[\\/]+/).includes('..')
    ) {
      const msg = `Invalid backup .blend path: ${String(backupPath)}`;
      return { valid: false, reason: msg, error: msg };
    }
    const absBackup = path.resolve(backupPath);
    if (absBackup === absSource) {
      const msg = 'Backup .blend path must be distinct from source .blend path.';
      return { valid: false, reason: msg, error: msg };
    }
    if (path.dirname(absBackup) !== path.dirname(absSource)) {
      const msg = `Backup .blend path (${absBackup}) must reside in the same verified directory as source .blend (${absSource}).`;
      return { valid: false, reason: msg, error: msg };
    }
    try {
      const bkStat = fs.lstatSync(absBackup);
      if (bkStat.isSymbolicLink() || bkStat.isDirectory()) {
        const msg = `Refusing to write or restore checkpoint through symbolic link or directory at: ${absBackup}`;
        return { valid: false, reason: msg, error: msg };
      }
      if (typeof bkStat.nlink === 'number' && bkStat.nlink > 1) {
        const msg = `Refusing hardlinked backup .blend file (nlink=${bkStat.nlink}): ${absBackup}`;
        return { valid: false, reason: msg, error: msg };
      }
    } catch {
      // backup file does not exist yet (valid prior to creation)
    }
  }

  return { valid: true, absSource, reason: null, error: null };
}
/**
 * Resolves runtime operations and capability policy paths from either `.blendops/catalog` or repoRoot.
 */
export function resolveRuntimeGovernancePaths(repoRoot = DEFAULT_REPO_ROOT, projectDir = null) {
  const baseCatalog = resolveCatalogPaths(repoRoot, projectDir);
  const localCatalogDir = projectDir
    ? path.join(path.resolve(projectDir), '.blendops', 'catalog')
    : null;

  const localOpsPath = localCatalogDir
    ? path.join(localCatalogDir, 'runtime-operations.json')
    : null;
  const localPolicyPath = localCatalogDir
    ? path.join(localCatalogDir, 'runtime-capability-policy.json')
    : null;
  const localSchemasDir = localCatalogDir
    ? path.join(localCatalogDir, 'schemas')
    : null;

  return {
    ...baseCatalog,
    runtimeOperationsPath:
      localOpsPath && fs.existsSync(localOpsPath)
        ? localOpsPath
        : path.join(repoRoot, 'registry', 'runtime-operations.json'),
    capabilityPolicyPath:
      localPolicyPath && fs.existsSync(localPolicyPath)
        ? localPolicyPath
        : path.join(repoRoot, 'registry', 'runtime-capability-policy.json'),
    runtimeSessionSchemaPath:
      localSchemasDir && fs.existsSync(path.join(localSchemasDir, 'runtime-session.schema.json'))
        ? path.join(localSchemasDir, 'runtime-session.schema.json')
        : path.join(repoRoot, 'schemas', 'runtime-session.schema.json'),
    runtimeOperationsSchemaPath:
      localSchemasDir && fs.existsSync(path.join(localSchemasDir, 'runtime-operations.schema.json'))
        ? path.join(localSchemasDir, 'runtime-operations.schema.json')
        : path.join(repoRoot, 'schemas', 'runtime-operations.schema.json'),
    operationLedgerSchemaPath:
      localSchemasDir && fs.existsSync(path.join(localSchemasDir, 'operation-execution-ledger.schema.json'))
        ? path.join(localSchemasDir, 'operation-execution-ledger.schema.json')
        : path.join(repoRoot, 'schemas', 'operation-execution-ledger.schema.json'),
    evidencePacketSchemaPath:
      localSchemasDir && fs.existsSync(path.join(localSchemasDir, 'runtime-evidence-packet.schema.json'))
        ? path.join(localSchemasDir, 'runtime-evidence-packet.schema.json')
        : path.join(repoRoot, 'schemas', 'runtime-evidence-packet.schema.json'),
    runtimeQualificationReportSchemaPath:
      localSchemasDir && fs.existsSync(path.join(localSchemasDir, 'runtime-qualification-report.schema.json'))
        ? path.join(localSchemasDir, 'runtime-qualification-report.schema.json')
        : path.join(repoRoot, 'schemas', 'runtime-qualification-report.schema.json'),
  };
}
let cachedValidators = new Map();
export function getAjvValidator(schemaPath) {
  if (cachedValidators.has(schemaPath)) {
    return cachedValidators.get(schemaPath);
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  cachedValidators.set(schemaPath, validate);
  return validate;
}
export const TRUSTED_MOCK_FIXTURE_TOKEN = Symbol('blendops.internal.trusted_mock_fixture_token');
export const TRUSTED_MOCK_RUNTIME_INSTANCES = new WeakSet();
export const TRUSTED_MOCK_SESSION_INSTANCES = new WeakSet();
export const TRUSTED_MOCK_TOOL_OBJECTS = new WeakSet();
export const SYNTHETIC_GOVERNED_TOOL_SCHEMAS = Object.freeze({
  set_camera_properties_governed: Object.freeze({
    type: 'object',
    additionalProperties: false,
    required: ['camera_name', 'location', 'rotation_euler_deg', 'focal_length_mm'],
    properties: {
      camera_name: { type: 'string', minLength: 1 },
      location: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      rotation_euler_deg: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      focal_length_mm: { type: 'number', minimum: 1, maximum: 500 },
      dof_enabled: { type: 'boolean' },
      f_stop: { type: 'number', minimum: 0.5, maximum: 64 },
    },
  }),
  set_light_properties_governed: Object.freeze({
    type: 'object',
    additionalProperties: false,
    required: ['light_name', 'energy_watts', 'color_rgb'],
    properties: {
      light_name: { type: 'string', minLength: 1 },
      energy_watts: { type: 'number', minimum: 0, maximum: 100000 },
      color_rgb: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      location: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      area_size: { type: 'number', minimum: 0.01, maximum: 100 },
    },
  }),
  set_material_pbr_governed: Object.freeze({
    type: 'object',
    additionalProperties: false,
    required: ['object_name', 'material_name', 'base_color_rgba', 'roughness', 'metallic'],
    properties: {
      object_name: { type: 'string', minLength: 1 },
      material_name: { type: 'string', minLength: 1 },
      base_color_rgba: { type: 'array', items: { type: 'number' }, minItems: 4, maxItems: 4 },
      roughness: { type: 'number', minimum: 0, maximum: 1 },
      metallic: { type: 'number', minimum: 0, maximum: 1 },
    },
  }),
  set_object_transform_governed: Object.freeze({
    type: 'object',
    additionalProperties: false,
    required: ['object_name', 'location', 'rotation_euler_deg', 'scale'],
    properties: {
      object_name: { type: 'string', minLength: 1 },
      location: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      rotation_euler_deg: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      scale: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
    },
  }),
  render_still_governed: Object.freeze({
    type: 'object',
    additionalProperties: false,
    required: ['output_path'],
    properties: {
      output_path: { type: 'string', minLength: 1 },
      engine: { type: 'string' },
      resolution_x: { type: 'integer', minimum: 16, maximum: 16384 },
      resolution_y: { type: 'integer', minimum: 16, maximum: 16384 },
      samples: { type: 'integer', minimum: 1, maximum: 16384 },
    },
  }),
  export_glb_governed: Object.freeze({
    type: 'object',
    additionalProperties: false,
    required: ['output_path'],
    properties: {
      output_path: { type: 'string', minLength: 1 },
      export_selected_only: { type: 'boolean' },
      export_apply_modifiers: { type: 'boolean' },
      export_draco_compression: { type: 'boolean' },
    },
  }),
  blender_cli_render_still: Object.freeze({
    type: 'object',
    additionalProperties: false,
    required: ['output_path'],
    properties: {
      output_path: { type: 'string', minLength: 1 },
      engine: { type: 'string' },
      resolution_x: { type: 'integer', minimum: 16, maximum: 16384 },
      resolution_y: { type: 'integer', minimum: 16, maximum: 16384 },
      samples: { type: 'integer', minimum: 1, maximum: 16384 },
    },
  }),
  blender_cli_export_glb: Object.freeze({
    type: 'object',
    additionalProperties: false,
    required: ['output_path'],
    properties: {
      output_path: { type: 'string', minLength: 1 },
      export_selected_only: { type: 'boolean' },
      export_apply_modifiers: { type: 'boolean' },
    },
  }),
});
const GOVERNED_EXTENSION_TOOL_SPECS = Object.freeze({
  set_camera_properties_governed: {
    classification: 'safe_direct',
    capability_tier: 'L1',
    allowed_in_governed_execution: true,
    input_schema: SYNTHETIC_GOVERNED_TOOL_SCHEMAS.set_camera_properties_governed,
    pinned_schema_fingerprint: computeToolSchemaFingerprint(
      'set_camera_properties_governed',
      SYNTHETIC_GOVERNED_TOOL_SCHEMAS.set_camera_properties_governed,
    ),
    rationale: 'Governed BlendOps extension tool for bounded camera transform and lens adjustments (internal mock fixture only).',
  },
  set_light_properties_governed: {
    classification: 'safe_direct',
    capability_tier: 'L1',
    allowed_in_governed_execution: true,
    input_schema: SYNTHETIC_GOVERNED_TOOL_SCHEMAS.set_light_properties_governed,
    pinned_schema_fingerprint: computeToolSchemaFingerprint(
      'set_light_properties_governed',
      SYNTHETIC_GOVERNED_TOOL_SCHEMAS.set_light_properties_governed,
    ),
    rationale: 'Governed BlendOps extension tool for bounded light energy, color, and transform adjustments (internal mock fixture only).',
  },
  set_material_pbr_governed: {
    classification: 'safe_direct',
    capability_tier: 'L1',
    allowed_in_governed_execution: true,
    input_schema: SYNTHETIC_GOVERNED_TOOL_SCHEMAS.set_material_pbr_governed,
    pinned_schema_fingerprint: computeToolSchemaFingerprint(
      'set_material_pbr_governed',
      SYNTHETIC_GOVERNED_TOOL_SCHEMAS.set_material_pbr_governed,
    ),
    rationale: 'Governed BlendOps extension tool for bounded Principled BSDF PBR material adjustments (internal mock fixture only).',
  },
  set_object_transform_governed: {
    classification: 'safe_direct',
    capability_tier: 'L1',
    allowed_in_governed_execution: true,
    input_schema: SYNTHETIC_GOVERNED_TOOL_SCHEMAS.set_object_transform_governed,
    pinned_schema_fingerprint: computeToolSchemaFingerprint(
      'set_object_transform_governed',
      SYNTHETIC_GOVERNED_TOOL_SCHEMAS.set_object_transform_governed,
    ),
    rationale: 'Governed BlendOps extension tool for bounded object transform adjustments (internal mock fixture only).',
  },
  render_still_governed: {
    classification: 'safe_direct',
    capability_tier: 'L2',
    allowed_in_governed_execution: true,
    input_schema: SYNTHETIC_GOVERNED_TOOL_SCHEMAS.render_still_governed,
    pinned_schema_fingerprint: computeToolSchemaFingerprint(
      'render_still_governed',
      SYNTHETIC_GOVERNED_TOOL_SCHEMAS.render_still_governed,
    ),
    rationale: 'Governed BlendOps extension tool for bounded still render output to file (internal mock fixture only).',
  },
  export_glb_governed: {
    classification: 'safe_direct',
    capability_tier: 'L2',
    allowed_in_governed_execution: true,
    input_schema: SYNTHETIC_GOVERNED_TOOL_SCHEMAS.export_glb_governed,
    pinned_schema_fingerprint: computeToolSchemaFingerprint(
      'export_glb_governed',
      SYNTHETIC_GOVERNED_TOOL_SCHEMAS.export_glb_governed,
    ),
    rationale: 'Governed BlendOps extension tool for bounded Khronos glTF 2.0 GLB export to file (internal mock fixture only).',
  },
  blender_cli_render_still: {
    classification: 'safe_direct',
    capability_tier: 'L2',
    allowed_in_governed_execution: true,
    input_schema: SYNTHETIC_GOVERNED_TOOL_SCHEMAS.blender_cli_render_still,
    pinned_schema_fingerprint: computeToolSchemaFingerprint(
      'blender_cli_render_still',
      SYNTHETIC_GOVERNED_TOOL_SCHEMAS.blender_cli_render_still,
    ),
    rationale: 'Headless CLI appendix render still surface (internal mock fixture only).',
  },
  blender_cli_export_glb: {
    classification: 'safe_direct',
    capability_tier: 'L2',
    allowed_in_governed_execution: true,
    input_schema: SYNTHETIC_GOVERNED_TOOL_SCHEMAS.blender_cli_export_glb,
    pinned_schema_fingerprint: computeToolSchemaFingerprint(
      'blender_cli_export_glb',
      SYNTHETIC_GOVERNED_TOOL_SCHEMAS.blender_cli_export_glb,
    ),
    rationale: 'Headless CLI appendix GLB export surface (internal mock fixture only).',
  },
});
/**
 * Verifies whether a runtime client is an unforgeable internal mock fixture.
 * Cannot be spoofed by setting `isMockRuntime: true` on an external or live client object.
 */
export function isTrustedMockRuntimeFixture(runtimeClient) {
  return Boolean(
    runtimeClient &&
      typeof runtimeClient === 'object' &&
      TRUSTED_MOCK_RUNTIME_INSTANCES.has(runtimeClient) &&
      runtimeClient[TRUSTED_MOCK_FIXTURE_TOKEN] === true &&
      runtimeClient.isMockRuntime === true &&
      !runtimeClient.isUpstreamRealitySimulation,
  );
}
export function isTrustedMockSessionInstance(session) {
  return Boolean(
    session &&
      typeof session === 'object' &&
      TRUSTED_MOCK_SESSION_INSTANCES.has(session) &&
      session[TRUSTED_MOCK_FIXTURE_TOKEN] === true,
  );
}
export function normalizeUpstreamMatrixPath(runtimePath) {
  if (runtimePath === 'path-1-host-a' || runtimePath === 'path-1-host-b' || runtimePath === 'path-1-official-blender-lab-mcp') {
    return 'path-1-official-blender-lab-mcp';
  }
  return runtimePath;
}
export function doesMatrixEntryMatchRuntimePath(m, runtimePath) {
  if (!m) return false;
  const matrixPath = normalizeUpstreamMatrixPath(runtimePath);
  if (Array.isArray(m.runtime_paths)) {
    if (m.runtime_paths.includes(runtimePath) || m.runtime_paths.includes(matrixPath)) {
      return true;
    }
    if (
      matrixPath === 'path-1-official-blender-lab-mcp' &&
      (m.runtime_paths.includes('path-1-host-a') || m.runtime_paths.includes('path-1-host-b'))
    ) {
      return true;
    }
  }
  if (typeof m.runtime_path === 'string') {
    return m.runtime_path === runtimePath || m.runtime_path === matrixPath;
  }
  return false;
}
/**
 * Qualifies a single MCP tool entry against the canonical Upstream Tool Qualification Matrix
 * and enforces the MCP Adapter Security Boundary:
 * - Unknown tools default to 'unknown' (deny).
 * - Unsafe raw code tools ('execute_blender_code', 'execute_blender_code_for_cli') are classified as 'unsafe_raw_code' and blocked.
 * - Spoofed safe tool names whose inputSchema exposes arbitrary code parameters are flagged and reclassified as 'unsafe_raw_code'.
 * - Synthetic governed extension tools (`*_governed`, `blender_cli_*`) are strictly rejected unless originating from a verified internal mock fixture (`TRUSTED_MOCK_RUNTIME_INSTANCES` / `TRUSTED_MOCK_TOOL_OBJECTS`) with an exact pinned schema fingerprint.
 * - Tool descriptions containing prompt/command injection payloads are flagged and blocked.
 * - Unexpected schema changes compared to the verified upstream schema fingerprint trigger 'schema_drift_detected' and 'requalification_required'.
 */
export function qualifyUpstreamTool(toolEntry, runtimePath, registryDoc, options = {}) {
  const toolName = typeof toolEntry?.name === 'string' ? toolEntry.name.trim() : String(toolEntry?.tool_name || '').trim();
  const inputSchema = toolEntry?.inputSchema ?? toolEntry?.input_schema ?? null;
  const outputSchema = toolEntry?.outputSchema ?? toolEntry?.output_schema ?? null;
  const description = typeof toolEntry?.description === 'string' ? toolEntry.description : '';

  const inputSafety = inspectJsonSchemaSafety(inputSchema);
  const outputSafety = outputSchema ? inspectJsonSchemaSafety(outputSchema) : { valid: true, reason: null };
  const schemaValid = inputSafety.valid && outputSafety.valid;

  const actualFingerprint = inputSafety.valid
    ? computeToolSchemaFingerprint(toolName, inputSchema)
    : null;
  const contractFingerprints = inputSafety.valid
    ? computeFullToolContractFingerprints(toolEntry)
    : null;

  const matrixEntry = (registryDoc?.upstream_tool_qualification_matrix || []).find(
    (m) => m.tool_name === toolName && doesMatrixEntryMatchRuntimePath(m, runtimePath),
  );
  const governedSpec = GOVERNED_EXTENSION_TOOL_SPECS[toolName] || null;

  const descInjection = detectToolDescriptionInjection(description);
  const arbitraryCodeParamReason = inputSafety.valid ? detectArbitraryCodeSchemaParameters(inputSchema) : null;

  const mappedOps = (registryDoc?.operations || [])
    .filter(
      (op) =>
        op.supported_runtime_paths.includes(runtimePath) &&
        (op.runtime_tool_mappings?.[runtimePath]?.primary_tool === toolName ||
          op.runtime_tool_mappings?.[runtimePath]?.upstream_mcp_tool_name === toolName),
    )
    .map((op) => op.operation_id);

  // 1. Check description injection
  if (descInjection) {
    return {
      tool_name: toolName,
      runtime_path: runtimePath,
      classification: 'unknown',
      capability_tier: 'L3',
      allowed_in_governed_execution: false,
      expected_schema_fingerprint: matrixEntry?.tool_schema_fingerprint || null,
      actual_schema_fingerprint: actualFingerprint,
      contract_fingerprints: contractFingerprints,
      schema_drift_detected: false,
      drift_severity: 'none',
      requalification_required: true,
      spoofed_safe_tool_name: false,
      synthetic_extension_spoof_detected: false,
      description_injection_detected: true,
      mapped_operation_ids: [],
      rationale: `${descInjection}; tool blocked at MCP adapter security boundary.`,
    };
  }

  // 2. Check known unsafe_raw_code tools first
  if (
    toolName === 'execute_blender_code' ||
    toolName === 'execute_blender_code_for_cli' ||
    matrixEntry?.classification === 'unsafe_raw_code'
  ) {
    return {
      tool_name: toolName,
      runtime_path: runtimePath,
      classification: 'unsafe_raw_code',
      capability_tier: 'L3',
      allowed_in_governed_execution: false,
      expected_schema_fingerprint: matrixEntry?.tool_schema_fingerprint || actualFingerprint,
      actual_schema_fingerprint: actualFingerprint,
      contract_fingerprints: contractFingerprints,
      schema_drift_detected: false,
      drift_severity: 'none',
      requalification_required: false,
      spoofed_safe_tool_name: false,
      synthetic_extension_spoof_detected: false,
      description_injection_detected: false,
      mapped_operation_ids: [],
      rationale:
        matrixEntry?.qualification_rationale ||
        matrixEntry?.rationale ||
        `Unrestricted arbitrary Python execution tool '${toolName}' is permanently blocked from governed execution per laws/no-arbitrary-python-interface.md.`,
    };
  }

  // 3. Check spoofed safe tool name (tool claims a safe name, but its schema accepts arbitrary Python/code!)
  if (arbitraryCodeParamReason) {
    return {
      tool_name: toolName,
      runtime_path: runtimePath,
      classification: 'unsafe_raw_code',
      capability_tier: 'L3',
      allowed_in_governed_execution: false,
      expected_schema_fingerprint: matrixEntry?.tool_schema_fingerprint || null,
      actual_schema_fingerprint: actualFingerprint,
      contract_fingerprints: contractFingerprints,
      schema_drift_detected: Boolean(matrixEntry),
      drift_severity: matrixEntry ? 'breaking_contract_drift' : 'none',
      requalification_required: true,
      spoofed_safe_tool_name: true,
      synthetic_extension_spoof_detected: false,
      description_injection_detected: false,
      mapped_operation_ids: [],
      rationale: `Spoofed tool name '${toolName}' blocked: ${arbitraryCodeParamReason}.`,
    };
  }

  // 4. Known upstream tool in qualification matrix
  if (matrixEntry) {
    const trustedMockContext =
      !options.isLiveRuntime &&
      !options.liveTransportClient &&
      (isTrustedMockRuntimeFixture(options.trustedMockRuntime || options.mockRuntime) ||
        isTrustedMockSessionInstance(options.trustedMockSession) ||
        TRUSTED_MOCK_TOOL_OBJECTS.has(toolEntry));

    const isSyntheticEmptyMockSchema =
      trustedMockContext &&
      !options.strictSchemaFingerprint &&
      !toolEntry?.schemaDriftInjected &&
      schemaValid &&
      Object.keys(inputSchema.properties || {}).length === 0 &&
      inputSchema.additionalProperties === true;

    const inputDrift =
      Boolean(toolEntry?.schemaDriftInjected) ||
      (!isSyntheticEmptyMockSchema &&
        Boolean(actualFingerprint) &&
        actualFingerprint !== matrixEntry.tool_schema_fingerprint);

    const expectedOutputFp = matrixEntry.contract_fingerprints?.output_schema_fingerprint || null;
    const outputDrift =
      Boolean(expectedOutputFp) &&
      Boolean(contractFingerprints?.output_schema_fingerprint) &&
      contractFingerprints.output_schema_fingerprint !== expectedOutputFp;

    const driftDetected = inputDrift || outputDrift || !schemaValid;

    let driftSeverity = 'none';
    if (driftDetected) {
      driftSeverity = 'breaking_contract_drift';
    } else if (
      matrixEntry.contract_fingerprints?.metadata_fingerprint &&
      contractFingerprints?.metadata_fingerprint &&
      contractFingerprints.metadata_fingerprint !== matrixEntry.contract_fingerprints.metadata_fingerprint
    ) {
      driftSeverity = 'metadata_only';
    }

    const isConditional = matrixEntry.classification === 'conditional';
    const conditionalGatesSatisfied = Boolean(
      options.allowConditionalExport &&
        options.disposableSceneConfirmed &&
        options.checkpointVerified,
    );

    const matrixAllowed =
      typeof matrixEntry.allowed_in_governed_execution === 'boolean'
        ? matrixEntry.allowed_in_governed_execution
        : isConditional
          ? conditionalGatesSatisfied
          : Boolean(matrixEntry.bounded_and_independently_verifiable);

    const allowed =
      schemaValid &&
      !driftDetected &&
      matrixAllowed &&
      (matrixEntry.classification === 'safe_direct' ||
        matrixEntry.classification === 'read_only_only' ||
        (isConditional && conditionalGatesSatisfied));

    const entryTier = matrixEntry.required_capability_tier || matrixEntry.capability_tier || 'L0';
    const entryRationale = matrixEntry.qualification_rationale || matrixEntry.rationale || `Audited upstream tool '${toolName}'.`;

    return {
      tool_name: toolName,
      runtime_path: runtimePath,
      classification: matrixEntry.classification,
      capability_tier: entryTier,
      allowed_in_governed_execution: allowed,
      expected_schema_fingerprint: matrixEntry.tool_schema_fingerprint,
      actual_schema_fingerprint: actualFingerprint,
      contract_fingerprints: contractFingerprints,
      schema_drift_detected: driftDetected,
      drift_severity: driftSeverity,
      requalification_required: driftDetected,
      spoofed_safe_tool_name: false,
      synthetic_extension_spoof_detected: false,
      description_injection_detected: false,
      mapped_operation_ids: allowed ? mappedOps : [],
      known_upstream_issues: matrixEntry.known_upstream_issues || [],
      conditional_execution_requirements: matrixEntry.conditional_execution_requirements || null,
      rationale: !schemaValid
        ? `Tool '${toolName}' failed JSON Schema safety inspection: ${inputSafety.reason || outputSafety.reason}`
        : driftDetected
          ? `Tool '${toolName}' schema fingerprint drifted from audited upstream baseline (expected ${matrixEntry.tool_schema_fingerprint}, got ${actualFingerprint}); requalification_required before execution.`
          : entryRationale,
    };
  }

  // 5. Governed BlendOps extension tool — strict internal fixture trust boundary!
  // Only trusted when originating from a verified internal mock fixture AND matching its pinned schema fingerprint.
  if (governedSpec) {
    const isGenuineTrustedFixture =
      !options.isLiveRuntime &&
      !options.liveTransportClient &&
      (options.trustedMockFixture === true ||
        isTrustedMockRuntimeFixture(options.trustedMockRuntime || options.mockRuntime) ||
        isTrustedMockSessionInstance(options.trustedMockSession) ||
        TRUSTED_MOCK_TOOL_OBJECTS.has(toolEntry));

    if (!isGenuineTrustedFixture) {
      return {
        tool_name: toolName,
        runtime_path: runtimePath,
        classification: 'unknown',
        capability_tier: 'L3',
        allowed_in_governed_execution: false,
        expected_schema_fingerprint: governedSpec.pinned_schema_fingerprint,
        actual_schema_fingerprint: actualFingerprint,
        contract_fingerprints: contractFingerprints,
        schema_drift_detected: false,
        drift_severity: 'none',
        requalification_required: true,
        spoofed_safe_tool_name: true,
        synthetic_extension_spoof_detected: true,
        synthetic_tool_blocked_on_untrusted_runtime: true,
        description_injection_detected: false,
        mapped_operation_ids: [],
        rationale: `Synthetic BlendOps governed extension tool '${toolName}' is restricted to verified internal mock fixtures and is never trusted when advertised by live or external MCP servers.`,
      };
    }

    const driftDetected =
      Boolean(toolEntry?.schemaDriftInjected) ||
      !schemaValid ||
      actualFingerprint !== governedSpec.pinned_schema_fingerprint;

    return {
      tool_name: toolName,
      runtime_path: runtimePath,
      classification: governedSpec.classification,
      capability_tier: governedSpec.capability_tier,
      allowed_in_governed_execution: schemaValid && !driftDetected,
      expected_schema_fingerprint: governedSpec.pinned_schema_fingerprint,
      actual_schema_fingerprint: actualFingerprint,
      contract_fingerprints: contractFingerprints,
      schema_drift_detected: driftDetected,
      drift_severity: driftDetected ? 'breaking_contract_drift' : 'none',
      requalification_required: driftDetected,
      spoofed_safe_tool_name: false,
      synthetic_extension_spoof_detected: false,
      synthetic_tool_blocked_on_untrusted_runtime: false,
      description_injection_detected: false,
      mapped_operation_ids: schemaValid && !driftDetected ? mappedOps : [],
      rationale: driftDetected
        ? `Governed mock tool '${toolName}' schema fingerprint drifted from pinned fixture schema (expected ${governedSpec.pinned_schema_fingerprint}, got ${actualFingerprint}); requalification_required.`
        : governedSpec.rationale,
    };
  }

  // 6. Unknown / undocumented tool -> default to deny ('unknown')
  return {
    tool_name: toolName,
    runtime_path: runtimePath,
    classification: 'unknown',
    capability_tier: 'L3',
    allowed_in_governed_execution: false,
    expected_schema_fingerprint: null,
    actual_schema_fingerprint: actualFingerprint,
    contract_fingerprints: contractFingerprints,
    schema_drift_detected: false,
    drift_severity: 'none',
    requalification_required: true,
    spoofed_safe_tool_name: false,
    synthetic_extension_spoof_detected: false,
    description_injection_detected: false,
    mapped_operation_ids: [],
    rationale: `Tool '${toolName}' is not present in the audited upstream tool qualification matrix for '${runtimePath}'; unknown tools default to deny.`,
  };
}
/**
 * Qualifies an entire tool inventory advertised by an MCP runtime or loaded from the canonical matrix.
 * Detects duplicate tool names, schema drift, spoofed synthetic tools, and unknown tools.
 */
export function qualifyUpstreamToolInventory(tools = [], runtimePath = 'path-1-host-a', options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
  const registryDoc = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));

  const qualifiedTools = [];
  const unsafeRawCodeToolsBlocked = [];
  const unknownToolsBlocked = [];
  const unsupportedToolsBlocked = [];
  const conditionalTools = [];
  const duplicateToolNames = [];
  let schemaDriftDetected = false;
  let requalificationRequired = false;

  const nameCounts = new Map();
  for (const t of Array.isArray(tools) ? tools : []) {
    const rawName = typeof (t?.name ?? t?.tool_name) === 'string' ? (t.name ?? t.tool_name).trim() : '';
    if (rawName) {
      nameCounts.set(rawName, (nameCounts.get(rawName) || 0) + 1);
    }
  }
  for (const [name, count] of nameCounts.entries()) {
    if (count > 1) {
      duplicateToolNames.push(name);
    }
  }

  for (const t of Array.isArray(tools) ? tools : []) {
    if (!t || typeof (t.name ?? t.tool_name) !== 'string' || !(t.name ?? t.tool_name).trim()) {
      continue;
    }
    const q = qualifyUpstreamTool(t, runtimePath, registryDoc, options);
    if (duplicateToolNames.includes(q.tool_name)) {
      q.classification = 'unknown';
      q.allowed_in_governed_execution = false;
      q.schema_drift_detected = true;
      q.drift_severity = 'breaking_contract_drift';
      q.requalification_required = true;
      q.mapped_operation_ids = [];
      q.rationale = `Duplicate tool definition '${q.tool_name}' advertised in MCP tools/list response; rejected by contract integrity policy.`;
    }
    qualifiedTools.push(q);
    if (q.schema_drift_detected) schemaDriftDetected = true;
    if (q.requalification_required) requalificationRequired = true;
    if (q.classification === 'unsafe_raw_code') {
      if (!unsafeRawCodeToolsBlocked.includes(q.tool_name)) unsafeRawCodeToolsBlocked.push(q.tool_name);
    } else if (q.classification === 'unknown') {
      if (!unknownToolsBlocked.includes(q.tool_name)) unknownToolsBlocked.push(q.tool_name);
    } else if (q.classification === 'unsupported') {
      if (!unsupportedToolsBlocked.includes(q.tool_name)) unsupportedToolsBlocked.push(q.tool_name);
    } else if (q.classification === 'conditional') {
      if (!conditionalTools.includes(q.tool_name)) conditionalTools.push(q.tool_name);
    }
  }

  return {
    runtime_path: runtimePath,
    tool_inventory_fingerprint: computeToolInventoryFingerprint(
      qualifiedTools.map((qt) => ({
        name: qt.tool_name,
        inputSchema:
          (Array.isArray(tools) ? tools : []).find(
            (raw) => (raw?.name || raw?.tool_name) === qt.tool_name,
          )?.inputSchema ||
          (Array.isArray(tools) ? tools : []).find(
            (raw) => (raw?.name || raw?.tool_name) === qt.tool_name,
          )?.input_schema ||
          {},
      })),
    ),
    duplicate_tool_names_detected: duplicateToolNames.length > 0,
    duplicate_tool_names: duplicateToolNames,
    schema_drift_detected: schemaDriftDetected,
    requalification_required: requalificationRequired,
    unsafe_raw_code_tools_blocked: unsafeRawCodeToolsBlocked,
    unknown_tools_blocked: unknownToolsBlocked,
    unsupported_tools_blocked: unsupportedToolsBlocked,
    conditional_tools: conditionalTools,
    qualified_tools: qualifiedTools,
  };
}
/**
 * Evaluates all 18 canonical BlendOps operations (plus 3 blocked L3 interfaces)
 * against the audited upstream tool inventories for Path 1 and Path 2.
 * Also validates custom/override mappings to prevent mapping L0 operations to mutating tools
 * or mapping L1/L2 operations to unsafe_raw_code tools.
 */
export function evaluateOperationMappingsAgainstUpstream(repoRoot = DEFAULT_REPO_ROOT, options = {}) {
  const projectDir = options.projectDir || null;
  const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
  const registryDoc = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));
  const targetPath = options.runtimePath || null;

  const errors = [];
  const mappings = [];
  const operations = registryDoc.operations || [];

  for (const op of operations) {
    const candidatePaths = targetPath
      ? op.supported_runtime_paths.filter((rp) => rp === targetPath)
      : op.supported_runtime_paths;

    for (const rp of candidatePaths) {
      const m = op.runtime_tool_mappings?.[rp];
      if (!m) continue;
      const overrideTool = options.overrideMappings?.[op.operation_id]?.[rp] || m.primary_tool;
      const upstreamTool = options.overrideMappings?.[op.operation_id]?.[rp] || m.upstream_mcp_tool_name || m.primary_tool;
      const upstreamEntry = (registryDoc.upstream_tool_qualification_matrix || []).find(
        (entry) => entry.tool_name === upstreamTool && doesMatrixEntryMatchRuntimePath(entry, rp),
      ) || null;

      // Critical security checks on mapping
      if (
        overrideTool === 'execute_blender_code' ||
        overrideTool === 'execute_blender_code_for_cli' ||
        upstreamEntry?.classification === 'unsafe_raw_code'
      ) {
        errors.push(
          `Operation '${op.operation_id}' on '${rp}' is mapped to unsafe_raw_code tool '${overrideTool}'; translating typed operations into raw Python execution is forbidden.`,
        );
      }

      if (
        op.behavior === 'read_only' &&
        ((upstreamEntry && upstreamEntry.classification !== 'read_only_only') ||
          GOVERNED_EXTENSION_TOOL_SPECS[overrideTool]?.capability_tier === 'L1' ||
          GOVERNED_EXTENSION_TOOL_SPECS[overrideTool]?.capability_tier === 'L2')
      ) {
        errors.push(
          `Read-only L0 operation '${op.operation_id}' on '${rp}' cannot map to mutating/non-read-only tool '${overrideTool}'.`,
        );
      }

      mappings.push({
        operation_id: op.operation_id,
        display_name: op.display_name,
        required_capability_tier: op.required_capability_tier,
        behavior: op.behavior,
        runtime_path: rp,
        primary_tool: overrideTool,
        upstream_mcp_tool_name: m.upstream_mcp_tool_name ?? null,
        tool_schema_fingerprint: m.tool_schema_fingerprint,
        upstream_qualification_status: m.upstream_qualification_status,
        requires_bounded_governed_extension: Boolean(m.requires_bounded_governed_extension),
        readback_tools: m.readback_tools || [],
        checkpoint_requirement: op.backup_requirement,
        rollback_strategy: m.rollback_strategy,
        qualification_evidence: m.qualification_evidence,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    runtime_path_filter: targetPath,
    total_mappings: mappings.length,
    upstream_runtime_compatibility_matrix: registryDoc.upstream_runtime_compatibility_matrix || {},
    blocked_arbitrary_interfaces: registryDoc.blocked_arbitrary_interfaces || [],
    mappings,
  };
}
/**
 * Validates `registry/runtime-operations.json` against `schemas/runtime-operations.schema.json`
 * and enforces semantic invariants across capability tiers, governed runtime ceilings, upstream tool qualification matrix, and laws.
 */
export function validateRuntimeOperationsRegistry(repoRoot = DEFAULT_REPO_ROOT, options = {}) {
  const paths = resolveRuntimeGovernancePaths(repoRoot, options.projectDir || null);
  const errors = [];

  if (!fs.existsSync(paths.runtimeOperationsPath)) {
    return {
      valid: false,
      errors: [`Missing runtime operations registry at ${paths.runtimeOperationsPath}`],
      operation_count: 0,
    };
  }

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));
  } catch (err) {
    return {
      valid: false,
      errors: [`Invalid JSON in ${paths.runtimeOperationsPath}: ${err.message}`],
      operation_count: 0,
    };
  }

  const validateSchema = getAjvValidator(paths.runtimeOperationsSchemaPath);
  if (!validateSchema(registry)) {
    for (const err of validateSchema.errors || []) {
      errors.push(`schema(${err.instancePath || '/'}): ${err.message}`);
    }
  }

  const policy = fs.existsSync(paths.capabilityPolicyPath)
    ? JSON.parse(fs.readFileSync(paths.capabilityPolicyPath, 'utf8'))
    : null;
  const policySkillMap = new Map(
    (policy?.skills || []).map((s) => [s.skillId, s]),
  );

  // Validate upstream_tool_qualification_matrix fingerprints and safety classifications
  const upstreamMatrix = Array.isArray(registry?.upstream_tool_qualification_matrix)
    ? registry.upstream_tool_qualification_matrix
    : [];
  const seenUpstreamKeys = new Set();
  for (const item of upstreamMatrix) {
    const rPaths = Array.isArray(item.runtime_paths)
      ? item.runtime_paths.join(',')
      : String(item.runtime_path || 'unknown');
    const key = `${rPaths}::${item.tool_name}`;
    if (seenUpstreamKeys.has(key)) {
      errors.push(`Duplicate upstream_tool_qualification_matrix entry '${key}'`);
    }
    seenUpstreamKeys.add(key);

    const expectedFp = computeToolSchemaFingerprint(item.tool_name, item.input_schema);
    if (item.tool_schema_fingerprint !== expectedFp) {
      errors.push(
        `Upstream tool '${key}' has mismatched tool_schema_fingerprint (expected ${expectedFp}, got ${item.tool_schema_fingerprint})`,
      );
    }

    if (
      (item.tool_name === 'execute_blender_code' || item.tool_name === 'execute_blender_code_for_cli') &&
      (item.classification !== 'unsafe_raw_code' || item.bounded_and_independently_verifiable !== false)
    ) {
      errors.push(
        `Raw code execution tool '${key}' must be classified as 'unsafe_raw_code' with bounded_and_independently_verifiable=false`,
      );
    }
  }

  const seenIds = new Set();
  const operations = Array.isArray(registry?.operations) ? registry.operations : [];

  for (const op of operations) {
    if (!op || typeof op !== 'object') continue;
    if (seenIds.has(op.operation_id)) {
      errors.push(`Duplicate operation_id '${op.operation_id}' in runtime-operations.json`);
    }
    seenIds.add(op.operation_id);

    if (op.user_facing_python_allowed !== false) {
      errors.push(`Operation '${op.operation_id}' violates laws/no-arbitrary-python-interface.md: user_facing_python_allowed must be false`);
    }

    // Check input schema rejects arbitrary code/python/shell properties
    const propNames = Object.keys(op.input_schema?.properties || {});
    for (const prop of propNames) {
      if (/^(python_code|raw_python|bpy_script|shell_command|eval_code)$/i.test(prop)) {
        errors.push(`Operation '${op.operation_id}' exposes prohibited arbitrary execution parameter '${prop}'`);
      }
    }

    // Check tier vs behavior alignment
    if (op.behavior === 'read_only' && op.required_capability_tier !== 'L0') {
      errors.push(`Read-only operation '${op.operation_id}' must have required_capability_tier 'L0'`);
    }
    if (op.behavior === 'mutating' && op.required_capability_tier === 'L0') {
      errors.push(`Mutating operation '${op.operation_id}' cannot have required_capability_tier 'L0'`);
    }
    if (op.behavior !== 'read_only' && op.backup_requirement !== 'verified_pre_mutation_blend_checkpoint') {
      errors.push(`Mutating/export operation '${op.operation_id}' must require 'verified_pre_mutation_blend_checkpoint'`);
    }
    if (op.behavior === 'mutating' && op.timeout_and_retry_policy?.retry_on_timeout !== false) {
      errors.push(`Mutating operation '${op.operation_id}' must not enable blind retry_on_timeout`);
    }

    // Verify every supported runtime path has a mapping and never maps to execute_blender_code
    for (const rp of op.supported_runtime_paths || []) {
      const mapping = op.runtime_tool_mappings?.[rp];
      if (!mapping) {
        errors.push(`Operation '${op.operation_id}' declares supported_runtime_path '${rp}' without a runtime_tool_mappings['${rp}'] entry`);
      } else if (
        mapping.primary_tool === 'execute_blender_code' ||
        mapping.primary_tool === 'execute_blender_code_for_cli' ||
        mapping.upstream_mcp_tool_name === 'execute_blender_code' ||
        mapping.upstream_mcp_tool_name === 'execute_blender_code_for_cli'
      ) {
        errors.push(
          `Operation '${op.operation_id}' on '${rp}' illegally maps to arbitrary Python tool '${mapping.primary_tool}'`,
        );
      }
    }

    // Verify governing skills exist and have compatible governedRuntimeCeiling
    if (policySkillMap.size > 0) {
      const opReqRank = TIER_RANKS[op.required_governed_runtime_ceiling] ?? 0;
      let hasAuthorizingSkill = false;
      for (const skillId of op.governing_skills || []) {
        const skillPolicy = policySkillMap.get(skillId);
        if (!skillPolicy) {
          errors.push(`Operation '${op.operation_id}' references unknown governing skill '${skillId}'`);
          continue;
        }
        if (skillPolicy.capabilityTier !== 'L0') {
          errors.push(`Skill '${skillId}' capabilityTier must remain 'L0' (distinct from governedRuntimeCeiling)`);
        }
        const skillCeilingRank = TIER_RANKS[skillPolicy.governedRuntimeCeiling] ?? 0;
        if (skillCeilingRank >= opReqRank) {
          hasAuthorizingSkill = true;
        }
      }
      if (!hasAuthorizingSkill) {
        errors.push(
          `Operation '${op.operation_id}' requires governed ceiling ${op.required_governed_runtime_ceiling}, but none of its governing_skills (${(op.governing_skills || []).join(', ')}) have a ceiling >= ${op.required_governed_runtime_ceiling}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    operation_count: operations.length,
    upstream_tool_count: upstreamMatrix.length,
    counts_by_tier: {
      L0: operations.filter((o) => o.required_capability_tier === 'L0').length,
      L1: operations.filter((o) => o.required_capability_tier === 'L1').length,
      L2: operations.filter((o) => o.required_capability_tier === 'L2').length,
    },
    source_mode: paths.sourceMode,
    registry_path: paths.runtimeOperationsPath,
  };
}
export function listRuntimeOperations(repoRoot = DEFAULT_REPO_ROOT, options = {}) {
  const paths = resolveRuntimeGovernancePaths(repoRoot, options.projectDir || null);
  const registry = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));
  let operations = registry.operations || [];

  if (options.tier) {
    operations = operations.filter((o) => o.required_capability_tier === options.tier);
  }
  if (options.runtimePath) {
    operations = operations.filter((o) => o.supported_runtime_paths.includes(options.runtimePath));
  }
  if (options.category) {
    operations = operations.filter((o) => o.category === options.category);
  }

  return {
    schema_version: registry.schema_version,
    registry_id: registry.registry_id,
    total_operations: operations.length,
    blocked_arbitrary_interfaces: registry.blocked_arbitrary_interfaces,
    operations,
  };
}
export function getRuntimeOperation(repoRoot = DEFAULT_REPO_ROOT, operationId, options = {}) {
  const paths = resolveRuntimeGovernancePaths(repoRoot, options.projectDir || null);
  const registry = JSON.parse(fs.readFileSync(paths.runtimeOperationsPath, 'utf8'));
  return (registry.operations || []).find((o) => o.operation_id === operationId) || null;
}
