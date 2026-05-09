# Connector vs manual MCP matrix (Path 1)

| Host style | Typical products | User installs |
|---|---|---|
| Anthropic-hosted UI path | Claude Desktop with Blender Connector tutorial | Blender + Lab MCP add-on + Connector linkage per Anthropic tutorial |
| Manual MCP client | Cursor, Claude Code, Codex, OpenCode, VS Code agents, Zed, etc. | Blender + Lab MCP add-on + client's MCP server entry pointing at Lab server |

Shared invariant: **Lab MCP add-on inside Blender** starts the Blender-side MCP surface. Host differences are wiring only.

Connector is **not standalone** — treat it as a convenience host once Blender-side prerequisites exist.
