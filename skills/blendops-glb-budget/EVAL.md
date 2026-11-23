# blendops-glb-budget — EVAL

Behavioral evaluation prompts for `blendops-glb-budget`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-glb-budget`

### Text-only eval prompt
Use blendops-glb-budget to set a planning budget for a "make this work on mobile web" GLB intent.

### Expected behavior
- explicit device tier, scope, and target context chosen
- numeric budget table covering triangles, vertices, GLB file size, texture pixel budget, materials, draw calls, animation channels, bones, morph targets
- violation rule list
- degradation plan
- compliance label `Not Run` (planning only, no measurement)
- handoff to next skill named

### Pass / Warn / Fail criteria
- Pass: full numeric budget + tier + violations + degradation + Not Run label
- Warn: budget present but tier or scope ambiguous; degradation partial
- Fail: "will run on mobile" claim with no numbers, OR treating budget as a benchmark, OR claiming compliance without measurement

### Common failure modes
- giving only triangle count, no texture or file size budget
- promising performance without measurement
- mixing device tiers without picking one
- omitting AR-specific stricter caps when AR context is present

### Evidence expectations
- numeric values for every budget row
- assumption section about FOV, network, and headroom
- explicit handoff target

### Sample passing response outline
- Device tier + scope + context stated
- Budget table with concrete numbers per row
- Violations would block handoff: yes
- Degradation order listed
- Compliance: Not Run

### Sample failing response outline
- "Should be fine on iPhone X" without numbers
- Triangle cap given without texture / file-size companions
- Compliance claimed without runtime measurement

## From former `blendops-glb-budget`

### Text-only eval prompt
Use blendops-glb-budget on a mid-mobile product hero scene (total cap 50K) with 4 meshes: shoe-upper 18K, sole 8K, laces 5K, ground-shadow 1K.

### Expected behavior
- pinned budget header (50K total + per-mesh cap)
- per-mesh rows with triangle count + % of total + verdict + hint
- worst-offender highlight (shoe-upper at 18K = 36% of total)
- total: 32K of 50K (64%)
- top-line: Pass (within budget, no single dominator)
- evidence label honest

### Pass / Warn / Fail criteria
- Pass: full per-mesh data + correct totals + top-line consistent
- Warn: rows present but missing per-mesh cap comparison or hint advisory missing
- Fail: invents counts, claims compliance without numbers, decimates inside the skill

### Common failure modes
- broad summary without per-mesh rows
- skipping per-mesh cap comparison
- mixing other quality checks
- claiming Verified without measurement

### Evidence expectations
- triangle counts cited
- per-mesh + total cap headers
- hints labeled advisory

### Sample passing response outline
- Header: pinned budget
- 4 mesh rows
- Total + worst offender
- Top-line: Pass
- Next: handoff named

### Sample failing response outline
- "Polycount fine"
- No row data
- Verified without measurement
