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
- after `scope-guard` approves a brief or recipe delta that requires updated acceptance rows

## When not to use
<!-- blendops:generated:start exclusions -->
- pure exploration without a locked deliverable → use `../blender-brainstorming/SKILL.md` (use blender-brainstorming)
- writing or locking the brief itself → use `../intent-to-3d-brief-writer/SKILL.md` (use intent-to-3d-brief-writer)
- pinning the stop or done condition → use `../done-criteria/SKILL.md` (use done-criteria)
- enforcing per-stage workflow gates → use `../stage-gates/SKILL.md` (use stage-gates)
- guarding or deciding scope boundaries → use `../scope-guard/SKILL.md` (use scope-guard)
- legal or license-permission language → use `../asset-license-checker/SKILL.md` (use asset-license-checker)
- classifying artifact evidence → use `../pre-handoff-verification/SKILL.md` (use pre-handoff-verification)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "acceptance criteria"
- "measurable checklist rows"
- "evidence hooks for brief"
- "sign-off checklist table"
<!-- blendops:generated:end triggers -->

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
Artifact status: Not Produced | Produced | Verified | Failed
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

## Decision tree

```txt
Is the 3D brief locked (or are approved deltas explicitly listed)?
  No → stop and route to intent-to-3d-brief-writer (or blender-brainstorming if still exploratory)
  Yes → continue
Is a target recipe or pack identified?
  No → route to recipe-fit-assessor to anchor deliverable expectations
  Yes → continue
Does the request ask to approve mid-stream scope additions?
  Yes → route to scope-guard before updating acceptance rows
  No → continue
Does a criterion involve asset licensing, redistribution, or attribution rules?
  Yes → delegate license rows to asset-license-checker; keep technical/visual rows here
  No → map brief slots to P0/P1/P2 rows with measurable thresholds and evidence hooks
Are any P0 rows inherently aesthetic or mood-driven (e.g., "cyberpunk atmosphere")?
  Yes → pair with a proxy heuristic and mark as subjective requiring named stakeholder sign-off
  No → attach objective validator and render-export-evidence ledger hooks
```

## Playbooks

### Playbook A: Product hero still + web GLB acceptance table

- Map brief subject, framing, lighting contrast, output resolution (`resolution-aspect-decision`), file format (`output-format-decision`), and mobile/web GLB budget (`mobile-glb-budget`) into `Criterion | Measurement | Evidence expected | Owner` rows.
- Tag contractually required deliverables as `P0` and secondary polish items as `P1`/`P2`.
- Keep `Runtime status: Not Run` and `Artifact status: Not Produced` while authoring the table.

### Playbook B: Subjective mood or brand aesthetic translation

- Decompose qualitative phrases (such as "warm luxury brass" or "wet neon street feel") into observable proxy measurements (key-to-fill contrast ratio notes, palette bounds, reflection roughness range) using `references/checklist-patterns.md`.
- Explicitly flag the remaining aesthetic judgment row as `[Subjective — requires stakeholder sign-off]` in the `Measurement` column per `references/evidence-hook-rules.md`.
- Forbid automatic `Verified` hooks on subjective rows without recorded human approval.

### Playbook C: Post-delta criteria revision

- After `scope-guard` approves a brief or recipe change, update only the affected checklist rows and record the brief version ID in `Evidence used`.
- Preserve downgrade-only truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`) until `render-export-evidence` re-evaluates any affected outputs.

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

## Failure handling

- If the input brief is unlocked or missing core deliverable slots, do not invent criteria; return a blocked planning note with `Runtime status: Not Run` and `Artifact status: Not Produced` and route to `intent-to-3d-brief-writer`.
- If the user asks to mark rows `Verified` during criteria authoring, refuse the upgrade, explain that `acceptance-criteria-builder` is planning-only, and route actual output files to `render-export-evidence`.
- If the prompt mixes acceptance criteria with legal asset-permission checks, strip the legal language from this checklist and route those items to `asset-license-checker`.
- If an upstream gate has already failed, preserve downgrade-only truth states and route to `pre-handoff-verification`.

## Troubleshooting

| Symptom | Cause | Safe resolution |
|---|---|---|
| Checklist explodes beyond 15+ rows | Every minor scene detail was promoted to `P0` | Apply `references/brief-to-criteria-mapper.md` (1–3 criteria per brief slot on first pass) and demote non-blocking polish to `P1`/`P2`. |
| Mood criterion has no testable threshold | Adjective copied verbatim from brief ("looks cinematic") | Pair with framing/lighting validator hooks (`composition-quality-checker`, `lighting-quality-checker`) and flag the residual aesthetic check for stakeholder sign-off. |
| Stakeholder treats checklist table as proof that files exist | Evidence hook column misread as completed verification | Restate `Runtime status: Not Run` and `Artifact status: Not Produced`, and clarify that `Evidence expected` describes future proof required by `render-export-evidence`. |

## Best practices

- Keep `P0` rows concise, observable, and directly tied to a brief slot or recipe constraint (`references/brief-to-criteria-mapper.md`).
- Name the exact downstream validator or evidence skill in `Owner` / `Evidence expected` (for example, `polycount-budget-checker`, `mobile-glb-budget`, `render-export-evidence`).
- Separate objective technical thresholds from subjective creative sign-off rows so automated gates and human reviews never collide.
- Always emit `Runtime status: Not Run` and `Artifact status: Not Produced` when publishing or updating criteria tables.

## Good examples

- "`P0 | Hero PNG resolution & alpha | 2048x2048 RGBA PNG with transparent background | Output path + image header check in render-export-evidence (target: Verified) | render-export-evidence`"
- "`P0 | Web GLB file size & triangle budget | <= 5 MB total file size, <= 50k triangles | GLB inspection ledger via polycount-budget-checker + mobile-glb-budget | render-export-evidence`"
- "`P1 | Cyberpunk neon mood read [Subjective] | Cyan/magenta rim contrast + wet ground specular read; requires human art-direction sign-off | Preview render + signed stakeholder note | Stakeholder + lighting-quality-checker`"

## Bad examples

- "`P0 | Scene quality | Looks amazing and photorealistic | Engineer says it looks good | AI agent`" — untestable adjective with a forbidden self-attestation hook.
- "`P0 | Final GLB | Verified and ready for production | Artifact status: Verified | acceptance-criteria-builder`" — fabricates artifact verification inside a planning-only skill.
- "`P0 | Third-party sneaker logo license | Cleared for commercial resale | Checked by acceptance-criteria-builder | acceptance-criteria-builder`" — violates role boundary with `asset-license-checker`.

## User-facing response template

```txt
Brief & recipe anchor: <locked brief ID + chosen recipe/pack>

Acceptance criteria checklist:
| Priority | Criterion | Measurement | Evidence expected | Owner |
|---|---|---|---|---|
| P0 | <criterion> | <measurable threshold or [Subjective] flag> | <artifact type + validator + target truth state> | <skill or stakeholder> |
| P1 | <criterion> | <measurable threshold or [Subjective] flag> | <artifact type + validator + target truth state> | <skill or stakeholder> |

Subjective sign-off notes: <rows requiring human stakeholder approval, or none>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <brief version ID + recipe path + reference docs consulted>
Limitations: <planning-only checklist; does not execute Blender or verify files>
Next skill: <stage-gates | render-export-evidence | pre-handoff-verification>
```

## Anti-patterns

- Marking any row or output block `Produced` or `Verified` merely because acceptance criteria were written.
- Writing `Artifact status: Not Run` instead of `Artifact status: Not Produced` (or inventing a `Blocked` truth state).
- Accepting vague adjectives ("clean", "pop", "realistic") as `P0` measurements without either a quantifiable proxy or an explicit `[Subjective]` stakeholder sign-off flag.
- Authoring legal copyright or license clearance criteria here instead of handing off to `asset-license-checker`.
- Replacing `done-criteria`, `stage-gates`, or `pre-handoff-verification` with ad-hoc gate logic.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [upstream_reference] Brief source → `../intent-to-3d-brief-writer/SKILL.md`
- [progression] Done / stop condition → `../done-criteria/SKILL.md`
- [progression] Per-stage gate enforcement → `../stage-gates/SKILL.md`
- [progression] Scope boundary enforcement → `../scope-guard/SKILL.md`
- [progression] License permissions → `../asset-license-checker/SKILL.md`
- [progression] Artifact evidence classification → `../render-export-evidence/SKILL.md`
- [progression] Handoff gate verification → `../pre-handoff-verification/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Unlocking or rewriting the creative brief from scratch (use `intent-to-3d-brief-writer`).
- Executing Blender, generating Python scripts, or running automated file inspectors.
- Certifying that rendered images or exported GLB files actually meet the checklist (use `render-export-evidence` and `pre-handoff-verification`).
- Providing legal advice or asset license clearance (use `asset-license-checker`).

## References

- `references/checklist-patterns.md`
- `references/evidence-hook-rules.md`
- `references/brief-to-criteria-mapper.md`
