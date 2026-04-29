# Runtime Stack Strategy

Status: Draft v0 stack decision  
Scope: Runtime stack selection for future BlendOps evals, not runtime execution

> [!CAUTION]
> This document does not install Blender, run Blender, mutate a scene, render, export GLB, or claim runtime artifacts. Full BlendOps runtime eval remains `Not Run`, and preview/render/GLB artifacts remain `Not Produced` until an eval record captures evidence.

---

## Stack decision summary

BlendOps public runtime guidance uses exactly three user-facing stacks:

1. **Stack 1 — Claude Desktop official connector stack**
2. **Stack 2 — Official Blender CLI fallback**
3. **Stack 3 — Optional unofficial third-party bridge stack**

Do **not** present “official MCP” as a separate standalone user-facing route. For Claude Desktop, the official Blender MCP bridge/add-on is a required dependency inside the Claude Desktop Connector stack. For non-Claude agents, direct official MCP usage is not currently proven and must not be listed as a supported user route.

Required current limitation:

> Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

---

## Stack table

| Stack | Name | Runtime chain | Current BlendOps status | Release-eval posture |
|---|---|---|---|---|
| 1 | Claude Desktop official connector stack | Claude Desktop Blender Connector → official Blender MCP bridge/add-on running inside Blender → Blender app/session | Read-only smoke test passed | Only official connector stack currently verified; first real BlendOps runtime eval should use this stack |
| 2 | Official Blender CLI fallback | Agent/shell → explicit Blender executable / CLI → Blender process | Official deterministic fallback; full CLI eval `Not Run` | Useful if Stack 1 is unavailable or fails; does not prove connector/MCP availability |
| 3 | Optional unofficial third-party bridge stack | MCP-capable client/agent → third-party server → third-party Blender add-on/socket bridge → Blender | Optional / unofficial / user-managed / experimental-local | Not part of BlendOps official release-eval path and not recommended official setup |

---

## Stack 1 — Claude Desktop official connector stack

Use this stack for users with Claude Desktop when Blender runtime execution is needed.

Stack components:

1. Claude Desktop Blender Connector.
2. Official Blender MCP bridge/add-on running inside Blender.
3. Blender app/session.
4. BlendOps eval prompts, recipes, and artifact truth labels.

Official / primary source links:

- Official Blender MCP project: https://projects.blender.org/lab/blender_mcp
- Blender Lab MCP page: https://www.blender.org/lab/mcp-server/
- Claude Blender Connector tutorial: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude

Required install guidance:

1. Enable or add the Blender connector in Claude Desktop.
2. Install and enable the official Blender MCP bridge/add-on in Blender from official Blender sources.
3. Enable Online Access if Blender requires it for the add-on/repository flow.
4. Start **MCP Bridge Server**, **Connect to Claude**, or the equivalent official server control inside Blender.
5. Confirm the host/port shown by the add-on when it is displayed, commonly `localhost:9876`.
6. Run a read-only connector smoke test first.
7. Only after read-only access passes should the user attempt scene mutation, render, export, or full runtime eval.

Current evidence:

- Read-only smoke test passed.
- Blender responded through read-only connector tools.
- Default scene data returned: Cube, Camera, Light.
- No mutation, render, export, preview, GLB, or artifact handoff was produced.

This is the only official connector stack currently verified. The first real BlendOps runtime eval should use this stack.

> [!IMPORTANT]
> Importing BlendOps skills, laws, packs, or docs does not install Blender, the Claude Desktop connector, or the Blender-side MCP bridge/add-on.

---

## Stack 2 — Official Blender CLI fallback

Use this stack when Stack 1 is unavailable or fails and a deterministic official Blender command-line fallback is acceptable.

Stack components:

1. Agent or shell with permission to invoke an explicit Blender executable.
2. Blender command-line interface.
3. Input `.blend` file, Python script, or command-line expression chosen by the operator.
4. Output directory and evidence capture.

Official / primary source link:

- Blender CLI docs: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

Required install/eval guidance:

- Blender must be installed and available through an explicit executable path or a verified `PATH` entry.
- The operator/agent must record the exact Blender command.
- The operator/agent must record the script/input used.
- The operator/agent must record output paths, generated files, exit status, logs, and validation evidence.
- No preview/render/GLB/artifact claim is allowed without evidence.
- CLI fallback does not need MCP or Claude Desktop.

Current status:

- Official, deterministic, agent-agnostic fallback.
- Less interactive than connector/MCP-based workflows.
- Full CLI eval is still `Not Run`.
- Preview/render/GLB artifacts are still `Not Produced`.

---

## Stack 3 — Optional unofficial third-party bridge stack

Use this stack only when a user knowingly chooses a local, third-party experiment outside the BlendOps official release-eval path.

Example upstream projects and caveats are documented on [Unofficial runtime bridges](./unofficial-runtime-bridges.md).

Stack components:

1. MCP-capable client/agent such as Claude Code, OpenCode, Cursor, Claude Desktop, or another user-configured client.
2. Third-party MCP server.
3. Third-party Blender add-on/socket bridge.
4. Blender app/session.

Required caveats:

- This stack is unofficial, user-managed, experimental, and local-only.
- It is not dependent on the official Blender MCP bridge/add-on.
- It is not standalone without its own Blender-side add-on/server.
- Configuring one client does not configure another; Claude Desktop config does not configure Claude Code/OpenCode/Cursor.
- It may be practical for MCP-capable clients only if the user configures that client and the upstream bridge correctly.
- It must not be treated as recommended official setup.
- It is not part of BlendOps official release-eval evidence.
- Warn users that third-party bridges may expose arbitrary Blender Python/code execution.
- Warn users about port conflicts if multiple Blender bridge servers use the same host/port, commonly `localhost:9876`.
- Do not run it together with the official bridge on the same host/port unless the user intentionally changes ports and understands the conflict risk.

If a user experiments with Stack 3, label results as local/experimental and keep them separate from official runtime eval evidence.

---

## Future research / unverified

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

Future research may investigate whether specific non-Claude Desktop clients can connect directly to the official Blender MCP project with source-backed configuration and local evidence. Until then:

- Do not list direct official MCP from Claude Code/OpenCode/Cursor/Codex/Gemini as a selectable user path.
- Do not claim it works.
- Do not reuse Claude Desktop connector smoke evidence as proof for another client.
- Do not count direct official MCP research as release-eval evidence unless a future policy and eval record explicitly allow it.

---

## Next executable path

For the next real runtime eval:

1. Prefer **Stack 1 — Claude Desktop official connector stack** because read-only smoke test evidence exists.
2. Run mutation/render/export only through the official runtime manual eval packet and evidence rules.
3. If Stack 1 fails or is unavailable, test **Stack 2 — Official Blender CLI fallback** with exact commands, inputs, output paths, and generated-file evidence.
4. Keep **Stack 3 — Optional unofficial third-party bridge stack** outside release evidence.
5. Keep direct official MCP from Claude Code/OpenCode/Cursor/Codex/Gemini in future research only.

Do not mark runtime eval complete, claim artifacts, claim packaged skill availability, or claim marketplace/plugin listing availability based on this strategy document.
