# Recipe / pack catalog (BlendOps v0 + Phase 1 Canonical Recipe Registry)

Use this table for fast fit scoring. Machine-readable recipe definitions live in `registry/recipe-catalog.json` (indexed in `registry/catalog-index.json` and rendered in `docs/knowledge-and-recipe-catalog.md`); human-readable scenario examples and packs live under `docs/recipes/`, `docs/workflows/`, and `packs/`.

## Canonical Machine-Readable Recipes (`registry/recipe-catalog.json`)

| Canonical Recipe ID | Primary Domain | Primary Outputs | Best When | Weak Fit When |
|---|---|---|---|---|
| `recipe.product-hero-scene` | `lighting-camera-and-rendering` | Hero still render + optional web GLB (`packs/product-hero-v0`, `docs/recipes/cyberpunk-shoe-hero.md`) | Single focal product, studio lighting, hero framing | Crowd scenes, multi-character narrative |
| `recipe.stylized-environment-scene` | `environment-and-architecture` | Wide/establishing environment render | Exterior or stylized architectural vista with foreground/midground/background depth | Single isolated studio prop |
| `recipe.hard-surface-prop` | `hard-surface-and-organic` | Subdivision/bevel-clean hard-surface prop mesh | Mechanical, industrial, consumer electronics, or weapon/vehicle props | Organic sculpted characters or cloth |
| `recipe.procedural-geometry-nodes-asset` | `geometry-nodes-and-procedural` | Parametric Geometry Nodes asset + realized mesh | Modular variation, Poisson disk scattering, instanced arrays | Hand-sculpted hero character faces |
| `recipe.uv-and-pbr-material-preparation` | `uv-texturing-and-baking` | 0–1 UV layout + baked tangent-space normal/AO/ORM PBR maps | High-to-low poly baking, procedural-to-image PBR conversion | Untextured clay blockouts |
| `recipe.presentation-lighting-and-camera` | `lighting-camera-and-rendering` | Physical camera rig + 3-point/HDRI lighting + AgX/Filmic look | Portfolio presentation, studio turntables, architectural lighting | Unlit collision meshes |
| `recipe.rigged-and-animated-asset` | `rigging-and-animation` | Skeletal armature + normalized skin weights + baked NLA clips | Character/creature locomotion, mechanical articulated animation | Static props using simple object transforms |
| `recipe.scene-quality-inspection-and-correction` | `modeling-and-topology` | 7-point pre-handoff audit + remediation plan | Auditing topology, transforms, UV padding, materials, and lighting before render/export | Initial ideation with no scene geometry |
| `recipe.blender-to-glb-handoff` | `interchange-gltf-and-web` | Validated `.glb` binary + Khronos/Three.js/R3F handoff manifest | Exporting Blender assets to Three.js, React Three Fiber, or `<model-viewer>` | Offline-only Cycles EXR compositing |
| `recipe.web-ready-asset-optimization` | `optimization-lod-and-performance` | Decimated LODs + KTX2 (UASTC/ETC1S) + Draco/Meshopt compressed GLB | Mobile/web bandwidth and VRAM optimization under strict triangle/draw-call budgets | Unconstrained offline archival masters |

## Packs, Scenario Recipes & Workflow Chains

| Entry | Primary outputs | Best when | Weak fit when |
|---|---|---|---|
| `product-hero-v0` pack (`packs/product-hero-v0/PACK.md`) | Hero still + GLB path (bound to `recipe.product-hero-scene`) | Single product focal, studio lighting | Crowd scenes, heavy narrative |
| `docs/recipes/cyberpunk-shoe-hero.md` | Styled hero scenario instance of `recipe.product-hero-scene` | Teaching golden-path thinking | Non-footwear without adaptation |
| `docs/workflows/product-hero-workflow.md` | 5-stage hero subset | Narrow product pipeline | Needs full cross-domain chain |
| `docs/workflows/full-non-blender-user-workflow.md` | Broad 7-stage chain | Unknown scope, first-time user | User already locked a niche |

Cross-reference specialized planners (`character-portrait`, `environment-shot`, `interior-scene`, `product-grid-scene-planner`) and deterministic lookup (`blendops catalog-search --type recipe "<query>"`) when `product-hero-v0` is only a partial match.

