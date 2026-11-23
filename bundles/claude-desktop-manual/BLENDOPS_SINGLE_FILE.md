# BlendOps Single-File Fallback (Claude Desktop)

Status: 1.0.0 fallback only

> [!IMPORTANT]
> This file is a **fallback only**. It is less complete than the full manual bundle (`SKILL.md` + `references/`). Use this only when your Claude Desktop import/copy path supports one file.

## Condensed skill map (baseline 16 — full inventory: 14 skills)

The routes below cover the canonical baseline workflow (full inventory: **14 skills** = 16 core + 32 specialized across web 3D handoff deep, quality validators, domain scene planners, process discipline, asset/sourcing, color/format/output decisions, recipe/pack ops, runtime path discipline). For the full inventory, switch to the multi-file bundle (`bundles/claude-desktop-manual/references/skills/*.md`) or browse `skills/README.md` upstream. When in doubt, route to `blendops-start`.

Baseline routes:
- unclear next step → `blendops-start`
- vague creative request, intent exploration → `blendops-brief` (Superpowers `/brainstorming` analog)
- convert intent → 8-slot 3D brief → `blendops-brief` (BMad analysis-phase analog)
- per-asset acquisition strategy → `blendops-assets`
- runtime setup prerequisites → `blendops-connect-blender`
- runtime preflight/readiness → `blendops-connect-blender`
- MCP bridge conflicts (Path 1 + Path 2 + port 9876) → `blendops-connect-blender`
- scene planning → `blendops-product-shot`
- composition/camera planning → `blendops-camera`
- lighting/material planning → `blendops-lighting-materials`
- quality gate decision → `blendops-final-check`
- output looks wrong, root-cause analysis → `blendops-fix-problems` (Superpowers `/systematic-debugging` analog)
- artifact truth/evidence → `blendops-final-check`
- 7-point gate before any "ready" / `Verified` claim → `blendops-final-check` (Superpowers `/verification-before-completion` analog)
- GLB/web handoff framing → `blendops-glb-web-handoff`
- plain-language final answer → `blendops-start`

Expansion routes (load via the multi-file bundle for full SKILL.md content):
- recipe/pack fit → `blendops-brief`; pre-flight → `blendops-done-criteria`; resume routing → `blendops-start`; acceptance criteria → `blendops-done-criteria`
- runtime path discipline: `blendops-connect-blender`, `blendops-final-check`
- web 3D deep: `blendops-glb-budget`, `blendops-glb-web-handoff`, `blendops-final-check`
- quality validators: `blendops-lighting-materials`, `blendops-camera`, `blendops-glb-budget`
- domain scene planners: `blendops-scene-plan`, `blendops-product-shot`
- process discipline: `blendops-done-criteria`, `blendops-brief`
- asset/sourcing: `blendops-assets`
- color/format/output: `blendops-lighting-materials`, `blendops-render-settings`, `blendops-camera`, `blendops-render-settings`

## Runtime boundary

Skill guidance is not runtime setup.

Do not claim this file:
- installs Blender,
- configures Claude Desktop Connector,
- configures official Blender MCP bridge/add-on,
- runs Blender/runtime eval,
- produces preview/render/GLB artifacts.

## Runtime paths

1. **Path 1 — Official Blender Lab MCP.** Lab MCP add-on + Lab MCP server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually. Anthropic Connector is **not** standalone — Lab add-on inside Blender is required either way.
2. **Path 2 — Community `mcp-for-blender` (formerly `blender-mcp`).** Different add-on/server. Mature third-party, Blender 3.0+.
3. **CLI fallback (appendix).** Direct `blender --background --python`. No MCP. **Documented upstream** as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md).

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance on `localhost:9876` (side-by-side on separate instances via per-instance `--port 9877` is supported upstream).

## Evidence rules

Use explicit states:
- Runtime: `Not Run | Attempted | Produced | Verified | Failed`
- Artifact: `Not Produced | Produced | Verified | Failed`

No preview/render/GLB claim without evidence.

## Condensed output template

```md
## BlendOps fallback response

- Route:
- Runtime status:
- Artifact status:
- Evidence:
- Caveats:
- Next action:
```
