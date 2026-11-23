# blendops-scene-plan — EVAL

Behavioral evaluation prompts for `blendops-scene-plan`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-scene-plan`

### Text-only eval prompt
Use blendops-scene-plan on a hero close-up brief: stylized 30s tech founder, confident editorial mood, 16:9 web hero card.

### Expected behavior
- Subject section filled (identity / build / archetype / style)
- Pose / expression / gaze explicit
- Wardrobe + props listed
- Camera / framing / lens (50-85mm, eye-line upper third)
- Lighting plan (key / fill / rim + HDRI)
- Background + mood explicit
- Asset list flagged
- Handoff to discovery / composition / lighting / material / quality named
- Honest evidence label

### Pass / Warn / Fail criteria
- Pass: all sections + handoff + no "TBD"
- Warn: one section ambiguous
- Fail: framing impossible (e.g. 18mm tight close-up), missing lighting, no asset list

### Common failure modes
- inventing likeness without rights
- mixing multi-character scope
- skipping mood / style
- generating modeling instructions

### Evidence expectations
- explicit decisions per row
- asset list for discovery handoff
- evidence label honest (Not Run for text-only)

### Sample passing response outline
- Subject row + Pose row + Wardrobe row
- Camera / Lighting / Background / Mood rows
- Asset list
- Next: handoff named

### Sample failing response outline
- "Person looking at camera"
- No framing rules
- Verified without render

## From former `blendops-scene-plan`

### Text-only eval prompt
Use blendops-scene-plan on a brief: "cyberpunk city street at night, light rain, cinematic 2.39:1 mood".

### Expected behavior
- Locale + time of day + weather pinned
- Atmosphere + sky chosen
- Camera position + lens + altitude + tilt explicit
- FG / MG / BG composition layers explicit
- Focal subject named (or explicit "none")
- Asset list flagged
- Handoff named
- Honest evidence label

### Pass / Warn / Fail criteria
- Pass: all sections + plausible weather + focal subject + assets flagged
- Warn: locale broad / one section ambiguous
- Fail: contradictory time + weather, no depth layers, no focal subject

### Common failure modes
- "Beautiful weather" without specifics
- mixing portrait scope into establishing
- skipping atmospheric haze decision
- treating sky as afterthought

### Evidence expectations
- explicit time-of-day + weather + atmosphere
- depth layers separated
- handoff list

### Sample passing response outline
- Locale + time + weather header
- Atmosphere + sky line
- Camera row
- FG / MG / BG layers
- Focal subject
- Asset list
- Next: handoff named

### Sample failing response outline
- "Wide shot of a city"
- No time / weather
- No depth layers

## From former `blendops-scene-plan`

### Text-only eval prompt
Use blendops-scene-plan on a brief: "modern minimalist living room, 4x6m, afternoon natural light, 16:9 catalog hero".

### Expected behavior
- Room type / dims / style pinned
- Architecture basics (walls / floor / ceiling / windows)
- Furniture + props list
- Material palette (3-5 colors)
- Lighting plan (natural + artificial)
- Camera (lens + position + eye-line + target)
- Mood + time of day pinned
- Asset list flagged
- Handoff named

### Pass / Warn / Fail criteria
- Pass: full sections + plausible style consistency + assets flagged
- Warn: one section ambiguous
- Fail: style + furniture clash, impossible lens, missing lighting plan

### Common failure modes
- center-of-room camera (loses depth)
- mixed eras without intent
- skipping window light
- inventing dimensions

### Evidence expectations
- explicit dims + style + palette
- lighting plan natural + artificial
- camera position not center

### Sample passing response outline
- Room header
- Architecture / furniture / palette rows
- Lighting plan
- Camera row
- Mood + time row
- Asset list
- Next handoff named

### Sample failing response outline
- "Living room scene"
- No dims / style / lighting
