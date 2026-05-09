# Animation Types in GLB

## Skeletal (skin + armature)
- Drives bone transforms; mesh follows via skinning weights.
- glTF stores: armature node hierarchy + inverse-bind matrices + skin reference + animation samplers per bone.
- Web playback: `mixer.clipAction(clip)` plays the entire bone hierarchy.
- Constraint: per-mesh bone count ceiling varies by web stack. Three.js has no fixed cap but high bone counts hurt mobile performance.

## Morph targets (shape keys)
- Drives vertex deltas; no skeleton.
- glTF stores: morph target arrays per primitive + animation samplers on weights.
- Web playback: `mesh.morphTargetInfluences[i]` controlled by mixer or manually.
- Constraint: morph targets balloon GLB file size; budget tightly on mobile.

## Both (skeletal + morph)
- Common for face rigs (jaw bone + face shape keys).
- glTF supports both simultaneously per primitive.
- Constraint: doubles channel count; needs explicit budget allocation.

## Object-level transform animation
- Animates root or parent node translate / rotate / scale directly (no skin, no morph).
- Cheapest option for "spinning logo" or "floating product" cases.
- Often preferred when no deformation is required.

## Recommendation per use case

| Use case | Recommended type |
|---|---|
| Idle product hover | Object-level transform animation |
| Character idle / walk | Skeletal |
| Face expressions | Skeletal jaw + morph for fine shapes |
| Product configurator (color swap) | Material variant, **not** animation |
| Cloth / soft body | Pre-baked vertex animation (rare in glTF; consider video fallback) |

## Related skill
`../SKILL.md`
