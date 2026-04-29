---
name: blender-scene-quality-checker
description: Apply multi-category readiness gates with pass/warn/fail and evidence-bound verdicts.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# blender-scene-quality-checker

## Purpose
Evaluate scene/workflow readiness honestly and consistently before any success claim.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- before readiness/export/handoff claims
- after planning pass
- during text-only/runtime eval reporting

## When not to use
- as a replacement for evidence collection
- to fabricate confidence in missing artifacts

## Trigger phrases
- "quality-check this scene"
- "is this ready"
- "evaluate pass warn fail"

## Prerequisites / readiness
- plan output available
- criteria set available
- evidence state known (Produced/Not Produced/Not Run)

## Input schema

### Required inputs
- scene plan summary
- intended output criteria
- available evidence artifacts

### Optional inputs
- target quality threshold
- destination-specific constraints

### Assumptions to confirm
- whether runtime was executed
- whether artifacts are from this run vs pre-existing

## Output schema

### Primary output
- category-level pass/warn/fail matrix

### Secondary output
- readiness verdict and blockers

### Evidence / caveat output
- artifact status ledger
- explicit caveats and unknowns

## Required laws
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
No execution claims without evidence. Text-only and blocked modes must remain explicit.

## Operating procedure
1. Confirm evidence state and run mode.
2. Validate subject clarity criteria.
3. Validate composition/camera criteria.
4. Validate lighting/material criteria.
5. Validate scale/transform assumptions.
6. Validate render/export readiness criteria.
7. Validate GLB/web handoff clarity criteria.
8. Assign pass/warn/fail by category.
9. Determine blockers and conditional gaps.
10. Produce final verdict (Ready/Conditionally Ready/Not Ready/Not Run).

## Decision tree
- If runtime not executed → Not Run or Conditionally Ready (never Ready without evidence).
- If critical category fails → Not Ready.
- If all critical pass and only minor warnings remain → Conditionally Ready.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- evaluate planning quality only
- mark artifact statuses Not Run

### Runtime-ready mode
- include real artifact checks when present

### Blocked runtime mode
- keep verdict conservative
- list exact blockers and next actions

## Validation checklist
- [ ] mode explicitly labeled
- [ ] artifact status ledger present
- [ ] category rubric complete
- [ ] blocker list complete
- [ ] caveats include user impact
- [ ] final verdict justified
- [ ] no unsupported success claims
- [ ] no non-official runtime guidance
- [ ] plain-language summary included
- [ ] next actions provided

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Subject clarity | Clear and aligned | Minor ambiguity | Unclear focal subject |
| Composition/camera | Coherent and purposeful | Some weak framing | Framing fails user goal |
| Lighting/material | Plan supports intent | Gaps need tuning | Major quality mismatch |
| Evidence integrity | Claims align with evidence | Partial evidence | Claims contradict evidence |

## Failure handling
- Missing evidence: downgrade verdict and mark Not Run/Not Produced.
- Critical fail: mark Not Ready with remediation steps.
- Unknowns: keep Warn + explicit caveat.

## Troubleshooting
- If all categories pass but no artifacts exist: ensure verdict is not Ready.
- If pre-existing files found: do not attribute to current run without linkage.
- If plan quality high but runtime blocked: use Conditionally Ready or Not Run.

## Best practices
- score categories independently before final verdict
- keep caveats visible in final summary
- preserve traceability from category score to verdict

## Good examples
“Status: Conditionally Ready. Planning categories pass, but runtime artifacts are Not Run in this pass.”

## Bad examples
“Looks good overall, ship it.” (no rubric, no evidence mapping)

## User-facing response template
- Current status
- What passed
- What needs follow-up
- Next best action

## Cross-skill handoff
- Next: `glb-web-handoff`
- Then: `non-blender-user-response-writer`

## Non-goals
- runtime execution
- evidence-free readiness claims

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
