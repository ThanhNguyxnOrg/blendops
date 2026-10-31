# Phase 0 Audit — Routing & Responsibility Overlap Analysis

- **Repository:** `ThanhNguyxnOrg/blendops`
- **Branch / Commit:** `main` @ `3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d`
- **Data Sources:** [`skill-inventory.json`](./skill-inventory.json), [`handoff-inventory.json`](./handoff-inventory.json)

---

## 1. Executive Summary of Graph & Routing Findings

Static extraction across all 48 `skills/*/SKILL.md` files identified **373 total cross-skill edges** in `## Cross-skill handoff` blocks, plus **191 distinct trigger phrases** with **0 exact string collisions**.

However, deeper structural analysis surfaced **five routing and contract problems** that must be resolved in Phase 1:

1. **Dual Handoff Notation Split (35 vs 13 skills):**
   - **35 skills** (primarily Batches 1–8 and updated process skills) reference targets using relative Markdown paths: `` `../<skill-id>/SKILL.md` `` (257 edges).
   - **13 skills** (primarily baseline planners and quality checkers) reference targets using bare backticked IDs: `` `<skill-id>` `` (116 edges).
   - Any automated graph parser or registry compiler that only scans one pattern misses 31%–69% of the workflow graph.
2. **Mixed Edge Semantics Inside `## Cross-skill handoff`:**
   - The 373 extracted edges are not all forward workflow transitions. Classification reveals:
     - `progression`: **211** (linear forward steps)
     - `alternative`: **63** (branching choices across scene planners or domain validators)
     - `fallback`: **34** (troubleshooting or blocked-asset recovery)
     - `upstream_reference`: **29** (backward declarations of which skill supplied the input)
     - `conditional`: **17** (gated transitions)
     - `boundary_delegation`: **11** (lateral statements of what this skill refuses to do)
     - `retry`: **8** (loop-backs after a failed gate)
3. **Linear Progression Subgraph vs Retry/Fallback Cycles:**
   - The 211-edge `progression` subgraph is **100% acyclic (0 cycles)**.
   - When `retry`, `fallback`, and `conditional` edges are included, **14 directed cycles** appear (e.g., `official-runtime-readiness-checker` → `official-runtime-setup-guide` → `runtime-bridge-conflict-resolver` → `official-runtime-readiness-checker`, and `blender-scene-quality-checker` ↔ `pre-handoff-verification`).
   - These retry/rework cycles are domain-valid, but they currently lack machine-readable `maxRetries` or explicit exit conditions in a `contract.json`.
4. **Zero-Incoming-Progression Skill (`blender-scope-boundary-enforcer`):**
   - `blender-scope-boundary-enforcer` has **0 incoming forward progression edges**. All **6 incoming edges** to it (`acceptance-criteria-builder`, `asset-fallback-strategy`, `asset-style-consistency-checker`, `blender-checklist-driven-workflow`, `blender-recipe-decomposer`, `blender-stop-condition-decider`) are `boundary_delegation` edges triggered only on mid-flight scope creep.
   - Notably, `workflow-stage-router` and `blendops-help` do not list `blender-scope-boundary-enforcer` in their `## Cross-skill handoff` blocks.
5. **Undeclared Body Handoffs:**
   - Several skills route to downstream skills inside `## Operating procedure`, `## Decision tree`, or `## Mode handling` without listing those targets in `## Cross-skill handoff`. For example, `workflow-stage-router` routes to `runtime-path-picker`, `official-runtime-setup-guide`, `path-one-host-outline`, `cli-appendix-job-outline`, and `runtime-bridge-conflict-resolver` in its prose boundary/mode sections, but its `## Cross-skill handoff` section lists only 4 skills (`pack-prerequisite-checker`, `official-runtime-readiness-checker`, `render-export-evidence`, `pre-handoff-verification`).

---

## 2. Deep-Dive: The 4 Routing & Governance Skills

Rather than enforcing hard mutual exclusion that would break multi-step coordination, Phase 0 confirms that the four routing skills form a **4-stage precedence ladder** based on workflow state:

| Precedence Order | Skill ID | Activation Gate (Entry Condition) | Required Inputs | Exclusive Responsibility | Primary Outgoing Handoffs |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `blendops-help` | User goal, entry point, or current state is ambiguous or mixed | Raw user prompt; optional current status | Triage ambiguous intent into **one** safe starting skill or doc | `blender-brainstorming`, `intent-to-3d-brief-writer`, `official-runtime-readiness-checker`, `render-export-evidence`, `workflow-stage-router` |
| **2** | `recipe-fit-assessor` | Goal is known, but target BlendOps recipe/pack is not yet selected | Plain-language 3D goal; target destination (still/turntable/GLB) | Score candidate recipes/packs (`Strong fit` / `Partial fit` / `No fit`) and detect multi-pack scope | `pack-prerequisite-checker`, `blender-recipe-decomposer`, `intent-to-3d-brief-writer` |
| **3** | `pack-prerequisite-checker` | Recipe/pack is chosen, but preflight readiness across brief, runtime posture, and assets is unverified | Target pack ID; current brief & runtime posture | Evaluate preflight matrix (`Ready` / `Needs input` / `Blocked`) and issue Go/No-Go | Domain scene planners (on Go) or single blocking upstream skill (on No-Go) |
| **4** | `workflow-stage-router` | Workflow is already underway with partial artifacts or completed stages | Current artifact inventory + truth labels; active intent | Map current milestone inventory to the **single immediate next skill** using locked precedence | Next stage planner/validator, or immediate exit to `pre-handoff-verification` on any failed gate |

### Identified Overlap & Gaps in the Routing Quartet
* **Overlap between `blendops-help` and `workflow-stage-router`:** Both accept "what should I do next?" prompts. The discriminator is **whether an artifact/stage inventory already exists**. This discriminator is stated in `blendops-help` (`When not to use: goal is clear and artifacts exist → use workflow-stage-router`), but `contract.json` in Phase 1 should encode `requires_artifact_inventory: false` vs `true`.
* **Missing handoff in `blendops-help`:** `blendops-help` was authored before Batch 7 (`recipe-fit-assessor`, `pack-prerequisite-checker`, `workflow-stage-router`). While `blendops-help` mentions `workflow-stage-router` in `## When not to use`, its `## Cross-skill handoff` section only lists 7 baseline skills and omits `recipe-fit-assessor`, `pack-prerequisite-checker`, and `workflow-stage-router`.

---

## 3. Deep-Dive: The 7 Quality & Evidence Validators

| Skill ID | Scope Level | Exclusive Domain | Relationship to `blender-scene-quality-checker` |
| :--- | :--- | :--- | :--- |
| `composition-quality-checker` | Domain specialist | Framing, camera focal hierarchy, silhouette separation, aspect safety | Feeds domain verdict into holistic scene review |
| `lighting-quality-checker` | Domain specialist | Key-to-fill ratios, shadow softness, highlight clipping, HDRI/rig balance | Feeds domain verdict into holistic scene review |
| `material-quality-checker` | Domain specialist | Principled BSDF sanity, PBR map colorspaces, shader node portability, texture MP cap | Feeds domain verdict into holistic scene review |
| `polycount-budget-checker` | Domain specialist | Triangle/vertex caps, modifier expansion risks, per-hero vs prop density | Feeds domain verdict into holistic scene review |
| `blender-scene-quality-checker` | Holistic aggregator | Aggregates the 4 domain dimensions + scale/orientation sanity before render/export | Orchestrates or consumes the 4 specialists; hands off to `render-export-evidence` |
| `render-export-evidence` | Artifact truth auditor | Verifies whether render/GLB files actually exist on disk and assigns truth state | Consumes outputs after execution; feeds `pre-handoff-verification` |
| `pre-handoff-verification` | Final release gate | 7-point final audit across brief alignment, quality gates, truth labels, and caveats | Terminal verification gate before `glb-web-handoff` or `non-blender-user-response-writer` |

### Identified Overlap & Gaps in the Quality & Evidence Group
* **Clean specialist separation:** None of the 4 specialist checkers (`composition`, `lighting`, `material`, `polycount`) duplicate each other's rubric rows.
* **Bidirectional loop between `blender-scene-quality-checker` and `pre-handoff-verification`:** `blender-scene-quality-checker` hands off forward to `pre-handoff-verification`, while `pre-handoff-verification` hands back to `blender-scene-quality-checker` when quality gates are missing. In `contract.json`, the forward edge must be typed as `progression` and the backward edge as `retry` (with exit condition `quality_verdict == Pass`).

---

## 4. Deep-Dive: Scene Planners vs Decision Micro-Skills

* **5 Domain Macro-Planners:**
  - `product-hero-scene-planner` (single hero object)
  - `product-grid-scene-planner` (multi-item catalog consistency)
  - `character-portrait-scene-planner` (portrait framing, eyes/skin lookdev, turntable)
  - `environment-establishing-shot-planner` (foreground/midground/background scale, atmospheric depth)
  - `interior-architectural-scene-planner` (daylight portals, vertical line convergence, room bounce)
* **2 Deep-Dive Stage Planners:**
  - `blender-composition-camera-planner`
  - `blender-lighting-material-planner`
* **4 Decision Micro-Skills (Batch 6):**
  - `color-management-decision` (AgX vs Filmic vs Standard)
  - `cycles-vs-eevee-decision` (path tracing vs realtime rasterization)
  - `output-format-decision` (PNG/EXR/MP4/GLB)
  - `resolution-aspect-decision` (pixel dimensions and aspect crops)

### Audit Verdict on Planner Architecture
No skills in this group should be merged (`MERGE: 0`). The 5 macro-planners correspond to distinct 3D production genres with incompatible spatial rules (e.g., 2-point vertical correction in architectural interiors vs 3-point rim separation in product heroes), while the 4 Batch 6 decision skills act as modular lookup nodes consulted by all 5 macro-planners.
