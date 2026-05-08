# Runtime Routes (Condensed)

BlendOps runtime guidance uses **four runtime routes** (replacing the older 3-stack labeling that conflated three different products):

1. **Route A — Anthropic Blender Connector** (one-click in Claude Desktop, min Blender 4.2+ per Anthropic tutorial / 4.5 LTS recommended)
2. **Route B — Blender Foundation MCP Server (`bpype/blender_mcp`)** (manual install, min Blender **5.1+**)
3. **Route C — Community Blender MCP (`ahujasid/blender-mcp`)** (mature 21K+ stars third-party, min Blender 3.0+)
4. **Route D — Official Blender CLI** (no MCP, min Blender 4.2+ recommended)

Single-client constraint: Blender accepts one MCP client per session. Do not run Routes A + B + C concurrently against the same Blender instance.

Runtime status must remain explicit (`Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`).
