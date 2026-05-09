# EVAL — workflow-stage-router

## Text-only eval prompt

User has locked brief + composition plan text, no renders, no GLB, wants to proceed to lighting. Route next skill.

## Expected behavior

- Stage = planning / lookdev boundary
- Next = `blender-lighting-material-planner` after confirming composition plan consumed
- Note readiness if runtime mutation next

## Pass / Warn / Fail criteria

- Pass: one primary next skill + preconditions
- Warn: parallel optional validators listed as secondary
- Fail: jumps to export evidence without render plan

## Sample passing response outline

- Stage + next + 3 preconditions

## Sample failing response outline

- "Start rendering now" with no engine decision
