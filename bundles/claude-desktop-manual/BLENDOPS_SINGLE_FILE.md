# BlendOps Single-File Fallback (Claude Desktop)

Status: Draft v0 fallback only

> [!IMPORTANT]
> This file is a **fallback only**. It is less complete than the full manual bundle (`SKILL.md` + `references/`). Use this only when your Claude Desktop import/copy path supports one file.

## Condensed skill map

Use these routes:
- unclear next step → `blendops-help`
- scene planning → `product-hero-scene-planner`
- runtime preflight/readiness → `official-runtime-readiness-checker`
- artifact truth/evidence → `render-export-evidence`
- GLB/web handoff framing → `glb-web-handoff`
- composition/camera planning → `blender-composition-camera-planner`
- lighting/material planning → `blender-lighting-material-planner`
- quality gate decision → `blender-scene-quality-checker`
- plain-language final answer → `non-blender-user-response-writer`

## Runtime boundary

Skill guidance is not runtime setup.

Do not claim this file:
- installs Blender,
- configures Claude Desktop Connector,
- configures official Blender MCP bridge/add-on,
- runs Blender/runtime eval,
- produces preview/render/GLB artifacts.

## Runtime stacks

1. Claude Desktop official connector stack.
2. Official Blender CLI fallback.
3. Optional unofficial third-party bridge stack.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and not a supported BlendOps route.

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
