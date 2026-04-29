# Official Runtime Verification Criteria, Draft v0

Status: Draft v0 criteria only, not executed  
Date: 2026-04-29

> [!CAUTION]
> This document defines criteria for future official-runtime evals. It does not claim Blender was run, does not claim runtime success, and does not claim preview/render/GLB artifacts were produced.

---

## Purpose

BlendOps needs a conservative way to decide when an official-runtime eval can move from planned work to an evidence-backed runtime result.

This document defines the minimum criteria for three official paths:

1. Official Blender MCP Server path
2. Official Claude Blender Connector path
3. Official Blender CLI reference path

The criteria are intentionally Draft v0. They set evidence requirements before anyone can claim runtime success.

---

## Official runtime stance

BlendOps only recognizes official runtime paths for active runtime docs and evals.

| Runtime path | Status in Draft v0 | Source stance |
|---|---|---|
| Official Blender MCP Server | Candidate official runtime path | Use upstream Blender documentation and current official instructions. |
| Official Claude Blender Connector | Candidate official runtime path | Use upstream Claude tutorial and current official instructions. |
| Official Blender CLI reference | Candidate official reference path | Use upstream Blender manual CLI documentation. |

> [!IMPORTANT]
> Exact setup commands, versions, UI labels, and runtime behavior must come from upstream official documentation at execution time. BlendOps must not invent install steps or imply that runtime setup happened in this repository.

---

## Required evidence before runtime success can be claimed

An eval may claim runtime success only when its record includes all required evidence below.

| Evidence field | Requirement |
|---|---|
| Runtime path used | Name the official path used, plus source link and date checked. |
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
| Pass | Official runtime path is identified, actions are recorded, expected outputs are produced, required preview/render and GLB/export evidence is present when in scope, validation notes are complete, and caveats do not block the scoped objective. |
| Warn | Runtime path is official and some evidence exists, but one or more non-blocking caveats remain, such as environment-specific setup notes, partial artifact coverage, limited validation depth, or unclear upstream behavior. |
| Fail | Runtime path is not official, required evidence is missing, the runtime cannot complete the scoped objective, generated artifacts are absent when required, or validation finds blocking quality/safety issues. |

A blocked environment should normally remain `Blocked / Not Run`, not Fail, unless an official runtime attempt was actually made and failed.

---

## Path-specific criteria

### 1. Official Blender MCP Server path

Minimum criteria:

- Confirm the eval used the official Blender MCP Server path from upstream Blender documentation.
- Record the date the upstream official instructions were checked.
- Record setup state without claiming setup was performed unless it was actually performed during the eval.
- Record every MCP action, tool call, or agent action used to create, inspect, render, or export the scene.
- Save output paths for generated Blender files, preview/render files, and GLB/export files when produced.
- Capture validation notes for scene structure, materials, lighting, scale, camera, naming, and user-facing handoff clarity.
- Record any connector/session limitations, permissions, crashes, missing tools, or ambiguous runtime behavior.

Pass requires verified output evidence for every artifact type in scope for the eval.

Warn is acceptable when the official path runs but a non-critical artifact or validation detail is incomplete and clearly logged.

Fail applies when the path cannot perform the scoped runtime objective, outputs are missing, or the path used is not official.

### 2. Official Claude Blender Connector path

Minimum criteria:

- Confirm the eval used the official Claude Blender Connector path from upstream Claude documentation.
- Record the date the upstream official tutorial or instructions were checked.
- Record the Claude-side actions and Blender-side actions separately when possible.
- Record prompts, connector actions, accepted permissions, scene edits, preview/render actions, and export actions.
- Save output paths and visible evidence for generated files and previews when produced.
- Capture validation notes for whether the workflow stayed understandable for a non-Blender user.
- Record caveats about UI state, connector availability, session continuity, permissions, or incomplete exports.

Pass requires a complete official connector run with artifact evidence and validation notes for the scoped recipe.

Warn applies when the connector works but the eval leaves limited evidence, environment-specific caveats, or non-blocking export gaps.

Fail applies when connector execution cannot complete the scoped objective, required artifacts are missing, or evidence cannot support the claim.

### 3. Official Blender CLI reference path

Minimum criteria:

- Confirm the eval used the official Blender CLI reference from the upstream Blender manual.
- Record the date the CLI reference was checked.
- Record the exact command line used, including Blender executable path style, input files, output paths, and flags.
- Record whether commands were reference-only, dry-run, or actual runtime execution.
- Save generated output paths for render, preview, Blender file, and GLB/export artifacts when produced.
- Capture command output, exit status, logs, and validation notes.
- Record caveats about platform differences, path quoting, missing Blender installation, missing input file, or unsupported flags.

Pass requires a successful official CLI runtime command with expected outputs, validation notes, and no blocking caveats.

Warn applies when the CLI path produces partial evidence or needs environment-specific notes that do not block the scoped objective.

Fail applies when the CLI command fails, required outputs are absent, or evidence is insufficient.

---

## Evidence record template

Use this template in future runtime eval records.

```md
## Runtime evidence

| Field | Value |
|---|---|
| Runtime path used | Not Run |
| Official source checked | Not Run |
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
- This criteria document does not introduce non-official runtime install strategies.
- This criteria document does not mark Phase 3 complete.

---

## Current Draft v0 decision

> [!WARNING]
> Current status remains criteria prepared only. Runtime evals must stay `Not Run`, `Not Produced`, or `Blocked / Not Run` until an official runtime path is actually executed and the required evidence is recorded.
