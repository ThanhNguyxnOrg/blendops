# 🧪 Eval Result: Manual Install Beta v0

Status: Executed / Dry-run / No runtime / No global config writes  
Verdict: Warn  
Date: 2026-04-29

> [!WARNING]
> This eval is a dry-run install beta. Blender was not installed or run, official runtime execution was not attempted, and preview/render/GLB artifacts were Not Produced.

---

## Verdict block

| Decision | Value |
|---|---|
| Overall verdict | **Warn** |
| Release impact | Supports Draft v0 review only |
| Runtime status | Not Run |
| Artifact status | Not Produced |
| Global config writes | None |
| Conservative release signal | Do not treat as full Pass |

**Summary:** install flow is usable and safe in dry-run mode. Native-path certainty and mode-selection wording should keep improving before broader beta rollout.

---

## Purpose

Validate BlendOps install/adoption flow from a user and agent perspective in disposable project-local contexts.

---

## Scope

| Scope item | Included | Notes |
|---|---|---|
| generic-root project-local install | Yes | Fallback path tested in disposable fixture. |
| Claude Code project-local fallback install | Yes | Safe fallback tested, native-path certainty still environment-dependent. |
| Claude app/Desktop docs-only/reference walkthrough | Yes | Kept separate from Claude Code assumptions. |
| Blender runtime install | No | Explicit non-action. |
| Official runtime execution | No | Explicit non-action. |
| Artifact generation | No | Not Run/Not Produced. |

---

## Non-actions

- Blender was not installed.
- Blender was not run.
- Official runtime execution was not attempted.
- No preview/render/GLB artifacts were produced.
- No global user config was modified.

---

## Fixture environment

| Fixture | Purpose |
|---|---|
| `.tmp/install-dry-run/generic-root-project/` | generic-root fallback dry-run |
| `.tmp/install-dry-run/claude-code-project/` | Claude Code project-local fallback dry-run |
| `.tmp/install-dry-run/claude-app-project/` | Claude app/Desktop docs-only/reference walkthrough |

---

## Results summary

| Adapter | Scope | Result | Notes |
|---|---|---|---|
| generic-root | project-local fallback | Pass | BLENDOPS.md fallback worked with clear rollback. |
| claude-code | project-local fallback | Warn | Safe fallback used; native-path certainty remains environment-dependent. |
| claude-app | docs-only/reference + project-local instruction | Pass | Kept separate from Claude Code; no `.claude/skills` assumption. |

---

## Pass/Warn/Fail criteria checks

| Criteria | Result | Evidence |
|---|---|---|
| No global config writes | Pass | Dry-run reports show project-local file writes only. |
| No Blender runtime install/run | Pass | Explicit Non-actions section + fixture-only outputs. |
| No artifact overclaims | Pass | All artifact statuses in dry-run report are Not Run/Not Produced. |
| Rollback clarity | Pass | Each fixture report includes concrete rollback steps. |
| First-use prompt clarity | Pass | Prompts explicitly forbid runtime/artifact overclaims. |
| Non-Blender-user friendliness | Warn | Mostly clear; native-path ambiguity wording still needs periodic tuning. |

---

## Evidence table

| Evidence item | Status | Location |
|---|---|---|
| Generic-root fixture report | Present | `.tmp/install-dry-run/generic-root-project/DRY_RUN_REPORT.md` |
| Claude Code fixture report | Present | `.tmp/install-dry-run/claude-code-project/DRY_RUN_REPORT.md` |
| Claude app fixture report | Present | `.tmp/install-dry-run/claude-app-project/DRY_RUN_REPORT.md` |
| Root fallback entrypoint | Present | `.tmp/install-dry-run/generic-root-project/BLENDOPS.md` |
| Claude Code fallback entrypoint | Present | `.tmp/install-dry-run/claude-code-project/CLAUDE.md` |
| Claude app project instructions | Present | `.tmp/install-dry-run/claude-app-project/PROJECT_INSTRUCTIONS.md` |

---

## Result table

| Question | Result | Confidence |
|---|---|---|
| Can a project-local fallback install be explained and rolled back? | Pass | Dry-run evidence present. |
| Can Claude Code be handled without unsafe native-path claims? | Warn | Safe fallback used, but path confidence remains environment-dependent. |
| Can Claude app/Desktop stay separate from Claude Code assumptions? | Pass | Docs-only/reference walkthrough kept separate. |
| Were runtime or artifacts claimed? | Pass | Non-actions and Not Run/Not Produced language preserved. |

---

## Warnings

1. Claude Code native install path confidence remains environment-dependent.
2. Users may still confuse docs-only/reference mode vs generic-root fallback.
3. Rollback details are good, but should remain mandatory in all adapter outputs.
4. Manual install beta verdict remains Warn, not full Pass.

---

## Blockers

| Blocker | Status | Notes |
|---|---|---|
| Official runtime manual eval | Blocked / Not Run | Not part of this dry-run install beta. |
| Runtime artifact evidence | Not Produced | No preview/render/GLB artifacts were produced. |

---

## Rollback verification

Rollback instructions were validated at checklist level for each fixture:

- remove created project-local file(s)
- verify no unexpected additional mutations

---

## Required doc follow-ups

- Keep adapter fallback decision wording explicit in `docs/install-scopes.md`.
- Keep Claude Code vs Claude app separation explicit in adapter docs.
- Preserve no-runtime/no-global-config constraints in all install prompts.

---

## Final verdict

**Warn**: install flow is usable and safe in dry-run mode. Native-path certainty and mode-selection wording should keep improving before broader beta rollout.
