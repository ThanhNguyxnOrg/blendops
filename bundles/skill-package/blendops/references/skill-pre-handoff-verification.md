# pre-handoff-verification

Purpose: 7-point verification gate before any deliverable is handed off as "ready" or `Verified`. Inspired by Anthropic Superpowers `/verification-before-completion`.

Use before any handoff, before saving an evidence file under `docs/evals/`, before answering a user with `Verified` / `Produced`, or before any release decision. Skip when the workflow is still in planning / brainstorming / brief stage.

Output contract: 7-check record (claim named, path attribution, artifact paths exist, validation notes, tool names, no-mutation guarantee for read-only smoke, plain language). This skill never upgrades a claim; it confirms or downgrades only. Routes failures to the right downstream skill.
