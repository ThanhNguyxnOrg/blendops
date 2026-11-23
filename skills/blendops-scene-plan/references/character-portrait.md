
# blendops-scene-plan (reference for `blendops-scene-plan`)

> Detailed playbook carried over from the former `blendops-scene-plan` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

## Purpose
Translate a single-subject blendops-scene-plan intent (subject identity, pose, expression, wardrobe, framing, lighting, background) into a structured scene plan with an explicit assumptions register. Distinct from `blendops-product-shot` (manufactured products), `blendops-scene-plan` (places), and `blendops-scene-plan` (rooms). Multi-character ensembles are out of scope. Hands off framing deep-dives to `blendops-camera`, lookdev deep-dives to `blendops-lighting-materials`, assets to `blendops-assets`, and validation to `blendops-camera`, `blendops-lighting-materials`, and `blendops-final-check`.

## Quick start
- confirm single-subject scope and upstream brief from `blendops-brief`
- confirm likeness rights before use if the subject is a real person
- pin subject identity, pose, expression, wardrobe, framing, lighting, and background
- record an explicit assumptions register
- flag needed assets for `blendops-assets`
- emit handoffs to `blendops-camera`, `blendops-lighting-materials`, and quality checkers with `Runtime status: Not Run` and `Artifact status: Not Produced`

## When to use
- intent is explicitly a character / person / creature portrait
- before any modeling or scene file is built
- when the consumer is editorial / brand / catalog / cinematic

## When not to use

## Trigger phrases

## Prerequisites / readiness
- brief from `blendops-brief` is locked
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
| Wardrobe / prop list | Populates asset rows for `blendops-assets` |
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
- asset rows flagged for `blendops-assets`
- deep-dive handoffs to `blendops-camera` (framing) and `blendops-lighting-materials` (lookdev)
- validation handoffs to `blendops-camera`, `blendops-lighting-materials`, and `blendops-final-check`
- explicit `Runtime status: Not Run` and `Artifact status: Not Produced` labels

### Evidence / caveat output

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

Planning-only skill: no modeling, no animation, no render, and no Blender execution. `Runtime status` stays `Not Run` and `Artifact status` stays `Not Produced` (downgrade-only, never upgrade). If the brief is unclear, hand off to `blendops-brief`.

## Operating procedure
1. Read the brief from `blendops-brief` and verify single-subject portrait scope.
2. Check if the subject is a real person; require confirmed likeness rights before proceeding.
3. Fill subject identity, pose, expression, and wardrobe sections.
4. Define portrait framing, lighting intent, and background intent without overclaiming rendered results.
5. Record all open assumptions in the assumptions register.
6. List required assets and hand off asset rows to `blendops-assets`.
7. Hand off camera/framing deep-dives to `blendops-camera` and lookdev deep-dives to `blendops-lighting-materials`.
8. Emit validation handoffs to `blendops-camera`, `blendops-lighting-materials`, and `blendops-final-check` with `Runtime status: Not Run` and `Artifact status: Not Produced`.

## Decision tree

```txt
More than one character, or focus is a product / place / room?
  → Stop; route to blendops-product-shot, blendops-scene-plan, or blendops-scene-plan
Subject is a real person without confirmed likeness rights?
  → Stop (Fail); require likeness rights confirmation before use
Subject is identifiable real person?
  → Add Warn for likeness rights + reference image needed
Pose unclear?
  → Hand off to blendops-brief
Framing close-up but lens 18mm?
  → Warn (likely distortion); propose 50–85mm
Background detailed but framing tight close-up?
  → Warn (background mostly out of frame; simplify)
Need detailed camera/framing or lookdev execution plan?
  → Hand off framing to blendops-camera and lookdev to blendops-lighting-materials
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
- [ ] Asset rows flagged for `blendops-assets`
- [ ] Deep-dive handoffs named (`blendops-camera`, `blendops-lighting-materials`)
- [ ] Validation handoffs named (`blendops-camera`, `blendops-lighting-materials`, `blendops-final-check`)
- [ ] `Runtime status: Not Run` and `Artifact status: Not Produced` explicitly set

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | All portrait sections and assumptions register complete; likeness rights confirmed (if applicable); truth states locked to `Not Run` / `Not Produced`; downstream handoffs named. |
| Warn | Minor non-blocking detail open in the assumptions register; asset list partial. |
| Fail | Multi-character or non-portrait scope; real person used without confirmed likeness rights; missing lighting/framing/assumptions sections; truth states upgraded above `Not Run` / `Not Produced`. |

## Failure handling
- Brief unclear → hand off to `blendops-brief`.
- Real person without confirmed likeness rights → block plan and require rights confirmation before use.
- Framing or lookdev underspecified → hand off deep-dives to `blendops-camera` and `blendops-lighting-materials`.
- Style inconsistent → flag in assumptions register and require user confirmation.

## Troubleshooting

| Problem | Response |
|---|---|
| Real person reference has no confirmed likeness rights | Stop immediately; require likeness rights confirmation before use. |
| Stylization clashes between character and wardrobe | Re-lock style in the plan and update rows for `blendops-assets`. |
| Lighting and background compete with the subject | Hand off lookdev adjustments to `blendops-lighting-materials`, then validate with `blendops-lighting-materials`. |

## Best practices
- Lock style early; revisions are cheap pre-modeling.
- Pair pose decisions with camera decisions in one row.
- Always flag assets for `blendops-assets` before committing modeling work.

## Good examples
- "Subject: stylized founder character, single subject (fictional, no real-person likeness). Pose/expression: three-quarter turn, calm smile, direct gaze. Wardrobe: dark knit top. Framing: close-up head-and-shoulders portrait (deep-dive via `blendops-camera`). Lighting: soft key, gentle fill, subtle rim for separation (lookdev via `blendops-lighting-materials`). Background: neutral studio gradient. Assumptions register: single static frame; fictional character; no existing rig. Runtime status: Not Run. Artifact status: Not Produced."

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

Assets to discover: <rows for blendops-assets>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: blendops-assets | blendops-camera | blendops-lighting-materials | blendops-camera | blendops-lighting-materials | blendops-final-check
```

## Anti-patterns
- Performing modeling, animation, rendering, or Blender execution inside this skill.
- Proceeding with a real person's likeness without confirmed rights before use.
- Upgrading `Runtime status` above `Not Run` or `Artifact status` above `Not Produced`.
- Blurring boundaries with `blendops-product-shot`, `blendops-scene-plan`, or multi-character ensembles.
- Bypassing `blendops-camera` (framing) or `blendops-lighting-materials` (lookdev).

## Cross-skill handoff

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
