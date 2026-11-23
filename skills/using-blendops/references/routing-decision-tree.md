# Routing decision tree

```txt
No structured brief?
  → scoping-3d-briefs (or scoping-3d-briefs if goal fuzzy)

Brief exists but recipe/pack unclear?
  → scoping-3d-briefs

Pack chosen but prerequisites unchecked?
  → defining-done-and-gates

Need explicit Path 1 vs Path 2 vs CLI?
  → setting-up-blender-runtime

Bridge / port confusion?
  → setting-up-blender-runtime

Planning outputs missing for user's ask?
  → narrow planner (product hero / domain planner)

Validators requested before runtime?
  → relevant quality checker (material / lighting / composition / polycount)

Artifacts claimed without proof?
  → verifying-before-handoff + downgrade claims

Ready to ship words to non-Blender stakeholder?
  → using-blendops (+ verifying-before-handoff if "ready" stated)
```

Prefer **one** primary recommendation; list alternates only when user must choose tradeoffs.
