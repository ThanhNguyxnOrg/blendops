# Install and Bridge Bootstrap

## Prerequisites

- Node.js >= 18
- npm >= 9
- Blender >= 3.6
- For validated GLB/GLTF runtime on Blender 4.2, use GUI bridge mode

## Clone, install, build

```bash
git clone https://github.com/ThanhNguyxnOrg/blendops.git
cd blendops
npm install
npm run clean
npm run typecheck
npm run build
```

## CLI setup and usage

Use built CLI directly for strict stdout JSON behavior:

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge operations --verbose
node apps/cli/dist/index.js scene inspect --verbose
```

Bridge lifecycle commands:

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge stop
```

Windows Blender path override:

```bash
node apps/cli/dist/index.js bridge start --mode gui --blender "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --verbose
```

## MCP setup

Run MCP server:

```bash
npm run mcp-server
```

Or run built server directly:

```bash
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

## Blender addon automated startup

Preferred path is managed bridge bootstrap via CLI/MCP lifecycle helpers.

`bridge start --mode gui` generates a fixed startup script under `.tmp/blendops/start_bridge_gui.py`, starts Blender non-blocking, and polls bridge readiness at `http://127.0.0.1:8765/status`.

Managed lifecycle artifacts:

- `.tmp/blendops/bridge-process.json`
- `.tmp/blendops/bridge.stdout.log`
- `.tmp/blendops/bridge.stderr.log`
- `.tmp/blendops/start_bridge_gui.py`

## Manual addon fallback

If automated startup fails:

1. Open Blender
2. Edit → Preferences → Add-ons → Install...
3. Select `apps/blender-addon/blendops_addon`
4. Enable **BlendOps Bridge**
5. Verify bridge with:

```bash
node apps/cli/dist/index.js bridge status --verbose
```

## Environment variables

- `BLENDOPS_BLENDER_PATH`: default Blender executable path for `bridge start`
- `BLENDOPS_BRIDGE_URL`: bridge URL override (CLI/MCP/core client)
- `BLENDER_BRIDGE_URL`: legacy bridge URL override (still supported)
- `BLENDOPS_MCP_VERBOSE=1`: enable MCP stderr diagnostics
- `BLENDOPS_VERBOSE=1`: alternative verbose toggle for MCP

## Troubleshooting

### Blender not found

- Provide `--blender` explicitly
- Or set `BLENDOPS_BLENDER_PATH`

### Bridge not ready

```bash
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge status --verbose
```

If still failing, use manual addon fallback.

### Wrong working directory

Run commands from repo root where `apps/` and `packages/` exist.

### npm wrapper stdout lines

Prefer direct built command:

```bash
node apps/cli/dist/index.js ...
```

`npm run cli -- ...` can print wrapper lines that break strict JSON-only stdout expectations.

### Background GLB limitation

Blender 4.2 GLB/GLTF export requires GUI window context. Background mode is limited/unvalidated for persistent bridge runtime and GLB/GLTF export validation.
