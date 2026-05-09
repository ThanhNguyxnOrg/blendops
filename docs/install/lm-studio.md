# Install target: LM Studio (local LLM)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

LM Studio is a **local LLM runner with native MCP support** since version 0.3.17 ([release notes](https://lmstudio.ai/blog/mcp)). BlendOps install for LM Studio is **docs-only / reference** + **MCP server config in `mcp.json`** (Cursor-compatible JSON notation).

For Blender execution, LM Studio acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`).

## Copy/paste prompt

```txt
I want to use BlendOps content with LM Studio (local LLM, MCP since 0.3.17).

Requirements:
- Treat LM Studio as docs-only / reference; no global config writes from BlendOps.
- Provide BlendOps planning/readiness/evidence/handoff guidance for the local LLM session.
- For Blender runtime via LM Studio as MCP host:
  - Edit LM Studio mcp.json (Cursor-compatible notation).
  - Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
  - Restart LM Studio so it discovers the new server.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and confidence labels.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- LM Studio 0.3.17+ supports MCP via `mcp.json` (Cursor notation). Source: https://lmstudio.ai/docs/app/mcp.
- LM Studio 0.4.0+ supports MCP usage via API (ephemeral or pre-configured). Source: https://lmstudio.ai/docs/developer/core/mcp.

## Expected files/folders

- LM Studio `mcp.json` (location per upstream docs; varies by OS).
- No global writes from BlendOps.

## Example `mcp.json` snippet (linked-only)

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

(For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) instructions and reference it in `mcp.json`.)

## Rollback notes

- Remove or comment the `blender` entry from `mcp.json`.
- Restart LM Studio.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via LM Studio as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only; not applicable here.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Publisher has not verified.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native LM Studio BlendOps Skills loader support (none exists; LM Studio is an LLM runner).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for LM Studio.
