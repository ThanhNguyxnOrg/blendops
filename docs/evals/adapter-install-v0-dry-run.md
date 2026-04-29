# Eval Result: Adapter Install v0 Dry Run

Status: Executed / Dry-run / No runtime / No global config writes

## Purpose

Test whether BlendOps adapter install docs can attach the root skill collection safely across target adapter paths.

## Scope

- generic-root fixture
- Claude Code fixture
- Claude app/Desktop fixture

## Non-actions

- Blender was not installed.
- Blender was not run.
- No official runtime was executed.
- No global config was modified.
- No preview/render/GLB artifacts were produced.

## Fixtures

Disposable fixture paths (not committed as source assets):
- `.tmp/install-dry-run/generic-root-project/`
- `.tmp/install-dry-run/claude-code-project/`
- `.tmp/install-dry-run/claude-app-project/`

Fixture outputs are disposable dry-run artifacts only.

## Results summary

| Adapter | Scope | Result | Notes |
|---|---|---|---|
| generic-root | project-local fallback | Pass | Clear BLENDOPS.md entrypoint, no runtime/global side effects |
| claude-code | project-local | Warn | Used safe project-local fallback file (`CLAUDE.md`) instead of asserting native path certainty |
| claude-app | docs-only/reference + project-local instruction file | Pass | Kept Claude app distinct from Claude Code and did not assume `.claude/skills` |

## Generic-root result

- Adapter used: `docs/adapters/generic-root.md`
- Files created in fixture:
  - `BLENDOPS.md`
  - `DRY_RUN_REPORT.md`
- Entry-point behavior:
  - root fallback guide created
  - references core collection (`skills/`, `laws/`, `packs/`)
- Rollback:
  - delete `BLENDOPS.md`
  - verify no additional fixture mutations
- Verdict: Pass

## Claude Code result

- Adapter used: `docs/adapters/claude-code.md`
- Native vs fallback decision:
  - used safe project-local fallback (`CLAUDE.md`) in fixture
  - rationale: avoid overclaiming native path verification in disposable dry-run
- Files created in fixture:
  - `CLAUDE.md`
  - `DRY_RUN_REPORT.md`
- Rollback:
  - delete `CLAUDE.md`
  - verify no additional fixture mutations
- Verdict: Warn

## Claude app/Desktop result

- Adapter used: `docs/adapters/claude-app.md`
- Setup style:
  - docs-only/reference style with project-local instruction text
- Files created in fixture:
  - `PROJECT_INSTRUCTIONS.md`
  - `DRY_RUN_REPORT.md`
- Claude connector/runtime status: Not Run
- Artifact status: Not Run
- Rollback:
  - delete `PROJECT_INSTRUCTIONS.md`
  - verify no additional fixture mutations
- Verdict: Pass

## Findings

### What worked
- Adapter flow (detect -> scope -> adapter -> attach -> verify -> rollback) is usable.
- Generic-root fallback is clear and low-risk.
- Claude app/Desktop separation from Claude Code is explicit in dry-run outputs.

### What was ambiguous
- Claude Code native path confidence remains adapter-path dependent and environment-specific.
- Some users may still confuse project-local attach vs runtime readiness.

### Where docs should improve
- Add an explicit “native path confidence unresolved” response snippet in Claude Code adapter.
- Add a short “when to choose docs-only vs generic-root” table in install scopes doc.

## Required changes

Applied in this pass:
- Added native-path confidence unresolved snippet to `docs/adapters/claude-code.md`.
- Added generic-root vs docs-only quick decision table to `docs/install-scopes.md`.
- Preserved no-runtime/no-global-config boundaries while improving clarity.

## Final verdict

**Warn — usable, with minor confidence/wording refinements recommended before broad user rollout.**
