# EVAL — asset-fallback-strategy

## Text-only eval prompt
Apply asset-fallback-strategy on a failed hero-shoe-mesh.glb (license-blocked) for a commercial brand campaign brief.

## Expected behavior
- 2-3 options (CC0 / paid commercial / procedural / drop)
- columns: time / brief match / license / recommendation
- recommendation given
- user agreement required
- caveat for drop option
- updated asset list

## Pass / Warn / Fail criteria
- Pass: 2-3 options + recommendation + agreement required + caveat
- Warn: options thin or recommendation soft
- Fail: silent substitution, no caveat, no agreement

## Common failure modes
- "we'll figure it out"
- skipping license check on fallback
- silent substitution
- omitting drop option

## Sample passing response outline
- Failed asset + reason
- Options table with columns
- Recommendation
- "Decision needed"
- Caveat / updated list

## Sample failing response outline
- "Use anything similar"
- No options table
