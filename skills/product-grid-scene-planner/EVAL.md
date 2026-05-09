# EVAL — product-grid-scene-planner

## Text-only eval prompt
Use product-grid-scene-planner on a brief: "4 sneaker variants in 2×2 grid, e-commerce hero, neutral background, 16:9".

## Expected behavior
- Product list (4) + grid layout (2×2 + spacing)
- Consistency level (strict)
- Shared lighting plan + shared background
- Per-cell camera consistent
- Caption space pinned
- Asset list flagged
- Handoff named

## Pass / Warn / Fail criteria
- Pass: full sections + scale normalized + consistent lighting + assets flagged
- Warn: per-cell variance unspecified
- Fail: mixed scale, no shared lighting, missing aspect

## Common failure modes
- per-cell separate lighting (breaks uniformity)
- mixed scale products
- no caption / label space
- background clashing

## Evidence expectations
- explicit grid layout
- shared lighting + background
- camera consistency stated

## Sample passing response outline
- Product list header
- Grid layout row
- Lighting + background rows
- Camera row
- Caption space row
- Asset list
- Next: handoff

## Sample failing response outline
- "4 products in grid"
- No layout / lighting / scale
