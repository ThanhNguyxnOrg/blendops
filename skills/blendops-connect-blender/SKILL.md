---
name: blendops-connect-blender
description: Set up and check a Blender runtime path. Use when picking Lab MCP, mcp-for-blender, or CLI fallback, checking readiness, or fixing bridge conflicts.
---

# blendops-connect-blender

## Purpose

Pick a runtime path (Lab MCP, mcp-for-blender, or CLI fallback), guide setup, check readiness, and resolve bridge conflicts.

This skill merges `runtime-readiness`, `runtime-setup`, `runtime-path-picker`, `path-one-host-outline`, `bridge-conflicts`, `cli-appendix-job-outline` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- The user wants BlendOps to act in Blender and no path is chosen.
- A runtime path needs setup steps.
- Readiness must be checked before any runtime work.
- Two bridges or add-ons conflict.
- A CLI fallback job needs an outline.

## When not to use
<!-- blendops:generated:start exclusions -->
- halting on contradictory constraints before handoff → use `../blendops-final-check/SKILL.md` (Delegates out-of-scope requests to blendops-final-check)
- the bridge matrix is clean and only one path is active, but smoke tests still fail → use `../blendops-fix-problems/SKILL.md` (route to blendops-fix-problems)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "check runtime readiness"
- "is runtime available"
- "can we run this now"
- "run the readiness matrix for our chosen Blender path"
- "set up Blender runtime prerequisites"
- "what are the Blender runtime setup boundaries"
- "prepare Official Blender Lab MCP setup prerequisites"
- "runtime prerequisites and version minimums"
- "which MCP should I use"
- "Lab MCP or mcp-for-blender"
- "Path 1 or Path 2"
- "CLI vs MCP"
- "Connector vs Cursor MCP"
- "how do I host Lab MCP"
- "Claude Desktop Connector vs manual MCP client"
- "what hosts work with Path 1"
- "tool surface looks wrong"
- "smoke test passed yesterday but recipe fails today"
- "Lab MCP and ahujasid both installed"
- "Claude Desktop and Cursor both pointing at Blender"
- "port 9876 already in use"
- "single-bridge constraint violation"
- "headless blender"
- "batch render CLI"
- "blender --background"
- "render farm outline"
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

- No path chosen → [path picker](references/runtime-path-picker.md).
- Path 1 host details → [Path 1 host outline](references/path-one-host-outline.md).
- Setup steps → [runtime setup](references/runtime-setup.md).
- Before any runtime action → [readiness](references/runtime-readiness.md).
- Bridge errors or two add-ons → [bridge conflicts](references/bridge-conflicts.md).
- No MCP available → [CLI job outline](references/cli-appendix-job-outline.md).

## Playbooks

- [runtime-readiness](references/runtime-readiness.md) — Check readiness before runtime work.
- [runtime-setup](references/runtime-setup.md) — Guide runtime setup.
- [runtime-path-picker](references/runtime-path-picker.md) — Pick the runtime path.
- [path-one-host-outline](references/path-one-host-outline.md) — Outline the Path 1 host options.
- [bridge-conflicts](references/bridge-conflicts.md) — Resolve bridge conflicts.
- [cli-appendix-job-outline](references/cli-appendix-job-outline.md) — Outline a CLI fallback job.

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

Blender 4.2 user → Path 2 or CLI fallback (Path 1 needs 5.1+), readiness checklist, Runtime: Not Run until a read-only call succeeds.

## Bad examples

Telling a Blender 4.x user to install the Lab add-on, or claiming the bridge works without a read-only check. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: runtime-path-setup-readiness-and-bridge-conflicts
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
- [progression] Runtime is ready and the scene plan is locked; build the scene → `../blendops-build/SKILL.md`
- [alternative] If Ready / Partially Ready and moving to scene planning (blendops-product-shot) → `../blendops-product-shot/SKILL.md`
- [conditional] If Ready / Partially Ready and moving to scene planning (blendops-start) → `../blendops-start/SKILL.md`
- [fallback] Contradictory constraints failure exit → `../blendops-final-check/SKILL.md`
- [fallback] If the bridge matrix is clean but failures persist → `../blendops-fix-problems/SKILL.md`
- [conditional] Export format choices → `../blendops-render-settings/SKILL.md`
- [progression] Actual CLI output evidence recording → `../blendops-final-check/SKILL.md`
- [progression] Runtime attempt reporting → `../blendops-final-check/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [anti-patterns.md](references/anti-patterns.md)
- [blocker-report-template.md](references/blocker-report-template.md)
- [bridge-conflicts.md](references/bridge-conflicts.md)
- [bridge-state-matrix-template.md](references/bridge-state-matrix-template.md)
- [cli-appendix-job-outline.md](references/cli-appendix-job-outline.md)
- [conflict-playbooks.md](references/conflict-playbooks.md)
- [connector-vs-manual-matrix.md](references/connector-vs-manual-matrix.md)
- [decision-tree.md](references/decision-tree.md)
- [do-not-reminders.md](references/do-not-reminders.md)
- [evidence-examples.md](references/evidence-examples.md)
- [flag-order-reminders.md](references/flag-order-reminders.md)
- [host-checklist-template.md](references/host-checklist-template.md)
- [job-type-matrix.md](references/job-type-matrix.md)
- [lab-addon-reminders.md](references/lab-addon-reminders.md)
- [path-constraints-table.md](references/path-constraints-table.md)
- [path-one-host-outline.md](references/path-one-host-outline.md)
- [readiness-matrix.md](references/readiness-matrix.md)
- [runtime-option-decision-tree.md](references/runtime-option-decision-tree.md)
- [runtime-path-picker.md](references/runtime-path-picker.md)
- [runtime-readiness.md](references/runtime-readiness.md)
- [runtime-setup.md](references/runtime-setup.md)
- [setup-summary-template.md](references/setup-summary-template.md)
- [source-confidence-labels.md](references/source-confidence-labels.md)
- [stateless-limitations.md](references/stateless-limitations.md)
