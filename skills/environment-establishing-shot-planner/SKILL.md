---
name: environment-establishing-shot-planner
description: Plan a wide environment / establishing-shot scene (locale, time of day, weather, focal subject, depth, atmosphere) before any modeling or render attempt.
---

# environment-establishing-shot-planner

## Purpose
Translate a wide place-establishing intent (locale, time of day, weather, atmosphere, foreground/midground/background depth layers, and focal subject or explicit "none") into a structured scene plan with an explicit assumptions register. Distinct from `character-portrait-scene-planner` (single subject), `product-hero-scene-planner` (manufactured products), and `interior-architectural-scene-planner` (interior rooms/furniture/surfaces — an establishing shot of an interior room belongs there when furniture or surfaces dominate). Hands off asset rows to `blender-asset-discovery-planner` and validation to `composition-quality-checker`, `lighting-quality-checker`, and `blender-scene-quality-checker`.

## Quick start
- confirm upstream brief from `intent-to-3d-brief-writer` and verify a realizable (non-invented) locale scope
- pin locale, time of day, weather, and atmosphere
- pin foreground (FG), midground (MG), and background (BG) depth layers
- pin focal subject (or explicitly declare `none`)
- record an explicit assumptions register
- flag asset rows for `blender-asset-discovery-planner` and emit validation handoffs with `Runtime status: Not Run` and `Artifact status: Not Produced`

## When to use
- intent is establishing a wide place (landscape, cityscape, outdoor locale, or wide interior space where furniture/surfaces do not dominate)
- before any modeling, Geometry Nodes, or scene building
- when consumer is editorial, cinematic, or brand

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
- locale scope is realizable and bounded (never invented)
- target aspect ratio and use case are known

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Realizable locale | Drives bounded asset and depth-layer scope without inventing unrequested worldbuilding |
| Time of day | Drives sunlight direction, sky tone, and lighting mood |
| Weather + atmosphere | Drives visibility, haze/fog, and surface condition |
| Focal subject intent | Identifies the visual anchor (or explicitly confirms `none`) |

### Optional inputs

| Input | Use |
|---|---|
| Reference images | Calibrate place scope, depth layers, and mood |
| Aspect ratio | Guides framing across FG / MG / BG layers |
| Era / period | Aligns asset discovery rows |

### Assumptions to confirm
- Single time-of-day snapshot (unless animation is explicitly requested upstream).
- Locale scope is realizable and bounded, not invented.
- Interior rooms dominated by furniture or surfaces are routed to `interior-architectural-scene-planner`.
- Planning-only output: `Runtime status` stays `Not Run` and `Artifact status` stays `Not Produced`.

## Output schema

### Primary output
A structured place-establishing plan covering: Locale (bounded scope), Time of day, Weather, Atmosphere, Depth layers (FG / MG / BG), Focal subject (or explicit `none`), Mood / style, and an Assumptions register.

### Secondary output
- asset rows flagged for `blender-asset-discovery-planner`
- validation handoffs to `composition-quality-checker`, `lighting-quality-checker`, and `blender-scene-quality-checker`
- explicit `Runtime status: Not Run` and `Artifact status: Not Produced` labels

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
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

Planning-only skill: no modeling, no Geometry Nodes, no render, and no Blender execution. `Runtime status` stays `Not Run` and `Artifact status` stays `Not Produced` (downgrade-only, never upgrade). If the brief or locale scope is unclear, hand off to `intent-to-3d-brief-writer`.

## Operating procedure
1. Read the brief from `intent-to-3d-brief-writer`; confirm wide place-establishing scope and ensure locale scope is realizable (not invented).
2. Route to `interior-architectural-scene-planner` if the scene is an interior room where furniture or surfaces dominate.
3. Pin time of day, weather, and atmosphere (per `references/time-and-weather-rules.md`).
4. Define wide camera placement and framing intent (per `references/wide-shot-camera-rules.md`).
5. Plan foreground (FG), midground (MG), and background (BG) depth layers (per `references/depth-layering-rules.md`).
6. Identify the focal subject or explicitly document `none`.
7. Record all open assumptions in the assumptions register.
8. List required assets for `blender-asset-discovery-planner` and emit validation handoffs to `composition-quality-checker`, `lighting-quality-checker`, and `blender-scene-quality-checker` with `Runtime status: Not Run` and `Artifact status: Not Produced`.

## Decision tree

```txt
Scene is an interior room where furniture or surfaces dominate?
  → Stop; route to interior-architectural-scene-planner
Focus is a single character or a manufactured product?
  → Stop; route to character-portrait-scene-planner or product-hero-scene-planner
Locale scope is unbounded or unclear (would require inventing scope)?
  → Stop; hand off to intent-to-3d-brief-writer to bound locale scope
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
Produce the environment plan and assumptions register; keep `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Runtime-ready mode
Planning-only even when runtime is available downstream: keep `Runtime status: Not Run` and `Artifact status: Not Produced` (downgrade-only, never upgrade), and hand off to `blender-asset-discovery-planner` and quality checkers.

### Blocked runtime mode
Produce the environment plan and assumptions register; keep `Runtime status: Not Run` and `Artifact status: Not Produced`, and log blockers under `Limitations`.

## Validation checklist
- [ ] Realizable, non-invented locale scope confirmed
- [ ] Time of day, weather, and atmosphere pinned
- [ ] Depth layers (FG / MG / BG) explicitly defined
- [ ] Focal subject (or explicit `none`) documented
- [ ] Assumptions register included
- [ ] Asset rows flagged for `blender-asset-discovery-planner`
- [ ] Validation handoffs named (`composition-quality-checker`, `lighting-quality-checker`, `blender-scene-quality-checker`)
- [ ] `Runtime status: Not Run` and `Artifact status: Not Produced` explicitly set

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | Realizable locale scope; consistent time/weather/atmosphere; explicit FG/MG/BG depth layers; focal subject (or explicit `none`); assumptions register complete; truth states locked to `Not Run` / `Not Produced`; handoffs named. |
| Warn | Minor non-blocking assumption open in the assumptions register; asset list partial. |
| Fail | Invented or unbounded locale scope; interior room dominated by furniture/surfaces; contradictory time/weather/mood; missing FG/MG/BG layers; missing focal subject decision; truth states upgraded above `Not Run` / `Not Produced`. |

## Failure handling
- Locale scope too broad or unclear → hand off to `intent-to-3d-brief-writer` (never invent scope).
- Mood and weather contradict → stop and ask user to pick one consistent direction.
- Asset availability unknown → flag missing items for `blender-asset-discovery-planner`.

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
Locale (bounded scope): <where + realizable boundaries>
Time of day: <time / sun state>
Weather: <weather state>
Atmosphere: <haze / fog / visibility>
Camera & framing: <wide position / altitude / tilt>
Depth layers: FG: <…> | MG: <…> | BG: <…>
Focal subject: <subject + placement, or explicit "none">
Mood + style: <line>
Assumptions register: <explicit list of confirmed assumptions>

Assets to discover: <rows for blender-asset-discovery-planner>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: blender-asset-discovery-planner | composition-quality-checker | lighting-quality-checker | blender-scene-quality-checker
```

## Anti-patterns
- Mixing single-character portraits (`character-portrait-scene-planner`), manufactured product shots (`product-hero-scene-planner`), or furniture/surface-dominant interior rooms (`interior-architectural-scene-planner`) into wide place planning.
- Inventing unbounded locale scope instead of handing off to `intent-to-3d-brief-writer`.
- Skipping FG / MG / BG depth layers or failing to declare a focal subject (or explicit `none`).
- Prescribing Geometry Nodes, modeling steps, or renders, or upgrading truth states above `Not Run` / `Not Produced`.

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
