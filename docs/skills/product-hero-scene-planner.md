# Skill: product-hero-scene-planner

Status: Draft v0

## Purpose

Turn non-Blender user creative intent into a structured product-hero scene plan.

## When to use

- user requests a hero scene concept
- workflow needs structured planning before runtime execution

## Inputs

- user prompt
- output target (web/app/game/render)
- style and performance constraints

## Outputs

- intent summary
- composition/lighting/material/camera plan
- validation checkpoints
- assumptions and caveat list

## Official runtime assumptions

- Runtime execution is external.
- Preferred runtime references:
  - https://www.blender.org/lab/mcp-server/
  - https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
  - https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Workflow steps

1. Normalize user intent into objective statements.
2. Ask only critical clarification questions.
3. Build composition plan (subject hierarchy, framing, background intent).
4. Build lighting/material/camera plan.
5. Add export/handoff expectations.
6. Attach validation gates and caveat expectations.

## Safety rules

- Must keep language non-Blender-user friendly.
- Must not claim runtime success at planning stage.
- Must disclose assumptions explicitly.

## Validation checklist

- [ ] Intent summary complete
- [ ] Scene plan has composition/lighting/material/camera
- [ ] Validation gates defined
- [ ] Caveats captured

## Failure handling

If prompt is ambiguous:
- ask targeted questions,
- or proceed with explicit assumptions and reduced confidence.

## User-facing response template

- What you asked for
- Proposed scene intent
- Proposed visual plan
- What will be validated later
- Known assumptions/caveats

## Examples

- “Floating sneaker hero, neon rim lights, glossy dark floor, cinematic 3/4 camera angle, GLB handoff expected.”

## Non-goals

- no runtime commands
- no raw Blender internal instructions as final output

## Verification

- Plan includes all required sections
- Assumptions and caveats are explicit
- Output is understandable for non-Blender users
