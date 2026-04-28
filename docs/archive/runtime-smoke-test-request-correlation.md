# Runtime Smoke Test Report - Request Correlation

**Status**: FAIL

**Date**: 2026-04-26

**Blender Version**: 4.2.5 LTS

**Scope**: Request ID and operation receipt propagation across CLI stdout JSON, stderr verbose logs, and bridge console logs.

**Pass/Fail Verdict**: FAIL - Bridge runtime not reachable in automated background mode

---

## Date / Time
- 2026-04-26 04:30:59 -05:00

## Environment
- OS: Microsoft Windows 11 Enterprise
- Node: v22.20.0
- npm: 10.9.3
- Blender: Blender 4.2.5 LTS

## Runtime Mode Attempted
- **Background bridge mode** (automated startup via `blender --background --python`)

## Commands Attempted

```bash
npm run cli -- bridge status --verbose
npm run cli -- bridge operations --verbose
npm run cli -- scene inspect --verbose
```

## Failure Summary

Bridge process started and printed startup banner but was not reachable on `http://127.0.0.1:8765`. All CLI commands failed with `fetch failed` connection errors.

### Bridge startup evidence

`D:\Code\blendops\.tmp\smoke\bridge.stdout.log`:
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
[BlendOps 2026-04-26 03:49:28] ready and waiting for commands
Bridge started, keeping process alive...
```

`D:\Code\blendops\.tmp\smoke\bridge.stderr.log`:
```
TBBmalloc: skip allocation functions replacement in ucrtbase.dll: unknown prologue for function _msize
```

### CLI command result (bridge status)

`D:\Code\blendops\.tmp\smoke\bridge-status-exact.stdout.json`:
```json
{
  "ok": false,
  "operation": "bridge.error",
  "message": "Failed to connect to Blender bridge: fetch failed",
  "data": {},
  "warnings": [
    "Blender bridge might not be running",
    "Connection timed out or was refused"
  ],
  "next_steps": [
    "Start Blender and enable BlendOps addon bridge",
    "Run `blendops bridge status` to verify connection"
  ],
  "request_id": "req_1777195859097_g1havcdis",
  "receipt": {
    "request_id": "req_1777195859097_g1havcdis",
    "operation": "bridge.status",
    "ok": false,
    "duration_ms": 24
  }
}
```

`D:\Code\blendops\.tmp\smoke\bridge-status-exact.stderr.log`:
```
[BlendOps 04:30:59] command: bridge.status request_id=req_1777195859097_g1havcdis
[BlendOps 04:30:59] bridge request start: bridge.status /status request_id=req_1777195859097_g1havcdis
[BlendOps 04:30:59] bridge target: http://127.0.0.1:8765/status
[BlendOps 04:30:59] bridge connection error: bridge.status /status duration=24ms error=fetch failed request_id=req_1777195859097_g1havcdis
[BlendOps 04:30:59] completed: bridge.status failed 39ms request_id=req_1777195859097_g1havcdis
```

## Verification Results

### Stdout JSON structure (CLI error response)
- ✅ stdout contains valid JSON only (after npm wrapper lines)
- ✅ JSON contains top-level `request_id`
- ✅ JSON contains top-level `receipt`
- ✅ `receipt.request_id` equals top-level `request_id`
- ✅ `receipt.operation` matches command operation (`bridge.status`)
- ✅ `receipt.ok` matches response `ok` (both `false`)
- ✅ `receipt.duration_ms` exists (24ms)

### Stderr verbose logs (CLI side)
- ✅ stderr logs include same `request_id` as stdout JSON
- ✅ stderr shows operation lifecycle: command start, target URL, error, completion
- ✅ request_id appears in all relevant log lines

### Bridge console logs (bridge side)
- ❌ No bridge-side request handling logs captured
- ❌ Bridge process exited immediately after startup in background mode
- ❌ No evidence of request_id correlation on bridge side

### Bridge status data.last_request_id
- ❌ Not verified - bridge was unreachable

## Root Cause

Blender background mode (`--background`) exits immediately after the Python script completes, even when:
- HTTP server thread is started with `daemon=True`
- Blender timers are registered with `persistent=True`
- Python script includes infinite loop (`while True: time.sleep(1)`)

The bridge prints its startup banner and "ready" message, but the process terminates before accepting any HTTP connections. This is a known limitation of Blender's background mode when used with long-running server processes.

## Limitations

- **Background bridge mode is not viable** for runtime smoke tests requiring persistent HTTP server
- **GUI bridge mode is required** for full runtime validation (as documented in `docs/manual-test.md`)
- This smoke test could not verify:
  - Bridge-side request_id correlation in console logs
  - `data.last_request_id` updates after commands
  - Multi-command request correlation across bridge lifecycle

## Recommendations

1. **Use GUI bridge mode** for request correlation smoke tests:
   - Manually open Blender
   - Install and enable BlendOps Bridge addon
   - Keep Blender window open during test
   - Capture bridge console output manually or via Blender's console redirect

2. **Document background mode limitation** explicitly:
   - Background mode works for single-shot operations (if bridge could stay alive)
   - Background mode does NOT work for persistent HTTP server in current implementation
   - GUI mode is the validated runtime path for all smoke tests

3. **Consider alternative approaches** for automated testing:
   - Blender GUI mode with headless X server (Linux)
   - Blender GUI mode with virtual display (Xvfb)
   - Refactor bridge to use Blender's built-in server capabilities (if available)

## Verdict

**FAIL** - Runtime smoke test could not be completed due to bridge runtime unavailability in automated background mode.

Request ID and receipt propagation **works correctly on CLI side** (stdout JSON and stderr logs show proper correlation), but **bridge-side verification was blocked** by runtime limitation.

---

## Evidence Files

- `D:\Code\blendops\.tmp\smoke\bridge.stdout.log`
- `D:\Code\blendops\.tmp\smoke\bridge.stderr.log`
- `D:\Code\blendops\.tmp\smoke\bridge-status-exact.stdout.log`
- `D:\Code\blendops\.tmp\smoke\bridge-status-exact.stderr.log`
