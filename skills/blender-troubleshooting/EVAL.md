# EVAL — blender-troubleshooting

Status: Draft v0 text-only baseline  
Scope: structured root-cause diagnosis only; no Blender execution; no artifact claims.

## Text-only eval prompt

Use blender-troubleshooting on a Blender output that does not match intent. Run the 4 phases (reproduce → narrow → identify → propose). Do not run Blender. Do not invent fixes without evidence.

## Expected behavior

- documents expected vs. observed with evidence per phase
- runs Phase 1 reproducibility check before any conclusion
- narrows to the smallest reproducing input
- identifies one root cause + 1-2 rejected alternatives with reasons
- proposes one fix with explicit pass criteria
- hands off to the correct downstream skill (planner / readiness / evidence / response)

## Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Render is black | Expected: cyberpunk-lit shoe; observed: fully black render file | Phase 1: reproducible 3/3. Phase 2: narrowed to lighting plan missing key light. Phase 3: root cause = lighting plan gap. Phase 4: fix = re-run lighting planner | reproducibility, narrowed input, root cause, fix + pass criteria |
| GLB is empty | Expected: GLB with hero shoe + floor; observed: 100-byte empty `.glb` | Phase 1: reproducible. Phase 2: narrowed to export plan excluded geometry. Phase 3: root cause = export plan misconfig. Phase 4: fix = re-run GLB handoff | same fields |
| Final response uses jargon | Expected: plain-language; observed: "BSDF subsurf topology" | Phase 1: reproducible. Phase 2: response writer received raw plan dump. Phase 3: root cause = missing translation step. Phase 4: fix = route through `non-blender-user-response-writer` | same fields |
| Symptom intermittent | Render is black 1/5 runs | Phase 1: marked intermittent, ≥2 reproductions before continuing. No fix proposed yet | intermittent flag, no fix, request for more evidence |
| Evidence missing | Operator says "the output is wrong" but no file path / log | Phase 1 blocked. Cannot proceed. Route to readiness checker for evidence collection | blocked phase 1 explicit, no speculative fix |
| Two equally plausible causes | Lighting plan AND camera plan both could explain wrong framing | Phase 3: cause ranked by evidence weight, second cause marked "alternative pending more evidence" | ranked list, alternative kept open |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| Expected outcome | Quoted from intent / brief / planner |
| Observed outcome | File path / screenshot / log / response text |
| Phase 1 (reproduce) | Reproducibility count, locked inputs |
| Phase 2 (narrow) | Minimum reproducing input |
| Phase 3 (identify) | One root cause + alternatives considered + rejection reasons |
| Phase 4 (propose) | One fix + explicit pass criteria + handoff skill |
| Runtime status | Unchanged by this skill |
| Artifact status | Unchanged by this skill |

## Pass / Warn / Fail criteria

- Pass: all 4 phases completed or explicitly marked blocked, root cause is one sentence, alternatives ranked, fix has pass criteria, handoff named
- Warn: phases completed but reproducibility unclear, or alternatives not ranked, or fix lacks pass criteria
- Fail: skipped phases, multiple speculative causes claimed simultaneously, fix proposed without root cause, claimed Blender execution from this skill

## Common failure modes

- proposing fixes in Phase 1 (before reproduction is locked)
- listing 5+ possible causes without ranking
- skipping Phase 2 narrowing
- claiming "I'll re-render now" — this skill never re-runs
- using Blender jargon in the operator-facing summary

## Evidence expectations

- diagnostic record visible per phase
- evidence cited for every claim
- explicit `blocked` markers when evidence missing
- handoff skill named with one-sentence justification

## Sample passing response outline

- Expected: <quote from intent>
- Observed: <evidence>
- Phase 1 (reproduce): <count, locked inputs>
- Phase 2 (narrow): <minimum reproducing input>
- Phase 3 (identify): root cause = <one sentence>; rejected alternatives = <list with reasons>
- Phase 4 (propose): fix = <one sentence>; pass criteria = <observable test>; handoff = <skill name>

## Sample failing response outline

- Skipped Phase 1, jumped to "probably needs better lighting"
- Listed 4 possible causes without evidence ranking
- Proposed fix without pass criteria
- Claimed "I'll re-render with better settings" (this skill never executes)
