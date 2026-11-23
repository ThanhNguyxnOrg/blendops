"""Run the bpy examples from one skill reference file in a fresh test scene.

Run: blender -b --factory-startup --python-exit-code 1 --python run_snippets.py -- <job.json>
job.json: {"blocks": [code, ...], "check": code, "out_dir": path}. The blocks share one namespace,
in file order; "/abs/path/" in a block becomes out_dir. "check" runs last and raises on a wrong result.
"""
import bpy, json, math, os, sys

job = json.load(open(sys.argv[sys.argv.index("--") + 1]))
out = job["out_dir"]
os.makedirs(out, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
for name, size, z in (("Shoe_Sole", (0.29, 0.11, 0.03), 0.015), ("Shoe_Upper", (0.28, 0.10, 0.09), 0.075)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
cam = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
scene.collection.objects.link(cam)
cam.location, cam.rotation_euler = (0, -1.2, 0.3), (math.radians(80), 0, 0)
scene.camera = cam
scene.render.resolution_x, scene.render.resolution_y = 64, 36  # keeps example renders fast

ns = {"__name__": "__main__", "cam": cam}
for code in job["blocks"]:
    exec(compile(code.replace("/abs/path/", out.rstrip("/") + "/"), "<reference block>", "exec"), ns)
exec(compile(job.get("check") or "", "<check>", "exec"), ns)
print(json.dumps({"step": "snippets", "blender_version": list(bpy.app.version), "blocks": len(job["blocks"])}))
