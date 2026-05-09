---
name: resolution-aspect-decision
description: Pick the right render resolution + aspect ratio for the consumer use case before render; avoid render-then-crop and aspect mismatch.
---

# resolution-aspect-decision

## Purpose
Avoid the most common render planning mistake: rendering at one aspect / resolution and cropping or upscaling to fit. Pick the consumer's required output upfront.

## Quick start
- name the consumer + intended placement (hero / social / print / app)
- pick aspect ratio (16:9 / 1:1 / 9:16 / 2.39:1 / 4:5)
- pick resolution (consumer required × 1.5 for downscale-quality margin if going to be resized)
- pin

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
- consumer use case known
- color management + format chosen (other decisions)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Consumer use case | Drives aspect + resolution |
| Format choice | Affects max practical resolution |

### Optional inputs

| Input | Use |
|---|---|
| Brand spec | Override if specified |
| Multi-resolution requirement | Generate per-tier outputs |

### Assumptions to confirm
- The render machine can handle the chosen resolution (memory).
- Time budget allows the chosen resolution + samples.

## Output schema

### Primary output
A 3-line resolution record: aspect, resolution (W × H), DPI / PPI if print.

### Secondary output
- per-output stream resolution if multiple outputs
- caveats

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Decision skill — does not render. Pins resolution + aspect; operator applies in scene render properties.

## Operating procedure
1. Identify consumer use case.
2. Read aspect from consumer spec or default per `references/aspect-defaults.md`.
3. Read resolution from consumer spec or default per `references/resolution-defaults.md`.
4. Apply downscale margin (1.5x) if downstream resize is expected.
5. Pin DPI for print outputs.
6. List caveats.

## Decision tree

```txt
Web hero?
  → 16:9, 1920×1080 (or 2880×1620 for retina)
Square social?
  → 1:1, 2160×2160 (or 1080×1080 for old IG)
Mobile portrait?
  → 9:16, 1080×1920 (or 1440×2560 for high-DPI)
Cinematic banner?
  → 2.39:1, 2560×1080 (or 3840×1620 for 4K-banner)
Print A4 portrait?
  → 4:5 effective, 2480×3508 at 300 DPI
Print A4 landscape?
  → 5:4 effective, 3508×2480 at 300 DPI
Print A3?
  → 3508×4961 at 300 DPI
HDR display delivery?
  → Same as web; verify HDR pipeline
```

## Playbooks

### Playbook A: Web hero
16:9, 1920×1080 standard or 2880×1620 retina. Render once at retina; downscale for standard.

### Playbook B: Multi-format social
Portrait 9:16 1080×1920 + Square 1:1 1080×1080 + Wide 16:9 1920×1080 — render scene once at largest, crop / re-frame for others (or re-render with adjusted camera).

### Playbook C: Print poster A2
Final 5060×7160 at 300 DPI; render at this directly; do not upscale a smaller render.

### Playbook D: App icon
1024×1024 at 1:1; export multi-resolution downscales (256, 128, 64, 32) post-render.

## Mode handling

### Text-only mode
Resolution record only.

### Runtime-ready mode
After render, verify file dimensions match.

### Blocked runtime mode
Resolution record only.

## Validation checklist
- [ ] Aspect ratio chosen
- [ ] Resolution (W × H) chosen
- [ ] DPI / PPI for print
- [ ] Downscale margin if applicable
- [ ] Caveats listed

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Aspect + resolution + DPI explicit; matches consumer; downscale margin if needed. |
| Warn | Aspect set but resolution borderline (just-below recommended for use case). |
| Fail | Aspect mismatched (rendering 1:1 for 16:9 consumer); upscaling small renders to large delivery. |

## Failure handling
- Consumer unspecified → ask once; default to 16:9 1920×1080 web.
- Multi-format → render once at largest aspect; re-render or crop for others (document choice).
- Memory / time exceeds budget at chosen res → escalate to render queue or reduce.

## Troubleshooting

| Problem | Response |
|---|---|
| Final delivery looks soft | Probably upscaled from low-res; re-render at delivery res. |
| Aspect cropped wrong | Pre-render at correct aspect; do not crop. |
| Print too low-DPI | Render at delivery DPI from the start; do not upscale. |
| Consumer spec unclear | Ask once, then default per consumer category. |

## Best practices
- Render at the delivery aspect, not at "standard 16:9 then crop".
- 1.5x downscale margin only if you know downstream will resize; otherwise render at delivery exactly.
- For multi-format, plan camera animation or re-frame; do not just crop.
- Document res in render evidence.

## Good examples
- "Web hero. Aspect 16:9. Resolution 2880×1620 (retina). Downstream resize to 1920×1080 (standard) and 960×540 (mobile). Render once at retina; ImageMagick downscale post."

## Bad examples
- "1080p." — no aspect.

## User-facing response template

```txt
Consumer use case: <web hero / social / print / app icon / banner>
Aspect ratio: <ratio>
Resolution: <W × H>
DPI / PPI: <value if print, else "N/A">
Downscale margin: <yes 1.5x / no>

Multi-resolution outputs (if any):
  <output>: <W × H>

Caveats: <list>
Limitations: <gaps>
Next: render-export-evidence
```

## Anti-patterns
- "1080p" without aspect.
- Render small, upscale large.
- Crop instead of re-frame for different aspects.
- "Default size" answers.

## Cross-skill handoff
- Color management → `../color-management-decision/SKILL.md`
- Format → `../output-format-decision/SKILL.md`
- Engine → `../cycles-vs-eevee-decision/SKILL.md`
- Composition → `../composition-quality-checker/SKILL.md`
- Render evidence → `../render-export-evidence/SKILL.md`

## Non-goals
- Resize / upscale post-render.
- Run Blender.
- Calibrate display.

## References
- `references/aspect-defaults.md`
- `references/resolution-defaults.md`
- `references/print-vs-screen-rules.md`
- `../../docs/skill-system.md`
