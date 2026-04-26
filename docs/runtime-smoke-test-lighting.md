# Runtime Smoke Test Report - lighting.setup

**Status**: PASS

**Date**: 2026-04-24

**Blender Version**: 4.2.5 LTS

**Scope**: object.create + lighting.setup + scene.inspect + target-not-found handling.

**Pass/Fail Verdict**: PASS

---

## Date / Time
- 2026-04-24 23:15:32 -05:00

## Environment
- OS: Microsoft Windows 11 Enterprise
- Node: v22.20.0
- npm: 10.9.3
- Blender: Blender 4.2.5 LTS

## Commands run

```bash
git pull origin main
git status
git log --oneline -5
npm install
npm run clean
npm run typecheck
npm run build
blender --version
"C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --version
```

Blender runtime sequence:

```bash
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
npm run cli -- lighting setup --preset studio --target test_cube
npm run cli -- scene inspect
npm run cli -- lighting setup --preset studio --target does_not_exist
```

## JSON output excerpts

### object create
```json
{
  "ok": true,
  "operation": "object.create",
  "message": "Created cube object 'test_cube'",
  "data": {
    "object": {
      "name": "test_cube",
      "type": "MESH",
      "location": [0, 0, 1],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "materials": []
    }
  },
  "warnings": [],
  "next_steps": [
    "Run `blendops scene inspect` to verify scene state"
  ]
}
```

### lighting setup (studio)
```json
{
  "ok": true,
  "operation": "lighting.setup",
  "message": "Applied lighting preset 'studio'",
  "data": {
    "preset": "studio",
    "target": "test_cube",
    "lights": [
      "blendops_studio_light"
    ]
  },
  "warnings": [],
  "next_steps": [
    "Run `blendops scene inspect` to verify scene lighting"
  ]
}
```

### scene inspect (verification)
```json
{
  "ok": true,
  "operation": "scene.inspect",
  "message": "Scene inspection complete",
  "data": {
    "lights": [
      "blendops_studio_light",
      "Light"
    ],
    "objects": [
      {
        "name": "blendops_studio_light",
        "type": "LIGHT",
        "location": [2, -2.5, 4]
      },
      {
        "name": "test_cube",
        "type": "MESH",
        "location": [0, 0, 1]
      }
    ],
    "stats": {
      "object_count": 5,
      "mesh_count": 2
    }
  },
  "warnings": [],
  "next_steps": [
    "Use 'blendops object create' to add objects"
  ]
}
```

### lighting setup (target not found)
```json
{
  "ok": false,
  "operation": "lighting.setup",
  "message": "Target object `does_not_exist` not found",
  "data": {},
  "warnings": [],
  "next_steps": [
    "Run `blendops scene inspect` to list available objects"
  ]
}
```

## Pass / Fail verdict
- object create returns `ok: true`: **PASS**
- lighting.setup returns `ok: true`: **PASS**
- lighting.setup `data.preset === "studio"`: **PASS**
- lighting.setup `data.target === "test_cube"`: **PASS**
- lighting.setup `data.lights` includes `blendops_studio_light`: **PASS**
- scene inspect `data.lights` includes `blendops_studio_light`: **PASS**
- target-not-found test returns `ok: false`: **PASS**
- target-not-found test `operation === "lighting.setup"`: **PASS**
- target-not-found message indicates object not found: **PASS**
- target-not-found `next_steps` suggests scene inspect: **PASS**

Overall: **PASS**

## Notes
- Real Blender runtime execution succeeded using Blender background process with addon module `apps/blender-addon/blendops_addon/__init__.py` loaded.
- `blender --version` failed because Blender was not on PATH in this environment; runtime used full executable path.
- No feature-scope changes were introduced; this pass only records runtime evidence.
