# Install target: OpenCode

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Project-local install with generic fallback when native path is unverified.

## Copy/paste prompt

```txt
Install BlendOps for OpenCode using a reversible project-local approach.

Requirements:
- Verify native path before any tool-specific write.
- If uncertain, use generic project-local fallback (`BLENDOPS.md`/`AGENTS.md`).
- Avoid global writes by default.
- Do not install/configure runtime bridges.
- Do not run Blender/runtime eval.
- Do not claim preview/render/GLB artifacts.

Report changed files, skipped files, and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## Expected files/folders

- Detection hint: `.opencode/` directory.
- Native install path is candidate/needs verification.

## Rollback notes

Remove project-local additions and restore backups.

## Runtime boundary

Skill install != runtime setup.

## What not to claim

- Verified tool-native OpenCode path unless proven in this environment.
- Runtime success or artifact output.
