# Prior Art Implementation Patterns

**Date**: 2026-04-28

**Purpose**: Document specific implementation patterns from Blender MCP prior art, their adoption status in BlendOps, and rationale.

---

## Pattern Catalog

### 1. Main-Thread Dispatch via `bpy.app.timers`

**Prior Art**: Universal pattern across ahujasid/blender-mcp, dhakalnirajan/blender-open-mcp, poly-mcp/Blender-MCP-Server, CommonSenseMachines/blender-mcp

**Pattern**:
```python
def execute_wrapper():
    result = execute_command(command)
    return None  # Don't re-register

bpy.app.timers.register(execute_wrapper, first_interval=0.0)
```

**Where Seen**: All analyzed repos use `bpy.app.timers.register()` for thread-safe main-thread execution.

**BlendOps Current Behavior**: ✅ Already adopted in `apps/blender-addon/blendops_addon/__init__.py` via `timer_process_queue()`.

**Status**: ✅ Already adopted

**Reason**: Non-negotiable for Blender stability. All bpy API calls must execute on main thread.

---

### 2. Daemon Threads for HTTP/TCP Server

**Prior Art**: Universal pattern across all analyzed repos

**Pattern**:
```python
server_thread = threading.Thread(target=server.serve_forever, daemon=True)
server_thread.start()
```

**Where Seen**: All repos run HTTP/TCP servers in daemon threads to avoid blocking Blender main thread.

**BlendOps Current Behavior**: ✅ Already adopted in addon HTTP server initialization.

**Status**: ✅ Already adopted

**Reason**: Prevents server blocking Blender UI/main thread. Daemon ensures cleanup on Blender exit.

---

### 3. Automated Blender Subprocess Spawn

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: All analyzed repos require manual Blender startup and manual addon enablement.

**Where Seen**: None - all repos are manual-start only.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - `startBridgeLifecycle()` spawns Blender with startup script injection.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Automated startup reduces friction for AI agents. BlendOps is superior to all prior art here.

---

### 4. Explicit Health Check Endpoint

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: No repos implement explicit health endpoints. All rely on implicit command success or no health check at all.

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - `GET /status` with structured response including `ok`, `request_count`, `last_operation`, `last_request_id`.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Explicit health checks enable reliable bridge readiness polling. Superior to prior art.

---

### 5. File-Based Log Capture

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: All repos use `print()` or Python `logging` to Blender console only. No persistent file logs.

**Where Seen**: All repos log to console only.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - captures to `.tmp/blendops/bridge.stdout.log` and `.tmp/blendops/bridge.stderr.log`.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: File-based logging enables post-mortem troubleshooting and AI agent log retrieval. Superior to prior art.

---

### 6. Process Metadata Tracking

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: No repos track PID, startup time, or process state.

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - tracks in `.tmp/blendops/bridge-process.json` with PID, mode, paths, timestamps.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Process metadata enables safe stop/restart and stale process detection. Superior to prior art.

---

### 7. Windows-Specific Process Management

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: No repos have Windows-specific code. All rely on cross-platform Python stdlib only.

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - implements `tasklist`/`taskkill` for PID validation and termination on Windows.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Windows process management requires platform-specific commands. BlendOps handles this; prior art does not.

---

### 8. Request Correlation (request_id + receipt)

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: No repos implement request IDs or operation receipts.

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - all responses include `request_id` and `receipt` with `operation`, `ok`, `duration_ms`.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Request correlation enables troubleshooting and audit trails. Superior to prior art.

---

### 9. Socket Reuse (`SO_REUSEADDR`)

**Prior Art**: Universal pattern across TCP-based repos

**Pattern**:
```python
server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
```

**Where Seen**: ahujasid/blender-mcp, dhakalnirajan/blender-open-mcp, CommonSenseMachines/blender-mcp

**BlendOps Current Behavior**: ✅ Already adopted in HTTP server initialization (stdlib `HTTPServer` handles this).

**Status**: ✅ Already adopted

**Reason**: Prevents "address already in use" errors on quick restart. Standard practice.

---

### 10. Graceful Stop with Thread Join

**Prior Art**: Universal pattern across all analyzed repos

**Pattern**:
```python
def stop(self):
    self.running = False
    if self.socket:
        self.socket.close()
    if self.server_thread:
        self.server_thread.join(timeout=1.0)  # or 3.0
```

**Where Seen**: All repos implement flag + close + join pattern.

**BlendOps Current Behavior**: ✅ Already adopted, plus PID validation and platform-specific termination.

**Status**: ✅ Already adopted (enhanced)

**Reason**: Standard cleanup pattern. BlendOps adds PID validation and taskkill/SIGTERM for robustness.

---

### 11. Arbitrary Python Execution Endpoint

**Prior Art**: ⚠️ Found in 3 out of 4 analyzed repos

**Pattern**:
```python
def execute_code(self, code):
    namespace = {"bpy": bpy}
    exec(code, namespace)  # ⚠️ SECURITY RISK
    return result
```

**Where Seen**: ahujasid/blender-mcp, dhakalnirajan/blender-open-mcp, CommonSenseMachines/blender-mcp

**BlendOps Current Behavior**: ❌ Not exposed. BlendOps uses typed operations only.

**Status**: ❌ Avoid

**Reason**: Arbitrary exec is a security risk. BlendOps maintains typed operation model for safety.

---

### 12. Startup Timeout and Poll Loop

**Prior Art**: Implicit in all repos (no automated startup)

**Pattern**: Prior art repos have no startup polling because they require manual Blender launch.

**Where Seen**: None (manual startup only).

**BlendOps Current Behavior**: ✅ Unique to BlendOps - 45s startup poll loop with health check.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Automated startup requires readiness polling. BlendOps implements this; prior art does not need it.

---

### 13. Non-Blocking Bridge Start

**Prior Art**: N/A (manual startup)

**Pattern**: Prior art repos have no automated startup, so no blocking/non-blocking distinction.

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - `spawn()` with `detached: true` and `unref()` for non-blocking startup.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Non-blocking startup prevents CLI/MCP from hanging. BlendOps returns `ok: true` immediately after spawn, then polls for readiness.

---

### 14. Blender GUI Staying Open After Bridge Start

**Prior Art**: N/A (manual startup)

**Pattern**: Prior art repos assume Blender is already running. No automated startup means no "Blender stays open" behavior to document.

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Documented - `bridge start` returns `ok: true` while Blender GUI remains open. This is expected behavior, not a hang.

**Status**: ✅ BlendOps-specific (not inherited)

**Reason**: Automated startup with GUI mode means Blender process stays alive. Users must understand `bridge start` success does not mean Blender exits.

---

### 15. Stale Process/Port Handling

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: No repos implement stale process detection or port conflict resolution.

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Partial - `isBlenderProcess()` validates PID before stop. No automatic stale port cleanup yet.

**Status**: ⚠️ Partially adopted

**Reason**: Stale process detection prevents accidental termination of unrelated processes. Port conflict resolution is a future enhancement.

---

### 16. CLI Root Directory Check

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: No repos validate that CLI is run from repo root.

**Where Seen**: None.

**BlendOps Current Behavior**: ⚠️ Implicit - CLI assumes repo root for relative paths. No explicit check yet.

**Status**: ⚠️ Not yet adopted (enhancement opportunity)

**Reason**: Running CLI outside repo root causes `MODULE_NOT_FOUND` errors. Explicit check would improve error messages.

---

### 17. Stdout/Stderr Separation

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: No repos separate machine output (stdout) from human diagnostics (stderr).

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - stdout is JSON-only, stderr is human logs.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Separation enables reliable JSON parsing and human-readable diagnostics. Superior to prior art.

---

### 18. Bridge Logs Retrieval Command

**Prior Art**: ❌ Not found in any analyzed repo

**Pattern**: No repos provide a command to retrieve bridge logs programmatically.

**Where Seen**: None.

**BlendOps Current Behavior**: ✅ Unique to BlendOps - `bridge logs --tail N` retrieves last N lines from bridge stdout/stderr.

**Status**: ✅ BlendOps innovation (not inherited)

**Reason**: Programmatic log retrieval enables AI agents to troubleshoot bridge failures. Superior to prior art.

---

## Summary Table

| Pattern | Prior Art | BlendOps | Status | Reason |
|---------|-----------|----------|--------|--------|
| Main-thread dispatch (`bpy.app.timers`) | ✅ Universal | ✅ Adopted | ✅ Already adopted | Non-negotiable for Blender stability |
| Daemon threads for server | ✅ Universal | ✅ Adopted | ✅ Already adopted | Prevents blocking main thread |
| Automated Blender spawn | ❌ None | ✅ Unique | ✅ BlendOps innovation | Reduces friction for AI agents |
| Explicit health check | ❌ None | ✅ Unique | ✅ BlendOps innovation | Enables reliable readiness polling |
| File-based log capture | ❌ None | ✅ Unique | ✅ BlendOps innovation | Enables post-mortem troubleshooting |
| Process metadata tracking | ❌ None | ✅ Unique | ✅ BlendOps innovation | Enables safe stop/restart |
| Windows process management | ❌ None | ✅ Unique | ✅ BlendOps innovation | Required for Windows support |
| Request correlation | ❌ None | ✅ Unique | ✅ BlendOps innovation | Enables troubleshooting and audit |
| Socket reuse | ✅ Universal | ✅ Adopted | ✅ Already adopted | Standard practice |
| Graceful stop with join | ✅ Universal | ✅ Enhanced | ✅ Already adopted | Standard cleanup pattern |
| Arbitrary Python exec | ⚠️ 3/4 repos | ❌ Not exposed | ❌ Avoid | Security risk |
| Startup timeout/poll | N/A | ✅ Unique | ✅ BlendOps innovation | Required for automated startup |
| Non-blocking bridge start | N/A | ✅ Unique | ✅ BlendOps innovation | Prevents CLI/MCP hang |
| Blender GUI stays open | N/A | ✅ Documented | ✅ BlendOps-specific | Expected behavior for GUI mode |
| Stale process/port handling | ❌ None | ⚠️ Partial | ⚠️ Partially adopted | Enhancement opportunity |
| CLI root directory check | ❌ None | ⚠️ Not yet | ⚠️ Enhancement opportunity | Would improve error messages |
| Stdout/stderr separation | ❌ None | ✅ Unique | ✅ BlendOps innovation | Enables reliable JSON parsing |
| Bridge logs retrieval | ❌ None | ✅ Unique | ✅ BlendOps innovation | Enables AI troubleshooting |

---

## Conclusion

**BlendOps inherits only 3 patterns from prior art:**
1. Main-thread dispatch via `bpy.app.timers` (universal, non-negotiable)
2. Daemon threads for server (universal, standard practice)
3. Graceful stop with thread join (universal, standard practice)

**BlendOps introduces 12 unique innovations:**
1. Automated Blender subprocess spawn
2. Explicit health check endpoint
3. File-based log capture
4. Process metadata tracking
5. Windows-specific process management
6. Request correlation (request_id + receipt)
7. Startup timeout and poll loop
8. Non-blocking bridge start
9. Documented GUI-stays-open behavior
10. Stdout/stderr separation
11. Bridge logs retrieval command
12. Typed operations only (no arbitrary exec)

**BlendOps avoids 1 anti-pattern:**
1. Arbitrary Python execution endpoint (security risk)

**BlendOps has 2 enhancement opportunities:**
1. Stale process/port handling (partial implementation)
2. CLI root directory check (not yet implemented)

---

## Recommendations

### Adopt Now
- ✅ All universal patterns already adopted
- ✅ All BlendOps innovations already implemented

### Enhance Later
1. **CLI root directory check**: Add explicit check for `package.json` or `.git` to detect wrong working directory. Return clear error: "Run CLI from repo root (MODULE_NOT_FOUND means wrong directory)."
2. **Stale port cleanup**: Add automatic port conflict detection and resolution in `bridge start`.

### Avoid Forever
- ❌ Arbitrary Python execution endpoint
- ❌ Mixing stdout/stderr (keep separation)
- ❌ Manual-only startup (keep automated spawn)
