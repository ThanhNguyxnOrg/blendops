---
name: blendops-claude-desktop-router
description: Claude Desktop-facing BlendOps router skill for planning, runtime readiness, evidence truth, and non-Blender-user outputs using bundled references.
version: 0.1.0-draft
status: draft
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

## Runtime stack policy

Preserve exactly three stacks:
1. Claude Desktop official connector stack.
2. Official Blender CLI fallback.
3. Optional unofficial third-party bridge stack.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

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
