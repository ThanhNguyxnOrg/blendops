# official-runtime-setup-guide

Purpose: define a safe, official-runtime-only setup path before any Blender execution claim.

Use at the beginning of a Blender task, when the runtime path is unknown, or when the user asks how to set up runtime prerequisites.

Do not use to install runtime, configure connector/MCP automatically, or to claim runtime execution has already succeeded.

Output contract: chosen runtime path (Path 1 — Official Blender Lab MCP, with host option (a) Anthropic Connector in Claude Desktop or (b) manual MCP client; or Path 2 — community `ahujasid/blender-mcp`; or CLI fallback appendix — documented upstream as first-class Blender CLI, no in-repo evidence file yet). Apply the correct per-path Blender minimum (Path 1 either host: **5.1+** because of the Lab add-on; Path 2: 3.0+; CLI: 4.2+ recommended). Anthropic Connector is **not** standalone — the Lab add-on inside Blender is required either way. State the explicit "setup is external to BlendOps" boundary, mark runtime status `Not Run`, and hand off to `official-runtime-readiness-checker`. See `references/runtime-stacks.md` for the path summary.
