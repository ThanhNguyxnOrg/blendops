# BlendOps Single-File Fallback (Claude Desktop)

Status: Draft v0 fallback only

> [!IMPORTANT]
> This file is a **fallback only**. It is less complete than the full manual bundle (`SKILL.md` + `references/`). Use this only when your Claude Desktop import/copy path supports one file.

## Condensed skill map (16 skills)

Use these routes:
- unclear next step → `blendops-help`
- vague creative request, intent exploration → `blender-brainstorming` (Superpowers `/brainstorming` analog)
- convert intent → 8-slot 3D brief → `intent-to-3d-brief-writer` (BMad analysis-phase analog)
- per-asset acquisition strategy → `blender-asset-discovery-planner`
- runtime setup prerequisites → `official-runtime-setup-guide`
- runtime preflight/readiness → `official-runtime-readiness-checker`
- MCP bridge conflicts (Path 1 + Path 2 + port 9876) → `runtime-bridge-conflict-resolver`
- scene planning → `product-hero-scene-planner`
- composition/camera planning → `blender-composition-camera-planner`
- lighting/material planning → `blender-lighting-material-planner`
- quality gate decision → `blender-scene-quality-checker`
- output looks wrong, root-cause analysis → `blender-troubleshooting` (Superpowers `/systematic-debugging` analog)
- artifact truth/evidence → `render-export-evidence`
- 7-point gate before any "ready" / `Verified` claim → `pre-handoff-verification` (Superpowers `/verification-before-completion` analog)
- GLB/web handoff framing → `glb-web-handoff`
- plain-language final answer → `non-blender-user-response-writer`

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
2. **Path 2 — Community `ahujasid/blender-mcp`.** Different add-on/server. Mature 21K+ stars third-party, Blender 3.0+.
3. **CLI fallback (appendix).** Direct `blender --background --python`. No MCP. **Publisher has not verified** in this repo.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance.

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
