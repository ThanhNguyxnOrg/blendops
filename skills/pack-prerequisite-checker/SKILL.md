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

- micro decisions inside a single skill (too narrow)
- runtime readiness detail (use `official-runtime-readiness-checker`)
- runtime bridge conflicts (use `runtime-bridge-conflict-resolver`)
- runtime debugging (use `blender-troubleshooting`)
- license compliance (use `asset-license-checker`)

## Trigger phrases

- "are we ready to start"
- "pre-flight for the pack"
- "what's missing before we build"
- "check prerequisites"

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
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
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
* Path 2 and CLI appendix require explicit scope caveats and readiness confirmation via `official-runtime-readiness-checker`.
* Defer runtime detail to `official-runtime-readiness-checker`, bridge conflicts to `runtime-bridge-conflict-resolver`, and runtime errors to `blender-troubleshooting`.

## Operating procedure

1. Load matrix `references/prerequisite-matrix.md` and evaluate brief completeness, runtime posture, skill coverage, and evidence habits.
2. Mark each row `Ready`, `Needs input`, or `Blocked`; apply `references/blocked-start-playbook.md` for any `Blocked` row.
3. Emit `references/pack-readiness-template.md` with explicit go/no-go and downgrade-only truth states (gating never produces artifacts).
4. Recommend exactly one next skill: if go, hand off to the target domain planner; if no-go, hand off to the single blocking upstream skill (never run pack execution, runtime debugging, or license checks inside this skill).

## Mode handling

### Text-only mode

Mark runtime rows as Needs input unless user supplied path choice.

### Runtime-ready mode

User-declared path must pair with `official-runtime-readiness-checker` handoff suggestion.

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

## Cross-skill handoff

* Recipe selection → `../recipe-fit-assessor/SKILL.md`
* Brief completeness → `../intent-to-3d-brief-writer/SKILL.md`
* Runtime detail → `../official-runtime-readiness-checker/SKILL.md`
* Bridge conflicts → `../runtime-bridge-conflict-resolver/SKILL.md`
* Runtime debugging → `../blender-troubleshooting/SKILL.md`
* License checks → `../asset-license-checker/SKILL.md`
* Domain planners (when go) → `../product-hero-scene-planner/SKILL.md`, `../product-grid-scene-planner/SKILL.md`, `../character-portrait-scene-planner/SKILL.md`, `../environment-establishing-shot-planner/SKILL.md`, or `../interior-architectural-scene-planner/SKILL.md`

## References

* `references/prerequisite-matrix.md`
* `references/blocked-start-playbook.md`
* `references/pack-readiness-template.md`
