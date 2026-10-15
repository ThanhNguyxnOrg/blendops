---
name: cycles-vs-eevee-decision
description: Pick Cycles, Eevee, or Workbench for a render based on quality bar, time budget, and feature requirements (caustics, subsurface, etc.). Note: Eevee was named Eevee Next on Blender 4.2-4.x only.
---

# cycles-vs-eevee-decision

## Purpose
Pick the render engine upfront based on quality + time tradeoff and feature requirements. Avoid the "use Cycles always" / "Eevee is faster" oversimplifications.

## Quick start
- Name the use case (hero / preview / animation / lookdev / flat clay).
- Evaluate required rendering features (caustics / subsurface scattering / volumetrics / global illumination accuracy).
- Evaluate time budget per frame and available hardware.
- Pick the engine: `Cycles`, `Eevee`, or `Workbench` (note: Eevee used the name Eevee Next and token `BLENDER_EEVEE_NEXT` on Blender 4.2–4.x only; it is `Eevee` with token `BLENDER_EEVEE` on 4.0–4.1 and 5.x).
- Pin the 4-item engine record: engine + samples + GPU device (if applicable) + caveats.

## When to use
- before render
- when feature support drives engine choice
- when time vs quality tradeoff matters
- when previous render was wrong engine

## When not to use
- for a known repeat render (engine already chosen)
- for non-render work (modeling / animation prep)

## Trigger phrases
- "Cycles or Eevee"
- "what render engine"
- "is Eevee enough"
- "render is too slow"

## Prerequisites / readiness
- use case known
- features needed known (caustics? SSS? volumetrics?)
- machine specs known (GPU? memory?)
- time budget known

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Use case | Hero vs preview drives quality threshold |
| Feature requirements | Determines engine compatibility |
| Time budget per frame | Drives engine + samples |

### Optional inputs

| Input | Use |
|---|---|
| GPU available | Cycles GPU dramatically faster |
| Reference quality bar | Calibrate samples |

### Assumptions to confirm
- The user accepts the tradeoff (Eevee is fast but approximates GI; Cycles is slow but accurate).
- Multi-engine workflow (Eevee preview, Cycles final) is common and valid.

## Output schema

### Primary output
A 4-item engine record per use case:
1. Engine (`Cycles` / `Eevee` / `Workbench`, plus version token `BLENDER_EEVEE` for 4.0–4.1 and 5.x or `BLENDER_EEVEE_NEXT` for 4.2–4.x if a token is needed)
2. Samples (pinned target sample count from consumer/project spec or reference table)
3. GPU device (pinned target compute device for the operator to set in scene render properties, or `CPU` fallback)
4. Caveats (feature tradeoffs, time budget notes, hardware assumptions)

### Secondary output
- Per-stream engine record if using a multi-engine workflow (for example, `Eevee` for lookdev preview and `Cycles` for final hero render)
- Evidence and truth-state block

### Evidence / caveat output

```txt
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <project spec, hardware spec, or "none">
Limitations: <unconfirmed hardware/time budget, denoiser/render optimization deferred>
```

> **Truth-state rule:** Pinning an engine is a planning decision and never produces a render. Default to `Runtime status: Not Run` and `Artifact status: Not Produced`. Truth states are downgrade-only and must never be upgraded by this skill.

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Decision skill — does not run Blender. Pins config; operator applies in scene render properties.

## Operating procedure

1. Identify the use case, required shading/lighting features, and per-frame time budget.
2. Consult `references/engine-feature-matrix.md` to match feature requirements to `Cycles`, `Eevee`, or `Workbench`.
3. If specifying an internal Blender engine token for `Eevee`, use `BLENDER_EEVEE` on Blender 4.0–4.1 and 5.x, and `BLENDER_EEVEE_NEXT` on Blender 4.2–4.x only. Never present `Eevee Next` as the current name.
4. Pin target samples per `references/samples-by-quality.md` and GPU/CPU compute device per `references/gpu-device-rules.md` (without configuring denoisers, tile sizes, or engine-specific optimizations).
5. List caveats and set truth states to `Runtime status: Not Run` and `Artifact status: Not Produced`.
6. Hand off sibling decisions (`color-management-decision`, `output-format-decision`, `resolution-aspect-decision`) and post-render verification (`render-export-evidence`).

## Decision tree

```txt
Need path-traced caustics, complex refraction, or physically accurate volumetric/indirect light?
  → Cycles
Final hero quality where time budget and GPU/CPU hardware allow path tracing?
  → Cycles
Real-time viewport preview, fast iteration, or lookdev?
  → Eevee (token: BLENDER_EEVEE on 4.0-4.1 & 5.x; BLENDER_EEVEE_NEXT on 4.2-4.x)
High-frame-count animation with a tight per-frame time budget where approximated GI is acceptable?
  → Eevee (or Cycles only if confirmed hardware + time budget accommodate path tracing)
Stylized / non-photorealistic raster look?
  → Eevee or Workbench
Pure flat silhouette, matcap, or clay check?
  → Workbench
```

## Playbooks

### Playbook A: Hero path-traced render

Pick `Cycles`, pin sample count from `references/samples-by-quality.md` and target GPU device from `references/gpu-device-rules.md`, and note time-budget caveats. Leave denoiser and advanced render-setting tuning out of scope.

### Playbook B: Fast preview / lookdev pass

Pick `Eevee` (`BLENDER_EEVEE` on 4.0–4.1 and 5.x; `BLENDER_EEVEE_NEXT` on 4.2–4.x), pin preview sample count and GPU execution, and note global illumination approximation caveats.

### Playbook C: Tight-budget multi-frame animation

Pick `Eevee` when per-frame time budget rules out path tracing and feature requirements do not mandate `Cycles`; document any refraction or indirect-lighting tradeoffs in Caveats.

### Playbook D: Stylized or clay pass

Pick `Eevee` or `Workbench` based on whether shader evaluation (`Eevee`) or flat/matcap inspection (`Workbench`) is required; pin sample count and hardware target.

## Mode handling

### Text-only mode

Return the engine record (engine + samples + GPU device + caveats) with `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Runtime-ready mode

Return the exact same engine record with `Runtime status: Not Run` and `Artifact status: Not Produced` for the operator to apply in scene render properties. Never claim a render preview was run or verified; actual rendered file verification belongs to `render-export-evidence`.

### Blocked runtime mode

Return the engine record, caveats, and truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

## Validation checklist

* [ ] Use case, feature needs, and time budget evaluated
* [ ] Engine chosen (`Cycles`, `Eevee`, or `Workbench`—never presenting `Eevee Next` as the current name)
* [ ] Correct engine token used if version-specific token is referenced (`BLENDER_EEVEE` on 4.0–4.1/5.x; `BLENDER_EEVEE_NEXT` on 4.2–4.x)
* [ ] Samples and GPU/CPU device pinned without bundling denoiser or tile optimizations
* [ ] Caveats and downgrade-only truth states (`Not Run` / `Not Produced`) included

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Engine matches features + quality + time; samples appropriate; caveats explicit. |
| Warn | Borderline call (Eevee for hero with weak GI rendering); time budget tight. |
| Fail | Engine does not support required feature (Eevee for caustics); samples severely under-budget; "use Cycles" for animation that needs Eevee. |

## Failure handling
- Required feature unsupported → switch to engine that supports it; reject the impossible config.
- Time budget impossible at chosen samples → either lower samples (Warn) or change engine.
- GPU not available → Cycles falls back to CPU (much slower); recommend Eevee for previews.

## Troubleshooting

| Problem | Response |
| --- | --- |
| `Cycles` exceeds per-frame time budget | Confirm GPU device is pinned over CPU, lower pinned sample target within quality tolerance, or switch non-final passes to `Eevee`. |
| `Eevee` lacks required caustics or accurate refraction | Switch those shots to `Cycles` and document the per-frame time impact in Caveats. |
| Indirect bounce lighting in `Eevee` misses hero realism bar | Switch the final pass to `Cycles` while keeping `Eevee` for lookdev iteration. |
| Volumetric lighting lacks path-traced accuracy in `Eevee` | Pin `Cycles` for shots requiring physically accurate volumetric light transport. |

## Best practices

* Use `Eevee` for fast lookdev/iteration and `Cycles` for final path-traced hero delivery when both speed and physical accuracy matter.
* Always use current `Eevee` naming, noting `Eevee Next` (`BLENDER_EEVEE_NEXT`) only when targeting Blender 4.2–4.x.
* Keep this decision strictly to `engine + samples + GPU device + caveats`—leave denoiser specifics, tile sizes, color management, output format, and resolution to their dedicated skills or operator tuning.
* Pass the pinned engine record downstream so `render-export-evidence` can record it alongside verified output artifacts after rendering.

## Good examples

* "Use case: Hero product render requiring accurate glass refraction. Engine: `Cycles`. Samples: pinned per project quality tier. GPU device: pinned to available hardware GPU. Caveats: higher per-frame render time than `Eevee`; denoiser specifics out of scope. `Runtime status: Not Run`, `Artifact status: Not Produced`."

## Bad examples
- "Just use Cycles." — no context.

## User-facing response template

```txt
Use case: <hero / preview / animation / lookdev / stylized>
Feature requirements: <caustics, SSS, volumetrics, GI, etc.>
Time budget per frame: <target time budget>
Blender version (if token needed): <4.0-4.1 / 4.2-4.x / 5.x>

Engine config:
  Engine: <Cycles / Eevee / Workbench>
  Engine token (if needed): <BLENDER_EEVEE (4.0-4.1, 5.x) / BLENDER_EEVEE_NEXT (4.2-4.x)>
  Samples: <pinned sample count>
  GPU device: <pinned GPU device or CPU fallback>
  Caveats: <tradeoffs, time/hardware assumptions>

Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <spec inputs or "none">
Limitations: <known gaps; denoiser and render-setting optimization out of scope>
Next: color-management-decision -> resolution-aspect-decision -> output-format-decision -> render-export-evidence
```

## Anti-patterns
- "Always Cycles" without considering time.
- "Always Eevee" without considering features.
- Skipping GPU device choice.
- Choosing engine for animation without time-budget math.

## Cross-skill handoff

* Lighting and material setup aligned with engine choice → `../blender-lighting-material-planner/SKILL.md`
* Color configuration decision → `../color-management-decision/SKILL.md`
* Output container / codec decision → `../output-format-decision/SKILL.md`
* Render resolution and aspect ratio decision → `../resolution-aspect-decision/SKILL.md`
* Post-render output verification → `../render-export-evidence/SKILL.md`

## Non-goals

* Never run Blender or execute a render or preview render.
* Never configure denoiser specifics, tile sizes, light probe volumes, or render-setting optimizations beyond `engine + samples + GPU device + caveats`.
* Never decide color management (`color-management-decision`), container/codec (`output-format-decision`), or resolution/aspect (`resolution-aspect-decision`).
* Never verify rendered files (`render-export-evidence`).

## References
- `references/engine-feature-matrix.md`
- `references/samples-by-quality.md`
- `references/gpu-device-rules.md`
- `../../docs/skill-system.md`
