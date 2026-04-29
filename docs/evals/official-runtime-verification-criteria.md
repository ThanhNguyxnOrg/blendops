# Official Runtime Verification Criteria, Draft v0

Status: Draft v0 criteria only, not executed  
Date: 2026-04-29

> [!CAUTION]
> This document defines criteria for future runtime evals. It does not claim Blender was run, does not claim runtime success, and does not claim preview/render/GLB artifacts were produced.

---

## Purpose

BlendOps needs a conservative way to decide when a runtime eval can move from planned work to an evidence-backed runtime result.

This document defines the minimum criteria for the public 3-stack model:

1. Stack 1 — Claude Desktop official connector stack.
2. Stack 2 — Official Blender CLI fallback.
3. Stack 3 — Optional unofficial third-party bridge stack.

Stack 1 is the only official connector stack currently verified, based on read-only smoke evidence. Stack 2 is official and deterministic, but full CLI eval is still `Not Run`. Stack 3 is optional, unofficial, user-managed, and excluded from BlendOps official release-eval evidence.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

---

## Runtime stance

BlendOps recognizes these runtime stacks for public guidance:

| Runtime stack | Status in Draft v0 | Source stance |
|---|---|---|
| Stack 1 — Claude Desktop official connector stack | Only official connector stack currently verified for read-only smoke access | Use upstream Claude tutorial plus official Blender MCP project/page for the required Blender-side bridge/add-on. |
| Stack 2 — Official Blender CLI fallback | Official deterministic fallback; full CLI eval `Not Run` | Use upstream Blender manual CLI documentation. |
| Stack 3 — Optional unofficial third-party bridge stack | Optional / unofficial / user-managed / experimental-local; not release-eval evidence | Link upstream third-party repo only; do not copy or own its install docs. |

> [!IMPORTANT]
> Exact setup commands, versions, UI labels, and runtime behavior must come from upstream documentation at execution time. BlendOps must not invent install steps or imply that runtime setup happened in this repository.

---

## Required evidence before runtime success can be claimed

An eval may claim runtime success only when its record includes all required evidence below.

| Evidence field | Requirement |
|---|---|
| Runtime stack used | Name the stack used, plus source link(s) and date checked. |
| Commands/actions executed | List the exact commands, UI actions, connector actions, or agent actions performed. |
| Generated files | List every output file path, file type, and creation context. If none were produced, say `Not Produced`. |
| Preview/render evidence | Provide screenshot, render file, preview image, or clear capture notes. If not captured, say `Not Produced`. |
| GLB/export evidence | Provide exported file path and export notes when GLB is expected. If not exported, say `Not Produced`. |
| Validation notes | Record scene-quality checks, user-facing artifact checks, and web handoff checks. |
| Failure/caveat log | Record errors, missing setup, environment limitations, partial runs, warnings, and unknowns. |

> [!WARNING]
> A transcript alone is not enough for runtime success. Success requires concrete artifact evidence or explicit proof of the runtime action that was being evaluated.

---

## Artifact truth rules

Use these labels exactly when recording runtime and artifact state.

| Label | Meaning | Allowed claim |
|---|---|---|
| `Not Run` | No runtime attempt was made. | Planning or criteria only. |
| `Attempted` | A runtime path was tried, but required output evidence is incomplete or blocked. | Attempt details only, no success claim. |
| `Produced` | A file or visible output was created, but it has not passed validation. | Output exists, not verified. |
| `Verified` | Output exists and passed the stated validation checks. | Evidence-backed success for the scoped eval only. |
| `Failed` | The attempt did not meet the stated criteria. | Failure result with notes. |

Artifact labels must be scoped per artifact type. A run can be `Verified` for preview evidence and `Failed` for GLB export, or `Produced` for files but `Attempted` for full workflow success.

> [!IMPORTANT]
> Do not upgrade `Produced` to `Verified` without validation notes. Do not upgrade `Attempted` to `Produced` without generated file or visible output evidence.

---

## Pass, Warn, Fail criteria

| Verdict | Required condition |
|---|---|
| Pass | Runtime stack is identified, actions are recorded, expected outputs are produced, required preview/render and GLB/export evidence is present when in scope, validation notes are complete, and caveats do not block the scoped objective. |
| Warn | Runtime stack is allowed for the evidence category and some evidence exists, but one or more non-blocking caveats remain, such as environment-specific setup notes, partial artifact coverage, limited validation depth, or unclear upstream behavior. |
| Fail | Runtime stack is unsupported for the claimed evidence category, required evidence is missing, the runtime cannot complete the scoped objective, generated artifacts are absent when required, or validation finds blocking quality/safety issues. |

A blocked environment should normally remain `Blocked / Not Run`, not Fail, unless a runtime attempt was actually made and failed.

---

## Stack-specific criteria

### 1. Stack 1 — Claude Desktop official connector stack

Minimum criteria:

- Confirm the eval used Claude Desktop Blender Connector plus the official Blender MCP bridge/add-on running inside Blender.
- Record the date the upstream Claude tutorial and official Blender MCP source were checked.
- Record setup state without claiming setup was performed unless it was actually performed during the eval.
- Confirm a read-only connector smoke test before mutation/render/export.
- Record Claude-side actions and Blender-side actions separately when possible.
- Record prompts, connector actions, accepted permissions, scene edits, preview/render actions, and export actions.
- Save output paths and visible evidence for generated files and previews when produced.
- Capture validation notes for whether the workflow stayed understandable for a non-Blender user.
- Record caveats about UI state, connector availability, session continuity, permissions, or incomplete exports.

Pass requires a complete official connector run with artifact evidence and validation notes for the scoped recipe.

Warn applies when the connector works but the eval leaves limited evidence, environment-specific caveats, or non-blocking export gaps.

Fail applies when connector execution cannot complete the scoped objective, required artifacts are missing, or evidence cannot support the claim.

### 2. Stack 2 — Official Blender CLI fallback

Minimum criteria:

- Confirm the eval used the official Blender CLI reference from the upstream Blender manual.
- Record the date the CLI reference was checked.
- Record the exact command line used, including Blender executable path style, input files, output paths, and flags.
- Record the script/input used.
- Record whether commands were reference-only, dry-run, or actual runtime execution.
- Save generated output paths for render, preview, Blender file, and GLB/export artifacts when produced.
- Capture command output, exit status, logs, and validation notes.
- Record caveats about platform differences, path quoting, missing Blender installation, missing input file, or unsupported flags.

Pass requires a successful official CLI runtime command with expected outputs, validation notes, and no blocking caveats.

Warn applies when the CLI path produces partial evidence or needs environment-specific notes that do not block the scoped objective.

Fail applies when the CLI command fails, required outputs are absent, or evidence is insufficient.

### 3. Stack 3 — Optional unofficial bridge stack

Minimum criteria for local experimental records only:

- Confirm the user knowingly chose unofficial, user-managed, experimental/local operation.
- Link the upstream third-party repo checked on the eval date.
- Record the third-party server and third-party Blender add-on/socket bridge used.
- Record the MCP client/agent configured and note that each client needs separate configuration.
- Record host/port choices and any `localhost:9876` conflict risk.
- Record arbitrary Blender Python/code execution risk and user acceptance.
- Keep results separate from BlendOps official release-eval evidence.

Stack 3 must not be counted as official release-eval evidence. It can only produce a local/experimental note unless a future policy explicitly creates a separate evidence category.

---

## Future research guard

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

Future research may investigate specific non-Claude Desktop clients only with source-backed setup, client-specific configuration evidence, and local eval records. Until then, do not present direct official MCP as a selectable user route.

---

## Evidence record template

Use this template in future runtime eval records.

```md
## Runtime evidence

| Field | Value |
|---|---|
| Runtime stack used | Not Run |
| Source checked | Not Run |
| Date checked | Not Run |
| Environment | Not Run |
| Commands/actions executed | Not Run |
| Generated files | Not Produced |
| Preview/render evidence | Not Produced |
| GLB/export evidence | Not Produced |
| Validation notes | Not Run |
| Failure/caveat log | Not Run |
| Artifact truth labels | Not Run |
| Verdict | Blocked / Not Run |
```

---

## Non-actions preserved

- This criteria document does not install Blender.
- This criteria document does not run Blender.
- This criteria document does not claim official runtime success.
- This criteria document does not claim generated preview/render/GLB artifacts exist.
- This criteria document does not introduce non-official runtime install strategies as official setup.
- This criteria document does not mark Phase 3 complete.

---

## Current Draft v0 decision

> [!WARNING]
> Current status remains criteria prepared only. Runtime evals must stay `Not Run`, `Not Produced`, or `Blocked / Not Run` until an allowed runtime stack is actually executed and the required evidence is recorded.
