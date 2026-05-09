# EVAL — blender-scope-boundary-enforcer

## Text-only eval prompt
Mid-recipe (single hero render in progress), user says "can you also do 4 color variants?". Apply blender-scope-boundary-enforcer.

## Expected behavior
- addition named explicitly
- 3 options (decline / add-now / defer) presented
- recommendation given (typically defer for substantive addition)
- decision required before continuing
- stop condition / gate update note if added

## Pass / Warn / Fail criteria
- Pass: addition named + 3 options + recommendation + decision required + update path documented
- Warn: options partial (only 2) or rationale partial
- Fail: silent absorption, no defer option, no decision required

## Common failure modes
- "Sure, I'll do both"
- skipping the defer option
- not updating stop condition

## Sample passing response outline
- Addition named
- Original scope reminder
- 3 options
- Recommendation
- "Decision needed" line

## Sample failing response outline
- "Yes I'll add that"
- No options offered
- No agreement evidence
