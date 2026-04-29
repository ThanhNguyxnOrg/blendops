# EVAL — blender-lighting-material-planner

## Text-only eval prompt
Use blender-lighting-material-planner to produce detailed lighting/material plan with web portability caveats.

## Expected behavior
- key/fill/rim logic
- style-specific notes
- PBR/web portability caveats

## Pass / Warn / Fail criteria
- Pass: complete lookdev plan + caveats
- Warn: plan usable but caveats shallow
- Fail: overclaim visual output or no portability logic

## Common failure modes
- generic “make it cinematic” language only
- no web constraints

## Evidence expectations
- structured lookdev plan
- explicit uncertainty markers

## Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
