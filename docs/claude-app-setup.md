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

For broader multi-surface and distribution strategy, see [multi-agent-install-strategy.md](./multi-agent-install-strategy.md) and [distribution-strategy.md](./distribution-strategy.md).

## Runtime note

When Blender execution is needed from Claude app/Desktop, use Stack 1 — Claude Desktop official connector stack:

1. Add or enable the Claude Desktop Blender Connector.
2. Install/enable the official Blender MCP bridge/add-on inside Blender from official Blender sources.
3. Start **MCP Bridge Server**, **Connect to Claude**, or the equivalent official Blender-side server control.
4. Run a read-only connector smoke test before mutation/render/export.

Official links:

- Official Blender MCP project: https://projects.blender.org/lab/blender_mcp
- Blender Lab MCP page: https://www.blender.org/lab/mcp-server/
- Claude Blender Connector tutorial: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Blender CLI fallback docs: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

BlendOps remains workflow/law/checklist layer and does not install runtime.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

## Artifact truth policy

Never claim preview/render/GLB exists without evidence.

## Suggested next docs

- `docs/agent-install.md`
- `docs/examples/claude-app-project-instructions.md`
- `docs/examples/blendops-root-entrypoint.md`
