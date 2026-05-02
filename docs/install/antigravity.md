# Install target: Antigravity

Status/confidence: Draft v0 candidate, not researched

## Recommended near-term install mode

Generic project-local fallback until adapter/path validation exists.

## Copy/paste prompt

```txt
Install BlendOps for Antigravity using a conservative project-local fallback.

Requirements:
- Treat Antigravity native path support as candidate/needs verification.
- If suggesting paths such as `.agent/skills`, mark them as candidate and do not write there unless verified in this environment.
- Prefer `BLENDOPS.md` and optional `AGENTS.md` fallback.
- Avoid global writes by default.
- Do not install/configure runtime components.
- Do not run Blender/runtime eval.
- Do not claim preview/render/GLB artifacts.

Report changed files, skipped files, confidence labels, and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## Expected files/folders

- `.agent/skills` or similar path: candidate only, needs verification.
- Verified fallback: project-root `BLENDOPS.md` and optional backup-safe `AGENTS.md` update.

## Rollback notes

Remove fallback files and restore backups.

## Runtime boundary

Skill install != runtime setup.

## What not to claim

- Verified Antigravity native path support without repository evidence.
- Packaged/plugin/marketplace install support.
- Runtime/artifact success.
