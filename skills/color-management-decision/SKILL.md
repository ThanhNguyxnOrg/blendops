---
name: color-management-decision
description: Pick the right color management config (sRGB / Filmic / ACEScg / Standard) per output context before render, so colors travel correctly to the consumer.
---

# color-management-decision

## Purpose
Avoid the most common Blender color mistake: rendering with the wrong color space and then "fixing" it in post. Pick the color management strategy upfront based on the consumer's color pipeline.

## Quick start
- name the consumer (web / print / video / game engine / film)
- pick one of: sRGB / Filmic / Standard / AgX / ACEScg
- pin per-output transform (display + view transform + look)
- emit a 4-line config record + handoff

## When to use
- before render / lookdev pass
- when consumer color pipeline is known
- when a previous render had unexpected color shifts

## When not to use
- post-render color grading (handled by compositor / DCC after render)
- raw modeling without lookdev (color management does not affect model accuracy)

## Trigger phrases
- "what color space"
- "Filmic vs Standard"
- "ACEScg for our pipeline"
- "colors look weird"

## Prerequisites / readiness
- consumer pipeline known
- target output format known (PNG / EXR / video / GLB)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Consumer pipeline | sRGB web vs ACEScg film |
| Target output format | PNG/EXR drive different transforms |

### Optional inputs

| Input | Use |
|---|---|
| Reference image color | Match calibration |
| Brand color spec | Verify primary brand colors render correctly |

### Assumptions to confirm
- The user knows the consumer pipeline (or willing to ask).
- "Just looks good" is not a target; explicit pipeline match is.

## Output schema

### Primary output
A 4-line config record: Display Device, View Transform, Look, Sequencer.

### Secondary output
- per-output transform if multiple outputs (PNG + EXR + GLB)
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

Decision skill — does not run Blender. Pins config; operator applies in scene render properties.

## Operating procedure
1. Identify consumer pipeline.
2. Map to color management config (see `references/pipeline-mapping.md`).
3. Pin Display Device + View Transform + Look + Sequencer.
4. Document per-output transform if multiple outputs.
5. List caveats.

## Decision tree

```txt
Web (sRGB)?
  → Display sRGB, View Filmic (or Standard for pure flat color), Look None
Film / VFX with ACES (linear)?
  → Display sRGB, View AgX or Filmic, Look None; render output as EXR linear
Game engine (linear / sRGB textures)?
  → Display sRGB, View Standard; export textures as PNG sRGB / Linear per channel
Print?
  → Display sRGB; soft-proof to CMYK in compositor; usually delegate to print prep tool
```

## Playbooks

### Playbook A: Web hero (sRGB PNG)
Display: sRGB. View Transform: Filmic. Look: None or Medium High Contrast. Sequencer: sRGB. Output: PNG 8-bit sRGB.

### Playbook B: Film / VFX EXR
Display: sRGB. View Transform: AgX. Look: None. Sequencer: sRGB. Output: OpenEXR Linear 16-bit half float.

### Playbook C: Game engine (Unity / Unreal)
Display: sRGB. View Transform: Standard. Look: None. Output: per-texture rules (color textures sRGB, data textures Linear).

### Playbook D: GLB for web (Three.js)
Display: sRGB. View Transform: Filmic. Look: None. GLB embedded textures: color = sRGB, data = Linear. Three.js renderer.outputColorSpace = SRGBColorSpace.

## Mode handling

### Text-only mode
Config record only.

### Runtime-ready mode
Config record + verified by render preview cross-check (Filmic looks darker than Standard for lit scenes; verify intent).

### Blocked runtime mode
Config record only.

## Validation checklist
- [ ] Consumer pipeline identified
- [ ] Display Device + View Transform + Look + Sequencer pinned
- [ ] Per-output transform if multiple outputs
- [ ] Caveats listed
- [ ] No "looks good" verdict

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Pipeline-correct config; all 4 lines pinned; per-output rules explicit. |
| Warn | Config pinned but caveat for one output type missing. |
| Fail | Wrong pipeline match (e.g. Filmic for ACES VFX); skipped per-output rules; "looks good" verdict. |

## Failure handling
- Pipeline unknown → ask once; default to sRGB+Filmic for web.
- Mixed pipelines (web preview + VFX EXR from same scene) → set per-output, render multiple times if needed.

## Troubleshooting

| Problem | Response |
|---|---|
| Colors washed out | Verify View Transform is not Standard for HDR scenes; Filmic is better. |
| Colors too contrasty | Try Look = None; or use AgX. |
| Brand color reads wrong | Verify color picker is in linear vs sRGB intentionally. |
| Texture appears too bright | Verify color texture is loaded sRGB; data texture loaded Linear. |

## Best practices
- One config per render, not "default and hope".
- Verify with a known reference (color chart or brand color).
- Document choices in scene metadata.
- Avoid post-process color grading inside Blender for web — let the consumer do it.

## Good examples
- "Consumer: web hero PNG. Display: sRGB. View Transform: Filmic. Look: None. Sequencer: sRGB. Output: PNG 8-bit sRGB."

## Bad examples
- "Use Filmic." — no pipeline context.

## User-facing response template

```txt
Consumer pipeline: <web / VFX-ACES / game-engine / print / GLB-Three.js>
Output(s): <list>

Color management config:
  Display Device: <…>
  View Transform: <…>
  Look: <…>
  Sequencer: <…>

Per-output rules:
  <output>: <transform / file format>

Caveats: <list>
Limitations: <gaps>
Next: render-export-evidence
```

## Anti-patterns
- "Just use Filmic" without pipeline context.
- Mixing color spaces between scene textures and view transform without intent.
- Post-render color grading inside the same render pass.

## Cross-skill handoff
- Render evidence → `../render-export-evidence/SKILL.md`
- Material check → `../material-quality-checker/SKILL.md`
- Output format → `../output-format-decision/SKILL.md`
- Engine choice → `../cycles-vs-eevee-decision/SKILL.md`

## Non-goals
- Color-grade in post.
- Run Blender.
- Calibrate a monitor.

## References
- `references/pipeline-mapping.md`
- `references/per-channel-rules.md`
- `references/look-comparison.md`
- `../../docs/skill-system.md`
