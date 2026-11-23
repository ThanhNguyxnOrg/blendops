# Build order

Build in small steps. Each step is one short code call that changes one thing and prints a JSON report.

1. **Check the scene.** Run the read-only [scene state](scene-state.md) script: Blender version, render engine, units, and the objects that already exist.
2. **Ask first.** Tell the user what will change and which files will be written; wait for their yes.
3. **Save a backup.** Save a copy of the `.blend` file before the first change (`bpy.ops.wm.save_as_mainfile(filepath=..., copy=True)`).
4. **Set units and scale.** Metric, 1 unit = 1 m. Model at real size (a shoe is about 0.3 m long).
5. **Block out shapes.** Primitives first, named after what they are (`Shoe_Sole`, not `Cube.001`).
6. **Refine shapes.** Modifiers (bevel, subdivision, boolean, weighted normal) before hand edits.
7. **Materials.** One Principled BSDF material per surface type. See [materials](materials.md).
8. **Lights.** See [lighting and camera](lighting-camera.md).
9. **Camera.** Frame the subject. See [lighting and camera](lighting-camera.md).
10. **Preview.** Low-sample render or viewport capture, then the look check in `blendops-look-check`.
11. **Final render or export.** Only after the preview passes the look check. See [render and export](render-export.md). Then hand the finished file to `blendops-final-check` again.

## Rules for every step

- Check the Blender version first and follow [API version rules](api-version-rules.md).
- On Path 1, look up an unfamiliar API with `search_api_docs` or `get_python_api_docs` before you use it.
- Set values through `bpy.data` where you can. `bpy.ops` needs the right context and fails in background mode more often.
- Get objects by name, never by selection or index.
- End each step by printing a short JSON report, and run [scene state](scene-state.md) after steps that add or move objects:

```python
import bpy, json
obj = bpy.data.objects["Shoe_Sole"]
print(json.dumps({
    "step": "block-out",
    "object": obj.name,
    "dimensions_m": [round(v, 3) for v in obj.dimensions],
    "location_m": [round(v, 3) for v in obj.location],
}))
```

- On the CLI fallback every step is a new Blender process: run `blender --background scene.blend --python-exit-code 1 --python step.py` so a Python error fails the command. Only steps that change the scene (after the user's yes and the backup) end with `bpy.ops.wm.save_mainfile()`; the first scene check never saves.
- If a step fails, read the error, fix only that step, and run it again. Do not re-run earlier steps blindly; objects from them still exist (`bpy.data` keeps state between calls).
- Never give this code to the user as their answer. Tell them what changed in plain words.
