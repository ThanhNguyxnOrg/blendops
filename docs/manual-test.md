# Manual Test Guide

This guide verifies the current MVP vertical slices:

- `blendops bridge status`
- `blendops scene inspect`
- `blendops object create`
- `blendops object transform`
- `blendops material create`
- `blendops material apply`
- `blendops lighting setup`
- `blendops camera set`
- `blendops render preview`

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

## 7) Transform object

```bash
npm run cli -- object transform --name test_cube --location 1,0,1
```

Expected:
- `ok: true`
- `operation: "object.transform"`
- `data.object.name === "test_cube"`
- `data.object.location === [1,0,1]`

## 8) Create material

```bash
npm run cli -- material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
```

Expected:
- `ok: true`
- `operation: "material.create"`
- `data.material.name === "red_plastic"`

## 9) Apply material to object

```bash
npm run cli -- material apply --object test_cube --material red_plastic
```

Expected:
- `ok: true`
- `operation: "material.apply"`
- `data.object.name === "test_cube"`
- `data.object.materials` contains `"red_plastic"`

## 10) Set up lighting preset

```bash
npm run cli -- lighting setup --preset studio --target test_cube
```

Expected:
- `ok: true`
- `operation: "lighting.setup"`
- `data.preset === "studio"`
- `data.target === "test_cube"`
- `data.lights` includes `"blendops_studio_light"`

## 11) Set camera targeting test object

```bash
npm run cli -- camera set --target test_cube --distance 5 --focal-length 50
```

Expected:
- `ok: true`
- `operation: "camera.set"`
- `data.camera.name === "blendops_camera"`
- `data.active_camera === "blendops_camera"`

## 12) Render preview

```bash
npm run cli -- render preview --output renders/preview.png --width 512 --height 512 --samples 16
```

Expected:
- `ok: true`
- `operation: "render.preview"`
- `data.output === "renders/preview.png"`
- `data.width === 512`
- `data.height === 512`
- `data.samples === 16`
- `data.camera === "blendops_camera"`

## 13) Inspect scene again and confirm material + lighting + camera assignment

```bash
npm run cli -- scene inspect
```

Expected:
- `ok: true`
- `operation: "scene.inspect"`
- `data.objects` contains an object with `name: "test_cube"`
- `test_cube.location` is `[1,0,1]`
- `test_cube.materials` contains `"red_plastic"`
- `data.lights` includes `"blendops_studio_light"`
- `data.cameras` includes `"blendops_camera"`
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

### Transform target not found
- Symptom: `Object `name` not found`
- Fix: Run `npm run cli -- scene inspect` and use an existing object name

### Invalid material color
- Symptom: `Invalid color value`
- Fix: Use `--color "#RRGGBB"` or `#RRGGBBAA`

### Material/object not found for apply
- Symptom: `Object `<name>` not found` or `Material `<name>` not found`
- Fix: Run `scene inspect` for object names and `material create` before apply
