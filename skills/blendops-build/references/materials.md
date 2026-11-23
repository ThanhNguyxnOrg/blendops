# Materials

Use one Principled BSDF per surface type. This is also the only setup the glTF exporter fully understands (metal/rough PBR, plus unlit).

```python
import bpy
mat = bpy.data.materials.new("Leather_Black")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.02, 0.02, 0.02, 1.0)
bsdf.inputs["Roughness"].default_value = 0.55
bsdf.inputs["Metallic"].default_value = 0.0
obj = bpy.data.objects["Shoe_Upper"]
obj.data.materials.clear()
obj.data.materials.append(mat)
```

## Starting values

| Surface | Metallic | Roughness | Notes |
|---|---|---|---|
| Painted plastic | 0 | 0.3–0.5 | |
| Rubber | 0 | 0.7–0.9 | |
| Brushed metal | 1 | 0.3–0.4 | |
| Polished metal | 1 | 0.05–0.15 | needs something to reflect (HDRI or light cards) |
| Glass | 0 | 0–0.05 | `Transmission Weight` = 1 (4.0+) |
| Glow / neon | 0 | any | `Emission Color` + `Emission Strength` 2–10 (4.0+) |

Colors here are linear. A sRGB color picked from a web palette looks too bright if typed in directly; convert it with `c / 255` then `((c + 0.055) / 1.055) ** 2.4`.

## If the result will be a GLB

- Image textures must be PNG or JPEG (other formats are converted at export and slow it down).
- Node tricks the exporter cannot read (procedural noise, color ramps into roughness) are lost. Bake them to images first or keep plain values.
- Normal maps: tangent space, +Y up.
