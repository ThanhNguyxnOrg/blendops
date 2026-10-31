# Phase 2.1 — Contract Engine Hardening & Validation Integrity

- **Repository:** `ThanhNguyxnOrg/blendops`
- **Base Commit:** `f43385a8a07dace4c13ad48cb4d63ca111f3a2ff` (`main`)
- **Scope:** Focused engineering hardening of the Phase 2 contract-first routing pilot (`blendops-help`, `recipe-fit-assessor`, `pack-prerequisite-checker`, `workflow-stage-router`) without expanding catalog contract coverage beyond the 4 pilot skills.
- **Evidence & Truth-State Posture:** `Runtime: Not Run` / `Artifacts: Not Produced` (no Blender MCP execution or 3D asset generation is claimed).

---

## 1. Problems Addressed

1. **Custom Hand-Rolled Schema Validator Gap (Workstream A):**
   - `scripts/build-registry.mjs` previously relied on a custom `validateContractObject()` implementation that did not enforce every nested JSON Schema constraint defined in [`schemas/skill-contract.schema.json`](../../../schemas/skill-contract.schema.json) (such as `additionalProperties: false` inside nested parameter/handoff objects, operator-specific predicate value shapes, or forbidding `retryPolicy` on non-`retry` edges).
2. **State-Space Precedence Overlap & Unreachable Gate Blind Spot (Workstream B):**
   - `validatePrecedenceLadder()` previously checked only for duplicate `rank` integers and byte-identical `JSON.stringify(activationGate)` keys. A contract using `"goalClarity": "any"` could overlap another gate in the same precedence group without triggering a validation error, and gates requiring contradictory state vectors were not flagged as unreachable.
   - `resolveRoutingWinner()` did not validate that runtime `state.goalClarity` belonged to the concrete runtime enum (`ambiguous_or_mixed` | `clear`), allowing invalid clarity values to match a wildcard `goalClarity: "any"` gate.
3. **Incomplete `EVAL.md` & Reference Verification in ZIP Exporter Tests (Workstream C):**
   - `scripts/test-phase1.mjs` had a comment stating it verified both `SKILL.md` and `EVAL.md` inside each of the 48 exported `.zip` archives, but only asserted `SKILL.md` content and reference key existence.
4. **Atomic Build & Read-Only `--check` Regression Guarantees (Workstream D):**
   - `scripts/build-registry.mjs` previously ran the `SKILL.md` `--sync-skills` loop before checking whether contract/precedence/cycle validation had already failed, and lacked dedicated CLI regression tests proving that `--check` never mutates files on disk and failed builds never write partial `registry/*.json` files.

---

## 2. Architecture Decisions

1. **Single Authoritative Structural Validator via Ajv Draft 2020-12 (`ajv/dist/2020.js`):**
   - Compiled [`schemas/skill-contract.schema.json`](../../../schemas/skill-contract.schema.json) once per schema hash using `Ajv2020({ allErrors: true, strict: true, verbose: true })`.
   - Expressed conditional retry rules directly in Draft 2020-12 JSON Schema (`if` / `then` / `else` on `handoffs.items`): `type: "retry"` requires `retryPolicy`, while non-`retry` handoff edges must not include `retryPolicy`.
   - Expressed operator-dependent predicate value constraints in `#/$defs/predicate` (`in` / `not_in` require a non-empty unique array of scalars; `exists` requires a boolean; `equals` / `not_equals` require a scalar).
   - Preserved semantic checks in `validateContractObject()` strictly for cross-entity invariants that JSON Schema cannot express (contract ID matching directory name, case-insensitive duplicate triggers, catalog existence of `handoffs[].target` and `exclusions[].delegateTo`, and self-reference rejection).
2. **Deterministic Finite State-Space Enumeration for Routing Precedence:**
   - The 4-variable routing state space (`goalClarity` $\in \{\text{ambiguous\_or\_mixed}, \text{clear}\} \times \text{recipeSelected} \in \{\text{false}, \text{true}\} \times \text{preflightPassed} \in \{\text{false}, \text{true}\} \times \text{hasStageOrArtifactInventory} \in \{\text{false}, \text{true}\}$) has $2^4 = 16$ total vectors:
     - **8 valid monotonic workflow states** satisfying $\text{preflightPassed} \implies \text{recipeSelected}$ and $\text{hasStageOrArtifactInventory} \implies (\text{recipeSelected} \land \text{preflightPassed})$.
     - **8 contradictory states** violating workflow progression order.
   - `validatePrecedenceLadder()` deterministically tests all state combinations per group, rejecting any state vector matched by two or more contracts and rejecting any contract whose `activationGate` matches 0 valid unshadowed runtime states.
   - `resolveRoutingWinner()` strictly validates runtime `goalClarity` against `['ambiguous_or_mixed', 'clear']`, requires all 4 fields to be present with valid types, and returns `null` on any incomplete or contradictory state without ever falling back to Rank 1.

---

## 3. Validation Strategy

| Layer | Mechanism | Enforced Invariants |
| :--- | :--- | :--- |
| **Structural Schema** | `Ajv2020` (`schemas/skill-contract.schema.json`) | Exact property sets (`additionalProperties: false`), regex patterns, string/array bounds, conditional `retryPolicy` (`if`/`then`/`else`), and operator-specific predicate value types. |
| **Catalog & Graph Semantics** | `validateContractObject()` & `detectProgressionCycles()` | Directory-to-`id` match, 48-skill catalog membership for all handoffs and exclusions, self-reference prohibition, and acyclic `progression` subgraph. |
| **Precedence State Space** | `enumerateRoutingStateSpace()` & `validatePrecedenceLadder()` | Unique ranks, distinct gates, zero multi-contract state overlap across all 16 vectors, and reachability across the 8 valid runtime states. |
| **Export & Registry Integrity** | `export-claude-skills.mjs` & `build-registry.mjs` | All 48 skills ship byte-identical `SKILL.md`, `EVAL.md`, and `references/*` in both ZIP and Claude Code outputs; failed registry builds abort before writing any file. |

---

## 4. Test Matrix

| Suite | Test Case | Coverage |
| :--- | :--- | :--- |
| `scripts/test-phase1.mjs` | `Phase 1 (F-02): export-claude-skills.mjs does not invoke OS zip or powershell binaries` | Confirms pure JS `fflate` exporter with zero `child_process` / PowerShell calls. |
| `scripts/test-phase1.mjs` | `Phase 1 & 2.1 (F-02 / Workstream C): npm run skills:export generates 48 valid ZIP archives with byte-identical SKILL.md, EVAL.md, and references` | Verifies source `SKILL.md` + `EVAL.md` existence, `<skillName>/` root prefix, and byte-for-byte + text-for-text equality for `SKILL.md`, `EVAL.md`, and all `references/*` across all 48 ZIPs and Claude Code folders. |
| `scripts/test-phase1.mjs` | `Phase 1 (F-01): all 48 skills and _template separate Runtime status (Not Run) from Artifact status (Not Produced)` | Guards against `Artifact status: Not Run` regressions across all 48 skills + template. |
| `scripts/test-phase2.mjs` | `Phase 2 (1/7)` – `Phase 2 (7/7)` | Preserves all 7 original Phase 2 pilot tests (valid contracts, Ranks 1–4 routing, unknown target guard, progression cycle detection, retry policy bounds, managed section drift, deterministic checksums). |
| `scripts/test-phase2.mjs` | `Phase 2.1 (Workstream A): Draft 2020-12 JSON Schema rejects invalid nested objects, unknown properties, and invalid predicate values with exact paths` | Verifies Ajv path diagnostics on nested unknown properties, invalid parameter names, `retryPolicy` on non-retry edges, invalid `in`/`exists` predicate values, `all`+`any` collision, and self-references. |
| `scripts/test-phase2.mjs` | `Phase 2.1 (Workstream B): Deterministic state-space overlap detection catches goalClarity:any overlaps, duplicate conditions, and unreachable gates` | Verifies 16-state / 8-valid-state enumeration, `goalClarity: "any"` overlap detection, shadowed gate detection, and contradictory unreachable gate detection. |
| `scripts/test-phase2.mjs` | `Phase 2.1 (Workstream B): resolveRoutingWinner rejects invalid goalClarity, missing fields, and all contradictory state combinations without selecting Rank 1` | Verifies invalid clarity values (`"any"`, `""`, `"vague"`, non-strings), missing keys, and all 8 contradictory state vectors return `null`. |
| `scripts/test-phase2.mjs` | `Phase 2.1 (Workstream D): --check is strictly read-only and failed validation never writes partial or misleading registry output` | Uses an isolated temp workspace to prove `--check` leaves file SHA-256 hashes untouched on failure and failed builds write zero partial registry files. |

---

## 5. Files Changed

- `package.json` & `package-lock.json` — Added `ajv@8.20.0` devDependency for Draft 2020-12 JSON Schema validation.
- `schemas/skill-contract.schema.json` — Added `#/$defs/inputParameter`, `#/$defs/scalarValue`, operator-specific predicate value rules, `conditionGroup` `oneOf`, and `handoffs.items` conditional `retryPolicy` (`if`/`then`/`else`).
- `scripts/build-registry.mjs` — Replaced custom structural checks with cached `Ajv2020` compilation, added `enumerateRoutingStateSpace()`, `isContradictoryRoutingState()`, `doesGateMatchState()`, state-space overlap/unreachable gate checks, strict runtime `goalClarity` validation, and atomic pre-write failure guards.
- `scripts/export-claude-skills.mjs` — Added explicit pre-export verification that both `SKILL.md` and `EVAL.md` exist for every canonical skill.
- `scripts/test-phase1.mjs` — Expanded ZIP and Claude Code export assertions to verify `EVAL.md` and `references/*` byte-for-byte and text-for-text across all 48 skills.
- `scripts/test-phase2.mjs` — Added 4 comprehensive Phase 2.1 test suites covering Workstreams A, B, and D (bringing total automated tests to 14).
- `registry/skills.json` & `registry/workflow-graph.json` — Rebuilt deterministically with updated schema checksum.
- `docs/audits/phase-2.1/README.md` — This engineering hardening report.

---

## 6. Known Limitations

- **Pilot Contract Scope Preserved (4/48 Skills):** Only the 4 routing skills (`blendops-help`, `recipe-fit-assessor`, `pack-prerequisite-checker`, `workflow-stage-router`) carry `contract.json` in Phase 2.1 (`"coverage": "routing-pilot"`). The remaining 44 catalog skills are validated as catalog nodes and handoff targets.
- **No LLM Behavioral Evaluation Runner:** Validation is strictly deterministic over JSON Schema, graph topology, and the finite routing state space (`Runtime: Not Run`).

---

## 7. Before / After Verification Results

| Check | Before Phase 2.1 (`f43385a`) | After Phase 2.1 |
| :--- | :--- | :--- |
| Draft 2020-12 JSON Schema enforcement | Partial custom JS checks | Full `Ajv2020` compilation (`strict: true, allErrors: true`) |
| Non-retry edge with `retryPolicy` | Ignored silently | Rejected at `/handoffs/<i>` |
| `goalClarity: "any"` state overlap | Missed by string key check | Detected with conflicting contract IDs + state vector |
| Unreachable / contradictory activation gates | Not checked | Detected across 8 valid / 8 contradictory states |
| Invalid runtime `goalClarity` in `resolveRoutingWinner` | Matched `"any"` gates | Rejected (`null`) |
| `EVAL.md` & `references/*` byte comparison in `test-phase1.mjs` | Not asserted for `EVAL.md` | Asserted byte-for-byte & text-for-text across all 48 skills |
| Automated `node --test` count | 10 passing | **14 passing** (`3` in `test-phase1.mjs` + `11` in `test-phase2.mjs`) |
| `npm run docs:check` | 348 files, 0 errors | **349 files, 0 errors, 0 warnings** |
| `npm ci` & `npm run ci` | Pass | **Pass** |
