# Cyberpunk Shoe Example

## Purpose
Provide a concrete, end-to-end reference plan matching the canonical `docs/recipes/cyberpunk-shoe-hero.md` golden path so `product-hero-scene-planner` outputs maintain consistent depth and truth discipline.

## When to use
- As a structural and quality benchmark whenever planning stylized/futuristic product heroes, dark reflective studio scenes, or hybrid still + web `.glb` briefs.

## Canonical Benchmark Scene Plan (Text-Only Planning Example)
- **Hero Subject & Footprint**: Sculpted futuristic sneaker (`~0.30 m` length x `0.11 m` width x `0.14 m` height), hovering at `Z = +0.06 m` (`12 deg` toe-down dynamic pitch, `35 deg` yaw) above a dark studio floor plane at `Z = 0.00 m`.
- **Camera Composition**: `65 mm` telephoto lens (`f/5.6`), `16:9` (`1920x1080`) split framing — hero shifted slightly right (`shift_x: -0.06`) leaving left `40%` clean dark atmospheric gradient for headline typography; hero occupies `~52%` of frame height.
- **Three-Layer Lighting**:
  1. **Cool Key (`Area`, 5600K)**: Soft overhead-front 45 deg key illuminating vamp mesh & stitching.
  2. **Cyan Rim (`Area`, 7500K-8000K / `#00E5FF` tint)**: Rear-left grazing rim separating sole silhouette from deep navy backdrop (`#0A0E17`).
  3. **Magenta Accent (`Area` / Emissive Strip, `#FF2A85`)**: Opposite lower-right rim catching heel counter + glossy floor bounce.
- **Materials & Web Handoff Caveats**: Matte tech-mesh upper (`Roughness 0.72`), satin TPU heel clip (`Roughness 0.28`), emissive sole groove (`Emission Strength 2.5`), dark satin acrylic floor (`Roughness 0.18`, subtle fade radial falloff). For `.glb` web export, procedural weave bump bakes to a `1024 px` normal map (`Tier 2` budget `<= 45k` tris).
- **View Transform**: `AgX` (`Medium High Contrast`) for hero still PNG; note `Khronos PBR Neutral` parity check if brand colors require exact hex reproduction in Three.js.

## Truth Label Discipline (Required at Footer)
```txt
Mode: Planning-only (text spec)
Runtime status: Not Run
Artifact status: Not Produced (no .blend, PNG render, or .glb file created in this planning step)
Next step: Validate pack prerequisites (`pack-prerequisite-checker`) or select Path 1 / Path 2 / CLI to execute.
```

## Related skill
[../SKILL.md](../SKILL.md)
