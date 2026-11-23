# 4-Phase Diagnostic Template

Use this template to record the diagnostic. Fill every phase or mark explicitly **Blocked**.

## Phase 1 — Reproduce

| Field | Value |
|---|---|
| Symptom (one sentence) |  |
| Expected outcome (quoted from intent / brief / planner) |  |
| Observed outcome (file path / log / response text) |  |
| Reproducibility (e.g. 3/3, 1/5, intermittent) |  |
| Locked inputs (prompt, scene file, Blender version, MCP host, add-on commit) |  |
| Phase 1 verdict | Locked / Intermittent / Blocked-no-evidence |

If Phase 1 is `Intermittent` or `Blocked-no-evidence`, **stop and gather more evidence**. Do not propose fixes yet.

## Phase 2 — Narrow

| Field | Value |
|---|---|
| Stripped what | (e.g. removed neon prompt, removed floor) |
| Symptom persisted? | Yes / No / Partial |
| Minimum reproducing input |  |
| Phase 2 verdict | Narrowed / Partially narrowed / Blocked |

## Phase 3 — Identify root cause

| Field | Value |
|---|---|
| Workflow stages compared (intent → brief → plan → execution → output → response) |  |
| First diverging stage |  |
| Candidate root cause #1 (highest evidence weight) |  |
| Candidate root cause #2 (rejected because…) |  |
| Candidate root cause #3 (rejected because…) |  |
| Phase 3 verdict | Identified / Tied (rank pending) / Blocked |

## Phase 4 — Propose fix

| Field | Value |
|---|---|
| Proposed fix (one sentence) |  |
| Pass criteria (observable test) |  |
| Handoff target skill |  |
| Phase 4 verdict | Targeted / Speculative / Blocked |

## Final verdict

- **Pass** — all 4 phases completed, root cause + 1-2 rejected alternatives, fix targeted with pass criteria + handoff.
- **Warn** — phases completed but reproducibility unclear OR fix lacks pass criteria.
- **Fail** — skipped phases OR multiple speculative causes claimed simultaneously.
