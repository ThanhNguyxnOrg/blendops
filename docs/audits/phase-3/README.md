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

## 3. Completed Phase 3 Engineering Workstreams (E1–E4)

### E1 — Blender Domain Correctness & Deterministic GLB Verification (`F-07` — `FIXED`)

| Workstream | Target Files | Implemented Engineering Capability |
| :--- | :--- | :--- |
| **1. Pure-Node GLB Container Inspector** | [`scripts/inspect-glb.mjs`](../../../scripts/inspect-glb.mjs) | Parses the 12-byte glTF 2.0 binary header (`magic === 0x46546C67`, `version === 2`, `length`), Chunk 0 (`JSON` `0x4E4F534A`), and Chunk 1 (`BIN\0` `0x004E4942`). Validates 4-byte chunk alignment, ASCII space (`0x20`) JSON padding, buffer/bufferView/accessor byte spans, and `POSITION` 3D bounding-box completeness. Emits deterministic JSON with SHA-256 hash, byte size, structural counts, and an explicit container-vs-visual/runtime truth boundary (`provesVisualCorrectness: false`, `provesBlenderRuntimeExecution: false`). |
| **2. Khronos `glTF-Validator` Hook** | [`scripts/inspect-glb.mjs`](../../../scripts/inspect-glb.mjs) (`--khronos`) | Supports optional Khronos `gltf-validator` integration via `runKhronosGltfValidator()`, reporting deterministic status states (`not_run`, `unavailable`, `passed`, `failed`, `error`) without fabricating external validator installation. |
| **3. Blender Version Compatibility Matrix** | [`docs/blender-version-compatibility.md`](../../blender-version-compatibility.md) | Authoritative compatibility matrices separating **Blender 3.6 LTS** (Path 2 floor `3.0+`), **Blender 4.2 LTS** (Principled BSDF v2 socket renames, EEVEE Next `BLENDER_EEVEE_NEXT`, AgX default view transform, Khronos PBR Neutral), and **Blender 5.1+** (Path 1 Blender Lab MCP add-on manifest floor across both Host (a) Anthropic Connector and Host (b) manual MCP client). |

### E2 — Runtime & Artifact Evidence Packet (`F-07` / Pillar 5 — `FIXED`)

Validated by [`schemas/runtime-evidence-packet.schema.json`](../../../schemas/runtime-evidence-packet.schema.json) and [`scripts/validate-evidence-packet.mjs`](../../../scripts/validate-evidence-packet.mjs):

| Field | Type | Enforced Invariant Before `Produced` or `Verified` |
| :--- | :--- | :--- |
| `runtimeEvidence.runtimePath` | `'path-1-host-a' \| 'path-1-host-b' \| 'path-2-community' \| 'cli-appendix' \| 'none'` | Must match recorded MCP tool signatures (`get_blendfile_summary_*` / `get_objects_summary` for Path 1 vs `get_scene_info` / `execute_blender_code` for Path 2). |
| `runtimeEvidence.blenderVersion` | `string \| null` | Semver `>= 5.1.0` strictly enforced when `runtimePath` is `path-1-host-a` or `path-1-host-b` and runtime is active; `>= 3.0.0` enforced for `path-2-community`. |
| `artifactEvidence.artifactStatus` | `'Not Produced' \| 'Attempted' \| 'Produced' \| 'Verified' \| 'Failed'` | Never `'Not Run'`. `Produced` and `Verified` require non-empty `artifactPath`, positive `byteSize`, 64-hex `sha256`, `runtimeStatus` in `['Produced', 'Verified']`, and `glbInspection.valid === true` for GLB artifacts. |
| `validationChecks` & `isStaticFixture` | `object` & `boolean` | `Verified` requires `isStaticFixture === false`, `runtimeStatus === 'Verified'`, and all applicable `validationChecks` (`framing`, `lighting`, `pbrMaterials`, `polycountAndBudget`) set to `'Passed'`. |

### E3 — Security, Asset Provenance & Runtime Capability Model (`F-10` / Pillar 6 — `FIXED`)

Defined in [`schemas/runtime-capability-policy.schema.json`](../../../schemas/runtime-capability-policy.schema.json), compiled across all 48 skills in [`registry/runtime-capability-policy.json`](../../../registry/runtime-capability-policy.json), enforced by [`scripts/validate-capability-policy.mjs`](../../../scripts/validate-capability-policy.mjs), and documented in [`docs/safety-model.md`](../../safety-model.md):

| Capability Tier | Scope | Enforced Safeguards & Fail-Closed Rollback Protocol |
| :--- | :--- | :--- |
| **L0 — Planning & Read-Only Inspection** | Default for all 48 skills + read-only MCP smoke checks (`get_blendfile_summary_*`, `get_objects_summary`, `get_scene_info`) | Zero scene mutation, zero file writes. Any undeclared or unknown skill defaults strictly to `L0`. |
| **L1 — Reversible Scene Mutation** | Bounded camera, lighting, material, or object transform edits inside an active Blender session | Requires verified pre-mutation `.blend` checkpoint (`<scene>.pre-<skill-id>-<ISO8601-UTC>.blend`, positive `byteSize`, 64-hex `sha256`, `createdBeforeMutation: true`, `verifiedOnDisk: true`), `mutationBoundaries`, and `recoveryProtocol`. Missing or unverified backup strictly blocks mutation (`mutationBlockedByBackupFailure: true`). |
| **L2 — File Export & External Asset Import** | Rendering `.png` images, exporting `.glb` files, or importing external 3D/material assets | Inherits `L1` backup gates when mutating, enforces `outputDirectoryAllowlist` (blocking `..` traversal), and requires `asset-license-checker` clearance (`CC0-1.0`, `CC-BY-4.0`, `Royalty-Free-Commercial`, or `Proprietary-First-Party`) before importing external assets. |
| **L3 — Arbitrary Code / Destructive Operations** | `execute_blender_code` (Path 2) or `blender --background --python` (CLI appendix) | Inherits `L1`/`L2` gates, requires explicit `operatorConfirmation`, and enforces [`laws/no-arbitrary-python-interface.md`](../../../laws/no-arbitrary-python-interface.md) (`userFacingPythonAllowed: false`). |

### E4 — Cross-Agent Compatibility Matrix (`F-08` / Pillar 7 — `PARTIALLY_FIXED`)

All **26 install targets** under [`docs/install/`](../../install/README.md) are synchronized across [`docs/adapter-registry.md`](../../adapter-registry.md) and the machine-readable [`registry/compatibility-matrix.json`](../../../registry/compatibility-matrix.json) (validated by [`schemas/adapter-compatibility-matrix.schema.json`](../../../schemas/adapter-compatibility-matrix.schema.json) and [`scripts/validate-compatibility-matrix.mjs`](../../../scripts/validate-compatibility-matrix.mjs)):

- **Verified Read (`2` targets):** `claude-code` (`Claude Code`) and `generic-project` (`Generic project / BLENDOPS.md fallback`), backed by [`docs/evals/adapter-install-v0-dry-run.md`](../../evals/adapter-install-v0-dry-run.md) (`2026-05-08`).
- **Linked-Only with Dedicated Adapter Doc (`4` targets):** `claude-desktop`, `cursor`, `codex`, `opencode` (`Not Verified` in live host eval).
- **Linked-Only Install Guides Pending Adapter Promotion (`20` targets):** `aider`, `amazon-q-developer`, `antigravity`, `augment-code`, `blackbox-ai`, `cline`, `continue`, `gemini`, `github-copilot`, `goose`, `jetbrains-junie`, `lm-studio`, `ollama`, `open-webui`, `openhands`, `roo-code`, `sourcegraph-cody`, `trae`, `windsurf`, `zed` (`Not Verified`).
- **Anti-Promotion Guard:** `validateCompatibilityMatrixObject` blocks promoting any target from `linked-only` to `verified-read` based on documentation alone.
