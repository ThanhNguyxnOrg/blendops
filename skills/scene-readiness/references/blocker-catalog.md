# Blocker Catalog

## Purpose
Classify common blockers encountered during `scene-readiness` checks so every `Not Ready` or `Not Run` verdict pairs an exact root cause with one actionable fix instead of a vague failure message.

## When to use
- Whenever `scene-readiness` halts handoff due to incomplete planning inputs, missing runtime verification, broken scene checks, or failed budget gates.

## Blocker Taxonomy

| Blocker Class | Typical Evidence / Symptoms | Impact on Handoff | Next Remediation Skill / Action |
|---|---|---|---|
| **Missing Planning Sections** | Scene plan lacks camera lens, floor height (`Z = 0`), lighting key/fill ratio, or material roughness/albedo bounds | Downstream Blender build or render would guess dimensions/mood | `product-hero-scene-planner` / `camera-composition` / `lighting-material-plan` |
| **Runtime Not Run / Disconnected** | Planning docs exist, but no MCP/CLI execution occurred or Blender Lab MCP server refused connection | No preview image or `.glb` exists (`Artifact status: Not Produced`) | `runtime-readiness` (or `runtime-attempt-report` if an execution failed) |
| **Unresolved Geometry / UV Failure** | Non-manifold edges, inverted normals, missing `Z = 0` grounding, or `texel density` spread `> 1.3x` / unapplied scale (`scale != 1`) | Broken shading in Cycles/EEVEE and distorted textures in web `.glb` | `polycount-budget-checker` / `blender-troubleshooting` |
| **Web Budget or Validator Failure** | `.glb` exceeds `mobile-glb-budget` (`> 50k` tris / `> 10 MB`), drops procedural Blender nodes, or throws `gltf-validator` errors | Fails browser load time or breaks Three.js / R3F rendering | `glb-web-handoff` / `web-material-simplification.md` |
| **Simulation / Bake Cache Unbaked** | Cloth, hair, fluid, or procedural shader nodes left unbaked (`bake` not set to `ALL` or procedural maps not baked to textures) | Final render or glTF export collapses back to frame 1 / blank white material | `scene-readiness` bake gate -> bake before export |
| **Unlicensed External Asset** | Commercial project uses mesh/HDRI/texture without confirmed `CC0`/`CC-BY` or commercial license | Legal release risk | `asset-license-checker` |

## Rule
- Never emit `"Blocked"` without naming **(1) Blocker Class**, **(2) Observed Impact**, and **(3) Exact Next Step**.

## Related skill
[../SKILL.md](../SKILL.md)
