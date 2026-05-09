# EVAL — material-quality-checker

## Text-only eval prompt
Use material-quality-checker on a glTF-mobile scene plan with 5 PBR materials and a 4 MP total texture budget.

## Expected behavior
- per-material rows (5) with name, type, albedo, normal, roughness/metallic, texture count + resolution, consumer compatibility, verdict, notes
- top-line status derived from rows
- worst-offender highlight
- consumer target stated explicitly
- evidence label honest (Not Run for text-only)
- handoff named

## Pass / Warn / Fail criteria
- Pass: every row filled with explicit values; top-line correct; no fabricated row
- Warn: rows mostly filled but one column missing or one verdict ambiguous
- Fail: marks "Pass" without rule citations, fabricates values, performs material edits, or skips consumer-stack check

## Common failure modes
- broad summary without per-material rows
- claiming Verified without measurement
- mixing lighting / composition checks
- skipping consumer compatibility column

## Evidence expectations
- per-row PBR sanity verdicts cited from rules
- texture budget compared to pinned cap
- consumer target named

## Sample passing response outline
- Consumer target + texture budget cap header
- 5 material rows
- Top-line: derived from rows
- Worst offenders: 1-2 named
- Next: blender-scene-quality-checker / render-export-evidence

## Sample failing response outline
- "Materials look good"
- No per-row analysis
- Verified label without measurement
