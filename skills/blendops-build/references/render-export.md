# Render and export

## Preview render (fast)

```python
import bpy
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_percentage = 50
scene.render.filepath = "/abs/path/preview.png"
bpy.ops.render.render(write_still=True)
```

On Path 1, `render_thumbnail_to_path` makes a quick preview. It writes into Blender's temp folder (`bpy.app.tempdir/blender_mcp/`), not always the path you asked for, and can leave render settings changed: use the path the tool returns, and read back engine, samples, resolution and output path afterwards. On Path 2, `viewport_capture` or `look` (v2.2.7+) or `get_viewport_screenshot` (v1.x) captures the viewport.

## Final render

Pick engine and samples with `blendops-render-settings`. Set `scene.render.resolution_percentage = 100` again after a preview. Write to an absolute path, then check the file exists and is not empty before you report it.

## GLB export

```python
import bpy
planned = ["Shoe_Sole", "Shoe_Upper"]  # only the objects in the plan
bpy.ops.object.select_all(action='DESELECT')
for name in planned:
    bpy.data.objects[name].select_set(True)
bpy.ops.export_scene.gltf(
    filepath="/abs/path/model.glb",
    export_format='GLB',
    use_selection=True,  # leaves out other meshes, lights and cameras in the file
    export_apply=True,   # applies modifiers; drops shape keys
)
```

- `export_apply=True` loses shape keys. Leave it off for faces or morph animations.
- Apply scale and avoid negative scale before export.
- Check size and counts with `blendops-glb-budget`, then hand off with `blendops-glb-web-handoff`.

## Evidence

Record the command, Blender version, output path, file size, and log lines under `docs/evals/` before you call anything `Produced` or `Verified`.
