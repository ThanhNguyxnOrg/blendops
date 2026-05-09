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

## Related skill
`../SKILL.md`
