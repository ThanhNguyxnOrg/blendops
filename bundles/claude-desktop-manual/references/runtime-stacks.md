

# Runtime Paths (Condensed)

BlendOps uses **two MCP execution paths** plus a **CLI fallback appendix** (replaces older 3-stack and 4-route labelings):

1. **Path 1 — Official Blender Lab MCP.** Lab add-on + Lab server installed in Blender, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually. Min Blender **5.1+** (Lab add-on manifest). Anthropic Connector is **not** standalone — Lab add-on inside Blender is required either way per Anthropic's tutorial step 2.
2. **Path 2 — Community `mcp-for-blender` (formerly `blender-mcp`).** Different add-on/server. Mature third-party. Min Blender **3.0+**.
3. **CLI fallback (appendix).** Direct `blender --background --python`. No MCP. Min Blender 4.2+ recommended. **Documented upstream** as a first-class Blender CLI surface; no in-repo evidence file yet.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance on `localhost:9876` (side-by-side on separate instances via per-instance `--port 9877` is supported upstream).

Runtime status must remain explicit (`Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`).
