# EVAL — glb-web-handoff

## Text-only eval prompt
Use glb-web-handoff to produce a handoff report with explicit artifact status and caveats.

## Expected behavior
- GLB/preview status
- assumptions and limitations
- next verification actions

## Pass / Warn / Fail criteria
- Pass: no artifact overclaims + clear caveats
- Warn: partial caveats or assumptions
- Fail: web readiness claim without evidence

## Common failure modes
- claiming export succeeded without proof
- no compatibility caveats

## Evidence expectations
- artifact status per item
- assumption/caveat section
- next checks section

## Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
