# Adapter: Claude app/Desktop

Status: Draft v0
Confidence label: linked-only

## Supported install scopes
- docs-only/reference (default)
- generic-root fallback
- user-global only by explicit approval and verified path

## Detection hints
- user explicitly indicates Claude app/Desktop usage
- desktop config context available

## Capability profile summary
- do not assume Claude Code workspace conventions
- prefer instruction docs and prompt packs

## Recommended install behavior
- provide project-local `BLENDOPS.md` guidance file
- provide links to core collection and official runtime docs
- avoid `.claude/skills` assumptions unless verified for that environment

## Allowed writes
- project-local docs (`BLENDOPS.md`, optional `AGENTS.md` update with backup)

## Forbidden actions
- assume Claude Code install path applies automatically
- runtime install/run claims

## Verification checklist
- selected scope documented
- files changed list provided
- confidence labels included

## Rollback
- remove created project-local guide files
- restore backups of modified files

## First-use prompt
“Use BlendOps laws/skills to plan a product hero scene in text-only mode first. Do not claim runtime artifacts without evidence.”

## Notes
This adapter is intentionally separate from Claude Code.
