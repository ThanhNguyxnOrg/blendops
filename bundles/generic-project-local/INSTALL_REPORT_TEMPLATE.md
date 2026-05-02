# BlendOps Generic Project Install Report

Status: Draft v0 report template  
Target: generic-project

## Summary

- Target selected: generic-project
- Confidence:
- Scope: project-local
- Install mode: manual fixture copy / reference
- Global files touched: No
- Runtime status: Not Run
- Artifact status: Not Produced
- Runtime setup: Separate; not performed

## Files created/modified

| Path | Action | Backup |
|---|---|---|
| `BLENDOPS.md` | created / skipped / modified | n/a |
| `AGENTS.md` | not touched / patched |  |

## Files skipped

| Path | Reason |
|---|---|
|  |  |

## Rollback steps

1. Remove `BLENDOPS.md` if it was created by this install.
2. Restore `AGENTS.md` from the backup listed above if it was patched.
3. Remove any project-local metadata folder listed by the install report.
4. Confirm no global files were touched.

## Safety confirmations

- [ ] Blender was not installed.
- [ ] Claude Desktop Connector was not configured.
- [ ] Official Blender MCP bridge/add-on was not configured.
- [ ] Third-party runtime bridges were not configured.
- [ ] Blender was not run.
- [ ] Runtime eval was not run.
- [ ] Preview/render/GLB artifacts were not created or claimed.
- [ ] Global files were not touched.

## Limitations

- This report covers project-local skill/instruction attachment only.
- Runtime setup remains separate.
- Artifact evidence remains unavailable until a runtime eval records it.
