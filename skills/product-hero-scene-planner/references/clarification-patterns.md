# Clarification Patterns

## Purpose
Ask high-leverage clarification questions only when missing details would materially change camera geometry, material complexity, polycount budget, or lighting mood in `product-hero-scene-planner`.

## When to use
- When the user's request omits delivery destination, hero silhouette cues, or real-time vs. offline fidelity priority. Never interrogate the user with 10 questions when sensible defaults work.

## Five High-Value Clarification Axes

| Axis | Ask Only When Ambiguous | Default Safe Assumption (if user says "surprise me") |
|---|---|---|
| **1. Output Destination** | Is this a static hero image (`.png`), rotating video (`.mp4`), or interactive web 3D file (`.glb`)? | Static studio hero still (`16:9` `1920x1080`) + optional `.glb` web note (forces Tier 2 bake plan) |
| **2. Fidelity vs. Speed Priority** | Photoreal Cycles raytraced hero shot OR `<= 5 MB` 60 fps web/mobile asset? | Balanced `Khronos PBR Neutral` real-time-compatible materials so both Cycles & `.glb` stay viable |
| **3. Subject Reference Availability** | Do you have an existing `.blend`/`.glb`/logo/photo reference, or build procedurally from scratch? | Simple geometric/sculpted hero form (`<= 40k` tris) with placeholder surface cues marked clearly |
| **4. Layout & Copy Zone** | Will website headlines or buttons sit on the left/right side of the frame? | Center-balanced 3/4 hero (`55%` frame fill) with `12%` safe margins all around |
| **5. Performance / Platform Limits** | Any strict size cap (`<= 2 MB` mobile AR) or engine constraint (React Three Fiber, Shopify, Unreal)? | Standard web target (`<= 50k` tris, `<= 2048 px` textures, `<= 10 MB` `.glb`) |

## Good vs. Bad Question Batch
- **Good (compact, 2-3 choices max)**: `"Before I draft the shoe scene plan: (1) Are you embedding an interactive 3D file (.glb) on a website or just need a static hero image? (2) Should we keep the left 40% dark/empty for landing-page text?"`
- **Bad**: Asking `"What F-stop, focal length, Cycles max bounces, roughness IOR, and clamp indirect threshold do you want?"` to a non-Blender founder.

## Related skill
[../SKILL.md](../SKILL.md)
