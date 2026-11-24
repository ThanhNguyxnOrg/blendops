// Part of the runtime orchestrator; scripts/runtime-orchestrator.mjs re-exports the public API.

import path from 'node:path';
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import { SECRET_KEY_PATTERN, redactStringSecrets, sha256Hex, stableCanonicalJson } from './constants.mjs';
import { DEFAULT_REPO_ROOT } from './paths.mjs';

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
 * non-loopback endpoints unless allowRemoteEndpoint is true, and non-TLS
 * remote endpoints even when allowRemoteEndpoint is true.
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
        normalizedEndpoint: null,
        reason: msg,
        error: msg,
      };
    }
    if (
      !isLoopback &&
      options.allowRemoteEndpoint &&
      options.requireRemoteTls &&
      parsed.protocol !== 'https:' &&
      parsed.protocol !== 'wss:'
    ) {
      const msg = `Remote non-loopback MCP transport endpoint '${host}' must use TLS (https: or wss:) when requireRemoteTls is enabled.`;
      return {
        valid: false,
        normalized: null,
        normalizedEndpoint: null,
        reason: msg,
        error: msg,
      };
    }
  }
  return {
    valid: true,
    normalized: parsed.toString(),
    normalizedEndpoint: parsed.toString(),
    reason: null,
    error: null,
  };
}
const DEFAULT_STDIO_ENV_ALLOWLIST = new Set([
  'PATH',
  'HOME',
  'USERPROFILE',
  'TMPDIR',
  'TEMP',
  'TMP',
  'LANG',
  'LC_ALL',
  'NODE_ENV',
  'SYSTEMROOT',
  'COMSPEC',
  'APPDATA',
  'LOCALAPPDATA',
  'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME',
  'PYTHONPATH',
  'UV_CACHE_DIR',
  'BLENDER_USER_RESOURCES',
  'BLENDER_SYSTEM_RESOURCES',
]);
const FORBIDDEN_SHELL_WRAPPERS = new Set([
  'sh',
  'bash',
  'zsh',
  'dash',
  'ksh',
  'csh',
  'tcsh',
  'cmd',
  'cmd.exe',
  'powershell',
  'powershell.exe',
  'pwsh',
  'pwsh.exe',
]);
/**
 * Validates STDIO subprocess configuration:
 * - Requires explicit executable + argument array (`shell: false`).
 * - Rejects shell wrapper executables (`sh`, `bash`, `cmd.exe`, `powershell`, etc.) and shell command strings.
 * - Filters environment variables through a strict allowlist and strips secret keys.
 */
export function validateStdioCommandConfig(config = {}) {
  const command = typeof config.command === 'string' ? config.command.trim() : '';
  if (!command || command.includes('\0')) {
    const msg = 'STDIO command must be a non-empty executable string without null bytes.';
    return { valid: false, command: null, args: [], cwd: null, env: {}, sanitizedEnv: {}, shell: false, reason: msg, error: msg };
  }
  if (config.shell === true) {
    const msg = 'STDIO transport forbids shell=true; subprocesses must be spawned with explicit executable and argument array.';
    return { valid: false, command: null, args: [], cwd: null, env: {}, sanitizedEnv: {}, shell: false, reason: msg, error: msg };
  }
  if (/[;&|`$><\n\r]/.test(command) || /\s-c\s/i.test(command)) {
    const msg = `STDIO command '${redactStringSecrets(command).value}' contains forbidden shell metacharacters or inline shell flags.`;
    return { valid: false, command: null, args: [], cwd: null, env: {}, sanitizedEnv: {}, shell: false, reason: msg, error: msg };
  }
  const baseExe = path.basename(command).toLowerCase();
  if (FORBIDDEN_SHELL_WRAPPERS.has(baseExe)) {
    const msg = `STDIO command '${baseExe}' is a shell interpreter; BlendOps forbids spawning MCP servers via a shell wrapper.`;
    return { valid: false, command: null, args: [], cwd: null, env: {}, sanitizedEnv: {}, shell: false, reason: msg, error: msg };
  }

  const rawArgs = config.args === undefined ? [] : config.args;
  if (!Array.isArray(rawArgs)) {
    const msg = 'STDIO args must be an array of strings.';
    return { valid: false, command: null, args: [], cwd: null, env: {}, sanitizedEnv: {}, shell: false, reason: msg, error: msg };
  }
  const cleanArgs = [];
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (typeof arg !== 'string' || arg.includes('\0')) {
      const msg = `STDIO argument at index ${i} must be a string without null bytes.`;
      return { valid: false, command: null, args: [], cwd: null, env: {}, sanitizedEnv: {}, shell: false, reason: msg, error: msg };
    }
    cleanArgs.push(arg);
  }

  const resolvedCwd = config.cwd ? path.resolve(config.cwd) : DEFAULT_REPO_ROOT;
  if (!fs.existsSync(resolvedCwd) || !fs.statSync(resolvedCwd).isDirectory()) {
    const msg = `STDIO working directory does not exist or is not a directory: ${resolvedCwd}`;
    return { valid: false, command: null, args: [], cwd: null, env: {}, sanitizedEnv: {}, shell: false, reason: msg, error: msg };
  }

  const allowedKeys = new Set([
    ...DEFAULT_STDIO_ENV_ALLOWLIST,
    ...(Array.isArray(config.allowedEnvKeys) ? config.allowedEnvKeys : []),
  ]);
  const sourceEnv = config.env && typeof config.env === 'object' ? config.env : process.env;
  const filteredEnv = {};
  for (const [k, v] of Object.entries(sourceEnv)) {
    if (typeof v !== 'string') continue;
    if (SECRET_KEY_PATTERN.test(k)) continue;
    if (allowedKeys.has(k) || k.startsWith('BLENDOPS_')) {
      filteredEnv[k] = v;
    }
  }

  return {
    valid: true,
    command,
    args: cleanArgs,
    cwd: resolvedCwd,
    env: filteredEnv,
    sanitizedEnv: filteredEnv,
    shell: false,
    reason: null,
    error: null,
  };
}
const INDIRECT_CODE_INJECTION_PATTERNS = [
  { id: 'bpy_import_or_api', regex: /\b(import\s+bpy|from\s+bpy\s+import|bpy\.ops\.|bpy\.context\.|bpy\.data\.)/i },
  { id: 'python_dunder_or_eval', regex: /(\b__import__\s*\(|\beval\s*\(|\bexec\s*\(|\bcompile\s*\(|__builtins__|__subclasses__)/i },
  { id: 'python_os_or_subprocess', regex: /\b(subprocess\.(run|Popen|call|check_output)|os\.(system|popen|execv|unlink|remove))\b/i },
  { id: 'shell_command_injection', regex: /(;\s*rm\s+-rf\b|\|\s*sh\b|\|\s*bash\b|\$\([^)]+\)|`[^`]+`)/i },
  { id: 'prompt_or_raw_tool_injection', regex: /(ignore\s+(?:all\s+)?previous\s+instructions|execute_blender_code|execute_blender_code_for_cli)/i },
];
const PROHIBITED_ARBITRARY_CODE_PROP_REGEX =
  /^(code|python_code|raw_python|bpy_script|shell_command|eval_code|llm_code|user_prompt|raw_prompt|tool_description|system_prompt)$/i;
function tryDecodeBase64Utf8(candidate) {
  if (typeof candidate !== 'string') return null;
  let raw = candidate.trim();
  const dataUriMatch = raw.match(/^data:[^;]+;base64,([A-Za-z0-9+/=_-]+)$/i);
  if (dataUriMatch) {
    raw = dataUriMatch[1];
  } else {
    const prefixMatch = raw.match(/^(?:base64:|b64:)([A-Za-z0-9+/=_-]{12,})$/i);
    if (prefixMatch) {
      raw = prefixMatch[1];
    } else if (!/^[A-Za-z0-9+/]{12,}={0,2}$/.test(raw) || raw.length % 4 !== 0) {
      return null;
    }
  }
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length < 6) return null;
    const decoded = buf.toString('utf8');
    // Must be mostly printable ASCII/UTF-8 to avoid false positives on opaque hashes
    if (!/^[\x09\x0A\x0D\x20-\x7E]+$/.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}
/**
 * Recursively inspects operation input payloads for direct, Base64-encoded, or nested JSON-serialized
 * Python, bpy, shell command, or prompt injection payloads.
 * Returns null if safe, or a descriptive error string when an injection pattern is detected.
 */
export function detectIndirectCodeInjection(inputObj) {
  const hits = [];

  function inspectString(str, pathPrefix, depth) {
    for (const pat of INDIRECT_CODE_INJECTION_PATTERNS) {
      if (pat.regex.test(str)) {
        hits.push({
          field: pathPrefix,
          pattern_id: pat.id,
        });
      }
    }

    // Check Base64-encoded code payload (either whole string or embedded base64 tokens >= 12 chars)
    const candidateTokens = [str];
    const embeddedB64 = str.match(/[A-Za-z0-9+/]{12,}={0,2}/g) || [];
    for (const tok of embeddedB64) {
      if (tok !== str) candidateTokens.push(tok);
    }
    for (const tok of candidateTokens) {
      const decoded = tryDecodeBase64Utf8(tok);
      if (decoded) {
        for (const pat of INDIRECT_CODE_INJECTION_PATTERNS) {
          if (pat.regex.test(decoded)) {
            hits.push({
              field: `${pathPrefix}[base64_decoded]`,
              pattern_id: `base64_${pat.id}`,
            });
          }
        }
        if (depth < 4 && (decoded.trim().startsWith('{') || decoded.trim().startsWith('['))) {
          try {
            const parsedFromB64 = JSON.parse(decoded);
            inspect(parsedFromB64, `${pathPrefix}[base64_json]`, depth + 1);
          } catch {
            // not valid JSON
          }
        }
      }
    }

    // Check nested JSON-serialized code payload
    const trimmed = str.trim();
    if (depth < 4 && (trimmed.startsWith('{') || trimmed.startsWith('['))) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          inspect(parsed, `${pathPrefix}[json_decoded]`, depth + 1);
        }
      } catch {
        // ignore non-JSON strings
      }
    }
  }

  function inspect(val, pathPrefix = 'input', depth = 0) {
    if (depth > 6) return;
    if (typeof val === 'string') {
      inspectString(val, pathPrefix, depth);
      return;
    }
    if (Array.isArray(val)) {
      val.forEach((item, idx) => inspect(item, `${pathPrefix}[${idx}]`, depth + 1));
      return;
    }
    if (val && typeof val === 'object') {
      for (const [k, v] of Object.entries(val)) {
        if (PROHIBITED_ARBITRARY_CODE_PROP_REGEX.test(k)) {
          hits.push({
            field: `${pathPrefix}.${k}`,
            pattern_id: 'prohibited_arbitrary_code_property',
          });
        }
        inspect(v, `${pathPrefix}.${k}`, depth + 1);
      }
    }
  }

  inspect(inputObj, 'input', 0);
  if (hits.length === 0) return null;
  return `Indirect code/command injection detected in ${hits.map((h) => `${h.field} (${h.pattern_id})`).join(', ')}; arbitrary Python/bpy/shell execution is blocked per laws/no-arbitrary-python-interface.md.`;
}
/**
 * Computes a deterministic SHA-256 fingerprint for an MCP tool name and its JSON Schema.
 */
export function computeToolSchemaFingerprint(toolName, inputSchema) {
  const schemaObj =
    inputSchema && typeof inputSchema === 'object' && !Array.isArray(inputSchema)
      ? inputSchema
      : {};
  return sha256Hex(`${String(toolName || '').trim()}:${stableCanonicalJson(schemaObj)}`);
}
/**
 * Computes full 4-part contract fingerprints for an MCP tool definition:
 * 1. input_schema_fingerprint
 * 2. output_schema_fingerprint
 * 3. metadata_fingerprint
 * 4. combined_contract_fingerprint
 */
export function computeFullToolContractFingerprints(toolEntry = {}) {
  const toolName = String(toolEntry?.name ?? toolEntry?.tool_name ?? '').trim();
  const inputSchema = toolEntry?.inputSchema ?? toolEntry?.input_schema ?? {};
  const outputSchema = toolEntry?.outputSchema ?? toolEntry?.output_schema ?? null;
  const inputFp = computeToolSchemaFingerprint(toolName, inputSchema);
  const outputFp =
    outputSchema && typeof outputSchema === 'object' && !Array.isArray(outputSchema)
      ? computeToolSchemaFingerprint(`${toolName}:output`, outputSchema)
      : null;
  const metaPayload = {
    name: toolName,
    title: toolEntry?.title || null,
    description: typeof toolEntry?.description === 'string' ? toolEntry.description : '',
    annotations: toolEntry?.annotations || null,
    execution: toolEntry?.execution || toolEntry?.execution_metadata || null,
  };
  const metaFp = sha256Hex(stableCanonicalJson(metaPayload));
  const combinedFp = sha256Hex(`${inputFp}:${outputFp || 'none'}:${metaFp}`);
  return {
    input_schema_fingerprint: inputFp,
    output_schema_fingerprint: outputFp,
    metadata_fingerprint: metaFp,
    combined_contract_fingerprint: combinedFp,
  };
}
/**
 * Inspects a JSON Schema object for structural safety,
 * bounded nesting depth, bounded property count, and absence of external $ref URLs.
 */
export function inspectJsonSchemaSafety(schema, maxDepth = 12, maxProperties = 256) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema) || schema.type !== 'object') {
    return {
      valid: false,
      reason: 'Tool schema is missing or not a valid JSON Schema object with type="object".',
    };
  }
  let propCount = 0;
  let errorReason = null;

  function walk(node, depth) {
    if (errorReason) return;
    if (depth > maxDepth) {
      errorReason = `Tool JSON Schema exceeds maximum allowed nesting depth (${maxDepth}).`;
      return;
    }
    if (!node || typeof node !== 'object') return;
    if (typeof node.$ref === 'string' && /^(https?:|file:|ftp:)/i.test(node.$ref.trim())) {
      errorReason = `Tool JSON Schema contains forbidden external $ref '${node.$ref}'.`;
      return;
    }
    if (node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)) {
      const keys = Object.keys(node.properties);
      propCount += keys.length;
      if (propCount > maxProperties) {
        errorReason = `Tool JSON Schema exceeds maximum allowed property count (${maxProperties}).`;
        return;
      }
      for (const k of keys) {
        walk(node.properties[k], depth + 1);
      }
    }
    if (node.items) {
      if (Array.isArray(node.items)) {
        for (const it of node.items) walk(it, depth + 1);
      } else {
        walk(node.items, depth + 1);
      }
    }
    for (const combKey of ['anyOf', 'oneOf', 'allOf']) {
      if (Array.isArray(node[combKey])) {
        for (const sub of node[combKey]) walk(sub, depth + 1);
      }
    }
  }

  walk(schema, 0);
  if (errorReason) {
    return { valid: false, reason: errorReason };
  }
  return { valid: true, reason: null };
}
/**
 * Computes a deterministic SHA-256 fingerprint across an entire MCP tool inventory.
 */
export function computeToolInventoryFingerprint(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) {
    return null;
  }
  const entries = tools
    .filter((t) => t && typeof t.name === 'string')
    .map((t) => {
      const name = t.name.trim();
      const schema = t.inputSchema || t.input_schema || {};
      return `${name}:${computeToolSchemaFingerprint(name, schema)}`;
    })
    .sort();
  return sha256Hex(entries.join('|'));
}
const TOOL_DESCRIPTION_INJECTION_PATTERNS = [
  { id: 'prompt_override', regex: /(ignore\s+(?:all\s+)?previous\s+instructions|disregard\s+safety|system\s+override|you\s+must\s+now\s+call)/i },
  { id: 'hidden_python_or_shell', regex: /(\bimport\s+bpy\b|\bbpy\.ops\.wm\.|\bos\.system\s*\(|\bsubprocess\.(?:Popen|run|call)\b|;\s*rm\s+-rf\b|\bcurl\s+https?:\/\/)/i },
];
/**
 * Inspects an MCP tool description for prompt injection or embedded command execution payloads.
 */
export function detectToolDescriptionInjection(description) {
  if (typeof description !== 'string' || !description.trim()) return null;
  for (const pat of TOOL_DESCRIPTION_INJECTION_PATTERNS) {
    if (pat.regex.test(description)) {
      return `Tool description contains prohibited injection pattern (${pat.id})`;
    }
  }
  return null;
}
/**
 * Inspects an MCP tool inputSchema to detect whether it accepts arbitrary Python/code/script parameters,
 * catching spoofed safe tool names that wrap raw code execution.
 */
export function detectArbitraryCodeSchemaParameters(inputSchema) {
  if (!inputSchema || typeof inputSchema !== 'object' || Array.isArray(inputSchema)) {
    return null;
  }
  const props = inputSchema.properties;
  if (!props || typeof props !== 'object') return null;
  const badKeys = [];
  for (const [propName, propSpec] of Object.entries(props)) {
    if (/^(code|python_code|raw_python|bpy_script|script|eval_code|shell_command|exec_code)$/i.test(propName)) {
      badKeys.push(propName);
      continue;
    }
    const desc = typeof propSpec?.description === 'string' ? propSpec.description : '';
    if (/\b(arbitrary\s+python|python\s+code\s+to\s+execute|execute\s+in\s+blender|raw\s+bpy\s+script)\b/i.test(desc)) {
      badKeys.push(`${propName} (description indicates raw code execution)`);
    }
  }
  if (badKeys.length === 0) return null;
  return `Tool schema exposes raw code execution parameter(s): ${badKeys.join(', ')}`;
}
export const SUPPORTED_MCP_PROTOCOL_VERSIONS = new Set([
  '2024-11-05',
  '2025-03-26',
  '2025-06-18',
  '2025-11-25',
]);
/**
 * Validates and parses an MCP CallToolResult or internal tool response:
 * - Rejects `isError: true` or malformed results.
 * - Enforces bounded payload size (`maxPayloadBytes`).
 * - Extracts structured JSON from `structuredContent`, `data`, or `content` text blocks.
 * - Rejects unexpected binary/audio/executable content blocks when structured JSON is required.
 * - Validates against `outputSchema` when present.
 * - Applies secret redaction to all outputs and errors.
 */
export function parseMcpCallToolResult(rawResult, options = {}) {
  const maxPayloadBytes = options.maxPayloadBytes || 5 * 1024 * 1024;
  if (!rawResult || typeof rawResult !== 'object' || Array.isArray(rawResult)) {
    return {
      ok: false,
      status: 'error',
      isError: true,
      data: null,
      error: 'Malformed MCP CallToolResult: expected a non-null JSON object.',
      secretsRedacted: false,
    };
  }

  const serializedLen = Buffer.byteLength(JSON.stringify(rawResult), 'utf8');
  if (serializedLen > maxPayloadBytes) {
    return {
      ok: false,
      status: 'error',
      isError: true,
      data: null,
      error: `MCP CallToolResult payload size (${serializedLen} bytes) exceeds maximum allowed limit (${maxPayloadBytes} bytes).`,
      secretsRedacted: false,
    };
  }

  const { redacted: redactedRaw, secretsRedacted } = redactSensitiveData(rawResult);

  if (rawResult.isError === true || rawResult.status === 'error') {
    const errText =
      typeof redactedRaw.error === 'string'
        ? redactedRaw.error
        : Array.isArray(redactedRaw.content)
          ? redactedRaw.content
              .filter((c) => c && c.type === 'text' && typeof c.text === 'string')
              .map((c) => c.text)
              .join('; ') || 'MCP tool returned isError=true'
          : 'MCP tool returned isError=true';
    return {
      ok: false,
      status: 'error',
      isError: true,
      data: null,
      error: errText,
      secretsRedacted,
    };
  }

  let structuredData = null;

  if (
    redactedRaw.structuredContent &&
    typeof redactedRaw.structuredContent === 'object' &&
    !Array.isArray(redactedRaw.structuredContent)
  ) {
    structuredData = redactedRaw.structuredContent;
  } else if (
    redactedRaw.data &&
    typeof redactedRaw.data === 'object' &&
    !Array.isArray(redactedRaw.data)
  ) {
    structuredData = redactedRaw.data;
  } else if (Array.isArray(redactedRaw.content)) {
    for (const block of redactedRaw.content) {
      if (!block || typeof block !== 'object') continue;
      if (block.type !== 'text') {
        if (!options.allowBinaryContent) {
          return {
            ok: false,
            status: 'error',
            isError: true,
            data: null,
            error: `Unexpected non-text MCP content block type '${String(block.type)}' where structured JSON was required.`,
            secretsRedacted,
          };
        }
        continue;
      }
      if (typeof block.text === 'string' && block.text.trim()) {
        try {
          const parsed = JSON.parse(block.text);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            structuredData = parsed;
            break;
          }
        } catch {
          return {
            ok: false,
            status: 'error',
            isError: true,
            data: null,
            error: 'MCP tool text content block could not be parsed as valid structured JSON.',
            secretsRedacted,
          };
        }
      }
    }
  }

  if (!structuredData || typeof structuredData !== 'object') {
    return {
      ok: false,
      status: 'error',
      isError: true,
      data: null,
      error: 'MCP CallToolResult did not contain valid structured JSON data.',
      secretsRedacted,
    };
  }

  if (options.outputSchema && typeof options.outputSchema === 'object') {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    const validateOut = ajv.compile(options.outputSchema);
    if (!validateOut(structuredData)) {
      const errs = (validateOut.errors || []).map((e) => `${e.instancePath || '/'} ${e.message}`);
      return {
        ok: false,
        status: 'error',
        isError: true,
        data: null,
        error: `MCP CallToolResult failed outputSchema validation: ${errs.join('; ')}`,
        secretsRedacted,
      };
    }
  }

  return {
    ok: true,
    status: 'ok',
    isError: false,
    data: structuredData,
    error: null,
    secretsRedacted,
  };
}
