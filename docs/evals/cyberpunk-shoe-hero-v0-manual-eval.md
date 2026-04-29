# Eval: Cyberpunk Shoe Hero v0 Manual Eval

Status: Protocol / Not yet executed

## Purpose

Evaluate whether the v0 product hero pack helps an AI produce a useful Blender/web-3D output for a non-Blender user.

## Runtime paths under test

- Official Blender MCP Server
- Official Claude Blender Connector
- Official Blender CLI as reference only

## Source confidence

- Blender MCP page: linked-only unless verified locally
- Claude Blender Connector tutorial: verified-read if already verified by prior research
- Blender CLI docs: linked-only/reference if fetch blocked

## User prompt

“Create a cyberpunk shoe web hero with a floating shoe, neon lights, glossy dark floor, cinematic camera, export GLB, and give me web usage guidance.”

## Required BlendOps units

- laws/official-runtime-only
- laws/no-arbitrary-python-interface
- laws/evidence-before-done
- laws/non-blender-user-language
- skills/official-runtime-setup-guide
- skills/product-hero-scene-planner
- skills/blender-scene-quality-checker
- skills/glb-web-handoff
- skills/non-blender-user-response-writer
- workflow/product-hero-workflow
- recipe/cyberpunk-shoe-hero
- pack/v0-product-hero-pack

## Manual test procedure

1. Confirm official runtime setup path available.
2. Provide the user prompt to AI.
3. Require AI to produce scene/workflow plan first.
4. Require AI to state runtime assumptions.
5. If runtime is available, execute through official runtime.
6. Collect preview/export/artifact evidence if created.
7. Run quality checklist.
8. Run handoff checklist.
9. Produce final non-Blender-user response.
10. Record failure/caveat status.

## Evaluation rubric

Use pass/warn/fail for:
- official runtime boundary
- no arbitrary Python as final interface
- scene plan completeness
- composition quality
- lighting/material intent
- camera/framing
- validation quality
- GLB/web handoff clarity
- non-Blender-user language
- evidence-before-done compliance

## Evidence fields

- runtime path used
- prompt used
- scene plan output
- screenshots/previews if available
- GLB/export path if available
- validation notes
- final response
- blockers
- caveats

## Acceptance criteria

- AI produces plan before execution
- output stays official-runtime-only
- final answer avoids Blender jargon overload
- ready/done claims include evidence/caveats
- GLB/web handoff includes assumptions and limitations

## Failure modes

- AI jumps straight to execution
- AI claims output exists without artifact evidence
- AI uses non-official runtime references
- AI produces Blender jargon for non-Blender user
- AI ignores validation checklist
- AI claims web readiness without GLB/runtime caveats

## Result template

- Status: Not Run / Pass / Warn / Fail
- Runtime used:
- Evidence collected:
- Rubric results:
- Final verdict:
- Required changes to laws/skills/recipe:
