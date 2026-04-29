---
name: blender-lighting-material-planner
description: Build detailed lighting and material direction with portability and caveat handling for Blender/web-3D outputs.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# blender-lighting-material-planner

## Purpose
Create a high-quality, practical lighting/material plan that balances visual intent and web portability constraints.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- look-development strategy is needed
- lighting/material choices drive scene mood
- web/GLB portability caveats must be explicit

## When not to use
- to claim final rendered quality
- to skip composition/camera context

## Trigger phrases
- "plan lighting and materials"
- "design cyberpunk lookdev"
- "define PBR and reflection strategy"

## Prerequisites / readiness
- subject/composition plan exists
- output destination is known
- runtime mode status known (text-only/runtime-ready/blocked)

## Input schema

### Required inputs
- style intent
- subject material constraints
- output destination

### Optional inputs
- brand color/style constraints
- performance budget hints
- preferred mood references

### Assumptions to confirm
- realism vs stylized priority
- reflection intensity tolerance
- portability strictness for web handoff

## Output schema

### Primary output
- lighting strategy + material strategy

### Secondary output
- portability simplification recommendations

### Evidence / caveat output
- unverified visual assumptions
- Not Run caveats when runtime unavailable

## Required laws
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
This skill produces planning guidance only. It does not run Blender or claim runtime-produced results.

## Operating procedure
1. Define lighting objective (readability vs drama balance).
2. Choose key/fill/rim strategy.
3. Add neon/cyberpunk accent pattern where requested.
4. Define reflective floor behavior and caveats.
5. Choose material classes and hierarchy.
6. Define PBR portability assumptions.
7. Identify web simplification opportunities.
8. Define texture/material naming expectations.
9. Add GLB/web handoff caveats.
10. Provide user-facing summary with uncertainty markers.

## Decision tree
- If style is cyberpunk + product clarity required → neon accents + controlled reflections.
- If web performance priority high → simplify material stack and reflection complexity.
- If portability uncertain → keep assumptions explicit and request runtime validation.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- produce lookdev plan only
- mark visual evidence as Not Run

### Runtime-ready mode
- include validation targets for downstream runtime checks

### Blocked runtime mode
- provide conservative plan and caveats
- no rendered output claim

## Validation checklist
- [ ] key/fill/rim strategy documented
- [ ] style-specific lighting notes documented
- [ ] reflective floor caveats documented
- [ ] material hierarchy documented
- [ ] PBR portability assumptions documented
- [ ] web simplification recommendations provided
- [ ] naming expectations provided
- [ ] handoff caveats provided
- [ ] uncertainty markers explicit
- [ ] no evidence overclaims

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Lighting strategy | Clear and goal-aligned | Basic but usable | Missing/contradictory |
| Material strategy | Coherent and portable-aware | Partial portability | No portability consideration |
| Web caveats | Explicit and actionable | Present but vague | Missing caveats |
| Evidence boundary | No visual overclaims | Minor ambiguity | Claims rendered results without evidence |

## Failure handling
- Missing style detail: request targeted clarification.
- Conflicting constraints: output option sets with trade-offs.
- Unknown runtime state: keep plan-only with explicit caveats.

## Troubleshooting
- Overly harsh reflections: reduce floor reflectance assumptions.
- Muddy lighting plan: simplify key/fill ratio assumptions.
- Material complexity too high for web: propose simplification tiers.

## Best practices
- prioritize readability before stylization extremes
- map each lookdev decision to user-facing outcome
- preserve portability caveats explicitly

## Good examples
“Use key+soft fill for product readability, neon rim accents for mood, and limit reflective floor intensity to avoid detail washout in web contexts.”

## Bad examples
“Make it look cool with neon materials.” (no constraints, no caveats)

## User-facing response template
- Lighting plan summary
- Material plan summary
- Portability caveats
- Next validation step

## Cross-skill handoff
- Next: `blender-scene-quality-checker`
- Then: `glb-web-handoff`

## Non-goals
- shader/runtime implementation code
- rendered quality claims without evidence

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
