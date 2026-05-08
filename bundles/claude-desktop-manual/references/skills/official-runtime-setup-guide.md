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
Return the chosen runtime stack (Stack 1/2/3), required prerequisites, and an explicit "setup is external to BlendOps" boundary. Runtime status remains `Not Run` until execution evidence exists.

## Handoff notes
Hand off to `official-runtime-readiness-checker` once setup steps are recorded; never use this skill as evidence that the runtime is operational.
