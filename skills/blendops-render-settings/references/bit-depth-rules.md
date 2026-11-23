# Bit-depth rules

## 8-bit (256 levels per channel)

- Default for web / mobile / standard delivery.
- Banding visible only in slow gradients (sky, smooth lighting).
- File size smallest.

## 10-bit (1024 levels per channel)

- HDR display delivery (HDR10, Dolby Vision).
- Smoother gradients.
- File size larger; consumer support not universal.

## 12-bit (4096 levels)

- Cinema / film mastering.
- Used in some intermediate codecs.
- Rarely needed for web / mobile.

## 16-bit (65536 levels)

- VFX / film working format.
- Print archival.
- Smooth gradients without banding.
- File size 2x of 8-bit; pipeline must support.

## 16-bit half float (OpenEXR)

- HDR data preserved (values > 1.0).
- Standard for VFX / film.
- Consumer must support EXR loader.

## 32-bit float (OpenEXR)

- Highest precision.
- Used for technical passes (depth, normal, motion vector).
- Massive file sizes; only when bit-depth is critical.

## When to upgrade bit depth

| Symptom | Solution |
|---|---|
| Banding in gradient | 8-bit → 10-bit or 16-bit |
| HDR clipped to white | 8-bit → EXR 16-bit half |
| Color shift after compositing | 8-bit → 16-bit working format |
| File-size acceptable | Stay at 8-bit |

## When to NOT upgrade

- Web hero where 8-bit is fine; bit depth bloats file with no perceived gain.
- Mobile where bandwidth matters.
- Archival of already-finished work; archive at delivery bit depth.

## Related skill
`../SKILL.md`
