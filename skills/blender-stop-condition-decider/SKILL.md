---
name: blender-stop-condition-decider
description: Define explicit "done" conditions for a Blender recipe before starting work, so the agent stops at the right point instead of drifting into endless polish.
---

# blender-stop-condition-decider

## Purpose
Pin a single, explicit stop condition for one recipe BEFORE work begins—consisting of one concrete sentence, an explicit out-of-scope list, and a handoff trigger—so the agent stops at the right point instead of drifting into endless polish. Firing the stop condition routes the deliverable to the next skill; it never upgrades any runtime or artifact truth state. Inspired by Anthropic Superpowers `/just-say-when-it's-done` analog.

## Quick start
- write one stop condition per recipe (one sentence, concrete)
- write what is OUT OF SCOPE for "done"
- write the handoff trigger (which skill receives the deliverable when stop condition fires)
- enforce: do not polish past the stop condition; do not declare done before it

## When to use
- BEFORE starting work on any non-trivial single Blender recipe
- after `blender-recipe-decomposer` has isolated a single recipe and `acceptance-criteria-builder` has provided measurable acceptance rows
- when previous attempts drifted into endless polish or unclear completion boundaries

## When not to use
- pure exploration or brainstorming (use `blender-brainstorming`; goal is divergence)
- tiny single-shot requests
- splitting a broad multi-recipe request beforehand (use `blender-recipe-decomposer` first)
- authoring measurable acceptance rows from scratch (use `acceptance-criteria-builder` first)
- enforcing per-stage checklist gates during execution (use `blender-checklist-driven-workflow`)
- after work has already started and scope is drifting mid-flight (use `blender-scope-boundary-enforcer`)
- performing the final verification gate before delivery (use `pre-handoff-verification`)

## Trigger phrases
- "when are we done"
- "let's set the bar"
- "what does done look like"

## Prerequisites / readiness
- single-recipe scope is clear (split beforehand via `blender-recipe-decomposer` if needed)
- measurable acceptance rows are available from `acceptance-criteria-builder`
- user accepts a written stop condition BEFORE work begins

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Single recipe scope | Anchors the stop condition to one recipe (via `blender-recipe-decomposer` if previously multi-part) |
| Measurable acceptance rows | Consumed from `acceptance-criteria-builder` to define what "done" means concretely |

### Optional inputs

| Input | Use |
|---|---|
| Time / budget constraints | Forces tighter out-of-scope boundaries |
| Reference deliverable | Calibrates the measurable bar |

### Assumptions to confirm
- The stop condition is written and agreed to BEFORE work begins.
- "Done" is the stop and handoff point, not a temporary plateau before extra polish.
- Ambiguous "done" means the recipe is not yet ready to start.

## Output schema

### Primary output
A single stop condition record written before work begins: one concrete sentence, an out-of-scope list (3-5 items), and a named handoff trigger skill.

### Secondary output
- explicit guardrails: what does NOT count as done
- next-step routing instruction when the stop condition fires

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

- Default artifact status is `Not Produced`; default runtime status before execution is `Not Run`.
- Truth states are downgrade-only, never upgrade.
- A stop condition firing does NOT upgrade any truth state; downstream evidence skills (such as `render-export-evidence` and `pre-handoff-verification`) decide labels.

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Process and discipline skill only—no Python code and no Blender execution. This skill writes the stop condition before work starts and routes handoff when the condition is met; it never executes runtime tasks or upgrades truth states.

## Operating procedure
1. Confirm single-recipe scope BEFORE work begins (if multiple recipes exist, hand off to `blender-recipe-decomposer` first).
2. Consume measurable acceptance rows from `acceptance-criteria-builder` and write one concrete stop-condition sentence for the recipe.
3. List 3-5 items that are explicitly OUT OF SCOPE for "done".
4. Pin the exact catalog skill that receives the handoff when the stop condition fires.
5. Hold the boundary: stop polishing once the condition fires and route to the handoff skill (such as `pre-handoff-verification` or `render-export-evidence`) without claiming a truth-state upgrade.

## Decision tree

```txt
Stop condition vague ("looks great")?
  → Route to acceptance-criteria-builder for measurable rows, then rewrite as one concrete sentence
Multiple stop conditions or recipes proposed?
  → Route to blender-recipe-decomposer to split scope, or keep the highest-priority condition and move others to out-of-scope
Work already started and scope is shifting mid-flight?
  → Hand off to blender-scope-boundary-enforcer
Stop condition not yet evaluable in current mode?
  → Mark as forward-condition; keep runtime Not Run and artifact Not Produced
```

## Playbooks

### Playbook A: Hero render
"Done = `out/render-2026-05-09.png` exists at 1920×1080, 128+ Cycles samples, mood matches brief, validation logged." Handoff trigger: `render-export-evidence` (then `pre-handoff-verification`). Out of scope: animation, post-process, alternate lighting takes.

### Playbook B: GLB handoff
"Done = `out/scene.glb` exists, gltf-validator passes, triangle count within budget, animation contract documented." Handoff trigger: `glb-web-handoff` (or `pre-handoff-verification`). Out of scope: high-poly cinematic renders, custom shader authoring, additional LOD tiers, promotional stills.

### Playbook C: Text-only plan
"Done = scene plan section count >= 7, all sections concrete, asset list flagged, handoff to scene quality checker." Handoff trigger: `blender-scene-quality-checker`. Out of scope: running Blender, producing files, writing Python.

## Mode handling

### Text-only mode
Stop condition refers strictly to plan completeness. Runtime status remains `Not Run` and artifact status remains `Not Produced`.

### Runtime-ready mode
Stop condition refers to target artifacts and acceptance rows. When the condition fires, it routes to `render-export-evidence` or `pre-handoff-verification`—firing does not itself upgrade runtime or artifact status to `Produced` or `Verified`.

### Blocked runtime mode
Stop condition is recorded before work begins as a forward condition awaiting runtime readiness; runtime status stays `Not Run` and artifact status stays `Not Produced`.

## Validation checklist
- [ ] Written BEFORE work begins on a single recipe
- [ ] Stop condition is exactly one concrete sentence consuming `acceptance-criteria-builder` rows
- [ ] Out-of-scope list (3-5 items) is present and explicit
- [ ] Handoff trigger names a real BlendOps catalog skill
- [ ] Does not claim or trigger a truth-state upgrade upon firing
- [ ] Plain language used (no Python, no Blender execution claims)

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | One concrete stop condition + out-of-scope + handoff. |
| Warn | Stop condition present but slightly soft; out-of-scope partial. |
| Fail | Vague "looks good" stop condition; no out-of-scope; no handoff; multiple conditions stacked. |

## Failure handling
- Vague stop condition without measurable criteria → route to `acceptance-criteria-builder`, then rewrite.
- Multiple recipes or conditions stacked → route to `blender-recipe-decomposer` to split into separate recipes.
- User pushes for "more polish" or changes scope after work starts → hand off to `blender-scope-boundary-enforcer`.

## Troubleshooting

| Problem | Response |
| --- | --- |
| User wants "perfect" before stopping | Consume concrete rows from `acceptance-criteria-builder`; place "perfect" polish items into the out-of-scope list. |
| Stop condition keeps moving mid-flight | Mid-recipe scope drift; hand off to `blender-scope-boundary-enforcer`. |
| Firing treated as `Verified` without evidence | Downgrade-only rule applies (default artifact `Not Produced`); route to `render-export-evidence` and `pre-handoff-verification` to evaluate truth states. |

## Best practices
- One sentence, one stop condition, one recipe.
- Write the condition BEFORE work begins.
- Out-of-scope is at least as important as in-scope.
- "Done" is honest, not optimistic.

## Good examples
- "Done = single hero still exported at 1920x1080 meeting the approved framing and lighting acceptance rows. Out of scope: animation, post-process grading, alternate lighting takes. Handoff trigger: `render-export-evidence`."

## Bad examples
- "Done when it looks great." — vague.

## User-facing response template

```txt
Recipe: <name>
Stop condition (one sentence, concrete): <…>
Out of scope for "done":
  - <…>
  - <…>
  - <…>
Handoff trigger: <skill>
Mode: <text-only / runtime-ready / blocked>
Limitations: <gaps>
```

## Anti-patterns
- Stacking multiple stop conditions or multiple recipes into one record.
- Using vague language ("when it looks great").
- Defining or moving the stop condition after work has already begun.
- Treating a fired stop condition as an automatic upgrade to `Produced` or `Verified`.
- Blurring roles with `acceptance-criteria-builder`, `blender-checklist-driven-workflow`, or `blender-scope-boundary-enforcer`.

## Cross-skill handoff
- Intent brief → `../intent-to-3d-brief-writer/SKILL.md`
- Scope splitting beforehand → `../blender-recipe-decomposer/SKILL.md`
- Measurable acceptance rows → `../acceptance-criteria-builder/SKILL.md`
- Per-stage workflow gates → `../blender-checklist-driven-workflow/SKILL.md`
- Mid-flight scope drift → `../blender-scope-boundary-enforcer/SKILL.md`
- Artifact and render evidence → `../render-export-evidence/SKILL.md`
- Final pre-handoff gate → `../pre-handoff-verification/SKILL.md`

## Non-goals
- Run Blender or execute Python.
- Split multi-recipe scope (`blender-recipe-decomposer`).
- Author raw measurable acceptance rows (`acceptance-criteria-builder`).
- Enforce per-stage checklist gates (`blender-checklist-driven-workflow`).
- Police mid-flight scope drift (`blender-scope-boundary-enforcer`).
- Gate the final delivery (`pre-handoff-verification`) or upgrade runtime/artifact truth states.

## References
- `references/stop-condition-templates.md`
- `references/out-of-scope-patterns.md`
- `references/done-vs-perfect.md`
- `../../docs/skill-system.md`
