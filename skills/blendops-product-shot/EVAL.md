# blendops-product-shot — EVAL

Behavioral evaluation prompts for `blendops-product-shot`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-product-shot`

### Text-only eval prompt
Use blendops-product-shot to create a full cyberpunk shoe hero scene plan without runtime execution.

### Expected behavior
- complete scene plan schema
- clarification questions when needed
- assumptions and caveats explicit

### Pass / Warn / Fail criteria
- Pass: all plan sections + no runtime overclaims
- Warn: minor section gaps with caveats
- Fail: major sections missing or artifact claims without evidence

### Common failure modes
- shallow 3-step plan
- no assumptions policy

### Evidence expectations
- plan sections listed
- unresolved assumptions listed
- runtime status marked Not Run in text-only mode

### Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

### Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action

## From former `blendops-product-shot`

### Text-only eval prompt
Use blendops-product-shot on a brief: "4 sneaker variants in 2×2 grid, e-commerce hero, neutral background, 16:9".

### Expected behavior
- Product list (4) + grid layout (2×2 + spacing)
- Consistency level (strict)
- Shared lighting plan + shared background
- Per-cell camera consistent
- Caption space pinned
- Asset list flagged
- Handoff named

### Pass / Warn / Fail criteria
- Pass: full sections + scale normalized + consistent lighting + assets flagged
- Warn: per-cell variance unspecified
- Fail: mixed scale, no shared lighting, missing aspect

### Common failure modes
- per-cell separate lighting (breaks uniformity)
- mixed scale products
- no caption / label space
- background clashing

### Evidence expectations
- explicit grid layout
- shared lighting + background
- camera consistency stated

### Sample passing response outline
- Product list header
- Grid layout row
- Lighting + background rows
- Camera row
- Caption space row
- Asset list
- Next: handoff

### Sample failing response outline
- "4 products in grid"
- No layout / lighting / scale
