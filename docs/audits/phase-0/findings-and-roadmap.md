# Phase 0 Audit — Comprehensive Findings & 10/10 Execution Roadmap

- **Repository:** `ThanhNguyxnOrg/blendops`
- **Branch / Commit:** `main` @ `3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d`
- **Audit Scope:** Read-only static & structural audit of 48 `SKILL.md`, 48 `EVAL.md`, 151 `references/*.md`, 4 `laws/*.md`, 1 `PACK.md`, 3 `bundles/`, 26 `docs/install/*.md`, 6 `docs/adapters/*.md`, and CI/build scripts.

---

## 1. Consolidated Technical Debt & Defect Register

Every finding below is verified directly against commit `3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d`.

| ID | Priority | Pillar | Finding | Affected Files | Required Remediation |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **F-01** | **P0** | Pillar 1 & 5 (Truth State Integrity) | **30 of 48 skills include `Not Run` inside `Artifact status:`** (`Artifact status: Not Run \| Not Produced \| Produced \| Verified \| Failed`). Meanwhile, the remaining 18 skills explicitly forbid this in their `## Anti-patterns` (`"assigning Not Run to artifacts instead of runtime (confusing runtime and artifact truth states)"`), and `AGENTS.md` defines `Not Produced` as the default artifact state. | 30 `skills/*/SKILL.md` files (listed in `skill-inventory.json`) + `scripts/check-docs.mjs` | Remove `Not Run | ` from `Artifact status:` across all 30 skills so `Artifact status:` strictly uses `Not Produced | Attempted | Produced | Verified | Failed`, and add a regex guard in `scripts/check-docs.mjs`. |
| **F-02** | **P0** | Pillar 9 (CI & Release) | **`scripts/export-claude-skills.mjs` crashes with `spawnSync zip ENOENT`** on Linux/Docker containers that do not have the external `zip` binary installed. Furthermore, `.github/workflows/docs.yml` only runs `npm run docs:check` and never runs `npm run skills:export` (or `npm run ci`). | `scripts/export-claude-skills.mjs`, `.github/workflows/docs.yml` | Replace the external `zip` shell call with a deterministic pure-Node.js (`node:zlib`) ZIP builder and update `.github/workflows/docs.yml` to execute `npm run ci`. |
| **F-03** | **P0** | Pillar 1 & 2 (Contract & Graph Authority) | **No machine-readable `contract.json` or compiled `registry/` exists**, and handoff notation is split across two incompatible conventions: 35 skills use `` `../<id>/SKILL.md` `` (257 edges) while 13 skills use bare `` `<id>` `` (116 edges). In addition, 33 skills mention handoff targets in body sections (`Operating procedure`, `Decision tree`, `Mode handling`) that are omitted from `## Cross-skill handoff`. | All 48 `skills/*/SKILL.md` | Author `contract.json` per skill (starting with the 4 routing skills), build `scripts/build-registry.mjs` to generate `registry/skills.json` and `registry/workflow-graph.json`, and normalize `## Cross-skill handoff` notation. |
| **F-04** | **P0** | Pillar 3 (Behavioral Evaluation) | **40 of 48 `EVAL.md` files lack structured multi-case test tables**, and **0 automated evaluation runners exist**. Only 8 skills (`blendops-help`, `blender-brainstorming`, `intent-to-3d-brief-writer`, `blender-asset-discovery-planner`, `blender-troubleshooting`, `runtime-bridge-conflict-resolver`, `render-export-evidence`, `pre-handoff-verification`) have an `## Eval cases` table (52 rows total). The remaining 40 skills have a single prose prompt and bullet outline. | 40 `skills/*/EVAL.md` files, `evals/` | Expand all 48 skills to >= 5 structured test cases (positive, ambiguous, structured-skip, scope-creep, blocked/adversarial) and implement the 3-tier evaluation engine (`static-validator.mjs`, `routing-classifier`, `behavioral-runner.mjs`). |
| **F-05** | **P1** | Pillar 1 (Template Completeness) | **8 Batch 7 & Batch 8 skills omit 9–11 standard sections** from `skills/_template/SKILL.md` (`Decision tree`, `Playbooks`, `Failure handling`, `Troubleshooting`, `Best practices`, `Good examples`, `Bad examples`, `User-facing response template`, `Anti-patterns`, and `Non-goals` in 7 of the 8). `scripts/check-docs.mjs` currently only enforces 9 of the 27 template headings. | `acceptance-criteria-builder`, `cli-appendix-job-outline`, `pack-prerequisite-checker`, `path-one-host-outline`, `recipe-fit-assessor`, `runtime-attempt-report-writer`, `runtime-path-picker`, `workflow-stage-router` | Backfill the missing sections in those 8 skills and tighten `requiredSkillHeadings` in `scripts/check-docs.mjs`. |
| **F-06** | **P1** | Pillar 2 (Routing & Reachability) | **`blender-scope-boundary-enforcer` has 0 incoming forward progression/conditional edges** (only 6 `boundary_delegation` edges), and `blendops-help` omits Batch 7 routing skills (`recipe-fit-assessor`, `pack-prerequisite-checker`, `workflow-stage-router`) from its `## Cross-skill handoff` section. | `skills/blendops-help/SKILL.md`, `skills/workflow-stage-router/SKILL.md`, `skills/blender-scope-boundary-enforcer/SKILL.md` | Wire explicit conditional handoffs from `blendops-help` and `workflow-stage-router` to `blender-scope-boundary-enforcer` (when user adds mid-flight scope) and to the Batch 7 routing quartet. |
| **F-07** | **P1** | Pillar 4 & 5 (GLB & Artifact Verification) | **Zero deterministic artifact verification scripts exist**, and reference files lack explicit Blender version compatibility matrices (e.g., Principled BSDF socket changes in Blender 4.0+/5.1+ vs glTF 2.0 exporter behavior). | `scripts/`, `skills/*/references/*.md` | Implement the 3-layer GLB verification pipeline: Layer 1 (`scripts/inspect-glb.mjs` container/chunk/SHA-256 inspector), Layer 2 (Khronos `gltf-validator` spec validation integration), Layer 3 (runtime/viewer visual verification protocol). |
| **F-08** | **P1** | Pillar 7 (Agent Compatibility Drift) | **`docs/adapter-registry.md` is out of sync with `docs/install/`**: it lists `Windsurf`, `Continue`, `Cline`, `Roo`, and `Aider` under `"Future candidates (not researched)"`, even though `docs/install/{windsurf,continue,cline,roo-code,aider}.md` already exist and are enforced by `check-docs.mjs`. Moreover, 10 newer install targets (`roo-code`, `windsurf`, `openhands`, `jetbrains-junie`, `blackbox-ai`, `augment-code`, `aider`, `trae`, `sourcegraph-cody`, `amazon-q-developer`) are missing from the `"Install-only targets pending adapter draft"` table in `docs/adapter-registry.md`. | `docs/adapter-registry.md` | Reconcile `docs/adapter-registry.md` with all 26 install targets, classify targets into Tier 1 / Tier 2 / Tier 3, and add a check in `scripts/check-docs.mjs` so `adapter-registry.md` cannot drift from `docs/install/`. |
| **F-09** | **P2** | Pillar 8 (Bundle Drift Risk) | **Manual bundle reference summaries are 93.7% compressed and maintained by hand:** Canonical `skills/*/SKILL.md` average **225 lines**, whereas `bundles/claude-desktop-manual/references/skills/*.md` and `bundles/skill-package/blendops/references/skill-*.md` average **14 lines** (96 manual summary files total). | `bundles/claude-desktop-manual/`, `bundles/skill-package/blendops/` | Generate bundle reference summaries deterministically from `SKILL.md` + `contract.json` via `scripts/build-registry.mjs` to eliminate manual drift. |
| **F-10** | **P1** | Pillar 6 (Security & Rollback) | **No runtime capability tiering (L0–L3) or scene-mutation snapshot/rollback protocol exists.** `bundles/generic-project-local/ROLLBACK.md` covers file installation rollback, not Blender scene mutation rollback. | `docs/`, `laws/`, runtime skills | Define L0 (read-only), L1 (reversible scene edits), L2 (file export/writes), L3 (arbitrary code/destructive ops) and require pre-mutation `.blend` snapshot instructions in runtime skills. |

---

## 2. Skill Audit Disposition Summary (All 48 Skills)

Full per-skill metrics (`lineCount`, `headingCount`, `missingTemplateHeadings`, `referenceFiles`, `triggerPhrases`, `graphDegree`, `issues`) are stored in [`skill-inventory.json`](./skill-inventory.json).

- **`KEEP` (3 skills — 0 structural/truth-state defects found):**
  - `cycles-vs-eevee-decision`
  - `glb-mobile-performance-budget`
  - `resolution-aspect-decision`
- **`IMPROVE` (45 skills — functional core sound; require targeted contract/truth-state/template/handoff fixes):**
  - **Group A — Fix `Artifact status: Not Run` contradiction (30 skills):** `acceptance-criteria-builder`, `asset-fallback-strategy`, `asset-library-organization-planner`, `asset-license-checker`, `asset-style-consistency-checker`, `blender-checklist-driven-workflow`, `blender-recipe-decomposer`, `blender-scope-boundary-enforcer`, `blender-stop-condition-decider`, `blendops-help`, `character-portrait-scene-planner`, `cli-appendix-job-outline`, `color-management-decision`, `composition-quality-checker`, `environment-establishing-shot-planner`, `glb-animation-handoff`, `interior-architectural-scene-planner`, `lighting-quality-checker`, `material-quality-checker`, `output-format-decision`, `pack-prerequisite-checker`, `path-one-host-outline`, `polycount-budget-checker`, `pre-handoff-verification`, `preview-report-template-writer`, `product-grid-scene-planner`, `runtime-bridge-conflict-resolver`, `runtime-path-picker`, `three-fiber-component-shape-planner`, `workflow-stage-router`.
  - **Group B — Backfill missing template sections in Batch 7 & Batch 8 (8 skills):** `acceptance-criteria-builder`, `cli-appendix-job-outline`, `pack-prerequisite-checker`, `path-one-host-outline`, `recipe-fit-assessor`, `runtime-attempt-report-writer`, `runtime-path-picker`, `workflow-stage-router`.
  - **Group C — Normalize bare-ID handoff notation to canonical format & sync body mentions (13 skills):** `blender-asset-discovery-planner`, `blender-composition-camera-planner`, `blender-lighting-material-planner`, `blender-scene-quality-checker`, `blender-troubleshooting`, `glb-mobile-performance-budget`, `glb-web-handoff`, `intent-to-3d-brief-writer`, `non-blender-user-response-writer`, `official-runtime-readiness-checker`, `official-runtime-setup-guide`, `product-hero-scene-planner`, `render-export-evidence`.
- **`MERGE` (0 skills):** No two skills have identical input/output contracts or redundant domain responsibilities.
- **`SPLIT` (0 skills):** Complex workflows are already decomposed across macro-planners, deep-dive planners, and Batch 6 decision micro-skills.
- **`REWRITE` (0 skills):** All 48 skills align with the BlendOps content-layer architecture.

---

## 3. Evaluation Audit Summary (All 48 `EVAL.md` Files)

Full per-skill evaluation metrics are stored in [`eval-inventory.json`](./eval-inventory.json).

| Eval Structure Tier | Count | Skills Included | Total Table Cases | Gap to 10/10 Standard |
| :--- | :---: | :--- | :---: | :--- |
| **Tier A: Structured Multi-Case Table** (`## Eval cases` + `## Expected evidence/status fields`) | **8** | `blendops-help` (5), `blender-brainstorming` (6), `intent-to-3d-brief-writer` (8), `blender-asset-discovery-planner` (7), `blender-troubleshooting` (6), `runtime-bridge-conflict-resolver` (6), `render-export-evidence` (7), `pre-handoff-verification` (7) | **52 cases** | Convert Markdown tables into machine-readable `evals/cases/individual/<skill>.json` and wire into automated runner. |
| **Tier B: Single-Prompt Prose Outline** (`## Text-only eval prompt` + bullet outline only) | **40** | All remaining 40 skills (Batches 1–8 + 8 baseline planners/guides) | **0 table rows** (40 prose prompts) | Author >= 5 structured cases per skill (200+ new cases) covering Normal, Ambiguous, Structured-Skip, Scope-Creep, and Blocked/Adversarial inputs. |

---

## 4. Phased Implementation Roadmap (Post-Phase 0)

With Phase 0 complete, implementation should proceed in **small, verifiable phases** with strict CI gates after each phase:

### Phase 1 — P0 Defect Remediation & Skill Contract Architecture v1
1. Fix **F-02**: Make `scripts/export-claude-skills.mjs` 100% pure Node.js (`node:zlib`) with zero external `zip` binary dependency; update `.github/workflows/docs.yml` to run `npm run ci`.
2. Fix **F-01**: Remove `Not Run` from `Artifact status:` in all 30 affected `SKILL.md` files and add an automated check in `scripts/check-docs.mjs`.
3. Fix **F-08**: Synchronize `docs/adapter-registry.md` with all 26 `docs/install/*.md` targets.
4. Pilot `contract.json` on the **4 routing skills** (`blendops-help`, `recipe-fit-assessor`, `pack-prerequisite-checker`, `workflow-stage-router`), implement `scripts/build-registry.mjs`, and verify edge classification (`progression`, `conditional`, `alternative`, `fallback`, `retry`, `upstream_reference`, `boundary_delegation`), then roll out `contract.json` across the remaining 44 skills and backfill the 8 Batch 7/8 template sections (**F-03, F-05, F-06, F-09**).

### Phase 2 — 3-Tier Automated Evaluation Engine
1. Define JSON schemas under `evals/schemas/` (`skill-case.schema.json`, `evaluation-result.schema.json`, `scorecard.schema.json`).
2. Build **Tier 1 (`evals/runners/static-validator.mjs`)**: deterministic contract, graph reachability, progression-DAG acyclicity, retry-exit condition, and trigger collision checks (runs on every commit/PR).
3. Build **Tier 2 (`evals/runners/routing-runner.mjs`)**: evaluates prompt → initial skill activation & next-skill handoff across 240+ test cases with prompt+contract hash caching.
4. Build **Tier 3 (`evals/runners/behavioral-runner.mjs`)**: deep rubric + boundary assertion runner for the 15 Gateway Skills and 7 Golden Workflows.

### Phase 3 — Core Workflow Integration & Failure Injection
1. Author formal multi-skill workflow definitions for the 7 Golden Workflows (starting with `product-hero-v0`).
2. Add failure-injection integration cases (missing Blender, dual MCP bridge conflict on port 9876, unlicensed asset rejection, stale `.glb` artifact on disk, mid-workflow scope creep).

### Phase 4 — Blender Domain Excellence & 3-Layer GLB Verification
1. Build **Layer 1 (`scripts/inspect-glb.mjs`)**: pure Node.js glTF 2.0 binary container parser (12-byte header, JSON chunk 0, BIN chunk 1, SHA-256, scene/mesh/material/texture/animation/skin inventory).
2. Wire **Layer 2 (`gltf-validator`)**: optional/CI Khronos specification validation report generator.
3. Document **Layer 3**: runtime/viewer visual verification checklist and Blender 4.2 vs 5.1+ shader/exporter version compatibility tables across domain references.

### Phase 5 — Runtime E2E Evidence, Security Hardening & Compatibility Tiers
1. Define L0–L3 runtime capability boundaries and scene snapshot/rollback protocols (**F-10**).
2. Establish the `runtime-evidence/` provenance schema and capture official Path 1 / CLI verification packets when a Blender host is attached.
3. Classify the 26 agent targets into Tier 1 (Verified Integration), Tier 2 (Tested Partial Support), and Tier 3 (Documented / Reference) with empirical install/activation test records.
