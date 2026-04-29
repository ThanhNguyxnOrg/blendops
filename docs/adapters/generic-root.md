# Adapter: Generic Root Fallback

Status: Draft v0
Confidence label: verified-read

## Supported install scopes
- project-local (default fallback)
- docs-only/reference fallback

## Detection hints
- unknown or unverified target tool
- no trusted native adapter path available

## Capability profile summary
- safe universal fallback mode

## Recommended install behavior
- create project-root `BLENDOPS.md`
- optionally update `AGENTS.md` with backup
- link to `skills/`, `laws/`, `packs/` and runtime boundary docs

## Allowed writes
- project-root markdown files only

## Forbidden actions
- tool-specific config writes without verified adapter
- global config mutation without explicit approval
- runtime install/run claims

## Verification checklist
- BLENDOPS.md exists
- links to core collection valid
- changed files list provided
- rollback instructions provided

## Rollback
- delete BLENDOPS.md and restore AGENTS.md backup if modified

## First-use prompt
“Use BlendOps v0 product-hero pack in planning mode. Keep artifact status as Not Run until runtime evidence exists.”
