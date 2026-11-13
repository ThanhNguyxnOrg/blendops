# Cyberpunk & Neon Lookdev Discipline

## Purpose
Keep high-saturation neon/cyberpunk lighting legible and physically believable so product silhouettes and material breakup stay sharp instead of turning into mud or clipping to white/neon mush.

## When to use
Whenever a user requests neon, sci-fi, dark studio, cyber-product, or glowing accent lookdev.

## Core Calibration Guardrails
1. **Reserve 70%+ neutral anchor**: Keep the base studio rig / ambient key neutral (`4800K–5800K` low-energy directional key) so surface albedo and fabric/metal distinctions remain readable; apply neon (`Cyan #00F0FF`, `Magenta #FF2975`, `Acid Lime`) strictly on rim lights and controlled emissive strips.
2. **Emission strength discipline under `AgX`**: Under Blender `AgX` / Three.js `NeutralToneMapping`, high `Emission Strength` (`> 8–20`) naturally desaturates core pixels toward white. Keep crisp saturated accents in `2.0 – 5.5` range (and subtle halo bloom in post/compositor rather than blowing out raw RGB).
3. **Never place neon bloom directly behind primary thin typography or edges**: Offset bright emissive geometry cards outside primary silhouette outline or soften into floor bounce.
4. **Web GLB portability warning**: Cycles area-mesh bounce illumination and volumetric fog do **not** export inside `.glb`. Plan an explicit fallback for web delivery: crisp emissive texture channel (`emissiveMap`), baked subtle environment light, and optional Three.js `<Bloom luminanceThreshold={1.1} mipmapBlur />` note (`gltf-web-handoff`).

## Good example
"Uses neutral soft top key (`5400K`, weight 4) to preserve sneaker mesh knit pattern, dual Cyan/Magenta strip rims (`intensity 3.5`) separating sole silhouette, and documented `.glb` emissive-texture + post-bloom fallback."

## Bad example
"Put blinding purple + pink point lights at power 5000W inside volumetric fog and expect the GLB to look identical in Chrome."

## Related skill
- [SKILL.md](../SKILL.md)
