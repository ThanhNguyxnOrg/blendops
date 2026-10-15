---
name: output-format-decision
description: Pick the right output file format (PNG / JPG / WebP / OpenEXR / TIFF) per use case based on bit depth, compression, transparency, and consumer support.
---

# output-format-decision

## Purpose
Avoid mismatched output formats (e.g., JPEG for VFX, EXR for web, TIFF for social). Match format to consumer pipeline.

## Quick start
- name the consumer
- pick one format per output stream
- pin bit depth + compression + alpha rules
- emit a 4-line config

## When to use
- before render
- when consumer requires specific format
- when transparency / HDR / loss tolerance matters

## When not to use
- raw modeling without rendering
- 3D/GLB exports (out of scope — use `glb-web-handoff`, `glb-mobile-performance-budget`, or `glb-animation-handoff`)
- verifying saved files on disk after rendering (use `render-export-evidence`)

## Trigger phrases
- "PNG or JPEG"
- "do we need EXR"
- "what format for the web"

## Prerequisites / readiness
- consumer pipeline known
- color management decision made (`color-management-decision`)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Consumer | Drives format choice per output stream |
| Color management config | Consumed from `color-management-decision` to align bit depth and container support |
| Transparency required? | Drives alpha channel and container choice (e.g., PNG/WebP/OpenEXR vs JPG) |

### Optional inputs

| Input | Use |
|---|---|
| File-size budget | Guides lossless vs lossy compression decision |

### Assumptions to confirm
- The consumer pipeline can read the chosen container/codec (verify if non-default).
- Lossy compression is acceptable when chosen.

## Output schema

### Primary output
A 4-line format record per output stream: format, bit depth, compression, alpha.

### Secondary output
- per-output stream rules
- caveats per choice
- evidence label

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

* Default states for this decision skill: `Runtime status: Not Run`, `Artifact status: Not Produced`.
* Truth states are downgrade-only, never upgrade. Pinning a format never produces a file.

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Decision skill — does not run Blender. Pins format; operator applies to scene render output.

## Operating procedure
1. Identify consumer pipeline + consume color config from `color-management-decision`.
2. Select format per `references/format-decision-matrix.md`.
3. Pin bit depth + compression + alpha per output stream.
4. List stream rules and caveats.
5. Hand off format record to operator (and to `resolution-aspect-decision` if resolution is unpinned, or `render-export-evidence` once rendered).

## Decision tree

```txt
Web hero (consuming sRGB config)?
  → PNG (lossless) or WebP (lossy/lossless); 8-bit; alpha if needed
JPEG-only consumer?
  → JPG; 8-bit; no alpha; lossy quality 85-95
VFX / film pipeline (consuming Linear config)?
  → OpenEXR; 16-bit half float; ZIP compression; alpha as channel
Print?
  → TIFF; 16-bit; LZW or no compression; alpha optional per print prep
Social / mobile (WebP-first)?
  → WebP; 8-bit; alpha optional; lossy quality 85-90
HDR display delivery?
  → PNG 16-bit or OpenEXR; verify consumer supports HDR container
```

## Playbooks

### Playbook A: Web hero PNG
PNG, 8-bit per channel, lossless compression, alpha if needed (consumes color config from `color-management-decision`).

### Playbook B: VFX EXR
OpenEXR, 16-bit half float, ZIP compression, alpha as channel. Multi-pass support (consumes Linear config from `color-management-decision`).

### Playbook C: Mobile-first social
WebP, 8-bit, quality 85-90 compression, alpha optional (consumes color config from `color-management-decision`).

### Playbook D: Print
TIFF, 16-bit, LZW or no compression, alpha optional (consumes color config from `color-management-decision`; resolution owned by `resolution-aspect-decision`).

## Mode handling

### Text-only mode
Emit format record + per-stream rules + caveats (`Runtime status: Not Run`, `Artifact status: Not Produced`).

### Runtime-ready mode
Emit format record for the operator to apply in Blender render output settings. Pinning a format never produces or verifies a file; hand off post-render file verification to `render-export-evidence`.

### Blocked runtime mode
Emit format record only (`Runtime status: Not Run`, `Artifact status: Not Produced`).

## Validation checklist
- [ ] Consumer + color config identified
- [ ] Format chosen
- [ ] Bit depth chosen
- [ ] Compression chosen
- [ ] Alpha rule explicit
- [ ] Caveats listed

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Format + bit depth + compression + alpha pinned; matches consumer; caveats listed. |
| Warn | Format pinned but compression / alpha ambiguous. |
| Fail | Wrong format for consumer (JPEG for VFX, EXR for web), missing bit depth, "any format" answer. |

## Failure handling
- Consumer unknown → ask once; if still unknown, default to PNG, 8-bit, lossless compression, alpha enabled (paired with upstream `color-management-decision`).
- Multiple consumers → define one format record per output stream (or pin the most restrictive format if single-stream delivery is required).

## Troubleshooting

| Problem | Response |
|---|---|
| File too large | Reduce bit depth, increase compression, or switch stream to WebP / JPG |
| HDR data lost | Switch container/bit depth to OpenEXR (16-bit half float) or PNG 16-bit |
| Alpha disappeared | Verify chosen format supports alpha (PNG / WebP / OpenEXR / TIFF yes; JPG no) |
| Color shift in delivered file | Hand off to `color-management-decision` to verify color config and consumer display transform |

## Best practices
- Define one format record per consumer output stream; never convert or re-encode files post-render.
- For web: use WebP or PNG based on consumer support and alpha/compression requirements.
- For VFX: always pin OpenEXR; never pin JPG or 8-bit PNG for compositing pipelines.
- Pass the pinned format record to `render-export-evidence` for post-render verification.

## Good examples
- "Web hero stream: PNG, 8-bit, lossless compression, alpha enabled (using upstream color config from `color-management-decision`)."

## Bad examples
- "Save as PNG." — missing bit depth, compression, and alpha rules.

## User-facing response template

```txt
Consumer: <web / VFX / print / social / mobile>
Color config: <reference color-management-decision output>

Output(s):
  <stream>: <format>, <bit depth>, <compression>, <alpha>

Caveats: <list>
Limitations: <gaps>
Next: render-export-evidence
```

## Anti-patterns
- "Any format will work."
- JPEG for VFX.
- 8-bit for HDR delivery.
- Lossy compression where archival is required.

## Cross-skill handoff
- Color management → `../color-management-decision/SKILL.md`
- Resolution & aspect ratio → `../resolution-aspect-decision/SKILL.md`
- Engine choice → `../cycles-vs-eevee-decision/SKILL.md`
- Render file verification → `../render-export-evidence/SKILL.md`
- 3D / GLB exports (out of scope here) → `../glb-web-handoff/SKILL.md`, `../glb-mobile-performance-budget/SKILL.md`, `../glb-animation-handoff/SKILL.md`

## Non-goals
- Convert formats post-render.
- Run Blender.
- Compress / re-encode files.

## References
- `references/format-decision-matrix.md`
- `references/bit-depth-rules.md`
- `references/compression-tradeoffs.md`
- `../../docs/skill-system.md`
