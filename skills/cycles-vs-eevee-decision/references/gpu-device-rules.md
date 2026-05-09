# GPU device rules (Cycles)

## Device options

| Device | Hardware | Speed (relative) |
|---|---|---|
| OPTIX | NVIDIA RTX (RTX 20 / 30 / 40 / Ada / Hopper) | Fastest (RT cores accelerate) |
| CUDA | NVIDIA (any modern) | Fast (no RT cores acceleration) |
| METAL | Apple Silicon (M1 / M2 / M3 / M4) | Fast on Apple GPU |
| HIP | AMD (RDNA 2 / 3 / 4) | Fast |
| ONEAPI | Intel Arc / iGPU | Moderate |
| CPU | Any CPU | Slowest (10-50x slower than GPU) |

## Choosing on a multi-GPU / iGPU system

- OPTIX > CUDA on the same NVIDIA card; always pick OPTIX if available.
- METAL on Apple Silicon; never CPU-only on Apple Silicon for Cycles.
- HIP on modern AMD; CPU fallback if older AMD.
- Combine GPU+CPU rendering: append `+CPU` to GPU device (e.g., `OPTIX+CPU`); only marginal improvement on most systems.

## Memory considerations

- GPU rendering is limited by VRAM.
- Out-of-VRAM symptoms: render fails / falls back to CPU / artifacts.
- With OPTIX / CUDA / HIP, Blender can spill to system RAM with performance hit.
- Reduce: texture sizes, mesh polycount, hair density.

## CLI usage

For headless / CI:

```
blender -b file.blend -P script.py -- --cycles-device OPTIX
```

The `-- --cycles-device` syntax separates Blender args from CLI override.

## Memory + samples interaction

- High samples + high resolution + complex scene → may exceed VRAM.
- Reduce one of: samples, resolution, scene complexity.
- Or render in tiles (Cycles supports tile-based rendering).

## Common errors

- "CUDA out of memory" → reduce textures or resolution.
- "OPTIX not available" → driver / Blender version mismatch; verify Blender version supports OPTIX.
- "Slow Cycles on RTX" → forgot to enable OPTIX; verify Render properties → Device.

## Related skill
`../SKILL.md`
