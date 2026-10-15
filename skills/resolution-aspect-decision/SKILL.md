---
name: resolution-aspect-decision
description: Pick the right render resolution + aspect ratio for the consumer use case before render; avoid render-then-crop and aspect mismatch.
---

# resolution-aspect-decision

## Purpose
Avoid the most common render planning mistake: rendering at one aspect / resolution and cropping or upscaling to fit. Pick the consumer's required output upfront.

## Quick start
- Identify the consumer use case and target placement (web hero, social feed, print, app asset).
- Pick the delivery aspect ratio (`W:H`) upfront so camera framing matches target placement.
- Pick exact render resolution (`W × H` in pixels) and `DPI / PPI` for print deliverables.
- Define per-stream resolution records if multiple delivery targets exist.
- Pin the record for the operator to enter in Blender scene render properties (no rendering, no post-render resizing).

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
- Consumer use case and target placement are known (or ready to be confirmed with one question).
- Color config (`color-management-decision`), container/codec (`output-format-decision`), and engine (`cycles-vs-eevee-decision`) remain separate decisions owned by their respective skills.

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Consumer use case / placement | Determines target aspect ratio and required pixel dimensions |
| Print physical dimensions + target DPI/PPI (if print) | Required to compute exact pixel width and height (`W × H`) before render |

### Optional inputs

| Input | Use |
|---|---|
| Brand or platform delivery spec | Overrides category defaults with exact required `W × H` and aspect |
| Multi-stream delivery list | Produces separate per-stream resolution records for each target aspect/size |
| Render time / memory constraints | Flags caveats if high pixel counts require operator budget review |

### Assumptions to confirm
- The target machine and render budget can handle the pinned `W × H` resolution.
- Multiple aspect ratios will be framed via camera/scene setup rather than post-render cropping.

## Output schema

### Primary output
A 3-line resolution record per target stream:
1. Aspect ratio (`W:H`)
2. Render resolution (`W × H` pixels)
3. `DPI / PPI` (explicit value for print; `N/A (screen delivery)` for digital)

### Secondary output
- Per-stream resolution rules when delivering to multiple placements
- Caveats (hardware memory/time budget notes, framing handoff requirements)

### Evidence / caveat output

```txt
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <consumer spec, or "none">
Limitations: <unconfirmed platform specs, memory/time budget caveats>
```

> **Truth-state rule:** Pinning an aspect ratio and resolution is a planning decision and never produces a file. Default to `Runtime status: Not Run` and `Artifact status: Not Produced`. Truth states are downgrade-only and must never be upgraded by this skill.

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Decision skill — does not render. Pins resolution + aspect; operator applies in scene render properties.

## Operating procedure

1. Identify the consumer use case and all target delivery streams.
2. Pin the required aspect ratio (`W:H`) for each stream from the consumer spec (or mark fallback defaults as assumptions to confirm).
3. Pin the exact render resolution (`W × H`) and `DPI / PPI` (for print) to be set directly in scene render properties—do not prescribe post-render resizing, cropping, or upscaling.
4. For multi-aspect deliverables, define a separate resolution record per stream and hand off camera framing to `blender-composition-camera-planner` and `composition-quality-checker`.
5. Record caveats and set truth states to `Runtime status: Not Run` and `Artifact status: Not Produced`.

## Decision tree

```txt
Consumer provides exact W × H (and DPI for print)?
  → Pin exact consumer spec; verify aspect ratio matches W × H.
Web / desktop widescreen placement?
  → Pin widescreen aspect (e.g., 16:9) and target display W × H from spec; DPI: N/A.
Social square placement?
  → Pin 1:1 aspect and platform-required W × H; DPI: N/A.
Mobile vertical / story placement?
  → Pin 9:16 aspect and platform-required W × H; DPI: N/A.
Ultrawide / cinematic banner?
  → Pin target banner aspect (e.g., 2.39:1) and spec W × H; DPI: N/A.
Print delivery (physical size + target DPI/PPI)?
  → Compute W × H = (physical inches × DPI) at exact print aspect ratio; pin W × H and DPI.
Multiple aspects required from one scene?
  → Emit one resolution record per stream; require per-aspect camera framing (never render-then-crop).
```

## Playbooks

### Playbook A: Single-stream digital hero

Pin the target aspect ratio (such as `16:9`) and exact delivery `W × H` required by the placement spec (`DPI / PPI: N/A`). Operator enters `W × H` in scene render properties before composition check.

### Playbook B: Multi-stream social campaign

Emit separate resolution records for each stream (for example, `9:16` vertical, `1:1` square, and `16:9` widescreen) with their respective target `W × H`. Hand off to `blender-composition-camera-planner` and `composition-quality-checker` so each aspect is properly framed in-camera rather than cropped post-render.

### Playbook C: Print deliverable

Obtain physical print dimensions and required print density (`DPI / PPI`). Calculate exact pixel dimensions (`W × H`), pin the native print aspect ratio, and require rendering directly at final print resolution without post-render upscaling.

### Playbook D: Multi-size asset family

When a consumer needs multiple distinct pixel dimensions, list each required `W × H` stream in the per-stream resolution record so the operator can plan native render outputs or hand off post-render image processing outside BlendOps.

## Mode handling

### Text-only mode

Return the resolution record, per-stream rules, caveats, and truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

### Runtime-ready mode

Return the exact same resolution record and truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`) for the operator to apply in scene render properties. Actual file verification after rendering belongs strictly to `render-export-evidence`.

### Blocked runtime mode

Return the resolution record, caveats, and truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

## Validation checklist

* [ ] Aspect ratio (`W:H`) explicitly pinned for every output stream
* [ ] Render resolution (`W × H`) explicitly pinned for every output stream
* [ ] `DPI / PPI` specified for print outputs (or marked `N/A` for screen)
* [ ] No post-render resize, crop, or upscale steps prescribed
* [ ] Caveats and downgrade-only truth states (`Not Run` / `Not Produced`) included

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | Aspect + `W × H` + `DPI / PPI` (if print) explicitly pinned per stream; matches consumer use case; no post-render crop/upscale assumed; truth states set to `Not Run` / `Not Produced`. |
| Warn | Aspect and `W × H` pinned using fallback assumptions because consumer spec was incomplete, or high pixel count risks memory/time budget limits. |
| Fail | Aspect omitted or mismatched to placement; relies on render-then-crop or post-render upscaling; upgrades truth state without verified evidence. |

## Failure handling

* Consumer spec unspecified → ask once for placement and target dimensions; if unavailable, state a fallback aspect and `W × H` explicitly as an unconfirmed assumption in Caveats.
* Multi-aspect request → emit separate per-stream resolution records and route framing to `blender-composition-camera-planner` and `composition-quality-checker` (never advise silent cropping).
* Resolution exceeds hardware memory or render time budget → flag in Caveats and recommend operator review before rendering.

## Troubleshooting

| Problem | Response |
|---|---|
| Final delivery looks soft | Probably upscaled from low-res; re-render at delivery res. |
| Aspect cropped wrong | Pre-render at correct aspect; do not crop. |
| Print too low-DPI | Render at delivery DPI from the start; do not upscale. |
| Consumer spec unclear | Ask once, then default per consumer category. |

## Best practices

* Always pin the delivery aspect ratio before camera setup so `blender-composition-camera-planner` and `composition-quality-checker` frame against the true boundary.
* Render directly at the required delivery resolution (`W × H`); keep post-render resizing, cropping, or format conversion outside this skill.
* For multi-aspect deliverables, output explicit per-stream records and require per-aspect camera validation.
* Pass the pinned resolution record to `render-export-evidence` so rendered files can be checked against target dimensions after execution.

## Good examples

* "Consumer: Web hero. Aspect: `16:9`. Resolution: `1920 × 1080` (per client spec). DPI/PPI: `N/A`. Multi-stream: none. Caveats: confirm whether high-DPI display tier requires a second native render stream. `Runtime status: Not Run`, `Artifact status: Not Produced`."

## Bad examples
- "1080p." — no aspect.

## User-facing response template

```txt
Consumer use case: <web hero / social / print / app asset / banner>
Aspect ratio: <W:H>
Resolution: <W H px ×>
DPI / PPI: <value if print, else "N/A">

Per-stream outputs (if multiple):
  - <stream name>: <W:H>, <W H px ×>, DPI/PPI: <value or N/A>

Caveats: <budget notes, unconfirmed spec assumptions>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <consumer spec or "none">
Limitations: <known gaps>
Next: blender-composition-camera-planner -> composition-quality-checker -> render-export-evidence
```

## Anti-patterns
- "1080p" without aspect.
- Render small, upscale large.
- Crop instead of re-frame for different aspects.
- "Default size" answers.

## Cross-skill handoff

* Camera & composition planning (upstream framing setup) → `../blender-composition-camera-planner/SKILL.md`
* Composition framing validation against pinned aspect → `../composition-quality-checker/SKILL.md`
* Color configuration decision → `../color-management-decision/SKILL.md`
* Container / codec decision → `../output-format-decision/SKILL.md`
* Render engine decision → `../cycles-vs-eevee-decision/SKILL.md`
* Post-render saved file verification → `../render-export-evidence/SKILL.md`

## Non-goals

* Never execute Blender or trigger renders.
* Never resize, crop, upscale, or convert images post-render (belongs outside this skill).
* Never choose file containers, codecs, or bit depths (`output-format-decision`).
* Never configure color spaces or HDR view transforms (`color-management-decision`).
* Never validate camera composition (`composition-quality-checker`) or verify rendered output files (`render-export-evidence`).

## References
- `references/aspect-defaults.md`
- `references/resolution-defaults.md`
- `references/print-vs-screen-rules.md`
- `../../docs/skill-system.md`
