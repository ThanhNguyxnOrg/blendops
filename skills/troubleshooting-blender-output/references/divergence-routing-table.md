# Divergence Routing Table

When Phase 3 identifies the first diverging workflow stage, route the proposed fix to the right downstream skill. Each row in this table maps a divergence point to its handoff.

| Divergence at this stage | Symptoms typical of this stage | Route the fix to |
|---|---|---|
| **Intent / brief** — user said one thing, the brief recorded another | Wrong subject, wrong audience, missing deliverable type | `scoping-3d-briefs` (re-clarify) → `scoping-3d-briefs` (re-lock brief) |
| **Asset plan** — wrong asset strategy, wrong source, license mismatch | Brand restriction violated, generative-when-should-be-procedural, library asset wrong style | `sourcing-assets` (re-decide strategy) |
| **Scene plan** — wrong subject placement, wrong scene scope | Hero shoe in corner instead of center, missing required props | `planning-product-scenes` |
| **Composition / camera** — framing wrong | Subject cropped, hero centered when negative space requested, wrong focal length | `planning-camera-and-framing` |
| **Lighting / material** — mood wrong, render too dark / too bright | Black render, blown out, no neon, materials look plastic | `planning-lighting-and-materials` |
| **Quality gate skipped** — plan never reviewed | Sketchy plan went to execution, fail surfaces only post-render | `verifying-before-handoff` |
| **Runtime path conflict** — readiness signals inconsistent | Tool surface wrong path, Path 1+2 both installed, port collision | `setting-up-blender-runtime` |
| **Runtime readiness** — missing add-on, wrong Blender version | Add-on not loaded, Path 1 host on Blender 4.x | `setting-up-blender-runtime` |
| **Runtime setup** — never set up correctly | No Lab MCP add-on installed, wrong host config | `setting-up-blender-runtime` |
| **Render / export** — output exists but quality wrong | Render visible but mood off, GLB exists but mis-scaled | `verifying-before-handoff` |
| **GLB / web handoff** — output OK but handoff caveat missing | GLB ≤ 10MB but no validation notes, no R3F snippet | `handing-off-glb-to-web` |
| **Final response** — output good but message uses jargon | "BSDF subsurf" leaked into response | `using-blendops` |
| **Pre-handoff verification** — claim upgraded improperly | "Verified" claimed without validation notes | `verifying-before-handoff` |

## Routing rule

Always route to the **earliest** diverging stage. Do not skip ahead. Fixing a downstream symptom while the upstream root cause remains will create the same symptom again.
