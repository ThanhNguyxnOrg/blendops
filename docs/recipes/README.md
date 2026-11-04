# Recipes (Draft v0 + Phase 1 Canonical Recipe Registry)

BlendOps organizes recipes across two linked surfaces so there is never a duplicate source of truth:

1. **Canonical Machine-Readable Recipe Registry (`registry/recipe-catalog.json`)**:
   - Defines 10 reusable, multi-stage `recipe.<slug>` blueprints validated by `schemas/recipe-record.schema.json`, indexed in `registry/catalog-index.json`, and rendered in [`../knowledge-and-recipe-catalog.md`](../knowledge-and-recipe-catalog.md).
   - Used by `recipe-fit-assessor`, `blender-recipe-decomposer`, `workflow-stage-router`, and `bin/blendops.mjs catalog-search --type recipe`.
2. **Human-Readable Scenario Recipes (`docs/recipes/*.md`)**:
   - Concrete, styled walkthroughs that instantiate a canonical recipe for a specific user prompt (linked via `documentation_path` on the canonical recipe record).

## Canonical Machine-Readable Recipes (`registry/recipe-catalog.json`)

- `recipe.product-hero-scene` — Studio Product Hero Still & Web GLB Blueprint (scenario instance: [cyberpunk-shoe-hero](./cyberpunk-shoe-hero.md); pack: [`../../packs/product-hero-v0/PACK.md`](../../packs/product-hero-v0/PACK.md))
- `recipe.stylized-environment-scene` — Stylized / Architectural Environment Vista Blueprint
- `recipe.hard-surface-prop` — Non-Destructive Hard-Surface Prop Modeling Blueprint
- `recipe.procedural-geometry-nodes-asset` — Parametric Geometry Nodes Asset & Scatter Blueprint
- `recipe.uv-and-pbr-material-preparation` — UV Unwrapping, Packing & Cycles PBR Baking Blueprint
- `recipe.presentation-lighting-and-camera` — Studio Lighting, Physical Camera & Color Management Blueprint
- `recipe.rigged-and-animated-asset` — Skeletal Armature Rigging, Weight Painting & NLA Baking Blueprint
- `recipe.scene-quality-inspection-and-correction` — 7-Point Scene Quality Audit & Remediation Blueprint
- `recipe.blender-to-glb-handoff` — Blender to glTF 2.0 / GLB Export & Web Viewer Handoff Blueprint
- `recipe.web-ready-asset-optimization` — Web/Mobile LOD, KTX2 Texture & Draco/Meshopt Optimization Blueprint

## Scenario recipe index (`docs/recipes/`)

- [cyberpunk-shoe-hero](./cyberpunk-shoe-hero.md) — Golden-path scenario instance of `recipe.product-hero-scene`

