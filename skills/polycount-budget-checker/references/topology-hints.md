# Topology hints (advisory only)

These are flags this skill can raise without performing modeling. The user (or modeling-skilled human) acts on them.

## Hints from triangle count alone

| Observation | Hint |
|---|---|
| Single mesh > 50K triangles for product hero | Likely retopology candidate (especially if hero close-up) |
| Skinned mesh > per-tier cap | Decimate or split mesh |
| Many small meshes (50+) at low triangle count | Consider merging to reduce draw calls |
| Sub-1K triangle mesh that is barely visible | Consider hiding / removing |

## Hints from naming / scene plan

| Observation | Hint |
|---|---|
| "high-poly-source" or similar in mesh name | Likely undecimated source; should not be in export |
| "lod0", "lod1", "lod2" naming | LOD setup; export only the chosen LOD |
| "boolean-result" or "boolean-cutter" naming | Boolean ops often produce poor topology; flag for review |
| Names with spaces or special chars | Some loaders fail; flag for renaming |

## Hints from geometry stats (if available)

| Observation | Hint |
|---|---|
| N-gons (faces > 4 vertices) detected | Triangulate before export to avoid loader inconsistency |
| Non-manifold edges | Some loaders fail; flag |
| Inverted normals (back-facing) | Visual artifacts in some stacks; flag |
| Zero-area faces | Wasted budget; remove |

## What this skill does NOT do

- Decimate
- Retopologize
- Triangulate
- Merge / split meshes
- Edit naming

## Mesh, UV, & anatomy QA gates (inherited production rules)

| Gate | Concrete threshold / check | Advisory impact |
|---|---|---|
| **Applied transforms & ground** | `scale == (1, 1, 1)`, no negative scale, hero prop origin at bottom center (`Z = 0`) | Fail — negative scale flips normals and ruins lighting/export |
| **Manifold & weld hygiene** | Check `merge_by_distance (1e-4)`, zero loose/wire edges, zero degenerate faces, consistent outside normals | Warn/Fail — inside-out islands and duplicates cause shading seams |
| **Sharp edges ↔ UV seams** | Hard edges (`> 60°`) must carry matching UV seams on baked/normal-mapped assets; UV overlaps = `0%` (except deliberate `+1 U` mirrors) | Warn — unseamed hard edges distort baked normal maps |
| **Texel density consistency** | Keep scene asset density spread `<= 1.3×` (`1024–2048 px/m` FP hero, `512 px/m` PC/console, `256 px/m` mobile web) | Warn — blurry hero next to crisp props |
| **Deformation loops & skinning** | Character bending joints (elbow, knee, shoulder, finger) need `>= 3` edge loops; `<= 4` bone weights per vertex | Warn/Fail — joints collapse under animation |
| **Six-face & paired components** | Check all 6 sides (`-Y/+Y/-X/+X/+Z/-Z`) for missing back/underside detail and paired parts (front+rear, left+right, mount yoke vs floating rod) | Warn — prevents missing backsides and "primitive kitbashing" |

## How to use the hints

The hints are advisory. The user (or a modeling-skilled collaborator) acts on them via `blender-troubleshooting` or a separate modeling task — not inside this validation skill.

## Related skill
`../SKILL.md`
