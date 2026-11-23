---
name: planning-product-scenes
description: Plan product scenes. Use when the brief is a single-product hero shot or a multi-product grid, lineup, or catalog layout.
---

# planning-product-scenes

## Purpose

Plan single-product hero shots and multi-product grid or catalog scenes, including staging, camera, lighting, and output targets.

This skill merges `product-hero-scene-planner`, `product-grid-scene-planner` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- The brief is a single hero product shot.
- The brief is a grid, lineup, or catalog of several products.
- A product scene needs staging, camera, and lighting plans tied together.

## When not to use
<!-- blendops:generated:start exclusions -->
- to execute Blender commands, write Python, or claim generated artifacts → use `../scoping-3d-briefs/SKILL.md` (Delegates out-of-scope requests to scoping-3d-briefs)
- to skip unresolved critical ambiguity or hide missing inputs → use `../planning-camera-and-framing/SKILL.md` (Delegates out-of-scope requests to planning-camera-and-framing)
- when raw user intent still needs initial brief normalization → use `../scoping-3d-briefs/SKILL.md` (use scoping-3d-briefs first)
- when deep-diving camera/framing mechanics → use `../planning-camera-and-framing/SKILL.md` (use planning-lighting-and-materials)
- when writing measurable pass/fail acceptance tables → use `../defining-done-and-gates/SKILL.md` (use verifying-before-handoff)
- character portrait → use `../planning-scenes/SKILL.md` (use planning-scenes)
- outdoor environment scene → use `../planning-scenes/SKILL.md` (use planning-scenes)
- interior room scene → use `../planning-scenes/SKILL.md` (use planning-scenes)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "plan a product hero scene"
- "turn this into a Blender plan"
- "prepare cyberpunk shoe scene plan"
- "grid of products"
- "lineup of"
- "catalog showing N items"
- "comparison render"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- Runtime state is one of `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`; artifacts default to `Not Produced`.
- Runtime install is separate from skill install; check readiness with `setting-up-blender-runtime` before any runtime step.

## Required laws

- [`../../laws/official-runtime-only.md`](../../laws/official-runtime-only.md)
- [`../../laws/evidence-before-done.md`](../../laws/evidence-before-done.md)
- [`../../laws/non-blender-user-language.md`](../../laws/non-blender-user-language.md)
- [`../../laws/no-arbitrary-python-interface.md`](../../laws/no-arbitrary-python-interface.md)

## Official runtime boundary

BlendOps runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix** (replaces older 3-stack and 4-route drafts — see `../../docs/runtime-stack-strategy.md` for the corrected attribution history):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually). Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 tells you to install the Lab add-on inside Blender.
2. **Path 2 — Community `mcp-for-blender` (formerly `blender-mcp`)** (different `addon.py` + server via `uvx mcp-for-blender`, mature third-party, Blender 3.0+).
3. **CLI fallback (appendix)** — direct `blender --background --python`, no MCP. **Documented upstream** as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md).

Blender 5.1+ floor applies to all of Path 1 (whichever host). Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance.

This skill must not install Blender, run Blender, configure a runtime bridge, mutate a scene, render, export GLB, or claim artifacts unless the user explicitly requested that work and evidence exists.

## Runtime route requirements

| Path | Requirement before use |
|---|---|
| Path 1 (Blender-side, always required) | Blender 5.1+ + Lab MCP add-on installed in Blender + Lab MCP server (`.mcpb` bundle or source) reachable. |
| Path 1, host (a) Anthropic Connector | Connector enabled in Claude Desktop → Customize → Connectors; read-only request first. |
| Path 1, host (b) manual MCP client | Lab MCP server registered in client's `mcpServers` JSON or equivalent UI; read-only request first. |
| Path 2 (community `mcp-for-blender` (formerly `blender-mcp`)) | `uvx mcp-for-blender` registered in client config + `addon.py` installed/enabled in Blender 3.0+; read `../../docs/unofficial-runtime-bridges.md` first; explicit user opt-in for `execute_blender_code` (no sandbox). |
| CLI fallback (appendix) | Exact Blender executable/CLI command, input/script, output paths, logs, validation evidence; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md) as an example, not as evidence of the current run. |

## Decision tree

- One product, one hero image → [hero planner](references/product-hero-scene-planner.md).
- Several products or SKU variants in one layout → [grid planner](references/product-grid-scene-planner.md).
- Framing details → `planning-camera-and-framing`; lighting and materials → `planning-lighting-and-materials`.

## Playbooks

- [product-hero-scene-planner](references/product-hero-scene-planner.md) — Plan a single-product hero shot.
- [product-grid-scene-planner](references/product-grid-scene-planner.md) — Plan a grid or catalog layout with consistent spacing and lighting.

## Mode handling

### Text-only mode
Plan and advise only. Runtime stays `Not Run` and artifacts stay `Not Produced`.

### Runtime-ready mode
Readiness has passed. Runtime work happens only when the user asked for it; record evidence for every state you report.

### Blocked runtime mode
Keep planning. Report the blocker in plain language and never upgrade truth states.

## Validation checklist

- [ ] The branch chosen matches the user's goal and current stage.
- [ ] Only the needed reference file was loaded.
- [ ] Runtime and artifact states are explicit and backed by evidence.
- [ ] Next step names exactly one skill, doc, or action.
- [ ] The reply avoids unexplained Blender jargon and does not hand the user Python.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Output satisfies scope, evidence state is explicit, and no overclaim appears. |
| Warn | Output is useful but has missing inputs, partial evidence, or scoped uncertainty. |
| Fail | Output claims unsupported runtime/artifact success, ignores laws, or routes to an unsupported path. |

## Failure handling

- Missing inputs: ask for them, or proceed with labelled assumptions and a Warn verdict.
- Missing evidence: keep or downgrade truth states; never upgrade.
- Wrong skill: hand off through the cross-skill handoff list below.

## Troubleshooting

- If output looks wrong after a runtime step, hand off to `troubleshooting-blender-output`.
- If the runtime path is unclear or failing, hand off to `setting-up-blender-runtime`.

## Best practices

- One next step per reply.
- Cite evidence paths for every Produced or Verified claim.
- Explain unavoidable Blender terms in a few words.

## Good examples

Watch hero shot → staging, three-quarter camera, soft key light, 1:1 output, gates listed, Artifact: Not Produced.

## Bad examples

Planning 12 products with independent lighting so the grid looks inconsistent. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: product-hero-and-product-grid-scene-planner
Status: <Pass/Warn/Fail or scoped status>
Runtime: <state>
Artifacts: <state>
Evidence: <paths/links/logs or none>
Next safe action: <skill/doc/action>
Limitations: <gaps>
```

## Anti-patterns

- Claiming render, export, or GLB results without evidence.
- Recommending "paste this Python" as the user's fix.
- Describing Anthropic Connector as standalone.
- Loading every reference file instead of the one the step needs.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [upstream_reference] Upstream input (if raw prompt needs structuring) → `../scoping-3d-briefs/SKILL.md`
- [progression] Next (deep-dive framing & camera) → `../planning-camera-and-framing/SKILL.md`
- [progression] Next (deep-dive lookdev & lighting) → `../planning-lighting-and-materials/SKILL.md`
- [fallback] Then (measurable pass/fail rows) → `../defining-done-and-gates/SKILL.md`
- [upstream_reference] Then (pin done condition) → `../defining-done-and-gates/SKILL.md`
- [progression] Later (post-build readiness review) → `../verifying-before-handoff/SKILL.md`
- [conditional] Delivery handoff (when web/render output is targeted) (handing-off-glb-to-web) → `../handing-off-glb-to-web/SKILL.md`
- [conditional] Delivery handoff (when web/render output is targeted) (verifying-before-handoff) → `../verifying-before-handoff/SKILL.md`
- [upstream_reference] Asset discovery → `../sourcing-assets/SKILL.md`
- [progression] Variant / SKU file output format → `../choosing-render-and-output/SKILL.md`
- [progression] Composition validation → `../planning-camera-and-framing/SKILL.md`
- [progression] Lighting validation → `../planning-lighting-and-materials/SKILL.md`
- [progression] Material validation → `../planning-lighting-and-materials/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [clarification-patterns.md](references/clarification-patterns.md)
- [cyberpunk-shoe-example.md](references/cyberpunk-shoe-example.md)
- [grid-consistency-rules.md](references/grid-consistency-rules.md)
- [grid-layout-rules.md](references/grid-layout-rules.md)
- [grid-output-naming-rules.md](references/grid-output-naming-rules.md)
- [product-grid-scene-planner.md](references/product-grid-scene-planner.md)
- [product-hero-playbooks.md](references/product-hero-playbooks.md)
- [product-hero-scene-planner.md](references/product-hero-scene-planner.md)
- [scene-plan-schema.md](references/scene-plan-schema.md)
