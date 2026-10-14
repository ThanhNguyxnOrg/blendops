---
name: blender-scene-quality-checker
description: Apply multi-category readiness gates with pass/warn/fail and evidence-bound verdicts.
---

# blender-scene-quality-checker

## Purpose
Evaluate scene/workflow readiness honestly and consistently before any success claim.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- before readiness, export, or handoff claims to get a broad multi-category review
- after planning passes or after focused domain checkers have run
- during text-only or runtime evaluation reporting

## When not to use
- as a replacement for evidence collection
- to fabricate confidence in missing artifacts

## Trigger phrases
- "quality-check this scene"
- "is this ready"
- "evaluate pass warn fail"

## Prerequisites / readiness
- plan output and acceptance criteria set available (e.g., from `acceptance-criteria-builder`)
- runtime truth state known (`Not Run | Attempted | Produced | Verified | Failed`; stays `Not Run` unless a real attempt was recorded)
- artifact truth state known (`Not Run | Not Produced | Produced | Verified | Failed`; defaults to `Not Produced` unless concrete output evidence exists)
- optional outputs from focused checkers (`material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, `polycount-budget-checker`) and `render-export-evidence`

## Input schema

### Required inputs
- scene plan summary
- intended output criteria
- current runtime truth state (`Not Run | Attempted | Produced | Verified | Failed`)
- current artifact truth state ledger (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`)

### Optional inputs
- focused domain reports from `composition-quality-checker`, `lighting-quality-checker`, `material-quality-checker`, and `polycount-budget-checker`
- artifact evidence classification from `render-export-evidence`
- target quality threshold and destination-specific constraints

### Assumptions to confirm
- whether a real runtime attempt was recorded (otherwise runtime stays `Not Run`)
- whether artifacts have verified provenance to the current run vs. being pre-existing files

## Output schema

### Primary output
- category-level pass/warn/fail matrix

### Secondary output
- overall readiness verdict (`Ready | Conditionally Ready | Not Ready`, or `Not Run` when no runtime attempt happened) kept strictly separate from runtime/artifact truth states
- consolidated blockers and remediation steps traced from category scores

### Evidence / caveat output
- downgrade-only runtime and artifact truth-state ledger (with provenance noted for any pre-existing files)
- explicit caveats, unknowns, and plain-language user impact

## Required laws
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Review-only skill: never executes Blender, never runs or emits Python, and never produces artifacts. Runtime truth state stays `Not Run` unless a real attempt was recorded; artifact truth state defaults to `Not Produced` unless concrete output evidence from the current run exists. Truth states are downgrade-only (never upgrade). Text-only and blocked modes must remain explicit.

## Operating procedure
1. Confirm run mode, runtime truth state (`Not Run | Attempted | Produced | Verified | Failed`), and artifact truth state (`Not Run | Not Produced | Produced | Verified | Failed`), verifying provenance to the current run for any existing files.
2. Score **Subject clarity** against brief/plan intent.
3. Score **Composition/camera** readiness (consume `composition-quality-checker` output if available; do not redo deep domain validation).
4. Score **Lighting/material** readiness (consume `lighting-quality-checker` and `material-quality-checker` outputs if available; do not redo deep domain validation).
5. Score **Scale, transforms, and geometry budget** readiness (consume `polycount-budget-checker` output if available).
6. Score **Evidence and export readiness** (consume `render-export-evidence` classification if available; verify readiness for `pre-handoff-verification` and `glb-web-handoff` without taking over their roles).
7. Assign independent Pass / Warn / Fail scores per category and trace how each contributes to the final outcome.
8. Apply downgrade-only rules to truth states if gaps or missing provenance are found.
9. Produce the final readiness verdict (`Ready | Conditionally Ready | Not Ready`, or `Not Run` when no runtime attempt happened), keeping the verdict scale separate from runtime and artifact truth states.

## Decision tree
- If no runtime attempt happened → Runtime truth state stays `Not Run`, artifacts stay `Not Produced`, and readiness verdict is `Not Run` or `Conditionally Ready` (never `Ready`).
- If any critical category scores Fail or claims contradict evidence → Readiness verdict is `Not Ready`.
- If all critical categories Pass, runtime/artifact evidence is `Verified` for the current run, and no blockers remain → Readiness verdict is `Ready`.
- If critical categories Pass with minor warnings, or planning is complete while runtime/artifacts are unverified → Readiness verdict is `Conditionally Ready`.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- evaluate planning quality across categories only
- keep runtime truth state at `Not Run` and artifact truth states at `Not Produced`
- cap readiness verdict at `Conditionally Ready` or `Not Run` (never `Ready`)

### Runtime-ready mode
- consume artifact classifications from `render-export-evidence` and domain checks from focused quality checkers
- require current-run provenance before accepting `Produced` or `Verified` artifact states

### Blocked runtime mode
- keep readiness verdict conservative (`Not Ready`, `Conditionally Ready`, or `Not Run`)
- preserve exact runtime/artifact truth states (downgrade-only) and list blockers and next actions

## Validation checklist
- [ ] run mode explicitly labeled
- [ ] runtime truth state (`Not Run | Attempted | Produced | Verified | Failed`) and artifact truth state (`Not Run | Not Produced | Produced | Verified | Failed`) recorded separately from the readiness verdict
- [ ] truth states are downgrade-only (never upgraded) and pre-existing files require current-run provenance
- [ ] category rubric scored independently with clear traceability to the final verdict
- [ ] focused checker outputs consumed without redoing their domain work
- [ ] blocker list complete and caveats include plain-language user impact
- [ ] final readiness verdict (`Ready | Conditionally Ready | Not Ready | Not Run`) justified without unsupported success claims
- [ ] no uncaveated Path 2 guidance; CLI appendix never treated as a peer path
- [ ] plain-language summary and next-skill handoffs provided

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Subject clarity | Clear focal hierarchy aligned with brief | Minor ambiguity in secondary elements | Unclear focal subject or intent mismatch |
| Composition/camera | Coherent framing; passes `composition-quality-checker` if run | Minor framing gaps; needs review | Framing fails user goal or missing camera plan |
| Lighting/material | Supports intent; passes `lighting-quality-checker` / `material-quality-checker` if run | Minor tuning needed or focused checks pending | Major lookdev mismatch or broken shading/lighting plan |
| Scale/geometry budget | Real-world scale, clean transforms, passes `polycount-budget-checker` if run | Unconfirmed transforms or near budget limit | Wrong scale, unapplied transforms, or over budget |
| Evidence & handoff readiness | Claims match `render-export-evidence` with current-run provenance | Partial evidence or pre-handoff checks pending | Claims contradict evidence, or pre-existing files claimed as new |

## Failure handling
- Missing runtime attempt or evidence: keep runtime truth state `Not Run`, keep artifact truth state `Not Produced` (downgrade-only, never upgrade), and cap readiness verdict at `Conditionally Ready` or `Not Run`.
- Critical category Fail: set readiness verdict to `Not Ready` with traced remediation steps.
- Unverified or pre-existing files without current-run provenance: refuse `Produced`/`Verified` attribution for this run and log a Warn/Fail caveat.
- Unknowns in domain specifics: log Warn with explicit caveat and recommend the appropriate focused checker (`material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, or `polycount-budget-checker`).

## Troubleshooting
- If all categories pass but no artifacts exist: ensure verdict is not Ready.
- If pre-existing files found: do not attribute to current run without linkage.
- If plan quality high but runtime blocked: use Conditionally Ready or Not Run.

## Best practices
- score categories independently before final verdict
- keep caveats visible in final summary
- preserve traceability from category score to verdict

## Good examples
"Readiness Verdict: Conditionally Ready. All planning categories pass, but Runtime Truth State is `Not Run` and Artifact Truth State is `Not Produced` for this pass."

## Bad examples
“Looks good overall, ship it.” (no rubric, no evidence mapping)

## User-facing response template
- Current status
- What passed
- What needs follow-up
- Next best action

## Anti-patterns
- conflating the readiness verdict scale (`Ready | Conditionally Ready | Not Ready | Not Run`) with runtime or artifact truth states
- upgrading runtime or artifact truth states, or attributing pre-existing files to the current run without provenance
- redoing deep per-domain validation instead of consuming `material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, or `polycount-budget-checker`
- usurping artifact classification from `render-export-evidence`, gate ownership from `pre-handoff-verification`, or web packaging from `glb-web-handoff`
- skipping required laws, using Path 2 without caveats, treating CLI fallback as a peer path, or emitting jargon/Python

## Cross-skill handoff
- Focused domain validation (if gaps found): `composition-quality-checker`, `lighting-quality-checker`, `material-quality-checker`, `polycount-budget-checker`
- Evidence classification: `render-export-evidence`
- Handoff gate: `pre-handoff-verification`
- Web delivery (when applicable): `glb-web-handoff`
- Final communication: `non-blender-user-response-writer`

## Non-goals
- executing Blender or running/generating Python code
- producing or classifying raw render/export artifacts (owned by `render-export-evidence`)
- replacing focused domain validators (`material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, `polycount-budget-checker`)
- owning final handoff gating (`pre-handoff-verification`) or web handoff packaging (`glb-web-handoff`)
- making evidence-free readiness claims

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
