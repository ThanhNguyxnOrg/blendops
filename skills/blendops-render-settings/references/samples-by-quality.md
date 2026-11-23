# Samples by quality bar

## Cycles

| Quality bar | Samples | Time per frame (typical) |
|---|---|---|
| Preview / draft | 32 | < 1 minute |
| Lookdev | 64-128 | 1-3 minutes |
| Animation frame | 64-256 (with denoiser) | 1-5 minutes |
| Hero final | 128-512 (with denoiser) | 5-30 minutes |
| Print / archival final | 512-2048+ | 30 minutes - hours |

Always enable denoiser (OPTIX or Open Image Denoise) for animation and final.

## Eevee Next

| Quality bar | Render samples | Light Probe samples | Time per frame |
|---|---|---|---|
| Preview / draft | Default 16 | Default 16 | < 1 second |
| Lookdev | 32-64 | 32-64 | 1-3 seconds |
| Animation | 32-64 | 64-128 | 1-5 seconds |
| Hero final (Eevee suitable) | 128-256 | 128-256 | 5-30 seconds |

## Eevee (legacy)

Similar to Eevee Next but without the improved GI sampling. Adjust accordingly.

## Adaptive sampling (Cycles)

Cycles supports adaptive sampling — render fewer samples in low-noise regions. Enable for hero work to reduce time without quality loss.

Threshold:
- 0.01 = high quality, slow
- 0.05 = balanced
- 0.1 = fast, more noise

## Per-feature sample considerations

- Caustics need extra samples (256+).
- Volumetrics need extra samples or higher light probe quality.
- Subsurface scattering benefits from higher samples.
- Stylized / NPR work can run with fewer samples.

## Verifying sample count

After test render, look for:
- Noise / grain in dark areas → samples too low.
- Splotchy / patchy lighting → samples too low or denoiser too aggressive.
- Smooth gradients → samples adequate.
- Acceptable but not perfect → likely good for animation.

## Related skill
`../SKILL.md`
