# Observability in BlendOps

BlendOps is designed for **machine-readable output** and **human-visible progress** at the same time.

## Output contract

### Why CLI stdout stays JSON

BlendOps CLI stdout is reserved for structured JSON responses so:

- AI/MCP/tooling integrations can parse output reliably.
- Scripts can use stdout directly without filtering logs.
- Error envelopes stay consistent and automatable.

### Why human logs go to stderr

Human progress/status logs are sent to stderr so they do not corrupt stdout JSON.
This separation makes behavior predictable:

- **stdout**: response JSON only
- **stderr**: progress, timing, diagnostics

## Blender bridge console behavior

### What the Blender console shows

The Blender bridge console is a **human activity log** that shows:

- Startup banner with URL and example commands
- Operation logs: `received: scene.inspect`, `completed: scene.inspect ok 45ms`
- Status checks: `status check ok`
- Failures with reasons: `failed: export.asset 1850ms`, `reason: No mesh objects found`
- Harmless browser checks: `ignored unsupported GET /favicon.ico`

### Normal console output examples

```
============================================================
 BlendOps Bridge is running
 Version: 0.1.0
 URL: http://127.0.0.1:8765
 Status page: http://127.0.0.1:8765/status

 Keep this window open while using BlendOps.

 Try:
   npm run cli -- bridge status
   npm run cli -- scene inspect --verbose

 This window will show BlendOps operation logs.
============================================================
[BlendOps 2026-04-25 09:00:00] ready and waiting for commands
[BlendOps 2026-04-25 09:00:15] received: scene.inspect
[BlendOps 2026-04-25 09:00:15] completed: scene.inspect ok 8ms
[BlendOps 2026-04-25 09:00:15] status: alive | requests=1 | last=scene.inspect | last_error=none
[BlendOps 2026-04-25 09:01:10] received: render.preview
[BlendOps 2026-04-25 09:01:14] completed: render.preview ok 4012ms
[BlendOps 2026-04-25 09:01:14] output: renders/preview.png
[BlendOps 2026-04-25 09:01:14] status: alive | requests=2 | last=render.preview | last_error=none
```

### Why the console must stay open

The bridge HTTP server runs in that Blender process. Closing the window stops the bridge and commands will fail to connect.

### Harmless browser checks

If you open `http://127.0.0.1:8765/status` in a browser, you may see:
```
[BlendOps 2026-04-25 09:02:00] status check ok
[BlendOps 2026-04-25 09:02:00] ignored unsupported GET /favicon.ico
```

These are harmless. The bridge correctly handles browser requests and ignores favicon lookups.

## Verify bridge health

### Via CLI

```bash
npm run cli -- bridge status --verbose
```

Expected:

- stdout: valid JSON response (`operation: "bridge.status"`)
- stderr: progress logs
- JSON `data` includes runtime bridge metadata:
  - `started_at`
  - `uptime_seconds`
  - `request_count`
  - `last_operation`
  - `last_error`
  - `last_duration_ms`
  - `implemented_operations`

### Via browser

Open in your browser:
```
http://127.0.0.1:8765/status
```

You'll see JSON status response and the bridge console will log:
```
[BlendOps 2026-04-25 09:02:00] status check ok
```

## Run commands with visibility

```bash
npm run cli -- scene inspect --verbose
npm run cli -- validate scene --preset basic --verbose
npm run cli -- render preview --output renders/preview.png --verbose
```

With `--verbose`, CLI prints operation start/completion timing on stderr while keeping stdout JSON-only.

## Use quiet mode

```bash
npm run cli -- validate scene --preset basic --quiet
```

`--quiet` suppresses human logs on stderr (except unavoidable runtime failures), while stdout remains JSON.

## Optional log file

You can mirror human logs to a file:

```bash
set BLENDOPS_LOG_FILE=.tmp/blendops.log
npm run cli -- render preview --output renders/preview.png --verbose
```

Log-file failures are non-fatal; commands continue even if file logging cannot write.

## MCP server observability

Enable MCP stderr logs with either env var:

```bash
set BLENDOPS_MCP_VERBOSE=1
# or
set BLENDOPS_VERBOSE=1
npm run mcp-server
```

MCP responses remain protocol-valid. Logs are emitted only to stderr.

## If a command appears stuck

1. Check bridge liveness:
   ```bash
   npm run cli -- bridge status --verbose
   ```
2. Check whether Blender bridge console is still open.
3. Re-run the command with `--verbose` to inspect progress timing.
4. If using MCP, enable `BLENDOPS_MCP_VERBOSE=1` and inspect stderr.

## Inspect bridge logs/stdout/stderr

- **CLI stdout**: parseable JSON response
- **CLI stderr**: human progress logs
- **Bridge console**: per-operation start/end/failure logs with duration
- **Optional file**: `BLENDOPS_LOG_FILE` mirror

## Kill/restart Blender bridge on Windows

If Blender is unresponsive:

```powershell
tasklist | findstr /I blender
taskkill /IM blender.exe /F
```

Then restart Blender, ensure the BlendOps addon is enabled, and verify:

```bash
npm run cli -- bridge status --verbose
```

## Adding new operations

To ensure future operations are observable by default:

1. Register the operation handler in the bridge operation registry.
2. Use the centralized dispatcher path (do not bypass it).
3. Do not print human logs to CLI stdout.
4. Use stderr logger wiring for human progress logs.

When registered in the bridge registry, operation start/end logging, duration, and bridge metadata updates are automatic.
