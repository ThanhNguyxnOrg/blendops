# Prior-Art Implementation Patterns (Source-Level)

**Date**: 2026-04-28  
**Purpose**: Capture source-level lifecycle patterns from Blender MCP prior art, compare to current BlendOps behavior, and document concrete lifecycle hardening changes in this pass.

---

## Repositories and source files inspected

- `ahujasid/blender-mcp`
  - `addon.py`
  - `src/blender_mcp/server.py`
- `CommonSenseMachines/blender-mcp`
  - `addon.py`
  - `chat_client.py`
- `poly-mcp/Blender-MCP-Server`
  - `blender_mcp.py`
  - `blender_polymcp.py`
- `dhakalnirajan/blender-open-mcp`
  - `addon.py`
  - `client.py`
- `VxASI/blender-mcp-vxai`
  - `blender_mcp_addon.py`
- `tahooki/unreal-blender-mcp`
  - `src/unreal_blender_mcp/server.py`
  - `run_extended_server.py`
- `mezallastudio/antigravity-blender-mcp`
  - `src/mcp-server/src/server.ts`
  - `src/mcp-server/src/index.ts`
  - `mcp_connector_v2.py`

---

## Prior-art pattern table (source-level)

| Repo | Source file inspected | Pattern | Risk | BlendOps current behavior | Action (adopt/already/avoid) | Concrete change in this pass (or reason unchanged) |
|---|---|---|---|---|---|---|
| ahujasid/blender-mcp | `addon.py`, `src/blender_mcp/server.py` | TCP server in Blender process; thread/socket lifecycle; manual startup | Manual startup + arbitrary Python `exec` exposure | Managed bridge subprocess + typed operations + `/status` readiness + process metadata | **Already adopted (lifecycle)**, **Avoid (exec)** | No arbitrary Python added. Strengthened startup/timeout diagnostics and stale-state messaging in core lifecycle |
| CommonSenseMachines/blender-mcp | `addon.py` | Similar socket/thread lifecycle; manual startup | Same manual startup + exec risk | Managed lifecycle already covers startup/stop/log paths | **Already adopted (thread lifecycle ideas)**, **Avoid (exec)** | Kept typed operation model; no exec surface added |
| poly-mcp/Blender-MCP-Server | `blender_mcp.py`, `blender_polymcp.py` | Large in-process server; broad tool surface | Operational complexity + unclear failure diagnostics in large monolith | Smaller typed surface with explicit CLI/MCP lifecycle endpoints | **Avoid (broad monolith/tool expansion)** | No operation expansion, no batch allowlist changes |
| dhakalnirajan/blender-open-mcp | `addon.py`, `client.py` | Socket timeout loops and explicit stop flow | Startup readiness ambiguity; exec tool exposure | `/status` readiness polling and managed stop with PID validation | **Already adopted (bounded wait + stop flow)**, **Avoid (exec)** | Added clearer stale readiness/port conflict diagnostics and recovery next steps |
| VxASI/blender-mcp-vxai | `blender_mcp_addon.py` | `bpy.app.timers` main-thread dispatch + file logging | Still script-execution exposure in some flows | BlendOps already uses main-thread queue/timer + file logs | **Already adopted (timer/log visibility)**, **Avoid (script exec)** | Enhanced `bridge logs` payload discoverability (process/log paths, line counts, empty-log warning) |
| tahooki/unreal-blender-mcp | `src/unreal_blender_mcp/server.py` | Explicit startup/shutdown lifecycle hooks and readiness checks | Different stack/runtime from Blender addon pattern | Managed lifecycle already bounded (`timeout_ms`, poll interval) | **Adopt conceptually (actionable readiness/recovery messaging)** | Added stronger timeout and stale recovery next steps; no architecture rewrite |
| mezallastudio/antigravity-blender-mcp | `src/mcp-server/src/server.ts`, `src/mcp-server/src/index.ts` | MCP server with graceful shutdown + bridge status helpers | Potentially noisy flows if not explicit about readiness/logs | BlendOps MCP/CLI already route through same core lifecycle helpers | **Already adopted (single lifecycle source)** | Kept single source of truth in `startBridgeLifecycle` and improved consumer-facing diagnostics |

---

## Focus patterns requested and current status

| Focus area | BlendOps status before this pass | What changed in this pass |
|---|---|---|
| Main-thread/timer dispatch | Already present in addon queue/timer processing | No behavior change (already correct) |
| Bridge readiness checks | `/status` polling already present | Added clearer stale-readiness branch when tracked PID is alive but not ready |
| Server lifecycle | Start/stop/log lifecycle already centralized | Added richer recovery messaging, stale diagnostics, and log discoverability |
| Stale process/port handling | Partial (PID validation on stop, stale process file cleanup) | Added explicit stale readiness warning and recover flow (`logs/status/stop/start`) |
| Log visibility | Process/log paths existed but were not always emphasized | `bridge.logs` now includes process_file and line counts; warns on empty log tails |
| Avoid Blender GUI blocking | Non-blocking spawn already used (`detached` + `unref`) | Added explicit guidance: GUI staying open is expected; readiness is `/status` |
| Avoid context spam | Mixed guidance across docs | Added and tightened redirect/summarize guidance for long JSON output |
| CLI root-directory mistakes | Mostly docs-only note before pass | Added lifecycle preflight in core to detect missing addon source under current `root_dir` and return explicit recovery guidance |
| bridge start returns while Blender stays open | Behavior existed but confusion persisted | Clarified next steps in start success/already-running/timeout paths + docs updates |

---

## Concrete BlendOps lifecycle hardening implemented in this pass

### Code changes

- `packages/core/src/bridgeLifecycle.ts`
  - Added managed-start preflight for missing addon source under current `root_dir` with explicit repo-root recovery guidance.
  - Added stale-readiness failure branch for tracked PID alive but `/status` not ready (prevents ambiguous re-start attempts).
  - Expanded timeout/start failure next steps with stale-process/port recovery guidance.
  - Clarified that Blender GUI staying open is expected after successful start.
  - Improved `bridge.logs` payload with `process_file`, log line counts, empty-log warning, and next-step recovery guidance.
- `packages/core/src/index.ts`
  - Improved `bridge.status` connection-failure warnings/next steps with lifecycle recovery hints (`logs` + managed `start` + status follow-up).

### Docs changes linked to lifecycle behavior

- `README.md`
- `docs/install.md`
- `docs/manual-test.md`
- `docs/observability.md`
- `docs/ai-agent-usage.md`

These updates align user/agent behavior with runtime lifecycle reality:
- do not wait for Blender exit after `bridge start`
- use status/logs as source of truth
- recover stale lifecycle states with `status → logs → stop → start`
- redirect long JSON to `.tmp/stabilize/*.json` and summarize key fields

---

## Patterns explicitly avoided in this pass

- No new Blender operations.
- No arbitrary Python execution endpoint.
- No `batch.execute` allowlist expansion.
- No destructive behavior changes.
- No broad lifecycle architecture rewrite.

---

## Official Blender command-line reference

**Date**: 2026-04-28  
**Source**: Blender official documentation (https://docs.blender.org/manual/en/latest/advanced/command_line/)  
**Purpose**: Document alignment between BlendOps managed bridge lifecycle and official Blender CLI behavior.

### Known official Blender CLI patterns (from community usage and BlendOps runtime evidence)

| Official Pattern | BlendOps Current Behavior | Status | Action Taken |
|---|---|---|---|
| **Launch via command line** | ✅ `spawn(blender_path, args, { detached: true })` in `bridgeLifecycle.ts` | Aligned | No change needed |
| **GUI mode (default)** | ✅ Default mode; `--python` script without `--background` flag | Aligned | Documented as primary validated path |
| **Background mode (`--background`)** | ⚠️ Supported but limited/unvalidated for persistent bridge runtime | Intentionally different | Documented limitation remains |
| **Startup script (`--python <script>`)** | ✅ Generated `.tmp/blendops/start_bridge_gui.py` with addon import/register | Aligned | No change needed |
| **Process lifetime (GUI stays open)** | ✅ Blender GUI remains open while bridge serves; CLI exits after handoff | Aligned | Clarified in docs: GUI staying open is expected |
| **stdout/stderr separation** | ✅ Redirected to `.tmp/blendops/bridge.stdout.log` and `.tmp/blendops/bridge.stderr.log` | Aligned | Documented log locations |
| **Non-blocking launch** | ✅ `child.unref()` after spawn; readiness determined by `/status` poll | Aligned | No change needed |
| **Background mode limitations** | ⚠️ Known: GLB/GLTF export requires GUI window context on Blender 4.2 | Limitation acknowledged | Documented in README, install.md, manual-test.md |

### BlendOps-specific enhancements beyond official CLI

| Enhancement | Rationale | Status |
|---|---|---|
| Process metadata tracking (`bridge-process.json`) | Enable managed stop/status without manual PID lookup | ✅ Implemented |
| Health check endpoint (`GET /status`) | Explicit readiness verification vs implicit process existence | ✅ Implemented |
| Automated addon bootstrap | Remove manual addon install step for primary path | ✅ Implemented |
| Platform-specific process validation (tasklist/ps) | Prevent accidental termination of non-Blender PIDs | ✅ Implemented |
| Request correlation (`request_id` + `receipt`) | Enable troubleshooting and operation tracing | ✅ Implemented |

### Alignment summary

**BlendOps managed bridge lifecycle aligns with official Blender CLI launch behavior:**
- Uses standard `--python` script injection for addon bootstrap
- Respects GUI mode as default validated runtime path
- Acknowledges background mode limitations (GLB/GLTF export, persistent runtime)
- Separates stdout/stderr for automation-friendly output
- Documents that GUI process staying open is expected behavior

**No code changes needed** - current implementation follows official CLI patterns. Documentation updates clarify alignment and expected behavior.
