# EVAL — output-format-decision

## Text-only eval prompt
Apply output-format-decision for a web hero output (PNG/WebP, sRGB, 1920×1080, alpha optional).

## Expected behavior
- format chosen (PNG or WebP)
- 8-bit
- sRGB color space
- compression rule
- alpha rule
- caveats
- handoff to render-export-evidence

## Pass / Warn / Fail criteria
- Pass: 4-line format record + caveats + handoff
- Warn: ambiguous compression
- Fail: wrong format (EXR for web), missing bit depth, "any format" answer

## Sample passing response outline
- Consumer + color config header
- Output stream(s) with all 5 fields
- Caveats

## Sample failing response outline
- "Save as PNG"
- No bit depth or color space
