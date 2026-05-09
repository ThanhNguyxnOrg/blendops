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
- 3D exports (use `glb-mobile-performance-budget` / `glb-animation-handoff`)

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
| Consumer | Drives format choice |
| Color management config | Filmic / sRGB / Linear affects format |
| Transparency required? | Drives PNG vs JPG |

### Optional inputs

| Input | Use |
|---|---|
| File-size budget | Compression decision |
| Multi-resolution requirement | Format-per-tier |

### Assumptions to confirm
- The consumer can read the chosen format (verify if non-default).
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

Decision skill — does not run Blender. Pins format; operator applies to scene render output.

## Operating procedure
1. Identify consumer + color management config.
2. Select format per `references/format-decision-matrix.md`.
3. Pin bit depth + compression + alpha.
4. List caveats.
5. Hand off to render evidence.

## Decision tree

```txt
Web hero (sRGB)?
  → PNG (lossless) or WebP (smaller, modern browsers); 8-bit; alpha if needed
JPEG-only consumer?
  → JPG; 8-bit; no alpha; quality 85-95
VFX / film pipeline?
  → OpenEXR; 16-bit half float; ZIP compression; alpha as channel
Print?
  → TIFF; 16-bit; LZW or no compression; CMYK/sRGB per print prep
Social / mobile (WebP-first)?
  → WebP; 8-bit; alpha optional; quality 85-90
HDR display delivery?
  → PNG-16 or OpenEXR; verify consumer supports HDR display
```

## Playbooks

### Playbook A: Web hero PNG
PNG, 8-bit per channel, sRGB color space, alpha if needed. Output ~2-5 MB at 1920×1080.

### Playbook B: VFX EXR
OpenEXR, 16-bit half float, Linear, alpha as channel, ZIP compression. Multi-pass support.

### Playbook C: Mobile-first social
WebP, 8-bit, sRGB, alpha optional, quality 85-90. Output ~50-200 KB at 1080×1080.

### Playbook D: Print
TIFF, 16-bit, sRGB, no compression. Output 5-50 MB at print resolution.

## Mode handling

### Text-only mode
Format record only.

### Runtime-ready mode
After render, verify file actually saved in chosen format + bit depth.

### Blocked runtime mode
Format record only.

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
- Consumer unknown → ask once; default to PNG sRGB 8-bit.
- Multiple consumers → pick most-restrictive, render once; or render multiple outputs.

## Troubleshooting

| Problem | Response |
|---|---|
| File too large | Reduce bit depth, increase compression, switch to WebP / JPG |
| HDR data lost | Switch to OpenEXR or PNG 16-bit |
| Alpha disappeared | Verify format supports alpha (PNG / WebP / EXR yes; JPG no) |
| Color shift in delivered file | Verify color management config matches; verify consumer handles sRGB correctly |

## Best practices
- Render once per consumer; do not "convert later" unless testing.
- For web: WebP is smaller than PNG with same quality; use it if consumer supports.
- For VFX: always EXR; never JPG / PNG for that pipeline.
- Document the format in render evidence.

## Good examples
- "Web hero. PNG, 8-bit, sRGB, alpha if needed. Compression: lossless."

## Bad examples
- "Save as PNG." — no bit depth, color space.

## User-facing response template

```txt
Consumer: <web / VFX / print / social / mobile / GLB>
Color config: <reference color-management-decision output>

Output(s):
  <stream>: <format>, <bit depth>, <color space>, <compression>, <alpha>

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
- Render evidence → `../render-export-evidence/SKILL.md`
- Engine choice → `../cycles-vs-eevee-decision/SKILL.md`
- Resolution → `../resolution-aspect-decision/SKILL.md`

## Non-goals
- Convert formats post-render.
- Run Blender.
- Compress / re-encode files.

## References
- `references/format-decision-matrix.md`
- `references/bit-depth-rules.md`
- `references/compression-tradeoffs.md`
- `../../docs/skill-system.md`
