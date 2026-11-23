# CLI fallback: shared scene-state script check

## Scope and truth states

- Runtime status: **Verified**, limited to running the read-only [scene-state script](../../skills/blendops-look-check/references/scene-state.md) headless on Linux against one synthetic test scene.
- Blender versions: `Blender 4.2.23 LTS` and `Blender 5.1.2`, official Linux x64 archives from download.blender.org.
- Path 1 and Path 2: **Not Run**.
- Render, preview, GLB and other artifacts: **Not Produced**. The script only reads the scene and never saves it.
- Real product scenes and the visual review: **Not Run**. This checks the script's facts and verdicts, not scene quality.

No BlendOps-owned CLI command, MCP server or add-on was added. The script is internal to the build, look-check and final-check skills.

## Method

1. Build the test scene with the script below (one process, saves `test.blend`).
2. Take the last `python` block of `scene-state.md` as `scene_state.py`, and a copy with the `PLAN` example from the same file pasted in.
3. Run both on each version: `blender -b test.blend --python-exit-code 1 --python scene_state.py`.

```python
import bpy, bmesh, math
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
def cube(name, size, loc):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.active_object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); return o
mat = bpy.data.materials.new("M")
grounded = cube("Box", (1,1,1), (0,0,0.5)); grounded.data.materials.append(mat)
stacked = cube("Top", (0.5,0.5,0.5), (0,0,1.25)); stacked.data.materials.append(mat)
floater = cube("Floater", (0.3,0.3,0.3), (2,0,1.0)); floater.data.materials.append(mat)
# inverted normals + empty slot
inv = cube("Inverted", (0.5,0.5,0.5), (-2,0,0.25))
bm = bmesh.new(); bm.from_mesh(inv.data); bmesh.ops.reverse_faces(bm, faces=bm.faces); bm.to_mesh(inv.data); bm.free()
inv.data.materials.append(None)
# tilted sphere resting at z=0 (bbox below floor)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.3, location=(0,2,0.3)); s=bpy.context.active_object; s.name="Ball"; s.rotation_euler=(0.6,0.3,0); s.data.materials.append(mat)
# object with a floating loose part
o = cube("Lamp", (0.2,0.2,0.2), (0,-2,0.1)); o.data.materials.append(mat)
bm = bmesh.new(); bm.from_mesh(o.data); bmesh.ops.create_cube(bm, size=0.1, matrix=__import__('mathutils').Matrix.Translation((0,-2,0.6))); bm.to_mesh(o.data); bm.free()
# empty mesh via modifier
bpy.ops.mesh.primitive_cube_add(size=1, location=(4,0,0.5)); e=bpy.context.active_object; e.name="Empty_Mesh"
m=e.modifiers.new("w","MASK"); m.vertex_group="none"; 
bpy.ops.object.light_add(type='AREA', location=(3,-3,4)); bpy.context.active_object.name="Key"
bpy.ops.object.camera_add(location=(0,-8,2), rotation=(math.radians(85),0,0)); sc.camera = bpy.context.active_object
bpy.ops.wm.save_as_mainfile(filepath="/home/ubuntu/out/ss/test.blend")
```

## Results

All four runs exited with code 0 and printed one JSON report.

Per-object facts on Blender 5.1.2 (4.2.23 gave the same values):

| Object | Type | resting | lowest_z_m | in_frame | parts | floating_parts | normals_inward |
|---|---|---|---|---|---|---|---|
| `Box` | MESH | floor | 0.0 | in | 1 |  | False |
| `Top` | MESH | on_object | 1.0 | in | 1 |  | False |
| `Floater` | MESH | floating | 0.85 | in | 1 |  | False |
| `Inverted` | MESH | floor | 0.0 | in | 1 |  | True |
| `Ball` | MESH | floor | 0.0012 | in | 1 |  | False |
| `Lamp` | MESH | floor | 0.0 | partial | 2 | 1 | False |
| `Empty_Mesh` | MESH |  |  | outside |  |  |  |
| `Key` | LIGHT |  |  | outside |  |  |  |
| `Camera` | CAMERA |  |  | in |  |  |  |

| Run | verdict | Issues |
|---|---|---|
| 4.2.23, no plan | `warn` | `warn:floating`, `warn:normals_inward`, `warn:empty_material_slot`, `warn:floating_parts` |
| 5.1.2, no plan | `warn` | `warn:floating`, `warn:normals_inward`, `warn:empty_material_slot`, `warn:floating_parts` |
| 4.2.23, example plan | `fail` | `warn:floating`, `warn:normals_inward`, `warn:empty_material_slot`, `warn:floating_parts`, `fail:exists`, `fail:exists`, `fail:extra_objects`, `fail:light`, `fail:light`, `fail:engine` |
| 5.1.2, example plan | `fail` | `warn:floating`, `warn:normals_inward`, `warn:empty_material_slot`, `warn:floating_parts`, `fail:exists`, `fail:exists`, `fail:extra_objects`, `fail:light`, `fail:light` |

- Each planted problem was found: the floating cube, the inside-out cube, the empty material slot, the loose part on `Lamp`, and the mesh a modifier empties (`Empty_Mesh`, no vertices, no crash).
- The tilted sphere sits on the floor with its lowest vertex at 1.2 mm, so it is not reported as floating.
- The stacked cube `Top` is `on_object`, not floating.
- The example plan is for a shoe scene, so the plan `fail` items are expected. Only 4.2 fails `engine`: its EEVEE id is `BLENDER_EEVEE_NEXT`, while the plan uses the 5.x id `BLENDER_EEVEE`.
