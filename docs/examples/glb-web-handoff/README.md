# GLB Web Handoff & Viewer Integration Examples

> **Truth-State Boundary:** These integration modules and CLI tools inspect existing `.glb` files and generate deterministic web handoff manifests, HTML/Markdown reports, and viewer integration code. They do **not** run Blender, do **not** export models from a `.blend` scene, and do **not** upgrade `Runtime status: Not Run` or `Artifact status: Not Produced` without a real runtime evidence record.

---

## What is in this folder

| File | Stack | Purpose |
|---|---|---|
| [`./threejs-glb-viewer.mjs`](./threejs-glb-viewer.mjs) | Vanilla Three.js (`r150+`) | Reusable ESM controller + pure helpers for manifest normalization, `GLTFLoader` decoder wiring (`DRACOLoader`, `MeshoptDecoder`, `KTX2Loader`), bounding-box camera framing, animation clip inspection, and scene graph memory disposal. |
| [`./r3f-glb-viewer.tsx`](./r3f-glb-viewer.tsx) | React Three Fiber (`@react-three/fiber` + `@react-three/drei`) | Reusable TypeScript component (`BlendOpsGlbModel`, `BlendOpsGlbViewerCanvas`, `GlbViewerErrorBoundary`) with `useGLTF`, `useAnimations`, `<Suspense>`, imperative ref handle, and unmount cache control. |

Related repository artifacts:
- Handoff manifest JSON Schema: [`../../../schemas/glb-web-handoff-manifest.schema.json`](../../../schemas/glb-web-handoff-manifest.schema.json)
- GLB 2.0 binary & structural inspector: [`../../../scripts/inspect-glb.mjs`](../../../scripts/inspect-glb.mjs)
- Web handoff report & manifest generator: [`../../../scripts/generate-glb-handoff-report.mjs`](../../../scripts/generate-glb-handoff-report.mjs)
- GLB web handoff skill: [`../../../skills/glb-web-handoff/SKILL.md`](../../../skills/glb-web-handoff/SKILL.md)
- React Three Fiber component planner skill: [`../../../skills/three-fiber-component-shape-planner/SKILL.md`](../../../skills/three-fiber-component-shape-planner/SKILL.md)
- Workflow contract: [`../../workflow-contract.md`](../../workflow-contract.md)
- Golden-path reference: [`../../golden-path-cyberpunk-shoe.md`](../../golden-path-cyberpunk-shoe.md)

---

## 1. Quick CLI workflow

Before dropping a `.glb` into a web application, run the BlendOps GLB inspection and handoff report commands:

```bash
# 1. Inspect GLB 2.0 binary container, scene hierarchy, meshes, materials, textures, animations, and 4 validation tiers
npx blendops glb-inspect ./path/to/model.glb

# 2. Generate a complete web handoff package (glb-handoff-manifest.json, glb-handoff-report.md, glb-handoff-report.html)
npx blendops glb-handoff ./path/to/model.glb --out-dir ./glb-handoff-out --viewer react-three-fiber

# 3. Validate an existing handoff manifest against schemas/glb-web-handoff-manifest.schema.json + semantic truth rules
npx blendops glb-validate-manifest ./glb-handoff-out/glb-handoff-manifest.json
```

When testing with synthetic fixtures inside automated tests, pass `--synthetic` so the generated manifest records `provenance: "synthetic_fixture"` and keeps `Artifact status: Not Produced`:

```bash
npx blendops glb-handoff ./fixture.glb --out-dir ./tmp-report --synthetic
```

---

## 2. Four-Tier Validation Model

Every BlendOps GLB inspection and handoff report separates verification into four explicit tiers so structural container checks are never mistaken for visual or live Blender runtime verification:

| Tier | Name | What it verifies | Default status on local `.glb` inspection |
|---|---|---|---|
| **Tier 1** | Container & Structural (`inspect-glb.mjs`) | 12-byte GLB header, chunk alignment, JSON/BIN bounds, bufferViews, accessors, node hierarchy (no cycles/multi-parents), declared extensions, and URI traversal safety. | `Pass` or `Fail` |
| **Tier 2** | Full glTF 2.0 Specification (`gltf-validator`) | Complete Khronos glTF 2.0 schema and accessor payload validation when `--khronos` is enabled and `gltf-validator` is installed. | `Skipped` (or `Pass` / `Warn` / `Fail` with `--khronos`) |
| **Tier 3** | Visual & Aesthetic Quality | Lighting balance, silhouette clarity, UV seam visibility, and PBR material response in the target viewport. | `Not Evaluated` |
| **Tier 4** | Live Blender Runtime Execution | Whether a live Blender session (Path 1 Blender Lab MCP in Blender 5.1+, Path 2 community `mcp-for-blender`, or CLI appendix) exported the asset with a recorded eval packet. | `Not Run` |

---

## 3. Using the Vanilla Three.js Viewer (`threejs-glb-viewer.mjs`)

### Dependencies in your web project

```bash
npm install three
```

### Example usage

```js
import { createThreeGlbViewer } from './threejs-glb-viewer.mjs';
import manifest from './glb-handoff-out/glb-handoff-manifest.json' with { type: 'json' };

const container = document.getElementById('viewer-root');

const viewer = await createThreeGlbViewer({
  container,
  manifest,
  assetUrl: '/models/product-hero.glb',
  decoderPaths: {
    dracoGltfPath: '/decoders/draco/gltf/',
    basisTranscoderPath: '/decoders/basis/',
  },
  onProgress: ({ ratio }) => {
    if (ratio !== null) {
      console.log(`Loading GLB: ${(ratio * 100).toFixed(1)}%`);
    }
  },
  onLoad: ({ animations, framing }) => {
    console.log('Loaded clips:', animations);
    console.log('Camera framing:', framing);
  },
  onError: (err) => {
    console.error('GLB load failed:', err);
  },
});

await viewer.loadAsset();

// Drive the render loop
let lastTime = performance.now();
function animate(now) {
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  viewer.stepFrame(dt);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

window.addEventListener('resize', () => viewer.resize());
```

---

## 4. Using the React Three Fiber Component (`r3f-glb-viewer.tsx`)

### Dependencies in your React project

```bash
npm install three @types/three @react-three/fiber @react-three/drei
```

### Example usage

```tsx
import React, { useRef } from 'react';
import {
  BlendOpsGlbViewerCanvas,
  type BlendOpsGlbModelHandle,
} from './r3f-glb-viewer';

export function ProductHeroPreview() {
  const modelRef = useRef<BlendOpsGlbModelHandle | null>(null);

  return (
    <div>
      <BlendOpsGlbViewerCanvas
        ref={modelRef}
        url="/models/product-hero.glb"
        environmentPreset="city"
        autoFitBounds={true}
        dracoDecoderPath="/decoders/draco/gltf/"
        enableMeshopt={false}
        onLoaded={({ clipNames }) => {
          console.log('Available animation clips:', clipNames);
        }}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button type="button" onClick={() => modelRef.current?.playClip('Turntable')}>
          Play Turntable
        </button>
        <button type="button" onClick={() => modelRef.current?.stopAllClips()}>
          Stop Clips
        </button>
      </div>
    </div>
  );
}
```

---

## 5. Decoder & Transform Reference

1. **Coordinate System & Units:**
   - glTF 2.0 uses `+Y up, +Z forward, -X right` with `1 unit = 1 meter`.
   - Blender's internal `-Y forward, +Z up` axes are converted automatically when the Blender glTF 2.0 exporter's `+Y Up` option is enabled.
   - If `spatial.hasNonIdentityRootScale` is `true` in `glb-handoff-manifest.json`, apply transforms (`Ctrl+A -> All Transforms`) in Blender before final delivery so physics colliders and `<Bounds>` framing behave predictably.
   - If `spatial.hasNegativeScale` is `true`, mesh face winding may invert in WebGL (`gl.BACK` culling), causing inside-out surfaces.
2. **Compression Decoders:**
   - `compression.draco: true` (`KHR_draco_mesh_compression`) requires `DRACOLoader` with WASM/JS decoder files hosted at `dracoGltfPath`.
   - `compression.meshopt: true` (`EXT_meshopt_compression`) requires `MeshoptDecoder` attached via `loader.setMeshoptDecoder(MeshoptDecoder)`.
   - `compression.ktx2BasisU: true` (`KHR_texture_basisu`) requires `KTX2Loader` initialized with `ktx2Loader.detectSupport(renderer)` before `loader.load()`.
