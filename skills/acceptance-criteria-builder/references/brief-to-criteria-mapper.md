# Brief -> Criteria Mapper

Translate each populated slot from the 8-slot `intent-to-3d-brief-writer` output into 1-3 measurable acceptance criteria tagged with priority (`P0` release blocker, `P1` strong quality bar, `P2` polish) and an explicit verification hook. Keep criteria compact at first pass so checklists remain auditable.

| Brief Slot | Measurable Acceptance Themes | Default Verification Hook | Priority |
|---|---|---|---|
| Subject & Hero Focus | Crisp silhouette at target camera angle; hero scale grounded on `Z = 0` or intended plinth; zero intersecting parts | Viewport/render visual inspection + bounding-box dimensions (`object.dimensions`) | P0 |
| Mood & Lighting | Key-to-fill contrast ratio matches mood words (e.g. crisp `4:1` dramatic vs soft `2:1` studio); no clipped highlights (`> 0.98`) on product body | Render histogram / Exposure + View Transform check (`AgX` or `Khronos PBR Neutral`) | P0 |
| Camera & Composition | Hero fills `45%-70%` of frame; focal length (`50-85 mm`) avoids distortion; negative space reserves requested UI/copy zone | Camera focal length + `composition-quality-checker` safe-frame check | P0 |
| Materials & Lookdev | Physically plausible PBR (`Albedo` within `[0.04, 0.85]`, metallic `0/1` separation, linear `Non-Color` normal/roughness maps) | Shader inspection + UV texel density spread `<= 1.3x` | P1 |
| Outputs & Format | Exact target format (`.glb`, `.png`, `.mp4`), pixel dimensions (`1920x1080`, `2048x2048`), and embedded/external color profile (`sRGB`) | Output file inspection (`gltf-validator` / image metadata) | P0 |
| Performance & Budget | Mobile/web caps (`<= 50k` tris, `<= 10 MB` GLB or compressed `<= 2 MB`, `<= 15` draw calls) when web delivery is requested | `blendops glb-inspect` triangle/material/texture budget report | P0 (if web) |
| Constraints & Exclusions | Explicit scope bans respected (no unapproved background clutter, no copyrighted logos, `Not Produced` labeled honestly if runtime skipped) | `scope-guard` + `pre-handoff-verification` 7-point check | P0 |

## Mapping Procedure
1. Read only slots actually populated in the approved brief; do not invent unrequested web or animation gates for a static still-only brief.
2. Emit **1 to 3 concrete pass/fail criteria per slot**; collapse overlapping checks rather than duplicating rules across slots.
3. Attach one explicit **Evidence Hook** (`viewport grab`, `gltf-validator JSON`, `blendops glb-inspect`, or `Not Run — planned gate`) to every criterion.
4. Sort the final acceptance table strictly `P0` -> `P1` -> `P2` so downstream `done-criteria` and `stage-gates` know what blocks handoff.

## Anti-Pattern to Avoid
- Copying generic boilerplate ("looks realistic", "high quality") without measurable thresholds or naming which artifact proves pass/fail.
