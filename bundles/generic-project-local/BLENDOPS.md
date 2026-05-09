# BLENDOPS

Status: Draft v0 project-local instruction fixture  
Target: generic-project

Use BlendOps as project-local workflow guidance for Blender planning, readiness, evidence, and handoff.

## Load as guidance

Reference the canonical BlendOps sources from the repository copy or attached project files:

- `docs/ai-agent-install-flow.md`
- `docs/install/generic-project.md`
- `docs/skill-system.md`
- `docs/runtime-stack-strategy.md`
- `skills/README.md`
- `laws/README.md`
- `packs/README.md`
- `packs/product-hero-v0/PACK.md`

Do not duplicate the whole BlendOps repository into the target project unless the user explicitly asks and rollback is documented.

## Runtime path boundaries

Preserve the **2 MCP execution paths + CLI fallback appendix** model (see `docs/runtime-stack-strategy.md`):

1. **Path 1 — Official Blender Lab MCP.** Lab MCP add-on + Lab MCP server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually. Anthropic Connector is **not** standalone — Lab add-on inside Blender is required either way.
2. **Path 2 — Community `ahujasid/blender-mcp`.** Different add-on/server. Mature 21K+ stars third-party, Blender 3.0+.
3. **CLI fallback (appendix).** Direct `blender --background --python`. No MCP. **Documented upstream** as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance.

## Evidence states

Use these states consistently:

- `Not Run`
- `Attempted`
- `Produced`
- `Verified`
- `Failed`

Do not claim preview/render/GLB artifacts without evidence. A valid artifact claim needs output path or visible evidence plus validation notes.

## Preferred flow

1. Plan the workflow.
2. Check runtime readiness.
3. Record evidence state.
4. Validate or downgrade claims.
5. Explain status in non-Blender-user language.

## Runtime boundary

Runtime setup is separate from skill install. This project-local instruction file does not install Blender, configure connector/MCP, run runtime eval, render, export GLB, or create artifacts.

Default status after install:

- Runtime status: `Not Run`
- Artifact status: `Not Produced`
