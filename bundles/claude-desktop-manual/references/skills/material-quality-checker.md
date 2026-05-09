# material-quality-checker

Purpose: validate PBR material sanity, texture budgets, and consumer-stack compatibility per material before render or export.

Use before render, before GLB export, after a material change request, or as a sub-check during full quality review.

Do not use to fix materials; this skill validates only.

Return per-material verdict table (albedo, normal, roughness/metallic, texture count + resolution, consumer compatibility, verdict), top-line status, worst-offender list, evidence label.

Hand off to blender-scene-quality-checker (broad review) or render-export-evidence (next runtime step). Pair with lighting-quality-checker, composition-quality-checker, polycount-budget-checker for complete narrow validation.
