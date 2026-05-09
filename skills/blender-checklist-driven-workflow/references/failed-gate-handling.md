# Failed-gate handling

A failed gate is a feature, not a bug. It catches drift before it compounds.

## Standard response to `Fail`

1. Stop work on subsequent stages.
2. Mark all subsequent stages `Blocked`.
3. Hand off to `blender-troubleshooting` for root-cause analysis.
4. Resolve the failure (re-do current stage or change scope).
5. Re-run the gate; only after `Pass` proceed.

## Common failure types

| Failure type | Cause | Response |
|---|---|---|
| Missing artifact | Render / export did not run or failed | Re-run with verified inputs; capture error |
| Wrong dimensions / format | Scene config mismatch | Adjust scene render settings; re-run |
| Below quality threshold (samples, validation) | Speed-vs-quality compromise | Decide: accept lower quality with explicit caveat OR re-run with higher settings |
| Out-of-budget | Triangle / texture / file size | Hand off to budget skill; degrade per `glb-mobile-performance-budget` rules |
| Mood / vision mismatch | Brief or plan diverged | Re-confirm brief; replan scene |
| User changes scope mid-run | Scope creep | Hand off to `blender-scope-boundary-enforcer` |

## What NOT to do

- Skip the failed gate and continue.
- Mark `Pass` "for now" with a TODO to fix later.
- Ignore minor failures (they compound).
- Run more stages hoping the failure resolves itself.

## When to abandon a recipe

After 3+ failed gates on the same stage, consider:
- Is the stage criteria too strict?
- Has the brief drifted?
- Is the runtime path the wrong choice?
- Does this recipe need a rewrite?

Document the abandonment with the failed gates as evidence; do not pretend the work succeeded.

## Related skill
`../SKILL.md`
