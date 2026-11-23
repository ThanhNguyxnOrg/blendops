---
name: blendops-render-settings
description: Choose render engine and output format. Use when deciding Cycles vs EEVEE, or PNG, EXR, video, or GLB output for a delivery target.
---

# blendops-render-settings

## Purpose

Choose Cycles or EEVEE and the output format for stills, sequences, video, or GLB based on the delivery target.

This skill merges `cycles-vs-eevee-decision`, `output-format-decision` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- The user must pick Cycles or EEVEE.
- The output format or file type is undecided.

## When not to use
<!-- blendops:generated:start exclusions -->
- for a known repeat render (engine already chosen) → use `../blendops-lighting-materials/SKILL.md` (engine already chosen)
- 3D/GLB exports (out of scope — use blendops-glb-web-handoff, blendops-glb-budget, or blendops-glb-web-handoff) → use `../blendops-glb-web-handoff/SKILL.md` (out of scope — use blendops-glb-web-handoff, blendops-glb-budget, or blendops-glb-web-handoff)
- verifying saved files on disk after rendering → use `../blendops-final-check/SKILL.md` (use blendops-final-check)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "Cycles or Eevee"
- "what render engine"
- "is Eevee enough"
- "render is too slow"
- "PNG or JPEG"
- "do we need EXR"
- "what format for the web"
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

- Quality vs speed trade-off → [Cycles vs EEVEE](references/cycles-vs-eevee-decision.md).
- Delivery target known → [output format](references/output-format-decision.md).
- GLB for web → also `blendops-glb-budget`.

## Playbooks

- [cycles-vs-eevee-decision](references/cycles-vs-eevee-decision.md) — Pick the render engine.
- [output-format-decision](references/output-format-decision.md) — Pick the output format.

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

Fast turntable previews → EEVEE for drafts, Cycles for the final still, PNG with alpha.

## Bad examples

Choosing EXR for a web banner without explaining why. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: render-engine-and-output-format-decision
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
- [upstream_reference] Lighting and material setup aligned with engine choice → `../blendops-lighting-materials/SKILL.md`
- [upstream_reference] Color configuration decision → `../blendops-lighting-materials/SKILL.md`
- [upstream_reference] Render resolution and aspect ratio decision → `../blendops-camera/SKILL.md`
- [progression] Post-render output verification → `../blendops-final-check/SKILL.md`
- [progression] 3D / GLB exports (out of scope here) (blendops-glb-web-handoff) → `../blendops-glb-web-handoff/SKILL.md`
- [boundary_delegation] 3D / GLB exports (out of scope here) (blendops-glb-budget) → `../blendops-glb-budget/SKILL.md`
- [progression] 3D / GLB exports (out of scope here) (blendops-glb-web-handoff) → `../blendops-glb-web-handoff/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [bit-depth-rules.md](references/bit-depth-rules.md)
- [compression-tradeoffs.md](references/compression-tradeoffs.md)
- [cycles-vs-eevee-decision.md](references/cycles-vs-eevee-decision.md)
- [engine-feature-matrix.md](references/engine-feature-matrix.md)
- [format-decision-matrix.md](references/format-decision-matrix.md)
- [gpu-device-rules.md](references/gpu-device-rules.md)
- [output-format-decision.md](references/output-format-decision.md)
- [samples-by-quality.md](references/samples-by-quality.md)
