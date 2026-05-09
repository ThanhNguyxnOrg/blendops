# Grid consistency rules

## What to keep identical across cells

- Camera focal length
- Camera distance to product
- Camera angle (yaw / pitch / roll)
- Lighting rig (key + fill + rim positions and strengths)
- Background color / material
- Material color space + render settings
- Render engine + samples

## What can vary across cells

- Product (the obvious one)
- Per-product material color / variant (if intentional)
- Minor scale variation if products are inherently different sizes (handle by camera distance, not by cell variation)

## What must NOT vary

- Light direction relative to camera
- Background tone
- Color management settings
- Render samples / quality

## Strict vs loose consistency

| Mode | Use case |
|---|---|
| Strict | E-commerce / catalog (everything identical) |
| Loose | Editorial spread (minor variation OK; flag explicitly) |

## How to verify

After render, inspect each cell at full resolution side-by-side. Differences in:
- product color → likely material variant or color management mismatch.
- shadow direction → lighting drift.
- background tone → background drift.
- product silhouette → camera drift.

Each of these indicates a consistency failure.

## Single-render vs separate-renders

| Approach | Pros | Cons |
|---|---|---|
| Single render of whole grid | Guaranteed consistency | High memory if many products |
| Separate render per product, composited | Lower memory; per-product re-render easy | Risk of inconsistency between renders |

Recommend single render unless memory forces split.

## Related skill
`../SKILL.md`
