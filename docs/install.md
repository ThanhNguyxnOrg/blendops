# 📦 Install and Bridge Bootstrap

> 📚 Docs: [Index](./README.md) · [Install](./install.md) · [AI usage](./ai-agent-usage.md) · [Manual test](./manual-test.md) · [Observability](./observability.md)

BlendOps supports three usage surfaces:

- 🧰 CLI users (direct local commands)
- 🧠 MCP/AI clients (tool-calling)
- 🎛️ Managed Blender bridge with 🧩 manual addon fallback

## ✅ Prerequisites

- Node.js >= 18
- npm >= 9
- Blender >= 3.6
- For validated GLB/GLTF runtime on Blender 4.2, use GUI bridge mode

## 🚀 Quick install

```bash
git clone https://github.com/ThanhNguyxnOrg/blendops.git
cd blendops
npm install
npm run clean
npm run typecheck
npm run build
```

## 🎛️ Automated managed bridge start (primary path)

Use managed bridge bootstrap first:

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge operations --verbose
node apps/cli/dist/index.js scene inspect --verbose
```

`bridge start` returning `ok: true` means lifecycle startup succeeded.

Blender GUI remaining open is expected while bridge is running; do not wait for Blender to exit.

Windows Blender path override:

```bash
node apps/cli/dist/index.js bridge start --mode gui --blender "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --verbose
```

Managed lifecycle artifacts are written under `.tmp/blendops/`:

- `.tmp/blendops/bridge-process.json`
- `.tmp/blendops/bridge.stdout.log`
- `.tmp/blendops/bridge.stderr.log`
- `.tmp/blendops/start_bridge_gui.py`

## 🧰 CLI setup and examples

Use built CLI directly for strict stdout JSON behavior:

```bash
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js object create --type cube --name test_cube --location 0,0,1
node apps/cli/dist/index.js validate scene --preset basic
node apps/cli/dist/index.js render preview --output renders/preview.png
```

> ⚠️ `npm run cli -- ...` may include npm wrapper lines. For strict JSON stdout, use `node apps/cli/dist/index.js ...`.

## 🧠 MCP setup for AI clients

Run MCP server:

```bash
npm run build
node apps/mcp-server/dist/index.js
```

Example MCP client config:

```json
{
  "mcpServers": {
    "blendops": {
      "command": "node",
      "args": ["D:/Code/blendops/apps/mcp-server/dist/index.js"],
      "env": {
        "BLENDOPS_BRIDGE_URL": "http://127.0.0.1:8765"
      }
    }
  }
}
```

## 🧩 Blender addon fallback/manual install

If automated managed bridge startup fails, manually install and enable the addon:

```txt
Blender → Edit → Preferences → Add-ons → Install...
Select: apps/blender-addon/blendops_addon
Enable: BlendOps Bridge
Confirm: node apps/cli/dist/index.js bridge status --verbose
```

This fallback keeps runtime usage available when automatic bootstrap cannot establish readiness.

## ⚙️ Environment variables

- `BLENDOPS_BLENDER_PATH`: default Blender executable path for `bridge start`
- `BLENDOPS_BRIDGE_URL`: bridge URL override (CLI/MCP/core client)
- `BLENDER_BRIDGE_URL`: legacy bridge URL override (still supported)
- `BLENDOPS_MCP_VERBOSE=1`: enable MCP stderr diagnostics
- `BLENDOPS_VERBOSE=1`: alternative verbose toggle for MCP

## 🧯 Troubleshooting

### Blender not found

- Provide `--blender` explicitly
- Or set `BLENDOPS_BLENDER_PATH`

### Bridge not ready

```bash
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge status --verbose
```

If `bridge start` succeeded but readiness is still unhealthy, treat this as stale bridge/process/port state and run recovery:

```bash
node apps/cli/dist/index.js bridge stop
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
```

If still failing, use manual addon fallback.

### Wrong working directory

Run commands from repo root where `apps/` and `packages/` exist.

If you previously saw `MODULE_NOT_FOUND`, rerun from repo root (for example `D:\Code\blendops`) before bridge lifecycle commands.

### Background GLB limitation

Blender 4.2 GLB/GLTF export requires GUI window context. Background mode is limited/unvalidated for persistent bridge runtime and GLB/GLTF export validation.

## Next step

- Continue with [AI-agent usage guide](./ai-agent-usage.md) for MCP-first workflows.
