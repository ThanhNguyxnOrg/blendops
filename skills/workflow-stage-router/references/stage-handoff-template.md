# Stage Handoff Template

Use this compact routing card at the end of `workflow-stage-router` so any AI agent or user knows the exact active milestone, observed truth state, preconditions, and single next skill to invoke.

```txt
Current milestone: <Stage 1..7 name, e.g. Stage 3: Scene & Lookdev Planning>

Observed inventory snapshot:
  - Brief (8-slot): <present (path) | partial (missing slots) | absent>
  - Scene / camera / lighting plans: <present | partial | absent>
  - Acceptance / budget gates: <present | absent>
  - Runtime setup / readiness: <verified (Path 1/2/CLI) | blocked | Not Run>
  - Output artifacts (.blend / PNG / .glb): <Produced/Verified paths | Not Produced>

Primary next skill: <exact single skill slug, e.g. lighting-material-plan>
Why this skill now: <1-2 plain-language sentences tying current inventory gap to the next milestone>

Preconditions before running next skill:
  1. <e.g. Confirm whether web .glb export is required alongside still PNG>
  2. <e.g. Lock primary product dimensions and floor height Z = 0>

Optional parallel skills (only if user explicitly requests batching):
  - <slug> (caution: confirm no conflicting budget edits against primary path)

Stop condition (when to return to workflow-stage-router):
  - <e.g. Return after material portability tier and view transform are recorded, or immediately if scope conflicts emerge>

Truth reminder:
  Runtime status: <Not Run | Attempted | Produced | Verified | Failed>
  Artifact status: <Not Produced | Produced | Verified | Failed>
```

## Routing Discipline
- Recommend **one primary next skill** by default; keep optional parallel skills explicitly gated so beginners are never overwhelmed.

## Related skill
[../SKILL.md](../SKILL.md)
