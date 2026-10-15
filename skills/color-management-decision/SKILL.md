---
name: color-management-decision
description: Pin Display Device, View Transform, Look, and Sequencer per consumer pipeline (web sRGB, VFX ACES linear, game engine, print, GLB-Three.js) before render.
---

# color-management-decision

## Purpose
Avoid the most common Blender color mistake: rendering with the wrong color space and then "fixing" it in post. Pick the color management strategy upfront based on the consumer's color pipeline.

## Quick start
- Identify the consumer pipeline (`web sRGB` / `film/VFX ACES linear` / `game engine` / `print` / `GLB-Three.js`).
- Pin the 4-line render color config: `Display Device`, `View Transform`, `Look`, and `Sequencer`.
- Define per-output color transforms if multiple outputs exist.
- Emit the 4-line config record, caveats, truth states (`Not Run` / `Not Produced`), and handoff.

## When to use
- before render / lookdev pass
- when consumer color pipeline is known
- when a previous render had unexpected color shifts

## When not to use
- Post-render color grading or soft-proofing (handled by compositor / DCC after render).
- Validating per-material texture color spaces such as sRGB vs Non-Color/Linear (`material-quality-checker`).
- Selecting file formats or bit depths (`output-format-decision`).
- Choosing the render engine (`cycles-vs-eevee-decision`).
- Monitor hardware calibration (out of scope).
- Raw modeling without lookdev (color management does not affect geometry accuracy).

## Trigger phrases
- "what color space"
- "Filmic vs Standard"
- "ACEScg for our pipeline"
- "colors look weird"

## Prerequisites / readiness
- Consumer pipeline known (`web sRGB`, `film/VFX ACES linear`, `game engine`, `print`, or `GLB-Three.js`).
- Target output list known (or handed off from `output-format-decision`).

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Consumer pipeline | Determines `Display Device`, `View Transform`, `Look`, and `Sequencer` (`web sRGB`, `film/VFX ACES linear`, `game engine`, `print`, `GLB-Three.js`) |
| Target output list | Identifies which outputs need per-output color transform rules (file format ownership stays in `output-format-decision`) |

### Optional inputs

| Input | Use |
|---|---|
| Brand color spec | Add caveat on verifying brand color appearance under the chosen `View Transform` and `Look` |
| Existing scene color config | Identify mismatches causing unexpected color shifts |

### Assumptions to confirm
- The user knows the consumer pipeline (or is willing to confirm it before pinning).
- "Just looks good" is not a valid target; explicit consumer pipeline match is required.

## Output schema

### Primary output
A 4-line config record: `Display Device`, `View Transform`, `Look`, `Sequencer`.

### Secondary output
- Per-output color transform rules when multiple outputs are planned
- Caveats per choice
- Truth-state and evidence block

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

Rules:

* Default `Artifact status` is `Not Produced`.
* Truth states are downgrade-only, never upgrade.
* Pinning a color config never produces a render (`Runtime status: Not Run`, `Artifact status: Not Produced`).

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Decision skill — does not run Blender. Pins config; operator applies in scene render properties.

## Operating procedure
1. Identify the consumer pipeline (`web sRGB`, `film/VFX ACES linear`, `game engine`, `print`, or `GLB-Three.js`).
2. Map the pipeline to the 4-line scene render color config (see `references/pipeline-mapping.md`).
3. Pin `Display Device`, `View Transform`, `Look`, and `Sequencer`.
4. Document per-output color transforms if multiple outputs are required.
5. List pipeline caveats and delegate adjacent scopes (`material-quality-checker` for material texture spaces, `output-format-decision` for file formats, `cycles-vs-eevee-decision` for engine choice, `glb-web-handoff` for GLB web delivery, `render-export-evidence` for post-render verification).

## Decision tree

```txt
Web (sRGB)?
  -> Display Device: sRGB | View Transform: Filmic or AgX (Standard for flat unlit color) | Look: None | Sequencer: sRGB
Film / VFX with ACES (linear)?
  -> Display Device: sRGB | View Transform: AgX or Filmic (for viewport preview) | Look: None | Sequencer: sRGB | Per-output transform: scene-linear for linear handover (file format owned by output-format-decision)
Game engine?
  -> Display Device: sRGB | View Transform: Standard | Look: None | Sequencer: sRGB | Hand off per-material texture color-space validation to material-quality-checker
Print?
  -> Display Device: sRGB | View Transform: Filmic or AgX | Look: None | Sequencer: sRGB | Caveat: CMYK conversion/soft-proofing belongs to external print prep / DCC outside this skill
GLB-Three.js?
  -> Display Device: sRGB | View Transform: Filmic or AgX | Look: None | Sequencer: sRGB | Caveat: match with Three.js outputColorSpace via glb-web-handoff; delegate texture space checks to material-quality-checker
```

## Playbooks

### Playbook A: Web hero (web sRGB)
- `Display Device`: sRGB
- `View Transform`: Filmic (or AgX)
- `Look`: None (or Medium High Contrast if requested)
- `Sequencer`: sRGB
- Per-output transform: Bake display/view transform into display-referred web output (format owned by `output-format-decision`).

### Playbook B: Film / VFX ACES linear
- `Display Device`: sRGB
- `View Transform`: AgX
- `Look`: None
- `Sequencer`: sRGB
- Per-output transform: Preserve scene-linear data without baked view transform for VFX turnover (format owned by `output-format-decision`).

### Playbook C: Game engine
- `Display Device`: sRGB
- `View Transform`: Standard
- `Look`: None
- `Sequencer`: sRGB
- Per-output transform: Keep ungraded display transform; hand off per-material texture color-space checks to `material-quality-checker`.

### Playbook D: GLB-Three.js
- `Display Device`: sRGB
- `View Transform`: Filmic (or AgX)
- `Look`: None
- `Sequencer`: sRGB
- Per-output transform: Align Blender viewport lookdev transform with target Three.js `outputColorSpace = SRGBColorSpace` via `glb-web-handoff`; hand off material texture color-space validation to `material-quality-checker`.

## Mode handling

### Text-only mode
Emit the 4-line config record, per-output transforms, caveats, and truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

### Runtime-ready mode
Emit the 4-line config record, per-output transforms, and caveats for the operator to apply in Blender scene render properties. Because this skill never runs Blender and pinning a config never produces a render, keep `Runtime status: Not Run` and `Artifact status: Not Produced` until `render-export-evidence` evaluates actual output.

### Blocked runtime mode
Emit the 4-line config record, per-output transforms, caveats, and truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

## Validation checklist
- [ ] Consumer pipeline identified (`web sRGB`, `film/VFX ACES linear`, `game engine`, `print`, or `GLB-Three.js`)
- [ ] All 4 lines pinned (`Display Device`, `View Transform`, `Look`, `Sequencer`)
- [ ] Per-output color transform rules specified when multiple outputs exist
- [ ] Caveats listed and no subjective "looks good" verdict used
- [ ] Truth states set to `Runtime status: Not Run` and `Artifact status: Not Produced` (downgrade-only; pinning never produces a render)
- [ ] No role blur into per-material texture spaces (`material-quality-checker`), file formats (`output-format-decision`), engine choice (`cycles-vs-eevee-decision`), post-render grading, or monitor calibration

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Pipeline-correct 4-line config pinned; per-output color transforms explicit; role boundaries respected; truth states accurately set (`Not Run` / `Not Produced`). |
| Warn | 4-line config pinned accurately, but a minor caveat for one output transform or downstream handoff is incomplete. |
| Fail | Wrong pipeline match (e.g., baking a display-referred `View Transform` into a linear VFX turnover); missing any of the 4 config lines; skipped per-output rules; upgrading truth states on a pinned config; crossing into texture validation, format selection, engine choice, post-grading, or monitor calibration; "looks good" verdict. |

## Failure handling
- Pipeline unknown: ask once; if still unspecified, state assumption and default to `web sRGB` (`Display Device: sRGB`, `View Transform: Filmic`, `Look: None`, `Sequencer: sRGB`).
- Mixed pipelines from the same scene (e.g., `web sRGB` preview + `film/VFX ACES linear` turnover): specify distinct per-output color transform rules so the operator applies each transform per output pass without mixing baked and scene-linear color spaces.

## Troubleshooting

| Problem | Response |
|---|---|
| Highlights clip or colors look washed out in lit scenes | Verify `View Transform` is `Filmic` or `AgX` rather than `Standard` for high-dynamic-range lighting. |
| Colors appear overly contrasty | Set `Look` to `None`, or compare `Filmic` vs `AgX` view transforms. |
| Flat UI / unlit brand color shifts under tone mapping | Use `View Transform: Standard` with `Look: None` only when exact flat sRGB hex preservation is required over photoreal lighting roll-off, and document the caveat. |
| Per-material texture looks too bright or normal map looks wrong | Out of scope for scene render config — hand off to `material-quality-checker` to validate per-material texture color spaces. |

## Best practices
- One config per render, not "default and hope".
- Verify with a known reference (color chart or brand color).
- Document choices in scene metadata.
- Avoid post-process color grading inside Blender for web — let the consumer do it.

## Good examples
- "Consumer pipeline: `web sRGB`. `Display Device`: sRGB. `View Transform`: Filmic. `Look`: None. `Sequencer`: sRGB. Per-output rule: apply display/view transform to web delivery output (file format pinned via `output-format-decision`). `Runtime status`: Not Run. `Artifact status`: Not Produced."

## Bad examples
- "Use Filmic." — no pipeline context.

## User-facing response template

```txt
Consumer pipeline: <web sRGB | film/VFX ACES linear | game engine | print | GLB-Three.js>
Output(s): <list>

Color management config:
  Display Device: <…>
  View Transform: <…>
  Look: <…>
  Sequencer: <…>

Per-output rules:
  <output>: <per-output color transform rule>

Caveats: <list>
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: <render-export-evidence | material-quality-checker | output-format-decision | cycles-vs-eevee-decision | glb-web-handoff>
```

## Anti-patterns
- Saying "Just use Filmic" without identifying the consumer pipeline.
- Claiming `Produced` or `Verified` artifact/runtime status when only pinning a color config.
- Auditing per-material texture nodes here instead of handing off to `material-quality-checker`.
- Prescribing file containers/codecs here instead of handing off to `output-format-decision`.
- Doing post-render color grading inside the scene color-management decision step.

## Cross-skill handoff
- Output format selection → `../output-format-decision/SKILL.md` (owns file formats and bit depths)
- Material texture color spaces → `../material-quality-checker/SKILL.md` (validates per-material sRGB vs Linear/Non-Color texture inputs)
- Render engine choice → `../cycles-vs-eevee-decision/SKILL.md` (owns Cycles vs EEVEE selection)
- GLB Three.js delivery → `../glb-web-handoff/SKILL.md` (aligns exported GLB with Three.js renderer color settings)
- Render evidence verification → `../render-export-evidence/SKILL.md` (verifies actual rendered artifacts after operator execution)

## Non-goals
- Validate per-material texture color spaces (`material-quality-checker`).
- Choose output file formats or bit depths (`output-format-decision`).
- Choose the render engine (`cycles-vs-eevee-decision`).
- Perform post-render color grading (belongs to compositor / DCC).
- Calibrate a physical monitor (out of scope).
- Run Blender or execute renders.

## References
- `references/pipeline-mapping.md`
- `references/per-channel-rules.md`
- `references/look-comparison.md`
- `../../docs/skill-system.md`
