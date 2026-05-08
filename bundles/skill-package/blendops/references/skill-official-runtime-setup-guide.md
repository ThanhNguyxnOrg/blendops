# official-runtime-setup-guide

Purpose: define a safe, official-runtime-only setup path before any Blender execution claim.

Use at the beginning of a Blender task, when the runtime path is unknown, or when the user asks how to set up runtime prerequisites.

Do not use to install runtime, configure connector/MCP automatically, or to claim runtime execution has already succeeded.

Output contract: chosen runtime stack (Stack 1/2/3), required prerequisites, explicit "setup is external to BlendOps" boundary, runtime status `Not Run`, and the next safe handoff (typically `official-runtime-readiness-checker`).
