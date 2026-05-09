# Stage decomposition patterns

## Standard 7-stage recipe (default for Blender hero work)

1. Brief (intent → 3D brief via `intent-to-3d-brief-writer`)
2. Scene plan (via domain scene planner)
3. Asset discovery (via `blender-asset-discovery-planner`)
4. Scene build (modeling / lookdev — runtime work)
5. Render (via `render-export-evidence` capture)
6. Export (GLB or PNG export — runtime work)
7. Handoff (via `glb-web-handoff` + `non-blender-user-response-writer`)

## 5-stage recipe (multi-product grid)

1. Brief
2. Grid plan (via `product-grid-scene-planner`)
3. Consistency setup (camera + lighting locked)
4. Render
5. Export

## 6-stage recipe (character portrait)

1. Brief
2. Portrait plan (via `character-portrait-scene-planner`)
3. Asset discovery
4. Lookdev (materials + lighting test)
5. Render
6. Handoff

## 4-stage recipe (text-only planning, no runtime)

1. Brief
2. Scene plan
3. Quality validation (text-only via checkers)
4. Plan handoff

## When to add stages

- If two sub-stages have very different acceptance criteria → split.
- If user wants explicit approval point in the middle → add a review stage.
- If parallel work happens (e.g., asset discovery + scene plan in parallel) → still gate each separately.

## When to merge stages

- If two stages share the same gate criteria → merge.
- If a stage is too small to gate meaningfully → fold into adjacent.

## Avoid

- More than 9 stages (gate fatigue; user disengages).
- Less than 4 stages for non-trivial work (gates lose value).
- Stages not aligned to a real handoff (synthetic stages just to add gates).

## Related skill
`../SKILL.md`
