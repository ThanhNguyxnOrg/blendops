# Adapter Registry

Status: Draft v0

> [!NOTE]
> This registry is the **promotion ladder** for install targets. Every target starts as an install doc under [`docs/install/`](./install/), then graduates to an adapter row below once the project-local mapping is verified or drafted. Targets in the install layer that do not yet have adapter rows are tracked under "Install-only targets pending adapter draft" below. The machine-readable 26-target compatibility inventory is compiled in [`../registry/compatibility-matrix.json`](../registry/compatibility-matrix.json) and validated against [`../schemas/adapter-compatibility-matrix.schema.json`](../schemas/adapter-compatibility-matrix.schema.json).

## Adapter rows

| Adapter | Status | Confidence | Default scope | Fallback | Notes |
|---|---|---|---|---|---|
| Claude Code | Draft | verified-read | project-local | generic-root | Distinct from Claude app/Desktop; install doc at [`docs/install/claude-code.md`](./install/claude-code.md), adapter doc at [`docs/adapters/claude-code.md`](./adapters/claude-code.md) (`2026-05-08`) |
| Claude app/Desktop | Draft | linked-only | docs-only/reference | generic-root | Use connector/runtime docs context only; install doc at [`docs/install/claude-desktop.md`](./install/claude-desktop.md), adapter doc at [`docs/adapters/claude-app.md`](./adapters/claude-app.md) (`Not Verified`) |
| OpenCode | Draft | linked-only | project-local | generic-root | Verify native skill path before writing; install doc at [`docs/install/opencode.md`](./install/opencode.md), adapter doc at [`docs/adapters/opencode.md`](./adapters/opencode.md) (`Not Verified`) |
| Cursor | Draft | linked-only | project-local | generic-root | Prefer rules/doc attachment if verified; install doc at [`docs/install/cursor.md`](./install/cursor.md), adapter doc at [`docs/adapters/cursor.md`](./adapters/cursor.md) (`Not Verified`) |
| Codex/generic | Draft | linked-only | generic-root | docs-only/reference | `AGENTS.md`-style fallback; install doc at [`docs/install/codex.md`](./install/codex.md), adapter doc at [`docs/adapters/codex.md`](./adapters/codex.md) (`Not Verified`) |
| Generic-root | Draft | verified-read | project-local | docs-only/reference | Universal fallback for unknown tools; install doc at [`docs/install/generic-project.md`](./install/generic-project.md), adapter doc at [`docs/adapters/generic-root.md`](./adapters/generic-root.md) (`2026-05-08`) |

## Install-only targets pending adapter draft

These targets have an install doc under [`docs/install/`](./install/) (`linked-only` confidence or docs-only reference) but **no dedicated adapter doc yet** under [`docs/adapters/`](./adapters/). Having an install guide does not imply a verified adapter; they use the `generic-root` or `docs-only/reference` fallback until promoted via [`docs/adapters/adapter-template.md`](./adapters/adapter-template.md).

| Target | Install doc | Confidence | Why no adapter yet |
|---|---|---|---|
| Gemini CLI | [`docs/install/gemini.md`](./install/gemini.md) | `linked-only` | Native skill path unverified; uses project-local generic fallback |
| Antigravity | [`docs/install/antigravity.md`](./install/antigravity.md) | `linked-only` | Native skill path unverified; uses project-local generic fallback |
| GitHub Copilot (chat) | [`docs/install/github-copilot.md`](./install/github-copilot.md) | `linked-only` | No native skill format confirmed; uses repository instructions fallback |
| Claude Desktop (manual import) | [`docs/install/claude-desktop.md`](./install/claude-desktop.md) | `linked-only` | Covered by `Claude app/Desktop` adapter row above as docs-only/reference; manual personal-skill ZIP path is install-only |
| **Cline** (VS Code) | [`docs/install/cline.md`](./install/cline.md) | `linked-only` | Coding agent; MCP via Settings → Integrations; native skill loader unverified, generic fallback used |
| **Continue.dev** | [`docs/install/continue.md`](./install/continue.md) | `linked-only` | Coding agent; MCP via `.continue/mcpServers/`; native skill loader unverified, generic fallback used |
| **Zed editor** | [`docs/install/zed.md`](./install/zed.md) | `linked-only` | Coding agent (editor); MCP via `settings.json` `context_servers`; native skill loader unverified |
| **goose** (Block) | [`docs/install/goose.md`](./install/goose.md) | `linked-only` | Coding agent; MCP via Standard IO extension; goose has upstream Blender tutorial covering Path 2 |
| **Roo Code** | [`docs/install/roo-code.md`](./install/roo-code.md) | `linked-only` | Coding agent; `.roo/rules/` and MCP integration documented; native skill pack loader unverified, generic fallback used |
| **Windsurf** | [`docs/install/windsurf.md`](./install/windsurf.md) | `linked-only` | Coding agent (IDE); `.windsurfrules` and MCP config documented; native skill pack loader unverified, generic fallback used |
| **OpenHands** | [`docs/install/openhands.md`](./install/openhands.md) | `linked-only` | Coding agent; microagents/repository instructions documented; native skill loader unverified, generic fallback used |
| **JetBrains Junie** | [`docs/install/jetbrains-junie.md`](./install/jetbrains-junie.md) | `linked-only` | Coding agent; `.junie/guidelines.md` documented; native skill loader unverified, generic fallback used |
| **Blackbox AI** | [`docs/install/blackbox-ai.md`](./install/blackbox-ai.md) | `linked-only` | Coding agent; project instructions and MCP setup documented; native skill loader unverified, generic fallback used |
| **Augment Code** | [`docs/install/augment-code.md`](./install/augment-code.md) | `linked-only` | Coding agent; workspace guidelines and MCP documented; native skill loader unverified, generic fallback used |
| **Aider** | [`docs/install/aider.md`](./install/aider.md) | `linked-only` | CLI coding agent; `CONVENTIONS.md` / `--read` attachment documented; no native skill pack loader, generic fallback used |
| **Trae** (ByteDance) | [`docs/install/trae.md`](./install/trae.md) | `linked-only` | Coding agent (IDE); project rules and MCP config documented; native skill loader unverified, generic fallback used |
| **Sourcegraph Cody** | [`docs/install/sourcegraph-cody.md`](./install/sourcegraph-cody.md) | `linked-only` | Coding agent; context rules and OpenCtx/MCP documented; native skill loader unverified, generic fallback used |
| **Amazon Q Developer** | [`docs/install/amazon-q-developer.md`](./install/amazon-q-developer.md) | `linked-only` | Coding agent; `.amazonq/rules/` and MCP config documented; native skill loader unverified, generic fallback used |
| **Ollama** | [`docs/install/ollama.md`](./install/ollama.md) | `linked-only` | Local LLM runner (NOT a coding agent); MCP support experimental (PR #13700); BlendOps stays docs-only |
| **LM Studio** | [`docs/install/lm-studio.md`](./install/lm-studio.md) | `linked-only` | Local LLM runner (NOT a coding agent); `mcp.json` Cursor-compatible; BlendOps stays docs-only |
| **Open WebUI** | [`docs/install/open-webui.md`](./install/open-webui.md) | `linked-only` | Local LLM frontend (NOT a coding agent); Streamable HTTP MCP; BlendOps stays docs-only |

## Future candidates (not researched)

- Other AI coding agents or 3D-capable agent hosts not yet listed in [`docs/install/README.md`](./install/README.md)

For future candidates:
- mark as not researched until verified
- do not invent paths
- start as an install doc under [`docs/install/`](./install/), then graduate to an adapter via [`docs/adapters/adapter-template.md`](./adapters/adapter-template.md)
