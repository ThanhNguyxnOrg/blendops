# Official Runtime Manual Eval Packet, Draft v0

Status: Draft v0 packet only, not executed  
Date: 2026-04-29  
Source of truth: [official-runtime-verification-criteria.md](./official-runtime-verification-criteria.md)  
Readiness preflight: [runtime-availability-checklist.md](./runtime-availability-checklist.md)  
Route decision: [../runtime-route-strategy.md](../runtime-route-strategy.md)

> [!CAUTION]
> This packet prepares a future manual eval. It does not install Blender, run Blender, claim official runtime compatibility, or claim preview/render/GLB artifacts were produced.

---

## Purpose

This packet gives a future operator a conservative checklist for running official-runtime manual evals and recording evidence.

The packet exists so BlendOps can keep Draft v0 status honest while preparing for runtime verification. A future result can only move from planned work to an evidence-backed result when it follows the criteria in the source document and records enough proof for review.

---

## Scope

This packet covers manual eval preparation for the official routes in [runtime-route-strategy.md](../runtime-route-strategy.md):

1. Route A — Claude Desktop Connector path.
2. Route B — Official MCP path for non-Claude Desktop agents.
3. Route C — Official Blender CLI path.

Route D — Optional unofficial MCP bridge path is excluded from official release-eval evidence unless a future policy creates a separate local/experimental evidence category.

The operator must choose one path per eval record unless the test plan explicitly compares paths. Each path needs its own evidence notes, artifact labels, and final verdict.

This packet covers:

- environment capture
- official source capture
- operator steps
- artifact evidence rules
- pass, warn, fail rubric
- rollback and cleanup notes
- future result template

---

## Run order

1. Read [../runtime-route-strategy.md](../runtime-route-strategy.md) and select the intended route.
2. Prefer Route A for the first real runtime eval because read-only connector smoke evidence exists.
3. Complete [runtime-availability-checklist.md](./runtime-availability-checklist.md) in the runtime environment.
4. If Route A fails during mutation, render, or export, use Route C as the next official fallback route to test.
5. Run this official runtime manual eval packet only when readiness allows a scoped attempt.
6. Apply [official-runtime-verification-criteria.md](./official-runtime-verification-criteria.md) when assigning artifact truth labels and final verdicts.
7. Update [../release-readiness.md](../release-readiness.md) only after evidence exists.

> [!WARNING]
> This run order does not claim execution has happened. It is the order for a future human-operated eval.

---

## Non-actions

This packet preserves these non-actions:

- It does not install Blender.
- It does not run Blender.
- It does not create, claim, or validate preview/render/GLB artifacts.
- It does not introduce a custom runtime implementation.
- It does not claim runtime compatibility is confirmed.
- It does not mark actual runtime manual eval complete.
- It does not move BlendOps out of Draft v0.
- It does not prepare or claim a draft tag.

---

## Prerequisites

Before execution, complete the readiness preflight in [runtime-availability-checklist.md](./runtime-availability-checklist.md). This preflight only shows whether an eval attempt is ready. It does not prove runtime success.

Before execution, the future operator must confirm:

- BlendOps status is still Draft v0 unless a newer release-readiness document says otherwise.
- The selected runtime path is official.
- The current upstream official instructions were checked on the eval date.
- The eval environment is allowed to run Blender and produce files.
- Output paths are known before execution.
- Evidence capture is available for screenshots, logs, generated files, and notes.
- The operator understands that missing evidence keeps the result at `Attempted`, `Not Run`, `Not Produced`, `Blocked / Not Run`, or `Failed`, depending on what happened.

---

## Runtime paths to test

| Runtime path | Eval use | Source requirement | Evidence focus |
|---|---|---|---|
| Route A — Claude Desktop Connector path | Preferred first real runtime eval candidate because read-only smoke evidence exists. | Use upstream Claude tutorial and current official instructions checked on the eval date. | Claude-side actions, Blender-side actions, prompts, permissions, generated files, preview/render evidence, GLB/export evidence, user-facing clarity. |
| Route B — Official MCP path for non-Claude Desktop agents | Candidate official path only after the specific MCP-capable agent is verified. | Use upstream Blender documentation plus current target-agent MCP documentation checked on the eval date. | Agent-specific MCP config, MCP actions, generated files, preview/render evidence, GLB/export evidence, validation notes, caveats. |
| Route C — Official Blender CLI path | Next official fallback if Route A fails during mutation, render, or export. | Use upstream Blender manual CLI documentation checked on the eval date. | Exact command line, exit status, logs, generated files, preview/render evidence, GLB/export evidence, platform caveats. |

> [!IMPORTANT]
> Exact setup commands, versions, UI labels, and runtime behavior must come from upstream official documentation at execution time. BlendOps must not invent install steps or imply setup happened in this repository.

---

## Environment capture checklist

Record these fields before running an eval:

- [ ] Eval date
- [ ] Operator name or handle
- [ ] Operating system and version
- [ ] Hardware notes relevant to Blender, if known
- [ ] Blender version, if installed
- [ ] Selected runtime path
- [ ] Upstream official source URL
- [ ] Date upstream official source was checked
- [ ] Runtime setup state before eval
- [ ] Working directory
- [ ] Planned output directory
- [ ] Permission prompts expected or observed
- [ ] Network state, if relevant to setup or connector availability
- [ ] Known environment limits
- [ ] Evidence capture method for screenshots, logs, and generated files

If a field cannot be captured, record `Unknown` and explain why.

---

## Step-by-step operator checklist

### 1. Prepare the eval record

- [ ] Create a new dated eval result record or copy the future result template below.
- [ ] Name the selected official runtime path.
- [ ] Link the upstream official source.
- [ ] Record the date the upstream official source was checked.
- [ ] Record the environment capture checklist.
- [ ] Record the prompt or recipe that will be used.
- [ ] Record expected outputs and which artifact types are in scope.

### 2. Confirm boundaries before execution

- [ ] Confirm this is a runtime eval, not an install dry-run.
- [ ] Confirm the selected path is official.
- [ ] Confirm no custom runtime implementation is being introduced.
- [ ] Confirm output paths are outside docs unless the eval plan says otherwise.
- [ ] Confirm the operator will not claim artifacts until evidence exists.

### 3. Execute the selected official path

For Route A — Claude Desktop Connector path:

- [ ] Follow upstream official Claude instructions.
- [ ] Record Claude-side actions separately from Blender-side actions when possible.
- [ ] Record prompts, connector actions, accepted permissions, scene edits, preview/render actions, and export actions.
- [ ] Record generated file paths and visible evidence when produced.
- [ ] Record caveats about UI state, connector availability, session continuity, permissions, or incomplete exports.

For Route B — Official MCP path for non-Claude Desktop agents:

- [ ] Follow upstream official Blender instructions and the target agent's current MCP documentation.
- [ ] Record the specific agent name, config source, transport assumptions, and approval flow.
- [ ] Record setup state without claiming setup was performed unless it was performed during this eval.
- [ ] Record every MCP action, tool call, or agent action.
- [ ] Record file paths for generated Blender files, preview/render files, and GLB/export files when produced.
- [ ] Record connector/session caveats, permissions, crashes, missing tools, or ambiguous behavior.

For Route C — Official Blender CLI path:

- [ ] Follow upstream official Blender CLI documentation.
- [ ] Record the exact command line used, including executable path style, input files, output paths, and flags.
- [ ] Record whether commands were reference-only, dry-run, or actual runtime execution.
- [ ] Capture command output, exit status, logs, and validation notes.
- [ ] Record caveats about platform differences, path quoting, missing Blender installation, missing input file, or unsupported flags.

### 4. Capture evidence

- [ ] List every generated output file path, file type, and creation context.
- [ ] If no file was produced, record `Not Produced`.
- [ ] Capture preview/render evidence or clear capture notes.
- [ ] If no preview/render evidence exists, record `Not Produced`.
- [ ] Capture GLB/export evidence when export is in scope.
- [ ] If no GLB/export evidence exists, record `Not Produced`.
- [ ] Record validation notes for scene structure, materials, lighting, scale, camera, naming, user-facing artifact checks, and web handoff checks as applicable.
- [ ] Record failures, missing setup, environment limitations, partial runs, warnings, and unknowns.

### 5. Assign artifact truth labels

Use these labels exactly:

| Label | Meaning | Allowed claim |
|---|---|---|
| `Not Run` | No runtime attempt was made. | Planning or criteria only. |
| `Attempted` | A runtime path was tried, but required output evidence is incomplete or blocked. | Attempt details only, no success claim. |
| `Produced` | A file or visible output was created, but it has not passed validation. | Output exists, not verified. |
| `Verified` | Output exists and passed the stated validation checks. | Evidence-backed success for the scoped eval only. |
| `Failed` | The attempt did not meet the stated criteria. | Failure result with notes. |

Artifact labels must be scoped per artifact type. A run can be `Verified` for preview evidence and `Failed` for GLB export, or `Produced` for files but `Attempted` for full workflow success.

### 6. Assign final verdict

- [ ] Use the pass/warn/fail rubric below.
- [ ] Keep blocked environment cases as `Blocked / Not Run` unless an official runtime attempt was actually made and failed.
- [ ] Do not claim runtime compatibility is confirmed unless the specific scoped eval passes with evidence.
- [ ] Do not mark broader Phase 3 or runtime manual eval complete based on packet preparation.

---

## Evidence capture table

Use this table in the future eval record.

| Evidence field | Requirement | Captured value |
|---|---|---|
| Runtime path used | Name the official path used, plus source link and date checked. |  |
| Commands/actions executed | List the exact commands, UI actions, connector actions, or agent actions performed. |  |
| Generated files | List every output file path, file type, and creation context. If none were produced, say `Not Produced`. |  |
| Preview/render evidence | Provide screenshot, render file, preview image, or clear capture notes. If not captured, say `Not Produced`. |  |
| GLB/export evidence | Provide exported file path and export notes when GLB is expected. If not exported, say `Not Produced`. |  |
| Validation notes | Record scene-quality checks, user-facing artifact checks, and web handoff checks. |  |
| Failure/caveat log | Record errors, missing setup, environment limitations, partial runs, warnings, and unknowns. |  |

> [!WARNING]
> A transcript alone is not enough for runtime success. Success requires concrete artifact evidence or explicit proof of the runtime action being evaluated.

---

## Artifact truth table

| Artifact or action | Not Run | Attempted | Produced | Verified | Failed | Notes |
|---|---|---|---|---|---|---|
| Official source checked |  |  |  |  |  |  |
| Runtime path setup state recorded |  |  |  |  |  |  |
| Prompt or recipe submitted |  |  |  |  |  |  |
| Actions or commands recorded |  |  |  |  |  |  |
| Blender scene file |  |  |  |  |  |  |
| Preview/render evidence |  |  |  |  |  |  |
| GLB/export evidence |  |  |  |  |  |  |
| Validation notes |  |  |  |  |  |  |
| User-facing response quality notes |  |  |  |  |  |  |
| Cleanup completed |  |  |  |  |  |  |

---

## Pass, warn, fail rubric

| Verdict | Required condition |
|---|---|
| Pass | Official runtime path is identified, actions are recorded, expected outputs are produced, required preview/render and GLB/export evidence is present when in scope, validation notes are complete, and caveats do not block the scoped objective. |
| Warn | Runtime path is official and some evidence exists, but one or more non-blocking caveats remain, such as environment-specific setup notes, partial artifact coverage, limited validation depth, or unclear upstream behavior. |
| Fail | Runtime path is not official, required evidence is missing, the runtime cannot complete the scoped objective, generated artifacts are absent when required, or validation finds blocking quality/safety issues. |
| Blocked / Not Run | The environment cannot run the selected official path, or execution was not attempted. No runtime success claim is allowed. |

---

## Rollback and cleanup checklist

Record cleanup actions after the eval:

- [ ] Close Blender and related connector sessions, if opened.
- [ ] Stop any runtime session started for the eval.
- [ ] Save logs and screenshots needed for evidence before deleting temporary files.
- [ ] Move intended eval artifacts to the planned output directory.
- [ ] Mark temporary files that should not be kept.
- [ ] Delete temporary files only after evidence is captured.
- [ ] Record any files intentionally retained.
- [ ] Record any files intentionally deleted.
- [ ] Confirm no repository docs claim runtime success unless the eval record supports it.
- [ ] Confirm preview/render/GLB claims match recorded evidence.
- [ ] Confirm caveats and failures are still visible in the eval record.

---

## Blank result template for a future eval record

Copy this template into a future runtime eval result record.

```md
# Official Runtime Manual Eval Result, Draft v0

| Field | Value |
|---|---|
| Date |  |
| Operator |  |
| Environment |  |
| Runtime path used |  |
| Prompt/recipe used |  |
| Actions executed |  |
| Files generated | Not Produced |
| Preview/render status | Not Produced |
| GLB/export status | Not Produced |
| Validation notes |  |
| User-facing response quality |  |
| Caveats/failures |  |
| Final verdict | Blocked / Not Run |
```

---

## Current Draft v0 decision

> [!WARNING]
> Current status remains packet prepared only. Runtime evals must stay `Not Run`, `Not Produced`, or `Blocked / Not Run` until an official runtime path is actually executed and the required evidence is recorded.
