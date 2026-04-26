# 👀 Observability Guide

BlendOps is designed for **machine-readable output** and **human-visible progress** simultaneously.

---

## 📋 Output contract

### CLI stdout: JSON only

BlendOps CLI stdout is reserved for structured JSON responses:

- AI/MCP/tooling integrations can parse output reliably
- Scripts can use stdout directly without filtering logs
- Error envelopes stay consistent and automatable

### CLI stderr: human logs

Human progress/status logs are sent to stderr:

- **stdout**: response JSON only
- **stderr**: progress, timing, diagnostics

This separation makes behavior predictable and parseable.

---

## 🖥️ Blender bridge console

### What the console shows

The Blender bridge console is a **human activity log**:

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
[BlendOps 2026-04-25 09:01:10] received: render.preview
[BlendOps 2026-04-25 09:01:14] completed: render.preview ok 4012ms
[BlendOps 2026-04-25 09:01:14] output: renders/preview.png
```

### Why the console must stay open

The bridge HTTP server runs in that Blender process. Closing the window stops the bridge.

---

## ✅ Verify bridge health

### Via CLI

```bash
npm run cli -- bridge status --verbose
```

**Expected:**

- stdout: valid JSON response (`operation: "bridge.status"`)
- stderr: progress logs (with `--verbose`)
- JSON `data` includes:
  - `started_at`
  - `uptime_seconds`
  - `request_count`
  - `last_operation`
  - `last_error`
  - `last_duration_ms`
  - `implemented_operations`

### Via browser

Open: `http://127.0.0.1:8765/status`

Bridge console will log: `[BlendOps ...] status check ok`

---

## 🔍 CLI visibility modes

### Verbose mode

```bash
npm run cli -- scene inspect --verbose
npm run cli -- validate scene --preset basic --verbose
```

With `--verbose`, CLI prints operation start/completion timing on stderr while keeping stdout JSON-only.

### Quiet mode

```bash
npm run cli -- validate scene --preset basic --quiet
```

`--quiet` suppresses human logs on stderr (except unavoidable runtime failures). Stdout remains JSON.

---

## 📝 Optional log file

Mirror human logs to a file:

```bash
set BLENDOPS_LOG_FILE=.tmp/blendops.log
npm run cli -- render preview --output renders/preview.png --verbose
```

Log-file failures are non-fatal; commands continue even if file logging cannot write.

---

## 🔌 MCP server observability

Enable MCP stderr logs:

```bash
set BLENDOPS_MCP_VERBOSE=1
# or
set BLENDOPS_VERBOSE=1
npm run mcp-server
```

MCP responses remain protocol-valid. Logs are emitted only to stderr.

---

## 🧯 Troubleshooting

### If a command appears stuck

1. Check bridge liveness:
   ```bash
   npm run cli -- bridge status --verbose
   ```
2. Confirm Blender bridge console is still open
3. Re-run the command with `--verbose` to inspect progress timing
4. If using MCP, enable `BLENDOPS_MCP_VERBOSE=1` and inspect stderr

### Common issues

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Command hangs | Bridge not responding | Check bridge console for errors; restart Blender |
| JSON parse error | Stdout contaminated with logs | Verify logs go to stderr only |
| Bridge console closed | Process terminated | Restart Blender and enable addon |
| Slow operations | Heavy scene or low samples | Check bridge console for timing; adjust parameters |

---

## 🔎 Inspect logs

- **CLI stdout**: parseable JSON response
- **CLI stderr**: human progress logs
- **Bridge console**: per-operation start/end/failure logs with duration
- **Optional file**: `BLENDOPS_LOG_FILE` mirror

---

## 🛑 Kill/restart bridge (Windows)

If Blender is unresponsive:

```powershell
Get-Process blender -ErrorAction SilentlyContinue | Stop-Process -Force
```

Then restart Blender, enable the BlendOps addon, and verify:

```bash
npm run cli -- bridge status --verbose
```

---

## 🧑‍💻 For contributors: adding new operations

To ensure future operations are observable by default:

1. Register the operation handler in the bridge operation registry
2. Use the centralized dispatcher path (do not bypass it)
3. Do not print human logs to CLI stdout
4. Use stderr logger wiring for human progress logs

When registered in the bridge registry, operation start/end logging, duration, and bridge metadata updates are automatic.
