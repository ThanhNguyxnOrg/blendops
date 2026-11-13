# Light intensity ranges (sanity reference)

These are typical Cycles/Eevee values for common scenarios. Use as plausibility ranges, not hard requirements.

## Sun light (directional)

| Scenario | Strength |
|---|---|
| Outdoor daylight (overcast) | 1–2 |
| Outdoor daylight (clear sun) | 2–5 |
| Sunset / sunrise warm | 1–3 |
| Moonlight | 0.05–0.3 |

## Area light (W in Cycles, watts-equivalent)

| Scenario | Wattage |
|---|---|
| Practical (small bulb) | 5–25 W |
| Tabletop product key | 50–250 W |
| Studio key (medium soft) | 250–1000 W |
| Hero product key (large soft) | 500–2000 W |
| Architectural overhead bank | 1000–5000 W |

## Point light

| Scenario | Wattage |
|---|---|
| Practical (lamp bulb) | 5–60 W |
| Visible point glow | up to 200 W |

## Spot light

| Scenario | Wattage |
|---|---|
| Theater rim spot | 100–500 W |
| Architectural accent | 50–300 W |

## HDRI environment

| Scenario | Strength |
|---|---|
| Studio (soft fill) | 0.5–1.2 |
| Outdoor sun | 0.7–1.5 |
| Subtle ambient (mood scene) | 0.2–0.5 |
| Overpowering (likely error) | > 2.0 |

## View transform & color temperature pairing

Always judge lighting intensity under the intended target `view_transform`:

| View Transform | Best used for | Web / engine parity |
|---|---|---|
| **AgX** (Blender 4.0+ default) | Hero renders, high-contrast highlights, realistic rolloff | Pair with `ACESFilmic` / `AgX` tone mapping if targeting realistic web |
| **Khronos PBR Neutral** | E-commerce products, exact brand color & albedo parity | Direct 1:1 parity with Three.js `THREE.NeutralToneMapping` |
| **Standard** | 2D UI panels, flat graphic signage, pixel-exact color | No filmic highlight compression |

### Practical Kelvin pairings (contrast without mud)

| Contrast pair | Warm key / practical | Cool fill / rim |
|---|---|---|
| Studio product | `5200–5600 K` neutral key | `6500–7500 K` subtle cool rim |
| Moody / cozy interior | `2700–3200 K` practical lamp | `7500–10000 K` sky / window fill |
| Sci-fi / cyberpunk accent | Accent saturated rim (`cyan / magenta`) | Low-strength neutral fill (`20–35%` key) |

## Verdict guidance

- Outside the range → Warn
- 10× outside the range → Fail
- Range overlaps with a different scenario → check brief
- Judging PBR brand colors under extreme Filmic look instead of `Khronos PBR Neutral` or `AgX` → Warn

## Related skill
`../SKILL.md`
