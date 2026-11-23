---
name: blendops-lighting-materials
description: Plan lighting, materials, and color management. Use when setting up lights or materials, choosing a color view transform, or checking lighting or material quality.
---

# blendops-lighting-materials

## Purpose

Plan lighting, materials, and color management, and check lighting and material quality against written criteria.

This skill merges `lighting-material-plan`, `lighting-quality-checker`, `material-quality-checker`, `color-management-decision` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- Lighting or material choices need a plan.
- Color management (view transform, look) must be decided.
- Lighting or material quality needs a check against criteria.

## When not to use
<!-- blendops:generated:start exclusions -->
- to claim final rendered quality or executed results → use `../blendops-camera/SKILL.md` (Delegates out-of-scope requests to blendops-camera)
- to skip composition/camera context from blendops-camera → use `../blendops-camera/SKILL.md` (Delegates out-of-scope requests to blendops-camera)
- composition / camera validation → use `../blendops-camera/SKILL.md` (use blendops-camera)
- broad pass/warn/fail scene readiness → use `../blendops-final-check/SKILL.md` (use blendops-final-check)
- classifying render or export artifact evidence → use `../blendops-final-check/SKILL.md` (use blendops-final-check)
- to fix or edit lights (this skill validates and gives remediation hints only; it never edits) → use `../blendops-final-check/SKILL.md` (this skill validates and gives remediation hints only; it never edits)
- web integration and viewer handoff → use `../blendops-glb-web-handoff/SKILL.md` (use blendops-glb-web-handoff)
- Post-render color grading or soft-proofing (handled by compositor / DCC after render). → use `../blendops-render-settings/SKILL.md` (Delegates out-of-scope requests to blendops-render-settings)
- Selecting file formats or bit depths (blendops-render-settings). → use `../blendops-render-settings/SKILL.md` (Delegates out-of-scope requests to blendops-render-settings)
- Choosing the render engine (blendops-render-settings). → use `../blendops-render-settings/SKILL.md` (Delegates out-of-scope requests to blendops-render-settings)
- Raw modeling without lookdev (color management does not affect geometry accuracy). → use `../blendops-render-settings/SKILL.md` (Delegates out-of-scope requests to blendops-render-settings)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "plan lighting and materials"
- "design cyberpunk lookdev"
- "define PBR and reflection strategy"
- "is the lighting okay"
- "check shadow softness"
- "lighting feels off"
- "is the HDRI balanced"
- "are the materials okay"
- "check PBR sanity"
- "texture budget for materials"
- "will the materials work in Three.js"
- "what color space"
- "Filmic vs Standard"
- "ACEScg for our pipeline"
- "colors look weird"
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

- No plan yet → [lighting and material plan](references/lighting-material-plan.md).
- Color looks off or target is web vs print → [color management](references/color-management-decision.md).
- Review lighting → [lighting checker](references/lighting-quality-checker.md); review materials → [material checker](references/material-quality-checker.md).

## Playbooks

- [lighting-material-plan](references/lighting-material-plan.md) — Plan lights and materials.
- [lighting-quality-checker](references/lighting-quality-checker.md) — Check lighting against criteria.
- [material-quality-checker](references/material-quality-checker.md) — Check materials against criteria.
- [color-management-decision](references/color-management-decision.md) — Choose the color view transform for the target.

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

Glossy product → three-point plan, roughness ranges, AgX view transform for web, checks listed as Not Run.

## Bad examples

Claiming the materials look realistic without a render. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: lighting-material-color-planner-and-checker
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
- [upstream_reference] Upstream input from (blendops-camera) → `../blendops-camera/SKILL.md`
- [progression] Upstream input from (blendops-render-settings) → `../blendops-render-settings/SKILL.md`
- [progression] Upstream input from (blendops-render-settings) → `../blendops-render-settings/SKILL.md`
- [progression] Then scene check → `../blendops-final-check/SKILL.md`
- [progression] Then delivery → `../blendops-glb-web-handoff/SKILL.md`
- [conditional] Composition validation → `../blendops-camera/SKILL.md`
- [progression] Render evidence → `../blendops-final-check/SKILL.md`
- [upstream_reference] Mobile/web texture budget definition → `../blendops-glb-budget/SKILL.md`
- [progression] Polycount budget → `../blendops-glb-budget/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [color-management-decision.md](references/color-management-decision.md)
- [consumer-stack-rules.md](references/consumer-stack-rules.md)
- [cyberpunk-lookdev.md](references/cyberpunk-lookdev.md)
- [hdri-balance-rules.md](references/hdri-balance-rules.md)
- [intensity-ranges.md](references/intensity-ranges.md)
- [lighting-material-plan.md](references/lighting-material-plan.md)
- [lighting-patterns.md](references/lighting-patterns.md)
- [lighting-quality-checker.md](references/lighting-quality-checker.md)
- [look-comparison.md](references/look-comparison.md)
- [material-portability.md](references/material-portability.md)
- [material-quality-checker.md](references/material-quality-checker.md)
- [pbr-sanity-rules.md](references/pbr-sanity-rules.md)
- [per-channel-rules.md](references/per-channel-rules.md)
- [pipeline-mapping.md](references/pipeline-mapping.md)
- [reflective-floor-pattern.md](references/reflective-floor-pattern.md)
- [shadow-softness-rules.md](references/shadow-softness-rules.md)
- [texture-budget-rules.md](references/texture-budget-rules.md)
- [web-material-simplification.md](references/web-material-simplification.md)
