# Stop condition templates

## Template by recipe type

### Render hero
"Done = `out/<name>.png` exists at <W>×<H>, <samples>+ samples, mood matches brief reference (diff < <X>%), validation logged in `docs/evals/...`."

### GLB export
"Done = `out/<name>.glb` exists, `gltf-validator` passes, triangle count <= <budget>, animation contract documented in `glb-animation-handoff` output."

### Text-only scene plan
"Done = scene plan with all <N> required sections concrete (no "TBD"), asset list flagged for discovery, handoff to `<next skill>`."

### Multi-render grid
"Done = <N> renders exist for grid cells, all consistent (camera + lighting + background within tolerance), composite layout image produced."

### Pre-runtime readiness
"Done = readiness checklist all green, runtime path chosen + recorded, no Blocked items remain."

### Final response writing
"Done = stakeholder-facing response written, jargon checked, evidence labels honest, no overclaim."

## Common boilerplate

Every stop condition contains:
- A specific artifact or evaluable state.
- A measurable threshold (resolution, samples, count, percentage).
- A reference for "match" if applicable (brief, image, validator output).
- A truth label rule per `evidence-before-done.md`.

## Templates to NOT use

- "Done when good."
- "Done when ready."
- "Done when the user says so." (Imprecise; user input is needed for scope agreement, not the stop condition itself.)
- "Done when there are no blockers." (Negative phrasing; rephrase positively.)

## Related skill
`../SKILL.md`
