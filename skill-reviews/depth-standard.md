# BlendOps Skill Depth Standard

Status: Draft v0

## What makes a skill professional

A professional skill is:
- operationally specific (clear procedure, branching, and failure behavior)
- evidence-bound (no overclaims)
- user-safe (law-aligned, runtime-boundary-aware)
- handoff-ready (clear next-skill transitions)

## What "too short" means

A skill is too short when it has section headers but lacks practical decision guidance, playbooks, and troubleshooting depth.

## What "long but useless" means

A skill is long-but-useless when it repeats generic statements, lacks decision criteria, and does not improve execution quality.

## Minimum useful sections

Required:
- frontmatter
- purpose
- when to use / when not to use
- trigger phrases
- prerequisites/readiness
- input schema
- output schema
- required laws
- official runtime boundary
- operating procedure
- decision tree
- mode handling
- validation checklist
- pass/warn/fail rubric
- failure handling
- troubleshooting
- best practices
- good examples
- bad examples
- cross-skill handoff
- non-goals
- references

## Minimum useful examples

- at least 1 realistic good example
- at least 1 realistic bad example
- at least 2 mode-sensitive response variants for critical skills

## Minimum troubleshooting depth

Each skill should document:
- common issue
- likely cause
- exact response behavior
- whether status must be downgraded

## Minimum reference support

- official runtime links in every skill
- skill-local references for reusable checklists/playbooks

## Expected line count ranges (guidance, not sole metric)

- setup/readiness skills: 250–450 lines
- planning skills: 300–550 lines
- quality/checker/handoff skills: 300–500 lines
- response-writing skill: 220–400 lines
- reference docs: 80–250 lines when useful

## Quality-over-length rule

Line count alone does not define quality.
Skills must be dense with actionable operational content, not filler.
