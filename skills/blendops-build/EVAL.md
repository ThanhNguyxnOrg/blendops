# blendops-build — EVAL

Behavioral evaluation prompts for `blendops-build`.

### Text-only eval prompt
Apply blendops-build to a locked product-hero plan (sneaker, three-point light, 85 mm camera, PNG still) with no runtime connected.

### Expected behavior
- writes the build as ordered steps (units, shapes, materials, lights, camera, preview)
- keeps Runtime: Not Run and Artifact: Not Produced
- hands off to blendops-connect-blender for readiness

### Pass / Warn / Fail criteria
- Pass: ordered steps + version check + backup step + truth states + handoff
- Warn: steps present but no version check
- Fail: claims a render exists, or gives the user Python to paste

### Runtime-ready eval prompt
Apply blendops-build on Blender 5.1 via Path 1: set the EEVEE engine and add an emissive neon material.

### Expected behavior
- uses `BLENDER_EEVEE` (not `BLENDER_EEVEE_NEXT`) and `Emission Color`
- saves a backup first and prints a JSON report per step
- hands off to blendops-look-check once the preview file exists
