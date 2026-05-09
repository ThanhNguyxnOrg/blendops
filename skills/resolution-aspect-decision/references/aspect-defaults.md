# Aspect-ratio defaults per use case

| Use case | Aspect | Notes |
|---|---|---|
| Web hero card | 16:9 | Most common landing-page hero |
| Wide cinematic banner | 2.39:1 | Cinema bar / billboard |
| Square social (IG feed) | 1:1 | Old IG default |
| Portrait social (IG feed 4:5) | 4:5 | Modern IG portrait |
| Stories / Reels / TikTok | 9:16 | Vertical mobile |
| YouTube thumbnail | 16:9 | Same as hero |
| App icon | 1:1 | Single subject |
| Email header | 16:9 or 3:1 | Email banner |
| Print A4 portrait | 1:1.414 (~5:7) | A4 landscape: 1.414:1 |
| Print A3 | Same proportions | Larger version |
| Print US Letter | ~17:22 | Different from A4 |

## Multi-format

When a single render must serve multiple aspects:

- Plan camera framing for the most-restrictive aspect first.
- Compose so subject reads in all required aspects.
- Re-frame or re-render for substantially different aspects (16:9 vs 9:16 → re-render usually).

## Aspect mismatch verdicts

| Situation | Verdict |
|---|---|
| Rendered aspect = consumer aspect | Pass |
| Off by < 5% | Warn |
| Wrong direction (square brief, wide render) | Fail |
| No aspect specified | Fail (incomplete spec) |

## Anti-patterns

- "Default 16:9, crop later" → loses pixels, breaks composition.
- One render serving square + portrait + wide → likely Fail; re-render per aspect.
- Aspect not in brief → block until clarified.

## Related skill
`../SKILL.md`
