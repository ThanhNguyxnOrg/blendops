# Blender Skill Benchmark Analysis for BlendOps

Status: Draft research
Date: 2026-04-29

## Purpose

Analyze strong Blender skill systems and extract structural patterns for richer BlendOps skills without copying content or adopting non-official runtime setup.

## Benchmarked sources

- https://github.com/kevinbadi/blender-skills
- related mirrors/forks discovered in pass (reedington / ainjection / ravibharathivs)
- https://github.com/MushroomFleet/BlenderRetopology-Skill
- https://github.com/Dev-GOM/claude-code-marketplace (blender-toolkit)
- superpowers/bmad/oh-my-openagent pattern references (structure/gates/install UX)

## What strong Blender skills do well

1. **Task-specific skill units**
   - separate skills per workflow concern (camera, lookdev, turntable, retopo)
2. **Rich procedural depth**
   - detailed operating flow, not 3-step outlines
3. **Parameter and decision handling**
   - explicit assumptions, parameter tables, branch logic
4. **Troubleshooting guidance**
   - practical blocker handling and fallback reasoning
5. **Quality checks and review loops**
   - explicit pass/fail checks before claiming completion

## Why they feel useful

- they reduce ambiguity in execution planning
- they include concrete “what to do next” behavior
- they encode edge-case handling and caveat language

## What BlendOps should borrow structurally

- multi-skill decomposition by responsibility
- strong section schema per skill
- gate-based quality/review model
- explicit mode handling (text-only / runtime-ready / blocked)
- eval prompt + rubric per skill

## What BlendOps must avoid

- runtime ownership creep (custom CLI/MCP/addon surfaces)
- non-official runtime setup as active path
- evidence-free artifact claims
- opaque arbitrary-code final user interfaces

## Rich skill vs custom runtime (explicit distinction)

- **Rich skill** = deep procedural guidance, gates, rubrics, and caveat handling.
- **Custom runtime** = execution substrate ownership (CLI/MCP/addon code).

BlendOps targets the first and explicitly avoids the second.

## BlendOps direction from benchmarks

BlendOps can be equally rich by:
- keeping official-runtime-only boundaries,
- deepening each skill with procedures, decision trees, and rubrics,
- adding per-skill eval files,
- enforcing review gates before promotion from draft.

## Risk note

Some benchmark repos include non-official runtime assumptions or code-heavy execution details. These are treated as structural inspiration only, not active runtime strategy.
