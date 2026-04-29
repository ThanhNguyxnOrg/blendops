---
name: blender-lighting-material-planner
description: Plan lighting and material direction with portability and web-handoff caveats.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# blender-lighting-material-planner

## Purpose
Provide focused lighting/material planning for product-hero outcomes.

## When to use
- look-dev intent needs structure
- reflective/neon style planning required

## When not to use
- as evidence of runtime visual output
- to bypass quality gate checks

## Inputs
- style intent
- subject material hints
- handoff target context

## Outputs
- key/fill/rim lighting logic
- material direction and caveats
- PBR portability notes
- web export caveat assumptions

## Required laws
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Planning and caveat guidance only; no runtime execution claims.

## Workflow steps
1. Define lighting intent (key/fill/rim).
2. Define material intent and constraints.
3. Add portability caveats for web handoff.
4. Present plain-language implications.

## Validation checklist
- [ ] lighting logic documented
- [ ] material assumptions documented
- [ ] portability caveats documented
- [ ] no evidence overclaims

## Failure handling
If material or lighting assumptions are uncertain, mark as unverified and provide next validation step.

## User-facing response template
- Lighting direction
- Material direction
- Web portability caveats
- Next validation step

## Non-goals
- shader/runtime implementation code
- artifact success claims without evidence

## References
- ../../skills/glb-web-handoff/SKILL.md
