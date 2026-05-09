---
name: blender-stop-condition-decider
description: Define explicit "done" conditions for a Blender recipe before starting work, so the agent stops at the right point instead of drifting into endless polish.
---

# blender-stop-condition-decider

## Purpose
Pin a single, explicit stop condition for a recipe so the agent knows when to declare "done" and hand off — not earlier, not later. Inspired by Anthropic Superpowers `/just-say-when-it's-done` analog.

## Quick start
- write one stop condition per recipe (one sentence, concrete)
- write what is OUT OF SCOPE for "done"
- write the handoff trigger (which skill receives the deliverable when stop condition fires)
- enforce: do not polish past the stop condition; do not declare done before it

## When to use
- before any non-trivial Blender recipe
- when previous attempts drifted into endless polish or scope creep
- before runtime work (so "Verified" claim is honest)

## When not to use
- pure exploration / brainstorming (no stop condition; goal is divergence)
- tiny single-shot requests
- after work has already started without scope (use `blender-scope-boundary-enforcer` instead)

## Trigger phrases
- "when are we done"
- "let's set the bar"
- "what does done look like"

## Prerequisites / readiness
- recipe scope clear (or willing to clarify)
- user accepts a written stop condition

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Recipe scope | Anchors the stop condition |
| Acceptable quality bar | Determines what "done" means concretely |

### Optional inputs

| Input | Use |
|---|---|
| Time / budget constraints | May force tighter scope |
| Reference deliverable | Calibrates the bar |

### Assumptions to confirm
- The user accepts that "done" is the stop point, not a temporary plateau before more polish.
- Ambiguous "done" → not yet ready to start.

## Output schema

### Primary output
A single stop condition record: condition (one sentence), out-of-scope list, handoff trigger.

### Secondary output
- explicit guardrails: what would NOT count as done
- review hint after stop condition fires

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Process / discipline skill — does not run Blender. Stop condition is evaluated against produced evidence.

## Operating procedure
1. Confirm recipe scope.
2. Write one concrete stop condition.
3. List 3-5 things that are explicitly OUT OF SCOPE for "done".
4. Pin handoff trigger.
5. Enforce: do not polish past it; do not declare done before evidence supports it.

## Decision tree

```txt
Stop condition vague ("looks great")?
  → Rewrite with concrete artifact + check
Multiple stop conditions proposed?
  → Pick the highest-priority one; relegate others to follow-up scope
Stop condition not yet evaluable in this mode?
  → Mark as forward-condition; do not declare done in this stage
```

## Playbooks

### Playbook A: Hero render
"Done = `out/render-2026-05-09.png` exists at 1920×1080, 128+ Cycles samples, mood matches brief, validation logged."

### Playbook B: GLB handoff
"Done = `out/scene.glb` exists, gltf-validator passes, triangle count within budget, animation contract documented."

### Playbook C: Text-only plan
"Done = scene plan section count >= 7, all sections concrete, asset list flagged, handoff to scene quality checker."

## Mode handling

### Text-only mode
Stop condition refers to plan completeness; runtime claims marked `Not Run`.

### Runtime-ready mode
Stop condition refers to produced + validated artifacts.

### Blocked runtime mode
Stop condition is reframed as "ready to start once runtime is available"; do not declare done.

## Validation checklist
- [ ] Stop condition is one sentence
- [ ] Stop condition is concrete (no "looks good")
- [ ] Out-of-scope list (3-5 items) present
- [ ] Handoff trigger named
- [ ] Mode-appropriate phrasing

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | One concrete stop condition + out-of-scope + handoff. |
| Warn | Stop condition present but slightly soft; out-of-scope partial. |
| Fail | Vague "looks good" stop condition; no out-of-scope; no handoff; multiple conditions stacked. |

## Failure handling
- Vague stop condition → rewrite.
- Multiple conditions → pick one + scope follow-up.
- User pushes for "more polish" past the condition → require new scope agreement.

## Troubleshooting

| Problem | Response |
|---|---|
| User wants "perfect" before stopping | Rewrite condition with concrete bar; document that "perfect" is forward scope. |
| Stop condition keeps moving | Mid-recipe scope drift; hand off to `blender-scope-boundary-enforcer`. |
| Done declared without evidence | Downgrade per `evidence-before-done.md`; require evidence. |

## Best practices
- One sentence, one stop condition, one recipe.
- Write the condition BEFORE work begins.
- Out-of-scope is at least as important as in-scope.
- "Done" is honest, not optimistic.

## Good examples
- "Done = `out/render.png` at 1920×1080 + 128 Cycles samples + mood match validated against reference image diff < 5%. Out of scope: animation, post-process, alternate lighting takes."

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
- Multiple stacked stop conditions.
- Vague language.
- Letting "done" drift across the recipe.
- Declaring done without evidence.

## Cross-skill handoff
- Brief → `../intent-to-3d-brief-writer/SKILL.md`
- Workflow gates → `../blender-checklist-driven-workflow/SKILL.md`
- Final pre-handoff → `../pre-handoff-verification/SKILL.md`
- Scope drift → `../blender-scope-boundary-enforcer/SKILL.md`

## Non-goals
- Run Blender.
- Author the recipe.
- Polish past the stop condition.

## References
- `references/stop-condition-templates.md`
- `references/out-of-scope-patterns.md`
- `references/done-vs-perfect.md`
- `../../docs/skill-system.md`
