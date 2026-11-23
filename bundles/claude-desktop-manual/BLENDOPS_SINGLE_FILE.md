# BlendOps Single-File Fallback (Claude Desktop)

Status: 1.0.0 fallback only

> [!IMPORTANT]
> This file is a **fallback only**. It is less complete than the full manual bundle (`SKILL.md` + `references/`). Use this only when your Claude Desktop import/copy path supports one file.

## Condensed skill map (baseline 16 — full inventory: 14 skills)

The routes below cover the canonical baseline workflow (full inventory: **14 skills** = 16 core + 32 specialized across web 3D handoff deep, quality validators, domain scene planners, process discipline, asset/sourcing, color/format/output decisions, recipe/pack ops, runtime path discipline). For the full inventory, switch to the multi-file bundle (`bundles/claude-desktop-manual/references/skills/*.md`) or browse `skills/README.md` upstream. When in doubt, route to `using-blendops`.

Baseline routes:
- unclear next step → `using-blendops`
- vague creative request, intent exploration → `scoping-3d-briefs` (Superpowers `/brainstorming` analog)
- convert intent → 8-slot 3D brief → `scoping-3d-briefs` (BMad analysis-phase analog)
- per-asset acquisition strategy → `sourcing-assets`
- runtime setup prerequisites → `setting-up-blender-runtime`
- runtime preflight/readiness → `setting-up-blender-runtime`
- MCP bridge conflicts (Path 1 + Path 2 + port 9876) → `setting-up-blender-runtime`
- scene planning → `planning-product-scenes`
- composition/camera planning → `planning-camera-and-framing`
- lighting/material planning → `planning-lighting-and-materials`
- quality gate decision → `verifying-before-handoff`
- output looks wrong, root-cause analysis → `troubleshooting-blender-output` (Superpowers `/systematic-debugging` analog)
- artifact truth/evidence → `verifying-before-handoff`
- 7-point gate before any "ready" / `Verified` claim → `verifying-before-handoff` (Superpowers `/verification-before-completion` analog)
- GLB/web handoff framing → `handing-off-glb-to-web`
- plain-language final answer → `using-blendops`

Expansion routes (load via the multi-file bundle for full SKILL.md content):
- recipe/pack fit → `scoping-3d-briefs`; pre-flight → `defining-done-and-gates`; resume routing → `using-blendops`; acceptance criteria → `defining-done-and-gates`
- runtime path discipline: `setting-up-blender-runtime`, `setting-up-blender-runtime`, `setting-up-blender-runtime`, `verifying-before-handoff`
- web 3D deep: `budgeting-glb-for-web`, `handing-off-glb-to-web`, `handing-off-glb-to-web`, `verifying-before-handoff`
- quality validators: `planning-lighting-and-materials`, `planning-lighting-and-materials`, `planning-camera-and-framing`, `budgeting-glb-for-web`
- domain scene planners: `planning-scenes`, `planning-scenes`, `planning-scenes`, `planning-product-scenes`
- process discipline: `defining-done-and-gates`, `defining-done-and-gates`, `defining-done-and-gates`, `scoping-3d-briefs`
- asset/sourcing: `sourcing-assets`, `sourcing-assets`, `sourcing-assets`, `sourcing-assets`
- color/format/output: `planning-lighting-and-materials`, `choosing-render-and-output`, `planning-camera-and-framing`, `choosing-render-and-output`

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
