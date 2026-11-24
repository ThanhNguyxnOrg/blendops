"""Run the steps of one recipe walkthrough (docs/recipes/*.md) in a fresh Blender.

Run: blender -b --factory-startup --python-exit-code 1 --python run-walkthrough.py -- <job.json>
job.json: {"blocks": [code, ...], "start": "empty" | "chair", "check": code, "out_dir": path}.
Each block runs in its own namespace, as one runtime call would; "/abs/path/" in a block becomes
out_dir. "start" is the scene the user hands over. "check" runs last and raises on a wrong result.
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Matrix

job = json.load(open(sys.argv[sys.argv.index("--") + 1]))
out = job["out_dir"].rstrip("/") + "/"
os.makedirs(out, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)


def boxes(name, parts):
    """One mesh object made of axis-aligned boxes: [(size_xyz, centre_xyz), ...]."""
    bm = bmesh.new()
    for size, centre in parts:
        m = Matrix.Translation(centre) @ Matrix.Diagonal((*size, 1))
        bmesh.ops.create_cube(bm, size=1.0, matrix=m)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


def chair_file():
    """A user's chair scene with three export problems: unapplied scale, a procedural
    roughness node, and an old hidden copy that shares the chair's material. The cushion
    is parented to the chair."""
    scene = bpy.context.scene
    h = 0.5  # modelled at half size, then scaled up 2x without applying the scale
    legs = [((0.02, 0.02, 0.225), (x * 0.1, y * 0.1, 0.1125)) for x in (-1, 1) for y in (-1, 1)]
    chair = boxes("Chair", legs + [((0.225, 0.225, 0.02), (0, 0, 0.235)),
                                   ((0.225, 0.02, 0.205), (0, 0.1025, 0.3475))])
    chair.scale = (2, 2, 2)
    wood = bpy.data.materials.new("Wood")
    wood.use_nodes = True
    nt = wood.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.30, 0.16, 0.07, 1)
    noise = nt.nodes.new("ShaderNodeTexNoise")
    nt.links.new(noise.outputs["Fac"], bsdf.inputs["Roughness"])
    chair.data.materials.append(wood)
    cushion = boxes("Cushion", [((0.42, 0.42, 0.05), (0, 0, 0.515))])
    fabric = bpy.data.materials.new("Fabric_Blue")
    fabric.use_nodes = True
    fb = fabric.node_tree.nodes["Principled BSDF"]
    fb.inputs["Base Color"].default_value = (0.05, 0.12, 0.35, 1)
    fb.inputs["Roughness"].default_value = 0.8
    cushion.data.materials.append(fabric)
    old = boxes("Chair_Old", [((0.45, 0.45, 0.9), (1.5, 0, 0.45))])
    old.data.materials.append(wood)  # shared with the export chair; must keep its pattern
    bpy.context.view_layer.update()
    cushion.parent = chair  # attached as Ctrl+P would, so it must keep its size when the scale is applied
    cushion.matrix_parent_inverse = chair.matrix_world.inverted()
    old.hide_set(True)
    old.hide_render = True
    fm = bpy.data.meshes.new("Floor")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=2.0)
    bm.to_mesh(fm)
    bm.free()
    floor = bpy.data.objects.new("Floor", fm)
    scene.collection.objects.link(floor)
    floor.data.materials.append(fabric)
    cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    scene.collection.objects.link(cam)
    cam.location, cam.rotation_euler = (1.6, -1.6, 1.2), (math.radians(65), 0, math.radians(45))
    scene.camera = cam
    key = bpy.data.objects.new("Key", bpy.data.lights.new("Key", 'AREA'))
    key.data.energy = 300
    key.location = (1.5, -1.5, 2)
    scene.collection.objects.link(key)
    bpy.ops.wm.save_as_mainfile(filepath=out + "chair.blend")
    bpy.ops.wm.save_as_mainfile(filepath=out + "chair-start.blend", copy=True)  # what the test reads as "before"


if job.get("start") == "chair":
    chair_file()

for code in job["blocks"]:
    exec(compile(code.replace("/abs/path/", out), "<walkthrough step>", "exec"), {"__name__": "__main__"})
exec(compile(job.get("check") or "", "<check>", "exec"), {"__name__": "__main__"})
print(json.dumps({"step": "walkthrough", "blender_version": list(bpy.app.version), "blocks": len(job["blocks"])}))
