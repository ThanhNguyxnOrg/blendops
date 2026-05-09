# BlendOps Single-File Fallback (Claude Desktop)

Status: Draft v0 fallback only

> [!IMPORTANT]
> This file is a **fallback only**. It is less complete than the full manual bundle (`SKILL.md` + `references/`). Use this only when your Claude Desktop import/copy path supports one file.

## Condensed skill map (baseline 16 — full inventory: 48 skills)

The 16 routes below cover the canonical baseline workflow. The repo now ships **48 skills** (16 baseline + 32 expansion across Batches 1–8: web 3D handoff deep, quality validators, domain scene planners, process discipline, asset/sourcing, color/format/output decisions, recipe/pack ops, runtime path discipline). For the full inventory, switch to the multi-file bundle (`bundles/claude-desktop-manual/references/skills/*.md`) or browse `skills/README.md` upstream. When in doubt, route to `blendops-help`.

Baseline routes:
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

Expansion routes (load via the multi-file bundle for full SKILL.md content):
- recipe/pack fit → `recipe-fit-assessor`; pre-flight → `pack-prerequisite-checker`; resume routing → `workflow-stage-router`; acceptance criteria → `acceptance-criteria-builder`
- runtime path discipline: `runtime-path-picker`, `path-one-host-outline`, `cli-appendix-job-outline`, `runtime-attempt-report-writer`
- web 3D deep: `glb-mobile-performance-budget`, `glb-animation-handoff`, `three-fiber-component-shape-planner`, `preview-report-template-writer`
- quality validators: `material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, `polycount-budget-checker`
- domain scene planners: `character-portrait-scene-planner`, `environment-establishing-shot-planner`, `interior-architectural-scene-planner`, `product-grid-scene-planner`
- process discipline: `blender-checklist-driven-workflow`, `blender-stop-condition-decider`, `blender-scope-boundary-enforcer`, `blender-recipe-decomposer`
- asset/sourcing: `asset-license-checker`, `asset-style-consistency-checker`, `asset-fallback-strategy`, `asset-library-organization-planner`
- color/format/output: `color-management-decision`, `output-format-decision`, `resolution-aspect-decision`, `cycles-vs-eevee-decision`

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
3. **CLI fallback (appendix).** Direct `blender --background --python`. No MCP. **Documented upstream** as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

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
