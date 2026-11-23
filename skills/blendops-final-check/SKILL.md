---
name: blendops-final-check
description: Verify work before handoff. Use when checking scene readiness, collecting render or export evidence, writing preview or runtime-attempt reports, or deciding if work is done.
---

# blendops-final-check

## Purpose

Check scene readiness, collect render and export evidence, write preview and runtime-attempt reports, and verify before handoff.

This skill merges `pre-handoff-verification`, `scene-readiness`, `render-export-evidence`, `preview-report`, `runtime-attempt-report` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- A scene must be checked before render or export.
- Render or export evidence must be collected.
- A preview report or runtime-attempt report is needed.
- Work is about to be handed off.

## When not to use
<!-- blendops:generated:start exclusions -->
- the user explicitly asked for a draft, not a verified deliverable → use `../blendops-fix-problems/SKILL.md` (Delegates out-of-scope requests to blendops-fix-problems)
- as a replacement for evidence collection → use `../blendops-product-shot/SKILL.md` (Delegates out-of-scope requests to blendops-product-shot)
- to fabricate confidence in missing artifacts → use `../blendops-lighting-materials/SKILL.md` (Delegates out-of-scope requests to blendops-lighting-materials)
- the user only needs a scene plan with no runtime or artifact evidence → use `../blendops-connect-blender/SKILL.md` (Delegates out-of-scope requests to blendops-connect-blender)
- runtime readiness or path selection has not been completed and the user wants setup or routing; use blendops-connect-blender or blendops-connect-blender → use `../blendops-connect-blender/SKILL.md` (Delegates out-of-scope requests to blendops-connect-blender)
- the task is GLB web integration after evidence is already classified and gated; use blendops-glb-web-handoff → use `../blendops-glb-web-handoff/SKILL.md` (Delegates out-of-scope requests to blendops-glb-web-handoff)
- raw debug logs or crash triage → use `../blendops-fix-problems/SKILL.md` (use blendops-fix-problems instead)
- Diagnosing systematic runtime or scene defects (blendops-fix-problems) → use `../blendops-fix-problems/SKILL.md` (blendops-fix-problems)
- Running pre-attempt environment checks (blendops-connect-blender) → use `../blendops-connect-blender/SKILL.md` (blendops-connect-blender)
- Selecting which runtime path to use before an attempt (blendops-connect-blender) → use `../blendops-connect-blender/SKILL.md` (blendops-connect-blender)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "looks ready, can we ship?"
- "I think the render is good — verify before sending"
- "before saving the evidence file..."
- "is this Verified or do we downgrade?"
- "confirm whether this claim holds or must be downgraded"
- "quality-check this scene"
- "is this ready"
- "evaluate pass warn fail"
- "Did the render produce?"
- "Can I claim the GLB exists?"
- "Verify export evidence."
- "What artifact status should this have?"
- "Summarize preview/render/GLB evidence."
- "summarize the render"
- "write up the export evidence"
- "what's the preview status"
- "write up what we tried"
- "runtime attempt log"
- "postmortem blender connect"
- "evidence report template"
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

- Before render/export → [scene readiness](references/scene-readiness.md).
- After render/export → [evidence](references/render-export-evidence.md).
- Preview exists → [preview report](references/preview-report.md).
- A runtime attempt happened (any outcome) → [attempt report](references/runtime-attempt-report.md).
- Final gate → [pre-handoff verification](references/pre-handoff-verification.md).

## Playbooks

- [pre-handoff-verification](references/pre-handoff-verification.md) — Run the final handoff gate.
- [scene-readiness](references/scene-readiness.md) — Check the scene before render or export.
- [render-export-evidence](references/render-export-evidence.md) — Collect render and export evidence.
- [preview-report](references/preview-report.md) — Write the preview report.
- [runtime-attempt-report](references/runtime-attempt-report.md) — Record what a runtime attempt did.

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

Render log, output path, and file hash recorded; status Produced; Verified only after the gate checklist passes.

## Bad examples

Marking Verified because the user said it looked fine. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: scene-readiness-evidence-preview-and-attempt-report
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
- [boundary_delegation] Entry wiring (blendops-start) → `../blendops-start/SKILL.md`
- [upstream_reference] Entry wiring (blendops-start) → `../blendops-start/SKILL.md`
- [conditional] If verdict is Pass (blendops-start) → `../blendops-start/SKILL.md`
- [upstream_reference] scene/asset quality gap (blendops-camera) → `../blendops-camera/SKILL.md`
- [upstream_reference] scene/asset quality gap (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [upstream_reference] scene/asset quality gap (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [upstream_reference] scene/asset quality gap (blendops-glb-budget) → `../blendops-glb-budget/SKILL.md`
- [fallback] runtime/bridge failure (blendops-fix-problems) → `../blendops-fix-problems/SKILL.md`
- [fallback] runtime/bridge failure (blendops-connect-blender) → `../blendops-connect-blender/SKILL.md`
- [fallback] runtime/bridge failure (blendops-connect-blender) → `../blendops-connect-blender/SKILL.md`
- [conditional] Web delivery (when applicable) → `../blendops-glb-web-handoff/SKILL.md`
- [upstream_reference] Runtime path selection context → `../blendops-connect-blender/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [attempt-record-template.md](references/attempt-record-template.md)
- [attempted-vs-failed-rubric.md](references/attempted-vs-failed-rubric.md)
- [blocker-catalog.md](references/blocker-catalog.md)
- [downgrade-rules.md](references/downgrade-rules.md)
- [evidence-record-templates.md](references/evidence-record-templates.md)
- [handoff-recipients.md](references/handoff-recipients.md)
- [not-run-handling.md](references/not-run-handling.md)
- [pre-handoff-verification.md](references/pre-handoff-verification.md)
- [preview-report.md](references/preview-report.md)
- [quality-rubric.md](references/quality-rubric.md)
- [render-export-evidence.md](references/render-export-evidence.md)
- [report-schema.md](references/report-schema.md)
- [runtime-attempt-report.md](references/runtime-attempt-report.md)
- [scene-readiness.md](references/scene-readiness.md)
- [seven-point-checklist.md](references/seven-point-checklist.md)
- [text-only-mode-handling.md](references/text-only-mode-handling.md)
- [triage-next-steps.md](references/triage-next-steps.md)
- [truth-label-blocks.md](references/truth-label-blocks.md)
- [truth-label-decision-tree.md](references/truth-label-decision-tree.md)
- [truth-label-rules.md](references/truth-label-rules.md)
- [verdict-language.md](references/verdict-language.md)
