---
name: recipe-fit-assessor
description: Match user goals to BlendOps recipes and packs; flag scope gaps; recommend closest canonical workflow and skill chain.
---

# recipe-fit-assessor

## Purpose

Map a user's stated goal to the closest documented BlendOps recipe or pack before expensive planning or runtime work, returning a fit verdict (`Strong` / `Partial` / `Poor`), rationale, explicit gap list, and **one** recommended next skill. This skill is planning-only and never runs Blender, packs, or runtime.

## Quick start

- capture goal + constraints + deliverables
- compare against catalog rows in `references/recipe-catalog.md`
- assign fit verdict (Strong / Partial / Poor)
- list gap fixes or recommend a different workflow entrypoint

## When to use

- user asks "which recipe / pack fits my idea"
- scope drifts between product hero, portrait, interior, web GLB, batch renders
- before locking `intent-to-3d-brief-writer` output to a pack

## When not to use
<!-- blendops:generated:start exclusions -->
- Diverging raw creative ideas before a delivery shape exists → use `../blender-brainstorming/SKILL.md` (Explores creative directions and clarifies vague ideas before recipe selection)
- General entry routing across BlendOps when the goal itself is unclear → use `../blendops-help/SKILL.md` (Handles ambiguous entry triage at precedence Rank 1)
- Checking whether a selected pack's preflight prerequisites are met → use `../pack-prerequisite-checker/SKILL.md` (Evaluates preflight readiness once the recipe/pack is already selected)
- Picking the next workflow stage after preflight passed and artifacts already exist → use `../workflow-stage-router/SKILL.md` (Routes active in-flight workflows at precedence Rank 4)
- Writing the structured 8-slot 3D brief after recipe fit is settled → use `../intent-to-3d-brief-writer/SKILL.md` (Authors the formal brief after recipe fit is determined)
- Detailed scene planning once a domain and brief are locked → use `../product-hero-scene-planner/SKILL.md` (Builds the domain-specific scene plan after preflight passes)
- Runtime setup, path selection, or bridge conflict troubleshooting → use `../runtime-path-picker/SKILL.md` (Handles MCP runtime selection and setup outside recipe scoring)
- Legal or asset license verification → use `../asset-license-checker/SKILL.md` (Audits asset provenance and license compatibility)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "what recipe should I use"
- "does product hero fit"
- "closest workflow for X"
- "which pack"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- rough goal statement exists
- intended outputs known (still image, GLB, animation, web, print)
- audience skill level known (non-Blender user assumed default)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Goal summary | Defines fit target |
| Deliverable type | Maps to recipe outputs |
| Constraints (time, realism, web vs cinematic) | Drives fit verdict |

### Optional inputs

| Input | Use |
|---|---|
| Reference links / moodboards | Clarify genre fit |
| Prior pack choice | Re-evaluate fit |

### Assumptions to confirm

- User accepts switching packs if fit is Poor.
- Recipes under `docs/recipes/` and packs under `packs/` are the authoritative catalog.

## Output schema

### Primary output

- Recommended closest documented recipe or pack name
- Fit verdict (`Strong` | `Partial` | `Poor`) + plain-language rationale
- Gap list (what must change or be accepted to reach a Strong fit, or `none`)
- **One** recommended next skill from the official catalog (e.g., `intent-to-3d-brief-writer` or the single best-matching skill)

### Evidence / caveat output

Assessing fit is planning-only and never executes runtime or produces artifacts. Truth states are downgrade-only (never upgrade):
- Allowed Runtime states: `Not Run | Attempted | Produced | Verified | Failed` (always `Not Run` for fit assessment unless reporting prior state)
- Allowed Artifact states: `Not Run | Not Produced | Produced | Verified | Failed` (defaults to `Not Produced`)

```txt
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <documented recipe/pack paths consulted>
Limitations: <catalog coverage gaps or unverified user constraints>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Planning-only skill. Does not configure MCP, Blender, or hosts. When mentioning runtime, use the 2-path + CLI appendix model from `docs/runtime-stack-strategy.md` only as context for whether a workflow expects interactive MCP vs batch CLI — never claim runtime success.

## Operating procedure

1. Normalize goal using `references/scope-gap-rules.md`.
2. Score against each catalog row in `references/recipe-catalog.md`.
3. Pick Strong fit if any; else best Partial with explicit gaps.
4. Emit recommendation block from `references/workflow-recommendation-template.md`.
5. Hand off to brief writer or narrow planner per fit.

## Mode handling

### Text-only mode

Fit from stated intent only; flag unknowns as gaps.

### Runtime-ready mode

Same as text-only; optionally note if user demands CLI-only automation.

### Blocked runtime mode

Still usable; note runtime unavailable does not change recipe fit.

## Validation checklist

* [ ] Documented recipe/pack catalog consulted
* [ ] Fit verdict (`Strong` / `Partial` / `Poor`) and plain-language rationale assigned
* [ ] Explicit gap list included (or `none`)
* [ ] Exactly **one** next skill recommended from the valid 48-skill catalog
* [ ] Truth states follow downgrade-only rules with Artifact status defaulting to `Not Produced`
* [ ] No Blender execution, Python code, pack installation, or runtime success claims

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Strong fit with documented recipe/pack + clear next skill |
| Warn | Partial fit; user must accept gaps or expand scope |
| Fail | Poor fit but user insists on wrong pack without mitigations |

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [upstream_reference] Upstream creative divergence → `../blender-brainstorming/SKILL.md`
- [boundary_delegation] General entry routing → `../blendops-help/SKILL.md`
- [conditional] Multi-deliverable scope split when prompt spans multiple incompatible recipes → `../blender-recipe-decomposer/SKILL.md`
- [progression] Downstream structured brief → `../intent-to-3d-brief-writer/SKILL.md`
- [progression] Pack prerequisite verification → `../pack-prerequisite-checker/SKILL.md`
- [conditional] Post-artifact stage routing → `../workflow-stage-router/SKILL.md`
- [alternative] Domain scene planner (product hero) → `../product-hero-scene-planner/SKILL.md`
- [alternative] Domain scene planner (product grid) → `../product-grid-scene-planner/SKILL.md`
- [alternative] Domain scene planner (character portrait) → `../character-portrait-scene-planner/SKILL.md`
- [alternative] Domain scene planner (environment establishing shot) → `../environment-establishing-shot-planner/SKILL.md`
- [alternative] Domain scene planner (interior architectural) → `../interior-architectural-scene-planner/SKILL.md`
<!-- blendops:generated:end handoffs -->

## References

* `references/recipe-catalog.md`
* `references/scope-gap-rules.md`
* `references/workflow-recommendation-template.md`
* `../../docs/recipes/README.md`
