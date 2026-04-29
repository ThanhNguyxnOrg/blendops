# BlendOps Agent Install Guide

## Mission
Install or attach the BlendOps v0 official-runtime skill collection to the current AI coding workspace.

Note:
- This guide originally targeted a monolithic draft path.
- The current install target is the root collection: `skills/`, `laws/`, and `packs/`.

## Safety rules
- Do not install Blender runtime.
- Do not run Blender.
- Do not claim runtime works.
- Do not use non-official MCP runtime paths.
- Do not modify global config unless the user explicitly requested global install.
- Prefer project-local install.
- Do not overwrite existing user rules/config without backup.
- Ask before destructive changes.

## Step 1 — Detect target environment
Detect if the current workspace is using:
- Claude Code
- OpenCode
- Cursor
- Codex / AGENTS.md style
- Unknown fallback

Detection hints (non-destructive):
- Claude Code hints: `CLAUDE.md`, `.claude/`
- OpenCode hints: `.opencode/`
- Cursor hints: `.cursor/`
- Codex/generic hints: `AGENTS.md`

## Step 2 — Choose install mode
Default:
- project-local install

Only use global install if:
- user explicitly asked for global install
- target path is verified
- backup/rollback is documented

## Step 3 — Attach BlendOps collection/docs
For v0, attach by copying or referencing:
- `skills/` (multiple focused skill units)
- `laws/` (shared guardrails)
- `packs/` (bundle manifests)
- `docs/external-runtime-setup.md` (official runtime prerequisite)
- `docs/reference-runtime.md` (runtime boundary reference)

Prefer linking/reference mode when full copy is unnecessary.

## Step 4 — Create entrypoint instruction
Create or update a project-local entrypoint where appropriate.

Potential targets, only if verified:
- Claude Code: `CLAUDE.md` plus project-local skill directories under `.claude/skills/<skill-name>/SKILL.md`
- OpenCode: project-local skill directories under `.opencode/skills/<skill-name>/SKILL.md`
- Cursor: `.cursor/rules/blendops.md` (collection index + links)
- Codex/generic: `AGENTS.md` section (collection index + links)

If uncertain:
- write a generic `AGENTS.md` or `BLENDOPS.md` fallback
- clearly tell the user which path was chosen and why

## Step 5 — Verify install
Check:
- files exist
- entrypoint links to BlendOps pack
- no runtime commands were run
- no BlendOps-owned CLI/runtime command surface was created or assumed
- no global config was modified unless requested
- old files were backed up if touched

## Step 6 — Tell user what to try next
Give a first prompt:

“Use the BlendOps v0 product hero pack to plan a cyberpunk shoe web hero. Do not run Blender until runtime is explicitly available.”

## Step 7 — Uninstall / rollback
Explain how to remove copied files and restore backups.

Minimum rollback checklist:
1. Remove project-local BlendOps-attached files created by this install pass.
2. Restore any backed-up pre-existing files.
3. Confirm no global config remains modified (unless explicitly approved and desired).

## Source confidence note
When install-path assumptions are uncertain, label them clearly (`verified-read`, `linked-only`, or `mixed`) and avoid inventing tool-specific behavior.
