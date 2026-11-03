#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DEFAULT_SCHEMA_PATH = path.join(ROOT_DIR, 'schemas', 'runtime-capability-policy.schema.json');
const DEFAULT_POLICY_PATH = path.join(ROOT_DIR, 'registry', 'runtime-capability-policy.json');

export const TIER_RANKS = Object.freeze({
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
});

const CLEARED_ASSET_LICENSES = new Set([
  'CC0-1.0',
  'CC-BY-4.0',
  'Royalty-Free-Commercial',
  'Proprietary-First-Party',
]);

// Governed runtime ceiling per skill when the user transitions from BlendOps planning into external MCP/CLI execution.
// Note: Every BlendOps skill itself operates at capabilityTier = "L0" (content/planning/validation layer),
// while governing target runtime actions up to governedRuntimeCeiling with mandatory backup/license/confirmation gates.
const GOVERNED_CEILING_BY_SKILL = Object.freeze({
  // L1 — Reversible Scene Mutation planners
  'product-hero-scene-planner': 'L1',
  'camera-composition': 'L1',
  'lighting-material-plan': 'L1',
  'character-portrait': 'L1',
  'environment-shot': 'L1',
  'interior-scene': 'L1',
  'product-grid-scene-planner': 'L1',
  'color-management-decision': 'L1',
  'resolution-aspect-decision': 'L1',
  'cycles-vs-eevee-decision': 'L1',

  // L2 — File Export & External Asset Import planners / handoffs
  'asset-discovery': 'L2',
  'asset-license-checker': 'L2',
  'asset-style-check': 'L2',
  'asset-fallback-strategy': 'L2',
  'asset-library-plan': 'L2',
  'output-format-decision': 'L2',
  'glb-web-handoff': 'L2',
  'mobile-glb-budget': 'L2',
  'glb-animation-handoff': 'L2',
  'render-export-evidence': 'L2',

  // L3 — Headless CLI / Batch Execution Outlines (requires explicit confirmation + backup + no user-facing raw Python)
  'cli-appendix-job-outline': 'L3',
});

let cachedSchemaValidator = null;

function getPolicySchemaValidator(schemaPath = DEFAULT_SCHEMA_PATH) {
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

export function buildExpectedCapabilityPolicy(rootDir = ROOT_DIR) {
  const skillsDir = path.join(rootDir, 'skills');
  const catalogSkillIds = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .filter((id) => fs.existsSync(path.join(skillsDir, id, 'SKILL.md')))
    .sort();

  const skills = catalogSkillIds.map((skillId) => {
    const contractPath = path.join(skillsDir, skillId, 'contract.json');
    let contractTier = 'L0';
    if (fs.existsSync(contractPath)) {
      const c = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      contractTier = c.capabilityTier || 'L0';
    }
    const ceiling = GOVERNED_CEILING_BY_SKILL[skillId] || 'L0';
    const ceilingRank = TIER_RANKS[ceiling] ?? 0;

    return {
      skillId,
      capabilityTier: contractTier,
      governedRuntimeCeiling: ceiling,
      requiresPreMutationBackupWhenExecuted: ceilingRank >= 1,
      requiresAssetLicenseClearance: ceilingRank >= 2,
      requiresExplicitOperatorConfirmation: ceilingRank >= 3,
      userFacingPythonAllowed: false,
    };
  });

  return {
    $schema: '../schemas/runtime-capability-policy.schema.json',
    schemaVersion: '1.0.0',
    defaultCapabilityTier: 'L0',
    runtimeExecutionState: {
      blenderRuntime: 'Not Run',
      liveRollbackEngineExecuted: false,
      honestyNote:
        'BlendOps is a portable content and governance layer. This policy defines and validates L0-L3 capability boundaries and pre-mutation .blend backup requirements without claiming that a live Blender rollback execution engine ran inside this repository.',
    },
    tiers: {
      L0: {
        id: 'L0',
        rank: 0,
        name: 'Planning & Read-Only Inspection',
        summary:
          'Default tier for all BlendOps skills. Permits pure workflow planning, validation, and read-only MCP inspection (get_blendfile_summary_datablocks, get_objects_summary, get_scene_info) with zero scene mutations and zero file writes.',
        allowSceneMutation: false,
        allowFileExport: false,
        allowExternalAssetImport: false,
        allowArbitraryCodeExecution: false,
        requiresPreMutationBlendBackup: false,
        requiresExplicitOperatorConfirmation: false,
        requiresAssetLicenseClearance: false,
        userFacingPythonAllowed: false,
      },
      L1: {
        id: 'L1',
        rank: 1,
        name: 'Reversible Scene Mutation',
        summary:
          'Permits bounded camera, lighting, material, and object transform mutations inside an active Blender scene only after a verified pre-mutation .blend checkpoint backup is saved on disk.',
        allowSceneMutation: true,
        allowFileExport: false,
        allowExternalAssetImport: false,
        allowArbitraryCodeExecution: false,
        requiresPreMutationBlendBackup: true,
        requiresExplicitOperatorConfirmation: false,
        requiresAssetLicenseClearance: false,
        userFacingPythonAllowed: false,
      },
      L2: {
        id: 'L2',
        rank: 2,
        name: 'File Export & External Asset Import',
        summary:
          'Permits rendering still/turntable outputs, exporting .glb containers to an allowlisted output directory, and importing external 3D/material assets cleared by asset-license-checker.',
        allowSceneMutation: true,
        allowFileExport: true,
        allowExternalAssetImport: true,
        allowArbitraryCodeExecution: false,
        requiresPreMutationBlendBackup: true,
        requiresExplicitOperatorConfirmation: false,
        requiresAssetLicenseClearance: true,
        userFacingPythonAllowed: false,
      },
      L3: {
        id: 'L3',
        rank: 3,
        name: 'Arbitrary Code / Destructive Operations',
        summary:
          'Governs headless CLI batch execution or destructive multi-object operations. Requires explicit operator confirmation, verified pre-execution .blend backup, and strict compliance with laws/no-arbitrary-python-interface.md.',
        allowSceneMutation: true,
        allowFileExport: true,
        allowExternalAssetImport: true,
        allowArbitraryCodeExecution: true,
        requiresPreMutationBlendBackup: true,
        requiresExplicitOperatorConfirmation: true,
        requiresAssetLicenseClearance: true,
        userFacingPythonAllowed: false,
      },
    },
    rollbackProtocol: {
      checkpointPattern: '<scene>.pre-<skill-id>-<ISO8601-UTC>.blend',
      requiredBackupFields: [
        'sourceBlendPath',
        'backupPath',
        'byteSize',
        'sha256',
        'createdBeforeMutation',
        'verifiedOnDisk',
      ],
      failClosedOnBackupFailure: true,
      recoveryVerificationTools: {
        path1: ['get_blendfile_summary_datablocks', 'get_objects_summary'],
        path2: ['get_scene_info', 'get_object_info'],
      },
      postRecoveryTruthRule:
        'If a scene mutation fails and the pre-mutation .blend backup is restored, the operation must be reported as Runtime status: Failed (or Attempted) with rollback verified, and Artifact status: Not Produced.',
    },
    skills,
  };
}

export function validateCapabilityPolicyObject(
  policy,
  { rootDir = ROOT_DIR, schemaPath = DEFAULT_SCHEMA_PATH } = {},
) {
  const errors = [];
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    return { valid: false, errors: ['Capability policy root must be a JSON object'] };
  }

  const validateSchema = getPolicySchemaValidator(schemaPath);
  const schemaOk = validateSchema(policy);
  if (!schemaOk) {
    for (const err of validateSchema.errors || []) {
      errors.push(`schema(${err.instancePath || '/'}): ${err.message}`);
    }
  }

  const skillsDir = path.join(rootDir, 'skills');
  const catalogSkillIds = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== '_template')
    .map((d) => d.name)
    .filter((id) => fs.existsSync(path.join(skillsDir, id, 'SKILL.md')))
    .sort();
  const catalogSet = new Set(catalogSkillIds);

  const seenSkills = new Set();
  for (const entry of policy.skills || []) {
    if (!entry || typeof entry !== 'object') continue;
    if (seenSkills.has(entry.skillId)) {
      errors.push(`Duplicate skill entry in capability policy: '${entry.skillId}'`);
    }
    seenSkills.add(entry.skillId);

    if (!catalogSet.has(entry.skillId)) {
      errors.push(`Capability policy references unknown skill '${entry.skillId}'`);
    }

    const tierRank = TIER_RANKS[entry.capabilityTier];
    const ceilingRank = TIER_RANKS[entry.governedRuntimeCeiling];
    if (tierRank !== undefined && ceilingRank !== undefined && tierRank > ceilingRank) {
      errors.push(
        `Skill '${entry.skillId}' capabilityTier (${entry.capabilityTier}) exceeds its governedRuntimeCeiling (${entry.governedRuntimeCeiling})`,
      );
    }

    // Verify tier flags match governedRuntimeCeiling requirements
    if (ceilingRank >= 1 && entry.requiresPreMutationBackupWhenExecuted !== true) {
      errors.push(
        `Skill '${entry.skillId}' with governedRuntimeCeiling ${entry.governedRuntimeCeiling} must set requiresPreMutationBackupWhenExecuted: true`,
      );
    }
    if (ceilingRank >= 2 && entry.requiresAssetLicenseClearance !== true) {
      errors.push(
        `Skill '${entry.skillId}' with governedRuntimeCeiling ${entry.governedRuntimeCeiling} must set requiresAssetLicenseClearance: true`,
      );
    }
    if (ceilingRank >= 3 && entry.requiresExplicitOperatorConfirmation !== true) {
      errors.push(
        `Skill '${entry.skillId}' with governedRuntimeCeiling ${entry.governedRuntimeCeiling} must set requiresExplicitOperatorConfirmation: true`,
      );
    }
    if (entry.userFacingPythonAllowed !== false) {
      errors.push(
        `Skill '${entry.skillId}' violates laws/no-arbitrary-python-interface.md: userFacingPythonAllowed must be false`,
      );
    }

    // Cross-check contracted skills
    const contractPath = path.join(skillsDir, entry.skillId, 'contract.json');
    if (fs.existsSync(contractPath)) {
      const c = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
      const cTier = c.capabilityTier || 'L0';
      if (cTier !== entry.capabilityTier) {
        errors.push(
          `Contract capabilityTier mismatch for '${entry.skillId}': contract.json has '${cTier}', policy has '${entry.capabilityTier}'`,
        );
      }
    }
  }

  for (const id of catalogSkillIds) {
    if (!seenSkills.has(id)) {
      errors.push(`Catalog skill '${id}' is missing from registry/runtime-capability-policy.json`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Evaluates a proposed runtime operation against the L0-L3 capability model and pre-mutation rollback protocol.
 * Defaults any undeclared skill or tier to L0 and blocks mutation whenever backup or authorization gates fail.
 */
export function evaluateRuntimeCapabilityInvocation(invocation, policy = null) {
  const errors = [];
  let mutationBlockedByBackupFailure = false;

  if (!invocation || typeof invocation !== 'object' || Array.isArray(invocation)) {
    return {
      allowed: false,
      effectiveGrantedTier: 'L0',
      requestedOperationTier: null,
      mutationBlockedByBackupFailure: false,
      errors: ['Invocation request must be a JSON object'],
    };
  }

  const requestedTier = invocation.requestedOperationTier || 'L0';
  if (!(requestedTier in TIER_RANKS)) {
    return {
      allowed: false,
      effectiveGrantedTier: 'L0',
      requestedOperationTier: requestedTier,
      mutationBlockedByBackupFailure: false,
      errors: [`Invalid requestedOperationTier '${requestedTier}' (expected L0, L1, L2, or L3)`],
    };
  }

  // Determine effective granted tier (defaults to L0 if omitted or not found in policy)
  let grantedTier = invocation.grantedTier || 'L0';
  if (policy && Array.isArray(policy.skills) && typeof invocation.skillId === 'string') {
    const entry = policy.skills.find((s) => s.skillId === invocation.skillId);
    if (!entry) {
      errors.push(`Unknown skillId '${invocation.skillId}'; defaulting granted capability tier to L0`);
      grantedTier = 'L0';
    } else if (!invocation.grantedTier) {
      grantedTier = entry.governedRuntimeCeiling || 'L0';
    } else if (TIER_RANKS[invocation.grantedTier] > TIER_RANKS[entry.governedRuntimeCeiling]) {
      errors.push(
        `Implicit privilege escalation blocked for '${invocation.skillId}': requested grant '${invocation.grantedTier}' exceeds skill ceiling '${entry.governedRuntimeCeiling}'`,
      );
      grantedTier = entry.governedRuntimeCeiling;
    }
  }

  if (!(grantedTier in TIER_RANKS)) {
    errors.push(`Invalid grantedTier '${grantedTier}'; defaulting to L0`);
    grantedTier = 'L0';
  }

  const reqRank = TIER_RANKS[requestedTier];
  const grantRank = TIER_RANKS[grantedTier];

  if (reqRank > grantRank) {
    errors.push(
      `Privilege escalation denied: operation requires tier ${requestedTier} (rank ${reqRank}), but granted tier is ${grantedTier} (rank ${grantRank})`,
    );
  }

  // Law check: never expose raw Python as user-facing output in any tier
  if (invocation.exposesRawPythonToEndUser === true) {
    errors.push(
      'Violation of laws/no-arbitrary-python-interface.md: raw Python must never be exposed as the final user-facing surface',
    );
  }

  // L1+ (Reversible Scene Mutation, Export, Destructive) requires verified pre-mutation .blend backup + mutation boundaries + recovery protocol
  if (reqRank >= 1 && invocation.mutatesScene !== false) {
    const backup = invocation.backupRecord;
    if (!backup || typeof backup !== 'object') {
      mutationBlockedByBackupFailure = true;
      errors.push(
        `Pre-mutation backup required for ${requestedTier}: missing backupRecord (.blend checkpoint must be created and verified before mutating scene)`,
      );
    } else {
      if (typeof backup.sourceBlendPath !== 'string' || !backup.sourceBlendPath.endsWith('.blend')) {
        mutationBlockedByBackupFailure = true;
        errors.push('backupRecord.sourceBlendPath must be a valid .blend file path');
      }
      if (
        typeof backup.backupPath !== 'string' ||
        !backup.backupPath.endsWith('.blend') ||
        backup.backupPath === backup.sourceBlendPath
      ) {
        mutationBlockedByBackupFailure = true;
        errors.push('backupRecord.backupPath must be a distinct .blend checkpoint path');
      }
      if (backup.createdBeforeMutation !== true) {
        mutationBlockedByBackupFailure = true;
        errors.push('backupRecord.createdBeforeMutation must be true before any scene mutation');
      }
      if (backup.verifiedOnDisk !== true) {
        mutationBlockedByBackupFailure = true;
        errors.push('backupRecord.verifiedOnDisk must be true; unverified backup blocks mutation');
      }
      if (!Number.isInteger(backup.byteSize) || backup.byteSize <= 0) {
        mutationBlockedByBackupFailure = true;
        errors.push('backupRecord.byteSize must be a positive integer');
      }
      if (typeof backup.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(backup.sha256)) {
        mutationBlockedByBackupFailure = true;
        errors.push('backupRecord.sha256 must be a 64-character lowercase hex digest');
      }
    }

    const bounds = invocation.mutationBoundaries;
    if (
      !bounds ||
      typeof bounds !== 'object' ||
      !Array.isArray(bounds.allowedDatablocks) ||
      bounds.allowedDatablocks.length === 0 ||
      !Number.isInteger(bounds.maxObjectsModified) ||
      bounds.maxObjectsModified < 1
    ) {
      errors.push(
        `Missing or invalid mutationBoundaries for ${requestedTier}: must specify non-empty allowedDatablocks and positive maxObjectsModified`,
      );
    }

    const recovery = invocation.recoveryProtocol;
    if (
      !recovery ||
      typeof recovery !== 'object' ||
      typeof recovery.restoreFromBackupPath !== 'string' ||
      typeof recovery.postRecoveryVerificationTool !== 'string' ||
      recovery.onRecoveryFailure !== 'halt-and-report-failed'
    ) {
      errors.push(
        `Missing or invalid recoveryProtocol for ${requestedTier}: must define restoreFromBackupPath, postRecoveryVerificationTool, and onRecoveryFailure: 'halt-and-report-failed'`,
      );
    }
  }

  // L2+ (File Export & External Asset Import) checks
  if (reqRank >= 2) {
    if (invocation.exportsFile === true || typeof invocation.targetOutputPath === 'string') {
      const allowlist = Array.isArray(invocation.outputDirectoryAllowlist)
        ? invocation.outputDirectoryAllowlist
        : [];
      const outPath = invocation.targetOutputPath || '';
      const normOut = outPath.replace(/\\/g, '/');
      if (!outPath || normOut.split('/').includes('..')) {
        errors.push(`Unsafe or missing targetOutputPath for ${requestedTier} export: '${outPath}'`);
      } else if (
        allowlist.length === 0 ||
        !allowlist.some((prefix) => {
          const normPrefix = String(prefix).replace(/\\/g, '/').replace(/\/+$/, '') + '/';
          return normOut.startsWith(normPrefix);
        })
      ) {
        errors.push(
          `targetOutputPath '${outPath}' is not inside outputDirectoryAllowlist (${JSON.stringify(allowlist)})`,
        );
      }
    }

    if (invocation.importsExternalAssets === true) {
      const clearance = invocation.assetLicenseClearance;
      if (
        !clearance ||
        typeof clearance !== 'object' ||
        clearance.status !== 'Cleared' ||
        !CLEARED_ASSET_LICENSES.has(clearance.spdxOrCategory) ||
        clearance.verifiedBySkill !== 'asset-license-checker'
      ) {
        errors.push(
          `External asset import blocked in ${requestedTier}: requires assetLicenseClearance { status: 'Cleared', spdxOrCategory in [${[...CLEARED_ASSET_LICENSES].join(', ')}], verifiedBySkill: 'asset-license-checker' }`,
        );
      }
    }
  }

  // L3 (Arbitrary Code / Destructive Operations) checks
  if (reqRank >= 3) {
    const confirm = invocation.operatorConfirmation;
    if (
      !confirm ||
      typeof confirm !== 'object' ||
      confirm.confirmed !== true ||
      typeof confirm.confirmedBy !== 'string' ||
      confirm.confirmedBy.trim().length === 0 ||
      typeof confirm.scopeSummary !== 'string' ||
      confirm.scopeSummary.trim().length < 5
    ) {
      errors.push(
        'L3 execution denied: requires explicit operatorConfirmation { confirmed: true, confirmedBy, scopeSummary }',
      );
    }
  }

  return {
    allowed: errors.length === 0,
    effectiveGrantedTier: grantedTier,
    requestedOperationTier: requestedTier,
    mutationBlockedByBackupFailure,
    errors,
  };
}

function main() {
  const args = new Set(process.argv.slice(2));
  const checkOnly = args.has('--check');
  const expectedPolicy = buildExpectedCapabilityPolicy(ROOT_DIR);
  const expectedJson = `${JSON.stringify(expectedPolicy, null, 2)}\n`;

  if (checkOnly) {
    if (!fs.existsSync(DEFAULT_POLICY_PATH)) {
      console.error('Missing registry/runtime-capability-policy.json');
      process.exit(1);
    }
    const diskJson = fs.readFileSync(DEFAULT_POLICY_PATH, 'utf8');
    const diskObj = JSON.parse(diskJson);
    const val = validateCapabilityPolicyObject(diskObj, { rootDir: ROOT_DIR });
    if (!val.valid) {
      console.error('Capability policy validation failed:');
      for (const e of val.errors) console.error(`- ${e}`);
      process.exit(1);
    }
    if (diskJson !== expectedJson) {
      console.error('Stale registry/runtime-capability-policy.json does not match expected policy');
      process.exit(1);
    }
    console.log(`Capability policy --check passed (${diskObj.skills.length} skills, default=${diskObj.defaultCapabilityTier})`);
    return;
  }

  const val = validateCapabilityPolicyObject(expectedPolicy, { rootDir: ROOT_DIR });
  if (!val.valid) {
    console.error('Capability policy generation failed validation:');
    for (const e of val.errors) console.error(`- ${e}`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(DEFAULT_POLICY_PATH), { recursive: true });
  fs.writeFileSync(DEFAULT_POLICY_PATH, expectedJson, 'utf8');
  console.log(`Generated registry/runtime-capability-policy.json (${expectedPolicy.skills.length} skills)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
