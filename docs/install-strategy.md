# BlendOps Install Strategy

Status: Draft v0

## v0 install philosophy

BlendOps v0 is a **docs/skill-pack adoption layer**, not a runtime installer.

What v0 install does:
- attaches BlendOps laws/skills/workflows/recipes/packs to an AI coding workspace
- creates project-local entrypoint guidance
- preserves official-runtime-only boundaries

What v0 install does not do:
- install Blender runtime
- run Blender
- claim runtime is ready
- mutate global config without explicit user approval

## Install targets

Primary target (default):
- project-local workspace attachment

Optional target (explicit opt-in only):
- user-global attachment for a specific tool, with backup + rollback

## Project-local install (default)

Recommended default because it is:
- reversible
- low-risk
- repository-scoped
- easier to audit

Project-local attachment should include references/copies of:
- `docs/laws/`
- `docs/skills/`
- `docs/workflows/`
- `docs/recipes/`
- `docs/packs/`
- runtime boundary references (`docs/external-runtime-setup.md`, `docs/reference-runtime.md`)

## User-global install (opt-in)

Only proceed when:
- user explicitly requests global install
- tool-specific global path is verified
- backup + rollback steps are prepared and reported

## Claude Code notes

- Prefer project-local `CLAUDE.md` augmentation or project-local skill entrypoint.
- If using `.claude/skills/<skill-name>/SKILL.md`, ensure backup of any existing content before edits.
- Keep runtime setup external and link to official runtime docs.

## OpenCode notes

- Prefer project-local `.opencode/skills/<skill-name>/SKILL.md` when path conventions are verified.
- If conventions are uncertain, fallback to project-local `AGENTS.md`/`BLENDOPS.md` with explicit note.

## Cursor notes

- Prefer project-local `.cursor/rules/` attachment where verified.
- Keep rules concise and reference BlendOps docs rather than duplicating large content.

## Codex / AGENTS.md notes

- Prefer project-local `AGENTS.md` section-based attachment.
- Keep explicit law order + first-use prompt + runtime boundaries.

## Official runtime prerequisite

BlendOps adoption assumes official runtime setup remains external:
1. Official Blender MCP Server
2. Official Claude Blender Connector
3. Official Blender CLI reference

BlendOps install does not validate runtime execution; it only attaches workflow/law/skill guidance.

## Rollback/uninstall model

Every install action should produce:
- change summary
- touched-file list
- backup file list
- rollback instructions

Rollback minimum:
1. delete newly attached project-local files
2. restore backups of modified files
3. report post-rollback status

## Source confidence labels

Use these labels in install reports:
- `verified-read`: source fetched/read directly
- `linked-only`: link verified but full content unavailable
- `mixed`: combined confidence state

## Why this is not a runtime installer

BlendOps v0 intentionally avoids runtime ownership creep.

Its role is to make AI-agent behavior safer, clearer, and more consistent for non-Blender users through laws/skills/workflows/recipes/packs.
