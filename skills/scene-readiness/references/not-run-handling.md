# Not Run Handling

## Purpose
Prevent false readiness when runtime was not executed.

## When to use
Text-only or blocked runtime mode.

## Checklist
- mark artifact status Not Run
- avoid success claims
- provide runtime-eval next step

## Good example
"No runtime execution in this pass; artifacts Not Run."

## Bad example
"Export ready" without runtime execution.

## Related skill
../SKILL.md
