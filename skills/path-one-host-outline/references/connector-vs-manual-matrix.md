# Path 1 Host Outline — Connector `(a)` vs Manual MCP `(b)`

Both Path 1 host options share the **exact same Blender-side engine**: Official Blender Lab MCP add-on running inside **Blender 5.1+**. Only the client-side wiring differs.

| Aspect | Host `(a)` — Anthropic Connector | Host `(b)` — Manual MCP Client |
|---|---|---|
| **Typical clients** | Claude Desktop / Anthropic UI Connector flow | Claude Code, Cursor, Codex, OpenCode, Windsurf, Cline, Zed, Continue |
| **Blender version floor** | Blender **5.1+** | Blender **5.1+** |
| **Blender-side add-on** | Install & enable Blender Lab MCP add-on inside Blender preferences | Install & enable Blender Lab MCP add-on inside Blender preferences |
| **Client transport wiring** | Linked via Connector extension UI per Anthropic tutorial | Configured in client MCP JSON/TOML/YAML (`mcpServers` pointing at Lab server) |
| **Trust boundary** | Standalone Connector **cannot** operate without Lab add-on enabled | Client executes only upstream Lab tool schemas; no BlendOps-owned bridge |
| **Safe initial check** | Read-only scene introspection (`tier0_read_only`) | Read-only scene introspection (`tier0_read_only`) before any write |

## Ordering Rule
1. Confirm Blender version is `5.1+`.
2. Confirm no competing Path 2 bridge add-on is enabled inside Blender (`bridge-conflicts`).
3. Enable Blender Lab MCP add-on inside Blender first.
4. Attach Host `(a)` OR Host `(b)` — never claim readiness before observed tool handshake.

## Related skill
- [SKILL.md](../SKILL.md)
