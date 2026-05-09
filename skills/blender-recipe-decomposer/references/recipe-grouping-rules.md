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

- Splitting "shoe hero render" into "shoe modeling" + "shoe lighting" + "shoe rendering" (those are stages, not recipes)
- Splitting variants into individual recipes when a grid recipe handles them all
- Splitting render + GLB if the GLB is just the export step of the render scene

## Related skill
`../SKILL.md`
