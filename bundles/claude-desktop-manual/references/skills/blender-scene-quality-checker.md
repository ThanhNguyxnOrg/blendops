# blender-scene-quality-checker (reference summary)

## Purpose
Pass/warn/fail readiness gate and verdict.

## When to use
- a readiness decision is needed,
- quality gate is required before runtime.

## When not to use
- user only needs planning or evidence audit.

## Output/evidence contract
Return pass/warn/fail verdict with explicit blockers and runtime status.

## Handoff notes
Hand off to readiness checker or response-writer as appropriate.
