# Texture budget rules

## Per-material texture count

| Tier | Recommended max textures per material |
|---|---|
| Low-end Android | 2 (albedo + ORM) |
| Mid-mobile | 4 (albedo + ORM + normal + emission) |
| High-mobile | 6 |
| Desktop fallback | 8 |

## Per-texture resolution

| Tier | Max single-texture resolution |
|---|---|
| Low-end Android | 512² |
| Mid-mobile | 1024² |
| High-mobile | 2048² |
| Desktop fallback | 2048²+ allowed |

## Total scene texture pixel budget

Sum the pixel area of every unique texture (do not double-count shared textures across materials). Compare against the pinned tier budget from `glb-mobile-performance-budget`.

## Resolution-vs-tier overrides

A 4K hero texture is fine on desktop, fails on mid-mobile. Always evaluate textures **against the pinned tier**, not against absolute caps.

## Power-of-two enforcement

| Stack | Rule |
|---|---|
| glTF / Three.js (modern) | Non-power-of-two textures work but waste memory; recommend POT |
| WebGL 1 / older mobile | Non-POT textures degrade or fail; require POT |
| Cycles render-only | Any resolution acceptable |

## Format rules per consumer

| Consumer | Allowed formats |
|---|---|
| glTF mobile | JPG (color) + PNG (alpha) + WebP (color/alpha) + KTX2 (preferred) |
| glTF desktop | Same + PNG color OK |
| Cycles render | EXR / PNG / TIFF / Float — anything Blender supports |

EXR or float in glTF → Fail.

## Related skill
`../SKILL.md`
