# BlendOps Product Direction

## Pivot Summary

BlendOps is **not** trying to rebuild Blender’s official CLI.

BlendOps is **not** trying to clone `ahujasid/blender-mcp`.

BlendOps is now positioned as a **safe workflow layer** for AI-driven Blender work by users who do not know Blender internals.

## Foundation Assumptions

1. **Official Blender CLI is the runtime primitive**
   - Blender process launch/runtime behavior comes from Blender itself.
   - BlendOps builds on top of that lifecycle rather than replacing it.

2. **`ahujasid/blender-mcp` is prior art, not implementation source**
   - It proves AI ↔ Blender addon/MCP interaction can work.
   - BlendOps uses it as benchmark/reference only.

3. **BlendOps value is safety + workflow structure**
   - Typed operations
   - Request correlation (`request_id`, `receipt`)
   - Readiness/status/logs
   - Guarded execution and dry-run semantics

## Who BlendOps is For

Primary user:
- A person who does not know Blender APIs, modes, or operator quirks
- But can ask Claude Code / Cursor / OpenCode / Codex to produce 3D outcomes

Target outcomes:
- scene preview
- exportable asset (for example GLB)
- web-ready handoff inputs

## Product Trajectory (North Star)

User prompt
→ intent understanding
→ safe scene plan
→ dry-run
→ execute
→ validate
→ render/export
→ non-Blender-language output for downstream use

## Current Scope (This Phase)

BlendOps currently commits to a **minimal safe runtime foundation**:

- CLI entrypoint + diagnostics
- Managed bridge lifecycle (`start/status/logs/stop`)
- Scene inspect
- Minimal object create
- MCP server startup + minimal tool surface
- Addon/bridge main-thread dispatch

Infrastructure (CLI/MCP/addon/core/schemas) is a means to the product, not the product itself.

## De-emphasized for Now

Implemented capabilities outside the immediate foundation are intentionally de-emphasized in product messaging:

- render/export
- advanced validation presets
- batch execution expansion
- material/lighting/camera breadth
- undo workflows
- creative prompt catalogs

These remain as freeze candidates unless they are needed for foundation stability.

## Hard Safety Boundaries

- No arbitrary Python endpoint for AI users
- No raw shell execution surface
- No unrestricted Blender CLI flag passthrough to AI
- No unverified runtime claims
- No npm publish in this pivot pass

## Reference Docs

- [Runtime Foundation Parity](./runtime-foundation-parity.md)
- [Foundation Prune Audit](./foundation-prune-audit.md)
- [Main README](../README.md)
- [Roadmap Phases](../TODO.md)
