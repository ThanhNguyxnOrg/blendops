# Path Constraints Comparison Matrix

| Dimension | Path 1 — Official Blender Lab MCP | Path 2 — Community `mcp-for-blender` | CLI Fallback Appendix (`blender --background`) |
|---|---|---|---|
| **Minimum Blender version** | **5.1+** (bound to Lab add-on `blender_version_min`) | **3.0+** (community bridge floor) | Matches target `.blend` / file operators (upstream manual) |
| **Host options** | (a) Anthropic Connector OR (b) manual MCP client (`stdio`/HTTP) | Manual MCP client configuration (`uvx mcp-for-blender` / local server) | Terminal, CI runner, shell scripts |
| **Blender-side prerequisite** | Blender Lab MCP add-on installed & enabled inside Blender | Community `addon.py` installed & enabled inside Blender | None (no MCP server or add-on required) |
| **Interactive iteration** | High (live tool inspection & staged updates) | High (community tool schemas vary by version) | Low (stateless batch execution per invocation) |
| **Deterministic batch / CI** | Heavyweight (requires open GUI + add-on socket) | Heavyweight & community-coupled | Ideal (headless reproducible job outline) |
| **Release gate policy** | Preferred official path when Blender 5.1+ available | **Never** ship as primary release recommendation; explicit caveat required | First-class upstream CLI surface (no in-repo evidence file yet) |
| **Single-bridge invariant** | Strictly **1 active MCP bridge** per Blender instance | Strictly **1 active MCP bridge** per Blender instance (watch port `9876` collisions) | Not applicable |

## Caveats & Links
- Review `../../../docs/runtime-stack-strategy.md` for full 2-path + CLI appendix boundaries.
- Review `../../../docs/unofficial-runtime-bridges.md` before accepting Path 2 caveats.

## Related skill
- [SKILL.md](../SKILL.md)
