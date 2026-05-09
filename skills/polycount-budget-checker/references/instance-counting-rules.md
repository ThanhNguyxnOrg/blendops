# Instance counting rules

Instances share geometry. Counting them as "N copies × triangles" inflates the budget and misleads the user.

## glTF semantics

In glTF, multiple nodes can reference the same mesh. The mesh data is stored once; nodes are cheap. Per-instance triangle cost on the GPU side is one draw call's worth of indexed geometry.

## How to count

| Setup | Triangle count |
|---|---|
| Single mesh, single node | mesh triangles |
| Single mesh, 100 nodes (instances) | mesh triangles (geometry stored once) |
| 10 meshes, all unique | sum of all mesh triangles |
| 10 meshes shared via instances of base mesh | base mesh triangles only |

## Draw call vs triangle budget

Instances reduce **triangle budget** but not **draw call budget**. 100 instances of a tree:
- Triangles: tree triangle count (once)
- Draw calls: ~100 (one per node, depending on stack)

This is why `glb-mobile-performance-budget` includes a draw call budget separate from triangles.

## What counts as an "instance" in Blender

| Blender feature | glTF result |
|---|---|
| Linked duplicate (Alt-D) | Instance |
| Particle system instances | Often baked to real geometry on export; verify |
| Geometry Nodes instances | Often baked; verify |
| Collection Instance | Instance (glTF nodes share mesh) |
| Regular duplicate (Shift-D) | Separate mesh data; counts each time |

Always verify the export option treats the chosen feature as instance vs bake-on-export.

## Related skill
`../SKILL.md`
