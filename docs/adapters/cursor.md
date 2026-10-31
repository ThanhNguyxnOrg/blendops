# Adapter: Cursor

Status: Draft v0
Confidence label: linked-only
Upstream documentation reviewed: Yes (Cursor rules `.cursor/rules/*.mdc` + `AGENTS.md` discovery docs reviewed 2026-10-14)
BlendOps empirical verification status: linked-only (`Linked Only (Not Verified)` — see [`docs/evals/adapter-empirical-verification-phase-7.md`](../evals/adapter-empirical-verification-phase-7.md))

## Supported install scopes
- project-local (default)
- tool-native rules/docs if verified
- generic-root fallback

## Detection hints
- `.cursor/` directory

## Capability profile summary
- rules directory may be available; verify before writing

## Recommended install behavior
- attach core collection project-locally
- use `.cursor/rules` only if verified
- fallback to `BLENDOPS.md` when uncertain

## Allowed writes
- project-local docs/rules files

## Forbidden actions
- global mutation without explicit approval
- runtime install/run claims

## Verification checklist
- path verification noted
- files changed list provided
- rollback steps included

## Rollback
- remove new rule files and restore backups

## First-use prompt
“Plan hero scene with BlendOps pack first, then evaluate readiness; do not claim runtime artifacts without evidence.”
