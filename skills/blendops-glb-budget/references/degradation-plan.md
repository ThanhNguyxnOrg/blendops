# Degradation Plan (drop order when over budget)

When a measured GLB exceeds budget, drop in this order. Stop as soon as the budget passes.

## Order of degradation

1. **Texture resolution** — halve the largest texture first (2048 → 1024 → 512). Cheapest visual loss for biggest file-size win.
2. **Texture count** — combine variant maps (roughness + metallic + AO) into one ORM channel-packed map.
3. **Mesh decimation** — apply a 50% decimation to the highest-triangle mesh in the scene.
4. **Sub-mesh hidden geometry** — remove faces never visible from the camera path.
5. **Morph target count** — drop secondary expressions / minor variants.
6. **Bone count** — bake unused bones into the mesh; clamp influences per vertex to 4.
7. **Material variants** — collapse near-duplicate materials into one.
8. **Animation channels** — bake long animations into shorter clips.

## Always-keep rule

Do not degrade if the result breaks the user's visual intent stated in the brief. If steps 1–4 cannot meet the budget, escalate to the user with options instead of silently degrading further.

## Record the degradation

Every degradation step taken must appear in the handoff report:
- step number
- before/after metric values
- visual impact note ("texture detail lost on close-up", "silhouette unchanged after step 3", etc.)

## Do not

- silently drop required materials
- silently drop animations the user asked for
- skip recording degradation steps in the handoff report

## Related skill
`../SKILL.md`
