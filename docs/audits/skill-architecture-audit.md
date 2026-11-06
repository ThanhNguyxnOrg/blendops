# BlendOps Phase 0, Phase 1 & Phase 2 — Skill Architecture & Reference Classification Audit

> Generated deterministically by `scripts/build-knowledge-catalog.mjs`. Maps all 48 canonical skills from `registry/skills.json` and `registry/runtime-capability-policy.json`, and classifies all 151 `skills/*/references/*.md` files across the 5-layer architecture.

## 1. Five-Layer Architecture Summary

| Layer | Canonical Artifacts | Count / Status | Responsibility |
| :--- | :--- | :--- | :--- |
| **A. Skill Layer** | `skills/*/SKILL.md`, `skills/*/contract.json`, `registry/skills.json`, `registry/workflow-graph.json` | 48 skills, 371 workflow edges | Single-responsibility agent task units, contracts, capability tiers (`L0`–`L3`), and handoffs |
| **B. Knowledge Layer** | `registry/knowledge-sources.json`, `registry/knowledge-catalog.json` | 30 records across 11 domains (20 sources) | Reusable, source-traceable 3D/Blender domain rules, parameters, tradeoffs, and validation checks |
| **C. Recipe Layer** | `registry/recipe-catalog.json`, `docs/recipes/cyberpunk-shoe-hero.md` | 10 canonical recipes + 1 golden-path scenario doc | Multi-stage asset/scene construction plans composing skills, knowledge records, and checkpoints |
| **D. Runtime / Production Layer** | `registry/runtime-capability-policy.json`, `docs/runtime-stack-strategy.md` | External boundary (Path 1 Lab MCP 5.1+, Path 2 `mcp-for-blender` 3.0+, CLI appendix) | External execution bridges; BlendOps owns zero runtime servers or add-ons |
| **E. Evaluation & Evidence Layer** | `evals/suites/`, `evals/catalog-retrieval-evals.json`, `evals/scene-specs/`, `docs/evals/` | Offline contract + retrieval + planner evals passing; runtime = `Not Run`, artifacts = `Not Produced` | Separates schema validity, source backing, version checks, runtime execution, and visual critique |

## 2. Skill Reference Classification & Methodology Summary (151 Files)

- **Derivation Rule for Workflow Stages**: Derived deterministically from registry/skills.json category + role + skill ID: routing-and-governance/brief-and-scope/recipe-and-pack-governance -> discover-and-plan; asset-and-library-governance -> source-and-clear-assets; runtime-and-bridge-governance -> runtime-preflight; scene-and-domain-planning/color-and-render-decisions -> stage-camera-lighting-and-lookdev; quality-and-budget-validation -> inspect-and-validate; web-and-glb-handoff/evidence-and-reporting -> verify-evidence-and-handoff.
- **Classification Methodology**: Combines explicit promoted_from_skill_refs mappings (37 files), rule-based governance & recipe prefix mappings (48 files), rule-based path + heading inspection of skill-local operating instructions (66 files), and verified human semantic reviews (0 files — requires traceable reviewer, timestamp, scope, and outcome evidence).
- **Honesty Note**: outdated_or_duplicated is 0 for exact file hash collisions inside skills/*/references/*.md; 8 skill-local checklist references that border promoted domain topics are explicitly marked review_status="needs_semantic_review", and rule-based prefix classifications are never represented as human_semantic_review without traceable reviewer/timestamp/scope/outcome evidence.

| Classification Category | File Count | Primary Method | Description |
| :--- | ---: | :--- | :--- |
| `reusable_cross_skill_knowledge` | 37 | `knowledge_promotion_mapping` | Domain rules promoted to canonical `knowledge.*` records in `registry/knowledge-catalog.json` |
| `skill_specific_operating_instructions` | 66 | `rule_based_path_and_heading_inspection` (8 flagged `needs_semantic_review`) | Skill-local checklists, report templates, and step-by-step operating instructions |
| `workflow_or_pack_governance` | 42 | `rule_based_governance_and_recipe_mapping` | Stage routing, intake clarification, pack prerequisite, stage gates, and runtime path governance |
| `recipe_specific_procedure` | 6 | `rule_based_governance_and_recipe_mapping` | Recipe discovery catalog and recipe decomposition rules synchronized with `registry/recipe-catalog.json` |
| `historical_or_eval_evidence` | 0 | Stored in `docs/evals/` (12 files) | Historical evaluation and runtime evidence records live under `docs/evals/` rather than inside `skills/*/references/` |
| `outdated_or_duplicated` | 0 | Exact hash & promotion audit | Zero exact duplicate reference files; 8 adjacent checklist files tracked under `needs_semantic_review` |
| **Total** | **151** | **100% accounted for** | **All 151 `skills/*/references/*.md` files classified with zero `undefined` fields** |

## 3. Complete 48-Skill Architecture Matrix

| # | Skill ID | Category | Derived Stage | Capability Tier (Ceiling) | Role Classification | Disposition | Linked Knowledge | Linked Recipes | Refs |
| ---: | :--- | :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: |
| 1 | `blendops-help` | `routing-and-governance` | `discover-and-plan` | `L0` (`L0`) | `intake-routing-or-governance` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 2 | `recipe-fit-assessor` | `routing-and-governance` | `discover-and-plan` | `L0` (`L0`) | `intake-routing-or-governance` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 3 | `pack-prerequisite-checker` | `routing-and-governance` | `discover-and-plan` | `L0` (`L0`) | `intake-routing-or-governance` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 4 | `workflow-stage-router` | `routing-and-governance` | `discover-and-plan` | `L0` (`L0`) | `intake-routing-or-governance` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 5 | `acceptance-criteria-builder` | `process-discipline` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 1 | 0 | 3 |
| 6 | `asset-discovery` | `asset-and-sourcing` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 2 | 3 |
| 7 | `asset-fallback-strategy` | `asset-and-sourcing` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 1 | 3 |
| 8 | `asset-library-plan` | `asset-and-sourcing` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 9 | `asset-license-checker` | `asset-and-sourcing` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 2 | 3 |
| 10 | `asset-style-check` | `asset-and-sourcing` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 2 | 3 |
| 11 | `blender-brainstorming` | `process-discipline` | `discover-and-plan` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 12 | `blender-recipe-decomposer` | `process-discipline` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 13 | `blender-troubleshooting` | `runtime-and-execution` | `inspect-and-validate` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 1 | 3 |
| 14 | `bridge-conflicts` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 15 | `camera-composition` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 3 | 4 |
| 16 | `character-portrait` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 4 | 1 | 3 |
| 17 | `cli-appendix-job-outline` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L3`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 18 | `color-management-decision` | `render-and-output-decisions` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 3 | 3 |
| 19 | `composition-quality-checker` | `quality-validators` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 4 | 3 |
| 20 | `cycles-vs-eevee-decision` | `render-and-output-decisions` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 4 | 3 |
| 21 | `done-criteria` | `process-discipline` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 4 | 3 |
| 22 | `environment-shot` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 5 | 1 | 3 |
| 23 | `glb-animation-handoff` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 2 | 3 |
| 24 | `glb-web-handoff` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 11 | 5 | 4 |
| 25 | `intent-to-3d-brief-writer` | `process-discipline` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 5 | 3 |
| 26 | `interior-scene` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 1 | 3 |
| 27 | `lighting-material-plan` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 10 | 6 | 5 |
| 28 | `lighting-quality-checker` | `quality-validators` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 4 | 3 |
| 29 | `material-quality-checker` | `quality-validators` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 8 | 7 | 3 |
| 30 | `mobile-glb-budget` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 10 | 3 | 3 |
| 31 | `output-format-decision` | `render-and-output-decisions` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 3 | 3 |
| 32 | `path-one-host-outline` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 33 | `plain-language-response` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 10 | 4 |
| 34 | `polycount-budget-checker` | `quality-validators` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 12 | 7 | 3 |
| 35 | `pre-handoff-verification` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 4 | 10 | 3 |
| 36 | `preview-report` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 1 | 3 |
| 37 | `product-grid-scene-planner` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 38 | `product-hero-scene-planner` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 9 | 1 | 4 |
| 39 | `r3f-component-plan` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 9 | 3 | 3 |
| 40 | `render-export-evidence` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 1 | 4 | 3 |
| 41 | `resolution-aspect-decision` | `render-and-output-decisions` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 3 | 3 |
| 42 | `runtime-attempt-report` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 43 | `runtime-path-picker` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 44 | `runtime-readiness` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 45 | `runtime-setup` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 3 |
| 46 | `scene-readiness` | `quality-validators` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 7 | 7 | 4 |
| 47 | `scope-guard` | `process-discipline` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 1 | 3 |
| 48 | `stage-gates` | `process-discipline` | `stage-camera-lighting-and-lookdev` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 5 | 3 |

## 4. Promoted Cross-Skill Reference Files -> Canonical Knowledge Records

| Reference File Path | Title | Classification | Method | Promoted To Canonical `knowledge.*` ID(s) |
| :--- | :--- | :--- | :--- | :--- |
| `skills/recipe-fit-assessor/references/recipe-catalog.md` | Recipe / pack catalog (BlendOps v0 + Phase 1 Canonical Recipe Registry) | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/recipe-fit-assessor/references/scope-gap-rules.md` | Scope gap rules | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/recipe-fit-assessor/references/workflow-recommendation-template.md` | Workflow recommendation template | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blender-recipe-decomposer/references/dependency-patterns.md` | Dependency patterns | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blender-recipe-decomposer/references/recipe-grouping-rules.md` | Recipe grouping rules | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blender-recipe-decomposer/references/recipe-naming-rules.md` | Recipe naming rules | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blender-troubleshooting/references/common-symptom-playbooks.md` | Common Symptom Playbooks | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.boolean-bevel-shading-cleanup`, `knowledge.high-to-low-normal-and-ao-baking` |
| `skills/camera-composition/references/camera-presets.md` | Camera Presets | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/camera-composition/references/camera-rubric.md` | Camera Rubric | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/character-portrait/references/portrait-framing-rules.md` | Portrait framing rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/character-portrait/references/style-consistency-rules.md` | Style consistency rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.organic-sculpt-to-retopology-workflow` |
| `skills/color-management-decision/references/look-comparison.md` | Look comparison (Filmic vs Standard vs AgX) | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity` |
| `skills/composition-quality-checker/references/aspect-ratio-rules.md` | Aspect ratio rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/cycles-vs-eevee-decision/references/engine-feature-matrix.md` | Engine feature matrix | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.volumetrics-fog-and-principled-volume-tradeoffs` |
| `skills/environment-shot/references/depth-layering-rules.md` | Depth layering rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.procedural-scatter-poisson-disk-and-slope-masking`, `knowledge.volumetrics-fog-and-principled-volume-tradeoffs`, `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/glb-animation-handoff/references/animation-types.md` | Animation Types in GLB | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.armature-joint-hierarchy-and-linear-blend-skinning`, `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.rigid-body-cloth-and-simulation-cache-baking` |
| `skills/glb-animation-handoff/references/web-stack-caveats.md` | Web stack caveats per consumer | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.armature-joint-hierarchy-and-linear-blend-skinning`, `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.rigid-body-cloth-and-simulation-cache-baking` |
| `skills/glb-web-handoff/references/artifact-status-language.md` | Artifact Status Language | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression`, `knowledge.gltf-2-coordinate-system-and-transform-conventions`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/interior-scene/references/furniture-layout-rules.md` | Furniture layout rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.modular-architectural-grid-and-metric-scale` |
| `skills/interior-scene/references/interior-camera-rules.md` | Interior camera rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/lighting-material-plan/references/cyberpunk-lookdev.md` | Cyberpunk Lookdev | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.volumetrics-fog-and-principled-volume-tradeoffs` |
| `skills/lighting-material-plan/references/lighting-patterns.md` | Lighting Patterns | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/lighting-material-plan/references/material-portability.md` | Material Portability | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.uv-seam-placement-and-texel-density`, `knowledge.shader-node-gltf-export-portability` |
| `skills/lighting-material-plan/references/web-material-simplification.md` | Web Material Simplification | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.normal-roughness-and-orm-channel-packing` |
| `skills/lighting-quality-checker/references/hdri-balance-rules.md` | HDRI + explicit-light balance rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/lighting-quality-checker/references/intensity-ranges.md` | Light intensity ranges (sanity reference) | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/lighting-quality-checker/references/shadow-softness-rules.md` | Shadow softness rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/material-quality-checker/references/consumer-stack-rules.md` | Consumer stack compatibility rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.shader-node-gltf-export-portability` |
| `skills/material-quality-checker/references/pbr-sanity-rules.md` | PBR sanity rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.high-to-low-normal-and-ao-baking`, `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.normal-roughness-and-orm-channel-packing` |
| `skills/material-quality-checker/references/texture-budget-rules.md` | Texture budget rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.uv-seam-placement-and-texel-density`, `knowledge.udim-vs-single-atlas-uv-packing` |
| `skills/mobile-glb-budget/references/budget-tiers.md` | Mobile-web GLB Budget Tiers | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression` |
| `skills/mobile-glb-budget/references/degradation-plan.md` | Degradation Plan (drop order when over budget) | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.udim-vs-single-atlas-uv-packing` |
| `skills/output-format-decision/references/bit-depth-rules.md` | Bit-depth rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.agx-filmic-color-management-and-cycles-eevee` |
| `skills/polycount-budget-checker/references/instance-counting-rules.md` | Instance counting rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.geometry-nodes-fields-and-anonymous-attributes`, `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.procedural-scatter-poisson-disk-and-slope-masking`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.lod-hierarchy-and-decimation-strategy` |
| `skills/polycount-budget-checker/references/per-mesh-rules.md` | Per-mesh budget rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.mesh-manifold-normals-and-scale-hygiene` |
| `skills/polycount-budget-checker/references/topology-hints.md` | Topology hints (advisory only) | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.quad-dominant-subdivision-topology`, `knowledge.non-destructive-hard-surface-modifier-stack`, `knowledge.organic-sculpt-to-retopology-workflow` |
| `skills/pre-handoff-verification/references/downgrade-rules.md` | Downgrade Rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/product-hero-scene-planner/references/clarification-patterns.md` | Clarification Patterns | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/product-hero-scene-planner/references/cyberpunk-shoe-example.md` | Cyberpunk Shoe Example | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.cad-creases-and-panel-gap-detailing` |
| `skills/product-hero-scene-planner/references/product-hero-playbooks.md` | Product Hero Playbooks | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.non-destructive-hard-surface-modifier-stack`, `knowledge.cad-creases-and-panel-gap-detailing` |
| `skills/r3f-component-plan/references/component-shape-patterns.md` | Component shape patterns for R3F GLB consumers | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.lod-hierarchy-and-decimation-strategy`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity` |
| `skills/render-export-evidence/references/attempted-vs-failed-rubric.md` | `Attempted` vs `Failed` Rubric | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/scene-readiness/references/blocker-catalog.md` | Blocker Catalog | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.gltf-2-coordinate-system-and-transform-conventions` |
