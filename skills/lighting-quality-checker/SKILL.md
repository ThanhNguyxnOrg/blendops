---
name: lighting-quality-checker
description: Validate lighting intensity ranges, shadow softness, color temperature, and HDRI use against the scene brief before render.
---

# lighting-quality-checker

## Purpose
Run a focused pass/warn/fail check on the scene's lighting setup per light — covering intensity ranges, shadow softness, color temperature, HDRI / explicit-light balance, and mood match — without expanding into material, composition, or lookdev planning concerns.

## Quick start
- enumerate every explicit light and HDRI in the scene plan or measured scene
- check intensity ranges per light
- check shadow softness consistency
- check color temperature consistency
- check HDRI presence + balance with explicit lights
- check mood match against the brief
- emit per-light verdicts (`Pass / Warn / Fail`) with remediation hints only + a top-line status

## When to use
- before render
- after a lighting change request
- as a sub-check during full quality review
- when the rendered preview looks "off" but the issue is unclear

## When not to use
- upstream lookdev and lighting planning (use `blender-lighting-material-planner`)
- material validation (use `material-quality-checker`)
- composition / camera validation (use `composition-quality-checker`)
- broad pass/warn/fail scene readiness (use `blender-scene-quality-checker`)
- classifying render or export artifact evidence (use `render-export-evidence`)
- to fix or edit lights (this skill validates and gives remediation hints only; it never edits)

## Trigger phrases
- "is the lighting okay"
- "check shadow softness"
- "lighting feels off"
- "is the HDRI balanced"

## Prerequisites / readiness
- light list known (from `blender-lighting-material-planner` scene plan or measured scene snapshot)
- consumer target known (render or export target)
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
A per-light verdict table: name, type, intensity, color, shadow softness, verdict (`Pass / Warn / Fail`), and remediation hints (hints only, never direct edits or execution).

### Secondary output
- top-line status (`Pass / Warn / Fail`) computed from per-light rows
- mood / look match: `Yes / No / Unknown`
- worst-offender highlighting

### Evidence / caveat output
Validation verdicts (`Pass / Warn / Fail`) are separate from runtime and artifact truth states. Truth states are downgrade-only (never upgrade), and `Artifact status` defaults to `Not Produced` unless concrete output evidence exists (classified via `render-export-evidence`).

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

This skill validates plans or measured scene snapshots only. It never modifies lights, runs Blender, or renders. Use measured scene description (plan output, runtime tool snapshot) — never invent values.

For runtime path attribution, see `../../docs/runtime-stack-strategy.md`.

## Operating procedure
1. Read the light list from the `blender-lighting-material-planner` plan or measured scene snapshot.
2. For each light, evaluate intensity range (see `references/intensity-ranges.md`).
3. Evaluate shadow softness consistency (see `references/shadow-softness-rules.md`).
4. Evaluate color temperature consistency.
5. Evaluate HDRI strength + explicit-light balance (see `references/hdri-balance-rules.md`).
6. Cross-check overall setup with the mood brief from `intent-to-3d-brief-writer`.
7. Assign per-light verdict (`Pass / Warn / Fail`) and provide brief remediation hints only (never edit lights).
8. Compute top-line status, highlight worst offenders, and record downgrade-only truth states (`Artifact status: Not Produced` by default unless concrete output evidence exists).
9. Hand off to `blender-scene-quality-checker` (broad review), `blender-lighting-material-planner` (re-plan), `material-quality-checker` (materials), `composition-quality-checker` (framing), or `render-export-evidence` (artifact evidence classification).

## Decision tree

```txt
Scene has only HDRI, no explicit light when brief requires strong key separation?
  → Warn (HDRI/explicit-light balance flag; verify intent)
HDRI strength overpowers explicit lights?
  → Warn (balance issue); add remediation hint to rebalance HDRI vs key light
Multiple explicit lights stacked above target intensity range?
  → Warn or Fail depending on severity; add remediation hint to reduce intensities
Shadows hard when mood brief specifies soft lighting (or vice versa)?
  → Fail (shadow softness + mood mismatch)
Inconsistent or unannotated color temperatures across lights?
  → Warn (color temperature consistency flag)
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
Verdicts (`Pass / Warn / Fail`) are based on the plan or spec only. Set `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Runtime-ready mode
Verdicts are based on a measured scene snapshot; cite the inspection source used. Truth states are downgrade-only — never upgrade `Runtime status` or `Artifact status` inside this skill, and leave `Artifact status: Not Produced` unless concrete output evidence already exists and is classified via `render-export-evidence`.

### Blocked runtime mode
Skip rows that depend on missing live measurement, mark limitations explicitly, and downgrade truth states (`Not Run` / `Not Produced` / `Failed` as applicable).

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

| Problem | Remediation hint (lighting only) |
|---|---|
| Scene lighting too dark | Hint to recheck explicit light intensity ranges and HDRI balance in `blender-lighting-material-planner` (route color/exposure questions to `color-management-decision`). |
| Scene lighting too bright | Hint to lower competing explicit light intensities or HDRI strength (route render clamping questions to `cycles-vs-eevee-decision`). |
| Shadows missing or harsh | Hint to check per-light shadow softness settings and key-to-fill intensity ratio. |
| Unintended color cast | Hint to check HDRI tint and color temperature consistency across key, fill, and rim lights. |
| Framing or surface response feels wrong | Out of scope — route framing/camera issues to `composition-quality-checker` and shader issues to `material-quality-checker`. |

## Best practices
- Pair every Fail with the rule that triggered it.
- Cross-check intensity sums against the scene's overall exposure target.
- Always evaluate HDRI + explicit lights as a system, not separately.
- Keep this skill narrow — do not creep into material or composition.

## Good examples
- "HDRI: studio.exr @ 1.0 (Pass); Key area light 250W, 5500K, 0.6m soft (Pass); Fill area 50W, 5500K, 0.8m soft (Pass); Rim area 80W, 5000K, 0.4m soft (Pass). Mood match: Yes (soft hero). Top-line: Pass. Runtime status: Not Run | Artifact status: Not Produced."

## Bad examples
- "Lighting looks fine." — missing per-light rows, mood match, and top-line status.
- Upgrading `Artifact status` to `Verified` or `Produced` inside a lighting check without concrete output evidence classified by `render-export-evidence`.
- Editing light power or running Blender scripts instead of giving remediation hints.

## User-facing response template

```txt
Consumer target: <target>
Mood / look: <one-line summary>

| Light | Type | Intensity | Color | Shadow softness | Verdict | Remediation hint |
|---|---|---|---|---|---|---|
| <name> | <type / HDRI> | <value> | <color temp / value> | <softness> | <Pass / Warn / Fail> | <hint only, no edits> |

HDRI balance: <name + strength + balance note, or "none">
Mood match: Yes / No / Unknown
Top-line: <Pass / Warn / Fail>
Worst offenders: <list or "none">

Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: blender-scene-quality-checker | blender-lighting-material-planner | material-quality-checker | composition-quality-checker | render-export-evidence
```

## Anti-patterns
- Editing lights or generating full lighting recipes inside this skill (use `blender-lighting-material-planner`).
- Inventing light intensity, color, or softness values.
- Upgrading Runtime or Artifact truth states (truth states are downgrade-only; artifacts stay `Not Produced` unless concrete evidence exists).
- Mixing material checks (`material-quality-checker`), camera/framing checks (`composition-quality-checker`), or artifact evidence classification (`render-export-evidence`) into lighting validation.

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
