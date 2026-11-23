# Divergence Routing Table

When Phase 3 identifies the first diverging workflow stage, route the proposed fix to the right downstream skill. Each row in this table maps a divergence point to its handoff.

| Divergence at this stage | Symptoms typical of this stage | Route the fix to |
|---|---|---|
| **Intent / brief** — user said one thing, the brief recorded another | Wrong subject, wrong audience, missing deliverable type | `blendops-brief` (re-clarify) → `blendops-brief` (re-lock brief) |
| **Asset plan** — wrong asset strategy, wrong source, license mismatch | Brand restriction violated, generative-when-should-be-procedural, library asset wrong style | `blendops-assets` (re-decide strategy) |
| **Scene plan** — wrong subject placement, wrong scene scope | Hero shoe in corner instead of center, missing required props | `blendops-product-shot` |
| **Composition / camera** — framing wrong | Subject cropped, hero centered when negative space requested, wrong focal length | `blendops-camera` |
| **Lighting / material** — mood wrong, render too dark / too bright | Black render, blown out, no neon, materials look plastic | `blendops-lighting-materials` |
| **Quality gate skipped** — plan never reviewed | Sketchy plan went to execution, fail surfaces only post-render | `blendops-final-check` |
| **Runtime path conflict** — readiness signals inconsistent | Tool surface wrong path, Path 1+2 both installed, port collision | `blendops-connect-blender` |
| **Runtime readiness** — missing add-on, wrong Blender version | Add-on not loaded, Path 1 host on Blender 4.x | `blendops-connect-blender` |
| **Runtime setup** — never set up correctly | No Lab MCP add-on installed, wrong host config | `blendops-connect-blender` |
| **Render / export** — output exists but quality wrong | Render visible but mood off, GLB exists but mis-scaled | `blendops-final-check` |
| **GLB / web handoff** — output OK but handoff caveat missing | GLB ≤ 10MB but no validation notes, no R3F snippet | `blendops-glb-web-handoff` |
| **Final response** — output good but message uses jargon | "BSDF subsurf" leaked into response | `blendops-start` |
| **Pre-handoff verification** — claim upgraded improperly | "Verified" claimed without validation notes | `blendops-final-check` |

## Routing rule

Always route to the **earliest** diverging stage. Do not skip ahead. Fixing a downstream symptom while the upstream root cause remains will create the same symptom again.
