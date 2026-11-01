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

## Local repository CLI (optional)

When running from a local BlendOps repository checkout, you can run the deterministic project-local installer (`--dry-run` is required before `--write`):

```sh
node scripts/install-skills.mjs --target generic-project --project /path/to/project --dry-run
node scripts/install-skills.mjs --target generic-project --project /path/to/project --write
```

## Rollback notes

Run `node scripts/install-skills.mjs --rollback --project /path/to/project` (or manually delete `BLENDOPS.md`, restore any modified file from `.blendops/backups/`, and remove `.blendops/`). Use the fixture rollback notes as a starting point when performing manual installs.

## Runtime boundary

Skill install != runtime setup. For Blender execution this tool would be a Path 1 host-(b) manual-MCP host or Path 2 host; setup is separate — see `docs/external-runtime-setup.md`. Skill install here never configures runtime.

## What not to claim

- Runtime setup done.
- Runtime eval passed.
- Preview/render/GLB artifacts produced.
