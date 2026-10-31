# Phase 2 Design & Implementation Plan — Contract-First Pilot (4 Routing Skills)

- **Repository:** `ThanhNguyxnOrg/blendops`
- **Target Scope:** Phase 2 Strict Pilot (`blendops-help`, `recipe-fit-assessor`, `pack-prerequisite-checker`, `workflow-stage-router`)
- **Base Commits:** Phase 0 (`27cfcb8`) + Phase 1 (`00d2a1c`)

---

## 1. Architectural Decisions Locked

### 1.1 Single Source of Truth: `contract.json` + Managed Markdown Markers
Each pilot skill directory contains a machine-readable `contract.json` validated against [`schemas/skill-contract.schema.json`](../../../schemas/skill-contract.schema.json).

Rather than maintaining duplicate prose lists by hand or attempting brittle NLP parsing of arbitrary Markdown, `scripts/build-registry.mjs` manages three delimited blocks inside each pilot `SKILL.md`:

- Under `## Trigger phrases`:
  `<!-- blendops:generated:start triggers -->` ... `<!-- blendops:generated:end triggers -->`
- Under `## When not to use`:
  `<!-- blendops:generated:start exclusions -->` ... `<!-- blendops:generated:end exclusions -->`
- Under `## Cross-skill handoff`:
  `<!-- blendops:generated:start handoffs -->` ... `<!-- blendops:generated:end handoffs -->`

All prose instructions outside those markers remain untouched. Running `node scripts/build-registry.mjs --check` fails if any managed section in `SKILL.md` drifts from the canonical rendering of `contract.json`.

### 1.2 Non-Overlapping Precedence Ladder (Ranks 1–4)

| Rank | Skill ID | `goalClarity` | `recipeSelected` | `preflightPassed` | `hasStageOrArtifactInventory` | Deterministic Role |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **1** | `blendops-help` | `ambiguous_or_mixed` | `false` | `false` | `false` | Entry-point triage when user intent or current state is unclear |
| **2** | `recipe-fit-assessor` | `clear` | `false` | `false` | `false` | Selects the fitting recipe/pack or routes to decomposition when goal is clear |
| **3** | `pack-prerequisite-checker` | `clear` | `true` | `false` | `false` | Evaluates preflight readiness matrix after a recipe/pack is chosen |
| **4** | `workflow-stage-router` | `clear` | `true` | `true` | `true` | Advances an active workflow that has already passed preflight and holds an artifact/stage inventory |

### 1.3 Structured Condition DSL (Zero `eval`)
Every handoff edge in `contract.json` requires a structured `when` object (`all` or `any` array of `{ field, operator, value }` predicates where `operator` is restricted to `equals`, `not_equals`, `in`, `not_in`, `exists`). No arbitrary JavaScript expressions or `eval` are permitted.

### 1.4 Bounded Retry Policy
Any handoff edge with `"type": "retry"` must include a `retryPolicy` object containing:
- `maxAttempts`: integer (`1..5`)
- `exitCondition`: structured condition group (`all` / `any` predicates)

### 1.5 Honest Pilot Coverage Metadata & Deterministic Checksums
`registry/skills.json` and `registry/workflow-graph.json` include:
- `"coverage": "routing-pilot"`
- `"contractedSkills": 4`
- `"catalogSkills": 48`
- `"sourceChecksum"`: SHA-256 computed deterministically over the sorted canonical inputs (`schemas/skill-contract.schema.json`, the 4 `contract.json` files, and the sorted list of 48 catalog skill directory names). No wall-clock timestamps are emitted into `registry/*.json`.

---

## 2. Verification Matrix (`scripts/test-phase2.mjs`)

1. **Schema Validation Test:** Rejects contracts with missing fields, invalid operators, or unknown properties.
2. **Precedence Ladder & Collision Test:** Evaluates state vectors across Ranks 1–4 and verifies deterministic winner selection when trigger phrases overlap.
3. **Unknown Target Guard Test:** Rejects any `handoffs[].target` or `exclusions[].delegateTo` that does not exist in the 48-skill catalog.
4. **Progression Cycle Detection Test:** Verifies that a cycle in `progression` edges fails validation, whereas a bounded `retry` edge with `retryPolicy` (`maxAttempts` + `exitCondition`) passes.
5. **Retry Unbounded Guard Test:** Verifies that a `retry` edge missing `retryPolicy.maxAttempts` or `retryPolicy.exitCondition` fails validation.
6. **`SKILL.md` Drift Detection Test:** Verifies that modifying a managed block inside a pilot `SKILL.md` causes `build-registry.mjs --check` to fail without modifying files.
7. **Deterministic Build Test:** Verifies that running `build-registry.mjs` twice produces byte-for-byte identical `registry/skills.json` and `registry/workflow-graph.json`.
