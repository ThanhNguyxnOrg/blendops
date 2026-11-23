# Print vs screen rules

Print and screen have different units, gamuts, and viewing conditions. Render correctly per target.

## Units

- Screen: pixels (W × H).
- Print: physical size (cm/in) at DPI.
- Convert: pixels = physical_inches × DPI.

## Standard DPI

- Print: 300 DPI for high-quality.
- Print (large format / billboard): 100-150 DPI is fine (viewed from distance).
- Screen: ~96-110 PPI is desktop default; 264 PPI for retina iPhones.

## Color gamut

- Screen: sRGB (web), DCI-P3 (modern displays), Rec.2020 (HDR).
- Print: CMYK, often soft-proofed from sRGB.

## Viewing conditions

- Screen: backlit, transmissive (lights add).
- Print: reflective, ambient-lit (lights subtract).

This is why print colors look "darker" than screen colors at the same hex code. Soft-proof in print prep tools.

## Workflow per target

### Screen-only (web hero)

- sRGB color space.
- 8-bit per channel.
- Render at delivery pixel resolution.
- Filmic tone-mapping for HDR scenes.

### Print

- sRGB color space (then convert to CMYK in print prep).
- 16-bit per channel (preserves transition).
- Render at delivery_inches × 300 DPI.
- Standard or AgX tone-mapping.
- Soft-proof in print prep tool.

### Print with metallic / specials

- Hand off to print prep specialist.
- Spot colors / Pantones are not represented in 3D render directly.

## Common mistakes

- Render at 96 DPI then "scale up to print 300 DPI" → upscaling artifacts.
- Color matched on screen ≠ matched in print.
- Print-prep work skipped → final print has unexpected color shifts.

## Related skill
`../SKILL.md`
