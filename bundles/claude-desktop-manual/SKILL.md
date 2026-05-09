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

## Runtime path policy

Preserve the 2-path + CLI appendix runtime model (replaces older 3-stack and 4-route drafts that mis-described how the Anthropic Connector relates to Blender Lab MCP):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually). Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 tells you to install the Lab add-on inside Blender. The 5.1+ floor applies regardless of host option.
2. **Path 2 — Community `ahujasid/blender-mcp`** (different `addon.py` + server via `uvx blender-mcp`, mature 21K+ stars third-party, Blender 3.0+).
3. **CLI fallback (appendix)** — direct `blender --background --python`, no MCP. **Documented upstream** as a first-class Blender CLI surface; no in-repo evidence file yet.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance.

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
