# Reference: Eval Protocol

Status: Draft v0 reference

## Eval modes

1. Text-only eval
   - no runtime execution
   - no runtime artifact claims

2. Runtime eval
   - requires runtime path evidence
   - requires artifact status with evidence/caveats

## Required evidence fields

- runtime path used
- prompt used
- source confidence labels
- scene/plan output
- artifact status (preview/render/GLB)
- validation notes
- blockers
- caveats

## Rubric model

Use pass/warn/fail for:
- official-runtime-only compliance
- no arbitrary Python final interface
- evidence-before-done compliance
- non-Blender-user language
- planning/quality/handoff clarity

## Anti-fake rule

Never claim artifact success or runtime execution without concrete evidence.
