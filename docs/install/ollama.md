# Install target: Ollama (local LLM)

Status/confidence: Draft v0, linked-only / experimental MCP

## Recommended near-term install mode

Ollama is a **local LLM runner**, not a project-aware coding agent. BlendOps install for Ollama is **docs-only / reference** plus **MCP server config** for the experimental MCP support added in 2026 (PR [#13700](https://github.com/ollama/ollama/pull/13700)).

For Blender execution, Ollama acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
I want to use BlendOps content with a local LLM via Ollama.

Requirements:
- Treat Ollama as docs-only / reference; no global config writes.
- Provide BlendOps planning/readiness/evidence/handoff guidance for the local LLM session.
- For Blender runtime via Ollama as MCP host:
  - Configure ~/.ollama/mcp-servers.json (per Ollama PR #13700) with the Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
  - Run Ollama with --experimental flag for the agent loop.
  - Tools are namespaced as servername:toolname.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and confidence labels.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

Ollama has experimental native MCP support via PR [#13700](https://github.com/ollama/ollama/pull/13700) (open + actively updated as of April 2026):

- MCP servers configured in `~/.ollama/mcp-servers.json`.
- Tools namespaced as `servername:toolname` to avoid conflicts.
- Requires Ollama's `--experimental` flag for the agent loop.
- Runtime security via existing approval system.

Third-party Ollama-MCP bridges that are stable today (use these if you don't want the experimental flag):

- **mcphost** — Go-based MCP client that speaks Ollama natively.
- **mcp-client-for-ollama** (PyPI v0.28.0+) — Python client supporting STDIO / SSE / HTTP.
- **OllamaC** — desktop client with MCP integration; works with tool-capable models like Llama 3.1, Qwen2.5.

## Expected files/folders (linked-only)

- `~/.ollama/mcp-servers.json` — host-side MCP config (after Ollama PR lands; today via mcphost / mcp-client-for-ollama config).
- No global writes from BlendOps.
- No tool-native skill folder for Ollama exists; treat as docs-only.

## Rollback notes

- Remove or comment out the `blender` entry from `~/.ollama/mcp-servers.json` (or your mcphost config).
- Restart Ollama / mcphost.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Ollama as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab MCP add-on installed in Blender + MCP server reachable from Ollama's MCP config. Anthropic Connector toggle is Claude Desktop only; not applicable here.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp` registered in Ollama's MCP config.
- **CLI fallback (appendix)** — Ollama can also drive Blender via shell. The Blender CLI is **documented upstream** as a first-class surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md) for the canonical 2-path + CLI appendix model.

## What not to claim

- Native Ollama BlendOps Skills loader support (none exists; Ollama is an LLM runner, not a Skills system).
- That Ollama PR #13700 is merged (it is open as of April 2026).
- Runtime success without an evidence file under `docs/evals/`.
- Marketplace / plugin distribution for Ollama.
