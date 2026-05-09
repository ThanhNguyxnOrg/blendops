---
name: product-grid-scene-planner
description: Plan a multi-product grid scene (e-commerce, catalog, comparison) before any modeling or render attempt; consistent lighting, camera, and grid spacing.
---

# product-grid-scene-planner

## Purpose
Translate a multi-product grid intent (e-commerce / catalog / comparison) into a structured scene plan. Distinct from `product-hero-scene-planner` (single product, hero) and `interior-architectural-scene-planner` (room scene).

## Quick start
- pin product list (count + per-product type)
- pin grid layout (rows × cols + spacing)
- pin per-cell consistency (camera angle, lighting, background)
- pin shared material / lighting / background palette
- emit a structured plan + handoff to checkers

## When to use
- intent is multi-product display (4+ products in same scene)
- e-commerce catalog grid
- product comparison view
- showroom-style grid

## When not to use
- single product hero (use `product-hero-scene-planner`)
- character portrait (use `character-portrait-scene-planner`)
- environment / interior scene (use respective planners)

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
| Product list | Determines grid size + asset scope |
| Grid layout (rows × cols) | Drives composition |
| Aspect ratio | Composition rules |
| Consistency level (strict / loose) | Determines per-cell rules |

### Optional inputs

| Input | Use |
|---|---|
| Brand palette | Material + background consistency |
| Per-product variants (color / SKU) | Adds variant rows |
| Reference catalog images | Calibrate visual style |

### Assumptions to confirm
- All products share the same scale convention.
- Lighting is shared across cells (not per-cell separate lighting setups).
- Camera angle is consistent (same yaw / pitch / lens) across cells unless explicitly varied.

## Output schema

### Primary output
A structured product-grid plan: Product list, Grid layout, Per-cell consistency rules, Shared lighting plan, Shared background, Per-cell composition rules, Aspect + framing.

### Secondary output
- asset list flagged for `blender-asset-discovery-planner`
- naming + file convention notes for export
- handoff list

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

Planning skill — does not run Blender, model, or render. Hand off to discovery / quality checkers.

## Operating procedure
1. Read product list; pin count + per-product description.
2. Pin grid layout (rows × cols + spacing) per `references/grid-layout-rules.md`.
3. Decide consistency level (strict / loose).
4. Plan shared lighting (one rig, applied uniformly).
5. Plan shared background.
6. Plan per-cell camera + framing (typically same).
7. Define per-product asset rows.
8. Hand off to discovery / checkers.

## Decision tree

```txt
Products at very different scales (lipstick + sofa) in same grid?
  → Fail; pick separate scenes or normalize scale clearly
Different lighting per cell requested?
  → Warn; usually erodes catalog uniformity
20+ products in single render?
  → Warn; consider multiple grid renders
Brand palette unclear?
  → Hand off to brief writer
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
Plan only.

### Runtime-ready mode
Plan + runtime path attribution.

### Blocked runtime mode
Plan only; flag what cannot be confirmed.

## Validation checklist
- [ ] Product list complete with count
- [ ] Grid layout (rows × cols + spacing) explicit
- [ ] Consistency level stated
- [ ] Shared lighting plan present
- [ ] Shared background present
- [ ] Per-cell camera consistent (or variation explicit)
- [ ] Aspect + framing consistent across cells
- [ ] Asset list flagged
- [ ] Handoff named

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All sections + scale-normalized + consistent lighting + asset list. |
| Warn | One inconsistency (per-cell lighting variance) without justification. |
| Fail | Mixed-scale products without normalization, no shared lighting plan, missing per-cell camera consistency. |

## Failure handling
- Mixed product scales → user picks normalized scale or splits into separate grids.
- 20+ products → suggest splitting into multiple renders.
- Missing brand palette → hand off to brief writer.

## Troubleshooting

| Problem | Response |
|---|---|
| Products read at different sizes despite same scale | Verify camera distance is identical per cell; verify assets at same world scale. |
| One cell stands out | Check for accidental lighting / material variance. |
| Caption space cramped | Re-plan grid spacing or reduce product count. |
| Background distracts | Simplify to solid color or gradient. |

## Best practices
- Lock one camera + one lighting rig; apply identically across all cells.
- Normalize product scale before grid planning.
- Reserve consistent caption space per cell for downstream layout.
- Use brand color as accent only, not full background (often clashes with materials).

## Good examples
- "Products: 4 sneaker variants. Grid: 2×2, 0.5m spacing. Aspect: 16:9. Shared lighting: 3-point key 250W + fill 50W + rim 100W; HDRI 0.7 studio. Background: neutral seamless gray (#dddddd). Per-cell camera: 50mm equivalent, eye-level, 1.5m distance, identical orientation. Caption space: lower 15% of cell. Mood: clean, modern, e-commerce."

## Bad examples
- "Show 4 products in a grid." — no lighting, layout, scale.

## User-facing response template

```txt
Product list: <count + per-product list>
Grid layout: <rows × cols> | spacing <m> | aspect <ratio>
Consistency: <strict / loose>
Shared lighting: <plan>
Shared background: <type + tone>
Per-cell camera: <focal length> | <distance> | <eye-line>
Caption / label space: <where + size>
Mood + style: <line>

Assets to discover: <list>
Limitations: <gaps>
Next: blender-asset-discovery-planner / composition-quality-checker / lighting-quality-checker / material-quality-checker
```

## Anti-patterns
- Per-cell separate lighting setups (breaks uniformity).
- Mixed-scale products without normalization.
- Background clashing with products.
- Skipping caption space when downstream layout needs it.

## Cross-skill handoff
- Brief writer → `../intent-to-3d-brief-writer/SKILL.md`
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Material validation → `../material-quality-checker/SKILL.md`

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
