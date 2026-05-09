---
name: blender-recipe-decomposer
description: Break a complex / over-scoped Blender intent into 2-5 smaller recipes that each have a clean stop condition, brief, and handoff.
---

# blender-recipe-decomposer

## Purpose
When user intent is too big for one recipe (multiple deliverables, mixed modes, conflicting briefs), split it into smaller recipes that each fit the BlendOps recipe shape (brief → plan → assets → runtime → handoff).

## Quick start
- enumerate the deliverables in the intent
- group them into 2-5 cohesive recipe-sized chunks
- name each new recipe + assign a brief + stop condition
- pin recipe order (linear or parallel-OK)

## When to use
- intent has multiple distinct deliverables (e.g., hero render + animation + GLB + variant grid)
- intent crosses multiple scene types (portrait + environment in one ask)
- previous attempts collapsed under their own scope
- before any planner runs

## When not to use
- single deliverable; recipe is already right-sized
- pure exploration / brainstorming
- after recipes have started running (use scope-boundary-enforcer or stop-condition-decider instead)

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
A recipe table: name, brief seed (one line), stop condition (one line), order, dependencies, handoff target.

### Secondary output
- shared assets list (used by 2+ recipes)
- recommended start recipe
- explicit out-of-scope reminder for each recipe

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Process / discipline skill — does not run Blender. Splits intent into recipe specs only.

## Operating procedure
1. Read full intent.
2. Enumerate distinct deliverables.
3. Group deliverables into 2-5 cohesive recipes (see `references/recipe-grouping-rules.md`).
4. For each recipe, write: name, brief seed, stop condition, order, dependencies.
5. Identify shared assets across recipes.
6. Recommend start recipe.
7. Hand each recipe off to `intent-to-3d-brief-writer` for full brief.

## Decision tree

```txt
Single deliverable?
  → No decomposition needed; pass to brief writer directly
2-5 distinct deliverables?
  → Group + decompose
6+ deliverables?
  → Strongly recommend product backlog approach; do not handle as single intent
Conflicting briefs (e.g., realistic + stylized in one ask)?
  → Split by style; do not merge
Shared assets across all deliverables?
  → Plan asset recipe first; downstream recipes consume it
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
Decomposition into recipe specs; no runtime claims.

### Runtime-ready mode
Recipe specs include runtime path attribution per recipe (each recipe may use a different path).

### Blocked runtime mode
Decomposition still useful; runtime per-recipe marked Blocked until paths available.

## Validation checklist
- [ ] Distinct deliverables enumerated
- [ ] Recipe count 2-5
- [ ] Each recipe has name + brief seed + stop condition
- [ ] Order + dependencies explicit
- [ ] Shared assets identified
- [ ] Start recipe recommended
- [ ] Out-of-scope per recipe stated

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | 2-5 cohesive recipes + name + brief + stop + order + handoff. |
| Warn | Recipes present but stop conditions soft, or order unclear. |
| Fail | One mega-recipe still; > 5 over-split fragments; missing stop conditions; no order. |

## Failure handling
- Single mega-recipe → forced to split per `recipe-grouping-rules.md`.
- > 5 fragments → consolidate adjacent ones.
- User refuses split → document as risk; warn that gates and stop conditions will be hard to maintain.

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
- "Recipes (3): (1) shoe-hero-render — `out/hero.png`, (2) shoe-color-variants-grid — `out/grid.png`, (3) shoe-orbit-animation — `out/orbit.glb`. Order: 1 → 2 (variant uses hero scene) → 3 (animation uses hero scene). Shared assets: shoe-base-mesh, hero-lighting-rig. Start: recipe 1."

## Bad examples
- "We'll do it all in one go." — no decomposition.

## User-facing response template

```txt
User intent (full): <…>
Deliverables enumerated: <list>

Recipes:
| # | Name | Brief seed | Stop condition | Order | Dependencies |
|---|---|---|---|---|---|

Shared assets: <list>
Recommended start: <recipe name>
Each recipe hands off to: intent-to-3d-brief-writer
Limitations: <gaps>
```

## Anti-patterns
- Single mega-recipe.
- > 5 fragmented recipes.
- Recipes without stop conditions.
- Skipping the dependency analysis.

## Cross-skill handoff
- After decomposition, each recipe → `../intent-to-3d-brief-writer/SKILL.md`
- Workflow gates per recipe → `../blender-checklist-driven-workflow/SKILL.md`
- Stop condition per recipe → `../blender-stop-condition-decider/SKILL.md`

## Non-goals
- Run Blender.
- Author full briefs (that is for `intent-to-3d-brief-writer`).
- Render or export anything.

## References
- `references/recipe-grouping-rules.md`
- `references/dependency-patterns.md`
- `references/recipe-naming-rules.md`
- `../../docs/skill-system.md`
