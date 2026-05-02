# Cleanup Audit

Status: Completed 2026-05-02
Date: 2026-05-02

## Scope

Cleanup decisions under current official-runtime model:
- root multi-skill collection (`skills/`)
- shared guardrails (`laws/`)
- pack manifests (`packs/`)
- docs as active narrative/spec layer

## Classification legend

- **KEEP_ACTIVE**: active/canonical path
- **DELETE**: safe removal (obsolete/duplicate/generated)
- **MERGE**: duplicate semantics to consolidate over time
- **REWRITE**: keep path but revise wording/structure

## Key decisions applied

### KEEP_ACTIVE
- `README.md`
- `TODO.md`
- `package.json`, `package-lock.json`
- `.github/workflows/docs.yml`
- `docs/*` active pages
- `skills/*`, `laws/*`, `packs/*`
- `skill-reviews/*`

### DELETE (performed)
- `docs/archive/` subtree (historical runtime-era docs removed)
- `docs/reset-audit.md`
- `docs/markdown-cleanup-audit.md`
- legacy monolithic leftovers:
  - `skills/blendops/examples/*`
  - `skills/blendops/harnesses/*`
  - `skills/blendops/references/*`
- duplicate docs-level collections (2026-05-02):
  - `docs/skills/` folder and all skill spec duplicates
  - `docs/laws/` folder and all law spec duplicates
  - `docs/packs/` folder and pack spec duplicates
- obsolete synthesis docs (2026-05-02):
  - `docs/blendops-skill-system-design.md`
  - `docs/blendops-law-format.md`
  - `docs/blendops-first-skill-pack.md`
  - `docs/runtime-route-strategy.md`

### DELETE (local generated artifacts policy)
- `.tmp/**`
- `exports/**`
- `renders/**`
- `**/dist/**`
- `**/__pycache__/**`
- `node_modules/**` (rebuildable)

### MERGE (completed 2026-05-02)
- docs-level specs vs root installable artifacts:
  - `docs/laws/*` → `laws/*` (root canonical)
  - `docs/skills/*` → `skills/*` (root canonical)
  - `docs/packs/*` → `packs/*` (root canonical)
- All active navigation now points to root canonical collections

### REWRITE (performed)
- Removed archive references from active docs and support guidance.
- Updated README.md and docs/README.md navigation to root canonical paths.

## Post-cleanup checks

- docs workflow (`npm run docs:check`) passes.
- No legacy runtime command patterns in active scope.
- No non-official MCP active strategy references in active scope.
- Official runtime references remain present.
- No duplicate docs-level skill/law/pack folders remain.
- Root `skills/`, `laws/`, `packs/` are canonical installable collections.
