# EVAL — character-portrait-scene-planner

## Text-only eval prompt
Use character-portrait-scene-planner on a hero close-up brief: stylized 30s tech founder, confident editorial mood, 16:9 web hero card.

## Expected behavior
- Subject section filled (identity / build / archetype / style)
- Pose / expression / gaze explicit
- Wardrobe + props listed
- Camera / framing / lens (50-85mm, eye-line upper third)
- Lighting plan (key / fill / rim + HDRI)
- Background + mood explicit
- Asset list flagged
- Handoff to discovery / composition / lighting / material / quality named
- Honest evidence label

## Pass / Warn / Fail criteria
- Pass: all sections + handoff + no "TBD"
- Warn: one section ambiguous
- Fail: framing impossible (e.g. 18mm tight close-up), missing lighting, no asset list

## Common failure modes
- inventing likeness without rights
- mixing multi-character scope
- skipping mood / style
- generating modeling instructions

## Evidence expectations
- explicit decisions per row
- asset list for discovery handoff
- evidence label honest (Not Run for text-only)

## Sample passing response outline
- Subject row + Pose row + Wardrobe row
- Camera / Lighting / Background / Mood rows
- Asset list
- Next: handoff named

## Sample failing response outline
- "Person looking at camera"
- No framing rules
- Verified without render
