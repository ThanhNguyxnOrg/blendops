# EVAL — environment-establishing-shot-planner

## Text-only eval prompt
Use environment-establishing-shot-planner on a brief: "cyberpunk city street at night, light rain, cinematic 2.39:1 mood".

## Expected behavior
- Locale + time of day + weather pinned
- Atmosphere + sky chosen
- Camera position + lens + altitude + tilt explicit
- FG / MG / BG composition layers explicit
- Focal subject named (or explicit "none")
- Asset list flagged
- Handoff named
- Honest evidence label

## Pass / Warn / Fail criteria
- Pass: all sections + plausible weather + focal subject + assets flagged
- Warn: locale broad / one section ambiguous
- Fail: contradictory time + weather, no depth layers, no focal subject

## Common failure modes
- "Beautiful weather" without specifics
- mixing portrait scope into establishing
- skipping atmospheric haze decision
- treating sky as afterthought

## Evidence expectations
- explicit time-of-day + weather + atmosphere
- depth layers separated
- handoff list

## Sample passing response outline
- Locale + time + weather header
- Atmosphere + sky line
- Camera row
- FG / MG / BG layers
- Focal subject
- Asset list
- Next: handoff named

## Sample failing response outline
- "Wide shot of a city"
- No time / weather
- No depth layers
