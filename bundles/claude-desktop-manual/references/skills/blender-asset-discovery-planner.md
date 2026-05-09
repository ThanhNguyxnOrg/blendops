# blender-asset-discovery-planner (reference summary)

## Purpose
Per-asset acquisition strategy (procedural / library / generative / photogrammetry) before scene planning. BlendOps-specific (no direct Superpowers or BMad analog).

## When to use
- after the 8-slot brief is locked, before any scene plan
- when scene assets aren't trivially given (e.g. user says "shoe" but doesn't supply a model)
- when poly budget / GLB size / brand-licensing constraints exist

## When not to use
- user supplied all assets in the brief
- runtime is already executing
- request is iteration on existing scene

## Output/evidence contract
Per-asset-class plan with strategy + source candidate + license + confidence label + risk. Poly / GLB budget summed and compared to brief constraints. Generative strategy flagged with Path 2 caveat. This skill never fetches / installs / generates.

## Handoff notes
After plan: `product-hero-scene-planner` (or relevant planner) with brief + asset plan. If generative chosen and runtime unknown: `official-runtime-readiness-checker`. If license risk surfaces: route back to `intent-to-3d-brief-writer` slot 4.
