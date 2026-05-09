# EVAL — asset-license-checker

## Text-only eval prompt
Apply asset-license-checker on a 4-asset list (1 CC0 HDRI from polyhaven, 1 MIT model from sketchfab, 1 unknown texture, 1 paid commercial license model). Intended use: commercial brand campaign.

## Expected behavior
- 4-row asset table with source / license / permissions / verdict
- attribution lines listed
- assets to remove flagged (the unknown one as Fail)
- top-line status
- "not legal advice" caveat

## Pass / Warn / Fail criteria
- Pass: 4 rows + verdicts + attribution + caveat
- Warn: rows present but attribution incomplete
- Fail: marks "should be fine" verdicts, fabricates license terms

## Common failure modes
- "Should be fine" verdicts
- skipping attribution plan
- inventing license terms
- treating "all rights reserved" as usable

## Sample passing response outline
- Header: intended use + attribution policy
- 4 rows + verdicts
- Attribution list
- Assets to remove
- Top-line + caveat

## Sample failing response outline
- "Looks OK to use"
- No license terms cited
