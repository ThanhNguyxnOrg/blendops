# External Runtime Setup

BlendOps is a workflow/product layer and does **not** ship its own BlendOps-owned CLI/MCP/addon runtime.

Active runtime guidance uses the 3-stack model in [Runtime stack strategy](./runtime-stack-strategy.md).

> [!IMPORTANT]
> Importing BlendOps skills, laws, packs, or docs does not install Blender runtime, the Claude Desktop connector, any MCP server, or any Blender add-on.

---

## Stack 1 — Claude Desktop official connector stack

Use this stack for users with Claude Desktop when Blender runtime execution is needed.

Runtime chain:

```txt
Claude Desktop Blender Connector
  → official Blender MCP bridge/add-on running inside Blender
  → Blender app/session
```

Official / primary links:

- Official Blender MCP project: https://projects.blender.org/lab/blender_mcp
- Blender Lab MCP page: https://www.blender.org/lab/mcp-server/
- Claude Blender Connector tutorial: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude

Required setup guidance:

1. Add or enable the Blender connector in Claude Desktop.
2. Install and enable the official Blender MCP bridge/add-on in Blender from official Blender sources.
3. Enable Online Access if Blender requires it for the add-on/repository flow.
4. Start **MCP Bridge Server**, **Connect to Claude**, or the equivalent official server control inside Blender.
5. Confirm the host/port shown by the add-on when shown, commonly `localhost:9876`.
6. Run a read-only connector smoke test first.
7. Only after read-only access passes should the user attempt scene mutation, render, export, or full runtime eval.

Current BlendOps evidence:

- Read-only connector smoke test passed.
- Blender responded through read-only connector tools.
- Default scene data returned: Cube, Camera, Light.
- No mutation, render, export, preview, or GLB artifact was produced.
- Full runtime eval remains `Not Run`.

This is the only official connector stack currently verified. The first real BlendOps runtime eval should use this stack.

---

## Stack 2 — Official Blender CLI fallback

Use this stack if Stack 1 is unavailable or fails and a deterministic command-line fallback is acceptable.

Runtime chain:

```txt
Agent/shell
  → explicit Blender executable / CLI
  → Blender process
```

Official link:

- Blender CLI docs: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

Required setup/eval guidance:

- Blender must be installed and available through an explicit executable path or verified `PATH` entry.
- The operator/agent must record the exact Blender command.
- The operator/agent must record the script/input used.
- The operator/agent must record the output folder, generated files, exit status, logs, and validation evidence.
- No artifact claim is allowed without evidence.
- CLI fallback does not need MCP or Claude Desktop.

Current BlendOps evidence:

- Full CLI eval is still `Not Run`.
- Preview/render/GLB artifacts are still `Not Produced`.

---

## Stack 3 — Optional unofficial third-party bridge stack

Use this stack only when a user knowingly chooses a third-party local experiment.

Runtime chain:

```txt
MCP-capable client/agent
  → third-party bridge server
  → third-party Blender add-on/socket bridge
  → Blender
```

Optional upstream examples and caveats live in [Unofficial runtime bridges](./unofficial-runtime-bridges.md).

Required caveats:

- Follow the upstream third-party repo; BlendOps does not copy or own its install docs.
- Configure each MCP client separately. Config in Claude Desktop does not configure Claude Code/OpenCode/Cursor.
- Install/run that third-party bridge server and that third-party Blender add-on/socket bridge if you choose it.
- Keep it experimental/local and user-managed.
- Do not treat it as official release evidence.
- Do not run it together with the official bridge on the same host/port unless the user intentionally changes ports and understands conflicts, commonly around `localhost:9876`.
- Treat arbitrary Blender Python/code execution as a serious local security risk.

This stack is not dependent on the official Blender MCP bridge/add-on and is not standalone without its own Blender-side add-on/server.

---

## Future research / unverified

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

Do not tell users to choose it. Do not claim it works. Keep any future investigation under source-backed research and separate eval evidence.

---

## Return to BlendOps

Once one appropriate runtime stack is working, continue with BlendOps workflow docs:

- Runtime stack strategy: `./runtime-stack-strategy.md`
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

Runtime integrations may expose powerful Blender capabilities.

BlendOps safety stance:

- Keep user-facing behavior constrained by workflow + validation + evidence.
- Avoid using arbitrary execution primitives as the final product interface.
- Prefer explicit assumptions, explicit checks, and clear pass/partial/fail reporting.
