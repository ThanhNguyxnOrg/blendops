# Install target: Zed editor

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Zed is an editor with **native MCP support** (Tools and Prompts; Resources and Sampling not yet). BlendOps install for Zed is **project-local** plus **MCP server config in `settings.json` or via Zed extensions**.

For Blender execution, Zed acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`).

## Copy/paste prompt

```txt
Install BlendOps for Zed editor using a reversible project-local approach.

Requirements:
- Project-local fallback (BLENDOPS.md / AGENTS.md) preferred.
- Avoid global writes by default.
- For Blender runtime via Zed as MCP host:
  - Add MCP server in settings.json under "context_servers" key, OR install via Zed marketplace extension.
  - For HTTP/SSE MCP transport (Zed supports since November 2025), use directly.
  - For stdio-only Blender MCP servers (Path 1 .mcpb default, Path 2 uvx default), Zed runs them directly.
  - Remote MCP servers supported (since January 2026) via "remote": true in settings.
- Do not install Blender, do not run Blender.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Zed supports MCP Tools + Prompts. Source: https://zed.dev/docs/ai/mcp.
- Two install methods: Zed marketplace extension OR `settings.json` `context_servers` key.
- HTTP / SSE transport supported (PR #39021, merged November 2025).
- Remote MCP servers via `"remote": true` (PR #46756, January 2026).
- Resources and Sampling MCP features not yet supported in Zed.

## Expected files/folders

- Zed `settings.json` (`~/.config/zed/settings.json` on Linux, `~/Library/Application Support/Zed/settings.json` on macOS, `%AppData%\Zed\settings.json` on Windows).
- Project-local `BLENDOPS.md` (generic fallback).
- No global writes from BlendOps unless explicitly approved.

## Example `settings.json` snippet

```json
{
  "context_servers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

(For Path 1 Lab MCP: replace with the Lab `.mcpb` bundle command per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/).)

## Rollback notes

- Remove the `blender` entry from `settings.json` `context_servers`.
- Remove `BLENDOPS.md` if BlendOps created it.
- Restart Zed.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Zed as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Zed BlendOps Skills loader (none exists; BlendOps is content + MCP).
- MCP Resources / Sampling support in Zed (not yet available).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Zed.
