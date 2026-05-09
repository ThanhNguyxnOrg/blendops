# EVAL — glb-mobile-performance-budget

## Text-only eval prompt
Use glb-mobile-performance-budget to set a planning budget for a "make this work on mobile web" GLB intent.

## Expected behavior
- explicit device tier, scope, and target context chosen
- numeric budget table covering triangles, vertices, GLB file size, texture pixel budget, materials, draw calls, animation channels, bones, morph targets
- violation rule list
- degradation plan
- compliance label `Not Run` (planning only, no measurement)
- handoff to next skill named

## Pass / Warn / Fail criteria
- Pass: full numeric budget + tier + violations + degradation + Not Run label
- Warn: budget present but tier or scope ambiguous; degradation partial
- Fail: "will run on mobile" claim with no numbers, OR treating budget as a benchmark, OR claiming compliance without measurement

## Common failure modes
- giving only triangle count, no texture or file size budget
- promising performance without measurement
- mixing device tiers without picking one
- omitting AR-specific stricter caps when AR context is present

## Evidence expectations
- numeric values for every budget row
- assumption section about FOV, network, and headroom
- explicit handoff target

## Sample passing response outline
- Device tier + scope + context stated
- Budget table with concrete numbers per row
- Violations would block handoff: yes
- Degradation order listed
- Compliance: Not Run

## Sample failing response outline
- "Should be fine on iPhone X" without numbers
- Triangle cap given without texture / file-size companions
- Compliance claimed without runtime measurement
