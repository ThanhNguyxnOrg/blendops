# HDRI + explicit-light balance rules

HDRIs and explicit lights are not interchangeable. Use them as a system.

## HDRI alone

| Use case | Verdict |
|---|---|
| Outdoor scene with sky HDRI | Pass |
| Quick lookdev / preview | Pass (rough check only) |
| Final product hero | Warn (HDRI alone often lacks key-light snap) |
| Cinematic narrative shot | Fail (no shaping) |

## HDRI + 3-point key/fill/rim

This is the **default for product hero**. HDRI provides ambient + ground reflection; explicit lights shape the subject.

Recommended balance:
- HDRI strength: 0.5–1.2 (subordinate)
- Key area light: ~50–500W (dominant on subject)
- Fill: 10–20% of key strength
- Rim: enough for separation against background (often 50–100% of key)

## Explicit lights only (no HDRI)

| Use case | Verdict |
|---|---|
| Studio product on solid color seamless | Pass (controlled) |
| Outdoor scene without sky | Fail (missing ambient) |
| Cinematic dark mood | Pass (HDRI optional) |

## Fail rules

- HDRI strength > 2.0 with explicit lights at studio levels → likely overpowering. Verify intent or Fail.
- HDRI tint conflicts with key Kelvin (e.g., warm HDRI + cool 7000K key) → Fail unless intentional split lighting.
- HDRI on but environment-only checkbox off → confusing setup; Warn.

## Common patterns

| Pattern | HDRI strength | Key W | Fill ratio | Rim |
|---|---|---|---|---|
| Soft hero | 1.0 | 250 | 0.15 | 100W rim |
| Hard dramatic | 0.3 | 500 | 0.05 | 100W rim |
| Outdoor daylight | 1.5 | 0 (sun separate) | — | — |
| Moody / noir | 0.2 | 400 | 0.0 | 50W rim only |

## Related skill
`../SKILL.md`
