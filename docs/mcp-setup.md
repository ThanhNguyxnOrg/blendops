# 🧠 MCP Setup Guide

> 📚 Docs: [Index](./README.md) · [Install](./install.md) · [MCP Setup](./mcp-setup.md) · [AI usage](./ai-agent-usage.md)

This guide provides MCP server configuration examples for various AI clients.

## Prerequisites

- BlendOps built from source: `npm run build`
- MCP server entry point: `apps/mcp-server/dist/index.js`

## Configuration Examples

### Claude Desktop / Claude Code

Add to your MCP settings file:

**Windows** (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "blendops": {
      "command": "node",
      "args": ["D:\\Code\\blendops\\apps\\mcp-server\\dist\\index.js"],
      "env": {
        "BLENDOPS_BRIDGE_URL": "http://127.0.0.1:8765",
        "BLENDOPS_MCP_VERBOSE": "1"
      }
    }
  }
}
```

**macOS/Linux** (`~/.config/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "blendops": {
      "command": "node",
      "args": ["/path/to/blendops/apps/mcp-server/dist/index.js"],
      "env": {
        "BLENDOPS_BRIDGE_URL": "http://127.0.0.1:8765",
        "BLENDOPS_MCP_VERBOSE": "1"
      }
    }
  }
}
```

### Cursor / Generic MCP Clients

```json
{
  "mcpServers": {
    "blendops": {
      "command": "node",
      "args": ["/absolute/path/to/blendops/apps/mcp-server/dist/index.js"],
      "cwd": "/absolute/path/to/blendops",
      "env": {
        "BLENDOPS_BRIDGE_URL": "http://127.0.0.1:8765"
      }
    }
  }
}
```

### OpenCode / Codex

For OpenCode-style MCP integration, use the command path directly:

```bash
node /path/to/blendops/apps/mcp-server/dist/index.js
```

Or if `blendops` is linked via `npm link`:

```bash
blendops-mcp
```

(Note: MCP server does not expose a `blendops-mcp` bin by default; use node path for now.)

## Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `BLENDOPS_BRIDGE_URL` | Bridge HTTP endpoint | `http://127.0.0.1:8765` |
| `BLENDOPS_BLENDER_PATH` | Blender executable path | Auto-detected |
| `BLENDOPS_MCP_VERBOSE` | Enable MCP stderr diagnostics | `0` (off) |
| `BLENDOPS_VERBOSE` | Alternative verbose toggle | `0` (off) |

## Validation

Test MCP server manually:

```bash
node apps/mcp-server/dist/index.js
```

The server runs over stdio and waits for MCP protocol messages. If it starts without errors, configuration is correct.

For full validation, use the MCP client to call `start_bridge` and `list_operations`.

## Troubleshooting

### MCP server not starting

- Verify build: `npm run build`
- Check Node version: `node --version` (must be >= 18)
- Check path: `node apps/mcp-server/dist/index.js` should not error

### Bridge not connecting

- Start bridge first: `node apps/cli/dist/index.js bridge start --mode gui --verbose`
- Verify bridge status: `node apps/cli/dist/index.js bridge status --verbose`
- Check `BLENDOPS_BRIDGE_URL` matches bridge port (default 8765)

### Verbose logging not showing

- Set `BLENDOPS_MCP_VERBOSE=1` in MCP config `env` block
- MCP diagnostics go to stderr, not stdout
- Check MCP client's stderr/log output location

## Next Steps

- [AI-agent usage guide](./ai-agent-usage.md) for MCP tool workflows
- [Manual test guide](./manual-test.md) for CLI validation
- [Observability guide](./observability.md) for debugging
