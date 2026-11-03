#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  inspectGlbBuffer,
  inspectGlbFile,
  buildMinimalValidGlbBuffer,
  CONTAINER_TRUTH_DISCLAIMER,
} from './inspect-glb.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const DEFAULT_HANDOFF_MANIFEST_SCHEMA_PATH = path.resolve(
  __dirname,
  '..',
  'schemas',
  'glb-web-handoff-manifest.schema.json',
);

const PROTECTED_REPO_DIRS = new Set([
  '.git',
  '.github',
  '.aistudio',
  'bin',
  'bundles',
  'docs',
  'evals',
  'laws',
  'node_modules',
  'packs',
  'registry',
  'schemas',
  'scripts',
  'skill-reviews',
  'skills',
]);

// Mid-mobile hero card planning ceilings from skills/mobile-glb-budget
export const DEFAULT_WEB_PERFORMANCE_BUDGET = Object.freeze({
  tier: 'mid-mobile-hero-default',
  maxFileSizeBytes: 5 * 1024 * 1024, // 5 MB
  maxTriangles: 50000,
  maxVertices: 65000,
  maxMaterials: 6,
  maxTextures: 8,
  maxAnimationChannels: 50,
});

let cachedManifestValidator = null;

function matchesJsonSchemaType(val, expectedType) {
  if (expectedType === 'null') return val === null;
  if (expectedType === 'array') return Array.isArray(val);
  if (expectedType === 'object') return typeof val === 'object' && val !== null && !Array.isArray(val);
  if (expectedType === 'integer') return typeof val === 'number' && Number.isInteger(val);
  if (expectedType === 'number') return typeof val === 'number' && Number.isFinite(val);
  if (expectedType === 'boolean') return typeof val === 'boolean';
  if (expectedType === 'string') return typeof val === 'string';
  return true;
}

function validateAgainstSchemaNode(val, schemaNode, instancePath, outErrors) {
  if (!schemaNode || typeof schemaNode !== 'object') return;

  if (schemaNode.type !== undefined) {
    const allowedTypes = Array.isArray(schemaNode.type) ? schemaNode.type : [schemaNode.type];
    const matched = allowedTypes.some((t) => matchesJsonSchemaType(val, t));
    if (!matched) {
      outErrors.push({
        instancePath,
        message: `must be ${allowedTypes.join(' or ')}`,
      });
      return;
    }
  }

  if (schemaNode.const !== undefined && val !== schemaNode.const) {
    outErrors.push({
      instancePath,
      message: `must be equal to constant ${JSON.stringify(schemaNode.const)}`,
    });
  }

  if (Array.isArray(schemaNode.enum) && !schemaNode.enum.includes(val)) {
    outErrors.push({
      instancePath,
      message: 'must be equal to one of the allowed values',
      params: { allowedValues: schemaNode.enum },
    });
  }

  if (typeof val === 'string') {
    if (typeof schemaNode.minLength === 'number' && val.length < schemaNode.minLength) {
      outErrors.push({
        instancePath,
        message: `must NOT have fewer than ${schemaNode.minLength} characters`,
      });
    }
    if (typeof schemaNode.maxLength === 'number' && val.length > schemaNode.maxLength) {
      outErrors.push({
        instancePath,
        message: `must NOT have more than ${schemaNode.maxLength} characters`,
      });
    }
    if (typeof schemaNode.pattern === 'string') {
      const re = new RegExp(schemaNode.pattern);
      if (!re.test(val)) {
        outErrors.push({
          instancePath,
          message: `must match pattern "${schemaNode.pattern}"`,
        });
      }
    }
  }

  if (typeof val === 'number' && Number.isFinite(val)) {
    if (typeof schemaNode.minimum === 'number' && val < schemaNode.minimum) {
      outErrors.push({
        instancePath,
        message: `must be >= ${schemaNode.minimum}`,
      });
    }
    if (typeof schemaNode.maximum === 'number' && val > schemaNode.maximum) {
      outErrors.push({
        instancePath,
        message: `must be <= ${schemaNode.maximum}`,
      });
    }
    if (typeof schemaNode.exclusiveMinimum === 'number' && val <= schemaNode.exclusiveMinimum) {
      outErrors.push({
        instancePath,
        message: `must be > ${schemaNode.exclusiveMinimum}`,
      });
    }
  }

  if (Array.isArray(val)) {
    if (typeof schemaNode.minItems === 'number' && val.length < schemaNode.minItems) {
      outErrors.push({
        instancePath,
        message: `must NOT have fewer than ${schemaNode.minItems} items`,
      });
    }
    if (typeof schemaNode.maxItems === 'number' && val.length > schemaNode.maxItems) {
      outErrors.push({
        instancePath,
        message: `must NOT have more than ${schemaNode.maxItems} items`,
      });
    }
    if (schemaNode.items && typeof schemaNode.items === 'object') {
      for (let i = 0; i < val.length; i += 1) {
        validateAgainstSchemaNode(val[i], schemaNode.items, `${instancePath}/${i}`, outErrors);
      }
    }
  }

  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const props = schemaNode.properties && typeof schemaNode.properties === 'object' ? schemaNode.properties : {};
    if (Array.isArray(schemaNode.required)) {
      for (const reqKey of schemaNode.required) {
        if (!Object.prototype.hasOwnProperty.call(val, reqKey) || val[reqKey] === undefined) {
          outErrors.push({
            instancePath,
            message: `must have required property '${reqKey}'`,
          });
        }
      }
    }
    if (schemaNode.additionalProperties === false) {
      for (const key of Object.keys(val)) {
        if (!Object.prototype.hasOwnProperty.call(props, key)) {
          outErrors.push({
            instancePath,
            message: `must NOT have additional properties ('${key}')`,
          });
        }
      }
    }
    for (const [propKey, propSchema] of Object.entries(props)) {
      if (Object.prototype.hasOwnProperty.call(val, propKey) && val[propKey] !== undefined) {
        validateAgainstSchemaNode(val[propKey], propSchema, `${instancePath}/${propKey}`, outErrors);
      }
    }
  }
}

function getHandoffManifestSchemaValidator(schemaPath = DEFAULT_HANDOFF_MANIFEST_SCHEMA_PATH) {
  if (cachedManifestValidator && cachedManifestValidator.schemaPath === schemaPath) {
    return cachedManifestValidator.validate;
  }
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(raw);
  const validate = (data) => {
    const collected = [];
    validateAgainstSchemaNode(data, schema, '', collected);
    validate.errors = collected;
    return collected.length === 0;
  };
  validate.errors = [];
  cachedManifestValidator = { schemaPath, validate };
  return validate;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeSlug(raw, fallback = 'glb-artifact') {
  if (typeof raw !== 'string' || raw.trim().length === 0) return fallback;
  const cleaned = raw
    .toLowerCase()
    .replace(/\.(glb|gltf)$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned.length >= 3 ? cleaned.slice(0, 80) : `${cleaned || fallback}-handoff`;
}

export function validateGlbWebHandoffManifest(
  manifest,
  { schemaPath = DEFAULT_HANDOFF_MANIFEST_SCHEMA_PATH } = {},
) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return {
      valid: false,
      errors: ['GLB web handoff manifest root must be a JSON object'],
    };
  }

  // Explicitly check truth-state taxonomy violations before schema messages so error reasons are crystal-clear
  const ts = manifest.truthStates;
  if (ts && typeof ts === 'object') {
    if (ts.artifactStatus === 'Not Run') {
      errors.push(
        "Truth-state taxonomy violation: truthStates.artifactStatus cannot be 'Not Run' (default artifact state is 'Not Produced')",
      );
    }
    if (ts.artifactStatus === 'Attempted') {
      errors.push(
        "Truth-state taxonomy violation: truthStates.artifactStatus cannot be 'Attempted' (use 'Not Produced' or 'Failed')",
      );
    }
    if (ts.runtimeStatus === 'Not Produced') {
      errors.push(
        "Truth-state taxonomy violation: truthStates.runtimeStatus cannot be 'Not Produced' (default runtime state is 'Not Run')",
      );
    }
  }

  const validateSchema = getHandoffManifestSchemaValidator(schemaPath);
  const schemaOk = validateSchema(manifest);
  if (!schemaOk) {
    for (const err of validateSchema.errors || []) {
      const loc = err.instancePath || '/';
      const allowed = Array.isArray(err.params?.allowedValues)
        ? ` [${err.params.allowedValues.join(', ')}]`
        : '';
      errors.push(`schema(${loc}): ${err.message}${allowed}`);
    }
  }

  const art = manifest.artifact;
  const extComp = manifest.extensionsAndCompression;
  const valSummary = manifest.validationSummary;

  if (!art || typeof art !== 'object' || !ts || typeof ts !== 'object') {
    return { valid: false, errors };
  }

  const prov = art.provenance;
  if (prov && typeof prov === 'object') {
    if (prov.sourceKind === 'synthetic_fixture' && prov.isSyntheticFixture !== true) {
      errors.push(
        "Provenance contradiction: sourceKind 'synthetic_fixture' requires provenance.isSyntheticFixture === true",
      );
    }
    if (prov.isSyntheticFixture === true) {
      if (ts.runtimeStatus !== 'Not Run') {
        errors.push(
          `Synthetic fixture boundary violation: synthetic fixture cannot claim runtimeStatus '${ts.runtimeStatus}' (must be 'Not Run')`,
        );
      }
      if (ts.artifactStatus !== 'Not Produced') {
        errors.push(
          `Synthetic fixture boundary violation: synthetic fixture cannot claim production artifactStatus '${ts.artifactStatus}' (must be 'Not Produced')`,
        );
      }
    }
  }

  if (ts.runtimePath === 'none') {
    if (ts.runtimeStatus !== 'Not Run') {
      errors.push(
        `When truthStates.runtimePath is 'none', runtimeStatus must be 'Not Run' (received '${ts.runtimeStatus}')`,
      );
    }
    if (ts.artifactStatus !== 'Not Produced') {
      errors.push(
        `When truthStates.runtimePath is 'none', artifactStatus must be 'Not Produced' (received '${ts.artifactStatus}')`,
      );
    }
  }

  if (ts.runtimePath === 'path-2-community' && ts.releaseEligibility !== 'non-release') {
    errors.push(
      `Path 2 community runtime ('path-2-community') requires truthStates.releaseEligibility to be 'non-release' (received '${ts.releaseEligibility}')`,
    );
  }

  if (ts.artifactStatus === 'Produced' || ts.artifactStatus === 'Verified') {
    if (ts.runtimeStatus !== 'Produced' && ts.runtimeStatus !== 'Verified') {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${ts.artifactStatus}' requires runtimeStatus 'Produced' or 'Verified' (received '${ts.runtimeStatus}')`,
      );
    }
    if (!Number.isInteger(art.byteSize) || art.byteSize <= 0) {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${ts.artifactStatus}' requires a positive integer artifact.byteSize`,
      );
    }
    if (typeof art.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(art.sha256)) {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${ts.artifactStatus}' requires a 64-character hex artifact.sha256`,
      );
    }
    if (!prov || prov.currentRunProvenanceVerified !== true) {
      errors.push(
        `Evidence-before-done violation: artifactStatus '${ts.artifactStatus}' requires artifact.provenance.currentRunProvenanceVerified === true`,
      );
    }
  }

  if (ts.artifactStatus === 'Verified') {
    if (ts.runtimeStatus !== 'Verified') {
      errors.push(
        `Evidence-before-done violation: artifactStatus 'Verified' requires runtimeStatus 'Verified' (received '${ts.runtimeStatus}')`,
      );
    }
    if (valSummary?.tiers?.containerStructural?.status !== 'Passed') {
      errors.push(
        "Evidence-before-done violation: artifactStatus 'Verified' requires validationSummary.tiers.containerStructural.status === 'Passed'",
      );
    }
    if (valSummary?.overallVerdict === 'Fail') {
      errors.push(
        "Contradictory manifest: artifactStatus 'Verified' cannot have validationSummary.overallVerdict === 'Fail'",
      );
    }
  }

  if (extComp && typeof extComp === 'object') {
    const used = Array.isArray(extComp.extensionsUsed) ? extComp.extensionsUsed : [];
    const req = Array.isArray(extComp.extensionsRequired) ? extComp.extensionsRequired : [];
    for (const r of req) {
      if (!used.includes(r)) {
        errors.push(`Extension consistency error: extensionsRequired entry '${r}' is missing from extensionsUsed`);
      }
    }
    const comp = extComp.compression;
    if (comp && typeof comp === 'object') {
      if ((used.includes('KHR_draco_mesh_compression') || req.includes('KHR_draco_mesh_compression')) &&
          (!comp.draco?.used || !comp.draco?.decoderRequired)) {
        errors.push(
          'Extension consistency error: KHR_draco_mesh_compression is present but compression.draco.used / decoderRequired is false',
        );
      }
      if ((used.includes('EXT_meshopt_compression') || req.includes('EXT_meshopt_compression')) &&
          (!comp.meshopt?.used || !comp.meshopt?.decoderRequired)) {
        errors.push(
          'Extension consistency error: EXT_meshopt_compression is present but compression.meshopt.used / decoderRequired is false',
        );
      }
      if ((used.includes('KHR_texture_basisu') || req.includes('KHR_texture_basisu')) &&
          (!comp.ktx2BasisU?.used || !comp.ktx2BasisU?.transcoderRequired)) {
        errors.push(
          'Extension consistency error: KHR_texture_basisu is present but compression.ktx2BasisU.used / transcoderRequired is false',
        );
      }
    }
  }

  if (valSummary && typeof valSummary === 'object') {
    const structStatus = valSummary.tiers?.containerStructural?.status;
    const errList = Array.isArray(valSummary.errors) ? valSummary.errors : [];
    if ((structStatus === 'Failed' || errList.length > 0) && valSummary.overallVerdict !== 'Fail') {
      errors.push(
        `Verdict contradiction: containerStructural status is '${structStatus}' with ${errList.length} error(s), so overallVerdict must be 'Fail' (received '${valSummary.overallVerdict}')`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildGlbWebHandoffManifestFromInspection(
  inspection,
  {
    filename = 'artifact.glb',
    targetViewerStack = 'threejs',
    sourceKind = 'unverified',
    isSyntheticFixture = false,
    currentRunProvenanceVerified = false,
    runtimePath = 'none',
    runtimeStatus = 'Not Run',
    artifactStatus = 'Not Produced',
    unitScaleMetersPerUnit = 1.0,
    forwardAxis = '+Z',
    originPolicy = 'unverified',
    performanceBudget = DEFAULT_WEB_PERFORMANCE_BUDGET,
  } = {},
) {
  const safeFilename = path.basename(filename || 'artifact.glb');
  const effectiveIsSynthetic =
    Boolean(isSyntheticFixture) ||
    sourceKind === 'synthetic_fixture' ||
    Boolean(inspection?.details?.extras?.isSyntheticFixture);
  const effectiveSourceKind = effectiveIsSynthetic ? 'synthetic_fixture' : sourceKind;

  // Enforce downgrade-only & synthetic fixture truth-state policy
  const effectiveRuntimePath = effectiveIsSynthetic ? 'none' : runtimePath;
  const effectiveRuntimeStatus =
    effectiveIsSynthetic || effectiveRuntimePath === 'none' ? 'Not Run' : runtimeStatus;
  const effectiveArtifactStatus =
    effectiveIsSynthetic ||
    effectiveRuntimePath === 'none' ||
    !currentRunProvenanceVerified ||
    !inspection?.valid
      ? inspection && !inspection.valid && runtimeStatus === 'Attempted'
        ? 'Failed'
        : 'Not Produced'
      : artifactStatus;

  const releaseEligibility =
    effectiveRuntimePath === 'path-2-community'
      ? 'non-release'
      : effectiveRuntimePath === 'none'
        ? 'not-applicable'
        : 'release-eligible';

  const counts = inspection?.counts || {
    scenes: 0,
    nodes: 0,
    meshes: 0,
    primitives: 0,
    vertices: 0,
    trianglesEstimate: 0,
    materials: 0,
    textures: 0,
    images: 0,
    samplers: 0,
    animations: 0,
    skins: 0,
    accessors: 0,
    bufferViews: 0,
    buffers: 0,
  };

  const ext = inspection?.extensions || {
    extensionsUsed: [],
    extensionsRequired: [],
    undeclaredExtensionsFound: [],
    compression: {
      draco: { used: false, required: false, decoderRequired: false },
      meshopt: { used: false, required: false, decoderRequired: false },
      ktx2BasisU: { used: false, required: false, transcoderRequired: false },
      webp: { used: false, required: false },
    },
  };

  const details = inspection?.details || {
    defaultSceneIndex: null,
    scenes: [],
    meshes: [],
    materials: [],
    textures: [],
    animations: [],
    rootNodeTransforms: [],
    externalResources: [],
  };

  const perfWarnings = [];
  const budget = { ...DEFAULT_WEB_PERFORMANCE_BUDGET, ...(performanceBudget || {}) };
  if (typeof inspection?.byteSize === 'number' && inspection.byteSize > budget.maxFileSizeBytes) {
    perfWarnings.push(
      `File size (${inspection.byteSize} bytes) exceeds ${budget.tier} ceiling (${budget.maxFileSizeBytes} bytes); consider Draco/Meshopt geometry compression or KTX2 texture compression.`,
    );
  }
  if (counts.trianglesEstimate > budget.maxTriangles) {
    perfWarnings.push(
      `Estimated triangle count (${counts.trianglesEstimate}) exceeds ${budget.tier} ceiling (${budget.maxTriangles} triangles).`,
    );
  }
  if (counts.vertices > budget.maxVertices) {
    perfWarnings.push(
      `Vertex count (${counts.vertices}) exceeds ${budget.tier} ceiling (${budget.maxVertices} vertices).`,
    );
  }
  if (counts.materials > budget.maxMaterials) {
    perfWarnings.push(
      `Distinct material count (${counts.materials}) exceeds ${budget.tier} ceiling (${budget.maxMaterials} materials); merge materials or texture atlases to reduce draw calls.`,
    );
  }
  if (counts.textures > budget.maxTextures) {
    perfWarnings.push(
      `Texture count (${counts.textures}) exceeds ${budget.tier} ceiling (${budget.maxTextures} textures).`,
    );
  }
  const totalAnimChannels = (details.animations || []).reduce((s, a) => s + (a.channelCount || 0), 0);
  if (totalAnimChannels > budget.maxAnimationChannels) {
    perfWarnings.push(
      `Total animation channel count (${totalAnimChannels}) exceeds ${budget.tier} ceiling (${budget.maxAnimationChannels} channels).`,
    );
  }

  const errors = Array.isArray(inspection?.errors) ? [...inspection.errors] : ['Invalid inspection input'];
  const warnings = Array.isArray(inspection?.warnings) ? [...inspection.warnings] : [];

  const unresolvedIssues = [];
  const nextActions = [];

  if (!inspection?.valid || errors.length > 0) {
    unresolvedIssues.push(
      `GLB structural container inspection failed with ${errors.length} error(s): ${errors[0]}`,
    );
    nextActions.push(
      'Fix the reported GLB 2.0 structural errors in the exporter or re-export the asset before attempting web viewer integration.',
    );
  }

  if (ext.compression.draco.decoderRequired) {
    unresolvedIssues.push(
      'Asset uses KHR_draco_mesh_compression; web viewers will fail to parse geometry unless DRACOLoader is configured with a reachable WASM/JS decoder path.',
    );
    nextActions.push(
      'Configure DRACOLoader with a self-hosted or version-pinned Draco decoder path before loading the GLB.',
    );
  }
  if (ext.compression.meshopt.decoderRequired) {
    unresolvedIssues.push(
      'Asset uses EXT_meshopt_compression; web viewers require MeshoptDecoder to be attached to GLTFLoader.',
    );
    nextActions.push('Attach MeshoptDecoder to GLTFLoader before loading the GLB.');
  }
  if (ext.compression.ktx2BasisU.transcoderRequired) {
    unresolvedIssues.push(
      'Asset uses KHR_texture_basisu (KTX2/BasisU GPU textures); web viewers require KTX2Loader with renderer.detectSupport(renderer).',
    );
    nextActions.push(
      'Configure KTX2Loader with BasisU transcoder binaries and call ktx2Loader.detectSupport(renderer).',
    );
  }

  const externalFiles = (details.externalResources || []).filter((r) => r.isExternalFile);
  if (externalFiles.length > 0) {
    unresolvedIssues.push(
      `Asset references ${externalFiles.length} external resource URI(s) (${externalFiles.map((r) => r.uri).join(', ')}); missing companion files or CORS restrictions will break loading in web viewers.`,
    );
    nextActions.push(
      'Re-export as a self-contained single-file GLB with all buffers and textures packed into the binary chunk, or verify all external URIs are co-hosted with CORS headers.',
    );
  }

  if (effectiveIsSynthetic) {
    unresolvedIssues.push(
      'Artifact is a synthetic test fixture (isSyntheticFixture: true). It verifies container/pipeline tooling only and is not a production Blender asset.',
    );
  }

  unresolvedIssues.push(
    'Visual quality (framing, lighting response, silhouette, PBR material appearance) and live browser rendering are not proven by static GLB inspection.',
  );

  if (!currentRunProvenanceVerified) {
    unresolvedIssues.push(
      'Current-run Blender runtime provenance is unverified; Runtime status remains Not Run and Artifact status remains Not Produced.',
    );
  }

  if (nextActions.length === 0) {
    nextActions.push(
      `Load '${safeFilename}' in the target ${targetViewerStack} viewer using the generated integration template and verify visual framing, lighting, and material response manually.`,
    );
  }
  if (inspection?.khronosValidator?.status !== 'passed') {
    nextActions.push(
      'Optionally run the upstream Khronos gltf-validator for exhaustive glTF 2.0 specification verification.',
    );
  }
  nextActions.push(
    'Pass this handoff manifest and summary to plain-language-response when preparing the final plain-language delivery note.',
  );

  const overallVerdict =
    !inspection?.valid || errors.length > 0
      ? 'Fail'
      : warnings.length > 0 || perfWarnings.length > 0 || externalFiles.length > 0
        ? 'Warn'
        : 'Pass';

  const structTierStatus =
    !inspection?.valid || errors.length > 0
      ? 'Failed'
      : warnings.length > 0
        ? 'Warn'
        : 'Passed';

  const gltfSpecTier = inspection?.validationTiers?.gltfSpecification || {
    status: 'Not Run',
    tool: 'gltf-validator',
    summary:
      'Upstream Khronos gltf-validator was not executed; built-in inspection covers GLB 2.0 container structure and cross-references.',
  };

  const bbox = inspection?.bounds?.sceneBoundingBox || {
    min: null,
    max: null,
    dimensions: null,
    center: null,
  };

  const manifest = {
    $schema: '../schemas/glb-web-handoff-manifest.schema.json',
    schemaVersion: '1.0.0',
    manifestId: sanitizeSlug(safeFilename),
    skillId: 'glb-web-handoff',
    artifact: {
      filename: safeFilename,
      format: 'GLB 2.0',
      byteSize: typeof inspection?.byteSize === 'number' ? inspection.byteSize : null,
      sha256: typeof inspection?.sha256 === 'string' ? inspection.sha256 : null,
      gltfVersion: inspection?.asset?.version === '2.0' ? '2.0' : null,
      generator: typeof inspection?.asset?.generator === 'string' ? inspection.asset.generator : null,
      provenance: {
        sourceKind: effectiveSourceKind,
        isSyntheticFixture: effectiveIsSynthetic,
        currentRunProvenanceVerified: Boolean(currentRunProvenanceVerified) && !effectiveIsSynthetic,
        notes: effectiveIsSynthetic
          ? 'Synthetic GLB 2.0 test fixture generated in memory/disk for deterministic structural and handoff verification. Not a Blender export.'
          : currentRunProvenanceVerified
            ? 'Artifact provenance linked to current recorded run.'
            : 'Pre-existing or user-supplied GLB inspected statically; live Blender export provenance is not verified in this run.',
      },
    },
    truthStates: {
      runtimeStatus: effectiveRuntimeStatus,
      runtimePath: effectiveRuntimePath,
      artifactStatus: effectiveArtifactStatus,
      releaseEligibility,
    },
    contents: {
      counts,
      defaultSceneIndex: details.defaultSceneIndex,
      scenes: details.scenes,
      meshes: details.meshes,
      materials: details.materials,
      textures: details.textures,
      animations: details.animations,
    },
    extensionsAndCompression: {
      extensionsUsed: ext.extensionsUsed,
      extensionsRequired: ext.extensionsRequired,
      undeclaredExtensionsFound: ext.undeclaredExtensionsFound,
      compression: ext.compression,
      externalResources: details.externalResources,
    },
    spatialAndTransformAssumptions: {
      unitScaleMetersPerUnit: Number(unitScaleMetersPerUnit) > 0 ? Number(unitScaleMetersPerUnit) : 1.0,
      coordinateSystem: {
        upAxis: '+Y',
        forwardAxis: forwardAxis === '-Z' ? '-Z' : '+Z',
        handedness: 'right-handed',
        sourceUpAxisConversionNote:
          'glTF 2.0 specifies +Y up, +Z forward, and 1 unit = 1 meter. Blender scenes (Z-up) require +Y up conversion at export time; static binary inspection verifies node transforms and bounds but cannot prove semantic orientation.',
      },
      originPolicy,
      sceneBoundingBox: {
        min: bbox.min || null,
        max: bbox.max || null,
        dimensions: bbox.dimensions || null,
        center: bbox.center || null,
      },
      rootNodeTransforms: details.rootNodeTransforms,
    },
    targetViewer: {
      stack: ['threejs', 'react-three-fiber', 'model-viewer', 'babylonjs', 'generic-webgl'].includes(
        targetViewerStack,
      )
        ? targetViewerStack
        : 'threejs',
      dracoDecoderPath: ext.compression.draco.decoderRequired ? '/draco/' : null,
      ktx2TranscoderPath: ext.compression.ktx2BasisU.transcoderRequired ? '/basis/' : null,
      meshoptDecoderRequired: Boolean(ext.compression.meshopt.decoderRequired),
      toneMappingAssumption:
        'ACESFilmicToneMapping or AgX/Neutral tone mapping must be chosen explicitly by the web application; appearance varies by tone mapper and exposure.',
      outputColorSpaceAssumption:
        'THREE.SRGBColorSpace output encoding with sRGB baseColor/emissive textures and LinearSRGB data textures (normal, metallicRoughness, occlusion).',
      environmentLightingAssumption:
        'PBR metallic-roughness materials require an environment map (e.g. RoomEnvironment + PMREMGenerator or HDRI) to avoid appearing black or flat.',
    },
    validationSummary: {
      overallVerdict,
      tiers: {
        containerStructural: {
          status: structTierStatus,
          tool: 'scripts/inspect-glb.mjs',
          errorCount: errors.length,
          warningCount: warnings.length,
          summary:
            structTierStatus === 'Failed'
              ? `GLB 2.0 container structural check failed with ${errors.length} error(s).`
              : `GLB 2.0 container structural check passed (${warnings.length} warning(s)).`,
        },
        gltfSpecification: gltfSpecTier,
        visualQuality: {
          status: 'Not Run',
          summary:
            'Visual quality (framing, silhouette, lighting balance, material appearance) is not verified by binary inspection and requires rendered or live viewer inspection.',
        },
        liveRuntime: {
          status: effectiveRuntimeStatus === 'Verified' ? 'Passed' : 'Not Run',
          summary:
            effectiveRuntimeStatus === 'Verified'
              ? 'Live runtime execution evidence verified.'
              : 'Live Blender runtime execution was Not Run in this inspection pass.',
        },
      },
      errors,
      warnings,
      performanceWarnings: perfWarnings,
    },
    unresolvedIssues,
    nextActions,
  };

  return manifest;
}

export function buildWebIntegrationCodeSnippets(manifest) {
  const filename = manifest?.artifact?.filename || 'model.glb';
  const comp = manifest?.extensionsAndCompression?.compression || {};
  const needsDraco = Boolean(comp.draco?.decoderRequired);
  const needsMeshopt = Boolean(comp.meshopt?.decoderRequired);
  const needsKtx2 = Boolean(comp.ktx2BasisU?.transcoderRequired);
  const animations = Array.isArray(manifest?.contents?.animations) ? manifest.contents.animations : [];
  const defaultClip = animations[0]?.name || null;

  const threeImports = [
    "import * as THREE from 'three';",
    "import { OrbitControls } from 'three/addons/controls/OrbitControls.js';",
    "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';",
    "import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';",
  ];
  if (needsDraco) {
    threeImports.push("import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';");
  }
  if (needsMeshopt) {
    threeImports.push("import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';");
  }
  if (needsKtx2) {
    threeImports.push("import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';");
  }

  const decoderSetupLines = [];
  if (needsDraco) {
    decoderSetupLines.push(
      '  const dracoLoader = new DRACOLoader();',
      `  dracoLoader.setDecoderPath(options.dracoDecoderPath || '${manifest?.targetViewer?.dracoDecoderPath || '/draco/'}');`,
      '  loader.setDRACOLoader(dracoLoader);',
    );
  }
  if (needsMeshopt) {
    decoderSetupLines.push('  loader.setMeshoptDecoder(MeshoptDecoder);');
  }
  if (needsKtx2) {
    decoderSetupLines.push(
      '  const ktx2Loader = new KTX2Loader();',
      `  ktx2Loader.setTranscoderPath(options.ktx2TranscoderPath || '${manifest?.targetViewer?.ktx2TranscoderPath || '/basis/'}');`,
      '  ktx2Loader.detectSupport(renderer);',
      '  loader.setKTX2Loader(ktx2Loader);',
    );
  }

  const decoderCleanupLines = [];
  if (needsDraco) decoderCleanupLines.push('      dracoLoader.dispose();');
  if (needsKtx2) decoderCleanupLines.push('      ktx2Loader.dispose();');

  const threeJsCode = `${threeImports.join('\n')}

/**
 * Mounts a GLB 2.0 asset into a container element with automatic bounding-box framing,
 * studio PMREM lighting, OrbitControls, optional animation playback, and deterministic disposal.
 *
 * Truth boundary: Loading a GLB in Three.js verifies client-side runtime parsing only;
 * visual framing and material fidelity must still be reviewed by a human operator.
 */
export function mountGlbViewer(container, options = {}) {
  const assetUrl = options.assetUrl || './${filename}';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;

  const camera = new THREE.PerspectiveCamera(
    45,
    (container.clientWidth || 800) / (container.clientHeight || 600),
    0.01,
    1000,
  );
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const loader = new GLTFLoader();
${decoderSetupLines.length > 0 ? decoderSetupLines.join('\n') : '  // No compression decoders required by this manifest.'}

  let mixer = null;
  let loadedRoot = null;
  let frameId = null;
  let disposed = false;
  const clock = new THREE.Clock();

  loader.load(
    assetUrl,
    (gltf) => {
      if (disposed) return;
      loadedRoot = gltf.scene;
      scene.add(loadedRoot);

      // Frame camera from measured scene bounding box
      const box = new THREE.Box3().setFromObject(loadedRoot);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z, 0.1);
      const fitDist = maxDim * 1.85;

      camera.near = Math.max(maxDim / 100, 0.001);
      camera.far = Math.max(maxDim * 100, 100);
      camera.position.set(center.x + fitDist * 0.6, center.y + fitDist * 0.45, center.z + fitDist);
      camera.updateProjectionMatrix();
      controls.target.copy(center);
      controls.update();

      if (Array.isArray(gltf.animations) && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(loadedRoot);
        const clipName = options.clipName ?? ${defaultClip ? JSON.stringify(defaultClip) : 'null'};
        const clip =
          (clipName && THREE.AnimationClip.findByName(gltf.animations, clipName)) ||
          gltf.animations[0];
        if (clip) {
          mixer.clipAction(clip).play();
        }
      }
      if (typeof options.onLoaded === 'function') {
        options.onLoaded({ gltf, bounds: { size, center } });
      }
    },
    undefined,
    (error) => {
      if (typeof options.onError === 'function') {
        options.onError(error);
      }
    },
  );

  function onResize() {
    if (disposed) return;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  function animate() {
    if (disposed) return;
    frameId = window.requestAnimationFrame(animate);
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  return {
    dispose() {
      disposed = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      if (mixer && loadedRoot) mixer.uncacheRoot(loadedRoot);
      if (loadedRoot) {
        loadedRoot.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry?.dispose?.();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            for (const m of mats) {
              if (!m) continue;
              for (const val of Object.values(m)) {
                if (val && typeof val === 'object' && val.isTexture) {
                  val.dispose();
                }
              }
              m.dispose?.();
            }
          }
        });
      }
      controls.dispose();
      envTexture.dispose();
      pmremGenerator.dispose();
${decoderCleanupLines.join('\n')}
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
`;

  const r3fCode = `import React, { Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Environment, OrbitControls, useAnimations, useGLTF } from '@react-three/drei';

export interface GlbHandoffModelProps {
  /** URL or path to the GLB 2.0 asset (never hardcode a synthetic fixture as a production asset) */
  src: string;
  /** Optional animation clip name (${animations.length > 0 ? animations.map((a) => `'${a.name || `clip_${a.index}`}'`).join(' | ') : 'string'}) */
  clipName?: string;
  /** Uniform scale multiplier (manifest assumes ${manifest?.spatialAndTransformAssumptions?.unitScaleMetersPerUnit ?? 1}m per unit, +Y up) */
  scale?: number;
  /** Optional Draco decoder path when KHR_draco_mesh_compression is used */
  dracoDecoderPath?: string;
  onLoaded?: (info: { sceneName: string | null; clipNames: string[] }) => void;
}

export function GlbHandoffModel({
  src,
  clipName = ${defaultClip ? JSON.stringify(defaultClip) : 'undefined'},
  scale = 1,
  dracoDecoderPath = ${needsDraco ? JSON.stringify(manifest?.targetViewer?.dracoDecoderPath || '/draco/') : 'undefined'},
  onLoaded,
}: GlbHandoffModelProps) {
  const gltf = useGLTF(src, dracoDecoderPath || false);
  const { actions, names } = useAnimations(gltf.animations, gltf.scene);

  useEffect(() => {
    onLoaded?.({
      sceneName: gltf.scene?.name || null,
      clipNames: names,
    });
  }, [gltf.scene, names, onLoaded]);

  useEffect(() => {
    const targetClip = clipName && actions[clipName] ? clipName : names[0];
    const action = targetClip ? actions[targetClip] : null;
    if (action) {
      action.reset().fadeIn(0.2).play();
      return () => {
        action.fadeOut(0.2);
      };
    }
    return undefined;
  }, [actions, clipName, names]);

  return <primitive object={gltf.scene} scale={scale} />;
}

export interface GlbHandoffViewerCanvasProps extends GlbHandoffModelProps {
  fallback?: React.ReactNode;
}

export function GlbHandoffViewerCanvas({
  src = './${filename}',
  clipName,
  scale = 1,
  dracoDecoderPath,
  fallback = null,
  onLoaded,
}: GlbHandoffViewerCanvasProps) {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.01, far: 1000, position: [2.2, 1.6, 2.8] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={fallback}>
        <Environment preset="studio" />
        <Bounds fit clip observe margin={1.25}>
          <GlbHandoffModel
            src={src}
            clipName={clipName}
            scale={scale}
            dracoDecoderPath={dracoDecoderPath}
            onLoaded={onLoaded}
          />
        </Bounds>
        <OrbitControls makeDefault enableDamping />
      </Suspense>
    </Canvas>
  );
}
`;

  return {
    threejs: threeJsCode,
    reactThreeFiber: r3fCode,
  };
}

export function formatGlbHandoffMarkdownSummary(manifest) {
  const art = manifest.artifact;
  const ts = manifest.truthStates;
  const counts = manifest.contents.counts;
  const ext = manifest.extensionsAndCompression;
  const spatial = manifest.spatialAndTransformAssumptions;
  const val = manifest.validationSummary;

  const lines = [
    `## BlendOps GLB Web Handoff Report — \`${art.filename}\``,
    '',
    '### 1. Truth State & Provenance',
    `- **Overall handoff verdict:** \`${val.overallVerdict}\``,
    `- **Runtime status:** \`${ts.runtimeStatus}\` (path: \`${ts.runtimePath}\`)`,
    `- **Artifact status:** \`${ts.artifactStatus}\` (release eligibility: \`${ts.releaseEligibility}\`)`,
    `- **Artifact provenance:** \`${art.provenance.sourceKind}\` (\`isSyntheticFixture: ${art.provenance.isSyntheticFixture}\`, \`currentRunProvenanceVerified: ${art.provenance.currentRunProvenanceVerified}\`)`,
    `- **Provenance note:** ${art.provenance.notes}`,
    '',
    '### 2. 4-Tier Validation Summary',
    `- **Tier 1 — Container Structural Inspection (\`${val.tiers.containerStructural.tool}\`):** \`${val.tiers.containerStructural.status}\` — ${val.tiers.containerStructural.summary}`,
    `- **Tier 2 — Khronos glTF 2.0 Specification (\`${val.tiers.gltfSpecification.tool}\`):** \`${val.tiers.gltfSpecification.status}\` — ${val.tiers.gltfSpecification.summary}`,
    `- **Tier 3 — Visual Quality Validation:** \`${val.tiers.visualQuality.status}\` — ${val.tiers.visualQuality.summary}`,
    `- **Tier 4 — Live Blender Runtime Execution:** \`${val.tiers.liveRuntime.status}\` — ${val.tiers.liveRuntime.summary}`,
    '',
    '### 3. Artifact Contents & Geometry Inventory',
    `- **Format / Version:** \`${art.format}\` (glTF \`${art.gltfVersion || 'unknown'}\`, generator: \`${art.generator || 'unspecified'}\`)`,
    `- **File size:** \`${art.byteSize ?? 0} bytes\` (\`SHA-256: ${art.sha256 || 'none'}\`)`,
    `- **Scene graph counts:** \`${counts.scenes}\` scene(s), \`${counts.nodes}\` node(s), \`${counts.meshes}\` mesh(es), \`${counts.primitives}\` primitive(s)`,
    `- **Geometry budget:** \`${counts.vertices}\` vertices, \`~${counts.trianglesEstimate}\` estimated triangles`,
    `- **Surface & animation counts:** \`${counts.materials}\` material(s), \`${counts.textures}\` texture(s), \`${counts.images}\` image(s), \`${counts.animations}\` animation clip(s), \`${counts.skins}\` skin(s)`,
    '',
    '### 4. Extensions, Compression & External Dependencies',
    `- **Extensions used:** ${ext.extensionsUsed.length > 0 ? ext.extensionsUsed.map((e) => `\`${e}\``).join(', ') : 'none'}`,
    `- **Extensions required:** ${ext.extensionsRequired.length > 0 ? ext.extensionsRequired.map((e) => `\`${e}\``).join(', ') : 'none'}`,
    `- **Draco compression (\`KHR_draco_mesh_compression\`):** \`${ext.compression.draco.decoderRequired ? 'Decoder required' : 'Not used'}\``,
    `- **Meshopt compression (\`EXT_meshopt_compression\`):** \`${ext.compression.meshopt.decoderRequired ? 'Decoder required' : 'Not used'}\``,
    `- **KTX2 / BasisU textures (\`KHR_texture_basisu\`):** \`${ext.compression.ktx2BasisU.transcoderRequired ? 'Transcoder required' : 'Not used'}\``,
    `- **External URI references:** \`${ext.externalResources.filter((r) => r.isExternalFile).length}\``,
    '',
    '### 5. Spatial, Scale & Transform Assumptions',
    `- **Unit scale:** \`1 unit = ${spatial.unitScaleMetersPerUnit} meter(s)\``,
    `- **Coordinate system:** \`${spatial.coordinateSystem.upAxis}\` up, \`${spatial.coordinateSystem.forwardAxis}\` forward (\`${spatial.coordinateSystem.handedness}\`)`,
    `- **Origin policy:** \`${spatial.originPolicy}\``,
    `- **Measured bounding box:** ${spatial.sceneBoundingBox.dimensions ? `dimensions \`[${spatial.sceneBoundingBox.dimensions.join(', ')}]\`, center \`[${spatial.sceneBoundingBox.center.join(', ')}]\`` : 'unavailable'}`,
    `- **Target web viewer stack:** \`${manifest.targetViewer.stack}\``,
    '',
  ];

  if (val.errors.length > 0) {
    lines.push('### 6. Structural Errors');
    for (const err of val.errors) {
      lines.push(`- ${err}`);
    }
    lines.push('');
  }

  if (val.warnings.length > 0 || val.performanceWarnings.length > 0) {
    lines.push('### 7. Compatibility & Performance Warnings');
    for (const w of [...val.warnings, ...val.performanceWarnings]) {
      lines.push(`- ${w}`);
    }
    lines.push('');
  }

  lines.push('### 8. Unresolved Limitations & Caveats');
  for (const issue of manifest.unresolvedIssues) {
    lines.push(`- ${issue}`);
  }
  lines.push('');
  lines.push('### 9. Recommended Next Actions');
  for (const act of manifest.nextActions) {
    lines.push(`- ${act}`);
  }
  lines.push('');

  return lines.join('\n');
}

export function renderGlbHandoffHtmlReport(manifest, snippets) {
  const art = manifest.artifact;
  const ts = manifest.truthStates;
  const counts = manifest.contents.counts;
  const ext = manifest.extensionsAndCompression;
  const spatial = manifest.spatialAndTransformAssumptions;
  const val = manifest.validationSummary;

  const verdictBadgeClass =
    val.overallVerdict === 'Pass'
      ? 'badge-pass'
      : val.overallVerdict === 'Warn'
        ? 'badge-warn'
        : 'badge-fail';

  const meshRows =
    manifest.contents.meshes.length > 0
      ? manifest.contents.meshes
          .map(
            (m) => `<tr>
              <td class="num">${m.index}</td>
              <td><code>${escapeHtml(m.name || `mesh_${m.index}`)}</code></td>
              <td class="num">${m.primitiveCount}</td>
              <td class="num">${m.vertexCount.toLocaleString('en-US')}</td>
              <td class="num">${m.triangleEstimate.toLocaleString('en-US')}</td>
              <td><code>${escapeHtml(m.attributes.join(', ') || 'none')}</code></td>
              <td class="num">${m.morphTargetCount}</td>
            </tr>`,
          )
          .join('\n')
      : '<tr><td colspan="7" class="empty-cell">No meshes declared in this GLB container.</td></tr>';

  const materialRows =
    manifest.contents.materials.length > 0
      ? manifest.contents.materials
          .map(
            (mat) => `<tr>
              <td class="num">${mat.index}</td>
              <td><code>${escapeHtml(mat.name || `material_${mat.index}`)}</code></td>
              <td><code>${escapeHtml(mat.alphaMode)}</code></td>
              <td>${mat.doubleSided ? 'Yes' : 'No'}</td>
              <td class="num">${mat.metallicFactor.toFixed(2)} / ${mat.roughnessFactor.toFixed(2)}</td>
              <td>${[
                mat.hasBaseColorTexture ? 'BaseColor' : null,
                mat.hasMetallicRoughnessTexture ? 'MetalRough' : null,
                mat.hasNormalTexture ? 'Normal' : null,
                mat.hasOcclusionTexture ? 'Occlusion' : null,
                mat.hasEmissiveTexture ? 'Emissive' : null,
              ]
                .filter(Boolean)
                .join(', ') || 'Factors only'}</td>
              <td><code>${escapeHtml(mat.extensions.join(', ') || 'Standard PBR')}</code></td>
            </tr>`,
          )
          .join('\n')
      : '<tr><td colspan="7" class="empty-cell">No materials declared in this GLB container.</td></tr>';

  const animationRows =
    manifest.contents.animations.length > 0
      ? manifest.contents.animations
          .map(
            (anim) => `<tr>
              <td class="num">${anim.index}</td>
              <td><code>${escapeHtml(anim.name || `clip_${anim.index}`)}</code></td>
              <td class="num">${anim.channelCount}</td>
              <td class="num">${anim.samplerCount}</td>
              <td class="num">${anim.durationSeconds !== null ? `${anim.durationSeconds.toFixed(3)}s` : 'Unknown'}</td>
              <td><code>${escapeHtml(anim.targetPaths.join(', ') || 'none')}</code></td>
              <td><code>${escapeHtml(anim.interpolationModes.join(', ') || 'LINEAR')}</code></td>
            </tr>`,
          )
          .join('\n')
      : '<tr><td colspan="7" class="empty-cell">Static asset — 0 animation clips present.</td></tr>';

  const embeddedManifestJson = JSON.stringify(manifest).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BlendOps GLB Web Handoff Report — ${escapeHtml(art.filename)}</title>
  <style>
    :root {
      --bg: #0b0f19;
      --surface: #111827;
      --surface-elevated: #1e293b;
      --border: #263248;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #38bdf8;
      --pass-bg: rgba(22, 163, 74, 0.16);
      --pass-border: rgba(34, 197, 94, 0.45);
      --pass-text: #4ade80;
      --warn-bg: rgba(217, 119, 6, 0.16);
      --warn-border: rgba(245, 158, 11, 0.45);
      --warn-text: #fbbf24;
      --fail-bg: rgba(220, 38, 38, 0.16);
      --fail-border: rgba(248, 113, 113, 0.45);
      --fail-text: #f87171;
      --neutral-bg: rgba(148, 163, 184, 0.12);
      --neutral-border: rgba(148, 163, 184, 0.35);
      --neutral-text: #cbd5e1;
      --mono: "JetBrains Mono", "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      --sans: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      font-size: 14px;
      line-height: 1.55;
    }
    .container {
      max-width: 1240px;
      margin: 0 auto;
      padding: 28px 24px 56px;
    }
    header.top-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
    }
    .eyebrow {
      font-family: var(--mono);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 6px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .truth-banner {
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 24px;
      color: var(--text-muted);
      font-size: 13px;
    }
    .truth-banner strong { color: var(--text); }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 4px;
      font-family: var(--mono);
      font-size: 12px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .badge-pass { background: var(--pass-bg); border-color: var(--pass-border); color: var(--pass-text); }
    .badge-warn { background: var(--warn-bg); border-color: var(--warn-border); color: var(--warn-text); }
    .badge-fail { background: var(--fail-bg); border-color: var(--fail-border); color: var(--fail-text); }
    .badge-neutral { background: var(--neutral-bg); border-color: var(--neutral-border); color: var(--neutral-text); }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .panel {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .metric-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .metric-value {
      font-family: var(--mono);
      font-size: 18px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .metric-sub {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 6px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 9px 10px;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }
    th {
      color: var(--text-muted);
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    td.num, th.num {
      text-align: right;
      font-family: var(--mono);
      font-variant-numeric: tabular-nums;
    }
    td.empty-cell {
      text-align: center;
      color: var(--text-muted);
      padding: 16px;
    }
    code, pre {
      font-family: var(--mono);
      font-variant-numeric: tabular-nums;
    }
    pre.code-block {
      background: #070a12;
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 14px;
      overflow-x: auto;
      font-size: 12px;
      line-height: 1.5;
      color: #e2e8f0;
      margin: 0;
    }
    ul.compact-list {
      margin: 0;
      padding-left: 18px;
    }
    ul.compact-list li {
      margin-bottom: 6px;
    }
    .preview-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 16px;
      align-items: stretch;
    }
    @media (max-width: 860px) {
      .preview-grid { grid-template-columns: 1fr; }
    }
    .canvas-stage {
      background: #070a12;
      border: 1px solid var(--border);
      border-radius: 6px;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 12px;
    }
    canvas#glbWireframeCanvas {
      width: 100%;
      height: 240px;
      display: block;
    }
    .file-drop-zone {
      border: 1px dashed var(--border);
      border-radius: 6px;
      padding: 14px;
      background: rgba(30, 41, 59, 0.4);
    }
    .btn {
      background: var(--surface-elevated);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 6px 12px;
      font-family: var(--sans);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .btn:hover { border-color: var(--accent); }
  </style>
</head>
<body>
  <div class="container">
    <header class="top-header">
      <div>
        <div class="eyebrow">BlendOps Phase 12 · Web-Ready GLB Handoff Report</div>
        <h1>${escapeHtml(art.filename)}</h1>
        <div class="metric-sub">
          SHA-256: <code>${escapeHtml(art.sha256 || 'none')}</code> · Size: <code>${(art.byteSize ?? 0).toLocaleString('en-US')} bytes</code> · Target stack: <code>${escapeHtml(manifest.targetViewer.stack)}</code>
        </div>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <span class="badge ${verdictBadgeClass}">Verdict: ${escapeHtml(val.overallVerdict)}</span>
        <span class="badge badge-neutral">Runtime: ${escapeHtml(ts.runtimeStatus)}</span>
        <span class="badge badge-neutral">Artifact: ${escapeHtml(ts.artifactStatus)}</span>
        <span class="badge badge-neutral">Provenance: ${escapeHtml(art.provenance.sourceKind)}</span>
      </div>
    </header>

    <section class="truth-banner" aria-label="Evidence and Truth Boundary">
      <strong>Evidence-Before-Done Truth Boundary:</strong>
      ${escapeHtml(CONTAINER_TRUTH_DISCLAIMER)}
      <br />
      <strong>Provenance note:</strong> ${escapeHtml(art.provenance.notes)}
    </section>

    <section class="grid-4" aria-label="4-Tier Validation Matrix">
      <div class="panel" style="margin-bottom:0;">
        <div class="metric-label">Tier 1 · Container Structure</div>
        <div class="metric-value">${escapeHtml(val.tiers.containerStructural.status)}</div>
        <div class="metric-sub">${escapeHtml(val.tiers.containerStructural.summary)}</div>
      </div>
      <div class="panel" style="margin-bottom:0;">
        <div class="metric-label">Tier 2 · Khronos glTF 2.0 Spec</div>
        <div class="metric-value">${escapeHtml(val.tiers.gltfSpecification.status)}</div>
        <div class="metric-sub">${escapeHtml(val.tiers.gltfSpecification.summary)}</div>
      </div>
      <div class="panel" style="margin-bottom:0;">
        <div class="metric-label">Tier 3 · Visual Quality</div>
        <div class="metric-value">${escapeHtml(val.tiers.visualQuality.status)}</div>
        <div class="metric-sub">${escapeHtml(val.tiers.visualQuality.summary)}</div>
      </div>
      <div class="panel" style="margin-bottom:0;">
        <div class="metric-label">Tier 4 · Live Blender Runtime</div>
        <div class="metric-value">${escapeHtml(val.tiers.liveRuntime.status)}</div>
        <div class="metric-sub">${escapeHtml(val.tiers.liveRuntime.summary)}</div>
      </div>
    </section>

    <section class="panel" aria-label="Local Client-Side GLB Preview and Bounds Inspector">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
        <h2 style="margin:0;">Interactive Local GLB Bounding-Box Preview &amp; Client-Side Binary Inspector</h2>
        <span class="badge badge-neutral">100% Local Browser Inspection · Zero External Uploads</span>
      </div>
      <p style="margin:0 0 12px; color:var(--text-muted); font-size:13px;">
        This preview renders the measured bounding box and coordinate axes (<code>+Y up</code>, <code>${escapeHtml(spatial.coordinateSystem.forwardAxis)} forward</code>, <code>1 unit = ${spatial.unitScaleMetersPerUnit}m</code>) and lets you inspect any local <code>.glb</code> file directly in your browser without transmitting data externally.
        <strong>Note:</strong> Client-side previewing does not prove production visual correctness or lighting/material accuracy.
      </p>
      <div class="preview-grid">
        <div class="canvas-stage">
          <canvas id="glbWireframeCanvas" width="720" height="240" aria-label="3D bounding box wireframe preview"></canvas>
          <div style="display:flex; justify-content:space-between; align-items:center; font-family:var(--mono); font-size:12px; color:var(--text-muted);">
            <span id="previewBoundsLabel">
              Bounds: ${spatial.sceneBoundingBox.dimensions ? `[${spatial.sceneBoundingBox.dimensions.join('m × ')}m]` : 'No POSITION bounds'}
            </span>
            <button type="button" class="btn" id="resetRotationBtn">Reset Turntable Angle</button>
          </div>
        </div>
        <div class="file-drop-zone">
          <div style="font-weight:600; margin-bottom:6px;">Inspect Local .glb File (Client-Side)</div>
          <p style="font-size:12px; color:var(--text-muted); margin:0 0 10px;">
            Select a local <code>.glb</code> file on your machine to verify its 12-byte GLB header, JSON chunk counts, and POSITION bounding box locally.
          </p>
          <input type="file" id="localGlbInput" accept=".glb" style="font-size:12px; width:100%; margin-bottom:12px;" aria-label="Select local GLB file to inspect" />
          <div id="localInspectResult" style="font-family:var(--mono); font-size:12px; color:var(--text-muted); white-space:pre-wrap;">Loaded manifest: ${escapeHtml(art.filename)} (${counts.meshes} mesh, ${counts.vertices} verts, ~${counts.trianglesEstimate} tris)</div>
        </div>
      </div>
    </section>

    <section class="grid-2" aria-label="Spatial Assumptions and Extensions">
      <div class="panel" style="margin-bottom:0;">
        <h2>Spatial, Coordinate &amp; Transform Assumptions</h2>
        <table>
          <tbody>
            <tr><th>Unit Scale</th><td class="num">1 unit = ${spatial.unitScaleMetersPerUnit} m</td></tr>
            <tr><th>Coordinate Axes</th><td class="num">${escapeHtml(spatial.coordinateSystem.upAxis)} up / ${escapeHtml(spatial.coordinateSystem.forwardAxis)} forward (${escapeHtml(spatial.coordinateSystem.handedness)})</td></tr>
            <tr><th>Origin Policy</th><td class="num"><code>${escapeHtml(spatial.originPolicy)}</code></td></tr>
            <tr><th>Bounding Box Min</th><td class="num"><code>${spatial.sceneBoundingBox.min ? `[${spatial.sceneBoundingBox.min.join(', ')}]` : 'null'}</code></td></tr>
            <tr><th>Bounding Box Max</th><td class="num"><code>${spatial.sceneBoundingBox.max ? `[${spatial.sceneBoundingBox.max.join(', ')}]` : 'null'}</code></td></tr>
            <tr><th>Dimensions (W×H×D)</th><td class="num"><code>${spatial.sceneBoundingBox.dimensions ? `[${spatial.sceneBoundingBox.dimensions.join(', ')}]` : 'null'}</code></td></tr>
          </tbody>
        </table>
      </div>
      <div class="panel" style="margin-bottom:0;">
        <h2>Extensions, Compression &amp; Decoder Requirements</h2>
        <table>
          <tbody>
            <tr><th>Extensions Used</th><td><code>${escapeHtml(ext.extensionsUsed.join(', ') || 'none')}</code></td></tr>
            <tr><th>Extensions Required</th><td><code>${escapeHtml(ext.extensionsRequired.join(', ') || 'none')}</code></td></tr>
            <tr><th>Draco (<code>KHR_draco_mesh_compression</code>)</th><td>${ext.compression.draco.decoderRequired ? '<span class="badge badge-warn">DRACOLoader Required</span>' : '<span class="badge badge-pass">Not Required</span>'}</td></tr>
            <tr><th>Meshopt (<code>EXT_meshopt_compression</code>)</th><td>${ext.compression.meshopt.decoderRequired ? '<span class="badge badge-warn">MeshoptDecoder Required</span>' : '<span class="badge badge-pass">Not Required</span>'}</td></tr>
            <tr><th>KTX2 / BasisU (<code>KHR_texture_basisu</code>)</th><td>${ext.compression.ktx2BasisU.transcoderRequired ? '<span class="badge badge-warn">KTX2Loader Required</span>' : '<span class="badge badge-pass">Not Required</span>'}</td></tr>
            <tr><th>External URI References</th><td class="num">${ext.externalResources.filter((r) => r.isExternalFile).length}</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel" aria-label="Mesh Inventory">
      <h2>Mesh &amp; Primitive Inventory (${counts.meshes} mesh(es), ${counts.vertices.toLocaleString('en-US')} vertices, ~${counts.trianglesEstimate.toLocaleString('en-US')} triangles)</h2>
      <table>
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Mesh Name</th>
            <th class="num">Primitives</th>
            <th class="num">Vertices</th>
            <th class="num">Est. Triangles</th>
            <th>Vertex Attributes</th>
            <th class="num">Morph Targets</th>
          </tr>
        </thead>
        <tbody>
          ${meshRows}
        </tbody>
      </table>
    </section>

    <section class="panel" aria-label="Material Inventory">
      <h2>Material &amp; Texture Portability (${counts.materials} material(s), ${counts.textures} texture(s))</h2>
      <table>
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Material Name</th>
            <th>Alpha Mode</th>
            <th>Double Sided</th>
            <th class="num">Metal / Rough</th>
            <th>Bound Texture Maps</th>
            <th>Material Extensions</th>
          </tr>
        </thead>
        <tbody>
          ${materialRows}
        </tbody>
      </table>
    </section>

    <section class="panel" aria-label="Animation Inventory">
      <h2>Animation Clips &amp; Playback Contract (${counts.animations} clip(s))</h2>
      <table>
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Clip Name</th>
            <th class="num">Channels</th>
            <th class="num">Samplers</th>
            <th class="num">Duration</th>
            <th>Target Paths</th>
            <th>Interpolation</th>
          </tr>
        </thead>
        <tbody>
          ${animationRows}
        </tbody>
      </table>
    </section>

    <section class="grid-2" aria-label="Diagnostics and Next Actions">
      <div class="panel" style="margin-bottom:0;">
        <h2>Diagnostics, Warnings &amp; Unresolved Caveats</h2>
        ${
          val.errors.length > 0
            ? `<div style="margin-bottom:10px;"><strong style="color:var(--fail-text);">Structural Errors (${val.errors.length}):</strong><ul class="compact-list">${val.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul></div>`
            : ''
        }
        ${
          val.warnings.length + val.performanceWarnings.length > 0
            ? `<div style="margin-bottom:10px;"><strong style="color:var(--warn-text);">Warnings (${val.warnings.length + val.performanceWarnings.length}):</strong><ul class="compact-list">${[...val.warnings, ...val.performanceWarnings].map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul></div>`
            : ''
        }
        <div>
          <strong>Unresolved Issues &amp; Verification Boundaries:</strong>
          <ul class="compact-list">
            ${manifest.unresolvedIssues.map((u) => `<li>${escapeHtml(u)}</li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="panel" style="margin-bottom:0;">
        <h2>Recommended Next Actions</h2>
        <ul class="compact-list">
          ${manifest.nextActions.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}
        </ul>
      </div>
    </section>

    <section class="panel" aria-label="Three.js Integration Code">
      <h2>Three.js Integration Module (<code>GLTFLoader</code> + Framing + Disposal)</h2>
      <pre class="code-block"><code>${escapeHtml(snippets.threejs)}</code></pre>
    </section>

    <section class="panel" aria-label="React Three Fiber Integration Code">
      <h2>React Three Fiber Component Integration (<code>@react-three/fiber</code> + <code>@react-three/drei</code>)</h2>
      <pre class="code-block"><code>${escapeHtml(snippets.reactThreeFiber)}</code></pre>
    </section>
  </div>

  <script id="blendops-handoff-manifest-data" type="application/json">${embeddedManifestJson}</script>
  <script>
    (function () {
      const manifestDataEl = document.getElementById('blendops-handoff-manifest-data');
      const initialManifest = manifestDataEl ? JSON.parse(manifestDataEl.textContent) : null;
      const canvas = document.getElementById('glbWireframeCanvas');
      const resetBtn = document.getElementById('resetRotationBtn');
      const fileInput = document.getElementById('localGlbInput');
      const resultBox = document.getElementById('localInspectResult');
      const boundsLabel = document.getElementById('previewBoundsLabel');

      let activeDims = (initialManifest &&
        initialManifest.spatialAndTransformAssumptions &&
        initialManifest.spatialAndTransformAssumptions.sceneBoundingBox &&
        initialManifest.spatialAndTransformAssumptions.sceneBoundingBox.dimensions) || [1, 1, 1];
      let yaw = 0.62;

      function drawWireframeBounds() {
        if (!canvas || !canvas.getContext) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const dx = Math.max(Number(activeDims[0]) || 1, 0.15);
        const dy = Math.max(Number(activeDims[1]) || 1, 0.15);
        const dz = Math.max(Number(activeDims[2]) || 0.25, 0.15);
        const maxD = Math.max(dx, dy, dz, 0.5);
        const sx = (dx / maxD) * 70;
        const sy = (dy / maxD) * 70;
        const sz = (dz / maxD) * 70;

        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        function project(x, y, z) {
          const rx = x * cosY - z * sinY;
          const rz = x * sinY + z * cosY;
          const px = w / 2 + rx * 1.15;
          const py = h / 2 - y * 1.05 + rz * 0.35;
          return [px, py];
        }

        const corners = [
          [-sx, -sy, -sz], [sx, -sy, -sz], [sx, sy, -sz], [-sx, sy, -sz],
          [-sx, -sy, sz],  [sx, -sy, sz],  [sx, sy, sz],  [-sx, sy, sz],
        ].map((c) => project(c[0], c[1], c[2]));

        const edges = [
          [0,1],[1,2],[2,3],[3,0],
          [4,5],[5,6],[6,7],[7,4],
          [0,4],[1,5],[2,6],[3,7],
        ];

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < edges.length; i++) {
          const a = corners[edges[i][0]];
          const b = corners[edges[i][1]];
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
        }
        ctx.stroke();

        // Draw +Y up and +Z forward indicator at origin
        const o = project(0, 0, 0);
        const up = project(0, 48, 0);
        ctx.strokeStyle = '#4ade80';
        ctx.beginPath();
        ctx.moveTo(o[0], o[1]);
        ctx.lineTo(up[0], up[1]);
        ctx.stroke();
        ctx.fillStyle = '#4ade80';
        ctx.font = '11px monospace';
        ctx.fillText('+Y up', up[0] + 4, up[1]);
      }

      drawWireframeBounds();
      if (resetBtn) {
        resetBtn.addEventListener('click', function () {
          yaw += 0.45;
          drawWireframeBounds();
        });
      }

      if (fileInput) {
        fileInput.addEventListener('change', function (ev) {
          const file = ev.target && ev.target.files && ev.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = function () {
            try {
              const buf = reader.result;
              const view = new DataView(buf);
              if (buf.byteLength < 20) {
                resultBox.textContent = 'Invalid GLB: file is smaller than 20-byte header.';
                return;
              }
              const magic = view.getUint32(0, true);
              const version = view.getUint32(4, true);
              const declaredLen = view.getUint32(8, true);
              const jsonLen = view.getUint32(12, true);
              const jsonType = view.getUint32(16, true);
              if (magic !== 0x46546c67 || version !== 2 || jsonType !== 0x4e4f534a) {
                resultBox.textContent = 'Invalid GLB header or Chunk 0 type.';
                return;
              }
              const jsonBytes = new Uint8Array(buf, 20, jsonLen);
              const jsonStr = new TextDecoder('utf-8').decode(jsonBytes);
              const gltf = JSON.parse(jsonStr);
              const meshes = Array.isArray(gltf.meshes) ? gltf.meshes.length : 0;
              const mats = Array.isArray(gltf.materials) ? gltf.materials.length : 0;
              const anims = Array.isArray(gltf.animations) ? gltf.animations.length : 0;
              resultBox.textContent =
                'Client-side GLB check passed:\\n' +
                '- File: ' + file.name + ' (' + declaredLen + ' bytes)\\n' +
                '- Meshes: ' + meshes + ', Materials: ' + mats + ', Animations: ' + anims + '\\n' +
                '- Visual/runtime status: Not Verified (local container parse only)';
              if (boundsLabel) {
                boundsLabel.textContent = 'Inspected locally: ' + file.name + ' (' + declaredLen + ' bytes)';
              }
              yaw += 0.35;
              drawWireframeBounds();
            } catch (err) {
              resultBox.textContent = 'Client-side GLB parse error: ' + (err && err.message ? err.message : String(err));
            }
          };
          reader.readAsArrayBuffer(file);
        });
      }
    })();
  </script>
</body>
</html>
`;
}

function assembleHandoffReportBundleFromInspection(
  inspection,
  {
    filename = 'artifact.glb',
    targetViewerStack = 'threejs',
    sourceKind = 'unverified',
    isSyntheticFixture = false,
    currentRunProvenanceVerified = false,
    runtimePath = 'none',
    runtimeStatus = 'Not Run',
    artifactStatus = 'Not Produced',
    unitScaleMetersPerUnit = 1.0,
    forwardAxis = '+Z',
    originPolicy = 'unverified',
    performanceBudget = DEFAULT_WEB_PERFORMANCE_BUDGET,
  } = {},
) {
  const manifest = buildGlbWebHandoffManifestFromInspection(inspection, {
    filename,
    targetViewerStack,
    sourceKind,
    isSyntheticFixture,
    currentRunProvenanceVerified,
    runtimePath,
    runtimeStatus,
    artifactStatus,
    unitScaleMetersPerUnit,
    forwardAxis,
    originPolicy,
    performanceBudget,
  });

  const manifestValidation = validateGlbWebHandoffManifest(manifest);
  const snippets = buildWebIntegrationCodeSnippets(manifest);
  const markdownSummary = formatGlbHandoffMarkdownSummary(manifest);
  const htmlReport = renderGlbHandoffHtmlReport(manifest, snippets);

  const jsonReport = {
    schemaVersion: '1.0.0',
    reportKind: 'glb-web-handoff-report',
    valid: Boolean(inspection.valid && manifestValidation.valid),
    manifestValidation,
    manifest,
    inspection: {
      valid: inspection.valid,
      byteSize: inspection.byteSize,
      sha256: inspection.sha256,
      header: inspection.header,
      chunks: inspection.chunks,
      counts: inspection.counts,
      extensions: inspection.extensions,
      bounds: inspection.bounds,
      validationTiers: inspection.validationTiers,
      truthBoundary: inspection.truthBoundary,
      errors: inspection.errors,
      warnings: inspection.warnings,
    },
    integrationSnippets: snippets,
    markdownSummary,
  };

  return {
    ok: Boolean(inspection.valid && manifestValidation.valid),
    manifest,
    manifestValidation,
    inspection,
    snippets,
    markdownSummary,
    jsonReport,
    htmlReport,
  };
}

export function generateGlbHandoffReportFromBufferSync(
  buffer,
  {
    filename = 'artifact.glb',
    targetViewerStack = 'threejs',
    sourceKind = 'unverified',
    isSyntheticFixture = false,
    currentRunProvenanceVerified = false,
    runtimePath = 'none',
    runtimeStatus = 'Not Run',
    artifactStatus = 'Not Produced',
    unitScaleMetersPerUnit = 1.0,
    forwardAxis = '+Z',
    originPolicy = 'unverified',
    strictPositionBounds = false,
    performanceBudget = DEFAULT_WEB_PERFORMANCE_BUDGET,
  } = {},
) {
  const inspection = inspectGlbBuffer(buffer, { strictPositionBounds });
  return assembleHandoffReportBundleFromInspection(inspection, {
    filename,
    targetViewerStack,
    sourceKind,
    isSyntheticFixture,
    currentRunProvenanceVerified,
    runtimePath,
    runtimeStatus,
    artifactStatus,
    unitScaleMetersPerUnit,
    forwardAxis,
    originPolicy,
    performanceBudget,
  });
}

export async function generateGlbHandoffReportFromBuffer(
  buffer,
  {
    filename = 'artifact.glb',
    targetViewerStack = 'threejs',
    sourceKind = 'unverified',
    isSyntheticFixture = false,
    currentRunProvenanceVerified = false,
    runtimePath = 'none',
    runtimeStatus = 'Not Run',
    artifactStatus = 'Not Produced',
    unitScaleMetersPerUnit = 1.0,
    forwardAxis = '+Z',
    originPolicy = 'unverified',
    strictPositionBounds = false,
    runKhronos = false,
    validatorModuleLoader,
    performanceBudget = DEFAULT_WEB_PERFORMANCE_BUDGET,
  } = {},
) {
  const inspection = inspectGlbBuffer(buffer, { strictPositionBounds });
  if (runKhronos && Buffer.isBuffer(buffer) && inspection.valid) {
    const { runKhronosGltfValidator } = await import('./inspect-glb.mjs');
    const khronosRes = await runKhronosGltfValidator(buffer, { validatorModuleLoader });
    inspection.khronosValidator = khronosRes;
    if (khronosRes.status === 'passed') {
      inspection.validationTiers.gltfSpecification = {
        status: (khronosRes.issues?.numWarnings ?? 0) > 0 ? 'Warn' : 'Passed',
        tool: 'gltf-validator',
        summary: khronosRes.message,
      };
    } else if (khronosRes.status === 'unavailable') {
      inspection.validationTiers.gltfSpecification = {
        status: 'Unavailable',
        tool: 'gltf-validator',
        summary: khronosRes.message,
      };
    } else if (khronosRes.status === 'failed' || khronosRes.status === 'error') {
      inspection.valid = false;
      inspection.errors.push(khronosRes.message);
      inspection.validationTiers.gltfSpecification = {
        status: 'Failed',
        tool: 'gltf-validator',
        summary: khronosRes.message,
      };
    }
  }

  return assembleHandoffReportBundleFromInspection(inspection, {
    filename,
    targetViewerStack,
    sourceKind,
    isSyntheticFixture,
    currentRunProvenanceVerified,
    runtimePath,
    runtimeStatus,
    artifactStatus,
    unitScaleMetersPerUnit,
    forwardAxis,
    originPolicy,
    performanceBudget,
  });
}

function pathsEqualOnPlatform(pathA, pathB) {
  if (!pathA || !pathB) return false;
  const normA = path.resolve(pathA);
  const normB = path.resolve(pathB);
  if (process.platform === 'win32') {
    return normA.toLowerCase() === normB.toLowerCase();
  }
  return normA === normB;
}

export function validateSafeReportOutputDir(
  rawOutDir,
  { repoRoot = path.resolve(__dirname, '..'), inputGlbPath = null } = {},
) {
  if (typeof rawOutDir !== 'string' || rawOutDir.trim().length === 0 || rawOutDir.includes('\0')) {
    throw new Error('Invalid --out-dir path: must be a non-empty string');
  }
  const trimmed = rawOutDir.trim();
  if (trimmed === '~' || trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    throw new Error(`Unsafe --out-dir path (home directory '${trimmed}' is rejected)`);
  }
  if (/^[a-zA-Z]:[\\/]?$/.test(trimmed) || trimmed.startsWith('\\\\') || trimmed === '/' || trimmed === '\\') {
    throw new Error(
      `Unsafe --out-dir path (filesystem root, drive root, or UNC path is forbidden): ${rawOutDir}`,
    );
  }

  const absOut = path.resolve(trimmed.replace(/\\/g, path.sep));
  const parsedRoot = path.parse(absOut).root;
  if (pathsEqualOnPlatform(absOut, parsedRoot)) {
    throw new Error(`Unsafe --out-dir path (filesystem root is forbidden): ${rawOutDir}`);
  }

  const home = os.homedir ? path.resolve(os.homedir()) : '';
  const homeReal = home && fs.existsSync(home) ? fs.realpathSync(home) : home;
  if ((home && pathsEqualOnPlatform(absOut, home)) || (homeReal && pathsEqualOnPlatform(absOut, homeReal))) {
    throw new Error(`Unsafe --out-dir path (user home root is forbidden): ${rawOutDir}`);
  }

  const tmpRoot = path.resolve(os.tmpdir());
  const tmpReal = fs.existsSync(tmpRoot) ? fs.realpathSync(tmpRoot) : tmpRoot;
  if (pathsEqualOnPlatform(absOut, tmpRoot) || pathsEqualOnPlatform(absOut, tmpReal)) {
    throw new Error(`Unsafe --out-dir path (OS temp root itself is forbidden): ${rawOutDir}`);
  }

  // Check nearest existing directory and ancestors for symlinks/junctions
  let cursor = absOut;
  const tail = [];
  while (!fs.existsSync(cursor)) {
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    tail.unshift(path.basename(cursor));
    cursor = parent;
  }
  const existingLstat = fs.lstatSync(cursor);
  if (existingLstat.isSymbolicLink()) {
    throw new Error(`Refusing symbolic link in --out-dir path: ${cursor}`);
  }
  if (!existingLstat.isDirectory()) {
    throw new Error(`Target --out-dir path or ancestor is not a directory: ${cursor}`);
  }

  const realRepoRoot = fs.existsSync(repoRoot) ? fs.realpathSync(repoRoot) : path.resolve(repoRoot);
  let ancestorCheck = cursor;
  while (ancestorCheck && !pathsEqualOnPlatform(ancestorCheck, path.parse(ancestorCheck).root)) {
    if (
      pathsEqualOnPlatform(ancestorCheck, tmpRoot) ||
      pathsEqualOnPlatform(ancestorCheck, tmpReal) ||
      pathsEqualOnPlatform(ancestorCheck, realRepoRoot)
    ) {
      break;
    }
    const st = fs.lstatSync(ancestorCheck);
    if (st.isSymbolicLink()) {
      throw new Error(`Refusing symbolic link in --out-dir path: ${ancestorCheck}`);
    }
    const nextParent = path.dirname(ancestorCheck);
    if (nextParent === ancestorCheck) break;
    ancestorCheck = nextParent;
  }

  const realBase = fs.realpathSync(cursor);
  const resolvedOut = tail.length > 0 ? path.join(realBase, ...tail) : realBase;

  if (pathsEqualOnPlatform(resolvedOut, tmpRoot) || pathsEqualOnPlatform(resolvedOut, tmpReal)) {
    throw new Error(`Unsafe --out-dir path (OS temp root itself is forbidden): ${rawOutDir}`);
  }
  if (
    (home && pathsEqualOnPlatform(resolvedOut, home)) ||
    (homeReal && pathsEqualOnPlatform(resolvedOut, homeReal))
  ) {
    throw new Error(`Unsafe --out-dir path (user home root is forbidden): ${rawOutDir}`);
  }

  if (pathsEqualOnPlatform(resolvedOut, realRepoRoot) || pathsEqualOnPlatform(absOut, realRepoRoot)) {
    throw new Error(`Refusing to write handoff report files directly into repository root (${realRepoRoot})`);
  }

  const relFromRepo = path.relative(
    process.platform === 'win32' ? realRepoRoot.toLowerCase() : realRepoRoot,
    process.platform === 'win32' ? resolvedOut.toLowerCase() : resolvedOut,
  );
  const isInsideRepo = relFromRepo !== '' && !relFromRepo.startsWith('..') && !path.isAbsolute(relFromRepo);
  if (isInsideRepo) {
    const topSeg = relFromRepo.split(path.sep)[0];
    if (PROTECTED_REPO_DIRS.has(topSeg)) {
      throw new Error(
        `Unsafe --out-dir destination inside protected BlendOps repository directory '${topSeg}': ${rawOutDir}`,
      );
    }
    if (topSeg === 'dist' && relFromRepo.split(path.sep).length < 2) {
      throw new Error('Unsafe --out-dir destination: must be a subdirectory inside dist/, not dist/ itself');
    }
  }

  if (inputGlbPath) {
    const absGlb = path.resolve(inputGlbPath);
    const realGlb = fs.existsSync(absGlb) ? fs.realpathSync(absGlb) : absGlb;
    if (
      pathsEqualOnPlatform(absGlb, resolvedOut) ||
      pathsEqualOnPlatform(absGlb, absOut) ||
      pathsEqualOnPlatform(realGlb, resolvedOut)
    ) {
      throw new Error('Refusing --out-dir that collides with the input GLB file path');
    }
  }

  return resolvedOut;
}

function writeAtomicReportFile(targetAbsPath, content) {
  if (fs.existsSync(targetAbsPath)) {
    const lstat = fs.lstatSync(targetAbsPath);
    if (lstat.isSymbolicLink()) {
      throw new Error(`Refusing to overwrite symbolic link at ${targetAbsPath}`);
    }
  }
  const dir = path.dirname(targetAbsPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = path.join(
    dir,
    `.${path.basename(targetAbsPath)}.tmp-${process.pid}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`,
  );
  try {
    fs.writeFileSync(tmpPath, content, { encoding: 'utf8', flag: 'wx' });
    fs.renameSync(tmpPath, targetAbsPath);
  } finally {
    if (fs.existsSync(tmpPath)) {
      try {
        fs.rmSync(tmpPath, { force: true });
      } catch {
        // ignore cleanup error
      }
    }
  }
}

function persistHandoffBundleToOutDir(bundle, { outDir, repoRoot, resolvedGlb }) {
  if (outDir === null || outDir === undefined) return null;
  const safeOutDir = validateSafeReportOutputDir(outDir, {
    repoRoot,
    inputGlbPath: resolvedGlb,
  });
  fs.mkdirSync(safeOutDir, { recursive: true });

  const manifestPath = path.join(safeOutDir, 'handoff-manifest.json');
  const jsonReportPath = path.join(safeOutDir, 'handoff-report.json');
  const htmlReportPath = path.join(safeOutDir, 'handoff-report.html');
  const markdownPath = path.join(safeOutDir, 'HANDOFF_SUMMARY.md');

  for (const candidate of [manifestPath, jsonReportPath, htmlReportPath, markdownPath]) {
    if (path.resolve(candidate) === resolvedGlb) {
      throw new Error(`Refusing to overwrite input GLB file: ${resolvedGlb}`);
    }
  }

  writeAtomicReportFile(manifestPath, `${JSON.stringify(bundle.manifest, null, 2)}\n`);
  writeAtomicReportFile(jsonReportPath, `${JSON.stringify(bundle.jsonReport, null, 2)}\n`);
  writeAtomicReportFile(htmlReportPath, bundle.htmlReport);
  writeAtomicReportFile(markdownPath, bundle.markdownSummary);

  return {
    outDir: safeOutDir,
    manifestPath,
    jsonReportPath,
    htmlReportPath,
    markdownPath,
  };
}

export function generateGlbHandoffReportFromFileSync(
  glbFilePath,
  {
    outDir = null,
    targetViewerStack = 'threejs',
    sourceKind = 'user_supplied',
    isSyntheticFixture = false,
    currentRunProvenanceVerified = false,
    runtimePath = 'none',
    runtimeStatus = 'Not Run',
    artifactStatus = 'Not Produced',
    unitScaleMetersPerUnit = 1.0,
    forwardAxis = '+Z',
    originPolicy = 'unverified',
    strictPositionBounds = false,
    performanceBudget = DEFAULT_WEB_PERFORMANCE_BUDGET,
    repoRoot = path.resolve(__dirname, '..'),
  } = {},
) {
  if (typeof glbFilePath !== 'string' || glbFilePath.trim().length === 0) {
    throw new Error('GLB file path must be a non-empty string');
  }
  const resolvedGlb = path.resolve(glbFilePath);
  if (!fs.existsSync(resolvedGlb)) {
    throw new Error(`GLB file does not exist: ${glbFilePath}`);
  }
  const lstat = fs.lstatSync(resolvedGlb);
  if (lstat.isSymbolicLink()) {
    throw new Error(`Refusing symbolic link for GLB input file: ${glbFilePath}`);
  }
  if (!lstat.isFile()) {
    throw new Error(`GLB path is not a regular file: ${glbFilePath}`);
  }

  const originalBuffer = fs.readFileSync(resolvedGlb);
  const preSha256 = crypto.createHash('sha256').update(originalBuffer).digest('hex');

  const bundle = generateGlbHandoffReportFromBufferSync(originalBuffer, {
    filename: path.basename(resolvedGlb),
    targetViewerStack,
    sourceKind,
    isSyntheticFixture,
    currentRunProvenanceVerified,
    runtimePath,
    runtimeStatus,
    artifactStatus,
    unitScaleMetersPerUnit,
    forwardAxis,
    originPolicy,
    strictPositionBounds,
    performanceBudget,
  });

  const writtenFiles = persistHandoffBundleToOutDir(bundle, {
    outDir,
    repoRoot,
    resolvedGlb,
  });

  const postBuffer = fs.readFileSync(resolvedGlb);
  const postSha256 = crypto.createHash('sha256').update(postBuffer).digest('hex');
  if (preSha256 !== postSha256) {
    throw new Error('Invariant violation: input GLB file digest changed during inspection');
  }

  return {
    ...bundle,
    inputGlbPath: resolvedGlb,
    inputSha256: preSha256,
    writtenFiles,
  };
}

export async function generateGlbHandoffReportFromFile(
  glbFilePath,
  {
    outDir = null,
    targetViewerStack = 'threejs',
    sourceKind = 'user_supplied',
    isSyntheticFixture = false,
    currentRunProvenanceVerified = false,
    runtimePath = 'none',
    runtimeStatus = 'Not Run',
    artifactStatus = 'Not Produced',
    unitScaleMetersPerUnit = 1.0,
    forwardAxis = '+Z',
    originPolicy = 'unverified',
    strictPositionBounds = false,
    runKhronos = false,
    validatorModuleLoader,
    performanceBudget = DEFAULT_WEB_PERFORMANCE_BUDGET,
    repoRoot = path.resolve(__dirname, '..'),
  } = {},
) {
  if (typeof glbFilePath !== 'string' || glbFilePath.trim().length === 0) {
    throw new Error('GLB file path must be a non-empty string');
  }
  const resolvedGlb = path.resolve(glbFilePath);
  if (!fs.existsSync(resolvedGlb)) {
    throw new Error(`GLB file does not exist: ${glbFilePath}`);
  }
  const lstat = fs.lstatSync(resolvedGlb);
  if (lstat.isSymbolicLink()) {
    throw new Error(`Refusing symbolic link for GLB input file: ${glbFilePath}`);
  }
  if (!lstat.isFile()) {
    throw new Error(`GLB path is not a regular file: ${glbFilePath}`);
  }

  const originalBuffer = fs.readFileSync(resolvedGlb);
  const preSha256 = crypto.createHash('sha256').update(originalBuffer).digest('hex');

  const bundle = await generateGlbHandoffReportFromBuffer(originalBuffer, {
    filename: path.basename(resolvedGlb),
    targetViewerStack,
    sourceKind,
    isSyntheticFixture,
    currentRunProvenanceVerified,
    runtimePath,
    runtimeStatus,
    artifactStatus,
    unitScaleMetersPerUnit,
    forwardAxis,
    originPolicy,
    strictPositionBounds,
    runKhronos,
    validatorModuleLoader,
    performanceBudget,
  });

  const writtenFiles = persistHandoffBundleToOutDir(bundle, {
    outDir,
    repoRoot,
    resolvedGlb,
  });

  const postBuffer = fs.readFileSync(resolvedGlb);
  const postSha256 = crypto.createHash('sha256').update(postBuffer).digest('hex');
  if (preSha256 !== postSha256) {
    throw new Error('Invariant violation: input GLB file digest changed during inspection');
  }

  return {
    ...bundle,
    inputGlbPath: resolvedGlb,
    inputSha256: preSha256,
    writtenFiles,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let glbPath = null;
  let outDir = null;
  let validateManifestPath = null;
  let viewerStack = 'threejs';
  let jsonOutput = false;
  let selfTest = false;
  let strictBounds = false;
  let runKhronos = false;
  let syntheticFlag = false;

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') {
      jsonOutput = true;
    } else if (arg === '--self-test') {
      selfTest = true;
    } else if (arg === '--strict-bounds') {
      strictBounds = true;
    } else if (arg === '--khronos') {
      runKhronos = true;
    } else if (arg === '--synthetic') {
      syntheticFlag = true;
    } else if (arg === '--glb' && i + 1 < args.length) {
      glbPath = args[++i];
    } else if (arg === '--out-dir' && i + 1 < args.length) {
      outDir = args[++i];
    } else if (arg === '--validate-manifest' && i + 1 < args.length) {
      validateManifestPath = args[++i];
    } else if (arg === '--viewer' && i + 1 < args.length) {
      viewerStack = args[++i];
    } else if (!arg.startsWith('--') && !glbPath) {
      glbPath = arg;
    }
  }

  try {
    if (selfTest) {
      const buf = buildMinimalValidGlbBuffer();
      const res = await generateGlbHandoffReportFromBuffer(buf, {
        filename: 'synthetic-self-test.glb',
        targetViewerStack: viewerStack,
        sourceKind: 'synthetic_fixture',
        isSyntheticFixture: true,
        strictPositionBounds: true,
        runKhronos,
      });
      if (jsonOutput) {
        process.stdout.write(`${JSON.stringify(res.jsonReport, null, 2)}\n`);
      } else {
        process.stdout.write(res.markdownSummary);
      }
      process.exitCode = res.ok ? 0 : 1;
      return;
    }

    if (validateManifestPath) {
      const absManifest = path.resolve(validateManifestPath);
      if (!fs.existsSync(absManifest)) {
        process.stderr.write(`Handoff manifest file not found: ${validateManifestPath}\n`);
        process.exitCode = 1;
        return;
      }
      const parsed = JSON.parse(fs.readFileSync(absManifest, 'utf8'));
      const res = validateGlbWebHandoffManifest(parsed);
      if (jsonOutput) {
        process.stdout.write(`${JSON.stringify(res, null, 2)}\n`);
      } else if (res.valid) {
        process.stdout.write(
          `GLB web handoff manifest valid: ${parsed.manifestId} (runtime=${parsed.truthStates.runtimeStatus}, artifact=${parsed.truthStates.artifactStatus}, verdict=${parsed.validationSummary.overallVerdict})\n`,
        );
      } else {
        process.stderr.write(
          `GLB web handoff manifest validation failed:\n${res.errors.map((e) => `- ${e}`).join('\n')}\n`,
        );
      }
      process.exitCode = res.valid ? 0 : 1;
      return;
    }

    if (!glbPath) {
      process.stderr.write(
        'Usage: node scripts/generate-glb-handoff-report.mjs <file.glb> [--out-dir <dir>] [--viewer <threejs|react-three-fiber|model-viewer|babylonjs|generic-webgl>] [--json] [--strict-bounds] [--khronos] | --validate-manifest <manifest.json> | --self-test\n',
      );
      process.exitCode = 1;
      return;
    }

    const res = await generateGlbHandoffReportFromFile(glbPath, {
      outDir,
      targetViewerStack: viewerStack,
      sourceKind: syntheticFlag ? 'synthetic_fixture' : 'user_supplied',
      isSyntheticFixture: syntheticFlag,
      strictPositionBounds: strictBounds,
      runKhronos,
    });

    if (jsonOutput) {
      process.stdout.write(`${JSON.stringify(res.jsonReport, null, 2)}\n`);
    } else {
      process.stdout.write(res.markdownSummary);
    }
    process.exitCode = res.ok ? 0 : 1;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`GLB handoff report error: ${msg}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
