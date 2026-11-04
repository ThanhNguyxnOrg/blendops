# BlendOps Knowledge & Recipe Catalog

> Generated deterministically from `registry/knowledge-sources.json`, `registry/knowledge-catalog.json`, and `registry/recipe-catalog.json` via `npm run catalog:build`. Do not edit by hand.

## Overview & Retrieval CLI

BlendOps separates **atomic agent workflow skills** (`skills/*/SKILL.md`) from **reusable 3D/Blender domain knowledge** (`knowledge.*`) and **multi-stage construction recipes** (`recipe.*`).

- **Deterministic Local Search**: `npx blendops catalog-search "<query>" [--type knowledge|recipe] [--domain <domain>]`
- **Deterministic Record Resolution**: `npx blendops catalog-resolve <knowledge.id | recipe.id | source.id>`
- **Catalog Schema & Cross-Reference Validation**: `npx blendops catalog-validate`

| Metric | Count | Canonical Source |
| :--- | ---: | :--- |
| Knowledge Domains | 11 | `registry/knowledge-sources.json` |
| Canonical Knowledge Records (`knowledge.*`) | 30 | `registry/knowledge-catalog.json` |
| Canonical Recipes (`recipe.*`) | 10 | `registry/recipe-catalog.json` |
| Authoritative Sources (`source.*`) | 20 | `registry/knowledge-sources.json` |

---

## 1. Canonical Recipes (`recipe.*`)

| Recipe ID | Title | Primary Domain | Stages | Required Skills | Linked Knowledge | Min Blender | Evidence Status |
| :--- | :--- | :--- | ---: | ---: | ---: | :--- | :--- |
| `recipe.product-hero-scene` | Product Hero Scene & Web-Ready Presentation | `lighting-camera-and-rendering` | 4 | 18 | 10 | `3.6 LTS` | `version-checked` |
| `recipe.stylized-environment-scene` | Stylized Environment & Establishing Shot Assembly | `environment-and-architecture` | 4 | 15 | 9 | `3.6 LTS` | `version-checked` |
| `recipe.hard-surface-prop` | Non-Destructive Hard-Surface Prop Modeling & Shading Hygiene | `hard-surface-and-organic` | 4 | 10 | 10 | `3.6 LTS` | `version-checked` |
| `recipe.procedural-geometry-nodes-asset` | Procedural Geometry Nodes Asset & Scatter Pipeline | `geometry-nodes-and-procedural` | 4 | 11 | 6 | `3.6 LTS` | `version-checked` |
| `recipe.uv-and-pbr-material-preparation` | UV Unwrapping, Texel Density & Energy-Conserving PBR Material Preparation | `uv-texturing-and-baking` | 4 | 9 | 9 | `3.6 LTS` | `version-checked` |
| `recipe.presentation-lighting-and-camera` | Studio Lighting, Physical Camera & Color-Managed Render Setup | `lighting-camera-and-rendering` | 4 | 14 | 5 | `3.6 LTS` | `version-checked` |
| `recipe.rigged-and-animated-asset` | Skeletal Rigging, Skin Weight Normalization & NLA Action Baking for Export | `rigging-and-animation` | 4 | 9 | 8 | `3.6 LTS` | `version-checked` |
| `recipe.scene-quality-inspection-and-correction` | Multi-Gate Scene Quality Inspection, Root-Cause Triage & Correction Plan | `lighting-camera-and-rendering` | 4 | 11 | 10 | `3.6 LTS` | `version-checked` |
| `recipe.blender-to-glb-handoff` | Verified Blender-to-GLB Export, Binary Inspection & Web Viewer Handoff | `interchange-gltf-and-web` | 4 | 9 | 7 | `3.6 LTS` | `version-checked` |
| `recipe.web-ready-asset-optimization` | Mobile/Web GLB Performance Budgeting, Compression & LOD Pipeline | `optimization-lod-and-performance` | 4 | 10 | 8 | `3.6 LTS` | `version-checked` |

### Recipe Details & Scenario Linkages

#### `recipe.product-hero-scene` — Product Hero Scene & Web-Ready Presentation

- **Intent**: Transform a product brief into a verified single-subject hero scene with three-point/accent lighting, physically plausible materials, controlled reflections, and an optional web-ready GLB handoff package.
- **Domain**: `lighting-camera-and-rendering`
- **Required Skills**: `intent-to-3d-brief-writer`, `done-criteria`, `asset-discovery`, `asset-license-checker`, `product-hero-scene-planner`, `camera-composition`, `resolution-aspect-decision`, `lighting-material-plan`, `color-management-decision`, `cycles-vs-eevee-decision`, `lighting-quality-checker`, `material-quality-checker`, `composition-quality-checker`, `scene-readiness`, `render-export-evidence`, `pre-handoff-verification`, `glb-web-handoff`, `plain-language-response`
- **Knowledge Records**: `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.physically-based-camera-lens-and-dof`, `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.three-point-and-hdri-studio-lighting`, `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.shader-node-gltf-export-portability`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity`
- **Stages**: `stage-brief-and-scope` (Stage 1) → `stage-scene-and-camera-plan` (Stage 2) → `stage-lighting-and-materials` (Stage 3) → `stage-quality-and-handoff` (Stage 4)
- **Scenario Reference Doc**: `docs/recipes/cyberpunk-shoe-hero.md`

#### `recipe.stylized-environment-scene` — Stylized Environment & Establishing Shot Assembly

- **Intent**: Plan and assemble a readable environment or diorama establishing shot with metric scale cues, three-plane depth staging, instanced foliage/props, and time-of-day atmospheric lighting.
- **Domain**: `environment-and-architecture`
- **Required Skills**: `intent-to-3d-brief-writer`, `asset-discovery`, `asset-license-checker`, `asset-style-check`, `environment-shot`, `camera-composition`, `resolution-aspect-decision`, `lighting-material-plan`, `polycount-budget-checker`, `cycles-vs-eevee-decision`, `composition-quality-checker`, `lighting-quality-checker`, `scene-readiness`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.environment-depth-layering-and-atmospheric-perspective`, `knowledge.physically-based-camera-lens-and-dof`, `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.procedural-scatter-poisson-disk-and-slope-masking`, `knowledge.volumetrics-fog-and-principled-volume-tradeoffs`, `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.triangle-draw-call-and-vram-budgets`
- **Stages**: `stage-environment-brief-and-assets` (Stage 1) → `stage-depth-layering-and-camera` (Stage 2) → `stage-procedural-scatter-and-atmosphere` (Stage 3) → `stage-environment-validation-and-handoff` (Stage 4)

#### `recipe.hard-surface-prop` — Non-Destructive Hard-Surface Prop Modeling & Shading Hygiene

- **Intent**: Design and validate a mechanical or manufactured hard-surface prop with consistent millimeter bevel widths, clean boolean shading via weighted normals or quad holding loops, and export-ready mesh hygiene.
- **Domain**: `hard-surface-and-organic`
- **Required Skills**: `intent-to-3d-brief-writer`, `done-criteria`, `scope-guard`, `stage-gates`, `polycount-budget-checker`, `lighting-material-plan`, `material-quality-checker`, `scene-readiness`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.cad-creases-and-panel-gap-detailing`, `knowledge.non-destructive-hard-surface-modifier-stack`, `knowledge.boolean-bevel-shading-cleanup`, `knowledge.quad-dominant-subdivision-topology`, `knowledge.uv-seam-placement-and-texel-density`, `knowledge.high-to-low-normal-and-ao-baking`, `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.gltf-2-coordinate-system-and-transform-conventions`
- **Stages**: `stage-prop-scale-and-blockout` (Stage 1) → `stage-modifier-stack-and-topology` (Stage 2) → `stage-uv-and-surface-materials` (Stage 3) → `stage-prop-validation-and-handoff` (Stage 4)

#### `recipe.procedural-geometry-nodes-asset` — Procedural Geometry Nodes Asset & Scatter Pipeline

- **Intent**: Build a deterministic, parameter-exposed Geometry Nodes asset or scatter system with explicit attribute domain propagation, instance memory discipline, and clear realization rules for rendering vs. glTF export.
- **Domain**: `geometry-nodes-and-procedural`
- **Required Skills**: `intent-to-3d-brief-writer`, `done-criteria`, `stage-gates`, `polycount-budget-checker`, `asset-style-check`, `lighting-material-plan`, `material-quality-checker`, `scene-readiness`, `glb-web-handoff`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.geometry-nodes-fields-and-anonymous-attributes`, `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.procedural-scatter-poisson-disk-and-slope-masking`, `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.shader-node-gltf-export-portability`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation`
- **Stages**: `stage-gn-interface-and-inputs` (Stage 1) → `stage-gn-distribution-and-instancing` (Stage 2) → `stage-gn-attributes-and-shading` (Stage 3) → `stage-gn-realization-and-export` (Stage 4)

#### `recipe.uv-and-pbr-material-preparation` — UV Unwrapping, Texel Density & Energy-Conserving PBR Material Preparation

- **Intent**: Prepare clean, non-overlapping 0-1 UV layouts (or UDIM tiles for offline renders), bake high-to-low or procedural maps without seam artifacts, and wire physically accurate PBR materials.
- **Domain**: `uv-texturing-and-baking`
- **Required Skills**: `stage-gates`, `material-quality-checker`, `cycles-vs-eevee-decision`, `output-format-decision`, `lighting-material-plan`, `mobile-glb-budget`, `scene-readiness`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.uv-seam-placement-and-texel-density`, `knowledge.udim-vs-single-atlas-uv-packing`, `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.high-to-low-normal-and-ao-baking`, `knowledge.normal-roughness-and-orm-channel-packing`, `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.shader-node-gltf-export-portability`, `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression`, `knowledge.triangle-draw-call-and-vram-budgets`
- **Stages**: `stage-uv-seams-and-unwrap` (Stage 1) → `stage-mikktspace-baking` (Stage 2) → `stage-principled-bsdf-wiring` (Stage 3) → `stage-material-validation-and-handoff` (Stage 4)

#### `recipe.presentation-lighting-and-camera` — Studio Lighting, Physical Camera & Color-Managed Render Setup

- **Intent**: Configure a production-ready camera, lighting rig, color management pipeline, and render engine (Cycles or EEVEE) with verified contrast ratios, shadow softness, and output format settings.
- **Domain**: `lighting-camera-and-rendering`
- **Required Skills**: `camera-composition`, `resolution-aspect-decision`, `character-portrait`, `interior-scene`, `lighting-material-plan`, `lighting-quality-checker`, `color-management-decision`, `cycles-vs-eevee-decision`, `output-format-decision`, `composition-quality-checker`, `scene-readiness`, `render-export-evidence`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.physically-based-camera-lens-and-dof`, `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.three-point-and-hdri-studio-lighting`, `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.agx-filmic-color-management-and-cycles-eevee`
- **Stages**: `stage-camera-optics-and-framing` (Stage 1) → `stage-three-point-and-hdri-lighting` (Stage 2) → `stage-color-and-render-engine` (Stage 3) → `stage-render-quality-and-handoff` (Stage 4)

#### `recipe.rigged-and-animated-asset` — Skeletal Rigging, Skin Weight Normalization & NLA Action Baking for Export

- **Intent**: Rig, skin, animate, and bake skeletal or shape-key animations so that IK/constraint rigs convert cleanly into self-contained FK deform keyframes and export to GLB without deformation breakage.
- **Domain**: `rigging-and-animation`
- **Required Skills**: `intent-to-3d-brief-writer`, `stage-gates`, `polycount-budget-checker`, `mobile-glb-budget`, `glb-animation-handoff`, `r3f-component-plan`, `glb-web-handoff`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.armature-joint-hierarchy-and-linear-blend-skinning`, `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.organic-sculpt-to-retopology-workflow`, `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.rigid-body-cloth-and-simulation-cache-baking`, `knowledge.gltf-2-coordinate-system-and-transform-conventions`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity`
- **Stages**: `stage-armature-and-transform-hygiene` (Stage 1) → `stage-skin-weights-and-morphs` (Stage 2) → `stage-nla-action-baking` (Stage 3) → `stage-animation-validation-and-handoff` (Stage 4)

#### `recipe.scene-quality-inspection-and-correction` — Multi-Gate Scene Quality Inspection, Root-Cause Triage & Correction Plan

- **Intent**: Systematically evaluate a 3D scene or plan against domain quality rubrics, classify blockers vs. warnings, run 4-phase root-cause troubleshooting on defects, and issue an evidence-backed Pass/Warn/Fail readiness verdict.
- **Domain**: `lighting-camera-and-rendering`
- **Required Skills**: `blender-troubleshooting`, `polycount-budget-checker`, `material-quality-checker`, `lighting-quality-checker`, `color-management-decision`, `composition-quality-checker`, `scene-readiness`, `stage-gates`, `render-export-evidence`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.boolean-bevel-shading-cleanup`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.normal-roughness-and-orm-channel-packing`, `knowledge.three-point-and-hdri-studio-lighting`, `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.physically-based-camera-lens-and-dof`, `knowledge.environment-depth-layering-and-atmospheric-perspective`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation`
- **Stages**: `stage-symptom-triage-and-geometry-audit` (Stage 1) → `stage-material-and-lighting-audit` (Stage 2) → `stage-composition-and-holistic-readiness` (Stage 3) → `stage-correction-verification-and-response` (Stage 4)

#### `recipe.blender-to-glb-handoff` — Verified Blender-to-GLB Export, Binary Inspection & Web Viewer Handoff

- **Intent**: Ensure a Blender asset exports cleanly to a spec-compliant GLB 2.0 binary container, run deterministic structural inspection (`blendops glb-inspect` / `glb-handoff`), and provide complete Three.js or React Three Fiber integration guidance.
- **Domain**: `interchange-gltf-and-web`
- **Required Skills**: `material-quality-checker`, `polycount-budget-checker`, `glb-animation-handoff`, `render-export-evidence`, `preview-report`, `r3f-component-plan`, `glb-web-handoff`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.gltf-2-coordinate-system-and-transform-conventions`, `knowledge.shader-node-gltf-export-portability`, `knowledge.normal-roughness-and-orm-channel-packing`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation`, `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity`, `knowledge.agx-filmic-color-management-and-cycles-eevee`
- **Stages**: `stage-pre-export-gltf-audit` (Stage 1) → `stage-glb-container-inspection` (Stage 2) → `stage-web-viewer-component-plan` (Stage 3) → `stage-handoff-verification-and-summary` (Stage 4)

#### `recipe.web-ready-asset-optimization` — Mobile/Web GLB Performance Budgeting, Compression & LOD Pipeline

- **Intent**: Pin device-tier performance budgets upfront, audit geometry/texture/draw-call bottlenecks, design a progressive degradation and LOD plan, and select optimal texture (KTX2 ETC1S/UASTC) and mesh (Draco vs. Meshopt) compression.
- **Domain**: `optimization-lod-and-performance`
- **Required Skills**: `mobile-glb-budget`, `done-criteria`, `polycount-budget-checker`, `asset-fallback-strategy`, `material-quality-checker`, `output-format-decision`, `glb-web-handoff`, `r3f-component-plan`, `pre-handoff-verification`, `plain-language-response`
- **Knowledge Records**: `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.lod-hierarchy-and-decimation-strategy`, `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.normal-roughness-and-orm-channel-packing`, `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression`, `knowledge.udim-vs-single-atlas-uv-packing`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity`
- **Stages**: `stage-pin-device-budget` (Stage 1) → `stage-geometry-and-lod-optimization` (Stage 2) → `stage-texture-and-mesh-compression` (Stage 3) → `stage-optimization-verification-and-handoff` (Stage 4)

---

## 2. Canonical Knowledge Records by Domain (`knowledge.*`)

### Domain: `modeling-and-topology` (3 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.quad-dominant-subdivision-topology` | Quad-Dominant Subdivision Topology, Pole Routing & Edge-Flow Discipline | `topology-rule` | `3.0+` | `version-checked` | `polycount-budget-checker`, `scene-readiness`, `product-hero-scene-planner`, `character-portrait` | `recipe.product-hero-scene`, `recipe.hard-surface-prop` |
| `knowledge.mesh-manifold-normals-and-scale-hygiene` | Mesh Manifold Integrity, Outward Normals & Applied Scale Hygiene | `topology-rule` | `3.0+` | `version-checked` | `blender-troubleshooting`, `polycount-budget-checker`, `scene-readiness`, `pre-handoff-verification` | `recipe.product-hero-scene`, `recipe.hard-surface-prop`, `recipe.uv-and-pbr-material-preparation`, `recipe.scene-quality-inspection-and-correction` |
| `knowledge.boolean-bevel-shading-cleanup` | Boolean Cutout Shading Cleanup, Custom Split Normals & Smooth by Angle | `topology-rule` | `3.6 LTS` | `version-checked` | `blender-troubleshooting`, `polycount-budget-checker`, `scene-readiness` | `recipe.hard-surface-prop`, `recipe.scene-quality-inspection-and-correction` |

### Domain: `hard-surface-and-organic` (3 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.non-destructive-hard-surface-modifier-stack` | Non-Destructive Hard-Surface Modifier Stack Ordering & Evaluation Rules | `modeling-workflow` | `3.6 LTS` | `version-checked` | `product-hero-scene-planner`, `polycount-budget-checker`, `blender-troubleshooting` | `recipe.hard-surface-prop`, `recipe.product-hero-scene` |
| `knowledge.organic-sculpt-to-retopology-workflow` | Organic High-Poly Sculpting to Clean Quad Retopology & Detail Transfer | `modeling-workflow` | `3.6 LTS` | `version-checked` | `character-portrait`, `polycount-budget-checker`, `mobile-glb-budget` | `recipe.rigged-and-animated-asset`, `recipe.uv-and-pbr-material-preparation` |
| `knowledge.cad-creases-and-panel-gap-detailing` | Physical Bevel Minimums, Panel Seam Gaps & Industrial Readability | `modeling-workflow` | `3.0+` | `version-checked` | `product-hero-scene-planner`, `lighting-material-plan`, `polycount-budget-checker` | `recipe.product-hero-scene`, `recipe.hard-surface-prop` |

### Domain: `geometry-nodes-and-procedural` (3 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.geometry-nodes-fields-and-anonymous-attributes` | Geometry Nodes Fields Evaluation, Attribute Domains & UV/Shader Persistence | `procedural-system` | `3.6 LTS` | `version-checked` | `polycount-budget-checker`, `lighting-material-plan`, `material-quality-checker`, `glb-web-handoff` | `recipe.procedural-geometry-nodes-asset`, `recipe.stylized-environment-scene` |
| `knowledge.procedural-instancing-and-realize-instances-budget` | Procedural Collection Instancing vs. Realize Instances Memory & Export Tradeoffs | `procedural-system` | `3.6 LTS` | `version-checked` | `polycount-budget-checker`, `mobile-glb-budget`, `r3f-component-plan`, `glb-web-handoff` | `recipe.procedural-geometry-nodes-asset`, `recipe.stylized-environment-scene`, `recipe.web-ready-asset-optimization` |
| `knowledge.procedural-scatter-poisson-disk-and-slope-masking` | Poisson Disk Point Distribution, Slope/Altitude Masking & Orientation Alignment | `procedural-system` | `3.6 LTS` | `version-checked` | `environment-shot`, `polycount-budget-checker`, `product-hero-scene-planner` | `recipe.procedural-geometry-nodes-asset`, `recipe.stylized-environment-scene` |

### Domain: `uv-texturing-and-baking` (3 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.uv-seam-placement-and-texel-density` | UV Seam Placement, Hard-Edge Splits, Texel Density & Mipmap Padding | `uv-baking-rule` | `3.6 LTS` | `version-checked` | `material-quality-checker`, `lighting-material-plan`, `mobile-glb-budget` | `recipe.uv-and-pbr-material-preparation`, `recipe.hard-surface-prop`, `recipe.product-hero-scene` |
| `knowledge.udim-vs-single-atlas-uv-packing` | Single 0-1 UV Atlas Packing vs. Multi-Tile UDIM Workflows for Offline & glTF | `uv-baking-rule` | `3.6 LTS` | `version-checked` | `material-quality-checker`, `mobile-glb-budget`, `lighting-material-plan`, `glb-web-handoff` | `recipe.uv-and-pbr-material-preparation`, `recipe.web-ready-asset-optimization` |
| `knowledge.high-to-low-normal-and-ao-baking` | Tangent-Space MikkTSpace Normal & Ambient Occlusion Baking Protocol | `uv-baking-rule` | `3.6 LTS` | `version-checked` | `material-quality-checker`, `lighting-material-plan`, `cycles-vs-eevee-decision` | `recipe.uv-and-pbr-material-preparation`, `recipe.hard-surface-prop`, `recipe.product-hero-scene` |

### Domain: `materials-shaders-and-pbr` (3 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.principled-bsdf-v2-energy-conserving-pbr` | Principled BSDF v2 Energy Conservation, Dielectric vs. Conductor Albedo & Blender 4.0+ Socket Changes | `material-shader-profile` | `3.6 LTS` | `version-checked` | `lighting-material-plan`, `material-quality-checker`, `product-hero-scene-planner` | `recipe.product-hero-scene`, `recipe.uv-and-pbr-material-preparation`, `recipe.presentation-lighting-and-camera`, `recipe.scene-quality-inspection-and-correction` |
| `knowledge.normal-roughness-and-orm-channel-packing` | ORM Channel Packing (Occlusion/Roughness/Metallic) & Linear Non-Color Space Discipline | `material-shader-profile` | `3.6 LTS` | `version-checked` | `material-quality-checker`, `lighting-material-plan`, `glb-web-handoff`, `mobile-glb-budget` | `recipe.uv-and-pbr-material-preparation`, `recipe.product-hero-scene`, `recipe.blender-to-glb-handoff`, `recipe.web-ready-asset-optimization` |
| `knowledge.shader-node-gltf-export-portability` | Blender Shader Graph to Khronos glTF 2.0 Export Portability & Extension Matrix | `material-shader-profile` | `3.6 LTS` | `version-checked` | `lighting-material-plan`, `material-quality-checker`, `glb-web-handoff`, `r3f-component-plan` | `recipe.product-hero-scene`, `recipe.uv-and-pbr-material-preparation`, `recipe.blender-to-glb-handoff`, `recipe.procedural-geometry-nodes-asset` |

### Domain: `lighting-camera-and-rendering` (3 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.three-point-and-hdri-studio-lighting` | Three-Point Studio Lighting Ratios, Area Light Angular Size & HDRI Balance | `lighting-camera-rule` | `3.6 LTS` | `version-checked` | `lighting-material-plan`, `lighting-quality-checker`, `product-hero-scene-planner`, `character-portrait` | `recipe.product-hero-scene`, `recipe.presentation-lighting-and-camera`, `recipe.scene-quality-inspection-and-correction` |
| `knowledge.physically-based-camera-lens-and-dof` | Physical Camera Sensor Size, Focal Length Compression, Tilt-Shift & Depth of Field | `lighting-camera-rule` | `3.0+` | `version-checked` | `camera-composition`, `composition-quality-checker`, `product-hero-scene-planner`, `character-portrait`, `interior-scene`, `environment-shot` | `recipe.product-hero-scene`, `recipe.presentation-lighting-and-camera`, `recipe.stylized-environment-scene` |
| `knowledge.agx-filmic-color-management-and-cycles-eevee` | AgX vs. Filmic Color Management, EEVEE Next (4.2+) vs. Cycles & Output Bit Depth | `render-engine-profile` | `3.6 LTS` | `version-checked` | `color-management-decision`, `cycles-vs-eevee-decision`, `output-format-decision`, `lighting-quality-checker` | `recipe.product-hero-scene`, `recipe.presentation-lighting-and-camera`, `recipe.stylized-environment-scene`, `recipe.scene-quality-inspection-and-correction`, `recipe.blender-to-glb-handoff` |

### Domain: `rigging-and-animation` (2 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.armature-joint-hierarchy-and-linear-blend-skinning` | Armature Joint Hierarchy, Transform Alignment & 4-Bone Linear Blend Skinning | `rigging-animation-rule` | `3.6 LTS` | `version-checked` | `glb-animation-handoff`, `polycount-budget-checker`, `mobile-glb-budget`, `r3f-component-plan` | `recipe.rigged-and-animated-asset`, `recipe.blender-to-glb-handoff` |
| `knowledge.nla-action-baking-and-morph-target-export` | NLA Action Baking, Constraint Sampling, and Shape Key (Morph Target) Export Rules | `rigging-animation-rule` | `3.6 LTS` | `version-checked` | `glb-animation-handoff`, `r3f-component-plan`, `glb-web-handoff`, `mobile-glb-budget` | `recipe.rigged-and-animated-asset`, `recipe.blender-to-glb-handoff` |

### Domain: `simulation-and-vfx` (2 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.rigid-body-cloth-and-simulation-cache-baking` | Rigid Body, Cloth, and Physics Simulation Cache Baking vs. Real-Time Tradeoffs | `simulation-vfx-profile` | `3.0+` | `source-reviewed` | `glb-animation-handoff`, `scene-readiness`, `glb-web-handoff` | `recipe.rigged-and-animated-asset`, `recipe.blender-to-glb-handoff` |
| `knowledge.volumetrics-fog-and-principled-volume-tradeoffs` | Volumetric Lighting, Principled Volume, and Real-Time Depth Fog Tradeoffs | `simulation-vfx-profile` | `3.0+` | `version-checked` | `lighting-material-plan`, `environment-shot`, `cycles-vs-eevee-decision`, `r3f-component-plan` | `recipe.stylized-environment-scene`, `recipe.product-hero-scene`, `recipe.presentation-lighting-and-camera` |

### Domain: `environment-and-architecture` (2 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.modular-architectural-grid-and-metric-scale` | Modular Architectural Grid Snapping, Pivot Placement, and Real-World Metric Scale | `scene-assembly-pattern` | `3.0+` | `version-checked` | `scene-readiness`, `interior-scene`, `environment-shot`, `product-hero-scene-planner` | `recipe.stylized-environment-scene`, `recipe.product-hero-scene`, `recipe.scene-quality-inspection-and-correction` |
| `knowledge.environment-depth-layering-and-atmospheric-perspective` | Foreground / Midground / Background Depth Layering and Cyclorama Staging | `scene-assembly-pattern` | `3.0+` | `source-reviewed` | `product-hero-scene-planner`, `environment-shot`, `camera-composition`, `composition-quality-checker` | `recipe.product-hero-scene`, `recipe.stylized-environment-scene`, `recipe.presentation-lighting-and-camera` |

### Domain: `optimization-lod-and-performance` (3 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.triangle-draw-call-and-vram-budgets` | Triangle, Draw Call, Texture VRAM, and File Size Budgets by Target Tier | `performance-budget-rule` | `3.0+` | `source-reviewed` | `polycount-budget-checker`, `mobile-glb-budget`, `material-quality-checker`, `acceptance-criteria-builder` | `recipe.web-ready-asset-optimization`, `recipe.blender-to-glb-handoff`, `recipe.scene-quality-inspection-and-correction` |
| `knowledge.lod-hierarchy-and-decimation-strategy` | Level of Detail (LOD0–LOD3) Hierarchy, Planar Dissolve, and UV-Safe Decimation | `performance-budget-rule` | `3.0+` | `source-reviewed` | `polycount-budget-checker`, `mobile-glb-budget`, `r3f-component-plan`, `scene-readiness` | `recipe.web-ready-asset-optimization`, `recipe.hard-surface-prop` |
| `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression` | KTX2 / Basis Universal Texture Compression vs. Draco and Meshopt Geometry Compression | `performance-budget-rule` | `3.0+` | `version-checked` | `mobile-glb-budget`, `glb-web-handoff`, `r3f-component-plan`, `output-format-decision` | `recipe.web-ready-asset-optimization`, `recipe.blender-to-glb-handoff` |

### Domain: `interchange-gltf-and-web` (3 records)

| Knowledge ID | Title | Kind | Min Blender | Evidence Status | Linked Skills | Linked Recipes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `knowledge.gltf-2-coordinate-system-and-transform-conventions` | glTF 2.0 Right-Handed +Y Up Coordinate System and Blender Transform Conversion | `interchange-export-rule` | `3.0+` | `source-reviewed` | `scene-readiness`, `glb-web-handoff`, `r3f-component-plan`, `pre-handoff-verification` | `recipe.blender-to-glb-handoff`, `recipe.scene-quality-inspection-and-correction`, `recipe.product-hero-scene` |
| `knowledge.glb-binary-chunk-alignment-and-khronos-validation` | GLB Binary Container Structure, Export Flags, and Khronos Validator Compliance | `interchange-export-rule` | `3.0+` | `version-checked` | `glb-web-handoff`, `render-export-evidence`, `pre-handoff-verification`, `output-format-decision` | `recipe.blender-to-glb-handoff`, `recipe.web-ready-asset-optimization`, `recipe.product-hero-scene` |
| `knowledge.threejs-r3f-tone-mapping-and-environment-parity` | Three.js and React Three Fiber Tone Mapping, Color Management, and IBL Parity with Blender | `interchange-export-rule` | `3.0+` | `version-checked` | `r3f-component-plan`, `glb-web-handoff`, `color-management-decision`, `pre-handoff-verification` | `recipe.blender-to-glb-handoff`, `recipe.product-hero-scene`, `recipe.web-ready-asset-optimization` |

---

## 3. Authoritative Source Registry (`source.*`)

| Source ID | Title | Authority | Upstream URL | License / Usage |
| :--- | :--- | :--- | :--- | :--- |
| `source.blender-manual-modeling` | Blender Reference Manual — Modeling, Meshes, Normals, and Modifiers | `official-manual` | `https://docs.blender.org/manual/en/latest/modeling/index.html` | CC-BY-SA 4.0 (referenced for factual behavior; no prose copied) |
| `source.blender-manual-geometry-nodes` | Blender Reference Manual — Geometry Nodes, Fields, Attributes, and Instances | `official-manual` | `https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/index.html` | CC-BY-SA 4.0 (referenced for node evaluation semantics) |
| `source.blender-manual-uv-baking` | Blender Reference Manual — UV Unwrapping, Texture Space, and Cycles Render Baking | `official-manual` | `https://docs.blender.org/manual/en/latest/modeling/meshes/uv/index.html` | CC-BY-SA 4.0 (referenced for UV and baking parameters) |
| `source.blender-manual-shading-color` | Blender Reference Manual — Shader Nodes, Principled BSDF, and Color Management (AgX / Filmic) | `official-manual` | `https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html` | CC-BY-SA 4.0 (referenced for Principled BSDF v2 and AgX color transforms) |
| `source.blender-manual-lighting-rendering` | Blender Reference Manual — Cycles, EEVEE Next, Lighting, and Cameras | `official-manual` | `https://docs.blender.org/manual/en/latest/render/index.html` | CC-BY-SA 4.0 (referenced for Cycles and EEVEE Next rendering differences) |
| `source.blender-manual-rigging-animation` | Blender Reference Manual — Armatures, Skinning, Constraints, and NLA Action Baking | `official-manual` | `https://docs.blender.org/manual/en/latest/animation/index.html` | CC-BY-SA 4.0 (referenced for armature and NLA baking workflows) |
| `source.blender-manual-physics` | Blender Reference Manual — Physics, Rigid Body, Cloth, and Point Cache Baking | `official-manual` | `https://docs.blender.org/manual/en/latest/physics/index.html` | CC-BY-SA 4.0 (referenced for physics caching and collision shapes) |
| `source.blender-manual-gltf-io` | Blender Reference Manual — glTF 2.0 Import/Export Add-on Specification | `official-manual` | `https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html` | CC-BY-SA 4.0 (referenced for glTF socket mapping and exporter options) |
| `source.khronos-gltf-2-spec` | Khronos glTF 2.0 Specification & GLB Binary Container Format | `official-specification` | `https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html` | CC-BY 4.0 / Khronos Specification License |
| `source.khronos-gltf-asset-auditor` | Khronos glTF Asset Auditor & Ecommerce 3D Asset Guidelines | `official-pipeline` | `https://github.com/KhronosGroup/gltf-asset-auditor` | Apache-2.0 (referenced for real-time asset budgets and validation metrics) |
| `source.khronos-ktx2-draco-meshopt` | Khronos KHR_texture_basisu, KHR_draco_mesh_compression, and EXT_meshopt_compression | `official-specification` | `https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos` | Apache-2.0 / Khronos License |
| `source.blender-studio-pipeline` | Blender Studio Pipeline & Asset Creation Conventions | `official-pipeline` | `https://studio.blender.org/pipeline/` | CC-BY 4.0 (referenced for asset naming, collection organization, and staging conventions) |
| `source.pixar-opensubdiv-topology` | Pixar OpenSubdiv Catmull-Clark Subdivision Surface Specification | `official-specification` | `https://graphics.pixar.com/opensubdiv/docs/subdivision_surfaces.html` | Modified Apache-2.0 (referenced for Catmull-Clark valence and crease rules) |
| `source.mikktspace-tangent-standard` | MikkTSpace — Tangent Space Standard for Normal Mapping (Morten S. Mikkelsen) | `peer-reviewed-research` | `https://archive.blender.org/wiki/index.php/Dev:Shading/Tangent_Space_Normal_Maps/` | Public specification (normative in Blender and glTF 2.0) |
| `source.threejs-color-and-gltf` | Three.js Documentation — Color Management, GLTFLoader, and PBR Lighting | `official-manual` | `https://threejs.org/docs/#manual/en/introduction/Color-management` | MIT License |
| `source.blender-lab-mcp-and-runtime` | Blender Lab MCP Server & Command Line Interface Documentation | `official-manual` | `https://www.blender.org/lab/mcp-server/` | Blender Foundation official documentation |
| `source.agentskills-specification` | Agent Skills Specification & Anthropic Claude Skills Best Practices | `official-specification` | `https://agentskills.io/specification` | Public specification |
| `source.3dviz-pro-max-architecture` | 3dviz-pro-max — Evidence-Aware 3D Knowledge & Recipe Catalog Architecture Reference | `reference-implementation` | `https://github.com/viettranx/3dviz-pro-max` | MIT License (architectural pattern reference only; no catalog records copied) |
| `source.blender-release-notes` | Blender Developer Release Notes (Blender 3.6 LTS, 4.0, 4.1, 4.2 LTS, 5.1+) | `official-manual` | `https://developer.blender.org/docs/release_notes/` | CC-BY-SA 4.0 (referenced for version-specific API, node, and modifier transitions) |
| `source.google-filament-pbr` | Physically Based Rendering in Filament (Romain Guy & Mathias Agopian) | `peer-reviewed-research` | `https://google.github.io/filament/Filament.html` | Apache-2.0 (referenced for microfacet BRDF, dielectric F0, and photometric lighting math) |
