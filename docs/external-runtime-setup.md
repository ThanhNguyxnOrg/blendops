# External Runtime Setup

BlendOps is a workflow/product layer and does **not** ship its own BlendOps-owned CLI/MCP/addon runtime.

Active runtime guidance is official-only. For route selection and current status, see [Runtime route strategy](./runtime-route-strategy.md).

---

## Route A — Claude Desktop Connector path

Current strongest first runtime eval candidate:
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude

Use this route for users with Claude Desktop. The read-only connector smoke test passed, but mutation, render, export, and artifact production remain `Not Tested` / `Not Produced`.

For exact/current setup details, follow the official Claude tutorial directly.

---

## Route B — Official MCP path for non-Claude Desktop agents

Candidate path for MCP-capable agents:
- https://www.blender.org/lab/mcp-server/

Use this route only when the target agent can be configured as an MCP client or host. Do not claim it works with Claude Code, OpenCode, Cursor, Codex, Gemini, or another agent until that specific client is verified.

For exact/current setup details, follow the official Blender page and the target agent's current MCP documentation directly.

---

## Route C — Official Blender CLI path

Official CLI fallback and process reference:
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

Use this for Blender command-line behavior, automation fundamentals, and runtime process understanding. If Route A fails during mutation, render, or export, Route C is the next official route to test.

BlendOps does not use Blender CLI as its product interface; it is a runtime/process reference layer.

---

## Route D — Optional unofficial bridge caveats

Official routes above remain the recommended and release-eval paths. If a user knowingly wants a user-managed, non-official bridge for a local experiment, read [Unofficial runtime bridges](./unofficial-runtime-bridges.md) first. Do not treat those bridges as BlendOps-supported setup or Draft v0 release-readiness evidence.

---

## Return to BlendOps

Once one official runtime path is working, continue with BlendOps workflow docs:

- Runtime route strategy: `./runtime-route-strategy.md`
- Product direction: `./product-direction.md`
- First user journey: `./first-user-journey.md`
- Architecture: `./architecture.md`
- Golden path example: `./golden-path-cyberpunk-shoe.md`
- Workflow contract: `./workflow-contract.md`
- Safety model: `./safety-model.md`

BlendOps role:

`natural-language intent` → `scene/workflow plan` → `validation` → `render/export handoff` → `web-ready guidance`

---

## Safety boundary

Official runtime integrations may expose powerful runtime operations.

BlendOps safety stance:
- Keep user-facing behavior constrained by workflow + validation + evidence.
- Avoid using arbitrary execution primitives as the final product interface.
- Prefer explicit assumptions, explicit checks, and clear pass/partial/fail reporting.
