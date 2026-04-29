# Skill: blender-scene-quality-checker

Status: Draft v0

## Purpose

Evaluate scene readiness using pass/warn/fail quality gates.

## When to use

- before export/handoff
- after major scene changes
- before declaring output ready

## Inputs

- planned intent criteria
- available preview/render evidence
- scene metadata (if available)

## Outputs

- category-level checklist results
- overall status (Ready / Conditionally Ready / Not Ready)
- blocking issues and recommended fixes

## Official runtime assumptions

- Runtime evidence may come from official runtime paths.
- This skill validates outcomes, not runtime ownership.

## Workflow steps

1. Compare scene evidence against intended output criteria.
2. Run checklist categories (subject, composition, scale, camera, lighting, materials, export, web readiness).
3. Mark pass/warn/fail with rationale.
4. Summarize blockers and next steps.

## Safety rules

- Must not mark Ready without evidence.
- Must not hide blockers.
- Must disclose uncertainty if evidence is incomplete.

## Validation checklist

- [ ] All quality categories evaluated
- [ ] Status taxonomy used correctly
- [ ] Blocking issues clearly listed
- [ ] Caveats include impact and next step

## Failure handling

If evidence is incomplete:
- mark Conditionally Ready or Not Ready,
- state what evidence is missing,
- provide concrete follow-up checks.

## User-facing response template

- Current readiness status
- What passed
- What needs attention
- What to do next

## Examples

- “Conditionally Ready: composition and lighting pass; export readiness warning due to unverified runtime loader compatibility.”

## Non-goals

- no runtime command execution
- no arbitrary code exposure

## Verification

- Pass/warn/fail gates present
- Evidence linked to each major claim
- Final status justified
