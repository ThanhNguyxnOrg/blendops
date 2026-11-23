# CLI fallback: shared scene-state script check

## Scope and truth states

- Runtime status: **Verified**, limited to running the read-only [scene-state script](../../skills/blendops-look-check/references/scene-state.md) headless on Linux against three synthetic test scenes.
- Blender versions: `Blender 4.2.23 LTS` and `Blender 5.1.2`, official Linux x64 archives from download.blender.org.
- Path 1 and Path 2: **Not Run**.
- Render, preview, GLB and other artifacts: **Not Produced**. The script only reads the scene and never saves it.
- Real product scenes and the visual review: **Not Run**. This checks the script's facts and verdicts, not scene quality.

No BlendOps-owned CLI command, MCP server or add-on was added. The script is internal to the build, look-check and final-check skills.

## Method

1. Build the test scenes with the scripts below, once per Blender version (a 5.1 file does not open in 4.2).
2. Take the last `python` block of `scene-state.md` as `scene_state.py`, and copies with a `PLAN` pasted in: the example plan from the same file for scene 1, and the plans below for scenes 2 and 3.
3. Run each: `blender -b <scene>.blend --python-exit-code 1 --python scene_state.py`.

Scene 1, planted problems:

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

Scene 2 (a beveled curve, a Geometry Nodes scatter of instances only, a 251,001-vertex grid) and scene 3 (unit scale 0.01, so a 100-unit cube is 1 m):

```python
import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
mat = bpy.data.materials.new("M")
# curve resting 5 cm above the floor
bpy.ops.curve.primitive_bezier_circle_add(radius=0.5, location=(0, 0, 0.05))
c = bpy.context.active_object; c.name = "Ring"; c.data.bevel_depth = 0.05; c.data.materials.append(mat)
# geometry nodes scatter with instances only
bpy.ops.mesh.primitive_plane_add(size=1, location=(2, 0, 0)); g = bpy.context.active_object; g.name = "Scatter"
ng = bpy.data.node_groups.new("Scatter", "GeometryNodeTree")
ng.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
n = ng.nodes; l = ng.links
gi = n.new("NodeGroupInput"); go = n.new("NodeGroupOutput")
pts = n.new("GeometryNodeMeshToPoints"); cube = n.new("GeometryNodeMeshCube"); iop = n.new("GeometryNodeInstanceOnPoints")
cube.inputs["Size"].default_value = (0.2, 0.2, 0.2)
l.new(gi.outputs[0], pts.inputs["Mesh"]); l.new(pts.outputs[0], iop.inputs["Points"])
l.new(cube.outputs[0], iop.inputs["Instance"]); l.new(iop.outputs[0], go.inputs[0])
m = g.modifiers.new("GN", "NODES"); m.node_group = ng
# heavy mesh on the floor
bpy.ops.mesh.primitive_grid_add(x_subdivisions=500, y_subdivisions=500, size=1, location=(-2, 0, 0.3))
h = bpy.context.active_object; h.name = "Heavy"; h.data.materials.append(mat)
bpy.ops.object.camera_add(location=(0, -8, 2), rotation=(math.radians(85), 0, 0)); sc.camera = bpy.context.active_object
bpy.ops.wm.save_as_mainfile(filepath="/home/ubuntu/out/ss/test2.blend")
# centimetre scene: a 100-unit cube is 1 m
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.unit_settings.scale_length = 0.01
bpy.ops.mesh.primitive_cube_add(size=100, location=(0, 0, 50)); bpy.context.active_object.name = "CmBox"
bpy.context.active_object.data.materials.append(bpy.data.materials.new("M"))
bpy.ops.object.camera_add(location=(0, -800, 200), rotation=(math.radians(85), 0, 0)); sc.camera = bpy.context.active_object
bpy.ops.wm.save_as_mainfile(filepath="/home/ubuntu/out/ss/test_cm.blend")
```

Plans: scene 2 `{"objects": {"Ring": [1.1, 1.1, 0.1], "Scatter": [1.2, 1.2, 0.2], "Heavy": [1, 1, 0]}, "grounded": ["Ring", "Scatter", "Heavy"]}`; scene 3 `{"objects": {"CmBox": [1, 1, 1]}, "grounded": ["CmBox"]}`.

## Results

All 16 runs exited with code 0 and printed one JSON report. Both versions gave the same per-object values.

Scene 1 on Blender 5.1.2:

| Object | Type | resting | lowest_z_m | in_frame | parts | floating_parts | normals_inward | instances |
|---|---|---|---|---|---|---|---|---|
| `Box` | MESH | floor | 0.0 | in | 1 |  | False |  |
| `Top` | MESH | on_object | 1.0 | in | 1 |  | False |  |
| `Floater` | MESH | floating | 0.85 | in | 1 |  | False |  |
| `Inverted` | MESH | floor | 0.0 | in | 1 |  | True |  |
| `Ball` | MESH | floor | 0.0012 | in | 1 |  | False |  |
| `Lamp` | MESH | floor | 0.0 | partial | 2 | 1 | False |  |
| `Empty_Mesh` | MESH |  |  | outside |  |  |  |  |

Scenes 2 and 3 on Blender 5.1.2:

| Object | Type | resting | lowest_z_m | in_frame | parts | floating_parts | normals_inward | instances |
|---|---|---|---|---|---|---|---|---|
| `Ring` | CURVE | floor | -0.0 | in | 1 |  | False |  |
| `Scatter` | MESH | below_floor | -0.1 | in |  |  |  | 4 |
| `Heavy` | MESH | floating | 0.3 | in |  |  |  |  |
| `CmBox` | MESH | floor | 0.0 | in | 1 |  | False |  |

| Run | verdict | Issues |
|---|---|---|
| 4.2.23, no plan, scene 1 | `warn` | `warn:floating`, `warn:normals_inward`, `warn:empty_material_slot`, `warn:floating_parts` |
| 5.1.2, no plan, scene 1 | `warn` | `warn:floating`, `warn:normals_inward`, `warn:empty_material_slot`, `warn:floating_parts` |
| 4.2.23, example plan, scene 1 | `fail` | `warn:floating`, `warn:normals_inward`, `warn:empty_material_slot`, `warn:floating_parts`, `fail:exists`, `fail:exists`, `fail:extra_objects`, `fail:light`, `fail:light`, `fail:engine` |
| 5.1.2, example plan, scene 1 | `fail` | `warn:floating`, `warn:normals_inward`, `warn:empty_material_slot`, `warn:floating_parts`, `fail:exists`, `fail:exists`, `fail:extra_objects`, `fail:light`, `fail:light` |
| 4.2.23, scene 2 plan | `fail` | `warn:below_floor`, `warn:floating`, `fail:ground_contact`, `fail:ground_contact` |
| 5.1.2, scene 2 plan | `fail` | `warn:below_floor`, `warn:floating`, `fail:ground_contact`, `fail:ground_contact` |
| 4.2.23, centimetre scene plan | `pass` | none |
| 5.1.2, centimetre scene plan | `pass` | none |

- Scene 1: each planted problem was found: the floating cube, the inside-out cube, the empty material slot, the loose part on `Lamp`, and the mesh a modifier empties (`Empty_Mesh`, no vertices, no crash). The tilted sphere (lowest vertex 1.2 mm) and the stacked cube `Top` are not reported as floating.
- Scene 1 with the example plan: the plan is for a shoe scene, so its `fail` items are expected. Only 4.2 fails `engine`: its EEVEE id is `BLENDER_EEVEE_NEXT`, the plan uses the 5.x id `BLENDER_EEVEE`.
- Scene 2: the curve is measured from its evaluated mesh and sits on the floor. The scatter has no vertices of its own but passes `geometry` and `size` through its 4 instances; it fails `ground_contact` because its 0.2 m cubes are centred on the floor and sink 0.1 m below it, which is correct. The heavy grid gets `lowest_z_m` (0.3) and fails `ground_contact`.
- Scene 3: the centimetre cube reports 1 m sizes and passes the plan.
