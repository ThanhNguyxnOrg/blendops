# Cleanup Audit

Status: Draft cleanup audit
Date: 2026-04-29

## Scope

Audit for stale/duplicate/conflicting files under current model:
- official-runtime-only policy
- root multi-skill collection (`skills/`)
- shared laws (`laws/`)
- pack manifests (`packs/`)
- docs as canonical narrative/spec layer

## Classification legend

- **KEEP_ACTIVE**: current active/canonical path
- **KEEP_ARCHIVE**: historical context preserved under `docs/archive/`
- **DELETE**: safe-to-delete generated/transient artifacts
- **MERGE**: duplicated semantics, should be consolidated
- **REWRITE**: keep file, but rewrite to remove ambiguity/conflict

## Path classification

| Path | Classification | Rationale |
|---|---|---|
| README.md | KEEP_ACTIVE | Root product/install entrypoint.
| TODO.md | KEEP_ACTIVE | Active roadmap.
| package.json / package-lock.json | KEEP_ACTIVE | Build/workflow baseline.
| .github/workflows/docs.yml | KEEP_ACTIVE | Docs CI entrypoint.
| docs/README.md | KEEP_ACTIVE | Active docs index.
| docs/external-runtime-setup.md | KEEP_ACTIVE | Official runtime setup boundary.
| docs/reference-runtime.md | KEEP_ACTIVE | Runtime responsibility boundary.
| docs/install-strategy.md | KEEP_ACTIVE | Install/adoption policy.
| docs/agent-install.md | KEEP_ACTIVE | Agent attach guide.
| docs/adapters/* | KEEP_ACTIVE | Adapter architecture docs.
| docs/install-scopes.md | KEEP_ACTIVE | Install scope model.
| docs/capability-profile.md | KEEP_ACTIVE | Capability schema.
| docs/adapter-registry.md | KEEP_ACTIVE | Adapter inventory.
| docs/examples/* | KEEP_ACTIVE | Human/agent prompts and root entrypoint template.
| docs/evals/* | KEEP_ACTIVE | Eval protocols/results.
| docs/laws/*, docs/skills/*, docs/workflows/*, docs/recipes/*, docs/packs/* | KEEP_ACTIVE | Canonical docs/spec layer.
| skills/*/SKILL.md + EVAL.md | KEEP_ACTIVE | Installable root skill collection.
| laws/* | KEEP_ACTIVE | Installable shared guardrails.
| packs/product-hero-v0/PACK.md | KEEP_ACTIVE | Installable pack manifest.
| skill-reviews/* | KEEP_ACTIVE | Gate/review/depth standards and reports.
| docs/archive/* | KEEP_ARCHIVE | Historical-only context, not active setup guidance.
| .tmp/** | DELETE | Transient test/log artifacts.
| exports/** | DELETE | Generated runtime artifacts, non-source.
| renders/** | DELETE | Generated runtime artifacts, non-source.
| **/dist/** (apps/packages) | DELETE | Generated build outputs from old runtime-era surfaces.
| **/__pycache__/** | DELETE | Python cache artifacts.
| node_modules/** | DELETE | Reproducible dependency install artifact.
| skills/blendops/harnesses/* | DELETE | Legacy monolithic leftovers; superseded by root `skills/` + `docs/adapters/*`.
| skills/blendops/references/* | DELETE | Legacy auxiliary refs; superseded by root per-skill `references/`.
| skills/blendops/examples/* | DELETE | Legacy examples; superseded by root per-skill references/examples.
| docs/laws/* vs laws/* | MERGE | Dual-layer by design; keep both but periodically sync to avoid drift.
| docs/skills/* vs skills/* | MERGE | Docs-spec vs installable artifacts; enforce sync policy.
| docs/packs/* vs packs/* | MERGE | Docs-spec manifest vs installable manifest; enforce sync policy.

## Immediate safe cleanup actions

1. Remove generated artifacts from local workspace only:
   - `.tmp/`
   - `exports/`
   - `renders/`
   - `node_modules/`
   - `**/dist/`
   - `**/__pycache__/`
2. Keep all `docs/archive/*` files intact.

## Follow-up alignment actions

- Add a periodic “docs/spec vs installable sync” check.
- Confirm no active references remain to removed `skills/blendops/*` subtree.
