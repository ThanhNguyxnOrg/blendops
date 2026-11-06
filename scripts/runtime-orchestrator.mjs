#!/usr/bin/env node
/**
 * BlendOps Phase 3 — Blender Production Layer & Safe Runtime Integration
 *
 * Implements:
 * - Phase 3A: Runtime Discovery, Session Contract & Capability Negotiation
 * - Phase 3B: Canonical Typed Operation Registry Validation & Lookup
 * - Phase 3C: Execution Safety State Machine, Pre-Mutation .blend Checkpoints,
 *             Idempotency, Independent Readback, Postcondition Verification & Rollback
 * - Phase 3D: Safe Blender Production Vertical Slice (L0 Inspection + Bounded L1 Camera/Light Mutation)
 * - Section 6: Redacted Operation Execution Ledger & Runtime Evidence Packet Integration
 * - Section 7: CLI Subcommands (runtime doctor/inspect/capabilities, operation list/validate, execution preflight/report/inspect)
 * - Section 8: Deterministic Realistic Mock MCP Runtime (with adversarial fault injection)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  validateSceneSpec,
  compileExecutionPlan,
  inspectExecutionPlan,
  resolveCatalogPaths,
  validateSafeCliOutFilePath,
  writeFileAtomicallySafe,
} from './compile-scene-plan.mjs';
import {
  TIER_RANKS,
  validateCapabilityPolicyObject,
  evaluateRuntimeCapabilityInvocation,
} from './validate-capability-policy.mjs';
import {
  validateEvidencePacket,
  isVersionAtLeast,
} from './validate-evidence-packet.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_REPO_ROOT = path.resolve(__dirname, '..');

export const RUNTIME_CLI_SUBCOMMANDS = new Set([
  'runtime',
  'operation',
  'execution',
  'runtime-doctor',
  'runtime-inspect',
  'runtime-capabilities',
  'operation-list',
  'operation-validate',
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
      'execute_blender_code',
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
      'execute_blender_code',
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

const SECRET_KEY_PATTERN =
  /(password|passwd|secret|token|api[-_]?key|authorization|bearer|private[-_]?key|client[-_]?secret|credential|session[-_]?key|access[-_]?key|auth[-_]?header|cookie|set[-_]?cookie)/i;
const SECRET_VALUE_PATTERN =
  /(Bearer\s+[A-Za-z0-9._~+/=-]{6,}|Basic\s+[A-Za-z0-9+/=]{8,}|sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{10,}|github_pat_[A-Za-z0-9_]{10,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z-_]{12,}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})/g;
const URL_USERINFO_PATTERN = /([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)([^/\s:@]+:[^/\s@]+)@/g;
const URL_QUERY_SECRET_PATTERN =
  /([?&](?:token|api_key|apikey|access_token|refresh_token|secret|password|passwd|auth|key|credential|client_secret|sig|signature)=)([^&#\s"']+)/gi;
const INLINE_ASSIGN_SECRET_PATTERN =
  /((?:password|passwd|secret|token|api[_-]?key|authorization|client[_-]?secret|private[_-]?key)\s*[:=]\s*["']?)([A-Za-z0-9._~+/=-]{6,})(["']?)/gi;

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function stableCanonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableCanonicalJson(item)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableCanonicalJson(value[k])}`).join(',')}}`;
}

function redactStringSecrets(str) {
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

/**
 * Redacts passwords, tokens, API keys, URL query secrets, userinfo, JWTs,
 * and Error objects from any object/array/string/Error.
 */
export function redactSensitiveData(input) {
  let secretsRedacted = false;

  function walk(val, keyName = '') {
    if (keyName && SECRET_KEY_PATTERN.test(keyName)) {
      secretsRedacted = true;
      return '[REDACTED]';
    }
    if (typeof val === 'string') {
      const res = redactStringSecrets(val);
      if (res.changed) secretsRedacted = true;
      return res.value;
    }
    if (Array.isArray(val)) {
      return val.map((item) => walk(item, ''));
    }
    if (val instanceof Error) {
      const errObj = {
        name: val.name || 'Error',
        message: walk(val.message || '', ''),
      };
      if (val.code !== undefined) errObj.code = walk(val.code, 'code');
      if (val.stack !== undefined) errObj.stack = walk(val.stack, '');
      if (val.cause !== undefined) errObj.cause = walk(val.cause, 'cause');
      for (const [k, v] of Object.entries(val)) {
        if (!(k in errObj)) {
          errObj[k] = walk(v, k);
        }
      }
      return errObj;
    }
    if (val && typeof val === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(val)) {
        out[k] = walk(v, k);
      }
      return out;
    }
    return val;
  }

  const redacted = walk(input, '');
  return { redacted, secretsRedacted };
}

/**
 * Validates an MCP transport endpoint string, rejecting malformed URLs,
 * unsafe schemes (file:, javascript:, data:, ftp:), embedded credentials,
 * and non-loopback endpoints unless allowRemoteEndpoint is true.
 */
export function validateRuntimeTransportEndpoint(endpoint, options = {}) {
  if (endpoint === null || endpoint === undefined) {
    return { valid: true, normalized: null, reason: null, error: null };
  }
  if (typeof endpoint !== 'string' || !endpoint.trim() || endpoint.includes('\0')) {
    const msg = 'Transport endpoint must be a non-empty string without null bytes.';
    return {
      valid: false,
      normalized: null,
      reason: msg,
      error: msg,
    };
  }
  const trimmed = endpoint.trim();
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    const msg = `Malformed MCP transport endpoint URL: ${redactStringSecrets(trimmed).value}`;
    return {
      valid: false,
      normalized: null,
      reason: msg,
      error: msg,
    };
  }
  const allowedProtocols = new Set(['http:', 'https:', 'ws:', 'wss:', 'stdio:']);
  if (!allowedProtocols.has(parsed.protocol)) {
    const msg = `Unsupported MCP transport protocol '${parsed.protocol}'. Allowed: http:, https:, ws:, wss:, stdio:.`;
    return {
      valid: false,
      normalized: null,
      reason: msg,
      error: msg,
    };
  }
  if (parsed.username || parsed.password) {
    const msg = 'Transport endpoint URL must not contain embedded user:password credentials.';
    return {
      valid: false,
      normalized: null,
      reason: msg,
      error: msg,
    };
  }
  if (parsed.protocol !== 'stdio:') {
    const host = (parsed.hostname || '').toLowerCase();
    const isLoopback =
      host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
    if (!isLoopback && !options.allowRemoteEndpoint) {
      const msg = `Non-loopback MCP transport endpoint '${host}' is rejected by default; local Blender MCP bridges must bind to loopback (127.0.0.1 / localhost / ::1) unless allowRemoteEndpoint is explicitly enabled.`;
      return {
        valid: false,
        normalized: null,
        reason: msg,
        error: msg,
      };
    }
  }
  return { valid: true, normalized: parsed.toString(), reason: null, error: null };
}

const INDIRECT_CODE_INJECTION_PATTERNS = [
  { id: 'bpy_import_or_api', regex: /\b(import\s+bpy|from\s+bpy\s+import|bpy\.ops\.|bpy\.context\.|bpy\.data\.)/i },
  { id: 'python_dunder_or_eval', regex: /(\b__import__\s*\(|\beval\s*\(|\bexec\s*\(|\bcompile\s*\(|__builtins__|__subclasses__)/i },
  { id: 'python_os_or_subprocess', regex: /\b(subprocess\.(run|Popen|call|check_output)|os\.(system|popen|execv|unlink|remove))\b/i },
  { id: 'shell_command_injection', regex: /(;\s*rm\s+-rf\b|\|\s*sh\b|\|\s*bash\b|\$\([^)]+\)|`[^`]+`)/i },
];

/**
 * Recursively inspects operation input payloads for indirect Python, bpy, or shell command injection.
 * Returns null if safe, or a descriptive error string when an injection pattern is detected.
 */
export function detectIndirectCodeInjection(inputObj) {
  const hits = [];

  function inspect(val, pathPrefix = 'input') {
    if (typeof val === 'string') {
      for (const pat of INDIRECT_CODE_INJECTION_PATTERNS) {
        if (pat.regex.test(val)) {
          hits.push({
            field: pathPrefix,
            pattern_id: pat.id,
          });
        }
      }
      return;
    }
    if (Array.isArray(val)) {
      val.forEach((item, idx) => inspect(item, `${pathPrefix}[${idx}]`));
      return;
    }
    if (val && typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) {
        if (/^(python_code|raw_python|bpy_script|shell_command|eval_code)$/i.test(k)) {
          hits.push({
            field: `${pathPrefix}.${k}`,
            pattern_id: 'prohibited_arbitrary_code_property',
          });
        }
        inspect(v, `${pathPrefix}.${k}`);
      }
    }
  }

  inspect(inputObj, 'input');
  if (hits.length === 0) return null;
  return `Indirect code/command injection detected in ${hits.map((h) => `${h.field} (${h.pattern_id})`).join(', ')}; arbitrary Python/bpy/shell execution is blocked per laws/no-arbitrary-python-interface.md.`;
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
  };
}

let cachedValidators = new Map();

function getAjvValidator(schemaPath) {
  if (cachedValidators.has(schemaPath)) {
    return cachedValidators.get(schemaPath);
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  cachedValidators.set(schemaPath, validate);
  return validate;
}

/**
 * Validates `registry/runtime-operations.json` against `schemas/runtime-operations.schema.json`
 * and enforces semantic invariants across capability tiers, governed runtime ceilings, and laws.
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

    // Verify every supported runtime path has a mapping
    for (const rp of op.supported_runtime_paths || []) {
      const mapping = op.runtime_tool_mappings?.[rp];
      if (!mapping) {
        errors.push(`Operation '${op.operation_id}' declares supported_runtime_path '${rp}' without a runtime_tool_mappings['${rp}'] entry`);
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

/**
 * Creates a deterministic, realistic mock MCP runtime for automated testing and vertical-slice simulation.
 * Supports adversarial scenarios:
 * - 'healthy' (default): full L0 + L1 (and optional L2) support with realistic scene state
 * - 'read_only_only': only L0 read-only tools exposed
 * - 'unreachable': transport connection fails
 * - 'unsupported_version': Blender version below path floor (e.g. 4.2.0 on Path 1, or 2.93.0 on Path 2)
 * - 'missing_tools': required read-only tool missing from manifest
 * - 'invalid_tool_schema': tool manifest contains a non-object / corrupt input_schema
 * - 'bridge_conflict': mixes Path 1 and Path 2 tools or reports dual-bridge collision on port 9876
 * - 'host_context_only': host does not expose direct MCP discovery
 * - 'backup_failure': runtime refuses or fails to write pre-mutation .blend backup
 * - 'backup_sha_mismatch': runtime writes corrupted backup bytes whose SHA-256 does not match source .blend
 * - 'mutation_timeout': mutation call times out ambiguously
 * - 'ambiguous_mutation_result': mutation returns malformed/incomplete response without confirmation
 * - 'postcondition_mismatch': mutation claims success but readback reveals camera/light did not change
 * - 'rollback_failure': postcondition fails AND checkpoint restore also fails
 * - 'partial_multi_step_failure': first L1 mutation succeeds, second L1 mutation fails postcondition -> triggers rollback of entire sequence
 */
export function createMockMcpRuntime(options = {}) {
  const runtimePath = options.runtimePath || 'path-1-host-a';
  const scenario = options.scenario || 'healthy';
  const tempDir = options.tempDir || fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-mock-rt-'));
  const blendFilePath = options.blendFilePath || path.join(tempDir, 'product-hero-sneaker.blend');

  // Create a deterministic synthetic .blend file on disk if not present
  const initialSceneState = {
    filepath: blendFilePath,
    saved: true,
    dirty: false,
    scene_name: 'ProductHeroScene',
    render_engine: 'CYCLES',
    resolution_x: 2048,
    resolution_y: 2048,
    view_transform: 'AgX',
    active_object: 'SneakerHeroMesh',
    action_count: 0,
    armature_count: 0,
    frame_start: 1,
    frame_end: 120,
    missing_files_count: 0,
    linked_libraries_count: 0,
    objects: [
      {
        name: 'SneakerHeroMesh',
        type: 'MESH',
        visible: true,
        location: [0, 0, 0.12],
        rotation_euler_deg: [0, 0, -18],
        scale: [1, 1, 1],
        triangles: 42800,
        vertices: 22150,
        uv_layers: 1,
        materials: [
          {
            name: 'SneakerUpperPBR',
            base_color_rgba: [0.12, 0.14, 0.18, 1.0],
            metallic: 0.0,
            roughness: 0.42,
            ior: 1.45,
          },
        ],
      },
      {
        name: 'StudioSweepBackdrop',
        type: 'MESH',
        visible: true,
        location: [0, 1.5, 0],
        rotation_euler_deg: [0, 0, 0],
        scale: [1, 1, 1],
        triangles: 512,
        vertices: 289,
        uv_layers: 1,
        materials: [
          {
            name: 'MatteBackdrop',
            base_color_rgba: [0.05, 0.05, 0.06, 1.0],
            metallic: 0.0,
            roughness: 0.85,
            ior: 1.45,
          },
        ],
      },
      {
        name: 'Camera',
        type: 'CAMERA',
        visible: true,
        location: [0.0, -2.8, 0.65],
        rotation_euler_deg: [78.0, 0.0, 0.0],
        scale: [1, 1, 1],
        focal_length_mm: 50,
        dof_enabled: true,
        f_stop: 4.0,
      },
      {
        name: 'KeyLight',
        type: 'LIGHT',
        visible: true,
        location: [-1.4, -1.6, 1.8],
        rotation_euler_deg: [45.0, 0.0, -35.0],
        scale: [1, 1, 1],
        energy_watts: 250,
        color_rgb: [1.0, 0.98, 0.95],
        area_size: 1.2,
      },
      {
        name: 'FillLight',
        type: 'LIGHT',
        visible: true,
        location: [1.8, -1.4, 1.1],
        rotation_euler_deg: [55.0, 0.0, 40.0],
        scale: [1, 1, 1],
        energy_watts: 90,
        color_rgb: [0.92, 0.96, 1.0],
        area_size: 1.8,
      },
      {
        name: 'RimLight',
        type: 'LIGHT',
        visible: true,
        location: [0.2, 1.5, 1.9],
        rotation_euler_deg: [-40.0, 0.0, 170.0],
        scale: [1, 1, 1],
        energy_watts: 180,
        color_rgb: [1.0, 1.0, 1.0],
        area_size: 0.8,
      },
    ],
  };

  let sceneState = JSON.parse(JSON.stringify(initialSceneState));
  let mutationCallCount = 0;

  function serializeBlendBytes(state) {
    return Buffer.from(`BLENDER-v501-MOCK-STATE\n${stableCanonicalJson(state)}\n`, 'utf8');
  }

  fs.mkdirSync(path.dirname(blendFilePath), { recursive: true });
  fs.writeFileSync(blendFilePath, serializeBlendBytes(sceneState));

  const pathSpec = RECOGNIZED_RUNTIME_PATHS[runtimePath];
  const defaultBlenderVersion =
    runtimePath === 'path-2-community' ? '4.2.3' : '5.1.0';
  const reportedBlenderVersion =
    scenario === 'unsupported_version'
      ? runtimePath === 'path-2-community'
        ? '2.93.0'
        : '4.2.0'
      : options.blenderVersion || defaultBlenderVersion;

  function buildToolManifest() {
    if (!pathSpec) return [];
    const toolNames = [
      ...pathSpec.requiredReadOnlyTools,
      ...pathSpec.optionalReadOnlyTools,
      ...(scenario === 'read_only_only' ? [] : pathSpec.governedMutationTools),
      ...(options.includeExportTools ? pathSpec.governedExportTools : []),
    ];

    let filteredNames = toolNames;
    if (scenario === 'missing_tools') {
      filteredNames = toolNames.slice(1);
    }
    if (scenario === 'bridge_conflict') {
      filteredNames = [...toolNames, 'get_scene_info', 'get_blendfile_summary_datablocks'];
    }

    return filteredNames.map((name, idx) => ({
      name,
      description: `Verified MCP tool ${name} for ${runtimePath}`,
      inputSchema:
        scenario === 'invalid_tool_schema' && idx === 0
          ? null
          : {
              type: 'object',
              additionalProperties: true,
              properties: {},
            },
    }));
  }

  return {
    isMockRuntime: true,
    scenario,
    runtimePath,
    tempDir,
    blendFilePath,
    getSceneState: () => JSON.parse(JSON.stringify(sceneState)),
    getMutationCallCount: () => mutationCallCount,
    probeSession() {
      if (scenario === 'unreachable') {
        return {
          reachable: false,
          error: 'Connection refused on MCP transport socket (127.0.0.1:9876)',
        };
      }
      if (scenario === 'stale_session') {
        return {
          reachable: true,
          stale: true,
          lastHeartbeatMs: Date.now() - 120000,
          sessionTtlMs: 30000,
          hostIdentity: 'Anthropic Blender Connector (Stale Session)',
          addonOrServerIdentity: 'Blender Lab MCP Add-on mcp-1.0.3 (bpype/blender_mcp)',
          blenderVersion: reportedBlenderVersion,
          runtimeVersion: '1.0.3',
          singleBridgeVerified: true,
          backupSupported: true,
          restoreSupported: true,
          tools: buildToolManifest(),
        };
      }
      if (scenario === 'host_context_only') {
        return {
          reachable: false,
          hostContextOnly: true,
          hostIdentity: 'Claude Desktop (Host Capability Context Only)',
          knownLimitation:
            'Host environment does not expose direct MCP tool discovery to local CLI; reporting host-provided capability context without claiming an active Blender session.',
        };
      }
      return {
        reachable: true,
        hostIdentity:
          runtimePath === 'path-1-host-a'
            ? 'Anthropic Blender Connector (Claude Desktop Mock Host)'
            : runtimePath === 'path-1-host-b'
              ? 'Manual MCP Client (Mock Host)'
              : 'MCP Client for mcp-for-blender (Mock Host)',
        addonOrServerIdentity:
          runtimePath.startsWith('path-1')
            ? 'Blender Lab MCP Add-on mcp-1.0.3 (bpype/blender_mcp)'
            : 'mcp-for-blender addon.py + uvx mcp-for-blender 1.2.0',
        blenderVersion: reportedBlenderVersion,
        runtimeVersion: runtimePath.startsWith('path-1') ? '1.0.3' : '1.2.0',
        singleBridgeVerified: scenario !== 'bridge_conflict',
        backupSupported: scenario !== 'backup_unsupported',
        restoreSupported: scenario !== 'restore_unsupported',
        tools: buildToolManifest(),
      };
    },
    createCheckpoint(sourcePath, backupPath) {
      if (scenario === 'backup_failure') {
        throw new Error('Mock runtime failed to save pre-mutation .blend checkpoint on disk');
      }
      const sourceBytes = fs.readFileSync(sourcePath);
      if (scenario === 'backup_sha_mismatch') {
        fs.writeFileSync(backupPath, Buffer.concat([sourceBytes, Buffer.from('CORRUPT')]));
      } else {
        fs.writeFileSync(backupPath, sourceBytes);
      }
      return { backupPath };
    },
    restoreCheckpoint(backupPath, targetBlendPath) {
      if (scenario === 'rollback_failure') {
        throw new Error('Mock runtime failed to restore .blend checkpoint after failed mutation');
      }
      const backupBytes = fs.readFileSync(backupPath);
      fs.writeFileSync(targetBlendPath, backupBytes);
      if (scenario !== 'rollback_unverified_readback') {
        const rawText = backupBytes.toString('utf8');
        const lines = rawText.split('\n');
        if (lines.length >= 2 && lines[1].startsWith('{')) {
          sceneState = JSON.parse(lines[1]);
        }
      }
      return { restored: true, targetBlendPath };
    },
    invokeTool(toolName, input = {}) {
      // Read-only tools
      if (
        toolName === 'get_blendfile_summary_path_info' ||
        toolName === 'get_addon_status'
      ) {
        return {
          status: 'ok',
          data: {
            filepath: sceneState.filepath,
            saved: sceneState.saved,
            dirty: sceneState.dirty,
            addon_status: 'connected',
          },
        };
      }

      if (
        toolName === 'get_blendfile_summary_datablocks' ||
        toolName === 'get_scene_info'
      ) {
        return {
          status: 'ok',
          data: {
            filepath: sceneState.filepath,
            saved: sceneState.saved,
            scene_name: sceneState.scene_name,
            render_engine: sceneState.render_engine,
            resolution_x: sceneState.resolution_x,
            resolution_y: sceneState.resolution_y,
            view_transform: sceneState.view_transform,
            object_count: sceneState.objects.length,
            active_object: sceneState.active_object,
            action_count: sceneState.action_count,
            armature_count: sceneState.armature_count,
            frame_start: sceneState.frame_start,
            frame_end: sceneState.frame_end,
            datablock_counts: {
              scenes: 1,
              objects: sceneState.objects.length,
              meshes: sceneState.objects.filter((o) => o.type === 'MESH').length,
              cameras: sceneState.objects.filter((o) => o.type === 'CAMERA').length,
              lights: sceneState.objects.filter((o) => o.type === 'LIGHT').length,
              materials: 2,
            },
            objects: JSON.parse(JSON.stringify(sceneState.objects)),
          },
        };
      }

      if (toolName === 'get_objects_summary' || toolName === 'get_object_info') {
        const objectsCopy = JSON.parse(JSON.stringify(sceneState.objects));
        return {
          status: 'ok',
          data: {
            objects: objectsCopy,
            cameras: objectsCopy.filter((o) => o.type === 'CAMERA'),
            lights: objectsCopy.filter((o) => o.type === 'LIGHT'),
            root_objects: objectsCopy.map((o) => o.name),
            negative_scale_objects: objectsCopy
              .filter((o) => Array.isArray(o.scale) && o.scale.some((s) => s <= 0))
              .map((o) => o.name),
            unapplied_scale_objects: objectsCopy
              .filter((o) => Array.isArray(o.scale) && o.scale.some((s) => Math.abs(s - 1) > 1e-3))
              .map((o) => o.name),
          },
        };
      }

      if (
        toolName === 'get_blendfile_summary_missing_files' ||
        toolName === 'get_blendfile_summary_of_linked_libraries'
      ) {
        return {
          status: 'ok',
          data: {
            export_ready: true,
            missing_files_count: sceneState.missing_files_count,
            linked_libraries_count: sceneState.linked_libraries_count,
            blockers: [],
          },
        };
      }

      // Governed L1 mutations
      mutationCallCount += 1;

      if (scenario === 'mutation_timeout') {
        const err = new Error(`Tool '${toolName}' timed out after 8000ms with ambiguous scene state`);
        err.code = 'ETIMEDOUT';
        throw err;
      }

      if (scenario === 'ambiguous_mutation_result') {
        return {
          status: 'ambiguous',
          data: null,
        };
      }

      if (toolName === 'set_camera_properties_governed') {
        const cam = sceneState.objects.find(
          (o) => o.type === 'CAMERA' && o.name === input.camera_name,
        );
        if (!cam) {
          throw new Error(`Camera '${input.camera_name}' not found in scene`);
        }
        if (scenario === 'mutation_echo_without_scene_change') {
          return {
            status: 'ok',
            data: {
              camera_name: cam.name,
              updated: true,
              location: [...input.location],
              rotation_euler_deg: [...input.rotation_euler_deg],
              focal_length_mm: input.focal_length_mm,
            },
          };
        }
        if (scenario !== 'postcondition_mismatch') {
          cam.location = [...input.location];
          cam.rotation_euler_deg = [...input.rotation_euler_deg];
          cam.focal_length_mm = input.focal_length_mm;
          if (typeof input.dof_enabled === 'boolean') cam.dof_enabled = input.dof_enabled;
          if (typeof input.f_stop === 'number') cam.f_stop = input.f_stop;
          fs.writeFileSync(blendFilePath, serializeBlendBytes(sceneState));
        }
        return {
          status: 'ok',
          data: {
            camera_name: cam.name,
            updated: true,
            location: [...cam.location],
            rotation_euler_deg: [...cam.rotation_euler_deg],
            focal_length_mm: cam.focal_length_mm,
          },
        };
      }

      if (toolName === 'set_light_properties_governed') {
        const light = sceneState.objects.find(
          (o) => o.type === 'LIGHT' && o.name === input.light_name,
        );
        if (!light) {
          throw new Error(`Light '${input.light_name}' not found in scene`);
        }
        if (scenario === 'mutation_echo_without_scene_change') {
          return {
            status: 'ok',
            data: {
              light_name: light.name,
              updated: true,
              energy_watts: input.energy_watts,
              color_rgb: [...input.color_rgb],
              location: Array.isArray(input.location) ? [...input.location] : [...light.location],
            },
          };
        }
        if (scenario === 'rollback_unverified_readback') {
          light.energy_watts = input.energy_watts + 999;
          fs.writeFileSync(blendFilePath, serializeBlendBytes(sceneState));
          return {
            status: 'ok',
            data: {
              light_name: light.name,
              updated: true,
              energy_watts: light.energy_watts,
              color_rgb: [...light.color_rgb],
              location: [...light.location],
            },
          };
        }
        if (
          scenario !== 'postcondition_mismatch' &&
          scenario !== 'partial_multi_step_failure' &&
          scenario !== 'rollback_failure'
        ) {
          light.energy_watts = input.energy_watts;
          light.color_rgb = [...input.color_rgb];
          if (Array.isArray(input.location)) light.location = [...input.location];
          if (Array.isArray(input.rotation_euler_deg)) {
            light.rotation_euler_deg = [...input.rotation_euler_deg];
          }
          if (typeof input.area_size === 'number') light.area_size = input.area_size;
          fs.writeFileSync(blendFilePath, serializeBlendBytes(sceneState));
        }
        return {
          status: 'ok',
          data: {
            light_name: light.name,
            updated: true,
            energy_watts: light.energy_watts,
            color_rgb: [...light.color_rgb],
            location: [...light.location],
          },
        };
      }

      if (toolName === 'set_material_pbr_governed') {
        const obj = sceneState.objects.find((o) => o.name === input.object_name);
        const mat = obj?.materials?.find((m) => m.name === input.material_name);
        if (!mat) {
          throw new Error(`Material '${input.material_name}' on '${input.object_name}' not found`);
        }
        if (scenario !== 'postcondition_mismatch') {
          mat.roughness = input.roughness;
          mat.metallic = input.metallic;
          if (Array.isArray(input.base_color_rgba)) {
            mat.base_color_rgba = [...input.base_color_rgba];
          }
          fs.writeFileSync(blendFilePath, serializeBlendBytes(sceneState));
        }
        return {
          status: 'ok',
          data: {
            material_name: mat.name,
            updated: true,
            roughness: mat.roughness,
            metallic: mat.metallic,
          },
        };
      }

      if (toolName === 'set_object_transform_governed') {
        const obj = sceneState.objects.find((o) => o.name === input.object_name);
        if (!obj) {
          throw new Error(`Object '${input.object_name}' not found`);
        }
        if (scenario !== 'postcondition_mismatch') {
          obj.location = [...input.location];
          obj.rotation_euler_deg = [...input.rotation_euler_deg];
          obj.scale = [...input.scale];
          fs.writeFileSync(blendFilePath, serializeBlendBytes(sceneState));
        }
        return {
          status: 'ok',
          data: {
            object_name: obj.name,
            updated: true,
            location: [...obj.location],
            rotation_euler_deg: [...obj.rotation_euler_deg],
            scale: [...obj.scale],
          },
        };
      }

      // Governed L2 exports / imports
      if (
        toolName === 'render_viewport_to_path' ||
        toolName === 'render_thumbnail_to_path' ||
        toolName === 'render_still_governed' ||
        toolName === 'export_glb_governed'
      ) {
        const outFile = input.output_path;
        if (outFile && scenario !== 'postcondition_mismatch') {
          fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
          fs.writeFileSync(
            path.resolve(outFile),
            Buffer.from(`MOCK-ARTIFACT:${toolName}:${outFile}\n`, 'utf8'),
          );
        }
        return {
          status: 'ok',
          data: {
            output_path: outFile,
            written: true,
          },
        };
      }

      if (toolName === 'import_asset') {
        if (scenario !== 'postcondition_mismatch') {
          sceneState.objects.push({
            name: input.target_collection || 'ImportedAsset',
            type: 'MESH',
            visible: true,
            location: [0, 0, 0],
            rotation_euler_deg: [0, 0, 0],
            scale: [1, 1, 1],
          });
          fs.writeFileSync(blendFilePath, serializeBlendBytes(sceneState));
        }
        return {
          status: 'ok',
          data: {
            imported: true,
            asset_path: input.asset_path,
          },
        };
      }

      throw new Error(`Unrecognized or unmapped tool invocation: ${toolName}`);
    },
  };
}

/**
 * Phase 3A — Discovers runtime session state and performs capability negotiation.
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

  if (endpointValidationError) {
    connectionStatus = 'invalid_endpoint';
    discoveryMode = 'config_file_inspection_only';
    knownLimitations.push(endpointValidationError);
  } else if (!runtimeClient) {
    if (options.hostCapabilityContext) {
      connectionStatus = 'host_context_only';
      discoveryMode = 'host_capability_context';
      hostIdentity = options.hostCapabilityContext.hostIdentity || 'MCP Host (Capability Context Only)';
      knownLimitations.push(
        'Host does not expose direct runtime discovery to BlendOps CLI; using host-provided capability context without claiming an active Blender connection.',
      );
    } else if (configData || requestedPath !== 'none') {
      connectionStatus = 'configured_unreachable';
      discoveryMode = 'config_file_inspection_only';
      hostIdentity = configData?.host_identity || null;
      knownLimitations.push(
        'Runtime configuration was inspected on disk, but no live Blender MCP transport responded. Inspecting a config file never reports a connected runtime.',
      );
    } else {
      connectionStatus = 'not_configured';
      discoveryMode = 'unconfigured';
      knownLimitations.push(
        'No external Blender MCP runtime is configured or connected in this environment (Runtime status: Not Run).',
      );
    }
  } else {
    discoveryMode = runtimeClient.isMockRuntime
      ? 'mock_mcp_transport_probe'
      : 'live_mcp_transport_probe';
    const probe = runtimeClient.probeSession();

    const isStaleProbe =
      probe.stale === true ||
      (typeof probe.lastHeartbeatMs === 'number' &&
        typeof probe.sessionTtlMs === 'number' &&
        Date.now() - probe.lastHeartbeatMs > probe.sessionTtlMs);

    if (probe.hostContextOnly) {
      connectionStatus = 'host_context_only';
      discoveryMode = 'host_capability_context';
      hostIdentity = probe.hostIdentity || 'MCP Host (Context Only)';
      if (probe.knownLimitation) knownLimitations.push(probe.knownLimitation);
    } else if (!probe.reachable) {
      connectionStatus = 'configured_unreachable';
      knownLimitations.push(
        probe.error || 'Configured MCP transport endpoint is unreachable.',
      );
    } else if (isStaleProbe) {
      connectionStatus = 'stale_session';
      hostIdentity = probe.hostIdentity || null;
      addonOrServerIdentity = probe.addonOrServerIdentity || null;
      blenderVersion = probe.blenderVersion || null;
      runtimeVersion = probe.runtimeVersion || null;
      knownLimitations.push(
        'Runtime session is stale or its heartbeat TTL expired; failing closed until a fresh session probe succeeds.',
      );
    } else {
      hostIdentity = probe.hostIdentity || null;
      addonOrServerIdentity = probe.addonOrServerIdentity || null;
      blenderVersion = probe.blenderVersion || null;
      runtimeVersion = probe.runtimeVersion || null;
      singleBridgeVerified = probe.singleBridgeVerified !== false;
      backupSupported = Boolean(probe.backupSupported);
      restoreSupported = Boolean(probe.restoreSupported);

      const rawTools = Array.isArray(probe.tools) ? probe.tools : [];
      const observedToolNames = new Set();
      let hasInvalidSchema = false;
      let hasBridgeConflict = !singleBridgeVerified;

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
        observedToolNames.add(toolName);

        if (pathSpec && pathSpec.exclusiveOpponentTools.has(toolName)) {
          hasBridgeConflict = true;
          rejectedOrAmbiguousTools.push({
            tool_name: toolName,
            reason: `Tool '${toolName}' belongs to a conflicting MCP bridge surface for ${requestedPath} (single-bridge violation)`,
          });
          continue;
        }

        if (
          !t.inputSchema ||
          typeof t.inputSchema !== 'object' ||
          Array.isArray(t.inputSchema) ||
          t.inputSchema.type !== 'object'
        ) {
          hasInvalidSchema = true;
          rejectedOrAmbiguousTools.push({
            tool_name: toolName,
            reason: 'Tool inputSchema is missing or not a valid JSON Schema object',
          });
          continue;
        }

        if (toolName === 'execute_blender_code') {
          rejectedOrAmbiguousTools.push({
            tool_name: toolName,
            reason:
              'Unrestricted arbitrary Python tool execute_blender_code is blocked from direct user-facing operation mapping per laws/no-arbitrary-python-interface.md',
          });
          continue;
        }

        const mappedOps = allOperations
          .filter(
            (op) =>
              op.supported_runtime_paths.includes(requestedPath) &&
              op.runtime_tool_mappings?.[requestedPath]?.primary_tool === toolName,
          )
          .map((op) => op.operation_id);

        availableToolManifest.push({
          tool_name: toolName,
          description: t.description || `MCP tool ${toolName}`,
          schema_valid: true,
          input_schema: t.inputSchema,
          mapped_operation_ids: mappedOps,
        });
      }

      // Check version compatibility
      const versionOk =
        Boolean(blenderVersion) &&
        Boolean(pathSpec) &&
        isVersionAtLeast(blenderVersion, pathSpec.minBlenderTuple);

      // Check required read-only tools
      const missingRequiredReadOnly = (pathSpec?.requiredReadOnlyTools || []).filter(
        (reqTool) => !observedToolNames.has(reqTool),
      );

      if (hasBridgeConflict) {
        connectionStatus = 'bridge_conflict';
        knownLimitations.push(
          'Single-bridge conflict detected: Path 1 (Lab MCP) and Path 2 (mcp-for-blender) tools or multiple hosts are active on the same Blender instance.',
        );
      } else if (hasInvalidSchema) {
        connectionStatus = 'invalid_tool_schema';
        knownLimitations.push(
          'One or more tools advertised by the MCP runtime had invalid or corrupt input schemas; failing closed.',
        );
      } else if (!versionOk) {
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
        connectionStatus = 'connected';
        // Compute supported operations where primary_tool and all readback_tools are present
        for (const op of allOperations) {
          if (!op.supported_runtime_paths.includes(requestedPath)) continue;
          const mapping = op.runtime_tool_mappings?.[requestedPath];
          if (!mapping) continue;
          const primaryAvailable = observedToolNames.has(mapping.primary_tool);
          const readbackAvailable = (mapping.readback_tools || []).every((rt) =>
            observedToolNames.has(rt),
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

  if (knownLimitations.length === 0) {
    knownLimitations.push(
      runtimeClient?.isMockRuntime
        ? 'Session negotiated against deterministic mock MCP runtime; does not constitute live Blender execution evidence.'
        : 'Session negotiated for read-only (L0) and bounded reversible (L1) operations; L3 arbitrary Python execution remains permanently blocked.',
    );
  }

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
    readiness_flags: {
      read_only_available: readOnlyAvailable,
      mutation_available: mutationAvailable,
      export_available: exportAvailable,
      backup_supported: backupSupported,
      restore_supported: restoreSupported,
      plan_compatible: planCompatible,
      live_runtime_verified: connectionStatus === 'connected' && !runtimeClient?.isMockRuntime,
    },
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
    },
    known_limitations: knownLimitations,
    truth_states: {
      runtime_status: 'Not Run',
      artifact_status: 'Not Produced',
      is_mock_runtime: Boolean(runtimeClient?.isMockRuntime),
    },
  };

  const validateSession = getAjvValidator(paths.runtimeSessionSchemaPath);
  if (!validateSession(session)) {
    const errs = (validateSession.errors || []).map(
      (e) => `${e.instancePath || '/'} ${e.message}`,
    );
    throw new Error(`Runtime session failed schema validation: ${errs.join('; ')}`);
  }

  return session;
}

/**
 * Phase 3C — Preflight check for a single operation or an operation sequence.
 */
export function runExecutionPreflight(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
  const policy = JSON.parse(fs.readFileSync(paths.capabilityPolicyPath, 'utf8'));

  const blockingReasons = [];

  // 1. Validate SceneSpec if provided
  let sceneSpecValid = true;
  let resolvedSpec = null;
  if (options.sceneSpec) {
    const specVal = validateSceneSpec(options.sceneSpec, { repoRoot, projectDir });
    sceneSpecValid = specVal.valid;
    resolvedSpec = specVal.spec;
    if (!specVal.valid) {
      blockingReasons.push(`SceneSpec invalid: ${specVal.errors.join('; ')}`);
    }
  }

  // 2. Validate ExecutionPlan if provided
  let executionPlanValid = true;
  let resolvedPlan = options.executionPlan || null;
  if (!resolvedPlan && resolvedSpec && sceneSpecValid) {
    const compiled = compileExecutionPlan(resolvedSpec, { repoRoot, projectDir });
    resolvedPlan = compiled.plan;
    executionPlanValid =
      Boolean(compiled.ok) &&
      compiled.plan?.status !== 'blocked' &&
      compiled.plan?.can_proceed_to_runtime !== false;
    if (!executionPlanValid) {
      const reasons = (compiled.plan?.conflicts || [])
        .filter((c) => c.severity === 'blocking')
        .map((c) => c.summary);
      if (compiled.plan?.can_proceed_to_runtime === false && reasons.length === 0) {
        reasons.push(
          `ExecutionPlan has preferred_path='${compiled.plan?.runtime_target?.preferred_path}' with can_proceed_to_runtime=false (planning-only mode).`,
        );
      }
      blockingReasons.push(
        `ExecutionPlan '${compiled.plan?.plan_id || 'unknown'}' cannot proceed to runtime: ${reasons.join('; ')}`,
      );
    }
  } else if (resolvedPlan) {
    const planInspect = inspectExecutionPlan(resolvedPlan, { repoRoot, projectDir });
    if (!planInspect.valid) {
      executionPlanValid = false;
      blockingReasons.push(
        `ExecutionPlan '${resolvedPlan.plan_id || 'unknown'}' failed semantic inspection: ${planInspect.errors.join('; ')}`,
      );
    } else if (
      resolvedPlan.status === 'blocked' ||
      resolvedPlan.can_proceed_to_runtime === false
    ) {
      executionPlanValid = false;
      blockingReasons.push(
        `ExecutionPlan '${resolvedPlan.plan_id}' has status='${resolvedPlan.status}' and can_proceed_to_runtime=${resolvedPlan.can_proceed_to_runtime} and cannot proceed to runtime.`,
      );
    }
  }

  // 3. Runtime readiness & version compatibility
  const session =
    options.runtimeSession ||
    discoverRuntimeSession({
      repoRoot,
      projectDir,
      runtimePath: options.runtimePath,
      mockRuntime: options.mockRuntime,
      liveTransportClient: options.liveTransportClient,
      executionPlan: resolvedPlan,
      endpoint: options.endpoint,
      allowRemoteEndpoint: options.allowRemoteEndpoint,
    });

  const runtimeReady = session.connection_status === 'connected';
  const versionCompatible =
    session.connection_status !== 'version_unsupported' &&
    Boolean(session.blender_version);

  if (!runtimeReady) {
    blockingReasons.push(
      `Runtime is not ready for execution (connection_status='${session.connection_status}').`,
    );
  }

  // 4. Operation allowlist, tool mapping, input schema, capability tier, governed ceiling
  const operationId = options.operationId || 'op.inspect.blendfile-summary';
  const op = getRuntimeOperation(repoRoot, operationId, { projectDir });

  let operationAllowlisted = Boolean(op);
  let toolMappingAvailable = false;
  let inputSchemaValid = false;
  let governedCeilingRespected = true;
  let backupGateReady = true;
  let assetLicenseCleared = true;
  const stageGatesSatisfied = executionPlanValid;

  const grantedTier = options.grantedTier || session.negotiated_capability_tier || 'L0';
  if (grantedTier === 'L3') {
    governedCeilingRespected = false;
    blockingReasons.push(
      'Capability tier L3 (arbitrary Python execution) is permanently forbidden on the user-facing surface.',
    );
  }

  // Check for indirect code/command injection in input payload
  const injectionFinding = detectIndirectCodeInjection(options.input || {});
  if (injectionFinding) {
    inputSchemaValid = false;
    governedCeilingRespected = false;
    blockingReasons.push(injectionFinding);
  }

  if (!op) {
    blockingReasons.push(
      `Operation '${operationId}' is not in the canonical registry (registry/runtime-operations.json); unallowlisted operations are blocked.`,
    );
  } else {
    const rp = session.runtime_path;
    const mapping = op.runtime_tool_mappings?.[rp];
    toolMappingAvailable =
      Boolean(mapping) && session.supported_operations.includes(operationId);
    if (!toolMappingAvailable) {
      blockingReasons.push(
        `Operation '${operationId}' does not have an active verified tool mapping on runtime '${rp}'.`,
      );
    }

    // Validate input against op.input_schema
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validateInput = ajv.compile(op.input_schema);
    const ajvValid = Boolean(validateInput(options.input || {}));
    inputSchemaValid = ajvValid && !injectionFinding;
    if (!ajvValid) {
      const errs = (validateInput.errors || []).map(
        (e) => `${e.instancePath || '/'} ${e.message}`,
      );
      blockingReasons.push(
        `Input for '${operationId}' failed schema validation: ${errs.join('; ')}`,
      );
    }

    // Check capability tier vs grantedTier and skill ceiling
    const reqRank = TIER_RANKS[op.required_capability_tier] ?? 0;
    const grantRank = TIER_RANKS[grantedTier] ?? 0;
    if (reqRank > grantRank) {
      governedCeilingRespected = false;
      blockingReasons.push(
        `Capability tier violation: operation '${operationId}' requires ${op.required_capability_tier}, but granted tier is ${grantedTier}.`,
      );
    }

    if (options.skillId) {
      const skillEntry = (policy.skills || []).find((s) => s.skillId === options.skillId);
      if (!skillEntry) {
        governedCeilingRespected = false;
        blockingReasons.push(`Unknown governing skill '${options.skillId}'.`);
      } else {
        const skillCeilingRank = TIER_RANKS[skillEntry.governedRuntimeCeiling] ?? 0;
        if (reqRank > skillCeilingRank) {
          governedCeilingRespected = false;
          blockingReasons.push(
            `Skill '${options.skillId}' has governedRuntimeCeiling ${skillEntry.governedRuntimeCeiling}, which cannot authorize ${op.required_capability_tier} operation '${operationId}'.`,
          );
        }
      }
    }

    // Backup gate check for L1+
    if (op.backup_requirement === 'verified_pre_mutation_blend_checkpoint') {
      const blendPath = options.sourceBlendPath || options.mockRuntime?.blendFilePath || null;
      const safeBlendCheck = validateSafeBlendCheckpointPaths(blendPath);
      if (
        !session.readiness_flags.backup_supported ||
        !safeBlendCheck.valid ||
        !fs.existsSync(blendPath)
      ) {
        backupGateReady = false;
        blockingReasons.push(
          safeBlendCheck.valid
            ? `Operation '${operationId}' requires a verified pre-mutation .blend checkpoint on disk, but source .blend path or runtime backup support is unavailable.`
            : `Operation '${operationId}' rejected unsafe .blend checkpoint path: ${safeBlendCheck.reason}`,
        );
      }
    }

    // Asset license check for L2 asset imports
    if (op.asset_license_requirement === 'cleared_spdx_or_category') {
      const clearance = options.input?.license_clearance || options.assetLicenseClearance;
      if (
        !clearance ||
        clearance.status !== 'Cleared' ||
        clearance.verifiedBySkill !== 'asset-license-checker'
      ) {
        assetLicenseCleared = false;
        blockingReasons.push(
          `Operation '${operationId}' requires Cleared asset license verification from asset-license-checker.`,
        );
      }
    }
  }

  const passed =
    blockingReasons.length === 0 &&
    sceneSpecValid &&
    executionPlanValid &&
    runtimeReady &&
    versionCompatible &&
    toolMappingAvailable &&
    inputSchemaValid &&
    operationAllowlisted &&
    governedCeilingRespected &&
    backupGateReady &&
    assetLicenseCleared &&
    stageGatesSatisfied;

  return {
    passed,
    scene_spec_valid: sceneSpecValid,
    execution_plan_valid: executionPlanValid,
    runtime_ready: runtimeReady,
    version_compatible: versionCompatible,
    tool_mapping_available: toolMappingAvailable,
    input_schema_valid: inputSchemaValid,
    operation_allowlisted: operationAllowlisted,
    capability_tier_granted: grantedTier === 'L3' ? 'L0' : grantedTier,
    governed_ceiling_respected: governedCeilingRespected,
    backup_gate_ready: backupGateReady,
    asset_license_cleared: assetLicenseCleared,
    stage_gates_satisfied: stageGatesSatisfied,
    blocking_reasons: blockingReasons,
  };
}

function approxEqualNumber(a, b, tolerance = 1e-3) {
  return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= tolerance;
}

function approxEqualArray(a, b, tolerance = 1e-3) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  return a.every((v, idx) => approxEqualNumber(v, b[idx], tolerance));
}

function verifyOperationPostconditions(op, input, readbackData) {
  const checks = [];

  if (op.behavior === 'read_only') {
    const ok = Boolean(readbackData && typeof readbackData === 'object');
    checks.push({
      check_id: op.required_postconditions[0]?.check_id || 'post.read_only_response',
      passed: ok,
      expected: 'non-null structured response object',
      actual: ok ? 'structured response object received' : 'null or invalid response',
    });
    return { verified: ok, checks };
  }

  if (op.operation_id === 'op.mutate.camera-transform-and-lens') {
    const cameras = readbackData?.cameras || readbackData?.objects?.filter((o) => o.type === 'CAMERA') || [];
    const cam = cameras.find((c) => c.name === input.camera_name);
    const locOk = Boolean(cam) && approxEqualArray(cam.location, input.location);
    const rotOk = Boolean(cam) && approxEqualArray(cam.rotation_euler_deg, input.rotation_euler_deg);
    const lensOk = Boolean(cam) && approxEqualNumber(cam.focal_length_mm, input.focal_length_mm);

    checks.push(
      {
        check_id: 'post.camera_location_readback',
        passed: locOk,
        expected: input.location,
        actual: cam?.location ?? null,
      },
      {
        check_id: 'post.camera_rotation_readback',
        passed: rotOk,
        expected: input.rotation_euler_deg,
        actual: cam?.rotation_euler_deg ?? null,
      },
      {
        check_id: 'post.camera_focal_length_readback',
        passed: lensOk,
        expected: input.focal_length_mm,
        actual: cam?.focal_length_mm ?? null,
      },
    );
    return {
      verified: checks.every((c) => c.passed),
      checks,
    };
  }

  if (op.operation_id === 'op.mutate.light-parameters') {
    const lights = readbackData?.lights || readbackData?.objects?.filter((o) => o.type === 'LIGHT') || [];
    const light = lights.find((l) => l.name === input.light_name);
    const energyOk = Boolean(light) && approxEqualNumber(light.energy_watts, input.energy_watts);
    const colorOk = Boolean(light) && approxEqualArray(light.color_rgb, input.color_rgb);

    checks.push(
      {
        check_id: 'post.light_energy_readback',
        passed: energyOk,
        expected: input.energy_watts,
        actual: light?.energy_watts ?? null,
      },
      {
        check_id: 'post.light_color_readback',
        passed: colorOk,
        expected: input.color_rgb,
        actual: light?.color_rgb ?? null,
      },
    );
    return {
      verified: checks.every((c) => c.passed),
      checks,
    };
  }

  if (op.operation_id === 'op.mutate.material-pbr-properties') {
    const obj = (readbackData?.objects || []).find((o) => o.name === input.object_name);
    const mat = obj?.materials?.find((m) => m.name === input.material_name);
    const roughOk = Boolean(mat) && approxEqualNumber(mat.roughness, input.roughness);
    const metalOk = Boolean(mat) && approxEqualNumber(mat.metallic, input.metallic);
    checks.push(
      {
        check_id: 'post.material_roughness_readback',
        passed: roughOk,
        expected: input.roughness,
        actual: mat?.roughness ?? null,
      },
      {
        check_id: 'post.material_metallic_readback',
        passed: metalOk,
        expected: input.metallic,
        actual: mat?.metallic ?? null,
      },
    );
    return {
      verified: checks.every((c) => c.passed),
      checks,
    };
  }

  if (op.operation_id === 'op.mutate.object-transform') {
    const obj = (readbackData?.objects || []).find((o) => o.name === input.object_name);
    const locOk = Boolean(obj) && approxEqualArray(obj.location, input.location);
    const scaleOk = Boolean(obj) && approxEqualArray(obj.scale, input.scale);
    checks.push(
      {
        check_id: 'post.object_location_readback',
        passed: locOk,
        expected: input.location,
        actual: obj?.location ?? null,
      },
      {
        check_id: 'post.object_scale_readback',
        passed: scaleOk,
        expected: input.scale,
        actual: obj?.scale ?? null,
      },
    );
    return {
      verified: checks.every((c) => c.passed),
      checks,
    };
  }

  if (
    op.operation_id === 'op.export.viewport-preview-to-file' ||
    op.operation_id === 'op.export.render-still-to-file' ||
    op.operation_id === 'op.export.glb-to-file'
  ) {
    const outFile = input.output_path ? path.resolve(input.output_path) : null;
    const existsOnDisk = Boolean(outFile && fs.existsSync(outFile));
    const stat = existsOnDisk ? fs.statSync(outFile) : null;
    const nonZero = Boolean(stat && stat.isFile() && stat.size > 0);
    const fileSha = nonZero ? sha256Hex(fs.readFileSync(outFile)) : null;
    checks.push(
      {
        check_id: op.required_postconditions?.[0]?.check_id || 'post.artifact_file_non_zero',
        passed: nonZero,
        expected: 'byteSize > 0 on disk',
        actual: nonZero ? `byteSize=${stat.size}` : 'missing or 0 bytes',
      },
      {
        check_id: op.required_postconditions?.[1]?.check_id || 'post.artifact_sha256_recorded',
        passed: Boolean(fileSha && /^[a-f0-9]{64}$/.test(fileSha)),
        expected: '64-char hex sha256',
        actual: fileSha,
      },
    );
    return {
      verified: checks.every((c) => c.passed),
      checks,
    };
  }

  if (op.operation_id === 'op.mutate.import-cleared-asset') {
    const targetName = input.target_collection || 'ImportedAsset';
    const found = (readbackData?.objects || []).some((o) => o.name === targetName);
    const clearOk =
      input.license_clearance?.status === 'Cleared' &&
      input.license_clearance?.verified_by_skill === 'asset-license-checker';
    checks.push(
      {
        check_id: 'post.imported_objects_present',
        passed: found,
        expected: targetName,
        actual: found ? targetName : null,
      },
      {
        check_id: 'post.asset_license_recorded',
        passed: clearOk,
        expected: 'Cleared by asset-license-checker',
        actual: input.license_clearance?.status ?? null,
      },
    );
    return {
      verified: checks.every((c) => c.passed),
      checks,
    };
  }

  return {
    verified: false,
    checks: [
      {
        check_id: 'post.unknown_operation_verifier',
        passed: false,
        expected: 'registered verifier',
        actual: op.operation_id,
      },
    ],
  };
}

/**
 * Phase 3C & 3D — Executes a sequence of typed operations under the transaction state machine:
 * planned -> preflight -> checkpoint_verified -> approved_if_required -> executing -> readback -> postcondition_verified -> committed
 */
export function executeTypedOperationSequence(options = {}) {
  const repoRoot = options.repoRoot || DEFAULT_REPO_ROOT;
  const projectDir = options.projectDir || null;
  const paths = resolveRuntimeGovernancePaths(repoRoot, projectDir);
  const startedAt = options.startedAt || new Date().toISOString();

  // Resolve SceneSpec and ExecutionPlan if provided
  let sceneSpec = options.sceneSpec || null;
  if (typeof sceneSpec === 'string') {
    sceneSpec = JSON.parse(fs.readFileSync(path.resolve(sceneSpec), 'utf8'));
  }
  let executionPlan = options.executionPlan || null;
  if (typeof executionPlan === 'string') {
    executionPlan = JSON.parse(fs.readFileSync(path.resolve(executionPlan), 'utf8'));
  } else if (!executionPlan && sceneSpec) {
    const compiled = compileExecutionPlan(sceneSpec, { repoRoot, projectDir });
    executionPlan = compiled.plan;
  }

  const runtimeClient = options.mockRuntime || options.liveTransportClient || null;
  const requestedOperations = Array.isArray(options.operations) ? options.operations : [];
  const requiresMutation = requestedOperations.some((step) => {
    const op = getRuntimeOperation(repoRoot, step.operation_id, { projectDir });
    return op && op.behavior !== 'read_only';
  });

  const session =
    options.runtimeSession ||
    discoverRuntimeSession({
      repoRoot,
      projectDir,
      runtimePath: options.runtimePath,
      mockRuntime: options.mockRuntime,
      liveTransportClient: options.liveTransportClient,
      executionPlan,
      requireMutationCapability: requiresMutation,
      endpoint: options.endpoint,
      allowRemoteEndpoint: options.allowRemoteEndpoint,
    });

  const lifecycleHistory = ['planned', 'preflight'];
  let lifecycleStatus = 'preflight';
  let anySecretsRedacted = false;

  // Run preflight across all requested steps
  const combinedBlockingReasons = [];
  let firstPreflight = null;

  for (const step of requestedOperations) {
    const pf = runExecutionPreflight({
      repoRoot,
      projectDir,
      sceneSpec,
      executionPlan,
      runtimeSession: session,
      operationId: step.operation_id,
      input: step.input || {},
      skillId: step.skill_id,
      grantedTier: options.grantedTier || session.negotiated_capability_tier,
      sourceBlendPath: options.sourceBlendPath || runtimeClient?.blendFilePath,
      mockRuntime: options.mockRuntime,
      liveTransportClient: options.liveTransportClient,
    });
    if (!firstPreflight) firstPreflight = pf;
    if (!pf.passed) {
      for (const reason of pf.blocking_reasons) {
        if (!combinedBlockingReasons.includes(reason)) {
          combinedBlockingReasons.push(reason);
        }
      }
    }
  }

  if (!firstPreflight) {
    firstPreflight = runExecutionPreflight({
      repoRoot,
      projectDir,
      sceneSpec,
      executionPlan,
      runtimeSession: session,
      operationId: 'op.inspect.blendfile-summary',
      input: {},
      grantedTier: options.grantedTier || session.negotiated_capability_tier,
    });
  }

  const aggregatePreflight = {
    ...firstPreflight,
    passed: combinedBlockingReasons.length === 0 && firstPreflight.passed,
    blocking_reasons: combinedBlockingReasons,
  };

  let checkpointRecord = {
    required: requiresMutation,
    sourceBlendPath: null,
    backupPath: null,
    byteSize: null,
    sha256: null,
    createdBeforeMutation: false,
    verifiedOnDisk: false,
    createdAt: null,
  };

  const operationAttempts = [];
  let rollbackSummary = {
    triggered: false,
    status: 'not_needed',
    restored_from_backup_path: null,
    restored_sha256_verified: false,
    scene_readback_verified: false,
    recovery_guidance: 'No scene rollback was required.',
  };

  // If preflight failed, fail closed before sending any operation to the external runtime!
  if (!aggregatePreflight.passed) {
    lifecycleStatus = 'blocked';
    lifecycleHistory.push('blocked');
  } else {
    const sourceBlendPath = options.sourceBlendPath || runtimeClient?.blendFilePath || null;
    let baselineSceneSnapshot = null;
    let sourceBlendBaselineSha256 = null;

    if (requiresMutation) {
      try {
        if (!sourceBlendPath || !fs.existsSync(sourceBlendPath)) {
          throw new Error('Source .blend file does not exist on disk for checkpoint creation');
        }
        const safeTimestamp = startedAt.replace(/[:.]/g, '-');
        const backupFilename = `${path.basename(sourceBlendPath, '.blend')}.pre-phase3-${safeTimestamp}.blend`;
        const backupPath = path.join(path.dirname(sourceBlendPath), backupFilename);

        const preCheckpointPathValidation = validateSafeBlendCheckpointPaths(
          sourceBlendPath,
          backupPath,
        );
        if (!preCheckpointPathValidation.valid) {
          throw new Error(preCheckpointPathValidation.reason);
        }

        const sourceBytes = fs.readFileSync(sourceBlendPath);
        sourceBlendBaselineSha256 = sha256Hex(sourceBytes);

        runtimeClient.createCheckpoint(sourceBlendPath, backupPath);

        if (!fs.existsSync(backupPath)) {
          throw new Error(`Checkpoint file was not written to disk at ${backupPath}`);
        }
        const postCheckpointPathValidation = validateSafeBlendCheckpointPaths(
          sourceBlendPath,
          backupPath,
        );
        if (!postCheckpointPathValidation.valid) {
          throw new Error(postCheckpointPathValidation.reason);
        }

        const backupBytes = fs.readFileSync(backupPath);
        const backupSha256 = sha256Hex(backupBytes);

        if (backupBytes.length <= 0 || backupSha256 !== sourceBlendBaselineSha256) {
          throw new Error(
            `Checkpoint SHA-256 verification failed (source=${sourceBlendBaselineSha256}, backup=${backupSha256})`,
          );
        }

        checkpointRecord = {
          required: true,
          sourceBlendPath,
          backupPath,
          byteSize: backupBytes.length,
          sha256: backupSha256,
          createdBeforeMutation: true,
          verifiedOnDisk: true,
          createdAt: new Date().toISOString(),
        };

        // Also validate through Phase 3 evaluateRuntimeCapabilityInvocation
        const policy = JSON.parse(fs.readFileSync(paths.capabilityPolicyPath, 'utf8'));
        const capCheck = evaluateRuntimeCapabilityInvocation(
          {
            skillId: 'product-hero-scene-planner',
            requestedOperationTier: 'L1',
            grantedTier: 'L1',
            mutatesScene: true,
            backupRecord: checkpointRecord,
            mutationBoundaries: {
              allowedDatablocks: ['Camera', 'KeyLight', 'FillLight', 'RimLight'],
              maxObjectsModified: 4,
            },
            recoveryProtocol: {
              restoreFromBackupPath: backupPath,
              postRecoveryVerificationTool:
                session.runtime_path.startsWith('path-1')
                  ? 'get_objects_summary'
                  : 'get_scene_info',
              onRecoveryFailure: 'halt-and-report-failed',
            },
          },
          policy,
        );
        if (!capCheck.allowed) {
          throw new Error(`Capability policy rejected checkpoint: ${capCheck.errors.join('; ')}`);
        }

        lifecycleStatus = 'checkpoint_verified';
        lifecycleHistory.push('checkpoint_verified', 'approved_if_required');
      } catch (checkpointErr) {
        lifecycleStatus = 'blocked';
        lifecycleHistory.push('blocked');
        aggregatePreflight.passed = false;
        aggregatePreflight.backup_gate_ready = false;
        const { redacted: redactedCheckpointErr, secretsRedacted: cpRedacted } =
          redactSensitiveData(checkpointErr.message);
        if (cpRedacted) anySecretsRedacted = true;
        aggregatePreflight.blocking_reasons.push(
          `Pre-mutation checkpoint failed: ${redactedCheckpointErr}`,
        );
      }
    } else {
      lifecycleHistory.push('approved_if_required');
    }

    if (lifecycleStatus !== 'blocked') {
      lifecycleStatus = 'executing';
      lifecycleHistory.push('executing');

      // Map of idempotencyKey -> { operation_id, input_sha256 }
      const seenMutationIdempotencyMap =
        options.idempotencyStore instanceof Map ? options.idempotencyStore : new Map();
      let sequenceAbortedByFailure = false;
      let anyMutatingStepExecuted = false;

      // Capture baseline read-only snapshot before any mutation
      const baselineReadTool = session.runtime_path.startsWith('path-1')
        ? 'get_objects_summary'
        : 'get_scene_info';
      try {
        const baseRes = runtimeClient.invokeTool(baselineReadTool, {});
        baselineSceneSnapshot = baseRes?.data || null;
      } catch {
        baselineSceneSnapshot = null;
      }

      for (let idx = 0; idx < requestedOperations.length; idx += 1) {
        const step = requestedOperations[idx];
        const op = getRuntimeOperation(repoRoot, step.operation_id, { projectDir });
        const mapping = op.runtime_tool_mappings[session.runtime_path];
        const rawInput = step.input || {};
        const { redacted: redactedInput, secretsRedacted: stepRedacted } =
          redactSensitiveData(rawInput);
        if (stepRedacted) anySecretsRedacted = true;

        const canonicalInputStr = `${op.operation_id}:${stableCanonicalJson(redactedInput)}`;
        const inputSha256 = sha256Hex(canonicalInputStr);
        const idempotencyKey =
          typeof step.idempotency_key === 'string' && step.idempotency_key.trim().length >= 16
            ? step.idempotency_key.trim()
            : sha256Hex(`${session.session_id}:${canonicalInputStr}`);
        const stepStart = new Date().toISOString();

        if (sequenceAbortedByFailure) {
          operationAttempts.push({
            step_index: idx + 1,
            operation_id: op.operation_id,
            required_capability: op.required_capability_tier,
            mapped_tool_name: mapping.primary_tool,
            idempotency_key: idempotencyKey,
            input_sha256: inputSha256,
            redacted_input: redactedInput,
            status: 'skipped_after_failure',
            failure_classification: null,
            unknown_remote_execution_outcome: false,
            baseline_snapshot: baselineSceneSnapshot,
            tool_result: null,
            readback_result: null,
            postcondition_result: { verified: false, checks: [] },
            started_at: stepStart,
            finished_at: new Date().toISOString(),
          });
          continue;
        }

        // Check idempotency key for mutating operations (detect duplicate vs payload collision)
        if (op.behavior === 'mutating' && seenMutationIdempotencyMap.has(idempotencyKey)) {
          const priorEntry = seenMutationIdempotencyMap.get(idempotencyKey);
          if (
            priorEntry.operation_id !== op.operation_id ||
            priorEntry.input_sha256 !== inputSha256
          ) {
            operationAttempts.push({
              step_index: idx + 1,
              operation_id: op.operation_id,
              required_capability: op.required_capability_tier,
              mapped_tool_name: mapping.primary_tool,
              idempotency_key: idempotencyKey,
              input_sha256: inputSha256,
              redacted_input: redactedInput,
              status: 'rejected_idempotency_collision',
              failure_classification: 'idempotency_key_payload_collision',
              unknown_remote_execution_outcome: false,
              baseline_snapshot: baselineSceneSnapshot,
              tool_result: {
                error: `Idempotency key '${idempotencyKey}' was reused with conflicting operation or input payload (expected input_sha256=${priorEntry.input_sha256}, actual=${inputSha256}).`,
              },
              readback_result: null,
              postcondition_result: {
                verified: false,
                checks: [
                  {
                    check_id: 'post.idempotency_collision_rejected',
                    passed: false,
                    expected: priorEntry.input_sha256,
                    actual: inputSha256,
                  },
                ],
              },
              started_at: stepStart,
              finished_at: new Date().toISOString(),
            });
            sequenceAbortedByFailure = true;
            lifecycleStatus = 'failed';
            lifecycleHistory.push('failed');
            continue;
          }

          operationAttempts.push({
            step_index: idx + 1,
            operation_id: op.operation_id,
            required_capability: op.required_capability_tier,
            mapped_tool_name: mapping.primary_tool,
            idempotency_key: idempotencyKey,
            input_sha256: inputSha256,
            redacted_input: redactedInput,
            status: 'skipped_duplicate',
            failure_classification: null,
            unknown_remote_execution_outcome: false,
            baseline_snapshot: baselineSceneSnapshot,
            tool_result: { skipped_duplicate: true },
            readback_result: null,
            postcondition_result: {
              verified: true,
              checks: [
                {
                  check_id: 'post.idempotent_duplicate_skipped',
                  passed: true,
                  expected: 'duplicate mutation skipped safely',
                  actual: 'skipped_duplicate',
                },
              ],
            },
            started_at: stepStart,
            finished_at: new Date().toISOString(),
          });
          continue;
        }

        if (op.behavior === 'mutating') {
          seenMutationIdempotencyMap.set(idempotencyKey, {
            operation_id: op.operation_id,
            input_sha256: inputSha256,
          });
          anyMutatingStepExecuted = true;
        }

        try {
          const rawToolRes = runtimeClient.invokeTool(mapping.primary_tool, rawInput);
          const { redacted: redactedToolRes, secretsRedacted: toolRedacted } =
            redactSensitiveData(rawToolRes);
          if (toolRedacted) anySecretsRedacted = true;

          if (!rawToolRes || rawToolRes.status !== 'ok') {
            throw new Error(
              `Ambiguous or failed tool response from '${mapping.primary_tool}' (status='${rawToolRes?.status || 'missing'}'); halting without blind retry.`,
            );
          }

          // Perform independent L0 readback (never trust mutation tool's own return payload)
          if (!lifecycleHistory.includes('readback')) {
            lifecycleHistory.push('readback');
          }
          const readbackTool = mapping.readback_tools[0];
          if (op.behavior === 'mutating' && readbackTool === mapping.primary_tool) {
            throw new Error(
              `Operation '${op.operation_id}' must use an independent L0 read-only tool for postcondition verification, not primary mutation tool '${mapping.primary_tool}'.`,
            );
          }
          const rawReadback = runtimeClient.invokeTool(readbackTool, rawInput);
          const { redacted: redactedReadback, secretsRedacted: rbRedacted } =
            redactSensitiveData(rawReadback?.data || null);
          if (rbRedacted) anySecretsRedacted = true;

          const postResult = verifyOperationPostconditions(
            op,
            rawInput,
            rawReadback?.data || null,
          );

          if (!postResult.verified) {
            operationAttempts.push({
              step_index: idx + 1,
              operation_id: op.operation_id,
              required_capability: op.required_capability_tier,
              mapped_tool_name: mapping.primary_tool,
              idempotency_key: idempotencyKey,
              input_sha256: inputSha256,
              redacted_input: redactedInput,
              status: 'failed',
              failure_classification: 'postcondition_verification_failed',
              unknown_remote_execution_outcome: false,
              baseline_snapshot: baselineSceneSnapshot,
              tool_result: redactedToolRes,
              readback_result: redactedReadback,
              postcondition_result: postResult,
              started_at: stepStart,
              finished_at: new Date().toISOString(),
            });
            sequenceAbortedByFailure = true;
            lifecycleStatus = 'failed';
            lifecycleHistory.push('failed');
          } else {
            operationAttempts.push({
              step_index: idx + 1,
              operation_id: op.operation_id,
              required_capability: op.required_capability_tier,
              mapped_tool_name: mapping.primary_tool,
              idempotency_key: idempotencyKey,
              input_sha256: inputSha256,
              redacted_input: redactedInput,
              status: 'committed',
              failure_classification: null,
              unknown_remote_execution_outcome: false,
              baseline_snapshot: baselineSceneSnapshot,
              tool_result: redactedToolRes,
              readback_result: redactedReadback,
              postcondition_result: postResult,
              started_at: stepStart,
              finished_at: new Date().toISOString(),
            });
          }
        } catch (execErr) {
          const isTimeout = execErr.code === 'ETIMEDOUT' || /timed out/i.test(execErr.message);
          const { redacted: redactedErrMsg, secretsRedacted: errRedacted } =
            redactSensitiveData(execErr.message);
          if (errRedacted) anySecretsRedacted = true;
          operationAttempts.push({
            step_index: idx + 1,
            operation_id: op.operation_id,
            required_capability: op.required_capability_tier,
            mapped_tool_name: mapping.primary_tool,
            idempotency_key: idempotencyKey,
            input_sha256: inputSha256,
            redacted_input: redactedInput,
            status: isTimeout ? 'attempted' : 'failed',
            failure_classification: isTimeout
              ? 'uncertain_remote_mutation_timeout'
              : 'known_operation_failure',
            unknown_remote_execution_outcome: isTimeout,
            baseline_snapshot: baselineSceneSnapshot,
            tool_result: {
              error: redactedErrMsg,
              timeout_no_blind_retry: isTimeout,
            },
            readback_result: null,
            postcondition_result: {
              verified: false,
              checks: [
                {
                  check_id: 'post.execution_completed',
                  passed: false,
                  expected: 'status: ok',
                  actual: redactedErrMsg,
                },
              ],
            },
            started_at: stepStart,
            finished_at: new Date().toISOString(),
          });
          sequenceAbortedByFailure = true;
          lifecycleStatus = isTimeout ? 'attempted' : 'failed';
          lifecycleHistory.push(lifecycleStatus);
        }
      }

      // If any mutation failed or timed out after a verified checkpoint, trigger rollback!
      if (
        sequenceAbortedByFailure &&
        requiresMutation &&
        anyMutatingStepExecuted &&
        checkpointRecord.verifiedOnDisk
      ) {
        lifecycleHistory.push('rollback_attempted');
        try {
          const safeRestoreCheck = validateSafeBlendCheckpointPaths(
            checkpointRecord.sourceBlendPath,
            checkpointRecord.backupPath,
          );
          if (!safeRestoreCheck.valid) {
            throw new Error(safeRestoreCheck.reason);
          }

          runtimeClient.restoreCheckpoint(
            checkpointRecord.backupPath,
            checkpointRecord.sourceBlendPath,
          );
          const restoredDiskBytes = fs.readFileSync(checkpointRecord.sourceBlendPath);
          const restoredSha256 = sha256Hex(restoredDiskBytes);
          const shaMatched = restoredSha256 === checkpointRecord.sha256;

          const verifyReadTool = session.runtime_path.startsWith('path-1')
            ? 'get_objects_summary'
            : 'get_scene_info';
          const postRestoreRead = runtimeClient.invokeTool(verifyReadTool, {});
          const sceneMatched =
            stableCanonicalJson(postRestoreRead?.data?.objects || []) ===
            stableCanonicalJson(baselineSceneSnapshot?.objects || []);

          if (shaMatched && sceneMatched) {
            lifecycleStatus = 'rollback_verified';
            lifecycleHistory.push('rollback_verified');
            rollbackSummary = {
              triggered: true,
              status: 'rollback_verified',
              restored_from_backup_path: checkpointRecord.backupPath,
              restored_sha256_verified: true,
              scene_readback_verified: true,
              recovery_guidance:
                'Scene was automatically restored to the verified pre-mutation .blend checkpoint and confirmed via independent readback.',
            };
          } else {
            lifecycleStatus = 'rollback_unverified';
            lifecycleHistory.push('rollback_unverified');
            rollbackSummary = {
              triggered: true,
              status: 'rollback_unverified',
              restored_from_backup_path: checkpointRecord.backupPath,
              restored_sha256_verified: shaMatched,
              scene_readback_verified: sceneMatched,
              recovery_guidance: `Automatic restore did not match baseline verification. Recover manually from preserved checkpoint: ${checkpointRecord.backupPath}`,
            };
          }
        } catch (rbErr) {
          lifecycleStatus = 'rollback_failed';
          lifecycleHistory.push('rollback_failed');
          const { redacted: redactedRbErr, secretsRedacted: rbErrRedacted } =
            redactSensitiveData(rbErr.message);
          if (rbErrRedacted) anySecretsRedacted = true;
          rollbackSummary = {
            triggered: true,
            status: 'rollback_failed',
            restored_from_backup_path: checkpointRecord.backupPath,
            restored_sha256_verified: false,
            scene_readback_verified: false,
            recovery_guidance: `Automatic checkpoint restore failed (${redactedRbErr}). Do not continue mutating; manually open the preserved pre-mutation backup at ${checkpointRecord.backupPath}.`,
          };
        }
      } else if (!sequenceAbortedByFailure) {
        lifecycleHistory.push('postcondition_verified', 'committed');
        lifecycleStatus = 'committed';
      }
    }
  }

  // Build canonical Runtime Evidence Packet (schemas/runtime-evidence-packet.schema.json)
  const observedMcpTools = [
    ...new Set(operationAttempts.map((a) => a.mapped_tool_name).filter(Boolean)),
  ];
  const isMock = Boolean(runtimeClient?.isMockRuntime);
  let packetRuntimeStatus = 'Not Run';
  let packetArtifactStatus = 'Not Produced';

  if (lifecycleStatus === 'blocked' || lifecycleStatus === 'rejected') {
    packetRuntimeStatus = 'Not Run';
    packetArtifactStatus = 'Not Produced';
  } else if (
    lifecycleStatus === 'failed' ||
    lifecycleStatus === 'rollback_verified' ||
    lifecycleStatus === 'rollback_failed' ||
    lifecycleStatus === 'rollback_unverified'
  ) {
    packetRuntimeStatus = 'Failed';
    packetArtifactStatus = 'Not Produced';
  } else if (lifecycleStatus === 'attempted') {
    packetRuntimeStatus = 'Attempted';
    packetArtifactStatus = 'Not Produced';
  } else if (lifecycleStatus === 'committed') {
    // Crucial honesty rule: mock runtime fixtures have isStaticFixture = true, so they cannot claim live 'Verified'
    packetRuntimeStatus = isMock ? 'Attempted' : 'Verified';
    packetArtifactStatus = 'Not Produced';
  }

  const evidencePacket = {
    $schema: '../schemas/runtime-evidence-packet.schema.json',
    schemaVersion: '1.0.0',
    packetId: `packet-${sha256Hex(`${session.session_id}:${startedAt}`).slice(0, 12)}`,
    skillId: 'product-hero-scene-planner',
    isStaticFixture: isMock || !runtimeClient,
    runtimeEvidence: {
      runtimePath: packetRuntimeStatus === 'Not Run' ? 'none' : session.runtime_path,
      runtimeStatus: packetRuntimeStatus,
      blenderVersion: packetRuntimeStatus === 'Not Run' ? null : session.blender_version,
      addonIdentity:
        packetRuntimeStatus === 'Not Run' ? null : session.addon_or_server_identity,
      observedMcpTools: packetRuntimeStatus === 'Not Run' ? [] : observedMcpTools,
    },
    artifactEvidence: {
      artifactStatus: packetArtifactStatus,
      artifactType: 'none',
      artifactPath: null,
      byteSize: null,
      sha256: null,
      glbInspection: null,
    },
    validationChecks: {
      framing:
        lifecycleStatus === 'committed'
          ? 'Passed'
          : packetRuntimeStatus === 'Not Run'
            ? 'Not Run'
            : 'Failed',
      lighting:
        lifecycleStatus === 'committed'
          ? 'Passed'
          : packetRuntimeStatus === 'Not Run'
            ? 'Not Run'
            : 'Failed',
      pbrMaterials: 'Not Applicable',
      polycountAndBudget:
        lifecycleStatus === 'committed' ? 'Passed' : 'Not Run',
    },
  };

  const packetVal = validateEvidencePacket(evidencePacket, {
    schemaPath: paths.evidencePacketSchemaPath,
  });
  if (!packetVal.valid) {
    throw new Error(
      `Generated evidence packet failed schema/semantic validation: ${packetVal.errors.join('; ')}`,
    );
  }

  const completedAt = new Date().toISOString();
  const executionId =
    options.executionId ||
    `exec.${session.runtime_path === 'none' ? 'unconfigured' : session.runtime_path}-${sha256Hex(`${session.session_id}:${startedAt}`).slice(0, 10)}`;

  const ledger = {
    $schema: '../schemas/operation-execution-ledger.schema.json',
    schema_version: '1.0.0',
    execution_id: executionId,
    scene_spec_id: sceneSpec?.id || sceneSpec?.scene_spec_id || executionPlan?.scene_spec_id || null,
    execution_plan_id: executionPlan?.plan_id || null,
    runtime_session_id: session.session_id,
    selected_runtime_path: session.runtime_path,
    blender_version: session.blender_version,
    is_mock_runtime: isMock,
    lifecycle_status: lifecycleStatus,
    lifecycle_history: lifecycleHistory,
    preflight_result: aggregatePreflight,
    checkpoint_record: requiresMutation ? checkpointRecord : null,
    operation_attempts: operationAttempts,
    rollback_summary: rollbackSummary,
    secrets_redacted: anySecretsRedacted,
    evidence_packet: evidencePacket,
    timestamps: {
      started_at: startedAt,
      completed_at: completedAt,
    },
    truth_states: {
      runtime_status: packetRuntimeStatus,
      artifact_status: packetArtifactStatus,
      evidence_promotion_allowed: !isMock && lifecycleStatus === 'committed',
    },
  };

  const validateLedger = getAjvValidator(paths.operationLedgerSchemaPath);
  if (!validateLedger(ledger)) {
    const errs = (validateLedger.errors || []).map(
      (e) => `${e.instancePath || '/'} ${e.message}`,
    );
    throw new Error(`Operation execution ledger failed schema validation: ${errs.join('; ')}`);
  }

  return {
    ok: lifecycleStatus === 'committed',
    session,
    ledger,
  };
}

const DEFAULT_PRODUCT_HERO_SCENE_SPEC = {
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
  simulation_and_vfx: {
    enabled: false,
    simulation_types: [],
    geometry_nodes_realize_instances: false,
    bake_to_alembic_or_keyframes: false,
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

/**
 * Phase 3D — Safe Blender Production Vertical Slice:
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
      input: {
        camera_name: 'Camera',
        light_names: ['KeyLight', 'FillLight', 'RimLight'],
      },
    },
    {
      operation_id: 'op.mutate.camera-transform-and-lens',
      skill_id: 'camera-composition',
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
      skill_id: 'lighting-material-plan',
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

function formatSessionMarkdown(session, heading = '## BlendOps Runtime Readiness & Capability Report') {
  return [
    heading,
    '',
    `- Session ID: \`${session.session_id}\``,
    `- Runtime Path: \`${session.runtime_path}\``,
    `- Connection Status: \`${session.connection_status}\``,
    `- Blender Version: \`${session.blender_version || 'Not Observed'}\``,
    `- Add-on / Server Identity: ${session.addon_or_server_identity || 'Not Connected'}`,
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

function formatLedgerMarkdown(ledger) {
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

/**
 * CLI Subcommand Runner for Phase 3 (`runtime`, `operation`, `execution`).
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

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--runtime-path' && i + 1 < rest.length) {
      runtimePath = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--runtime-path=')) {
      runtimePath = arg.slice('--runtime-path='.length).trim();
    } else if (arg === '--project' && i + 1 < rest.length) {
      projectDir = rest[++i];
    } else if (typeof arg === 'string' && arg.startsWith('--project=')) {
      projectDir = arg.slice('--project='.length).trim();
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
      subcommand === 'runtime-capabilities'
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
      });

      const heading =
        subcommand === 'runtime-doctor'
          ? '## BlendOps Runtime Doctor'
          : subcommand === 'runtime-inspect'
            ? '## BlendOps Runtime Session Inspection'
            : '## BlendOps Runtime Capabilities Negotiation';

      const report = jsonOutput
        ? `${JSON.stringify(session, null, 2)}\n`
        : formatSessionMarkdown(session, heading);

      const isErrorState = [
        'version_unsupported',
        'missing_required_tools',
        'invalid_tool_schema',
        'bridge_conflict',
        'incompatible_with_plan',
        'stale_session',
        'invalid_endpoint',
      ].includes(session.connection_status);

      return {
        ok: !isErrorState,
        exitCode: isErrorState ? 2 : 0,
        mode: subcommand,
        session,
        globalTouched: false,
        runtimeStatus: session.truth_states.runtime_status,
        artifactStatus: session.truth_states.artifact_status,
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

      return {
        ok: pf.passed,
        exitCode: pf.passed ? 0 : 2,
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

      const exitCode =
        sliceRes.ledger.lifecycle_status === 'committed'
          ? 0
          : sliceRes.ledger.lifecycle_status === 'blocked'
            ? 2
            : 1;

      return {
        ok: sliceRes.ok,
        exitCode,
        mode: 'execution-report',
        ledger: sliceRes.ledger,
        globalTouched: false,
        runtimeStatus: sliceRes.ledger.truth_states.runtime_status,
        artifactStatus: sliceRes.ledger.truth_states.artifact_status,
        report,
      };
    }

    if (subcommand === 'execution-inspect') {
      if (!ledgerPath) {
        throw new Error('execution-inspect requires a <ledger.json> path or --ledger <file>.');
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

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    const res = validateRuntimeOperationsRegistry(DEFAULT_REPO_ROOT);
    if (!res.valid) {
      console.error('Runtime operations registry check failed:');
      for (const e of res.errors) console.error(`- ${e}`);
      process.exit(1);
    }
    console.log(
      `Runtime operations check passed (${res.operation_count} operations: L0=${res.counts_by_tier.L0}, L1=${res.counts_by_tier.L1}, L2=${res.counts_by_tier.L2}).`,
    );
  } else {
    const res = runRuntimeAndExecutionCliSubcommand(args);
    process.stdout.write(res.report);
    process.exitCode = res.exitCode;
  }
}
