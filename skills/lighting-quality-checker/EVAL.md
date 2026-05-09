# EVAL — lighting-quality-checker

## Text-only eval prompt
Use lighting-quality-checker on a product-hero scene plan with HDRI + 3-point lighting (key / fill / rim). Mood: soft hero.

## Expected behavior
- per-light rows (4: HDRI + key + fill + rim) with intensity, color, soft size, verdict
- mood match assessment
- top-line status from rows
- worst-offender highlight
- consumer target stated
- evidence label honest

## Pass / Warn / Fail criteria
- Pass: full rows + mood match + top-line consistent + no fabricated values
- Warn: rows present but intensity / mood / HDRI balance ambiguous
- Fail: mood mismatch undetected, fabricated values, edits attempted

## Common failure modes
- broad summary without per-light rows
- ignoring HDRI + explicit-light balance
- skipping mood match
- claiming Verified without reference image

## Evidence expectations
- per-light verdicts with rule citations
- HDRI strength noted
- Kelvin or RGB color mode consistent or annotated

## Sample passing response outline
- Header: consumer + mood
- 4 light rows
- HDRI line
- Mood match
- Top-line
- Next handoff

## Sample failing response outline
- "Lighting looks great"
- No per-light data
- Verified without measurement
