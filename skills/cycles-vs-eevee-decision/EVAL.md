# EVAL — cycles-vs-eevee-decision

## Text-only eval prompt
Apply cycles-vs-eevee-decision for a hero product render with caustics + SSS, time budget 10 minutes per frame, OPTIX GPU available.

## Expected behavior
- engine: Cycles (caustics + SSS need it)
- samples: 256-512 with denoiser
- GPU device: OPTIX
- time budget realistic at chosen samples
- caveats listed
- handoff: render-export-evidence

## Pass / Warn / Fail criteria
- Pass: engine + samples + GPU + caveats + handoff
- Warn: borderline samples for time budget
- Fail: Eevee for caustics, samples severely under-budget, no GPU device chosen

## Sample passing response outline
- Use case + features + time + machine header
- Engine config (5 lines)
- Caveats

## Sample failing response outline
- "Use Cycles"
- No samples / GPU / caveats
