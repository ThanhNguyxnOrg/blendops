# 📚 Manual Test Guide

Practical manual verification guide for currently supported BlendOps operations.

## 🧰 Prerequisites

- Node.js >=18
- Blender >=3.6
- Blender 4.2.5 LTS was used for current runtime evidence
- Run from repo root (`D:\Code\blendops` on Windows examples below):

```bash
npm install
npm run clean
npm run typecheck
npm run build
```

## 🎛️ Starting the Blender bridge

### GUI bridge mode

- Recommended for full runtime validation.
- Required for GLB/GLTF export on Blender 4.2.
- Keep Blender + bridge console window open while testing.

### Background bridge mode

- Useful for quick non-export checks.
- Can run many operations (inspect/create/transform/material/lighting/camera/validate).
- Not validated for GLB/GLTF export on Blender 4.2 because glTF exporter needs window context.

- A black Blender console window on Windows is expected.
- Do not close it during tests (it hosts the running bridge process).

## ✅ Quick health checks

Verify bridge connectivity before running full test sequence:

```bash
npm run cli -- bridge status --verbose
npm run cli -- scene inspect --verbose
```

**Expected outcomes:**

- `bridge status`: `ok: true`, `operation: "bridge.status"`, `data.version` present
- `scene inspect`: `ok: true`, `operation: "scene.inspect"`, `data.objects` array present
- CLI stdout contains valid JSON only
- CLI stderr shows timing logs (with `--verbose`)
- Bridge console shows operation lifecycle logs

## 🧪 Full validation sequence

Run the complete operation chain to verify end-to-end functionality:

```bash
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
npm run cli -- object transform --name test_cube --location 1,0,1
npm run cli -- material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
npm run cli -- material apply --object test_cube --material red_plastic
npm run cli -- lighting setup --preset studio --target test_cube
npm run cli -- camera set --target test_cube --distance 5 --focal-length 50
npm run cli -- render preview --output renders/preview.png --width 512 --height 512 --samples 16
npm run cli -- validate scene --preset basic
npm run cli -- validate scene --preset game_asset
npm run cli -- validate scene --preset render_ready
npm run cli -- export asset --format glb --output exports/test_scene.glb
```

**Pass criteria:**

- All commands return `ok: true`
- Each operation name matches the command
- `data` object contains expected fields per operation
- No unhandled errors in bridge console
- Generated files exist where specified (`renders/`, `exports/`)

---

## 📦 Export verification

After running export commands, verify generated files:

```powershell
Test-Path D:\Code\blendops\exports\test_scene.glb
Get-Item D:\Code\blendops\exports\test_scene.glb | Select-Object FullName,Length
```

**Expected:**

- File exists: `True`
- `Length` > 0 bytes
- Generated exports must **not** be committed to git

---

## 🧯 Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `bridge status` fails | Bridge not running | Start Blender, enable BlendOps Bridge addon |
| Black console appears | Bridge process running | Keep it open (hosts HTTP server) |
| `package.json` missing error | Wrong working directory | `cd D:\Code\blendops` |
| GLB export fails in `-b` mode | Missing window context | Use GUI bridge mode instead |
| Stdout contains logs mixed with JSON | Logging regression | Logs must go to stderr only |
| Generated files in `git status` | Runtime artifacts staged | Do not commit `exports/`, `renders/`, `.tmp/` |

---

## 🧹 Cleanup

Stop Blender bridge process:

```powershell
Get-Process blender -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 🔎 Notes

- This guide intentionally stays concise.
- For operation-by-operation runtime evidence JSON, see `docs/runtime-smoke-test-*.md`.
- Export runtime PASS for GLB is validated in Blender 4.2.5 LTS **GUI bridge mode**.
