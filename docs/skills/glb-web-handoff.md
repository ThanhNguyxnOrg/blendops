# Skill: glb-web-handoff

Status: Draft v0

## Purpose

Define Blender → GLB → web handoff expectations for Three.js / React Three Fiber consumers.

## When to use

- user requests GLB export handoff
- workflow reaches export/readiness phase

## Inputs

- intended runtime target
- export assumptions
- quality-check output

## Outputs

- handoff checklist
- runtime compatibility notes
- known risks and caveats
- final handoff recommendation

## Official runtime assumptions

- Official runtime setup is external and verified separately.
- Handoff expectations align to official reference docs and validated runtime behavior.

## Workflow steps

1. Validate transform/scale/origin assumptions.
2. Validate material/texture and color-space expectations.
3. Validate naming/structure and compatibility assumptions.
4. Record performance and loader caveats.
5. Produce handoff report with readiness status.

## Safety rules

- Must distinguish standards requirements vs best-practice guidance.
- Must not claim web compatibility without evidence.
- Must include unresolved risk notes.

## Validation checklist

- [ ] Export readiness checks complete
- [ ] Runtime assumptions documented
- [ ] Web compatibility caveats documented
- [ ] Final status supported by evidence

## Failure handling

If compatibility evidence is missing:
- downgrade status,
- list missing checks,
- provide next verification actions.

If this is a text-only dry eval:
- mark artifact status as `Not Run`,
- avoid runtime success claims,
- and keep handoff language in planning mode.

## User-facing response template

- Handoff status
- What is included
- What is uncertain
- What to test next in web runtime

## Examples

- “GLB produced; runtime decoder assumptions documented; final status Conditionally Ready pending in-app loader test.”

## Non-goals

- no runtime implementation code
- no framework-specific code generation in this skill

## Verification

- Handoff report includes evidence, caveats, and next-step tests
