# BlendOps — Skill Architecture & Reference Classification Audit

> Generated deterministically by `scripts/build-knowledge-catalog.mjs`. Maps all 16 canonical skills from `registry/skills.json` and `registry/runtime-capability-policy.json`, and classifies all 205 `skills/*/references/*.md` files across the 5-layer architecture.

## 1. Five-Layer Architecture Summary

| Layer | Canonical Artifacts | Count / Status | Responsibility |
| :--- | :--- | :--- | :--- |
| **A. Skill Layer** | `skills/*/SKILL.md`, `skills/*/contract.json`, `registry/skills.json`, `registry/workflow-graph.json` | 16 skills, 204 workflow edges | Single-responsibility agent task units, contracts, capability tiers (`L0`–`L3`), and handoffs |
| **B. Knowledge Layer** | `registry/knowledge-sources.json`, `registry/knowledge-catalog.json` | 30 records across 11 domains (20 sources) | Reusable, source-traceable 3D/Blender domain rules, parameters, tradeoffs, and validation checks |
| **C. Recipe Layer** | `registry/recipe-catalog.json`, `docs/recipes/cyberpunk-shoe-hero.md` | 10 canonical recipes + 1 golden-path scenario doc | Multi-stage asset/scene construction plans composing skills, knowledge records, and checkpoints |
| **D. Runtime / Production Layer** | `registry/runtime-capability-policy.json`, `docs/runtime-stack-strategy.md` | External boundary (Path 1 Lab MCP 5.1+, Path 2 `mcp-for-blender` 3.0+, CLI appendix) | External execution bridges; BlendOps owns zero runtime servers or add-ons |
| **E. Evaluation & Evidence Layer** | `evals/suites/`, `evals/catalog-retrieval-evals.json`, `evals/scene-specs/`, `docs/evals/` | Offline contract + retrieval + planner evals passing; runtime = `Not Run`, artifacts = `Not Produced` | Separates schema validity, source backing, version checks, runtime execution, and visual critique |

## 2. Skill Reference Classification & Methodology Summary (205 Files)

- **Derivation Rule for Workflow Stages**: Derived deterministically from registry/skills.json category + role + skill ID: routing-and-governance/brief-and-scope/recipe-and-pack-governance -> discover-and-plan; asset-and-library-governance -> source-and-clear-assets; runtime-and-bridge-governance -> runtime-preflight; scene-and-domain-planning/color-and-render-decisions -> stage-camera-lighting-and-lookdev; quality-and-budget-validation -> inspect-and-validate; web-and-glb-handoff/evidence-and-reporting -> verify-evidence-and-handoff.
- **Classification Methodology**: Combines explicit promoted_from_skill_refs mappings (37 files), rule-based governance & recipe prefix mappings (91 files), rule-based path + heading inspection of skill-local operating instructions (83 files), and verified human semantic reviews (0 files — requires traceable reviewer, timestamp, scope, and outcome evidence).
- **Honesty Note**: outdated_or_duplicated is 0 for exact file hash collisions inside skills/*/references/*.md; 8 skill-local checklist references that border promoted domain topics are explicitly marked review_status="needs_semantic_review", and rule-based prefix classifications are never represented as human_semantic_review without traceable reviewer/timestamp/scope/outcome evidence.

| Classification Category | File Count | Primary Method | Description |
| :--- | ---: | :--- | :--- |
| `reusable_cross_skill_knowledge` | 37 | `knowledge_promotion_mapping` | Domain rules promoted to canonical `knowledge.*` records in `registry/knowledge-catalog.json` |
| `skill_specific_operating_instructions` | 83 | `rule_based_path_and_heading_inspection` (5 flagged `needs_semantic_review`) | Skill-local checklists, report templates, and step-by-step operating instructions |
| `workflow_or_pack_governance` | 75 | `rule_based_governance_and_recipe_mapping` | Stage routing, intake clarification, pack prerequisite, stage gates, and runtime path governance |
| `recipe_specific_procedure` | 16 | `rule_based_governance_and_recipe_mapping` | Recipe discovery catalog and recipe decomposition rules synchronized with `registry/recipe-catalog.json` |
| `historical_or_eval_evidence` | 0 | Stored in `docs/evals/` (16 files) | Historical evaluation and runtime evidence records live under `docs/evals/` rather than inside `skills/*/references/` |
| `outdated_or_duplicated` | 0 | Exact hash & promotion audit | Zero exact duplicate reference files; 5 adjacent checklist files tracked under `needs_semantic_review` |
| **Total** | **211** | **100% accounted for** | **All 205 `skills/*/references/*.md` files classified with zero `undefined` fields** |

## 3. Complete 14-Skill Architecture Matrix

| # | Skill ID | Category | Derived Stage | Capability Tier (Ceiling) | Role Classification | Disposition | Linked Knowledge | Linked Recipes | Refs |
| ---: | :--- | :--- | :--- | :--- | :--- | :--- | ---: | ---: | ---: |
| 1 | `blendops-brief` | `routing-and-governance` | `discover-and-plan` | `L0` (`L0`) | `intake-routing-or-governance` | `keep_as_skill_and_link_knowledge` | 0 | 5 | 16 |
| 2 | `blendops-done-criteria` | `routing-and-governance` | `discover-and-plan` | `L0` (`L0`) | `intake-routing-or-governance` | `keep_as_skill_and_link_knowledge` | 1 | 7 | 20 |
| 3 | `blendops-start` | `routing-and-governance` | `discover-and-plan` | `L0` (`L0`) | `intake-routing-or-governance` | `keep_as_skill_and_link_knowledge` | 0 | 10 | 13 |
| 4 | `blendops-assets` | `asset-and-sourcing` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 4 | 20 |
| 5 | `blendops-build` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L3`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 7 |
| 6 | `blendops-camera` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 2 | 4 | 13 |
| 7 | `blendops-connect-blender` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L3`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 24 |
| 8 | `blendops-final-check` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 9 | 10 | 21 |
| 9 | `blendops-fix-problems` | `quality-validators` | `inspect-and-validate` | `L0` (`L0`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 3 | 1 | 4 |
| 10 | `blendops-glb-budget` | `quality-validators` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 17 | 8 | 8 |
| 11 | `blendops-glb-web-handoff` | `evidence-and-handoff` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 14 | 5 | 13 |
| 12 | `blendops-lighting-materials` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 13 | 9 | 18 |
| 13 | `blendops-look-check` | `runtime-and-execution` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 0 | 0 | 5 |
| 14 | `blendops-product-shot` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 9 | 1 | 9 |
| 15 | `blendops-render-settings` | `render-and-output-decisions` | `stage-camera-lighting-and-lookdev` | `L0` (`L2`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 5 | 5 | 8 |
| 16 | `blendops-scene-plan` | `scene-planners` | `stage-camera-lighting-and-lookdev` | `L0` (`L1`) | `modeling-or-procedural-workflow` | `keep_as_skill_and_link_knowledge` | 8 | 2 | 12 |

## 4. Promoted Cross-Skill Reference Files -> Canonical Knowledge Records

| Reference File Path | Title | Classification | Method | Promoted To Canonical `knowledge.*` ID(s) |
| :--- | :--- | :--- | :--- | :--- |
| `skills/blendops-brief/references/acceptance-criteria-patterns.md` | Acceptance Criteria Patterns | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/alternative-scoping-templates.md` | Alternative Scoping Templates | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/blender-brainstorming.md` | blendops-brief (reference for `blendops-brief`) | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/blender-recipe-decomposer.md` | blendops-brief (reference for `blendops-brief`) | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/clarification-patterns.md` | Clarification Patterns | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/dependency-patterns.md` | Dependency patterns | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/eight-slot-template.md` | 8-Slot Brief Template | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/intent-summary-style-guide.md` | Intent Summary Style Guide | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/intent-to-3d-brief-writer.md` | blendops-brief (reference for `blendops-brief`) | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/mixed-audience-handling.md` | Mixed Audience Handling | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/recipe-catalog.md` | Recipe / pack catalog (BlendOps Canonical Recipe Registry) | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/recipe-fit-assessor.md` | blendops-brief (reference for `blendops-brief`) | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/recipe-grouping-rules.md` | Recipe grouping rules | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/recipe-naming-rules.md` | Recipe naming rules | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/scope-gap-rules.md` | Scope Gap Rules | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-brief/references/workflow-recommendation-template.md` | Workflow Recommendation Template | `recipe_specific_procedure` | `rule_based_governance_and_recipe_mapping` | Synchronized with `registry/recipe-catalog.json` |
| `skills/blendops-camera/references/aspect-ratio-rules.md` | Aspect ratio rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/blendops-camera/references/camera-presets.md` | Camera Presets & Framing Calibration | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/blendops-camera/references/camera-rubric.md` | Camera Rubric | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/blendops-final-check/references/attempted-vs-failed-rubric.md` | `Attempted` vs `Failed` Rubric | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/blendops-final-check/references/blocker-catalog.md` | Blocker Catalog | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.gltf-2-coordinate-system-and-transform-conventions` |
| `skills/blendops-final-check/references/downgrade-rules.md` | Downgrade Rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/blendops-fix-problems/references/common-symptom-playbooks.md` | Common Symptom Playbooks | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.mesh-manifold-normals-and-scale-hygiene`, `knowledge.boolean-bevel-shading-cleanup`, `knowledge.high-to-low-normal-and-ao-baking` |
| `skills/blendops-glb-budget/references/budget-tiers.md` | Mobile-web GLB Budget Tiers | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression` |
| `skills/blendops-glb-budget/references/degradation-plan.md` | Degradation Plan (drop order when over budget) | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.udim-vs-single-atlas-uv-packing` |
| `skills/blendops-glb-budget/references/instance-counting-rules.md` | Instance counting rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.geometry-nodes-fields-and-anonymous-attributes`, `knowledge.procedural-instancing-and-realize-instances-budget`, `knowledge.procedural-scatter-poisson-disk-and-slope-masking`, `knowledge.triangle-draw-call-and-vram-budgets`, `knowledge.lod-hierarchy-and-decimation-strategy` |
| `skills/blendops-glb-budget/references/per-mesh-rules.md` | Per-mesh budget rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.mesh-manifold-normals-and-scale-hygiene` |
| `skills/blendops-glb-budget/references/topology-hints.md` | Topology hints (advisory only) | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.quad-dominant-subdivision-topology`, `knowledge.non-destructive-hard-surface-modifier-stack`, `knowledge.organic-sculpt-to-retopology-workflow` |
| `skills/blendops-glb-web-handoff/references/animation-types.md` | Animation Types in GLB | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.armature-joint-hierarchy-and-linear-blend-skinning`, `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.rigid-body-cloth-and-simulation-cache-baking` |
| `skills/blendops-glb-web-handoff/references/artifact-status-language.md` | Artifact Status Language | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.texture-resolution-ktx2-and-draco-meshopt-compression`, `knowledge.gltf-2-coordinate-system-and-transform-conventions`, `knowledge.glb-binary-chunk-alignment-and-khronos-validation` |
| `skills/blendops-glb-web-handoff/references/component-shape-patterns.md` | Component shape patterns for R3F GLB consumers | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.lod-hierarchy-and-decimation-strategy`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity` |
| `skills/blendops-glb-web-handoff/references/web-stack-caveats.md` | Web stack caveats per consumer | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.armature-joint-hierarchy-and-linear-blend-skinning`, `knowledge.nla-action-baking-and-morph-target-export`, `knowledge.rigid-body-cloth-and-simulation-cache-baking` |
| `skills/blendops-lighting-materials/references/consumer-stack-rules.md` | Consumer stack compatibility rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.shader-node-gltf-export-portability` |
| `skills/blendops-lighting-materials/references/cyberpunk-lookdev.md` | Cyberpunk & Neon Lookdev Discipline | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.volumetrics-fog-and-principled-volume-tradeoffs` |
| `skills/blendops-lighting-materials/references/hdri-balance-rules.md` | HDRI + explicit-light balance rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/blendops-lighting-materials/references/intensity-ranges.md` | Light intensity ranges (sanity reference) | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/blendops-lighting-materials/references/lighting-patterns.md` | Lighting Patterns & Energy Calibration | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/blendops-lighting-materials/references/look-comparison.md` | Look comparison (Filmic vs Standard vs AgX) | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.threejs-r3f-tone-mapping-and-environment-parity` |
| `skills/blendops-lighting-materials/references/material-portability.md` | Material Portability | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.uv-seam-placement-and-texel-density`, `knowledge.shader-node-gltf-export-portability` |
| `skills/blendops-lighting-materials/references/pbr-sanity-rules.md` | PBR sanity rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.high-to-low-normal-and-ao-baking`, `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.normal-roughness-and-orm-channel-packing` |
| `skills/blendops-lighting-materials/references/shadow-softness-rules.md` | Shadow softness rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.three-point-and-hdri-studio-lighting` |
| `skills/blendops-lighting-materials/references/texture-budget-rules.md` | Texture budget rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.uv-seam-placement-and-texel-density`, `knowledge.udim-vs-single-atlas-uv-packing` |
| `skills/blendops-lighting-materials/references/web-material-simplification.md` | Web Material Simplification | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.normal-roughness-and-orm-channel-packing` |
| `skills/blendops-product-shot/references/clarification-patterns.md` | Clarification Patterns | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.modular-architectural-grid-and-metric-scale`, `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/blendops-product-shot/references/cyberpunk-shoe-example.md` | Cyberpunk Shoe Example | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.cad-creases-and-panel-gap-detailing` |
| `skills/blendops-product-shot/references/product-hero-playbooks.md` | Product Hero Playbooks | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.non-destructive-hard-surface-modifier-stack`, `knowledge.cad-creases-and-panel-gap-detailing` |
| `skills/blendops-render-settings/references/bit-depth-rules.md` | Bit-depth rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.agx-filmic-color-management-and-cycles-eevee` |
| `skills/blendops-render-settings/references/engine-feature-matrix.md` | Engine feature matrix | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.agx-filmic-color-management-and-cycles-eevee`, `knowledge.volumetrics-fog-and-principled-volume-tradeoffs` |
| `skills/blendops-scene-plan/references/depth-layering-rules.md` | Depth layering rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.procedural-scatter-poisson-disk-and-slope-masking`, `knowledge.volumetrics-fog-and-principled-volume-tradeoffs`, `knowledge.environment-depth-layering-and-atmospheric-perspective` |
| `skills/blendops-scene-plan/references/furniture-layout-rules.md` | Furniture layout rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.modular-architectural-grid-and-metric-scale` |
| `skills/blendops-scene-plan/references/interior-camera-rules.md` | Interior camera rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/blendops-scene-plan/references/portrait-framing-rules.md` | Portrait framing rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.physically-based-camera-lens-and-dof` |
| `skills/blendops-scene-plan/references/style-consistency-rules.md` | Style consistency rules | `reusable_cross_skill_knowledge` | `knowledge_promotion_mapping` | `knowledge.organic-sculpt-to-retopology-workflow` |
