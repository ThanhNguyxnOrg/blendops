# official-runtime-only (law summary)

Keep BlendOps aligned to documented Blender runtime routes only.

Required behavior:
- name the runtime route explicitly (Route A / B / C / D from `references/runtime-stacks.md`),
- do not invent custom runtime implementations,
- preserve the 4-route runtime model (Anthropic Connector, Blender Foundation MCP `bpype/blender_mcp`, community `ahujasid/blender-mcp`, Blender CLI),
- do not mis-attribute per-route properties (the Blender 5.1+ requirement applies only to Route B).

Route C (`ahujasid/blender-mcp`) is third-party from both Anthropic and the Blender Foundation but is mature (21K+ stars, prior art); it is one of the four canonical routes, with extra caveats in `references/install-boundary.md` and `unofficial-runtime-bridges` guidance.

Single-client constraint: Blender accepts one MCP client per session. Do not run Routes A + B + C concurrently against the same Blender instance.
