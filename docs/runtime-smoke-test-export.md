# Runtime Smoke Test: Export Asset

**Status**: PASS (GUI bridge, GLB)

**Date**: 2026-04-26

**Blender Version**: 4.2.5 LTS

**Pass/Fail Verdict**: **PASS for GUI bridge GLB export**

---

## Scope

This smoke test records **real runtime evidence** for `export.asset` in Blender 4.2.5 LTS using the **GUI bridge mode**.

---

## Runtime Environment Evidence

Bridge startup log (GUI mode):
- `BlendOps Bridge is running`
- `URL: http://127.0.0.1:8765`
- `BRIDGE_READY`

Working directory:
- `D:\Code\blendops`

---

## Commands Executed and Results

### 1) Bridge status

Command:
```bash
npm run cli -- bridge status --verbose
```

Result:
- `ok: true`
- `operation: "bridge.status"`
- `implemented_operations` includes `"export.asset"`

### 2) Create object

Command:
```bash
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
```

Result:
- `ok: true`
- `operation: "object.create"`
- created object name: `"test_cube"`

### 3) Export GLB

Command:
```bash
npm run cli -- export asset --format glb --output exports/test_scene.glb
```

Result:
- `ok: true`
- `operation: "export.asset"`
- `message: "Exported asset to exports/test_scene.glb"`
- `data.format: "glb"`
- `data.output: "exports/test_scene.glb"`
- `data.selected_only: false`
- `data.apply_modifiers: true`
- `data.file_exists: true`
- `data.file_size_bytes: 3472`

---

## File Verification

Verified artifact:
- `D:\Code\blendops\exports\test_scene.glb`
- exists: `true`
- size: `3472` bytes

---

## Generated File Exclusion (Git Hygiene)

Confirmed generated runtime export artifact is excluded from commit scope:
- `exports/test_scene.glb` is **not committed**
- `exports/`, `.tmp/`, logs, `dist/`, `node_modules/`, `renders/` are not to be committed

---

## Background Mode Limitation (Blender 4.2)

Background mode (`-b`) GLB/GLTF export has a Blender 4.2 context limitation when `bpy.context.window` is `None`.

Observed background failure pattern:
- `AttributeError: 'NoneType' object has no attribute 'scene'`
- around `bpy.context.window.scene = blender_scene` in Blender glTF exporter path

Current handling in addon:
- `handle_export_asset` now returns a structured failure for GLB/GLTF when no GUI window context is present:
  - `operation: "export.asset"`
  - `message: "GLB/GLTF export requires a Blender GUI window context in Blender 4.2"`
  - `next_steps: ["Start the BlendOps bridge from Blender GUI instead of background mode"]`

FBX behavior is unchanged by this guard.

---

## Notes

- This PASS verdict applies to **GUI bridge GLB runtime export**.
- Do not treat background-mode GLB/GLTF as PASS until Blender context limitations are resolved upstream or by a proven safe workaround.
