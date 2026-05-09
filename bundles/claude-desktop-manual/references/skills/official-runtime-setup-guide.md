# official-runtime-setup-guide (reference summary)

## Purpose
Define a safe, official-runtime-only setup path for users/agents before any Blender execution claim.

## When to use
- beginning of a Blender-related task,
- runtime path is unknown,
- user asks how to set up runtime prerequisites.

## When not to use
- to install runtime automatically,
- to claim runtime execution has already succeeded.

## Output/evidence contract
Return the chosen runtime path (Path 1 — Official Blender Lab MCP, with host option (a) Anthropic Connector in Claude Desktop or (b) manual MCP client; or Path 2 — community `ahujasid/blender-mcp`; or CLI fallback appendix — `blender --background --python`, documented upstream as first-class Blender CLI, no in-repo evidence file yet). Apply the correct per-path Blender minimum (Path 1 either host: **5.1+** because of the Lab add-on; Path 2: 3.0+; CLI: 4.2+ recommended). Anthropic Connector is **not** standalone — the Lab add-on inside Blender is required either way. State the explicit "setup is external to BlendOps" boundary. Runtime status remains `Not Run` until execution evidence exists. See `references/runtime-stacks.md` for the path summary.

## Handoff notes
Hand off to `official-runtime-readiness-checker` once setup steps are recorded; never use this skill as evidence that the runtime is operational.
