# BlendOps AI Agent Quickstart

Use this file as the single instruction source when asking any AI agent to install, attach, or prepare BlendOps.

Source repository:
https://github.com/ThanhNguyxnOrg/blendops

## Goal

Prepare BlendOps for the current environment using the safest available mode.

BlendOps attaches workflow knowledge only. It does not install Blender, configure runtime connectors, run Blender, or prove generated artifacts.

## Mode auto-detect (do this first, in 5 seconds)

Run this check **before** doing anything else. Pick exactly one mode:

| Your environment right now | Mode |
|---|---|
| You can read/write files in a target project (Claude Code, Cursor, Codex, OpenCode, Cline, Continue, Zed, goose, Gemini CLI, Antigravity, GitHub Copilot, generic CLI agent inside a repo) | **Mode A** — install project-locally |
| You are in a chat-only UI with no project filesystem write access (Claude Desktop chat, Claude.ai web, ChatGPT web/app, any browser chat UI) | **Mode B** — output 16 separate skill files/ZIPs for the user to manually upload |
| You cannot fetch the BlendOps repo, cannot write files, AND cannot output ZIPs / file contents | **Mode C** — ask one concise question |

Decision rules (no optimism):

- "Filesystem write access" means you can actually create / edit files in a target project right now, not "I have a tool for it." If the user has not shown you a project, do not assume Mode A.
- "Chat-only" includes Claude Desktop chat, Claude.ai web, ChatGPT (web / app), and any browser chat UI without project filesystem write. These default to Mode B.
- If the user explicitly says which tool they are in, trust that signal:
  - "I'm in Cursor / VS Code Cline / Claude Code / Codex / OpenCode" → Mode A
  - "I'm in Claude Desktop chat" / "I want to upload to Claude Skills UI" / "I want to use this in ChatGPT" → Mode B
- If you cannot tell whether you have project write access OR cannot fetch the repo, go to Mode C — ask one concise question instead of guessing.

## Mode selection

Choose exactly one mode using the table above.

### Mode A — Project-local install

Use when the agent can inspect and write files in a target project.

Do this:

1. Inspect the project first.
2. Detect the target tool only if obvious.
3. If multiple targets are present, ask before writing.
4. Prefer project-local install.
5. If target support is unclear, use the generic project-local fallback.
6. Do not write global config unless the user explicitly approves it.
7. Back up existing instruction/config files before editing.
8. Attach the BlendOps core collection:
   - `skills/`
   - `laws/`
   - `packs/`
   - selected runtime boundary docs under `docs/`
9. Create or update the safest project-local entrypoint for the target.
10. Report files changed and rollback steps.

Detailed flow:
https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/ai-agent-install-flow.md

### Mode B — Multiple Skills upload package

Use when there is no target project write access, or the user is in Claude Desktop / Claude.ai / chat-only context and wants Skills UI upload/import.

Create one ZIP per canonical skill from:

```txt
skills/*/SKILL.md
```

Expected output shape: **one ZIP per `skills/*/SKILL.md`** (currently 48 — 16 baseline + 32 expansion across Batches 1–8: web 3D handoff deep, quality validators, domain scene planners, process discipline, asset/sourcing, color/format/output decisions, recipe/pack ops, runtime path discipline). Run `npm run skills:export` to generate them deterministically into `dist/claude-skills/desktop-zips/`. The full skill inventory lives in [`skills/README.md`](../skills/README.md).

Each ZIP must contain exactly one skill directory:

```txt
skill-name.zip
└── skill-name/
    └── SKILL.md
```

If running inside the repository, use:

```sh
npm run skills:export
```

Rules:

- Do not use `bundles/skill-package/blendops/` when the user wants multiple separate skills; that bundle is an umbrella fallback and intentionally contains one `SKILL.md`.
- Do not include `skills/_template/`.
- Keep each skill as its own ZIP for Claude Desktop / Claude.ai import.
- Also provide `claude-code-skills/` folder layout when possible for Claude Code users.
- If ZIP creation is blocked, output the exact per-skill folder tree and ask for file/zip capability.

### Mode C — Blocked

Use when the agent cannot safely fetch files, write files, create a ZIP, or choose a target.

Ask one concise question for the missing access, source files, or target choice. Do not invent package contents.

## Non-actions

Never do these during BlendOps install/prep:

- install Blender,
- configure Claude Desktop Connector,
- configure the official Blender MCP bridge/add-on,
- configure third-party runtime bridges,
- run Blender,
- run runtime eval,
- create/render/export preview, render, GLB, or artifact files,
- claim runtime success or artifact output without evidence,
- claim an npm package, npx installer, marketplace listing, or plugin listing exists.

## Required report

Return this report:

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

## First-use prompt after install

Use the BlendOps v0 product hero pack to plan a cyberpunk shoe web hero. Do not run Blender until runtime is explicitly available. Do not claim preview, render, or GLB artifacts exist without evidence.
