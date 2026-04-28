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

For parseable JSON output, prefer separate stdout/stderr redirects over `Tee-Object`:

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose 1> .tmp/start.stdout.json 2> .tmp/start.stderr.log
```

This ensures clean JSON in stdout and avoids pipeline buffering issues.

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
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js scene clear --confirm CLEAR_SCENE --dry-run --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js scene clear --confirm CLEAR_SCENE --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js batch plan --file examples/batch/basic-scene.json --verbose
node apps/cli/dist/index.js batch plan --file examples/batch/invalid-arbitrary-code.json --verbose
node apps/cli/dist/index.js batch plan --file examples/batch/invalid-scene-clear.json --verbose
node apps/cli/dist/index.js batch plan --file examples/batch/invalid-object-create.json --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --dry-run --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm WRONG --dry-run-id x --plan-fingerprint y --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --dry-run-id x --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --plan-fingerprint y --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --dry-run-id <id> --plan-fingerprint <sha256:...> --verbose
```

`undo.last` may return `ok: false` with `No undo step available` when Blender has no undo step in current context. Treat that as verified safe-failure behavior, not a successful undo.

`scene.clear` is destructive and requires exact `--confirm CLEAR_SCENE`. Without this exact token, CLI returns `cli.invalid_arguments` and no bridge call is made.

`scene.clear --dry-run` reports what would be removed and must not mutate scene state; verify object count is unchanged before running the real clear.

`batch.execute` supports dry-run preview and a guarded first real execution path.

- Dry-run: `--dry-run` validates and previews without executing.
- Real mode requires **all** gates: `--confirm EXECUTE_BATCH`, `--dry-run-id`, `--plan-fingerprint`.
- Missing/wrong real gates must return `cli.invalid_arguments` locally with no bridge call.

## 🧾 Bridge logs and stop

```bash
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge stop
```

For long JSON responses during troubleshooting, redirect to `.tmp` files and summarize key fields:

```bash
node apps/cli/dist/index.js bridge status --verbose > .tmp/stabilize/bridge-status.json
node apps/cli/dist/index.js bridge logs --tail 40 > .tmp/stabilize/bridge-logs.json
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --dry-run > .tmp/stabilize/batch-dry-run.json
```

Then inspect only key fields such as `ok`, `operation`, `request_id`, `warnings`, and `next_steps`.

`bridge start` returning `ok: true` means managed startup succeeded; Blender GUI remaining open is expected while bridge is running.

Do not wait for Blender to exit after successful `bridge start`; use `bridge status`/`bridge logs` to determine readiness instead.

`bridge start` should exit cleanly after returning `ok: true`. If the command outputs `ok: true` but does not return control to the shell, that is a bug in process detachment.

Use lifecycle recovery sequence when bridge state is unclear:

```bash
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge stop
node apps/cli/dist/index.js bridge start --mode gui --verbose
```

Stale-process symptoms include persistent "already in use" behavior, status mismatch, or unresponsive bridge commands after previous runs.

If stale behavior persists after `bridge stop`, terminate stale Blender processes and retry start.

```powershell
Get-Process blender -ErrorAction SilentlyContinue | Stop-Process -Force
```

Do this only for local recovery when the managed stop path does not recover the bridge.

Optional destructive stop remains available:

```bash
node apps/cli/dist/index.js bridge stop --all
```

`--all` can terminate unrelated Blender sessions.

## 🧯 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `MODULE_NOT_FOUND` error | CLI run outside repo root | `cd` into repo root before running CLI |
| `bridge start` fails | Blender executable not found | pass `--blender` or set `BLENDOPS_BLENDER_PATH` |
| `bridge start` returns ok but Blender stays open | Expected behavior in GUI mode | This is correct - bridge runs inside Blender; use `bridge status` to verify readiness |
| `bridge status` fails | bridge not running | run `bridge start`, then inspect `bridge logs` |
| Stale bridge process/port conflict | Previous bridge not stopped cleanly | `bridge stop` or manually kill Blender process, then restart |
| JSON parsing fails | npm wrapper output mixed in stdout | use `node apps/cli/dist/index.js ...` |
| Long runtime JSON too noisy in terminal | raw JSON too large for manual review | redirect output to `.tmp/stabilize/*.json` and summarize key fields |
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

For repo-root mistakes (`MODULE_NOT_FOUND`), rerun from repo root before retrying commands.
