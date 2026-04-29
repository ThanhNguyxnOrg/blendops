---
name: blender-composition-camera-planner
description: Provide detailed composition and camera planning for product hero outputs.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# blender-composition-camera-planner

## Purpose
Design high-quality composition/camera strategy for product hero scenes in plain, actionable language.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- composition quality is uncertain
- camera direction needs deeper guidance
- hero section framing must align with web usage

## When not to use
- as proof of rendered output quality
- when subject intent is undefined

## Trigger phrases
- “improve composition and camera”
- “choose hero framing”
- “set camera strategy for product hero”

## Prerequisites / readiness
- subject and destination context available
- planning mode accepted when runtime unavailable

## Input schema

### Required inputs
- subject intent
- target output context (web/app/game/render)

### Optional inputs
- preferred aspect ratio
- UI/copy overlay constraints
- cinematic vs neutral tone preference

### Assumptions to confirm
- need for negative space
- focal detail priority
- camera motion vs static hero shot intent

## Output schema

### Primary output
- composition-camera plan

### Secondary output
- alternative framing options

### Evidence / caveat output
- unresolved visual assumptions
- Not Run caveat when no runtime validation

## Required laws
- ../../laws/non-blender-user-language.md
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Planning-only skill; no runtime execution or render claims.

## Operating procedure
1. Define focal hierarchy (primary/secondary/background).
2. Define hero-section objective and viewer attention path.
3. Select aspect ratio strategy.
4. Reserve negative space for UI/text overlays if needed.
5. Choose camera angle preset family.
6. Set focal length guidance by mood (dramatic vs neutral).
7. Define depth layering (foreground/midground/background).
8. Add silhouette/readability checks.
9. Produce fallback framing variant for uncertainty.
10. Translate plan into plain-language rationale.

## Decision tree
- If copy overlay required → prioritize negative space and silhouette.
- If product detail priority high → tighter framing and controlled depth.
- If uncertainty high → provide two options and ask preference.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- provide planning options only
- mark visual validation Not Run

### Runtime-ready mode
- include visual validation criteria for later runtime checks

### Blocked runtime mode
- keep plan + caveats
- no visual success claims

## Validation checklist
- [ ] focal hierarchy explicit
- [ ] hero framing objective explicit
- [ ] aspect ratio strategy documented
- [ ] negative space policy documented
- [ ] camera angle rationale documented
- [ ] focal length guidance documented
- [ ] depth layering documented
- [ ] silhouette criteria documented
- [ ] fallback variant documented
- [ ] plain-language rationale included

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Focal hierarchy | Clear and prioritized | Partial hierarchy | Missing hierarchy |
| Framing strategy | Matches output context | Generic but usable | Mismatched framing |
| Camera rationale | Specific and actionable | Vague rationale | No rationale |
| Evidence boundary | No visual overclaims | Mild ambiguity | Claims rendered quality without evidence |

## Failure handling
- Conflicting goals: provide trade-off options.
- Missing constraints: ask targeted follow-up.
- Unknown destination: use conservative web-hero defaults + caveat.

## Troubleshooting
- Subject lost in frame: increase focal contrast and framing focus.
- No room for copy: widen negative space and rebalance composition.
- Flat look risk: increase depth-layer contrast in plan.

## Best practices
- optimize for clarity before stylization
- tie each camera choice to user outcome
- preserve fallback path for uncertain constraints

## Good examples
“Primary subject occupies center-right with left negative space for hero copy; camera 3/4 angle chosen for silhouette and depth readability.”

## Bad examples
“Use cinematic camera.” (no context, no criteria)

## User-facing response template
- Composition summary
- Camera strategy summary
- Why this helps your goal
- What remains unverified

## Cross-skill handoff
- Next: `blender-lighting-material-planner`
- Then: `blender-scene-quality-checker`

## Non-goals
- runtime camera command execution
- render quality claims without runtime evidence

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
