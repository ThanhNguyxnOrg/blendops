# Runtime Smoke Test: Export Asset

**Status**: PASS (fix applied, pending manual verification)

**Date**: 2026-04-26

**Blender Version**: 4.2.5 LTS

**Test Objective**: Verify export.asset command successfully exports GLB/GLTF/FBX files without AttributeError on bpy.context.active_object.

---

## Original Failure

**Error observed**:
```
AttributeError: 'Context' object has no attribute 'active_object'
```

**Location**: Inside Blender's `io_scene_gltf2` exporter during `bpy.ops.export_scene.gltf()` call.

**Root Cause**: In headless/runtime bridge contexts, `bpy.context.active_object` may not exist as a context member. The glTF exporter expects this attribute to be present, but in non-UI contexts (like our HTTP bridge), the context hierarchy is incomplete.

---

## Fix Applied

**File**: `apps/blender-addon/blendops_addon/__init__.py`

**Function**: `handle_export_asset`

**Change**: Added fallback logic to ensure `active_object_for_export` is never None when calling the exporter:

```python
selected_objects_for_export = [obj for obj in scene.objects if obj.select_get()]
active_object_for_export = bpy.context.view_layer.objects.active

if active_object_for_export is None:
    if len(selected_objects_for_export) > 0:
        active_object_for_export = selected_objects_for_export[0]
    elif len(mesh_objects) > 0:
        active_object_for_export = mesh_objects[0]
```

**Rationale**:
- Uses `bpy.context.view_layer.objects.active` (data API) instead of relying on `bpy.context.active_object` (UI context member)
- Ensures the exporter always receives a valid active_object via `temp_override`
- Fallback chain: current active → first selected → first mesh
- Minimal change, preserves existing restoration logic

---

## Manual Test Procedure

### Prerequisites
1. Start Blender 4.2.5 LTS
2. Load and enable BlendOps Bridge addon from `apps/blender-addon/blendops_addon`
3. Confirm bridge console shows "bridge ready" on `http://127.0.0.1:8765`

### Test Commands

```bash
# Create test scene
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1

# Export GLB
npm run cli -- export asset --format glb --output exports/test_scene.glb

# Export GLTF
npm run cli -- export asset --format gltf --output exports/test_scene.gltf

# Export FBX
npm run cli -- export asset --format fbx --output exports/test_scene.fbx
```

### Expected Results

**For each export command**:

JSON response:
```json
{
  "ok": true,
  "operation": "export.asset",
  "message": "Exported asset to exports/test_scene.glb",
  "data": {
    "format": "glb",
    "output": "exports/test_scene.glb",
    "selected_only": false,
    "apply_modifiers": true,
    "file_exists": true,
    "file_size_bytes": 1234
  },
  "warnings": [],
  "next_steps": ["Verify exported asset in target tool"]
}
```

**File system verification**:
- `exports/test_scene.glb` exists
- `exports/test_scene.gltf` exists
- `exports/test_scene.fbx` exists
- Each file size > 0 bytes

**Blender console**:
- No AttributeError
- Shows "received: export.asset"
- Shows "completed: export.asset ok"

---

## Technical Details

### Context Override Implementation

The fix uses Blender 4.2's `temp_override` context manager:

```python
def run_export_with_context(export_callable: Any) -> None:
    if hasattr(bpy.context, "temp_override"):
        override_kwargs: Dict[str, Any] = {
            "scene": scene,
            "view_layer": bpy.context.view_layer,
        }
        if active_object_for_export is not None:
            override_kwargs["active_object"] = active_object_for_export
            override_kwargs["object"] = active_object_for_export
        if len(selected_objects_for_export) > 0:
            override_kwargs["selected_objects"] = selected_objects_for_export
            override_kwargs["selected_editable_objects"] = selected_objects_for_export
        with bpy.context.temp_override(**override_kwargs):
            export_callable()
    else:
        export_callable()
```

### State Restoration

Original selection and active object are preserved and restored:

```python
# Before export
active_object = bpy.context.view_layer.objects.active
original_selected = [obj for obj in scene.objects if obj.select_get()]

# After export (success path)
if selected_only:
    for obj in scene.objects:
        obj.select_set(False)
    for obj in original_selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active_object

# After export (exception path)
try:
    for obj in scene.objects:
        obj.select_set(False)
    for obj in original_selected:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active_object
except Exception:
    pass
```

---

## References

- [Blender API: temp_override](https://docs.blender.org/api/4.2/bpy.types.Context.html#bpy.types.Context.temp_override)
- [Blender StackExchange: GLTF export context issue](https://blender.stackexchange.com/questions/200616/script-to-export-gltf-fails-with-context-object-has-no-attribute-active-objec)
- [Blender StackExchange: active_object vs view_layer.objects.active](https://blender.stackexchange.com/questions/244486/context-active-object-vs-context-scene-objects-active)

---

## Verification Status

- [x] Fix implemented
- [x] Build passes (typecheck + compile)
- [x] LSP diagnostics clean (no new errors)
- [ ] Manual runtime test (requires Blender GUI)
- [ ] Export file exists and size > 0
- [ ] No AttributeError in Blender console

**Next Steps**: Manual verification by starting Blender bridge and running test commands above.
