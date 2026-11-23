---
name: troubleshooting-blender-output
description: Diagnose Blender output problems. Use when a render, export, GLB, or runtime step looks wrong, fails, or errors, and the user needs a plain-language fix.
---

# troubleshooting-blender-output

## Purpose

Diagnose wrong-looking renders, exports, and runtime errors in plain language and route to the fix without claiming results.

This skill merges `blender-troubleshooting` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- A render or preview looks wrong (black, noisy, washed out).
- An export or GLB fails or looks broken.
- A runtime step errored.

## When not to use
<!-- blendops:generated:start exclusions -->
- the user has not yet stated a clear expected outcome (run scoping-3d-briefs first) → use `../scoping-3d-briefs/SKILL.md` (run scoping-3d-briefs first)
- runtime has never been attempted (run setting-up-blender-runtime first) → use `../setting-up-blender-runtime/SKILL.md` (run setting-up-blender-runtime first)
- the request is creative iteration ("can we make it more dramatic"), not debugging → use `../scoping-3d-briefs/SKILL.md` (Delegates out-of-scope requests to scoping-3d-briefs)
- the user wants a one-shot fix without diagnostic discipline → use `../scoping-3d-briefs/SKILL.md` (Delegates out-of-scope requests to scoping-3d-briefs)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "the render looks wrong"
- "the GLB doesn't open / looks empty / is wrong scale"
- "the output doesn't match what I asked for"
- "why did it produce X instead of Y?"
- "debug this Blender output"
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

- Collect symptoms and evidence → follow the [troubleshooting playbook](references/blender-troubleshooting.md).
- Root cause is runtime setup → `setting-up-blender-runtime`.
- Root cause is lighting, materials, or color → `planning-lighting-and-materials`.
- Fix applied → `verifying-before-handoff`.

## Playbooks

- [blender-troubleshooting](references/blender-troubleshooting.md) — Diagnose and route Blender output problems.

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

Black render → check camera, lights, and view transform in order; explain each in plain words; status stays Failed until re-render evidence.

## Bad examples

Pasting a Python script as the fix for the user. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: blender-output-troubleshooting
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
- [upstream_reference] If divergence at intent (scoping-3d-briefs) → `../scoping-3d-briefs/SKILL.md`
- [upstream_reference] If divergence at intent (scoping-3d-briefs) → `../scoping-3d-briefs/SKILL.md`
- [conditional] If divergence at planning (planning-camera-and-framing) → `../planning-camera-and-framing/SKILL.md`
- [conditional] If divergence at planning (planning-lighting-and-materials) → `../planning-lighting-and-materials/SKILL.md`
- [alternative] If divergence at planning (planning-scenes) → `../planning-scenes/SKILL.md`
- [alternative] If divergence at planning (planning-scenes) → `../planning-scenes/SKILL.md`
- [alternative] If divergence at planning (planning-scenes) → `../planning-scenes/SKILL.md`
- [alternative] If divergence at planning (planning-product-scenes) → `../planning-product-scenes/SKILL.md`
- [alternative] If divergence at planning (planning-product-scenes) → `../planning-product-scenes/SKILL.md`
- [upstream_reference] If divergence at execution (setting-up-blender-runtime) → `../setting-up-blender-runtime/SKILL.md`
- [fallback] If divergence at execution (setting-up-blender-runtime) → `../setting-up-blender-runtime/SKILL.md`
- [upstream_reference] If divergence at execution (setting-up-blender-runtime) → `../setting-up-blender-runtime/SKILL.md`
- [conditional] If divergence at output (handing-off-glb-to-web) → `../handing-off-glb-to-web/SKILL.md`
- [conditional] If divergence at output (handing-off-glb-to-web) → `../handing-off-glb-to-web/SKILL.md`
- [conditional] If divergence at output (verifying-before-handoff) → `../verifying-before-handoff/SKILL.md`
- [conditional] If divergence at response → `../using-blendops/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [blender-troubleshooting.md](references/blender-troubleshooting.md)
- [common-symptom-playbooks.md](references/common-symptom-playbooks.md)
- [divergence-routing-table.md](references/divergence-routing-table.md)
- [four-phase-template.md](references/four-phase-template.md)
