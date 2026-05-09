# Bridge State Matrix Template

Build this matrix before proposing any resolution. Every row represents one MCP client OR Blender-side add-on for the **target Blender instance**.

## Template

```md
## Bridge state matrix

Target Blender instance: <path or "the running session">
`blender --version`: <verbatim>
Date: <YYYY-MM-DD>

### MCP client side

| Client | Currently registered for this Blender? | Server source | Path | Notes |
|---|---|---|---|---|
| Claude Desktop — Anthropic Connector toggle | Yes / No | (Anthropic helper) | Path 1 host (a) | |
| Claude Desktop — manual `mcpServers` JSON | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| Claude Code | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| Cursor | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| Codex CLI/App | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| OpenCode | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| Cline | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| Continue.dev | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| Zed | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| goose | Yes / No | <command + args> | Path 1 host (b) OR Path 2 | |
| Ollama | Yes / No | <`~/.ollama/mcp-servers.json` entry> | Path 1 host (b) OR Path 2 | |
| LM Studio | Yes / No | <`mcp.json` entry> | Path 1 host (b) OR Path 2 | |
| Open WebUI | Yes / No | <Streamable HTTP URL> | Path 1 host (b) OR Path 2 | |

### Blender side (always check both)

| Add-on | Enabled in Blender? | Version / commit | Path |
|---|---|---|---|
| Blender Lab MCP add-on (`bpype/blender_mcp`) | Yes / No | <Lab add-on version, e.g. mcp-1.0.0> | Path 1 |
| Community `ahujasid/blender-mcp` `addon.py` | Yes / No | <upstream commit SHA> | Path 2 |

### Port state

| Port | Listener (if known) | Notes |
|---|---|---|
| `localhost:9876` | <process name + PID> or `unknown` | Common default for both Lab MCP and `ahujasid/blender-mcp` |
| Other (if changed) | | |
```

## How to fill `Currently registered for this Blender?`

Read the client's MCP config file:

| Client | Config location |
|---|---|
| Claude Desktop | Settings → Developer → Edit Config (path varies by OS) |
| Claude Code | Per Claude Code docs; project-local settings |
| Cursor | `.cursor/mcp.json` or Cursor Settings |
| Cline | Cline Settings → Integrations |
| Continue.dev | `.continue/mcpServers/*.yaml` or `*.json` |
| Zed | `settings.json` `context_servers` key |
| goose | goose config (per upstream) |
| Ollama | `~/.ollama/mcp-servers.json` |
| LM Studio | `mcp.json` |
| Open WebUI | Admin Settings → External Tools |

## How to fill the Blender-side rows

In Blender: Edit → Preferences → Add-ons → search "MCP" or "blender_mcp". Note the enabled checkbox state.

## How to fill port state

```bash
# macOS / Linux
lsof -i :9876
# OR
netstat -an | grep 9876

# Windows PowerShell
Get-NetTCPConnection -LocalPort 9876 -ErrorAction SilentlyContinue
# OR
netstat -ano | findstr 9876
```

If no log access, mark `unknown` explicitly. **Don't guess.**
