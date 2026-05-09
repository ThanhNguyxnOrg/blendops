# Install target: Continue.dev

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Continue.dev is a **VS Code / JetBrains AI assistant** with MCP support in its **agent mode**. BlendOps install for Continue is **project-local** (`BLENDOPS.md`) plus **MCP server config in `.continue/mcpServers/`** (YAML or JSON, supports standard MCP JSON formats from Claude Desktop / Cursor / LM Studio / etc. — paste-and-go).

For Blender execution, Continue acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`).

## Copy/paste prompt

```txt
Install BlendOps for Continue.dev using a reversible project-local approach.

Requirements:
- Project-local fallback (BLENDOPS.md / AGENTS.md) preferred.
- Avoid global writes by default.
- For Blender runtime via Continue as MCP host (agent mode only):
  - Create .continue/mcpServers/ folder at workspace root.
  - Add a YAML config (e.g. blender-mcp.yaml) OR paste a standard MCP JSON config.
  - Continue accepts the same JSON format as Claude Desktop / Cursor / LM Studio.
  - Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender session.
- Do not install Blender, do not run Blender.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Continue MCP support via `.continue/mcpServers/` folder at workspace top level. Source: https://docs.continue.dev/customize/deep-dives/mcp.
- Supports both YAML and standard MCP JSON formats. Source: PR https://github.com/continuedev/continue/pull/7956.
- MCP usable in agent mode only (not chat mode).

## Expected files/folders

- Workspace-local `.continue/mcpServers/blender-mcp.yaml` (or `.json`).
- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- No global writes from BlendOps unless explicitly approved.

## Example `.continue/mcpServers/blender-mcp.yaml`

```yaml
name: blender
command: uvx
args:
  - blender-mcp
```

(For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and replace the `command`/`args` accordingly.)

## Rollback notes

- Remove the `.continue/mcpServers/blender-mcp.{yaml,json}` file.
- Remove `BLENDOPS.md` if BlendOps created it.
- Restart Continue.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Continue as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Publisher has not verified.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Continue BlendOps Skills loader (none exists; BlendOps is content + MCP).
- MCP support in chat mode (it is agent mode only).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Continue.
