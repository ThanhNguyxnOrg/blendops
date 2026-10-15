---
name: product-grid-scene-planner
description: Plan a multi-product grid scene (e-commerce, catalog, comparison) before any modeling or render attempt; consistent lighting, camera, and grid spacing.
---

# product-grid-scene-planner

## Purpose
Translate a multi-product grid intent (e-commerce / catalog / comparison) into a structured scene plan. Distinct from `product-hero-scene-planner` (single product, hero) and `interior-architectural-scene-planner` (room scene).

## Quick start
- pin product list (count + per-product type and relative real-world size)
- normalize product scale across cells (or split incompatible scales into separate grids)
- pin grid layout (rows × cols + spacing)
- pin per-cell consistency level (strict / loose for camera angle, lighting, background)
- pin shared material / lighting / background palette
- record assumptions register and hand off to asset discovery, format decision, and quality checkers

## When to use
- intent is multi-product display (4+ products in same scene)
- e-commerce catalog grid
- product comparison view
- showroom-style grid

## When not to use
- single product hero (use `product-hero-scene-planner`)
- character portrait (use `character-portrait-scene-planner`)
- outdoor environment scene (use `environment-establishing-shot-planner`)
- interior room scene (use `interior-architectural-scene-planner`)

## Trigger phrases
- "grid of products"
- "lineup of"
- "catalog showing N items"
- "comparison render"

## Prerequisites / readiness
- product list known (count + per-product description)
- consistency expectations known (identical lighting? identical camera? identical scale?)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Product list + relative sizes | Determines grid size, asset scope, and scale normalization |
| Grid layout (rows × cols + spacing) | Drives overall and per-cell composition |
| Aspect ratio | Governs framing and cell proportions |
| Consistency level (strict / loose) | Determines per-cell camera, lighting, and background rules |

### Optional inputs

| Input | Use |
|---|---|
| Brand palette | Shared material + background consistency |
| Per-product variants (color / SKU) | Adds variant rows and informs `output-format-decision` |
| Reference catalog images | Calibrates visual style and spacing |

### Assumptions to confirm
- Scale normalization method is agreed (true relative scale vs. visual bounding-box normalization).
- Lighting is shared across cells (not separate per-cell lighting setups).
- Camera angle is consistent (same angle, distance, and lens feel) across cells unless variation is explicitly requested.

## Output schema

### Primary output
A structured product-grid plan: Product list, Scale normalization rule (normalized or split), Grid layout (rows × cols + spacing), Consistency level (strict / loose), Per-cell composition and camera rules, Shared lighting plan, Shared background and palette, Aspect + framing, and Assumptions register.

### Secondary output
- per-product asset rows flagged for `blender-asset-discovery-planner`
- variant / SKU file output notes routed to `output-format-decision`
- downstream validation and sign-off handoff list

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
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

Planning-only skill — does not run Blender, model, source assets, or render. Runtime status must remain `Not Run` and Artifact status must remain `Not Produced` (truth states are downgrade-only, never upgrade). Hand off asset needs to `blender-asset-discovery-planner`, file output rules to `output-format-decision`, and validation to quality checkers.

## Operating procedure
1. Read product list from user or `intent-to-3d-brief-writer`; pin count, per-product description, and relative sizes.
2. Normalize scale across differently-sized products (or split incompatible items into separate grid plans).
3. Pin grid layout (rows × cols + spacing) per `references/grid-layout-rules.md`.
4. Decide consistency level (strict / loose).
5. Plan shared palette, shared lighting (one setup applied uniformly), and shared background.
6. Plan per-cell camera + framing (including caption/label space).
7. Define per-product asset rows and document the assumptions register.
8. Hand off to `blender-asset-discovery-planner`, `output-format-decision` (if variant/SKU file outputs apply), `composition-quality-checker`, `lighting-quality-checker`, `material-quality-checker`, `blender-scene-quality-checker`, `acceptance-criteria-builder`, and `blender-stop-condition-decider`.

## Decision tree

```txt
Products at very different scales (lipstick + sofa) in same grid?
  → Fail if unaddressed; normalize to a clear visual bounding box or split into separate scenes
Different lighting per cell requested?
  → Warn; usually erodes catalog uniformity
20+ products in single render?
  → Warn; recommend splitting into multiple grid plans
Brand palette or intent unclear?
  → Hand off to intent-to-3d-brief-writer
Variant / SKU file output formats needed?
  → Hand off file output rules to output-format-decision
```

## Playbooks

### Playbook A: 2×2 e-commerce hero grid (16:9)
4 products, identical 35mm lens, identical 3-point lighting, neutral seamless background, products centered in cells, equal spacing.

### Playbook B: 3×3 catalog page (1:1)
9 products, square cells, identical lighting, brand-color background, consistent product orientation, lower-third caption space per cell.

### Playbook C: 1×4 comparison strip (2.39:1)
4 product variants of same SKU, side-by-side, identical lighting + camera, label space below each.

## Mode handling

### Text-only mode

Emit the complete grid plan and assumptions register. Runtime stays `Not Run`; Artifacts stay `Not Produced`.

### Runtime-ready mode

Emit the complete grid plan, assumptions register, and downstream handoff targets. Do not execute Blender; Runtime stays `Not Run` and Artifacts stay `Not Produced`.

### Blocked runtime mode

Emit the complete grid plan and assumptions register; flag unconfirmed inputs under Limitations. Runtime stays `Not Run` and Artifacts stay `Not Produced`.

## Validation checklist
- [ ] Product list complete with count and relative sizes
- [ ] Scale normalized across products (or explicitly split into separate grids)
- [ ] Grid layout (rows × cols + spacing) explicit
- [ ] Consistency level (strict / loose) stated
- [ ] Shared palette, lighting plan, and background present
- [ ] Per-cell camera and framing consistent (or variation explicit)
- [ ] Assumptions register included
- [ ] Asset rows flagged for `blender-asset-discovery-planner`
- [ ] Validation and sign-off handoffs named

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | All sections complete + scale normalized (or split) + consistency level stated + shared lighting/palette + assumptions register + asset list + truth states locked to `Not Run` / `Not Produced`. |
| Warn | Minor cell variance (e.g., per-cell angle or lighting tweak) without clear justification, or 20+ items crammed into one grid. |
| Fail | Mixed-scale products without normalization or split, missing shared lighting/camera consistency, missing consistency level, missing assumptions register, or upgraded truth states. |

## Failure handling
- Mixed product scales → require normalized visual scale or split into separate grid plans.
- 20+ products → suggest splitting into multiple grid plans.
- Missing brand palette or unclear intent → hand off to `intent-to-3d-brief-writer`.

## Troubleshooting

| Problem | Response |
| --- | --- |
| Products appear mismatched in size across cells | Specify bounding-box scale normalization and identical per-cell camera distance in the plan. |
| One cell stands out visually | Enforce strict consistency level for shared lighting and shared background palette. |
| Caption space cramped | Increase planned grid spacing or reduce product count per grid. |
| Background distracts from products | Plan a neutral solid or subtle gradient background that contrasts cleanly with the shared palette. |

## Best practices
- Lock one camera angle and one shared lighting plan; apply identically across all cells.
- Normalize product scale (or split grids) before finalizing rows and columns.
- Reserve consistent caption or label space per cell for catalog layout.
- Keep the shared background tone consistent so material differences across SKUs remain accurate.

## Good examples
- "Products: 4 sneaker variants (identical real-world scale, normalized to equal cell bounding boxes). Grid: 2×2, even spacing. Shared lighting: soft studio three-point setup, even illumination. Shared palette/background: neutral light-gray seamless backdrop. Per-cell camera: standard eye-level framing, identical distance and orientation. Caption space lower 15% reserved. Assumptions register: identical footwear dimensions; no props; single still catalog output. Runtime status: Not Run. Artifact status: Not Produced."

## Bad examples
- "Show 4 products in a grid." — no lighting, layout, scale.

## User-facing response template

```txt
Product list: <count + per-product list>
Scale normalization: <normalized bounding box / true relative scale / split into separate grids>
Grid layout: <rows × cols> | spacing <value> | aspect <ratio>
Consistency: <strict / loose>
Shared palette: <colors + surface tones>
Shared lighting: <plain-language lighting plan>
Shared background: <type + tone>
Per-cell camera: <angle> | <distance> | <framing>
Caption / label space: <location + proportion>
Mood + style: <line>
Assumptions register: <explicit assumptions to confirm>

Assets to discover: <per-product rows for blender-asset-discovery-planner>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: blender-asset-discovery-planner | output-format-decision | composition-quality-checker | lighting-quality-checker | material-quality-checker | blender-scene-quality-checker | acceptance-criteria-builder | blender-stop-condition-decider
```

## Anti-patterns
- Per-cell separate lighting setups (breaks uniformity).
- Mixed-scale products without normalization.
- Background clashing with products.
- Skipping caption space when downstream layout needs it.

## Cross-skill handoff
- Upstream brief → `../intent-to-3d-brief-writer/SKILL.md`
- Single hero product alternative → `../product-hero-scene-planner/SKILL.md`
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- Variant / SKU file output format → `../output-format-decision/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Material validation → `../material-quality-checker/SKILL.md`
- Overall scene quality validation → `../blender-scene-quality-checker/SKILL.md`
- Catalog sign-off & stop conditions → `../acceptance-criteria-builder/SKILL.md`, `../blender-stop-condition-decider/SKILL.md`

## Non-goals
- Model the products.
- Source the products.
- Render.
- Run Blender.

## References
- `references/grid-layout-rules.md`
- `references/grid-consistency-rules.md`
- `references/grid-output-naming-rules.md`
- `../../docs/skill-system.md`
