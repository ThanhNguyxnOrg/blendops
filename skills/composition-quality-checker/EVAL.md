# EVAL — composition-quality-checker

## Text-only eval prompt
Use composition-quality-checker on a 16:9 product hero card camera plan. Subject right-third, 60% width, soft horizon.

## Expected behavior
- per-check rows (rule of thirds, subject placement, headroom, lead room, negative space, hierarchy, lens / FOV)
- aspect ratio + framing intent stated
- top-line status from rows
- worst-offender highlight
- evidence label honest

## Pass / Warn / Fail criteria
- Pass: full check rows + intent match + top-line correct
- Warn: rows present but ambiguity in headroom / negative space / hierarchy
- Fail: subject dead corner without justification, missing aspect ratio, fabricated values

## Common failure modes
- broad summary without per-check rows
- skipping aspect ratio
- mixing lighting / material checks
- claiming Verified without preview

## Evidence expectations
- per-check verdicts cited from rules
- aspect ratio stated
- intent match assessment

## Sample passing response outline
- Header: aspect + intent
- 7 check rows
- Top-line: Pass
- Next: handoff named

## Sample failing response outline
- "Composition looks great"
- No per-check data
- Verified without preview
