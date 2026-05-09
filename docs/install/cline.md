# Install target: Cline (VS Code extension)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Cline is a **VS Code coding agent with MCP support**. BlendOps install for Cline follows the same project-local pattern as Claude Code / Cursor / Codex / etc. (write `BLENDOPS.md` and / or `.clinerules` per upstream) plus optional **MCP server config in Cline's Integrations panel** when the user wants Blender runtime through Cline.

For Blender execution, Cline acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Cline (VS Code) using a reversible project-local approach.

Requirements:
- Treat Cline as project-local-first.
- Verify Cline-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Cline as MCP host:
  - Cline Settings → Integrations → Add MCP Server.
  - Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
  - Restart Cline after adding.
  - Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender session.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Cline supports MCP via Settings → Integrations → Add MCP Server. Source: https://docs.cline.bot/mcp-servers/mcp.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies: if multiple MCP servers target the same Blender, the second silently fails.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- Cline MCP config (Settings → Integrations).
- No global writes from BlendOps unless explicitly approved.

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

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in Cline's MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Cline Settings → Integrations → remove the Blender MCP entry.
- Restart Cline.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Cline as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Cline BlendOps Skills loader (none exists yet beyond MCP).
- That `.clinerules` is the canonical BlendOps location (it is one option; project-local files first per [`docs/install-scopes.md`](../install-scopes.md)).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Cline.
