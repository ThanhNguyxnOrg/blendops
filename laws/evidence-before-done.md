# Law: evidence-before-done

Status: 1.0.0

## Purpose
Block readiness/success claims that are not backed by evidence.

## Applies to
All skills/workflows/evals/pack outputs.

## Must do
- include artifact status (`Not Produced`, `Produced`, `Verified`, `Failed`)
- include runtime status (`Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`)
- include verification outcomes
- include caveats for unresolved checks

## Canonical truth states
- Runtime status: `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`.
- Artifact status: `Not Produced` by default; allowed values are `Not Produced`, `Produced`, `Verified`, `Failed` (`Not Run` is never an Artifact status).
- Do not invent other runtime states; a blocked environment stays `Not Run` (nothing attempted) or `Attempted` (started but incomplete).

## Must not do
- must not claim preview/render/GLB exists without evidence
- must not mark Ready if evidence is missing

## Blocking conditions
- success claim appears without artifact/evidence section

## Validation
- pass/warn/fail present
- final verdict maps to evidence state

## Good example
“Status: Conditionally Ready. Plan complete; Runtime status: Not Run; Artifact status: Not Produced.”

## Bad example
“Everything exported and ready.” (no evidence)
