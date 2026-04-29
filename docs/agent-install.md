# BlendOps Agent Install Guide

## Mission
Install or attach the BlendOps v0 official-runtime skill pack to the current AI coding workspace.

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

## Step 3 — Attach BlendOps docs/skills
For v0, attach by copying or referencing:
- `docs/laws/`
- `docs/skills/`
- `docs/workflows/`
- `docs/recipes/`
- `docs/packs/`
- `docs/external-runtime-setup.md`
- `docs/reference-runtime.md`

Prefer linking/reference mode when full copy is unnecessary.

## Step 4 — Create entrypoint instruction
Create or update a project-local entrypoint where appropriate.

Potential targets, only if verified:
- Claude Code: `CLAUDE.md` or `.claude/skills/blendops/SKILL.md`
- OpenCode: `.opencode/skills/blendops/SKILL.md`
- Cursor: `.cursor/rules/blendops.md` or equivalent
- Codex/generic: `AGENTS.md` section

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
