# Numeric checks

Run these before looking at any image. Vision models misjudge rotation, shape and size often (EditJudge-Bench measured 52–69% agreement with people), so a number that fails wins over an image that "looks fine".

The script only reads the scene. It never changes or saves it.

| Check | Pass when |
|---|---|
| Planned objects exist | every object name in the plan is in `bpy.data.objects` |
| No extra objects | every visible mesh is in the plan or in `approved_extra` (meshes the user said yes to) |
| Real size | each object's `dimensions` is within 10% of the planned size (metres) |
| Scale applied | `scale` is `(1, 1, 1)`, never negative |
| On the ground | lowest world-space vertex of a grounded object is within 1 mm of the floor height |
| In frame | every corner of each object in `in_frame` is inside the camera view (x and y in 0–1, depth > 0); backdrops and approved crops are left out |
| Has material | every mesh has at least one material slot with a material |
| Camera and lights | `scene.camera` is set; the planned lights exist and have energy > 0 |
| Output settings | engine, resolution and resolution percentage match the plan |

```python
import bpy, json
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

plan = {  # from the locked scene plan
    "objects": {"Shoe_Sole": [0.29, 0.11, 0.03], "Shoe_Upper": [0.28, 0.10, 0.09]},
    "grounded": ["Shoe_Sole"], "floor_z": 0.0, "size_tolerance": 0.10,
    "lights": ["Key", "Fill", "Rim"],
    "in_frame": ["Shoe_Sole", "Shoe_Upper"],  # objects that must be fully in shot
    "approved_extra": ["Backdrop"],           # extra meshes the user approved
    "output": {"engine": "BLENDER_EEVEE", "resolution": [1920, 1080, 100]},
}
scene = bpy.context.scene
cam = scene.camera
depsgraph = bpy.context.evaluated_depsgraph_get()
issues = []

for name, size in plan["objects"].items():
    obj = bpy.data.objects.get(name)
    if obj is None:
        issues.append({"check": "exists", "object": name})
        continue
    for axis, (got, want) in enumerate(zip(obj.dimensions, size)):
        if want and abs(got - want) / want > plan["size_tolerance"]:
            issues.append({"check": "size", "object": name, "axis": "xyz"[axis], "got_m": round(got, 3), "want_m": want})
    if any(abs(s - 1) > 1e-4 for s in obj.scale):
        issues.append({"check": "scale_applied", "object": name, "scale": [round(s, 4) for s in obj.scale]})
    ev = obj.evaluated_get(depsgraph)
    corners = [ev.matrix_world @ Vector(c) for c in ev.bound_box]
    if name in plan["grounded"]:
        low = min(c.z for c in corners)
        if ev.type == 'MESH':
            mesh = ev.to_mesh()
            try:
                zs = [(ev.matrix_world @ v.co).z for v in mesh.vertices]
            finally:
                ev.to_mesh_clear()
            if not zs:
                issues.append({"check": "geometry", "object": name})
                continue
            low = min(zs)
        if abs(low - plan["floor_z"]) > 0.001:
            issues.append({"check": "ground_contact", "object": name, "gap_m": round(low - plan["floor_z"], 4)})
    if cam and name in plan["in_frame"]:
        for c in corners:
            p = world_to_camera_view(scene, cam, c)
            if not (0 <= p.x <= 1 and 0 <= p.y <= 1 and p.z > 0):
                issues.append({"check": "in_frame", "object": name})
                break
    if obj.type == 'MESH' and not any(s.material for s in obj.material_slots):
        issues.append({"check": "material", "object": name})

extra = [o.name for o in scene.objects if o.type == 'MESH' and o.visible_get() and o.name not in plan["objects"] and o.name not in plan["approved_extra"]]
if extra:
    issues.append({"check": "extra_objects", "objects": extra})
if cam is None:
    issues.append({"check": "camera"})
for name in plan["lights"]:
    light = bpy.data.objects.get(name)
    if light is None or light.type != 'LIGHT' or light.data.energy <= 0:
        issues.append({"check": "light", "object": name})

want = plan["output"]
got_res = [scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage]
if scene.render.engine != want["engine"]:
    issues.append({"check": "engine", "got": scene.render.engine, "want": want["engine"]})
if got_res != want["resolution"]:
    issues.append({"check": "resolution", "got": got_res, "want": want["resolution"]})

print(json.dumps({
    "step": "numeric-check",
    "blender_version": list(bpy.app.version),
    "engine": scene.render.engine,
    "resolution": got_res,
    "issues": issues,
    "verdict": "pass" if not issues else "fail",
}))
```

- Get the planned names and sizes from the locked scene plan, never from what is in the scene.
- Leave out `grounded` for objects that float on purpose (a hanging lamp).
- Leave backdrops, floors and objects the brief crops on purpose (a macro shot) out of `in_frame`.
- A preview may use another engine or a lower `resolution_percentage` than the final (the CLI preview in `blendops-build` uses Cycles at 50%); put the preview settings in `output`, and `blendops-final-check` checks the final settings.
- On Path 1, `get_objects_summary` and `get_object_detail_summary` give the same facts without code; on Path 2, `get_scene_info` and `get_object_info`.
