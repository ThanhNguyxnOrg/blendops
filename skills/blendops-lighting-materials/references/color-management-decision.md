
# blendops-lighting-materials (reference for `blendops-lighting-materials`)

> Detailed playbook carried over from the former `blendops-lighting-materials` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

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

## Trigger phrases

## Prerequisites / readiness
- Consumer pipeline known (`web sRGB`, `film/VFX ACES linear`, `game engine`, `print`, or `GLB-Three.js`).
- Target output list known (or handed off from `blendops-render-settings`).

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Consumer pipeline | Determines `Display Device`, `View Transform`, `Look`, and `Sequencer` (`web sRGB`, `film/VFX ACES linear`, `game engine`, `print`, `GLB-Three.js`) |
| Target output list | Identifies which outputs need per-output color transform rules (file format ownership stays in `blendops-render-settings`) |

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
Artifact status: Not Produced | Produced | Verified | Failed
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
5. List pipeline caveats and delegate adjacent scopes (`blendops-lighting-materials` for material texture spaces, `blendops-render-settings` for file formats, `blendops-render-settings` for engine choice, `blendops-glb-web-handoff` for GLB web delivery, `blendops-final-check` for post-render verification).

## Decision tree

```txt
Web (sRGB)?
  -> Display Device: sRGB | View Transform: Filmic or AgX (Standard for flat unlit color) | Look: None | Sequencer: sRGB
Film / VFX with ACES (linear)?
  -> Display Device: sRGB | View Transform: AgX or Filmic (for viewport preview) | Look: None | Sequencer: sRGB | Per-output transform: scene-linear for linear handover (file format owned by blendops-render-settings)
Game engine?
  -> Display Device: sRGB | View Transform: Standard | Look: None | Sequencer: sRGB | Hand off per-material texture color-space validation to blendops-lighting-materials
Print?
  -> Display Device: sRGB | View Transform: Filmic or AgX | Look: None | Sequencer: sRGB | Caveat: CMYK conversion/soft-proofing belongs to external print prep / DCC outside this skill
GLB-Three.js?
  -> Display Device: sRGB | View Transform: Filmic or AgX | Look: None | Sequencer: sRGB | Caveat: match with Three.js outputColorSpace via blendops-glb-web-handoff; delegate texture space checks to blendops-lighting-materials
```

## Playbooks

### Playbook A: Web hero (web sRGB)
- `Display Device`: sRGB
- `View Transform`: Filmic (or AgX)
- `Look`: None (or Medium High Contrast if requested)
- `Sequencer`: sRGB
- Per-output transform: Bake display/view transform into display-referred web output (format owned by `blendops-render-settings`).

### Playbook B: Film / VFX ACES linear
- `Display Device`: sRGB
- `View Transform`: AgX
- `Look`: None
- `Sequencer`: sRGB
- Per-output transform: Preserve scene-linear data without baked view transform for VFX turnover (format owned by `blendops-render-settings`).

### Playbook C: Game engine
- `Display Device`: sRGB
- `View Transform`: Standard
- `Look`: None
- `Sequencer`: sRGB
- Per-output transform: Keep ungraded display transform; hand off per-material texture color-space checks to `blendops-lighting-materials`.

### Playbook D: GLB-Three.js
- `Display Device`: sRGB
- `View Transform`: Filmic (or AgX)
- `Look`: None
- `Sequencer`: sRGB
- Per-output transform: Align Blender viewport lookdev transform with target Three.js `outputColorSpace = SRGBColorSpace` via `blendops-glb-web-handoff`; hand off material texture color-space validation to `blendops-lighting-materials`.

## Mode handling

### Text-only mode
Emit the 4-line config record, per-output transforms, caveats, and truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

### Runtime-ready mode
Emit the 4-line config record, per-output transforms, and caveats for the operator to apply in Blender scene render properties. Because this skill never runs Blender and pinning a config never produces a render, keep `Runtime status: Not Run` and `Artifact status: Not Produced` until `blendops-final-check` evaluates actual output.

### Blocked runtime mode
Emit the 4-line config record, per-output transforms, caveats, and truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

## Validation checklist
- [ ] Consumer pipeline identified (`web sRGB`, `film/VFX ACES linear`, `game engine`, `print`, or `GLB-Three.js`)
- [ ] All 4 lines pinned (`Display Device`, `View Transform`, `Look`, `Sequencer`)
- [ ] Per-output color transform rules specified when multiple outputs exist
- [ ] Caveats listed and no subjective "looks good" verdict used
- [ ] Truth states set to `Runtime status: Not Run` and `Artifact status: Not Produced` (downgrade-only; pinning never produces a render)
- [ ] No role blur into per-material texture spaces (`blendops-lighting-materials`), file formats (`blendops-render-settings`), engine choice (`blendops-render-settings`), post-render grading, or monitor calibration

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
| Per-material texture looks too bright or normal map looks wrong | Out of scope for scene render config — hand off to `blendops-lighting-materials` to validate per-material texture color spaces. |

## Best practices
- One config per render, not "default and hope".
- Verify with a known reference (color chart or brand color).
- Document choices in scene metadata.
- Avoid post-process color grading inside Blender for web — let the consumer do it.

## Good examples
- "Consumer pipeline: `web sRGB`. `Display Device`: sRGB. `View Transform`: Filmic. `Look`: None. `Sequencer`: sRGB. Per-output rule: apply display/view transform to web delivery output (file format pinned via `blendops-render-settings`). `Runtime status`: Not Run. `Artifact status`: Not Produced."

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
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: <blendops-final-check | blendops-lighting-materials | blendops-render-settings | blendops-render-settings | blendops-glb-web-handoff>
```

## Anti-patterns
- Saying "Just use Filmic" without identifying the consumer pipeline.
- Claiming `Produced` or `Verified` artifact/runtime status when only pinning a color config.
- Auditing per-material texture nodes here instead of handing off to `blendops-lighting-materials`.
- Prescribing file containers/codecs here instead of handing off to `blendops-render-settings`.
- Doing post-render color grading inside the scene color-management decision step.

## Cross-skill handoff

## Non-goals
- Validate per-material texture color spaces (`blendops-lighting-materials`).
- Choose output file formats or bit depths (`blendops-render-settings`).
- Choose the render engine (`blendops-render-settings`).
- Perform post-render color grading (belongs to compositor / DCC).
- Calibrate a physical monitor (out of scope).
- Run Blender or execute renders.

## References
- `references/pipeline-mapping.md`
- `references/per-channel-rules.md`
- `references/look-comparison.md`
- `../../docs/skill-system.md`
