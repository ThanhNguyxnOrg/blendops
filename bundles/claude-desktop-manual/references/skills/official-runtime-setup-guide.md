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
Return the chosen runtime route (Route A — Anthropic Connector / Route B — Blender Foundation `bpype/blender_mcp` / Route C — community `ahujasid/blender-mcp` / Route D — Blender CLI), required prerequisites with the correct per-route Blender version (Route A: 4.2+, Route B: 5.1+, Route C: 3.0+, Route D: 4.2+ recommended), and an explicit "setup is external to BlendOps" boundary. Runtime status remains `Not Run` until execution evidence exists. See `references/runtime-stacks.md` for the route summary.

## Handoff notes
Hand off to `official-runtime-readiness-checker` once setup steps are recorded; never use this skill as evidence that the runtime is operational.
