# Reference Runtime

> This file summarizes runtime boundaries. For setup flow, see [External runtime setup](./external-runtime-setup.md). For route selection and the corrected attribution history, see [Runtime stack strategy](./runtime-stack-strategy.md).

BlendOps uses external runtime primitives and remains a workflow/product layer above runtime execution.

## Runtime route model

BlendOps runtime guidance uses four distinct runtime routes (replacing the older 3-stack labeling that conflated three different products into one stack):

1. **Route A — Anthropic Blender Connector** (one-click in Claude Desktop, Anthropic-shipped)
   - Anthropic Blender Connector → local helper → Blender (4.2+ per Anthropic tutorial; 4.5 LTS recommended).
   - Verification status: **Not Verified**.
   - Tutorial: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude

2. **Route B — Blender Foundation MCP Server** (`bpype/blender_mcp`, manual install, any MCP client)
   - Any MCP client → MCP transport → `bpype/blender_mcp` → Blender 5.1+ session with the Blender Lab MCP add-on.
   - Verification status: **Ambiguous attribution** — 2026-04-29 smoke test tool names match Route B but the labeled runtime path was Route A.
   - Source: https://www.blender.org/lab/mcp-server/, https://projects.blender.org/lab/blender_mcp

3. **Route C — Community Blender MCP** (`ahujasid/blender-mcp`, manual install, any MCP client)
   - Any MCP client → MCP transport → `ahujasid/blender-mcp` server → Blender 3.0+ session with the upstream `addon.py`.
   - Mature prior-art project (21K+ stars). Third-party from both Anthropic and Blender Foundation.
   - Verification status: **User-reported verified** (2026-05-08 statement); no formal evidence record file yet.
   - Caveats live in [Unofficial runtime bridges](./unofficial-runtime-bridges.md).
   - Source: https://github.com/ahujasid/blender-mcp

4. **Route D — Official Blender CLI** (no MCP, deterministic fallback)
   - Agent/shell → explicit `blender` executable → Blender process.
   - Verification status: **Not Run** (full CLI eval still pending).
   - Source: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Important interface boundary

BlendOps does not treat runtime internals as user-facing product behavior.

BlendOps focuses on:

- intent normalization
- workflow constraints
- validation gates
- artifact/handoff clarity

## Setup authority

Use [External runtime setup](./external-runtime-setup.md) as the BlendOps setup overview and [Runtime stack strategy](./runtime-stack-strategy.md) as the route decision record. Follow upstream official docs for exact/current setup instructions.

Caveats specific to Route C (community `ahujasid/blender-mcp`) live in [Unofficial runtime bridges](./unofficial-runtime-bridges.md). That page describes Route C only. The page name was kept "unofficial" because Route C is unofficial from both Anthropic's and Blender Foundation's perspective, even though it is mature and widely used.

## Single-client constraint

Blender accepts a single MCP client per session. Do not run Route A + Route B + Route C concurrently against the same Blender instance.
