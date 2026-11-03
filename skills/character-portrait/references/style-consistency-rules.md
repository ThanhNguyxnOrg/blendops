# Style consistency rules

A character portrait reads as broken if the subject, wardrobe, props, and background do not share the same stylization. Lock style early.

## Style axes

- **Realism**: photorealistic ↔ stylized ↔ flat / cartoon
- **Detail density**: high (PBR + micro-detail) ↔ medium ↔ low (stylized)
- **Color treatment**: natural ↔ graded ↔ stylized palette
- **Surface complexity**: realistic textures ↔ painterly ↔ flat color blocks

## Per-axis decision

For each axis, lock one position and apply across:
1. Subject skin / face
2. Subject hair
3. Wardrobe
4. Props
5. Background / environment

## Common consistency failures

- Photoreal subject + stylized cartoon background → reads as compositing error.
- Stylized subject + PBR wardrobe with detailed materials → wardrobe upstages subject.
- Mix of realistic + flat-color props in the same hand → distracting.
- Background more detailed than subject → eye reads background first.

## Color harmony

- Subject's primary palette → wardrobe accents → background ambient color → prop color.
- Use a 60-30-10 distribution (dominant / secondary / accent).
- Verify against `composition-quality-checker` hierarchy rules.

## Verdicts

- Pass: all 5 elements share style axis position.
- Warn: one element drifts (e.g. wardrobe slightly more realistic than subject).
- Fail: clear mix of realism + stylized (subject photoreal, props flat color block).

## Related skill
`../SKILL.md`
