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
