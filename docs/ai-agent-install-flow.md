# AI Agent Install Flow

Status: Draft v0  
Scope: universal BlendOps install/prep UX across coding agents and Claude Desktop-style chat

> [!IMPORTANT]
> This flow installs, references, or packages BlendOps workflow knowledge only. It does **not** install Blender, configure Claude Desktop Connector, configure the official Blender MCP bridge/add-on, run runtime eval, or produce preview/render/GLB artifacts.

## Purpose

This is the detailed companion to the concise prompt in [`README.md`](../README.md#-use-in-30-seconds) and the agent-facing [`AI Agent Quickstart`](./ai-agent-quickstart.md). The flow works across project-aware coding agents and chat-only assistants by selecting one safe mode:

1. **Project-local install** for Claude Code, OpenCode, Cursor, Codex, Gemini, Antigravity, GitHub Copilot, or similar agents with project file access.
2. **Multiple Skills ZIP preparation** for Claude Desktop / Claude.ai / chat-only contexts without target project write access.
3. **Blocked-needs-input** when the assistant cannot safely write, zip, fetch the package source, or choose a target.

Some chats cannot fetch arbitrary repository subpaths from one raw doc link. If repo or package source fetch is blocked, the assistant should ask for uploaded files or a direct package source instead of hallucinating contents.

Runtime setup remains separate.

## Mental model

BlendOps adoption has three separate layers.

| Layer | What happens | What it does not prove |
|---|---|---|
| Skill install/package layer | Copy/reference BlendOps `skills/`, `laws/`, `packs/`, selected docs, project/tool instruction files, or prepare one ZIP per canonical skill from `skills/*/SKILL.md`. | Blender availability, connector configuration, runtime execution, or artifact output. |
| Runtime setup layer | User separately configures Blender, Claude Desktop Connector, Blender CLI, or optional local bridge paths. | Skill install correctness or artifact quality. |
| Evidence layer | Runtime evals, output paths, file existence, validation notes, and artifact truth labels are recorded. | Broad production readiness beyond the scoped evidence. |

Success in one layer does not imply success in another. A successful install or ZIP prep still means runtime status is `Not Run` and artifact status is `Not Produced` until evidence exists.

## Universal flow

1. User pastes the concise prompt from [`README.md`](../README.md#-use-in-30-seconds) into any AI/agent; the prompt tells the agent to read [`docs/ai-agent-quickstart.md`](./ai-agent-quickstart.md).
2. The assistant decides mode from available capability, not optimism.
3. If project write access exists, use project-local mode.
4. If no target project/write access exists, use multiple Skills ZIP mode.
5. If target choice, permissions, source access, or zip creation is unclear, use blocked-needs-input mode.
6. Every mode reports runtime status `Not Run` and artifact status `Not Produced`.

## Mode A — Project-local install

Use when the assistant can inspect/write files in a target project, including Claude Code, OpenCode, Cursor, Codex, Gemini, Antigravity, GitHub Copilot, or similar coding agents.

The agent should:

1. inspect the project for existing instruction/config files and target clues,
2. detect the target only if obvious,
3. ask before writing if multiple targets are detected,
4. use the generic project-local fallback when target is unknown,
5. install or reference BlendOps project-local files only,
6. avoid global writes unless explicitly requested,
7. back up existing instruction files before editing,
8. report files changed, skipped files, rollback steps, runtime status, and artifact status.

If the install is happening inside the BlendOps repo itself, run `npm run docs:check` after edits. Do not run Blender.

## Mode B — Multiple Skills ZIP preparation

Use when running in Claude Desktop / Claude.ai / chat-only context, no target project folder is available, the user asks for Skills UI upload/import, or project-local install is not possible.

Prepare one downloadable ZIP per canonical skill from:

```txt
skills/*/SKILL.md
```

Expected ZIP set (16 total — 10 domain + 6 process/discipline skills inspired by Superpowers + BMad):

```txt
blendops-help.zip
blender-brainstorming.zip
intent-to-3d-brief-writer.zip
blender-asset-discovery-planner.zip
blender-troubleshooting.zip
pre-handoff-verification.zip
runtime-bridge-conflict-resolver.zip
official-runtime-setup-guide.zip
official-runtime-readiness-checker.zip
product-hero-scene-planner.zip
blender-composition-camera-planner.zip
blender-lighting-material-planner.zip
blender-scene-quality-checker.zip
render-export-evidence.zip
glb-web-handoff.zip
non-blender-user-response-writer.zip
```

ZIP requirements:

- Each ZIP contains exactly one top-level skill directory.
- Each top-level skill directory contains exactly one `SKILL.md`.
- Do not include `skills/_template/`.
- Do not use `bundles/skill-package/blendops/` when the user wants multiple skills; that bundle is a one-skill umbrella fallback.
- Do not generate or claim runtime artifacts.

If running inside this repo, run `npm run skills:export` and use `dist/claude-skills/desktop-zips/*.zip`. If ZIP creation is blocked, output the exact per-skill folder tree and label it as fallback only. For target details, see [`docs/install/claude-desktop.md`](./install/claude-desktop.md).

## Mode C — Blocked-needs-input

Use when:

- multiple targets are detected,
- repo/package source cannot be fetched,
- local file permissions are unclear,
- the assistant cannot create a ZIP and cannot write files.

Action:

1. Ask one concise question or request the needed files/source.
2. Do not write a partial install unless it is obviously safe.
3. Do not invent package contents or target-specific paths.

## Universal non-actions

Every mode must avoid these actions:

- do not install Blender,
- do not configure Claude Desktop Connector,
- do not configure the official Blender MCP bridge/add-on,
- do not configure third-party runtime bridges,
- do not run Blender,
- do not run runtime eval,
- do not create/render/export or claim preview/render/GLB artifacts,
- do not claim an `npm`/`npx` installer or marketplace listing exists.

## Target confidence table

3 consumer types: chat UI (Claude Desktop), coding agents (21 — all project-aware + MCP-capable), local LLM runners (3 — docs-only). Plus a generic fallback. The 21 coding agents share the same install pattern (project-local files + optional MCP host config); they differ only in MCP config syntax + tool-native skill-loader maturity.

### 1) Chat UI with Skills upload

| Target | Universal mode | Auto-detect confidence | Notes |
|---|---|---|---|
| [Claude Desktop / Claude.ai](./install/claude-desktop.md) | Skill ZIP preparation | Manual / chat-only | Connector / runtime setup is a separate user action. |

### 2) Coding agents (project-local install + can host MCP for Blender)

| Target | Auto-detect confidence | MCP config location | Notes |
|---|---|---|---|
| [Claude Code](./install/claude-code.md) | Medium when Claude Code files are present | per Claude Code MCP guide | Tool-native partly verified (`.claude/`). |
| [OpenCode](./install/opencode.md) | Low / linked-only | per upstream | Use generic fallback unless project evidence is clear. |
| [Cursor](./install/cursor.md) | Low / linked-only | `.cursor/mcp.json` | Avoid broad global rule mutation. |
| [Codex CLI/App](./install/codex.md) | Low / linked-only | per upstream | No verified Codex-native skill path. |
| [Gemini CLI](./install/gemini.md) | Low / not researched | per upstream | Treat as future adapter work. |
| [Antigravity (Google)](./install/antigravity.md) | Low / linked-only | MCP Store / `mcp_config.json` | Native MCP via MCP Store GUI + JSON config. |
| [GitHub Copilot](./install/github-copilot.md) | Low / linked-only | per upstream | No marketplace / extension listing claim. |
| [Cline (VS Code)](./install/cline.md) | Low / linked-only | Cline Settings → Integrations | MCP-capable VS Code extension. |
| [Roo Code (VS Code)](./install/roo-code.md) | Low / linked-only | `.roo/mcp.json` (project) or global `mcp_settings.json` | Cline fork; project + global config levels. |
| [Blackbox AI (VS Code)](./install/blackbox-ai.md) | Low / linked-only | Blackbox panel → MCP Servers | Native MCP in Blackbox VS Code agent. |
| [Continue.dev](./install/continue.md) | Low / linked-only | `.continue/mcpServers/` | MCP usable in agent mode only. |
| [Zed editor](./install/zed.md) | Low / linked-only | `settings.json` `context_servers` | HTTP/SSE MCP supported (Nov 2025). |
| [Windsurf (Codeium)](./install/windsurf.md) | Low / linked-only | `~/.codeium/windsurf/mcp_config.json` | Cascade agent; 100-tool ceiling. |
| [Trae (ByteDance)](./install/trae.md) | Low / linked-only | Settings → MCP → Add Manually | Native MCP in Trae IDE v1.3.0+. |
| [Augment Code](./install/augment-code.md) | Low / linked-only | Settings panel + `~/.augment/settings.json` | Easy MCP one-click + JSON import. |
| [goose (Block)](./install/goose.md) | Low / linked-only | Standard IO extension | Has upstream Blender MCP tutorial covering Path 2. |
| [OpenHands](./install/openhands.md) | Low / linked-only | `~/.openhands/mcp.json` + Settings UI + `openhands mcp` CLI | Formerly OpenDevin; CLI/SDK/GUI/Cloud parity. |
| [JetBrains Junie / AI Assistant](./install/jetbrains-junie.md) | Low / linked-only | Settings → Tools → Junie → MCP Settings or `.junie/mcp/mcp.json` | Shared MCP config with AI Assistant. |
| [Sourcegraph Cody](./install/sourcegraph-cody.md) | Low / linked-only | Cody agentic context fetching MCP config | Opt-in; Cody decides when to invoke MCP tools. |
| [Aider (terminal)](./install/aider.md) | Low / linked-only | `--mcp-servers` flag or `.aider.conf.yml` | LiteLLM-backed MCP, stdio only, 25-call cap per reply. |
| [Amazon Q Developer CLI](./install/amazon-q-developer.md) | Low / linked-only | `~/.aws/amazonq/cli-agents` + `qchat mcp` CLI | Local + remote MCP; agent config format. |

All 21 follow the same project-local install pattern (`BLENDOPS.md` / `AGENTS.md` / `skills/` etc.) and can host MCP for Blender via **Path 1 host (b) Lab MCP** OR **Path 2 community `ahujasid/blender-mcp`**. Global writes are not allowed by default for any of them; existing project instruction files are backed up before edits; runtime setup is always separate.

### 3) Local LLM runners (docs-only; runner hosts MCP)

| Target | Auto-detect confidence | MCP config location | Notes |
|---|---|---|---|
| [Ollama](./install/ollama.md) | Low / linked-only / experimental | `~/.ollama/mcp-servers.json` (PR #13700) + 3rd-party clients | Local LLM. |
| [LM Studio](./install/lm-studio.md) | Low / linked-only | `mcp.json` (Cursor-compatible) | Local LLM, MCP since 0.3.17. |
| [Open WebUI](./install/open-webui.md) | Low / linked-only | Admin Settings → External Tools → Streamable HTTP | Local LLM frontend, MCP since 0.6.31; stdio MCP needs bridge. |

### Generic / future

| Target | Auto-detect confidence | Notes |
|---|---|---|
| [Generic project-local fallback](./install/generic-project.md) | High as safe fallback | Default when target type is unknown or mixed; fixture in `bundles/generic-project-local/`. |

## Auto-detect policy

Auto-detect is convenience, not authority.

Rules:

- Explicit user target always beats auto-detect.
- If more than one target is detected, ask before writing.
- If no target is detected but project write access exists, use the generic project-local fallback.
- If no project write access exists, prepare one ZIP per canonical skill from `skills/*/SKILL.md` or ask for needed files.
- Use one target/mode per install run.
- Prefer project-local writes over global writes.
- Avoid global writes by default.
- Back up existing project instruction files before editing them.
- Record confidence as `verified`, `linked-only`, or `unknown` when target behavior is not fully proven.

## Report contract

Every mode must report:

| Field | Required content |
|---|---|
| Mode selected | `project-local install`, `multiple Skills ZIP preparation`, or `blocked-needs-input`. |
| Target or reason | Target project/tool, ZIP reason, or blocker. |
| Files changed or ZIP filenames | Exact project-local paths or generated per-skill ZIP names. |
| SKILL.md count | Required in ZIP mode; expected value is `1` per ZIP. |
| Global files touched | `No`, unless user explicitly approved and backup/rollback is recorded. |
| Rollback steps | Required for project-local mode. |
| Runtime status | `Not Run`. |
| Artifact status | `Not Produced`. |
| Limitations | Unknown target behavior, linked-only confidence, fetch limits, or pending verification. |

Minimal report shape:

```md
## BlendOps install/prep report

- Mode selected:
- Target or reason:
- Files changed or ZIP filenames:
- SKILL.md count if ZIP mode:
- Global files touched: No
- Rollback steps if project-local mode:
- Runtime status: Not Run
- Artifact status: Not Produced
- Limitations:
```

For a static generic project-local fixture example, see [`bundles/generic-project-local/`](../bundles/generic-project-local/). It demonstrates rollback/report templates only and does not run an installer or runtime.

## Future command shape (documentation only)

These are proposed future UX examples only. They are not implemented or tested commands, and users should not run them yet.

```sh
# Future only — not implemented
npx blendops skills install --target auto --project .

# Future only — not implemented
npx blendops skills install --target claude-code --project .

# Future only — not implemented
npx blendops skills install --target antigravity --project .

# Future only — not implemented
npx blendops skills doctor
```

Before any command is promoted, BlendOps needs an implemented package, install tests, rollback tests, target-specific evidence, and conservative runtime/artifact status handling. See [installer-spec.md](./install/installer-spec.md) for the design-only behavior contract.
