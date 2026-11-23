# Budget Violation Rules

When a measured GLB exceeds the pinned budget, treat the violation as a **handoff blocker** unless the user explicitly accepts the degradation.

## Block-handoff violations

| Metric | Block if … |
|---|---|
| Triangle count | > 100% of cap |
| GLB file size | > 100% of cap |
| Single texture pixel area | > tier max (e.g. >1024² on mid-mobile) |
| Total texture pixel budget | > 150% of cap |
| Draw calls | > 100% of cap |
| Bones | > 100% of cap (skinning cost is non-linear) |
| Morph targets | > tier max (>0 on low-end Android) |

## Warn-only violations

| Metric | Warn if … |
|---|---|
| Triangle count | 80–100% of cap |
| GLB file size | 80–100% of cap |
| Distinct materials | 80–100% of cap |
| Animation channels | 80–100% of cap |

## Always-fail violations

These bypass any "user accepts" override because they break web playback:

- GLB references a missing texture file
- GLB exceeds 16-bit vertex index range without per-primitive split (some loaders fail)
- Animation references missing bone or morph target
- Texture format unsupported by `gltf` (e.g. EXR not converted)

## Reporting

Always report violations with:
- the offending metric, the measured value, the budgeted cap, the tier
- whether the violation is Block / Warn / Always-fail
- the suggested degradation step (see `degradation-plan.md`)

## Related skill
`../SKILL.md`
