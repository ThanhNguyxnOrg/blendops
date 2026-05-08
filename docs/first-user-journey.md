# First User Journey (Specification)

This document defines the target non-Blender-user experience as a **spec only**.

## Example user prompt

> “Create a cyberpunk shoe web hero with a floating shoe, neon lights, glossy dark floor, cinematic camera, export GLB, and give me web usage guidance.”

## Future BlendOps + AI flow

1. Clarify intent if needed
   - confirm style, subject constraints, output requirements, and usage target
2. Choose scene style and constraints
   - framing, lighting mood, materials, camera intent, deliverable format
3. Create scene/workflow plan
   - safe structured steps and validation checkpoints
4. Route through external runtime layer
   - execution via one of the four runtime routes: Route A (Anthropic Blender Connector — one-click in Claude Desktop), Route B (Blender Foundation MCP `bpype/blender_mcp` — manual install, Blender 5.1+), Route C (community `ahujasid/blender-mcp` — mature 21K+ stars third-party), or Route D (Blender CLI — no MCP). See `./runtime-stack-strategy.md` for the corrected attribution history and per-route status.
5. Validate result
   - check scene/output criteria against requested intent
6. Render/export
   - produce preview assets and GLB handoff package
7. Return non-Blender-user explanation
   - plain-language result summary, quality caveats, and next-step guidance

## Expected artifacts (target state)

- scene/workflow plan summary
- validation summary
- exported GLB (or explicit failure reason)
- preview outputs where available
- web integration guidance (React Three Fiber / Three.js oriented)

## Scope note

This is not implemented in this reset pass.

This reset establishes foundation direction only.
