# Runtime Route Strategy

Status: Draft v0 route decision  
Scope: Runtime route selection for future BlendOps evals, not runtime execution

> [!CAUTION]
> This document does not install Blender, run Blender, mutate a scene, render, export GLB, or claim runtime artifacts. Full BlendOps runtime eval remains `Not Run`, and preview/render/GLB artifacts remain `Not Produced` until an eval record captures evidence.

---

## Route decision summary

BlendOps currently separates four runtime routes. The first real runtime eval should prefer **Route A — Claude Desktop Connector path** because the read-only Claude Desktop Blender connector smoke test passed and returned real default scene data: Cube, Camera, and Light.

If Route A fails during mutation, render, or export, the next official route to test is **Route C — Official Blender CLI path**. Route B remains a per-agent MCP candidate until each agent is verified. Route D remains optional, unofficial, user-managed, and outside the BlendOps release-eval path.

| Route | Name | Intended user | Current status | Release-eval posture |
|---|---|---|---|---|
| A | Claude Desktop Connector path | Users with Claude Desktop | Read-only smoke test passed | Strongest current candidate for first real runtime eval |
| B | Official MCP path for non-Claude Desktop agents | Claude Code, OpenCode, Cursor, Codex, Gemini, or other MCP-capable agents | Candidate / needs per-agent verification | Do not claim support for a specific agent until verified |
| C | Official Blender CLI path | Users without Claude Desktop or MCP-capable integration | Official fallback candidate / full CLI eval Not Run | Next official route if Route A fails during mutation/render/export |
| D | Optional unofficial MCP bridge path | Users knowingly choosing a local third-party experiment | Optional / third-party / user-managed | Not part of BlendOps official release-eval evidence |

---

## Route A — Claude Desktop Connector path

Use this route for users with Claude Desktop.

Route A uses:

1. Claude Desktop Blender Connector.
2. Blender-side MCP bridge/server required by the connector.
3. BlendOps eval prompts, recipes, and artifact truth labels.

Current evidence:

- Read-only smoke test passed.
- Blender-side connector access returned real default scene data: Cube, Camera, and Light.
- No mutation, render, export, preview, or GLB production has been tested.

Route A is the strongest current candidate for the first real BlendOps runtime eval because it already has scoped read-only connector evidence. That evidence does not prove mutation, render, export, artifact validation, or full workflow success.

Required next eval posture:

- Run the runtime availability checklist before any execution.
- Run the official runtime manual eval packet only in a runtime-available environment.
- Record prompts, connector actions, Blender-side actions, permission prompts, generated files, and failures.
- Keep render/export/artifacts as `Not Tested` or `Not Produced` until evidence exists.

---

## Route B — Official MCP path for non-Claude Desktop agents

Use this route for Claude Code, OpenCode, Cursor, Codex, Gemini, or other MCP-capable agents only if the agent can be configured as an MCP client or host.

Route B uses:

1. Official Blender MCP Server and add-on.
2. The target agent's verified MCP client/host configuration.
3. Separate evidence for that specific agent.

Current status:

- Candidate / needs per-agent verification.
- Do not claim Route B works with any specific agent until that agent's current MCP configuration is verified and locally tested.
- Skill/plugin install is separate from runtime MCP configuration.
- Configuration in one MCP client does not automatically configure another.

Route B requirements before support claims:

- Verify the target agent's MCP config format, transport support, and approval flow.
- Record the exact client-specific config source and date checked.
- Capture a route-specific runtime eval record.
- Avoid reusing Claude Desktop connector evidence as proof for Claude Code, OpenCode, Cursor, Codex, Gemini, or any other client.

---

## Route C — Official Blender CLI path

Use this route for users without Claude Desktop or without a verified MCP-capable integration.

Route C uses:

1. Explicit Blender executable path.
2. Official Blender command line documentation.
3. Exact command, exit status, logs, output paths, and evidence capture.

Route C is official and deterministic, but less interactive than connector or MCP routes. It can be a fallback runtime/eval path if connector or MCP routes are unavailable.

Route C should be the next official route to test if Route A fails during mutation, render, or export. A Route C success does not prove connector availability or MCP-agent availability.

Current status:

- Official CLI route exists as a documented Blender path.
- Full CLI eval is still `Not Run`.
- No preview/render/GLB artifact has been produced by a Route C eval in this repository.

Execution evidence must include:

- Blender executable path style.
- Exact command line and argument order.
- Exit status and logs.
- Generated file paths or explicit `Not Produced` labels.
- Platform caveats and cleanup notes.

---

## Route D — Optional unofficial MCP bridge path

Use this route only when a user knowingly chooses a local, non-official bridge experiment. See [Unofficial runtime bridges](./unofficial-runtime-bridges.md) for the allowlisted caveat-only page.

Route D is:

- Optional.
- Third-party.
- User-managed.
- Not official Blender tooling.
- Not part of the BlendOps official release-eval path.
- Not a substitute for official runtime evidence.

Route D must not be used to unblock Draft v0 release-readiness claims. If a user experiments with Route D, label results as local/experimental and keep them separate from official runtime eval evidence.

---

## Next executable path

For the next real runtime eval:

1. Prefer **Route A** because read-only smoke test evidence exists.
2. Run mutation/render/export only through the official runtime manual eval packet and evidence rules.
3. If Route A fails during mutation, render, or export, test **Route C** as the next official fallback route.
4. Keep **Route B** as a per-agent candidate until client-specific MCP setup is verified.
5. Keep **Route D** optional, unofficial, user-managed, and outside release evidence.

Do not mark runtime eval complete, claim artifacts, claim packaged skill availability, or claim marketplace/plugin listing availability based on this strategy document.
