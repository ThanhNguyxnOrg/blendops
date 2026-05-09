# Skill Map (Claude Desktop Manual BlendOps Bundle)

This map lists canonical BlendOps subskills and when to use each.

These are **reference summaries inside one Claude Desktop BlendOps skill bundle**. They are not separate installed Claude Personal Skills unless a user manually splits them.

| Canonical subskill | Use when | Reference summary |
|---|---|---|
| `blendops-help` | next step is unclear, routing needed | `skills/blendops-help.md` |
| `blender-brainstorming` | vague creative request, intent exploration before brief | `skills/blender-brainstorming.md` |
| `intent-to-3d-brief-writer` | convert confirmed intent into 8-slot brief | `skills/intent-to-3d-brief-writer.md` |
| `blender-asset-discovery-planner` | per-asset strategy (procedural / library / generative / photogrammetry) before scene plan | `skills/blender-asset-discovery-planner.md` |
| `official-runtime-setup-guide` | choosing/setting up runtime prerequisites | `skills/official-runtime-setup-guide.md` |
| `official-runtime-readiness-checker` | runtime preflight/readiness decision | `skills/official-runtime-readiness-checker.md` |
| `runtime-bridge-conflict-resolver` | Single-bridge constraint conflicts (Path 1 + Path 2 + port 9876) | `skills/runtime-bridge-conflict-resolver.md` |
| `product-hero-scene-planner` | generating scene plan/spec | `skills/product-hero-scene-planner.md` |
| `blender-composition-camera-planner` | composition/camera strategy | `skills/blender-composition-camera-planner.md` |
| `blender-lighting-material-planner` | lighting/material/lookdev planning | `skills/blender-lighting-material-planner.md` |
| `blender-scene-quality-checker` | pass/warn/fail quality gate | `skills/blender-scene-quality-checker.md` |
| `blender-troubleshooting` | output looks wrong, 4-phase root-cause analysis | `skills/blender-troubleshooting.md` |
| `render-export-evidence` | proving/downgrading render/export claims | `skills/render-export-evidence.md` |
| `pre-handoff-verification` | 7-point gate before any "ready" / `Verified` claim | `skills/pre-handoff-verification.md` |
| `glb-web-handoff` | web handoff framing and caveats | `skills/glb-web-handoff.md` |
| `non-blender-user-response-writer` | plain-language final response | `skills/non-blender-user-response-writer.md` |
| `recipe-fit-assessor` | choose recipe/pack fit before locking brief | `skills/recipe-fit-assessor.md` |
| `pack-prerequisite-checker` | GO/NO-GO pre-flight for pack workflows | `skills/pack-prerequisite-checker.md` |
| `workflow-stage-router` | resume / pick next narrow skill from artifact state | `skills/workflow-stage-router.md` |
| `acceptance-criteria-builder` | definition-of-done checklist with evidence hooks | `skills/acceptance-criteria-builder.md` |
| `runtime-path-picker` | Path 1 vs Path 2 vs CLI appendix choice | `skills/runtime-path-picker.md` |
| `path-one-host-outline` | Path 1 Connector vs manual MCP host ordering | `skills/path-one-host-outline.md` |
| `cli-appendix-job-outline` | headless batch job outline when MCP is wrong | `skills/cli-appendix-job-outline.md` |
| `runtime-attempt-report-writer` | truth-label attempt report after runtime tries | `skills/runtime-attempt-report-writer.md` |

Additional expansion skills (web 3D deep, quality validators, domain planners, process discipline, asset/sourcing, color/format/output) live under `skills/*.md` in this bundle; see repo `skills/README.md` for the full inventory table.

Always apply law summaries in `../laws/` and runtime/evidence boundaries before final output.
