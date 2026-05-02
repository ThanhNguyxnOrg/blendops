# Install target: Claude Code

Status/confidence: Draft v0, verified-read for project-local adapter

## Recommended near-term install mode

Project-local install first. Tool-native path only if verified in the current environment.

## Copy/paste prompt

```txt
Install BlendOps for Claude Code in this repository using project-local files.

Requirements:
- Inspect project files first.
- Prefer project-local install.
- Use native Claude Code path only if verified.
- If path is ambiguous, ask before writing and use generic fallback if needed.
- Do not modify global config unless explicitly requested.
- Do not install/configure runtime components.
- Do not run Blender/runtime eval.
- Do not claim preview/render/GLB artifacts.

Report files changed and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## Expected files/folders

- Candidate/verified hints: `CLAUDE.md`, `.claude/` context files.
- If native path is uncertain, use project-local `BLENDOPS.md` / `AGENTS.md` fallback.

## Rollback notes

Delete newly created project-local files and restore backups for modified files.

## Runtime boundary

Skill install != runtime setup.

## What not to claim

- Direct official MCP runtime support from Claude Code.
- Runtime execution success.
- Artifact production.
