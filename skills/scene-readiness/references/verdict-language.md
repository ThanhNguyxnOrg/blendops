# Verdict Language

## Purpose
Standardize final readiness verdict labels across `scene-readiness` and `pre-handoff-verification` so stakeholders immediately understand whether an asset is truly deliverable on disk, only planned on paper, or blocked.

## When to use
- At the opening and closing verdict lines of every `scene-readiness` check.

## Four Canonical Readiness Verdicts

| Verdict Label | Exact Meaning | Allowed Companion Truth States | Example Wording |
|---|---|---|---|
| `Ready` | Both planning **AND** real exported/rendered artifacts exist on disk and passed all P0 visual, geometry, and `gltf-validator` checks | `Runtime status: Verified`, `Artifact status: Verified` | `"Ready: exports/hero-shoe.glb (2.8 MB, 31k tris, gltf-validator 0 errors) and hero render PNG verified on disk."` |
| `Conditionally Ready` | Artifacts exist (`Produced`) with minor non-blocking `Warn` polish items, **OR** planning docs are complete (`Ready (planning-only)`) awaiting runtime execution | `Produced` (with explicit caveats) OR `Not Run / Not Produced` (explicitly scoped as plan-only) | `"Conditionally Ready (planning-only): scene, camera, and material plans pass review, but Runtime status is Not Run and Artifact status is Not Produced until Blender executes."` |
| `Not Ready` | Real defects found (clipped frame, missing `Z = 0` grounding, budget overflow, unbaked procedural shaders, or `gltf-validator` errors) | `Runtime status: Failed` or `Verified` with failing `Artifact status: Failed` | `"Not Ready: exports/hero.glb failed mobile budget (148k tris vs 50k cap) and dropped procedural sole texture. Next: bake maps and decimate before re-export."` |
| `Not Run` | Execution/evaluation check itself could not start due to missing runtime setup or missing inputs (`Runtime status: Not Run`, `Artifact status: Not Produced`) | `Runtime status: Not Run`, `Artifact status: Not Produced` | `"Not Run: Blender Lab MCP bridge not configured yet; no render or .glb evaluation could be performed."` |

## Hard Prohibition
- Never output `Ready` when `Runtime status` is `Not Run` or `Artifact status` is `Not Produced`. Without files on disk, the highest truthful verdict is **`Conditionally Ready (planning-only)`** or **`Not Run`**.

## Related skill
[../SKILL.md](../SKILL.md)
