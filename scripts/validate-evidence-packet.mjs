#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_SCHEMA_PATH = path.resolve(__dirname, '..', 'schemas', 'runtime-evidence-packet.schema.json');

const PATH_1_EXCLUSIVE_TOOLS = new Set([
  'get_blendfile_summary_datablocks',
  'get_objects_summary',
  'get_object_Hierarchy_and_Transforms',
]);

const PATH_2_EXCLUSIVE_TOOLS = new Set([
  'get_scene_info',
  'get_object_info',
  'execute_blender_code',
]);

let cachedSchemaValidator = null;

function getEvidenceSchemaValidator(schemaPath = DEFAULT_SCHEMA_PATH) {
  if (cachedSchemaValidator && cachedSchemaValidator.schemaPath === schemaPath) {
    return cachedSchemaValidator.validate;
  }
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(raw);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  cachedSchemaValidator = { schemaPath, validate };
  return validate;
}

export function parseSemverTuple(versionStr) {
  if (typeof versionStr !== 'string') return null;
  const m = versionStr.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function isVersionAtLeast(versionStr, minTuple) {
  const parsed = parseSemverTuple(versionStr);
  if (!parsed) return false;
  for (let i = 0; i < 3; i += 1) {
    if (parsed[i] > minTuple[i]) return true;
    if (parsed[i] < minTuple[i]) return false;
  }
  return true;
}

export function validateEvidencePacket(packet, { catalogSkillSet = null, schemaPath = DEFAULT_SCHEMA_PATH } = {}) {
  const errors = [];

  if (!packet || typeof packet !== 'object' || Array.isArray(packet)) {
    return {
      valid: false,
      errors: ['Evidence packet root must be a JSON object'],
    };
  }

  const validateSchema = getEvidenceSchemaValidator(schemaPath);
  const schemaOk = validateSchema(packet);
  if (!schemaOk) {
    for (const err of validateSchema.errors || []) {
      const loc = err.instancePath || '/';
      const allowed = Array.isArray(err.params?.allowedValues)
        ? ` [${err.params.allowedValues.join(', ')}]`
        : '';
      errors.push(`schema(${loc}): ${err.message}${allowed}`);
    }
  }

  if (catalogSkillSet && typeof packet.skillId === 'string' && !catalogSkillSet.has(packet.skillId)) {
    errors.push(`skillId '${packet.skillId}' does not exist in the 48-skill catalog`);
  }

  const rt = packet.runtimeEvidence;
  const art = packet.artifactEvidence;
  const checks = packet.validationChecks;

  if (!rt || typeof rt !== 'object' || !art || typeof art !== 'object' || !checks || typeof checks !== 'object') {
    return { valid: false, errors };
  }

  // 1. Truth-state taxonomy separation guard
  if (art.artifactStatus === 'Not Run') {
    errors.push(
      `Truth-state taxonomy violation: artifactEvidence.artifactStatus cannot be 'Not Run' (default artifact state is 'Not Produced')`,
    );
  }
  if (rt.runtimeStatus === 'Not Produced') {
    errors.push(
      `Truth-state taxonomy violation: runtimeEvidence.runtimeStatus cannot be 'Not Produced' (default runtime state is 'Not Run')`,
    );
  }

  // 2. Runtime path === 'none' constraints
  if (rt.runtimePath === 'none') {
    if (rt.runtimeStatus !== 'Not Run') {
      errors.push(
        `When runtimeEvidence.runtimePath is 'none', runtimeStatus must be 'Not Run' (received '${rt.runtimeStatus}')`,
      );
    }
    if (art.artifactStatus !== 'Not Produced') {
      errors.push(
        `When runtimeEvidence.runtimePath is 'none', artifactStatus must be 'Not Produced' (received '${art.artifactStatus}')`,
      );
    }
  }

  // 3. Path 1 (Official Blender Lab MCP) version floor (>= 5.1.0) & tool signature checks
  const isActiveRuntime = ['Attempted', 'Produced', 'Verified'].includes(rt.runtimeStatus);
  if (rt.runtimePath === 'path-1-host-a' || rt.runtimePath === 'path-1-host-b') {
    if (isActiveRuntime) {
      if (!rt.blenderVersion) {
        errors.push(
          `Path 1 (${rt.runtimePath}) active runtime state '${rt.runtimeStatus}' requires blenderVersion >= 5.1.0`,
        );
      } else if (!isVersionAtLeast(rt.blenderVersion, [5, 1, 0])) {
        errors.push(
          `Path 1 (${rt.runtimePath}) requires Blender >= 5.1.0 per Lab MCP add-on manifest (received '${rt.blenderVersion}')`,
        );
      }
    }
    for (const tool of rt.observedMcpTools || []) {
      if (PATH_2_EXCLUSIVE_TOOLS.has(tool)) {
        errors.push(
          `Path 1 (${rt.runtimePath}) evidence packet lists Path 2 community MCP tool '${tool}' in observedMcpTools`,
        );
      }
    }
  }

  // 4. Path 2 (Community mcp-for-blender) version floor (>= 3.0.0) & tool signature checks
  if (rt.runtimePath === 'path-2-community') {
    if (isActiveRuntime) {
      if (!rt.blenderVersion) {
        errors.push(`Path 2 (path-2-community) active runtime state '${rt.runtimeStatus}' requires blenderVersion >= 3.0.0`);
      } else if (!isVersionAtLeast(rt.blenderVersion, [3, 0, 0])) {
        errors.push(`Path 2 (path-2-community) requires Blender >= 3.0.0 (received '${rt.blenderVersion}')`);
      }
    }
    for (const tool of rt.observedMcpTools || []) {
      if (PATH_1_EXCLUSIVE_TOOLS.has(tool)) {
        errors.push(
          `Path 2 (path-2-community) evidence packet lists Path 1 Blender Lab MCP tool '${tool}' in observedMcpTools`,
        );
      }
    }
  }

  // 5. Evidence-Before-Done: Produced / Verified artifact requirements
  if (art.artifactStatus === 'Produced' || art.artifactStatus === 'Verified') {
    if (rt.runtimeStatus !== 'Produced' && rt.runtimeStatus !== 'Verified') {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${art.artifactStatus}' requires runtimeStatus to be 'Produced' or 'Verified' (received '${rt.runtimeStatus}')`,
      );
    }
    if (art.artifactType === 'none') {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${art.artifactStatus}' cannot have artifactType 'none'`,
      );
    }
    if (typeof art.artifactPath !== 'string' || art.artifactPath.trim().length === 0) {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${art.artifactStatus}' requires a non-empty artifactPath`,
      );
    }
    if (!Number.isInteger(art.byteSize) || art.byteSize <= 0) {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${art.artifactStatus}' requires positive integer byteSize (received ${JSON.stringify(art.byteSize)})`,
      );
    }
    if (typeof art.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(art.sha256)) {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${art.artifactStatus}' requires a 64-character hex sha256 digest`,
      );
    }
    if (art.artifactType === 'glb') {
      if (!art.glbInspection || art.glbInspection.valid !== true) {
        errors.push(
          `Evidence-before-done violation: GLB artifact with status '${art.artifactStatus}' requires glbInspection.valid === true`,
        );
      }
    }
  }

  // 6. Verified gate: requires non-static fixture + runtimeStatus Verified + all applicable validationChecks Passed
  if (rt.runtimeStatus === 'Verified' && packet.isStaticFixture === true) {
    errors.push(
      `Evidence-before-done violation: static fixture (isStaticFixture: true) cannot claim live runtimeStatus 'Verified'`,
    );
  }
  if (art.artifactStatus === 'Verified') {
    if (packet.isStaticFixture === true) {
      errors.push(
        `Evidence-before-done violation: static fixture (isStaticFixture: true) cannot claim live artifactStatus 'Verified'`,
      );
    }
    if (rt.runtimeStatus !== 'Verified') {
      errors.push(
        `Evidence-before-done violation: artifactStatus 'Verified' requires runtimeStatus 'Verified' (received '${rt.runtimeStatus}')`,
      );
    }
    const checkEntries = Object.entries(checks);
    let passedCount = 0;
    for (const [checkName, checkVal] of checkEntries) {
      if (checkVal === 'Passed') {
        passedCount += 1;
      } else if (checkVal !== 'Not Applicable') {
        errors.push(
          `Evidence-before-done violation: artifactStatus 'Verified' requires validationChecks.${checkName} to be 'Passed' or 'Not Applicable' (received '${checkVal}')`,
        );
      }
    }
    if (passedCount === 0) {
      errors.push(
        `Evidence-before-done violation: artifactStatus 'Verified' requires at least one validationCheck to be 'Passed'`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function main() {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith('--'));
  if (positional.length === 0) {
    console.error('Usage: node scripts/validate-evidence-packet.mjs <packet.json>');
    process.exit(1);
  }
  const targetPath = path.resolve(positional[0]);
  if (!fs.existsSync(targetPath)) {
    console.error(`Evidence packet file not found: ${positional[0]}`);
    process.exit(1);
  }
  const parsed = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const res = validateEvidencePacket(parsed);
  if (!res.valid) {
    console.error('Evidence packet validation failed:');
    for (const err of res.errors) console.error(`- ${err}`);
    process.exit(1);
  }
  console.log(`Evidence packet valid: ${parsed.packetId} (runtime=${parsed.runtimeEvidence.runtimeStatus}, artifact=${parsed.artifactEvidence.artifactStatus})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
