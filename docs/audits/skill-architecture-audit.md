# BlendOps Phase 0 & Phase 1 — Skill Architecture & Reference Classification Audit

> Generated deterministically by `scripts/build-knowledge-catalog.mjs`. Maps all 48 canonical skills and classifies all 151 `skills/*/references/*.md` files across the 5-layer architecture.

## 1. Five-Layer Architecture Summary

| Layer | Canonical Artifacts | Count / Status | Responsibility |
| :--- | :--- | :--- | :--- |
| **A. Skill Layer** | `skills/*/SKILL.md`, `registry/skills.json`, `registry/workflow-graph.json` | 48 skills, 371 workflow edges | Single-responsibility agent task units, contracts, capability tiers (`L0`–`L3`), and handoffs |
| **B. Knowledge Layer** | `registry/knowledge-sources.json`, `registry/knowledge-catalog.json` | 30 records across 11 domains (20 sources) | Reusable, source-traceable 3D/Blender domain rules, parameters, tradeoffs, and validation checks |
| **C. Recipe Layer** | `registry/recipe-catalog.json`, `docs/recipes/cyberpunk-shoe-hero.md` | 10 canonical recipes + 1 golden-path scenario doc | Multi-stage asset/scene construction plans composing skills, knowledge records, and checkpoints |
| **D. Runtime / Production Layer** | `registry/runtime-capability-policy.json`, `docs/runtime-stack-strategy.md` | External boundary (Path 1 Lab MCP 5.1+, Path 2 `mcp-for-blender` 3.0+, CLI appendix) | External execution bridges; BlendOps owns zero runtime servers or add-ons |
| **E. Evaluation & Evidence Layer** | `evals/suites/`, `evals/catalog-retrieval-evals.json`, `docs/evals/` | Offline contract + retrieval evals passing; runtime = `Not Run`, artifacts = `Not Produced` | Separates schema validity, source backing, version checks, runtime execution, and visual critique |

## 2. Skill Reference Classification Summary (151 Files)

| Classification Category | File Count | Description |
| :--- | ---: | :--- |
| `reusable_cross_skill_knowledge` | 37 | Domain rules promoted to canonical `knowledge.*` records in `registry/knowledge-catalog.json` |
| `skill_specific_operating_instructions` | 99 | Skill-local checklists, report templates, and step-by-step operating instructions |
| `workflow_or_pack_governance` | 9 | Stage routing, intake clarification, pack prerequisite, checkpoint, and rollback governance |
| `recipe_specific_procedure` | 6 | Recipe discovery catalog and recipe decomposition rules synchronized with `registry/recipe-catalog.json` |
| `historical_or_eval_evidence` | 0 | Historical evaluation or runtime evidence records (stored under `docs/evals/` and `docs/audits/`) |
| `outdated_or_duplicated` | 0 | Unreconciled duplicate or stale skill reference files |
| **Total** | **151** | **100% of `skills/*/references/*.md` accounted for** |

## 3. Complete 48-Skill Architecture Matrix

| # | Skill ID | Stage | Capability Tier | Role Classification | Disposition | Linked Knowledge | Linked Recipes | Refs |
| ---: | :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: |
| 1 | `blendops-help` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 2 | `recipe-fit-assessor` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 3 | `pack-prerequisite-checker` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 4 | `workflow-stage-router` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 5 | `acceptance-criteria-builder` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 1 | 0 | 3 |
| 6 | `asset-discovery` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 2 | 3 |
| 7 | `asset-fallback-strategy` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 1 | 3 |
| 8 | `asset-library-plan` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 9 | `asset-license-checker` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 2 | 3 |
| 10 | `asset-style-check` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 2 | 3 |
| 11 | `blender-brainstorming` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 12 | `blender-recipe-decomposer` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 13 | `blender-troubleshooting` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 1 | 3 |
| 14 | `bridge-conflicts` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 15 | `camera-composition` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 3 | 4 |
| 16 | `character-portrait` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 4 | 1 | 3 |
| 17 | `cli-appendix-job-outline` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 18 | `color-management-decision` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 3 | 3 |
| 19 | `composition-quality-checker` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 4 | 3 |
| 20 | `cycles-vs-eevee-decision` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 4 | 3 |
| 21 | `done-criteria` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 4 | 3 |
| 22 | `environment-shot` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 5 | 1 | 3 |
| 23 | `glb-animation-handoff` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 2 | 3 |
| 24 | `glb-web-handoff` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 11 | 5 | 4 |
| 25 | `intent-to-3d-brief-writer` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 5 | 3 |
| 26 | `interior-scene` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 1 | 3 |
| 27 | `lighting-material-plan` | `undefined` | `undefined` | `uv-material-or-lookdev-workflow` | `keep_as_skill_and_link_knowledge` | 10 | 6 | 5 |
| 28 | `lighting-quality-checker` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 4 | 3 |
| 29 | `material-quality-checker` | `undefined` | `undefined` | `uv-material-or-lookdev-workflow` | `keep_as_skill_and_link_knowledge` | 8 | 7 | 3 |
| 30 | `mobile-glb-budget` | `undefined` | `undefined` | `optimization-or-budget-audit` | `keep_as_skill_and_link_knowledge` | 10 | 3 | 3 |
| 31 | `output-format-decision` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 3 | 3 |
| 32 | `path-one-host-outline` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 33 | `plain-language-response` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 10 | 4 |
| 34 | `polycount-budget-checker` | `undefined` | `undefined` | `optimization-or-budget-audit` | `keep_as_skill_and_link_knowledge` | 12 | 7 | 3 |
| 35 | `pre-handoff-verification` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 4 | 10 | 3 |
| 36 | `preview-report` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 1 | 3 |
| 37 | `product-grid-scene-planner` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 38 | `product-hero-scene-planner` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 9 | 1 | 4 |
| 39 | `r3f-component-plan` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 9 | 3 | 3 |
| 40 | `render-export-evidence` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 1 | 4 | 3 |
| 41 | `resolution-aspect-decision` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 3 | 3 |
| 42 | `runtime-attempt-report` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 43 | `runtime-path-picker` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 44 | `runtime-readiness` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 45 | `runtime-setup` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 46 | `scene-readiness` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 7 | 7 | 4 |
| 47 | `scope-guard` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 1 | 3 |
| 48 | `stage-gates` | `undefined` | `undefined` | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 5 | 3 |

## 4. Promoted Cross-Skill Reference Files -> Canonical Knowledge Records

| Reference File Path | Classification | Promoted To Canonical `knowledge.*` ID(s) |
| :--- | :--- | :--- |
| `skills/recipe-fit-assessor/references/recipe-catalog.md` | `recipe_specific_procedure` | Synchronized with `registry/recipe-catalog.json` |
| `skills/recipe-fit-assessor/references/scope-gap-rules.md` | `recipe_specific_procedure` | Synchronized with `registry/recipe-catalog.json` |
| `skills/recipe-fit-assessor/references/workflow-recommendation-template.md` | `recipe_specific_procedure` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blender-recipe-decomposer/references/dependency-patterns.md` | `recipe_specific_procedure` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blender-recipe-decomposer/references/recipe-grouping-rules.md` | `recipe_specific_procedure` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blender-recipe-decomposer/references/recipe-naming-rules.md` | `recipe_specific_procedure` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blender-troubleshooting/references/common-symptom-playbooks.md` | `reusable_cross_skill_knowledge` | `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.boolean-bevel-shading-cleanup`, `knowledge.high-to-low-normal-and-ao-baking` |
| `skills/camera-composition/references/camera-presets.md` | `reusable_cross_skill_knowledge` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/camera-composition/references/camera-rubric.md` | `reusable_cross_skill_knowledge` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/character-portrait/references/portrait-framing-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/character-portrait/references/style-consistency-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.organic-sculpt-to-retopology-workflow` |
| `skills/color-management-decision/references/look-comparison.md` | `reusable_cross_skill_knowledge` | `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity` |
| `skills/composition-quality-checker/references/aspect-ratio-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/cycles-vs-eevee-decision/references/engine-feature-matrix.md` | `reusable_cross_skill_knowledge` | `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.volumetrics-fog-and-principled-volume-tradeoffs` |
| `skills/environment-shot/references/depth-layering-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.procedural-scatter-poisson-disk-and-slope-masking`, `knowledge.volumetrics-fog-and-principled-volume-tradeoffs`, `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/glb-animation-handoff/references/animation-types.md` | `reusable_cross_skill_knowledge` | `knowledge.armature-joint-hierarchy-and-linear-blend-skinning`, `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.rigid-body-cloth-and-simulation-cache-baking` |
| `skills/glb-animation-handoff/references/web-stack-caveats.md` | `reusable_cross_skill_knowledge` | `knowledge.armature-joint-hierarchy-and-linear-blend-skinning`, `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.rigid-body-cloth-and-simulation-cache-baking` |
| `skills/glb-web-handoff/references/artifact-status-language.md` | `reusable_cross_skill_knowledge` | `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression`, `knowledge.gltf-2-coordinate-system-and-transform-conventions`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/interior-scene/references/furniture-layout-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.modular-architectural-grid-and-metric-scale` |
| `skills/interior-scene/references/interior-camera-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/lighting-material-plan/references/cyberpunk-lookdev.md` | `reusable_cross_skill_knowledge` | `knowledge.volumetrics-fog-and-principled-volume-tradeoffs` |
| `skills/lighting-material-plan/references/lighting-patterns.md` | `reusable_cross_skill_knowledge` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/lighting-material-plan/references/material-portability.md` | `reusable_cross_skill_knowledge` | `knowledge.uv-seam-placement-and-texel-density`, `knowledge.shader-node-gltf-export-portability` |
| `skills/lighting-material-plan/references/web-material-simplification.md` | `reusable_cross_skill_knowledge` | `knowledge.normal-roughness-and-orm-channel-packing` |
| `skills/lighting-quality-checker/references/hdri-balance-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/lighting-quality-checker/references/intensity-ranges.md` | `reusable_cross_skill_knowledge` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/lighting-quality-checker/references/shadow-softness-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/material-quality-checker/references/consumer-stack-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.shader-node-gltf-export-portability` |
| `skills/material-quality-checker/references/pbr-sanity-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.high-to-low-normal-and-ao-baking`, `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.normal-roughness-and-orm-channel-packing` |
| `skills/material-quality-checker/references/texture-budget-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.uv-seam-placement-and-texel-density`, `knowledge.udim-vs-single-atlas-uv-packing` |
| `skills/mobile-glb-budget/references/budget-tiers.md` | `reusable_cross_skill_knowledge` | `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression` |
| `skills/mobile-glb-budget/references/degradation-plan.md` | `reusable_cross_skill_knowledge` | `knowledge.udim-vs-single-atlas-uv-packing` |
| `skills/output-format-decision/references/bit-depth-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.agx-filmic-color-management-and-cycles-eevee` |
| `skills/polycount-budget-checker/references/instance-counting-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.geometry-nodes-fields-and-anonymous-attributes`, `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.procedural-scatter-poisson-disk-and-slope-masking`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.lod-hierarchy-and-decimation-strategy` |
| `skills/polycount-budget-checker/references/per-mesh-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.mesh-manifold-normals-and-scale-hygiene` |
| `skills/polycount-budget-checker/references/topology-hints.md` | `reusable_cross_skill_knowledge` | `knowledge.quad-dominant-subdivision-topology`, `knowledge.non-destructive-hard-surface-modifier-stack`, `knowledge.organic-sculpt-to-retopology-workflow` |
| `skills/pre-handoff-verification/references/downgrade-rules.md` | `reusable_cross_skill_knowledge` | `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/product-hero-scene-planner/references/clarification-patterns.md` | `reusable_cross_skill_knowledge` | `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/product-hero-scene-planner/references/cyberpunk-shoe-example.md` | `reusable_cross_skill_knowledge` | `knowledge.cad-creases-and-panel-gap-detailing` |
| `skills/product-hero-scene-planner/references/product-hero-playbooks.md` | `reusable_cross_skill_knowledge` | `knowledge.non-destructive-hard-surface-modifier-stack`, `knowledge.cad-creases-and-panel-gap-detailing` |
| `skills/r3f-component-plan/references/component-shape-patterns.md` | `reusable_cross_skill_knowledge` | `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.lod-hierarchy-and-decimation-strategy`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity` |
| `skills/render-export-evidence/references/attempted-vs-failed-rubric.md` | `reusable_cross_skill_knowledge` | `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/scene-readiness/references/blocker-catalog.md` | `reusable_cross_skill_knowledge` | `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.gltf-2-coordinate-system-and-transform-conventions` |
