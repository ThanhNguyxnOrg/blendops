# Engine feature matrix

| Feature | Cycles | Eevee Next (Blender 4.2+) | Eevee (legacy) | Workbench |
|---|---|---|---|---|
| Path-traced GI (accurate) | Y | Approximated | Approximated | N |
| Caustics | Y (with caustic flag) | Approximate | Approximate | N |
| Subsurface Scattering | Y (accurate) | Y (approximate) | Y (approximate) | N |
| Volumetrics with light interaction | Y | Y (improved Eevee Next) | Y (limited) | N |
| Refraction (accurate IOR) | Y | Y (with shadows) | Limited | N |
| Hair / particles fully | Y | Y | Y (limited) | Y (basic) |
| Real-time preview | N | Y | Y | Y |
| Denoiser | OPTIX / OIDN | Built-in | N | N |
| Render times | Slow (minutes) | Fast (seconds) | Fast (seconds) | Instant |
| GPU support | OPTIX / CUDA / HIP / METAL / ONEAPI / CPU | GPU rasterization | GPU rasterization | GPU |

## When each engine wins

| Use case | Engine |
|---|---|
| Final hero with realistic light | Cycles |
| Lookdev / iteration | Eevee Next |
| Animation with tight budget | Eevee Next (or Cycles GPU + denoiser if budget allows) |
| Stylized / non-PBR | Eevee Next |
| Clay / wireframe / shading test | Workbench |
| HDR scene with caustics | Cycles |
| Real-time interactive preview | Eevee Next |

## Eevee Next vs Eevee (legacy)

Eevee Next (Blender 4.2+) significantly improves:
- GI quality (Light Probe Volumes)
- Volumetrics
- Refraction
- Render quality at default settings

Use Eevee Next over legacy Eevee for any new project on Blender 4.2+.

## Related skill
`../SKILL.md`
