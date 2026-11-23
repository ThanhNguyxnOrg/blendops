# Blender API version rules

Read `bpy.app.version` before writing code. These changes break older scripts most often.

| Version | Change | Write this |
|---|---|---|
| 4.0+ | Principled BSDF sockets renamed | `Specular IOR Level`, `Transmission Weight`, `Coat Weight`, `Sheen Weight`, `Subsurface Weight`, `Emission Color` |
| 4.0+ | `Subsurface Color` removed | Use `Base Color` |
| 4.0+ | Glossy and Anisotropic BSDF merged | `ShaderNodeBsdfAnisotropic` (`ShaderNodeBsdfGlossy` still works as an alias) |
| 4.0+ | Node group sockets moved | `tree.interface.new_socket(name, in_out='INPUT', socket_type='NodeSocketFloat')`, not `tree.inputs.new` |
| 4.2–4.5 | EEVEE engine id | `scene.render.engine = 'BLENDER_EEVEE_NEXT'` |
| 4.2+ | Motion blur settings moved | `scene.render.use_motion_blur` |
| 5.0+ | EEVEE engine id changed back | `scene.render.engine = 'BLENDER_EEVEE'` |
| 5.0+ | Add-on settings are no longer dict items | `scene.cycles.samples`, not `scene['cycles']` |
| 5.0+ | Render passes renamed | `Depth` (was `Z`), `Diffuse Color` (was `DiffCol`) |
| 5.0+ | Files saved in 5.0 do not open in 4.2 | Save from 4.5 if the user needs 4.2 |

A safe engine pick:

```python
import bpy
major, minor, _ = bpy.app.version
if (major, minor) >= (5, 0):
    eevee = 'BLENDER_EEVEE'
elif (major, minor) >= (4, 2):
    eevee = 'BLENDER_EEVEE_NEXT'
else:
    eevee = 'BLENDER_EEVEE'
```

Safe socket lookup: get inputs by name and check they exist (`node.inputs.get("Emission Color") or node.inputs.get("Emission")`).

Sources: Blender Python API release notes for [4.0](https://developer.blender.org/docs/release_notes/4.0/python_api/), [4.2](https://developer.blender.org/docs/release_notes/4.2/python_api/) and [5.0](https://developer.blender.org/docs/release_notes/5.0/python_api/).
