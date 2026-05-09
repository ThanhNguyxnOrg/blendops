# EVAL — resolution-aspect-decision

## Text-only eval prompt
Apply resolution-aspect-decision for a web hero retina (16:9, 2880×1620, downscale to 1920×1080 + 960×540).

## Expected behavior
- aspect 16:9
- resolution 2880×1620
- downscale margin yes
- multi-resolution outputs listed
- caveats
- handoff to render-export-evidence

## Pass / Warn / Fail criteria
- Pass: aspect + resolution + DPI + downscale margin + caveats + handoff
- Warn: borderline resolution
- Fail: aspect mismatch, upscale plan, "1080p" without aspect

## Sample passing response outline
- Consumer + aspect + resolution + DPI rows
- Multi-resolution outputs
- Caveats

## Sample failing response outline
- "1080p"
- No aspect
