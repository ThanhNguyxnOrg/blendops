# Install target: Windsurf (Codeium IDE — Cascade agent)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Windsurf is **Codeium's AI IDE with the Cascade agent and native MCP support** (since early 2026). BlendOps install for Windsurf follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config in `~/.codeium/windsurf/mcp_config.json`** when the user wants Blender runtime through Windsurf.

For Blender execution, Windsurf's Cascade acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Windsurf (Cascade) using a reversible project-local approach.

Requirements:
- Treat Windsurf as project-local-first.
- Verify Windsurf-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Windsurf Cascade as MCP host:
  - Edit `~/.codeium/windsurf/mcp_config.json` (macOS/Linux) or `%USERPROFILE%\.codeium\windsurf\mcp_config.json` (Windows).
  - OR use the Cascade MCP marketplace icon if BlendOps later registers a deeplink (none today).
  - Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
  - Cascade picks up config changes without restart, but verify connection status in the MCPs panel.
  - Watch the 100-tool Cascade ceiling — Blender MCP can publish many tools; trim if exceeded.
  - Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Windsurf added native MCP in early 2026 via the Cascade agent. Source: https://docs.windsurf.com/windsurf/cascade/mcp.
- Config file: `~/.codeium/windsurf/mcp_config.json` (macOS/Linux) or `%USERPROFILE%\.codeium\windsurf\mcp_config.json` (Windows).
- Supports STDIO, Streamable HTTP, and SSE transports.
- Cascade has a hard 100-tool ceiling across all configured MCPs.
- Enterprise users must enable MCP via settings.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- User-level `mcp_config.json` under `~/.codeium/windsurf/`.
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

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in Windsurf's MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Remove the Blender entry from `~/.codeium/windsurf/mcp_config.json`.
- Cascade re-reads on next config change; verify the MCPs panel.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Windsurf Cascade as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Windsurf BlendOps Skills loader (none exists yet beyond MCP).
- That `~/.codeium/windsurf/` is the canonical BlendOps location (it hosts MCP config only; BlendOps content stays project-local per [`docs/install-scopes.md`](../install-scopes.md)).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Windsurf.
