# Cleanup Audit

Status: Active cleanup audit
Date: 2026-04-29

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

### DELETE (local generated artifacts policy)
- `.tmp/**`
- `exports/**`
- `renders/**`
- `**/dist/**`
- `**/__pycache__/**`
- `node_modules/**` (rebuildable)

### MERGE (ongoing governance)
- docs-level specs vs root installable artifacts:
  - `docs/laws/*` ↔ `laws/*`
  - `docs/skills/*` ↔ `skills/*`
  - `docs/packs/*` ↔ `packs/*`

### REWRITE (performed)
- Removed archive references from active docs and support guidance.

## Post-cleanup checks

- docs workflow (`npm run docs:check`) passes.
- No legacy runtime command patterns in active scope.
- No non-official MCP active strategy references in active scope.
- Official runtime references remain present.
