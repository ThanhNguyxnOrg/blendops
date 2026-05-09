---
name: blendops
description: Blender skills pack for non-Blender users. Use for scene planning, runtime readiness, render/export/GLB evidence, Claude Connect guidance, and plain-language handoff across multiple AI agents.
---

# BlendOps

Use this skill as the control plane for BlendOps workflow planning, runtime readiness, artifact evidence, and non-Blender-user explanations.

## Route by intent

Consult `references/skill-map.md` first, then load only the relevant flattened reference files:

- planning: product hero scene, composition/camera, lighting/material
- readiness: official runtime readiness and stack boundaries
- evidence: render/export/GLB truth labels
- handoff: GLB/web and plain-language summaries
- install/help: skill import, runtime boundary, and next safe action

## Non-negotiable truth rules

- Skill import is not runtime setup.
- Anthropic Blender Connector is not standalone — Anthropic's tutorial step 2 tells you to install the Blender Lab MCP add-on inside Blender. Path 1 always needs that Lab add-on (Blender 5.1+) regardless of host.
- Path 2 (community `ahujasid/blender-mcp`) is mature 21K+ stars third-party. Different add-on/server.
- CLI fallback (appendix) is direct Blender CLI; documented upstream as first-class Blender CLI, no in-repo evidence file yet.
- Run a read-only smoke test before any mutation, render, export, or runtime eval.
- Do not claim preview/render/GLB artifacts without evidence.

## Evidence states

Use: `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`.

Default after skill import:

- Runtime status: `Not Run`
- Artifact status: `Not Produced`

## Concise status block

```md
## BlendOps status

- Route:
- References used:
- Runtime status:
- Artifact status:
- Evidence:
- Caveats:
- Next safe action:
```
