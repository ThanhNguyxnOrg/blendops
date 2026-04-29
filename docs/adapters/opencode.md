# Adapter: OpenCode

Status: Draft v0
Confidence label: linked-only

## Supported install scopes
- project-local (default)
- tool-native if verified
- generic-root fallback
- user-global opt-in only

## Detection hints
- `.opencode/` directory

## Capability profile summary
- native path assumptions must be verified before write

## Recommended install behavior
- attach core collection project-locally
- if native skill path uncertain, use `BLENDOPS.md`/`AGENTS.md` fallback

## Allowed writes
- project-local config/docs only

## Forbidden actions
- unverified native path writes
- runtime install/run claims

## Verification checklist
- path choice rationale documented
- files changed list provided
- rollback steps included

## Rollback
- remove project-local additions
- restore backups

## First-use prompt
“Use product-hero-v0 pack in planning mode. Keep runtime status as Not Run until evidence exists.”
