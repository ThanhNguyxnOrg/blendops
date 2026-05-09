

# Reference Runtime

> Setup flow: [External runtime setup](./external-runtime-setup.md). Path model + history of corrections: [Runtime stack strategy](./runtime-stack-strategy.md).

BlendOps uses external runtime primitives and remains a workflow/product layer above runtime execution.

## Runtime path model

BlendOps recognizes **two MCP execution paths** plus a **CLI fallback appendix** (replaces the older 3-stack and 4-route labelings, both of which mis-described how the Anthropic Connector relates to Blender Lab MCP):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server in Blender 5.1+, hosted from either the Anthropic Blender Connector in Claude Desktop, or any other MCP client configured manually).
   - Sources: [claude.com/.../using-the-blender-connector-in-claude](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude), [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/), [projects.blender.org/lab/blender_mcp](https://projects.blender.org/lab/blender_mcp).
   - Verification: read-only smoke test 2026-04-29 records `get_blendfile_summary_*` + `get_objects_summary` (Lab tool surface) — consistent with Anthropic Connector host. Mutation/render/export not attempted.
   - Anthropic Connector and Lab MCP are **not independent products**: the Connector is a Claude-Desktop-specific host for the Lab stack and **requires the Lab add-on inside Blender**.

2. **Path 2 — Community `ahujasid/blender-mcp`** (different `addon.py` + server via `uvx blender-mcp`, Blender 3.0+, third-party from both Anthropic and Blender Foundation).
   - Source: https://github.com/ahujasid/blender-mcp.
   - Verification: user-reported verified 2026-05-08; no formal evidence file with Path 2 tool names yet.
   - Caveats: [Unofficial runtime bridges](./unofficial-runtime-bridges.md).

3. **CLI fallback (appendix)** — direct `blender --background --python`, no MCP. **Documented upstream** as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.
   - Source: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html.
   - Verification: `Not Run`.

## Important interface boundary

BlendOps does not treat runtime internals as user-facing product behavior. Focus: intent normalization, workflow constraints, validation gates, artifact/handoff clarity.

## Setup authority

Follow [External runtime setup](./external-runtime-setup.md) and upstream Anthropic + Blender Lab + `ahujasid` READMEs for exact/current install steps.

## Single-bridge constraint

One MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance. Within Path 1, do not run the Anthropic Connector host and a manual MCP host both pointed at the same Blender instance.
