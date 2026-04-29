# Law: evidence-before-done

Status: Draft v0

## Purpose
Block readiness/success claims that are not backed by evidence.

## Applies to
All skills/workflows/evals/pack outputs.

## Must do
- include artifact status (`Produced`, `Not Produced`, `Not Run`)
- include verification outcomes
- include caveats for unresolved checks

## Must not do
- must not claim preview/render/GLB exists without evidence
- must not mark Ready if evidence is missing

## Blocking conditions
- success claim appears without artifact/evidence section

## Validation
- pass/warn/fail present
- final verdict maps to evidence state

## Good example
“Status: Conditionally Ready. Plan complete; runtime artifacts Not Run.”

## Bad example
“Everything exported and ready.” (no evidence)
