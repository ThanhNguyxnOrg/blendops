# Grid layout rules

## Standard layouts

| Layout | Use case |
|---|---|
| 1×N (strip) | Comparison / variant lineup |
| 2×N (rows of 2) | E-commerce hero |
| 3×N (rows of 3) | Catalog page |
| 4×N (rows of 4) | Dense catalog |
| Square (N×N) | Social / editorial |

## Aspect-friendly layouts

| Aspect | Recommended grids |
|---|---|
| 16:9 | 1×4, 2×3, 2×4 |
| 1:1 | 2×2, 3×3, 4×4 |
| 9:16 | 4×1, 6×1, 3×2 |
| 2.39:1 | 1×4, 1×5, 1×6 |

## Spacing

- 0.3–0.5m between products at world scale (for medium products).
- Equal spacing both axes; do not vary horizontal vs vertical without intent.
- Avoid spacing < 0.1m → products read as overlapping.

## Cell size consistency

- Each cell must have the same world-space dimensions.
- Each product centered in its cell.
- Different product silhouettes must still fit; size cell to largest product silhouette.

## Common failures

- Variable spacing → reads as misaligned.
- Cells different sizes → reads as catalog error.
- Products not centered in cells → grid feels broken.
- Too many products in one render (> 9) → consider multi-page.

## Related skill
`../SKILL.md`
