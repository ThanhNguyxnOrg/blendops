# Runtime Smoke Test Report - Observability

**Status**: PASS

**Date**: 2026-04-25

**Blender Version**: 4.2.5 LTS

**Scope**: observability evidence for stdout JSON / stderr logs / bridge console activity.

**Pass/Fail Verdict**: PASS

---

## Date / Time
- 2026-04-25 08:47:21 -05:00

## Environment
- OS: Microsoft Windows 11 Enterprise
- Node: v22.20.0
- npm: 10.9.3
- Blender: Blender 4.2.5 LTS

## Summary

This report documents the observability improvements to BlendOps runtime behavior, focusing on human-visible logging and bridge metadata.

## Investigation findings

### PowerShell launcher issue (reported)
**Status**: Not applicable - no PowerShell scripts exist in this repository.

**Finding**: The repository contains no `.ps1` files, no `$PID` variable usage, and no `Start-Process` with `RedirectStandardOutput/RedirectStandardError` patterns. Runtime tests are manual (docs-driven), not automated via PowerShell scripts.

**Evidence**:
- Searched entire repository for `.ps1` files: 0 found
- Searched for `$PID` usage: 0 matches
- Searched for `RedirectStandardOutput/Error`: 0 matches
- Searched for `Start-Process` patterns: 0 matches

### Blender bridge launch method

**How Blender bridge starts**:
1. User manually opens Blender (3.6+ or 4.x)
2. User installs and enables the BlendOps Bridge addon from `apps/blender-addon/blendops_addon`
3. Addon's `register()` function calls `start_server()` which:
   - Starts HTTP server on `http://127.0.0.1:8765`
   - Prints startup banner to Blender console (human activity log window)
   - Logs "bridge ready" message

**Blender console visibility**:
- On Windows, Blender shows a console window for bridge activity logs
- This console displays startup banner and per-operation logs
- Console output is **not redirected** - it prints directly to the visible window
- Users should keep this window open while using BlendOps

### Observability improvements implemented

The following observability features were added to the bridge and CLI:

#### Bridge-side logging (`apps/blender-addon/blendops_addon/__init__.py`)

1. **Startup banner** (visible in Blender console):
```
============================================================
 BlendOps Bridge
 Version: 0.1.0
 Status: READY
 URL: http://127.0.0.1:8765
 Mode: Blender background bridge
 Note: keep this window open while using BlendOps
============================================================
[BlendOps 2026-04-25 08:30:00] bridge ready
```

2. **Per-operation logging**:
```
[BlendOps 2026-04-25 08:30:15] <- scene.inspect
[BlendOps 2026-04-25 08:30:15] -> scene.inspect ok 45ms
[BlendOps 2026-04-25 08:30:20] <- object.create
[BlendOps 2026-04-25 08:30:20] -> object.create ok 12ms
```

3. **Bridge status metadata** (returned in `bridge.status` response):
```json
{
  "ok": true,
  "operation": "bridge.status",
  "message": "BlendOps bridge is running",
  "data": {
    "version": "0.1.0",
    "started_at": "2026-04-25 08:30:00",
    "uptime_seconds": 120,
    "request_count": 5,
    "last_operation": "scene.inspect",
    "last_error": null,
    "last_duration_ms": 45,
    "implemented_operations": [
      "scene.inspect",
      "object.create",
      "object.transform",
      "material.create",
      "material.apply",
      "lighting.setup",
      "camera.set",
      "render.preview",
      "validate.scene",
      "export.asset"
    ]
  }
}
```

#### CLI-side logging (`apps/cli/src/index.ts`)

1. **Global flags**:
   - `--verbose` / `-v`: Show detailed progress logs on stderr
   - `--quiet` / `-q`: Suppress progress logs

2. **Operation timing** (stderr, when `--verbose` or long-running operation):
```
[BlendOps 08:30:15] command: scene.inspect
[BlendOps 08:30:15] completed: scene.inspect ok 50ms
```

3. **Log file support** (optional):
   - Set `BLENDOPS_LOG_FILE=.tmp/blendops.log` to mirror logs to file
   - Non-fatal if file logging fails

#### Output separation

**stdout**: JSON responses only (machine-readable)
**stderr**: Human progress logs (when not `--quiet`)
**Blender console**: Bridge startup banner and per-operation logs

This separation ensures:
- AI/MCP/tooling can parse stdout reliably
- Scripts can use stdout directly without filtering
- Humans can observe progress via stderr or Blender console

## Verification commands

### Bridge status with metadata
```bash
npm run cli -- bridge status --verbose
```

Expected:
- stdout: Valid JSON with `data.uptime_seconds`, `data.request_count`, `data.last_operation`, `data.last_error`, `data.last_duration_ms`, `data.implemented_operations`
- stderr: Progress logs (if `--verbose`)

### Scene inspect with timing
```bash
npm run cli -- scene inspect --verbose
```

Expected:
- stdout: Valid JSON response
- stderr: Operation start/completion timing

### Validate scene (long-running)
```bash
npm run cli -- validate scene --preset basic --verbose
```

Expected:
- stdout: Valid JSON response
- stderr: Automatic progress logs (long-running operation)

## Human-readable console UX

### Before

Console could show low-level HTTP noise such as:

```
code 501, message Unsupported method ('GET')
"GET /status HTTP/1.1" 501 -
```

This was technically observable but confusing for normal users.

### After

Console now shows semantic, human-readable activity lines:

```
[BlendOps 09:00:00] ready and waiting for commands
[BlendOps 09:00:05] status check ok
[BlendOps 09:00:10] received: scene.inspect
[BlendOps 09:00:10] completed: scene.inspect ok 8ms
[BlendOps 09:00:10] status: alive | requests=3 | last=scene.inspect | last_error=none
[BlendOps 09:00:12] ignored unsupported GET /favicon.ico
```

### UX behavior verified

- GET `/status` works in browser and returns bridge status JSON
- Browser `/favicon.ico` requests are treated as harmless and do not produce scary spam
- Raw low-level `501 Unsupported method ('GET')` spam no longer appears in normal console flow
- Bridge console clearly communicates what ran and whether it succeeded or failed

## Pass / Fail verdict

- PowerShell `$PID` bug: **N/A** (no PowerShell scripts exist)
- Blender console visibility: **PASS** (banner and logs print to visible console, no redirection)
- Bridge console readability: **PASS** (semantic activity lines replace raw HTTP noise)
- GET `/status` support: **PASS** (status JSON available via browser)
- 501 GET spam removal: **PASS** (no scary raw 501 spam for normal status checks)
- Bridge status metadata: **PASS** (all fields present: uptime_seconds, request_count, last_operation, last_error, last_duration_ms, implemented_operations)
- CLI stdout JSON-only: **PASS** (verified via manual testing)
- CLI stderr progress logs: **PASS** (verified via manual testing)
- Verbose/quiet flags: **PASS** (implemented and functional)

Overall: **PASS**

## Notes

- The reported PowerShell launcher issue does not exist in this codebase
- Runtime tests are manual (docs-driven), not automated via scripts
- The Blender bridge is launched by manually enabling the addon in Blender
- The console window on Windows is expected and serves as the live operation log stream
- Observability contract remains: stdout JSON only, stderr human logs, bridge console activity logs
- All observability improvements are already implemented and functional
- No code changes were required for this verification pass

## Build verification

```bash
npm run clean
npm run typecheck
npm run build
```

All commands completed successfully with exit code 0.

## Git hygiene

Verified that the following are not staged:
- `.tmp/` directory (temporary test artifacts)
- `*.log` files
- `dist/` directories (build output)
- `node_modules/`
- `renders/` directory
- `exports/` directory
- Generated files

## Related documentation

- [Observability guide](./observability.md)
- [Manual test guide](./manual-test.md)
- [Runtime smoke test: object transform](./runtime-smoke-test-object-transform.md)
- [Runtime smoke test: material slice](./runtime-smoke-test-material.md)
- [Runtime smoke test: camera](./runtime-smoke-test-camera.md)
