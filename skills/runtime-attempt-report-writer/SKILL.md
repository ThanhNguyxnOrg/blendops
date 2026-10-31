---
name: runtime-attempt-report-writer
description: Produce an evidence-bound runtime attempt report with truth labels and next steps; does not certify upstream stack success.
---

# runtime-attempt-report-writer

## Purpose

Record a chronological, secret-free runtime attempt log—including version stamps, downgrade-only truth labels, and routed next steps—for Path 1, Path 2, or CLI appendix runs. A report produced by this skill can serve as an in-repo provenance record under `docs/evals/`, without certifying artifact quality or diagnosing runtime defects.

## Quick start

- gather timestamps, commands/config surfaces touched (no secrets)
- choose blocks from `references/truth-label-blocks.md`
- fill `references/attempt-record-template.md`
- route improvements via `references/triage-next-steps.md`

## When to use

- after any Blender connect attempt (success or failure)
- preparing notes for `docs/evals/` style provenance
- teaching non-technical stakeholders what actually occurred

## When not to use
<!-- blendops:generated:start exclusions -->
- Classifying rendered or exported visual artifacts (render-export-evidence) → use `../render-export-evidence/SKILL.md` (render-export-evidence)
- Diagnosing systematic runtime or scene defects (blender-troubleshooting) → use `../blender-troubleshooting/SKILL.md` (blender-troubleshooting)
- Running pre-attempt environment checks (official-runtime-readiness-checker) → use `../official-runtime-readiness-checker/SKILL.md` (official-runtime-readiness-checker)
- Selecting which runtime path to use before an attempt (runtime-path-picker) → use `../runtime-path-picker/SKILL.md` (runtime-path-picker)
- Performing final release or delivery gating (pre-handoff-verification) → use `../pre-handoff-verification/SKILL.md` (pre-handoff-verification)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "write up what we tried"
- "runtime attempt log"
- "postmortem blender connect"
- "evidence report template"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- Pre-attempt path selection completed via `runtime-path-picker` and readiness checked via `official-runtime-readiness-checker`
- Chronological list of actions attempted (even if partial or aborted)
- Exact version stamps for Blender, MCP host/client, and any bridge/add-on used

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Path & host attempted | Frames Path 1, Path 2, or CLI appendix boundaries and caveats |
| Chronological actions & symptom outcome | Establishes the factual timeline and governs downgrade-only truth labels |
| Versions | Stamps Blender, host/client, and bridge/add-on versions for provenance |

### Optional inputs

| Input | Use |
|---|---|
| Redacted log excerpts | Supports chronological action records without upgrading truth states |
| Artifact pointers | Notes whether outputs exist so they can be routed to `render-export-evidence` |

## Output schema

### Primary output

- Structured Markdown attempt report (sections A–F) containing chronological actions, redacted config surfaces, version stamps, truth labels, and routed next steps (suitable for saving under `docs/evals/`).

### Evidence / caveat output

- **Runtime truth state** (exact allowed values): `Not Run | Attempted | Produced | Verified | Failed`
- **Artifact truth state** (default `Not Produced`; exact allowed values): `Not Run | Not Produced | Produced | Verified | Failed`
- **Discipline**: Downgrade-only, never upgrade; defer all artifact verification and visual quality ledgering to `render-export-evidence`.
- Embedded template includes explicit Runtime + Artifact states.

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Documentation skill only—never executes Blender or generates Python. Reports must strictly preserve upstream runtime distinctions:
- **Path 1**: Official Blender Lab MCP in Blender 5.1+, hosted from (a) Anthropic Connector or (b) manual MCP client. The Connector is NOT standalone.
- **Path 2**: Community `mcp-for-blender` (third-party, Blender 3.0+); document only with explicit caveats and never treat as release evidence.
- **CLI fallback**: Appendix only (`blender --background --python`); remains upstream-documented with no in-repo evidence file unless a report written by this skill becomes one under `docs/evals/`.

## Operating procedure

1. Stamp the attempted path, host mode, and exact versions (Blender, host/client, add-on/bridge).
2. Record operator actions chronologically in plain language with all secrets, tokens, and private paths redacted.
3. Assign Runtime (`Not Run | Attempted | Produced | Verified | Failed`) and Artifact (default `Not Produced`; allowed `Not Run | Not Produced | Produced | Verified | Failed`) truth states using strict downgrade-only discipline.
4. Route next steps: send generated files to `render-export-evidence`, defect symptoms to `blender-troubleshooting` or `runtime-bridge-conflict-resolver`, and delivery readiness to `pre-handoff-verification`.

## Decision tree

```txt
Did a real runtime connect or CLI execution attempt actually start?
  No (environment blocked before start, or dry-run walkthrough) →
    Set Runtime status: Not Run and Artifact status: Not Produced; record pre-attempt blocker and route to official-runtime-readiness-checker
  Yes → continue
Which runtime path was attempted (`references/attempt-record-template.md`)?
  Path 1 (Official Blender Lab MCP in Blender 5.1+, Host (a) Connector or Host (b) manual MCP client) →
    Stamp Blender 5.1+, Lab add-on, and host versions; note Connector is not standalone
  Path 2 (Community `mcp-for-blender`, Blender 3.0+) →
    Stamp versions, attach mandatory third-party / non-release-evidence caveat (`docs/unofficial-runtime-bridges.md`)
  CLI appendix (`blender --background --python`) →
    Stamp Blender version, redacted command flags, and stdout/stderr pointers
How did the attempt conclude (`references/truth-label-blocks.md`)?
  Aborted mid-flight or timed out without conclusive outcome → Runtime status: Attempted
  Terminated with explicit error / crash → Runtime status: Failed; route to blender-troubleshooting or runtime-bridge-conflict-resolver
  Completed with observable runtime signal → Runtime status: Produced (or Verified only if smoke checks are recorded)
Were any render/export files written to disk?
  No → Artifact status: Not Produced
  Yes → cap Artifact status at Produced (never Verified here) and route files to render-export-evidence
```

## Playbooks

### Playbook A: Path 1 read-only or scene-mutation attempt log

- Populate Sections A–F of `references/attempt-record-template.md` with exact timestamps, **Blender 5.1+** version, Lab MCP add-on version, and Host **(a)** (Anthropic Connector) or Host **(b)** (manual MCP client) version stamps.
- Redact local user paths, tokens, and environment secrets before logging chronological actions.
- Assign downgrade-only truth states from `references/truth-label-blocks.md` and route any produced files to `../render-export-evidence/SKILL.md`.

### Playbook B: Failed or timed-out MCP connection postmortem

- Record the exact chronological step where the connection dropped or port `9876` refused attachment (`references/triage-next-steps.md`).
- Set `Runtime status: Failed` (or `Attempted` if inconclusive) and `Artifact status: Not Produced` — never invent a `Blocked` truth state.
- Route port/bridge collisions to `../runtime-bridge-conflict-resolver/SKILL.md`, runtime errors to `../blender-troubleshooting/SKILL.md`, and handoff gating to `../pre-handoff-verification/SKILL.md`.

### Playbook C: Path 2 community bridge or CLI appendix provenance record

- For Path 2 (`mcp-for-blender`), stamp versions and include the explicit disclaimer that third-party bridge runs never count as official release evidence.
- For CLI appendix (`blender --background --python`), log the phased command invocation and stdout/stderr tail so the report can serve as an in-repo provenance candidate under `docs/evals/`.

## Mode handling

### Text-only mode

- Record hypothetical or dry-run walkthroughs with Runtime set to `Not Run` and Artifacts set to `Not Produced`. Never upgrade states without a real attempt.

### Runtime-ready mode

- Log chronological steps and partial transcripts; cap Runtime at `Attempted` or `Produced` unless independently verified, and keep Artifacts at `Not Produced` or `Produced` pending `render-export-evidence`.

### Blocked runtime mode

- Document the exact blocker chronologically, set Runtime to `Not Run` or `Failed` (downgrade-only), keep Artifacts at `Not Produced`, and route to `official-runtime-readiness-checker` or `pre-handoff-verification`.

## Validation checklist

- [ ] Runtime state uses only `Not Run | Attempted | Produced | Verified | Failed` and Artifact state defaults to `Not Produced` (`Not Run | Not Produced | Produced | Verified | Failed`)
- [ ] Truth labels follow downgrade-only discipline (no state upgrades, no Path 2 release evidence claims)
- [ ] Blender, host/client, and bridge/add-on version stamps are recorded
- [ ] Chronological actions contain no secrets, credentials, or upstream vendor blame language
- [ ] Operator sandbox hygiene recorded (trusted environment, no credentials in scenes/logs, disposable ports/paths)
- [ ] Artifact inspection is delegated to `render-export-evidence` and handoff gating is routed to `pre-handoff-verification`

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Chronological template complete, versions stamped, secrets redacted, downgrade-only truth states accurate, and next steps routed |
| Warn | Minor timeline gaps while keeping conservative (downgraded) truth states and complete version stamps |
| Fail | Missing version stamps, unredacted secrets, upgraded truth states, Path 2 claimed as release evidence, or missing exit to `pre-handoff-verification` on failure |

## Failure handling

- If an attempt aborts or crashes mid-run, record the chronological steps up to the failure point and set Runtime state to `Failed` and Artifact state to `Not Produced` (or `Failed` if corrupted).
- If version stamps or chronological steps cannot be confirmed from operator notes, downgrade the Runtime state to `Attempted` (or `Not Run`) and flag the gap explicitly.
- If a report is generated for a Path 2 (`mcp-for-blender`) run, attach the mandatory third-party caveat and block it from serving as release evidence.
- Route any failed or incomplete attempt report directly to `pre-handoff-verification` to block downstream delivery until resolved.

## Troubleshooting

- **Missing version metadata**: Do not guess versions; mark the version field as unrecorded, downgrade truth claims accordingly, and route to `official-runtime-readiness-checker` to capture environment facts.
- **Ambiguous connection drops**: Log the exact timestamp and symptom chronologically without speculating on root causes, then hand off diagnosis to `blender-troubleshooting` or `runtime-bridge-conflict-resolver`.
- **Unverified output files present on disk**: Keep Artifact state at `Produced` (never `Verified`) and route the files to `render-export-evidence` for inspection.
- **Sensitive tokens in raw logs**: Strip all credentials, API keys, and personal file paths before writing the chronological record.

## Best practices

- Stamp exact versions for Blender, the MCP host/client, and any bridge add-on at the top of every report.
- Write chronological entries in plain, factual language suitable for non-Blender stakeholders and `docs/evals/` provenance records.
- Default Artifact truth state to `Not Produced` and apply downgrade-only logic whenever logs or outcomes are partial.
- Clearly distinguish Path 1, Path 2, and CLI appendix runs in every report.

## Good examples

- **Path 1 manual MCP client attempt**: Logs Blender 5.1+ and client version stamps, chronological connection steps, `Runtime status: Produced`, `Artifact status: Not Produced`, and routes next steps to `render-export-evidence`.
- **Blocked Path 1 Anthropic Connector attempt**: Notes that the Connector was invoked without a running Blender 5.1+ Lab add-on host (Connector is not standalone), stamps `Runtime status: Failed` and `Artifact status: Not Produced`, and routes to `official-runtime-readiness-checker` and `pre-handoff-verification`.
- **Path 2 community exploration log**: Records a Blender 3.0+ `mcp-for-blender` run with explicit third-party caveats, caps truth labels against release use, and routes handoff gating to `pre-handoff-verification`.
- **CLI appendix record for `docs/evals/`**: Documents a `blender --background --python` run chronologically with redacted paths and version stamps to establish an in-repo evidence file.

## Bad examples

- Claiming `Runtime status: Verified` and `Artifact status: Verified` from partial console logs or operator optimism without running `render-export-evidence`.
- Pasting raw MCP configuration files containing API keys, bearer tokens, or unredacted personal filesystem paths into Section C or Section E.
- Presenting a third-party Path 2 (`mcp-for-blender`) session transcript as official Draft v0 release certification.

## User-facing response template

```txt
## A. Summary
Path: <Path 1 Official Blender Lab MCP (5.1+) | Path 2 community mcp-for-blender (3.0+, non-release) | CLI fallback appendix>
Host: <Host (a) Anthropic Connector | Host (b) Manual MCP client | Headless shell>
Date/time (UTC): <timestamp>

## B. Versions
Blender: <exact version or unrecorded>
Add-on / bridge package: <Lab MCP add-on version | mcp-for-blender version | N/A>
MCP host / client: <client name + version>

## C. Actions chronology (secrets & private paths redacted)
1. <timestamp — action taken>
2. <timestamp — action taken>

## D. Signals observed
- Expected: <observed expected signals>
- Unexpected: <timeouts, port 9876 conflicts, or errors>

## E. Truth labels (downgrade-only)
Runtime status: <Not Run | Attempted | Produced | Verified | Failed>
Artifact status: <Not Produced | Produced | Verified | Failed>
Evidence pointers: <redacted log/file paths or none>

## F. Limitations, redactions & next routing
Secrets removed: Yes (trusted sandbox hygiene verified)
Limitations: <missing version stamps, third-party Path 2 caveat, or unverified outputs>
Next skill: <render-export-evidence | blender-troubleshooting | runtime-bridge-conflict-resolver | pre-handoff-verification>
```

## Anti-patterns

- Upgrading Runtime or Artifact states to `Verified` based on partial console logs or operator optimism.
- Writing `Artifact status: Not Run` instead of `Artifact status: Not Produced` (or inventing a `Blocked` truth state).
- Treating a Path 2 (`mcp-for-blender`) attempt report as release certification or official runtime evidence.
- Blurring roles by inspecting render quality inside the attempt report instead of routing to `render-export-evidence`, or diagnosing defects instead of routing to `blender-troubleshooting`.
- Pasting raw config files containing API keys, tokens, or local user credentials into the report.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [upstream_reference] Pre-attempt readiness check → `../official-runtime-readiness-checker/SKILL.md`
- [upstream_reference] Runtime path selection context → `../runtime-path-picker/SKILL.md`
- [fallback] Bridge / port / host conflicts → `../runtime-bridge-conflict-resolver/SKILL.md`
- [fallback] Runtime or scene defect diagnosis → `../blender-troubleshooting/SKILL.md`
- [progression] Artifact evidence classification → `../render-export-evidence/SKILL.md`
- [fallback] Final handoff gate & failure exit → `../pre-handoff-verification/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Executing Blender, running MCP commands, or writing Python scripts.
- Certifying visual artifact quality or export integrity (owned by `render-export-evidence`).
- Diagnosing runtime crashes, bridge conflicts, or scene errors (owned by `blender-troubleshooting` and `runtime-bridge-conflict-resolver`).
- Approving final delivery packages without passing through `pre-handoff-verification`.

## References

- `references/truth-label-blocks.md`
- `references/attempt-record-template.md`
- `references/triage-next-steps.md`
- `../../laws/evidence-before-done.md`
