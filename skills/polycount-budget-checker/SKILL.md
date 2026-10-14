---
name: polycount-budget-checker
description: Validate per-mesh and total-scene triangle counts against the pinned budget; flag worst offenders and topology hints without modeling.
---

# polycount-budget-checker

## Purpose
Run a focused pass/warn/fail check on per-mesh and total-scene triangle counts vs the pinned budget from `glb-mobile-performance-budget` (or any other pinned budget). Surface worst offenders and basic topology hints without performing modeling.

## Quick start
- read the pinned budget (per-mesh + total-scene)
- enumerate every mesh in the scene plan or measured scene
- compute per-mesh triangle counts vs per-mesh cap
- compute total-scene triangle count vs total cap
- flag worst offenders + give topology hints (no modeling)

## When to use
- before render
- before GLB export
- after a mesh change request
- as a sub-check during full quality review
- when `glb-mobile-performance-budget` is pinned

## When not to use
- pinning or negotiating the performance budget itself (use `glb-mobile-performance-budget`)
- material validation (use `material-quality-checker`)
- lighting validation (use `lighting-quality-checker`)
- composition validation (use `composition-quality-checker`)
- broad scene readiness review (use `blender-scene-quality-checker`)
- classifying render or export artifact evidence (use `render-export-evidence`)
- fixing topology, decimating, or retopologizing (this skill validates; it never edits or models)

## Trigger phrases
- "is the polycount okay"
- "check triangle budget"
- "what's blowing the budget"
- "topology issue?"

## Prerequisites / readiness
- pinned budget known (from `glb-mobile-performance-budget` or explicit user)
- mesh list known (scene plan or measured scene)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Pinned budget (per-mesh + total-scene caps) | Anchors the check (from `glb-mobile-performance-budget`) |
| Mesh list (name + triangle count + count basis + instance count) | Defines scope, evaluated cost, and per-scene instance multiplier |

### Optional inputs

| Input | Use |
|---|---|
| Scene scope context | Single product vs environment changes per-mesh expectations |
| Animation flags per mesh | Skinned meshes have stricter caps |
| Modifier / Scene Simplify notes | Flags Subdivision, Multiresolution, Solidify render levels or Scene Simplify reductions |

### Assumptions to confirm
- The count that matters is the **evaluated render mesh** (base mesh + full modifier stack at render levels), not the viewport display.
- Every count states its basis (`base mesh` / `viewport` / `evaluated render mesh`); an unknown basis is marked `Not Run`, never guessed.
- Instances share geometry: count each unique mesh once against the per-mesh cap, and compute `base × N` callers for the total-scene cost.
- Counts include all visible meshes; hidden / collection-disabled meshes excluded.
- "Triangles" in glTF = primitive triangles after triangulation, not Blender face count.

## Output schema

### Primary output
A per-mesh row table: mesh name, triangle count, count basis (`base` / `viewport` / `evaluated render mesh` / `Not Run`), instance count (`N`), vs per-mesh cap, vs total budget contribution (`base × N`), validation verdict (`Pass` / `Warn` / `Fail` / `Not Run`), and advisory topology hint (no edit).

### Secondary output
- top-line validation status (`Pass` / `Warn` / `Fail` / `Not Run`) computed from rows (separate from truth states)
- worst-offender list (top 1–3 meshes by evaluated contribution)
- general topology hints (advisory only, no modeling)

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default: Not Produced)
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps, viewport-only caveats, or Scene Simplify notes>
```

Note: Truth states are downgrade-only (never upgrade). Validation verdicts (`Pass` / `Warn` / `Fail`) are separate from runtime and artifact truth states.

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

This skill validates plans or measured scene snapshots. It never decimates, retopologizes, or runs Blender. Hints are advisory.

## Operating procedure
1. Read the pinned budget from `glb-mobile-performance-budget` output (or explicit user input).
2. Read the mesh list, triangle counts, instance counts (`N`), and stated count basis (`base` / `viewport` / `evaluated render mesh`). If a mesh's count or basis is unknown, mark its row `Not Run` — never guess.
3. Verify whether counts reflect the **evaluated render mesh** (base mesh + full modifier stack at render levels, accounting for Subdivision, Multiresolution, Solidify, and Scene Simplify). Flag viewport-only counts as undercounting risks.
4. For each unique mesh, compare its evaluated triangle count once against the per-mesh cap (see `references/per-mesh-rules.md`).
5. Compute total-scene triangle cost by summing `base × N` across all instances in the scene, then compare against the total-scene cap.
6. Identify worst offenders (top 1–3 by evaluated count or scene contribution).
7. Generate advisory topology hints per `references/topology-hints.md` (never model, decimate, or retopologize).
8. Compute top-line validation status (`Pass` / `Warn` / `Fail`) separately from downgrade-only truth states.
9. Hand off rows to `blender-scene-quality-checker` (broad review), `glb-mobile-performance-budget` (budget re-pinning), or `render-export-evidence` (artifact evidence classification).

## Decision tree

```txt
Count or count basis (base / viewport / evaluated render mesh) unknown?
  → Mark row Not Run (never guess or fabricate)
Total evaluated triangle count (including base × N instances) > total cap?
  → Fail (whole-scene)
Single mesh > 50% of total cap?
  → Warn (one mesh dominates)
Single mesh > total cap by itself?
  → Fail
Skinned mesh > per-mesh skinned cap?
  → Fail (skinning cost is non-linear)
Hidden / disabled meshes consume budget by accident?
  → Warn (verify exclusion before export)
Counts read at viewport levels while modifiers (Subdivision, Multiresolution, Solidify) render higher?
  → Warn (viewport display undercounts cost; re-read evaluated render mesh)
Scene Simplify enabled at render time?
  → Note in limitations; effective subdivision is lowered so rendered result may be cheaper than modeled
```

## Playbooks

### Playbook A: Single-product hero
Use the pinned total and per-mesh caps from `glb-mobile-performance-budget`. Verify every count states `evaluated render mesh` basis (accounting for Subdivision, Multiresolution, and Solidify at render levels). Fail any mesh exceeding the pinned per-mesh cap.

### Playbook B: Multi-variant configurator
Use the pinned caps from `glb-mobile-performance-budget`. Verify shared base meshes are counted once per active variant combination, while variant-specific overrides are evaluated per active configuration.

### Playbook C: Instanced environment scene
Use the pinned caps from `glb-mobile-performance-budget`. Instances (such as trees or fence posts) share geometry: validate the unique mesh once against the per-mesh cap, but compute `base × N` callers for the total-scene triangle cost.

## Mode handling

### Text-only mode
Read planned counts and stated basis from the scene plan; set `Runtime status: Not Run` and `Artifact status: Not Produced` (default). Mark any mesh with an unstated basis as `Not Run`.

### Runtime-ready mode
Read evaluated render mesh counts from the measured scene snapshot and cite the source. Keep validation verdicts (`Pass` / `Warn` / `Fail`) separate from truth states. Truth states are strictly downgrade-only — never upgrade a truth state here; hand off artifact evidence classification to `render-export-evidence`.

### Blocked runtime mode
Do not guess missing or unmeasured evaluated counts; mark affected rows `Not Run` and record the blocker under `Limitations`.

## Validation checklist
- [ ] Pinned budget recorded from `glb-mobile-performance-budget`
- [ ] Every mesh listed with triangle count and instance count (`N`)
- [ ] Count basis stated for every row (`base` / `viewport` / `evaluated render mesh`); unknown basis marked `Not Run`
- [ ] Modifiers with separate viewport/render levels (Subdivision, Multiresolution, Solidify) and Scene Simplify accounted for
- [ ] Instances counted once against per-mesh cap and `base × N` toward total-scene cost
- [ ] Per-mesh `%` of total budget and `Pass` / `Warn` / `Fail` / `Not Run` verdicts assigned
- [ ] Worst offenders highlighted and topology hints kept strictly advisory (no modeling)
- [ ] Truth states kept separate from validation verdicts and strictly downgrade-only (default artifact status `Not Produced`)

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Evaluated render mesh basis stated; all unique meshes under per-mesh cap; total scene cost (including `base × N` instances) under total cap with 20% headroom; no single mesh dominates. |
| Warn | Total scene cost within 80–100% of cap; one mesh dominates (`> 50%` of total); skinned mesh near per-mesh cap; counts read at viewport basis when Subdivision, Multiresolution, or Solidify may evaluate higher at render. |
| Fail | Total scene cost over cap; single mesh over total or per-mesh cap; skinned mesh over per-mesh cap; missing pinned budget. |
| Not Run | Triangle count or count basis (`base` / `viewport` / `evaluated render mesh`) is missing or unknown (never guess). |

## Failure handling
- Missing pinned budget → refuse validation; redirect to `glb-mobile-performance-budget`.
- Mesh count or count basis missing/unknown → mark `Not Run` for that row; never guess or fabricate.
- User pushes for "Pass" without evaluated counts or basis → restate count-basis requirement and keep `Not Run` / `Warn`.
- User requests upgrading Runtime or Artifact truth state to `Verified` → refuse; truth states are downgrade-only (hand off evidence classification to `render-export-evidence`).

## Troubleshooting

| Problem | Response |
|---|---|
| Total over cap | Identify worst offenders (including high `base × N` instance callers); recommend decimation or normal/texture detail trade (advisory only). |
| One mesh over per-mesh cap | Recommend splitting primitives or adding LODs (advisory only). |
| Skinned mesh expensive | Recommend reducing bone influences per vertex (clamp `≤ 4`) or bone count (advisory only). |
| Hidden meshes counted | Verify export settings exclude hidden or collection-disabled objects. |
| Viewport says under budget but render/export is heavy | Re-read the **evaluated render mesh**; modifiers with separate viewport/render levels (Subdivision, Multiresolution, Solidify) increase real cost, while Scene Simplify may temporarily lower effective subdivision in renders. |

## Best practices
- Always pair total-scene and per-mesh caps from `glb-mobile-performance-budget`; either alone is misleading.
- Reserve 20% headroom against absolute caps.
- Handle instances accurately: instances share geometry (count the unique mesh once against the per-mesh cap), but still compute `base × N` callers for the total-scene cost.
- Always validate the **evaluated render mesh** (base mesh + full modifier stack at render levels), never the viewport display, and state the basis on every count.
- Keep validation verdicts (`Pass` / `Warn` / `Fail`) separate from downgrade-only truth states.

## Good examples
- "Basis: evaluated render mesh (Subdivision at render level 2). Total: 38K of 50K cap (76%). Per-mesh worst: `shoe-upper` at 18K (36% of total cap, under 40K per-mesh cap). Instances: `lace-eyelet` 500 tris × 12 = 6K scene cost. Verdict: Pass."

## Bad examples
- "Polycount looks fine." — no numbers.
- "Verified" without measurement.

## User-facing response template

```txt
Pinned budget: <total triangles cap> | <per-mesh cap> (from glb-mobile-performance-budget)

| Mesh | Tri count | Basis (base / viewport / evaluated render mesh / Not Run) | Instances (N) | Scene cost (base × N) | % of total | Verdict | Hint (advisory) |
|---|---|---|---|---|---|---|---|

Total scene cost: <N> of <cap> (<%>) | Per-mesh worst: <name> at <count> (<basis>)
Top-line verdict: <Pass / Warn / Fail / Not Run>
Runtime status: <Not Run | Attempted | Produced | Verified | Failed>
Artifact status: <Not Run | Not Produced | Produced | Verified | Failed>
Evidence used: <links, paths, logs, or "none">
Limitations: <gaps, viewport-only warnings, or Scene Simplify notes>
Next: blender-scene-quality-checker | glb-mobile-performance-budget | render-export-evidence
```

## Anti-patterns
- Decimating inside this skill.
- Inventing triangle counts.
- Counting viewport display triangles and calling it the export cost.
- Marking Verified without measurement.
- Mixing material / lighting / composition checks.

## Cross-skill handoff
- Pinned budget source → `../glb-mobile-performance-budget/SKILL.md`
- Broad readiness review → `../blender-scene-quality-checker/SKILL.md`
- Artifact evidence classification → `../render-export-evidence/SKILL.md`
- Material validation → `../material-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`

## Non-goals
- Decimate or retopologize.
- Generate topology recipes.
- Replace `blender-scene-quality-checker`.
- Run Blender.

## References
- `references/per-mesh-rules.md`
- `references/topology-hints.md`
- `references/instance-counting-rules.md`
- `../../laws/evidence-before-done.md`
- `../../docs/skill-system.md`
