# Runtime Smoke Test Report - render.preview

**Status**: PASS

**Date**: 2026-04-25

**Blender Version**: 4.2.5 LTS

**Scope**: render.preview runtime evidence with no-camera error-path verification.

**Pass/Fail Verdict**: PASS

---

## Date / Time
- 2026-04-25 04:36:34 -05:00

## Environment
- OS: Microsoft Windows 11 Enterprise
- Node: v22.20.0
- npm: 10.9.3
- Blender: Blender 4.2.5 LTS
- Blender executable path: `C:\Program Files\Blender Foundation\Blender 4.2\blender.exe`
- Blender on PATH: No (`blender --version` fails without full path)

## Scope
Validated the implemented `render.preview` vertical slice end-to-end in real Blender runtime:
- schema → core client → blender bridge handler → CLI → MCP-compatible bridge behavior
- runtime execution evidence only for requested slice and its direct prerequisites

No extra features were added (no export/validation/delete/scene clear/undo/arbitrary Python execution).

## Commands Run

### Repository sync
```bash
git pull origin main
git status
git log --oneline -8
```

### Verification
```bash
npm install
npm run clean
npm run typecheck
npm run build
```

### Blender version checks
```bash
blender --version
"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --version
```

### Runtime sequence (real Blender bridge)
```bash
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
npm run cli -- material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
npm run cli -- material apply --object test_cube --material red_plastic
npm run cli -- lighting setup --preset studio --target test_cube
npm run cli -- camera set --target test_cube --distance 5 --focal-length 50
npm run cli -- render preview --output renders/preview.png --width 512 --height 512 --samples 16
```

### No-camera error test
Executed with a dedicated Blender runtime where scene camera was explicitly set to `None` before serving bridge requests:
```bash
npm run cli -- render preview --output renders/no-camera-test.png --width 512 --height 512 --samples 16
```

## JSON Output Excerpts

### object create
```json
{
  "ok": true,
  "operation": "object.create",
  "message": "Created cube object 'test_cube'"
}
```

### material create
```json
{
  "ok": true,
  "operation": "material.create",
  "message": "Created material 'red_plastic'"
}
```

### material apply
```json
{
  "ok": true,
  "operation": "material.apply",
  "message": "Applied material 'red_plastic' to 'test_cube'"
}
```

### lighting setup
```json
{
  "ok": true,
  "operation": "lighting.setup",
  "message": "Applied lighting preset 'studio'"
}
```

### camera set
```json
{
  "ok": true,
  "operation": "camera.set",
  "message": "Camera set successfully",
  "data": {
    "camera": { "name": "blendops_camera" },
    "active_camera": "blendops_camera"
  }
}
```

### render preview (success)
```json
{
  "ok": true,
  "operation": "render.preview",
  "message": "Rendered preview to renders/preview.png",
  "data": {
    "output": "renders/preview.png",
    "width": 512,
    "height": 512,
    "samples": 16,
    "camera": "blendops_camera"
  }
}
```

### render preview (no camera)
```json
{
  "ok": false,
  "operation": "render.preview",
  "message": "No active camera found",
  "next_steps": [
    "Run `blendops camera set --target <object>` before rendering"
  ]
}
```

## Runtime Findings

### Primary runtime sequence results
- object create returns ok true: **PASS**
- material create returns ok true: **PASS**
- material apply returns ok true: **PASS**
- lighting.setup returns ok true: **PASS**
- camera.set returns ok true: **PASS**
- render.preview returns ok true: **PASS**
- render.preview data.output is `renders/preview.png`: **PASS**
- render.preview data.width is 512: **PASS**
- render.preview data.height is 512: **PASS**
- render.preview data.samples is 16: **PASS**
- render.preview data.camera is `blendops_camera`: **PASS**

### Output file existence
- Expected repo path: `D:\Code\blendops\renders\preview.png`
- Verified after minimal fix: **exists during runtime run**, metadata:
  - size: 196,557 bytes
  - last write: 2026-04-25 04:36:12 -05:00

## Minimal Runtime Bugfix Applied

A runtime issue was found and fixed minimally in `render.preview` handler only:

### Issue
For relative output paths, Blender saved to `C:\renders\preview.png` instead of repo-local `renders\preview.png` under some runtime contexts.

Evidence from Blender runtime log before fix:
- `Saved: 'C:\renders\preview.png'`

### Minimal fix
File: `apps/blender-addon/blendops_addon/__init__.py`
- Resolve relative output path to absolute path before render (`os.path.abspath`) based on Blender working directory
- Ensure output directory is created from resolved absolute path
- Verify file existence after render and return structured error if file is missing

Scope remained strictly in `handle_render_preview`; no unrelated feature changes.

## No-Camera Test Result
- Tested: **Yes**
- Result:
  - `ok: false`: **PASS**
  - `operation: "render.preview"`: **PASS**
  - message indicates no active camera: **PASS**
  - `next_steps` suggests running camera set: **PASS**

## Git Hygiene
- `.gitignore` already included `renders/` before this run.
- Render output PNG files were **not committed**.
- `renders/` directory was removed after runtime verification.
- `dist/` and `node_modules/` are excluded and not committed.

## Verification (post-runtime)
Run after runtime and bugfix:
```bash
npm run clean
npm run typecheck
npm run build
```
Result: **PASS**

## Verdict
**PASS**

`render.preview` validated in real Blender runtime with complete command sequence and no-camera error path. Runtime bug around relative output path handling was fixed minimally within `render.preview` only.

## Notes
- `blender --version` without full path fails in this environment; full path invocation works and was used.
- Runtime artifacts and raw logs are kept under `.tmp/runtime-render/` (untracked) for traceability in this session.
