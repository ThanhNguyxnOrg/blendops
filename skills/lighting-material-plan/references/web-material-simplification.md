# Web Material Simplification

## Purpose
Define clear material simplification tiers so Blender scenes meet interactive Web 3D (Three.js / React Three Fiber / mobile) size and frame-rate budgets without losing hero visual identity.

## When to use
- When targeting interactive Web 3D, mobile AR/QuickLook, or multi-product web configurators where `<= 2-10 MB` GLB and `60 fps` frame times matter.

## Three Simplification Tiers

| Tier | Target Consumer | Texture & Material Budget | Simplification Rules |
|---|---|---|---|
| **Tier 1: High-Fidelity Desktop Showcase** | Desktop WebGL hero landing, studio showcase (`<= 10 MB` GLB) | `<= 6` materials, `2048 px` max textures, KTX2/WebP, Clearcoat & Emissive Strength allowed | Bake complex procedural Blender nodes to ORM (`AO + Roughness + Metallic` packed into R/G/B) + BaseColor + Normal |
| **Tier 2: Balanced E-Commerce / Responsive Web** | Desktop + mid-range mobile (`<= 5 MB` GLB, `< 1.5s` load) | `<= 4` materials, `1024 px` textures (one `2048 px` allowed for hero logo/sole), Meshopt + WebP/KTX2 | Collapse minor micro-detail bump into single normal map; replace multi-layer transparency with alpha-cutout or simple opacity `Blend` |
| **Tier 3: Conservative Mobile / AR / Configurator** | Low-end mobile, multi-object catalog grid (`<= 2 MB` GLB, `< 15` draw calls) | `<= 2-3` materials, `512-1024 px` packed atlases, standard glTF metallic-roughness only (no heavy transmission) | Drop `Transmission`/glass refraction (use glossy tinted specular instead); merge static meshes by material; share textures across variants |

## Decision Rule
1. Choose **Tier 2** as the default whenever user asks for "web-ready GLB" without specifying desktop-only.
2. Drop to **Tier 3** immediately if the product loads in a mobile feed, AR preview, or multi-SKU grid (`product-grid-scene-planner`).
3. Always record the chosen Tier and any visual trade-off (e.g., "dropped refractive glass transmission in favor of tinted clearcoat for `60 fps` mobile parity") in the `glb-web-handoff` caveats block.

## Related skill
[../SKILL.md](../SKILL.md)
