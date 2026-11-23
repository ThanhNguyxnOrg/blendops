# Recipe walkthrough: chair GLB for a web product viewer

Scenario instance of `recipe.blender-to-glb-handoff` in [`registry/recipe-catalog.json`](../../registry/recipe-catalog.json). The user already has a Blender file; the job is to find what would break in a GLB, fix it with their consent, export, inspect the file and hand it to a web developer.

> [!NOTE]
> The code blocks are the steps an agent runs **inside the runtime** (Path 1 or Path 2 `execute_blender_code`, or one CLI fallback process each). They are never the answer to the user. `/abs/path/` stands for the folder that holds the user's file. Every block here runs in real Blender 4.2 and 5.1 in CI, starting from a test chair file with the same three problems: see [the walkthrough evidence](../evals/cli-fallback-recipe-walkthroughs.md).

## User prompt

"Here's my chair (`chair.blend`). Our website needs it as a GLB for the 3D product viewer. Can you make that?"

## Brief (from `blendops-brief`)

| Slot | Value |
|---|---|
| Subject | The chair and its cushion, nothing else |
| Output | `chair.glb` plus a short note for the web developer |
| Viewer | Three.js on the website (`blendops-glb-web-handoff`) |
| Budget | Desktop web tier, but a product viewer should still load fast: aim far under 100,000 triangles (`blendops-glb-budget`) |
| Out of scope | Remodelling, new materials, compression |

## Plan (locked, read by scene-state)

```json
{
  "objects": {"Chair": [0.45, 0.45, 0.9], "Cushion": [0.42, 0.42, 0.05]},
  "grounded": ["Chair"],
  "floor_z": 0.0,
  "lights": ["Key"],
  "approved_extra": ["Floor"]
}
```

## Steps

**1. Read the file before touching it.** Run [scene-state](../../skills/blendops-look-check/references/scene-state.md) with the plan. On this file it reports `fail` `scale_applied` on `Chair`: the chair was modelled at half size and scaled up 2×, which can export with the wrong size or shading in some viewers. Then a read-only glTF audit of what scene-state does not cover: which material nodes the glTF exporter cannot carry, and hidden objects that must stay out.

```python
import bpy, json
GLTF_NODES = {"ShaderNodeBsdfPrincipled", "ShaderNodeOutputMaterial", "ShaderNodeTexImage", "ShaderNodeNormalMap",
              "ShaderNodeSeparateColor", "ShaderNodeTexCoord", "ShaderNodeMapping", "ShaderNodeEmission"}
export = ["Chair", "Cushion"]
report = {"unapplied_scale": [], "lost_on_export": {}, "hidden": []}
for name in export:
    obj = bpy.data.objects[name]
    if any(abs(s - 1) > 1e-4 for s in obj.scale):
        report["unapplied_scale"].append({"object": name, "scale": [round(s, 4) for s in obj.scale]})
    for mat in obj.data.materials:
        bad = sorted({n.bl_idname for n in mat.node_tree.nodes if n.bl_idname not in GLTF_NODES})
        if bad:
            report["lost_on_export"][mat.name] = bad
report["hidden"] = [o.name for o in bpy.context.scene.objects if o.type == 'MESH' and not o.visible_get()]
print(json.dumps({"step": "gltf-audit", **report}))
```

Here it finds `Chair` at scale 2, a `ShaderNodeTexNoise` in `Wood` (a pattern that the GLB will silently drop) and a hidden `Chair_Old`. Tell the user in plain words and ask: "Your chair has three things that would break or bloat the web file: its size is stored as 'half size × 2', the wood uses a pattern websites cannot show, and there is an old hidden copy. I will save a backup, fix the size, replace the pattern with a plain wood finish, and leave the old copy out. OK?"

**2. Backup.** A copy next to the original; the open file stays `chair.blend`.

```python
import bpy, json
bpy.ops.wm.save_as_mainfile(filepath="/abs/path/chair-backup.blend", copy=True)
print(json.dumps({"step": "backup", "file": "/abs/path/chair-backup.blend"}))
```

**3. Apply the scale.** Baked into the mesh directly, so no selection or operator context is needed. Only safe when the mesh is not shared with other objects; children attached to the chair are compensated so they keep their size and place.

```python
import bpy, json
from mathutils import Matrix
obj = bpy.data.objects["Chair"]
assert obj.data.users == 1, "shared mesh: make it single-user first"
scale = Matrix.Diagonal((*obj.scale, 1.0))
obj.data.transform(scale)
for child in obj.children:
    child.matrix_parent_inverse = scale @ child.matrix_parent_inverse
obj.scale = (1.0, 1.0, 1.0)
bpy.context.view_layer.update()
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "apply-scale", "object": obj.name, "dimensions_m": [round(v, 3) for v in obj.dimensions]}))
```

**4. Replace the pattern with a value the GLB keeps.** Remove the noise node and set one roughness. (Keeping the pattern would mean baking it to an image texture first; out of scope here.) If an object that is not exported also uses `Wood`, the chair gets its own copy first, so that object keeps its finish.

```python
import bpy, json
export = {"Chair", "Cushion"}
chair = bpy.data.objects["Chair"]
mat = chair.material_slots[0].material
if any(o.name not in export and mat.name in o.data.materials for o in bpy.data.objects if o.type == 'MESH'):
    mat = mat.copy()
    chair.material_slots[0].material = mat
nodes = mat.node_tree.nodes
for node in [n for n in nodes if n.bl_idname == "ShaderNodeTexNoise"]:
    nodes.remove(node)
nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.55
bpy.ops.wm.save_mainfile()
print(json.dumps({"step": "materials", "nodes": sorted(n.bl_idname for n in nodes)}))
```

Rerun scene-state: verdict `pass`. Rerun the step 1 audit: nothing in `unapplied_scale` or `lost_on_export`.

**5. Export only the chair and cushion.** glTF uses +Y up; the exporter converts from Blender's +Z up by default. The hidden copy, floor, light and camera stay out.

```python
import bpy, json, os
planned = ["Chair", "Cushion"]
for obj in bpy.context.scene.objects:
    obj.select_set(obj.name in planned)
bpy.ops.export_scene.gltf(filepath="/abs/path/chair.glb", export_format='GLB', use_selection=True, export_apply=True)
print(json.dumps({"step": "export", "file": "/abs/path/chair.glb", "bytes": os.path.getsize("/abs/path/chair.glb")}))
```

**6. Inspect the file.** Outside Blender:

```bash
npx blendops glb-inspect "/abs/path/chair.glb"
npx blendops glb-handoff "/abs/path/chair.glb" --out-dir "/abs/path/handoff" --viewer threejs
```

Expect a valid GLB 2.0 container with 2 meshes, 2 materials, no textures and no compression extensions, so the website needs no Draco, Meshopt or KTX2 decoder. The triangle count is 84, far under budget. This proves the **file** is sound; it does not prove how it looks on the website.

**7. Note for the web developer** (from `blendops-glb-web-handoff`; full viewer in [the Three.js example](../examples/blendops-glb-web-handoff/threejs-glb-viewer.mjs)):

```js
renderer.toneMapping = THREE.NeutralToneMapping; // closest to Blender's default look
renderer.outputColorSpace = THREE.SRGBColorSpace;
scene.environment = pmrem.fromScene(new RoomEnvironment()).texture; // the GLB carries no lights
new GLTFLoader().load('chair.glb', (gltf) => scene.add(gltf.scene)); // 1 unit = 1 m, +Y up
```

## Final check

`blendops-final-check` labels `chair.glb` `Produced` once it is on disk and `Verified` for structure after step 6 passes. How it looks inside the real website stays `Not Run` until someone opens it there.

## Reply to the user (no Blender terms)

```txt
Your chair is ready for the website: chair.glb (chair and cushion only, real size: 45 cm wide, 90 cm tall).
Fixed with your OK: the stored size, and the wood pattern (now a plain wood finish, since websites cannot show that pattern).
Left out: the old hidden copy, the floor, lights and camera. Your original is saved as chair-backup.blend.
Checked: the file opens as a valid 3D file and is small. Not checked yet: how it looks on your site.
For your web developer: the note in handoff/ says which settings to use so colors match.
```
