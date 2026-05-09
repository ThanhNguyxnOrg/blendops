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
- material validation (use `material-quality-checker`)
- lighting / composition validation (other quality checkers)
- broad readiness (use `blender-scene-quality-checker`)
- to fix topology (this skill validates, it does not edit)

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
| Pinned budget (per-mesh + total-scene caps) | Anchors the check |
| Mesh list (name + triangle count) | Scope of the check |

### Optional inputs

| Input | Use |
|---|---|
| Scene scope context | Single product vs environment changes per-mesh expectations |
| Animation flags per mesh | Skinned meshes have stricter caps |

### Assumptions to confirm
- Triangle counts are post-decimation (final), not pre-decimation source.
- Counts include all visible meshes; hidden / collection-disabled meshes excluded.
- "Triangles" in glTF = primitive triangles after triangulation, not Blender face count.

## Output schema

### Primary output
A per-mesh row table: name, triangle count, vs per-mesh cap, vs total budget contribution, verdict, hint (no edit).

### Secondary output
- top-line status (Pass / Warn / Fail) with totals
- worst-offender list (top 1–3 meshes)
- general topology hints (no modeling)

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

This skill validates plans or measured scene snapshots. It never decimates, retopologizes, or runs Blender. Hints are advisory.

## Operating procedure
1. Read pinned budget from `glb-mobile-performance-budget` output (or user input).
2. Read mesh list with triangle counts.
3. For each mesh, compute % of total budget consumed.
4. Apply per-mesh cap rules (see `references/per-mesh-rules.md`).
5. Sum scene triangle count vs total cap.
6. Identify worst offenders (top 1–3 by absolute count).
7. Generate topology hints (advisory only) per `references/topology-hints.md`.
8. Compute top-line status; flag any Fail.
9. Hand off to `blender-scene-quality-checker` (broad review) or `glb-mobile-performance-budget` (re-budget) if needed.

## Decision tree

```txt
Total triangle count > total cap?
  → Fail (whole-scene)
Single mesh > 50% of total cap?
  → Warn (one mesh dominates)
Single mesh > total cap by itself?
  → Fail
Skinned mesh > per-mesh skinned cap?
  → Fail (skinning cost is non-linear)
Hidden / disabled meshes consume budget by accident?
  → Warn (verify exclusion before export)
```

## Playbooks

### Playbook A: Single-product hero (mid-mobile)
Total cap 50K; single mesh ≤ 40K (80% headroom rule); under 4 meshes typical. Fail any mesh over 80%.

### Playbook B: Configurator with 5 variants (high-mobile)
Total cap 100K; verify shared geometry; only variant-specific overrides count toward variant budget.

### Playbook C: Environment scene (low-end Android)
Total cap 25K; instance heavy meshes (trees, fence posts) so they share geometry; per-instance triangle count = base mesh × N is the scene cost.

## Mode handling

### Text-only mode
Read counts from scene plan; mark `Artifact status: Not Run`.

### Runtime-ready mode
Read counts from measured scene snapshot; cite tool used. Never upgrade to `Verified` without recorded measurement.

### Blocked runtime mode
Skip rows that depend on measurement; mark explicitly.

## Validation checklist
- [ ] Pinned budget recorded
- [ ] Every mesh listed with triangle count
- [ ] Per-mesh % of total budget computed
- [ ] Verdicts assigned per mesh
- [ ] Worst offenders highlighted
- [ ] Topology hints advisory only (no modeling done)
- [ ] Top-line status from rows

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All meshes under per-mesh cap; total under cap with 20% headroom; no single mesh dominates. |
| Warn | Total within 80–100% of cap; one mesh dominates (>50% of total); skinned mesh near per-mesh cap. |
| Fail | Total over cap; single mesh over total cap; skinned mesh over per-mesh cap; missing budget. |

## Failure handling
- Missing budget → refuse; redirect to `glb-mobile-performance-budget`.
- Mesh count missing → mark `Not Run` per row; do not fabricate.
- User pushes for "Pass" without checks → restate requirement.

## Troubleshooting

| Problem | Response |
|---|---|
| Total over cap | Identify worst offenders; recommend decimation / texture detail trade. |
| One mesh over per-mesh cap | Recommend split into multiple primitives or LOD. |
| Skinned mesh expensive | Reduce bone influences per vertex (clamp ≤ 4); reduce bone count. |
| Hidden meshes counted | Verify export options exclude hidden/disabled collections. |

## Best practices
- Use total + per-mesh caps together; either alone is misleading.
- Reserve 20% headroom against absolute caps.
- Treat instances as shared geometry; count once, not per-instance.
- Keep this skill narrow.

## Good examples
- "Total 38K of 50K cap (76%). Per-mesh worst: shoe-upper 18K (47% of total). All under per-mesh cap. Verdict: Pass with one Warn (shoe-upper dominates)."

## Bad examples
- "Polycount looks fine." — no numbers.
- "Verified" without measurement.

## User-facing response template

```txt
Pinned budget: <total triangles cap> | <per-mesh cap>

| Mesh | Tri count | % of total | Verdict | Hint (advisory) |
|---|---|---|---|---|

Total: <N> of <cap> (<%>) | Per-mesh worst: <name> at <count>
Top-line: <Pass / Warn / Fail>
Limitations: <gaps>
Next: blender-scene-quality-checker / glb-mobile-performance-budget
```

## Anti-patterns
- Decimating inside this skill.
- Inventing triangle counts.
- Marking Verified without measurement.
- Mixing material / lighting / composition checks.

## Cross-skill handoff
- Pinned budget source → `../glb-mobile-performance-budget/SKILL.md`
- Broad readiness review → `../blender-scene-quality-checker/SKILL.md`
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
