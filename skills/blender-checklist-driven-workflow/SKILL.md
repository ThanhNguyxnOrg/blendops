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
- complex multi-stage recipe (4+ distinct stages) requiring per-stage gate enforcement
- when work must be locked behind explicit `Pending | Pass | Fail | Blocked` stage gates before advancing
- when the user wants verifiable proof that each stage passes its checks before starting the next stage
- before any runtime work begins, to lock concrete checks, required evidence, and failure exits per stage

## When not to use
- single-step requests
- pure exploratory brainstorming (use `blender-brainstorming`)
- decomposing a brief into stages (use `blender-recipe-decomposer`)
- writing measurable acceptance criteria rows from scratch (use `acceptance-criteria-builder`)
- pinning the overall done/stop condition (use `blender-stop-condition-decider`)
- guarding against mid-flight scope creep (use `blender-scope-boundary-enforcer`)
- selecting which skill runs next across the workflow (use `workflow-stage-router`)
- fixing repeated stage failures or broken renders (use `blender-troubleshooting`)
- executing the final 7-point handoff gate (use `pre-handoff-verification`)

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
A per-stage gate table written BEFORE stage work begins: stage name, concrete checks (3-5 explicit checks consuming rows from `acceptance-criteria-builder`), evidence required, failure exit, and current gate state (`Pending` | `Pass` | `Fail` | `Blocked`).

### Secondary output
- the linear order in which gates must be evaluated
- explicit failure exits per gate (stop work immediately on `Fail`; route repeated failures to `blender-troubleshooting`)
- delegation to `workflow-stage-router` to pick the next domain skill after a gate reaches `Pass`

### Evidence / caveat output
Keep gate states (`Pending | Pass | Fail | Blocked`) strictly separate from runtime truth states and artifact states. Truth states are downgrade-only, never upgrade:

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

Process / discipline skill — does not run Blender. Gates are written and evaluated against produced artifacts (per `evidence-before-done.md`). Gate verdicts are honest labels, not motivation.

## Operating procedure
1. Confirm the linear recipe stages (using output from `blender-recipe-decomposer` if not yet decomposed).
2. BEFORE any stage work begins, write the per-stage gate for every stage: concrete checks (consuming measurable rows from `acceptance-criteria-builder`), required evidence, and explicit failure exits (see `references/gate-template.md`).
3. Pin the gate sequence in linear order; no parallel stages without explicit justification.
4. After each stage's work, evaluate the gate and update its gate state (`Pending` → `Pass` or `Fail`), keeping gate vocabulary separate from runtime truth states (`Not Run | Attempted | Produced | Verified | Failed`) and artifact states (default `Not Produced`).
5. If a gate is `Fail`: stop work immediately and execute the gate's failure exit; if a gate fails repeatedly, hand off to `blender-troubleshooting`.
6. If a gate is `Pass`: advance to the next stage (using `workflow-stage-router` to pick the next skill if needed).
7. Once all per-stage gates are `Pass`, hand off to `pre-handoff-verification` for the final 7-point gate.

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
Gates evaluate plans and specs only. Pre-runtime planning gates can be evaluated (`Pending | Pass | Fail | Blocked`), while runtime-dependent gates remain `Pending` or `Blocked`. Separately, runtime truth state remains `Not Run` and artifact state defaults to `Not Produced` (never assign `Not Run` as a gate state).

### Runtime-ready mode
Gates evaluate produced artifacts using `Pending | Pass | Fail | Blocked` against honest runtime truth states (`Not Run | Attempted | Produced | Verified | Failed`) and artifact states (default `Not Produced`) per `evidence-before-done.md`. Truth states are downgrade-only, never upgrade.

### Blocked runtime mode
Pre-runtime gates can reach `Pass`, while runtime/artifact-dependent gates remain `Blocked`. Runtime truth state stays `Not Run` (or `Failed` if attempted and broken) and artifact state remains `Not Produced`.

## Validation checklist
- [ ] Stages listed in linear order
- [ ] Gates written BEFORE stage work begins
- [ ] Concrete checks (3-5 per gate), required evidence, and failure exits explicit for every gate
- [ ] Gate states use only `Pending | Pass | Fail | Blocked`
- [ ] Runtime truth states (`Not Run | Attempted | Produced | Verified | Failed`) and artifact states (default `Not Produced`) are kept separate from gate states and downgrade-only
- [ ] No vague "looks good" gate
- [ ] Failing gate stops work immediately
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
| Gate criteria invented at gate time | Reset; write gates (checks, evidence, failure exits) BEFORE stage work begins. |
| Gate `Pass` without evidence | Mark gate `Pending` or `Fail` and require evidence; downgrade runtime/artifact truth states accordingly (truth states are downgrade-only, never upgrade). |
| Gate state marked `Not Run` or `Verified` | Fix vocabulary conflation: gates use `Pending | Pass | Fail | Blocked`; runtime truth uses `Not Run | Attempted | Produced | Verified | Failed`; artifacts default to `Not Produced`. |
| Repeated `Fail` on the same gate | Stop work; hand off to `blender-troubleshooting`. |

## Best practices
- Write gates BEFORE the stage work begins.
- Gates contain concrete checks (numbers, paths, file existence) — not feelings.
- Stop work on first `Fail`; do not "we'll fix it in the next stage".
- Pair every gate with a fallback action.

## Good examples
- "Stage 4 (render) gate — written before render work: Checks: `out/render-2026-05-09.png` exists, dimensions 1920×1080, samples >= 128, render time logged. Evidence required: file path + visible image + render log snippet. Failure exit: stop work immediately; if fails twice, hand off to `blender-troubleshooting`. Gate state: `Pending`."

## Bad examples
- "Stage 4 gate: render looks good." — vague.

## User-facing response template

```txt
Recipe: <name>
Stages (linear order, written before work begins):

| # | Stage | Concrete checks (3-5) | Evidence required | Failure exit | Gate state |
|---|---|---|---|---|---|
| 1 | <stage> | <3-5 concrete checks> | <path / file / measurement> | Stop work; <re-do or hand off to blender-troubleshooting on repeated fail> | Pending / Pass / Fail / Blocked |
| 2 | … | … | … | … | … |

Next skill routing (on Pass): hand off to workflow-stage-router
Final handoff (after all stage gates Pass): pre-handoff-verification

Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <gaps>
```

## Anti-patterns
- Vague gate criteria ("looks good").
- Skipping gates or advancing after a `Fail` gate.
- Inventing gate checks or failure exits after stage work has already started.
- Running parallel stages without explicit justification.
- Conflating gate states (`Pending | Pass | Fail | Blocked`) with runtime truth states (`Not Run | Attempted | Produced | Verified | Failed`) or artifact states (default `Not Produced`).
- Upgrading runtime or artifact truth states (truth states are downgrade-only).
- Blurring boundaries with `acceptance-criteria-builder`, `blender-stop-condition-decider`, `blender-scope-boundary-enforcer`, `workflow-stage-router`, or `pre-handoff-verification`.

## Cross-skill handoff
- Brainstorming → `../blender-brainstorming/SKILL.md` (only if early)
- Brief authoring → `../intent-to-3d-brief-writer/SKILL.md`
- Recipe stage decomposition → `../blender-recipe-decomposer/SKILL.md`
- Measurable acceptance rows → `../acceptance-criteria-builder/SKILL.md`
- Overall done condition → `../blender-stop-condition-decider/SKILL.md`
- Scope creep protection → `../blender-scope-boundary-enforcer/SKILL.md`
- Next-skill routing across stages → `../workflow-stage-router/SKILL.md`
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- Scene planners → `../product-hero-scene-planner/SKILL.md`, `../product-grid-scene-planner/SKILL.md`, `../character-portrait-scene-planner/SKILL.md`, `../environment-establishing-shot-planner/SKILL.md`, `../interior-architectural-scene-planner/SKILL.md`, `../blender-composition-camera-planner/SKILL.md`, `../blender-lighting-material-planner/SKILL.md`
- Quality validators → `../blender-scene-quality-checker/SKILL.md`, `../material-quality-checker/SKILL.md`, `../lighting-quality-checker/SKILL.md`, `../composition-quality-checker/SKILL.md`, `../polycount-budget-checker/SKILL.md`
- Repeated gate failures → `../blender-troubleshooting/SKILL.md`
- Final 7-point gate → `../pre-handoff-verification/SKILL.md`

## Non-goals
- Run Blender or execute Python.
- Decompose recipes into stages (`blender-recipe-decomposer`).
- Write measurable acceptance criteria rows (`acceptance-criteria-builder`).
- Pin the overall done/stop condition (`blender-stop-condition-decider`).
- Guard against scope creep (`blender-scope-boundary-enforcer`).
- Pick next skills across the workflow (`workflow-stage-router`).
- Diagnose repeated technical failures (`blender-troubleshooting`).
- Replace the final 7-point handoff gate (`pre-handoff-verification`).

## References
- `references/gate-template.md`
- `references/stage-decomposition-patterns.md`
- `references/failed-gate-handling.md`
- `../../docs/skill-system.md`
