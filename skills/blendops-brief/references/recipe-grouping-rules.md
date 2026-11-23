# Recipe grouping rules

## Group by deliverable, not by process

Each recipe's identity = its deliverable artifact (one render, one GLB, one grid). Not "modeling" / "lighting" / "rendering" — those are stages within a recipe.

## Cohesion criteria

A recipe is well-grouped if:
- Single primary deliverable (one render or one GLB).
- Single brief (mood / style / output target consistent).
- Single stop condition.
- Single runtime path used (Path 1 / Path 2 / CLI per recipe).

If any of these have to fork → split into multiple recipes.

## Splitting heuristics

| Sign | Split decision |
|---|---|
| Multiple distinct primary outputs | Split by output |
| Mixed style / mood (realistic + stylized) | Split by style |
| Mixed scene type (portrait + environment) | Split by scene type |
| Mixed time of day / weather across same scope | Often a "looks" recipe per look |
| Mixed runtime paths (some Path 1, some CLI) | Split by path |
| Massive variant count (>9 variants) | Group variants into one grid recipe; do not split per variant |

## Common splits

- Hero + animation → 2 recipes (animation often needs different export settings)
- Hero + variants grid → 2 recipes (variant grid has its own consistency rules)
- Portrait + product hero → 2 recipes (different scene types)
- 3 product hero shots from same product → 1 recipe (same scope; variation in framing)

## Common over-splits to avoid

- Splitting "shoe hero render" into "shoe modeling" + "shoe lighting" + "shoe rendering" (those are stages within `recipe.product-hero-scene`, not separate recipes)
- Splitting variants into individual recipes when a grid recipe handles them all
- Splitting render + GLB if the GLB is just the export step of the render scene

## Canonical recipe targets (`registry/recipe-catalog.json`)

When decomposing a multi-deliverable brief into bounded sub-recipes, map each sub-recipe to a canonical `recipe.*` ID from `registry/recipe-catalog.json` when applicable:

- `recipe.product-hero-scene` — studio product hero still + optional GLB (`packs/product-hero-v0`, `docs/recipes/cyberpunk-shoe-hero.md`)
- `recipe.stylized-environment-scene` — exterior/architectural environment shot
- `recipe.hard-surface-prop` — non-destructive bevel/boolean hard-surface asset
- `recipe.procedural-geometry-nodes-asset` — parametric Geometry Nodes scatter/generator asset
- `recipe.uv-and-pbr-material-preparation` — UV unwrapping, packing, and Cycles PBR map baking
- `recipe.presentation-lighting-and-camera` — physical camera rig, 3-point/HDRI studio lighting, AgX/Filmic look
- `recipe.rigged-and-animated-asset` — skeletal armature, normalized skin weights, and baked NLA actions
- `recipe.scene-quality-inspection-and-correction` — 7-point pre-handoff verification and remediation
- `recipe.blender-to-glb-handoff` — glTF 2.0 / GLB export and web handoff manifest
- `recipe.web-ready-asset-optimization` — LOD generation, KTX2 texture compression, and Draco/Meshopt compression

## Related skill
`../SKILL.md`

