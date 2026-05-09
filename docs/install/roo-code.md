# Install target: Roo Code (VS Code extension)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Roo Code is a **VS Code coding agent (Cline fork) with native MCP support**. BlendOps install for Roo Code follows the same project-local pattern as Claude Code / Cursor / Cline (write `BLENDOPS.md` and / or project rules per upstream) plus optional **MCP server config in `.roo/mcp.json` (project) or global `mcp_settings.json`** when the user wants Blender runtime through Roo Code.

For Blender execution, Roo Code acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Roo Code (VS Code) using a reversible project-local approach.

Requirements:
- Treat Roo Code as project-local-first.
- Verify Roo Code-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Roo Code as MCP host:
  - Edit `.roo/mcp.json` (project-level) or global `mcp_settings.json` per upstream docs.
  - Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
  - Restart Roo Code session after adding.
  - Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Roo Code supports MCP via two configuration levels: project-local `.roo/mcp.json` and global `mcp_settings.json` (VS Code Settings → Roo Code). Source: https://docs.roocode.com/features/mcp/using-mcp-in-roo.
- Project-level configuration takes precedence when the same server name exists in both.
- Supports STDIO, Streamable HTTP, and SSE transports.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies: if multiple MCP servers target the same Blender instance, the second silently fails.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- `.roo/mcp.json` for project-level MCP config OR global `mcp_settings.json` (user choice).
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

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in Roo Code's MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Remove the Blender entry from `.roo/mcp.json` (or global `mcp_settings.json`).
- Restart the Roo Code session.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Roo Code as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Roo Code BlendOps Skills loader (none exists yet beyond MCP).
- That `.roo/` is the canonical BlendOps location (it is one option; project-local files first per [`docs/install-scopes.md`](../install-scopes.md)).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Roo Code.
