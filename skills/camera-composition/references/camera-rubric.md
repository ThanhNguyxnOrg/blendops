# Camera Rubric

## Purpose
Provide a structured 4-dimension scoring rubric for evaluating hero camera placement, framing, focal length, and layout compatibility prior to render or GLB export.

## When to use
- During `composition-quality-checker` or `scene-readiness` review before approving a render/turntable.
- Whenever comparing candidate camera angles or validating hero framing against web overlay text zones.

## Rubric Dimensions & Grading Thresholds

| Dimension | Pass Criteria | Warn (Fixable Before Final) | Fail (Block Handoff) |
|---|---|---|---|
| **Focal Clarity** | Subject sharp and unobstructed; lens `50-85 mm` (`<= 35 mm` only for deliberate wide environments); `f/5.6-f/8` keeps full product crisp | Slight DOF blur near secondary edge or `35-45 mm` slight perspective exaggeration | Wide-angle barrel distortion (`< 28 mm`) warping product silhouette, or focal blur hiding hero details |
| **Framing Intent** | Hero fills `45%-70%` of frame; `10%+` safe margin around bounding box; vertical/horizontal horizon level (`roll = 0 deg` unless tilted hero) | Hero slightly tight (`70%-80%`) or loose (`30%-45%`); minor asymmetry unmotivated | Key product feature clipped off-edge, horizon accidentally crooked, or hero `< 25%` of frame |
| **Depth Layering** | Foreground/hero/background cleanly separated via distance falloff, floor reflection fade, or subtle haze/rim edge | Backdrop separates from hero in midtones only; shadows blend slightly into dark floor | Flat "sticker" cutout look or black product silhouette lost against black void |
| **Target Context Readability** | Negative space preserves UI headline/CTA zone (e.g., left-third hero leaves right 40% clean for hero copy) without occluding silhouette | Copy safe zone slightly tight (`< 25%` unobstructed margin) under responsive mobile crop | Hero overlaps web typography zone or mobile `9:16` / desktop `16:9` crop cuts off core product |

## Good vs. Bad Review Output
- **Good**: Score each of the 4 dimensions explicitly (`Pass / Warn / Fail`), state concrete evidence (`focal_length: 65mm`, `shift_x: 0.08`, `safe_margin: 12%`) or mark visual read `Not Run` if no render exists yet, and list one minimum camera adjustment per `Warn/Fail`.
- **Bad**: `"Camera looks 8/10, ready to export"` with zero per-dimension rationale or context fit check.

## Related skill
[../SKILL.md](../SKILL.md)
