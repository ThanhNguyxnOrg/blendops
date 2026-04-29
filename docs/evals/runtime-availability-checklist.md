# Runtime Availability Checklist, Draft v0

Status: Draft v0 readiness checklist only, not executed  
Date: 2026-04-29  
Related packet: [official-runtime-manual-eval-packet.md](./official-runtime-manual-eval-packet.md)  
Related criteria: [official-runtime-verification-criteria.md](./official-runtime-verification-criteria.md)

> [!CAUTION]
> This checklist does not prove runtime success. It only proves readiness to attempt an eval. It does not install Blender, run Blender, claim official runtime compatibility, or claim preview/render/GLB artifacts were produced.

---

## Purpose

This checklist gives a future operator a conservative preflight for deciding whether a manual runtime eval can be attempted.

Use it before the manual eval packet. Record readiness only. Do not convert readiness into runtime results.

---

## Status values

Use these values exactly.

| Status | Meaning |
|---|---|
| `Available` | The path, tool, folder, evidence method, or prerequisite is present and ready to use for an eval attempt. |
| `Missing` | The item is absent or cannot be reached. |
| `Unknown` | The operator cannot determine the state from available evidence. |
| `Not Tested` | The operator intentionally did not test this item during readiness review. |
| `Blocked` | The item cannot be checked or used because another prerequisite, permission, environment rule, or official path is unavailable. |

---

## Readiness rule

A completed checklist can only support this claim:

```txt
The environment appears ready, or not ready, to attempt a scoped runtime eval.
```

It cannot support these claims:

- Blender runtime succeeded.
- Official runtime compatibility is confirmed.
- A preview/render artifact exists.
- A GLB/export artifact exists.
- Runtime manual eval is complete.
- Draft v0 is stable or production-ready.
- A draft tag is ready.

---

## Required readiness table

Fill one row per check. Add notes for every `Missing`, `Unknown`, `Not Tested`, or `Blocked` status.

| Area | Check | Status | Evidence or notes |
|---|---|---|---|
| System environment capture | Operating system and version captured. | Unknown |  |
| System environment capture | Hardware notes relevant to Blender captured, if known. | Unknown |  |
| System environment capture | Working directory captured. | Unknown |  |
| System environment capture | Permission limits and network limits captured, if relevant. | Unknown |  |
| Blender app availability | Blender application path or launch method identified from the local system. | Unknown |  |
| Blender app availability | Blender version captured, if available without changing setup. | Unknown |  |
| Blender app availability | Operator confirms the environment is allowed to run Blender during the future eval. | Unknown |  |
| Stack 1 — Claude Desktop official connector stack | Claude Desktop Blender Connector setup source is available from upstream Claude instructions. | Unknown |  |
| Stack 1 — Claude Desktop official connector stack | Official Blender MCP bridge/add-on setup source is available from upstream Blender instructions. | Unknown |  |
| Stack 1 — Claude Desktop official connector stack | Connector setup state is known for this machine or session. | Unknown |  |
| Stack 1 — Claude Desktop official connector stack | Read-only connector smoke test can be recorded before mutation/render/export. | Unknown |  |
| Stack 1 — Claude Desktop official connector stack | Claude-side and Blender-side actions can be recorded separately when possible. | Unknown |  |
| Stack 2 — Official Blender CLI fallback | Official Blender CLI reference is available from upstream Blender manual docs. | Unknown |  |
| Stack 2 — Official Blender CLI fallback | Blender executable path style is known for this machine. | Unknown |  |
| Stack 2 — Official Blender CLI fallback | Exact command, script/input, output folder, generated files, exit status, and logs can be captured if CLI is selected. | Unknown |  |
| Stack 3 — Optional unofficial third-party bridge stack | User explicitly chose a third-party local experiment and accepted it is not release-eval evidence. | Unknown |  |
| Stack 3 — Optional unofficial bridge stack | Upstream third-party docs are linked without copying install steps. | Unknown |  |
| Stack 3 — Optional unofficial bridge stack | Host/port conflicts and arbitrary Blender Python/code execution risks are understood. | Unknown |  |
| Future research / unverified | Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini remains unverified and unsupported. | Unknown |  |
| Project workspace readiness | Repository workspace is available for reading docs and eval instructions. | Unknown |  |
| Project workspace readiness | Runtime eval output paths are planned outside docs unless the eval plan says otherwise. | Unknown |  |
| Project workspace readiness | The selected recipe, prompt, or eval scope is named before execution. | Unknown |  |
| Artifact output folder readiness | Planned output folder exists or can be created during the future eval. | Unknown |  |
| Artifact output folder readiness | Planned filenames or naming convention are known before execution. | Unknown |  |
| Artifact output folder readiness | Cleanup ownership is clear for generated files. | Unknown |  |
| Evidence capture readiness | Screenshot or visible-output capture method is available. | Unknown |  |
| Evidence capture readiness | Log capture method is available. | Unknown |  |
| Evidence capture readiness | Generated file paths can be recorded. | Unknown |  |
| Evidence capture readiness | Preview/render evidence can be saved or explicitly marked `Not Produced`. | Unknown |  |
| Evidence capture readiness | GLB/export evidence can be saved or explicitly marked `Not Produced`. | Unknown |  |
| Rollback/cleanup readiness | Temporary output cleanup plan is known. | Unknown |  |
| Rollback/cleanup readiness | Connector, MCP, or CLI session cleanup steps are known if they are used. | Unknown |  |
| Rollback/cleanup readiness | The operator can leave the repository without generated runtime artifacts unless evidence records intentionally reference them. | Unknown |  |
| Safety/non-actions reminders | Operator confirms no unsupported official-direct-MCP route will be used. | Unknown |  |
| Safety/non-actions reminders | Operator confirms no unofficial third-party stack will be counted as release-eval evidence. | Unknown |  |
| Safety/non-actions reminders | Operator confirms no preview/render/GLB claim will be made without evidence. | Unknown |  |
| Safety/non-actions reminders | Operator confirms this checklist will not mark runtime eval complete. | Unknown |  |

---

## Stack selection guidance

Choose one intended stack before attempting a manual eval. For the first real runtime eval, prefer Stack 1 because read-only connector smoke evidence exists.

| Intended stack | Minimum readiness before proceeding | If unavailable |
|---|---|---|
| Stack 1 — Claude Desktop official connector stack | Blender app availability is `Available`, Claude Desktop connector source is `Available`, official Blender MCP bridge/add-on source is `Available`, connector state is known, project workspace is `Available`, output folder is `Available`, evidence capture is `Available`, and cleanup is `Available`. | Mark connector rows `Missing`, `Unknown`, or `Blocked`. Do not run a fallback unofficial connector as release evidence. |
| Stack 2 — Official Blender CLI fallback | Blender app availability is `Available`, official CLI reference is `Available`, executable path style is known, exact commands/script/input/output paths can be recorded, project workspace is `Available`, output folder is `Available`, evidence capture is `Available`, and cleanup is `Available`. | Mark CLI rows `Missing`, `Unknown`, or `Blocked`. Do not treat CLI-only readiness as connector or MCP readiness. |
| Stack 3 — Optional unofficial third-party bridge stack | User knowingly chooses third-party local experiment; upstream third-party docs are linked; client-specific config, third-party server/add-on, host/port, and security risks are understood. | Keep it out of release evidence. If not chosen, mark `Not Tested`. |

If Stack 1 fails during mutation, render, or export, Stack 2 is the next official fallback to test. If only Blender CLI is available, mark connector paths `Not Tested` or `Blocked`. A CLI-only path may support a scoped CLI eval attempt, but it does not prove connector or MCP availability.

---

## Readiness outcome

When all required paths for the selected official stack are `Available`, proceed to [official-runtime-manual-eval-packet.md](./official-runtime-manual-eval-packet.md) and [runtime-stack-strategy.md](../runtime-stack-strategy.md).

If the official connector stack is missing, do not run fallback unofficial MCP tooling as release evidence. Record the missing path and keep the eval blocked or scoped to Stack 2.

If only Blender CLI is available, continue only with Stack 2. Mark Connector/MCP paths `Not Tested` or `Blocked`, and do not imply connector or MCP coverage.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

Do not claim preview/render/GLB output unless evidence exists in the eval record. If no output exists, record `Not Produced`.

---

## Non-actions preserved

- This checklist does not install Blender.
- This checklist does not run Blender.
- This checklist does not create, claim, or validate preview/render/GLB artifacts.
- This checklist does not introduce a custom runtime implementation.
- This checklist does not claim runtime compatibility is confirmed.
- This checklist does not mark official runtime manual eval complete.
- This checklist does not move BlendOps out of Draft v0.
- This checklist does not prepare or claim a draft tag.

---

## Current Draft v0 decision

> [!WARNING]
> Current status remains readiness checklist prepared only. Runtime evals must stay `Not Run`, `Not Produced`, or `Blocked / Not Run` until an official runtime path is actually executed and the required evidence is recorded.
