# Milestone Model (7 Canonical Stages)

Stages describe the logical workflow state of a 3D project — not Git branches or rigid linear files. Always map observed project inventory to the earliest incomplete milestone before recommending the next skill.

| Stage | Core Goal | Required Inventory Before Leaving Stage | Canonical Skills in Stage |
|---|---|---|---|
| **1. Intent & Discovery** | Clarify user goal, audience, and target deliverables in plain language | Confirmed user goal + rough output type (`still` / `video` / `.glb`) | `blendops-help`, `blender-brainstorming`, `intent-to-3d-brief-writer` |
| **2. Fit, Scope & Prerequisites** | Match to existing recipe/pack, lock single primary deliverable, verify licenses & runtime posture | 8-slot brief, recipe fit verdict, clear `asset-license-checker`, pack `GO` verdict | `recipe-fit-assessor`, `scope-guard`, `pack-prerequisite-checker`, `asset-discovery`, `asset-license-checker`, `runtime-path-picker` |
| **3. Scene & Lookdev Planning** | Lock footprint, camera preset, lighting ratio, PBR material tiers, color & render decisions | Complete Scene Plan (`Z = 0`, focal length, light ratios, material tier, `AgX`/`PBR Neutral`) | `product-hero-scene-planner`, `camera-composition`, `lighting-material-plan`, `color-management-decision`, `output-format-decision`, `resolution-aspect-decision`, `cycles-vs-eevee-decision` |
| **4. Quality & Budget Planning** | Set measurable acceptance gates (`P0/P1/P2`), polycount/texture limits, and stop rules | Acceptance checklist + `mobile-glb-budget` / `polycount-budget-checker` thresholds | `acceptance-criteria-builder`, `done-criteria`, `stage-gates`, `polycount-budget-checker`, `mobile-glb-budget` |
| **5. Execution Prep & Runtime** | Verify single-bridge MCP or CLI readiness and execute build/render/export upstream | Observed Blender version, active single bridge (`Path 1`/`Path 2`/`CLI`), `.blend` backup | `runtime-setup`, `runtime-readiness`, `bridge-conflicts`, `path-one-host-outline`, `cli-appendix-job-outline`, `blender-troubleshooting` |
| **6. Evidence & Inspection** | Record raw observed command outputs, renders, `.glb` inspection, and failures honestly | Verified file paths, byte sizes, `gltf-validator` / preview inspection records | `render-export-evidence`, `runtime-attempt-report`, `preview-report`, `scene-readiness`, `material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker` |
| **7. Handoff & Plain Summary** | Package verified web 3D deliverables + stakeholder summary with honest caveats | `pre-handoff-verification` 7-point pass + plain-language report | `glb-web-handoff`, `r3f-component-plan`, `pre-handoff-verification`, `plain-language-response` |

## Inventory Routing Hints
- Brief missing or vague -> hold at **Stage 1** (`intent-to-3d-brief-writer`).
- Plans complete, zero `.blend`/render/`.glb` files on disk -> you are at **Stage 4 -> Stage 5** (`Runtime status: Not Run`, `Artifact status: Not Produced`). Never jump straight to **Stage 7** claiming `Ready`.

## Related skill
[../SKILL.md](../SKILL.md)
