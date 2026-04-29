# EVAL — non-blender-user-response-writer

## Text-only eval prompt
Use non-blender-user-response-writer to transform technical findings into plain-language user output.

## Expected behavior
- clear summary
- verified/unverified split
- prioritized next action

## Pass / Warn / Fail criteria
- Pass: plain language + truthful caveats
- Warn: minor jargon remains but understandable
- Fail: overclaiming or jargon-heavy output

## Common failure modes
- hiding blockers
- unsupported certainty language

## Evidence expectations
- status aligned with evidence
- caveats included
- next action included

## Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
