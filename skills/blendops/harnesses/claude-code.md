# Harness Notes: Claude Code

Status: Draft v0

## Attachment intent

Attach `skills/blendops/` to the current project context as guidance files.

## Path assumptions (verify before writing)

- likely project-local instruction file: `CLAUDE.md`
- optional project-local skill path: `.claude/skills/blendops/SKILL.md`

If uncertain, use a project-local fallback (`AGENTS.md` or `BLENDOPS.md`) and explain why.

## Safety constraints

- prefer project-local install
- do not modify global config without explicit user approval
- do not run Blender during install
- do not claim runtime is installed/working
