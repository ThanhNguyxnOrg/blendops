# 👀 Observability Guide

> 📚 Docs: [Index](./README.md) · [Install](./install.md) · [AI usage](./ai-agent-usage.md) · [Manual test](./manual-test.md) · [Observability](./observability.md)

BlendOps separates machine output from human diagnostics.

## 📋 Output contract

- stdout: JSON response envelopes
- stderr: human progress and timing logs

This applies to CLI and MCP wrappers.

## 🎛️ Bridge lifecycle observability

Managed bridge lifecycle commands:

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge stop
```

`bridge start` returning `ok: true` means startup handoff completed.

Blender GUI remaining open is expected while bridge is running; use `bridge status` as readiness source of truth.

Lifecycle artifacts are written under `.tmp/blendops/`:

- `bridge-process.json`
- `bridge.stdout.log`
- `bridge.stderr.log`
- `start_bridge_gui.py`

## 🔎 Request correlation

BlendOps responses include structured correlation fields when available:

- top-level `request_id`
- top-level `receipt`
  - `receipt.request_id`
  - `receipt.operation`
  - `receipt.ok`
  - `receipt.duration_ms`

Verbose logs include request IDs on command start/completion.

## ✅ How to tell bridge is working

```bash
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge operations --verbose
node apps/cli/dist/index.js scene inspect --verbose
```

Healthy indicators:

- `bridge.status` returns `ok: true`
- bridge metadata includes `request_count`, `last_operation`, `last_request_id`
- `scene.inspect` returns structured scene data
- stderr shows matching request IDs

## 🧯 Debug failed startup

1. Inspect lifecycle logs:

```bash
node apps/cli/dist/index.js bridge logs --tail 200
```

2. Verify blender path:

```bash
node apps/cli/dist/index.js bridge start --mode gui --blender "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --verbose
```

3. If bootstrap never becomes ready, use addon fallback:

```txt
Blender → Edit → Preferences → Add-ons → Install...
Select: apps/blender-addon/blendops_addon
Enable: BlendOps Bridge
```

4. Re-check bridge status:

```bash
node apps/cli/dist/index.js bridge status --verbose
```

5. If runtime JSON is too long for terminal review, redirect output and summarize key fields:

```bash
node apps/cli/dist/index.js bridge status --verbose > .tmp/stabilize/status.json
node apps/cli/dist/index.js bridge logs --tail 40 > .tmp/stabilize/logs.json
```

Inspect only key fields: `ok`, `operation`, `request_id`, `warnings`, `next_steps`.

## 🧠 MCP observability

Enable MCP stderr logging:

```bash
set BLENDOPS_MCP_VERBOSE=1
node apps/mcp-server/dist/index.js
```

Or:

```bash
set BLENDOPS_VERBOSE=1
node apps/mcp-server/dist/index.js
```

MCP responses remain protocol-valid while diagnostics go to stderr.

## 📝 Optional CLI log file mirror

```bash
set BLENDOPS_LOG_FILE=.tmp/blendops.log
node apps/cli/dist/index.js scene inspect --verbose
```

If file logging fails, command execution still continues.
