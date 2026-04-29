# Official Runtime Manual Eval Packet, Draft v0

Status: Draft v0 packet only, not executed  
Date: 2026-04-29  
Source of truth: [official-runtime-verification-criteria.md](./official-runtime-verification-criteria.md)  
Readiness preflight: [runtime-availability-checklist.md](./runtime-availability-checklist.md)  
Stack decision: [../runtime-stack-strategy.md](../runtime-stack-strategy.md)

> [!CAUTION]
> This packet prepares a future manual eval. It does not install Blender, run Blender, claim official runtime compatibility, or claim preview/render/GLB artifacts were produced.

---

## Purpose

This packet gives a future operator a conservative checklist for running runtime manual evals and recording evidence.

The packet exists so BlendOps can keep Draft v0 status honest while preparing for runtime verification. A future result can only move from planned work to an evidence-backed result when it follows the criteria in the source document and records enough proof for review.

---

## Scope

This packet covers manual eval preparation for the stacks in [runtime-stack-strategy.md](../runtime-stack-strategy.md):

1. Stack 1 — Claude Desktop official connector stack.
2. Stack 2 — Official Blender CLI fallback.
3. Stack 3 — Optional unofficial third-party bridge stack.

Stack 1 is the only official connector stack currently verified, based on read-only smoke evidence. Stack 2 is official and deterministic, but less interactive than the connector stack. Stack 3 is unofficial, user-managed, experimental/local only, and excluded from official release-eval evidence unless a future policy creates a separate local/experimental evidence category.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

The operator must choose one stack per eval record unless the test plan explicitly compares stacks. Each stack needs its own evidence notes, artifact labels, and final verdict.

This packet covers:

- environment capture
- official/upstream source capture
- operator steps
- artifact evidence rules
- pass, warn, fail rubric
- rollback and cleanup notes
- future result template

---

## Run order

1. Read [../runtime-stack-strategy.md](../runtime-stack-strategy.md) and select the intended stack.
2. Prefer Stack 1 for the first real runtime eval because read-only connector smoke evidence exists.
3. Complete [runtime-availability-checklist.md](./runtime-availability-checklist.md) in the runtime environment.
4. If Stack 1 fails during mutation, render, or export, use Stack 2 as the next official fallback stack to test.
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
- The selected runtime stack is named and its release-eval status is understood.
- The current upstream instructions were checked on the eval date.
- The eval environment is allowed to run Blender and produce files.
- Output paths are known before execution.
- Evidence capture is available for screenshots, logs, generated files, and notes.
- The operator understands that missing evidence keeps the result at `Attempted`, `Not Run`, `Not Produced`, `Blocked / Not Run`, or `Failed`, depending on what happened.

---

## Runtime stacks to test

| Runtime stack | Eval use | Source requirement | Evidence focus |
|---|---|---|---|
| Stack 1 — Claude Desktop official connector stack | Preferred first real runtime eval candidate because read-only smoke evidence exists. | Use upstream Claude tutorial, official Blender MCP project/page, and current official instructions checked on the eval date. | Claude Desktop connector actions, Blender-side official MCP bridge/add-on actions, prompts, permissions, generated files, preview/render evidence, GLB/export evidence, user-facing clarity. |
| Stack 2 — Official Blender CLI fallback | Next official fallback if Stack 1 fails or is unavailable. | Use upstream Blender manual CLI documentation checked on the eval date. | Exact command line, script/input, output folder, generated files, exit status, logs, preview/render evidence, GLB/export evidence, platform caveats. |
| Stack 3 — Optional unofficial third-party bridge stack | Local experimental/user-managed only; not official release-eval evidence. | Use upstream third-party repo checked on the eval date; do not copy full install docs into BlendOps. | Client-specific config, third-party server/add-on state, host/port, arbitrary Python/code execution risk, generated files if any, and clear local/experimental caveats. |

> [!IMPORTANT]
> Exact setup commands, versions, UI labels, and runtime behavior must come from upstream documentation at execution time. BlendOps must not invent install steps or imply setup happened in this repository.

---

## Environment capture checklist

Record these fields before running an eval:

- [ ] Eval date
- [ ] Operator name or handle
- [ ] Operating system and version
- [ ] Hardware notes relevant to Blender, if known
- [ ] Blender version, if installed
- [ ] Selected runtime stack
- [ ] Upstream source URL(s)
- [ ] Date upstream source was checked
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
- [ ] Name the selected runtime stack.
- [ ] Link the upstream source(s).
- [ ] Record the date upstream source(s) were checked.
- [ ] Record the environment capture checklist.
- [ ] Record the prompt or recipe that will be used.
- [ ] Record expected outputs and which artifact types are in scope.

### 2. Confirm boundaries before execution

- [ ] Confirm this is a runtime eval, not an install dry-run.
- [ ] Confirm the selected stack is allowed for the intended evidence category.
- [ ] Confirm no custom BlendOps runtime implementation is being introduced.
- [ ] Confirm output paths are outside docs unless the eval plan says otherwise.
- [ ] Confirm the operator will not claim artifacts until evidence exists.

### 3. Execute the selected stack

For Stack 1 — Claude Desktop official connector stack:

- [ ] Follow upstream official Claude instructions and official Blender MCP bridge/add-on instructions.
- [ ] Confirm the official Blender MCP bridge/add-on is installed/enabled in Blender.
- [ ] Start **MCP Bridge Server**, **Connect to Claude**, or the equivalent official Blender-side server control.
- [ ] Record the host/port shown by the add-on when shown, commonly `localhost:9876`.
- [ ] Run a read-only connector smoke test before mutation.
- [ ] Record Claude-side actions separately from Blender-side actions when possible.
- [ ] Record prompts, connector actions, accepted permissions, scene edits, preview/render actions, and export actions.
- [ ] Record generated file paths and visible evidence when produced.
- [ ] Record caveats about UI state, connector availability, session continuity, permissions, or incomplete exports.

For Stack 2 — Official Blender CLI fallback:

- [ ] Follow upstream official Blender CLI documentation.
- [ ] Record the exact command line used, including executable path style, input files, output paths, and flags.
- [ ] Record the script/input used.
- [ ] Record whether commands were reference-only, dry-run, or actual runtime execution.
- [ ] Capture command output, exit status, logs, generated files, and validation notes.
- [ ] Record caveats about platform differences, path quoting, missing Blender installation, missing input file, or unsupported flags.

For Stack 3 — Optional unofficial bridge stack:

- [ ] Confirm the user knowingly chose unofficial, user-managed, experimental/local operation.
- [ ] Follow upstream third-party instructions without copying them into BlendOps.
- [ ] Configure each MCP client separately; do not assume Claude Desktop config applies to Claude Code/OpenCode/Cursor.
- [ ] Record the third-party server and third-party Blender add-on/socket bridge used.
- [ ] Record host/port and confirm it does not conflict with another bridge server, commonly `localhost:9876`.
- [ ] Record arbitrary Blender Python/code execution risks and user acceptance.
- [ ] Keep any result separate from BlendOps official release-eval evidence.

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
- [ ] Keep blocked environment cases as `Blocked / Not Run` unless a runtime attempt was actually made and failed.
- [ ] Do not claim runtime compatibility is confirmed unless the specific scoped eval passes with evidence.
- [ ] Do not mark broader Phase 3 or runtime manual eval complete based on packet preparation.

---

## Evidence capture table

Use this table in the future eval record.

| Evidence field | Requirement | Captured value |
|---|---|---|
| Runtime stack used | Name the stack used, plus source link(s) and date checked. |  |
| Commands/actions executed | List the exact commands, UI actions, connector actions, or agent actions performed. |  |
| Generated files | List every output file path, file type, and creation context. If none were produced, say `Not Produced`. |  |
| Preview/render evidence | Provide screenshot, render file, preview image, or clear capture notes. If not captured, say `Not Produced`. |  |
| GLB/export evidence | Provide exported file path and export notes when GLB is expected. If not exported, say `Not Produced`. |  |
| Validation notes | Record scene-quality checks, user-facing artifact checks, and web handoff checks. |  |
| Failure/caveat log | Record errors, missing setup, environment limitations, partial runs, warnings, and unknowns. |  |

---

## Future research guard

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

Do not use this packet to claim direct official MCP support for those agents unless a future policy, source-backed setup record, and local eval evidence explicitly add that scope.
