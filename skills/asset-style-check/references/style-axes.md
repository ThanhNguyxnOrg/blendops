# Style axes

## 4 axes

### 1. Realism
- Photorealistic ↔ stylized ↔ flat / cartoon
- Determine from materials, proportions, surface complexity.

### 2. Detail density
- High (PBR + micro-detail + small props)
- Medium (clear surfaces, fewer extras)
- Low (simplified shapes, large color blocks)

### 3. Color treatment
- Natural (real-world hues, daylight)
- Graded (cinematic / brand color grade applied)
- Stylized palette (limited / saturated)

### 4. Surface complexity
- Realistic (full PBR, accurate roughness / metallic / normal)
- Painterly (hand-feel; stylized brush strokes)
- Flat (uniform color blocks; minimal shading)

## Per-asset evaluation

For each asset, position it on each axis. Use ranges if uncertain (e.g., "medium-low detail").

## Brief baseline

Read the brief style. Position the brief on each axis. Each asset must fall within the brief's tolerance per axis.

## Drift severity

- 0 axes off → None
- 1 axis off → Minor
- 2 axes off → Major
- 3+ axes off → Severe (treat as Fail)

## Common mismatches

- Realistic subject + stylized prop → Major drift on realism + surface.
- High-detail subject + low-detail background → Major if subject is centered; Minor if intentional depth-of-field.
- Saturated palette asset in muted-palette scene → Minor or Major depending on how prominent.

## Related skill
`../SKILL.md`
