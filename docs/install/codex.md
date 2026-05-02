# Install target: Codex CLI/App

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Generic project instruction fallback (`BLENDOPS.md` and optional `AGENTS.md` update with backup).

## Copy/paste prompt

```txt
Install BlendOps for Codex using generic project-local instruction files.

Requirements:
- Do not assume a native Codex skills loader exists.
- Prefer `BLENDOPS.md` fallback and optional small `AGENTS.md` patch with backup.
- Avoid global writes unless explicitly approved.
- Do not install/configure runtime components.
- Do not run Blender/runtime eval.
- Do not claim preview/render/GLB artifacts.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## Expected files/folders

No verified Codex-native install path in this repo; use generic project-local files.

## Rollback notes

Remove fallback instruction files and restore backups.

## Runtime boundary

Skill install != runtime setup.

## What not to claim

- Native Codex install path support without verification.
- Runtime/artifact success claims.
