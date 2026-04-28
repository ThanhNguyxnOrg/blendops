# Official Blender CLI Reference

**Date**: 2026-04-28  
**Source**: [Blender Command Line Documentation](https://docs.blender.org/manual/en/latest/advanced/command_line/)  
**Purpose**: Document how BlendOps managed bridge lifecycle aligns with official Blender CLI behavior.

---

## Overview

BlendOps builds on official Blender command-line launch patterns to provide a managed bridge lifecycle with automated startup, readiness polling, and typed operations.

This document captures lifecycle-relevant facts from the official Blender CLI and explains how BlendOps uses or abstracts them.

---

## Official Blender CLI Facts (Lifecycle-Relevant)

### Launch Model

- **Usage syntax**: `blender [args ...] [file] [args ...]`  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- All output (operations, status, errors, Python `print()` calls) is directed to the terminal/console where Blender is launched  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)

- Primary use cases: automation, batch processing, rendering, Python development  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)

### GUI vs Background Execution

- `-b` / `--background`: Run Blender in UI-less background mode, designed for rendering and automation  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-con` / `--start-console`: Open console window on startup (Windows only); **ignored when `-b` is set**  
  [Source](https://docs.blender.org/manual/en/3.6/advanced/command_line/arguments.html)

- GUI window flags (`-w`, `-W`, `-M`) only apply when not in background mode  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

### Script Startup Behavior

- `-P <file>` / `--python <file>`: Execute a Python script file on startup  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `--python-expr <expr>`: Execute a Python expression as a startup script  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `--python-console`: Start an interactive Python console for persistent interactive sessions  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-y` / `--enable-autoexec`: Enable automatic Python script execution (drivers, add-ons)  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-Y` / `--disable-autoexec`: Disable automatic Python script execution  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

### File/Path Handling

- Positional `[file]` argument: Specify a `.blend` file to load on startup  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-o <path>` / `--render-output <path>`: Set render output path; use `//` prefix for paths relative to the loaded `.blend` file  
  [Source](https://docs.blender.org/manual/en/3.6/advanced/command_line/arguments.html)

- **Argument order sensitivity**: All arguments are executed sequentially in the order provided  
  Example: `blender --background test.blend --render-frame 1 --render-output '/tmp'`  
  [Source](https://docs.blender.org/manual/en/3.6/advanced/command_line/arguments.html)

### Stdout/Stderr/Logging

- All output (status, errors, debug messages, Python `print()` calls) is written to the launching terminal's stdout/stderr  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)

- `--log <categories>`: Enable logging for specific categories  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `--log-level <level>`: Set logging verbosity  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-d` / `--debug`: Enable debug-level diagnostic output  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-q` / `--quiet`: Suppress non-essential output  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- **Terminal tie-in**: Closing the launching console/terminal terminates the Blender process immediately, losing unsaved work  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)

### Process Lifetime Expectations

- Background mode (`-b`) executes all provided arguments sequentially, then exits automatically (designed for single-run automation tasks)  
  [Source](https://docs.blender.org/manual/en/3.6/advanced/command_line/arguments.html)

- Interactive modes (e.g., `--python-console`) persist until the interactive session is manually terminated  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- No long-running daemon mode: Blender is designed for discrete, single-run execution in automation workflows  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)

### Automation-Specific Flags

- `-a` / `--render-anim`: Render all frames in the configured start/end range  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-f <frame>` / `--render-frame <frame>`: Render a single frame  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-s <frame>` / `--frame-start`, `-e <frame>` / `--frame-end`: Set animation frame range  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

- `-t <count>` / `--threads`: Set thread count for rendering operations  
  [Source](https://docs.blender.org/manual/en/latest/advanced/command_line/arguments.html)

---

## How BlendOps Uses Official Blender CLI Behavior

### Aligned Behavior

| Official Pattern | BlendOps Implementation | Status |
|---|---|---|
| Launch via command line | `spawn(blender_path, args, { detached: true })` in `bridgeLifecycle.ts` | ✅ Aligned |
| GUI mode (default) | Default mode; `--python` script without `--background` flag | ✅ Aligned |
| Startup script (`--python <script>`) | Generated `.tmp/blendops/start_bridge_gui.py` with addon import/register | ✅ Aligned |
| Process lifetime (GUI stays open) | Blender GUI remains open while bridge serves; CLI exits after handoff | ✅ Aligned |
| stdout/stderr separation | Redirected to `.tmp/blendops/bridge.stdout.log` and `.tmp/blendops/bridge.stderr.log` | ✅ Aligned |
| Non-blocking launch | `child.unref()` after spawn; readiness determined by `/status` poll | ✅ Aligned |

### Intentionally Different Behavior

| Official Pattern | BlendOps Behavior | Rationale |
|---|---|---|
| Background mode (`--background`) | Supported but limited/unvalidated for persistent bridge runtime | Persistent HTTP bridge requires GUI window context for some operations (GLB/GLTF export on Blender 4.2) |
| Process exits after tasks | Bridge persists in GUI mode to serve multiple operations | BlendOps provides a long-running bridge, not single-run automation |
| Terminal closure terminates process | Process detachment allows terminal to close without terminating bridge | Managed lifecycle enables non-blocking automation workflows |

### BlendOps-Specific Enhancements

BlendOps extends official CLI behavior with managed lifecycle features:

| Enhancement | Purpose | Implementation |
|---|---|---|
| Process metadata tracking | Enable managed stop/status without manual PID lookup | `bridge-process.json` with pid, mode, paths |
| Health check endpoint | Explicit readiness verification vs implicit process existence | `GET /status` with structured response |
| Automated addon bootstrap | Remove manual addon install step for primary path | Startup script injection via `--python` |
| Platform-specific process validation | Prevent accidental termination of non-Blender PIDs | `tasklist`/`ps` validation before stop |
| Request correlation | Enable troubleshooting and operation tracing | `request_id` + `receipt` in all responses |

---

## What BlendOps Intentionally Avoids

### No Arbitrary Python Execution

Official Blender CLI allows arbitrary Python via `--python-expr` and script files. BlendOps **does not expose** arbitrary Python execution to AI agents or MCP clients.

**Rationale**: Security and determinism. All operations are typed, validated, and auditable.

### No Broad CLI Flag Exposure

BlendOps does not expose all Blender CLI flags (e.g., `-a`, `-f`, `-s`, `-e`, `-t`, `--render-output`) directly to AI agents.

**Rationale**: Typed operations (`render.preview`, `export.asset`) provide safer, validated interfaces for automation.

### No Destructive Batch Expansion

BlendOps `batch.execute` real execution is limited to a non-destructive allowlist. Destructive operations (`scene.clear`, `undo.last`) and output operations (`render.preview`, `export.asset`) are excluded from batch real execution.

**Rationale**: Safety gates prevent unintended scene mutation in batch workflows.

---

## Known Limitations

### Background Mode Limitations

- **GLB/GLTF export**: Blender 4.2 requires GUI window context for GLB/GLTF export. Background mode is limited/unvalidated for this use case.
- **Persistent bridge runtime**: Background mode is designed for single-run automation, not long-running HTTP bridges. BlendOps documents GUI mode as the validated path.

### Process Lifetime

- **GUI staying open is expected**: After successful `bridge start`, Blender GUI remains open while the bridge serves commands. This is correct behavior, not a bug.
- **Readiness is determined by `/status`**: Do not wait for Blender process exit as a readiness signal. Use `bridge status` or `bridge logs` instead.

---

## Implementation Notes for Contributors

### Where Launch Args Are Built

- **File**: `packages/core/src/bridgeLifecycle.ts`
- **Function**: `startBridgeLifecycle(input)`
- **Arg construction** (lines 419-421):
  ```typescript
  const args = mode === "background"
    ? ["--background", "--python", paths.startup_script]
    : ["--python", paths.startup_script];
  ```

### Mode Handling

- **Sanitization**: `sanitizeMode(mode)` enforces `"gui"` or `"background"` (lines 179-184)
- **Default**: GUI mode if not specified
- **Validation**: CLI validates mode before calling lifecycle (apps/cli/src/index.ts lines 246-265)

### Startup Script Generation

- **Function**: `writeStartupScript(paths, root_dir)` (lines 197-210)
- **Content**: Imports addon, registers it, prints `BRIDGE_READY`, and registers persistent timer
- **Path**: `.tmp/blendops/start_bridge_gui.py`

### Diagnostics Fields

Lifecycle responses include:
- `mode`: `"gui"` or `"background"`
- `blender_path`: Resolved Blender executable path
- `pid`: Process ID of launched Blender instance
- `bridge_url`: HTTP bridge URL (default: `http://127.0.0.1:8765`)
- `process_file`: Path to `bridge-process.json`
- `startup_script`: Path to generated startup script
- `stdout_log`: Path to stdout log file
- `stderr_log`: Path to stderr log file

---

## Next Steps

- For managed bridge usage, see [Install Guide](./install.md)
- For AI-agent constraints, see [AI Agent Usage Guide](./ai-agent-usage.md)
- For troubleshooting, see [Manual Test Guide](./manual-test.md)
- For observability, see [Observability Guide](./observability.md)
