# EVAL — official-runtime-readiness-checker

## Text-only eval prompt
Use official-runtime-readiness-checker to produce readiness matrix and final status (Ready/Partially Ready/Blocked/Unknown) without running Blender scene operations.

## Expected behavior
- readiness checks with evidence
- confidence label per check
- conservative final status

## Pass / Warn / Fail criteria
- Pass: matrix complete + evidence-aligned status
- Warn: partial evidence with explicit caveat
- Fail: readiness claim without evidence

## Common failure modes
- confusing readiness with execution success
- missing blocker details

## Evidence expectations
- check table with evidence lines
- final status rationale
- blocker list when not ready
