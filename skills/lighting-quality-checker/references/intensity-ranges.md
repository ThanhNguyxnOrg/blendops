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

## Verdict guidance

- Outside the range → Warn
- 10× outside the range → Fail
- Range overlaps with a different scenario → check brief

## Related skill
`../SKILL.md`
