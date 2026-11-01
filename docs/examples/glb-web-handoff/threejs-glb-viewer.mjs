/**
 * BlendOps Phase 12 — Reusable Three.js GLB Web Handoff Integration Module
 *
 * Provides a production-ready, deterministic Three.js GLB viewer harness and
 * helper utilities aligned with `schemas/glb-web-handoff-manifest.schema.json`
 * and `skills/glb-web-handoff/SKILL.md`.
 *
 * Truth-State Boundary:
 * - This module is a consumer-side web integration harness for Three.js (`r150+`).
 * - It does not run Blender or claim live Blender runtime execution (`Runtime status: Not Run`).
 * - Structural GLB validity (`inspect-glb.mjs`) does not prove visual rendering quality (`Tier 3`).
 */

export const DEFAULT_DECODER_PATHS = Object.freeze({
  dracoGltfPath: '/decoders/draco/gltf/',
  basisTranscoderPath: '/decoders/basis/',
});

export const SUPPORTED_COLOR_SPACES = Object.freeze(['srgb', 'srgb-linear', 'display-p3']);

/**
 * Normalizes a BlendOps GLB web handoff manifest (or partial options) into a
 * deterministic viewer configuration object.
 *
 * @param {object} [manifestOrOptions]
 * @returns {object}
 */
export function resolveViewerManifestConfig(manifestOrOptions = {}) {
  const manifest = manifestOrOptions && typeof manifestOrOptions === 'object' ? manifestOrOptions : {};
  const artifact = manifest.artifact && typeof manifest.artifact === 'object' ? manifest.artifact : {};
  const compression = manifest.compression && typeof manifest.compression === 'object' ? manifest.compression : {};
  const spatial = manifest.spatial && typeof manifest.spatial === 'object' ? manifest.spatial : {};
  const viewer = manifest.viewer && typeof manifest.viewer === 'object' ? manifest.viewer : {};
  const animations = manifest.animations && typeof manifest.animations === 'object' ? manifest.animations : {};

  const assetUrl =
    typeof manifest.assetUrl === 'string' && manifest.assetUrl.trim().length > 0
      ? manifest.assetUrl.trim()
      : `/models/${artifact.fileName || 'asset.glb'}`;

  const requiresDraco = Boolean(compression.draco ?? manifest.requiresDraco);
  const requiresMeshopt = Boolean(compression.meshopt ?? manifest.requiresMeshopt);
  const requiresKtx2 = Boolean(compression.ktx2BasisU ?? manifest.requiresKtx2);
  const requiresWebP = Boolean(compression.webp ?? manifest.requiresWebP);

  const outputColorSpace = SUPPORTED_COLOR_SPACES.includes(viewer.outputColorSpace)
    ? viewer.outputColorSpace
    : 'srgb';

  const toneMapping =
    typeof viewer.toneMapping === 'string' && viewer.toneMapping.length > 0
      ? viewer.toneMapping
      : 'ACESFilmicToneMapping';

  const clipNames = Array.isArray(animations.clips)
    ? animations.clips.map((c) => (typeof c === 'string' ? c : c?.name)).filter(Boolean)
    : [];

  return {
    assetUrl,
    fileName: artifact.fileName || 'asset.glb',
    sha256: artifact.sha256 || null,
    byteSize: Number.isInteger(artifact.byteSize) ? artifact.byteSize : null,
    coordinateSystem: spatial.coordinateSystem || '+Y up, +Z forward, -X right (glTF 2.0 meters)',
    unitScaleMetersPerUnit:
      typeof spatial.unitScaleMetersPerUnit === 'number' && spatial.unitScaleMetersPerUnit > 0
        ? spatial.unitScaleMetersPerUnit
        : 1.0,
    originPlacement: spatial.originPlacement || 'unspecified',
    estimatedBounds: spatial.estimatedBounds || {
      available: false,
      min: null,
      max: null,
      size: null,
      center: null,
      maxDimensionMeters: null,
    },
    hasNonIdentityRootScale: Boolean(spatial.hasNonIdentityRootScale),
    hasNegativeScale: Boolean(spatial.hasNegativeScale),
    requiresDraco,
    requiresMeshopt,
    requiresKtx2,
    requiresWebP,
    outputColorSpace,
    toneMapping,
    environmentPreset: viewer.environmentPreset || 'RoomEnvironment',
    autoCenterCamera: viewer.autoCenterCamera !== false,
    animationClips: clipNames,
    defaultClip: clipNames[0] || null,
  };
}

/**
 * Determines which decoders must be attached to `GLTFLoader` for a given manifest
 * or decoder flags.
 *
 * @param {object} configOrManifest
 * @param {object} [decoderPaths]
 * @returns {object}
 */
export function resolveDecoderConfiguration(configOrManifest = {}, decoderPaths = {}) {
  const cfg =
    'requiresDraco' in configOrManifest && 'assetUrl' in configOrManifest
      ? configOrManifest
      : resolveViewerManifestConfig(configOrManifest);

  const dracoGltfPath = decoderPaths.dracoGltfPath || DEFAULT_DECODER_PATHS.dracoGltfPath;
  const basisTranscoderPath =
    decoderPaths.basisTranscoderPath || DEFAULT_DECODER_PATHS.basisTranscoderPath;

  return {
    requiresDraco: Boolean(cfg.requiresDraco),
    requiresMeshopt: Boolean(cfg.requiresMeshopt),
    requiresKtx2: Boolean(cfg.requiresKtx2),
    requiresWebP: Boolean(cfg.requiresWebP),
    dracoGltfPath,
    basisTranscoderPath,
    requiredAddons: [
      'three/addons/loaders/GLTFLoader.js',
      ...(cfg.requiresDraco ? ['three/addons/loaders/DRACOLoader.js'] : []),
      ...(cfg.requiresMeshopt ? ['three/addons/libs/meshopt_decoder.module.js'] : []),
      ...(cfg.requiresKtx2 ? ['three/addons/loaders/KTX2Loader.js'] : []),
    ],
  };
}

/**
 * Computes deterministic perspective camera framing parameters from a 3D bounding box
 * (`min` and `max` [x, y, z] arrays) and field-of-view.
 *
 * @param {{ min: number[], max: number[] }} bounds
 * @param {{ fovDeg?: number, paddingFactor?: number, aspect?: number }} [options]
 * @returns {{ center: [number, number, number], size: [number, number, number], maxDim: number, distance: number, position: [number, number, number], near: number, far: number }}
 */
export function computeCameraFramingParameters(bounds, options = {}) {
  if (
    !bounds ||
    !Array.isArray(bounds.min) ||
    !Array.isArray(bounds.max) ||
    bounds.min.length < 3 ||
    bounds.max.length < 3
  ) {
    throw new TypeError('computeCameraFramingParameters requires bounds.min and bounds.max [x, y, z] arrays');
  }

  const fovDeg = typeof options.fovDeg === 'number' && options.fovDeg > 0 ? options.fovDeg : 45;
  const paddingFactor =
    typeof options.paddingFactor === 'number' && options.paddingFactor > 0
      ? options.paddingFactor
      : 1.45;

  const size = [
    Math.max(0, Number(bounds.max[0]) - Number(bounds.min[0])),
    Math.max(0, Number(bounds.max[1]) - Number(bounds.min[1])),
    Math.max(0, Number(bounds.max[2]) - Number(bounds.min[2])),
  ];
  const center = [
    (Number(bounds.min[0]) + Number(bounds.max[0])) / 2,
    (Number(bounds.min[1]) + Number(bounds.max[1])) / 2,
    (Number(bounds.min[2]) + Number(bounds.max[2])) / 2,
  ];

  const rawMaxDim = Math.max(size[0], size[1], size[2]);
  const maxDim = Number.isFinite(rawMaxDim) && rawMaxDim > 0 ? rawMaxDim : 1.0;
  const fovRad = (fovDeg * Math.PI) / 180;
  const halfFovTan = Math.tan(fovRad / 2);
  const distance = Math.max((maxDim / (2 * halfFovTan)) * paddingFactor, 0.25);

  const position = [
    Number((center[0] + distance * 0.65).toFixed(6)),
    Number((center[1] + distance * 0.45).toFixed(6)),
    Number((center[2] + distance).toFixed(6)),
  ];

  const near = Number(Math.max(maxDim / 1000, 0.001).toFixed(6));
  const far = Number(Math.max(maxDim * 100, distance * 20, 100).toFixed(6));

  return {
    center: [
      Number(center[0].toFixed(6)),
      Number(center[1].toFixed(6)),
      Number(center[2].toFixed(6)),
    ],
    size: [
      Number(size[0].toFixed(6)),
      Number(size[1].toFixed(6)),
      Number(size[2].toFixed(6)),
    ],
    maxDim: Number(maxDim.toFixed(6)),
    distance: Number(distance.toFixed(6)),
    position,
    near,
    far,
  };
}

/**
 * Configures a Three.js `GLTFLoader` instance with optional Draco, Meshopt, and KTX2
 * decoders based on the GLB web handoff manifest.
 *
 * @param {object} loader - Instance of `GLTFLoader`
 * @param {object} options
 * @param {object} [options.manifest] - BlendOps GLB handoff manifest
 * @param {object} [options.renderer] - Instance of `THREE.WebGLRenderer` (required if KTX2 is enabled)
 * @param {Function} [options.DRACOLoader] - `DRACOLoader` constructor
 * @param {Function} [options.KTX2Loader] - `KTX2Loader` constructor
 * @param {object} [options.MeshoptDecoder] - `MeshoptDecoder` object
 * @param {object} [options.decoderPaths] - Custom paths for Draco/Basis transcoders
 * @returns {{ decoderConfig: object, dracoLoader: object|null, ktx2Loader: object|null, disposeDecoders: () => void }}
 */
export function configureGltfDecoders(loader, options = {}) {
  if (!loader || typeof loader !== 'object') {
    throw new TypeError('configureGltfDecoders requires a valid GLTFLoader instance');
  }

  const decoderConfig = resolveDecoderConfiguration(
    options.manifest || options,
    options.decoderPaths || {},
  );

  let dracoLoader = null;
  let ktx2Loader = null;

  if (decoderConfig.requiresDraco) {
    if (typeof options.DRACOLoader !== 'function') {
      throw new Error(
        'GLB requires KHR_draco_mesh_compression, but options.DRACOLoader constructor was not provided.',
      );
    }
    if (typeof loader.setDRACOLoader !== 'function') {
      throw new Error('Provided GLTFLoader does not support setDRACOLoader().');
    }
    dracoLoader = new options.DRACOLoader();
    if (typeof dracoLoader.setDecoderPath === 'function') {
      dracoLoader.setDecoderPath(decoderConfig.dracoGltfPath);
    }
    loader.setDRACOLoader(dracoLoader);
  }

  if (decoderConfig.requiresMeshopt) {
    if (!options.MeshoptDecoder) {
      throw new Error(
        'GLB requires EXT_meshopt_compression, but options.MeshoptDecoder was not provided.',
      );
    }
    if (typeof loader.setMeshoptDecoder !== 'function') {
      throw new Error('Provided GLTFLoader does not support setMeshoptDecoder().');
    }
    loader.setMeshoptDecoder(options.MeshoptDecoder);
  }

  if (decoderConfig.requiresKtx2) {
    if (typeof options.KTX2Loader !== 'function') {
      throw new Error(
        'GLB requires KHR_texture_basisu, but options.KTX2Loader constructor was not provided.',
      );
    }
    if (!options.renderer) {
      throw new Error(
        'GLB requires KHR_texture_basisu, which requires options.renderer (WebGLRenderer) for KTX2Loader.detectSupport(renderer).',
      );
    }
    if (typeof loader.setKTX2Loader !== 'function') {
      throw new Error('Provided GLTFLoader does not support setKTX2Loader().');
    }
    ktx2Loader = new options.KTX2Loader();
    if (typeof ktx2Loader.setTranscoderPath === 'function') {
      ktx2Loader.setTranscoderPath(decoderConfig.basisTranscoderPath);
    }
    if (typeof ktx2Loader.detectSupport === 'function') {
      ktx2Loader.detectSupport(options.renderer);
    }
    loader.setKTX2Loader(ktx2Loader);
  }

  return {
    decoderConfig,
    dracoLoader,
    ktx2Loader,
    disposeDecoders() {
      if (dracoLoader && typeof dracoLoader.dispose === 'function') {
        dracoLoader.dispose();
      }
      if (ktx2Loader && typeof ktx2Loader.dispose === 'function') {
        ktx2Loader.dispose();
      }
    },
  };
}

/**
 * Frames a Three.js `PerspectiveCamera` and optional `OrbitControls` around a loaded
 * root `Object3D` or explicit bounding box.
 *
 * @param {object} params
 * @param {object} params.camera - `THREE.PerspectiveCamera`
 * @param {object} [params.controls] - `OrbitControls`
 * @param {object} [params.rootObject] - Loaded `gltf.scene` (`THREE.Object3D`)
 * @param {object} [params.THREE] - Three.js namespace (used if computing Box3 from `rootObject`)
 * @param {{ min: number[], max: number[] }} [params.bounds] - Explicit bounds fallback
 * @param {number} [params.paddingFactor]
 * @returns {object} Computed framing parameters
 */
export function frameCameraToBoundingBox({
  camera,
  controls = null,
  rootObject = null,
  THREE = null,
  bounds = null,
  paddingFactor = 1.45,
}) {
  if (!camera || typeof camera !== 'object') {
    throw new TypeError('frameCameraToBoundingBox requires a camera instance');
  }

  let resolvedBounds = bounds;
  if (!resolvedBounds && rootObject && THREE && typeof THREE.Box3 === 'function') {
    const box = new THREE.Box3().setFromObject(rootObject);
    if (box.min && box.max) {
      resolvedBounds = {
        min: [box.min.x, box.min.y, box.min.z],
        max: [box.max.x, box.max.y, box.max.z],
      };
    }
  }

  if (!resolvedBounds) {
    resolvedBounds = {
      min: [-0.5, 0, -0.5],
      max: [0.5, 1.0, 0.5],
    };
  }

  const framing = computeCameraFramingParameters(resolvedBounds, {
    fovDeg: typeof camera.fov === 'number' ? camera.fov : 45,
    paddingFactor,
  });

  if (camera.position && typeof camera.position.set === 'function') {
    camera.position.set(framing.position[0], framing.position[1], framing.position[2]);
  }
  camera.near = framing.near;
  camera.far = framing.far;
  if (typeof camera.updateProjectionMatrix === 'function') {
    camera.updateProjectionMatrix();
  }

  if (controls && controls.target && typeof controls.target.set === 'function') {
    controls.target.set(framing.center[0], framing.center[1], framing.center[2]);
    if (typeof controls.update === 'function') {
      controls.update();
    }
  } else if (typeof camera.lookAt === 'function') {
    camera.lookAt(framing.center[0], framing.center[1], framing.center[2]);
  }

  return framing;
}

/**
 * Traverses a Three.js scene graph and deterministically disposes geometries,
 * materials, and attached textures to prevent WebGL memory leaks on unmount.
 *
 * @param {object} rootObject - `THREE.Object3D` (e.g., `gltf.scene`)
 * @returns {{ geometriesDisposed: number, materialsDisposed: number, texturesDisposed: number }}
 */
export function disposeGltfScene(rootObject) {
  const stats = {
    geometriesDisposed: 0,
    materialsDisposed: 0,
    texturesDisposed: 0,
  };

  if (!rootObject || typeof rootObject.traverse !== 'function') {
    return stats;
  }

  const disposedGeometries = new Set();
  const disposedMaterials = new Set();
  const disposedTextures = new Set();

  function disposeMaterial(mat) {
    if (!mat || typeof mat !== 'object' || disposedMaterials.has(mat)) return;
    disposedMaterials.add(mat);

    for (const value of Object.values(mat)) {
      if (
        value &&
        typeof value === 'object' &&
        (value.isTexture === true || typeof value.dispose === 'function') &&
        value !== mat &&
        !Array.isArray(value)
      ) {
        if (!disposedTextures.has(value) && typeof value.dispose === 'function') {
          disposedTextures.add(value);
          value.dispose();
          stats.texturesDisposed += 1;
        }
      }
    }

    if (typeof mat.dispose === 'function') {
      mat.dispose();
      stats.materialsDisposed += 1;
    }
  }

  rootObject.traverse((node) => {
    if (!node || typeof node !== 'object') return;
    if (node.geometry && !disposedGeometries.has(node.geometry)) {
      disposedGeometries.add(node.geometry);
      if (typeof node.geometry.dispose === 'function') {
        node.geometry.dispose();
        stats.geometriesDisposed += 1;
      }
    }
    if (Array.isArray(node.material)) {
      for (const m of node.material) disposeMaterial(m);
    } else if (node.material) {
      disposeMaterial(node.material);
    }
  });

  return stats;
}

/**
 * Extracts a clean animation summary from loaded `gltf.animations` clips.
 *
 * @param {Array<object>} animations
 * @returns {Array<{ index: number, name: string, durationSeconds: number, trackCount: number }>}
 */
export function extractAnimationClipSummary(animations = []) {
  if (!Array.isArray(animations)) return [];
  return animations.map((clip, idx) => ({
    index: idx,
    name: typeof clip?.name === 'string' && clip.name.length > 0 ? clip.name : `clip_${idx}`,
    durationSeconds:
      typeof clip?.duration === 'number' && Number.isFinite(clip.duration)
        ? Number(clip.duration.toFixed(4))
        : 0,
    trackCount: Array.isArray(clip?.tracks) ? clip.tracks.length : 0,
  }));
}

/**
 * Creates a managed Three.js GLB viewer controller. Accepts injected Three.js
 * classes via `options.threeModules` (for testing or custom builds) or dynamically
 * imports `three` and its official `three/addons/*` modules in browser/bundler environments.
 *
 * @param {object} options
 * @param {HTMLElement} options.container - DOM element to mount the canvas into
 * @param {object} [options.manifest] - BlendOps GLB handoff manifest
 * @param {string} [options.assetUrl] - Override URL for the `.glb` asset
 * @param {object} [options.decoderPaths] - Custom decoder paths
 * @param {object} [options.threeModules] - Optional dependency injection `{ THREE, GLTFLoader, DRACOLoader, KTX2Loader, OrbitControls, RoomEnvironment, MeshoptDecoder }`
 * @param {(progress: { loaded: number, total: number, ratio: number | null }) => void} [options.onProgress]
 * @param {(result: object) => void} [options.onLoad]
 * @param {(error: Error) => void} [options.onError]
 */
export async function createThreeGlbViewer(options = {}) {
  if (!options || !options.container) {
    throw new TypeError('createThreeGlbViewer requires options.container');
  }

  const config = resolveViewerManifestConfig({
    ...(options.manifest || {}),
    ...(options.assetUrl ? { assetUrl: options.assetUrl } : {}),
  });

  let modules = options.threeModules;
  if (!modules || !modules.THREE || !modules.GLTFLoader) {
    const [
      THREE,
      { GLTFLoader },
      { OrbitControls },
      { RoomEnvironment },
      dracoMod,
      ktx2Mod,
      meshoptMod,
    ] = await Promise.all([
      import('three'),
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/controls/OrbitControls.js'),
      import('three/addons/environments/RoomEnvironment.js'),
      config.requiresDraco ? import('three/addons/loaders/DRACOLoader.js') : Promise.resolve({}),
      config.requiresKtx2 ? import('three/addons/loaders/KTX2Loader.js') : Promise.resolve({}),
      config.requiresMeshopt
        ? import('three/addons/libs/meshopt_decoder.module.js')
        : Promise.resolve({}),
    ]);

    modules = {
      THREE,
      GLTFLoader,
      OrbitControls,
      RoomEnvironment,
      DRACOLoader: dracoMod.DRACOLoader,
      KTX2Loader: ktx2Mod.KTX2Loader,
      MeshoptDecoder: meshoptMod.MeshoptDecoder,
    };
  }

  const { THREE, GLTFLoader, OrbitControls, RoomEnvironment } = modules;
  const container = options.container;
  const width = Math.max(container.clientWidth || 800, 1);
  const height = Math.max(container.clientHeight || 600, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace =
      config.outputColorSpace === 'srgb-linear' && THREE.LinearSRGBColorSpace
        ? THREE.LinearSRGBColorSpace
        : THREE.SRGBColorSpace;
  }
  if ('toneMapping' in renderer && THREE.ACESFilmicToneMapping) {
    renderer.toneMapping = THREE[config.toneMapping] ?? THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
  }
  if (typeof renderer.setSize === 'function') {
    renderer.setSize(width, height);
  }
  if (renderer.domElement && typeof container.appendChild === 'function') {
    container.appendChild(renderer.domElement);
  }

  let pmremGenerator = null;
  let envRenderTarget = null;
  if (typeof THREE.PMREMGenerator === 'function' && typeof RoomEnvironment === 'function') {
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    envRenderTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envRenderTarget.texture;
    if (typeof roomEnv.dispose === 'function') {
      roomEnv.dispose();
    }
  }

  const controls =
    typeof OrbitControls === 'function' ? new OrbitControls(camera, renderer.domElement) : null;
  if (controls) {
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
  }

  const loader = new GLTFLoader();
  const { decoderConfig, disposeDecoders } = configureGltfDecoders(loader, {
    manifest: options.manifest || config,
    renderer,
    DRACOLoader: modules.DRACOLoader,
    KTX2Loader: modules.KTX2Loader,
    MeshoptDecoder: modules.MeshoptDecoder,
    decoderPaths: options.decoderPaths,
  });

  let loadedRoot = null;
  let mixer = null;
  let disposed = false;

  const loadAsset = (url = config.assetUrl) =>
    new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          if (disposed) return;
          if (loadedRoot) {
            scene.remove(loadedRoot);
            disposeGltfScene(loadedRoot);
          }
          loadedRoot = gltf.scene;
          scene.add(loadedRoot);

          const framing = frameCameraToBoundingBox({
            camera,
            controls,
            rootObject: loadedRoot,
            THREE,
            bounds: config.estimatedBounds?.available ? config.estimatedBounds : null,
          });

          const clipSummary = extractAnimationClipSummary(gltf.animations || []);
          if (
            Array.isArray(gltf.animations) &&
            gltf.animations.length > 0 &&
            typeof THREE.AnimationMixer === 'function'
          ) {
            mixer = new THREE.AnimationMixer(loadedRoot);
            const defaultAction = mixer.clipAction(gltf.animations[0]);
            if (defaultAction && typeof defaultAction.play === 'function') {
              defaultAction.play();
            }
          }

          const payload = {
            gltf,
            scene: loadedRoot,
            framing,
            animations: clipSummary,
            decoderConfig,
            config,
          };
          if (typeof options.onLoad === 'function') {
            options.onLoad(payload);
          }
          resolve(payload);
        },
        (evt) => {
          if (typeof options.onProgress === 'function') {
            const loaded = Number(evt?.loaded || 0);
            const total = Number(evt?.total || 0);
            options.onProgress({
              loaded,
              total,
              ratio: total > 0 ? Number((loaded / total).toFixed(4)) : null,
            });
          }
        },
        (err) => {
          const wrapped =
            err instanceof Error
              ? err
              : new Error(`Failed to load GLB asset "${url}": ${String(err)}`);
          if (typeof options.onError === 'function') {
            options.onError(wrapped);
          }
          reject(wrapped);
        },
      );
    });

  const resize = () => {
    if (disposed) return;
    const w = Math.max(container.clientWidth || 800, 1);
    const h = Math.max(container.clientHeight || 600, 1);
    camera.aspect = w / h;
    if (typeof camera.updateProjectionMatrix === 'function') {
      camera.updateProjectionMatrix();
    }
    if (typeof renderer.setSize === 'function') {
      renderer.setSize(w, h);
    }
  };

  const stepFrame = (deltaSeconds = 1 / 60) => {
    if (disposed) return;
    if (mixer && typeof mixer.update === 'function') {
      mixer.update(deltaSeconds);
    }
    if (controls && typeof controls.update === 'function') {
      controls.update();
    }
    if (typeof renderer.render === 'function') {
      renderer.render(scene, camera);
    }
  };

  const dispose = () => {
    if (disposed) return { alreadyDisposed: true };
    disposed = true;
    if (mixer && typeof mixer.stopAllAction === 'function') {
      mixer.stopAllAction();
    }
    const disposalStats = loadedRoot
      ? disposeGltfScene(loadedRoot)
      : { geometriesDisposed: 0, materialsDisposed: 0, texturesDisposed: 0 };
    if (loadedRoot) {
      scene.remove(loadedRoot);
      loadedRoot = null;
    }
    disposeDecoders();
    if (controls && typeof controls.dispose === 'function') {
      controls.dispose();
    }
    if (envRenderTarget && typeof envRenderTarget.dispose === 'function') {
      envRenderTarget.dispose();
    }
    if (pmremGenerator && typeof pmremGenerator.dispose === 'function') {
      pmremGenerator.dispose();
    }
    if (typeof renderer.dispose === 'function') {
      renderer.dispose();
    }
    if (
      renderer.domElement &&
      renderer.domElement.parentNode === container &&
      typeof container.removeChild === 'function'
    ) {
      container.removeChild(renderer.domElement);
    }
    return { alreadyDisposed: false, ...disposalStats };
  };

  return {
    config,
    decoderConfig,
    scene,
    camera,
    renderer,
    controls,
    loader,
    loadAsset,
    resize,
    stepFrame,
    dispose,
  };
}
