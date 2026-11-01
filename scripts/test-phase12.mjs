import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

import {
  GLB_MAGIC,
  GLB_VERSION_2,
  GLB_CHUNK_TYPE_JSON,
  GLB_CHUNK_TYPE_BIN,
  CONTAINER_TRUTH_DISCLAIMER,
  buildMinimalValidGlbBuffer,
  inspectGlbBuffer,
  inspectGlbFile,
  runKhronosGltfValidator,
} from './inspect-glb.mjs';
import {
  DEFAULT_HANDOFF_MANIFEST_SCHEMA_PATH,
  escapeHtml,
  validateGlbWebHandoffManifest,
  buildGlbWebHandoffManifestFromInspection,
  buildWebIntegrationCodeSnippets,
  formatGlbHandoffMarkdownSummary,
  renderGlbHandoffHtmlReport,
  validateSafeReportOutputDir,
  generateGlbHandoffReportFromBuffer,
  generateGlbHandoffReportFromBufferSync,
  generateGlbHandoffReportFromFile,
  generateGlbHandoffReportFromFileSync,
} from './generate-glb-handoff-report.mjs';
import {
  resolveViewerManifestConfig,
  resolveDecoderConfiguration,
  computeCameraFramingParameters,
  configureGltfDecoders,
  frameCameraToBoundingBox,
  disposeGltfScene,
  extractAnimationClipSummary,
  createThreeGlbViewer,
} from '../docs/examples/glb-web-handoff/threejs-glb-viewer.mjs';
import { buildSubprocessInvocation, resolveNpmCliScript } from './test-phase11.mjs';
import { ensureMainRepoGitRestored } from './generate-current-audit.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function execNpmTool(toolName, args, options = {}) {
  const scriptName = toolName === 'npx' ? 'npx-cli.js' : 'npm-cli.js';
  const cliJsPath = resolveNpmCliScript(scriptName);
  if (cliJsPath) {
    return execFileSync(process.execPath, [cliJsPath, ...args], {
      windowsHide: true,
      ...options,
    });
  }
  const executablePath = process.platform === 'win32' ? `${toolName}.cmd` : toolName;
  const invocation = buildSubprocessInvocation({ executablePath, args });
  return execFileSync(invocation.file, invocation.args, {
    windowsHide: invocation.windowsHide,
    ...options,
  });
}

function buildRichSyntheticGlbBuffer() {
  // 3 vertices (36 bytes) + 3 scalar uint16 indices (6 bytes padded to 8 bytes)
  // + 2 keyframe times (8 bytes) + 2 Vec3 translations (24 bytes)
  // + 1 inverseBindMatrix MAT4 (64 bytes) + 8-byte embedded PNG header stub = 148 bytes
  const extraBin = Buffer.alloc(112, 0);
  // Write 3 uint16 indices [0, 1, 2] at offset 0 of extraBin (which is offset 36 in BIN chunk)
  extraBin.writeUInt16LE(0, 0);
  extraBin.writeUInt16LE(1, 2);
  extraBin.writeUInt16LE(2, 4);

  return buildMinimalValidGlbBuffer({
    generator: 'BlendOps-Synthetic-Rich-Fixture/1.0',
    extraBinBytes: extraBin,
    customGltfPatch: (gltf) => {
      gltf.extensionsUsed = [
        'KHR_draco_mesh_compression',
        'EXT_meshopt_compression',
        'KHR_texture_basisu',
        'EXT_texture_webp',
        'KHR_materials_unlit',
      ];
      gltf.extensionsRequired = ['KHR_draco_mesh_compression'];
      gltf.scenes = [{ name: 'ProductHeroScene', nodes: [0] }];
      gltf.nodes = [
        {
          name: 'ShoeRoot',
          translation: [0, 0.05, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1],
          children: [1],
        },
        {
          name: 'ShoeMeshNode',
          mesh: 0,
          skin: 0,
        },
      ];
      gltf.bufferViews.push(
        { buffer: 0, byteOffset: 36, byteLength: 6, target: 34963 }, // indices
        { buffer: 0, byteOffset: 44, byteLength: 8 }, // anim input times
        { buffer: 0, byteOffset: 52, byteLength: 24 }, // anim output translations
        { buffer: 0, byteOffset: 76, byteLength: 64 }, // IBM MAT4
        { buffer: 0, byteOffset: 140, byteLength: 8 }, // embedded image bytes
      );
      gltf.accessors.push(
        {
          bufferView: 1,
          byteOffset: 0,
          componentType: 5123, // UNSIGNED_SHORT
          count: 3,
          type: 'SCALAR',
          min: [0],
          max: [2],
        },
        {
          bufferView: 2,
          byteOffset: 0,
          componentType: 5126, // FLOAT
          count: 2,
          type: 'SCALAR',
          min: [0],
          max: [2.5],
        },
        {
          bufferView: 3,
          byteOffset: 0,
          componentType: 5126, // FLOAT
          count: 2,
          type: 'VEC3',
        },
        {
          bufferView: 4,
          byteOffset: 0,
          componentType: 5126, // FLOAT
          count: 1,
          type: 'MAT4',
        },
      );
      gltf.meshes[0].name = 'CyberpunkShoeMesh';
      gltf.meshes[0].primitives[0].indices = 1;
      gltf.meshes[0].primitives[0].material = 0;
      gltf.meshes[0].primitives[0].extensions = {
        KHR_draco_mesh_compression: {
          bufferView: 0,
          attributes: { POSITION: 0 },
        },
      };
      gltf.images = [
        {
          name: 'AlbedoTexImage',
          bufferView: 5,
          mimeType: 'image/png',
        },
        {
          name: 'NormalDataUriImage',
          uri: 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
        },
      ];
      gltf.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
      gltf.textures = [
        {
          name: 'AlbedoTexture',
          sampler: 0,
          source: 0,
          extensions: { KHR_texture_basisu: { source: 0 } },
        },
        {
          name: 'NormalTexture',
          sampler: 0,
          source: 1,
          extensions: { EXT_texture_webp: { source: 1 } },
        },
      ];
      gltf.materials = [
        {
          name: 'NeonSoleMaterial',
          alphaMode: 'BLEND',
          doubleSided: true,
          pbrMetallicRoughness: {
            baseColorFactor: [0.9, 0.95, 1.0, 1.0],
            metallicFactor: 0.2,
            roughnessFactor: 0.35,
            baseColorTexture: { index: 0 },
          },
          normalTexture: { index: 1 },
          extensions: {
            KHR_materials_unlit: {},
          },
        },
      ];
      gltf.animations = [
        {
          name: 'TurntableSpin',
          samplers: [
            {
              input: 2,
              output: 3,
              interpolation: 'LINEAR',
            },
          ],
          channels: [
            {
              sampler: 0,
              target: { node: 0, path: 'translation' },
            },
          ],
        },
      ];
      gltf.skins = [
        {
          name: 'ShoeRig',
          joints: [0, 1],
          inverseBindMatrices: 4,
        },
      ];
      gltf.extras = { blendopsSyntheticFixture: true };
    },
  });
}

describe('Phase 12 — Web-Ready GLB Delivery & Viewer Integration', () => {
  let suiteTmpDir;
  let ajvValidateManifest;

  before(() => {
    ensureMainRepoGitRestored(ROOT);
    suiteTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blendops-test-phase12-'));
    const rawSchema = JSON.parse(fs.readFileSync(DEFAULT_HANDOFF_MANIFEST_SCHEMA_PATH, 'utf8'));
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    ajvValidateManifest = ajv.compile(rawSchema);
  });

  after(() => {
    if (suiteTmpDir && fs.existsSync(suiteTmpDir)) {
      fs.rmSync(suiteTmpDir, { recursive: true, force: true });
    }
  });

  test('Scenario 1: Rich synthetic GLB inspection extracts complete scene, mesh, material, texture, animation, skin, compression, and 4-tier validation metadata', async () => {
    const minBuf = buildMinimalValidGlbBuffer();
    const minRes = inspectGlbBuffer(minBuf, { strictPositionBounds: true });
    assert.equal(minRes.valid, true);
    assert.equal(minRes.errors.length, 0);
    assert.equal(minRes.header.magic, 'glTF');
    assert.equal(minRes.header.version, GLB_VERSION_2);
    assert.equal(minRes.counts.scenes, 1);
    assert.equal(minRes.counts.nodes, 1);
    assert.equal(minRes.counts.meshes, 1);
    assert.equal(minRes.counts.primitives, 1);
    assert.equal(minRes.counts.vertices, 3);
    assert.equal(minRes.counts.trianglesEstimate, 1);
    assert.equal(minRes.bounds.positionAccessorCount, 1);
    assert.equal(minRes.bounds.missingPositionBoundsCount, 0);
    assert.deepEqual(minRes.bounds.sceneBoundingBox.min, [0, 0, 0]);
    assert.deepEqual(minRes.bounds.sceneBoundingBox.max, [1, 1, 0]);
    assert.equal(minRes.validationTiers.containerStructural.status, 'Passed');
    assert.equal(minRes.validationTiers.gltfSpecification.status, 'Not Run');
    assert.equal(minRes.validationTiers.visualQuality.status, 'Not Run');
    assert.equal(minRes.validationTiers.liveRuntime.status, 'Not Run');
    assert.equal(minRes.truthBoundary.provesContainerIntegrity, true);
    assert.equal(minRes.truthBoundary.provesVisualCorrectness, false);
    assert.equal(minRes.truthBoundary.provesBlenderRuntimeExecution, false);

    // Rich synthetic GLB fixture inspection
    const richBuf = buildRichSyntheticGlbBuffer();
    const richPath = path.join(suiteTmpDir, 'synthetic-rich-hero.glb');
    fs.writeFileSync(richPath, richBuf);

    const richRes = await inspectGlbFile(richPath, {
      strictPositionBounds: true,
      runKhronos: true,
      validatorModuleLoader: async () => ({
        validateBytes: async () => ({
          validatorVersion: '2.0.0-synthetic-mock',
          issues: { numErrors: 0, numWarnings: 0, numInfos: 1, numHints: 0, messages: [] },
        }),
      }),
    });

    assert.equal(richRes.valid, true);
    assert.equal(richRes.counts.scenes, 1);
    assert.equal(richRes.counts.nodes, 2);
    assert.equal(richRes.counts.meshes, 1);
    assert.equal(richRes.counts.materials, 1);
    assert.equal(richRes.counts.textures, 2);
    assert.equal(richRes.counts.images, 2);
    assert.equal(richRes.counts.animations, 1);
    assert.equal(richRes.counts.skins, 1);
    assert.equal(richRes.extensions.compression.draco.used, true);
    assert.equal(richRes.extensions.compression.draco.required, true);
    assert.equal(richRes.extensions.compression.draco.decoderRequired, true);
    assert.equal(richRes.extensions.compression.meshopt.used, true);
    assert.equal(richRes.extensions.compression.ktx2BasisU.used, true);
    assert.equal(richRes.extensions.compression.webp.used, true);
    assert.deepEqual(richRes.extensions.undeclaredExtensionsFound, []);

    assert.equal(richRes.details.scenes[0].name, 'ProductHeroScene');
    assert.equal(richRes.details.meshes[0].name, 'CyberpunkShoeMesh');
    assert.equal(richRes.details.meshes[0].vertexCount, 3);
    assert.equal(richRes.details.meshes[0].triangleEstimate, 1);
    assert.equal(richRes.details.materials[0].name, 'NeonSoleMaterial');
    assert.equal(richRes.details.materials[0].alphaMode, 'BLEND');
    assert.equal(richRes.details.materials[0].doubleSided, true);
    assert.equal(richRes.details.materials[0].unlit, true);
    assert.equal(richRes.details.materials[0].hasBaseColorTexture, true);
    assert.equal(richRes.details.materials[0].hasNormalTexture, true);
    assert.equal(richRes.details.textures[0].storageKind, 'bufferView');
    assert.equal(richRes.details.textures[1].storageKind, 'dataUri');
    assert.equal(richRes.details.animations[0].name, 'TurntableSpin');
    assert.equal(richRes.details.animations[0].durationSeconds, 2.5);
    assert.deepEqual(richRes.details.animations[0].targetPaths, ['translation']);
    assert.equal(richRes.validationTiers.containerStructural.status, 'Passed');
    assert.equal(richRes.validationTiers.gltfSpecification.status, 'Passed');
    assert.equal(richRes.validationTiers.visualQuality.status, 'Not Run');
    assert.equal(richRes.validationTiers.liveRuntime.status, 'Not Run');
  });

  test('Scenario 2: Binary container checks reject truncated, unaligned, NUL-padded, or corrupt GLB headers and chunks', () => {
    // 1. Non-buffer & empty buffer
    assert.equal(inspectGlbBuffer(null).valid, false);
    assert.equal(inspectGlbBuffer(Buffer.alloc(0)).valid, false);
    assert.equal(inspectGlbBuffer(Buffer.alloc(16)).valid, false);

    // 2. Wrong magic bytes
    const badMagic = buildMinimalValidGlbBuffer();
    badMagic.writeUInt32LE(0xdeadbeef, 0);
    const badMagicRes = inspectGlbBuffer(badMagic);
    assert.equal(badMagicRes.valid, false);
    assert.ok(badMagicRes.errors.some((e) => e.includes('Invalid GLB magic header')));

    // 3. Wrong version
    const badVer = buildMinimalValidGlbBuffer();
    badVer.writeUInt32LE(1, 4);
    const badVerRes = inspectGlbBuffer(badVer);
    assert.equal(badVerRes.valid, false);
    assert.ok(badVerRes.errors.some((e) => e.includes('Unsupported GLB container version')));

    // 4. Declared byte length mismatch
    const badLen = buildMinimalValidGlbBuffer();
    badLen.writeUInt32LE(badLen.byteLength + 12, 8);
    const badLenRes = inspectGlbBuffer(badLen);
    assert.equal(badLenRes.valid, false);
    assert.ok(badLenRes.errors.some((e) => e.includes('declared length')));

    // 5. Chunk 0 wrong chunk type
    const badChunk0Type = buildMinimalValidGlbBuffer();
    badChunk0Type.writeUInt32LE(GLB_CHUNK_TYPE_BIN, 16);
    const badChunk0Res = inspectGlbBuffer(badChunk0Type);
    assert.equal(badChunk0Res.valid, false);
    assert.ok(badChunk0Res.errors.some((e) => e.includes('Chunk 0 must have type JSON')));

    // 6. Chunk 0 NUL byte padding
    const nulPadded = buildMinimalValidGlbBuffer();
    const jsonLen = nulPadded.readUInt32LE(12);
    nulPadded[20 + jsonLen - 1] = 0x00;
    const nulRes = inspectGlbBuffer(nulPadded);
    assert.equal(nulRes.valid, false);
    assert.ok(nulRes.errors.some((e) => e.includes('forbidden NUL (0x00) padding bytes')));

    // 7. Trailing extra bytes after BIN chunk
    const validBuf = buildMinimalValidGlbBuffer();
    const trailingBuf = Buffer.concat([validBuf, Buffer.from([1, 2, 3, 4])]);
    trailingBuf.writeUInt32LE(trailingBuf.byteLength, 8);
    const trailingRes = inspectGlbBuffer(trailingBuf);
    assert.equal(trailingRes.valid, false);
    assert.ok(trailingRes.errors.some((e) => e.includes('Unexpected trailing bytes after Chunk 1')));
  });

  test('Scenario 3: Scene hierarchy, buffer/accessor bounds, undeclared extensions, and URI traversal checks catch structural violations', () => {
    // 1. Node cycle detection (0 -> 1 -> 0)
    const cycleGlb = buildMinimalValidGlbBuffer({
      customGltfPatch: (gltf) => {
        gltf.scenes = [{ nodes: [0] }];
        gltf.nodes = [
          { name: 'NodeA', children: [1] },
          { name: 'NodeB', children: [0] },
        ];
      },
    });
    const cycleRes = inspectGlbBuffer(cycleGlb);
    assert.equal(cycleRes.valid, false);
    assert.ok(cycleRes.errors.some((e) => e.includes('Cycle detected in glTF node hierarchy')));

    // 2. Multi-parent node violation (both Node0 and Node1 list Node2 as child)
    const multiParentGlb = buildMinimalValidGlbBuffer({
      customGltfPatch: (gltf) => {
        gltf.scenes = [{ nodes: [0, 1] }];
        gltf.nodes = [
          { name: 'ParentA', children: [2] },
          { name: 'ParentB', children: [2] },
          { name: 'SharedChild', mesh: 0 },
        ];
      },
    });
    const multiParentRes = inspectGlbBuffer(multiParentGlb);
    assert.equal(multiParentRes.valid, false);
    assert.ok(multiParentRes.errors.some((e) => e.includes('has multiple parents')));

    // 3. Node defining both matrix and TRS properties
    const matrixTrsGlb = buildMinimalValidGlbBuffer({
      customGltfPatch: (gltf) => {
        gltf.nodes[0].matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        gltf.nodes[0].scale = [2, 2, 2];
      },
    });
    const matrixTrsRes = inspectGlbBuffer(matrixTrsGlb);
    assert.equal(matrixTrsRes.valid, false);
    assert.ok(matrixTrsRes.errors.some((e) => e.includes("specifies both 'matrix' and TRS")));

    // 4. Undeclared extension in material and missing extensionsUsed entry for extensionsRequired
    const undeclaredExtGlb = buildMinimalValidGlbBuffer({
      customGltfPatch: (gltf) => {
        gltf.extensionsUsed = [];
        gltf.extensionsRequired = ['KHR_draco_mesh_compression'];
        gltf.materials = [
          {
            name: 'UnlitMat',
            extensions: { KHR_materials_unlit: {} },
          },
        ];
      },
    });
    const undeclaredExtRes = inspectGlbBuffer(undeclaredExtGlb);
    assert.equal(undeclaredExtRes.valid, false);
    assert.ok(undeclaredExtRes.errors.some((e) => e.includes('missing from extensionsUsed')));
    assert.ok(
      undeclaredExtRes.errors.some((e) =>
        e.includes("Extension 'KHR_materials_unlit' is used in the glTF JSON payload"),
      ),
    );

    // 5. Secondary buffer missing uri and unsafe path traversal in image uri
    const unsafeUriGlb = buildMinimalValidGlbBuffer({
      customGltfPatch: (gltf) => {
        gltf.buffers.push({ byteLength: 64 }); // buffers[1] without uri
        gltf.images = [{ uri: '../../etc/passwd' }];
      },
    });
    const unsafeUriRes = inspectGlbBuffer(unsafeUriGlb);
    assert.equal(unsafeUriRes.valid, false);
    assert.ok(unsafeUriRes.errors.some((e) => e.includes("buffers[1] omits 'uri'")));
    assert.ok(unsafeUriRes.errors.some((e) => e.includes('unsafe path traversal')));

    // 6. Accessor byteStride smaller than elementSize and non-scalar primitive indices
    const badAccessorGlb = buildMinimalValidGlbBuffer({
      customGltfPatch: (gltf) => {
        gltf.bufferViews[0].byteStride = 8; // VEC3 FLOAT is 12 bytes, so byteStride 8 < 12
        gltf.meshes[0].primitives[0].indices = 0; // accessor 0 is VEC3, not SCALAR
      },
    });
    const badAccessorRes = inspectGlbBuffer(badAccessorGlb);
    assert.equal(badAccessorRes.valid, false);
    assert.ok(badAccessorRes.errors.some((e) => e.includes('exceeds bufferViews[0].byteStride')));
    assert.ok(badAccessorRes.errors.some((e) => e.includes("must have type 'SCALAR'")));
  });

  test('Scenario 4: Handoff manifest schema and semantic validator enforce truth-state taxonomy, synthetic fixture boundaries, and release eligibility', () => {
    const richBuf = buildRichSyntheticGlbBuffer();
    const inspection = inspectGlbBuffer(richBuf, { strictPositionBounds: true });
    const validManifest = buildGlbWebHandoffManifestFromInspection(inspection, {
      filename: 'synthetic-shoe.glb',
      targetViewerStack: 'react-three-fiber',
      sourceKind: 'synthetic_fixture',
      isSyntheticFixture: true,
    });

    // Validate with both built-in validator and Ajv2020
    const builtInRes = validateGlbWebHandoffManifest(validManifest);
    assert.equal(builtInRes.valid, true, `Expected valid manifest, got: ${builtInRes.errors.join('; ')}`);
    const ajvOk = ajvValidateManifest(validManifest);
    assert.equal(ajvOk, true, `Ajv2020 validation errors: ${JSON.stringify(ajvValidateManifest.errors)}`);

    // 1. Reject Artifact status: Not Run
    const badArtifactNotRun = structuredClone(validManifest);
    badArtifactNotRun.truthStates.artifactStatus = 'Not Run';
    const res1 = validateGlbWebHandoffManifest(badArtifactNotRun);
    assert.equal(res1.valid, false);
    assert.ok(res1.errors.some((e) => e.includes("artifactStatus cannot be 'Not Run'")));

    // 2. Reject Runtime status: Not Produced
    const badRuntimeNotProduced = structuredClone(validManifest);
    badRuntimeNotProduced.truthStates.runtimeStatus = 'Not Produced';
    const res2 = validateGlbWebHandoffManifest(badRuntimeNotProduced);
    assert.equal(res2.valid, false);
    assert.ok(res2.errors.some((e) => e.includes("runtimeStatus cannot be 'Not Produced'")));

    // 3. Reject synthetic fixture claiming Produced, Verified, or release-eligible
    const badSyntheticProduced = structuredClone(validManifest);
    badSyntheticProduced.truthStates.artifactStatus = 'Produced';
    badSyntheticProduced.truthStates.releaseEligibility = 'release-eligible';
    const res3 = validateGlbWebHandoffManifest(badSyntheticProduced);
    assert.equal(res3.valid, false);
    assert.ok(res3.errors.some((e) => e.includes('Synthetic fixture boundary violation')));

    // 4. Reject Path 2 (path-2-community) claiming release-eligible
    const badPath2Release = structuredClone(validManifest);
    badPath2Release.artifact.provenance.isSyntheticFixture = false;
    badPath2Release.artifact.provenance.sourceKind = 'blender_runtime_export';
    badPath2Release.truthStates.runtimePath = 'path-2-community';
    badPath2Release.truthStates.runtimeStatus = 'Produced';
    badPath2Release.truthStates.artifactStatus = 'Produced';
    badPath2Release.truthStates.releaseEligibility = 'release-eligible';
    const res4 = validateGlbWebHandoffManifest(badPath2Release);
    assert.equal(res4.valid, false);
    assert.ok(res4.errors.some((e) => e.includes('path-2-community')));

    // 5. Reject Produced/Verified without currentRunProvenanceVerified
    const badUnverifiedProvenance = structuredClone(validManifest);
    badUnverifiedProvenance.artifact.provenance.isSyntheticFixture = false;
    badUnverifiedProvenance.artifact.provenance.sourceKind = 'user_supplied';
    badUnverifiedProvenance.artifact.provenance.currentRunProvenanceVerified = false;
    badUnverifiedProvenance.truthStates.runtimePath = 'path-1-official';
    badUnverifiedProvenance.truthStates.runtimeStatus = 'Produced';
    badUnverifiedProvenance.truthStates.artifactStatus = 'Produced';
    const res5 = validateGlbWebHandoffManifest(badUnverifiedProvenance);
    assert.equal(res5.valid, false);
    assert.ok(res5.errors.some((e) => e.includes('currentRunProvenanceVerified === true')));

    // 6. Reject undeclared Draco decoder requirement when KHR_draco_mesh_compression is used
    const badDracoFlag = structuredClone(validManifest);
    badDracoFlag.extensionsAndCompression.compression.draco.decoderRequired = false;
    const res6 = validateGlbWebHandoffManifest(badDracoFlag);
    assert.equal(res6.valid, false);
    assert.ok(res6.errors.some((e) => e.includes('KHR_draco_mesh_compression is present')));
  });

  test('Scenario 5: Report generator writes deterministic JSON, HTML, and Markdown artifacts, escapes HTML safely, and never mutates the input GLB', async () => {
    // Create a GLB with special HTML characters in node/material/animation names to verify XSS escaping
    const xssGlb = buildMinimalValidGlbBuffer({
      customGltfPatch: (gltf) => {
        gltf.scenes[0].name = 'Scene <script>alert("xss")</script>';
        gltf.nodes[0].name = 'Node <img src=x onerror=alert(1)>';
        gltf.meshes[0].name = 'Mesh "quoted" & <tag>';
        gltf.materials = [{ name: 'Mat </script><script>evil()</script>' }];
      },
    });
    const glbFile = path.join(suiteTmpDir, 'xss-check-fixture.glb');
    fs.writeFileSync(glbFile, xssGlb);
    const originalSha = sha256File(glbFile);

    const outDir = path.join(suiteTmpDir, 'handoff-report-out');
    const result = await generateGlbHandoffReportFromFile(glbFile, {
      outDir,
      targetViewerStack: 'react-three-fiber',
      sourceKind: 'synthetic_fixture',
      isSyntheticFixture: true,
      strictPositionBounds: true,
    });

    assert.equal(result.ok, true);
    assert.equal(sha256File(glbFile), originalSha, 'Input GLB file must remain byte-for-byte unchanged');
    assert.ok(fs.existsSync(result.writtenFiles.manifestPath));
    assert.ok(fs.existsSync(result.writtenFiles.jsonReportPath));
    assert.ok(fs.existsSync(result.writtenFiles.htmlReportPath));
    assert.ok(fs.existsSync(result.writtenFiles.markdownPath));

    // Verify HTML report escapes dangerous tags and includes truth-state disclaimers
    const html = fs.readFileSync(result.writtenFiles.htmlReportPath, 'utf8');
    assert.ok(!html.includes('<script>evil()</script>'), 'HTML report must escape raw <script> tags');
    assert.ok(!html.includes('<img src=x onerror=alert(1)>'), 'HTML report must escape raw <img> tags');
    assert.ok(html.includes('Mesh &quot;quoted&quot; &amp; &lt;tag&gt;'));
    assert.ok(html.includes('Mat &lt;/script&gt;&lt;script&gt;evil()&lt;/script&gt;'));
    assert.ok(html.includes('Not Run'));
    assert.ok(html.includes('Not Produced'));
    assert.ok(html.includes(escapeHtml(CONTAINER_TRUTH_DISCLAIMER)));

    // Verify Markdown report includes required truth states and 4-tier validation summary
    const md = fs.readFileSync(result.writtenFiles.markdownPath, 'utf8');
    assert.match(md, /Runtime status:\*\* `Not Run`/);
    assert.match(md, /Artifact status:\*\* `Not Produced`/);
    assert.match(md, /Tier 1 — Container Structural Inspection/);
    assert.match(md, /Tier 2 — Khronos glTF 2\.0 Specification/);
    assert.match(md, /Tier 3 — Visual Quality Validation/);
    assert.match(md, /Tier 4 — Live Blender Runtime Execution/);
  });

  test('Scenario 6: Output directory path safety rejects root, home, temp root, symlinks, protected repo paths, and input GLB collisions', () => {
    const sampleGlb = path.join(suiteTmpDir, 'sample-path-guard.glb');
    fs.writeFileSync(sampleGlb, buildMinimalValidGlbBuffer());

    // 1. Filesystem root
    const fsRoot = path.parse(ROOT).root;
    assert.throws(
      () => validateSafeReportOutputDir(fsRoot, { repoRoot: ROOT }),
      /filesystem root is forbidden/,
    );

    // 2. Home directory
    assert.throws(
      () => validateSafeReportOutputDir('~', { repoRoot: ROOT }),
      /home directory/,
    );
    assert.throws(
      () => validateSafeReportOutputDir('~/glb-out', { repoRoot: ROOT }),
      /home directory/,
    );

    // 3. OS temp root itself
    assert.throws(
      () => validateSafeReportOutputDir(os.tmpdir(), { repoRoot: ROOT }),
      /OS temp root itself is forbidden/,
    );

    // 4. Repository root and protected subdirectories
    assert.throws(
      () => validateSafeReportOutputDir(ROOT, { repoRoot: ROOT }),
      /directly into repository root/,
    );
    for (const protectedSub of ['skills', 'laws', 'packs', 'scripts', 'schemas', 'docs', '.git']) {
      assert.throws(
        () => validateSafeReportOutputDir(path.join(ROOT, protectedSub, 'out'), { repoRoot: ROOT }),
        /protected BlendOps repository directory/,
      );
    }

    // 5. Collision with input GLB file path
    assert.throws(
      () => validateSafeReportOutputDir(sampleGlb, { repoRoot: ROOT, inputGlbPath: sampleGlb }),
      /not a directory|collides with the input GLB/,
    );

    // 6. Symbolic link output directory rejection
    const realTargetDir = path.join(suiteTmpDir, 'real-target-dir');
    const symlinkOutDir = path.join(suiteTmpDir, 'symlink-out-dir');
    fs.mkdirSync(realTargetDir, { recursive: true });
    let symlinkCreated = false;
    try {
      fs.symlinkSync(
        realTargetDir,
        symlinkOutDir,
        process.platform === 'win32' ? 'junction' : 'dir',
      );
      symlinkCreated = true;
    } catch {
      symlinkCreated = false;
    }
    if (symlinkCreated) {
      assert.throws(
        () => validateSafeReportOutputDir(symlinkOutDir, { repoRoot: ROOT }),
        /Refusing symbolic link/,
      );
    }
  });

  test('Scenario 7: Three.js and React Three Fiber integration modules wire decoders, camera framing, animation clips, and disposal deterministically', async () => {
    const richBuf = buildRichSyntheticGlbBuffer();
    const bundle = generateGlbHandoffReportFromBufferSync(richBuf, {
      filename: 'cyberpunk-shoe.glb',
      targetViewerStack: 'react-three-fiber',
      sourceKind: 'synthetic_fixture',
      isSyntheticFixture: true,
      strictPositionBounds: true,
    });

    // 1. Verify generated Three.js and React Three Fiber snippets include required decoders for rich GLB
    assert.match(bundle.snippets.threejs, /DRACOLoader/);
    assert.match(bundle.snippets.threejs, /MeshoptDecoder/);
    assert.match(bundle.snippets.threejs, /KTX2Loader/);
    assert.match(bundle.snippets.threejs, /AnimationMixer/);
    assert.match(bundle.snippets.reactThreeFiber, /useGLTF/);
    assert.match(bundle.snippets.reactThreeFiber, /useAnimations/);

    // 2. Test threejs-glb-viewer.mjs pure helpers and full lifecycle with injected Three.js doubles
    const viewerCfg = resolveViewerManifestConfig({
      assetUrl: '/models/cyberpunk-shoe.glb',
      requiresDraco: true,
      requiresMeshopt: true,
      requiresKtx2: true,
      spatial: {
        estimatedBounds: {
          available: true,
          min: [-0.5, 0, -0.5],
          max: [0.5, 1.0, 0.5],
        },
      },
      animations: {
        clips: [{ name: 'TurntableSpin', durationSeconds: 2.5 }],
      },
    });
    assert.equal(viewerCfg.requiresDraco, true);
    assert.equal(viewerCfg.requiresMeshopt, true);
    assert.equal(viewerCfg.requiresKtx2, true);
    assert.equal(viewerCfg.defaultClip, 'TurntableSpin');

    const decoderCfg = resolveDecoderConfiguration(viewerCfg);
    assert.equal(decoderCfg.requiresDraco, true);
    assert.equal(decoderCfg.requiresMeshopt, true);
    assert.equal(decoderCfg.requiresKtx2, true);
    assert.ok(decoderCfg.requiredAddons.includes('three/addons/loaders/DRACOLoader.js'));
    assert.ok(decoderCfg.requiredAddons.includes('three/addons/loaders/KTX2Loader.js'));

    const framing = computeCameraFramingParameters({ min: [-1, 0, -1], max: [1, 2, 1] }, { fovDeg: 45 });
    assert.deepEqual(framing.center, [0, 1, 0]);
    assert.deepEqual(framing.size, [2, 2, 2]);
    assert.equal(framing.maxDim, 2);
    assert.ok(framing.distance > 2);

    // Mock Three.js classes to exercise createThreeGlbViewer, loadAsset, stepFrame, resize, and disposeGltfScene
    let dracoDisposed = false;
    let ktx2Disposed = false;
    let geomDisposed = false;
    let matDisposed = false;
    let texDisposed = false;
    let rendererDisposed = false;

    const mockMeshScene = {
      traverse(cb) {
        cb({
          geometry: {
            dispose() {
              geomDisposed = true;
            },
          },
          material: {
            map: {
              isTexture: true,
              dispose() {
                texDisposed = true;
              },
            },
            dispose() {
              matDisposed = true;
            },
          },
        });
      },
    };

    const mockThreeModules = {
      THREE: {
        SRGBColorSpace: 'srgb',
        LinearSRGBColorSpace: 'srgb-linear',
        ACESFilmicToneMapping: 4,
        Scene: class {
          constructor() {
            this.children = [];
          }
          add(obj) {
            this.children.push(obj);
          }
          remove(obj) {
            this.children = this.children.filter((c) => c !== obj);
          }
        },
        PerspectiveCamera: class {
          constructor(fov, aspect, near, far) {
            this.fov = fov;
            this.aspect = aspect;
            this.near = near;
            this.far = far;
            this.position = {
              x: 0,
              y: 0,
              z: 0,
              set(x, y, z) {
                this.x = x;
                this.y = y;
                this.z = z;
              },
            };
          }
          updateProjectionMatrix() {}
          lookAt() {}
        },
        WebGLRenderer: class {
          constructor() {
            this.domElement = { parentNode: null };
          }
          setSize() {}
          render() {}
          dispose() {
            rendererDisposed = true;
          }
        },
        PMREMGenerator: class {
          fromScene() {
            return {
              texture: {},
              dispose() {},
            };
          }
          dispose() {}
        },
        AnimationMixer: class {
          clipAction() {
            return { play() {} };
          }
          update() {}
          stopAllAction() {}
        },
      },
      OrbitControls: class {
        constructor() {
          this.target = { set() {} };
        }
        update() {}
        dispose() {}
      },
      RoomEnvironment: class {
        dispose() {}
      },
      DRACOLoader: class {
        setDecoderPath() {}
        dispose() {
          dracoDisposed = true;
        }
      },
      KTX2Loader: class {
        setTranscoderPath() {}
        detectSupport() {}
        dispose() {
          ktx2Disposed = true;
        }
      },
      MeshoptDecoder: { supported: true },
      GLTFLoader: class {
        setDRACOLoader(d) {
          this.draco = d;
        }
        setMeshoptDecoder(m) {
          this.meshopt = m;
        }
        setKTX2Loader(k) {
          this.ktx2 = k;
        }
        load(_url, onLoad, onProgress) {
          if (onProgress) onProgress({ loaded: 50, total: 100 });
          onLoad({
            scene: mockMeshScene,
            animations: [{ name: 'TurntableSpin', duration: 2.5, tracks: [{}, {}] }],
          });
        }
      },
    };

    const mockContainer = {
      clientWidth: 1024,
      clientHeight: 768,
      appendChild(el) {
        el.parentNode = this;
      },
      removeChild(el) {
        el.parentNode = null;
      },
    };

    let progressReported = null;
    const viewer = await createThreeGlbViewer({
      container: mockContainer,
      manifest: viewerCfg,
      threeModules: mockThreeModules,
      onProgress: (p) => {
        progressReported = p;
      },
    });

    const loaded = await viewer.loadAsset();
    assert.equal(progressReported?.ratio, 0.5);
    assert.equal(loaded.animations.length, 1);
    assert.equal(loaded.animations[0].name, 'TurntableSpin');
    assert.equal(loaded.animations[0].trackCount, 2);

    viewer.resize();
    viewer.stepFrame(1 / 60);
    const disposeResult = viewer.dispose();
    assert.equal(disposeResult.alreadyDisposed, false);
    assert.equal(disposeResult.geometriesDisposed, 1);
    assert.equal(disposeResult.materialsDisposed, 1);
    assert.equal(disposeResult.texturesDisposed, 1);
    assert.equal(dracoDisposed, true);
    assert.equal(ktx2Disposed, true);
    assert.equal(geomDisposed, true);
    assert.equal(matDisposed, true);
    assert.equal(texDisposed, true);
    assert.equal(rendererDisposed, true);

    // 3. Verify React Three Fiber example file structure and exported symbols
    const r3fSource = fs.readFileSync(
      path.join(ROOT, 'docs', 'examples', 'glb-web-handoff', 'r3f-glb-viewer.tsx'),
      'utf8',
    );
    assert.match(r3fSource, /export class GlbViewerErrorBoundary/);
    assert.match(r3fSource, /export const BlendOpsGlbModel/);
    assert.match(r3fSource, /export function BlendOpsGlbViewerCanvas/);
    assert.match(r3fSource, /useGLTF\.clear/);
  });

  test('Scenario 8: CLI subcommands (glb-inspect, glb-handoff, glb-validate-manifest) work via bin/blendops.mjs and installed npm pack tarball while preserving installer modes', () => {
    const cliEntry = path.join(ROOT, 'bin', 'blendops.mjs');
    const fixtureGlb = path.join(suiteTmpDir, 'cli-fixture.glb');
    fs.writeFileSync(fixtureGlb, buildRichSyntheticGlbBuffer());
    const fixtureSha = sha256File(fixtureGlb);

    // 1. blendops glb-inspect (Markdown and --json)
    const inspectMd = execFileSync(process.execPath, [cliEntry, 'glb-inspect', fixtureGlb], {
      cwd: suiteTmpDir,
      encoding: 'utf8',
    });
    assert.match(inspectMd, /## BlendOps GLB 2\.0 Structural Inspection Report/);
    assert.match(inspectMd, /Valid GLB 2\.0 container: Yes/);
    assert.match(inspectMd, /Runtime status: Not Run/);
    assert.match(inspectMd, /Artifact status: Not Produced/);

    const inspectJsonRaw = execFileSync(
      process.execPath,
      [cliEntry, 'glb-inspect', fixtureGlb, '--strict-bounds', '--json'],
      { cwd: suiteTmpDir, encoding: 'utf8' },
    );
    const inspectJson = JSON.parse(inspectJsonRaw);
    assert.equal(inspectJson.valid, true);
    assert.equal(inspectJson.sha256, fixtureSha);

    // 2. blendops glb-handoff with --out-dir and --synthetic
    const cliReportDir = path.join(suiteTmpDir, 'cli-handoff-out');
    const handoffMd = execFileSync(
      process.execPath,
      [
        cliEntry,
        'glb-handoff',
        fixtureGlb,
        '--out-dir',
        cliReportDir,
        '--viewer',
        'react-three-fiber',
        '--synthetic',
        '--strict-bounds',
      ],
      { cwd: suiteTmpDir, encoding: 'utf8' },
    );
    assert.match(handoffMd, /## BlendOps GLB Web Handoff Report/);
    assert.match(handoffMd, /Runtime status:\*\* `Not Run`/);
    assert.match(handoffMd, /Artifact status:\*\* `Not Produced`/);
    assert.match(handoffMd, /Written Handoff Report Files/);

    const manifestPath = path.join(cliReportDir, 'handoff-manifest.json');
    assert.ok(fs.existsSync(manifestPath));
    assert.ok(fs.existsSync(path.join(cliReportDir, 'handoff-report.html')));

    // 3. blendops glb-validate-manifest
    const validateOut = execFileSync(
      process.execPath,
      [cliEntry, 'glb-validate-manifest', manifestPath],
      { cwd: suiteTmpDir, encoding: 'utf8' },
    );
    assert.match(validateOut, /Schema & semantic validation: Passed/);
    assert.match(validateOut, /Runtime status: Not Run/);
    assert.match(validateOut, /Artifact status: Not Produced/);

    // 4. Verify non-zero exit code on invalid manifest or corrupt GLB
    const corruptGlb = path.join(suiteTmpDir, 'corrupt.glb');
    fs.writeFileSync(corruptGlb, Buffer.from('not-a-valid-glb-container'));
    const failedInspect = spawnSync(process.execPath, [cliEntry, 'glb-inspect', corruptGlb], {
      cwd: suiteTmpDir,
      encoding: 'utf8',
    });
    assert.equal(failedInspect.status, 1);
    assert.match(String(failedInspect.stderr || ''), /GLB structural inspection failed/);

    // 5. Verify packed npm tarball includes Phase 12 GLB toolkit and works in an isolated consumer project
    const packDir = path.join(suiteTmpDir, 'pack');
    const consumerDir = path.join(suiteTmpDir, 'consumer');
    fs.mkdirSync(packDir, { recursive: true });
    fs.mkdirSync(consumerDir, { recursive: true });
    fs.writeFileSync(
      path.join(consumerDir, 'package.json'),
      `${JSON.stringify({ name: 'phase12-consumer-test', version: '1.0.0', private: true }, null, 2)}\n`,
      'utf8',
    );

    const packJsonRaw = execNpmTool('npm', ['pack', '--pack-destination', packDir, '--json'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    const packMeta = JSON.parse(packJsonRaw)[0];
    const tarballPath = path.join(packDir, packMeta.filename);
    const packedFiles = new Set(packMeta.files.map((f) => f.path));
    assert.ok(packedFiles.has('scripts/inspect-glb.mjs'));
    assert.ok(packedFiles.has('scripts/generate-glb-handoff-report.mjs'));
    assert.ok(packedFiles.has('schemas/glb-web-handoff-manifest.schema.json'));
    assert.ok(packedFiles.has('docs/examples/glb-web-handoff/README.md'));
    assert.ok(packedFiles.has('docs/examples/glb-web-handoff/threejs-glb-viewer.mjs'));
    assert.ok(packedFiles.has('docs/examples/glb-web-handoff/r3f-glb-viewer.tsx'));

    execNpmTool(
      'npm',
      ['install', '--prefer-offline', '--no-audit', '--no-fund', tarballPath],
      { cwd: consumerDir, stdio: ['ignore', 'pipe', 'pipe'] },
    );

    const installedJs = path.join(consumerDir, 'node_modules', 'blendops', 'bin', 'blendops.mjs');
    const consumerReportOut = path.join(suiteTmpDir, 'consumer-handoff-out');
    const consumerHandoff = execFileSync(
      process.execPath,
      [installedJs, 'glb-handoff', fixtureGlb, '--out-dir', consumerReportOut, '--synthetic'],
      { cwd: consumerDir, encoding: 'utf8' },
    );
    assert.match(consumerHandoff, /## BlendOps GLB Web Handoff Report/);
    assert.ok(fs.existsSync(path.join(consumerReportOut, 'handoff-manifest.json')));

    // 6. Verify existing installer lifecycle (doctor -> install --dry-run -> install --write -> rollback) still works cleanly
    const targetProj = path.join(suiteTmpDir, 'regression-project');
    const planDir = path.join(suiteTmpDir, 'regression-plans');
    fs.mkdirSync(targetProj, { recursive: true });
    const env = { ...process.env, BLENDOPS_INSTALLER_PLAN_DIR: planDir };

    execFileSync(
      process.execPath,
      [installedJs, 'install', '--target', 'generic-project', '--project', targetProj, '--dry-run'],
      { cwd: consumerDir, env, encoding: 'utf8' },
    );
    execFileSync(
      process.execPath,
      [installedJs, 'install', '--target', 'generic-project', '--project', targetProj, '--write'],
      { cwd: consumerDir, env, encoding: 'utf8' },
    );
    assert.ok(fs.existsSync(path.join(targetProj, 'BLENDOPS.md')));
    execFileSync(
      process.execPath,
      [installedJs, 'rollback', '--project', targetProj],
      { cwd: consumerDir, env, encoding: 'utf8' },
    );
    assert.deepEqual(fs.readdirSync(targetProj), []);
  });
});
