# Readiness Matrix

## Purpose
Map checks to readiness statuses.

## When to use
In official-runtime-readiness-checker outputs.

## Matrix
- Blender executable: pass/warn/fail
- connector availability: pass/warn/fail/unknown
- MCP availability: pass/warn/fail/unknown
- output path readiness: pass/warn/fail

## Status mapping
- Ready
- Partially Ready
- Blocked
- Unknown

## Good example
Status aligns with matrix evidence.

## Bad example
Status says Ready while matrix has critical fail.

## Related skill
../SKILL.md
