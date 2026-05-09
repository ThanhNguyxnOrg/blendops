# EVAL — preview-report-template-writer

## Text-only eval prompt
Use preview-report-template-writer to summarize a Path 1 (host a Anthropic Connector) full recipe run that produced a render PNG and a GLB.

## Expected behavior
- report kind = full (preview + render + export)
- artifact rows for render PNG and GLB with path + metric + truth label + validation notes
- runtime path: Path 1 host a Anthropic Connector
- tool versions recorded or marked unknown
- top-line status matches rows
- handoff to glb-web-handoff named

## Pass / Warn / Fail criteria
- Pass: full schema filled, truth labels honest, runtime path recorded, handoff named
- Warn: schema filled but tool versions missing, or validation notes thin
- Fail: `Verified` label without validation, or fabricated path, or runtime path missing

## Common failure modes
- writing prose summary instead of canonical schema
- upgrading `Produced` → `Verified` without validation evidence
- mixing Path 1 + Path 2 in one report (forbidden by single-bridge constraint)

## Evidence expectations
- canonical schema layout (per references/report-schema.md)
- per-row truth labels matching laws/evidence-before-done.md
- explicit runtime path

## Sample passing response outline
- Header (date, operator, runtime path, tool versions)
- Artifacts table with PNG and GLB rows + truth labels
- Validation checks
- Top-line: Pass
- Next: glb-web-handoff

## Sample failing response outline
- Free-form text "Render and GLB done"
- No path, no truth label
- Verified claim without validation evidence
