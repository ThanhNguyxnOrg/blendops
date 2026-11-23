# Per-channel texture color space rules

## Color textures (sRGB)

- Albedo / Base Color
- Diffuse
- Emission color (depending on workflow)

These contain perceptual color data; load as sRGB so they are interpreted correctly.

## Data textures (Linear / Non-Color)

- Roughness
- Metallic
- Normal map
- Bump / Displacement
- Ambient Occlusion (often)
- Specular (workflow-dependent)
- Alpha / Mask
- Anisotropy

These contain numerical data, not color; load as Linear / Non-Color so the values are not gamma-warped.

## Mixed-channel packed textures

ORM packing (Occlusion / Roughness / Metallic in R/G/B):
- Load whole texture as Linear / Non-Color.
- Do not split channels and load each differently.

## Loading rules in Blender

- Image Texture node → "Color Space" dropdown → set per channel role.
- Default sRGB is correct for color textures.
- Data textures must be flipped to Non-Color manually.

## Common errors

- Roughness loaded as sRGB → render looks incorrectly rough.
- Albedo loaded as Non-Color → render looks washed out.
- Normal map loaded as sRGB → strange edge artifacts.

## Verifying

- Render a test sphere with a known color chart.
- Compare against reference.
- Adjust if mismatched.

## Related skill
`../SKILL.md`
