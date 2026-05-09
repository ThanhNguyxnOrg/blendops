# EVAL — blender-recipe-decomposer

## Text-only eval prompt
User intent: "I need a hero render of the shoe + 4 color variants + a 3-second orbit animation for the web". Apply blender-recipe-decomposer.

## Expected behavior
- 3 recipes named (hero render / variants grid / orbit animation)
- Brief seed + stop condition per recipe
- Order + dependencies explicit (variants and animation depend on hero scene)
- Shared assets identified
- Start recipe recommended
- Each recipe hands off to intent-to-3d-brief-writer

## Pass / Warn / Fail criteria
- Pass: 3 cohesive recipes + names + briefs + stops + order + dependencies + shared assets
- Warn: stop conditions soft or dependencies unclear
- Fail: one mega-recipe; over-split (5+ fragments); missing stops

## Common failure modes
- single mega-recipe
- recipe overlap in scope
- skipping dependency analysis
- naming recipes by process not deliverable

## Sample passing response outline
- User intent + deliverable enumeration
- 3-row recipe table
- Shared assets list
- Recommended start
- Handoff to intent-to-3d-brief-writer

## Sample failing response outline
- "Do all in one go"
- No stop conditions
- No dependencies
