# BlendOps AI Agent Quickstart

Use this file as the single instruction source when asking any AI agent to install, attach, or prepare BlendOps.

Source repository:
https://github.com/ThanhNguyxnOrg/blendops

## Goal

Prepare BlendOps for the current environment using the safest available mode.

BlendOps attaches workflow knowledge only. It does not install Blender, configure runtime connectors, run Blender, or prove generated artifacts.

## Mode selection

Choose exactly one mode.

### Mode A — Project-local install

Use when the agent can inspect and write files in a target project.

Do this:

1. Inspect the project first.
2. Detect the target tool only if obvious.
3. If multiple targets are present, ask before writing.
4. Prefer project-local install.
5. If target support is unclear, use the generic project-local fallback.
6. Do not write global config unless the user explicitly approves it.
7. Back up existing instruction/config files before editing.
8. Attach the BlendOps core collection:
   - `skills/`
   - `laws/`
   - `packs/`
   - selected runtime boundary docs under `docs/`
9. Create or update the safest project-local entrypoint for the target.
10. Report files changed and rollback steps.

Detailed flow:
https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/ai-agent-install-flow.md

### Mode B — Multiple Skills upload package

Use when there is no target project write access, or the user is in Claude Desktop / Claude.ai / chat-only context and wants Skills UI upload/import.

Create one ZIP per canonical skill from:

```txt
skills/*/SKILL.md
```

Expected output shape:

```txt
desktop-zips/
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

Each ZIP must contain exactly one skill directory:

```txt
skill-name.zip
└── skill-name/
    └── SKILL.md
```

If running inside the repository, use:

```sh
npm run skills:export
```

Rules:

- Do not use `bundles/skill-package/blendops/` when the user wants multiple separate skills; that bundle is an umbrella fallback and intentionally contains one `SKILL.md`.
- Do not include `skills/_template/`.
- Keep each skill as its own ZIP for Claude Desktop / Claude.ai import.
- Also provide `claude-code-skills/` folder layout when possible for Claude Code users.
- If ZIP creation is blocked, output the exact per-skill folder tree and ask for file/zip capability.

### Mode C — Blocked

Use when the agent cannot safely fetch files, write files, create a ZIP, or choose a target.

Ask one concise question for the missing access, source files, or target choice. Do not invent package contents.

## Non-actions

Never do these during BlendOps install/prep:

- install Blender,
- configure Claude Desktop Connector,
- configure the official Blender MCP bridge/add-on,
- configure third-party runtime bridges,
- run Blender,
- run runtime eval,
- create/render/export preview, render, GLB, or artifact files,
- claim runtime success or artifact output without evidence,
- claim an npm package, npx installer, marketplace listing, or plugin listing exists.

## Required report

Return this report:

```md
## BlendOps install/prep report

- Mode selected:
- Target or reason:
- Files changed or ZIP filenames:
- SKILL.md count if ZIP mode:
- Global files touched: No
- Rollback steps if project-local mode:
- Runtime status: Not Run
- Artifact status: Not Produced
- Limitations:
```

## First-use prompt after install

Use the BlendOps v0 product hero pack to plan a cyberpunk shoe web hero. Do not run Blender until runtime is explicitly available. Do not claim preview, render, or GLB artifacts exist without evidence.
