---
name: glb-web-handoff
description: Define GLB/web handoff expectations with explicit artifact status and caveats.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# glb-web-handoff

## Purpose
Provide clear GLB/web handoff status language and assumptions.

## When to use
- before declaring handoff ready
- when summarizing export/web status

## When not to use
- to claim GLB exists without evidence
- to replace runtime verification steps

## Inputs
- artifact evidence state
- compatibility assumptions
- quality findings

## Outputs
- artifact status list
- web handoff assumptions
- caveat summary
- next checks

## Required laws
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
No runtime execution claims unless evidence is present.

## Workflow steps
1. List expected handoff artifacts.
2. Mark each artifact status.
3. Document compatibility assumptions/caveats.
4. Provide next verification actions.

## Validation checklist
- [ ] GLB status explicit
- [ ] preview status explicit
- [ ] caveats explicit
- [ ] no unsupported success claims

## Failure handling
If evidence is missing or runtime not run:
- mark Not Run/Not Produced
- avoid runtime success language
- provide next test path

## User-facing response template
- What is included now
- What is not verified yet
- What to test next

## Non-goals
- framework runtime code
- artifact fabrication

## References
- ../../references/web-3d-handoff.md
