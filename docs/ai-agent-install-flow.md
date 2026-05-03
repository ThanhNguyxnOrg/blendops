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

Expected ZIP set:

```txt
blendops-help.zip
product-hero-scene-planner.zip
official-runtime-readiness-checker.zip
official-runtime-setup-guide.zip
render-export-evidence.zip
glb-web-handoff.zip
blender-composition-camera-planner.zip
blender-lighting-material-planner.zip
blender-scene-quality-checker.zip
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

| Target | Universal mode | Auto-detect confidence | Ask user if ambiguous? | Global writes allowed by default? | Runtime setup separate? | Notes |
|---|---|---|---:|---:|---:|---|
| [Claude Code](./install/claude-code.md) | Project-local install | Medium when Claude Code files are present; otherwise unknown. | Yes | No | Yes | Keep distinct from Claude Desktop. Direct official MCP runtime use is not verified. |
| [OpenCode](./install/opencode.md) | Project-local install | Low / linked-only | Yes | No | Yes | Use generic fallback unless project evidence is clear. |
| [Cursor](./install/cursor.md) | Project-local install | Low / linked-only | Yes | No | Yes | Avoid broad global rule mutation. |
| [Codex CLI/App](./install/codex.md) | Project-local install | Low / linked-only | Yes | No | Yes | Do not invent plugin paths. |
| [Gemini CLI](./install/gemini.md) | Project-local install | Low / not researched | Yes | No | Yes | Treat as future adapter work. |
| [Antigravity](./install/antigravity.md) | Project-local install | Low / not researched | Yes | No | Yes | Do not claim native support yet. |
| [GitHub Copilot](./install/github-copilot.md) | Project-local install | Low / linked-only | Yes | No | Yes | Do not claim marketplace or extension listing. |
| [Generic project-local fallback](./install/generic-project.md) | Project-local install | High as safe fallback | Yes, if it would modify existing files | No | Yes | Default when target is unknown or mixed; fixture available at `bundles/generic-project-local/`. |
| [Claude Desktop](./install/claude-desktop.md) | Skill ZIP preparation | Manual/chat-only | Yes | No | Yes | Connector/runtime setup is a separate user action. |

## Auto-detect policy

Auto-detect is convenience, not authority.

Rules:

- Explicit user target always beats auto-detect.
- If more than one target is detected, ask before writing.
- If no target is detected but project write access exists, use the generic project-local fallback.
- If no project write access exists, prepare `skill.zip` or ask for needed files.
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
