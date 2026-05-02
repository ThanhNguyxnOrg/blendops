# BlendOps Claude Desktop Manual Bundle

Status: Draft v0 fixture only  
Target: `claude-desktop-manual`

## What this bundle is

This is the preferred **full manual Claude Desktop bundle** for attaching BlendOps guidance.

It provides:
- one Claude Desktop-facing router skill (`SKILL.md`),
- reference summaries for skills, laws, packs, runtime stacks, and evidence rules,
- one single-file fallback (`BLENDOPS_SINGLE_FILE.md`) for one-file-only import situations.

## Preferred vs fallback

- **Preferred:** full manual bundle (`SKILL.md` + `references/`)
- **Fallback only:** `BLENDOPS_SINGLE_FILE.md` when import/copy supports only one file

The single-file fallback is intentionally less complete than the full bundle.

## Runtime boundary

This bundle is guidance-only.

It does **not**:
- install Blender,
- configure Claude Desktop Connector,
- configure the official Blender MCP bridge/add-on,
- run Blender,
- run runtime eval,
- produce preview/render/GLB artifacts.

Runtime status remains `Not Run`. Artifact status remains `Not Produced` until evidence exists.

## Installation mode

Claude Desktop is a manual/user-managed flow, not a normal coding-agent auto-install target.

Use [IMPORT_STEPS.md](./IMPORT_STEPS.md) for import/copy instructions.

## Canonical source alignment

This bundle is a condensed reference fixture aligned to canonical project sources:
- `skills/`
- `laws/`
- `packs/`
- `docs/skill-system.md`
- `docs/runtime-stack-strategy.md`
- `docs/ai-agent-install-flow.md`
- `docs/install/claude-desktop.md`
- `docs/install/installer-spec.md`
