# Claude Desktop Manual Import Steps (BlendOps)

Status: Draft v0 manual procedure

## Important boundaries

- Do not assume a fixed local Claude Desktop skill path.
- Do not assume an AI agent can click Claude Desktop UI.
- Treat import/copy as a manual user action.
- Runtime setup is separate from this bundle import.

## Recommended order

1. **Preferred:** import/copy the full `bundles/claude-desktop-manual/` folder if your workflow supports folder-level context.
2. If folder-level import is not available, copy `SKILL.md` plus `references/` files manually into your Claude Desktop project/context workflow.
3. Use `BLENDOPS_SINGLE_FILE.md` only when your setup supports one file only.

## Manual checklist

- [ ] Full bundle used when possible.
- [ ] Single-file fallback used only if full bundle was not feasible.
- [ ] Runtime components were not configured as part of this import.
- [ ] Runtime eval was not run.
- [ ] Preview/render/GLB artifacts were not claimed.

## After import

Record a manual install note using `INSTALL_REPORT_TEMPLATE.md`.

Required status fields:
- Runtime status: `Not Run`
- Artifact status: `Not Produced`
