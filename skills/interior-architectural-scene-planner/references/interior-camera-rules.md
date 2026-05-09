# Interior camera rules

## Position

- **Corner shot (default)**: camera in one corner, looking diagonally across room. Maximizes visible space and depth.
- **Doorway shot**: camera at door, looking in. Mimics entry POV.
- **Hero furniture shot**: camera framed on focal furniture piece; rest of room secondary.

## Lens

| Use case | Equivalent focal length |
|---|---|
| Tight room (< 15m²) | 24–35mm |
| Standard room (15–40m²) | 24–28mm |
| Large open-plan (>40m²) | 18–24mm |
| Hospitality lobby / large venue | 14–24mm |

Avoid lenses < 14mm for arch viz interior — fisheye distortion is rarely flattering.

## Eye-line

- Standard: 1.5–1.7m (human eye-level).
- Slightly low (0.9–1.2m): emphasizes ceiling height + sense of space.
- Eye-level seated (1.0–1.2m): emphasizes seating area.
- Top-down: rare; only for floor-plan visualization.

## Tilt

- Level (no tilt): standard arch viz.
- Slight up (0–3°): enhances ceiling height.
- Slight down (0–3°): emphasizes flooring / objects on floor.
- Avoid > 5° tilt; reads as cinematic, not arch viz.

## Common camera failures

- Center of room → loses depth.
- Eye-line too low (0.5m) → unnatural perspective.
- Wide-angle in a small room → distortion in foreground furniture.
- Camera too close to wall (< 0.5m) → wall distortion.
- Two-point perspective vs three-point: arch viz typically uses two-point (verticals stay vertical).

## Two-point perspective

To preserve verticals (walls stay vertical, no tilt), use **camera shift** in Blender's camera properties or align camera level. Arch viz convention is two-point.

## Related skill
`../SKILL.md`
