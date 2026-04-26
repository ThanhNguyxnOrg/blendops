# Runtime Smoke Test Report - material slice

**Status**: PASS

**Date**: 2026-04-24

**Blender Version**: 4.2.5 LTS

**Scope**: object.create + material.create + material.apply + scene.inspect verification.

**Pass/Fail Verdict**: PASS

---

## Date / Time
- 2026-04-24 22:24:27 -05:00

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
npm run cli -- material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
npm run cli -- material apply --object test_cube --material red_plastic
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

### material create
```json
{
  "ok": true,
  "operation": "material.create",
  "message": "Created material 'red_plastic'",
  "data": {
    "material": {
      "name": "red_plastic",
      "color": [1, 0, 0, 1],
      "roughness": 0.5,
      "metallic": 0
    }
  },
  "warnings": [],
  "next_steps": [
    "Run `blendops material apply` to assign material to an object"
  ]
}
```

### material apply
```json
{
  "ok": true,
  "operation": "material.apply",
  "message": "Applied material 'red_plastic' to 'test_cube'",
  "data": {
    "object": {
      "name": "test_cube",
      "type": "MESH",
      "location": [0, 0, 1],
      "rotation": [0, 0, 0],
      "scale": [1, 1, 1],
      "materials": ["red_plastic"]
    },
    "material": {
      "name": "red_plastic"
    }
  },
  "warnings": [],
  "next_steps": [
    "Run `blendops scene inspect` to verify material assignment"
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
        "location": [0, 0, 1],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1],
        "materials": ["red_plastic"]
      }
    ],
    "materials": ["Dots Stroke", "Material", "red_plastic"]
  },
  "warnings": [],
  "next_steps": ["Use 'blendops object create' to add objects"]
}
```

## Pass / Fail verdict
- object create: **PASS**
- material create: **PASS**
- material apply: **PASS**
- scene inspect confirms test_cube materials contains red_plastic: **PASS**

Overall: **PASS**

## Notes
- Runtime test executed using real Blender bridge process in background mode.
- Existing `docs/runtime-smoke-test.md` preserved as historical evidence.
