# Lifecycle Phases

A complete BlendOps run for a non-Blender user passes through 6 phases. Each phase loads a specific subset of the **48** skills (16 baseline + 32 expansion across Batches 1–8). Use `workflow-stage-router` whenever you need to interleave expansion skills with the baseline chain summarized below.

## Phase A — Intent

Goal: convert the user's vague request into a confirmed structured brief.

| Skill | Role |
|---|---|
| `blender-brainstorming` | Socratic clarification when intent is vague (3-5 questions, 2-3 alternative scopings) |
| `intent-to-3d-brief-writer` | Lock confirmed intent into the 8-slot brief |

Exit gate: brief echoed and confirmed by user. Runtime status `Not Run`.

## Phase B — Asset planning

Goal: decide where every asset comes from before scene plan.

| Skill | Role |
|---|---|
| `blender-asset-discovery-planner` | Per-asset strategy (procedural / library / generative / photogrammetry) + license + budget |

Exit gate: asset plan reconciled against brief constraints. Generative strategy flagged with Path 2 caveat if used.

## Phase C — Runtime readiness

Goal: confirm operator can actually run Blender, OR explicitly stay in text-only mode.

| Skill | Role |
|---|---|
| `official-runtime-setup-guide` | Choose runtime path (Path 1 host a/b, Path 2, CLI fallback) prerequisites |
| `official-runtime-readiness-checker` | Build readiness matrix; verdict Ready / Partially Ready / Blocked / Unknown |
| `runtime-bridge-conflict-resolver` | If readiness signals are inconsistent (Path 1 + Path 2 both installed, port collision, two MCP clients) |

Exit gate: ONE runtime path selected and ready, OR explicit "stay text-only" decision.

## Phase D — Scene planning

Goal: produce the structured plan downstream skills can act on.

| Skill | Role |
|---|---|
| `product-hero-scene-planner` | Subject + scene structure |
| `blender-composition-camera-planner` | Framing + camera |
| `blender-lighting-material-planner` | Mood / lookdev / portability |

Exit gate: plans reviewable in plain language; no jargon leaks.

## Phase E — Quality + execution + evidence

Goal: gate runtime work, capture evidence honestly, downgrade unsupported claims.

| Skill | Role |
|---|---|
| `blender-scene-quality-checker` | Pass/Warn/Fail readiness verdict before runtime mutation |
| `blender-troubleshooting` | When output diverges from intent (4-phase root-cause) |
| `render-export-evidence` | Classify artifact evidence (Not Run / Attempted / Produced / Verified / Failed) |
| `pre-handoff-verification` | 7-point gate before any "ready" / `Verified` claim leaves the workflow |

Exit gate: verified evidence record OR explicit downgrade with reasoning.

## Phase F — Handoff + response

Goal: communicate status to the non-Blender user without jargon.

| Skill | Role |
|---|---|
| `glb-web-handoff` | If GLB / web is in scope, frame caveats + R3F / Three.js snippets |
| `non-blender-user-response-writer` | Plain-language final response with truth labels visible |

Exit gate: response confirmed plain-language by check 7 of `pre-handoff-verification`.

## Phases by truth label

| Phase | Default truth label after exit |
|---|---|
| A — Intent | `Not Run`, `Not Produced` |
| B — Asset planning | `Not Run`, `Not Produced` |
| C — Runtime readiness | `Not Run` (readiness ≠ run) |
| D — Scene planning | `Not Run`, `Not Produced` |
| E — Quality + evidence | Whatever the actual evidence supports (downgraded if needed) |
| F — Handoff | Whatever Phase E concluded; never upgraded by handoff |

## Skipping phases

- A user with a structured request can skip Phase A.
- A user supplying all assets can skip Phase B.
- A text-only iteration loop can skip Phase C and stop after Phase D.
- A read-only smoke run stops after Phase C with a smoke evidence record.
- The full chain (A → F) is only needed for a "publish-ready" deliverable.
