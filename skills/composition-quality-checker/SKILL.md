---
name: composition-quality-checker
description: Validate camera framing, subject placement, headroom/lead-room, and visual hierarchy against the scene brief before render.
---

# composition-quality-checker

## Purpose
Run a focused pass/warn/fail check on the camera + framing setup against composition rules (rule of thirds, headroom, lead room, negative space, visual hierarchy) — without expanding into material or lighting concerns.

## Quick start
- read camera FOV, position, target, lens
- read framing intent from brief (close-up / medium / wide / hero card)
- check rule of thirds, subject placement, headroom, lead room
- check negative space and visual hierarchy
- emit verdicts + a top-line status

## When to use
- before render
- after a camera change request
- as a sub-check during full quality review
- when a render "feels off" but lighting and materials check out

## When not to use
- material validation (use `material-quality-checker`)
- lighting validation (use `lighting-quality-checker`)
- broad pass/warn/fail readiness (use `blender-scene-quality-checker`)
- to fix camera (this skill validates, it does not edit)

## Trigger phrases
- "is the framing okay"
- "check composition"
- "subject feels off-center"
- "too much negative space"

## Prerequisites / readiness
- camera setup known (FOV / focal length / position / target / lens)
- framing intent known (from brief)
- subject identified

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Camera setup | Anchors composition checks |
| Framing intent | Determines applicable rules (close-up vs hero card vs wide) |
| Subject identification | Determines what is "the subject" for placement rules |

### Optional inputs

| Input | Use |
|---|---|
| Aspect ratio | Affects framing rules (16:9 vs 1:1 vs 9:16) |
| Reference image | Allows cross-check |

### Assumptions to confirm
- Render aspect ratio is known and stable.
- "Subject" is unambiguous in the brief.
- Camera is locked (or animated path is documented).

## Output schema

### Primary output
A composition verdict table covering: rule of thirds, subject placement, headroom, lead room, negative space balance, visual hierarchy, depth cues, lens / FOV plausibility — each with verdict + notes.

### Secondary output
- top-line status (Pass / Warn / Fail)
- worst-offender highlighting
- aspect-ratio match

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

This skill validates camera plans or measured scene snapshots only. It never moves the camera, runs Blender, or renders. Use measured camera description (plan output, runtime tool snapshot).

## Operating procedure
1. Read camera setup and framing intent.
2. Apply rule of thirds checks (see `references/composition-rules.md`).
3. Apply subject placement rule per intent.
4. Apply headroom / lead room rules.
5. Apply negative space and hierarchy checks.
6. Apply lens / FOV plausibility rules.
7. Cross-check with aspect ratio.
8. Assign per-row verdicts; collect notes.
9. Compute top-line status; highlight worst offenders.
10. Hand off to `blender-scene-quality-checker` (broader review) or `blender-composition-camera-planner` (re-plan).

## Decision tree

```txt
Subject dead-center in 16:9 hero card?
  → Pass for symmetric hero; Warn for documentary/editorial mood
Subject in dead corner?
  → Fail unless intentional asymmetry called out in brief
Headroom > 30% of frame for portrait?
  → Warn (too much empty space above)
Headroom 0% (subject's head touching top)?
  → Fail
Lead room missing for moving subject?
  → Fail (subject "pressed against" frame)
Negative space carrying intentional weight?
  → Pass; verify with brief
FOV < 18mm equivalent on a hero close-up?
  → Warn (likely distortion); verify intent
```

## Playbooks

### Playbook A: Product hero card 16:9
Subject ~60% width, centered horizontally or on right third; clear negative space on the opposite side for headline / CTA; soft horizon line; FOV 50–85mm equivalent.

### Playbook B: Square 1:1 social
Subject centered; negative space minimal; tight crop OK if not cropping silhouette.

### Playbook C: Portrait 9:16 mobile
Subject in upper third; lower third reserved for text overlay; full silhouette visible.

### Playbook D: Cinematic 2.39:1
Wide negative space allowed; subject often off-center using rule of thirds; horizon at upper or lower third.

## Mode handling

### Text-only mode
Verdicts based on plan / spec only.

### Runtime-ready mode
Verdicts based on rendered preview cross-check.

### Blocked runtime mode
Skip preview-dependent rows; mark explicitly.

## Validation checklist
- [ ] Camera setup row filled
- [ ] Framing intent stated
- [ ] Aspect ratio stated
- [ ] Rule of thirds verdict
- [ ] Subject placement verdict
- [ ] Headroom verdict
- [ ] Lead room verdict
- [ ] Negative space verdict
- [ ] Hierarchy verdict
- [ ] Lens / FOV plausibility verdict
- [ ] Top-line status derived from rows

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All rows pass; framing matches brief; aspect ratio coherent. |
| Warn | One or two plausibility flags (centered when off-center expected, FOV at boundary); no hard violations. |
| Fail | Subject dead corner without justification; 0 or excessive headroom; lead-room missing for moving subject; FOV severely wrong (e.g. 8mm on hero close-up). |

## Failure handling
- Camera path animated → flag every keyframe individually if possible, or mark as Warn for static-rule scope.
- "Negative space minimal" intent vs measured negative space wide → Fail, not Warn.
- Aspect ratio missing → Fail until provided.

## Troubleshooting

| Problem | Response |
|---|---|
| Subject looks off-center | Confirm rule of thirds intent; check on-third vs centered preference |
| Headroom too much | Either crop tighter (re-frame) or add element to fill negative space |
| FOV distortion ugly on close-up | Move camera farther + zoom in (longer focal length) |
| Aspect ratio doesn't match downstream use | Re-render at correct aspect before claiming compliance |

## Best practices
- Always verify aspect ratio against the downstream consumer first.
- Apply rules per framing intent, not as universal must-haves.
- Negative space is intentional weight, not "wasted area".
- Keep this skill narrow.

## Good examples
- "16:9 hero card; subject right-third 60% width; headroom 18%; lead room not applicable (static); negative space left for CTA; FOV 50mm equivalent. Verdict: Pass."

## Bad examples
- "Composition looks fine." — no per-row analysis.
- "Verified" without preview cross-check.

## User-facing response template

```txt
Aspect ratio: <16:9 / 1:1 / 9:16 / 2.39:1>
Framing intent: <hero card / portrait / wide / cinematic>

| Check | Verdict | Notes |
|---|---|---|
| Rule of thirds | Pass/Warn/Fail | |
| Subject placement | Pass/Warn/Fail | |
| Headroom | Pass/Warn/Fail | |
| Lead room | Pass/Warn/Fail/N-A | |
| Negative space | Pass/Warn/Fail | |
| Hierarchy | Pass/Warn/Fail | |
| Lens / FOV plausibility | Pass/Warn/Fail | |

Top-line: <Pass / Warn / Fail>
Worst offenders: <list>
Limitations: <gaps>
Next: blender-scene-quality-checker / blender-composition-camera-planner
```

## Anti-patterns
- Editing the camera inside this skill.
- Inventing values.
- Marking Verified without preview.
- Mixing material / lighting checks here.

## Cross-skill handoff
- Broad readiness review → `../blender-scene-quality-checker/SKILL.md`
- Material validation → `../material-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Composition re-plan → `../blender-composition-camera-planner/SKILL.md`

## Non-goals
- Move the camera.
- Generate composition recipes.
- Replace `blender-scene-quality-checker`.
- Run Blender.

## References
- `references/composition-rules.md`
- `references/headroom-leadroom-rules.md`
- `references/aspect-ratio-rules.md`
- `../../laws/evidence-before-done.md`
- `../../docs/skill-system.md`
