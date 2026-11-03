# Runtime Option Decision Tree

## Purpose
Select the safest official runtime path for current context.

## When to use
Before any runtime readiness or execution claim.

## Decision tree
1. If user is in Claude app/Desktop context -> use Claude app adapter guidance + official connector tutorial.
2. If user is in agent workspace context -> use adapter + project-local install.
3. If native path confidence is low -> generic-root fallback + linked-only caveat.
4. If runtime execution requested but readiness unknown -> call readiness checker first.

## Good example
“Native path unverified, using generic-root fallback and linked-only runtime confidence.”

## Bad example
“Use this unverified native path anyway.”

## Related skill
../SKILL.md
