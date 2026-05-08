# Runtime Routes

BlendOps uses four runtime routes (replacing the older 3-stack labeling):

1. **Route A — Anthropic Blender Connector.** One-click in Claude Desktop. Min Blender 4.2+ (4.5 LTS recommended). Not Verified.
2. **Route B — Blender Foundation MCP Server (`bpype/blender_mcp`).** Manual install. Min Blender **5.1+**. Ambiguous attribution.
3. **Route C — Community Blender MCP (`ahujasid/blender-mcp`).** Mature 21K+ stars third-party. Min Blender 3.0+. User-reported verified; no formal evidence file yet.
4. **Route D — Official Blender CLI.** No MCP. Min Blender 4.2+ recommended. Not Run.

Single-client constraint: Blender accepts one MCP client per session. Do not run Routes A + B + C concurrently against the same Blender instance.

Runtime setup is separate from skill import.
