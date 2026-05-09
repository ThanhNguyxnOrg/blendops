

# official-runtime-only (law summary)

Keep BlendOps aligned to documented Blender runtime paths only.

Required behavior:

- name the runtime path explicitly (Path 1 or Path 2 from `references/runtime-stacks.md`); for Path 1 also name the host option (a — Anthropic Connector, b — manual MCP client) when relevant,
- do not invent custom runtime implementations,
- preserve the 2-path + CLI appendix model:
  - Path 1 = Official Blender Lab MCP add-on/server in Blender 5.1+, hosted from Anthropic Connector OR manual MCP client.
  - Path 2 = Community `ahujasid/blender-mcp`, Blender 3.0+.
  - CLI fallback = direct Blender CLI; appendix only; **publisher has not verified**.
- do not describe Anthropic Connector as standalone — Anthropic's tutorial explicitly tells you to install the Lab MCP add-on inside Blender.
- the Blender 5.1+ floor applies to **all** of Path 1 (whichever host).

Path 2 (`ahujasid/blender-mcp`) is third-party from both Anthropic and the Blender Foundation but is mature (21K+ stars, prior art). It is one of the canonical paths, with extra caveats in unofficial-runtime-bridges guidance.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance.
