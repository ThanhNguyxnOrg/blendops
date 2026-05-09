# EVAL — recipe-fit-assessor

## Text-only eval prompt

User wants a cinematic interior dining room hero for a furniture brand website (still image + optional GLB spin). Assess recipe/pack fit.

## Expected behavior

- Recognize overlap with interior architectural planner + product-adjacent hero patterns
- Recommend `product-hero-v0` only if product-centric; else interior-focused workflow entry
- Partial fit notes if GLB spin is optional
- Hand off to `intent-to-3d-brief-writer`

## Pass / Warn / Fail criteria

- Pass: verdict + gaps + next skill + catalog citation
- Warn: vague deliverable type not clarified
- Fail: asserts a pack fits with contradictory constraints unstated

## Sample passing response outline

- Fit verdict
- Gap bullets
- Next skill

## Sample failing response outline

- "Use product hero" with no interior caveat
