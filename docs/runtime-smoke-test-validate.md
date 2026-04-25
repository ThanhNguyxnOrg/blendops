# Runtime Smoke Test Report - validate.scene

## Date / Time
- 2026-04-25 05:04:08 -05:00

## Environment
- OS: Microsoft Windows 11 Enterprise
- Node: v22.20.0
- npm: 10.9.3
- Blender: Blender 4.2.5 LTS
- Blender executable path: `C:\Program Files\Blender Foundation\Blender 4.2\blender.exe`
- Blender on PATH: No (`blender --version` fails without full path)

## Commands run

### Repository sync
```bash
git pull origin main
git status
git log --oneline -10
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

### Bridge health
```bash
npm run cli -- bridge status
```

### Runtime sequence
```bash
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
npm run cli -- material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
npm run cli -- material apply --object test_cube --material red_plastic
npm run cli -- lighting setup --preset studio --target test_cube
npm run cli -- camera set --target test_cube --distance 5 --focal-length 50
npm run cli -- validate scene --preset basic
npm run cli -- validate scene --preset game_asset
npm run cli -- validate scene --preset render_ready
npm run cli -- validate scene --preset invalid
```

### Non-mutation check
```bash
npm run cli -- scene inspect
npm run cli -- validate scene --preset basic
npm run cli -- scene inspect
```

## JSON output excerpts

### bridge status
```json
{
  "ok": true,
  "operation": "bridge.status",
  "message": "BlendOps bridge is running",
  "data": {
    "version": "0.1.0"
  },
  "warnings": [],
  "next_steps": []
}
```

### validate.scene (basic)
```json
{
  "ok": true,
  "operation": "validate.scene",
  "message": "Scene validation complete (preset: basic)",
  "data": {
    "preset": "basic",
    "passed": true,
    "checks": [
      {
        "id": "has_objects",
        "status": "pass",
        "message": "Scene has 6 object(s)",
        "details": { "count": 6 }
      },
      {
        "id": "has_active_camera",
        "status": "pass",
        "message": "Active camera: blendops_camera",
        "details": { "camera": "blendops_camera" }
      }
    ],
    "summary": {
      "pass": 8,
      "warn": 0,
      "fail": 0
    }
  },
  "warnings": [],
  "next_steps": [
    "Scene validation passed with no warnings"
  ]
}
```

### validate.scene (game_asset)
```json
{
  "ok": true,
  "operation": "validate.scene",
  "message": "Scene validation complete (preset: game_asset)",
  "data": {
    "preset": "game_asset",
    "passed": true,
    "checks": [
      {
        "id": "game_asset_non_generic_names",
        "status": "warn",
        "message": "1 mesh object(s) have generic names",
        "details": {
          "objects": ["Cube"]
        }
      }
    ],
    "summary": {
      "pass": 11,
      "warn": 1,
      "fail": 0
    }
  },
  "warnings": [
    "Validation has 1 warning(s)"
  ],
  "next_steps": [
    "Review warnings for potential improvements"
  ]
}
```

### validate.scene (render_ready)
```json
{
  "ok": true,
  "operation": "validate.scene",
  "message": "Scene validation complete (preset: render_ready)",
  "data": {
    "preset": "render_ready",
    "passed": true,
    "checks": [
      {
        "id": "render_ready_visible_meshes",
        "status": "pass",
        "message": "2 visible mesh object(s) for rendering",
        "details": { "count": 2 }
      },
      {
        "id": "render_ready_resolution",
        "status": "pass",
        "message": "Render resolution: 1920x1080",
        "details": {
          "width": 1920,
          "height": 1080
        }
      }
    ],
    "summary": {
      "pass": 10,
      "warn": 0,
      "fail": 0
    }
  },
  "warnings": [],
  "next_steps": [
    "Scene validation passed with no warnings"
  ]
}
```

### invalid preset result
```json
{
  "ok": false,
  "operation": "cli.invalid_arguments",
  "message": "Invalid enum value...",
  "warnings": [
    "Invalid validate scene input"
  ],
  "next_steps": [
    "Allowed presets: basic, game_asset, render_ready",
    "Example: blendops validate scene --preset game_asset"
  ]
}
```

## Empty/default scene test
- Status: **Skipped**
- Reason: This continuation run was required to keep the already-responsive bridge process alive and avoid destructive reset operations. `validate.scene` has no scene-reset counterpart, and reinitializing a separate isolated bridge scene on the same fixed port (`8765`) would require shutting down the active bridge instance, which was explicitly disallowed unless unresponsive.

## Pass / Fail verdict
- bridge status: **PASS**
- runtime chain (object/material/lighting/camera): **PASS**
- validate.scene basic: **PASS** (`ok=true`, structured data/checks/summary)
- validate.scene game_asset: **PASS** (`ok=true`, structured warn + next_steps)
- validate.scene render_ready: **PASS** (`ok=true`, structured data/checks/summary)
- invalid preset handling: **PASS** (`ok=false`, `operation=cli.invalid_arguments`)
- non-mutation check (scene inspect before/after validate): **PASS** (object/camera/light/material counts unchanged)

Overall: **PASS**

## Notable warnings/failures
- `game_asset` preset produced one expected warning:
  - generic mesh name (`Cube`) detected.
- No crashes occurred.
- No failures in `basic` or `render_ready` in this runtime scene.

## Notes
- Runtime execution used a real Blender background process with addon module `apps/blender-addon/blendops_addon/__init__.py` registered.
- No new feature scope was added in this pass.
