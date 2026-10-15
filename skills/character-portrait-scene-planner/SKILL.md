---
name: character-portrait-scene-planner
description: Plan a character-portrait scene (subject, pose, expression, wardrobe, framing, lighting, background) before any modeling or render attempt.
---

# character-portrait-scene-planner

## Purpose
Translate a single-subject character-portrait intent (subject identity, pose, expression, wardrobe, framing, lighting, background) into a structured scene plan with an explicit assumptions register. Distinct from `product-hero-scene-planner` (manufactured products), `environment-establishing-shot-planner` (places), and `interior-architectural-scene-planner` (rooms). Multi-character ensembles are out of scope. Hands off framing deep-dives to `blender-composition-camera-planner`, lookdev deep-dives to `blender-lighting-material-planner`, assets to `blender-asset-discovery-planner`, and validation to `composition-quality-checker`, `lighting-quality-checker`, and `blender-scene-quality-checker`.

## Quick start
- confirm single-subject scope and upstream brief from `intent-to-3d-brief-writer`
- confirm likeness rights before use if the subject is a real person
- pin subject identity, pose, expression, wardrobe, framing, lighting, and background
- record an explicit assumptions register
- flag needed assets for `blender-asset-discovery-planner`
- emit handoffs to `blender-composition-camera-planner`, `blender-lighting-material-planner`, and quality checkers with `Runtime status: Not Run` and `Artifact status: Not Produced`

## When to use
- intent is explicitly a character / person / creature portrait
- before any modeling or scene file is built
- when the consumer is editorial / brand / catalog / cinematic

## When not to use
- product hero scenes (use `product-hero-scene-planner`)
- environment establishing shots (use `environment-establishing-shot-planner`)
- interior arch viz (use `interior-architectural-scene-planner`)
- multi-character ensemble (this skill is single-subject)

## Trigger phrases
- "portrait of"
- "character looking at the camera"
- "headshot"
- "hero shot of [person / mascot / creature]"

## Prerequisites / readiness
- brief from `intent-to-3d-brief-writer` is locked
- single-subject character identity and style are known
- likeness rights are confirmed before use if the subject depicts a real person
- target framing and use case are known

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Subject identity | Defines single-subject character traits and asset needs |
| Likeness rights confirmation (if real person) | Must be confirmed before use; blocks planning if unconfirmed |
| Pose + expression | Drives framing and lighting intent |
| Framing + background intent | Sets portrait boundaries before camera/lookdev deep-dives |

### Optional inputs

| Input | Use |
|---|---|
| Reference images | Align style and character details (with rights confirmed) |
| Wardrobe / prop list | Populates asset rows for `blender-asset-discovery-planner` |
| Existing asset notes | Flags reuse candidates for discovery |

### Assumptions to confirm
- Single subject only (multi-character ensembles are out of scope).
- Likeness rights are confirmed for any real person depicted.
- Style is consistent across subject, wardrobe, and background.
- Planning-only output: runtime stays `Not Run` and artifacts stay `Not Produced`.

## Output schema

### Primary output
A structured single-subject character portrait plan covering: Subject identity, Likeness rights status, Pose / expression, Wardrobe, Framing, Lighting, Background, and an Assumptions register.

### Secondary output
- asset rows flagged for `blender-asset-discovery-planner`
- deep-dive handoffs to `blender-composition-camera-planner` (framing) and `blender-lighting-material-planner` (lookdev)
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

Planning-only skill: no modeling, no animation, no render, and no Blender execution. `Runtime status` stays `Not Run` and `Artifact status` stays `Not Produced` (downgrade-only, never upgrade). If the brief is unclear, hand off to `intent-to-3d-brief-writer`.

## Operating procedure
1. Read the brief from `intent-to-3d-brief-writer` and verify single-subject portrait scope.
2. Check if the subject is a real person; require confirmed likeness rights before proceeding.
3. Fill subject identity, pose, expression, and wardrobe sections.
4. Define portrait framing, lighting intent, and background intent without overclaiming rendered results.
5. Record all open assumptions in the assumptions register.
6. List required assets and hand off asset rows to `blender-asset-discovery-planner`.
7. Hand off camera/framing deep-dives to `blender-composition-camera-planner` and lookdev deep-dives to `blender-lighting-material-planner`.
8. Emit validation handoffs to `composition-quality-checker`, `lighting-quality-checker`, and `blender-scene-quality-checker` with `Runtime status: Not Run` and `Artifact status: Not Produced`.

## Decision tree

```txt
More than one character, or focus is a product / place / room?
  → Stop; route to product-hero-scene-planner, environment-establishing-shot-planner, or interior-architectural-scene-planner
Subject is a real person without confirmed likeness rights?
  → Stop (Fail); require likeness rights confirmation before use
Subject is identifiable real person?
  → Add Warn for likeness rights + reference image needed
Pose unclear?
  → Hand off to intent-to-3d-brief-writer
Framing close-up but lens 18mm?
  → Warn (likely distortion); propose 50–85mm
Background detailed but framing tight close-up?
  → Warn (background mostly out of frame; simplify)
Need detailed camera/framing or lookdev execution plan?
  → Hand off framing to blender-composition-camera-planner and lookdev to blender-lighting-material-planner
```

## Playbooks

### Playbook A: Hero close-up (16:9 web)
50–85mm equivalent; eyes on upper third; key + soft fill; rim for separation; simple gradient or studio HDRI background.

### Playbook B: Editorial 9:16 mobile
24–35mm; subject head + upper body; environmental story background; mixed warm + cool lighting.

### Playbook C: Stylized character mascot
Style-specific; flat or simplified background; key + bounce; consistent stylization across face + wardrobe.

## Mode handling

### Text-only mode
Produce the portrait plan and assumptions register; keep `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Runtime-ready mode
Planning-only even when runtime is available downstream: keep `Runtime status: Not Run` and `Artifact status: Not Produced` (downgrade-only, never upgrade), and hand off to downstream planners and checkers.

### Blocked runtime mode
Produce the portrait plan and assumptions register; keep `Runtime status: Not Run` and `Artifact status: Not Produced`, and log blockers under `Limitations`.

## Validation checklist
- [ ] Single-subject portrait scope confirmed
- [ ] Likeness rights confirmed before use (if real person)
- [ ] Subject identity, pose, expression, and wardrobe filled
- [ ] Framing, lighting, and background filled
- [ ] Assumptions register included
- [ ] Asset rows flagged for `blender-asset-discovery-planner`
- [ ] Deep-dive handoffs named (`blender-composition-camera-planner`, `blender-lighting-material-planner`)
- [ ] Validation handoffs named (`composition-quality-checker`, `lighting-quality-checker`, `blender-scene-quality-checker`)
- [ ] `Runtime status: Not Run` and `Artifact status: Not Produced` explicitly set

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | All portrait sections and assumptions register complete; likeness rights confirmed (if applicable); truth states locked to `Not Run` / `Not Produced`; downstream handoffs named. |
| Warn | Minor non-blocking detail open in the assumptions register; asset list partial. |
| Fail | Multi-character or non-portrait scope; real person used without confirmed likeness rights; missing lighting/framing/assumptions sections; truth states upgraded above `Not Run` / `Not Produced`. |

## Failure handling
- Brief unclear → hand off to `intent-to-3d-brief-writer`.
- Real person without confirmed likeness rights → block plan and require rights confirmation before use.
- Framing or lookdev underspecified → hand off deep-dives to `blender-composition-camera-planner` and `blender-lighting-material-planner`.
- Style inconsistent → flag in assumptions register and require user confirmation.

## Troubleshooting

| Problem | Response |
|---|---|
| Real person reference has no confirmed likeness rights | Stop immediately; require likeness rights confirmation before use. |
| Stylization clashes between character and wardrobe | Re-lock style in the plan and update rows for `blender-asset-discovery-planner`. |
| Lighting and background compete with the subject | Hand off lookdev adjustments to `blender-lighting-material-planner`, then validate with `lighting-quality-checker`. |

## Best practices
- Lock style early; revisions are cheap pre-modeling.
- Pair pose decisions with camera decisions in one row.
- Always flag assets for `blender-asset-discovery-planner` before committing modeling work.

## Good examples
- "Subject: stylized founder character, single subject (fictional, no real-person likeness). Pose/expression: three-quarter turn, calm smile, direct gaze. Wardrobe: dark knit top. Framing: close-up head-and-shoulders portrait (deep-dive via `blender-composition-camera-planner`). Lighting: soft key, gentle fill, subtle rim for separation (lookdev via `blender-lighting-material-planner`). Background: neutral studio gradient. Assumptions register: single static frame; fictional character; no existing rig. Runtime status: Not Run. Artifact status: Not Produced."

## Bad examples
- "Person looking at camera." — no proportions, lighting, or framing.
- "Verified ready" — no rendered evidence.

## User-facing response template

```txt
Subject identity: <single-subject description>
Likeness rights: <confirmed | fictional N/A | unconfirmed — BLOCKED>
Pose / expression: <pose and expression>
Wardrobe: <wardrobe and props>
Framing: <portrait framing intent>
Lighting: <key / fill / rim intent>
Background: <background intent>
Assumptions register: <explicit list of assumptions>

Assets to discover: <rows for blender-asset-discovery-planner>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: blender-asset-discovery-planner | blender-composition-camera-planner | blender-lighting-material-planner | composition-quality-checker | lighting-quality-checker | blender-scene-quality-checker
```

## Anti-patterns
- Performing modeling, animation, rendering, or Blender execution inside this skill.
- Proceeding with a real person's likeness without confirmed rights before use.
- Upgrading `Runtime status` above `Not Run` or `Artifact status` above `Not Produced`.
- Blurring boundaries with `product-hero-scene-planner`, `environment-establishing-shot-planner`, `interior-architectural-scene-planner`, or multi-character ensembles.
- Bypassing `blender-composition-camera-planner` (framing) or `blender-lighting-material-planner` (lookdev).

## Cross-skill handoff
- Upstream brief → `../intent-to-3d-brief-writer/SKILL.md`
- Framing deep-dive → `../blender-composition-camera-planner/SKILL.md`
- Lookdev deep-dive → `../blender-lighting-material-planner/SKILL.md`
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Scene quality validation → `../blender-scene-quality-checker/SKILL.md`

## Non-goals
- Model the character.
- Animate the character.
- Render.
- Run Blender.

## References
- `references/portrait-framing-rules.md`
- `references/portrait-lighting-patterns.md`
- `references/style-consistency-rules.md`
- `../../docs/skill-system.md`
