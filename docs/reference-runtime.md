# Reference Runtime

> This file summarizes runtime boundaries. For setup flow, see [External runtime setup](./external-runtime-setup.md). For route selection, see [Runtime route strategy](./runtime-route-strategy.md).

BlendOps uses external runtime primitives and remains a workflow/product layer above runtime execution.

## Official runtime route hierarchy (active strategy)

1. **Route A — Claude Desktop Connector path**
   - Preferred first real runtime eval candidate because read-only connector smoke evidence exists.
   - https://claude.com/resources/tutorials/using-the-blender-connector-in-claude

2. **Route B — Official MCP path for non-Claude Desktop agents**
   - Candidate path for MCP-capable agents only after per-agent configuration is verified.
   - https://www.blender.org/lab/mcp-server/

3. **Route C — Official Blender CLI path**
   - Official fallback runtime/eval path if Route A fails during mutation, render, or export.
   - https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Important interface boundary

BlendOps does not treat runtime internals as user-facing product behavior.

BlendOps focuses on:
- intent normalization
- workflow constraints
- validation gates
- artifact/handoff clarity

## Setup authority

Use [External runtime setup](./external-runtime-setup.md) as BlendOps setup overview and [Runtime route strategy](./runtime-route-strategy.md) as the route decision record. Follow upstream official docs for exact/current setup instructions.

Optional non-official bridge caveats live in [Unofficial runtime bridges](./unofficial-runtime-bridges.md). That page maps to Route D only; it is not part of the active official runtime hierarchy and must not be treated as BlendOps-supported setup or release-readiness evidence.

