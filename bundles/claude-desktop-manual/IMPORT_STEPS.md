# Claude Desktop Manual Import Steps (BlendOps)

Status: Draft v0 manual procedure

## Important boundaries

- Start with the universal prompt in `README.md` when asking an AI/chat to prepare BlendOps.
- Expected Claude Desktop mode: **skill.zip preparation**.
- Do not assume a fixed local Claude Desktop skill path.
- Do not assume an AI agent can click Claude Desktop UI.
- Treat upload/import/copy as a manual user action.
- Runtime setup is separate from this bundle import.

## Recommended order

1. Ask Claude Desktop or another chat assistant to use the universal prompt and prepare `skill.zip` from `bundles/skill-package/blendops/`.
   - ZIP root must contain `SKILL.md`, `agents/openai.yaml`, `references/*.md`, and `LICENSE.txt`.
   - `agents/openai.yaml` is OpenAI/ChatGPT Skills UI metadata only and does not configure Claude Desktop Connector.
2. Upload/import `skill.zip` if your Claude Desktop workflow supports package upload/import.
3. If package upload/import is unavailable, manually copy `SKILL.md` plus `references/` from this manual bundle.
4. Use `BLENDOPS_SINGLE_FILE.md` only when your setup supports one file only.

## Manual checklist

- [ ] Universal prompt used when asking an AI/chat to prepare the package.
- [ ] Full `skill.zip` used when possible.
- [ ] Single-file fallback used only if full bundle was not feasible.
- [ ] Runtime components were not configured as part of this import.
- [ ] Runtime eval was not run.
- [ ] Preview/render/GLB artifacts were not claimed.

## Single-file fallback

If Claude returns only `BLENDOPS_SINGLE_FILE.md` or a `blendops.md` summary, treat it as fallback only. Ask it to create the full `skill.zip` when possible.

## After import

Record a manual install note using `INSTALL_REPORT_TEMPLATE.md`.

Required status fields:
- Runtime status: `Not Run`
- Artifact status: `Not Produced`
