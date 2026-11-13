# Scene Plan Schema

## Purpose
Define required structure for product hero planning output.

## When to use
For product-hero-scene-planner outputs.

## Required sections
- intent summary
- subject model
- composition plan
- camera plan
- lighting plan
- material plan
- environment plan
- render/export intent
- web handoff intent

## Six-face & paired-component completeness guard (Floor, Not Ceiling)

When planning physical products or props, ensure the `subject model` section accounts for all 6 spatial faces and symmetrical pairs so rear/underside geometry is never omitted:

- **Six faces**: Front (`-Y` camera-facing), Back (`+Y` controls/ports/labels), Top (`+Z`), Bottom (`-Z` feet/pads at `Z = 0`), Left (`-X`), Right (`+X`)
- **Paired components & mounts**: Verify matching pairs (wheels/brackets, front lens + rear viewfinder, handles + hinge mounts) and structural contact tolerances (no floating rods or clip-throughs)
- **Reference-Image-Match calibration**: Record real-world metric bounds (`width × depth × height` in meters) and silhouette reference anchors when references are supplied

## Good example
All sections present with assumptions, 6-face/paired-component checks, real-world dimensions, and caveats.

## Bad example
Only composition and front camera, missing backside/underside completeness or handoff/validation.

## Related skill
../SKILL.md
