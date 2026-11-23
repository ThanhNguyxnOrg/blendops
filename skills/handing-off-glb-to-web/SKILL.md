---
name: handing-off-glb-to-web
description: Hand off a GLB to a web team. Use when preparing a GLB for a website, documenting animation clips, or planning a React Three Fiber component.
---

# handing-off-glb-to-web

## Purpose

Prepare GLB handoff to web teams, including animation clips and a React Three Fiber component plan.

This skill merges `glb-web-handoff`, `glb-animation-handoff`, `r3f-component-plan` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- A GLB is going to a web team.
- Animation clips must be named and documented.
- A React Three Fiber component plan is needed.

## When not to use
<!-- blendops:generated:start exclusions -->
- to claim GLB or export success without concrete evidence → use `../verifying-before-handoff/SKILL.md` (Delegates out-of-scope requests to verifying-before-handoff)
- to replace runtime export verification → use `../verifying-before-handoff/SKILL.md` (Delegates out-of-scope requests to verifying-before-handoff)
- to validate upstream scene readiness → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
- to classify raw render/export artifact evidence → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
- to define mobile or file-size performance budgets → use `../budgeting-glb-for-web/SKILL.md` (use budgeting-glb-for-web)
- to write the final user-facing response wording → use `../using-blendops/SKILL.md` (use using-blendops)
- video pre-renders → use `../choosing-render-and-output/SKILL.md` (Delegates out-of-scope requests to choosing-render-and-output)
- platforms that re-author animation downstream (game engines re-rigging the asset) → use `../planning-product-scenes/SKILL.md` (game engines re-rigging the asset)
- the GLB is rendered server-side (e.g. AR pre-render); no React component needed → use `../using-blendops/SKILL.md` (Delegates out-of-scope requests to using-blendops)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "prepare web handoff"
- "is GLB ready"
- "summarize export status"
- "make it loop"
- "trigger animation on hover"
- "idle and active states"
- "smooth transition between"
- "how should the React component look"
- "what props should I expose"
- "ref shape for the model"
- "we use react-three-fiber"
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

- Static GLB → [web handoff](references/glb-web-handoff.md).
- Animated GLB → [animation handoff](references/glb-animation-handoff.md).
- React app → [R3F component plan](references/r3f-component-plan.md).
- Budget not checked → `budgeting-glb-for-web` first.

## Playbooks

- [glb-web-handoff](references/glb-web-handoff.md) — Prepare the GLB handoff manifest.
- [glb-animation-handoff](references/glb-animation-handoff.md) — Document animation clips.
- [r3f-component-plan](references/r3f-component-plan.md) — Plan the React Three Fiber component.

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

Handoff lists file path, inspection evidence, clip names, and the R3F loader plan; status Produced, not Verified, until checked in the app.

## Bad examples

Handing off a GLB that was never inspected. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: glb-web-animation-and-r3f-handoff
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
- [upstream_reference] Upstream scene readiness validation → `../verifying-before-handoff/SKILL.md`
- [upstream_reference] Upstream artifact evidence classification → `../verifying-before-handoff/SKILL.md`
- [upstream_reference] Mobile and file-size budget constraints → `../budgeting-glb-for-web/SKILL.md`
- [conditional] Final user-facing response wording → `../using-blendops/SKILL.md`
- [upstream_reference] Missing clip list / scene plan (planning-scenes) → `../planning-scenes/SKILL.md`
- [upstream_reference] Missing clip list / scene plan (planning-scenes) → `../planning-scenes/SKILL.md`
- [upstream_reference] Missing clip list / scene plan (planning-scenes) → `../planning-scenes/SKILL.md`
- [upstream_reference] Missing clip list / scene plan (planning-product-scenes) → `../planning-product-scenes/SKILL.md`
- [upstream_reference] Missing clip list / scene plan (planning-product-scenes) → `../planning-product-scenes/SKILL.md`
- [upstream_reference] Color and material checks (planning-lighting-and-materials) → `../planning-lighting-and-materials/SKILL.md`
- [upstream_reference] Color and material checks (planning-lighting-and-materials) → `../planning-lighting-and-materials/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [animation-types.md](references/animation-types.md)
- [artifact-status-language.md](references/artifact-status-language.md)
- [component-shape-patterns.md](references/component-shape-patterns.md)
- [glb-animation-handoff.md](references/glb-animation-handoff.md)
- [glb-handoff-checklist.md](references/glb-handoff-checklist.md)
- [glb-web-handoff.md](references/glb-web-handoff.md)
- [performance-caveats.md](references/performance-caveats.md)
- [r3f-component-plan.md](references/r3f-component-plan.md)
- [suspense-placement-rules.md](references/suspense-placement-rules.md)
- [threejs-r3f-handoff.md](references/threejs-r3f-handoff.md)
- [transition-rules.md](references/transition-rules.md)
- [usegltf-caching-rules.md](references/usegltf-caching-rules.md)
- [web-stack-caveats.md](references/web-stack-caveats.md)
