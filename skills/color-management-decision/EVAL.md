# EVAL — color-management-decision

## Text-only eval prompt
Apply color-management-decision for a web hero PNG output, sRGB consumer pipeline.

## Expected behavior
- Display Device: sRGB
- View Transform: Filmic (or Standard for pure flat color)
- Look: None or Medium High Contrast
- Sequencer: sRGB
- Output rule: PNG 8-bit sRGB
- Caveats: per-channel texture rules (color sRGB, data Linear)
- handoff: render-export-evidence

## Pass / Warn / Fail criteria
- Pass: 4-line config + per-output + caveats + handoff
- Warn: config pinned but caveat thin
- Fail: wrong pipeline match, "looks good" verdict, skipped per-channel rules

## Sample passing response outline
- Consumer pipeline + outputs header
- 4-line config
- Per-output rules
- Caveats list

## Sample failing response outline
- "Use Filmic"
- No pipeline context
