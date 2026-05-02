# Install target: Cursor

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Project-local docs/rules attachment only after path verification; otherwise generic fallback.

## Copy/paste prompt

```txt
Install BlendOps for Cursor in project-local mode.

Requirements:
- Verify Cursor-specific path before writing tool-native files.
- If not verified, use generic fallback (`BLENDOPS.md`/`AGENTS.md`).
- Backup existing files before edits.
- Avoid global mutation.
- Do not install/configure runtime components.
- Do not run Blender/runtime eval.
- Do not claim preview/render/GLB artifacts.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## Expected files/folders

- Detection hint: `.cursor/` directory.
- `.cursor/rules` path is candidate/needs verification.

## Rollback notes

Remove new files and restore backups.

## Runtime boundary

Skill install != runtime setup.

## What not to claim

- Guaranteed Cursor native path support.
- Runtime eval success.
- Artifact production.
