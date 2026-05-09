# Install target: README

Status: Draft v0 target install docs

Start with the concise prompt in [`README.md`](../../README.md#-use-in-30-seconds). It points any AI/agent to the full [`AI Agent Quickstart`](../ai-agent-quickstart.md), which auto-selects one safe mode:

- **Project-local install** for coding agents with target project file access.
- **Multiple Skills ZIP preparation** for Claude Desktop / Claude.ai / chat-only contexts without project write access.
- **Blocked-needs-input** when target choice, permissions, source fetch, or ZIP creation is unclear.

These pages are detailed fallbacks and target notes. They do not describe a packaged installer, npm package, marketplace listing, or runtime setup.

The canonical portable package source is `bundles/skill-package/blendops/`. Its `SKILL.md` plus `references/` are the target-neutral content layer; `agents/openai.yaml` is OpenAI/ChatGPT Skills UI metadata only, not the universal adapter layer for the targets below.

## Target docs

BlendOps recognizes 3 fundamentally different consumer types: **chat UI with Skills upload** (Claude Desktop), **coding agents that work with project-local files and host MCP** (everything from Claude Code to goose), and **local LLM runners that host MCP without project-local-file conventions**.

### 1) Chat UI with Skills upload — 1 target

| Target | Doc | Selected mode | Confidence |
|---|---|---|---|
| Claude Desktop / Claude.ai | [claude-desktop.md](./claude-desktop.md) | multiple Skills ZIP preparation | linked-only / manual |

### 2) Coding agents (project-local install + can host MCP for Blender) — 21 targets

All of these accept BlendOps via **project-local files** (`BLENDOPS.md`, `skills/`, `laws/`, `packs/`, optional tool-native paths) and can host MCP for Blender via Path 1 host (b) Lab MCP or Path 2 community `ahujasid/blender-mcp`. They differ in MCP config syntax, native skill-loader maturity, and BlendOps confidence labels — but the consumer model is the same.

| Target | Doc | Tool-native skill path | MCP config location | Confidence |
|---|---|---|---|---|
| Claude Code | [claude-code.md](./claude-code.md) | `.claude/skills/`, `CLAUDE.md` | per Claude Code MCP guide | verified-read for project-local |
| OpenCode | [opencode.md](./opencode.md) | `.opencode/` (candidate) | per upstream | linked-only |
| Cursor | [cursor.md](./cursor.md) | `.cursor/rules` (candidate) | `.cursor/mcp.json` | linked-only |
| Codex CLI/App | [codex.md](./codex.md) | none verified | per upstream | linked-only |
| Gemini CLI | [gemini.md](./gemini.md) | not researched | per upstream | not researched |
| Antigravity (Google) | [antigravity.md](./antigravity.md) | none verified | MCP Store / `mcp_config.json` | linked-only |
| GitHub Copilot | [github-copilot.md](./github-copilot.md) | none verified | per upstream | linked-only |
| Cline (VS Code) | [cline.md](./cline.md) | none verified | Settings → Integrations | linked-only |
| Roo Code (VS Code) | [roo-code.md](./roo-code.md) | none verified | `.roo/mcp.json` (project) or global `mcp_settings.json` | linked-only |
| Blackbox AI (VS Code) | [blackbox-ai.md](./blackbox-ai.md) | none verified | Blackbox panel → MCP Servers | linked-only |
| Continue.dev | [continue.md](./continue.md) | none verified | `.continue/mcpServers/` | linked-only |
| Zed editor | [zed.md](./zed.md) | none verified | `settings.json` `context_servers` | linked-only |
| Windsurf (Codeium) | [windsurf.md](./windsurf.md) | none verified | `~/.codeium/windsurf/mcp_config.json` | linked-only |
| Trae (ByteDance) | [trae.md](./trae.md) | none verified | Settings → MCP → Add Manually (v1.3.0+) | linked-only |
| Augment Code | [augment-code.md](./augment-code.md) | none verified | Settings panel + `~/.augment/settings.json` | linked-only |
| goose (Block) | [goose.md](./goose.md) | none verified | Standard IO extension | linked-only — has upstream Blender tutorial |
| OpenHands | [openhands.md](./openhands.md) | none verified | `~/.openhands/mcp.json` + Settings UI + `openhands mcp` CLI | linked-only |
| JetBrains Junie / AI Assistant | [jetbrains-junie.md](./jetbrains-junie.md) | none verified | Settings → Tools → Junie → MCP Settings or `.junie/mcp/mcp.json` | linked-only |
| Sourcegraph Cody | [sourcegraph-cody.md](./sourcegraph-cody.md) | none verified | agentic context fetching MCP config (opt-in) | linked-only |
| Aider (terminal) | [aider.md](./aider.md) | none verified | `--mcp-servers` flag or `.aider.conf.yml` | linked-only |
| Amazon Q Developer CLI | [amazon-q-developer.md](./amazon-q-developer.md) | none verified | `~/.aws/amazonq/cli-agents` + `qchat mcp` CLI | linked-only |

### 3) Local LLM runners (BlendOps = docs-only / reference; runner hosts MCP for Blender) — 3 targets

These are LLM hosts, not coding agents. They don't have project-local-file conventions for skills. BlendOps is **docs-only / reference** for the local LLM session.

| Target | Doc | MCP config | Confidence |
|---|---|---|---|
| Ollama | [ollama.md](./ollama.md) | `~/.ollama/mcp-servers.json` (experimental, PR #13700) + 3rd-party clients | linked-only / experimental |
| LM Studio | [lm-studio.md](./lm-studio.md) | `mcp.json` (Cursor-compatible notation) | linked-only |
| Open WebUI | [open-webui.md](./open-webui.md) | Admin Settings → External Tools → Streamable HTTP MCP | linked-only |

### Generic / future

| Target | Doc | Selected mode | Confidence |
|---|---|---|---|
| Generic project | [generic-project.md](./generic-project.md) | project-local install fallback (when target type is unknown) | verified-read fallback |
| Installer script spec (future) | [installer-spec.md](./installer-spec.md) | future only | Draft spec only |

## Shared rules

- Skill install is not runtime setup.
- Do not install Blender.
- Do not configure Claude Desktop Connector or Blender MCP bridge/add-on.
- Do not run Blender or runtime eval.
- Do not claim preview/render/GLB artifacts.
- Use project-local install by default when project write access exists.
- Prepare one ZIP per canonical skill from `skills/*/SKILL.md` when project-local install is not possible and Skills UI upload/import is requested.
- Do not write global config unless explicitly requested, path-verified, backed up, and rollback-documented.

For the full universal flow, read [AI Agent Install Flow](../ai-agent-install-flow.md).
