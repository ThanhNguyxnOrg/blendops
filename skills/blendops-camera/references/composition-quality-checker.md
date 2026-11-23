
# blendops-camera (reference for `blendops-camera`)

> Detailed playbook carried over from the former `blendops-camera` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

## Purpose
Run a focused per-row Pass/Warn/Fail check on the camera and framing setup against composition rules (rule of thirds, subject placement, headroom/lead-room, negative space, visual hierarchy, depth cues, and lens/FOV plausibility) — emitting per-row verdicts, a top-line status, and remediation hints only, without expanding into camera planning, aspect-ratio locking, material validation, or lighting validation.

## Quick start
- read camera lens / FOV, position, and target description
- read framing intent and locked aspect ratio from the brief
- check rule of thirds, subject placement, and headroom/lead-room
- check negative space, visual hierarchy, depth cues, and lens/FOV plausibility
- emit per-row Pass/Warn/Fail verdicts, top-line status, and remediation hints (keep truth states separate and downgrade-only)

## When to use
- before render
- after a camera change request
- as a sub-check during full quality review
- when a render "feels off" but lighting and materials check out

## When not to use

## Trigger phrases

## Prerequisites / readiness
- camera setup known (FOV / focal length / position / target / lens)
- framing intent known (from brief)
- subject identified

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Camera setup | Anchors lens/FOV plausibility and framing checks |
| Framing intent | Determines applicable composition expectations (close-up vs hero card vs wide) |
| Subject identification | Determines what counts as the primary subject for placement and hierarchy rules |
| Aspect ratio lock | Provided upstream (via `blendops-camera`) to evaluate framing boundaries |

### Optional inputs

| Input | Use |
|---|---|
| Reference image or preview | Allows visual cross-check of framing and depth cues |

### Assumptions to confirm
- Render aspect ratio is known and stable.
- "Subject" is unambiguous in the brief.
- Camera is locked (or animated path is documented).

## Output schema

### Primary output
A composition verdict table covering: rule of thirds, subject placement, headroom/lead-room, negative space, visual hierarchy, depth cues, and lens/FOV plausibility — each with a `Pass | Warn | Fail` verdict and notes.

### Secondary output
- top-line validation status (`Pass | Warn | Fail`)
- worst-offender highlighting
- remediation hints only (never camera edits or execution commands)

### Evidence / caveat output
Validation verdicts (`Pass | Warn | Fail`) are separate from runtime and artifact truth states. Truth states are downgrade-only (never upgrade), and `Artifact status` defaults to `Not Produced` unless concrete output evidence exists (classified via `blendops-final-check`).

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

This skill validates camera plans or measured scene snapshots only. It never moves the camera, never runs Blender, and never executes Python. Artifacts stay `Not Produced` unless concrete output evidence exists (classified by `blendops-final-check`), and truth states are strictly downgrade-only.

## Operating procedure
1. Read camera setup, framing intent, subject identification, and upstream aspect lock (from `blendops-camera`).
2. Check rule of thirds alignment against framing intent.
3. Check subject placement per intent.
4. Check headroom and lead-room balance.
5. Check negative space balance and visual hierarchy.
6. Check depth cues (foreground/midground/background separation).
7. Check lens / FOV plausibility for distortion or flattening against the brief.
8. Assign per-row `Pass | Warn | Fail` verdicts and remediation hints.
9. Compute top-line status and highlight worst offenders; record downgrade-only Runtime and Artifact truth states separately (defaulting Artifact status to `Not Produced`).
10. Hand off to `blendops-final-check` (broad review), `blendops-camera` (camera re-plan), `blendops-camera` (aspect/resolution changes), or `blendops-final-check` (artifact evidence classification).

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
Per-row `Pass | Warn | Fail` verdicts are based on the written camera plan/brief only. `Runtime status` stays `Not Run` and `Artifact status` stays `Not Produced`.

### Runtime-ready mode
Per-row verdicts cross-check the measured scene snapshot or preview. Truth states remain separate from row verdicts, are downgrade-only, and require `blendops-final-check` before any artifact state above `Not Produced` is recorded.

### Blocked runtime mode
Skip preview-dependent verification, flag limitations explicitly, keep `Artifact status: Not Produced`, and downgrade truth states accordingly.

## Validation checklist
- [ ] Camera setup stated
- [ ] Framing intent stated
- [ ] Aspect ratio lock confirmed (from `blendops-camera`)
- [ ] Rule of thirds verdict
- [ ] Subject placement verdict
- [ ] Headroom / lead-room verdict
- [ ] Negative space verdict
- [ ] Visual hierarchy verdict
- [ ] Depth cues verdict
- [ ] Lens / FOV plausibility verdict
- [ ] Top-line status derived from rows (kept separate from Runtime/Artifact truth states)

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

| Problem | Remediation hint (do not execute) |
|---|---|
| Subject feels off-center or unbalanced | Hint: verify rule-of-thirds vs centered intent; route to `blendops-camera` if camera re-aiming is needed. |
| Excessive or cramped headroom | Hint: adjust framing tightness or subject framing height in `blendops-camera`. |
| Unintended close-up perspective distortion | Hint: increase camera distance and use a longer focal length / narrower FOV in `blendops-camera`. |
| Flat staging with weak depth cues | Hint: increase foreground/background separation or staging depth in `blendops-camera`. |
| Aspect ratio mismatch with target delivery | Hint: route to `blendops-camera` to lock the proper aspect ratio before re-planning framing. |

## Best practices
- Confirm the upstream aspect-ratio lock from `blendops-camera` before judging framing margins.
- Apply composition checks relative to framing intent, not as rigid universal formulas.
- Treat negative space and depth cues as intentional design elements anchored to the brief.
- Provide remediation hints only — leave camera edits to `blendops-camera` and broad scene sign-off to `blendops-final-check`.

## Good examples
- "16:9 hero card; subject right-third 60% width; headroom 18%; lead room not applicable (static); negative space left for CTA; FOV 50mm equivalent. Verdict: Pass."

## Bad examples
- "Composition looks fine." — no per-row analysis.
- "Verified" without preview cross-check.

## User-facing response template

```txt
Aspect ratio lock: <from blendops-camera>
Framing intent: <hero card / portrait / wide / cinematic>

| Check | Verdict | Notes / Remediation Hint |
|---|---|---|
| Rule of thirds | Pass/Warn/Fail | |
| Subject placement | Pass/Warn/Fail | |
| Headroom / lead-room | Pass/Warn/Fail | |
| Negative space | Pass/Warn/Fail | |
| Visual hierarchy | Pass/Warn/Fail | |
| Depth cues | Pass/Warn/Fail | |
| Lens / FOV plausibility | Pass/Warn/Fail | |

Top-line verdict: <Pass / Warn / Fail>
Worst offenders: <list or "none">
Remediation hints: <hints only — no camera edits>

Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed (default: Not Produced)
Evidence used: <links, paths, logs, or "none">
Limitations: <gaps>
Next: blendops-final-check | blendops-camera | blendops-camera | blendops-final-check
```

## Anti-patterns
- Editing the camera inside this skill.
- Inventing values.
- Marking Verified without preview.
- Mixing material / lighting checks here.

## Cross-skill handoff

## Non-goals
- Move or edit the camera (owned by `blendops-camera`).
- Lock aspect ratio or resolution (owned by `blendops-camera`).
- Validate materials (`blendops-lighting-materials`) or lighting (`blendops-lighting-materials`).
- Replace broad scene review (`blendops-final-check`).
- Classify render or export artifact evidence (`blendops-final-check`).
- Run Blender or execute Python.

## References
- `references/composition-rules.md`
- `references/headroom-leadroom-rules.md`
- `references/aspect-ratio-rules.md`
- `../../laws/evidence-before-done.md`
- `../../docs/skill-system.md`
