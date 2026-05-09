# Install target: Google Antigravity

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Antigravity is **Google's AI IDE with native MCP support**. BlendOps install for Antigravity follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config via the MCP Store GUI or `mcp_config.json`** when the user wants Blender runtime through Antigravity.

For Blender execution, Antigravity acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Google Antigravity using a reversible project-local approach.

Requirements:
- Treat Antigravity as project-local-first.
- Verify Antigravity-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Antigravity as MCP host, choose ONE of:
  - GUI: Agent Manager drop-down (...) → Manage MCP Servers in the MCP Store → View raw config.
  - File: edit Antigravity's `mcp_config.json` directly (path per upstream docs for current OS / install).
- Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
- Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Antigravity supports MCP servers via the MCP Store GUI and `mcp_config.json`. Source: https://codelabs.developers.google.com/google-workspace-mcp-antigravity and https://appwrite.io/docs/tooling/mcp/antigravity.
- The Google Cloud Data Agent Kit extension supports remote MCP servers for AlloyDB, BigQuery, Cloud SQL, Spanner, etc. Source: https://docs.cloud.google.com/data-cloud-extension/antigravity/use-mcp-servers.
- `uv` (for Python-based servers) and Node.js/npm (for JavaScript servers) are typical prerequisites for stdio MCP launchers like `uvx blender-mcp`.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- Antigravity's `mcp_config.json` (managed via the MCP Store GUI or edited manually).
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

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in Antigravity's MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Antigravity Agent Manager → MCP Store → remove the Blender entry, OR remove it from `mcp_config.json` directly.
- Restart the Antigravity session.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Antigravity as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Antigravity BlendOps Skills loader (none exists yet beyond MCP).
- That `.agent/skills/` is the canonical BlendOps location (it was a candidate path; project-local files first per [`docs/install-scopes.md`](../install-scopes.md)).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Antigravity.
