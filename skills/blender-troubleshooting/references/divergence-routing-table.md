# Divergence Routing Table

When Phase 3 identifies the first diverging workflow stage, route the proposed fix to the right downstream skill. Each row in this table maps a divergence point to its handoff.

| Divergence at this stage | Symptoms typical of this stage | Route the fix to |
|---|---|---|
| **Intent / brief** — user said one thing, the brief recorded another | Wrong subject, wrong audience, missing deliverable type | `blender-brainstorming` (re-clarify) → `intent-to-3d-brief-writer` (re-lock brief) |
| **Asset plan** — wrong asset strategy, wrong source, license mismatch | Brand restriction violated, generative-when-should-be-procedural, library asset wrong style | `asset-discovery` (re-decide strategy) |
| **Scene plan** — wrong subject placement, wrong scene scope | Hero shoe in corner instead of center, missing required props | `product-hero-scene-planner` |
| **Composition / camera** — framing wrong | Subject cropped, hero centered when negative space requested, wrong focal length | `camera-composition` |
| **Lighting / material** — mood wrong, render too dark / too bright | Black render, blown out, no neon, materials look plastic | `lighting-material-plan` |
| **Quality gate skipped** — plan never reviewed | Sketchy plan went to execution, fail surfaces only post-render | `scene-readiness` |
| **Runtime path conflict** — readiness signals inconsistent | Tool surface wrong path, Path 1+2 both installed, port collision | `bridge-conflicts` |
| **Runtime readiness** — missing add-on, wrong Blender version | Add-on not loaded, Path 1 host on Blender 4.x | `runtime-readiness` |
| **Runtime setup** — never set up correctly | No Lab MCP add-on installed, wrong host config | `runtime-setup` |
| **Render / export** — output exists but quality wrong | Render visible but mood off, GLB exists but mis-scaled | `render-export-evidence` |
| **GLB / web handoff** — output OK but handoff caveat missing | GLB ≤ 10MB but no validation notes, no R3F snippet | `glb-web-handoff` |
| **Final response** — output good but message uses jargon | "BSDF subsurf" leaked into response | `plain-language-response` |
| **Pre-handoff verification** — claim upgraded improperly | "Verified" claimed without validation notes | `pre-handoff-verification` |

## Routing rule

Always route to the **earliest** diverging stage. Do not skip ahead. Fixing a downstream symptom while the upstream root cause remains will create the same symptom again.
