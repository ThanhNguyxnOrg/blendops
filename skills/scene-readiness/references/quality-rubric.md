# Quality Rubric

## Purpose
Provide category rubric guidance for scene quality checks.

## When to use
During scene-readiness scoring.

## Patterns
- evaluate by category before verdict
- tie each score to evidence/caveat state
- **Reference-Image-Match loop** (when target reference images exist): check silhouette and real-world bounding proportions (`dimensions`) at blockout *before* adding detail; compare at least two camera angles rather than one flattering shot
- **Quantitative scene introspection**: pair visual inspection with evaluated object counts, world-space bounding boxes, z-fight / floating tolerance checks, and `Z = 0` grounding checks
- **Simulation / bake cache gate**: distinguish replay preview caches from baked `ALL` caches (cloth, fluid, smoke); a modifier without a verified disk bake is never complete for simulation handoff

## Good example
Each category has pass/warn/fail with rationale, reference-silhouette checks when references exist, and explicit separation between planning readiness (`Conditionally Ready`) and runtime/artifact truth states.

## Bad example
Single summary verdict without category detail, or approving a multi-angle hero asset from a single front screenshot alone.

## Related skill
../SKILL.md
