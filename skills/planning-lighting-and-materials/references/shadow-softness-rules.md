# Shadow softness rules

Shadow softness is a **system property**: it depends on light size, distance, and the shadowed surface — not just one parameter.

## Light size (area / disc) drives softness

- Small light (≤ 0.1m) at 2m distance → hard shadow.
- Medium light (0.5m) at 2m → softer.
- Large light (1.5m) at 2m → very soft.
- HDRI environment → very soft (entire dome contributes).

## Distance affects perceived softness

A small light far away looks like a point (hard shadow). A large light close looks soft.

## Mood matching

| Mood | Expected shadow style |
|---|---|
| Hard / dramatic | Single sharp light, small light size, no fill |
| Soft hero / studio | Large soft key + soft fill |
| Cinematic noir | Hard key + minimal fill |
| Outdoor daylight (clear) | Hard sun shadow + soft fill from sky HDRI |
| Outdoor daylight (overcast) | Very soft shadows, sky HDRI dominant |

## Fail rules

- Brief says "soft hero" but key light size ≤ 0.1m → Fail.
- Brief says "hard dramatic" but key light size ≥ 1m → Fail.
- Multiple key-strength lights with conflicting shadow directions → Fail (creates double shadows that read as error).

## Warn rules

- Light size exactly at the boundary of soft/hard categories → Warn.
- Shadow softness depends on contact-shadow vs ray-trace shadow distinction; flag when this is unclear.

## Related skill
`../SKILL.md`
