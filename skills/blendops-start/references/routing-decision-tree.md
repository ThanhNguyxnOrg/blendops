# Routing decision tree

```txt
No structured brief?
  → blendops-brief (or blendops-brief if goal fuzzy)

Brief exists but recipe/pack unclear?
  → blendops-brief

Pack chosen but prerequisites unchecked?
  → blendops-done-criteria

Need explicit Path 1 vs Path 2 vs CLI?
  → blendops-connect-blender

Bridge / port confusion?
  → blendops-connect-blender

Planning outputs missing for user's ask?
  → narrow planner (product hero / domain planner)

Validators requested before runtime?
  → relevant quality checker (material / lighting / composition / polycount)

Artifacts claimed without proof?
  → blendops-final-check + downgrade claims

Ready to ship words to non-Blender stakeholder?
  → blendops-start (+ blendops-final-check if "ready" stated)
```

Prefer **one** primary recommendation; list alternates only when user must choose tradeoffs.
