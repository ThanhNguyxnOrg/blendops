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

## Decision tree

```txt
Is the user's goal still vague or unformed with no deliverable shape?
  Yes → route to blender-brainstorming (creative divergence) or blendops-help (Rank 1 entry triage)
  No → continue
Is a recipe/pack already selected and ready for preflight or stage routing?
  Recipe selected, preflight not run → route to pack-prerequisite-checker (Rank 3)
  Preflight passed, stage/artifact inventory exists → route to workflow-stage-router (Rank 4)
  No recipe/pack selected yet → score candidate entries in `references/recipe-catalog.md`
Does the prompt request multiple incompatible deliverables at once (e.g., studio hero + full interior arch + character rig)?
  Yes → assign Partial or Poor fit, list scope-conflict gaps (`references/scope-gap-rules.md`), and route to blender-recipe-decomposer
  No → evaluate single-domain alignment:
    - Deliverable + style + budget match `product-hero-v0` or documented workflow → Strong fit → recommend `intent-to-3d-brief-writer` (or `pack-prerequisite-checker` if brief is already locked)
    - Domain matches a specialized planner (portrait, interior, environment, product grid) with manageable adaptations → Partial fit with explicit gap bullets → recommend `intent-to-3d-brief-writer`
    - Request violates Draft v0 scope (e.g., multi-user live editing) → Poor fit → document mitigations and alternative entrypoint
```

## Playbooks

### Playbook A: Direct product hero match (`Strong` fit)

- Match single-product focal stills or web GLB spin deliverables against `packs/product-hero-v0/PACK.md` and `docs/workflows/product-hero-workflow.md` (`references/recipe-catalog.md`).
- Assign `Fit verdict: Strong` with `Gaps: none` (or minor notes) using `references/workflow-recommendation-template.md`.
- Recommend `../intent-to-3d-brief-writer/SKILL.md` as the single next skill and keep `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Playbook B:Adjacent domain or hybrid deliverable (`Partial` fit)

- When the user wants an architectural interior, character portrait, environment establishing shot, or multi-item product grid, score `product-hero-v0` as `Partial` (or anchor on `docs/workflows/full-non-blender-user-workflow.md` + the matching domain planner).
- List each scope gap and mitigation explicitly per `references/scope-gap-rules.md` (for example, switching the downstream scene planner to `../interior-architectural-scene-planner/SKILL.md` or prioritizing the hero still before optional GLB export).
- Recommend `../intent-to-3d-brief-writer/SKILL.md` to lock the adapted 8-slot brief.

### Playbook C: Bundled multi-project ask (`Poor` fit / decomposition needed)

- When a user combines incompatible recipes in one request, assign `Fit verdict: Poor` (or `Partial` with blocking scope split) and explain why forcing a single pack causes rework.
- Recommend `../blender-recipe-decomposer/SKILL.md` as the single immediate next skill to split the deliverables into ordered sub-projects.

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

## Failure handling

- If the user's goal statement is too ambiguous to score against `references/recipe-catalog.md`, do not guess a pack; keep `Runtime status: Not Run` and `Artifact status: Not Produced` and route to `../blender-brainstorming/SKILL.md` or `../blendops-help/SKILL.md`.
- If the prompt bundles multiple incompatible recipes and the user refuses to prioritize, assign `Fit verdict: Poor`, record the unmitigated scope collision under `Limitations`, and route to `../blender-recipe-decomposer/SKILL.md`.
- Never claim a recipe or pack is "installed", "executed", or `Verified` during fit assessment.

## Troubleshooting

| Symptom | Cause | Safe resolution |
|---|---|---|
| User asks for an interior room scene using `product-hero-v0` | Studio product pack assumes isolated hero subject lighting rather than enclosed room bounce light | Score `product-hero-v0` as `Partial` / `Poor` for full room architecture, document the lighting/camera gap, and anchor the workflow on `../interior-architectural-scene-planner/SKILL.md` after `../intent-to-3d-brief-writer/SKILL.md`. |
| User wants both a 4K offline Cycles still and a <5 MB mobile GLB from one unprioritized brief | Real-time web budget conflicts with heavy cinematic shader setup (`references/scope-gap-rules.md`) | Downgrade verdict to `Partial`, list material/polycount dual-target gaps, and require primary/secondary deliverable prioritization in `../intent-to-3d-brief-writer/SKILL.md`. |
| User asks "which pack fits" when preflight and scene plans are already finished | Workflow is already in flight past Rank 2 | Hand off immediately to `../workflow-stage-router/SKILL.md` instead of re-running initial recipe selection. |

## Best practices

- Consult `references/recipe-catalog.md` and `references/scope-gap-rules.md` on every run so fit verdicts remain grounded in documented repository paths (`packs/product-hero-v0/PACK.md`, `docs/recipes/cyberpunk-shoe-hero.md`, `docs/workflows/product-hero-workflow.md`, `docs/workflows/full-non-blender-user-workflow.md`).
- Always emit a clear 3-tier verdict (`Strong`, `Partial`, or `Poor`) plus an explicit gap list (`none` only when genuinely `Strong`).
- Recommend **exactly one** next catalog skill so the agent does not fan out into parallel planners prematurely.
- Keep `Runtime status: Not Run` and `Artifact status: Not Produced` as the default truth states.

## Good examples

- "`Fit verdict: Strong` — Single sneaker hero still + web GLB spin aligns directly with `packs/product-hero-v0/PACK.md` and `docs/recipes/cyberpunk-shoe-hero.md`. `Gaps: none`. Recommended next skill: `../intent-to-3d-brief-writer/SKILL.md`. `Runtime status: Not Run`. `Artifact status: Not Produced`."
- "`Fit verdict: Partial` — Cinematic dining room furniture showcase overlaps `docs/workflows/full-non-blender-user-workflow.md` and `../interior-architectural-scene-planner/SKILL.md`, whereas `product-hero-v0` assumes studio isolation. `Gaps`: (1) use interior architectural camera/lighting planner instead of studio sweep; (2) mark optional GLB spin as secondary deliverable. Recommended next skill: `../intent-to-3d-brief-writer/SKILL.md`."

## Bad examples

- "`Fit verdict: Strong` — Use the `character-rigging-pro-v2` pack and start rendering immediately." — invents a non-existent pack and skips brief/preflight gates.
- "Use `product-hero-v0` for your 50-character crowd battle animation; no gaps." — ignores `references/recipe-catalog.md` weak-fit rules.
- "Recommended next skills: `intent-to-3d-brief-writer`, `pack-prerequisite-checker`, `product-hero-scene-planner`, and `blender-lighting-material-planner`. `Artifact status: Produced`." — violates the single-next-skill contract and fabricates artifact status.

## User-facing response template

```txt
Goal summary: <one-line user goal>
Deliverables & constraints: <deliverable types + time/platform/realism constraints>
Fit verdict: <Strong | Partial | Poor>
Primary catalog anchor: <documented pack or recipe path>
Alternate anchors: <specialized planner or workflow path, or none>
Gaps & mitigations:
  - <explicit gap + mitigation, or "none">
Recommended next skill: <single catalog skill path>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <catalog paths consulted>
Limitations: <unconfirmed user constraints or catalog coverage boundaries>
```

## Anti-patterns

- Inventing undocumented packs or recipes that do not exist under `packs/`, `docs/recipes/`, or `docs/workflows/`.
- Assigning `Strong` fit when the user requests multiple conflicting deliverables without prioritization.
- Recommending more than **one** immediate next skill in the output block.
- Writing `Artifact status: Not Run` or upgrading `Runtime status` / `Artifact status` during recipe scoring.
- Writing the full 8-slot 3D brief or executing preflight checks inside `recipe-fit-assessor` instead of handing off to `intent-to-3d-brief-writer` or `pack-prerequisite-checker`.

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

## Non-goals

- Brainstorming open-ended creative concepts before a goal exists (use `../blender-brainstorming/SKILL.md`).
- Authoring the locked 8-slot 3D brief (use `../intent-to-3d-brief-writer/SKILL.md`).
- Running the 7-row pack preflight gate (use `../pack-prerequisite-checker/SKILL.md`).
- Selecting MCP runtime paths, configuring Blender, or verifying rendered/exported artifacts.

## References

* `references/recipe-catalog.md`
* `references/scope-gap-rules.md`
* `references/workflow-recommendation-template.md`
* `../../docs/recipes/README.md`
