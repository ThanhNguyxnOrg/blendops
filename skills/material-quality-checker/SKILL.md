---
name: material-quality-checker
description: Validate PBR material sanity, texture budgets, and web/runtime compatibility per material before render or export.
---

# material-quality-checker

## Purpose
Run a focused pass/warn/fail check on each material in the scene against PBR sanity, texture budgets, and consumer-stack compatibility — without expanding into lighting or composition concerns.

## Quick start
- enumerate every material referenced in the scene plan or measured scene
- check PBR sanity (albedo range, normal map sign, roughness/metallic plausibility)
- check texture budget (resolution, count, format)
- check consumer-stack compatibility (KHR extensions, unsupported features for chosen target)
- emit per-material verdicts + a top-line status

## When to use
- before render
- before GLB export
- after a material change request
- as a sub-check during full quality review

## When not to use
- lighting validation (use `lighting-quality-checker`)
- composition / camera validation (use `composition-quality-checker`)
- broad pass/warn/fail readiness (use `blender-scene-quality-checker`)
- to fix materials (this skill validates, it does not edit)

## Trigger phrases
- "are the materials okay"
- "check PBR sanity"
- "texture budget for materials"
- "will the materials work in Three.js"

## Prerequisites / readiness
- material list known (from scene plan or measured scene)
- consumer stack target known (Cycles render / Eevee preview / GLB → web)
- texture budget pinned (typically from `glb-mobile-performance-budget`)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Material list | Determines scope of the check |
| Consumer target | Cycles vs Eevee vs glTF imposes different rules |
| Texture budget | Drives texture-resolution and count checks |

### Optional inputs

| Input | Use |
|---|---|
| Existing render reference | Allows visual cross-check |
| Variant list | Configurator materials need separate variant rows |

### Assumptions to confirm
- Albedo / base-color textures are sRGB; data textures (normal, roughness, metallic, AO) are linear.
- Normal maps follow OpenGL convention (`+Y` up) for glTF-bound exports.
- Shader graph is glTF-export-compatible if export is in scope.

## Output schema

### Primary output
A per-material verdict table: name, type (PBR / non-PBR / variant), albedo state, normal state, roughness/metallic state, texture count + resolution sum, consumer-stack compatibility, verdict (Pass / Warn / Fail), notes.

### Secondary output
- top-line status (Pass / Warn / Fail) computed from rows
- worst-offender highlighting (one or two materials to fix first)
- remediation hint per Fail row (without performing the fix)

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

This skill validates plans or measured scene snapshots. It never modifies materials, runs Blender, or exports a GLB. If actual material values are needed, rely on a measured scene description (plan output, runtime tool snapshot) — never invent values.

For runtime path attribution, see `../../docs/runtime-stack-strategy.md`.

## Operating procedure
1. Read the material list from scene plan or measured scene.
2. For each material, evaluate PBR sanity rules (see `references/pbr-sanity-rules.md`).
3. Evaluate texture budget per material against pinned budget.
4. Evaluate consumer-stack compatibility (see `references/consumer-stack-rules.md`).
5. Assign per-material verdict; collect notes.
6. Compute top-line status (any Fail → Fail; any Warn → Warn; otherwise Pass).
7. Highlight worst offenders; emit remediation hints.
8. Hand off to `blender-scene-quality-checker` (broader review) or `render-export-evidence` (next runtime step).

## Decision tree

```txt
Albedo pure white (1,1,1)?
  → Warn (real-world materials rarely are)
Albedo pure black (0,0,0)?
  → Warn (likely error; even charcoal is ~0.04)
Roughness = 0?
  → Warn (perfect mirror very rare)
Metallic between 0 and 1 (not 0 or 1)?
  → Warn (PBR metallic is binary in physical sense)
Normal map sign or convention unknown?
  → Warn until verified
Texture above per-tier cap?
  → Fail
Material count above pinned cap?
  → Fail (whole-scene)
Unsupported shader node for chosen export?
  → Fail (e.g. OSL nodes for glTF)
```

## Playbooks

### Playbook A: Single hero product, glTF export
Hard rules: 4-channel ORM (Occlusion / Roughness / Metallic) packed; sRGB albedo; OpenGL normal; ≤ 4 materials; KHR extensions only if consumer stack confirmed.

### Playbook B: Configurator with variants
Each variant row separately checked; share material slots where possible; verify `KHR_materials_variants` consumer support.

### Playbook C: Cycles-only render (no GLB)
Looser texture format rules (EXR / Float allowed); still check albedo / normal / roughness sanity; ignore glTF-only constraints.

## Mode handling

### Text-only mode
Verdicts based on plan / spec only; mark `Artifact status: Not Run`.

### Runtime-ready mode
Verdicts based on measured scene snapshot; cite tool used. Never upgrade to `Verified` without recorded measurement.

### Blocked runtime mode
Skip rows that depend on measurement; mark explicitly.

## Validation checklist
- [ ] Every material listed
- [ ] PBR sanity columns filled
- [ ] Texture budget compared to pinned cap
- [ ] Consumer-stack compatibility checked
- [ ] Per-material verdict assigned
- [ ] Top-line status derived from rows
- [ ] Worst offenders highlighted
- [ ] No remediation performed inside this skill
- [ ] Honest evidence label

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All materials pass sanity + budget + consumer compatibility; no Warns escalating to Fail. |
| Warn | One or more materials have plausibility flags (white albedo, edge metallic) but no hard violations. |
| Fail | Any material exceeds texture budget, uses unsupported features for chosen export, or violates per-tier caps. |

## Failure handling
- Missing texture file → Fail with path note.
- Invented values without measurement → refuse; produce empty rows + ask for plan or measurement.
- User pushes for "Pass" without checks → restate requirement, do not relabel.

## Troubleshooting

| Problem | Response |
|---|---|
| Material visible in viewport but missing from list | Confirm linked vs appended status; re-check measured scene snapshot. |
| Roughness texture looks "too dark" | Verify color space (linear, not sRGB); add Warn. |
| Normal map looks inverted | Verify Y-axis convention; add Warn until convention confirmed. |
| GLB export fails on a material | Check unsupported nodes (OSL, drivers); add Fail with node names. |

## Best practices
- Pair every Fail with the rule that triggered it.
- Mark Warn rows that escalate to Fail when consumer is mobile (e.g. 4K texture warns on desktop, fails on mobile).
- Cite consumer stack in every verdict.
- Keep this skill narrow — do not creep into lighting or composition.

## Good examples
- "Albedo (0.04, 0.04, 0.04), Roughness 0.4 (linear), Metallic 0, ORM packed 1024², GLB-compatible. Verdict: Pass."

## Bad examples
- "Materials look fine." — no per-material rows, no verdicts.
- "Verified PBR" — without a sanity rule cited.

## User-facing response template

```txt
Consumer target: <Cycles / Eevee / glTF mobile / glTF desktop>
Texture budget cap: <N MP total>

| Material | Type | Albedo | Normal | Rough/Met | Tex count + res | Consumer | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|
| <name> | PBR | <state> | <state> | <state> | <N × Wpx> | <ok/warn/fail> | Pass/Warn/Fail | <note> |

Top-line: <Pass / Warn / Fail>
Worst offenders: <list 1-2>
Limitations: <gaps>
Next: blender-scene-quality-checker / render-export-evidence
```

## Anti-patterns
- Performing material edits inside this skill.
- Inventing values to make rows pass.
- Marking Verified without measurement.
- Mixing lighting / composition checks here.

## Cross-skill handoff
- Broad readiness review → `../blender-scene-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`
- Polycount budget → `../polycount-budget-checker/SKILL.md`
- GLB export evidence → `../render-export-evidence/SKILL.md`
- Web handoff → `../glb-web-handoff/SKILL.md`

## Non-goals
- Edit materials.
- Generate shader code.
- Replace `blender-scene-quality-checker` (this skill is one of its inputs).
- Run Blender.

## References
- `references/pbr-sanity-rules.md`
- `references/texture-budget-rules.md`
- `references/consumer-stack-rules.md`
- `../../laws/evidence-before-done.md`
- `../../docs/skill-system.md`
