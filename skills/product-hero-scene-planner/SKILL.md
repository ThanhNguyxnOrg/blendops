---
name: product-hero-scene-planner
description: Generate a complete product-hero scene plan from non-Blender-user intent with explicit assumptions and gates.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# product-hero-scene-planner

## Purpose
Turn user intent into a high-quality, gate-ready scene plan before runtime execution.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- product hero scenario requests
- pre-runtime plan generation
- requirements normalization for non-technical users

## When not to use
- to claim generated artifacts
- to skip unresolved ambiguity

## Trigger phrases
- “plan a product hero scene”
- “turn this into a Blender plan”
- “prepare cyberpunk shoe scene plan”

## Prerequisites / readiness
- runtime status known (Ready/Partially Ready/Blocked/Unknown)
- output destination clarified
- no runtime execution required in this skill

## Input schema

### Required inputs
- user prompt
- output destination (web/app/game/render)

### Optional inputs
- style/mood references
- product constraints
- performance constraints

### Assumptions to confirm
- source model availability
- quality priority (realtime vs marketing)
- acceptable caveat level

## Output schema

### Primary output
- full scene plan schema

### Secondary output
- clarification question set
- assumptions register

### Evidence / caveat output
- unverified sections list
- runtime dependency caveats

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Planning-only skill. Runtime execution and artifact claims are out of scope here.

## Operating procedure
1. Restate user intent and desired outcome.
2. Identify target audience/use-case profile.
3. Extract hard constraints (style, brand, performance).
4. Generate clarification questions for missing critical data.
5. Build subject model (primary object and context elements).
6. Build composition plan (focal hierarchy, framing, negative space).
7. Build camera plan (angle, lens intent, depth strategy).
8. Build lighting plan (key/fill/rim + mood intent).
9. Build material plan (lookdev intent + portability caveats).
10. Build environment plan (background/support elements).
11. Define render/export intent and web handoff intent.
12. Attach validation-gate expectations and caveat policy.

## Decision tree
- If destination is unknown → request destination first.
- If constraints conflict → produce option A/B with trade-offs.
- If runtime blocked → keep planning mode and mark artifacts Not Run.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- complete planning output
- artifact status remains Not Run

### Runtime-ready mode
- include handoff steps for downstream runtime phase
- no success claim until evidence exists

### Blocked runtime mode
- deliver complete plan + blocker-aware next actions

## Validation checklist
- [ ] intent summary complete
- [ ] audience/use-case model included
- [ ] clarification questions provided when needed
- [ ] composition plan included
- [ ] camera plan included
- [ ] lighting plan included
- [ ] material plan included
- [ ] environment plan included
- [ ] render/export intent included
- [ ] web handoff intent included
- [ ] assumptions and caveats explicit
- [ ] no runtime output overclaims

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Intent capture | Complete and coherent | Minor ambiguity remains | Core intent unclear |
| Plan completeness | All schema sections present | Some sections shallow | Critical sections missing |
| Assumption transparency | Explicit assumptions/caveats | Partial assumptions | Hidden assumptions |
| Evidence boundary | No overclaims | Slight ambiguity | Runtime/output success claimed without evidence |

## Failure handling
- Missing critical inputs: block and ask targeted questions.
- Conflicting constraints: provide prioritized options with caveats.
- Unknown runtime readiness: continue in text-only planning mode.

## Troubleshooting
- Prompt too broad: split by objective and destination.
- Web + cinematic conflict: ask priority ranking.
- No source model: include intake risk and fallback plan.

## Best practices
- preserve user language in summaries
- keep plan modular and checklist-ready
- surface unknowns early

## Good examples
“Plan includes subject/composition/camera/lighting/material/environment plus explicit Not Run artifact status pending runtime phase.”

## Bad examples
“Hero scene done.” (no structure, no caveats)

## User-facing response template
- What you asked for
- Proposed plan
- What is not verified yet
- Next action

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- using non-official runtime setup paths
- producing jargon-heavy final output without explanation

## Cross-skill handoff
- Next: `blender-composition-camera-planner`
- Then: `blender-lighting-material-planner`
- Then: `blender-scene-quality-checker`

## Non-goals
- runtime command execution
- artifact success claims

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
