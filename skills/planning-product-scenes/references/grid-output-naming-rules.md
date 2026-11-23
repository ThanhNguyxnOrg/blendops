# Grid output naming + export rules

## File naming convention

For multi-product grids, use a consistent name pattern:

```
<product-line>-grid-<NxN>-<aspect>-<YYYY-MM-DD>.png
```

Examples:
- `sneakers-grid-2x2-16-9-2026-05-09.png`
- `mugs-catalog-3x3-1-1-2026-05-09.png`

## Per-cell exports (optional)

If downstream layout requires per-cell separate images:

```
<product-line>-cell-<row>-<col>-<sku>-<YYYY-MM-DD>.png
```

Example:
- `sneakers-cell-1-1-sku-001-2026-05-09.png`

## Caption / label rendering

Captions are typically added in downstream layout (Figma / Sketch / CSS), not baked into the render. Reserve consistent space per cell for captions:

| Aspect | Caption space |
|---|---|
| 16:9 | Lower 15% of cell |
| 1:1 | Lower 20% of cell |
| 9:16 | Lower 25% of cell |

## Resolution per render

Render at the consumer's required resolution × 1.5 (for downscale-quality margin):
- 16:9 web hero → 2880×1620 (renders to 1920×1080)
- Square social → 2160×2160 (renders to 1440×1440)

Always document the rendered resolution and target resolution in the export evidence.

## glTF / GLB grid handoff (rare)

Multi-product grids rarely export as a single GLB; usually they are 2D renders. If a grid GLB is requested:
- Each product as a separate glTF node.
- Shared parent node for the grid arrangement.
- Document scale + grid arrangement in handoff.

## Related skill
`../SKILL.md`
