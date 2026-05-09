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
- runtime debugging (use `blender-troubleshooting` / bridge resolver)
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

- row table: Area | Status | Owner action
- go / no-go summary
- next skill when go

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <brief text, doc paths>
Limitations: <unknowns>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Readiness gate only. State Path 1 / Path 2 / CLI appendix per `docs/runtime-stack-strategy.md` without claiming Connector works alone — Path 1 always implies Blender Lab MCP add-on inside Blender 5.1+.

## Operating procedure

1. Load matrix `references/prerequisite-matrix.md`.
2. Apply `references/blocked-start-playbook.md` for any Blocked row.
3. Emit `references/pack-readiness-template.md`.
4. If go → next planner skill; if no-go → list minimum inputs.

## Mode handling

### Text-only mode

Mark runtime rows as Needs input unless user supplied path choice.

### Runtime-ready mode

User-declared path must pair with `official-runtime-readiness-checker` handoff suggestion.

### Blocked runtime mode

Still check non-runtime rows (brief, assets plan, evidence).

## Validation checklist

- [ ] Matrix covered
- [ ] Each Blocked row has owner action
- [ ] Go/no-go explicit
- [ ] Next skill named if go

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All critical rows Ready |
| Warn | Non-critical gaps logged with acceptance |
| Fail | Critical row Blocked without mitigation |

## Cross-skill handoff

- Recipe selection → `../recipe-fit-assessor/SKILL.md`
- Brief → `../intent-to-3d-brief-writer/SKILL.md`
- Runtime detail → `../official-runtime-readiness-checker/SKILL.md`
- Bridge conflicts → `../runtime-bridge-conflict-resolver/SKILL.md`

## References

- `references/prerequisite-matrix.md`
- `references/blocked-start-playbook.md`
- `references/pack-readiness-template.md`
- `../../packs/product-hero-v0/PACK.md`
