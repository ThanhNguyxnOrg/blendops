---
name: glb-web-handoff
description: Prepare truthful GLB/web handoff output with explicit artifact status, assumptions, and caveats.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# glb-web-handoff

## Purpose
Define reliable handoff language and checks for GLB/web scenarios without overclaiming.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- before web handoff summary
- when user asks GLB readiness
- when preparing Three.js/R3F expectations

## When not to use
- to claim GLB was produced without evidence
- to replace runtime export verification

## Trigger phrases
- "prepare web handoff"
- "is GLB ready"
- "summarize export status"

## Prerequisites / readiness
- quality checker output available
- artifact evidence state known
- runtime mode known

## Input schema

### Required inputs
- artifact status evidence
- handoff target context
- known compatibility assumptions

### Optional inputs
- size/performance constraints
- expected downstream stack details

### Assumptions to confirm
- transform/scale/origin assumptions
- texture/material portability assumptions
- loader/extension assumptions

## Output schema

### Primary output
- handoff status report

### Secondary output
- compatibility assumptions and caveats

### Evidence / caveat output
- explicit artifact status per artifact
- unresolved risk notes and next checks

## Required laws
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
No GLB/export success claim without concrete evidence.

## Operating procedure
1. Enumerate expected handoff artifacts (GLB/preview/report).
2. Mark each artifact status (Produced/Not Produced/Not Run).
3. Validate transform/scale/origin assumptions are documented.
4. Validate material/texture caveats are documented.
5. Record Three.js/R3F compatibility assumptions.
6. Record performance caveats and uncertainty.
7. Check evidence boundary compliance.
8. Produce handoff summary and next actions.

## Decision tree
- If GLB evidence exists → report produced + caveats.
- If no GLB evidence and runtime not run → Not Run status.
- If runtime run but export failed → Not Produced + failure note.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- handoff expectations only
- artifacts marked Not Run/Not Produced

### Runtime-ready mode
- include evidence-linked artifact statuses

### Blocked runtime mode
- no production claims
- blocker-driven next steps

## Validation checklist
- [ ] GLB status explicit
- [ ] preview status explicit
- [ ] transform/scale/origin assumptions documented
- [ ] material/texture caveats documented
- [ ] stack assumptions documented
- [ ] performance caveats documented
- [ ] evidence boundary respected
- [ ] next checks actionable
- [ ] no unsupported readiness claims
- [ ] plain-language handoff summary

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Artifact truth | Status matches evidence | Partial evidence | Claims without evidence |
| Compatibility clarity | Assumptions/caveats complete | Some gaps | Missing assumptions |
| Web handoff usability | Clear next actions | Partial actionability | Confusing or incomplete |
| Evidence boundary | No overclaims | Minor ambiguity | Contradictory claims |

## Failure handling
- Missing evidence: mark Not Run/Not Produced and list missing checks.
- Failed export evidence: record failure reason and retry path.
- Unknown compatibility: keep Warn with explicit caveat.

## Troubleshooting
- Existing files found: verify provenance before claiming produced.
- Missing scale/origin assumptions: add as blocker.
- Missing stack assumptions: mark handoff as conditional.

## Best practices
- always pair artifact status with caveat
- separate assumptions from verified facts
- prioritize non-technical clarity in final handoff text

## Good examples
“GLB status: Not Run (runtime not executed in this pass). Next: run official runtime eval and capture export evidence.”

## Bad examples
“GLB is ready for production.” (no artifact proof)

## User-facing response template
- What is included now
- What is still unverified
- What to run/check next

## Cross-skill handoff
- Next: `non-blender-user-response-writer`

## Non-goals
- runtime export code generation
- unsupported compatibility guarantees

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
