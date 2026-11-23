# Build order

Build in small steps. Each step is one short code call that changes one thing and prints a JSON report.

1. **Check the scene.** Read the Blender version, render engine, unit scale, and the objects that already exist. On Path 1 use `get_objects_summary`; otherwise run a read-only snippet.
2. **Save a backup.** Save a copy of the `.blend` file before the first change (`bpy.ops.wm.save_as_mainfile(filepath=..., copy=True)`).
3. **Set units and scale.** Metric, 1 unit = 1 m. Model at real size (a shoe is about 0.3 m long).
4. **Block out shapes.** Primitives first, named after what they are (`Shoe_Sole`, not `Cube.001`).
5. **Refine shapes.** Modifiers (bevel, subdivision, boolean, weighted normal) before hand edits.
6. **Materials.** One Principled BSDF material per surface type. See [materials](materials.md).
7. **Lights.** See [lighting and camera](lighting-camera.md).
8. **Camera.** Frame the subject. See [lighting and camera](lighting-camera.md).
9. **Preview.** Low-sample render or viewport capture, then the look check in `blendops-final-check`.
10. **Final render or export.** See [render and export](render-export.md).

## Rules for every step

- Check the Blender version first and follow [API version rules](api-version-rules.md).
- On Path 1, look up an unfamiliar API with `search_api_docs` or `get_python_api_docs` before you use it.
- Set values through `bpy.data` where you can. `bpy.ops` needs the right context and fails in background mode more often.
- Get objects by name, never by selection or index.
- End each step by printing a JSON report:

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

- If a step fails, read the error, fix only that step, and run it again. Do not re-run earlier steps blindly; objects from them still exist (`bpy.data` keeps state between calls).
- Never give this code to the user as their answer. Tell them what changed in plain words.
