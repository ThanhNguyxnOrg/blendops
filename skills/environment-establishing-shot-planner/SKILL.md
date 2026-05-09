---
name: environment-establishing-shot-planner
description: Plan a wide environment / establishing-shot scene (locale, time of day, weather, focal subject, depth, atmosphere) before any modeling or render attempt.
---

# environment-establishing-shot-planner

## Purpose
Translate an environment / establishing-shot intent (a wide locale shot establishing place + mood) into a structured plan. Distinct from `character-portrait-scene-planner` (single subject) and `interior-architectural-scene-planner` (interior arch viz).

## Quick start
- pin locale + time of day + weather
- pin focal subject (a building, a vehicle, a tree, or "no single focal subject")
- pin camera + lens + altitude
- pin atmosphere (haze, fog, sunlight quality, sky)
- pin foreground / midground / background composition
- emit a structured plan + handoff to checkers

## When to use
- intent is establishing a place (wide / outdoor / landscape / cityscape / interior establishing)
- before any modeling
- when consumer is editorial / cinematic / brand

## When not to use
- character portrait (use `character-portrait-scene-planner`)
- product hero (use `product-hero-scene-planner`)
- interior arch viz with focus on furniture / surfaces (use `interior-architectural-scene-planner`)

## Trigger phrases
- "establishing shot of"
- "wide shot of"
- "city / forest / desert / ocean scene"
- "set the scene"

## Prerequisites / readiness
- brief from `intent-to-3d-brief-writer` is locked
- aspect ratio + use case known

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Locale | Drives asset / scope decisions |
| Time of day | Drives lighting + atmosphere |
| Weather | Drives sky + atmosphere + visibility |
| Aspect ratio | Composition rules |

### Optional inputs

| Input | Use |
|---|---|
| Reference images | Calibrate scope and mood |
| Focal subject | If "establishing toward something" |
| Era / period | Asset style reference |

### Assumptions to confirm
- Single time-of-day snapshot (not multi-time animation).
- Camera is locked unless animation called out.
- Locale is realizable in scope (e.g. "New York at sunset" needs decisions about scope).

## Output schema

### Primary output
A structured establishing-shot plan: Locale, Time of day, Weather, Atmosphere, Sky / lighting, Camera (position + lens + altitude + tilt), Composition (foreground / midground / background), Focal subject, Mood / style.

### Secondary output
- asset list flagged for `blender-asset-discovery-planner`
- depth-cue strategy
- handoff list

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

Planning skill — does not run Blender, model, or render. If brief is unclear, hand off to `intent-to-3d-brief-writer`.

## Operating procedure
1. Read brief; confirm locale + mood.
2. Pin time of day + weather (see `references/time-and-weather-rules.md`).
3. Pin atmosphere + sky (HDRI vs sky shader).
4. Pin camera position + lens + altitude (see `references/wide-shot-camera-rules.md`).
5. Plan foreground / midground / background layers (see `references/depth-layering-rules.md`).
6. Identify focal subject (or document "no focal subject").
7. List assets needed; flag for asset discovery.
8. Emit handoff.

## Decision tree

```txt
Locale + time-of-day combination implausible (e.g. "Antarctic noon" with deep dark mood)?
  → Warn; clarify intent
"City scene" + tight close-up framing?
  → Warn; this is not establishing — re-frame or use different planner
Weather conflicts with brief mood (sunny + noir)?
  → Fail; pick one
Focal subject not chosen but every asset has same visual weight?
  → Fail; eye has nowhere to land
```

## Playbooks

### Playbook A: City sunset establishing (16:9 cinematic)
35mm wide; camera elevated; warm sun direction; haze layer; subject = skyline silhouette; foreground rooftops; background sky gradient.

### Playbook B: Forest mid-day (1:1 brand campaign)
24mm wide; camera at human eye-line; key sun + dappled light; foreground branches; midground tree trunks; background distant haze.

### Playbook C: Stylized cyberpunk street (2.39:1 cinematic)
24–35mm; rain wet ground reflections; neon practicals; light haze + atmospheric fog; foreground silhouette; midground signage / cars; background distant towers.

## Mode handling

### Text-only mode
Plan only.

### Runtime-ready mode
Plan + runtime path attribution.

### Blocked runtime mode
Plan only; flag what cannot be confirmed.

## Validation checklist
- [ ] Locale chosen
- [ ] Time of day + weather pinned
- [ ] Atmosphere + sky chosen
- [ ] Camera + lens + altitude chosen
- [ ] Composition layers (FG / MG / BG) explicit
- [ ] Focal subject decision (or "none") explicit
- [ ] Asset list flagged
- [ ] Handoff named

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All sections + plausible time-of-day / weather + clear focal subject (or explicit "none") + assets flagged. |
| Warn | One section ambiguous; locale scope very broad ("a city" without specifics). |
| Fail | Locale + time + weather contradict; no composition layers; no focal subject and no acknowledgment. |

## Failure handling
- Locale too broad → ask for narrower scope.
- Mood + weather contradict → user picks one.
- Asset budget unknown → hand off to budget skill.

## Troubleshooting

| Problem | Response |
|---|---|
| Sun direction conflicts with shadows in reference | Verify time-of-day + sun azimuth; clarify reference. |
| Atmospheric haze hides focal subject | Reduce haze density or move subject closer. |
| Background too detailed | Simplify; use atmospheric perspective. |

## Best practices
- Lock time-of-day + weather + atmosphere together; they form a system.
- Always plan FG / MG / BG depth layers.
- Pair establishing shot with the next narrative step (often character portrait or product reveal).

## Good examples
- "Locale: cyberpunk city street, near-future. Time: night, neon lit. Weather: light rain. Atmosphere: haze 0.05 density, volumetric scattering. Sky: minimal (occluded by buildings). Camera: 24mm, eye-level, slight low-angle tilt. FG: silhouetted figure. MG: neon signage + parked cars. BG: distant towers + fog. Focal subject: figure silhouette right-third. Mood: gritty, atmospheric."

## Bad examples
- "Wide shot of a city." — no time, weather, lens, depth.

## User-facing response template

```txt
Locale: <where + scope>
Time of day: <e.g. golden hour 18:30>
Weather: <state>
Atmosphere: <haze / fog / clarity>
Sky / lighting: <HDRI + sun + practicals>
Camera: <focal length> | <altitude> | <tilt> | <position>
Composition layers: FG: <…> | MG: <…> | BG: <…>
Focal subject: <name + placement>
Mood + style: <line>

Assets to discover: <list>
Limitations: <gaps>
Next: blender-asset-discovery-planner / composition-quality-checker / lighting-quality-checker
```

## Anti-patterns
- Mixing single-character framing into wide establishing scope.
- Skipping FG / MG / BG layers.
- "Beautiful weather" without specifics.
- Inventing locale scope.

## Cross-skill handoff
- Brief writer → `../intent-to-3d-brief-writer/SKILL.md`
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Quality readiness → `../blender-scene-quality-checker/SKILL.md`

## Non-goals
- Model the environment.
- Generate Geometry Node setups.
- Render.
- Run Blender.

## References
- `references/time-and-weather-rules.md`
- `references/wide-shot-camera-rules.md`
- `references/depth-layering-rules.md`
- `../../docs/skill-system.md`
