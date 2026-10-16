---
name: acceptance-criteria-builder
description: Turn a locked 3D brief plus chosen recipe into a measurable acceptance checklist with evidence hooks.
---

# acceptance-criteria-builder

## Purpose

Turn a locked 3D brief plus chosen recipe into a measurable acceptance checklist (`Criterion | Measurement | Evidence expected | Owner`) with evidence hooks, consumed by validators, `render-export-evidence`, and `pre-handoff-verification`. This skill is planning-only: it never executes Blender or Python, never produces artifacts, and never verifies files itself.

## Quick start

- ingest brief slots + recipe expectations
- expand using `references/checklist-patterns.md`
- attach evidence hooks per `references/evidence-hook-rules.md`
- format via `references/brief-to-criteria-mapper.md`

## When to use

- after a brief is locked with `intent-to-3d-brief-writer` and a recipe is chosen, before expensive render or export stages
- when translating qualitative brief goals into measurable checklist rows with evidence hooks
- after `blender-scope-boundary-enforcer` approves a brief or recipe delta that requires updated acceptance rows

## When not to use

- pure exploration without a locked deliverable (use `blender-brainstorming`)
- writing or locking the brief itself (use `intent-to-3d-brief-writer`)
- pinning the stop or done condition (use `blender-stop-condition-decider`)
- enforcing per-stage workflow gates (use `blender-checklist-driven-workflow`)
- guarding or deciding scope boundaries (use `blender-scope-boundary-enforcer`)
- legal or license-permission language (use `asset-license-checker`)
- classifying artifact evidence (use `render-export-evidence`) or gating final handoffs (use `pre-handoff-verification`)

## Trigger phrases

- "acceptance criteria"
- "measurable checklist rows"
- "evidence hooks for brief"
- "sign-off checklist table"

## Prerequisites / readiness

- brief considered locked enough for planners OR deltas explicitly listed
- recipe/pack anchor identified

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Locked brief summary | Source of target criteria (from `intent-to-3d-brief-writer`) |
| Chosen recipe | Anchors expected deliverables and stage checks |
| Priority outputs | Weights checklist rows (P0 vs secondary) |

### Optional inputs

| Input | Use |
|---|---|
| Brand rubric | Adds objective rows |
| Platform constraints | Adds measurable thresholds |

## Output schema

### Primary output

- prioritized checklist table: `Criterion | Measurement | Evidence expected | Owner`

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <brief version ID + chosen recipe ID>
Limitations: <subjective rows flagged; planning-only — writing criteria never produces artifacts or verifies files>
```

Rules for status reporting:

* Artifact status defaults to `Not Produced`; Runtime status defaults to `Not Run` when generating criteria.
* Truth states are downgrade-only, never upgrade.
* Never attach false `Verified` hooks or claim `Produced`/`Verified` status from criteria writing alone.

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

This skill is strictly planning-only (no Python, no Blender execution). Checklists may define expected runtime evidence hooks, but must never execute tasks, verify files, or upgrade truth states beyond what upstream evidence skills report.

## Operating procedure

1. Ingest the locked brief and chosen recipe to map fields into criterion categories.
2. Convert qualitative goals into measurable thresholds (`Criterion | Measurement | Evidence expected | Owner`) and explicitly flag any remaining subjective rows.
3. Attach expected evidence hooks (without claiming `Produced` or `Verified` states) and route any license-permission items to `asset-license-checker`.
4. Hand off the checklist to stage validators, `render-export-evidence` for artifact classification, and `pre-handoff-verification` for handoff gating.

## Mode handling

### Text-only mode

Evidence hooks describe expected artifacts only. Set `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Runtime-ready mode

Add measurement rows with evidence hooks consumed by `render-export-evidence` and validators. Keep `Artifact status: Not Produced` until downstream evidence skills classify actual outputs.

### Blocked runtime mode

Keep the measurable criteria table intact, record the blocker under `Limitations`, and use only valid downgrade-only truth states (`Runtime status: Not Run` or `Failed`; `Artifact status: Not Produced` or `Failed` — never invent a `Blocked` state).

## Validation checklist

* [ ] Every P0 criterion is measurable or explicitly flagged as subjective
* [ ] Every P0 row includes `Criterion | Measurement | Evidence expected | Owner`
* [ ] No false `Verified` hooks or upgraded truth states (`Not Produced` default preserved)
* [ ] No license-permission language included (delegated to `asset-license-checker`)
* [ ] No role overlap with stop-condition, stage-gate, scope, or verification skills

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | P0 criteria measurable + evidence hooks attached + subjective rows flagged + default `Not Produced` preserved |
| Warn | Subjective-heavy list flagged for stakeholder sign-off |
| Fail | False `Verified` hooks, invalid or upgraded truth states (e.g., `Blocked`), license-permission rows written here, or claims of execution/verification |

## Cross-skill handoff

* Brief source → `../intent-to-3d-brief-writer/SKILL.md`
* Done / stop condition → `../blender-stop-condition-decider/SKILL.md`
* Per-stage gate enforcement → `../blender-checklist-driven-workflow/SKILL.md`
* Scope boundary enforcement → `../blender-scope-boundary-enforcer/SKILL.md`
* License permissions → `../asset-license-checker/SKILL.md`
* Artifact evidence classification → `../render-export-evidence/SKILL.md`
* Handoff gate verification → `../pre-handoff-verification/SKILL.md`

## References

- `references/checklist-patterns.md`
- `references/evidence-hook-rules.md`
- `references/brief-to-criteria-mapper.md`
