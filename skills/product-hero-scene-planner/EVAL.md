# EVAL — product-hero-scene-planner

## Text-only eval prompt
Use product-hero-scene-planner to create a full cyberpunk shoe hero scene plan without runtime execution.

## Expected behavior
- complete scene plan schema
- clarification questions when needed
- assumptions and caveats explicit

## Pass / Warn / Fail criteria
- Pass: all plan sections + no runtime overclaims
- Warn: minor section gaps with caveats
- Fail: major sections missing or artifact claims without evidence

## Common failure modes
- shallow 3-step plan
- no assumptions policy

## Evidence expectations
- plan sections listed
- unresolved assumptions listed
- runtime status marked Not Run in text-only mode

## Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
