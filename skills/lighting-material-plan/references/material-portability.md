# Material Portability

## Purpose
Document shader and material assumptions early in `lighting-material-plan` so Blender Cycles/EEVEE lookdev translates predictably to real-time glTF 2.0 (`.glb`), Three.js, React Three Fiber, Unreal, or Unity without silent visual breakage.

## When to use
- Whenever the deliverables include `.glb` / Web 3D / real-time engine handoff alongside or instead of offline Cycles stills.

## Blender -> glTF 2.0 Portability Matrix

| Feature / Node Pattern | Cycles / EEVEE Offline | glTF 2.0 (`.glb`) / Three.js Behavior | Required Portability Action |
|---|---|---|---|
| **Principled BSDF core inputs** (`Base Color`, `Metallic`, `Roughness`, `Normal`, `Emission`) | Native | Supported directly via standard glTF PBR metallic-roughness | Drive directly via uniform values or baked image textures (`sRGB` color, `Non-Color` data) |
| **Procedural Noise / Voronoi / Musgrave / ColorRamp chains** | Native, infinite resolution | **Dropped silently** on glTF export (`Export failed` or blank default white/grey) | Bake procedural chains to `1024-2048 px` `Image Texture` maps before `.glb` export |
| **Coat / Transmission / Sheen / Anisotropy** | Native BSDF lobes | Requires `KHR_materials_clearcoat`, `KHR_materials_transmission`, `KHR_materials_sheen`, `KHR_materials_anisotropy` | Verify target viewer supports extension (Three.js `MeshPhysicalMaterial` yes; budget mobile viewers may ignore) |
| **Subsurface Scattering (SSS) / Custom Shader Math / Mix Shader stacks** | Native Cycles raytrace | Unsupported or approximated poorly in glTF PBR | Replace with baked translucent/tint textures + standard `Principled BSDF` for real-time builds |
| **Blender 4.x / 5.x `Specular IOR Level` & `Transmission Weight`** | Native | Exported via `KHR_materials_ior` / `KHR_materials_specular` | Keep `IOR = 1.5` default for plastics/organics unless intentionally overriding glass/water (`1.33-1.52`) |

## Handoff Checklist
1. Separate **offline-only lookdev layers** (deep SSS, volumetric mist, complex procedural shaders) from **baked real-time web materials**.
2. Keep baked material count low (`<= 4-6` materials per hero asset) to stay under `mobile-glb-budget` draw-call limits.
3. Explicitly note which KHR material extensions (`clearcoat`, `transmission`, `emissive_strength`) the web viewer must enable.

## Related skill
[../SKILL.md](../SKILL.md)
