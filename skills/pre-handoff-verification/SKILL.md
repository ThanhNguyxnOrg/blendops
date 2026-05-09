---
name: pre-handoff-verification
description: Verification gate before claiming any deliverable is ready. Forces evidence checks (path, file existence, validation notes) per evidence-before-done law. Use before any 'Verified' claim.
---

# pre-handoff-verification

## Purpose

Run a structured verification pass before any BlendOps output is handed to the user as "ready" or "Verified". Forces explicit evidence checks per the `evidence-before-done` law and downgrades any unsupported claim to a lower truth label.

Inspired by the `/verification-before-completion` skill in Anthropic Superpowers, adapted for the BlendOps evidence-before-done discipline.

This skill **complements** `render-export-evidence` (which classifies artifact evidence) by enforcing the discipline at the moment of handoff, not just at evidence recording.

## Quick start

- read the proposed handoff (response text, artifact list, evidence fields)
- run the 7-point verification checklist
- downgrade any unsupported claim explicitly
- gate handoff on all 7 checks passing or explicit caveats

## When to use

- a planner / executor / response writer says "the output is ready"
- before saving an evidence file under `docs/evals/path-X-...md`
- before answering a user with `Verified` or `Produced` status
- before tagging a release or promoting status from Draft v0
- when the operator is tempted to claim "done" but evidence is fuzzy

## When not to use

- the workflow is still in planning / brainstorming / brief stage (no claim to verify yet)
- the user explicitly asked for a draft, not a verified deliverable
- runtime status is `Not Run` and the user knows it (no verification needed when Not Run is the explicit state)

## Trigger phrases

- "looks ready, can we ship?"
- "I think the render is good — verify before sending"
- "before saving the evidence file..."
- "is this Verified?"
- "promote to Pass / Verified"

## Prerequisites / readiness

- a proposed handoff exists (response text, file paths, status claims)
- evidence sources exist (file paths, logs, validation notes)
- ability to read evidence without modifying it; no Blender execution required

## Input schema

### Required inputs

- proposed handoff content (response or evidence file draft)
- claim being made (`Not Run` / `Attempted` / `Produced` / `Verified` / `Failed`)
- artifact paths referenced (if any)
- runtime path used (Path 1 host a/b, Path 2, CLI fallback, text-only)

### Optional inputs

- prior evidence record paths
- validation notes from `blender-scene-quality-checker` or `render-export-evidence`
- user's explicit acceptance level ("draft is fine" vs. "must be production-ready")

### Assumptions to confirm

- the proposed claim is the maximum truth label justified by evidence
- file paths are real and inspectable, not invented
- the operator can pause before handoff to gather missing evidence

## Output schema

### Primary output

- verification verdict: Pass / Warn / Fail
- if Pass: confirmed status label
- if Warn / Fail: downgraded status label + reason

### Secondary output

- 7-point verification record
- specific missing evidence per failed check

### Evidence / caveat output

- explicit downgrade reasoning
- no claim is upgraded; only downgraded or kept

## Required laws

- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/official-runtime-only.md

## Official runtime boundary

This skill does not run Blender, mutate scenes, or generate artifacts. It reads the proposed handoff and existing evidence, and either confirms or downgrades the truth label.

## Operating procedure

Run all 7 checks. Each must pass before claim is upheld.

1. **Claim is named explicitly** — handoff states one of the 5 truth labels (`Not Run` / `Attempted` / `Produced` / `Verified` / `Failed`). No vague "ready" / "done" / "good".
2. **Path attribution is explicit** — runtime path named (Path 1 host a/b, Path 2, CLI fallback, or text-only). No "we used the connector" without specifying host.
3. **Artifact paths exist** — for any `Produced` or `Verified` claim, every referenced file path exists and is inspectable. If `Not Produced`, no artifact path is asserted.
4. **Validation notes present** — for any `Verified` claim, validation notes record what was checked and how it passed. Empty validation = downgrade to `Produced`.
5. **Tool / command names recorded** — exact tool names called (Path 1: `get_blendfile_summary_*` / `create_object`; Path 2: `get_scene_info` / `execute_blender_code`; CLI: exact `blender` command).
6. **No-mutation guarantee for read-only smoke** — if the claim is read-only smoke evidence, explicit confirmation that no `execute_blender_code` / `run_blender_code` / `create_object` was called.
7. **Plain-language summary present** — final user-facing text passes `non-blender-user-language` check (no jargon without explanation).

## Decision tree

- all 7 checks pass → confirm claim, allow handoff
- 1-2 checks warn but workaround exists → keep claim with explicit caveat
- 3+ checks fail → downgrade claim by one or more truth steps; explain downgrade
- check 1 fails (no claim named) → reject handoff entirely until claim is named

## Playbooks

- Playbook A: "Operator wants to mark Verified" — run all 7; downgrade to `Produced` if validation notes are missing
- Playbook B: "Operator wants to mark Pass on smoke test" — confirm checks 1-3, 5, 6 (validation + plain-language are bonus for smoke)
- Playbook C: "Final user-facing response" — confirm all 7 with extra weight on check 7 (plain language)
- Playbook D: "Evidence file save" — confirm checks 1-6 (file is for record, not user-facing prose)

## Mode handling

### Text-only mode

- verifies a text-only deliverable (plan, brief, response) — checks 1, 2, 7 apply; checks 3-6 marked N/A explicitly
- runtime status: unchanged from input
- artifact status: unchanged from input

### Runtime-ready mode

- all 7 checks apply
- if checks 3-6 fail and operator wants `Verified`, downgrade to `Produced` or `Attempted` per evidence

### Blocked runtime mode

- only checks 1, 2, 7 apply (no runtime claim possible)
- enforce that no `Verified` / `Produced` claim leaks past blocked status

## Validation checklist

- [ ] claim label named explicitly
- [ ] runtime path attributed (path + host or text-only)
- [ ] artifact paths exist or `Not Produced` is honest
- [ ] validation notes present for `Verified`
- [ ] tool / command names recorded
- [ ] no-mutation guarantee for read-only smoke
- [ ] plain-language user-facing summary
- [ ] downgrade reasoning explicit when applied
- [ ] no claim upgraded by this skill

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Claim named | Explicit truth label | Vague but downgrade applied | "ready" / "done" allowed through |
| Path attribution | Path + host or text-only | Path named, host ambiguous | No path attribution |
| Artifact paths | All exist or honestly absent | Some exist, missing flagged | Path asserted but not inspectable |
| Validation notes | Present for `Verified` | Missing but `Verified` downgraded to `Produced` | `Verified` claimed without notes |
| Tool names | All recorded | Partial, gap flagged | Path claimed without tool names |
| No-mutation guarantee | Explicit for read-only | Implicit but consistent | Smoke claim with mutation tools |
| Plain language | No jargon | Minor jargon explained | Jargon-heavy user response |

## Failure handling

- check fails: downgrade claim by one step. Re-run remaining checks. If multiple fail, downgrade to lowest justified.
- operator overrides downgrade: log override with explicit reason in evidence record, do not change check result.
- evidence file would lie: refuse to allow handoff. Force fix or honest downgrade.

## Troubleshooting

- if 3+ checks fail, the workflow upstream has bigger problems — route to `blender-troubleshooting`.
- if check 7 fails repeatedly, route through `non-blender-user-response-writer` before re-attempting verification.

## Best practices

- run before every handoff, not just before release
- never upgrade a claim; only downgrade or keep
- explicit caveats are better than soft language

## Good examples

- "Operator wants Verified for cyberpunk-shoe-render. 7-check pass: claim explicit, Path 1 host a, artifact paths exist (`renders/preview-2026-05-09.png`), validation notes record subject framing + lighting + neon mood checks pass, tool `run_blender_code` recorded, no smoke guarantee needed (this is a render not smoke), plain-language summary clean. Verdict: Pass. Verified upheld."

## Bad examples

- "The render is ready." (no truth label, no path attribution, no artifact path, no validation, no tool names, no plain-language check — would fail all 7)

## User-facing response template

- Claim being verified
- 7-check verdict (each check Pass/Warn/Fail with one-line reason)
- Final status (claim upheld or downgraded with explicit reason)
- What is allowed to be said next

## Anti-patterns

- letting "ready" / "done" / "looks good" stand as a truth label
- upgrading a claim based on operator confidence (this skill only downgrades)
- skipping checks because the operator is tired
- treating a passed read-only smoke as a `Verified` for mutation/render/export

## Cross-skill handoff

- If verdict is Pass: hand off to `non-blender-user-response-writer` for final user-facing text
- If verdict is Warn: hand off to the skill that produced the claim with the downgraded label
- If verdict is Fail and 3+ checks failed: hand off to `blender-troubleshooting` for diagnosis
- If runtime path was the failure point: hand off to `runtime-bridge-conflict-resolver` or `official-runtime-readiness-checker`

## Non-goals

- running Blender
- generating evidence
- upgrading claims
- replacing `render-export-evidence` (that classifies; this gates handoff)

## References

- Inspired by Anthropic Superpowers `/verification-before-completion` skill (https://github.com/anthropics/skills)
- BlendOps law: ../../laws/evidence-before-done.md
- BlendOps skill: ../../skills/render-export-evidence/SKILL.md
- Skill system: ../../docs/skill-system.md
