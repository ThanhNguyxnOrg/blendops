# Runtime Smoke Test Report - object.transform

**Status**: PASS

**Date**: 2026-04-24

**Blender Version**: 4.2.5 LTS

**Scope**: object.create + object.transform + scene.inspect verification.

**Pass/Fail Verdict**: PASS

---

## Date / Time
- 2026-04-24 21:59:57 -05:00

## Environment
- OS: Microsoft Windows 11 Enterprise
- Node: v22.20.0
- npm: 10.9.3
- Blender: Blender 4.2.5 LTS

## Commands run

```bash
npm install
npm run clean
npm run typecheck
npm run build
```

Blender runtime sequence:

```bash
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
npm run cli -- object transform --name test_cube --location 1,0,1
npm run cli -- scene inspect
```

## JSON outputs

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

### object transform
```json
{
  "ok": true,
  "operation": "object.transform",
  "message": "Transformed object 'test_cube'",
  "data": {
    "object": {
      "name": "test_cube",
      "type": "MESH",
      "location": [1, 0, 1],
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

### scene inspect (verification)
```json
{
  "ok": true,
  "operation": "scene.inspect",
  "message": "Scene inspection complete",
  "data": {
    "objects": [
      {
        "name": "test_cube",
        "type": "MESH",
        "location": [1, 0, 1],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1],
        "materials": []
      }
    ]
  },
  "warnings": [],
  "next_steps": ["Use 'blendops object create' to add objects"]
}
```

## Pass / Fail verdict
- object create: **PASS**
- object transform: **PASS**
- scene inspect confirms test_cube location [1,0,1]: **PASS**

Overall: **PASS**

## Notes
- Runtime test executed using real Blender bridge process in background mode.
- Existing `docs/runtime-smoke-test.md` was preserved as historical evidence for previous MVP run.
