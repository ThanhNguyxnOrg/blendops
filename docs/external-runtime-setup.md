# External Runtime Setup

BlendOps is a workflow/product layer and does **not** ship its own custom CLI/MCP/addon runtime.

Active runtime guidance is official-only.

---

## Option A — Official Blender MCP Server

Primary Blender-side MCP runtime target:
- https://www.blender.org/lab/mcp-server/

Use this as the first runtime option when available in your environment.

For exact/current setup details, follow the official Blender page directly.

---

## Option B — Official Claude Blender Connector

Preferred Claude-side connector path:
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude

Use this option for Claude users who want the official Claude tutorial flow.

For exact/current setup details, follow the official Claude tutorial directly.

---

## Option C — Official Blender CLI

Low-level Blender runtime/process reference:
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

Use this for Blender command-line behavior, automation fundamentals, and runtime process understanding.

BlendOps does not use Blender CLI as its product interface; it is a runtime/process reference layer.

---

## Return to BlendOps

Once one official runtime path is working, continue with BlendOps workflow docs:

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
