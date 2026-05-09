# Quick-Start Prompts

Copy-paste prompts the user can give an AI agent to load BlendOps skills correctly. Each is paired with the routing decision the agent should make.

## Prompt 1 — "I want to make a 3D scene but I don't know what to do"

```txt
I want to make a 3D scene of <subject> but I'm not sure exactly what.
Help me think it through with BlendOps before any planning.
```

**Agent should load:** `blender-brainstorming` first. After confirmed intent, route to `intent-to-3d-brief-writer`.

## Prompt 2 — "I have a clear request, plan it"

```txt
Plan a BlendOps scene for: <one-paragraph clear request including subject + mood + deliverable + audience>.
Lock the brief first, then route to the planners.
```

**Agent should load:** `intent-to-3d-brief-writer` first (skip brainstorming because the request is structured). Then planners.

## Prompt 3 — "Check if my Blender setup is ready before I run it"

```txt
Check BlendOps runtime readiness for my setup. I'm using <Path 1 host (a/b) / Path 2 / CLI fallback>.
Don't run Blender; just report readiness.
```

**Agent should load:** `official-runtime-readiness-checker`. If signals inconsistent, escalate to `runtime-bridge-conflict-resolver`.

## Prompt 4 — "My render came out wrong, debug it"

```txt
My render output doesn't match what I asked for.
Run BlendOps `blender-troubleshooting` 4-phase diagnostic.
Don't propose fixes until Phase 1 reproduction is locked.
```

**Agent should load:** `blender-troubleshooting`. After Phase 4, route to the skill at the divergence point.

## Prompt 5 — "I think we're ready to ship; verify before handoff"

```txt
I'm about to send <deliverable> to <audience>.
Run BlendOps `pre-handoff-verification` 7-point gate before I claim it's ready.
Downgrade the claim explicitly if any check fails.
```

**Agent should load:** `pre-handoff-verification`. Only after Pass verdict, route to `non-blender-user-response-writer`.

## Prompt 6 — "Write the final response for stakeholders"

```txt
Summarize the BlendOps run results for <audience> in plain language.
Keep it non-technical. Cite evidence labels (`Verified` / `Produced` / `Not Run` etc.).
```

**Agent should load:** `non-blender-user-response-writer`. If `pre-handoff-verification` did not run yet, route there first.

## Anti-patterns

- Loading `product-hero-scene-planner` directly from a vague request without brainstorming. Will produce an under-specified plan.
- Loading `pre-handoff-verification` after the response is already sent. The gate must run BEFORE handoff.
- Skipping `blendops-help` when intent is unclear. The router exists for this reason.
