---
name: blender-scope-boundary-enforcer
description: Detect mid-recipe scope creep and push back constructively before the recipe drifts; require explicit user agreement before scope expansion.
---

# blender-scope-boundary-enforcer

## Purpose
Catch mid-flight scope creep ("can you also do X?") and force an explicit recorded decision: (a) decline the expansion, (b) add now with explicit user agreement (updating the stop condition and stage gates), or (c) defer to a follow-up recipe. Prevents silent absorption that breaks gates and stop conditions. Trivial in-gate items may be absorbed only when existing gate criteria explicitly cover them — never by feel.

## Quick start
- when scope drift is detected, name it
- offer 3 options: decline / explicit-add-now (with agreement) / defer to follow-up recipe
- record the decision before proceeding

## When to use
- mid-recipe, when user adds new requests beyond the brief
- when "while we're at it" appears
- when stages start exceeding their gates "just a bit"

## When not to use
- early planning before scope is pinned (use `intent-to-3d-brief-writer` and `blender-stop-condition-decider`)
- pure brainstorming with no active recipe (use `blender-brainstorming`)
- when the addition is already explicitly covered by existing gate criteria in `blender-checklist-driven-workflow` / `acceptance-criteria-builder` (verified against written criteria, never judged by feel)

## Trigger phrases
- "can you also"
- "while you're at it"
- "actually let's also"
- "one more thing"

## Prerequisites / readiness
- recipe has an active brief (`intent-to-3d-brief-writer`), pinned stop condition (`blender-stop-condition-decider`), and stage gates (`blender-checklist-driven-workflow` / `acceptance-criteria-builder`)
- user accepts that mid-flight scope changes require an explicit, recorded decision

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Current scope (brief + stop condition) | Anchors the boundary pinned before execution |
| Current stage gates & acceptance criteria | Judges whether an addition is truly within an existing gate or exceeds it |
| Proposed addition | Subject of the scope decision |

### Optional inputs

| Input | Use |
|---|---|
| Time / budget remaining | Affects feasibility of in-recipe addition |

### Assumptions to confirm
- The user agrees scope creep must be named, classified, and recorded — never silently absorbed.
- "Trivial within current gate" is judged strictly by written gate criteria (`blender-checklist-driven-workflow` / `acceptance-criteria-builder`), never by feel.

## Output schema

### Primary output
A scope decision record: named addition (one sentence), classification (in-gate trivial by criteria / substantive / major), recommended action (decline / add-now-with-agreement / defer), rationale, and recorded evidence of user agreement before proceeding.

### Secondary output
- updated stop condition (`blender-stop-condition-decider`), stage gates (`blender-checklist-driven-workflow`), and measurable acceptance rows (`acceptance-criteria-builder`) if added now
- explicit follow-up recipe note (`blender-recipe-decomposer`) if deferred

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
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

Process / discipline skill — does not run Blender or execute Python. Decisions govern scope boundaries, stop conditions, and stage gates. A scope decision never upgrades runtime (`Not Run | Attempted | Produced | Verified | Failed`) or artifact (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) truth states; truth-state changes are downgrade-only (for example, when added scope invalidates a previously satisfied gate).

## Operating procedure
1. Detect and name the mid-flight scope addition (trigger phrase or new requirement beyond the brief).
2. Compare the addition against the current brief, pinned stop condition (`blender-stop-condition-decider`), and written stage gate criteria (`blender-checklist-driven-workflow` / `acceptance-criteria-builder`).
3. Classify (never by feel — verify against written gate criteria; thresholds per `references/scope-addition-classification.md`):
   - **Trivial within existing gate**: ONLY if written gate criteria already encompass it → name it, record that it fits the existing gate criteria, and proceed without silent drift.
   - **Substantive addition**: exceeds current gate criteria or stop condition → present the 3 options (decline / add-now-with-agreement / defer) and require explicit user agreement.
   - **Major addition or brief contradiction**: alters recipe architecture or invalidates earlier stages → strongly recommend deferring to a follow-up recipe via `blender-recipe-decomposer`.
4. Record the user's explicit decision before proceeding.
5. If added now: update the stop condition (`blender-stop-condition-decider`), stage gates (`blender-checklist-driven-workflow`), and measurable criteria (`acceptance-criteria-builder`); downgrade any invalidated runtime/artifact truth states (never upgrade).
6. If deferred: record an explicit follow-up recipe note for `blender-recipe-decomposer` before final `pre-handoff-verification`.

## Decision tree

```txt
Addition extends scope by < 5%?
  → Likely trivial; mention briefly
Addition extends scope 5-25%?
  → Propose 3 options; require agreement
Addition extends scope > 25%?
  → Recommend defer to follow-up recipe; require strong override
Addition contradicts brief?
  → Force pause; brief needs revision before continuation
```

## Playbooks

### Playbook A: "Can you also add color variants?"
Original recipe: single hero render. Addition is substantive (multi-render). Recommend defer to follow-up `product-grid-scene-planner` recipe.

### Playbook B: "Slight different lighting?"
Original recipe: hero render with locked lighting. Addition is medium. Propose: decline, add-with-extra-render, or defer.

### Playbook C: "Just bump the resolution"
Original recipe: 1920×1080. Addition: 4K. Likely small effort but doubles render time. Propose: decline, add-with-extended-time-budget, or defer.

## Mode handling

### Text-only mode
Scope decisions govern the plan, stop condition, and gate definitions; runtime status remains `Not Run` and artifact status remains `Not Produced` (default).

### Runtime-ready mode
Scope decisions affect the render queue, asset queue, and stage gates. Adding scope never upgrades truth states; if an addition invalidates prior outputs, downgrade affected runtime/artifact states accordingly.

### Blocked runtime mode
Scope decisions still apply to the planning and gate layer; runtime truth states remain unchanged or downgraded.

## Validation checklist
- [ ] Addition named explicitly in one sentence and classified against written gate criteria (not by feel)
- [ ] Action recommendation (decline / add-now-with-agreement / defer) stated explicitly
- [ ] Explicit user agreement recorded before proceeding
- [ ] Stop condition (`blender-stop-condition-decider`), stage gates (`blender-checklist-driven-workflow`), and acceptance rows (`acceptance-criteria-builder`) updated if added now
- [ ] Follow-up recipe note documented for `blender-recipe-decomposer` if deferred
- [ ] Truth states kept downgrade-only (no runtime or artifact truth state upgraded by the scope decision)

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Addition named, options offered, decision recorded, stop condition / gates updated. |
| Warn | Decision made but rationale partial. |
| Fail | Silent absorption into recipe; no agreement; no updated stop condition; "while we're at it" drift unchecked. |

## Failure handling
- User refuses to decide → require pause; do not continue with ambiguous scope.
- User wants "just both" → that is silent absorption; force explicit agreement.
- Recurring scope creep → flag pattern; suggest scope retro before next recipe.

## Troubleshooting

| Problem | Response |
|---|---|
| User pushes back on the boundary | Explain the cost: gates broken, stop condition moved, time multiplies. |
| Scope creep already absorbed silently | Stop; reset scope explicitly; document the slip. |
| Multiple additions in same conversation | Process each one separately; do not bundle. |

## Best practices
- Name the addition explicitly; do not gloss.
- Always offer the defer option (it is usually the best one).
- Treat agreement as evidence; record it.
- Pair with `blender-checklist-driven-workflow` for gate updates.

## Good examples
- "Addition: render 4K version. Original brief: 1920×1080. This is substantive; doubles render time. Options: (1) Decline — keep 1920×1080. (2) Add now — extend recipe time, new gate '4K render exists'. (3) Defer — follow-up recipe for high-res. Recommended: defer."

## Bad examples
- "Sure, I'll do that too." — silent absorption.

## User-facing response template

```txt
Detected scope addition: <addition in one sentence>
Classification: <in-gate by written criteria | substantive | major>

Original brief: <one line>
Original stop condition: <one line>

Options:
  1. Decline — proceed with original scope and gates.
  2. Add now — require explicit agreement to updated stop condition (<updated stop condition>) and updated stage gates (<updated gates / acceptance criteria>). Cost: <time / gate / budget impact>.
  3. Defer — keep current scope unchanged; record as a follow-up recipe note for blender-recipe-decomposer: <follow-up recipe note>.

Recommended: <option>
Decision needed before proceeding.
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default: Not Produced)
Limitations: <gaps; scope decisions never upgrade truth states>
```

## Anti-patterns
- Silently absorbing an addition ("Sure, I'll do that too") or judging it "trivial" by feel instead of written gate criteria.
- Adding scope without updating both the stop condition (`blender-stop-condition-decider`) and stage gates (`blender-checklist-driven-workflow` / `acceptance-criteria-builder`).
- Treating "while we're at it" as part of the original scope.
- Omitting the defer option or failing to record a follow-up recipe note (`blender-recipe-decomposer`).
- Upgrading runtime or artifact truth states on the basis of a scope agreement.

## Cross-skill handoff
- Original brief → `../intent-to-3d-brief-writer/SKILL.md`
- Stop condition pinned beforehand / updated on expansion → `../blender-stop-condition-decider/SKILL.md`
- Per-stage gates enforced / updated on expansion → `../blender-checklist-driven-workflow/SKILL.md`
- Measurable acceptance rows for added scope → `../acceptance-criteria-builder/SKILL.md`
- Deferred scope split into follow-up recipes → `../blender-recipe-decomposer/SKILL.md`
- Delivery gate after scope and gates settle → `../pre-handoff-verification/SKILL.md`

## Non-goals
- Run Blender.
- Author the recipe.
- Decide for the user (the user picks among options).

## References
- `references/scope-addition-classification.md`
- `references/options-language-template.md`
- `references/recurring-creep-patterns.md`
- `../../docs/skill-system.md`
