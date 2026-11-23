# Recipe walkthrough: sci-fi crate prop

Scenario instance of `recipe.hard-surface-prop` in [`registry/recipe-catalog.json`](../../registry/recipe-catalog.json). It shows one full run of the build, look-check and final-check skills on a small hard-surface prop.

> [!NOTE]
> The code blocks are the steps an agent runs **inside the runtime** (Path 1 or Path 2 `execute_blender_code`, or one CLI fallback process each). They are never the answer to the user; the user gets the plain-language reply at the end. `/abs/path/` stands for an absolute folder the user agreed to. Every block here runs in real Blender 4.2 and 5.1 in CI: see [the walkthrough evidence](../evals/cli-fallback-recipe-walkthroughs.md).

## User prompt

"Make a sci-fi supply crate for my game, about 80 cm long, painted metal with steel bands, and give me a GLB."

## Brief (from `blendops-brief`)

| Slot | Value |
|---|---|
| Subject | One crate, 0.80 × 0.50 × 0.50 m, handle slots on both ends, two steel bands |
| Style | Clean hard surface, soft bevels, olive paint, brushed steel |
| Output | Preview pictures, one GLB with only the crate and bands |
| Budget | Mid-mobile tier: under 50,000 triangles (`blendops-glb-budget`) |
| Out of scope | Textures, decals, rigging |

## Plan (locked, read by scene-state)

```json
{
  "objects": {"Crate_Body": [0.8, 0.5, 0.5], "Crate_Bands": [0.52, 0.52, 0.51]},
  "grounded": ["Crate_Body"],
  "floor_z": 0.0,
  "lights": ["Key", "Fill", "Rim"],
  "in_frame": ["Crate_Body", "Crate_Bands"],
  "approved_extra": ["Floor"],
  "output": {"engine": "CYCLES", "resolution": [1280, 720, 40]}
}
```

## Steps

Ask the user before step 1: "I will build the crate in a new Blender file at `/abs/path/crate.blend` and write preview pictures and `crate.glb` there. OK?"

**1. Units and file.** Metric, 1 unit = 1 m; save the new file so later steps and the CLI fallback can reopen it.

```python
import bpy, json
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0
bpy.ops.wm.save_as_mainfile(filepath="/abs/path/crate.blend")
print(json.dumps({"step": "units", "file": bpy.data.filepath}))
```

**2. Block out the body and floor.** Build with `bmesh` at real size, so scale stays 1 and no operator context is needed.

```python
import bpy, bmesh, json
from mathutils import Matrix

def box_mesh(name, parts):
    bm = bmesh.new()
    for size, centre in parts:
        bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation(centre) @ Matrix.Diagonal((*size, 1)))
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj

body = box_mesh("Crate_Body", [((0.8, 0.5, 0.5), (0, 0, 0.25))])
floor_mesh = bpy.data.meshes.new("Floor")
bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=2.0)
bm.to_mesh(floor_mesh); bm.free()
bpy.context.scene.collection.objects.link(bpy.data.objects.new("Floor", floor_mesh))
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "block-out", "object": body.name, "dimensions_m": [round(v, 3) for v in body.dimensions]}))
```

**3. Handle slots and bevels.** Boolean first, then bevel, then weighted normal ([modeling](../../skills/blendops-build/references/modeling.md)). The cutter stays as a hidden object, so the slots can still be moved.

```python
import bpy, bmesh, json
from mathutils import Matrix

bm = bmesh.new()
for x in (-0.4, 0.4):  # one slot in each end
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x, 0, 0.38)) @ Matrix.Diagonal((0.12, 0.2, 0.06, 1)))
mesh = bpy.data.meshes.new("Crate_Handle_Cutter")
bm.to_mesh(mesh); bm.free()
cutter = bpy.data.objects.new("Crate_Handle_Cutter", mesh)
bpy.context.scene.collection.objects.link(cutter)
cutter.display_type = 'WIRE'
cutter.hide_render = True
cutter.hide_set(True)

body = bpy.data.objects["Crate_Body"]
cut = body.modifiers.new("Handles", 'BOOLEAN')
cut.operation, cut.solver, cut.object = 'DIFFERENCE', 'EXACT', cutter
bev = body.modifiers.new("Bevel", 'BEVEL')
bev.width, bev.segments, bev.limit_method = 0.012, 3, 'ANGLE'
bev.use_clamp_overlap = True
body.modifiers.new("WeightedNormal", 'WEIGHTED_NORMAL').keep_sharp = True
body.data.polygons.foreach_set("use_smooth", [True] * len(body.data.polygons))
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "modifiers", "object": body.name, "stack": [m.type for m in body.modifiers]}))
```

**4. Steel bands.** One mesh with two loose parts, 1 cm proud of the body on the sides and top so they wrap it; the bottom stays on the floor.

```python
import bpy, bmesh, json
from mathutils import Matrix

bm = bmesh.new()
for x in (-0.22, 0.22):
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Translation((x, 0, 0.255)) @ Matrix.Diagonal((0.08, 0.52, 0.51, 1)))
mesh = bpy.data.meshes.new("Crate_Bands")
bm.to_mesh(mesh); bm.free()
bands = bpy.data.objects.new("Crate_Bands", mesh)
bpy.context.scene.collection.objects.link(bands)
bands.modifiers.new("Bevel", 'BEVEL').width = 0.004
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "bands", "object": bands.name, "dimensions_m": [round(v, 3) for v in bands.dimensions]}))
```

**5. Materials.** Plain Principled BSDF values only, so the GLB keeps them ([materials](../../skills/blendops-build/references/materials.md)).

```python
import bpy, json

def material(name, color, metallic, roughness):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return mat

for obj_name, mat in (("Crate_Body", material("Paint_Olive", (0.08, 0.10, 0.04), 0.0, 0.45)),
                      ("Crate_Bands", material("Steel_Brushed", (0.56, 0.57, 0.58), 1.0, 0.35)),
                      ("Floor", material("Floor_Grey", (0.18, 0.18, 0.18), 0.0, 0.8))):
    obj = bpy.data.objects[obj_name]
    obj.data.materials.clear()
    obj.data.materials.append(mat)
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "materials", "assigned": {o.name: o.active_material.name for o in bpy.data.objects if o.active_material}}))
```

**6. Lights.** Three-point studio light, scaled for a 0.8 m subject ([lighting and camera](../../skills/blendops-build/references/lighting-camera.md)). Brushed steel needs something to reflect, so the world gets a soft grey.

```python
import bpy, json
from math import radians

def area(name, loc, rot, power, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.size = power, size
    obj = bpy.data.objects.new(name, data)
    obj.location, obj.rotation_euler = loc, [radians(a) for a in rot]
    bpy.context.scene.collection.objects.link(obj)

area("Key", (2.0, -2.0, 2.4), (50, 0, 45), 300, 1.2)
area("Fill", (-2.4, -1.4, 1.4), (70, 0, -60), 90, 1.8)
area("Rim", (0.0, 2.4, 2.0), (-55, 0, 180), 250, 0.8)
world = bpy.context.scene.world or bpy.data.worlds.new("World")
bpy.context.scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.05, 0.05, 0.05, 1)
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "lights", "lights": sorted(o.name for o in bpy.data.objects if o.type == 'LIGHT')}))
```

**7. Camera.** 50 mm, three-quarter view from slightly above, aimed at the crate centre. The distance fits the box diagonal into the narrower side of the 16:9 frame (the height) with 15% margin.

```python
import bpy, json
from math import tan
from mathutils import Vector

scene = bpy.context.scene
cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
scene.collection.objects.link(cam)
cam.data.lens = 50
scene.render.resolution_x, scene.render.resolution_y = 1280, 720
target = Vector((0, 0, 0.25))
s = bpy.data.objects["Crate_Body"].dimensions.length  # box diagonal, so every side fits
half_w = tan(cam.data.angle / 2)  # 50 mm lens on the 36 mm sensor width
half_h = half_w * scene.render.resolution_y / scene.render.resolution_x
d = 1.15 * (s / 2) / min(half_w, half_h)
cam.location = target + Vector((1, -1.3, 0.8)).normalized() * d
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "camera", "distance_m": round(d, 3), "location_m": [round(v, 3) for v in cam.location]}))
```

**8. Preview.** Small, fast Cycles render; then hand over to `blendops-look-check`.

```python
import bpy, json, os
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 16
scene.render.resolution_percentage = 40
scene.render.filepath = "/abs/path/preview.png"
bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "preview", "file": scene.render.filepath, "bytes": os.path.getsize(scene.render.filepath)}))
```

## Look check (from `blendops-look-check`)

**9. Numbers first.** Run [scene-state](../../skills/blendops-look-check/references/scene-state.md) with the plan above as `PLAN`. Round 1 reports one `fail`: `size` on `Crate_Bands` (x is 0.52 m, the plan says 0.82 m). The bands themselves are right; the plan number was a typing mistake. That is a plan change, so the agent asks the user, and after their yes the locked plan reads `"Crate_Bands": [0.52, 0.52, 0.52]`. Round 2 of scene-state then reports `pass`: both objects in frame, the body on the floor, three lights, no extra meshes.

**10. Three views.** Camera view plus front and side, small and fast, from temporary cameras that are removed again. This step does not save the file.

```python
import bpy, json
from mathutils import Vector

scene, r = bpy.context.scene, bpy.context.scene.render
saved = (r.resolution_x, r.resolution_y, r.resolution_percentage, r.filepath, scene.cycles.samples)
r.resolution_x, r.resolution_y, r.resolution_percentage, scene.cycles.samples = 512, 288, 100, 8
main = scene.camera
target = Vector((0, 0, 0.25))
views, temp = {"camera": main}, []
for name, direction in (("front", (0, -1, 0.25)), ("side", (1, 0, 0.25))):
    cam = bpy.data.objects.new(f"Look_{name}", bpy.data.cameras.new(f"Look_{name}"))
    scene.collection.objects.link(cam)
    cam.location = target + Vector(direction).normalized() * 2.6
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
    views[name] = cam
    temp.append(cam)
files = {}
for name, cam in views.items():
    scene.camera = cam
    r.filepath = f"/abs/path/look-r1-{name}.png"
    bpy.ops.render.render(write_still=True)
    files[name] = r.filepath
scene.camera = main
for cam in temp:
    data = cam.data
    bpy.data.objects.remove(cam)
    bpy.data.cameras.remove(data)
r.resolution_x, r.resolution_y, r.resolution_percentage, r.filepath, scene.cycles.samples = saved
print(json.dumps({"step": "look-r1-capture", "files": files}))
```

**11. Visual review.** Judge the three pictures against the brief ([visual review](../../skills/blendops-look-check/references/visual-review.md)): slots visible on both ends, bands wrap the body with no gap, steel reads lighter than paint, no black faces. Fix at most one issue per round through `blendops-build`.

## Final output and final check

**12. GLB export.** Only the planned objects; the floor, cutter, lights and camera stay out.

```python
import bpy, json, os
planned = ["Crate_Body", "Crate_Bands"]
for obj in bpy.context.scene.objects:
    obj.select_set(obj.name in planned)
bpy.ops.export_scene.gltf(filepath="/abs/path/crate.glb", export_format='GLB', use_selection=True, export_apply=True)
print(json.dumps({"step": "export", "file": "/abs/path/crate.glb", "bytes": os.path.getsize("/abs/path/crate.glb")}))
```

**13. Check the file.** Outside Blender, inspect the GLB and compare triangles with the budget:

```bash
npx blendops glb-inspect /abs/path/crate.glb
```

Expect a valid container with 2 meshes, 2 materials, and about 660 triangles (the inspector estimate): far under the 50,000 mid-mobile ceiling. Then `blendops-final-check` labels each file: previews and GLB `Produced` once found on disk, `Verified` only after its checks pass.

## Reply to the user (no Blender terms)

```txt
Your crate is built: 80 cm long, olive paint, two steel bands, handle slots on both ends.
Ready: 3 preview pictures (camera, front, side) and crate.glb (about 660 triangles; fine for phones).
Not done: no textures or decals (out of scope).
Next: drop crate.glb into your game engine; ask me for a lighter or textured version.
```
