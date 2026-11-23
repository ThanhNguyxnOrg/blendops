# blendops-render-settings — EVAL

Behavioral evaluation prompts for `blendops-render-settings`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-render-settings`

### Text-only eval prompt
Apply blendops-render-settings for a hero product render with caustics + SSS, time budget 10 minutes per frame, OPTIX GPU available.

### Expected behavior
- engine: Cycles (caustics + SSS need it)
- samples: 256-512 with denoiser
- GPU device: OPTIX
- time budget realistic at chosen samples
- caveats listed
- handoff: blendops-final-check

### Pass / Warn / Fail criteria
- Pass: engine + samples + GPU + caveats + handoff
- Warn: borderline samples for time budget
- Fail: Eevee for caustics, samples severely under-budget, no GPU device chosen

### Sample passing response outline
- Use case + features + time + machine header
- Engine config (5 lines)
- Caveats

### Sample failing response outline
- "Use Cycles"
- No samples / GPU / caveats

## From former `blendops-render-settings`

### Text-only eval prompt
Apply blendops-render-settings for a web hero output (PNG/WebP, sRGB, 1920×1080, alpha optional).

### Expected behavior
- format chosen (PNG or WebP)
- 8-bit
- sRGB color space
- compression rule
- alpha rule
- caveats
- handoff to blendops-final-check

### Pass / Warn / Fail criteria
- Pass: 4-line format record + caveats + handoff
- Warn: ambiguous compression
- Fail: wrong format (EXR for web), missing bit depth, "any format" answer

### Sample passing response outline
- Consumer + color config header
- Output stream(s) with all 5 fields
- Caveats

### Sample failing response outline
- "Save as PNG"
- No bit depth or color space
