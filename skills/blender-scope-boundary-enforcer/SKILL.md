---
name: blender-scope-boundary-enforcer
description: Detect mid-recipe scope creep and push back constructively before the recipe drifts; require explicit user agreement before scope expansion.
---

# blender-scope-boundary-enforcer

## Purpose
Catch in-recipe scope creep ("can you also do X?") and force the user to either (a) decline the expansion, or (b) agree to a new scope explicitly. Prevents silent absorption that breaks gates and stop conditions.

## Quick start
- when scope drift is detected, name it
- offer 3 options: decline / explicit-add-now (with agreement) / defer to follow-up recipe
- record the decision before proceeding

## When to use
- mid-recipe, when user adds new requests beyond the brief
- when "while we're at it" appears
- when stages start exceeding their gates "just a bit"

## When not to use
- early planning (scope is naturally fluid)
- pure brainstorming (no scope yet)
- when the addition is trivially within an existing gate

## Trigger phrases
- "can you also"
- "while you're at it"
- "actually let's also"
- "one more thing"

## Prerequisites / readiness
- recipe has a brief and stop condition
- user accepts that scope changes need explicit agreement

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Current scope (brief + stop condition) | Anchors the boundary |
| Proposed addition | Subject of the scope decision |

### Optional inputs

| Input | Use |
|---|---|
| Time / budget remaining | Affects feasibility of in-recipe addition |

### Assumptions to confirm
- The user agrees scope creep should be made explicit, not silent.
- "Trivial within current gate" is judged by the gate criteria, not by feel.

## Output schema

### Primary output
A scope decision record: addition (one sentence), recommended action (decline / add-now-with-agreement / defer), rationale, evidence of agreement if added.

### Secondary output
- updated stop condition if added now
- explicit recipe-split note if deferred

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

Process / discipline skill — does not run Blender. Decisions are about scope language, not runtime.

## Operating procedure
1. Detect scope addition (trigger phrase or substantive new requirement).
2. Compare addition to current brief + stop condition.
3. Classify:
   - Trivial within gate → absorb silently is OK
   - Substantive but small → propose 3 options
   - Major → strongly recommend defer
4. Record the user's decision.
5. If added: update stop condition and gates.
6. If deferred: note for follow-up recipe.

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
Scope decisions about plan additions; runtime claims unchanged.

### Runtime-ready mode
Scope decisions affect render queue, asset queue, gate count.

### Blocked runtime mode
Scope decisions still applicable for plan layer.

## Validation checklist
- [ ] Addition stated in one sentence
- [ ] Action recommendation (decline / add / defer) explicit
- [ ] User agreement evidence required if added
- [ ] Stop condition updated if added
- [ ] Recipe split documented if deferred

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

Original brief: <one line>
Original stop condition: <one line>

Options:
  1. Decline — proceed with original scope.
  2. Add now — agree to new scope: <updated stop condition>. Cost: <time / gate / budget>.
  3. Defer — track as follow-up recipe (no current scope change).

Recommended: <option>
Decision needed before proceeding.
Limitations: <gaps>
```

## Anti-patterns
- Silently absorbing the addition.
- Adding without updating the stop condition.
- Treating "while we're at it" as the same scope.
- No defer option.

## Cross-skill handoff
- Original brief → `../intent-to-3d-brief-writer/SKILL.md`
- Workflow gates → `../blender-checklist-driven-workflow/SKILL.md`
- Stop condition → `../blender-stop-condition-decider/SKILL.md`
- Recipe splitting → `../blender-recipe-decomposer/SKILL.md`

## Non-goals
- Run Blender.
- Author the recipe.
- Decide for the user (the user picks among options).

## References
- `references/scope-addition-classification.md`
- `references/options-language-template.md`
- `references/recurring-creep-patterns.md`
- `../../docs/skill-system.md`
