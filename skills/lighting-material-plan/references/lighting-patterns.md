# Lighting Patterns & Energy Calibration

## Purpose
Provide reusable lighting rig patterns with explicit energy ratios, softness rules, and web-portability notes for product and prop lookdev planning.

## When to use
During lighting and material planning before committing to render-engine settings or GLB environment baking.

## Canonical Studio & Mood Patterns

| Pattern | Ratio (`Key : Fill : Rim`) | Light Geometry & Softness | Color Temp Pairing | Best Use Case |
|---|---|---|---|---|
| **Commercial Clean 3-Point** | `4 : 1 : 2` | Large overhead/45° softbox key (`size 1.5–3m`), gentle broad fill (`5500K`), sharp crisp edge rim | Key `5500K` (Neutral) / Fill `6000K` / Rim `5000K` | E-commerce products, footwear, electronics, white/neutral sweeps |
| **High-Contrast Editorial** | `8 : 1 : 3` | Narrow directional soft key (`size 0.6–1.0m`), negative fill black card on shadow side, strong graze rim | Key `4800K` warm / Rim `7200K` cool ice | Dramatic launch stills, luxury hardware, anodized metals |
| **Cool-Key / Warm-Rim Cyberpunk** | `3 : 0.8 : 2.5` | Dual colored rim strips (`Area` bars tight beam spread), soft neutral top fill for legibility | Rim A Cyan `#00E5FF` / Rim B Magenta `#FF2A85` / Subtle Neutral Fill `5200K` | Futuristic footwear, tech props, dark glossy plinths |
| **Portable IBL / glTF Safe Rig** | Environment HDRI (`strength 0.8–1.4`) + `1–2` simple directional/punctual accents | Minimal area lights translated cleanly into Three.js directional/spot + PMREM HDRI | Matched HDRI dominant temperature | Assets exporting to Web `.glb` where Blender area shapes don't transfer 1:1 |

## Rules Against Flat or Blown-Out Rigs
- Avoid `1 : 1 : 1` flat equal energy across key/fill/rim — silhouettes lose depth immediately.
- Never crank a small area light past reasonable dynamic range without checking `False Color` exposure under `AgX` (`<= +2 stops` on hero highlights).
- Separate dark products from dark studio backgrounds using an explicit Grazing Rim (`backlight` `15°–30°` behind subject).

## Good example
"Editorial hardware rig uses `6:1:2.5` ratio (`5600K` soft overhead key + dark bounce card + `7000K` crisp right rim) paired with low-intensity subtle neutral HDRI (`0.25`) so Three.js `<Environment>` preview maintains clear specular separation."

## Bad example
"Add 3 lights around the product to make it bright."

## Related skill
- [SKILL.md](../SKILL.md)
