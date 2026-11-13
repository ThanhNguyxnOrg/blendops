# Performance Caveats & Honest Budget Framing

## Purpose
Capture realistic web/mobile 3D performance risks and VRAM constraints without guessing or claiming unmeasured FPS targets.

## When to use
Whenever preparing GLB web handoff caveats, reviewing mobile budgets, or auditing scene complexity gaps.

## Quantified Caveat Categories

| Risk Category | Concrete Metric to Flag | Real User Impact | Corrective Action |
|---|---|---|---|
| **Payload Transfer Size** | Raw uncompressed `.glb > 5 MB` (hero) or `> 15 MB` (scene) | Slow initial FCP/LCP on cellular (`4G` takes `4–12s+`) | Apply `EXT_meshopt_compression` / WebP / KTX2 (`mobile-glb-budget`) |
| **GPU Texture VRAM (`Uncompressed`)** | Uncompressed RGBA GPU footprint = `width × height × 4 bytes × 1.33 mipmaps` (e.g. one `4096²` PNG = `~89 MB` VRAM!) | Mobile Safari / Chrome Android WebGL context loss & crash | Cap mobile hero textures at `1024²` or `2048²` **packed KTX2 (UASTC/ETC1S)** |
| **Draw Calls & Material Slots** | `> 25–40` distinct materials or unmerged static small parts | CPU JS/WebGL frame stall even at moderate triangle counts | Merge static parts per material (`≤ 8–16` draw calls for hero) |
| **Transparent Overdraw** | Stacked alpha-blended meshes or full-screen `Transmission` passes | Multiplies WebGL fragment shader cost on mobile GPUs | Use `OPAQUE` or `MASK` cutout where possible; avoid nested transmission |
| **Runtime Coverage Gap** | Verified only via `gltf-validator` / container header (`Not Run` in browser) | Actual frame time, lighting mood, and shader compile lag remain unknown | Explicitly label `Live browser performance: Not Run` and list target device test next |

## Good example
"GLB container inspected (`2.4 MB`, `18.2k` triangles, `4` materials). Uncompressed `2048²` PNG maps require further KTX2 testing on iOS Safari; browser FPS probe: `Not Run`."

## Bad example
"Runs smoothly at 60 FPS everywhere." (Unmeasured claim with zero device/VRAM evidence.)

## Related skill
- [SKILL.md](../SKILL.md)
