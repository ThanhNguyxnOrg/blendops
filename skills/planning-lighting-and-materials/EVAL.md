# planning-lighting-and-materials — EVAL

Behavioral evaluation prompts for `planning-lighting-and-materials`. Sections below come from the skills merged into it in v2.0.0.

## From former `planning-lighting-and-materials`

### Text-only eval prompt
Use planning-lighting-and-materials to produce detailed lighting/material plan with web portability caveats.

### Expected behavior
- key/fill/rim logic
- style-specific notes
- PBR/web portability caveats

### Pass / Warn / Fail criteria
- Pass: complete lookdev plan + caveats
- Warn: plan usable but caveats shallow
- Fail: overclaim visual output or no portability logic

### Common failure modes
- generic “make it cinematic” language only
- no web constraints

### Evidence expectations
- structured lookdev plan
- explicit uncertainty markers

### Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

### Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action

## From former `planning-lighting-and-materials`

### Text-only eval prompt
Use planning-lighting-and-materials on a product-hero scene plan with HDRI + 3-point lighting (key / fill / rim). Mood: soft hero.

### Expected behavior
- per-light rows (4: HDRI + key + fill + rim) with intensity, color, soft size, verdict
- mood match assessment
- top-line status from rows
- worst-offender highlight
- consumer target stated
- evidence label honest

### Pass / Warn / Fail criteria
- Pass: full rows + mood match + top-line consistent + no fabricated values
- Warn: rows present but intensity / mood / HDRI balance ambiguous
- Fail: mood mismatch undetected, fabricated values, edits attempted

### Common failure modes
- broad summary without per-light rows
- ignoring HDRI + explicit-light balance
- skipping mood match
- claiming Verified without reference image

### Evidence expectations
- per-light verdicts with rule citations
- HDRI strength noted
- Kelvin or RGB color mode consistent or annotated

### Sample passing response outline
- Header: consumer + mood
- 4 light rows
- HDRI line
- Mood match
- Top-line
- Next handoff

### Sample failing response outline
- "Lighting looks great"
- No per-light data
- Verified without measurement

## From former `planning-lighting-and-materials`

### Text-only eval prompt
Use planning-lighting-and-materials on a glTF-mobile scene plan with 5 PBR materials and a 4 MP total texture budget.

### Expected behavior
- per-material rows (5) with name, type, albedo, normal, roughness/metallic, texture count + resolution, consumer compatibility, verdict, notes
- top-line status derived from rows
- worst-offender highlight
- consumer target stated explicitly
- evidence label honest (Not Run for text-only)
- handoff named

### Pass / Warn / Fail criteria
- Pass: every row filled with explicit values; top-line correct; no fabricated row
- Warn: rows mostly filled but one column missing or one verdict ambiguous
- Fail: marks "Pass" without rule citations, fabricates values, performs material edits, or skips consumer-stack check

### Common failure modes
- broad summary without per-material rows
- claiming Verified without measurement
- mixing lighting / composition checks
- skipping consumer compatibility column

### Evidence expectations
- per-row PBR sanity verdicts cited from rules
- texture budget compared to pinned cap
- consumer target named

### Sample passing response outline
- Consumer target + texture budget cap header
- 5 material rows
- Top-line: derived from rows
- Worst offenders: 1-2 named
- Next: verifying-before-handoff / verifying-before-handoff

### Sample failing response outline
- "Materials look good"
- No per-row analysis
- Verified label without measurement

## From former `planning-lighting-and-materials`

### Text-only eval prompt
Apply planning-lighting-and-materials for a web hero PNG output, sRGB consumer pipeline.

### Expected behavior
- Display Device: sRGB
- View Transform: Filmic (or Standard for pure flat color)
- Look: None or Medium High Contrast
- Sequencer: sRGB
- Output rule: PNG 8-bit sRGB
- Caveats: per-channel texture rules (color sRGB, data Linear)
- handoff: verifying-before-handoff

### Pass / Warn / Fail criteria
- Pass: 4-line config + per-output + caveats + handoff
- Warn: config pinned but caveat thin
- Fail: wrong pipeline match, "looks good" verdict, skipped per-channel rules

### Sample passing response outline
- Consumer pipeline + outputs header
- 4-line config
- Per-output rules
- Caveats list

### Sample failing response outline
- "Use Filmic"
- No pipeline context
