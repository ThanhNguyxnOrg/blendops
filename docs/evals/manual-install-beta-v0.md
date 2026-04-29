# Eval Result: Manual Install Beta v0

Status: Executed / Dry-run / No runtime / No global config writes
Date: 2026-04-29

## Purpose

Validate BlendOps install/adoption flow from user/agent perspective in disposable project-local contexts.

## Scope

- generic-root project-local install
- Claude Code project-local fallback install
- Claude app/Desktop docs-only/reference walkthrough

## Non-actions

- Blender was not installed.
- Blender was not run.
- Official runtime execution was not attempted.
- No preview/render/GLB artifacts were produced.
- No global user config was modified.

## Fixture environment

Fixtures (disposable):
- `.tmp/install-dry-run/generic-root-project/`
- `.tmp/install-dry-run/claude-code-project/`
- `.tmp/install-dry-run/claude-app-project/`

## Results summary

| Adapter | Scope | Result | Notes |
|---|---|---|---|
| generic-root | project-local fallback | Pass | BLENDOPS.md fallback worked with clear rollback |
| claude-code | project-local fallback | Warn | Safe fallback used; native-path certainty remains environment-dependent |
| claude-app | docs-only/reference + project-local instruction | Pass | Kept separate from Claude Code; no `.claude/skills` assumption |

## Pass/Warn/Fail criteria checks

| Criteria | Result | Evidence |
|---|---|---|
| No global config writes | Pass | dry-run reports show project-local file writes only |
| No Blender runtime install/run | Pass | explicit Non-actions section + fixture-only outputs |
| No artifact overclaims | Pass | all artifact statuses in dry-run report are Not Run/Not Produced |
| Rollback clarity | Pass | each fixture report includes concrete rollback steps |
| First-use prompt clarity | Pass | prompts explicitly forbid runtime/artifact overclaims |
| Non-Blender-user friendliness | Warn | mostly clear; native-path ambiguity wording still needs periodic tuning |

## Evidence table

| Evidence item | Status | Location |
|---|---|---|
| Generic-root fixture report | Present | `.tmp/install-dry-run/generic-root-project/DRY_RUN_REPORT.md` |
| Claude Code fixture report | Present | `.tmp/install-dry-run/claude-code-project/DRY_RUN_REPORT.md` |
| Claude app fixture report | Present | `.tmp/install-dry-run/claude-app-project/DRY_RUN_REPORT.md` |
| Root fallback entrypoint | Present | `.tmp/install-dry-run/generic-root-project/BLENDOPS.md` |
| Claude Code fallback entrypoint | Present | `.tmp/install-dry-run/claude-code-project/CLAUDE.md` |
| Claude app project instructions | Present | `.tmp/install-dry-run/claude-app-project/PROJECT_INSTRUCTIONS.md` |

## Friction findings

1. Claude Code native install path confidence remains environment-dependent.
2. Users may still confuse docs-only/reference mode vs generic-root fallback.
3. Rollback details are good, but should remain mandatory in all adapter outputs.

## Rollback verification

Rollback instructions were validated at checklist level for each fixture:
- remove created project-local file(s)
- verify no unexpected additional mutations

## Verdict

**Warn** — install flow is usable and safe in dry-run mode; native-path certainty and mode-selection wording should keep improving before broader beta rollout.

## Required doc follow-ups

- Keep adapter fallback decision wording explicit in `docs/install-scopes.md`.
- Keep Claude Code vs Claude app separation explicit in adapter docs.
- Preserve no-runtime/no-global-config constraints in all install prompts.
