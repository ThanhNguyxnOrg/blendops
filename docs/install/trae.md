# Install target: Trae (ByteDance AI IDE)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Trae is **ByteDance's AI IDE** with **native MCP support since v1.3.0**. BlendOps install for Trae follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config via Trae → Settings → MCP → Add Manually** when the user wants Blender runtime through Trae.

For Blender execution, Trae acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Trae (ByteDance) using a reversible project-local approach.

Requirements:
- Treat Trae as project-local-first.
- Verify Trae-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Trae as MCP host:
  - Trae → Settings → MCP → Add Manually.
  - Provide JSON entry for Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
  - Save and confirm the connection status; restart the Trae session if prompted.
  - Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Trae IDE supports MCP servers natively from v1.3.0+. Source: https://docs.trae.ai/ide/add-mcp-servers.
- MCP servers are added via Settings → MCP → Add Manually using the standard `mcpServers` JSON format.
- Remote MCP servers are also supported (URL + headers / token).
- Trae publishes a separate `bytedance/trae-agent` open-source project; this install doc covers the **Trae IDE** consumer only.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- Trae-managed MCP config (no project file written by BlendOps; the IDE owns the config storage).
- No global system writes from BlendOps unless explicitly approved.

## Example MCP config snippet (linked-only)

Local stdio:

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

Remote (HTTP) form per upstream docs:

```json
{
  "mcpServers": {
    "blender-remote": {
      "url": "https://example.com/mcp",
      "headers": {
        "Token": "your_access_token"
      }
    }
  }
}
```

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference its launcher instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Trae → Settings → MCP → remove the Blender entry.
- Restart the Trae session.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Trae as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Trae BlendOps Skills loader (none exists yet beyond MCP).
- That `bytedance/trae-agent` (the OSS project) is the same consumer as the Trae IDE — they are separate; this doc covers the IDE.
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Trae.
