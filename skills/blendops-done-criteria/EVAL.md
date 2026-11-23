# blendops-done-criteria — EVAL

Behavioral evaluation prompts for `blendops-done-criteria`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-done-criteria`

### Text-only eval prompt

User picked `product-hero-v0`, brief has mood + product silhouette but no asset strategy, no runtime path stated, wants GLB for web.

### Expected behavior

- Flag asset strategy + web handoff skills as needed inputs
- Runtime row = Needs input until path chosen
- Warn if GLB web targets unstated (mobile tier)
- Hand off to `blendops-assets` or `blendops-connect-blender`

### Pass / Warn / Fail criteria

- Pass: matrix + go/no-go + owner actions
- Warn: accepted gaps documented
- Fail: declares go with missing critical brief fields

### Sample passing response outline

- Table + no-go with three owner actions

### Sample failing response outline

- "Ready to model" with no asset plan

## From former `blendops-done-criteria`

### Text-only eval prompt
Use blendops-done-criteria on a hero render recipe (cyberpunk shoe, runtime-ready mode).

### Expected behavior
- one concrete stop condition
- 3-5 out-of-scope items
- handoff trigger named
- mode stated
- evidence label honest

### Pass / Warn / Fail criteria
- Pass: concrete one-sentence condition + out-of-scope + handoff
- Warn: condition slightly soft; out-of-scope partial
- Fail: vague "looks good", multiple stacked conditions, no out-of-scope

### Common failure modes
- "done when it looks great"
- multiple stop conditions
- no out-of-scope list
- declaring done without evidence

### Sample passing response outline
- Stop condition row
- Out-of-scope list (3-5)
- Handoff trigger
- Mode + limitations

### Sample failing response outline
- "When it looks good"
- Multiple stacked conditions
- No out-of-scope

## From former `blendops-done-criteria`

### Text-only eval prompt
Use blendops-done-criteria on the cyberpunk shoe hero recipe (7 stages).

### Expected behavior
- 7 stages listed in linear order
- Per-stage gate with 3-5 concrete acceptance criteria
- Evidence required per gate explicit
- Per-stage handoff to domain skill
- Current state explicit (`Pending` since text-only)
- "Failed gate stops work" rule stated
- Final handoff to blendops-final-check

### Pass / Warn / Fail criteria
- Pass: 7 stages + concrete gates + evidence required + handoff per stage + final pre-handoff named
- Warn: one gate vague, one stage missing evidence row
- Fail: vague gates throughout, skipped stages, parallel stages without justification

### Common failure modes
- "Stage looks good" gates
- Inventing criteria at gate time
- Marking Pass without evidence
- Skipping the final pre-handoff handoff

### Evidence expectations
- per-stage row with concrete checks
- per-stage handoff named
- failed-gate action stated

### Sample passing response outline
- Recipe header
- 7-row stage table
- Failed gate action
- Final handoff to blendops-final-check

### Sample failing response outline
- Vague "checklist" without per-stage rows
- "Looks good" gates
- No final handoff

## From former `blendops-done-criteria`

### Text-only eval prompt

Brief: hero sneaker, cyberpunk neon, wet pavement reflection, deliver web GLB + hero PNG 2K. Build acceptance checklist.

### Expected behavior

- Rows for silhouette readability, reflection intensity bounds, GLB size tier, PNG transparency need
- Evidence hooks → blendops-final-check + blendops-glb-web-handoff paths
- Subjective "cyberpunk feel" flagged subjective with stakeholder sign-off

### Pass / Warn / Fail criteria

- Pass: P0 measurable + hooks
- Warn: too many subjective rows
- Fail: promises Verified without evidence path

### Sample passing response outline

- Table + subjective flags

### Sample failing response outline

- "Looks amazing" as only criterion

## From former `blendops-done-criteria`

### Text-only eval prompt
Mid-recipe (single hero render in progress), user says "can you also do 4 color variants?". Apply blendops-done-criteria.

### Expected behavior
- addition named explicitly
- 3 options (decline / add-now / defer) presented
- recommendation given (typically defer for substantive addition)
- decision required before continuing
- stop condition / gate update note if added

### Pass / Warn / Fail criteria
- Pass: addition named + 3 options + recommendation + decision required + update path documented
- Warn: options partial (only 2) or rationale partial
- Fail: silent absorption, no defer option, no decision required

### Common failure modes
- "Sure, I'll do both"
- skipping the defer option
- not updating stop condition

### Sample passing response outline
- Addition named
- Original scope reminder
- 3 options
- Recommendation
- "Decision needed" line

### Sample failing response outline
- "Yes I'll add that"
- No options offered
- No agreement evidence
