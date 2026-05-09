# Per-mesh budget rules

The pinned budget from `glb-mobile-performance-budget` provides total cap. Per-mesh caps split the total intelligently.

## Default per-mesh cap (% of total)

| Scene type | Largest mesh max % of total |
|---|---|
| Single hero product | 80% (one mesh dominates by design) |
| Multi-product / configurator | 50% (no single mesh > half) |
| Environment / scene | 40% (distribution across many meshes) |

## Skinned mesh extra rules

| Tier | Per-skinned-mesh cap |
|---|---|
| Low-end Android | 8K triangles |
| Mid-mobile | 20K |
| High-mobile | 40K |
| Desktop | 100K |

Skinned meshes have a non-linear performance cost; per-mesh cap applies in addition to total.

## Combined verdict

A mesh that is:
- under per-mesh cap AND total under total cap → row Pass.
- over per-mesh cap but total still under cap → row Warn (one mesh dominates).
- over per-mesh cap AND total exceeded → row Fail.

## Hidden mesh exclusion

Meshes hidden in viewport or disabled in collection should not count. But export options vary by stack — verify the export will actually exclude them before claiming compliance.

## Related skill
`../SKILL.md`
