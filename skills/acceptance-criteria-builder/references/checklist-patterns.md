# Acceptance Checklist Patterns

Reusable pass/fail checklist clauses indexed by review area. Select only the categories triggered by the brief and tag platform-specific items `P0` only when required by the delivery target.

## 1. Visual Readability & Hero Silhouette
- **Hero Frame Share (`P0`)**: Primary product/subject occupies `45%-70%` of viewport area without clipped edges or accidental crop at safe margins (`5%-10%` inset).
- **Silhouette Separation (`P0`)**: Subject separates cleanly from backdrop across at least 75% of perimeter via value contrast or rim light (`>= 2:1` luminance step).
- **Grounding & Contact (`P1`)**: Resting objects sit flush on `Z = 0` with real contact shadow (`ambient occlusion` or area bounce); floating/levitating hero designs explicitly align along an intended hero shadow axis.

## 2. Lighting, Color & Material Truth
- **View Transform Lock (`P0`)**: Scene uses `AgX` (photoreal/editorial Blender renders) or `Khronos PBR Neutral` (true-to-brand GLB/e-commerce matching), never legacy uncalibrated sRGB clips.
- **No Unintended Clipping (`P1`)**: Specular highlights remain controllable; primary product albedo stays inside physically plausible linear bounds (`[0.04, 0.85]`).
- **Color Texture Space (`P1`)**: Color/BaseColor maps sampled as `sRGB`; Roughness, Metallic, AO, and Normal maps strictly set to `Non-Color`.

## 3. Technical Delivery & Web/Real-Time Budgets
- **Resolution & Aspect (`P0`)**: Render/export dimensions match `resolution-aspect-decision` output (`16:9` hero banner, `1:1` e-commerce card, `9:16` vertical social) without unintended pixel stretching.
- **Format & Compression (`P0`)**: Output matches `output-format-decision`; Web GLB exports pass `gltf-validator` with `0` errors and stay under `mobile-glb-budget` (`<= 50k` tris, `<= 2048px` textures, KTX2/Meshopt/Draco parity noted if used).
- **Animation & Rigging (`P0` only if animated)**: `glb-animation-handoff` confirms non-destructive baked NLA tracks, clean root scale (`1, 1, 1`), and verified frame-rate (`24`/`30`/`60 fps`).

## 4. Process & Truth Discipline
- **Stop Conditions (`P0`)**: `done-criteria` limits (max refinement iterations, time cap) are embedded as pass/fail checks.
- **Truth Labeling (`P0`)**: Unexecuted checks record `Runtime status: Not Run` and `Artifact status: Not Produced` — never mark visual or binary checks `Verified` from planning text alone.
