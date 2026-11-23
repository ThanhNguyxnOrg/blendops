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

On Path 1, `render_thumbnail_to_path` makes a quick preview without changing your settings. On Path 2, `get_viewport_screenshot` captures the viewport.

## Final render

Pick engine and samples with `blendops-render-settings`. Write to an absolute path, then check the file exists and is not empty before you report it.

## GLB export

```python
import bpy
bpy.ops.export_scene.gltf(
    filepath="/abs/path/model.glb",
    export_format='GLB',
    use_selection=False,
    export_apply=True,   # applies modifiers; drops shape keys
)
```

- `export_apply=True` loses shape keys. Leave it off for faces or morph animations.
- Apply scale and avoid negative scale before export.
- Check size and counts with `blendops-glb-budget`, then hand off with `blendops-glb-web-handoff`.

## Evidence

Record the command, Blender version, output path, file size, and log lines under `docs/evals/` before you call anything `Produced` or `Verified`.
