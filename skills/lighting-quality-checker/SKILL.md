---
name: lighting-quality-checker
description: Validate lighting intensity ranges, shadow softness, color temperature, and HDRI use against the scene brief before render.
---

# lighting-quality-checker

## Purpose
Run a focused pass/warn/fail check on the scene's lighting setup against intensity sanity, shadow plausibility, color temperature, and HDRI / explicit-light balance — without expanding into material or composition concerns.

## Quick start
- enumerate every light and HDRI in the scene plan or measured scene
- check intensity (watts / lumens, sun strength, area light power)
- check shadow softness consistency
- check color temperature consistency
- check HDRI presence + balance with explicit lights
- emit per-light verdicts + a top-line status

## When to use
- before render
- after a lighting change request
- as a sub-check during full quality review
- when the rendered preview looks "off" but the issue is unclear

## When not to use
- material validation (use `material-quality-checker`)
- composition / camera validation (use `composition-quality-checker`)
- broad pass/warn/fail readiness (use `blender-scene-quality-checker`)
- to fix lights (this skill validates, it does not edit)

## Trigger phrases
- "is the lighting okay"
- "check shadow softness"
- "lighting feels off"
- "is the HDRI balanced"

## Prerequisites / readiness
- light list known (from scene plan or measured scene)
- consumer target known (Cycles render / Eevee preview / GLB → web)
- mood / look brief known (from `intent-to-3d-brief-writer`)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Light list (type, position, strength, color, soft size) | Scope of the check |
| Mood / look brief | Determines whether the lighting matches intent |
| Consumer target | Cycles vs Eevee vs glTF affects allowed light types |

### Optional inputs

| Input | Use |
|---|---|
| HDRI file path or name | Identifies environment lighting |
| Reference image | Allows intensity / mood cross-check |

### Assumptions to confirm
- Intensity units (Watts / Lumens / Sun strength) are consistent across the scene.
- Color temperature is in Kelvin where applicable; mixed Kelvin and RGB color modes need explicit annotation.
- HDRI is real-world calibrated (typical 0.5–2.0 strength), not arbitrarily boosted.

## Output schema

### Primary output
A per-light verdict table: name, type (sun / area / point / spot / HDRI), intensity, color (Kelvin or RGB), soft size or angle, verdict (Pass / Warn / Fail), notes.

### Secondary output
- top-line status (Pass / Warn / Fail) computed from rows
- mood / look match: Yes / No / Unknown
- worst-offender highlighting

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

This skill validates plans or measured scene snapshots only. It never modifies lights, runs Blender, or renders. Use measured scene description (plan output, runtime tool snapshot) — never invent values.

For runtime path attribution, see `../../docs/runtime-stack-strategy.md`.

## Operating procedure
1. Read the light list from scene plan or measured scene.
2. For each light, evaluate intensity range (see `references/intensity-ranges.md`).
3. Evaluate shadow softness consistency (see `references/shadow-softness-rules.md`).
4. Evaluate color temperature consistency.
5. Evaluate HDRI strength + explicit-light balance (see `references/hdri-balance-rules.md`).
6. Cross-check with mood brief.
7. Assign per-light verdict; collect notes.
8. Compute top-line status; highlight worst offenders.
9. Hand off to `blender-scene-quality-checker` (broader review) or back to `blender-lighting-material-planner` (re-plan).

## Decision tree

```txt
Scene has only HDRI, no explicit light?
  → Warn for product hero (HDRI alone often lacks key-light snap)
HDRI strength > 2.0?
  → Warn (likely overpowering); verify intent
Sun + 3 explicit area lights all at max strength?
  → Warn (likely too bright; check exposure)
Shadows hard but mood is "soft"?
  → Fail (mismatch with brief)
Mixed Kelvin + RGB color modes without annotation?
  → Warn
Light type unsupported for chosen export (e.g. some volumetrics in glTF)?
  → Fail
```

## Playbooks

### Playbook A: Product hero with HDRI + 3-point lighting
HDRI ~0.7–1.2; key area light ~50–500W; fill ~10–20% of key; rim for separation. Verdicts per light + balance check.

### Playbook B: Cinematic moody scene
Single key + practical lights; HDRI ~0.2 (mostly ambient fill); shadows hard or soft per brief; verify mood match.

### Playbook C: Outdoor sunlight
Sun strength ~1–5; HDRI environment map for ambient; verify shadow direction matches sun direction; verify color temperature (~5500–6500K daylight).

## Mode handling

### Text-only mode
Verdicts based on plan / spec only; mark `Artifact status: Not Run`.

### Runtime-ready mode
Verdicts based on measured scene snapshot; cite tool used. Never upgrade to `Verified` without recorded measurement + reference image diff if possible.

### Blocked runtime mode
Skip rows that depend on measurement; mark explicitly.

## Validation checklist
- [ ] Every light listed
- [ ] Intensity column filled
- [ ] Color column filled (Kelvin or RGB)
- [ ] Shadow softness column filled
- [ ] HDRI presence noted (or "none")
- [ ] Per-light verdict assigned
- [ ] Mood match assessed
- [ ] Top-line status derived from rows
- [ ] Honest evidence label

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All lights pass intensity / shadow / color sanity; HDRI balanced; mood match Yes. |
| Warn | Plausibility flags (HDRI alone, mixed color modes, intensity at edges of range) but no hard violations. |
| Fail | Mood mismatch (e.g. soft brief but hard shadows); unsupported light type for chosen export; intensity clearly off (factor of 10+); shadow direction inconsistent. |

## Failure handling
- Missing light data → Fail with note.
- Mood unclear → mark Mood match Unknown; do not Pass.
- User pushes for "Pass" without checks → restate requirement.

## Troubleshooting

| Problem | Response |
|---|---|
| Render too dark | Check sun + HDRI strength; check exposure; verify camera ISO / aperture. |
| Render too bright | Check sum of all light intensities; check HDRI strength; check denoiser clamping. |
| Shadows missing | Check shadow flag per light; check fill light ratio (not 100% of key). |
| Color cast unintended | Check HDRI tint; check Kelvin vs RGB mismatch on key. |

## Best practices
- Pair every Fail with the rule that triggered it.
- Cross-check intensity sums against the scene's overall exposure target.
- Always evaluate HDRI + explicit lights as a system, not separately.
- Keep this skill narrow — do not creep into material or composition.

## Good examples
- "HDRI: studio.exr @ 1.0; Key area light 250W (5500K, 0.4m soft); Fill area 50W (5500K, 0.6m soft); Rim spot 100W (4500K, hard). Mood: soft hero. Verdict: Pass."

## Bad examples
- "Lighting looks fine." — no per-light rows.
- "Verified" without reference image diff.

## User-facing response template

```txt
Consumer target: <Cycles / Eevee / glTF>
Mood / look: <one-line summary>

| Light | Type | Intensity | Color | Soft / angle | Verdict | Notes |
|---|---|---|---|---|---|---|

HDRI: <name + strength or "none">
Mood match: Yes / No / Unknown
Top-line: <Pass / Warn / Fail>
Worst offenders: <list>
Limitations: <gaps>
Next: blender-scene-quality-checker / blender-lighting-material-planner
```

## Anti-patterns
- Editing lights inside this skill.
- Inventing intensity values.
- Marking Verified without measurement.
- Mixing material / composition checks here.

## Cross-skill handoff
- Broad readiness review → `../blender-scene-quality-checker/SKILL.md`
- Material validation → `../material-quality-checker/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`
- Lighting re-plan → `../blender-lighting-material-planner/SKILL.md`
- Render evidence → `../render-export-evidence/SKILL.md`

## Non-goals
- Edit lights.
- Generate light setup recipes.
- Replace `blender-scene-quality-checker`.
- Run Blender.

## References
- `references/intensity-ranges.md`
- `references/shadow-softness-rules.md`
- `references/hdri-balance-rules.md`
- `../../laws/evidence-before-done.md`
- `../../docs/skill-system.md`
