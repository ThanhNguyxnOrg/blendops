# official-runtime-readiness-checker (reference summary)

## Purpose
Preflight readiness matrix and blocker reporting before runtime eval.

## When to use
- before attempting runtime execution,
- when readiness status is unclear.

## When not to use
- user only needs planning or evidence audit.

## Output/evidence contract
Return readiness verdict (Ready/Conditionally Ready/Blocked) with explicit blockers and runtime status.

## Handoff notes
Hand off to runtime execution only when Ready, or to evidence/response-writer when blocked.
