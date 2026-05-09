# EVAL — polycount-budget-checker

## Text-only eval prompt
Use polycount-budget-checker on a mid-mobile product hero scene (total cap 50K) with 4 meshes: shoe-upper 18K, sole 8K, laces 5K, ground-shadow 1K.

## Expected behavior
- pinned budget header (50K total + per-mesh cap)
- per-mesh rows with triangle count + % of total + verdict + hint
- worst-offender highlight (shoe-upper at 18K = 36% of total)
- total: 32K of 50K (64%)
- top-line: Pass (within budget, no single dominator)
- evidence label honest

## Pass / Warn / Fail criteria
- Pass: full per-mesh data + correct totals + top-line consistent
- Warn: rows present but missing per-mesh cap comparison or hint advisory missing
- Fail: invents counts, claims compliance without numbers, decimates inside the skill

## Common failure modes
- broad summary without per-mesh rows
- skipping per-mesh cap comparison
- mixing other quality checks
- claiming Verified without measurement

## Evidence expectations
- triangle counts cited
- per-mesh + total cap headers
- hints labeled advisory

## Sample passing response outline
- Header: pinned budget
- 4 mesh rows
- Total + worst offender
- Top-line: Pass
- Next: handoff named

## Sample failing response outline
- "Polycount fine"
- No row data
- Verified without measurement
