# Install target: Open WebUI (local LLM frontend)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Open WebUI is a **frontend for local LLMs** (Ollama, OpenAI-compatible APIs, etc.) with native MCP support since version 0.6.31 ([docs](http://docs.openwebui.com/features/extensibility/mcp)). BlendOps install for Open WebUI is **docs-only / reference** + **MCP server config via Admin Settings → External Tools**.

For Blender execution, Open WebUI acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). Open WebUI specifically uses the **Streamable HTTP transport**; stdio-only servers may need a bridge package like `mcp-remote`.

## Copy/paste prompt

```txt
I want to use BlendOps content with Open WebUI (local LLM frontend, MCP since 0.6.31).

Requirements:
- Treat Open WebUI as docs-only / reference; no global writes from BlendOps.
- Provide BlendOps planning/readiness/evidence/handoff guidance.
- For Blender runtime via Open WebUI as MCP host:
  - Open Admin Settings → External Tools → Add Server.
  - Type: MCP (Streamable HTTP).
  - Set the server URL + auth.
  - Set WEBUI_SECRET_KEY env var so OAuth-connected MCP tools survive container restarts.
  - For stdio-only Blender MCP servers (Path 1 .mcpb default, Path 2 uvx default), use a bridge like mcp-remote to expose HTTP.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and confidence labels.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Open WebUI native MCP since v0.6.31. Source: http://docs.openwebui.com/features/extensibility/mcp.
- Streamable HTTP transport; stdio-only MCP servers need a bridge package (e.g. `mcp-remote`).
- Untrusted MCP servers can run arbitrary code; review upstream before adding.
- `WEBUI_SECRET_KEY` env var required for OAuth-connected MCP tools to persist across container restarts.

## Expected files/folders

- Open WebUI configuration (Admin Settings → External Tools); location depends on Docker / native install.
- `WEBUI_SECRET_KEY` environment variable.
- No global writes from BlendOps.

## Rollback notes

- Admin Settings → External Tools → remove the Blender MCP entry.
- Restart Open WebUI container or service.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Open WebUI as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Default Lab `.mcpb` is stdio; use a bridge to HTTP for Open WebUI.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`. Default is stdio; bridge required.
- **CLI fallback (appendix)** — Publisher has not verified.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Open WebUI BlendOps Skills loader support (none exists; Open WebUI is an LLM frontend).
- That stdio MCP servers work without a bridge (they don't, in current Open WebUI MCP support).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Open WebUI.
