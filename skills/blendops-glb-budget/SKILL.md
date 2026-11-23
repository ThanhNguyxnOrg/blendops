---
name: blendops-glb-budget
description: Set and check GLB budgets for web and mobile. Use when a GLB must load fast on web or phones, or when polycount, texture size, or file size needs a check.
---

# blendops-glb-budget

## Purpose

Set and check polycount, texture, and file-size budgets for GLB delivery on web and mobile.

This skill merges `mobile-glb-budget`, `polycount-budget-checker` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- A GLB is going to web or mobile.
- Polycount, texture size, or file size needs a budget or check.

## When not to use
<!-- blendops:generated:start exclusions -->
- offline pre-rendered video (no real-time budget needed) → use `../blendops-lighting-materials/SKILL.md` (no real-time budget needed)
- replacing engineering load testing (this skill sets a planning budget, not a real-world benchmark) → use `../blendops-glb-web-handoff/SKILL.md` (this skill sets a planning budget, not a real-world benchmark)
- material validation → use `../blendops-lighting-materials/SKILL.md` (use blendops-lighting-materials)
- lighting validation → use `../blendops-lighting-materials/SKILL.md` (use blendops-lighting-materials)
- composition validation → use `../blendops-camera/SKILL.md` (use blendops-camera)
- broad scene readiness review → use `../blendops-final-check/SKILL.md` (use blendops-final-check)
- classifying render or export artifact evidence → use `../blendops-final-check/SKILL.md` (use blendops-final-check)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "what's a good polycount for mobile"
- "how big can the GLB be"
- "will this load on iPhone"
- "what should I aim for on a phone"
- "is the polycount okay"
- "check triangle budget"
- "what's blowing the budget"
- "topology issue?"
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

- Mobile target → [mobile budget](references/mobile-glb-budget.md).
- Any GLB with counts to check → [polycount checker](references/polycount-budget-checker.md).
- Ready to hand off → `blendops-glb-web-handoff`.

## Playbooks

- [mobile-glb-budget](references/mobile-glb-budget.md) — Set budgets for mobile web.
- [polycount-budget-checker](references/polycount-budget-checker.md) — Check counts against the budget.

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

Mobile AR viewer → ≤50k triangles, ≤2k textures, ≤5 MB, checked with `npx blendops glb inspect` evidence.

## Bad examples

Declaring a GLB within budget without inspection output. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: glb-polycount-texture-and-mobile-budget
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
- [conditional] Scene planning (consumes pinned budget) (blendops-camera) → `../blendops-camera/SKILL.md`
- [conditional] Scene planning (consumes pinned budget) (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [alternative] Scene planning (consumes pinned budget) (blendops-scene-plan) → `../blendops-scene-plan/SKILL.md`
- [alternative] Scene planning (consumes pinned budget) (blendops-scene-plan) → `../blendops-scene-plan/SKILL.md`
- [alternative] Scene planning (consumes pinned budget) (blendops-scene-plan) → `../blendops-scene-plan/SKILL.md`
- [alternative] Scene planning (consumes pinned budget) (blendops-product-shot) → `../blendops-product-shot/SKILL.md`
- [alternative] Scene planning (consumes pinned budget) (blendops-product-shot) → `../blendops-product-shot/SKILL.md`
- [conditional] Count and texture budget validation (blendops-final-check) → `../blendops-final-check/SKILL.md`
- [conditional] Count and texture budget validation (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [conditional] Measured export compliance → `../blendops-final-check/SKILL.md`
- [progression] Web delivery handoff (consumes pinned budget) → `../blendops-glb-web-handoff/SKILL.md`
- [progression] Animation contracts (owns animation contract details within pinned channel/bone/morph ceilings) → `../blendops-glb-web-handoff/SKILL.md`
- [upstream_reference] Lighting validation → `../blendops-lighting-materials/SKILL.md`
- [upstream_reference] Composition validation → `../blendops-camera/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [budget-tiers.md](references/budget-tiers.md)
- [degradation-plan.md](references/degradation-plan.md)
- [instance-counting-rules.md](references/instance-counting-rules.md)
- [mobile-glb-budget.md](references/mobile-glb-budget.md)
- [per-mesh-rules.md](references/per-mesh-rules.md)
- [polycount-budget-checker.md](references/polycount-budget-checker.md)
- [topology-hints.md](references/topology-hints.md)
- [violation-rules.md](references/violation-rules.md)
