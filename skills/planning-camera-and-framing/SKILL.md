---
name: planning-camera-and-framing
description: Plan camera, framing, resolution, and aspect ratio. Use when choosing shots or output size, or when checking whether framing meets written composition criteria.
---

# planning-camera-and-framing

## Purpose

Plan camera, composition, resolution, and aspect ratio, and check framing quality against written criteria.

This skill merges `camera-composition`, `composition-quality-checker`, `resolution-aspect-decision` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- Camera angle, lens, or framing needs a plan.
- Resolution or aspect ratio must match a delivery target.
- Composition needs a check against written criteria.

## When not to use
<!-- blendops:generated:start exclusions -->
- to design lighting rigs or surface materials/lookdev → use `../planning-lighting-and-materials/SKILL.md` (use planning-lighting-and-materials)
- to choose delivery file formats → use `../choosing-render-and-output/SKILL.md` (use choosing-render-and-output)
- when subject intent is undefined → use `../planning-product-scenes/SKILL.md` (Delegates out-of-scope requests to planning-product-scenes)
- material validation → use `../planning-lighting-and-materials/SKILL.md` (use planning-lighting-and-materials)
- lighting validation → use `../planning-lighting-and-materials/SKILL.md` (use planning-lighting-and-materials)
- broad scene Pass/Warn/Fail readiness review → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
- classifying render or export artifact evidence → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
- pure modeling → use `../choosing-render-and-output/SKILL.md` (Delegates out-of-scope requests to choosing-render-and-output)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "improve composition and camera"
- "choose hero framing"
- "set camera strategy for product hero"
- "is the framing okay"
- "check composition"
- "subject feels off-center"
- "too much negative space"
- "what resolution"
- "how big should the render be"
- "16:9 or square"
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

- No camera plan yet → [camera composition](references/camera-composition.md).
- Delivery size or aspect unknown → [resolution and aspect](references/resolution-aspect-decision.md).
- Plan or preview exists and needs review → [composition checker](references/composition-quality-checker.md).

## Playbooks

- [camera-composition](references/camera-composition.md) — Plan camera and composition.
- [composition-quality-checker](references/composition-quality-checker.md) — Check framing against written criteria.
- [resolution-aspect-decision](references/resolution-aspect-decision.md) — Choose resolution and aspect for the target.

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

Instagram carousel → 4:5 at 1080×1350, subject on thirds, checklist of framing criteria.

## Bad examples

Saying the composition "looks good" without a preview or written criteria. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: camera-composition-framing-and-aspect-planner
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
- [upstream_reference] Upstream input from → `../planning-product-scenes/SKILL.md`
- [conditional] Lateral output specs (if needed) (choosing-render-and-output) → `../choosing-render-and-output/SKILL.md`
- [progression] Next (lookdev & lighting) → `../planning-lighting-and-materials/SKILL.md`
- [progression] Then (validation) (verifying-before-handoff) → `../verifying-before-handoff/SKILL.md`
- [progression] Artifact evidence classification → `../verifying-before-handoff/SKILL.md`
- [upstream_reference] Material validation → `../planning-lighting-and-materials/SKILL.md`
- [upstream_reference] Lighting validation → `../planning-lighting-and-materials/SKILL.md`
- [upstream_reference] Color configuration decision → `../planning-lighting-and-materials/SKILL.md`
- [progression] Render engine decision → `../choosing-render-and-output/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [aspect-defaults.md](references/aspect-defaults.md)
- [aspect-ratio-rules.md](references/aspect-ratio-rules.md)
- [camera-composition.md](references/camera-composition.md)
- [camera-presets.md](references/camera-presets.md)
- [camera-rubric.md](references/camera-rubric.md)
- [composition-quality-checker.md](references/composition-quality-checker.md)
- [composition-rules.md](references/composition-rules.md)
- [headroom-leadroom-rules.md](references/headroom-leadroom-rules.md)
- [hero-composition-patterns.md](references/hero-composition-patterns.md)
- [print-vs-screen-rules.md](references/print-vs-screen-rules.md)
- [resolution-aspect-decision.md](references/resolution-aspect-decision.md)
- [resolution-defaults.md](references/resolution-defaults.md)
- [web-layout-negative-space.md](references/web-layout-negative-space.md)
