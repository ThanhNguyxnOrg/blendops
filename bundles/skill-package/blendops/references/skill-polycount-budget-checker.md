# polycount-budget-checker

Purpose: validate per-mesh and total-scene triangle counts vs the pinned budget; flag worst offenders and topology hints without modeling.

Use before render or GLB export, after a mesh change, or as a sub-check during full quality review when `glb-mobile-performance-budget` is pinned.

Do not use to fix topology; this skill validates only. Do not use for material / lighting / composition / broad readiness.

Output contract: per-mesh row table (triangle count + % of total + verdict + advisory hint), top-line status, worst-offender highlight, evidence label.
