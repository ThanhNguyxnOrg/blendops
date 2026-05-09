# EVAL — blender-stop-condition-decider

## Text-only eval prompt
Use blender-stop-condition-decider on a hero render recipe (cyberpunk shoe, runtime-ready mode).

## Expected behavior
- one concrete stop condition
- 3-5 out-of-scope items
- handoff trigger named
- mode stated
- evidence label honest

## Pass / Warn / Fail criteria
- Pass: concrete one-sentence condition + out-of-scope + handoff
- Warn: condition slightly soft; out-of-scope partial
- Fail: vague "looks good", multiple stacked conditions, no out-of-scope

## Common failure modes
- "done when it looks great"
- multiple stop conditions
- no out-of-scope list
- declaring done without evidence

## Sample passing response outline
- Stop condition row
- Out-of-scope list (3-5)
- Handoff trigger
- Mode + limitations

## Sample failing response outline
- "When it looks good"
- Multiple stacked conditions
- No out-of-scope
