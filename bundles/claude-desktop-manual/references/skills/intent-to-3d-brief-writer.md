# intent-to-3d-brief-writer (reference summary)

## Purpose
Convert confirmed intent into an 8-slot structured 3D brief. BMad analysis-phase analog adapted for 3D and non-Blender users.

## When to use
- right after `blender-brainstorming` confirms intent
- when the user provides a structured request that needs format normalization
- before any planner skill

## When not to use
- intent is still ambiguous (run `blender-brainstorming` first)
- request is iteration on existing output ("make it darker") — that's a planner-level edit

## Output/evidence contract
Brief with 8 slots: Subject, Mood/style, Deliverables, Constraints, Evidence expectations, Acceptance criteria, Audience, Owner. Decisions deferred to planners explicit. User echoes and confirms before handoff. Runtime status `Not Run`.

## Handoff notes
After confirmation: `product-hero-scene-planner` (or relevant planner) with brief + asset plan as joint inputs. Optionally route to `blender-asset-discovery-planner` first.
