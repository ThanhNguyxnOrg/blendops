---
name: character-portrait-scene-planner
description: Plan a character-portrait scene (subject, pose, expression, wardrobe, framing, lighting, background) before any modeling or render attempt.
---

# character-portrait-scene-planner

## Purpose
Translate a character-portrait intent (a single character in a hero / editorial / mood frame) into a structured scene plan that downstream quality / runtime / handoff skills validate. Distinct from `product-hero-scene-planner` (which targets manufactured products).

## Quick start
- pin subject identity (real / stylized / archetype) + age + body type + role
- pin pose + expression + gaze
- pin wardrobe + props
- pin framing + camera + lens
- pin lighting + background + mood
- emit a structured plan + handoff to quality checkers

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
- character identity + style is known
- target aspect + use case is known

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Subject identity | Determines proportions / rig / asset strategy |
| Pose + expression + gaze | Drives camera and lighting decisions |
| Framing intent | Close-up / medium / wide |
| Aspect ratio | Required for composition rules |

### Optional inputs

| Input | Use |
|---|---|
| Reference images | Calibrate proportions / style |
| Wardrobe / prop list | Adds asset rows |
| Existing rig / model | Reuse instead of re-build |

### Assumptions to confirm
- Single subject only.
- Camera is locked unless animation called out.
- Style is consistent across subject + wardrobe + background.

## Output schema

### Primary output
A structured character portrait plan with sections: Subject, Pose / expression / gaze, Wardrobe + props, Camera / framing / lens, Lighting, Background, Mood, Style notes.

### Secondary output
- asset list flagged for `blender-asset-discovery-planner`
- next-skill handoff list (composition / lighting / quality checkers)
- explicit Not Run / Not Produced labels

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

Planning skill — does not run Blender, model, or render. Output is a textual plan downstream quality and runtime skills validate against. If brief is unclear, hand off to `intent-to-3d-brief-writer`.

## Operating procedure
1. Read brief; confirm subject identity + framing intent.
2. Fill subject section (age / body type / archetype / style).
3. Fill pose / expression / gaze (one decision per row).
4. Fill wardrobe + props.
5. Fill camera + framing + lens (per `references/portrait-framing-rules.md`).
6. Fill lighting plan (key + fill + rim, HDRI presence).
7. Fill background + mood.
8. List assets needed; flag for asset discovery.
9. Emit handoff to quality / lighting / composition checkers.

## Decision tree

```txt
Subject is identifiable real person?
  → Add Warn for likeness rights + reference image needed
Pose unclear?
  → Hand off to intent-to-3d-brief-writer
Framing close-up but lens 18mm?
  → Warn (likely distortion); propose 50–85mm
Background detailed but framing tight close-up?
  → Warn (background mostly out of frame; simplify)
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
Pure plan; mark `Artifact status: Not Run`.

### Runtime-ready mode
Plan plus runtime path attribution; do not upgrade to `Verified` without rendered evidence.

### Blocked runtime mode
Plan only; flag what cannot be confirmed.

## Validation checklist
- [ ] Subject section filled
- [ ] Pose / expression / gaze explicit
- [ ] Wardrobe + props listed
- [ ] Camera + framing + lens chosen
- [ ] Lighting plan present
- [ ] Background + mood explicit
- [ ] Style notes present
- [ ] Asset list flagged for discovery
- [ ] Handoff named

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All sections filled; no "TBD"; framing rules respected; assets flagged. |
| Warn | One section ambiguous (e.g. mood line missing); assets list partial. |
| Fail | Subject identity unclear; framing impossible (15mm + tight close-up); no lighting plan. |

## Failure handling
- Brief unclear → `intent-to-3d-brief-writer`.
- Style inconsistent → flag and ask user to lock style.
- Likeness rights unknown → Warn until confirmed.

## Troubleshooting

| Problem | Response |
|---|---|
| Real person reference but no rights | Pause; require rights confirmation. |
| Stylization clashes with wardrobe | Re-lock style early; cheaper than later. |
| Lighting + background fight subject | Re-balance per `lighting-quality-checker` rules. |

## Best practices
- Lock style early; revisions are cheap pre-modeling.
- Pair pose decisions with camera decisions in one row.
- Always flag assets for `blender-asset-discovery-planner` before committing modeling work.

## Good examples
- "Subject: stylized 30s tech founder, neutral build. Pose: 3/4 toward camera, slight smile, gaze direct. Wardrobe: dark turtleneck. Camera: 85mm equivalent, eye-line upper third, 16:9. Lighting: soft key 250W + fill 50W + rim 100W; HDRI 0.7 studio. Background: gradient gray. Mood: confident editorial."

## Bad examples
- "Person looking at camera." — no proportions, lighting, or framing.
- "Verified ready" — no rendered evidence.

## User-facing response template

```txt
Subject: <identity / age / body / archetype>
Pose / expression / gaze: <three lines>
Wardrobe + props: <list>
Camera / framing / lens: <aspect> | <focal length> | <distance> | <eye-line>
Lighting: <key> | <fill> | <rim> | <HDRI>
Background: <type + tone>
Mood + style notes: <line>

Assets to discover: <list>
Limitations: <gaps>
Next: blender-asset-discovery-planner / composition-quality-checker / lighting-quality-checker
```

## Anti-patterns
- Performing modeling decisions inside this skill.
- Inventing likeness without rights confirmation.
- Skipping mood / style notes.
- Mixing multi-character or environment scope.

## Cross-skill handoff
- Brief writer → `../intent-to-3d-brief-writer/SKILL.md`
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Material validation → `../material-quality-checker/SKILL.md`
- Quality readiness → `../blender-scene-quality-checker/SKILL.md`

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
