# Phase 3 — Behavioral Evaluation Foundation & Remaining Engineering Roadmap

- **Repository:** `ThanhNguyxnOrg/blendops`
- **Branch:** `main`
- **Reconciled Audit Hub:** [`../current/README.md`](../current/README.md)
- **Historical Phase 0 Audit:** [`../phase-0/README.md`](../phase-0/README.md)
- **Phase 2.1 Hardening Report:** [`../phase-2.1/README.md`](../phase-2.1/README.md)

---

## 1. Phase 3 Behavioral Evaluation Architecture

Phase 3 establishes a deterministic, schema-validated **Behavioral Evaluation & Evidence System** without fabricating live LLM calls or Blender runtime executions.

### 1.1 Core Components

| Component | Path | Responsibility |
| :--- | :--- | :--- |
| **Evaluation Suite Schema** | [`schemas/skill-eval.schema.json`](../../../schemas/skill-eval.schema.json) | Draft 2020-12 JSON Schema compiled with `Ajv2020({ allErrors: true, strict: true })`. Enforces `>= 5` cases per suite, required/forbidden output properties, truth-state separation (`Runtime` vs `Artifact`), and strict `additionalProperties: false`. |
| **Pilot Evaluation Suites (12 Skills, 73 Cases)** | [`evals/index.json`](../../../evals/index.json) + `evals/pilot/*.eval.json` | Machine-readable evaluation suites covering all **4 contract-first routing skills** (`blendops-help`, `recipe-fit-assessor`, `pack-prerequisite-checker`, `workflow-stage-router`), all **8 structured `EVAL.md` table skills**, and the primary runtime gateway skill (`official-runtime-readiness-checker`). |
| **Deterministic Evaluation Runner** | [`scripts/run-evals.mjs`](../../../scripts/run-evals.mjs) | Supports `--build`, `--check`, `--list`, `--skill <id>`, and `--suite <id>`. Validates schemas, checks `EVAL.md` alignment, evaluates required/forbidden output properties, verifies Evidence-Before-Done downgrades, and verifies `resolveRoutingWinner` + contract `when` predicates. |
| **Phase 3 Automated Test Suite** | [`scripts/test-phase3.mjs`](../../../scripts/test-phase3.mjs) | Node test suite (`node:test`) verifying positive suite runs, `--skill`/`--suite` filters, schema rejection of malformed cases, and regression detection on forbidden overclaims or invalid truth states. |

### 1.2 Separation of Evaluation Modes & Truth States

Every evaluation suite in `evals/pilot/*.eval.json` records five distinct evaluation mode states so static/fixture verification is never conflated with live model or Blender execution:

| Evaluation Mode | Meaning | Current Phase 3 Status |
| :--- | :--- | :---: |
| `staticValidation` | JSON Schema compliance (`Ajv2020`), `EVAL.md` alignment, and catalog target resolution | **`Passed`** (12/12 suites) |
| `deterministicFixture` | Offline verification of required properties, forbidden overclaims, and Evidence-Before-Done truth-state rules against structured fixtures | **`Passed`** (73/73 cases) |
| `contractRouting` | Verification of `resolveRoutingWinner` across the 16-state routing space and contract `handoffs[].when` predicate matching | **`Passed`** (4/4 contracted skills, 21 cases) / **`Not Implemented`** (8 uncontracted pilot skills) |
| `liveModel` | Prompting a live LLM host with `SKILL.md` attached and grading live completions | **`Not Run`** |
| `blenderRuntime` | Executing scene inspection, mutation, render, or GLB export against a live Blender MCP bridge or CLI process | **`Not Run`** |

---

## 2. Migration Guide: Converting Prose `EVAL.md` to `.eval.json`

Currently, **12 of 48 skills** have machine-readable `evals/pilot/<skill-id>.eval.json` suites (`73` cases), while **36 of 48 skills** remain single-prompt prose outlines in `skills/<skill-id>/EVAL.md` (tracked in [`evals/index.json`](../../../evals/index.json) and [`../current/eval-inventory.json`](../current/eval-inventory.json)).

To migrate any of the remaining 36 skills:

1. **Keep `skills/<skill-id>/EVAL.md` intact** for human readers and Claude skill ZIP exports (`scripts/export-claude-skills.mjs` packages both `SKILL.md` and `EVAL.md`).
2. **Design at least 5 test cases** covering:
   - `normal`: canonical in-scope prompt with complete inputs
   - `ambiguous`: missing brief slots or unclear parameters requiring batched clarification or upstream routing
   - `structured_skip`: inputs already complete or text-only iteration loop
   - `scope_creep`: mid-workflow addition of unapproved deliverables requiring delegation to `blender-scope-boundary-enforcer` or `blender-recipe-decomposer`
   - `blocked_or_adversarial` / `evidence_boundary`: unverified artifact claims, missing runtime readiness, or license conflicts
3. **Encode each case in `evals/pilot/<skill-id>.eval.json`** conforming to `schemas/skill-eval.schema.json`:
   - Never assign `"Not Run"` to `truthStateExpectations.artifactStatus` (use `"Not Produced"`).
   - If the skill has a `contract.json`, include `deterministicFixture.routingState` and `deterministicFixture.handoffContext` and set `evaluationType: "contract_routing"`.
4. **Verify via CI commands:**
   ```bash
   npm run evals:check
   npm run evals:run -- --skill <skill-id>
   npm test
   ```

---

## 3. Prioritized Engineering Backlog (E1–E4)

### E1 — Blender Domain Correctness & Deterministic GLB Verification (`F-07`)

| Workstream | Target Files | Concrete Engineering Specification |
| :--- | :--- | :--- |
| **1. Pure-Node GLB Container Inspector** | `scripts/inspect-glb.mjs` (planned) | Parse the 12-byte glTF 2.0 binary header (`magic === 0x46546C67`, `version === 2`, `length`), Chunk 0 (`JSON`), and Chunk 1 (`BIN`). Emit deterministic JSON containing SHA-256 hash, byte size, scene/node/mesh/material/texture/animation/skin counts, and bounding-box presence without requiring Blender. |
| **2. Khronos `glTF-Validator` Hook** | `scripts/inspect-glb.mjs --khronos` (planned) | Optional integration with Khronos `gltf-validator` npm package when a `.glb` file is present on disk, recording exact `numErrors`, `numWarnings`, and `numInfos` into the evidence packet. |
| **3. Blender Version Compatibility Matrix** | `skills/*/references/*.md` | Add explicit version matrices separating **Blender 3.6 LTS** (Path 2 floor `3.0+`), **Blender 4.2 LTS** (Principled BSDF v2 socket renames, EEVEE Next transition, AgX default view transform), and **Blender 5.1+** (Path 1 Blender Lab MCP add-on manifest floor). |

### E2 — Runtime & Artifact Evidence Packet (`F-07` / Pillar 5)

| Field | Type | Requirement Before `Produced` or `Verified` |
| :--- | :--- | :--- |
| `runtimePath` | `'path-1-host-a' \| 'path-1-host-b' \| 'path-2-community' \| 'cli-appendix'` | Must match recorded MCP tool names (`get_blendfile_summary_*` for Lab MCP vs `get_scene_info` for Path 2). |
| `blenderVersion` | `string` | Output of `blender --version` (must be `>= 5.1.0` when `runtimePath` is `path-1-*`). |
| `addonIdentity` | `string` | Lab MCP add-on version (Path 1), `mcp-for-blender` commit (Path 2), or `'N/A'` (CLI). |
| `artifactPath` & `sha256` | `string` | Verified on-disk path, byte size, and SHA-256 digest (`Not Produced` if absent). |
| `validationChecks` | `object` | Framing, lighting, PBR material, and polycount/GLB budget check results (`Produced` if pending; `Verified` only when all applicable checks pass). |

### E3 — Security, Asset Provenance & Runtime Capability Model (`F-10` / Pillar 6)

| Capability Tier | Scope | Required Safeguards & Rollback Protocol |
| :--- | :--- | :--- |
| **L0 — Planning & Read-Only Inspection** | Text-only skills + read-only MCP smoke checks (`get_blendfile_summary_*`, `get_objects_summary`) | Zero scene mutation, zero file writes. Default for all 48 skills unless explicitly escalated. |
| **L1 — Reversible Scene Mutation** | Camera, lighting, material, or collection adjustments inside an open Blender session | Require pre-mutation `.blend` checkpoint save (`save_as_mainfile` backup copy) before applying changes. |
| **L2 — File Export & External Asset Import** | Writing `.png` renders, exporting `.glb` files, or importing third-party meshes/HDRIs | Require explicit output directory allowlist and `asset-license-checker` clearance (`CC0` or verified commercial license) prior to import. |
| **L3 — Arbitrary Code / Destructive Operations** | `execute_blender_code` (Path 2) or `blender --background --python` (CLI appendix) | Never expose raw Python as the final user-facing output (`laws/no-arbitrary-python-interface.md`); require operator confirmation and pre-execution `.blend` backup. |

### E4 — Cross-Agent Compatibility Matrix (`F-08` / Pillar 7)

All **26 install targets** under [`docs/install/`](../../install/README.md) are synchronized in [`docs/adapter-registry.md`](../../adapter-registry.md):

- **Tier 1 — Verified Read / Project-Local Adapter Drafted (2 targets):** `Claude Code`, `Generic-root` (`verified-read` confidence).
- **Tier 2 — Dedicated Adapter Drafted, Pending Live Host Verification (4 targets):** `Claude app/Desktop`, `OpenCode`, `Cursor`, `Codex/generic` (`linked-only` confidence with dedicated `docs/adapters/*.md` files).
- **Tier 3 — Install Guide Shipped, Pending Adapter Promotion (20 targets):** `Gemini CLI`, `Antigravity`, `GitHub Copilot`, `Claude Desktop (manual import)`, `Cline`, `Continue.dev`, `Zed`, `goose`, `Roo Code`, `Windsurf`, `OpenHands`, `JetBrains Junie`, `Blackbox AI`, `Augment Code`, `Aider`, `Trae`, `Sourcegraph Cody`, `Amazon Q Developer`, `Ollama`, `LM Studio`, `Open WebUI`.
