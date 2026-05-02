# Install target: README

Status: Draft v0 target install docs

Start with the universal prompt in [`README.md`](../../README.md). It is the first recommended entry point for any AI/agent and auto-selects one safe mode:

- **Project-local install** for coding agents with target project file access.
- **Skill ZIP preparation** for Claude Desktop / ChatGPT-style chats without project write access.
- **Blocked-needs-input** when target choice, permissions, source fetch, or ZIP creation is unclear.

These pages are detailed fallbacks and target notes. They do not describe a packaged installer, npm package, marketplace listing, or runtime setup.

The canonical portable package source is `bundles/skill-package/blendops/`. Its `SKILL.md` plus `references/` are the target-neutral content layer; `agents/openai.yaml` is OpenAI/ChatGPT Skills UI metadata only, not the universal adapter layer for the targets below.

## Target docs

| Target | Doc | Universal prompt mode | Confidence |
|---|---|---|---|
| Claude Desktop | [claude-desktop.md](./claude-desktop.md) | skill.zip preparation | linked-only / manual |
| Claude Code | [claude-code.md](./claude-code.md) | project-local install | verified-read for project-local adapter |
| OpenCode | [opencode.md](./opencode.md) | project-local install | linked-only |
| Cursor | [cursor.md](./cursor.md) | project-local install | linked-only |
| Codex CLI/App | [codex.md](./codex.md) | project-local install | linked-only |
| Gemini CLI | [gemini.md](./gemini.md) | project-local install | not researched |
| Antigravity | [antigravity.md](./antigravity.md) | project-local install | not researched |
| GitHub Copilot | [github-copilot.md](./github-copilot.md) | project-local install | linked-only / generic |
| Generic project | [generic-project.md](./generic-project.md) | project-local install fallback | verified-read fallback |
| Installer script spec (future) | [installer-spec.md](./installer-spec.md) | future only | Draft spec only |

## Shared rules

- Skill install is not runtime setup.
- Do not install Blender.
- Do not configure Claude Desktop Connector or Blender MCP bridge/add-on.
- Do not run Blender or runtime eval.
- Do not claim preview/render/GLB artifacts.
- Use project-local install by default when project write access exists.
- Prepare `skill.zip` when project-local install is not possible and Skills UI upload/import is requested.
- Do not write global config unless explicitly requested, path-verified, backed up, and rollback-documented.

For the full universal flow, read [AI Agent Install Flow](../ai-agent-install-flow.md).
