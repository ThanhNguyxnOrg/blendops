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

## How to use the hints

The hints are advisory. The user (or a modeling-skilled collaborator) acts on them via `blender-troubleshooting` or a separate modeling task — not inside this validation skill.

## Related skill
`../SKILL.md`
