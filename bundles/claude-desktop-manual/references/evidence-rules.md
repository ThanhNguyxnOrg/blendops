# Evidence Rules (Condensed)

Use evidence-gated truth labels:

- Runtime status: `Not Run | Attempted | Produced | Verified | Failed`
- Artifact status: `Not Produced | Produced | Verified | Failed`

Required behavior:
- do not claim preview/render/GLB artifacts without evidence,
- include caveats when evidence is incomplete,
- downgrade claims when validation is missing.

A transcript alone is not enough for runtime success. Evidence must include output path/visible output plus validation notes.
