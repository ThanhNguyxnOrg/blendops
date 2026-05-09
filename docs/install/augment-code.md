# Install target: Augment Code

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Augment Code is an **AI coding agent with native MCP integration** (Easy MCP one-click + Settings panel + JSON import). BlendOps install for Augment Code follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config via the Augment Settings panel or `~/.augment/settings.json`** when the user wants Blender runtime through Augment Code.

For Blender execution, Augment Code acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Augment Code using a reversible project-local approach.

Requirements:
- Treat Augment Code as project-local-first.
- Verify Augment-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Augment Code as MCP host, choose ONE of:
  - Easy MCP: Augment panel → "+" → enter API token / OAuth (only relevant if BlendOps later registers there; currently NOT registered).
  - Settings panel: Augment Settings → MCP servers → add new entry.
  - File: edit `~/.augment/settings.json` (supports http / sse / stdio transports + ${workspaceFolder} expansion).
- Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
- Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Augment Code supports MCP servers via three methods: Easy MCP (one-click for popular tools, launched July 2025), the Augment Settings panel, and JSON import. Source: https://docs.augmentcode.com/setup-augment/mcp.
- Custom configuration at `~/.augment/settings.json` supports http / sse / stdio transports, environment variables, and `${workspaceFolder}` expansion. Source: https://docs.augmentcode.com/cli/integrations.md.
- A separate Context Engine MCP provides semantic code understanding; orthogonal to BlendOps. Source: https://docs.augmentcode.com/context-services/mcp/overview.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- User-level `~/.augment/settings.json` for MCP config (only when user opts into manual JSON edit instead of the Settings panel).
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

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in Augment's MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Augment Settings panel → MCP servers → remove the Blender entry, OR remove it from `~/.augment/settings.json` directly.
- Restart the Augment Code session.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Augment Code as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Augment Code BlendOps Skills loader (none exists yet beyond MCP).
- That BlendOps is registered in Easy MCP one-click (it is not; user must add manually via Settings panel or JSON).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Augment Code.
