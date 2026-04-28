# Bridge Lifecycle Prior Art Analysis

**Date**: 2026-04-26

**Purpose**: Document lifecycle patterns from existing Blender MCP implementations to inform BlendOps bridge hardening.

---

## Repositories Analyzed

| Repo | License | Architecture | Key Files |
|------|---------|--------------|-----------|
| ahujasid/blender-mcp | MIT | TCP server inside Blender | addon.py, src/blender_mcp/server.py |
| dhakalnirajan/blender-open-mcp | MIT | TCP server inside Blender + FastMCP | addon.py, src/blender_open_mcp/server.py |
| poly-mcp/Blender-MCP-Server | MIT | HTTP server inside Blender | blender_mcp.py (191KB monolith) |
| CommonSenseMachines/blender-mcp | MIT | TCP server inside Blender | addon.py, src/blender_mcp/server.py |

---

## Pattern Comparison Table

| Pattern | ahujasid | dhakalnirajan | poly-mcp | CommonSense | BlendOps Current |
|---------|----------|---------------|----------|-------------|------------------|
| **Blender Launch** | Manual addon enable | Manual addon enable | Manual addon enable | Manual addon enable | ✅ Automated subprocess spawn |
| **Server Type** | TCP socket | TCP socket | HTTP (uvicorn) | TCP socket | ✅ HTTP (stdlib) |
| **Thread Safety** | `bpy.app.timers` | `bpy.app.timers` | `bpy.app.timers` | Daemon threads | ✅ `bpy.app.timers` + queue |
| **Daemon Threads** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Health Check** | ❌ Implicit | ❌ None | ❌ None | ❌ Implicit | ✅ Explicit GET /status |
| **Timeout** | 180s socket | 60s socket | 30s queue | 15s socket | ✅ 45s startup poll, 5s client |
| **Log Capture** | print() to console | print() to console | Python logging | Python logging | ✅ File logs (.tmp/blendops/) |
| **Stop Mechanism** | Flag + close + join(1s) | Flag + close + join(3s) | ⚠️ No join | Flag + close + join(1s) | ✅ PID validation + taskkill/SIGTERM |
| **Process Metadata** | ❌ None | ❌ None | ❌ None | ❌ None | ✅ bridge-process.json |
| **Windows Handling** | ❌ None | ❌ None | ❌ None | ❌ None | ✅ tasklist/taskkill |
| **Arbitrary Python** | ⚠️ exec() exposed | ⚠️ exec() exposed | ⚠️ Tool-based | ⚠️ exec() exposed | ✅ Not exposed |
| **Request Correlation** | ❌ None | ❌ None | ❌ None | ❌ None | ✅ request_id + receipt |

---

## Key Findings

### 1. Startup Pattern

**Prior Art**: All analyzed repos require **manual Blender startup** and **manual addon enablement**. None spawn Blender programmatically.

**BlendOps Advantage**: Already implements automated subprocess spawn with startup script injection via `startBridgeLifecycle()`.

**What to Keep**:
- ✅ `spawn()` with `detached: true` and `unref()`
- ✅ Startup script generation under `.tmp/blendops/`
- ✅ Non-blocking with health poll loop

---

### 2. Thread Safety (Critical Pattern)

**Universal Pattern**: All repos use `bpy.app.timers.register()` for main-thread execution.

**Code Pattern** (from ahujasid/blender-mcp):
```python
def execute_wrapper():
    # Execute command in Blender's main thread
    result = execute_command(command)
    return None  # Don't re-register

bpy.app.timers.register(execute_wrapper, first_interval=0.0)
```

**BlendOps Status**: ✅ Already implements this pattern in addon `timer_process_queue()`.

---

### 3. Health Check

**Prior Art Gap**: No repo implements explicit health endpoints. All rely on:
- Implicit command success (ahujasid, CommonSense)
- No health check at all (dhakalnirajan, poly-mcp)

**BlendOps Advantage**: Already has `GET /status` with structured response including:
- `ok: true/false`
- `request_count`
- `last_operation`
- `last_request_id`

**What to Keep**: Current `/status` implementation is superior to all prior art.

---

### 4. Timeout Handling

**Prior Art**:
- ahujasid: 180s socket timeout
- dhakalnirajan: 60s socket timeout
- poly-mcp: 30s queue timeout
- CommonSense: 15s socket timeout

**BlendOps**: 45s startup poll, 5s client request timeout

**Recommendation**: Current timeouts are reasonable. No change needed.

---

### 5. Log Capture

**Prior Art**: All use `print()` or Python `logging` to Blender console. No persistent file logs.

**BlendOps Advantage**: Already captures to:
- `.tmp/blendops/bridge.stdout.log`
- `.tmp/blendops/bridge.stderr.log`

**What to Keep**: File-based logging is superior for troubleshooting.

---

### 6. Stop/Cleanup Mechanism

**Prior Art Patterns**:
```python
# Common pattern across all repos
def stop(self):
    self.running = False
    if self.socket:
        self.socket.close()
    if self.server_thread:
        self.server_thread.join(timeout=1.0)  # or 3.0
```

**BlendOps Advantage**: Goes beyond prior art with:
- ✅ PID validation via `isBlenderProcess()`
- ✅ Platform-specific termination (taskkill on Windows, SIGTERM on Unix)
- ✅ Process state file cleanup

**What to Keep**: Current implementation is more robust than all prior art.

---

### 7. Windows-Specific Handling

**Prior Art Gap**: **No repo has Windows-specific code**. All rely on cross-platform Python stdlib.

**BlendOps Advantage**: Already implements:
```typescript
// Windows PID validation
spawnSync("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"])

// Windows process termination
spawnSync("taskkill", ["/PID", `${pid}`, "/T", "/F"])
```

**What to Keep**: Windows handling is unique to BlendOps and necessary.

---

### 8. Security: Arbitrary Python Execution

**Prior Art Risk**: 3 out of 4 repos expose arbitrary `exec()`:

```python
# DANGEROUS PATTERN (found in ahujasid, dhakalnirajan, CommonSense)
def execute_code(self, code):
    namespace = {"bpy": bpy}
    exec(code, namespace)  # ⚠️ SECURITY RISK
    return result
```

**BlendOps Stance**: ✅ Does NOT expose arbitrary Python execution. All operations are typed and validated.

**What to Keep**: Maintain typed operation model. Do not add arbitrary exec endpoints.

---

## Safe Patterns to Adopt

### 1. ✅ Already Adopted

- `bpy.app.timers.register()` for thread-safe execution
- Daemon threads with proper cleanup
- Socket `SO_REUSEADDR` for quick restart
- Startup script injection

### 2. ⚠️ Consider (Low Priority)

- **Auto-dependency installation**: poly-mcp auto-installs FastAPI/uvicorn on first run
  - **BlendOps decision**: Not needed - addon is self-contained
  
- **Queue depth limits**: poly-mcp has `MAX_QUEUE_SIZE = 1000`
  - **BlendOps decision**: Current queue is unbounded but operations are fast

---

## Patterns to Avoid

### 1. ❌ Manual Addon Enablement

**Prior Art**: All repos require user to manually install and enable addon.

**BlendOps**: Automated startup script handles addon import and registration.

**Keep**: Automated approach.

---

### 2. ❌ No Health Check

**Prior Art**: No explicit health endpoints.

**BlendOps**: Has `/status` with structured metadata.

**Keep**: Explicit health check.

---

### 3. ❌ Arbitrary Python Execution

**Prior Art**: 3/4 repos expose `exec()` without sandboxing.

**BlendOps**: Typed operations only.

**Keep**: No arbitrary exec.

---

### 4. ❌ No Process Metadata

**Prior Art**: No repos track PID, startup time, or process state.

**BlendOps**: Tracks in `bridge-process.json`.

**Keep**: Process metadata tracking.

---

### 5. ❌ No Request Correlation

**Prior Art**: No repos implement request IDs or operation receipts.

**BlendOps**: Has `request_id` + `receipt` correlation.

**Keep**: Request correlation.

---

## BlendOps Current State Assessment

### Strengths (Superior to All Prior Art)

1. ✅ **Automated Blender launch** - No manual addon enable required
2. ✅ **Explicit health check** - GET /status with structured metadata
3. ✅ **File-based logging** - Persistent stdout/stderr capture
4. ✅ **Process metadata** - Tracked PID, mode, paths in JSON
5. ✅ **Windows support** - Platform-specific process management
6. ✅ **Request correlation** - request_id + receipt in all responses
7. ✅ **No arbitrary exec** - Typed operations only
8. ✅ **Safe stop** - PID validation before termination

### Areas Already Correct

1. ✅ Thread safety via `bpy.app.timers`
2. ✅ Daemon threads for HTTP server
3. ✅ Non-blocking startup with poll loop
4. ✅ Timeout handling (45s startup, 5s client)
5. ✅ Structured JSON responses

### Minimal Fixes Needed

Based on prior art and current implementation review:

1. **Request ID preservation in bridge.status** - Ensure query param and header are both checked and preserved in response
2. **Documentation polish** - Clarify that background mode is limited (already documented)
3. **Lifecycle command parity** - Verify CLI and MCP expose same bridge lifecycle operations (already present)

---

## Conclusion

**BlendOps bridge lifecycle implementation is already superior to all analyzed prior art.**

The current implementation combines:
- Automated startup (unique to BlendOps)
- Explicit health checks (missing in all prior art)
- Process metadata tracking (missing in all prior art)
- Request correlation (missing in all prior art)
- Windows-specific handling (missing in all prior art)
- Security-first design (no arbitrary exec, unlike 3/4 prior art)

**Recommended Action**: Minimal hardening only. Focus on:
1. Request ID correlation verification
2. Documentation completeness
3. Runtime smoke test evidence capture

No major architectural changes needed.
