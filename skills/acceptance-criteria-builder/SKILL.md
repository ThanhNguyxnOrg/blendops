---
name: acceptance-criteria-builder
description: Turn a locked 3D brief plus chosen recipe into a measurable acceptance checklist with evidence hooks.
---

# acceptance-criteria-builder

## Purpose

Translate qualitative creative goals into **checkable** acceptance rows so validators, evidence skills, and stakeholders share one definition of done.

## Quick start

- ingest brief slots + recipe expectations
- expand using `references/checklist-patterns.md`
- attach evidence hooks per `references/evidence-hook-rules.md`
- format via `references/brief-to-criteria-mapper.md`

## When to use

- before first expensive render/export decision
- when stakeholders disagree on "done"
- after scope change mid-project

## When not to use

- pure exploration without deliverable (brainstorming phase)
- legal compliance rows (license skill owns permissions language)

## Trigger phrases

- "definition of done"
- "acceptance criteria"
- "how do we know this is finished"
- "sign-off checklist"

## Prerequisites / readiness

- brief considered locked enough for planners OR deltas explicitly listed
- recipe/pack anchor identified

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Brief summary | Source of criteria |
| Priority outputs | Weight checklist |

### Optional inputs

| Input | Use |
|---|---|
| Brand rubric | Adds objective rows |
| Platform constraints | Adds measurable thresholds |

## Output schema

### Primary output

- prioritized checklist table: Criterion | Measurement | Evidence expected | Owner

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <brief version ID>
Limitations: <subjective rows flagged>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Checklist may include runtime tasks but must label evidence expectations without claiming upstream execution outcomes.

## Operating procedure

1. Map brief fields to criterion categories.
2. Convert subjective adjectives to observable signals where possible.
3. Attach default evidence artifacts (still filename pattern, GLB checks, report sections).
4. Hand off to `pre-handoff-verification` near completion.

## Mode handling

### Text-only mode

Evidence hooks describe expected artifacts, not actual files.

### Runtime-ready mode

Add measurement rows tied to render-export-evidence outputs.

### Blocked runtime mode

Keep criteria but mark execution rows Blocked.

## Validation checklist

- [ ] Every P0 criterion measurable or explicitly subjective
- [ ] Evidence hook per P0 row
- [ ] Subjective rows flagged

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | P0 criteria covered + hooks |
| Warn | Subjective-heavy list — stakeholder sign-off needed |
| Fail | False Verified hooks |

## Cross-skill handoff

- Brief source → `../intent-to-3d-brief-writer/SKILL.md`
- Scope enforcement → `../blender-scope-boundary-enforcer/SKILL.md`
- Final verification → `../pre-handoff-verification/SKILL.md`

## References

- `references/checklist-patterns.md`
- `references/evidence-hook-rules.md`
- `references/brief-to-criteria-mapper.md`
