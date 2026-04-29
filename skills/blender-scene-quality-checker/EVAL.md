# EVAL — blender-scene-quality-checker

## Text-only eval prompt
Use blender-scene-quality-checker to score a planned hero scene with pass/warn/fail and final verdict.

## Expected behavior
- category rubric
- blockers/caveats
- verdict: Ready/Conditionally Ready/Not Ready/Not Run

## Pass / Warn / Fail criteria
- Pass: full rubric + evidence-aligned verdict
- Warn: partial rubric with explicit caveat
- Fail: verdict without rubric/evidence

## Common failure modes
- claiming Ready without artifacts
- missing blocker explanation

## Evidence expectations
- mode label
- artifact status language
- rationale for verdict

## Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
