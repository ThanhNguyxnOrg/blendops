# 🧪 Manual Test Guide

> 📚 Docs: [Index](./README.md) · [Install](./install.md) · [AI usage](./ai-agent-usage.md) · [Manual test](./manual-test.md) · [Observability](./observability.md)

Practical runtime verification guide for BlendOps operations.

## ✅ Prerequisites

- Node.js >= 18
- Blender >= 3.6
- Blender 4.2.5 LTS used for current runtime evidence
- Run from repo root

```bash
npm install
npm run clean
npm run typecheck
npm run build
```

## 🎛️ Start the bridge

### Primary path: automated managed CLI bootstrap

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge operations --verbose
```

Windows path override:

```bash
node apps/cli/dist/index.js bridge start --mode gui --blender "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --verbose
```

### Fallback path: manual addon enablement

If automated startup fails:

1. Open Blender
2. Edit → Preferences → Add-ons → Install...
3. Select `apps/blender-addon/blendops_addon`
4. Enable **BlendOps Bridge**
5. Verify:

```bash
node apps/cli/dist/index.js bridge status --verbose
```

## 🧰 Strict stdout JSON rule

Use built CLI directly for tests where stdout must parse as JSON:

```bash
node apps/cli/dist/index.js ...
```

Avoid npm wrapper output as JSON-only proof:

```bash
npm run cli -- ...
```

`npm run` may emit wrapper lines that pollute stdout.

## ✅ Quick health checks

```bash
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js scene inspect --verbose
```

Expected:

- `ok: true`
- correct operation name
- top-level `request_id` and `receipt` present when provided by bridge/client
- stderr includes command/completed logs in verbose mode

## 🔁 Full validation sequence

```bash
node apps/cli/dist/index.js object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
node apps/cli/dist/index.js object transform --name test_cube --location 1,0,1
node apps/cli/dist/index.js undo last --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
node apps/cli/dist/index.js material apply --object test_cube --material red_plastic
node apps/cli/dist/index.js lighting setup --preset studio --target test_cube
node apps/cli/dist/index.js camera set --target test_cube --distance 5 --focal-length 50
node apps/cli/dist/index.js render preview --output renders/preview.png --width 512 --height 512 --samples 16
node apps/cli/dist/index.js validate scene --preset basic
node apps/cli/dist/index.js validate scene --preset game_asset
node apps/cli/dist/index.js validate scene --preset render_ready
node apps/cli/dist/index.js export asset --format glb --output exports/test_scene.glb
```

`undo.last` may return `ok: false` with `No undo step available` when Blender has no undo step in current context. Treat that as verified safe-failure behavior, not a successful undo.

## 🧾 Bridge logs and stop

```bash
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge stop
```

Optional destructive stop:

```bash
node apps/cli/dist/index.js bridge stop --all
```

`--all` can terminate unrelated Blender sessions.

## 🧯 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `bridge start` fails | Blender executable not found | pass `--blender` or set `BLENDOPS_BLENDER_PATH` |
| `bridge status` fails | bridge not running | run `bridge start`, then inspect `bridge logs` |
| JSON parsing fails | npm wrapper output mixed in stdout | use `node apps/cli/dist/index.js ...` |
| GLB export fails in background mode | missing GUI window context on Blender 4.2 | use GUI bridge mode |
| Runtime artifacts appear in git | generated files present | do not commit `.tmp/`, `exports/`, `renders/` |

## Cleanup

```bash
node apps/cli/dist/index.js bridge stop
```

If unresponsive:

```powershell
Get-Process blender -ErrorAction SilentlyContinue | Stop-Process -Force
```
