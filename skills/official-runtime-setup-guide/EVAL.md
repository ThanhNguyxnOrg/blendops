# EVAL — official-runtime-setup-guide

## Text-only eval prompt
Use official-runtime-setup-guide to determine official runtime options and confidence labels for this workspace. Do not run Blender.

## Expected behavior
- outputs official runtime hierarchy
- includes confidence labels
- avoids runtime success claims

## Pass / Warn / Fail criteria
- Pass: official refs + confidence + safe boundary
- Warn: partial confidence labels, no overclaims
- Fail: non-official runtime path or runtime claim without evidence

## Common failure modes
- guessing setup commands
- mixing install and runtime execution claims

## Evidence expectations
- reference links listed
- confidence labels present
- explicit Not Run runtime state when applicable

## Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
