# Camera Presets & Framing Calibration

## Purpose
Define reproducible camera angle, focal length, sensor, and clip-plane presets for product hero and turntable planning outputs without bloated jargon.

## When to use
Whenever `camera-composition` translates a scene brief into camera orientation, focal perspective, and safe framing bounds.

## Preset Families

| Preset | Typical Focal Length (36mm Full Frame) | Camera Elevation / Pitch | Ideal Subject Occupancy | Primary Use Case |
|---|---|---|---|---|
| **3/4 Hero Orbit** | `50mm – 85mm` (natural-to-flattering compression) | `12° – 22°` above equator, `30° – 45°` azimuth | `55% – 70%` vertical/viewport span | Default flagship product render & interactive web GLB landing pose |
| **Front-Elevation Clean** | `75mm – 105mm` (minimizes perspective keystone) | `0° – 5°` eye level, centered orthogonal look-at | `60% – 72%` viewport span | E-commerce specs, silhouette comparison, grid symmetry |
| **Low-Angle Heroic** | `35mm – 50mm` (controlled dramatic foreshortening) | `-6° – +5°` looking slightly upward | `60% – 75%` frame height | Footwear, hardware, automotive, high-energy campaigns |
| **Macro Detail Crop** | `85mm – 120mm` + tight shallow DoF (`f/2.8 – f/4`) | Tightly angled onto texture seam / badge / bevel | Subject detail fills `70% – 85%` | Stitch, machined aluminum, anodized logo close-ups |

## Technical Sanity Rules
- **Avoid extreme wide angles (`< 28mm`)** on hard-surface products unless intentionally stylized — edge distortion stretches silhouette proportions.
- **Clip-plane hygiene**: Set `clip_start = 0.01m – 0.05m` (`0.001m` triggers viewport/shadow depth z-fighting) and tight `clip_end = 50m – 200m` for studio scenes.
- **Ground clearance**: Confirm object bottom sits cleanly at `Z = 0.0` (ground contact shadow visible) with `8% – 15%` breathing margin on all cropped edges.

## Good example
"Selected `65mm` 3/4 Hero Orbit at `16°` elevation, keeping shoe spanning `62%` of frame height with `10%` floor shadow margin and right-side negative space for hero typography."

## Bad example
"Put a camera in front of the product." (No focal length, elevation, occupancy, or edge clearance.)

## Related skill
- [SKILL.md](../SKILL.md)
