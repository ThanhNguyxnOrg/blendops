# BlendOps

Safe, inspectable Blender automation for AI agents via CLI + MCP + a managed Blender bridge.

BlendOps focuses on deterministic, schema-validated operations and structured JSON responses.

## What BlendOps is

BlendOps combines three layers:

- Typed CLI for deterministic local workflows
- MCP server for agent tool-calling
- Blender bridge for runtime operations

## Requirements

- Node.js >= 18
- Blender >= 3.6

## Quick install

```bash
git clone https://github.com/ThanhNguyxnOrg/blendops.git
cd blendops
npm install
npm run build
```

## Start Blender bridge

Primary path (automated bridge startup):

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge operations --verbose
node apps/cli/dist/index.js scene inspect --verbose
```

Windows explicit Blender path:

```powershell
node apps/cli/dist/index.js bridge start --mode gui --blender "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe" --verbose
```

## CLI quick examples

```bash
node apps/cli/dist/index.js object create --type cube --name test_cube --location 0,0,1
node apps/cli/dist/index.js validate scene --preset basic
node apps/cli/dist/index.js render preview --output renders/preview.png
```

## MCP quick setup

```bash
npm run build
node apps/mcp-server/dist/index.js
```

Generic MCP config:

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

## Full documentation

- [Documentation index](./docs/README.md)
- [Install guide](./docs/install.md)
- [AI agent usage](./docs/ai-agent-usage.md)
- [Manual test guide](./docs/manual-test.md)
- [Observability guide](./docs/observability.md)
- [Eval prompts](./docs/evals.md)

## Known limitations

- Blender 4.2 GLB/GLTF export requires GUI bridge mode.
- Background mode is limited/unvalidated for persistent bridge runtime.
- No arbitrary Python execution endpoint is exposed by default.

## License

MIT — see [LICENSE](./LICENSE).
