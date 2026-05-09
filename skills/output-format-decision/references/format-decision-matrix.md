# Format decision matrix

| Consumer | Format | Bit depth | Color space | Compression | Alpha |
|---|---|---|---|---|---|
| Web hero | PNG | 8-bit | sRGB | Lossless | Optional |
| Web hero (modern browser) | WebP | 8-bit | sRGB | Quality 85-95 | Optional |
| JPEG-only | JPG | 8-bit | sRGB | Quality 85-95 | No |
| VFX / Film | OpenEXR | 16-bit half | Linear | ZIP | Channel |
| Print | TIFF | 16-bit | sRGB / soft-proof CMYK | LZW / None | Optional |
| Social / mobile | WebP / JPG | 8-bit | sRGB | Quality 85-90 | Optional |
| HDR display | PNG 16 / EXR | 16-bit | sRGB / Linear | Lossless | Optional |
| Game engine albedo | PNG / WebP | 8-bit | sRGB | Lossless / Quality 90+ | Optional |
| Game engine data (roughness, etc.) | PNG / WebP | 8-bit | Linear | Lossless | No |
| Animation video | MP4 / WebM | 8-bit | sRGB | H.264 / VP9 / AV1 | No |

## Why each row

- **Web hero**: PNG default; WebP for smaller files; no JPG for hero (artifacting).
- **VFX / Film**: EXR mandatory; lossy formats lose HDR data and downstream grade headroom.
- **Print**: TIFF preserves bit depth for print prep tools.
- **Social / mobile**: WebP wins on size; JPG fallback.
- **HDR display**: PNG 16 or EXR; verify consumer supports HDR.
- **Game engine**: PNG / WebP per channel role; verify engine-specific texture import settings.
- **Animation video**: MP4 H.264 default; WebM VP9 / AV1 for modern browsers.

## Anti-patterns

- JPEG for VFX (loses HDR + introduces compression artifacts).
- EXR for web (overkill, large file, browser support inconsistent).
- 8-bit for HDR delivery (banding visible).
- Lossy compression on archival masters.

## Related skill
`../SKILL.md`
