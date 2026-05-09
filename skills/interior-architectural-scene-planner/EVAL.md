# EVAL — interior-architectural-scene-planner

## Text-only eval prompt
Use interior-architectural-scene-planner on a brief: "modern minimalist living room, 4x6m, afternoon natural light, 16:9 catalog hero".

## Expected behavior
- Room type / dims / style pinned
- Architecture basics (walls / floor / ceiling / windows)
- Furniture + props list
- Material palette (3-5 colors)
- Lighting plan (natural + artificial)
- Camera (lens + position + eye-line + target)
- Mood + time of day pinned
- Asset list flagged
- Handoff named

## Pass / Warn / Fail criteria
- Pass: full sections + plausible style consistency + assets flagged
- Warn: one section ambiguous
- Fail: style + furniture clash, impossible lens, missing lighting plan

## Common failure modes
- center-of-room camera (loses depth)
- mixed eras without intent
- skipping window light
- inventing dimensions

## Evidence expectations
- explicit dims + style + palette
- lighting plan natural + artificial
- camera position not center

## Sample passing response outline
- Room header
- Architecture / furniture / palette rows
- Lighting plan
- Camera row
- Mood + time row
- Asset list
- Next handoff named

## Sample failing response outline
- "Living room scene"
- No dims / style / lighting
