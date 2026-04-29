# Reference Runtime

> This file summarizes runtime boundaries. For setup flow, see [External runtime setup](./external-runtime-setup.md).

BlendOps uses external runtime primitives and remains a workflow/product layer above runtime execution.

## Official runtime hierarchy (active strategy)

1. **Official Blender MCP Server**
   - Primary Blender-side MCP runtime target.
   - https://www.blender.org/lab/mcp-server/

2. **Official Claude Blender Connector**
   - Preferred official Claude-side connector path.
   - https://claude.com/resources/tutorials/using-the-blender-connector-in-claude

3. **Official Blender CLI**
   - Low-level runtime/process reference for Blender behavior.
   - https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Important interface boundary

BlendOps does not treat runtime internals as user-facing product behavior.

BlendOps focuses on:
- intent normalization
- workflow constraints
- validation gates
- artifact/handoff clarity

## Setup authority

Use [External runtime setup](./external-runtime-setup.md) as BlendOps setup overview, and follow upstream official docs for exact/current setup instructions.

## Historical note

Historical community prior-art material, where preserved, belongs in `docs/archive/` only and is not active setup guidance.
