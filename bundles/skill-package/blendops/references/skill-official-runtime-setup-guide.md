# official-runtime-setup-guide

Purpose: define a safe, official-runtime-only setup path before any Blender execution claim.

Use at the beginning of a Blender task, when the runtime path is unknown, or when the user asks how to set up runtime prerequisites.

Do not use to install runtime, configure connector/MCP automatically, or to claim runtime execution has already succeeded.

Output contract: chosen runtime route (Route A — Anthropic Connector / Route B — Blender Foundation `bpype/blender_mcp` / Route C — community `ahujasid/blender-mcp` / Route D — Blender CLI), required prerequisites with the correct per-route Blender version (A: 4.2+, B: 5.1+, C: 3.0+, D: 4.2+ recommended), explicit "setup is external to BlendOps" boundary, runtime status `Not Run`, and the next safe handoff (typically `official-runtime-readiness-checker`). See `references/runtime-stacks.md` for the route summary.
