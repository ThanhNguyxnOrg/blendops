# Modeling

## Primitives and names

```python
import bpy
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0.5))
obj = bpy.context.active_object
obj.name = "Crate_Body"
obj.scale = (0.6, 0.4, 0.4)
bpy.ops.object.transform_apply(scale=True)  # keep scale at 1 so bevels and exports behave
```

Without operators (safer in background mode), build with `bmesh` and link the object yourself:

```python
import bpy, bmesh
mesh = bpy.data.meshes.new("Plinth")
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
bm.to_mesh(mesh); bm.free()
obj = bpy.data.objects.new("Plinth", mesh)
bpy.context.scene.collection.objects.link(obj)
```

## Modifiers in a good order

1. Boolean (cut holes) → 2. Bevel (soften edges) → 3. Subdivision (only for smooth shapes) → 4. Weighted Normal (clean shading on hard surfaces).

```python
bev = obj.modifiers.new("Bevel", 'BEVEL')
bev.width = 0.01      # metres; small bevels catch light
bev.segments = 3
bev.limit_method = 'ANGLE'
obj.modifiers.new("WeightedNormal", 'WEIGHTED_NORMAL')
```

## Ground contact

Put the object on the floor: lowest point at z = 0.

```python
import bpy
from mathutils import Vector
obj = bpy.data.objects["Crate_Body"]
low = min((obj.matrix_world @ Vector(c)).z for c in obj.bound_box)
obj.location.z -= low
```

## Common mistakes

- Non-uniform scale left on the object: bevels look uneven and exports stretch. Apply scale.
- Negative scale: normals flip and the GLB shows black or inside-out faces.
- Boolean cutter left visible: hide it from render (`cutter.hide_render = True`) or apply the modifier.
