# Lighting and camera

## Three-point studio light

```python
import bpy
from math import radians
def area(name, loc, rot, power, size):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy = power; data.size = size
    obj = bpy.data.objects.new(name, data)
    obj.location = loc; obj.rotation_euler = [radians(a) for a in rot]
    bpy.context.scene.collection.objects.link(obj)
    return obj
area("Key",  (1.5, -1.5, 1.8), (55, 0, 45), 400, 1.0)
area("Fill", (-1.8, -1.0, 1.0), (70, 0, -60), 120, 1.5)
area("Rim",  (0.0, 1.8, 1.6), (-60, 0, 180), 250, 0.6)
```

Watt values are for an object about 0.3–1 m across; scale them with the square of the distance. For reflections on metal or glass, add an HDRI world or large light cards.

## Point lights at the subject

Use a Track To constraint so lights and camera keep aiming when the subject moves:

```python
c = cam.constraints.new('TRACK_TO')
c.target = bpy.data.objects["Shoe_Upper"]
c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
```

## Frame the subject

Distance that fits an object of size `s` (its largest dimension) in a camera with horizontal field of view `fov`, with a margin `m` (1.2 = 20% space):

\[ d = \frac{m \cdot s / 2}{\tan(\mathrm{fov}/2)} \]

```python
import bpy
from math import tan
cam = bpy.data.objects["Camera"]
s = max(bpy.data.objects["Shoe_Upper"].dimensions)
d = 1.2 * (s / 2) / tan(cam.data.angle / 2)
```

Product shots: 50–85 mm lens, camera slightly above the subject. Set resolution from the brief (`scene.render.resolution_x/y`).

## Check the frame with numbers

`bpy_extras.object_utils.world_to_camera_view(scene, cam, point)` returns x, y in 0–1 when a point is inside the frame. Check all 8 bounding-box corners; any value outside 0–1 means the subject is cut off.
