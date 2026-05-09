# Adapter Registry

Status: Draft v0

> [!NOTE]
> This registry is the **promotion ladder** for install targets. Every target starts as an install doc under [`docs/install/`](./install/), then graduates to an adapter row below once the project-local mapping is verified or drafted. Targets in the install layer that do not yet have adapter rows are tracked under "Install-only targets pending adapter draft" below.

## Adapter rows

| Adapter | Status | Confidence | Default scope | Fallback | Notes |
|---|---|---|---|---|---|
| Claude Code | Draft | verified-read | project-local | generic-root | Distinct from Claude app/Desktop |
| Claude app/Desktop | Draft | linked-only | docs-only/reference | generic-root | Use connector/runtime docs context only |
| OpenCode | Draft | linked-only | project-local | generic-root | Verify native skill path before writing |
| Cursor | Draft | linked-only | project-local | generic-root | Prefer rules/doc attachment if verified |
| Codex/generic | Draft | linked-only | generic-root | docs-only/reference | AGENTS.md-style fallback |
| Generic-root | Draft | verified-read | project-local | docs-only/reference | Universal fallback for unknown tools |

## Install-only targets pending adapter draft

These targets have an install doc but **no adapter row yet**. They use the generic-root fallback until an adapter doc is authored under `docs/adapters/`.

| Target | Install doc | Why no adapter yet |
|---|---|---|
| Gemini CLI | [`docs/install/gemini.md`](./install/gemini.md) | linked-only research; native skill path unverified |
| Antigravity | [`docs/install/antigravity.md`](./install/antigravity.md) | linked-only research; native skill path unverified |
| GitHub Copilot (chat) | [`docs/install/github-copilot.md`](./install/github-copilot.md) | linked-only research; no native skill format confirmed |
| Claude Desktop (manual import) | [`docs/install/claude-desktop.md`](./install/claude-desktop.md) | covered by `claude-app/Desktop` adapter row above as docs-only/reference; manual personal-skill ZIP path is install-only |
| **Cline** (VS Code) | [`docs/install/cline.md`](./install/cline.md) | Coding agent; MCP via Settings → Integrations; native skill loader unverified, generic fallback used |
| **Continue.dev** | [`docs/install/continue.md`](./install/continue.md) | Coding agent; MCP via `.continue/mcpServers/`; native skill loader unverified, generic fallback used |
| **Zed editor** | [`docs/install/zed.md`](./install/zed.md) | Coding agent (editor); MCP via `settings.json` `context_servers`; native skill loader unverified |
| **goose** (Block) | [`docs/install/goose.md`](./install/goose.md) | Coding agent; MCP via Standard IO extension; goose has upstream Blender tutorial covering Path 2 |
| **Ollama** | [`docs/install/ollama.md`](./install/ollama.md) | Local LLM runner (NOT a coding agent); MCP support experimental (PR #13700); BlendOps stays docs-only |
| **LM Studio** | [`docs/install/lm-studio.md`](./install/lm-studio.md) | Local LLM runner (NOT a coding agent); `mcp.json` Cursor-compatible; BlendOps stays docs-only |
| **Open WebUI** | [`docs/install/open-webui.md`](./install/open-webui.md) | Local LLM frontend (NOT a coding agent); Streamable HTTP MCP; BlendOps stays docs-only |

## Future candidates (not researched)

- Windsurf
- Continue
- Cline
- Roo
- Aider
- VS Code extensions
- Other AI coding agents

For future candidates:
- mark as not researched until verified
- do not invent paths
- add via `docs/adapters/adapter-template.md`
