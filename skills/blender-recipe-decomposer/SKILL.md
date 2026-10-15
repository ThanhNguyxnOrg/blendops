---
name: blender-recipe-decomposer
description: Break over-scoped Blender intent into 2-5 cohesive recipes with brief seeds, stop conditions, order, dependencies, shared assets, and handoffs.
---

# blender-recipe-decomposer

## Purpose
When user intent is too big for one recipe (multiple deliverables, mixed modes, conflicting briefs), split it into smaller recipes that each fit the BlendOps recipe shape (brief → plan → assets → runtime → handoff).

## Quick start
- enumerate distinct deliverables in the user intent
- group them into 2-5 cohesive recipes and plan shared assets early
- give each recipe a name, one-line brief seed, one-line stop condition seed, explicit out-of-scope boundary, and handoff target
- pin recipe start order (linear or parallel-OK) and dependencies

## When to use
- intent has multiple distinct deliverables (e.g., hero render + animation + GLB + variant grid)
- intent crosses multiple scene types (portrait + environment in one ask)
- previous attempts collapsed under their own scope
- before any planner runs

## When not to use
- single deliverable that is already right-sized (hand off directly to `intent-to-3d-brief-writer`)
- pure exploration or open ideation (use `blender-brainstorming` instead)
- after recipes are already split or running (use `blender-scope-boundary-enforcer` for added scope or `blender-stop-condition-decider` to evaluate completion)

## Trigger phrases
- "I want all of these"
- "this is a lot"
- "we'll need several outputs"
- "across these scenes"

## Prerequisites / readiness
- intent stated by user (or extractable)
- user accepts that splitting will yield more reliable output

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Full user intent | Source for decomposition |
| Acceptable recipe count target (2-5 typical) | Constrains over-splitting |

### Optional inputs

| Input | Use |
|---|---|
| Time / budget per recipe | Affects sizing |
| Deliverable priority | Drives recipe order |

### Assumptions to confirm
- Splitting is acceptable (not all users want this).
- Each new recipe will need its own brief.
- Some shared assets across recipes is OK; design re-use early.

## Output schema

### Primary output
A recipe table containing: name, brief seed (one line), stop condition (one line), order, dependencies, out-of-scope boundary, and handoff target.

### Secondary output
- shared assets list (used by 2+ recipes, planned early)
- recommended start recipe
- explicit out-of-scope reminder for each recipe

### Evidence / caveat output
Decomposition is a pre-work scope splitter and creates no runtime or artifact truth claims. Truth states are downgrade-only (never upgrade without evidence); default artifact state is `Not Produced`.

Runtime status: Not Run | Attempted | Produced | Verified | Failed (default at decomposition: Not Run)
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default at decomposition: Not Produced)
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Process / discipline skill — does not run Blender. Splits intent into recipe specs only.

## Operating procedure
1. Read full intent and confirm splitting is acceptable.
2. Enumerate distinct deliverables.
3. Identify shared assets across deliverables so re-use is planned early.
4. Group deliverables into 2-5 cohesive recipes (see `references/recipe-grouping-rules.md`); avoid both single mega-recipes and over-splitting (>5 fragments).
5. For each recipe, write: name, one-line brief seed, one-line stop condition, start order, dependencies, explicit out-of-scope boundary, and handoff target.
6. Recommend the start recipe (typically shared-asset prep or foundational hero scene first).
7. Respect downstream role boundaries:
   - Hand each recipe to `intent-to-3d-brief-writer` to author its full brief.
   - Hand each recipe to `blender-stop-condition-decider` to pin its formal done condition.
   - Gate each recipe's execution with `blender-checklist-driven-workflow`.
   - Route any scope added after splitting to `blender-scope-boundary-enforcer`.

## Decision tree

```txt
Single deliverable?
  → No decomposition needed; pass directly to `intent-to-3d-brief-writer`
Pure exploration with no concrete deliverables yet?
  → Route to `blender-brainstorming` first
2-5 distinct deliverables?
  → Group + decompose into 2-5 cohesive recipes
6+ deliverables?
  → Strongly recommend product backlog approach; do not handle as a single intent or split into >5 fragments
Conflicting briefs (e.g., realistic + stylized in one ask)?
  → Split by style into separate recipes; do not merge
Shared assets across deliverables?
  → Plan shared-asset prep early; downstream recipes declare it as a dependency
Scope added after decomposition is agreed?
  → Route to `blender-scope-boundary-enforcer`
```

## Playbooks

### Playbook A: Hero + variants + animation (3 recipes)
1. Hero static render (base recipe).
2. Color variants grid (consumes hero scene + asset).
3. Animation loop on hero (consumes hero scene; new export).

### Playbook B: Portrait + environment + product (3 recipes, parallel-OK)
1. Character portrait scene.
2. Environment establishing shot.
3. Product hero render.
Each independent; parallel execution acceptable.

### Playbook C: Multi-pack catalog (5 recipes)
1. Asset library prep (shared).
2. Product 1 hero.
3. Product 2 hero.
4. Product 3 hero.
5. Catalog grid composite.
Recipes 2-4 can run parallel; recipe 5 depends on 2-4.

## Mode handling

### Text-only mode
Decompose into recipe specs only. Decomposition creates no truth claims (`Runtime status: Not Run`, `Artifact status: Not Produced`).

### Runtime-ready mode
Recipe specs may note intended runtime path candidates per recipe (via `runtime-path-picker`), while truth states remain `Runtime status: Not Run` and `Artifact status: Not Produced` until actual execution occurs downstream.

### Blocked runtime mode
Decomposition proceeds normally as pre-work. Keep `Runtime status: Not Run` and `Artifact status: Not Produced` (or `Failed` if a prior attempt failed — downgrade-only, never invent a `Blocked` truth state).

## Validation checklist
- [ ] Distinct deliverables enumerated
- [ ] Recipe count is between 2 and 5 (no mega-recipe, no >5 fragments)
- [ ] Each recipe has a name, one-line brief seed, and one-line stop condition
- [ ] Start order and dependencies are explicit for every recipe
- [ ] Shared assets across recipes are identified and planned early
- [ ] Recommended start recipe is stated
- [ ] Explicit out-of-scope boundary is stated per recipe
- [ ] Per-recipe handoff to `intent-to-3d-brief-writer` (and downstream governance skills) is explicit
- [ ] Truth states remain `Runtime status: Not Run` and `Artifact status: Not Produced`

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | 2-5 cohesive recipes + name + brief + stop + order + handoff. |
| Warn | Recipes present but stop conditions soft, or order unclear. |
| Fail | One mega-recipe still; > 5 over-split fragments; missing stop conditions; no order. |

## Failure handling
- Single mega-recipe → force split into 2-5 cohesive recipes per `references/recipe-grouping-rules.md`.
- > 5 fragments → consolidate adjacent deliverables into 2-5 cohesive recipes or defer excess to a backlog.
- Scope added after splitting → hand off to `blender-scope-boundary-enforcer`.
- User refuses split → document as risk; warn that `blender-checklist-driven-workflow` gates and `blender-stop-condition-decider` criteria will be fragile.

## Troubleshooting

| Problem | Response |
|---|---|
| Decomposed recipes have heavy dependencies | Re-group to reduce coupling; consider shared-asset pre-recipe. |
| Recipes overlap in scope | Re-draw boundaries; eliminate overlap. |
| Recipe order ambiguous | Pick one (typically asset-first → main render → variants → composite); justify. |

## Best practices
- Keep recipes 2-5; outside that range usually wrong-sized.
- Plan shared assets early; reduces rework.
- Name recipes after the deliverable, not the process.
- Hand off each recipe to `intent-to-3d-brief-writer` for full brief.

## Good examples
- "Recipes (3):
  1. `shoe-hero-render` — Brief seed: Studio hero still of running shoe. Stop condition: Approved 4K PNG hero frame. Order: 1. Dependencies: none. Out of scope: colorway grid, animation. Handoff: `intent-to-3d-brief-writer`.
  2. `shoe-color-variants-grid` — Brief seed: 4-colorway comparison grid reusing hero studio rig. Stop condition: Approved composite grid PNG. Order: 2 (parallel-OK with 3 after 1). Dependencies: `shoe-hero-render` shared assets. Out of scope: turntable motion. Handoff: `intent-to-3d-brief-writer`.
  3. `shoe-orbit-animation` — Brief seed: 360-degree web turntable GLB. Stop condition: Exported GLB passing web budget check. Order: 2 (parallel-OK with 2 after 1). Dependencies: `shoe-hero-render` base mesh. Out of scope: static print renders. Handoff: `intent-to-3d-brief-writer`.
  Shared assets planned early: `shoe-base-mesh`, `hero-lighting-rig`. Recommended start: `shoe-hero-render`. Runtime status: `Not Run`. Artifact status: `Not Produced`."

## Bad examples
- "We'll do the hero render, 6 color variants, turntable animation, and mobile AR export in one recipe." — fails by keeping a single mega-recipe.
- "I split your request into 9 micro-recipes (one per camera angle and shader tweak) and wrote the full 3D brief for each." — fails by over-splitting (>5 fragments) and blurring roles with `intent-to-3d-brief-writer`.

## User-facing response template

```txt
User intent (full): <…>
Deliverables enumerated: <list>

Recipes:
| # | Name | Brief seed | Stop condition | Order | Dependencies | Out of scope | Handoff target |
|---|---|---|---|---|---|---|---|
| 1 | <name> | <one line> | <one line> | <order> | <deps> | <boundary> | <skill> |
| 2 | … | … | … | … | … | … | … |

Shared assets (planned early): <list>
Recommended start: <recipe name>
Next role handoffs:
- Full brief per recipe: `intent-to-3d-brief-writer`
- Done condition per recipe: `blender-stop-condition-decider`
- Stage gating per recipe: `blender-checklist-driven-workflow`
- Post-split scope additions: `blender-scope-boundary-enforcer`

Runtime status: Not Run
Artifact status: Not Produced
Evidence used: none (decomposition pre-work only)
Limitations: <gaps>
```

## Anti-patterns
- Single mega-recipe.
- > 5 fragmented recipes.
- Recipes without stop conditions.
- Skipping the dependency analysis.

## Cross-skill handoff
- Full brief authoring for each split recipe → `../intent-to-3d-brief-writer/SKILL.md`
- Pinning formal done conditions per recipe → `../blender-stop-condition-decider/SKILL.md`
- Workflow stage gates per recipe → `../blender-checklist-driven-workflow/SKILL.md`
- Handling scope added after splitting → `../blender-scope-boundary-enforcer/SKILL.md`
- Pre-decomposition ideation when deliverables are unclear → `../blender-brainstorming/SKILL.md`

## Non-goals
- Run Blender, write Python, or render/export any artifacts.
- Author full 3D briefs (belongs to `intent-to-3d-brief-writer`).
- Pin formal acceptance/stop gates (belongs to `blender-stop-condition-decider`).
- Run per-recipe checklist stage gates (belongs to `blender-checklist-driven-workflow`).
- Enforce scope creep after recipes are already split (belongs to `blender-scope-boundary-enforcer`).
- Make or upgrade runtime or artifact truth claims.

## References
- `references/recipe-grouping-rules.md`
- `references/dependency-patterns.md`
- `references/recipe-naming-rules.md`
- `../../docs/skill-system.md`
