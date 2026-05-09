# Install target: OpenHands (formerly OpenDevin)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

OpenHands is an **open-source software-engineering agent with native MCP support** across CLI, SDK, Local GUI, and OpenHands Cloud. BlendOps install for OpenHands follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config in `~/.openhands/mcp.json` or via the Settings UI / `openhands mcp` CLI** when the user wants Blender runtime through OpenHands.

For Blender execution, OpenHands acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for OpenHands using a reversible project-local approach.

Requirements:
- Treat OpenHands as project-local-first.
- Verify OpenHands-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via OpenHands as MCP host, choose ONE of:
  - UI: Settings → MCP → add server.
  - CLI: openhands mcp add blender --transport stdio uvx blender-mcp
  - File: edit ~/.openhands/mcp.json directly.
- Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
- Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- OpenHands supports MCP across CLI, SDK, Local GUI, and OpenHands Cloud. Source: https://docs.openhands.dev/openhands/usage/settings/mcp-settings and https://docs.openhands.dev/openhands/usage/cli/mcp-servers.
- Config file: `~/.openhands/mcp.json` (CLI). UI path: Settings → MCP.
- CLI commands: `openhands mcp list / add / enable / disable`.
- Supports SSE, Streamable HTTP, and STDIO transports.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- User-level `~/.openhands/mcp.json` for MCP config.
- No global system writes from BlendOps unless explicitly approved.

## Example MCP config snippet (linked-only)

```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in OpenHands' MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Run `openhands mcp disable blender` then `openhands mcp remove blender`, OR remove the entry from `~/.openhands/mcp.json` directly.
- Restart the OpenHands session.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via OpenHands as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native OpenHands BlendOps Skills loader (none exists yet beyond MCP).
- That `~/.openhands/` is the canonical BlendOps location (it hosts MCP config only; BlendOps content stays project-local per [`docs/install-scopes.md`](../install-scopes.md)).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for OpenHands.
