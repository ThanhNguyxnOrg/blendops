# CLI fallback: shared scene-state script check

## Scope and truth states

- Runtime status: **Verified**, limited to running the read-only [scene-state script](../../skills/blendops-look-check/references/scene-state.md) headless on Linux against five synthetic test scenes.
- Blender versions: `Blender 4.2.23 LTS` and `Blender 5.1.2`, official Linux x64 archives from download.blender.org.
- Path 1 and Path 2: **Not Run**.
- Render, preview, GLB and other artifacts: **Not Produced**. The script only reads the scene and never saves it.
- Real product scenes and the visual review: **Not Run**. This checks the script's facts and verdicts, not scene quality.

No BlendOps-owned CLI command, MCP server or add-on was added. The script is internal to the build, look-check and final-check skills.

## Method

The same scenes are built by [`evals/blender-checks/scene-state-scenes.py`](../../evals/blender-checks/scene-state-scenes.py) and rechecked in CI on every relevant change; see [cli-fallback-blender-ci.md](./cli-fallback-blender-ci.md).

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

Scene 4 (rotated Geometry Nodes spheres resting on the floor, a mesh with no material that also makes an instance and has a loose part above it, a mesh shaded only by a Geometry Nodes material, metaball families including a dotted name, an empty metaball named after a plain mesh, a long bar turned 45 degrees under a camera rolled to match) and scene 5 (a turned sphere that just fits the shot):

```python
import bpy, math
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
mat = bpy.data.materials.new("M")
# Geometry Nodes scatter of spheres rotated 45 degrees, resting on the floor (radius 0.1, centre z 0.1)
bpy.ops.mesh.primitive_plane_add(size=1, location=(2, 0, 0))
sc = bpy.context.object; sc.name = "Pebbles"; sc.data.materials.append(mat)
g = bpy.data.node_groups.new("Pebbles", 'GeometryNodeTree')
g.interface.new_socket("Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
g.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
n = g.nodes; i, o = n.new('NodeGroupInput'), n.new('NodeGroupOutput')
pts = n.new('GeometryNodeMeshToPoints'); ball = n.new('GeometryNodeMeshUVSphere'); ball.inputs['Radius'].default_value = 0.1
iop = n.new('GeometryNodeInstanceOnPoints'); iop.inputs['Rotation'].default_value = (math.radians(45), math.radians(45), 0)
tr = n.new('GeometryNodeTranslateInstances'); tr.inputs['Translation'].default_value = (0, 0, 0.1); tr.inputs['Local Space'].default_value = False
join = n.new('GeometryNodeJoinGeometry')
g.links.new(i.outputs[0], pts.inputs['Mesh']); g.links.new(pts.outputs[0], iop.inputs['Points'])
g.links.new(ball.outputs['Mesh'], iop.inputs['Instance']); g.links.new(iop.outputs[0], tr.inputs[0])
g.links.new(i.outputs[0], join.inputs[0]); g.links.new(tr.outputs[0], join.inputs[0]); g.links.new(join.outputs[0], o.inputs[0])
sc.modifiers.new("GN", 'NODES').node_group = g
# Mesh plus instances, the mesh has no material and a detached part far from the instances
bpy.ops.mesh.primitive_cube_add(size=0.5, location=(-2, 0, 0.25))
mi = bpy.context.object; mi.name = "Unshaded"
bpy.ops.mesh.primitive_cube_add(size=0.2, location=(-2, 0, 1.5)); part = bpy.context.object
bpy.ops.object.select_all(action='DESELECT'); part.select_set(True); mi.select_set(True)
bpy.context.view_layer.objects.active = mi; bpy.ops.object.join()
g2 = bpy.data.node_groups.new("Side", 'GeometryNodeTree')
g2.interface.new_socket("Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
g2.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
n = g2.nodes; i, o = n.new('NodeGroupInput'), n.new('NodeGroupOutput')
pt = n.new('GeometryNodePoints'); pt.inputs['Position'].default_value = (1.0, 0, -0.15)
cu = n.new('GeometryNodeMeshCube'); cu.inputs['Size'].default_value = (0.2, 0.2, 0.2)
iop = n.new('GeometryNodeInstanceOnPoints'); join = n.new('GeometryNodeJoinGeometry')
g2.links.new(pt.outputs[0], iop.inputs['Points']); g2.links.new(cu.outputs['Mesh'], iop.inputs['Instance'])
g2.links.new(i.outputs[0], join.inputs[0]); g2.links.new(iop.outputs[0], join.inputs[0]); g2.links.new(join.outputs[0], o.inputs[0])
mi.modifiers.new("GN", 'NODES').node_group = g2
# Metaball family: basis Blob and member Blob.001
for nm, x in (("Blob", 0.0), ("Blob.001", 0.4)):
    mb = bpy.data.metaballs.new(nm); mb.resolution = 0.05; mb.elements.new().radius = 0.3
    ob = bpy.data.objects.new(nm, mb); ob.location = (x, 2, 0.3); s.collection.objects.link(ob); mb.materials.append(mat)
# Long bar rotated 45 degrees about Z, inside the shot, whose world box corners poke out at the sides
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.1)); bar = bpy.context.object; bar.name = "Bar"
bar.data.materials.append(mat)
bar.scale = (2.6, 0.05, 0.1); bpy.ops.object.transform_apply(scale=True); bar.rotation_euler.z = math.radians(45)
cd = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Camera", cd); s.collection.objects.link(cam)
cam.location = (0, 0, 10); cam.rotation_euler = (0, 0, math.radians(45)); cd.lens = 50; s.camera = cam
s.render.resolution_x, s.render.resolution_y = 1000, 300
# Geometry Nodes object whose material is set in the nodes, slots empty
bpy.ops.mesh.primitive_cube_add(size=0.4, location=(-3.5, 0, 0.2)); gm = bpy.context.object; gm.name = "NodeShaded"
g3 = bpy.data.node_groups.new("Shade", 'GeometryNodeTree')
g3.interface.new_socket("Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
g3.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
n = g3.nodes; i, o = n.new('NodeGroupInput'), n.new('NodeGroupOutput'); sm = n.new('GeometryNodeSetMaterial'); sm.inputs['Material'].default_value = mat
g3.links.new(i.outputs[0], sm.inputs[0]); g3.links.new(sm.outputs[0], o.inputs[0]); gm.modifiers.new("GN", 'NODES').node_group = g3
# Dotted metaball family name, and a plain mesh named like a family base for an empty metaball
for nm, x in (("Foam.Left", 0.0), ("Foam.Left.001", 0.3)):
    mb = bpy.data.metaballs.new(nm); mb.resolution = 0.05; mb.elements.new().radius = 0.3
    ob = bpy.data.objects.new(nm, mb); ob.location = (x, -2, 0.3); s.collection.objects.link(ob); mb.materials.append(mat)
bpy.ops.mesh.primitive_cube_add(size=0.2, location=(3.5, -2, 0.1)); pm = bpy.context.object; pm.name = "Lone"; pm.data.materials.append(mat)
mb = bpy.data.metaballs.new("Lone.001"); ob = bpy.data.objects.new("Lone.001", mb); ob.location = (3.5, -2, 1); s.collection.objects.link(ob)
# Sphere turned 45 degrees that just fits a tight second check: framed alone by a camera in scene 5
bpy.ops.wm.save_as_mainfile(filepath="/home/ubuntu/out/ss/test3.blend")
bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(0, 0, 1), rotation=(math.radians(45), math.radians(45), 0)); bpy.context.object.name = "Orb"
bpy.context.object.data.materials.append(bpy.data.materials.new("M"))
cd = bpy.data.cameras.new("Cam"); cam = bpy.data.objects.new("Camera", cd); s.collection.objects.link(cam)
cam.location = (0, -3.2, 1); cam.rotation_euler = (math.radians(90), 0, 0); cd.lens = 50; s.camera = cam
s.render.resolution_x = s.render.resolution_y = 1000
bpy.ops.wm.save_as_mainfile(filepath="/home/ubuntu/out/ss/test5.blend")
```

Plans: scene 2 `{"objects": {"Ring": [1.1, 1.1, 0.1], "Scatter": [1.2, 1.2, 0.2], "Heavy": [1, 1, 0]}, "grounded": ["Ring", "Scatter", "Heavy"]}`; scene 3 `{"objects": {"CmBox": [1, 1, 1]}, "grounded": ["CmBox"]}`; scene 4 `{"objects": {"Pebbles": [0, 0, 0.2], "Unshaded": [0, 0, 0], "Blob": [0, 0, 0], "Blob.001": [0, 0, 0], "Bar": [0, 0, 0.2], "NodeShaded": [0, 0, 0], "Foam.Left": [0, 0, 0], "Foam.Left.001": [0, 0, 0], "Lone": [0, 0, 0], "Lone.001": [0, 0, 0]}, "grounded": ["Pebbles", "Bar"], "in_frame": ["Bar"]}`; scene 5 `{"objects": {"Orb": [2, 2, 2]}, "in_frame": ["Orb"]}`.

## Results

All 24 runs exited with code 0 and printed one JSON report. Both versions gave the same per-object values.

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
| 4.2.23, scene 4 plan | `fail` | `warn:floating_parts`, `fail:material`, `fail:geometry`, `fail:material` |
| 5.1.2, scene 4 plan | `fail` | `warn:floating_parts`, `fail:material`, `fail:geometry`, `fail:material` |
| 4.2.23, scene 5 plan | `pass` | none |
| 5.1.2, scene 5 plan | `pass` | none |

- Scene 1: each planted problem was found: the floating cube, the inside-out cube, the empty material slot, the loose part on `Lamp`, and the mesh a modifier empties (`Empty_Mesh`, no vertices, no crash). The tilted sphere (lowest vertex 1.2 mm) and the stacked cube `Top` are not reported as floating.
- Scene 1 with the example plan: the plan is for a shoe scene, so its `fail` items are expected. Only 4.2 fails `engine`: its EEVEE id is `BLENDER_EEVEE_NEXT`, the plan uses the 5.x id `BLENDER_EEVEE`.
- Scene 2: the curve is measured from its evaluated mesh and sits on the floor. The scatter has no vertices of its own but passes `geometry` and `size` through its 4 instances; it fails `ground_contact` because its 0.2 m cubes are centred on the floor and sink 0.1 m below it, which is correct. The heavy grid gets `lowest_z_m` (0.3) and fails `ground_contact`.
- Scene 3: the centimetre cube reports 1 m sizes and passes the plan.
- Scene 4: only the planted problems are reported: `Unshaded` has no material on its own mesh although it also makes an instance, its loose part floats away from the instance, and `Lone.001` is an empty metaball whose same-named base `Lone` is a mesh, not a metaball. The rotated spheres sit on the floor (`lowest_z_m` 0.0, measured from their vertices), `NodeShaded` passes `material` through its Geometry Nodes material, the members `Blob.001` and `Foam.Left.001` are not failed for having no surface of their own, and the turned bar is `in` frame.
- Scene 5: the turned sphere is `in` frame because its vertices are projected, not its box.
- Earlier versions of the script, on the same scenes, reported `ground_contact`, `size` and `below_floor` on `Pebbles`, `geometry` on `Blob.001` and `Foam.Left.001`, `material` on `NodeShaded`, `in_frame` on `Bar` and `Orb`, and missed the problems on `Unshaded` and `Lone.001`.
