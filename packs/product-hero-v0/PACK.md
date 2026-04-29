# PACK: product-hero-v0

Status: Draft v0
Version: 0.1.0-draft

## Pack name
- product-hero-v0

## Included laws
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md

## Included skills
- ../../skills/official-runtime-setup-guide/SKILL.md — expanded Draft v0
- ../../skills/official-runtime-readiness-checker/SKILL.md — expanded Draft v0
- ../../skills/product-hero-scene-planner/SKILL.md — expanded Draft v0
- ../../skills/blender-composition-camera-planner/SKILL.md — expanded Draft v0
- ../../skills/blender-lighting-material-planner/SKILL.md — expanded Draft v0
- ../../skills/blender-scene-quality-checker/SKILL.md — expanded Draft v0
- ../../skills/glb-web-handoff/SKILL.md — expanded Draft v0
- ../../skills/non-blender-user-response-writer/SKILL.md — expanded Draft v0

## Intended workflow

Compose the included skills to plan, validate, and communicate product-hero Blender/web-3D outcomes under official-runtime-only boundaries.

## Recipe scenario

- Cyberpunk shoe hero planning and handoff

## Activation prompts

- “Use the product-hero-v0 pack to plan a cyberpunk shoe web hero. Do not run Blender unless official runtime is available.”

## Required review gates

This pack expects skills to pass:
- Gate 0–8 in `skill-reviews/review-gates.md`

## Eval expectations

- each included skill has `EVAL.md`
- text-only eval should pass baseline checks
- runtime blockers must be recordable without overclaims

## Release readiness checklist

- [ ] all included skills pass review gates or have explicit warnings
- [ ] no non-official runtime setup references
- [ ] no artifact overclaims without evidence
- [ ] install dry-run in disposable fixture succeeds
- [ ] rollback instructions validated
- [ ] runtime eval findings integrated

## Non-goals

- no runtime installation
- no runtime execution guarantees
- no custom CLI/MCP/addon runtime ownership

## Verification expectations

- law compliance across all outputs
- evidence-before-done behavior enforced
- artifact status language present (`Produced`, `Not Produced`, `Not Run`)
- non-Blender-user language quality preserved

## Promotion criteria

Promote from draft only when release readiness checklist is complete and evaluation evidence is recorded.
