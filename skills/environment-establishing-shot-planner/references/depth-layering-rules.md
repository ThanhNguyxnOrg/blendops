# Depth layering rules

A wide establishing shot reads flat without distinct depth layers. Plan FG / MG / BG explicitly.

## Three-layer model

### Foreground (FG)
- Closest to camera; usually silhouettes or partial occluding elements.
- Provides scale + frame within frame.
- Examples: tree branches, rooftops, vehicles, characters in silhouette.

### Midground (MG)
- The subject area; carries focal subject if any.
- Most detailed; reads as primary visual layer.
- Examples: main building, focal vehicle, character group.

### Background (BG)
- Distant; provides context + atmospheric perspective.
- Less detailed; simplified by haze.
- Examples: distant skyline, mountains, sky.

## Atmospheric perspective rules

- BG is lighter / cooler / less saturated than MG.
- Haze density increases with distance.
- Sharpness decreases with distance.
- Color temperature shifts toward sky color in BG.

## Common failures

- All three layers same brightness → reads flat.
- Background more detailed than midground → eye reads BG first; subject lost.
- Foreground occlusion blocks focal subject.
- No FG → environment feels distant and unreachable.
- No BG → subject feels stage-set, isolated.

## Verdict guidance

- All 3 layers present + atmospheric perspective applied → Pass.
- 2 layers only → Warn (reduced depth).
- 1 layer only → Fail (no depth; not establishing).
- Layers present but BG dominates → Fail (hierarchy broken).

## Stylization caveat

For stylized / flat / abstract environments, depth layers may collapse intentionally. Verify against brief; if "flat 2D-style" is the brief, depth rules relax.

## Related skill
`../SKILL.md`
