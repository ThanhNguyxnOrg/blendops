# PACK: product-hero-v0

Status: Draft v0
Version: 0.1.0-draft

## Pack name

- `product-hero-v0`

## Included laws

- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md

## Included skills

- ../../skills/official-runtime-setup-guide/SKILL.md
- ../../skills/official-runtime-readiness-checker/SKILL.md
- ../../skills/product-hero-scene-planner/SKILL.md
- ../../skills/blender-composition-camera-planner/SKILL.md
- ../../skills/blender-lighting-material-planner/SKILL.md
- ../../skills/blender-scene-quality-checker/SKILL.md
- ../../skills/glb-web-handoff/SKILL.md
- ../../skills/non-blender-user-response-writer/SKILL.md

## Intended workflow

Use composition of the above skills to execute product-hero planning, validation, and handoff communication.

## Recipe scenario

- Cyberpunk shoe hero planning and handoff

## Activation prompts

- “Use the product-hero-v0 pack to plan a cyberpunk shoe web hero. Do not run Blender unless runtime is explicitly available.”

## Non-goals

- no runtime installation
- no runtime execution guarantees
- no custom CLI/MCP/addon runtime ownership

## Verification expectations

- law compliance across all outputs
- evidence-before-done behavior enforced
- artifact status language present (`Produced`, `Not Produced`, `Not Run`)

## Promotion criteria

- text-only and runtime eval gates complete with evidence
- install dry-run succeeds in disposable fixture project
- rollback instructions validated
- docs and root collection files remain aligned
