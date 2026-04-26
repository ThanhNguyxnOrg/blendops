# Runtime Smoke Test Report

**Status**: PASS

**Date**: 2026-04-24

**Blender Version**: 4.2.5 LTS

**Scope**: Baseline bridge/status + scene.inspect + object.create runtime evidence.

**Pass/Fail Verdict**: PASS

---

## Date / Time
- 2026-04-24 21:38:09 -05:00

## Environment
- OS: Microsoft Windows 11 Enterprise
- Node: v22.20.0
- npm: 10.9.3
- Blender: Blender 4.2.5 LTS

## Commands run

```bash
git pull origin main
npm install
npm run clean
npm run typecheck
npm run build
```

Blender runtime sequence:

```bash
npm run cli -- bridge status
npm run cli -- scene inspect
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
npm run cli -- scene inspect
```

## JSON outputs

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

### scene inspect (before object create)
```json
{
  "ok": true,
  "operation": "scene.inspect",
  "message": "Scene inspection complete",
  "data": {
    "objects": [
      {
        "name": "Cube",
        "type": "MESH",
        "location": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1],
        "materials": ["Material"]
      },
      {
        "name": "Light",
        "type": "LIGHT",
        "location": [4.076245307922363, 1.0054539442062378, 5.903861999511719],
        "rotation": [0.6503279805183411, 0.055217113345861435, 1.8663908243179321],
        "scale": [1, 1, 1],
        "materials": []
      },
      {
        "name": "Camera",
        "type": "CAMERA",
        "location": [7.358891487121582, -6.925790786743164, 4.958309173583984],
        "rotation": [1.1093189716339111, 0, 0.8149281740188599],
        "scale": [1, 1, 1],
        "materials": []
      }
    ],
    "cameras": ["Camera"],
    "lights": ["Light"],
    "materials": ["Dots Stroke", "Material"],
    "active_camera": "Camera",
    "stats": {
      "object_count": 3,
      "mesh_count": 1
    }
  },
  "warnings": [],
  "next_steps": ["Use 'blendops object create' to add objects"]
}
```

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

### scene inspect (after object create)
```json
{
  "ok": true,
  "operation": "scene.inspect",
  "message": "Scene inspection complete",
  "data": {
    "objects": [
      {
        "name": "Cube",
        "type": "MESH",
        "location": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1],
        "materials": ["Material"]
      },
      {
        "name": "Light",
        "type": "LIGHT",
        "location": [4.076245307922363, 1.0054539442062378, 5.903861999511719],
        "rotation": [0.6503279805183411, 0.055217113345861435, 1.8663908243179321],
        "scale": [1, 1, 1],
        "materials": []
      },
      {
        "name": "Camera",
        "type": "CAMERA",
        "location": [7.358891487121582, -6.925790786743164, 4.958309173583984],
        "rotation": [1.1093189716339111, 0, 0.8149281740188599],
        "scale": [1, 1, 1],
        "materials": []
      },
      {
        "name": "test_cube",
        "type": "MESH",
        "location": [0, 0, 1],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1],
        "materials": []
      }
    ],
    "cameras": ["Camera"],
    "lights": ["Light"],
    "materials": ["Dots Stroke", "Material"],
    "active_camera": "Camera",
    "stats": {
      "object_count": 4,
      "mesh_count": 2
    }
  },
  "warnings": [],
  "next_steps": ["Use 'blendops object create' to add objects"]
}
```

## Pass / Fail verdict
- bridge status: **PASS**
- scene inspect (before): **PASS**
- object create: **PASS**
- scene inspect (after): **PASS**
- final inspect contains `test_cube`: **PASS**

Overall: **PASS**

## Notes (manual/runtime steps)
- Blender was installed from official mirror because `winget` direct blender.org downloads returned HTTP 403 in this environment.
- Runtime smoke test executed against real Blender process with addon module loaded from `apps/blender-addon/blendops_addon`.
- Minimal runtime bugfixes were required in addon bridge command handling for background mode:
  - direct command execution path in background mode to avoid timer queue timeout
  - object lookup switched from `bpy.context.active_object` to `bpy.context.view_layer.objects.active`
