# Web 3D Asset Pipeline Research (Blender → GLB → Web)

Status: Research draft
Date: 2026-04-29

## Scope

This document defines a practical handoff pipeline from Blender scenes to web runtime usage (Three.js / React Three Fiber), prioritizing official standards and high-quality references.

Core references:
- Blender glTF exporter docs: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- Khronos glTF spec: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
- Three.js GLTFLoader docs: https://threejs.org/docs/pages/GLTFLoader.html
- Three.js color management: https://threejs.org/manual/en/color-management.html
- Three.js disposal guidance: https://threejs.org/manual/en/how-to-dispose-of-objects.html
- R3F Canvas + performance docs:
  - https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/docs/API/canvas.mdx
  - https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/docs/advanced/scaling-performance.mdx
- WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

---

## Pipeline phases

1. Scene preparation in Blender
2. GLB export preparation checks
3. Export execution
4. Runtime compatibility checks
5. Performance checks
6. Handoff package and report

---

## 1) Blender scene → GLB preparation

### Transforms / scale / origin

Required:
- normalize scale expectations (meters)
- apply transforms where needed
- use predictable object origins for runtime behavior

References:
- glTF coordinate system/units: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units
- Blender apply transforms: https://docs.blender.org/manual/en/latest/scene_layout/object/editing/apply.html

### Naming and scene organization

Recommended:
- stable, readable object names
- consistent collection/group structure for debug and runtime traversal
- avoid relying on unique names unless pipeline enforces uniqueness

References:
- glTF naming caveat (names optional/non-unique): https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#indices-and-names

---

## 2) Materials and textures

### PBR compatibility

Required:
- PBR-aligned material strategy for web portability
- correct color-space handling (color textures vs non-color data textures)

References:
- Blender glTF exporter docs: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- glTF material schema semantics:
  - https://raw.githubusercontent.com/KhronosGroup/glTF/main/specification/2.0/schema/material.pbrMetallicRoughness.schema.json
  - https://raw.githubusercontent.com/KhronosGroup/glTF/main/specification/2.0/schema/material.schema.json
- Three.js color management expectations: https://threejs.org/manual/en/color-management.html

### Texture format and compression

Recommended:
- prefer runtime-appropriate compressed texture paths where supported (KTX2/BasisU)
- keep mip strategy aligned with intended view distance

References:
- KHR_texture_basisu: https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_texture_basisu/README.md
- GLTFLoader extension support: https://threejs.org/docs/pages/GLTFLoader.html

---

## 3) File size / performance concerns

### Primary controls

- draw call count
- texture memory footprint
- geometry complexity
- material/shader diversity

References:
- R3F performance guidance: https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/docs/advanced/scaling-performance.mdx
- WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices

### Compression choices

- Draco, mesh quantization, meshopt each have trade-offs
- decoder/runtime support must match delivery target

References:
- KHR_draco_mesh_compression: https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_draco_mesh_compression/README.md
- KHR_mesh_quantization: https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_mesh_quantization/README.md
- KHR_meshopt_compression (status may vary by spec maturity): https://raw.githubusercontent.com/KhronosGroup/glTF/main/extensions/2.0/Khronos/KHR_meshopt_compression/README.md

---

## 4) React Three Fiber / Three.js handoff expectations

### Expected runtime contract

Document these explicitly in handoff:
- tested Three.js version
- tested R3F version
- required glTF extensions/decoders
- expected camera/framing intent
- expected color-management assumptions

References:
- GLTFLoader requirements: https://threejs.org/docs/pages/GLTFLoader.html
- R3F Canvas defaults: https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/docs/API/canvas.mdx
- Three.js color management: https://threejs.org/manual/en/color-management.html

### Runtime lifecycle expectations

- explicit asset disposal strategy to prevent memory leakage
- avoid unnecessary object/material churn

References:
- Three.js disposal guidance: https://threejs.org/manual/en/how-to-dispose-of-objects.html
- R3F performance pitfalls: https://raw.githubusercontent.com/pmndrs/react-three-fiber/master/docs/advanced/pitfalls.mdx

---

## 5) Suggested folder structure for handoff package

```txt
handoff/
  model/
    scene.glb
  textures/
    (if externalized)
  preview/
    preview.png
    turntable.mp4 (optional)
  report/
    handoff-report.md
    validation-checklist.md
```

Notes:
- exact structure can vary, but report + validation artifacts should be mandatory.

---

## 6) Preview/report expectations

Every handoff should include:

1. **Preview evidence**
   - still render(s)
   - optional turntable/video

2. **Validation evidence**
   - checklist pass/fail summary
   - unresolved warnings
   - blocking issues

3. **Runtime assumptions**
   - required loaders/decoders
   - known compatibility caveats

---

## 7) Validation before handoff (minimum)

- [ ] Coordinate system/scale assumptions are documented
- [ ] Transform sanity checks completed
- [ ] Material/PBR checks completed
- [ ] Texture/color-space checks completed
- [ ] Required glTF extensions documented
- [ ] GLB opens in independent viewer/runtime test
- [ ] Performance warning section included
- [ ] User-facing caveats clearly listed

Useful validator/tool reference:
- Khronos glTF hub: https://www.khronos.org/gltf/

---

## 8) Version-sensitive notes

- Loader extension support changes across Three.js revisions.
- Compression trade-offs are project/device dependent.
- Numeric “good” budgets are app-specific; treat as policy targets, not universal rules.

These must be disclosed in any BlendOps law/skill that references performance thresholds.
