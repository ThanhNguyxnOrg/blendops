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

- `workflow-stage-router` routes here as the final gate before handoff, or exits here on any failed upstream gate to lock in an honest downgraded truth label
- `blendops-help` routes a user directly to verify an existing deliverable or evidence claim
- a planner / executor / response writer says "the output is ready"
- before saving an evidence file under `docs/evals/path-X-...md` via `runtime-attempt-report-writer` or `render-export-evidence`
- before answering a user with `Verified` or `Produced` status
- before tagging a release or confirming whether a claim holds or must be downgraded
- when the operator is tempted to claim "done" but evidence is fuzzy

## When not to use

- the workflow is still in planning / brainstorming / brief stage (no claim to verify yet)
- the user explicitly asked for a draft, not a verified deliverable
- runtime status is `Not Run` and the user knows it (no verification needed when Not Run is the explicit state)

## Trigger phrases

- "looks ready, can we ship?"
- "I think the render is good — verify before sending"
- "before saving the evidence file..."
- "is this Verified or do we downgrade?"
- "confirm whether this claim holds or must be downgraded"

## Prerequisites / readiness

- a proposed handoff exists (response text, file paths, status claims)
- evidence sources exist (file paths, logs, validation notes)
- ability to read evidence without modifying it; no Blender execution required

## Input schema

### Required inputs

- proposed handoff content (response or evidence file draft)
- runtime truth state claimed (`Not Run` | `Attempted` | `Produced` | `Verified` | `Failed`)
- artifact truth state claimed (`Not Run` | `Not Produced` | `Produced` | `Verified` | `Failed`; default `Not Produced`)
- artifact paths referenced (if any)
- runtime path used:
  - Path 1: Official Blender Lab MCP in Blender 5.1+ (`blender_version_min = "5.1.0"`), hosted from (a) Anthropic Connector in Claude Desktop (installs the Lab add-on inside Blender; not standalone) or (b) any manually configured MCP client
  - Path 2: community `mcp-for-blender` (Blender 3.0+, with explicit caveats, never release evidence)
  - CLI fallback: appendix only (`blender --background --python`, never a peer path without an eval record)
  - Text-only (no runtime executed)

### Optional inputs

- prior evidence record paths
- validation notes from `blender-scene-quality-checker`, `material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, `polycount-budget-checker`, or `render-export-evidence`
- user's explicit acceptance level ("draft is fine" vs. "must be production-ready")

### Assumptions to confirm

- the proposed claim is the maximum truth label justified by evidence (downgrade-only, never upgrade)
- file paths are real and inspectable, not invented
- the operator can pause before handoff to downgrade unsupported claims or gather missing evidence upstream

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

Run all 7 checks. Each applicable check must pass before a claim is upheld; otherwise downgrade.

1. **Claim is named explicitly** — handoff states an exact runtime truth label (`Not Run` | `Attempted` | `Produced` | `Verified` | `Failed`) and artifact truth label (`Not Run` | `Not Produced` | `Produced` | `Verified` | `Failed`, defaulting to `Not Produced`). No vague "ready" / "done" / "good".
2. **Path attribution and boundary compliance are explicit** — runtime path is named: Path 1 host (a) Anthropic Connector in Claude Desktop or host (b) manually configured MCP client on Blender 5.1+ (`blender_version_min = "5.1.0"`); Path 2 (`mcp-for-blender`, Blender 3.0+, caveated only and **never release evidence**); CLI appendix (`blender --background --python`, **never a peer path without an eval record**); or text-only. Reject "we used the connector" without host attribution or with standalone/pre-5.1 claims.
3. **Artifact paths exist** — for any `Produced` or `Verified` artifact claim, every referenced file path exists and is inspectable. If artifact state is `Not Produced` or `Not Run`, no artifact path is asserted.
4. **Validation notes present** — for any `Verified` claim, validation notes record what was checked and how it passed. Empty validation = automatic downgrade to `Produced` (or lower).
5. **Tool / command names recorded** — exact verified tool or CLI names are recorded:
   - Path 1 read-only: `get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`, `get_object_detail_summary`, and `*_for_cli` variants
   - Path 1 mutation: `execute_blender_code`
   - Path 2: `get_scene_info`, `execute_blender_code` (within its 9-tool surface)
   - CLI appendix: exact `blender` command using documented flags (`--background`, `--python`, `-E`/`--engine`; run `blender -E help` for exact engine tokens)
6. **No-mutation guarantee for read-only smoke** — if the claim is read-only smoke evidence, explicit confirmation that `execute_blender_code` was not called on either backend.
7. **Plain-language summary present** — final user-facing text passes `non-blender-user-language` check (no unexplained Blender/MCP internals).

## Decision tree

- all 7 checks pass → confirm truth label, allow handoff
- 1-2 checks warn on non-blocking metadata (e.g., minor jargon explained inline) AND all required evidence for the truth label exists → keep truth label only with explicit caveat; if validation notes are missing on `Verified` or Path 2 is used as release evidence, mandatory downgrade applies
- any required evidence check fails or 3+ checks fail → downgrade claim by one or more truth steps to the highest label strictly supported by evidence; explain downgrade
- check 1 fails (no valid truth label named) → block handoff and downgrade to `Not Run` / `Not Produced` until an explicit truth label is set

## Playbooks

- Playbook A: "Operator wants to confirm `Verified`" — run all 7 checks; downgrade to `Produced` if validation notes (check 4) are missing, or to `Attempted` / `Not Produced` if artifact paths (check 3) are missing. Ensure Path 2 is never accepted as release evidence.
- Playbook B: "Operator wants to confirm read-only smoke test evidence" — run all 7 checks: confirm runtime truth label (check 1), Path 1 host a/b on Blender 5.1+ or caveated Path 2 (check 2), artifact state `Not Produced` (check 3), smoke validation notes (check 4), read-only tool names recorded (check 5), explicit no-`execute_blender_code` guarantee (check 6), and plain-language summary (check 7).
- Playbook C: "Final user-facing response" — run all 7 checks with strict enforcement of check 7 via `non-blender-user-response-writer`.
- Playbook D: "Evidence file save" — run checks 1-6 strictly for the record (`runtime-attempt-report-writer` / `render-export-evidence`), and check 7 for any user-facing summary section.

## Mode handling

### Text-only mode

- verifies a text-only deliverable (plan, brief, response) — checks 1, 2, 7 apply; checks 3-6 marked N/A explicitly
- runtime status: must be `Not Run` (if input claims `Attempted`, `Produced`, or `Verified` without runtime execution, downgrade to `Not Run`)
- artifact status: must be `Not Produced` or `Not Run` (downgrade any higher claim)

### Runtime-ready mode

- all 7 checks apply
- if checks 3-6 fail and operator wants `Verified`, downgrade runtime state to `Produced`, `Attempted`, or `Failed` and artifact state to `Produced` or `Not Produced` per actual evidence

### Blocked runtime mode

- Entered when `workflow-stage-router` exits here on a failed readiness or execution gate
- checks 1, 2, 7 apply; checks 3-6 marked N/A or Failed per upstream block
- enforce downgrade: runtime status cannot exceed `Not Run`, `Attempted`, or `Failed`, and artifact status must be `Not Produced` (or `Failed`) — no `Verified` or `Produced` claim may leak past a blocked gate

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

- check fails: downgrade runtime and/or artifact claim to the highest truth label strictly proven by existing evidence. Re-run remaining checks.
- when entered via `workflow-stage-router` failed-gate exit: lock in the downgraded truth label (`Not Run`, `Attempted`, or `Failed` for runtime; `Not Produced` or `Failed` for artifact) and state the exact upstream gate that failed.
- operator attempts to override downgrade: refuse to upgrade or keep an unsupported truth label. Log the discrepancy in the verification record and output only the downgraded label.
- evidence file would misrepresent path, version floor, or artifact existence: block handoff and force honest downgrade.

## Troubleshooting

- if 3+ checks fail, the workflow upstream has bigger problems — route to `blender-troubleshooting`.
- if check 7 fails repeatedly, route through `non-blender-user-response-writer` before re-attempting verification.

## Best practices

- run before every handoff, not just before release
- never upgrade a claim; only downgrade or keep
- explicit caveats are better than soft language

## Good examples

- "Operator wants Verified for cyberpunk-shoe-render. 7-check pass: claim explicit, Path 1 host a, artifact paths exist (`renders/preview-2026-05-09.png`), validation notes record subject framing + lighting + neon mood checks pass, tool `execute_blender_code` recorded, no smoke guarantee needed (this is a render not smoke), plain-language summary clean. Verdict: Pass. Verified upheld."

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

- Entry wiring: reached from `workflow-stage-router` (as the final gate or failed-gate exit) or `blendops-help`.
- If verdict is Pass: hand off to `non-blender-user-response-writer` for final user-facing delivery (or `render-export-evidence` / `runtime-attempt-report-writer` when finalizing an evidence log).
- If verdict is Warn or Fail (claim downgraded, handoff continues with lower truth label): hand off to `non-blender-user-response-writer` with the downgraded label and caveats locked.
- If verdict is Fail and the operator wants to fix the upstream gap instead of shipping downgraded: return to `workflow-stage-router` to pick the single immediate next skill:
  - scene/asset quality gap → `blender-scene-quality-checker`, `material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, or `polycount-budget-checker`
  - evidence classification gap → `render-export-evidence` or `runtime-attempt-report-writer`
  - runtime/bridge failure → `official-runtime-readiness-checker`, `runtime-bridge-conflict-resolver`, or `blender-troubleshooting`

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
