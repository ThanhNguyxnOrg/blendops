---
name: cycles-vs-eevee-decision
description: Pick Cycles or Eevee (or Eevee Next / Workbench) for a render based on quality bar, time budget, and feature requirements (caustics, subsurface, etc.).
---

# cycles-vs-eevee-decision

## Purpose
Pick the render engine upfront based on quality + time tradeoff and feature requirements. Avoid the "use Cycles always" / "Eevee is faster" oversimplifications.

## Quick start
- name the use case (hero / preview / animation / lookdev)
- evaluate feature needs (caustics / SSS / volumetrics / GI accuracy)
- evaluate time budget per frame
- pick: Cycles / Eevee Next / Eevee (legacy) / Workbench
- pin GPU device + samples + tile size

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
A 5-line config record: Engine, Samples, GPU device (if Cycles), Tile/Render samples, Caveats.

### Secondary output
- per-output engine if multi-pass (preview Eevee + final Cycles)
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
1. Identify use case + feature needs.
2. Apply feature decision matrix (see `references/engine-feature-matrix.md`).
3. Pick engine.
4. Set samples per quality bar (see `references/samples-by-quality.md`).
5. Set GPU device if Cycles.
6. List caveats.
7. Hand off to render evidence.

## Decision tree

```txt
Need accurate caustics? Or accurate refraction? Or volumetrics with realistic light?
  → Cycles
Need accurate global illumination from environment + indirect bounce?
  → Cycles (Eevee Next has good GI but Cycles is more accurate)
Final hero quality + time budget allows?
  → Cycles
Real-time preview / iteration / lookdev?
  → Eevee Next or Eevee (legacy)
Animation with thousands of frames + tight time budget?
  → Eevee Next (Cycles only if GPU + denoiser fast enough)
Stylized / non-PBR look?
  → Eevee Next OK
Pure flat workbench / clay render?
  → Workbench
```

## Playbooks

### Playbook A: Hero product render
Cycles, 128-512 samples, GPU CUDA/OPTIX, denoiser ON. Time budget: 5-30 minutes per frame.

### Playbook B: Eevee Next preview / lookdev
Eevee Next, default samples, GPU rasterization. Time budget: 1-5 seconds per frame.

### Playbook C: Long animation on Eevee Next
Eevee Next, 32-64 samples, time budget < 30s per frame.

### Playbook D: Stylized illustration
Eevee Next or Workbench, style-driven samples + look. Time budget: < 10s per frame.

## Mode handling

### Text-only mode
Config record only.

### Runtime-ready mode
Config record + verified by render preview.

### Blocked runtime mode
Config record only.

## Validation checklist
- [ ] Use case identified
- [ ] Feature needs evaluated
- [ ] Engine chosen
- [ ] Samples chosen per quality bar
- [ ] GPU device chosen (if Cycles)
- [ ] Time budget realistic
- [ ] Caveats listed

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
|---|---|
| Cycles too slow | GPU device + denoiser; reduce samples; consider Eevee Next for non-final. |
| Eevee looks wrong (no caustics, wrong refraction) | Switch to Cycles for those specific shots. |
| GI looks washed out in Eevee | Increase Light Probe Volume samples; or use Cycles. |
| Volumetric scattering looks plasticky | Cycles for volumetric realism. |

## Best practices
- Eevee Next for iteration, Cycles for final hero — common and good practice.
- Always test render a small region before committing to long render.
- GPU device matters: OPTIX > CUDA > CPU for Cycles speed.
- Document engine + samples in render evidence.

## Good examples
- "Hero product render. Cycles. 256 samples. OPTIX GPU. Denoiser: ON. Time budget: 10 min per frame."

## Bad examples
- "Just use Cycles." — no context.

## User-facing response template

```txt
Use case: <hero / preview / animation / lookdev / stylized>
Feature requirements: <caustics, SSS, volumetrics, GI, etc.>
Time budget per frame: <s / m>
Machine: <GPU model / CPU>

Engine config:
  Engine: <Cycles / Eevee Next / Eevee legacy / Workbench>
  Samples: <N>
  GPU device: <OPTIX / CUDA / METAL / HIP / ONEAPI / CPU>
  Tile / render samples: <if applicable>
  Caveats: <list>

Limitations: <gaps>
Next: render-export-evidence
```

## Anti-patterns
- "Always Cycles" without considering time.
- "Always Eevee" without considering features.
- Skipping GPU device choice.
- Choosing engine for animation without time-budget math.

## Cross-skill handoff
- Color management → `../color-management-decision/SKILL.md`
- Format → `../output-format-decision/SKILL.md`
- Resolution → `../resolution-aspect-decision/SKILL.md`
- Render evidence → `../render-export-evidence/SKILL.md`

## Non-goals
- Run Blender.
- Optimize render settings beyond engine choice.
- Configure denoiser specifics (per-engine; downstream skill if needed).

## References
- `references/engine-feature-matrix.md`
- `references/samples-by-quality.md`
- `references/gpu-device-rules.md`
- `../../docs/skill-system.md`
