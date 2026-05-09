# blender-troubleshooting (reference summary)

## Purpose
Structured 4-phase root-cause analysis when Blender output (render, export, GLB, response) does not match intent. Inspired by Anthropic Superpowers `/systematic-debugging`.

## When to use
- render came out wrong (black, blown out, missing assets)
- GLB is empty / mis-scaled / fails validation
- non-Blender-user response is jargon-heavy
- recipe fails despite recent smoke pass

## When not to use
- intent itself is unclear (run brainstorming or brief writer first)
- request is creative iteration ("more dramatic"), not debugging

## Output/evidence contract
4-phase diagnostic record (reproduce → narrow → identify → propose). One-sentence root cause + 1-2 rejected alternatives with reasons. Fix proposal with pass criteria + handoff skill named. This skill diagnoses; never executes.

## Handoff notes
- intent / brief divergence → `blender-brainstorming` or `intent-to-3d-brief-writer`
- planning divergence → relevant planner
- execution divergence → `official-runtime-readiness-checker` or `runtime-bridge-conflict-resolver`
- output divergence → `render-export-evidence` or `glb-web-handoff`
- response divergence → `non-blender-user-response-writer`
