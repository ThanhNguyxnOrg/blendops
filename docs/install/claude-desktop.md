# Install target: Claude Desktop

Status/confidence: Draft v0, linked-only/manual

## Recommended near-term install mode

Claude Desktop can use the same universal prompt from [`README.md`](../../README.md). Expected selected mode is usually **skill.zip preparation**, because Claude Desktop-style chats often lack target project write access.

This is not a normal coding-agent install target. Project-local install is only appropriate if the assistant is actually operating inside a writable target project.

## Universal prompt behavior in Claude Desktop

When the universal prompt runs in Claude Desktop / chat-only context, the assistant should prepare a downloadable `skill.zip` from:

```txt
https://github.com/ThanhNguyxnOrg/blendops/tree/main/bundles/skill-package/blendops
```

If Claude cannot fetch repository subpaths, ask the user to upload the package folder/files or provide a direct package source. Do not invent file contents.

## skill.zip requirements

The downloadable ZIP must be named exactly:

```txt
skill.zip
```

ZIP root must contain:

```txt
SKILL.md
agents/openai.yaml
references/*.md
LICENSE.txt
```

Packaging rules:

- Do not zip parent folders like `bundles/`, `skill-package/`, or `claude-desktop-manual/`.
- The package must contain exactly one `SKILL.md` at the ZIP root.
- Keep references flattened under `references/`.
- `agents/openai.yaml` is OpenAI/ChatGPT Skills UI metadata only; it does not configure Claude Desktop Connector.
- Do not generate or commit `skill.zip` in this repo.
- Upload/import remains a manual user action.

## Fallbacks

If a downloadable ZIP cannot be created, the assistant should output the exact folder tree plus file contents/instructions and clearly say this is fallback only.

If Claude returns only `blendops.md` or `BLENDOPS_SINGLE_FILE.md`, treat that as fallback only. Ask it to create the full `skill.zip` with `SKILL.md`, `agents/openai.yaml`, `references/*.md`, and `LICENSE.txt` when possible.

Manual copy fallback:

- Use full manual bundle `bundles/claude-desktop-manual/` (`SKILL.md` + `references/`).
- Use `BLENDOPS_SINGLE_FILE.md` only when the workflow supports one file only.

Native Claude Desktop import paths are environment-specific and need user verification.

## Runtime boundary

Skill import/package prep is separate from runtime setup. It does not configure Claude Desktop Connector, install Blender, configure the Blender-side official MCP bridge/add-on, run Blender, run runtime eval, render, export, or produce artifacts.

Runtime status remains `Not Run`. Artifact status remains `Not Produced`.

## Report contract

Every Claude Desktop prep attempt should report:

- mode selected: `skill.zip preparation` or `blocked-needs-input`
- reason: Claude Desktop / chat-only / no project write access, or blocker
- zip filename: `skill.zip`, or fallback files/instructions
- SKILL.md count if zip mode: `1`
- global files touched: `No`
- runtime status: `Not Run`
- artifact status: `Not Produced`
- limitations

## What not to claim

- No claim of automated Claude Desktop UI import.
- No claim that connector/bridge is configured.
- No claim that runtime eval passed.
- No claim that preview/render/GLB was produced.
