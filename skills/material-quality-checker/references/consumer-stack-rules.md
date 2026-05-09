# Consumer stack compatibility rules

## glTF (web) consumer

### Allowed shader nodes (Blender → Principled BSDF subset)
- Principled BSDF (base color, metallic, roughness, normal, emission, alpha, IOR, clearcoat with KHR_materials_clearcoat)
- Material Output
- Image Texture (linked to one of the above)
- Normal Map (with strength = 1 for safe export)

### Disallowed (or fragile) nodes for glTF export
- OSL (Open Shading Language) custom shaders → Fail
- Procedural noise / wave / voronoi (must be baked first) → Fail unless baked
- Drivers on material values → Fail (export does not capture driver state)
- Node groups with non-Principled outputs → Warn / Fail

### KHR extensions (need consumer confirmation)
- `KHR_materials_unlit` (flat / shadeless) — most consumers support
- `KHR_materials_transmission` — modern Three.js / Babylon support
- `KHR_materials_volume` — modern only
- `KHR_materials_ior` — modern only
- `KHR_materials_specular` — modern only
- `KHR_materials_clearcoat` — modern only
- `KHR_materials_emissive_strength` — modern only
- `KHR_materials_anisotropy` — limited support (verify)
- `KHR_materials_iridescence` — limited support
- `KHR_materials_variants` — required for configurator variant swaps

If any of the above is used, document the consumer's confirmed support level. Do not assume.

## Cycles render-only

Almost everything is allowed. Sanity rules still apply (PBR plausibility, color space). Texture format rules relax (EXR, Float OK).

## Eevee preview

Most Principled features supported (Blender 4.x+ Eevee Next). Some clearcoat / iridescence / volume effects approximated. Use Eevee preview as a rough check, not a final compatibility test for glTF.

## Verdict guidance

- A material that uses only the Principled subset → likely Pass for glTF.
- A material with one KHR extension → Warn until consumer support confirmed.
- A material with OSL or driver → Fail for glTF.

## Related skill
`../SKILL.md`
