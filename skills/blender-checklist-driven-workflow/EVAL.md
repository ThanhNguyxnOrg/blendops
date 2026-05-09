# EVAL — blender-checklist-driven-workflow

## Text-only eval prompt
Use blender-checklist-driven-workflow on the cyberpunk shoe hero recipe (7 stages).

## Expected behavior
- 7 stages listed in linear order
- Per-stage gate with 3-5 concrete acceptance criteria
- Evidence required per gate explicit
- Per-stage handoff to domain skill
- Current state explicit (`Pending` since text-only)
- "Failed gate stops work" rule stated
- Final handoff to pre-handoff-verification

## Pass / Warn / Fail criteria
- Pass: 7 stages + concrete gates + evidence required + handoff per stage + final pre-handoff named
- Warn: one gate vague, one stage missing evidence row
- Fail: vague gates throughout, skipped stages, parallel stages without justification

## Common failure modes
- "Stage looks good" gates
- Inventing criteria at gate time
- Marking Pass without evidence
- Skipping the final pre-handoff handoff

## Evidence expectations
- per-stage row with concrete checks
- per-stage handoff named
- failed-gate action stated

## Sample passing response outline
- Recipe header
- 7-row stage table
- Failed gate action
- Final handoff to pre-handoff-verification

## Sample failing response outline
- Vague "checklist" without per-stage rows
- "Looks good" gates
- No final handoff
