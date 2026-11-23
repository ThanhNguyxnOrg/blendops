# Look comparison (Filmic vs Standard vs AgX)

## Standard

- No tone-mapping; clamps values > 1.0.
- Preserves accurate colors in low-DR scenes.
- Burns out highlights in high-DR scenes (HDR lighting blown out).
- Good for: brand color work, flat graphics, low-DR scenes.

## Filmic

- Tone-maps HDR to display-referred range.
- Preserves highlight detail (clouds, sun, lightbulbs).
- Slightly desaturates very bright colors (intentional, looks photographic).
- Good for: product hero, lit interiors, cinematic.

## AgX (Blender 4.0+)

- Newer alternative to Filmic.
- Cleaner highlight rolloff than Filmic.
- Less aggressive desaturation.
- Good for: VFX-quality work, modern lit scenes.

## Look modifiers

| Look | Effect |
|---|---|
| None | Pure View Transform output |
| Very Low Contrast | Lifts shadows |
| Low Contrast | Slightly lifted shadows |
| Medium Contrast | Default-ish |
| Medium High Contrast | Slightly punched contrast (good for product hero) |
| High Contrast | Strong contrast (cinematic) |
| Very High Contrast | Heavy contrast (rarely needed) |

## When to pick which

- Pure brand color (logo render): Standard, Look None.
- Product hero with HDR lighting: Filmic, Look Medium High Contrast.
- VFX EXR pipeline: AgX, Look None (downstream tools grade).
- Stylized / illustrative: Standard or Filmic, with art direction tests.

## Related skill
`../SKILL.md`
