# Install target: Generic project

Status/confidence: Draft v0, verified-read fallback

## Recommended near-term install mode

Generic project-local fallback is the default safest route when target confidence is low.

## Copy/paste prompt

```txt
Install BlendOps in this project using generic project-local fallback.

Requirements:
- Create `BLENDOPS.md` at project root.
- Optionally patch `AGENTS.md` only with backup and minimal changes.
- Link/reference BlendOps skills/laws/packs/docs.
- Avoid tool-specific config writes unless path is verified.
- Avoid global writes by default.
- Do not install/configure runtime components.
- Do not run Blender/runtime eval.
- Do not claim preview/render/GLB artifacts.

Report changed files, skipped files, and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## Expected files/folders

- `BLENDOPS.md` (project root)
- optional `AGENTS.md` minimal update with backup
- static fallback fixture reference: [`bundles/generic-project-local/`](../../bundles/generic-project-local/)
  - `BLENDOPS.md` template
  - `ROLLBACK.md` rollback notes
  - `INSTALL_REPORT_TEMPLATE.md` install report template
  - `manifest.json` fixture metadata

## Rollback notes

Delete `BLENDOPS.md` and restore any modified file from backup. Use the fixture rollback notes as a starting point, adapting paths to the target project.

## Runtime boundary

Skill install != runtime setup.

## What not to claim

- Runtime setup done.
- Runtime eval passed.
- Preview/render/GLB artifacts produced.
