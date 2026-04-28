# BlendOps

[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Blender >=3.6](https://img.shields.io/badge/blender-%3E%3D3.6-F5792A?logo=blender&logoColor=white)](https://www.blender.org/)
![Foundation mode](https://img.shields.io/badge/status-foundation-0EA5E9)
![No arbitrary Python](https://img.shields.io/badge/security-no%20arbitrary%20python-16A34A)

BlendOps is currently a **minimal safe runtime foundation** for AI-driven Blender workflows.

It is not trying to replace Blender CLI, and it is not a clone of `ahujasid/blender-mcp`.

- **Official Blender CLI** is the runtime primitive.
- **BlendOps** adds typed operations, lifecycle control, readiness/status/logs, and request correlation.
- **Future product direction**: AI-native workflows for users who do not know Blender internals.

See [docs/product-direction.md](./docs/product-direction.md).

## What BlendOps is (right now)

BlendOps currently commits to this foundation path:

- `blendops --help`
- `blendops doctor`
- `bridge start/status/logs/stop`
- `scene inspect`
- `object create` (minimal)
- MCP server startup + tool listing
- request envelope fields (`request_id`, `receipt`)
- addon/bridge main-thread dispatch

Infrastructure surfaces (CLI/MCP/addon/core/schemas) are implementation layers, not the finished end-user product.

## What BlendOps is not trying to do in this pass

- Rebuild Blender’s official CLI
- Clone `ahujasid/blender-mcp`
- Expose arbitrary Python execution
- Expose unrestricted Blender CLI flags to AI users
- Present broad low-level operation coverage as final product promise

## Quick start

```bash
git clone https://github.com/ThanhNguyxnOrg/blendops.git
cd blendops
npm install
npm run build
```

Core checks:

```bash
blendops --help
npm run doctor
```

## Managed bridge lifecycle

```bash
blendops bridge start --mode gui --verbose
blendops bridge status --verbose
blendops bridge logs --tail 80
blendops bridge stop --verbose
```

`bridge start` returning `ok: true` means startup handoff succeeded.

Blender GUI staying open is expected while bridge is running; use bridge status/logs for readiness.

## Minimal foundation commands

```bash
blendops scene inspect --verbose
blendops object create --type cube --name foundation_cube --location 0,0,1 --verbose
```

## MCP startup (foundation)

```bash
node apps/mcp-server/dist/index.js
```

Typical MCP config:

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

## Frozen/de-emphasized capabilities (still implemented)

These areas exist in code/runtime artifacts but are **not** current product promise:

- render/export breadth
- advanced validation preset breadth
- batch execution expansion (`batch.execute --dry-run` and real guarded path)
- material/lighting/camera expansion
- undo workflows
- creative prompt catalogs and broad scene recipes

They are retained to avoid unnecessary churn and preserve existing integration stability.

## Safety boundaries

- No arbitrary Python endpoint
- Typed operation contracts only
- Structured error and recovery messaging
- Correlatable operation receipts

## Docs map

- Direction: [docs/product-direction.md](./docs/product-direction.md)
- Prune audit: [docs/foundation-prune-audit.md](./docs/foundation-prune-audit.md)
- Foundation parity: [docs/runtime-foundation-parity.md](./docs/runtime-foundation-parity.md)
- Install: [docs/install.md](./docs/install.md)
- MCP setup: [docs/mcp-setup.md](./docs/mcp-setup.md)
- Observability: [docs/observability.md](./docs/observability.md)
- Runtime evidence index: [docs/README.md](./docs/README.md)

## License

MIT — see [LICENSE](./LICENSE)
