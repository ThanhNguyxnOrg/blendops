# Install target: Claude Desktop

Status/confidence: Draft v0, linked-only/manual

## Recommended near-term install mode

Claude Desktop can use the concise prompt from [`README.md`](../../README.md#-use-in-30-seconds), which points the assistant to [`AI Agent Quickstart`](../ai-agent-quickstart.md). Expected selected mode is usually **multiple Skills ZIP preparation**, because Claude Desktop-style chats often lack target project write access.

This is not a normal coding-agent install target. Project-local install is only appropriate if the assistant is actually operating inside a writable target project.

## Prompt behavior in Claude Desktop

When the prompt runs in Claude Desktop / Claude.ai / chat-only context, the assistant should prepare one downloadable ZIP per canonical skill from:

```txt
skills/*/SKILL.md
```

If Claude cannot fetch repository subpaths, ask the user to upload the repository files or provide direct source access. Do not invent file contents.

## Multiple ZIP requirements

Expected ZIP files:

```txt
blendops-help.zip
product-hero-scene-planner.zip
official-runtime-readiness-checker.zip
official-runtime-setup-guide.zip
render-export-evidence.zip
glb-web-handoff.zip
blender-composition-camera-planner.zip
blender-lighting-material-planner.zip
blender-scene-quality-checker.zip
non-blender-user-response-writer.zip
```

Each ZIP must contain:

```txt
skill-name/
  SKILL.md
```

Packaging rules:

- Create one ZIP per skill directory under `skills/`.
- Do not include `skills/_template/`.
- Do not use `bundles/skill-package/blendops/` when the user wants multiple skills; that bundle is a one-skill umbrella fallback.
- Each ZIP must contain exactly one top-level skill folder and exactly one `SKILL.md`.
- Upload/import remains a manual user action.

If running inside this repo, use:

```sh
npm run skills:export
```

Outputs:

```txt
dist/claude-skills/desktop-zips/*.zip
dist/claude-skills/claude-code-skills/*/SKILL.md
```

## Fallbacks

If downloadable ZIP files cannot be created, the assistant should output the exact per-skill folder tree plus file contents/instructions and clearly say this is fallback only.

If Claude returns only `skill.zip`, `blendops.md`, or `BLENDOPS_SINGLE_FILE.md`, treat that as an umbrella/manual fallback only. Ask it to create separate ZIP files from `skills/*/SKILL.md` when multiple recognized skills are required.

Native Claude Desktop import paths are environment-specific and need user verification.

## Runtime boundary

Skill import/package prep is separate from runtime setup. It does not configure Claude Desktop Connector, install Blender, configure the Blender-side official MCP bridge/add-on, run Blender, run runtime eval, render, export, or produce artifacts.

Runtime status remains `Not Run`. Artifact status remains `Not Produced`.

## Report contract

Every Claude Desktop prep attempt should report:

- mode selected: `multiple Skills ZIP preparation` or `blocked-needs-input`
- reason: Claude Desktop / Claude.ai / chat-only / no project write access, or blocker
- ZIP filenames generated, or fallback files/instructions
- SKILL.md count if ZIP mode: `1` per ZIP
- global files touched: `No`
- runtime status: `Not Run`
- artifact status: `Not Produced`
- limitations

## What not to claim

- No claim of automated Claude Desktop UI import.
- No claim that connector/bridge is configured.
- No claim that runtime eval passed.
- No claim that preview/render/GLB was produced.
