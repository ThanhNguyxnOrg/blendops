---
name: pack-prerequisite-checker
description: Verify brief completeness, runtime posture, skill coverage, and evidence habits before starting a pack workflow.
---

# pack-prerequisite-checker

## Purpose

Block "half-ready" pack execution: confirm the user's brief, chosen pack/recipe, runtime understanding, and evidence workflow are sufficient to start planners and validators without rework loops.

## Quick start

- identify target pack/recipe
- run checklist rows from `references/prerequisite-matrix.md`
- mark each row Ready / Needs input / Blocked
- only then authorize entry into execution-heavy skills

## When to use

- immediately after `recipe-fit-assessor` + `intent-to-3d-brief-writer`
- before first scene planner for a pack workflow
- when user jumps mid-pack without status context

## When not to use
<!-- blendops:generated:start exclusions -->
- Goal or entry point is ambiguous and no pack is chosen yet → use `../blendops-help/SKILL.md` (Triages ambiguous entry requests at precedence Rank 1)
- Evaluating which recipe or pack fits the user's goal → use `../recipe-fit-assessor/SKILL.md` (Scores candidate recipes/packs at precedence Rank 2 before preflight)
- Workflow is already past preflight with existing stage or artifact inventory → use `../workflow-stage-router/SKILL.md` (Routes in-flight workflows at precedence Rank 4)
- Detailed Blender MCP runtime connection preflight → use `../runtime-readiness/SKILL.md` (Inspects Path 1 or Path 2 runtime readiness in detail)
- Active MCP bridge port or add-on session conflicts → use `../bridge-conflicts/SKILL.md` (Resolves port 9876 and dual-bridge conflicts)
- Debugging Blender scene or runtime execution errors → use `../blender-troubleshooting/SKILL.md` (Diagnoses runtime or scene failures)
- Auditing external 3D asset license compliance → use `../asset-license-checker/SKILL.md` (Performs dedicated asset license and provenance verification)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "are we ready to start"
- "pre-flight for the pack"
- "what's missing before we build"
- "check prerequisites"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- intended pack/recipe named OR explicitly "exploratory"
- user OK receiving Blocked rows

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Current brief summary | Validates completeness |
| Target pack/recipe | Selects matrix rows |
| Evidence expectation | Prevents false Verified claims |

### Optional inputs

| Input | Use |
|---|---|
| Known runtime path intent | Gates MCP vs CLI appendix posture |
| Install target doc | Confirms user knows upstream steps |

## Output schema

### Primary output

- row table: Area | Status (`Ready` / `Needs input` / `Blocked`) | Owner action
- go / no-go summary
- one next skill (downstream domain planner if go; upstream remediation skill if no-go)

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <brief text, doc paths>
Limitations: <unknowns>
```

Truth-state rules:

* Artifact status defaults to `Not Produced`.
* States are downgrade-only (never upgrade).
* Preflight gating never executes packs, planners, or runtime, and never produces artifacts (a gate run alone stays `Runtime status: Not Run` and `Artifact status: Not Produced`).

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Preflight gate only — never executes packs, domain planners, or Blender runtime. Uses the 2-path + CLI appendix model per `docs/runtime-stack-strategy.md`:

* Path 1 always implies the Lab MCP add-on inside Blender 5.1+; Connector is never standalone.
* Path 2 and CLI appendix require explicit scope caveats and readiness confirmation via `runtime-readiness`.
* Defer runtime detail to `runtime-readiness`, bridge conflicts to `bridge-conflicts`, and runtime errors to `blender-troubleshooting`.

## Operating procedure

1. Load matrix `references/prerequisite-matrix.md` and evaluate brief completeness, runtime posture, skill coverage, and evidence habits.
2. Mark each row `Ready`, `Needs input`, or `Blocked`; apply `references/blocked-start-playbook.md` for any `Blocked` row.
3. Emit `references/pack-readiness-template.md` with explicit go/no-go and downgrade-only truth states (gating never produces artifacts).
4. Recommend exactly one next skill: if go, hand off to the target domain planner; if no-go, hand off to the single blocking upstream skill (never run pack execution, runtime debugging, or license checks inside this skill).

## Decision tree

```txt
Is the user's goal ambiguous or is no recipe/pack selected yet?
  Goal ambiguous → route to blendops-help (Rank 1)
  Goal clear, no recipe/pack selected → route to recipe-fit-assessor (Rank 2)
Has preflight already passed and do stage/artifact inventories already exist?
  Yes → route to workflow-stage-router (Rank 4)
  No → evaluate the 7-row prerequisite matrix (`references/prerequisite-matrix.md`)
Are critical rows (Goal & scope, Deliverables, Evidence habit) all Ready?
  No → verdict = NO-GO; apply `references/blocked-start-playbook.md` and route to the single blocking upstream skill:
    - Brief incomplete → intent-to-3d-brief-writer
    - Conflicting multi-deliverable scope → scope-guard
    - Unchecked third-party asset licenses → asset-license-checker
    - Active MCP bridge collision on port 9876 → bridge-conflicts
  Yes → check whether immediate runtime mutation is requested:
    - Planning-only start → verdict = GO (or GO with Warn on non-critical Needs input); route to target domain scene planner
    - Immediate runtime mutation requested with unverified runtime posture → route to runtime-readiness
```

## Playbooks

### Playbook A: Ready-to-plan product hero preflight (`GO`)

- Score all 7 rows in `references/prerequisite-matrix.md` (`Goal & scope`, `Deliverables`, `Asset plan`, `Quality bar`, `Runtime posture`, `Evidence habit`, `Single-bridge`).
- Confirm critical rows are `Ready` and non-critical runtime rows are either `Ready` or `Needs input` (acceptable for pure planning entry).
- Emit `Summary: GO` using `references/pack-readiness-template.md`, keep `Runtime status: Not Run` and `Artifact status: Not Produced`, and name the single target domain planner (such as `../product-hero-scene-planner/SKILL.md`).

### Playbook B: Half-baked brief or unprioritized deliverables (`NO-GO`)

- Mark `Goal & scope` or `Deliverables` as `Blocked` in the prerequisite matrix.
- Follow `references/blocked-start-playbook.md`: block entry into scene planners, list the exact missing brief slots or conflicting deliverables, and recommend `../intent-to-3d-brief-writer/SKILL.md` as the single remediation skill.
- Preserve `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Playbook C: Mid-pack jump with runtime or bridge confusion (`NO-GO`)

- When a user jumps directly to pack execution while both Path 1 and Path 2 bridges are enabled on port `9876` (or claims the Anthropic Connector works without Blender 5.1+ and the Lab add-on), mark `Runtime posture` / `Single-bridge` as `Blocked`.
- Route to `../bridge-conflicts/SKILL.md` or `../runtime-readiness/SKILL.md` before allowing any mutation-dependent pack step.

## Mode handling

### Text-only mode

Mark runtime rows as Needs input unless user supplied path choice.

### Runtime-ready mode

User-declared path must pair with `runtime-readiness` handoff suggestion.

### Blocked runtime mode

Still check non-runtime rows (brief, assets plan, evidence).

## Validation checklist

* [ ] Matrix covered across brief completeness, runtime posture, skill coverage, and evidence habits
* [ ] Every row marked `Ready`, `Needs input`, or `Blocked` with owner action for blocked/missing items
* [ ] Explicit go/no-go decision recorded
* [ ] Exactly one next skill named from the catalog
* [ ] Truth states follow downgrade-only rule with default `Not Produced` (no artifacts claimed by gate)

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All critical rows Ready |
| Warn | Non-critical gaps logged with acceptance |
| Fail | Critical row Blocked without mitigation |

## Failure handling

- If any critical prerequisite row (`Goal & scope`, `Deliverables`, `Evidence habit`) is `Blocked`, issue an explicit `NO-GO` verdict and route to the single upstream remediation skill from `references/blocked-start-playbook.md`.
- If the user claims `Artifact status: Verified` before the pack has even started, reject the upgraded truth state, reset `Artifact status: Not Produced` (downgrade-only), and mark `Evidence habit` as `Blocked` until acknowledged.
- If an active MCP port `9876` collision or dual-bridge setup is reported, halt preflight and hand off to `../bridge-conflicts/SKILL.md`.
- Never execute domain scene planning, asset license audits, or runtime debugging inside this gate skill.

## Troubleshooting

| Symptom | Cause | Safe resolution |
|---|---|---|
| User wants to start scene planning in text-only mode without Blender installed | `Runtime posture` is `Needs input`, but no runtime mutation is requested yet | Allow `Summary: GO` (with `Warn` note on `Runtime posture: Needs input`) if `Goal & scope`, `Deliverables`, and `Evidence habit` are `Ready`. |
| User assumes Claude Desktop Connector satisfies Path 1 prerequisites by itself | Standalone Connector misconception | Mark `Runtime posture` as `Needs input` / `Blocked`, state that Path 1 requires Blender 5.1+ plus the Lab MCP add-on inside Blender, and route readiness probing to `../runtime-readiness/SKILL.md`. |
| Multiple rows are `Blocked` simultaneously | User skipped both brief writing and asset planning | Order the minimum fixes per `references/blocked-start-playbook.md` and name the single earliest upstream blocker (`../intent-to-3d-brief-writer/SKILL.md`) as the immediate next skill. |

## Best practices

- Evaluate every row of `references/prerequisite-matrix.md` explicitly (`Ready`, `Needs input`, or `Blocked`) rather than giving an informal thumbs-up.
- Keep the gate output strictly decision-focused: one 7-row table, one `GO` / `NO-GO` verdict, and **one** immediate next skill from the catalog.
- Enforce `Artifact status: Not Produced` and `Runtime status: Not Run` as the default truth states for preflight gating.
- Always remind users of the single-bridge constraint (Path 1 and Path 2 cannot attach to the same Blender instance simultaneously).

## Good examples

- "`Pack / recipe: product-hero-v0` — All 7 matrix rows evaluated (`Goal & scope: Ready`, `Deliverables: Ready`, `Asset plan: Ready`, `Quality bar: Ready`, `Runtime posture: Needs input (planning-only)`, `Evidence habit: Ready`, `Single-bridge: Ready`). `Summary: GO`. Next skill: `../product-hero-scene-planner/SKILL.md`. `Runtime status: Not Run`. `Artifact status: Not Produced`."
- "`Pack / recipe: product-hero-v0` — `Goal & scope: Blocked` (missing camera framing and hero subject dimensions), `Deliverables: Needs input`. `Summary: NO-GO`. Next skill: `../intent-to-3d-brief-writer/SKILL.md`. `Runtime status: Not Run`. `Artifact status: Not Produced`."

## Bad examples

- "`Summary: GO` — Brief is still vague, we will figure out deliverables and licenses during rendering. Next skills: `product-hero-scene-planner`, `lighting-material-plan`, and `render-export-evidence`." — bypasses blocked critical rows and recommends multiple skills at once.
- "`Summary: GO` — Preflight passed so `Runtime status: Verified` and `Artifact status: Produced`." — fabricates runtime and artifact truth states from a planning gate.
- "I inspected your third-party FBX EULA and cleared the license." — overreaches into `asset-license-checker`.

## User-facing response template

```txt
Pack / recipe: <target pack or recipe name>

Prerequisite matrix:
| Area | Status | Notes / owner action |
|---|---|---|
| Goal & scope | <Ready | Needs input | Blocked> | <notes / action> |
| Deliverables | <Ready | Needs input | Blocked> | <notes / action> |
| Asset plan | <Ready | Needs input | Blocked> | <notes / action> |
| Quality bar | <Ready | Needs input | Blocked> | <notes / action> |
| Runtime posture | <Ready | Needs input | Blocked> | <notes / action> |
| Evidence habit | <Ready | Needs input | Blocked> | <notes / action> |
| Single-bridge | <Ready | Needs input | Blocked> | <notes / action> |

Summary: <GO | NO-GO>
Minimum fixes (if NO-GO): <ordered list or none>
Recommended next skill: <single catalog skill path>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <brief text and pack/recipe doc paths>
Limitations: <unverified runtime or asset assumptions>
```

## Anti-patterns

- Authorizing `Summary: GO` when `Goal & scope`, `Deliverables`, or `Evidence habit` is `Blocked`.
- Recommending three or four downstream skills simultaneously instead of naming **one** immediate next skill.
- Writing `Artifact status: Not Run` or upgrading truth states (`Produced` / `Verified`) as a side effect of passing preflight.
- Treating the Anthropic Connector as a standalone Path 1 setup that skips the Blender 5.1+ Lab MCP add-on.
- Performing deep MCP diagnostics, scene planning, or legal license review inside `pack-prerequisite-checker`.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [upstream_reference] Recipe selection → `../recipe-fit-assessor/SKILL.md`
- [fallback] Brief completeness → `../intent-to-3d-brief-writer/SKILL.md`
- [conditional] Runtime detail → `../runtime-readiness/SKILL.md`
- [fallback] Bridge conflicts → `../bridge-conflicts/SKILL.md`
- [fallback] Runtime debugging → `../blender-troubleshooting/SKILL.md`
- [conditional] License checks → `../asset-license-checker/SKILL.md`
- [alternative] Domain planner (product hero when Go) → `../product-hero-scene-planner/SKILL.md`
- [alternative] Domain planner (product grid when Go) → `../product-grid-scene-planner/SKILL.md`
- [alternative] Domain planner (character portrait when Go) → `../character-portrait/SKILL.md`
- [alternative] Domain planner (environment establishing shot when Go) → `../environment-shot/SKILL.md`
- [alternative] Domain planner (interior architectural when Go) → `../interior-scene/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Scoring which recipe or pack fits the user's initial idea (use `../recipe-fit-assessor/SKILL.md`).
- Routing active mid-flight workflows that already passed preflight (use `../workflow-stage-router/SKILL.md`).
- Writing the 8-slot 3D brief, planning scene geometry/lighting, or auditing asset licenses directly.
- Running Blender, configuring MCP hosts, or verifying rendered/exported files.

## References

* `references/prerequisite-matrix.md`
* `references/blocked-start-playbook.md`
* `references/pack-readiness-template.md`
