# Handoff recipients

The preview report is consumed by exactly these downstream skills. Hand off to one of them based on the next step.

## glb-web-handoff (web target)

Use when the next consumer is a web app (Three.js / R3F / Babylon / model-viewer).

The web handoff skill will read:
- `Artifacts` section to know what was produced
- `Validation` section to know what was checked
- `Top-line.Status` to know whether to allow handoff

## non-blender-user-response-writer (final user reply)

Use when the next step is the final reply to a non-Blender user.

The response writer skill will read:
- `Top-line.Status` for the headline
- `Artifacts` rows for the "what was made" list
- `Limitations` line for the honest caveats

## pre-handoff-verification (gate before handoff)

Use **before** glb-web-handoff or non-blender-user-response-writer if any of:
- artifact rows have `Produced` but not `Verified`
- validation rows have skips
- top-line status is `Warn`

The pre-handoff verification skill applies the 7-point evidence gate.

## render-export-evidence (re-run if needed)

Use if the report shows `Failed` rows that need a new run, or if no rows have evidence.

## Two recipient rule

A single preview report can hand off to at most two recipients (e.g., web + final response). More than two means the report is being asked to do too much; split into separate reports.

## Related skill
`../SKILL.md`
