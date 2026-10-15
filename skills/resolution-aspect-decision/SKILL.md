---
name: resolution-aspect-decision
description: Pick the right render resolution + aspect ratio for the consumer use case before render; avoid render-then-crop and aspect mismatch.
---

# resolution-aspect-decision

## Purpose
Avoid the most common render planning mistake: rendering at one aspect / resolution and cropping or upscaling to fit. Pick the consumer's required output upfront.

## Quick start
- Name the consumer use case and intended placement (web hero / social / print / app).
- Pick the required aspect ratio for each output stream before framing.
- Pick the exact target render resolution (W × H) and DPI / PPI (if print) from the consumer spec or reference tables.
- Pin the resolution record for the operator to apply in scene render properties.

## When to use
- before render
- when consumer requires specific aspect / resolution
- before composition planning (aspect drives composition rules)

## When not to use
- after render is complete (no benefit)
- pure modeling
- internal preview-only renders (any reasonable size works)

## Trigger phrases
- "what resolution"
- "how big should the render be"
- "16:9 or square"

## Prerequisites / readiness
- Consumer use case and target delivery placement are known.
- Companion decisions are handled in their dedicated skills: `color-management-decision` (color config), `output-format-decision` (container/codec), and `cycles-vs-eevee-decision` (render engine).

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Consumer use case | Drives target aspect ratio, resolution (W × H), and print DPI / PPI |

### Optional inputs

| Input | Use |
|---|---|
| Brand or platform spec | Pins exact required dimensions and aspect ratio |
| Multi-stream requirement | Produces a separate per-stream resolution record for each delivery target |

### Assumptions to confirm
- The target machine and schedule can accommodate the pinned resolution in scene render properties.
- Any framing adjustments for the pinned aspect ratio will be validated via `composition-quality-checker`.

## Output schema

### Primary output
One resolution record per output: aspect ratio, render resolution (W × H), and DPI / PPI (for print).

### Secondary output
- Per-stream resolution rules when multiple outputs are required
- Caveats and hardware/memory considerations

### Evidence / caveat output

```txt
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

> Note: Valid runtime states are `Not Run | Attempted | Produced | Verified | Failed` and valid artifact states are `Not Run | Not Produced | Produced | Verified | Failed` (default `Not Produced`). Truth states are downgrade-only, never upgrade. Pinning a resolution record never runs Blender or produces a file.

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Decision skill — does not render. Pins resolution + aspect; operator applies in scene render properties.

## Operating procedure
1. Identify the consumer use case and every required delivery stream.
2. Select the target aspect ratio from the consumer spec or `references/aspect-defaults.md`.
3. Select the target render resolution (W × H) from the consumer spec or `references/resolution-defaults.md`.
4. Pin DPI / PPI for print outputs per `references/print-vs-screen-rules.md`.
5. Record per-stream rules and caveats for the operator to apply in scene render properties.
6. Hand off the pinned aspect to `composition-quality-checker` to validate framing, and to `render-export-evidence` after rendering to verify saved files.

## Decision tree

```txt
Consumer provides exact spec (aspect + W × H + DPI)?
  → Pin the exact consumer spec per stream
Consumer provides placement category only (web / social / mobile / banner / print)?
  → Look up category aspect in references/aspect-defaults.md
  → Look up category W × H in references/resolution-defaults.md
Print delivery required?
  → Pin required print W × H and DPI / PPI per references/print-vs-screen-rules.md
Multiple aspect ratios required across streams?
  → Emit a separate resolution record per stream; hand off to composition-quality-checker to validate framing per aspect (do not render once and crop)
HDR or specific container/color pipeline mentioned?
  → Keep aspect + W × H here; route color config to color-management-decision and container/codec to output-format-decision
```

## Playbooks

### Playbook A: Single-stream web or screen delivery
Pin the target aspect ratio and exact W × H from the consumer spec or `references/resolution-defaults.md` (`DPI / PPI: N/A`). Operator applies directly in scene render properties; no post-render resize or upscale is performed by this skill.

### Playbook B: Multi-format social delivery
Emit a separate per-stream resolution record for each required aspect ratio (e.g., portrait, square, widescreen). Do not advise rendering once and cropping; hand off each pinned aspect to `blender-composition-camera-planner` and `composition-quality-checker` so framing is validated per stream.

### Playbook C: Print delivery
Pin the required print aspect ratio, exact pixel dimensions (W × H), and target DPI / PPI from the print specification or `references/print-vs-screen-rules.md`. Render directly at target print resolution; never render small and upscale.

### Playbook D: Multi-size asset or icon delivery
Pin each required output tier (aspect + W × H) in the per-stream resolution record. Keep any external post-render resizing or format conversion outside this skill's boundary.

## Mode handling

### Text-only mode
Output the resolution record, per-stream rules, caveats, and default truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

### Runtime-ready mode
Output the resolution record for the operator to apply in scene render properties. This skill never executes a render or inspects files; actual saved files must be verified downstream by `render-export-evidence`.

### Blocked runtime mode
Output the resolution record, per-stream rules, and caveats with `Runtime status: Not Run` and `Artifact status: Not Produced`.

## Validation checklist
- [ ] Aspect ratio explicitly chosen per output stream
- [ ] Render resolution (W × H) explicitly chosen per output stream
- [ ] DPI / PPI specified for print outputs (or marked `N/A` for screen)
- [ ] No post-render resize, crop, or upscale steps claimed inside this skill
- [ ] Caveats and truth states (`Not Run` / `Not Produced`) listed

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Aspect ratio, resolution (W × H), and print DPI / PPI are explicit per stream and match the consumer use case without relying on post-render crop or upscale. |
| Warn | Aspect ratio is set, but resolution is borderline for the target placement or relies on unconfirmed consumer assumptions. |
| Fail | Aspect ratio is omitted or mismatched to the consumer; plan relies on rendering small and upscaling or rendering once and cropping across mismatched aspects. |

## Failure handling
- Consumer use case unspecified → ask once to clarify target placement and spec before pinning defaults from `references/aspect-defaults.md` and `references/resolution-defaults.md`.
- Multi-format request with conflicting aspects → define a separate per-stream resolution record for each aspect and hand off framing validation to `composition-quality-checker`.
- Target resolution exceeds machine memory or time budget → document the constraint in caveats and escalate to the operator before render.

## Troubleshooting

| Problem | Response |
|---|---|
| Final delivery looks soft | Probably upscaled from low-res; re-render at delivery res. |
| Aspect cropped wrong | Pre-render at correct aspect; do not crop. |
| Print too low-DPI | Render at delivery DPI from the start; do not upscale. |
| Consumer spec unclear | Ask once, then default per consumer category. |

## Best practices
- Always pin the delivery aspect ratio upfront rather than rendering a generic frame and cropping later.
- When multiple aspect ratios are needed, emit per-stream records and validate framing for each via `composition-quality-checker`.
- Keep post-render resizing, scaling, and format conversion outside this skill.
- Pass the pinned resolution record to `render-export-evidence` so saved render outputs can be verified against target dimensions.

## Good examples
- "Consumer use case: Web hero banner. Aspect ratio: 16:9. Resolution: pinned per consumer spec (W × H). DPI / PPI: N/A. Operator applies in scene render properties; framing validated via `composition-quality-checker`."

## Bad examples
- "1080p." — no aspect.

## User-facing response template

```txt
Consumer use case: <web hero / social / print / app icon / banner>
Aspect ratio: <ratio>
Resolution: <W H ×>
DPI / PPI: <value if print, else "N/A">

Per-stream outputs (if multiple):
  <stream name>: <aspect ratio> | <W H ×> | <DPI / PPI>

Caveats: <list>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: composition-quality-checker, render-export-evidence
```

## Anti-patterns
- "1080p" without aspect.
- Render small, upscale large.
- Crop instead of re-frame for different aspects.
- "Default size" answers.

## Cross-skill handoff
- Color configuration → `../color-management-decision/SKILL.md`
- Container / codec format → `../output-format-decision/SKILL.md`
- Render engine choice → `../cycles-vs-eevee-decision/SKILL.md`
- Camera & composition planning → `../blender-composition-camera-planner/SKILL.md`
- Framing validation against pinned aspect → `../composition-quality-checker/SKILL.md`
- Saved file & dimension verification post-render → `../render-export-evidence/SKILL.md`

## Non-goals
- Rendering scenes or executing Blender.
- Resizing, cropping, or upscaling images post-render.
- Choosing color management (`color-management-decision`), file formats/codecs (`output-format-decision`), or render engines (`cycles-vs-eevee-decision`).
- Validating scene framing (`composition-quality-checker`) or verifying produced files on disk (`render-export-evidence`).
- Calibrating displays.

## References
- `references/aspect-defaults.md`
- `references/resolution-defaults.md`
- `references/print-vs-screen-rules.md`
- `../../docs/skill-system.md`
