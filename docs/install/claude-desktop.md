# Install target: Claude Desktop

Status/confidence: Draft v0, linked-only/manual

## Recommended near-term install mode

Manual/user-managed import/copy path. This is not a normal coding-agent install target.

## Copy/paste checklist prompt

```txt
I use Claude Desktop.
Prepare a project-local BlendOps attachment plan only.

Requirements:
- Treat Claude Desktop skill import as a manual user step.
- Do not claim an AI agent can click/import in Claude Desktop UI.
- Provide files I should copy/reference and where they belong in my project context.
- Keep runtime setup separate.
- Do not configure Claude Desktop Connector.
- Do not configure official Blender MCP bridge/add-on.
- Do not run Blender or runtime eval.
- Do not claim preview/render/GLB artifacts.

Report:
- files prepared
- files skipped
- manual steps for me
- rollback steps
- runtime status: Not Run
- artifact status: Not Produced
```

## Expected files/folders

Project-local docs/instructions only (`BLENDOPS.md` and optional `AGENTS.md` update with backup). Native Claude Desktop import path is environment-specific and needs verification.

## Rollback notes

Remove newly added project-local instruction files and restore backups for modified existing files.

## Runtime boundary

Skill install is separate from runtime setup. Connector and Blender-side bridge setup are separate user actions.

## What not to claim

- No claim of automated Claude Desktop UI import.
- No claim that connector/bridge is configured.
- No claim that runtime eval passed.
- No claim that preview/render/GLB was produced.
