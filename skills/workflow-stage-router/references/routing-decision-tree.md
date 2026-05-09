# Routing decision tree

```txt
No structured brief?
  → intent-to-3d-brief-writer (or blender-brainstorming if goal fuzzy)

Brief exists but recipe/pack unclear?
  → recipe-fit-assessor

Pack chosen but prerequisites unchecked?
  → pack-prerequisite-checker

Need explicit Path 1 vs Path 2 vs CLI?
  → runtime-path-picker

Bridge / port confusion?
  → runtime-bridge-conflict-resolver

Planning outputs missing for user's ask?
  → narrow planner (product hero / domain planner)

Validators requested before runtime?
  → relevant quality checker (material / lighting / composition / polycount)

Artifacts claimed without proof?
  → render-export-evidence + downgrade claims

Ready to ship words to non-Blender stakeholder?
  → non-blender-user-response-writer (+ pre-handoff-verification if "ready" stated)
```

Prefer **one** primary recommendation; list alternates only when user must choose tradeoffs.
