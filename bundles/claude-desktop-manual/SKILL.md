---
name: blendops-claude-desktop-router
description: Claude Desktop-facing BlendOps router skill for planning, runtime readiness, evidence truth, and non-Blender-user outputs using bundled references.
---

# BlendOps Claude Desktop Router Skill

## Purpose

Provide one main Claude Desktop-facing skill entrypoint that routes to the correct BlendOps reference summary while preserving runtime/artifact truth.

## How to use this router

1. Classify user intent (help/routing, planning, runtime readiness, evidence, handoff, communication).
2. Consult `references/skill-map.md` to choose the relevant subskill summary.
3. Apply law summaries from `references/laws/` before final output.
4. Keep runtime/artifact states explicit.

## Reference-first routing

Use these references as needed:
- skill routing: `references/skill-map.md`
- runtime stacks: `references/runtime-stacks.md`
- evidence policy: `references/evidence-rules.md`
- install/runtime boundary: `references/install-boundary.md`
- concise subskill summaries: `references/skills/*.md`
- concise law summaries: `references/laws/*.md`
- pack summary: `references/packs/product-hero-v0.md`

Do not duplicate all subskills in this router. Route and apply the relevant reference file(s).

## Runtime and artifact truth

Always state:
- Runtime status: `Not Run | Attempted | Produced | Verified | Failed`
- Artifact status: `Not Produced | Produced | Verified | Failed`

Do not claim preview/render/GLB artifacts without evidence.

## Runtime route policy

Preserve the 4-route runtime model (replaces the older 3-stack labeling that conflated three different products into one stack):
1. Route A — Anthropic Blender Connector (one-click in Claude Desktop, Blender 4.2+).
2. Route B — Blender Foundation MCP Server (`bpype/blender_mcp`, manual install, Blender **5.1+**).
3. Route C — Community Blender MCP (`ahujasid/blender-mcp`, mature 21K+ stars third-party, Blender 3.0+).
4. Route D — Official Blender CLI (no MCP, deterministic fallback).

The Blender 5.1+ requirement applies only to Route B. Single-client constraint: Blender accepts one MCP client per session.

## Output template

```md
## BlendOps response

- Chosen route:
- References consulted:
- Runtime status:
- Artifact status:
- Evidence used:
- Caveats:
- Next safe action:
```
