# official-runtime-only

Use documented Blender runtime paths only for release-facing BlendOps guidance:

1. **Path 1 — Official Blender Lab MCP.** Lab MCP add-on + Lab MCP server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually. Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 tells you to install the Lab add-on inside Blender. The Blender 5.1+ floor applies to all of Path 1, regardless of host.
2. **Path 2 — Community `ahujasid/blender-mcp`.** Different add-on/server. Mature 21K+ stars third-party, Blender 3.0+. Not endorsed by Anthropic or Blender Foundation, but treated as a supported path with extra caveats.
3. **CLI fallback (appendix).** Direct `blender --background --python`. No MCP. **Documented upstream** as a first-class Blender CLI surface (stable across LTS releases, used widely in render farms / HPC / CI); BlendOps has no in-repo evidence file yet.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance.
