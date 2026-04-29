# Claude App/Desktop Setup (BlendOps)

Status: Draft guidance

## Purpose

Clarify how to use BlendOps with Claude app/Desktop as a separate target from Claude Code.

## Key distinction

- Claude Code and Claude app/Desktop are different install/attachment targets.
- Do not assume Claude app/Desktop reads `.claude/skills` paths.

## Recommended approach

Use Claude app/Desktop with:
- Project Instructions / knowledge docs / prompt pack style guidance
- `BLENDOPS.md` and/or `AGENTS.md` style project-local instruction files
- user-managed Personal Skills import when supported by the app UI
- official runtime references when runtime is needed

For the broader multi-surface strategy, see [multi-agent-install-strategy.md](./multi-agent-install-strategy.md).

## Official runtime note

When Blender execution is needed, use official runtime paths:
1. Official Blender MCP Server
2. Official Claude Blender Connector tutorial
3. Official Blender CLI docs

BlendOps remains workflow/law/checklist layer and does not install runtime.

## Artifact truth policy

Never claim preview/render/GLB exists without evidence.

## Suggested next docs

- `docs/agent-install.md`
- `docs/examples/claude-app-project-instructions.md`
- `docs/examples/blendops-root-entrypoint.md`
