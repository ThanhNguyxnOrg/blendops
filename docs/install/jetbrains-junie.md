# Install target: JetBrains Junie / AI Assistant

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Junie is JetBrains' AI coding agent (across JetBrains IDEs and Junie CLI) with **native MCP support shared with JetBrains AI Assistant**. BlendOps install for Junie follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config via Settings → Tools → Junie → MCP Settings**, or `.junie/mcp/mcp.json` (project) / `~/.junie/mcp/mcp.json` (user) when the user wants Blender runtime through Junie.

For Blender execution, Junie acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for JetBrains Junie / AI Assistant using a reversible project-local approach.

Requirements:
- Treat Junie as project-local-first.
- Verify Junie-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Junie / AI Assistant as MCP host, choose ONE of:
  - IDE: Settings → Tools → Junie → MCP Settings (or Tools → AI Assistant → Model Context Protocol (MCP)).
  - File: edit `.junie/mcp/mcp.json` (project-level) OR `~/.junie/mcp/mcp.json` (user-level).
  - Junie CLI: use the `/mcp` slash command's MCP Installation Assistant.
- Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
- Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Junie shares MCP configuration with JetBrains AI Assistant. Source: https://junie.jetbrains.com/docs/junie-plugin-mcp-settings.html and https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html.
- IDE path: Settings → Tools → Junie → MCP Settings, or Settings → Tools → AI Assistant → Model Context Protocol (MCP).
- Junie CLI uses `.junie/mcp/mcp.json` (project) or `~/.junie/mcp/mcp.json` (user). The `/mcp` slash command opens an Installation Assistant.
- Supports STDIO and Streamable HTTP transports.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- `.junie/mcp/mcp.json` (project-level) OR `~/.junie/mcp/mcp.json` (user-level) for Junie CLI.
- IDE-managed `mcp.json` opened from Settings → Tools → Junie → MCP Settings.
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

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in Junie's MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- IDE: Settings → Tools → Junie → MCP Settings → remove Blender entry.
- CLI / file: remove the Blender entry from `.junie/mcp/mcp.json` or `~/.junie/mcp/mcp.json`.
- Restart the IDE / Junie session.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Junie / AI Assistant as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- That Junie or AI Assistant ships a native BlendOps Skills loader (it does not — install is project-local + MCP host).
- That `.junie/` is the canonical BlendOps location (it hosts MCP config only; BlendOps content stays project-local per [`docs/install-scopes.md`](../install-scopes.md)).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Junie / AI Assistant.
