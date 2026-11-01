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

const VALID_ALPHA_MODES = new Set(['OPAQUE', 'MASK', 'BLEND']);
const VALID_ANIMATION_PATHS = new Set(['translation', 'rotation', 'scale', 'weights']);
const VALID_INTERPOLATIONS = new Set(['LINEAR', 'STEP', 'CUBICSPLINE']);

export const CONTAINER_TRUTH_DISCLAIMER =
  'Container inspection verifies binary GLB 2.0 framing, JSON/BIN chunk alignment, buffer/accessor bounds, and structural metadata only. It does NOT replace full Khronos glTF 2.0 specification validation (gltf-validator), and it does NOT prove visual framing, lighting quality, material appearance, or live Blender runtime execution.';

/**
 * Builds a deterministic, spec-compliant minimal GLB 2.0 buffer in memory
 * for unit testing and static container validation without claiming a live Blender export.
 */
export function buildMinimalValidGlbBuffer({
  includeBinChunk = true,
  includePositionBounds = true,
  generator = 'blendops-synthetic-glb-fixture',
  extras = { isSyntheticFixture: true },
  customGltfPatch = null,
  extraBinBytes = null,
} = {}) {
  // 3 vertices (1 triangle), 3 floats per vertex = 36 bytes, padded to 4-byte boundary (36 is already a multiple of 4)
  const vertexPositions = new Float32Array([
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
  ]);
  const baseBinPayload = Buffer.from(vertexPositions.buffer);
  const binPayload = extraBinBytes
    ? Buffer.concat([baseBinPayload, Buffer.from(extraBinBytes)])
    : baseBinPayload;

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
        byteLength: baseBinPayload.byteLength,
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

  if (typeof customGltfPatch === 'function') {
    customGltfPatch(gltfJson, { baseBinByteLength: baseBinPayload.byteLength, totalBinByteLength: binPayload.byteLength });
  } else if (customGltfPatch && typeof customGltfPatch === 'object') {
    Object.assign(gltfJson, customGltfPatch);
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

function collectUsedExtensionsInObject(node, foundSet = new Set()) {
  if (!node || typeof node !== 'object') return foundSet;
  if (Array.isArray(node)) {
    for (const item of node) {
      collectUsedExtensionsInObject(item, foundSet);
    }
    return foundSet;
  }
  if (node.extensions && typeof node.extensions === 'object' && !Array.isArray(node.extensions)) {
    for (const extName of Object.keys(node.extensions)) {
      if (typeof extName === 'string' && extName.length > 0) {
        foundSet.add(extName);
      }
    }
  }
  for (const val of Object.values(node)) {
    if (val && typeof val === 'object') {
      collectUsedExtensionsInObject(val, foundSet);
    }
  }
  return foundSet;
}

function isExternalUri(uri) {
  if (typeof uri !== 'string' || uri.trim().length === 0) return false;
  return !uri.trim().toLowerCase().startsWith('data:');
}

function hasUnsafeUriTraversal(uri) {
  if (typeof uri !== 'string') return false;
  if (uri.startsWith('data:')) return false;
  const normalized = uri.replace(/\\/g, '/');
  if (normalized.startsWith('/') || /^[a-zA-Z]:\//.test(normalized)) return true;
  const parts = normalized.split('/');
  return parts.includes('..');
}

function validateBuffersAndAccessors(gltf, hasBinChunk, binChunkLength, errors, warnings) {
  const buffers = Array.isArray(gltf.buffers) ? gltf.buffers : [];
  const bufferViews = Array.isArray(gltf.bufferViews) ? gltf.bufferViews : [];
  const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
  const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
  const externalResources = [];

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
    if (buf.uri !== undefined) {
      if (typeof buf.uri !== 'string' || buf.uri.trim().length === 0) {
        errors.push(`buffers[${i}].uri must be a non-empty string when present`);
      } else {
        const externalFile = isExternalUri(buf.uri);
        externalResources.push({
          kind: 'buffer',
          index: i,
          uri: buf.uri,
          isExternalFile: externalFile,
        });
        if (externalFile) {
          warnings.push(
            `buffers[${i}] references an external URI ('${buf.uri}'); self-contained GLB 2.0 web delivery should embed binary data in Chunk 1 (BIN)`,
          );
          if (hasUnsafeUriTraversal(buf.uri)) {
            errors.push(`buffers[${i}].uri ('${buf.uri}') contains unsafe path traversal or absolute path`);
          }
        }
      }
    } else if (i === 0) {
      if (!hasBinChunk) {
        errors.push(`buffers[0] declares an embedded GLB buffer (${buf.byteLength} bytes) but Chunk 1 (BIN) is missing`);
      } else if (binChunkLength < buf.byteLength) {
        errors.push(
          `buffers[0].byteLength (${buf.byteLength}) exceeds Chunk 1 (BIN) byteLength (${binChunkLength})`,
        );
      }
    } else {
      errors.push(
        `buffers[${i}] omits 'uri'; in GLB 2.0 only buffers[0] may omit 'uri' to reference the embedded BIN chunk`,
      );
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
    const byteStride = bv.byteStride;

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
    if (byteStride !== undefined) {
      if (!Number.isInteger(byteStride) || byteStride < 4 || byteStride > 252 || byteStride % 4 !== 0) {
        errors.push(
          `bufferViews[${i}].byteStride (${JSON.stringify(byteStride)}) must be a multiple of 4 in the range [4, 252]`,
        );
      }
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
          if (bv.byteStride !== undefined && bv.byteStride < elementSize) {
            errors.push(
              `accessors[${i}] element size (${elementSize} bytes) exceeds bufferViews[${acc.bufferView}].byteStride (${bv.byteStride})`,
            );
          }
          const requiredBytes = accOffset + (acc.count - 1) * stride + elementSize;
          if (requiredBytes > bv.byteLength) {
            errors.push(
              `accessors[${i}] byte span (${requiredBytes} bytes) exceeds bufferViews[${acc.bufferView}].byteLength (${bv.byteLength})`,
            );
          }
        }
      }
    }

    if (acc.sparse && typeof acc.sparse === 'object') {
      const sCount = acc.sparse.count;
      if (!Number.isInteger(sCount) || sCount < 1 || (Number.isInteger(acc.count) && sCount > acc.count)) {
        errors.push(`accessors[${i}].sparse.count (${JSON.stringify(sCount)}) must be in [1, accessors[${i}].count]`);
      }
      const idxBv = acc.sparse.indices?.bufferView;
      if (!Number.isInteger(idxBv) || idxBv < 0 || idxBv >= bufferViews.length) {
        errors.push(`accessors[${i}].sparse.indices.bufferView (${JSON.stringify(idxBv)}) is out of range`);
      }
      const valBv = acc.sparse.values?.bufferView;
      if (!Number.isInteger(valBv) || valBv < 0 || valBv >= bufferViews.length) {
        errors.push(`accessors[${i}].sparse.values.bufferView (${JSON.stringify(valBv)}) is out of range`);
      }
    }
  }

  // Inspect POSITION accessors referenced by mesh primitives for bounding-box completeness
  const positionAccessorIndices = new Set();
  for (let mIdx = 0; mIdx < meshes.length; mIdx += 1) {
    const mesh = meshes[mIdx];
    const prims = Array.isArray(mesh?.primitives) ? mesh.primitives : [];
    for (let pIdx = 0; pIdx < prims.length; pIdx += 1) {
      const prim = prims[pIdx];
      const posIdx = prim?.attributes?.POSITION;
      if (Number.isInteger(posIdx)) {
        positionAccessorIndices.add(posIdx);
        if (posIdx < 0 || posIdx >= accessors.length) {
          errors.push(`meshes[${mIdx}].primitives[${pIdx}].attributes.POSITION (${posIdx}) is out of range`);
        }
      }
      if (prim?.attributes && typeof prim.attributes === 'object') {
        for (const [attrName, attrIdx] of Object.entries(prim.attributes)) {
          if (!Number.isInteger(attrIdx) || attrIdx < 0 || attrIdx >= accessors.length) {
            if (attrName !== 'POSITION') {
              errors.push(`meshes[${mIdx}].primitives[${pIdx}].attributes.${attrName} (${JSON.stringify(attrIdx)}) is out of range`);
            }
          }
        }
      }
      if (prim?.indices !== undefined) {
        if (!Number.isInteger(prim.indices) || prim.indices < 0 || prim.indices >= accessors.length) {
          errors.push(`meshes[${mIdx}].primitives[${pIdx}].indices (${JSON.stringify(prim.indices)}) is out of range`);
        } else {
          const idxAcc = accessors[prim.indices];
          if (idxAcc && idxAcc.type !== 'SCALAR') {
            errors.push(`meshes[${mIdx}].primitives[${pIdx}].indices accessor must have type 'SCALAR' (received '${idxAcc.type}')`);
          }
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

  const dimensions = hasValidBounds
    ? [
        Number((globalMax[0] - globalMin[0]).toFixed(6)),
        Number((globalMax[1] - globalMin[1]).toFixed(6)),
        Number((globalMax[2] - globalMin[2]).toFixed(6)),
      ]
    : null;
  const center = hasValidBounds
    ? [
        Number(((globalMin[0] + globalMax[0]) / 2).toFixed(6)),
        Number(((globalMin[1] + globalMax[1]) / 2).toFixed(6)),
        Number(((globalMin[2] + globalMax[2]) / 2).toFixed(6)),
      ]
    : null;

  return {
    bounds: {
      positionAccessorCount: positionAccessorIndices.size,
      missingPositionBoundsCount,
      sceneBoundingBox: hasValidBounds
        ? {
            min: globalMin,
            max: globalMax,
            dimensions,
            center,
          }
        : { min: null, max: null, dimensions: null, center: null },
    },
    externalBufferResources: externalResources,
  };
}

function validateAndSummarizeSceneGraph(gltf, errors, warnings) {
  const scenes = Array.isArray(gltf.scenes) ? gltf.scenes : [];
  const nodes = Array.isArray(gltf.nodes) ? gltf.nodes : [];
  const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
  const skins = Array.isArray(gltf.skins) ? gltf.skins : [];
  const cameras = Array.isArray(gltf.cameras) ? gltf.cameras : [];
  const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
  const materials = Array.isArray(gltf.materials) ? gltf.materials : [];
  const textures = Array.isArray(gltf.textures) ? gltf.textures : [];
  const images = Array.isArray(gltf.images) ? gltf.images : [];
  const samplers = Array.isArray(gltf.samplers) ? gltf.samplers : [];
  const bufferViews = Array.isArray(gltf.bufferViews) ? gltf.bufferViews : [];
  const animations = Array.isArray(gltf.animations) ? gltf.animations : [];

  let defaultSceneIndex = null;
  if (gltf.scene !== undefined) {
    if (!Number.isInteger(gltf.scene) || gltf.scene < 0 || gltf.scene >= scenes.length) {
      errors.push(`gltf.scene (${JSON.stringify(gltf.scene)}) does not reference a valid scene index`);
    } else {
      defaultSceneIndex = gltf.scene;
    }
  } else if (scenes.length > 0) {
    defaultSceneIndex = 0;
  }

  const sceneSummaries = [];
  const rootNodeIndexSet = new Set();
  for (let sIdx = 0; sIdx < scenes.length; sIdx += 1) {
    const sc = scenes[sIdx];
    if (!sc || typeof sc !== 'object') {
      errors.push(`scenes[${sIdx}] must be an object`);
      continue;
    }
    const rootNodes = Array.isArray(sc.nodes) ? sc.nodes : [];
    const validRoots = [];
    for (let r = 0; r < rootNodes.length; r += 1) {
      const nIdx = rootNodes[r];
      if (!Number.isInteger(nIdx) || nIdx < 0 || nIdx >= nodes.length) {
        errors.push(`scenes[${sIdx}].nodes[${r}] (${JSON.stringify(nIdx)}) does not reference a valid node index`);
      } else {
        validRoots.push(nIdx);
        rootNodeIndexSet.add(nIdx);
      }
    }
    sceneSummaries.push({
      index: sIdx,
      name: typeof sc.name === 'string' ? sc.name : null,
      rootNodeIndices: validRoots,
    });
  }

  // Validate nodes, parent uniqueness, and cycles
  const parentByNode = new Map();
  for (let nIdx = 0; nIdx < nodes.length; nIdx += 1) {
    const node = nodes[nIdx];
    if (!node || typeof node !== 'object') {
      errors.push(`nodes[${nIdx}] must be an object`);
      continue;
    }
    if (node.mesh !== undefined) {
      if (!Number.isInteger(node.mesh) || node.mesh < 0 || node.mesh >= meshes.length) {
        errors.push(`nodes[${nIdx}].mesh (${JSON.stringify(node.mesh)}) does not reference a valid mesh index`);
      }
    }
    if (node.skin !== undefined) {
      if (!Number.isInteger(node.skin) || node.skin < 0 || node.skin >= skins.length) {
        errors.push(`nodes[${nIdx}].skin (${JSON.stringify(node.skin)}) does not reference a valid skin index`);
      }
    }
    if (node.camera !== undefined) {
      if (!Number.isInteger(node.camera) || node.camera < 0 || node.camera >= cameras.length) {
        errors.push(`nodes[${nIdx}].camera (${JSON.stringify(node.camera)}) does not reference a valid camera index`);
      }
    }
    if (node.matrix !== undefined && (node.translation !== undefined || node.rotation !== undefined || node.scale !== undefined)) {
      errors.push(
        `nodes[${nIdx}] specifies both 'matrix' and TRS ('translation'/'rotation'/'scale') properties, violating glTF 2.0 node transform rules`,
      );
    }
    if (Array.isArray(node.children)) {
      for (let c = 0; c < node.children.length; c += 1) {
        const childIdx = node.children[c];
        if (!Number.isInteger(childIdx) || childIdx < 0 || childIdx >= nodes.length) {
          errors.push(`nodes[${nIdx}].children[${c}] (${JSON.stringify(childIdx)}) is out of range`);
        } else if (childIdx === nIdx) {
          errors.push(`nodes[${nIdx}] lists itself as a child (cycle detected)`);
        } else {
          if (parentByNode.has(childIdx)) {
            errors.push(
              `nodes[${childIdx}] has multiple parents (nodes[${parentByNode.get(childIdx)}] and nodes[${nIdx}]); glTF 2.0 node hierarchy must be a strict tree`,
            );
          } else {
            parentByNode.set(childIdx, nIdx);
          }
        }
      }
    }
  }

  // Cycle detection via DFS coloring (0 = unvisited, 1 = visiting, 2 = visited)
  const visitState = new Uint8Array(nodes.length);
  function dfsCycleCheck(u) {
    visitState[u] = 1;
    const children = Array.isArray(nodes[u]?.children) ? nodes[u].children : [];
    for (const v of children) {
      if (!Number.isInteger(v) || v < 0 || v >= nodes.length || v === u) continue;
      if (visitState[v] === 1) {
        errors.push(`Cycle detected in glTF node hierarchy involving nodes[${u}] -> nodes[${v}]`);
      } else if (visitState[v] === 0) {
        dfsCycleCheck(v);
      }
    }
    visitState[u] = 2;
  }
  for (let nIdx = 0; nIdx < nodes.length; nIdx += 1) {
    if (visitState[nIdx] === 0) {
      dfsCycleCheck(nIdx);
    }
  }

  // Root node transforms
  const rootIndicesToInspect =
    rootNodeIndexSet.size > 0
      ? [...rootNodeIndexSet]
      : nodes.map((_, idx) => idx).filter((idx) => !parentByNode.has(idx));

  const rootNodeTransforms = [];
  for (const rIdx of rootIndicesToInspect) {
    const node = nodes[rIdx];
    if (!node || typeof node !== 'object') continue;
    const translation =
      Array.isArray(node.translation) && node.translation.length === 3 && node.translation.every((n) => typeof n === 'number')
        ? node.translation
        : [0, 0, 0];
    const rotation =
      Array.isArray(node.rotation) && node.rotation.length === 4 && node.rotation.every((n) => typeof n === 'number')
        ? node.rotation
        : [0, 0, 0, 1];
    const scale =
      Array.isArray(node.scale) && node.scale.length === 3 && node.scale.every((n) => typeof n === 'number')
        ? node.scale
        : [1, 1, 1];
    const hasNonIdentityScale = scale.some((s) => Math.abs(s - 1) > 1e-5);
    const hasNegativeScale = scale.some((s) => s < 0);
    if (hasNegativeScale) {
      warnings.push(
        `Root node nodes[${rIdx}] ('${node.name || 'unnamed'}') has negative scale [${scale.join(', ')}], which can invert triangle winding and normal shading in web viewers`,
      );
    } else if (hasNonIdentityScale) {
      warnings.push(
        `Root node nodes[${rIdx}] ('${node.name || 'unnamed'}') has unapplied scale [${scale.join(', ')}]; apply scale in Blender (1 unit = 1m) before export when possible`,
      );
    }
    rootNodeTransforms.push({
      nodeIndex: rIdx,
      name: typeof node.name === 'string' ? node.name : null,
      translation,
      rotation,
      scale,
      hasNonIdentityScale,
      hasNegativeScale,
    });
  }

  // Summarize meshes & primitives
  let totalVertices = 0;
  let totalTrianglesEstimate = 0;
  const meshSummaries = [];

  for (let mIdx = 0; mIdx < meshes.length; mIdx += 1) {
    const mesh = meshes[mIdx];
    if (!mesh || typeof mesh !== 'object') {
      errors.push(`meshes[${mIdx}] must be an object`);
      continue;
    }
    const prims = Array.isArray(mesh.primitives) ? mesh.primitives : [];
    let meshVerts = 0;
    let meshTris = 0;
    const attrSet = new Set();
    const matIdxSet = new Set();
    let maxMorphTargets = 0;

    for (let pIdx = 0; pIdx < prims.length; pIdx += 1) {
      const prim = prims[pIdx];
      if (!prim || typeof prim !== 'object') {
        errors.push(`meshes[${mIdx}].primitives[${pIdx}] must be an object`);
        continue;
      }
      const attrs = prim.attributes && typeof prim.attributes === 'object' ? prim.attributes : {};
      for (const attrKey of Object.keys(attrs)) {
        attrSet.add(attrKey);
      }
      const posIdx = attrs.POSITION;
      let primVertCount = 0;
      if (Number.isInteger(posIdx) && posIdx >= 0 && posIdx < accessors.length) {
        primVertCount = Number.isInteger(accessors[posIdx]?.count) ? accessors[posIdx].count : 0;
      }
      meshVerts += primVertCount;

      const mode = prim.mode ?? 4; // 4 = TRIANGLES
      let indexOrVertCount = primVertCount;
      if (Number.isInteger(prim.indices) && prim.indices >= 0 && prim.indices < accessors.length) {
        indexOrVertCount = Number.isInteger(accessors[prim.indices]?.count)
          ? accessors[prim.indices].count
          : primVertCount;
      }
      if (mode === 4) {
        meshTris += Math.floor(indexOrVertCount / 3);
      } else if (mode === 5 || mode === 6) {
        meshTris += Math.max(0, indexOrVertCount - 2);
      }

      if (prim.material !== undefined) {
        if (!Number.isInteger(prim.material) || prim.material < 0 || prim.material >= materials.length) {
          errors.push(
            `meshes[${mIdx}].primitives[${pIdx}].material (${JSON.stringify(prim.material)}) does not reference a valid material index`,
          );
        } else {
          matIdxSet.add(prim.material);
        }
      }

      if (Array.isArray(prim.targets)) {
        maxMorphTargets = Math.max(maxMorphTargets, prim.targets.length);
      }
    }

    totalVertices += meshVerts;
    totalTrianglesEstimate += meshTris;

    meshSummaries.push({
      index: mIdx,
      name: typeof mesh.name === 'string' ? mesh.name : null,
      primitiveCount: prims.length,
      vertexCount: meshVerts,
      triangleEstimate: meshTris,
      attributes: [...attrSet].sort(),
      materialIndices: [...matIdxSet].sort((a, b) => a - b),
      morphTargetCount: maxMorphTargets,
    });
  }

  // Validate images & textures
  const externalImageResources = [];
  for (let iIdx = 0; iIdx < images.length; iIdx += 1) {
    const img = images[iIdx];
    if (!img || typeof img !== 'object') {
      errors.push(`images[${iIdx}] must be an object`);
      continue;
    }
    if (img.bufferView !== undefined) {
      if (!Number.isInteger(img.bufferView) || img.bufferView < 0 || img.bufferView >= bufferViews.length) {
        errors.push(`images[${iIdx}].bufferView (${JSON.stringify(img.bufferView)}) does not reference a valid bufferView`);
      }
      if (typeof img.mimeType !== 'string' || img.mimeType.trim().length === 0) {
        errors.push(`images[${iIdx}] uses bufferView (${img.bufferView}) but omits required 'mimeType'`);
      }
    } else if (typeof img.uri === 'string' && img.uri.trim().length > 0) {
      const externalFile = isExternalUri(img.uri);
      externalImageResources.push({
        kind: 'image',
        index: iIdx,
        uri: img.uri,
        isExternalFile: externalFile,
      });
      if (externalFile) {
        warnings.push(
          `images[${iIdx}] references an external texture URI ('${img.uri}'); external URIs can fail with 404 or CORS errors in web viewers unless packed into the GLB`,
        );
        if (hasUnsafeUriTraversal(img.uri)) {
          errors.push(`images[${iIdx}].uri ('${img.uri}') contains unsafe path traversal or absolute path`);
        }
      }
    } else {
      errors.push(`images[${iIdx}] must specify either 'bufferView' (+ 'mimeType') or 'uri'`);
    }
  }

  const textureSummaries = [];
  for (let tIdx = 0; tIdx < textures.length; tIdx += 1) {
    const tex = textures[tIdx];
    if (!tex || typeof tex !== 'object') {
      errors.push(`textures[${tIdx}] must be an object`);
      continue;
    }
    let sourceImgIdx = tex.source ?? null;
    let isExtensionSource = false;
    if (sourceImgIdx === null && tex.extensions && typeof tex.extensions === 'object') {
      const basisuSource = tex.extensions.KHR_texture_basisu?.source;
      const webpSource = tex.extensions.EXT_texture_webp?.source;
      if (Number.isInteger(basisuSource)) {
        sourceImgIdx = basisuSource;
        isExtensionSource = true;
      } else if (Number.isInteger(webpSource)) {
        sourceImgIdx = webpSource;
        isExtensionSource = true;
      }
    }
    if (sourceImgIdx !== null) {
      if (!Number.isInteger(sourceImgIdx) || sourceImgIdx < 0 || sourceImgIdx >= images.length) {
        errors.push(`textures[${tIdx}] image source (${JSON.stringify(sourceImgIdx)}) does not reference a valid image index`);
      }
    } else {
      warnings.push(`textures[${tIdx}] does not reference a source image index`);
    }

    if (tex.sampler !== undefined) {
      if (!Number.isInteger(tex.sampler) || tex.sampler < 0 || tex.sampler >= samplers.length) {
        errors.push(`textures[${tIdx}].sampler (${JSON.stringify(tex.sampler)}) does not reference a valid sampler index`);
      }
    }

    const imgObj = Number.isInteger(sourceImgIdx) && sourceImgIdx >= 0 && sourceImgIdx < images.length ? images[sourceImgIdx] : null;
    let storageKind = 'missing';
    let mimeType = typeof imgObj?.mimeType === 'string' ? imgObj.mimeType : null;
    let uri = typeof imgObj?.uri === 'string' ? imgObj.uri : null;
    if (imgObj) {
      if (imgObj.bufferView !== undefined) {
        storageKind = isExtensionSource ? 'extensionSource' : 'bufferView';
      } else if (typeof imgObj.uri === 'string') {
        if (imgObj.uri.trim().toLowerCase().startsWith('data:')) {
          storageKind = 'dataUri';
          if (!mimeType) {
            const m = imgObj.uri.match(/^data:([^;,]+)/i);
            if (m) mimeType = m[1];
          }
        } else {
          storageKind = 'externalUri';
        }
      }
    }

    textureSummaries.push({
      index: tIdx,
      name: typeof tex.name === 'string' ? tex.name : null,
      sourceImageIndex: Number.isInteger(sourceImgIdx) ? sourceImgIdx : null,
      samplerIndex: Number.isInteger(tex.sampler) ? tex.sampler : null,
      mimeType,
      storageKind,
      uri: storageKind === 'externalUri' ? uri : null,
    });
  }

  // Validate and summarize materials
  const materialSummaries = [];
  for (let matIdx = 0; matIdx < materials.length; matIdx += 1) {
    const mat = materials[matIdx];
    if (!mat || typeof mat !== 'object') {
      errors.push(`materials[${matIdx}] must be an object`);
      continue;
    }
    const alphaMode = mat.alphaMode ?? 'OPAQUE';
    if (!VALID_ALPHA_MODES.has(alphaMode)) {
      errors.push(`materials[${matIdx}].alphaMode ('${alphaMode}') must be one of OPAQUE, MASK, BLEND`);
    }
    const pbr = mat.pbrMetallicRoughness && typeof mat.pbrMetallicRoughness === 'object' ? mat.pbrMetallicRoughness : {};

    const checkTexRef = (texInfo, label) => {
      if (!texInfo || typeof texInfo !== 'object') return false;
      if (!Number.isInteger(texInfo.index) || texInfo.index < 0 || texInfo.index >= textures.length) {
        errors.push(`materials[${matIdx}].${label}.index (${JSON.stringify(texInfo.index)}) does not reference a valid texture`);
        return false;
      }
      return true;
    };

    const hasBaseColorTexture = checkTexRef(pbr.baseColorTexture, 'pbrMetallicRoughness.baseColorTexture');
    const hasMetallicRoughnessTexture = checkTexRef(
      pbr.metallicRoughnessTexture,
      'pbrMetallicRoughness.metallicRoughnessTexture',
    );
    const hasNormalTexture = checkTexRef(mat.normalTexture, 'normalTexture');
    const hasOcclusionTexture = checkTexRef(mat.occlusionTexture, 'occlusionTexture');
    const hasEmissiveTexture = checkTexRef(mat.emissiveTexture, 'emissiveTexture');

    const baseColorFactor =
      Array.isArray(pbr.baseColorFactor) &&
      pbr.baseColorFactor.length === 4 &&
      pbr.baseColorFactor.every((n) => typeof n === 'number')
        ? pbr.baseColorFactor
        : [1, 1, 1, 1];
    const metallicFactor =
      typeof pbr.metallicFactor === 'number' && pbr.metallicFactor >= 0 && pbr.metallicFactor <= 1
        ? pbr.metallicFactor
        : 1;
    const roughnessFactor =
      typeof pbr.roughnessFactor === 'number' && pbr.roughnessFactor >= 0 && pbr.roughnessFactor <= 1
        ? pbr.roughnessFactor
        : 1;
    const matExtensions =
      mat.extensions && typeof mat.extensions === 'object' && !Array.isArray(mat.extensions)
        ? Object.keys(mat.extensions).sort()
        : [];

    materialSummaries.push({
      index: matIdx,
      name: typeof mat.name === 'string' ? mat.name : null,
      alphaMode: VALID_ALPHA_MODES.has(alphaMode) ? alphaMode : 'OPAQUE',
      doubleSided: Boolean(mat.doubleSided),
      unlit: matExtensions.includes('KHR_materials_unlit'),
      hasBaseColorTexture,
      hasMetallicRoughnessTexture,
      hasNormalTexture,
      hasOcclusionTexture,
      hasEmissiveTexture,
      baseColorFactor,
      metallicFactor,
      roughnessFactor,
      extensions: matExtensions,
    });
  }

  // Validate and summarize animations
  const animationSummaries = [];
  for (let aIdx = 0; aIdx < animations.length; aIdx += 1) {
    const anim = animations[aIdx];
    if (!anim || typeof anim !== 'object') {
      errors.push(`animations[${aIdx}] must be an object`);
      continue;
    }
    const animChannels = Array.isArray(anim.channels) ? anim.channels : [];
    const animSamplers = Array.isArray(anim.samplers) ? anim.samplers : [];
    const targetPathsSet = new Set();
    const interpSet = new Set();
    let maxDuration = null;

    for (let sIdx = 0; sIdx < animSamplers.length; sIdx += 1) {
      const samp = animSamplers[sIdx];
      if (!samp || typeof samp !== 'object') {
        errors.push(`animations[${aIdx}].samplers[${sIdx}] must be an object`);
        continue;
      }
      const interp = samp.interpolation ?? 'LINEAR';
      if (!VALID_INTERPOLATIONS.has(interp)) {
        errors.push(`animations[${aIdx}].samplers[${sIdx}].interpolation ('${interp}') is invalid`);
      } else {
        interpSet.add(interp);
      }
      if (!Number.isInteger(samp.input) || samp.input < 0 || samp.input >= accessors.length) {
        errors.push(`animations[${aIdx}].samplers[${sIdx}].input (${JSON.stringify(samp.input)}) does not reference a valid accessor`);
      } else {
        const inputAcc = accessors[samp.input];
        if (Array.isArray(inputAcc?.max) && typeof inputAcc.max[0] === 'number' && Number.isFinite(inputAcc.max[0]) && inputAcc.max[0] >= 0) {
          maxDuration = maxDuration === null ? inputAcc.max[0] : Math.max(maxDuration, inputAcc.max[0]);
        }
      }
      if (!Number.isInteger(samp.output) || samp.output < 0 || samp.output >= accessors.length) {
        errors.push(`animations[${aIdx}].samplers[${sIdx}].output (${JSON.stringify(samp.output)}) does not reference a valid accessor`);
      }
    }

    for (let cIdx = 0; cIdx < animChannels.length; cIdx += 1) {
      const ch = animChannels[cIdx];
      if (!ch || typeof ch !== 'object') {
        errors.push(`animations[${aIdx}].channels[${cIdx}] must be an object`);
        continue;
      }
      if (!Number.isInteger(ch.sampler) || ch.sampler < 0 || ch.sampler >= animSamplers.length) {
        errors.push(`animations[${aIdx}].channels[${cIdx}].sampler (${JSON.stringify(ch.sampler)}) does not reference a valid animation sampler`);
      }
      const target = ch.target;
      if (!target || typeof target !== 'object') {
        errors.push(`animations[${aIdx}].channels[${cIdx}].target must be an object`);
      } else {
        if (target.node !== undefined && (!Number.isInteger(target.node) || target.node < 0 || target.node >= nodes.length)) {
          errors.push(`animations[${aIdx}].channels[${cIdx}].target.node (${JSON.stringify(target.node)}) does not reference a valid node`);
        }
        if (!VALID_ANIMATION_PATHS.has(target.path)) {
          errors.push(`animations[${aIdx}].channels[${cIdx}].target.path ('${target.path}') must be translation, rotation, scale, or weights`);
        } else {
          targetPathsSet.add(target.path);
        }
      }
    }

    animationSummaries.push({
      index: aIdx,
      name: typeof anim.name === 'string' ? anim.name : null,
      channelCount: animChannels.length,
      samplerCount: animSamplers.length,
      durationSeconds: maxDuration !== null ? Number(maxDuration.toFixed(6)) : null,
      targetPaths: [...targetPathsSet].sort(),
      interpolationModes: [...interpSet].sort(),
    });
  }

  // Validate skins
  for (let skIdx = 0; skIdx < skins.length; skIdx += 1) {
    const skin = skins[skIdx];
    if (!skin || typeof skin !== 'object') {
      errors.push(`skins[${skIdx}] must be an object`);
      continue;
    }
    if (!Array.isArray(skin.joints) || skin.joints.length === 0) {
      errors.push(`skins[${skIdx}].joints must be a non-empty array of node indices`);
    } else {
      for (let j = 0; j < skin.joints.length; j += 1) {
        const jNode = skin.joints[j];
        if (!Number.isInteger(jNode) || jNode < 0 || jNode >= nodes.length) {
          errors.push(`skins[${skIdx}].joints[${j}] (${JSON.stringify(jNode)}) does not reference a valid node index`);
        }
      }
    }
    if (skin.inverseBindMatrices !== undefined) {
      if (!Number.isInteger(skin.inverseBindMatrices) || skin.inverseBindMatrices < 0 || skin.inverseBindMatrices >= accessors.length) {
        errors.push(`skins[${skIdx}].inverseBindMatrices (${JSON.stringify(skin.inverseBindMatrices)}) does not reference a valid accessor`);
      }
    }
  }

  return {
    defaultSceneIndex,
    scenes: sceneSummaries,
    meshes: meshSummaries,
    materials: materialSummaries,
    textures: textureSummaries,
    animations: animationSummaries,
    rootNodeTransforms,
    totalVertices,
    totalTrianglesEstimate,
    externalImageResources,
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
      details: null,
      validationTiers: {
        containerStructural: {
          status: 'Failed',
          tool: 'scripts/inspect-glb.mjs',
          summary: 'Input is not a valid Node.js Buffer.',
        },
        gltfSpecification: {
          status: 'Not Run',
          tool: 'gltf-validator',
          summary: 'Khronos gltf-validator not executed.',
        },
        visualQuality: {
          status: 'Not Run',
          summary: 'Visual quality cannot be verified from binary container inspection.',
        },
        liveRuntime: {
          status: 'Not Run',
          summary: 'Live Blender runtime execution cannot be verified from a binary file.',
        },
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
  let details = null;

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

    const { bounds: computedBounds, externalBufferResources } = validateBuffersAndAccessors(
      gltf,
      hasBinChunk,
      binChunkLength,
      errors,
      warnings,
    );
    bounds = computedBounds;

    const sceneSummary = validateAndSummarizeSceneGraph(gltf, errors, warnings);

    counts = {
      scenes: Array.isArray(gltf.scenes) ? gltf.scenes.length : 0,
      nodes: Array.isArray(gltf.nodes) ? gltf.nodes.length : 0,
      meshes: meshes.length,
      primitives: primitiveCount,
      vertices: sceneSummary.totalVertices,
      trianglesEstimate: sceneSummary.totalTrianglesEstimate,
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

    const extensionsUsed = Array.isArray(gltf.extensionsUsed) ? [...new Set(gltf.extensionsUsed)] : [];
    const extensionsRequired = Array.isArray(gltf.extensionsRequired) ? [...new Set(gltf.extensionsRequired)] : [];
    const actuallyUsedExtensions = [...collectUsedExtensionsInObject(gltf)].sort();
    const undeclaredExtensionsFound = actuallyUsedExtensions.filter(
      (ext) => !extensionsUsed.includes(ext),
    );

    for (const reqExt of extensionsRequired) {
      if (!extensionsUsed.includes(reqExt)) {
        errors.push(`extensionsRequired entry '${reqExt}' is missing from extensionsUsed`);
      }
    }
    for (const undeclaredExt of undeclaredExtensionsFound) {
      errors.push(
        `Extension '${undeclaredExt}' is used in the glTF JSON payload but is not declared in extensionsUsed`,
      );
    }

    const allKnownExts = new Set([...extensionsUsed, ...extensionsRequired, ...actuallyUsedExtensions]);
    const dracoUsed = allKnownExts.has('KHR_draco_mesh_compression');
    const dracoRequired = extensionsRequired.includes('KHR_draco_mesh_compression');
    const meshoptUsed = allKnownExts.has('EXT_meshopt_compression');
    const meshoptRequired = extensionsRequired.includes('EXT_meshopt_compression');
    const ktx2Used = allKnownExts.has('KHR_texture_basisu');
    const ktx2Required = extensionsRequired.includes('KHR_texture_basisu');
    const webpUsed = allKnownExts.has('EXT_texture_webp');
    const webpRequired = extensionsRequired.includes('EXT_texture_webp');

    extensions = {
      extensionsUsed,
      extensionsRequired,
      undeclaredExtensionsFound,
      compression: {
        draco: {
          used: dracoUsed,
          required: dracoRequired,
          decoderRequired: dracoUsed || dracoRequired,
        },
        meshopt: {
          used: meshoptUsed,
          required: meshoptRequired,
          decoderRequired: meshoptUsed || meshoptRequired,
        },
        ktx2BasisU: {
          used: ktx2Used,
          required: ktx2Required,
          transcoderRequired: ktx2Used || ktx2Required,
        },
        webp: {
          used: webpUsed,
          required: webpRequired,
        },
      },
    };

    details = {
      defaultSceneIndex: sceneSummary.defaultSceneIndex,
      scenes: sceneSummary.scenes,
      meshes: sceneSummary.meshes,
      materials: sceneSummary.materials,
      textures: sceneSummary.textures,
      animations: sceneSummary.animations,
      rootNodeTransforms: sceneSummary.rootNodeTransforms,
      externalResources: [...externalBufferResources, ...sceneSummary.externalImageResources],
      extras: gltf.extras && typeof gltf.extras === 'object' ? gltf.extras : null,
    };

    if (strictPositionBounds && bounds.missingPositionBoundsCount > 0) {
      errors.push(
        `${bounds.missingPositionBoundsCount} POSITION accessor(s) omit required min/max bounds under strictPositionBounds`,
      );
    }
  }

  const valid = errors.length === 0;
  const structuralStatus = !valid ? 'Failed' : warnings.length > 0 ? 'Warn' : 'Passed';

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
    details,
    khronosValidator: {
      requested: false,
      status: 'not_run',
      tool: 'gltf-validator',
      message: 'Khronos gltf-validator not requested (pass --khronos to attempt validation)',
      issues: null,
    },
    validationTiers: {
      containerStructural: {
        status: structuralStatus,
        tool: 'scripts/inspect-glb.mjs',
        errorCount: errors.length,
        warningCount: warnings.length,
        summary: valid
          ? `Binary GLB 2.0 container structure passed (${warnings.length} warning(s)).`
          : `Binary GLB 2.0 container structure failed with ${errors.length} error(s).`,
      },
      gltfSpecification: {
        status: 'Not Run',
        tool: 'gltf-validator',
        summary:
          'Upstream Khronos gltf-validator was not executed. Built-in inspection checks GLB 2.0 container structure and cross-references, not the full Khronos glTF 2.0 specification.',
      },
      visualQuality: {
        status: 'Not Run',
        summary:
          'Visual framing, lighting balance, silhouette readability, and material appearance are not verifiable from binary container inspection.',
      },
      liveRuntime: {
        status: 'Not Run',
        summary:
          'Live Blender runtime execution and current-run provenance are not established by static GLB file inspection.',
      },
    },
    truthBoundary: {
      verificationScope: 'container-structure-only',
      provesContainerIntegrity: valid,
      provesFullGltfSpecCompliance: false,
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
      details: null,
      khronosValidator: {
        requested: Boolean(runKhronos),
        status: 'not_run',
        tool: 'gltf-validator',
        message: 'Skipped because file does not exist',
        issues: null,
      },
      validationTiers: {
        containerStructural: {
          status: 'Failed',
          tool: 'scripts/inspect-glb.mjs',
          errorCount: 1,
          warningCount: 0,
          summary: `GLB file does not exist: ${filePath}`,
        },
        gltfSpecification: {
          status: 'Not Run',
          tool: 'gltf-validator',
          summary: 'Skipped because file does not exist.',
        },
        visualQuality: {
          status: 'Not Run',
          summary: 'Visual quality cannot be verified without a valid rendered artifact.',
        },
        liveRuntime: {
          status: 'Not Run',
          summary: 'Live Blender runtime execution was not run.',
        },
      },
      truthBoundary: {
        verificationScope: 'container-structure-only',
        provesContainerIntegrity: false,
        provesFullGltfSpecCompliance: false,
        provesVisualCorrectness: false,
        provesBlenderRuntimeExecution: false,
        disclaimer: CONTAINER_TRUTH_DISCLAIMER,
      },
    };
  }

  let lstat;
  try {
    lstat = fs.lstatSync(resolved);
  } catch (err) {
    return {
      valid: false,
      filePath: resolved,
      errors: [`Unable to stat GLB path: ${err.message}`],
      warnings: [],
      byteSize: 0,
      sha256: null,
      header: null,
      chunks: null,
      counts: null,
      extensions: null,
      bounds: null,
      details: null,
      khronosValidator: {
        requested: Boolean(runKhronos),
        status: 'not_run',
        tool: 'gltf-validator',
        message: 'Skipped because path could not be stat-ed',
        issues: null,
      },
      validationTiers: {
        containerStructural: {
          status: 'Failed',
          tool: 'scripts/inspect-glb.mjs',
          errorCount: 1,
          warningCount: 0,
          summary: `Unable to stat GLB path: ${filePath}`,
        },
        gltfSpecification: {
          status: 'Not Run',
          tool: 'gltf-validator',
          summary: 'Skipped because path could not be stat-ed.',
        },
        visualQuality: {
          status: 'Not Run',
          summary: 'Visual quality cannot be verified.',
        },
        liveRuntime: {
          status: 'Not Run',
          summary: 'Live Blender runtime execution was not run.',
        },
      },
      truthBoundary: {
        verificationScope: 'container-structure-only',
        provesContainerIntegrity: false,
        provesFullGltfSpecCompliance: false,
        provesVisualCorrectness: false,
        provesBlenderRuntimeExecution: false,
        disclaimer: CONTAINER_TRUTH_DISCLAIMER,
      },
    };
  }

  if (!lstat.isFile()) {
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
      details: null,
      khronosValidator: {
        requested: Boolean(runKhronos),
        status: 'not_run',
        tool: 'gltf-validator',
        message: 'Skipped because path is not a regular file',
        issues: null,
      },
      validationTiers: {
        containerStructural: {
          status: 'Failed',
          tool: 'scripts/inspect-glb.mjs',
          errorCount: 1,
          warningCount: 0,
          summary: `Path is not a regular file: ${filePath}`,
        },
        gltfSpecification: {
          status: 'Not Run',
          tool: 'gltf-validator',
          summary: 'Skipped because path is not a regular file.',
        },
        visualQuality: {
          status: 'Not Run',
          summary: 'Visual quality cannot be verified.',
        },
        liveRuntime: {
          status: 'Not Run',
          summary: 'Live Blender runtime execution was not run.',
        },
      },
      truthBoundary: {
        verificationScope: 'container-structure-only',
        provesContainerIntegrity: false,
        provesFullGltfSpecCompliance: false,
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
    if (khronosRes.status === 'passed') {
      result.validationTiers.gltfSpecification = {
        status: (khronosRes.issues?.numWarnings ?? 0) > 0 ? 'Warn' : 'Passed',
        tool: 'gltf-validator',
        summary: khronosRes.message,
      };
      result.truthBoundary.provesFullGltfSpecCompliance = true;
    } else if (khronosRes.status === 'unavailable') {
      result.validationTiers.gltfSpecification = {
        status: 'Unavailable',
        tool: 'gltf-validator',
        summary: khronosRes.message,
      };
    } else if (khronosRes.status === 'failed' || khronosRes.status === 'error') {
      result.valid = false;
      result.truthBoundary.provesContainerIntegrity = false;
      result.truthBoundary.provesFullGltfSpecCompliance = false;
      result.errors.push(khronosRes.message);
      result.validationTiers.gltfSpecification = {
        status: 'Failed',
        tool: 'gltf-validator',
        summary: khronosRes.message,
      };
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
    process.stdout.write(`${JSON.stringify(res, null, 2)}\n`);
    process.exitCode = res.valid ? 0 : 1;
    return;
  }

  if (positional.length === 0) {
    process.stderr.write(
      'Usage: node scripts/inspect-glb.mjs <path-to-file.glb> [--khronos] [--strict-bounds] | --self-test\n',
    );
    process.exitCode = 1;
    return;
  }

  const targetFile = positional[0];
  const report = await inspectGlbFile(targetFile, { runKhronos, strictPositionBounds });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = report.valid ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
