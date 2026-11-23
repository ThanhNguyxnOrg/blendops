# Scene state

One read-only script that prints the scene as JSON: every object with its size, position, frame status and mesh facts, plus warnings for common problems. `blendops-build`, `blendops-look-check` and `blendops-final-check` all read this same report, so a number means the same thing at every step.

It never changes or saves the scene. On the CLI fallback run it with `blender --background scene.blend --python-exit-code 1 --python scene_state.py`.

## What it reports

| Field | Meaning |
|---|---|
| `dimensions_m`, `bbox_min_m`, `bbox_max_m` | Size and world-space box, in metres |
| `in_frame` | `in`, `partial` or `outside` the active camera view (`outside` can still mean a backdrop that surrounds the view) |
| `lowest_z_m` | Lowest world-space vertex, after modifiers |
| `resting` | `floor`, `on_object` (its box touches another mesh), `floating` or `below_floor` |
| `parts`, `floating_parts` | Loose parts in the mesh, and how many touch nothing |
| `open_edges`, `normals_inward` | Holes in the mesh; on a closed mesh, whether the faces point inward |
| `materials` | Material per slot; `null` is an empty slot |

Without a plan, the `issues` are only `warn` items: `floating`, `below_floor`, `floating_parts`, `normals_inward`, `empty_material_slot`, `negative_scale`. They are hints; an object can float on purpose.

## Plan checks

Set `PLAN` from the locked scene plan to add `fail` checks: `exists`, `size`, `scale_applied`, `geometry`, `ground_contact`, `in_frame`, `material`, `extra_objects`, `camera`, `light`, `engine`, `resolution`.

```python
PLAN = {
    "objects": {"Shoe_Sole": [0.29, 0.11, 0.03], "Shoe_Upper": [0.28, 0.10, 0.09]},  # name -> size in m
    "grounded": ["Shoe_Sole"], "floor_z": 0.0, "size_tolerance": 0.10,
    "lights": ["Key", "Fill", "Rim"],
    "in_frame": ["Shoe_Sole", "Shoe_Upper"],  # objects that must be fully in shot
    "approved_extra": ["Backdrop"],           # extra meshes the user approved
    "output": {"engine": "BLENDER_EEVEE", "resolution": [1920, 1080, 100]},
}
```

- Take names and sizes from the plan, never from what is in the scene.
- Leave out of `grounded` the objects that float on purpose (a hanging lamp).
- Leave backdrops, floors and objects the brief crops on purpose (a macro shot) out of `in_frame`.
- Put the settings of the render you are checking in `output`: a preview may use another engine or a lower percentage than the final.

## Script

```python
import bpy, json, math
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

PLAN = None  # set to the plan dict to add plan checks; see "Plan checks"

TOL = 0.001          # 1 mm, for planned ground contact
GAP = 0.01           # 1 cm, before a part counts as floating
MAX_VERTS = 200000   # skip part and normal checks on heavier meshes
GEOMETRY = {'MESH', 'CURVE', 'SURFACE', 'FONT', 'META'}
plan = PLAN or {}
floor_z = plan.get("floor_z", 0.0)
scene = bpy.context.scene
U = scene.unit_settings.scale_length  # metres per Blender unit
cam = scene.camera
depsgraph = bpy.context.evaluated_depsgraph_get()
issues = []
instances = {}  # object name -> [count, box min, box max], Blender units
for inst in depsgraph.object_instances:
    # a curve or text object lists its own mesh as an instance; that one is not extra
    if inst.is_instance and inst.parent and (inst.parent.type == 'MESH' or inst.object.original != inst.parent.original):
        pts = [inst.matrix_world @ Vector(c) for c in inst.object.bound_box]
        lo = Vector(min(c[k] for c in pts) for k in range(3))
        hi = Vector(max(c[k] for c in pts) for k in range(3))
        rec = instances.setdefault(inst.parent.original.name, [0, lo, hi])
        rec[0] += 1
        for k in range(3):
            rec[1][k], rec[2][k] = min(rec[1][k], lo[k]), max(rec[2][k], hi[k])


def rnd(v, n=4):
    return [round(x, n) for x in v]


def issue(level, check, **kw):
    issues.append({"level": level, "check": check, **kw})


def frame_status(corners):
    if cam is None:
        return None
    inside = 0
    for c in corners:
        p = world_to_camera_view(scene, cam, c)
        inside += 0 <= p.x <= 1 and 0 <= p.y <= 1 and p.z > 0
    return "in" if inside == len(corners) else "partial" if inside else "outside"


def mesh_facts(ev):
    mesh = ev.to_mesh()
    try:
        mw = ev.matrix_world
        f = {"vertices": len(mesh.vertices), "faces": len(mesh.polygons)}
        if not mesh.vertices:
            return f, []
        world = [(mw @ v.co) * U for v in mesh.vertices]
        f["box"] = (Vector(min(p[k] for p in world) for k in range(3)), Vector(max(p[k] for p in world) for k in range(3)))
        f["lowest_z_m"] = round(f["box"][0].z, 4)
        if len(mesh.vertices) > MAX_VERTS:
            return f, [f["box"]]
        root = list(range(len(world)))

        def find(i):
            while root[i] != i:
                root[i] = root[root[i]]
                i = root[i]
            return i

        for e in mesh.edges:
            a, b = find(e.vertices[0]), find(e.vertices[1])
            if a != b:
                root[a] = b
        boxes = {}
        for i, p in enumerate(world):
            lo, hi = boxes.setdefault(find(i), (p.copy(), p.copy()))
            for k in range(3):
                lo[k], hi[k] = min(lo[k], p[k]), max(hi[k], p[k])
        f["parts"] = len(boxes)
        edge_faces = {}
        for poly in mesh.polygons:
            for key in poly.edge_keys:
                edge_faces[key] = edge_faces.get(key, 0) + 1
        f["open_edges"] = sum(1 for n in edge_faces.values() if n == 1)
        if mesh.polygons and f["open_edges"] == 0:
            mesh.calc_loop_triangles()
            vol = 0.0
            for t in mesh.loop_triangles:
                a, b, c = (mesh.vertices[i].co for i in t.vertices)
                vol += a.dot(b.cross(c)) / 6
            f["normals_inward"] = vol < 0
        return f, list(boxes.values())
    finally:
        ev.to_mesh_clear()


def touches(a, b):
    return all(a[0][k] - GAP <= b[1][k] and b[0][k] - GAP <= a[1][k] for k in range(3))


objects, parts = [], []
for obj in scene.objects:
    ev = obj.evaluated_get(depsgraph)
    corners = [ev.matrix_world @ Vector(c) for c in ev.bound_box]
    inst = instances.get(obj.name)
    rec = {
        "name": obj.name,
        "type": obj.type,
        "visible": obj.visible_get(),
        "location_m": rnd(obj.location * U),
        "rotation_deg": rnd((math.degrees(a) for a in obj.rotation_euler), 2),
        "scale": rnd(obj.scale),
        "dimensions_m": rnd(obj.dimensions * U),
        "bbox_min_m": rnd(Vector(min(c[k] for c in corners) for k in range(3)) * U),
        "bbox_max_m": rnd(Vector(max(c[k] for c in corners) for k in range(3)) * U),
        "in_frame": frame_status(corners),
    }
    if obj.type in GEOMETRY:
        facts, boxes = mesh_facts(ev)
        box = facts.pop("box", None)
        rec.update(facts)
        if inst:
            rec["instances"] = inst[0]
            lo, hi = inst[1] * U, inst[2] * U
            if box:
                lo = Vector(min(a, b) for a, b in zip(lo, box[0]))
                hi = Vector(max(a, b) for a, b in zip(hi, box[1]))
            box = (lo, hi)
            boxes = boxes + [box]
            rec["lowest_z_m"] = round(lo.z, 4)
        if box:
            rec["bbox_min_m"], rec["bbox_max_m"] = rnd(box[0]), rnd(box[1])
            rec["in_frame"] = frame_status([Vector((x, y, z)) / U for x in (box[0].x, box[1].x) for y in (box[0].y, box[1].y) for z in (box[0].z, box[1].z)])
        rec["modifiers"] = [m.type for m in obj.modifiers]
        rec["materials"] = [s.material.name if s.material else None for s in obj.material_slots]
        if rec["visible"]:
            parts += [(obj.name, b) for b in boxes]
    elif obj.type == 'LIGHT':
        rec["light"] = {"type": obj.data.type, "energy": obj.data.energy}
    elif obj.type == 'CAMERA':
        rec["camera"] = {"lens_mm": round(obj.data.lens, 2), "active": obj == cam}
    objects.append(rec)

for rec in objects:
    if rec["type"] not in GEOMETRY or not rec["visible"] or "lowest_z_m" not in rec:
        continue
    own = [b for n, b in parts if n == rec["name"]]
    others = [b for n, b in parts if n != rec["name"]]
    if rec["lowest_z_m"] < floor_z - TOL:
        rec["resting"] = "below_floor"
    elif rec["lowest_z_m"] <= floor_z + GAP:
        rec["resting"] = "floor"
    elif any(touches(b, o) for b in own for o in others):
        rec["resting"] = "on_object"
    else:
        rec["resting"] = "floating"
    if rec["resting"] != "floating" and len(own) > 1 and len(own) * len(parts) <= 4000000:
        rec["floating_parts"] = sum(
            1 for i, b in enumerate(own)
            if b[0].z > floor_z + GAP
            and not any(touches(b, o) for j, o in enumerate(own) if j != i)
            and not any(touches(b, o) for o in others)
        )
    if rec["resting"] in ("below_floor", "floating"):
        issue("warn", rec["resting"], object=rec["name"], lowest_z_m=rec["lowest_z_m"])
    if rec.get("floating_parts"):
        issue("warn", "floating_parts", object=rec["name"], count=rec["floating_parts"])
    if rec.get("normals_inward"):
        issue("warn", "normals_inward", object=rec["name"])
    if None in rec["materials"]:
        issue("warn", "empty_material_slot", object=rec["name"])
    if any(s < 0 for s in rec["scale"]):
        issue("warn", "negative_scale", object=rec["name"], scale=rec["scale"])

if PLAN:
    by_name = {r["name"]: r for r in objects}
    for name, size in plan.get("objects", {}).items():
        rec = by_name.get(name)
        if rec is None:
            issue("fail", "exists", object=name)
            continue
        dims = rec["dimensions_m"]
        if rec.get("instances"):
            dims = [round(b - a, 4) for a, b in zip(rec["bbox_min_m"], rec["bbox_max_m"])]
        for axis, (got, want) in enumerate(zip(dims, size)):
            if want and abs(got - want) / want > plan.get("size_tolerance", 0.10):
                issue("fail", "size", object=name, axis="xyz"[axis], got_m=got, want_m=want)
        if any(abs(s - 1) > 1e-4 for s in rec["scale"]):
            issue("fail", "scale_applied", object=name, scale=rec["scale"])
        if rec["type"] in GEOMETRY and rec.get("vertices") == 0 and not rec.get("instances"):
            issue("fail", "geometry", object=name)
        if name in plan.get("grounded", []):
            if "lowest_z_m" not in rec:
                issue("fail", "ground_contact", object=name, gap_m=None)
            elif abs(rec["lowest_z_m"] - floor_z) > TOL:
                issue("fail", "ground_contact", object=name, gap_m=round(rec["lowest_z_m"] - floor_z, 4))
        if name in plan.get("in_frame", []) and rec["in_frame"] != "in":
            issue("fail", "in_frame", object=name, status=rec["in_frame"])
        if rec["type"] in GEOMETRY and not rec.get("instances") and not any(rec["materials"]):
            issue("fail", "material", object=name)
    allowed = set(plan.get("objects", {})) | set(plan.get("approved_extra", []))
    extra = [r["name"] for r in objects if r["type"] in GEOMETRY and r["visible"] and r["name"] not in allowed]
    if extra:
        issue("fail", "extra_objects", objects=extra)
    if cam is None:
        issue("fail", "camera")
    for name in plan.get("lights", []):
        rec = by_name.get(name)
        if rec is None or rec["type"] != 'LIGHT' or rec["light"]["energy"] <= 0:
            issue("fail", "light", object=name)
    want = plan.get("output")
    if want:
        got_res = [scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage]
        if scene.render.engine != want["engine"]:
            issue("fail", "engine", got=scene.render.engine, want=want["engine"])
        if got_res != want["resolution"]:
            issue("fail", "resolution", got=got_res, want=want["resolution"])

levels = {i["level"] for i in issues}
print(json.dumps({
    "step": "scene-state",
    "blender_version": list(bpy.app.version),
    "file": bpy.data.filepath or None,
    "units": {"system": scene.unit_settings.system, "scale_length": scene.unit_settings.scale_length},
    "engine": scene.render.engine,
    "resolution": [scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage],
    "camera": cam.name if cam else None,
    "floor_z_m": floor_z,
    "objects": objects,
    "plan_checked": bool(PLAN),
    "issues": issues,
    "verdict": "fail" if "fail" in levels else "warn" if levels else "pass",
}))
```

- `verdict` is `fail` with any `fail` issue, `warn` with only `warn` issues, else `pass`. `plan_checked: false` means no plan checks ran.
- Distances are in metres: Blender units times the scene's unit scale (`scale_length`), so a centimetre scene still reports metres.
- Curves, surfaces, text and metaballs are measured like meshes, after modifiers.
- `instances` counts Geometry Nodes or particle instances an object makes; they render without being mesh vertices, so such an object passes `geometry`. Its box, `lowest_z_m` and plan `size` include the instances' boxes, measured along the world axes.
- For geometry, the box is measured from the evaluated vertices (and instances), not the object's bounding box. Meshes over 200,000 vertices skip `parts`, `open_edges` and `normals_inward`; their box stands in for their parts.
- A grounded object with no measurable geometry fails `ground_contact` with `gap_m: null`.
- `resting` and `floating_parts` compare boxes, so a part inside another object's box counts as touching it.
- On Path 1, `get_objects_summary` and `get_object_detail_summary` give part of this without code; on Path 2, `get_scene_info` and `get_object_info`. Run the script when you need the plan checks.
