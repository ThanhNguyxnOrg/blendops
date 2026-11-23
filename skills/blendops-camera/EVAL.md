# blendops-camera — EVAL

Behavioral evaluation prompts for `blendops-camera`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-camera`

### Text-only eval prompt
Use blendops-camera to produce composition/camera plan for a product hero shot.

### Expected behavior
- focal hierarchy
- framing/aspect/negative-space strategy
- camera rationale in plain language

### Pass / Warn / Fail criteria
- Pass: complete blendops-camera strategy with rationale
- Warn: usable but partially justified plan
- Fail: vague camera advice and overclaims

### Common failure modes
- no focal hierarchy
- no web-copy space planning

### Evidence expectations
- explicit plan elements
- caveat notes for unverified visual outcomes

### Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

### Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action

## From former `blendops-camera`

### Text-only eval prompt
Use blendops-camera on a 16:9 product hero card camera plan. Subject right-third, 60% width, soft horizon.

### Expected behavior
- per-check rows (rule of thirds, subject placement, headroom, lead room, negative space, hierarchy, lens / FOV)
- aspect ratio + framing intent stated
- top-line status from rows
- worst-offender highlight
- evidence label honest

### Pass / Warn / Fail criteria
- Pass: full check rows + intent match + top-line correct
- Warn: rows present but ambiguity in headroom / negative space / hierarchy
- Fail: subject dead corner without justification, missing aspect ratio, fabricated values

### Common failure modes
- broad summary without per-check rows
- skipping aspect ratio
- mixing lighting / material checks
- claiming Verified without preview

### Evidence expectations
- per-check verdicts cited from rules
- aspect ratio stated
- intent match assessment

### Sample passing response outline
- Header: aspect + intent
- 7 check rows
- Top-line: Pass
- Next: handoff named

### Sample failing response outline
- "Composition looks great"
- No per-check data
- Verified without preview

## From former `blendops-camera`

### Text-only eval prompt
Apply blendops-camera for a web hero retina (16:9, 2880×1620, downscale to 1920×1080 + 960×540).

### Expected behavior
- aspect 16:9
- resolution 2880×1620
- downscale margin yes
- multi-resolution outputs listed
- caveats
- handoff to blendops-final-check

### Pass / Warn / Fail criteria
- Pass: aspect + resolution + DPI + downscale margin + caveats + handoff
- Warn: borderline resolution
- Fail: aspect mismatch, upscale plan, "1080p" without aspect

### Sample passing response outline
- Consumer + aspect + resolution + DPI rows
- Multi-resolution outputs
- Caveats

### Sample failing response outline
- "1080p"
- No aspect
