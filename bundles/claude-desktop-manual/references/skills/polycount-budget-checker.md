# polycount-budget-checker

Purpose: validate per-mesh and total-scene triangle counts vs the pinned budget; flag worst offenders and topology hints without modeling.

Use before render or GLB export, after a mesh change, or as a sub-check during full quality review when `glb-mobile-performance-budget` is pinned.

Do not decimate or retopologize; this skill validates only. Hints are advisory.

Return per-mesh row table (triangle count + % of total + verdict + advisory hint), pinned budget header, top-line status, worst-offender highlight, evidence label.

Hand off to blender-scene-quality-checker or back to glb-mobile-performance-budget if budget needs revisiting. Pair with material-quality-checker, lighting-quality-checker, composition-quality-checker.
