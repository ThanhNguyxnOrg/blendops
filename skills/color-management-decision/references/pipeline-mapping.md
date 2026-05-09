# Pipeline → color management mapping

## Web (sRGB display)

- Display Device: sRGB
- View Transform: Filmic (default) or Standard (flat color brand work)
- Look: None or Medium High Contrast
- Output: PNG / JPG / WebP 8-bit sRGB

## Film / VFX (ACES or AgX pipeline)

- Display Device: sRGB (for preview)
- View Transform: AgX or Filmic
- Look: None
- Output: OpenEXR linear 16-bit half float

## Game engine (Unity / Unreal)

- Display Device: sRGB
- View Transform: Standard (linear render preserved)
- Look: None
- Output: per-texture (color sRGB, data Linear)

## Print

- Display Device: sRGB
- View Transform: Standard
- Look: None
- Output: TIFF 16-bit; soft-proof to CMYK in print prep tool

## GLB (Three.js / R3F web)

- Display Device: sRGB
- View Transform: Filmic
- Look: None
- Embedded textures in GLB: color = sRGB, data = Linear
- Three.js: `renderer.outputColorSpace = SRGBColorSpace`

## Why these choices

- **Filmic** compresses HDR to display-referred range; flatters lit scenes; web's default for product / portrait / cinematic.
- **AgX** is similar to Filmic with cleaner highlight rolloff; preferred for VFX.
- **Standard** is "no tone-mapping"; flat, accurate for graphic / brand color work; not for high-DR scenes.
- **ACEScg** is a working color space, not a view transform; used in VFX pipelines that ingest BlendOps output downstream.

## Related skill
`../SKILL.md`
