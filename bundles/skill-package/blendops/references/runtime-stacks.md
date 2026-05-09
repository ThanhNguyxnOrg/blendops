

# Runtime Paths

BlendOps uses **two MCP execution paths** plus a **CLI fallback appendix** (replaces older 3-stack and 4-route labelings):

1. **Path 1 — Official Blender Lab MCP.** Lab add-on + Lab server installed in Blender, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually. Min Blender **5.1+** (Lab add-on manifest). Anthropic Connector is **not** standalone — Lab add-on inside Blender is required either way. Read-only smoke 2026-04-29 (likely Anthropic Connector host); mutation/render/export `Not Run`.
2. **Path 2 — Community `ahujasid/blender-mcp`.** Different `addon.py` + server via `uvx blender-mcp`. Mature 21K+ stars third-party. Min Blender **3.0+**. User-reported verified; no formal evidence file yet.
3. **CLI fallback (appendix).** Direct `blender --background --python`. No MCP. Min Blender 4.2+ recommended. **Publisher has not verified** in this repo.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance.

Runtime setup is separate from skill import.
