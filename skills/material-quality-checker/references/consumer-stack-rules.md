# Consumer stack compatibility rules

## glTF (web) consumer

### Allowed shader nodes (Blender → Principled BSDF subset)
- Principled BSDF (base color, metallic, roughness, normal, emission, alpha, IOR, clearcoat with KHR_materials_clearcoat)
- Material Output
- Image Texture (linked to one of the above)
- Normal Map (with strength = 1 for safe export)

### Version-safe socket access (Principled BSDF)
- Principled BSDF's input set changes across Blender versions (sockets such as Diffuse Roughness arrived after 4.0, shifting what sits behind each position). Access inputs by **name**, never by index (`inputs[7]`).
- On Blender 5.x some sockets (e.g. Subsurface IOR, Weight) ship disabled, and a disabled socket can break name-keyed lookups. Resolve by iterating `node.inputs` and matching `.name`; treat a missing or disabled socket as an optional feature, not an error.
- A recipe that hardcodes an input position or assumes a socket exists may attach values to the wrong slot on another Blender version. Mark any version-dependent assumption in the verdict Notes.

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

Most Principled features supported (Blender 4.2+ Eevee Next). Some clearcoat / iridescence / volume effects approximated. Use Eevee preview as a rough check, not a final compatibility test for glTF.

## Verdict guidance

- A material that uses only the Principled subset → likely Pass for glTF.
- A material with one KHR extension → Warn until consumer support confirmed.
- A material with OSL or driver → Fail for glTF.

## Related skill
`../SKILL.md`
