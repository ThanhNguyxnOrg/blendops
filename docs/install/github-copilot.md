# Install target: GitHub Copilot

Status/confidence: Draft v0 candidate, linked-only/generic

## Recommended near-term install mode

Project-local docs/instruction attachment using generic fallback.

## Copy/paste prompt

```txt
Set up BlendOps for a GitHub Copilot workflow using project-local instruction files.

Requirements:
- Use conservative generic fallback unless a Copilot-specific project path is verified.
- Prefer `BLENDOPS.md` and optional `AGENTS.md` update with backup.
- Avoid global writes by default.
- Do not install/configure runtime components.
- Do not run Blender/runtime eval.
- Do not claim preview/render/GLB artifacts.
- Do not claim extension, plugin, or marketplace availability.

Report changed files, skipped files, and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## Expected files/folders

No verified Copilot-native BlendOps install path in this repo; use generic project-local files.

## Rollback notes

Delete created files and restore backups.

## Runtime boundary

Skill install != runtime setup.

## What not to claim

- Official Copilot plugin/marketplace distribution.
- Runtime eval success.
- Artifact production.
