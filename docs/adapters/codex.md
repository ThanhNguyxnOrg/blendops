# Adapter: Codex / Generic

Status: Draft v0
Confidence label: linked-only

## Supported install scopes
- generic-root (default)
- project-local
- docs-only/reference fallback

## Detection hints
- `AGENTS.md` style workflow
- no verified native skills path

## Capability profile summary
- AGENTS/BLENDOPS doc attachment is safest default

## Recommended install behavior
- create/update `BLENDOPS.md` in project root
- optionally append small section to `AGENTS.md` with backup

## Allowed writes
- project-local markdown instruction files

## Forbidden actions
- assume native skill loader exists
- runtime install/run claims

## Verification checklist
- root entrypoint exists
- links to skills/laws/packs valid
- rollback steps documented

## Rollback
- remove root entrypoint files and restore backups

## First-use prompt
“Use BlendOps root entrypoint to apply product-hero-v0 in text-only mode first.”
