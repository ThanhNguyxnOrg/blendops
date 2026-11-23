# Resolution defaults per use case

## Standard (no retina)

| Use case | Resolution | Notes |
|---|---|---|
| Web hero 16:9 | 1920×1080 | Default |
| Square social IG feed | 1080×1080 | Old IG |
| Portrait social 4:5 | 1080×1350 | Modern IG portrait |
| Stories / Reels 9:16 | 1080×1920 | Vertical mobile |
| Email header | 600×200 to 1200×400 | Per client requirement |
| App icon | 1024×1024 | Master; downscale to per-platform sizes |

## Retina / 2x (high-DPI displays)

| Use case | Resolution |
|---|---|
| Web hero 16:9 retina | 2880×1620 |
| Square retina | 2160×2160 |
| Portrait retina | 2160×2700 |
| Stories retina | 2160×3840 |

Render at retina, downscale for standard. Upscaling never works.

## Print

300 DPI is the standard print resolution.

| Use case | Pixel resolution at 300 DPI |
|---|---|
| A4 portrait | 2480×3508 |
| A4 landscape | 3508×2480 |
| A3 portrait | 3508×4961 |
| US Letter | 2550×3300 |
| Tabloid (11×17) | 3300×5100 |
| Poster A2 | 4961×7016 |

## Cinema / 4K / 8K

| Use case | Resolution |
|---|---|
| 1080p HD | 1920×1080 |
| 1440p QHD | 2560×1440 |
| 4K UHD | 3840×2160 |
| DCI 4K | 4096×2160 |
| 8K | 7680×4320 |
| DCI 8K | 8192×4320 |

## Choosing resolution

- Render at the delivery resolution × 1.5 if downscale-quality matters; otherwise render at delivery exactly.
- Upscaling = bad. Downscaling = fine.
- Memory + time scale with pixel count; verify render machine can handle.

## Resolution mismatch verdicts

| Situation | Verdict |
|---|---|
| Render res = delivery res or higher | Pass |
| Render res < delivery res | Fail (upscaling required) |
| Render res > 1.5× delivery res | Warn (wasted time / memory) |

## Related skill
`../SKILL.md`
