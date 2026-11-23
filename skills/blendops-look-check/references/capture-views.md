# Capture views

Take at least three pictures after the numeric checks: the camera view, plus two views from other sides (front and side, or a three-quarter view and top). One view hides depth, floating objects and back faces.

| Path | Camera view | Other views | Notes |
|---|---|---|---|
| Path 1 — Lab MCP (Blender 5.1+) | `render_thumbnail_to_path` | `get_screenshot_of_area_as_image` of the 3D viewport | The thumbnail goes to Blender's temp folder (`bpy.app.tempdir/blender_mcp/`), not always the path you asked for; use the path the tool returns. It can leave render settings changed: read back engine, samples, resolution and output path afterwards. |
| Path 2 — `mcp-for-blender` | `look` with the camera view | `look` on target objects, or `viewport_capture` | v1.x only has `get_viewport_screenshot`. |
| CLI fallback | low-sample render from `scene.camera` | add temporary cameras in the script, render each, never save the file | Run with `blender --background scene.blend --python-exit-code 1 --python capture.py`; the script does not call `save_mainfile()`. |

Rules:

- Keep previews small (about 512 px on the long side) and fast (EEVEE, or Cycles with few samples).
- Name each image by view and round: `look-r1-camera.png`, `look-r1-front.png`.
- A picture you did not get back from the tool, or a file you did not find on disk, does not exist. Report it as `Not Produced`.
- Temporary cameras and lights for capture are removed in the same script, or the script never saves.
