---
name: recipe-fit-assessor
description: Match user goals to BlendOps recipes and packs; flag scope gaps; recommend closest canonical workflow and skill chain.
---

# recipe-fit-assessor

## Purpose

Map a user's stated goal to the closest documented recipe or pack (`product-hero-v0`, golden paths, workflow docs) and surface mismatches before expensive planning or runtime work.

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

- runtime execution or MCP troubleshooting (use runtime skills)
- pure creative brainstorming without a delivery shape (use `blender-brainstorming` first)
- legal/license checks (use `asset-license-checker`)

## Trigger phrases

- "what recipe should I use"
- "does product hero fit"
- "closest workflow for X"
- "which pack"

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

- recommended recipe / pack name(s)
- fit verdict + rationale
- gap list (what must change for Strong fit)
- suggested next skill (`intent-to-3d-brief-writer`, domain planner, etc.)

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <recipe/pack doc paths consulted>
Limitations: <catalog coverage gaps>
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

- [ ] Catalog consulted
- [ ] Verdict assigned
- [ ] Gaps listed or "none"
- [ ] Next skill named
- [ ] No false runtime claims

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Strong fit with documented recipe/pack + clear next skill |
| Warn | Partial fit; user must accept gaps or expand scope |
| Fail | Poor fit but user insists on wrong pack without mitigations |

## Cross-skill handoff

- From brainstorming → `../blender-brainstorming/SKILL.md`
- To structured brief → `../intent-to-3d-brief-writer/SKILL.md`
- Product hero path → `../product-hero-scene-planner/SKILL.md`
- Help routing → `../blendops-help/SKILL.md`

## References

- `references/recipe-catalog.md`
- `references/scope-gap-rules.md`
- `references/workflow-recommendation-template.md`
- `../../docs/recipes/README.md`
- `../../packs/product-hero-v0/PACK.md`
