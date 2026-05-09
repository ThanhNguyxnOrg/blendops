# EVAL — asset-style-consistency-checker

## Text-only eval prompt
Apply asset-style-consistency-checker on a 4-asset list (3 realistic PBR + 1 stylized cartoon) for an all-realistic product hero brief.

## Expected behavior
- per-asset 4-axis (realism / detail / color / surface) rows
- drift verdict per row
- top-line: Fail (1 stylized in all-realistic brief)
- remediation: replace or restyle the stylized asset
- handoff to fallback strategy

## Pass / Warn / Fail criteria
- Pass: 4 rows + brief reference + verdicts + remediation
- Warn: rows present but axis values guessed
- Fail: "vibe" verdicts, no axis-by-axis evaluation

## Sample passing response outline
- Brief style line
- 4 rows
- Top-line + remediation list
- Next handoff

## Sample failing response outline
- "Looks fine"
- No axis evaluation
