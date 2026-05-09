---
name: blender-checklist-driven-workflow
description: Define explicit per-stage gates and acceptance checklists before any modeling, render, or export work — work only proceeds gate by gate.
---

# blender-checklist-driven-workflow

## Purpose
Enforce a checklist-driven discipline where every stage of a Blender recipe (brief → asset → scene → render → export → handoff) has a written acceptance gate. Work does not advance until the previous stage's gate is checked off. Inspired by Anthropic Superpowers `/test-driven-development` analog: gate first, work second.

## Quick start
- list the stages of the user's recipe
- write the gate per stage (specific, checkable conditions)
- run the gate after each stage; do not proceed if it fails
- record the gate result + evidence per stage

## When to use
- complex multi-stage recipe (4+ distinct stages)
- when previous attempts had drift / scope creep / missed acceptance
- when user wants confidence that each stage is "done" before moving on
- before any runtime work

## When not to use
- single-step requests
- pure exploratory brainstorming (use `blender-brainstorming`)
- fixing a broken render (use `blender-troubleshooting`)
- final handoff (use `pre-handoff-verification`)

## Trigger phrases
- "let's do this step by step"
- "what's done before we move on"
- "checklist for this work"
- "I want to make sure each stage is solid"

## Prerequisites / readiness
- recipe stages identified (or willing to identify them)
- user accepts gate-driven discipline (not all do)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Recipe stages | Defines gate count |
| Acceptance criteria per stage | Drives gate content |
| Mode (text-only / runtime-ready) | Determines what gates can verify |

### Optional inputs

| Input | Use |
|---|---|
| Reference images / specs | Drives stage-specific acceptance |
| Time budget | Allows gate prioritization |

### Assumptions to confirm
- The user agrees not to skip gates.
- "Acceptance criteria" are pre-agreed, not invented at gate time.
- A failing gate stops work until resolved.

## Output schema

### Primary output
A per-stage gate table: stage name, acceptance criteria (3-5 explicit checks), evidence required, current state (`Pending` / `Pass` / `Fail` / `Blocked`).

### Secondary output
- the linear order in which stages must run
- per-stage handoff to a domain skill
- "gate failed → action" rules

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

Process / discipline skill — does not run Blender. Gates are written and evaluated against produced artifacts (per `evidence-before-done.md`). Gate verdicts are honest labels, not motivation.

## Operating procedure
1. Confirm recipe stages with user (typically 5-7 stages).
2. Write acceptance criteria per stage (specific, checkable; see `references/gate-template.md`).
3. Pin the gate sequence; no parallel stages without explicit justification.
4. After each stage's work, run the gate (`Pending` → `Pass` / `Fail`).
5. If `Fail`: do not advance; either re-do or hand off to `blender-troubleshooting`.
6. If `Pass`: advance to next stage.
7. At the end, hand off to `pre-handoff-verification` for the final 7-point gate.

## Decision tree

```txt
User wants to skip a stage?
  → Push back; document as risk if user insists
A previous gate is `Fail` but later stage was attempted anyway?
  → Stop; mark all subsequent stages `Blocked`
Two stages claimed `Pass` simultaneously?
  → Suspicious; verify each independently
Gate criteria are vague ("looks good")?
  → Re-write with concrete checks; do not run an undefined gate
```

## Playbooks

### Playbook A: Cyberpunk shoe hero (7 stages)
Stages: brief → scene plan → asset discovery → scene build → render → export → handoff. One gate per stage.

### Playbook B: Multi-product grid (5 stages)
Stages: brief → grid plan → consistency setup → render → export. One gate per stage; gate 3 = "all cells render identical at sub-resolution".

### Playbook C: Character portrait (6 stages)
Stages: brief → portrait plan → asset discovery → lookdev → render → handoff. Gate 4 = "lookdev approved against mood brief".

## Mode handling

### Text-only mode
Gates evaluate plans / specs only; runtime gates marked `Not Run` until runtime active.

### Runtime-ready mode
Gates evaluate produced artifacts; honest labels per `evidence-before-done.md`.

### Blocked runtime mode
Pre-runtime gates can pass; runtime / artifact gates remain `Blocked`.

## Validation checklist
- [ ] Stages listed in linear order
- [ ] Gates written per stage
- [ ] Acceptance criteria concrete (3-5 checks)
- [ ] Evidence required per gate explicit
- [ ] Current state per stage explicit
- [ ] No vague "looks good" gate
- [ ] Failing gate stops work
- [ ] Final handoff to `pre-handoff-verification` present

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All stages have written gates; evidence required is concrete; no skipped or vague gates. |
| Warn | One gate has soft criteria ("looks acceptable"); one stage missing evidence row. |
| Fail | Vague gates throughout; gates skipped; later stage `Pass` without earlier gate `Pass`. |

## Failure handling
- Vague criteria → rewrite with concrete checks.
- User pushes to skip → document as risk; require explicit acknowledgment.
- Gate fails repeatedly → hand off to `blender-troubleshooting`.

## Troubleshooting

| Problem | Response |
|---|---|
| Gate criteria invented at gate time | Reset; write gates BEFORE stage work begins. |
| Gate `Pass` without evidence | Downgrade to `Pending`; require evidence. |
| Multiple `Fail` gates accumulating | Stop work; troubleshoot before advancing. |

## Best practices
- Write gates BEFORE the stage work begins.
- Gates contain concrete checks (numbers, paths, file existence) — not feelings.
- Stop work on first `Fail`; do not "we'll fix it in the next stage".
- Pair every gate with a fallback action.

## Good examples
- "Stage 4 (render) gate: `out/render-2026-05-09.png` exists, dimensions 1920×1080, samples >= 128, render time logged. Evidence required: file path + visible image. Current state: Pending."

## Bad examples
- "Stage 4 gate: render looks good." — vague.

## User-facing response template

```txt
Recipe: <name>
Stages (linear order):

| # | Stage | Acceptance criteria | Evidence required | State | Next handoff |
|---|---|---|---|---|---|
| 1 | <stage> | <3-5 concrete checks> | <path / file / measurement> | Pending / Pass / Fail / Blocked | <skill> |
| 2 | … | … | … | … | … |

Failed gate action: stop + troubleshoot
Final handoff (after all gates Pass): pre-handoff-verification
Limitations: <gaps>
```

## Anti-patterns
- Vague gate criteria.
- Skipping gates.
- Inventing criteria at gate time.
- Marking `Pass` without evidence.
- Running parallel stages without justification.

## Cross-skill handoff
- Brainstorming → `../blender-brainstorming/SKILL.md` (only if early)
- Brief → `../intent-to-3d-brief-writer/SKILL.md`
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- Scene planners → respective scene planner skill
- Quality validators → respective checker
- Troubleshooting on fail → `../blender-troubleshooting/SKILL.md`
- Final gate → `../pre-handoff-verification/SKILL.md`

## Non-goals
- Run Blender.
- Author the recipe.
- Replace `pre-handoff-verification` (that is the final 7-point gate; this skill is per-stage).

## References
- `references/gate-template.md`
- `references/stage-decomposition-patterns.md`
- `references/failed-gate-handling.md`
- `../../docs/skill-system.md`
