# Reference Runtime

> This file summarizes runtime boundaries. For setup flow, see [External runtime setup](./external-runtime-setup.md). For stack selection, see [Runtime stack strategy](./runtime-stack-strategy.md).

BlendOps uses external runtime primitives and remains a workflow/product layer above runtime execution.

## Runtime stack model

BlendOps public runtime guidance uses exactly three user-facing stacks:

1. **Stack 1 — Claude Desktop official connector stack**
   - Claude Desktop Blender Connector → official Blender MCP bridge/add-on running inside Blender → Blender app/session.
   - Preferred first real runtime eval candidate because read-only connector smoke evidence exists.
   - This is the only official connector stack currently verified.
   - https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
   - https://projects.blender.org/lab/blender_mcp
   - https://www.blender.org/lab/mcp-server/

2. **Stack 2 — Official Blender CLI fallback**
   - Agent/shell invokes explicit Blender executable / CLI.
   - This does not use MCP and does not need Claude Desktop.
   - Official deterministic fallback if Stack 1 is unavailable or fails.
   - Full CLI eval is still `Not Run`.
   - https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

3. **Stack 3 — Optional unofficial third-party bridge stack**
   - MCP-capable client/agent → third-party server → third-party Blender add-on/socket bridge → Blender.
   - Optional, unofficial, user-managed, experimental/local only.
   - Not recommended official setup and not part of BlendOps official release-eval evidence.
   - See [Unofficial runtime bridges](./unofficial-runtime-bridges.md).

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

## Important interface boundary

BlendOps does not treat runtime internals as user-facing product behavior.

BlendOps focuses on:

- intent normalization
- workflow constraints
- validation gates
- artifact/handoff clarity

## Setup authority

Use [External runtime setup](./external-runtime-setup.md) as the BlendOps setup overview and [Runtime stack strategy](./runtime-stack-strategy.md) as the stack decision record. Follow upstream official docs for exact/current setup instructions.

Optional non-official bridge caveats live in [Unofficial runtime bridges](./unofficial-runtime-bridges.md). That page describes Stack 3 only; it is not part of the active official release-eval path and must not be treated as BlendOps-supported official setup or release-readiness evidence.
