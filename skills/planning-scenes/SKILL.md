---
name: planning-scenes
description: Plan non-product scenes. Use when the brief is a character portrait, an outdoor or environment shot, or an interior room scene.
---

# planning-scenes

## Purpose

Plan character portraits, environment shots, and interior scenes from a locked brief, with stage gates and evidence expectations.

This skill merges `character-portrait`, `environment-shot`, `interior-scene` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- The brief is a character portrait or bust.
- The brief is an environment, landscape, or outdoor shot.
- The brief is an interior room or architectural scene.

## When not to use
<!-- blendops:generated:start exclusions -->
- product hero scenes → use `../planning-product-scenes/SKILL.md` (use planning-product-scenes)
- multi-character ensemble (this skill is single-subject) → use `../scoping-3d-briefs/SKILL.md` (this skill is single-subject)
- product hero → use `../planning-product-scenes/SKILL.md` (use planning-product-scenes)
- single hero product → use `../planning-product-scenes/SKILL.md` (use planning-product-scenes)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "portrait of"
- "character looking at the camera"
- "headshot"
- "hero shot of [person / mascot / creature]"
- "establishing shot of"
- "wide shot of"
- "city / forest / desert / ocean scene"
- "set the scene"
- "interior of"
- "living room scene"
- "office showcase"
- "hotel lobby"
- "kitchen showroom"
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

- Character focus → [character portrait](references/character-portrait.md).
- Outdoor or landscape → [environment shot](references/environment-shot.md).
- Room or interior → [interior scene](references/interior-scene.md).
- Product focus instead → `planning-product-scenes`.

## Playbooks

- [character-portrait](references/character-portrait.md) — Plan a character portrait.
- [environment-shot](references/environment-shot.md) — Plan an environment or landscape shot.
- [interior-scene](references/interior-scene.md) — Plan an interior scene.

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

Cozy reading-nook interior → room layout, window light plan, camera height, asset list routed to sourcing.

## Bad examples

Promising photoreal skin or crowds without checking budget and asset availability. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: character-environment-and-interior-scene-planner
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
- [upstream_reference] Upstream brief → `../scoping-3d-briefs/SKILL.md`
- [progression] Framing deep-dive → `../planning-camera-and-framing/SKILL.md`
- [progression] Lookdev deep-dive → `../planning-lighting-and-materials/SKILL.md`
- [upstream_reference] Asset discovery → `../sourcing-assets/SKILL.md`
- [progression] Composition validation → `../planning-camera-and-framing/SKILL.md`
- [progression] Lighting validation → `../planning-lighting-and-materials/SKILL.md`
- [progression] Scene quality validation → `../verifying-before-handoff/SKILL.md`
- [upstream_reference] Single hero product redirect → `../planning-product-scenes/SKILL.md`
- [upstream_reference] Performance / polycount budget → `../budgeting-glb-for-web/SKILL.md`
- [upstream_reference] Style consistency check → `../sourcing-assets/SKILL.md`
- [progression] Material validation → `../planning-lighting-and-materials/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [character-portrait.md](references/character-portrait.md)
- [depth-layering-rules.md](references/depth-layering-rules.md)
- [environment-shot.md](references/environment-shot.md)
- [furniture-layout-rules.md](references/furniture-layout-rules.md)
- [interior-architecture-rules.md](references/interior-architecture-rules.md)
- [interior-camera-rules.md](references/interior-camera-rules.md)
- [interior-scene.md](references/interior-scene.md)
- [portrait-framing-rules.md](references/portrait-framing-rules.md)
- [portrait-lighting-patterns.md](references/portrait-lighting-patterns.md)
- [style-consistency-rules.md](references/style-consistency-rules.md)
- [time-and-weather-rules.md](references/time-and-weather-rules.md)
- [wide-shot-camera-rules.md](references/wide-shot-camera-rules.md)
