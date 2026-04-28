# BlendOps

BlendOps is being rebuilt as an **AI-native Blender workflow/product layer** for people who do not know Blender.

## What BlendOps is now

BlendOps currently defines product direction, workflow intent, and architecture for a non-Blender-user-first experience:

- natural-language creative intent understanding
- scene/workflow planning
- safe structured execution design
- validation criteria and output checks
- render/export handoff expectations
- web-ready 3D usage guidance

## What BlendOps is not

BlendOps does **not** currently ship its own custom runtime implementation for:

- a custom BlendOps CLI runtime
- a custom BlendOps MCP server
- a custom BlendOps Blender addon/bridge

BlendOps is also not intended to become another clone of Blender’s CLI or another clone of `ahujasid/blender-mcp`.

## Why this reset happened

The repository previously explored low-level runtime implementation (CLI/MCP/addon/schemas/runtime scripts/UAT). That exploration was useful, but it was not the long-term product goal.

This reset aligns the repo with the actual goal: a product/workflow layer that helps AI tools deliver useful 3D outcomes for users who do not know Blender internals.

## Target user

A person who knows nothing about Blender but can ask Claude Code, Cursor, OpenCode, Codex, or another AI coding tool to produce:

- a useful Blender scene
- a GLB asset
- a preview render
- web-ready 3D integration guidance

## Target product experience

User prompt (example intent):

> “Create a cyberpunk product hero section for a shoe website: floating shoe, neon lighting, glossy dark floor, cinematic camera, export GLB, and give me React Three Fiber usage guidance.”

Future flow:

`user prompt` → `intent understanding` → `BlendOps workflow/scene plan` → `safe structured execution design` → `external runtime execution` → `validation` → `render/export` → `non-Blender-language handoff`

## External runtime setup links

Use external runtimes today:

- Blender official CLI/runtime:
  https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
- Reference AI ↔ Blender MCP bridge:
  https://github.com/ahujasid/blender-mcp

## Current repo status

- Runtime-era custom implementation has been removed from the active codebase.
- Active docs now focus on product/workflow direction.
- Historical runtime docs are preserved under `docs/archive/` for context.

## Next milestones

1. Define first non-Blender-user golden path specification
2. Define scene/workflow plan format and safety model
3. Define validation checklist and user-facing output language
4. Decide external-runtime integration strategy
5. Build minimal product implementation from workflow requirements
6. Deliver web-ready 3D handoff guidance (GLB + React Three Fiber/Three.js)

## Historical runtime note

The old custom CLI/MCP/addon runtime was removed from the active codebase in this reset.

If needed, that historical implementation can be recovered from git history, including baseline commit:

- `04c70db`

## License

MIT — see [LICENSE](./LICENSE)
