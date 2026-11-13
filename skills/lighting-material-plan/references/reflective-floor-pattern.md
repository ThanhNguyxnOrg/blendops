# Reflective Floor & Ground Plinth Pattern

## Purpose
Achieve grounded dark-gloss reflections under hero products without creating noisy fireflies, mirror distraction, or broken contact shadows in web GLB consumers.

## When to use
Dark studio plinths, glossy showroom floors, cyber-wet slabs, or acrylic pedestals.

## Production Rules
1. **Never use mirror-zero roughness (`0.00`)**: Pure mirror reflections duplicate the entire upside-down model and compete visually with the real silhouette. Target base `Roughness = 0.10 – 0.24` with subtle large-scale roughness noise (`±0.05` variation) so reflections smear cleanly toward the viewer.
2. **Dark slate albedo bounds (`0.02 – 0.06` linear)**: Keep floor Albedo around `0.025 – 0.05` dark charcoal rather than pure `#000000` black so ambient grazing sheen & floor-to-horizon vignette gradients still read cleanly.
3. **Strict `Z = 0` flush contact**: Every floor/plinth hero must touch `Z = 0.0` (or float only when intentional turntable/levitation brief says so, with explicit shadow catcher). Even a `3mm` unintended gap breaks visual weight.
4. **Web / glTF Grounding Caveat**: Standard `.glb` meshes do **not** include Blender's procedural shader-node roughness variation unless baked to a roughness map, and real-time Three.js `MeshStandardMaterial` does not trace sharp planar mirror reflections automatically. Flag web handoff choice explicitly (`ContactShadows` + dark matte floor OR Three.js `MeshReflectorMaterial` note).

## Good example
"Matte-gloss charcoal plinth (`Base Color 0.035`, `Roughness 0.16 ± 0.04` baked noise map), shoe outsole anchored at `Z = 0.000`, with explicit R3F `<ContactShadows>` handoff fallback."

## Bad example
"`Roughness = 0.0` pitch-black floor mirroring 100% sharp reflection while Cycles renders fireflies."

## Related skill
- [SKILL.md](../SKILL.md)
