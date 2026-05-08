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

When Blender execution is needed from Claude app/Desktop, pick one of the four runtime routes (see [runtime-stack-strategy.md](./runtime-stack-strategy.md) for the corrected attribution history). Three of the four apply to Claude Desktop:

- **Route A — Anthropic Blender Connector** (recommended for Claude Desktop, lowest friction). Settings → Connectors → Blender → Enable. Blender 4.2+ (4.5 LTS recommended).
- **Route B — Blender Foundation MCP Server (`bpype/blender_mcp`)**. Manual install from blender.org/lab/mcp-server, plus MCP config in Claude Desktop. **Blender 5.1+**.
- **Route C — Community Blender MCP (`ahujasid/blender-mcp`)**. `uvx blender-mcp` + addon.py. Blender 3.0+. Mature 21K+ stars third-party; read [unofficial-runtime-bridges.md](./unofficial-runtime-bridges.md) before use.

Run a read-only request before any mutation/render/export, regardless of route.

**Single-client constraint:** Blender accepts one MCP client per session. Do not run Routes A + B + C concurrently against the same Blender instance.

Official links per route:

- Route A: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Route B: https://www.blender.org/lab/mcp-server/, https://projects.blender.org/lab/blender_mcp
- Route C: https://github.com/ahujasid/blender-mcp
- Route D (Blender CLI fallback): https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

BlendOps remains workflow/law/checklist layer and does not install runtime.

## Artifact truth policy

Never claim preview/render/GLB exists without evidence.

## Suggested next docs

- `docs/agent-install.md`
- `docs/examples/claude-app-project-instructions.md`
- `docs/examples/blendops-root-entrypoint.md`
