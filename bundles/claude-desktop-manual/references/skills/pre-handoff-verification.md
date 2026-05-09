# pre-handoff-verification (reference summary)

## Purpose
7-point verification gate before any deliverable is handed off as "ready" or `Verified`. Inspired by Anthropic Superpowers `/verification-before-completion`.

## When to use
- before any user-facing handoff
- before saving an evidence file under `docs/evals/`
- before answering with `Verified` / `Produced` claim
- before any release tag decision

## When not to use
- workflow is still in planning / brainstorming / brief stage
- user explicitly asked for a draft, not a verified deliverable

## Output/evidence contract
7-check record (claim named, path attribution, artifact paths exist, validation notes, tool names, no-mutation guarantee for read-only smoke, plain language). This skill never upgrades a claim; only confirms or downgrades.

## Handoff notes
- Verdict Pass: `non-blender-user-response-writer` for final user text
- Verdict Warn: hand back to claim source with downgraded label
- Verdict Fail (3+): `blender-troubleshooting` for diagnosis
- Runtime path failure: `runtime-bridge-conflict-resolver` or `official-runtime-readiness-checker`
