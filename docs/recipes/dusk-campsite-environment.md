# Recipe walkthrough: dusk campsite environment

Scenario instance of `recipe.stylized-environment-scene` in [`registry/recipe-catalog.json`](../../registry/recipe-catalog.json). It shows a small stylized environment built in three depth layers, with repeated trees placed as linked copies of one mesh.

> [!NOTE]
> The code blocks are the steps an agent runs **inside the runtime** (Path 1 or Path 2 `execute_blender_code`, or one CLI fallback process each). They are never the answer to the user. `/abs/path/` stands for an absolute folder the user agreed to. Every block here runs in real Blender 4.2 and 5.1 in CI: see [the walkthrough evidence](../evals/cli-fallback-recipe-walkthroughs.md).

## User prompt

"I want a cozy low-poly campsite at dusk: a tent, a campfire, pine trees around it. Just a nice picture for my blog header."

## Brief (from `blendops-brief`)

| Slot | Value |
|---|---|
| Subject | Orange tent (focal point), campfire with a glow, eight pine trees, one rock |
| Style | Low-poly, flat colors, warm fire against a cool blue sky |
| Depth | Foreground: campfire and rock. Midground: tent. Background: trees |
| Output | One 1280 × 720 still picture; no GLB (so fog or volume effects would be allowed) |
| Out of scope | Characters, animation, downloaded assets |

No outside assets: everything is built from simple shapes, so there is nothing to license (`blendops-assets`).

## Plan (locked, read by scene-state)

```json
{
  "objects": {"Tent": [0.99, 0.99, 1.0], "Campfire_Logs": [0.5, 0.47, 0.08], "Tree_01": [0.9, 0.9, 1.5]},
  "grounded": ["Tent", "Campfire_Logs", "Rock", "Tree_01", "Tree_02", "Tree_03", "Tree_04", "Tree_05", "Tree_06", "Tree_07", "Tree_08"],
  "floor_z": 0.0,
  "lights": ["Sun_Dusk", "Campfire_Light"],
  "in_frame": ["Tent", "Campfire_Logs", "Rock"],
  "approved_extra": ["Ground", "Campfire_Flame", "Rock", "Tree_02", "Tree_03", "Tree_04", "Tree_05", "Tree_06", "Tree_07", "Tree_08"],
  "output": {"engine": "CYCLES", "resolution": [1280, 720, 40]}
}
```

## Steps

Ask the user before step 1: "I will build the campsite in a new Blender file at `/abs/path/campsite.blend` and save pictures there. OK?"

**1. Units, file and ground.** Metric; a flat 5 m disc is the ground at height 0.

```python
import bpy, bmesh, json
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 1.0
mesh = bpy.data.meshes.new("Ground")
bm = bmesh.new()
bmesh.ops.create_circle(bm, cap_ends=True, radius=2.5, segments=24)
bm.to_mesh(mesh); bm.free()
scene.collection.objects.link(bpy.data.objects.new("Ground", mesh))
bpy.ops.wm.save_as_mainfile(filepath="/abs/path/campsite.blend")
print(json.dumps({"step": "ground", "file": bpy.data.filepath}))
```

**2. Midground: the tent.** A four-sided cone turned 45° so its sides face the axes; the focal point sits slightly behind the centre.

```python
import bpy, bmesh, json
from math import radians
from mathutils import Matrix

bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.7, radius2=0.0, depth=1.0,
                      matrix=Matrix.Translation((0, 0, 0.5)) @ Matrix.Rotation(radians(45), 4, 'Z'))
mesh = bpy.data.meshes.new("Tent")
bm.to_mesh(mesh); bm.free()
tent = bpy.data.objects.new("Tent", mesh)
tent.location = (0.0, 0.4, 0.0)
bpy.context.scene.collection.objects.link(tent)
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "tent", "dimensions_m": [round(v, 3) for v in tent.dimensions]}))
```

**3. Foreground: campfire and rock.**

```python
import bpy, bmesh, json
from math import radians
from mathutils import Matrix

def link(name, bm, location):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    bpy.context.scene.collection.objects.link(obj)
    return obj

bm = bmesh.new()
for angle in (0, 60, 120):  # three crossed logs lying on the ground
    bmesh.ops.create_cube(bm, size=1.0, matrix=Matrix.Rotation(radians(angle), 4, 'Z')
                          @ Matrix.Translation((0, 0, 0.04)) @ Matrix.Diagonal((0.5, 0.08, 0.08, 1)))
link("Campfire_Logs", bm, (0.6, -0.9, 0.0))
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.12, radius2=0.0, depth=0.3,
                      matrix=Matrix.Translation((0, 0, 0.2)))
link("Campfire_Flame", bm, (0.6, -0.9, 0.0))
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=1, radius=0.25, matrix=Matrix.Diagonal((1.0, 0.8, 0.6, 1)))
link("Rock", bm, (-0.8, -1.5, 0.15))
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "foreground", "objects": ["Campfire_Logs", "Campfire_Flame", "Rock"]}))
```

**4. Background: scattered trees.** One pine mesh, then eight objects that all use it (linked copies, so the file stores one tree). A seeded scatter keeps the same layout on every run: behind the tent and clear of it, inside the ground, at least 0.7 m apart.

```python
import bpy, bmesh, json, random
from math import radians, hypot
from mathutils import Matrix

bm = bmesh.new()
trunk = bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.06, radius2=0.06, depth=0.35,
                              matrix=Matrix.Translation((0, 0, 0.175)))
bmesh.ops.create_cone(bm, cap_ends=True, segments=7, radius1=0.45, radius2=0.0, depth=1.2,
                      matrix=Matrix.Translation((0, 0, 0.9)))
trunk_faces = {f for v in trunk["verts"] for f in v.link_faces}
for f in bm.faces:
    f.material_index = 1 if f in trunk_faces else 0
pine = bpy.data.meshes.new("Tree_Pine")
bm.to_mesh(pine); bm.free()

rng, spots = random.Random(7), []
for _ in range(5000):  # bounded, so a too-tight layout fails loudly instead of looping
    x, y = rng.uniform(-2.3, 2.3), rng.uniform(1.0, 2.3)
    if hypot(x, y) < 2.3 and hypot(x, y - 0.4) > 1.1 and all(hypot(x - a, y - b) >= 0.7 for a, b in spots):
        spots.append((x, y))
    if len(spots) == 8:
        break
assert len(spots) == 8, f"only {len(spots)} trees fit; loosen the spacing"
for i, (x, y) in enumerate(spots, 1):
    tree = bpy.data.objects.new(f"Tree_{i:02d}", pine)
    tree.location = (x, y, 0.0)
    tree.rotation_euler.z = radians(rng.uniform(0, 360))
    bpy.context.scene.collection.objects.link(tree)
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "trees", "count": len(spots), "shared_mesh": pine.name, "users": pine.users}))
```

**5. Materials.** Flat colors; the flame glows through the Blender 4.0+ socket names `Emission Color` and `Emission Strength` ([API version rules](../../skills/blendops-build/references/api-version-rules.md)).

```python
import bpy, json

def material(name, color, roughness=0.9, glow=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    if glow:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = glow
    return mat

assign = {
    "Ground": [material("Grass", (0.10, 0.22, 0.06))],
    "Tent": [material("Tent_Orange", (0.80, 0.25, 0.04), 0.7)],
    "Campfire_Logs": [material("Wood", (0.18, 0.08, 0.03))],
    "Campfire_Flame": [material("Flame", (1.0, 0.35, 0.05), 0.5, 8.0)],
    "Rock": [material("Rock", (0.25, 0.25, 0.27))],
    "Tree_01": [material("Pine_Needles", (0.03, 0.12, 0.06)), bpy.data.materials["Wood"]],
}
for name, mats in assign.items():
    data = bpy.data.objects[name].data  # Tree_01's mesh is shared, so all trees get it
    data.materials.clear()
    for mat in mats:
        data.materials.append(mat)
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "materials", "materials": sorted(m.name for m in bpy.data.materials)}))
```

**6. Dusk light.** A low warm sun, a cool dark-blue sky, and an orange point light inside the fire.

```python
import bpy, json
from math import radians

scene = bpy.context.scene
sun = bpy.data.objects.new("Sun_Dusk", bpy.data.lights.new("Sun_Dusk", 'SUN'))
sun.data.energy, sun.data.color, sun.data.angle = 2.0, (1.0, 0.55, 0.3), radians(3)
sun.rotation_euler = (radians(78), 0, radians(-130))  # 12 degrees above the horizon
fire = bpy.data.objects.new("Campfire_Light", bpy.data.lights.new("Campfire_Light", 'POINT'))
fire.data.energy, fire.data.color, fire.data.shadow_soft_size = 60.0, (1.0, 0.45, 0.15), 0.1
fire.location = (0.6, -0.9, 0.3)
for obj in (sun, fire):
    scene.collection.objects.link(obj)
world = scene.world or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.03, 0.05, 0.12, 1)
bg.inputs["Strength"].default_value = 0.6
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "lights", "lights": ["Sun_Dusk", "Campfire_Light"]}))
```

**7. Camera.** 28 mm wide view at eye height, from the front, looking slightly down at the tent.

```python
import bpy, json
from mathutils import Vector

scene = bpy.context.scene
cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
scene.collection.objects.link(cam)
cam.data.lens = 28
scene.render.resolution_x, scene.render.resolution_y = 1280, 720
cam.location = (0.4, -4.6, 1.3)
cam.rotation_euler = (Vector((0.0, 0.3, 0.6)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "camera", "location_m": list(cam.location)}))
```

**8. Preview.**

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

**9. Numbers first.** Run [scene-state](../../skills/blendops-look-check/references/scene-state.md) with the plan above. Expected verdict: `pass`: every tree and the tent stand on the ground, the tent, fire and rock are in frame, both lights exist, nothing unplanned is visible. It also reports `instances`, so the agent can confirm the trees share one mesh.

**10. Depth layers.** The recipe gate `vc.three-plane-depth`: measured along the camera's view, the foreground must be nearer than the tent, and the tent nearer than every tree. Read-only; it does not save.

```python
import bpy, json
from mathutils import Vector

scene = bpy.context.scene
cam = scene.camera
forward = cam.matrix_world.to_quaternion() @ Vector((0, 0, -1))
depth = lambda name: round((bpy.data.objects[name].matrix_world.translation - cam.location).dot(forward), 3)
layers = {
    "foreground": [depth(n) for n in ("Campfire_Logs", "Rock")],
    "midground": [depth("Tent")],
    "background": [depth(o.name) for o in scene.objects if o.name.startswith("Tree_")],
}
ok = max(layers["foreground"]) < min(layers["midground"]) and max(layers["midground"]) < min(layers["background"])
print(json.dumps({"step": "depth-layers", "layers_m": layers, "pass": ok}))
```

**11. Three views and review.** Capture the camera view plus front and side as in [capture views](../../skills/blendops-look-check/references/capture-views.md) (the same block as the [crate walkthrough](./sci-fi-crate-prop.md), aimed at `(0, 0.3, 0.6)` from 6 m), then judge against the brief: the tent has the strongest contrast, the fire glows, trees read as one family but not as a wall. One fix per round through `blendops-build`, at most three rounds.

```python
import bpy, json
from mathutils import Vector

scene, r = bpy.context.scene, bpy.context.scene.render
saved = (r.resolution_x, r.resolution_y, r.resolution_percentage, r.filepath, scene.cycles.samples)
r.resolution_x, r.resolution_y, r.resolution_percentage, scene.cycles.samples = 512, 288, 100, 8
main = scene.camera
target = Vector((0, 0.3, 0.6))
views, temp = {"camera": main}, []
for name, direction in (("front", (0, -1, 0.35)), ("side", (1, 0, 0.35))):
    cam = bpy.data.objects.new(f"Look_{name}", bpy.data.cameras.new(f"Look_{name}"))
    scene.collection.objects.link(cam)
    cam.location = target + Vector(direction).normalized() * 6.0
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

## Final output and final check

**12. Final picture.** Only after look-check passes: full 1280 × 720 with more samples. This step does not change the saved file.

```python
import bpy, json, os
scene = bpy.context.scene
scene.render.resolution_percentage = 100
scene.cycles.samples = 64
scene.render.filepath = "/abs/path/campsite.png"
bpy.ops.render.render(write_still=True)
print(json.dumps({"step": "final-render", "file": scene.render.filepath, "bytes": os.path.getsize(scene.render.filepath)}))
```

`blendops-final-check` then marks `campsite.png` `Produced` once it is on disk and `Verified` only after its picture and size checks pass. Had the user also asked for a GLB, fog or volume light would have to be flagged as Blender-only (`vc.volumetric-export-honesty`): GLB files cannot carry it.

## Reply to the user (no Blender terms)

```txt
Your campsite picture is ready: campsite.png, 1280 x 720.
In it: an orange tent in the middle, a glowing campfire and a rock up front, eight pine trees behind, dusk-blue sky.
Checked: everything stands on the ground and the main pieces are fully in the picture.
Not done: no people or animals (out of scope).
Next: tell me what to change (more trees, darker sky, a different tent color) and I will redo the picture.
```
