# Acceptance Criteria Patterns

Slot 6 of the brief must be **observable**, not subjective. This file gives the patterns to use.

## Observable vs. subjective

| ❌ Subjective (rejected) | ✅ Observable (accepted) |
|---|---|
| "looks good" | "subject visible from primary camera, no occlusion" |
| "feels cyberpunk" | "neon rim light visible on subject, color from defined palette" |
| "high quality" | "render at 1920×1080, no NaN pixels, exposure within ±1 stop of reference" |
| "right mood" | "mood reference image attached, primary camera angle within 15° of reference" |
| "correct scale" | "GLB unit = meters, hero subject between 0.2m and 0.4m bounding box" |
| "small enough for web" | "GLB ≤ 10MB on disk after compression" |
| "loads fast" | "GLB First Contentful Paint ≤ 2.5s on mid-tier mobile (defined as Pixel 6a or equivalent)" |
| "ready to ship" | (use the 7-point gate in `pre-handoff-verification` instead) |

## Pattern: numeric thresholds

Whenever possible, attach a number:

- File size: `≤ 10MB`, `≤ 2K poly`
- Time: `render ≤ 60s on M3 Pro`, `web load ≤ 2.5s`
- Color: `primary hue within ΔE 5 of reference`
- Position: `subject center within 5% of frame center`

## Pattern: reference-image comparison

When numeric thresholds don't fit:

- "Mood reference: `references/cyberpunk-shoe-mood.png`. Render must visually match within human-judged 'same brand mood'."
- Note: human judgment is acceptable as long as it's a single named reviewer, not a team consensus.

## Pattern: tool-output-based

When validation depends on a downstream tool:

- "GLB passes `gltf-validator` with 0 errors, ≤ 3 warnings."
- "Render passes the `blender-scene-quality-checker` rubric with verdict Pass."
- "Web import test (operator-defined): asset visible in Three.js viewer, no console errors."

## Anti-patterns

- "I'll know it when I see it" — not observable. Rejected.
- "Marketing team is happy" — too many reviewers, not observable per artifact. Rejected.
- "Better than the last one" — comparative without baseline reference. Rejected.
