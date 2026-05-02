---
name: blendops
description: Use for BlendOps, Blender scene planning, runtime/eval readiness, render/export evidence, Claude Desktop connector guidance, install/runtime boundary help, product hero scene planning, and non-Blender-user explanations.
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
- Claude Desktop Connector setup is separate.
- Official Blender MCP bridge/add-on setup is separate.
- Run a read-only smoke test before any mutation, render, export, or runtime eval.
- Do not claim preview/render/GLB artifacts without evidence.
- Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not a supported BlendOps route.

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
