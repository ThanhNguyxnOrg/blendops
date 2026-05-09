# Compression tradeoffs

## Lossless

- PNG (DEFLATE)
- TIFF LZW
- WebP lossless
- OpenEXR ZIP / PIZ
- TGA RLE

Pro: pixel-exact recovery.
Con: file size ~30-70% of uncompressed.

When: hero deliverables, archival, intermediate passes.

## Lossy

- JPEG (DCT)
- WebP lossy
- AVIF
- HEIC

Pro: file size ~5-20% of uncompressed.
Con: pixel-exact recovery impossible; artifacts at low quality.

When: web mobile, social, sharing, draft previews.

## Per-format quality

| Format | Quality range | Practical sweet spot |
|---|---|---|
| JPG | 1-100 | 85-95 |
| WebP lossy | 1-100 | 85-90 |
| AVIF | 1-100 | 50-70 (more efficient than JPG) |
| HEIC | 1-100 | 70-85 |

Below 80 → visible artifacts on smooth gradients.

## Lossless tier comparison

| Format | Compression efficiency |
|---|---|
| PNG | Moderate |
| TIFF LZW | Moderate |
| WebP lossless | High (smaller than PNG for same content) |
| EXR PIZ | High for HDR float data |

## Choosing

- Hero / archival → lossless.
- Web hero where size matters → WebP lossless > PNG.
- Social / mobile → lossy WebP/JPG at quality 85-90.
- VFX → EXR ZIP/PIZ (still lossless, designed for float data).

## Anti-patterns

- JPEG for hero brand visual (artifacts on smooth gradients).
- Quality 50 lossy for portraits (compression rings around edges).
- Lossless for social-feed thumbnails (wasted bandwidth).

## Related skill
`../SKILL.md`
