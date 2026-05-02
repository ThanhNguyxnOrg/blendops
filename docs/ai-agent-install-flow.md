# AI Agent Install Flow

Status: Draft v0  
Scope: near-term project-local BlendOps skill install UX for AI coding agents

> [!IMPORTANT]
> This flow installs or references BlendOps workflow knowledge only. It does **not** install Blender, configure Claude Desktop Connector, configure the official Blender MCP bridge/add-on, run runtime eval, or produce preview/render/GLB artifacts.

## Purpose

This is the primary near-term install UX for AI coding agents with terminal and file access.

A user copies one short prompt, pastes it into an AI coding agent such as Claude Code, OpenCode, Cursor, Codex, Gemini, Antigravity, GitHub Copilot, or a similar project-aware coding assistant, and asks that agent to attach BlendOps project-locally.

The agent should:

1. inspect the project,
2. choose a safe target or ask when ambiguous,
3. install or reference BlendOps project-local files,
4. avoid global writes unless explicitly requested,
5. report exactly what changed and how to roll it back.

Runtime setup remains separate.

## Mental model

BlendOps installation has three separate layers.

| Layer | What happens | What it does not prove |
|---|---|---|
| Skill install layer | Copy or reference BlendOps `skills/`, `laws/`, `packs/`, selected docs, and project/tool instruction files. | Blender availability, connector configuration, runtime execution, or artifact output. |
| Runtime setup layer | User separately configures Blender, Claude Desktop Connector, Blender CLI, or optional local bridge paths. | Skill install correctness or artifact quality. |
| Evidence layer | Runtime evals, output paths, file existence, validation notes, and artifact truth labels are recorded. | Broad production readiness beyond the scoped evidence. |

Success in one layer does not imply success in another. A successful skill install still means runtime status is `Not Run` and artifact status is `Not Produced` until evidence exists.

## Primary user flow

1. User pastes the install prompt below into an AI coding agent.
2. The agent inspects the project for existing instruction/config files and target clues.
3. If the target is obvious, the agent installs for that one target.
4. If multiple targets are detected, the agent asks before writing.
5. If no target is detected, the agent uses a generic project-local fallback (see `bundles/generic-project-local/`).
6. The agent installs or references BlendOps project-local files only.
7. If the install is happening inside the BlendOps repo, the agent runs `npm run docs:check`.
8. The agent reports files changed, skipped files, rollback steps, runtime status, and artifact status.
9. The agent does not run Blender.

## Copy-paste prompt template

Paste this into your AI coding agent from the project where you want BlendOps attached:

```txt
Install BlendOps as project-local skill/instruction files for this repository.

Source guide:
https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/agent-install.md

Requirements:
- Prefer a reversible project-local install.
- Inspect this project first.
- Detect the target only if it is obvious from existing files/config.
- If multiple targets are present, ask me before writing.
- If unsure, use the generic project-local fallback.
- Install or reference BlendOps skills/laws/packs/docs as project-local files or project-local instructions.
- Do not modify global config unless I explicitly request it.
- Do not install Blender.
- Do not configure Claude Desktop Connector.
- Do not configure the official Blender MCP bridge/add-on.
- Do not configure third-party runtime bridges.
- Do not run Blender.
- Do not run runtime eval.
- Do not create, render, export, or claim preview/render/GLB artifacts.
- If this is the BlendOps repo itself, run npm run docs:check after edits.

Report back with:
- target selected
- files created/modified
- files skipped
- whether any global files were touched
- rollback steps
- runtime status: Not Run
- artifact status: Not Produced
```

## Target confidence table

| Target | Near-term install style | Auto-detect confidence | Ask user if ambiguous? | Global writes allowed by default? | Runtime setup separate? | Notes |
|---|---|---|---:|---:|---:|---|
| [Claude Code](./install/claude-code.md) | Project-local files or verified project instruction path. | Medium when Claude Code files are present; otherwise unknown. | Yes | No | Yes | Keep distinct from Claude Desktop. Direct official MCP runtime use is not verified. |
| [OpenCode](./install/opencode.md) | Project-local files now; tool-native install only after source-backed verification. | Low / linked-only | Yes | No | Yes | Use generic fallback unless project evidence is clear. |
| [Cursor](./install/cursor.md) | Project rules/docs attachment after backup and path verification. | Low / linked-only | Yes | No | Yes | Avoid broad global rule mutation. |
| [Codex CLI/App](./install/codex.md) | Generic project instruction fallback or future adapter. | Low / linked-only | Yes | No | Yes | Do not invent plugin paths. |
| [Gemini CLI](./install/gemini.md) | Docs-only or generic project-local fallback until adapter evidence exists. | Low / not researched | Yes | No | Yes | Treat as future adapter work. |
| [Antigravity](./install/antigravity.md) | Generic project-local fallback until source-backed adapter evidence exists. | Low / not researched | Yes | No | Yes | Do not claim native support yet. |
| [GitHub Copilot](./install/github-copilot.md) | Project-local docs/instructions reference where the project already uses such files. | Low / linked-only | Yes | No | Yes | Do not claim marketplace or extension listing. |
| [Generic project-local fallback](./install/generic-project.md) | `BLENDOPS.md`, `AGENTS.md`, or copied/referenced core collection with rollback notes. | High as safe fallback | Yes, if it would modify existing files | No | Yes | Default when target is unknown or mixed; fixture available at `bundles/generic-project-local/`. |
| [Claude Desktop](./install/claude-desktop.md) | User-managed manual import/copy of skill content; not a normal coding-agent install. | Manual only | Yes | No | Yes | Connector/runtime setup is a separate user action. |

## Auto-detect policy

Auto-detect is convenience, not authority.

Rules:

- Explicit user target always beats auto-detect.
- If more than one target is detected, ask before writing.
- If no target is detected, use the generic project-local fallback.
- Use one target per install run.
- Prefer project-local writes.
- Avoid global writes by default.
- Back up existing project instruction files before editing them.
- Record confidence as `verified`, `linked-only`, or `unknown` when target behavior is not fully proven.

## Claude Desktop special case

Claude Desktop is not a normal coding-agent install target.

Near-term safe path:

1. User manually imports, copies, or attaches BlendOps skill content through Claude Desktop-supported UI or project context.
2. User separately configures Claude Desktop Blender Connector if runtime control is needed.
3. User separately configures the official Blender MCP bridge/add-on inside Blender as required by the connector path.
4. Runtime access should be checked before mutation/render/export.
5. Full runtime eval remains `Not Run` until an eval record captures real execution and evidence.
6. Preview/render/GLB artifacts remain `Not Produced` until output evidence exists.

Provide dedicated Claude Desktop copy/paste instructions later. Do not treat Claude Desktop skill import as connector setup or runtime proof.

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

## Rollback/report contract

Every AI install attempt should end with a report containing:

| Field | Required content |
|---|---|
| Target selected | The chosen target and confidence label. |
| Files created/modified | Exact project-local paths and action taken. |
| Files skipped | Paths skipped and why. |
| Global files touched | `No`, unless user explicitly approved and backup/rollback is recorded. |
| Rollback commands | File-specific remove/restore steps. |
| Runtime status | `Not Run`. |
| Artifact status | `Not Produced`. |
| Runtime setup note | Separate setup required for Blender connector/CLI/bridge. |
| Limitations | Unknown target behavior, linked-only confidence, or pending verification. |

For a static generic project-local fixture example, see [`bundles/generic-project-local/`](../bundles/generic-project-local/). It demonstrates rollback/report templates only and does not run an installer or runtime.

Minimal report shape:

```md
## BlendOps AI-agent install report

- Target selected:
- Confidence:
- Files created/modified:
- Files skipped:
- Global files touched: No
- Rollback steps:
- Runtime status: Not Run
- Artifact status: Not Produced
- Runtime setup: Separate; not performed in this install
- Limitations:
```
