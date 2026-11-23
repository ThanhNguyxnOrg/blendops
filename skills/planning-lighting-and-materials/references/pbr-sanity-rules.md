# PBR sanity rules

These are quick-fail / warn rules for catching common mistakes in PBR material values. They do not replace careful art direction — they catch obvious errors only.

## Albedo (base color) rules

| Value | Verdict | Why |
|---|---|---|
| (1, 1, 1) pure white | Warn | Real-world materials reflect ≤ 0.95 |
| (0, 0, 0) pure black | Warn | Even charcoal reflects ~0.04 |
| Above (0.95, 0.95, 0.95) | Warn | Likely too bright; clouds and snow are the closest exceptions |
| Below (0.04, 0.04, 0.04) | Warn | Likely too dark; reserved for soot |
| Saturated primary (1, 0, 0) | Warn | Pure RGB primaries are rare; investigate |

## Roughness rules

| Value | Verdict | Why |
|---|---|---|
| 0.0 | Warn | Perfect mirror; rare in real surfaces |
| 1.0 | Warn | Perfectly diffuse; most surfaces have some specular |
| Texture but constant | Warn | Likely intentional but cheaper as scalar |
| Texture stored in sRGB | Fail | Roughness is data, must be linear |

## Metallic rules

| Value | Verdict | Why |
|---|---|---|
| 0 (dielectric) | Pass | Default for plastic / wood / fabric |
| 1 (metal) | Pass | Default for raw metal |
| Between 0 and 1 (constant) | Warn | PBR metallic is binary in physics; intermediate values are non-physical |
| Texture with intermediate values | Warn | Acceptable for transitions (rust, chips); review |
| Texture stored in sRGB | Fail | Metallic is data, must be linear |

## Normal map rules

| Property | Required for glTF | Notes |
|---|---|---|
| Color space | Linear (Non-Color) | Never sRGB |
| Y axis convention | OpenGL `+Y` up | DirectX `-Y` requires inversion before export |
| Strength | Default 1.0 unless intentional | Strength != 1 may indicate baking issue |
| Tangent space | Tangent space (not object/world) | Object-space normals do not export to glTF |

## Occlusion / Roughness / Metallic packing (ORM)

For glTF, prefer ORM channel-packed:
- R = Occlusion
- G = Roughness
- B = Metallic

Saves draw calls and file size. Other packings exist but ORM is the glTF convention.

## Real-world PBR numeric lookup (Principled BSDF)

Use these calibrated starting ranges when reviewing material plans or snapshots (`Roughness` linear; `Base Color` calibrated, never clipped):

| Surface | Base Color (linear range) | Metallic | Roughness | IOR | Notes |
|---|---|---|---|---|---|
| Charcoal / Soot | `0.03–0.06` | `0.0` | `0.80–0.95` | `1.50` | Never pure `(0,0,0)` |
| Matte plastic / ABS | `0.05–0.75` | `0.0` | `0.35–0.65` | `1.46–1.55` | Add ±15–25% subtle roughness variation |
| Glossy lacquered plastic | `0.05–0.80` | `0.0` | `0.08–0.22` | `1.49` | Optional subtle Clearcoat (`Coat Weight`) |
| Unfinished / natural wood | `0.15–0.45` warm brown | `0.0` | `0.50–0.80` | `1.50` | Lacquered wood drops roughness to `0.15–0.30` |
| Brushed steel / iron | `(0.54, 0.56, 0.58)` | `1.0` | `0.25–0.45` | — | Use `Anisotropic` for directional brush lines |
| Chrome / mirror metal | `(0.55, 0.56, 0.56)` | `1.0` | `0.02–0.10` | — | Pure mirror `0.0` still flags Warn; use `0.02+` |
| Brushed aluminum | `(0.91, 0.92, 0.93)` | `1.0` | `0.20–0.40` | `1.39` | Metal tint sits cleanly below `0.95` |
| Gold | `(1.00, 0.77, 0.34)` | `1.0` | `0.10–0.35` | — | Saturated metallic tint, never diffuse yellow |
| Copper | `(0.95, 0.64, 0.54)` | `1.0` | `0.12–0.38` | — | Oxidized patina shifts to non-metallic green |
| Glass / crystal | `(0.95, 0.98, 1.00)` | `0.0` | `0.01–0.08` | `1.50–1.52` | Requires `Transmission Weight` + thickness check |
| Water (clear) | `(0.95, 0.98, 1.00)` | `0.0` | `0.01–0.05` | `1.333` | Refractive web viewers require `KHR_materials_transmission` |
| Fabric / cloth | `0.08–0.75` | `0.0` | `0.75–0.95` | `1.50` | Pair with `Sheen Weight` for velvet/cotton |

## Surface realism layering & shader hygiene (Blender 4.x / 5.x)

- **Flat roughness smells synthetic**: Flag uniform scalar roughness on hero props if variation (`±15–25%` micro breakup) is missing.
- **Physical wear stack**: Realistic weathered materials layer from inside out: **clean base → convex edge wear (metal/primer) → rust in cavities → crevice grime `(1 − AO)` → top-facing dust (`+Z` normal)**. For glTF/game targets, complex procedural masks must be baked to texture maps before export.
- **5.x API safety**: Treat `material.use_nodes` as legacy/deprecated in Blender 5.x (materials carry node trees natively), resolve `Principled BSDF` inputs by name (`Specular IOR Level`, `Coat Weight`, `Transmission Weight`), and verify transparency mode (`DITHERED` cutout vs `BLENDED` glass) matches consumer capability.

## Related skill
`../SKILL.md`
