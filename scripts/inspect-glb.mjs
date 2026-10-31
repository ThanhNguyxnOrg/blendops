#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

export const GLB_MAGIC = 0x46546c67; // 'glTF' in ASCII little-endian
export const GLB_VERSION_2 = 2;
export const GLB_CHUNK_TYPE_JSON = 0x4e4f534a; // 'JSON' in ASCII little-endian
export const GLB_CHUNK_TYPE_BIN = 0x004e4942; // 'BIN\0' in ASCII little-endian

const COMPONENT_TYPE_BYTE_SIZES = Object.freeze({
  5120: 1, // BYTE
  5121: 1, // UNSIGNED_BYTE
  5122: 2, // SHORT
  5123: 2, // UNSIGNED_SHORT
  5125: 4, // UNSIGNED_INT
  5126: 4, // FLOAT
});

const ACCESSOR_TYPE_COMPONENT_COUNTS = Object.freeze({
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
});

export const CONTAINER_TRUTH_DISCLAIMER =
  'Container inspection verifies binary GLB 2.0 framing, JSON/BIN chunk alignment, buffer/accessor bounds, and structural metadata only. It does NOT prove visual framing, lighting quality, material appearance, or live Blender runtime execution.';

/**
 * Builds a deterministic, spec-compliant minimal GLB 2.0 buffer in memory
 * for unit testing and static container validation without claiming a live Blender export.
 */
export function buildMinimalValidGlbBuffer({
  includeBinChunk = true,
  includePositionBounds = true,
  generator = 'blendops-synthetic-glb-fixture',
  extras = { isSyntheticFixture: true },
} = {}) {
  // 3 vertices (1 triangle), 3 floats per vertex = 36 bytes, padded to 4-byte boundary (36 is already a multiple of 4)
  const vertexPositions = new Float32Array([
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
  ]);
  const binPayload = Buffer.from(vertexPositions.buffer);

  const gltfJson = {
    asset: {
      version: '2.0',
      generator,
    },
    extras,
    scene: 0,
    scenes: [{ name: 'SyntheticValidationScene', nodes: [0] }],
    nodes: [{ name: 'SyntheticTriangleNode', mesh: 0 }],
    meshes: [
      {
        name: 'SyntheticTriangleMesh',
        primitives: [
          {
            attributes: { POSITION: 0 },
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: 'SyntheticPBRMaterial',
        pbrMetallicRoughness: {
          baseColorFactor: [0.8, 0.8, 0.8, 1.0],
          metallicFactor: 0.0,
          roughnessFactor: 0.5,
        },
      },
    ],
  };

  if (includeBinChunk) {
    gltfJson.buffers = [{ byteLength: binPayload.byteLength }];
    gltfJson.bufferViews = [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: binPayload.byteLength,
        target: 34962, // ARRAY_BUFFER
      },
    ];
    const accessor = {
      bufferView: 0,
      byteOffset: 0,
      componentType: 5126, // FLOAT
      count: 3,
      type: 'VEC3',
    };
    if (includePositionBounds) {
      accessor.min = [0.0, 0.0, 0.0];
      accessor.max = [1.0, 1.0, 0.0];
    }
    gltfJson.accessors = [accessor];
  } else {
    gltfJson.meshes = [];
    gltfJson.nodes = [{ name: 'EmptyRootNode' }];
  }

  const rawJsonBytes = Buffer.from(JSON.stringify(gltfJson), 'utf8');
  const jsonPadLen = (4 - (rawJsonBytes.length % 4)) % 4;
  const jsonChunkData = Buffer.concat([rawJsonBytes, Buffer.alloc(jsonPadLen, 0x20)]); // pad with ASCII space 0x20

  let binChunkFull = Buffer.alloc(0);
  if (includeBinChunk) {
    const binPadLen = (4 - (binPayload.length % 4)) % 4;
    const binChunkData = Buffer.concat([binPayload, Buffer.alloc(binPadLen, 0x00)]);
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binChunkData.length, 0);
    binHeader.writeUInt32LE(GLB_CHUNK_TYPE_BIN, 4);
    binChunkFull = Buffer.concat([binHeader, binChunkData]);
  }

  const totalLength = 12 + 8 + jsonChunkData.length + binChunkFull.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(GLB_MAGIC, 0);
  header.writeUInt32LE(GLB_VERSION_2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunkData.length, 0);
  jsonHeader.writeUInt32LE(GLB_CHUNK_TYPE_JSON, 4);

  return Buffer.concat([header, jsonHeader, jsonChunkData, binChunkFull]);
}

function validateBuffersAndAccessors(gltf, hasBinChunk, binChunkLength, errors, warnings) {
  const buffers = Array.isArray(gltf.buffers) ? gltf.buffers : [];
  const bufferViews = Array.isArray(gltf.bufferViews) ? gltf.bufferViews : [];
  const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
  const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];

  for (let i = 0; i < buffers.length; i += 1) {
    const buf = buffers[i];
    if (!buf || typeof buf !== 'object') {
      errors.push(`buffers[${i}] must be an object`);
      continue;
    }
    if (!Number.isInteger(buf.byteLength) || buf.byteLength < 1) {
      errors.push(`buffers[${i}].byteLength must be a positive integer (received ${JSON.stringify(buf.byteLength)})`);
      continue;
    }
    if (i === 0 && buf.uri === undefined) {
      if (!hasBinChunk) {
        errors.push(`buffers[0] declares an embedded GLB buffer (${buf.byteLength} bytes) but Chunk 1 (BIN) is missing`);
      } else if (binChunkLength < buf.byteLength) {
        errors.push(
          `buffers[0].byteLength (${buf.byteLength}) exceeds Chunk 1 (BIN) byteLength (${binChunkLength})`,
        );
      }
    }
  }

  for (let i = 0; i < bufferViews.length; i += 1) {
    const bv = bufferViews[i];
    if (!bv || typeof bv !== 'object') {
      errors.push(`bufferViews[${i}] must be an object`);
      continue;
    }
    const bufIdx = bv.buffer;
    const byteOffset = bv.byteOffset ?? 0;
    const byteLength = bv.byteLength;

    if (!Number.isInteger(bufIdx) || bufIdx < 0 || bufIdx >= buffers.length) {
      errors.push(`bufferViews[${i}].buffer (${JSON.stringify(bufIdx)}) does not reference a valid buffer index`);
      continue;
    }
    if (!Number.isInteger(byteOffset) || byteOffset < 0) {
      errors.push(`bufferViews[${i}].byteOffset must be a non-negative integer`);
      continue;
    }
    if (!Number.isInteger(byteLength) || byteLength < 1) {
      errors.push(`bufferViews[${i}].byteLength must be a positive integer`);
      continue;
    }
    const targetBuf = buffers[bufIdx];
    if (targetBuf && Number.isInteger(targetBuf.byteLength) && byteOffset + byteLength > targetBuf.byteLength) {
      errors.push(
        `bufferViews[${i}] span (byteOffset ${byteOffset} + byteLength ${byteLength} = ${byteOffset + byteLength}) exceeds buffers[${bufIdx}].byteLength (${targetBuf.byteLength})`,
      );
    }
  }

  for (let i = 0; i < accessors.length; i += 1) {
    const acc = accessors[i];
    if (!acc || typeof acc !== 'object') {
      errors.push(`accessors[${i}] must be an object`);
      continue;
    }
    const compBytes = COMPONENT_TYPE_BYTE_SIZES[acc.componentType];
    const compCount = ACCESSOR_TYPE_COMPONENT_COUNTS[acc.type];
    if (!compBytes) {
      errors.push(`accessors[${i}].componentType (${JSON.stringify(acc.componentType)}) is not a valid glTF 2.0 componentType`);
    }
    if (!compCount) {
      errors.push(`accessors[${i}].type (${JSON.stringify(acc.type)}) is not a valid glTF 2.0 accessor type`);
    }
    if (!Number.isInteger(acc.count) || acc.count < 1) {
      errors.push(`accessors[${i}].count (${JSON.stringify(acc.count)}) must be an integer >= 1`);
    }

    if (acc.bufferView !== undefined) {
      if (!Number.isInteger(acc.bufferView) || acc.bufferView < 0 || acc.bufferView >= bufferViews.length) {
        errors.push(`accessors[${i}].bufferView (${JSON.stringify(acc.bufferView)}) does not reference a valid bufferView`);
      } else if (compBytes && compCount && Number.isInteger(acc.count) && acc.count >= 1) {
        const bv = bufferViews[acc.bufferView];
        const accOffset = acc.byteOffset ?? 0;
        if (!Number.isInteger(accOffset) || accOffset < 0) {
          errors.push(`accessors[${i}].byteOffset must be a non-negative integer`);
        } else if (bv && Number.isInteger(bv.byteLength)) {
          const elementSize = compBytes * compCount;
          const stride = bv.byteStride ?? elementSize;
          const requiredBytes = accOffset + (acc.count - 1) * stride + elementSize;
          if (requiredBytes > bv.byteLength) {
            errors.push(
              `accessors[${i}] byte span (${requiredBytes} bytes) exceeds bufferViews[${acc.bufferView}].byteLength (${bv.byteLength})`,
            );
          }
        }
      }
    }
  }

  // Inspect POSITION accessors referenced by mesh primitives for bounding-box completeness
  const positionAccessorIndices = new Set();
  for (let mIdx = 0; mIdx < meshes.length; mIdx += 1) {
    const mesh = meshes[mIdx];
    const prims = Array.isArray(mesh?.primitives) ? mesh.primitives : [];
    for (let pIdx = 0; pIdx < prims.length; pIdx += 1) {
      const posIdx = prims[pIdx]?.attributes?.POSITION;
      if (Number.isInteger(posIdx)) {
        positionAccessorIndices.add(posIdx);
        if (posIdx < 0 || posIdx >= accessors.length) {
          errors.push(`meshes[${mIdx}].primitives[${pIdx}].attributes.POSITION (${posIdx}) is out of range`);
        }
      }
    }
  }

  let missingPositionBoundsCount = 0;
  const globalMin = [Infinity, Infinity, Infinity];
  const globalMax = [-Infinity, -Infinity, -Infinity];
  let hasValidBounds = false;

  for (const posIdx of positionAccessorIndices) {
    const acc = accessors[posIdx];
    if (!acc || typeof acc !== 'object') continue;
    const validMin =
      Array.isArray(acc.min) &&
      acc.min.length === 3 &&
      acc.min.every((v) => typeof v === 'number' && Number.isFinite(v));
    const validMax =
      Array.isArray(acc.max) &&
      acc.max.length === 3 &&
      acc.max.every((v) => typeof v === 'number' && Number.isFinite(v));

    if (!validMin || !validMax) {
      missingPositionBoundsCount += 1;
      warnings.push(
        `accessors[${posIdx}] (POSITION) is missing required 3-element numeric min/max bounding box arrays`,
      );
    } else {
      for (let axis = 0; axis < 3; axis += 1) {
        if (acc.min[axis] > acc.max[axis]) {
          errors.push(
            `accessors[${posIdx}] (POSITION) has inverted bounds on axis ${axis}: min (${acc.min[axis]}) > max (${acc.max[axis]})`,
          );
        }
        globalMin[axis] = Math.min(globalMin[axis], acc.min[axis]);
        globalMax[axis] = Math.max(globalMax[axis], acc.max[axis]);
      }
      hasValidBounds = true;
    }
  }

  return {
    positionAccessorCount: positionAccessorIndices.size,
    missingPositionBoundsCount,
    sceneBoundingBox: hasValidBounds
      ? {
          min: globalMin,
          max: globalMax,
          dimensions: [
            Number((globalMax[0] - globalMin[0]).toFixed(6)),
            Number((globalMax[1] - globalMin[1]).toFixed(6)),
            Number((globalMax[2] - globalMin[2]).toFixed(6)),
          ],
        }
      : { min: null, max: null, dimensions: null },
  };
}

export async function runKhronosGltfValidator(buffer, { validatorModuleLoader } = {}) {
  try {
    const loader =
      validatorModuleLoader ||
      (async () => {
        return import('gltf-validator');
      });
    const mod = await loader();
    const validateBytes = mod?.validateBytes || mod?.default?.validateBytes;
    if (typeof validateBytes !== 'function') {
      return {
        requested: true,
        status: 'error',
        tool: 'gltf-validator',
        message: 'Loaded gltf-validator module does not export validateBytes(Uint8Array)',
        issues: null,
      };
    }
    const report = await validateBytes(new Uint8Array(buffer));
    const numErrors = report?.issues?.numErrors ?? 0;
    const numWarnings = report?.issues?.numWarnings ?? 0;
    return {
      requested: true,
      status: numErrors === 0 ? 'passed' : 'failed',
      tool: 'gltf-validator',
      toolVersion: report?.validatorVersion || null,
      message:
        numErrors === 0
          ? `Khronos gltf-validator passed (0 errors, ${numWarnings} warnings)`
          : `Khronos gltf-validator reported ${numErrors} error(s) and ${numWarnings} warning(s)`,
      issues: {
        numErrors,
        numWarnings,
        numInfos: report?.issues?.numInfos ?? 0,
        numHints: report?.issues?.numHints ?? 0,
        messages: Array.isArray(report?.issues?.messages) ? report.issues.messages : [],
      },
    };
  } catch (err) {
    const code = err?.code || '';
    const msg = err?.message || String(err);
    if (code === 'ERR_MODULE_NOT_FOUND' || code === 'MODULE_NOT_FOUND' || /Cannot find package 'gltf-validator'/i.test(msg)) {
      return {
        requested: true,
        status: 'unavailable',
        tool: 'gltf-validator',
        message:
          'Optional Khronos gltf-validator package is not installed in this environment; container-level GLB 2.0 inspection completed via built-in Node parser.',
        issues: null,
      };
    }
    return {
      requested: true,
      status: 'error',
      tool: 'gltf-validator',
      message: `Khronos gltf-validator execution failed: ${msg}`,
      issues: null,
    };
  }
}

export function inspectGlbBuffer(buffer, { strictPositionBounds = false } = {}) {
  const errors = [];
  const warnings = [];

  if (!Buffer.isBuffer(buffer)) {
    return {
      valid: false,
      errors: ['Input must be a Node.js Buffer'],
      warnings: [],
      byteSize: 0,
      sha256: null,
      header: null,
      chunks: null,
      counts: null,
      extensions: null,
      bounds: null,
      truthBoundary: {
        verificationScope: 'container-structure-only',
        provesContainerIntegrity: false,
        provesVisualCorrectness: false,
        provesBlenderRuntimeExecution: false,
        disclaimer: CONTAINER_TRUTH_DISCLAIMER,
      },
    };
  }

  const byteSize = buffer.byteLength;
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  if (byteSize === 0) {
    errors.push('GLB buffer is empty (0 bytes)');
  } else if (byteSize < 20) {
    errors.push(`GLB buffer is truncated (${byteSize} bytes; minimum GLB 2.0 header + JSON chunk header is 20 bytes)`);
  }

  let magic = null;
  let version = null;
  let declaredByteLength = null;

  if (byteSize >= 12) {
    magic = buffer.readUInt32LE(0);
    version = buffer.readUInt32LE(4);
    declaredByteLength = buffer.readUInt32LE(8);

    if (magic !== GLB_MAGIC) {
      errors.push(
        `Invalid GLB magic header: expected 0x46546c67 ('glTF'), received 0x${magic.toString(16).padStart(8, '0')}`,
      );
    }
    if (version !== GLB_VERSION_2) {
      errors.push(`Unsupported GLB container version: expected 2, received ${version}`);
    }
    if (declaredByteLength !== byteSize) {
      errors.push(
        `GLB header declared length (${declaredByteLength} bytes) does not match actual file size (${byteSize} bytes)`,
      );
    }
  }

  let jsonChunkLength = null;
  let jsonChunkType = null;
  let hasBinChunk = false;
  let binChunkLength = 0;
  let gltf = null;

  if (byteSize >= 20 && errors.length === 0) {
    jsonChunkLength = buffer.readUInt32LE(12);
    jsonChunkType = buffer.readUInt32LE(16);

    if (jsonChunkType !== GLB_CHUNK_TYPE_JSON) {
      errors.push(
        `Chunk 0 must have type JSON (0x4e4f534a), received 0x${jsonChunkType.toString(16).padStart(8, '0')}`,
      );
    }
    if (jsonChunkLength === 0) {
      errors.push('Chunk 0 (JSON) has 0 byte length');
    } else if (jsonChunkLength % 4 !== 0) {
      errors.push(`Chunk 0 (JSON) length (${jsonChunkLength}) violates 4-byte alignment requirement`);
    }

    const jsonEnd = 20 + jsonChunkLength;
    if (jsonEnd > byteSize) {
      errors.push(
        `Chunk 0 (JSON) extends past end of file (offset 20 + length ${jsonChunkLength} = ${jsonEnd} > ${byteSize})`,
      );
    } else if (jsonChunkLength > 0 && jsonChunkType === GLB_CHUNK_TYPE_JSON) {
      const jsonBytes = buffer.subarray(20, jsonEnd);

      // Verify trailing padding bytes after the closing '}' are spaces (0x20), not null bytes or garbage
      let lastBraceIdx = jsonBytes.length - 1;
      while (lastBraceIdx >= 0 && jsonBytes[lastBraceIdx] === 0x20) {
        lastBraceIdx -= 1;
      }
      if (jsonBytes.includes(0x00)) {
        errors.push('Chunk 0 (JSON) contains forbidden NUL (0x00) padding bytes; glTF 2.0 requires ASCII space (0x20) padding');
      }

      const jsonText = jsonBytes.toString('utf8');
      try {
        const parsed = JSON.parse(jsonText);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          errors.push('Chunk 0 (JSON) root must be a JSON object');
        } else {
          gltf = parsed;
        }
      } catch (err) {
        errors.push(`Chunk 0 (JSON) contains malformed JSON: ${err.message}`);
      }
    }

    // Inspect optional Chunk 1 (BIN)
    if (jsonEnd < byteSize) {
      const remaining = byteSize - jsonEnd;
      if (remaining < 8) {
        errors.push(`Truncated Chunk 1 header at offset ${jsonEnd} (${remaining} bytes remaining, need at least 8)`);
      } else {
        hasBinChunk = true;
        binChunkLength = buffer.readUInt32LE(jsonEnd);
        const binChunkType = buffer.readUInt32LE(jsonEnd + 4);
        if (binChunkType !== GLB_CHUNK_TYPE_BIN) {
          errors.push(
            `Chunk 1 must have type BIN\\0 (0x004e4942), received 0x${binChunkType.toString(16).padStart(8, '0')}`,
          );
        }
        if (binChunkLength % 4 !== 0) {
          errors.push(`Chunk 1 (BIN) length (${binChunkLength}) violates 4-byte alignment requirement`);
        }
        const binEnd = jsonEnd + 8 + binChunkLength;
        if (binEnd > byteSize) {
          errors.push(
            `Chunk 1 (BIN) extends past end of file (offset ${jsonEnd + 8} + length ${binChunkLength} = ${binEnd} > ${byteSize})`,
          );
        } else if (binEnd < byteSize) {
          errors.push(
            `Unexpected trailing bytes after Chunk 1 (BIN): expected EOF at ${binEnd}, found ${byteSize - binEnd} extra byte(s)`,
          );
        }
      }
    }
  }

  let counts = null;
  let extensions = null;
  let bounds = null;

  if (gltf) {
    const assetVersion = gltf.asset?.version;
    if (typeof assetVersion !== 'string' || !/^2\.0$/.test(assetVersion)) {
      errors.push(
        `glTF asset.version must be "2.0" (received ${JSON.stringify(assetVersion)})`,
      );
    }

    const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
    const primitiveCount = meshes.reduce(
      (sum, m) => sum + (Array.isArray(m?.primitives) ? m.primitives.length : 0),
      0,
    );

    counts = {
      scenes: Array.isArray(gltf.scenes) ? gltf.scenes.length : 0,
      nodes: Array.isArray(gltf.nodes) ? gltf.nodes.length : 0,
      meshes: meshes.length,
      primitives: primitiveCount,
      materials: Array.isArray(gltf.materials) ? gltf.materials.length : 0,
      textures: Array.isArray(gltf.textures) ? gltf.textures.length : 0,
      images: Array.isArray(gltf.images) ? gltf.images.length : 0,
      samplers: Array.isArray(gltf.samplers) ? gltf.samplers.length : 0,
      animations: Array.isArray(gltf.animations) ? gltf.animations.length : 0,
      skins: Array.isArray(gltf.skins) ? gltf.skins.length : 0,
      accessors: Array.isArray(gltf.accessors) ? gltf.accessors.length : 0,
      bufferViews: Array.isArray(gltf.bufferViews) ? gltf.bufferViews.length : 0,
      buffers: Array.isArray(gltf.buffers) ? gltf.buffers.length : 0,
    };

    extensions = {
      extensionsUsed: Array.isArray(gltf.extensionsUsed) ? [...gltf.extensionsUsed] : [],
      extensionsRequired: Array.isArray(gltf.extensionsRequired) ? [...gltf.extensionsRequired] : [],
    };

    for (const reqExt of extensions.extensionsRequired) {
      if (!extensions.extensionsUsed.includes(reqExt)) {
        errors.push(`extensionsRequired entry '${reqExt}' is missing from extensionsUsed`);
      }
    }

    bounds = validateBuffersAndAccessors(gltf, hasBinChunk, binChunkLength, errors, warnings);
    if (strictPositionBounds && bounds.missingPositionBoundsCount > 0) {
      errors.push(
        `${bounds.missingPositionBoundsCount} POSITION accessor(s) omit required min/max bounds under strictPositionBounds`,
      );
    }
  }

  const valid = errors.length === 0;

  return {
    valid,
    errors,
    warnings,
    byteSize,
    sha256,
    header:
      magic !== null
        ? {
            magic: magic === GLB_MAGIC ? 'glTF' : 'INVALID',
            magicHex: `0x${magic.toString(16).padStart(8, '0')}`,
            version,
            declaredByteLength,
          }
        : null,
    chunks:
      jsonChunkLength !== null
        ? {
            jsonChunkLength,
            hasBinChunk,
            binChunkLength,
          }
        : null,
    asset: gltf?.asset || null,
    counts,
    extensions,
    bounds,
    khronosValidator: {
      requested: false,
      status: 'not_run',
      tool: 'gltf-validator',
      message: 'Khronos gltf-validator not requested (pass --khronos to attempt validation)',
      issues: null,
    },
    truthBoundary: {
      verificationScope: 'container-structure-only',
      provesContainerIntegrity: valid,
      provesVisualCorrectness: false,
      provesBlenderRuntimeExecution: false,
      disclaimer: CONTAINER_TRUTH_DISCLAIMER,
    },
  };
}

export async function inspectGlbFile(
  filePath,
  { runKhronos = false, strictPositionBounds = false, validatorModuleLoader } = {},
) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    return {
      valid: false,
      filePath: resolved,
      errors: [`GLB file does not exist: ${filePath}`],
      warnings: [],
      byteSize: 0,
      sha256: null,
      header: null,
      chunks: null,
      counts: null,
      extensions: null,
      bounds: null,
      khronosValidator: {
        requested: Boolean(runKhronos),
        status: 'not_run',
        tool: 'gltf-validator',
        message: 'Skipped because file does not exist',
        issues: null,
      },
      truthBoundary: {
        verificationScope: 'container-structure-only',
        provesContainerIntegrity: false,
        provesVisualCorrectness: false,
        provesBlenderRuntimeExecution: false,
        disclaimer: CONTAINER_TRUTH_DISCLAIMER,
      },
    };
  }

  const stat = fs.statSync(resolved);
  if (!stat.isFile()) {
    return {
      valid: false,
      filePath: resolved,
      errors: [`Path is not a regular file: ${filePath}`],
      warnings: [],
      byteSize: 0,
      sha256: null,
      header: null,
      chunks: null,
      counts: null,
      extensions: null,
      bounds: null,
      khronosValidator: {
        requested: Boolean(runKhronos),
        status: 'not_run',
        tool: 'gltf-validator',
        message: 'Skipped because path is not a regular file',
        issues: null,
      },
      truthBoundary: {
        verificationScope: 'container-structure-only',
        provesContainerIntegrity: false,
        provesVisualCorrectness: false,
        provesBlenderRuntimeExecution: false,
        disclaimer: CONTAINER_TRUTH_DISCLAIMER,
      },
    };
  }

  const buffer = fs.readFileSync(resolved);
  const result = inspectGlbBuffer(buffer, { strictPositionBounds });
  result.filePath = resolved;

  if (runKhronos) {
    const khronosRes = await runKhronosGltfValidator(buffer, { validatorModuleLoader });
    result.khronosValidator = khronosRes;
    if (khronosRes.status === 'failed' || khronosRes.status === 'error') {
      result.valid = false;
      result.truthBoundary.provesContainerIntegrity = false;
      result.errors.push(khronosRes.message);
    }
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const runKhronos = args.includes('--khronos');
  const strictPositionBounds = args.includes('--strict-bounds');
  const selfTest = args.includes('--self-test');
  const positional = args.filter((a) => !a.startsWith('--'));

  if (selfTest) {
    const buf = buildMinimalValidGlbBuffer();
    const res = inspectGlbBuffer(buf, { strictPositionBounds: true });
    if (runKhronos) {
      res.khronosValidator = await runKhronosGltfValidator(buf);
    }
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.valid ? 0 : 1);
  }

  if (positional.length === 0) {
    console.error(
      'Usage: node scripts/inspect-glb.mjs <path-to-file.glb> [--khronos] [--strict-bounds] | --self-test',
    );
    process.exit(1);
  }

  const targetFile = positional[0];
  const report = await inspectGlbFile(targetFile, { runKhronos, strictPositionBounds });
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.valid ? 0 : 1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
