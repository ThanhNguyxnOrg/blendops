# Manual Test Guide

This guide verifies the current MVP vertical slices:

- `blendops bridge status`
- `blendops scene inspect`
- `blendops object create`

## 1) Install dependencies

```bash
npm install
```

## 2) Clean + build packages

```bash
npm run clean
npm run typecheck
npm run build
```


## 3) Start Blender bridge addon

1. Open Blender (3.6+)
2. Install addon from `apps/blender-addon/blendops_addon`
3. Enable **BlendOps Bridge** addon
4. Confirm console prints bridge startup on `http://127.0.0.1:8765`

## 4) Verify bridge status

```bash
npm run cli -- bridge status
```

Expected JSON shape:

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

## 5) Inspect scene

```bash
npm run cli -- scene inspect
```

Expected:
- `ok: true`
- `operation: "scene.inspect"`
- `data.objects` array present
- `data.stats.object_count` number present

## 6) Create primitive object

```bash
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
```

Expected:
- `ok: true`
- `operation: "object.create"`
- `data.object.name === "test_cube"`

## Common failures

### Bridge not running
- Symptom: `Failed to connect to Blender bridge`
- Fix: Enable addon in Blender and verify port `8765`

### Addon not enabled
- Symptom: `bridge status` fails even with Blender open
- Fix: Ensure **BlendOps Bridge** checkbox is enabled in Blender Add-ons

### Unsupported primitive type
- Symptom: `Unsupported primitive type`
- Fix: Use one of: `cube`, `uv_sphere`, `ico_sphere`, `cylinder`, `cone`, `torus`, `plane`
