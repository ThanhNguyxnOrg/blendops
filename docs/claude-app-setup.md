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

When Blender execution is needed from Claude app/Desktop, pick one of the runtime paths (see [runtime-stack-strategy.md](./runtime-stack-strategy.md) for the corrected attribution history):

- **Path 1 — Official Blender Lab MCP** (recommended for Claude Desktop). Lab add-on + Lab server installed in Blender per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/). Then pick a host:
  - Host (a): Anthropic Blender Connector toggle in Settings → Connectors → Blender → Enable (one-click).
  - Host (b): Manual MCP client config in Settings → Developer → Edit Config (`mcpServers` JSON pointing at the Lab `.mcpb` bundle).
  Practical floor: **Blender 5.1+** (Lab add-on manifest). Anthropic's "4.2+" prerequisite is misleading because the Lab add-on it requires is 5.1+. Anthropic Connector is **not** standalone — Lab add-on inside Blender is required either way.
- **Path 2 — Community Blender MCP (`ahujasid/blender-mcp`)**. `uvx blender-mcp` + `addon.py`. Blender 3.0+. Mature 21K+ stars third-party; read [unofficial-runtime-bridges.md](./unofficial-runtime-bridges.md) before use.
- **CLI fallback (appendix)** — direct `blender --background --python`. **Publisher has not verified** in this repo.

Run a read-only request before any mutation/render/export, regardless of path.

**Single-client constraint:** Blender accepts one MCP client per session. Do not run Routes A + B + C concurrently against the same Blender instance.

Official links per path:

- Path 1, host (a) Anthropic Connector: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Path 1, Blender-side Lab MCP (required for both hosts): https://www.blender.org/lab/mcp-server/, https://projects.blender.org/lab/blender_mcp
- Path 2: https://github.com/ahujasid/blender-mcp
- CLI fallback (appendix, not publisher-verified): https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

BlendOps remains workflow/law/checklist layer and does not install runtime.

## Artifact truth policy

Never claim preview/render/GLB exists without evidence.

## Suggested next docs

- `docs/agent-install.md`
- `docs/examples/claude-app-project-instructions.md`
- `docs/examples/blendops-root-entrypoint.md`
