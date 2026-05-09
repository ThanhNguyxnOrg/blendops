# Aspect ratio rules

The downstream consumer's required aspect ratio drives most composition decisions. Lock the aspect first; do not improvise.

## Common downstream aspects

| Use case | Aspect | Notes |
|---|---|---|
| Web hero card | 16:9 (1920×1080) | Most common landing-page hero |
| Wide cinematic | 2.39:1 | Banner / billboard / cinematic |
| Square social | 1:1 | Instagram feed / catalog grid |
| Portrait social | 4:5 or 9:16 | Instagram portrait / TikTok / vertical mobile |
| App icon | 1:1 | Single subject only |
| Catalog grid | 4:3 or 1:1 | Often standardized |

## Render at the target aspect

Always render at the consumer's aspect ratio, **not** at a different ratio with the intent to crop. Cropping introduces bias and breaks composition.

## When the brief is silent

- Default to 16:9 for web hero.
- Default to 1:1 for social.
- Default to 9:16 for mobile-only contexts.
- Always confirm with user; do not assume.

## Aspect ratio mismatch verdicts

| Situation | Verdict |
|---|---|
| Render aspect matches brief | Pass |
| Render aspect close (e.g. 16:10 vs 16:9) | Warn |
| Render aspect wrong direction (square brief, wide render) | Fail |
| Aspect not specified in brief | Fail (brief incomplete) |

## Related skill
`../SKILL.md`
