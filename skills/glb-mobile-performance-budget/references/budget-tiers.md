# Mobile-web GLB Budget Tiers

These are **planning ceilings**, not benchmarks. Always pair with measurement (`render-export-evidence` + `blender-scene-quality-checker`) before claiming compliance.

## Tier table

| Tier | Triangles | GLB file (Draco) | Textures | Draw calls | Bones | Morph targets |
|---|---|---|---|---|---|---|
| Low-end Android (Snapdragon 4xx, 2GB RAM) | ≤ 25K | ≤ 2 MB | 2 × 512 px | ≤ 10 | ≤ 25 | 0 |
| Mid-mobile (mass-market 2024+) | ≤ 50K | ≤ 4 MB | 4 × 1024 px | ≤ 20 | ≤ 50 | ≤ 4 |
| High-mobile (flagship phones) | ≤ 100K | ≤ 8 MB | 6 × 2048 px | ≤ 50 | ≤ 100 | ≤ 8 |
| Desktop fallback | ≤ 250K | ≤ 20 MB | 8 × 2048 px | ≤ 100 | ≤ 200 | ≤ 16 |

## Context modifiers

- **AR viewer**: drop one tier (e.g. mid-mobile → low-end values).
- **Configurator with material variants**: +50% material count, but cap GLB at the tier's base.
- **Hero card / e-commerce**: tier values as-is.
- **Environment / scene with multiple objects**: budget the *whole scene*, not per-object.

## Headroom rule

Reserve 20% headroom against the hard cap. A "50K triangle" budget plan should aim for 40K and treat 50K as the absolute ceiling.

## Why per-tier numbers matter

A 50K-triangle GLB on a low-end Android can stutter; the same GLB on a flagship is trivial. Do not give a single global "mobile" number.

## Related skill
`../SKILL.md`
