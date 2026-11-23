---
name: blendops-assets
description: Find and clear 3D assets. Use when searching for models, textures, or HDRIs, checking licenses or style fit, planning fallbacks, or organizing an asset library.
---

# blendops-assets

## Purpose

Find assets, clear licenses, check style fit, plan fallbacks, and organize a reusable asset library.

This skill merges `asset-discovery`, `asset-license-checker`, `asset-style-check`, `asset-fallback-strategy`, `asset-library-plan` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- The scene needs models, textures, or HDRIs.
- An asset's license must be cleared before use.
- Assets must match the brief's style.
- A needed asset is missing and needs a fallback.
- Assets should be organized for reuse.

## When not to use
<!-- blendops:generated:start exclusions -->
- the user supplied all assets in the brief (skip; route directly to planner) → use `../blendops-brief/SKILL.md` (skip; route directly to planner)
- runtime is already executing and assets are already in the scene → use `../blendops-product-shot/SKILL.md` (route to evidence skill)
- the request is iteration on an existing scene (assets are already chosen) → use `../blendops-final-check/SKILL.md` (assets are already chosen)
- when the user wants to wait for the original asset → use `../blendops-product-shot/SKILL.md` (Delegates out-of-scope requests to blendops-product-shot)
- enforcing file size or polygon/asset count performance budgets → use `../blendops-glb-budget/SKILL.md` (use blendops-glb-budget)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "what assets do we need"
- "where do the models come from"
- "asset plan before scene planning"
- "do we generate or import"
- "surface asset license risks before planning"
- "is this license OK"
- "can I use this commercially"
- "what's the license"
- "license check"
- "do these assets fit together"
- "style check the assets"
- "scene feels like a collage"
- "what if we can't get this asset"
- "fallback for the model"
- "the license blocks us"
- "scaled-down asset"
- "organize the assets"
- "asset library structure"
- "where should assets go"
- "name our assets"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- Runtime state is one of `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`; artifacts default to `Not Produced`.
- Runtime install is separate from skill install; check readiness with `blendops-connect-blender` before any runtime step.

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

- Need assets → [discovery](references/asset-discovery.md).
- Found candidates → [license check](references/asset-license-checker.md) then [style check](references/asset-style-check.md).
- Nothing fits → [fallback strategy](references/asset-fallback-strategy.md).
- Reuse across projects → [library plan](references/asset-library-plan.md).

## Playbooks

- [asset-discovery](references/asset-discovery.md) — Find candidate assets.
- [asset-license-checker](references/asset-license-checker.md) — Clear licenses before use.
- [asset-style-check](references/asset-style-check.md) — Check style fit against the brief.
- [asset-fallback-strategy](references/asset-fallback-strategy.md) — Plan fallbacks when assets are missing.
- [asset-library-plan](references/asset-library-plan.md) — Organize a reusable library.

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

- If output looks wrong after a runtime step, hand off to `blendops-fix-problems`.
- If the runtime path is unclear or failing, hand off to `blendops-connect-blender`.

## Best practices

- One next step per reply.
- Cite evidence paths for every Produced or Verified claim.
- Explain unavoidable Blender terms in a few words.

## Good examples

CC0 HDRI from Poly Haven with license recorded, style checked against the brief.

## Bad examples

Using a model with an unknown license because it looked right. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: asset-discovery-license-style-fallback-and-library
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
- [upstream_reference] **Before this skill** → `../blendops-brief/SKILL.md`
- [alternative] **Scene planners (primary handoff with brief + asset plan)** (blendops-scene-plan) → `../blendops-scene-plan/SKILL.md`
- [alternative] **Scene planners (primary handoff with brief + asset plan)** (blendops-scene-plan) → `../blendops-scene-plan/SKILL.md`
- [alternative] **Scene planners (primary handoff with brief + asset plan)** (blendops-scene-plan) → `../blendops-scene-plan/SKILL.md`
- [alternative] **Scene planners (primary handoff with brief + asset plan)** (blendops-product-shot) → `../blendops-product-shot/SKILL.md`
- [alternative] **Scene planners (primary handoff with brief + asset plan)** (blendops-product-shot) → `../blendops-product-shot/SKILL.md`
- [progression] **Budget reconciliation** (blendops-glb-budget) → `../blendops-glb-budget/SKILL.md`
- [progression] **Budget reconciliation** (blendops-glb-budget) → `../blendops-glb-budget/SKILL.md`
- [upstream_reference] **Generative readiness** → `../blendops-connect-blender/SKILL.md`
- [conditional] Stage routing & scene planning gate → `../blendops-start/SKILL.md`
- [boundary_delegation] Scope enforcement → `../blendops-done-criteria/SKILL.md`
- [progression] Broad scene review → `../blendops-final-check/SKILL.md`
- [progression] Material & lookdev boundary (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [progression] Material & lookdev boundary (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [fallback] Recipe split when no viable fallback exists → `../blendops-brief/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [asset-discovery.md](references/asset-discovery.md)
- [asset-fallback-strategy.md](references/asset-fallback-strategy.md)
- [asset-library-plan.md](references/asset-library-plan.md)
- [asset-license-checker.md](references/asset-license-checker.md)
- [asset-strategy-decision-tree.md](references/asset-strategy-decision-tree.md)
- [asset-style-check.md](references/asset-style-check.md)
- [attribution-rendering-patterns.md](references/attribution-rendering-patterns.md)
- [budget-reconciliation-patterns.md](references/budget-reconciliation-patterns.md)
- [common-license-mapping.md](references/common-license-mapping.md)
- [drift-classification.md](references/drift-classification.md)
- [drop-with-caveat-rules.md](references/drop-with-caveat-rules.md)
- [fallback-option-types.md](references/fallback-option-types.md)
- [folder-structure-rules.md](references/folder-structure-rules.md)
- [intentional-mixed-style.md](references/intentional-mixed-style.md)
- [license-confidence-table.md](references/license-confidence-table.md)
- [license-source-rules.md](references/license-source-rules.md)
- [metadata-schema.md](references/metadata-schema.md)
- [naming-rules.md](references/naming-rules.md)
- [scoring-rubric.md](references/scoring-rubric.md)
- [style-axes.md](references/style-axes.md)
