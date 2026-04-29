---
name: blender-composition-camera-planner
description: Plan composition and camera direction for Blender hero scenes in plain language.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# blender-composition-camera-planner

## Purpose
Provide focused composition and camera planning guidance.

## When to use
- composition/camera quality needs detail
- framing decisions are unclear

## When not to use
- as a runtime execution step
- to claim render output quality without evidence

## Inputs
- prompt intent
- target viewport/aspect context
- subject constraints

## Outputs
- focal hierarchy
- framing strategy
- aspect ratio guidance
- camera angle/depth/negative-space plan

## Required laws
- ../../laws/non-blender-user-language.md
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
No runtime execution. Planning guidance only.

## Workflow steps
1. Define focal hierarchy.
2. Select framing approach.
3. Plan camera angle/depth.
4. Translate decisions into non-technical language.

## Validation checklist
- [ ] focal hierarchy explicit
- [ ] framing/aspect decisions explicit
- [ ] camera rationale clear
- [ ] user-facing language non-jargon

## Failure handling
If scene constraints conflict, surface trade-offs and request priority decisions.

## User-facing response template
- Focal intent
- Camera/framing choices
- Why this supports user goal
- Caveats and next checks

## Non-goals
- runtime camera command execution
- render claim without evidence

## References
- ../../recipes/cyberpunk-shoe-hero.md
