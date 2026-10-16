---
name: glb-animation-handoff
description: Document GLB animation contract (skeletal vs morph, FPS, looping, root motion, blend transitions) with truthful caveats for web playback.
---

# glb-animation-handoff

## Purpose
When a GLB ships with animation, capture the exact playback contract the consumer needs (which clips exist, how to start them, what loops, what does not) so the web side does not guess.

## Quick start
- enumerate every animation clip in the scene plan or exported GLB
- mark the type of each clip (skeletal / morph / both)
- pin FPS, loop semantics, transitions, root-motion treatment
- flag web-playback caveats per clip (Three.js animationMixer, glTF spec quirks)

## When to use
- the GLB has at least one animation clip
- before final glb-web-handoff
- when the consumer is a web app (Three.js / R3F / Babylon / model-viewer)
- when the user mentions "idle", "loop", "transition", "interactive trigger"

## When not to use
- static GLBs with no animation
- video pre-renders
- platforms that re-author animation downstream (game engines re-rigging the asset)

## Trigger phrases
- "make it loop"
- "trigger animation on hover"
- "idle and active states"
- "smooth transition between"

## Prerequisites / readiness
- scene plan or exported GLB lists clip names
- target web stack known (Three.js / R3F / Babylon / model-viewer)
- expected user trigger pattern known (auto-loop / hover / click / scroll)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Clip list (names + lengths in frames or seconds) | Consumer must know what exists without inventing clips |
| Clip type per clip (`skeletal` / `morph` / `both`) | Determines rig vs morph target handling |
| Target FPS | Determines time-base mapping for the consumer |
| Loop / one-shot / chain semantics per clip | Determines playback behavior |
| Trigger model | Auto / hover / click / scroll / programmatic |
| Blend duration | Crossfade duration for chained or interactive transitions |
| Root-motion treatment (`bake` or `strip`) | Binary choice per clip; never ambiguous or combined |
| Interpolation (`LINEAR` / `STEP` / `CUBICSPLINE`) | Always pinned per clip |

### Optional inputs

| Input | Use |
|---|---|
| Channel, bone, and morph ceilings | Sourced from `glb-mobile-performance-budget` to keep contract within budget |
| Target consumer stack | Tailors caveats for Three.js, R3F, Babylon, or model-viewer |

### Assumptions to confirm
- Animation timing is recorded in seconds (not just frames) for portability.
- Interpolation type (`LINEAR` / `STEP` / `CUBICSPLINE`) and binary root-motion treatment (`bake` or `strip`) are explicitly pinned for every clip.
- Channel, bone, and morph target ceilings are pinned by `glb-mobile-performance-budget`.

## Output schema

### Primary output
A structured animation contract before `glb-web-handoff`: per-clip rows with type (`skeletal` / `morph` / `both`), length, FPS, `loop` / `one-shot` / `chain`, trigger, blend, binary root-motion (`bake` or `strip`), and interpolation (`LINEAR` / `STEP` / `CUBICSPLINE`).

### Secondary output
- consumer-stack-specific caveats (Three.js / R3F / Babylon / model-viewer)
- a "what to verify after export" checklist (paired with `render-export-evidence` and manual viewer test)
- explicit assumptions, budget ceiling references (`glb-mobile-performance-budget`), and named next handoff

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

Default for planning documentation is `Runtime status: Not Run` and `Artifact status: Not Produced`. Truth states are downgrade-only, never upgraded by this skill.

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

This skill is documentation-only. It never exports GLB, runs Blender, writes Python, or claims that a clip plays correctly without measured evidence (`render-export-evidence` for export proof plus manual viewer test for playback).

If runtime execution is needed, refer to `../../docs/runtime-stack-strategy.md` and hand off export verification to `render-export-evidence`.

## Operating procedure

1. Read the existing clip list from the upstream scene plan or verified export report (never invent clips).
2. Confirm animation channel, bone, and morph ceilings from `glb-mobile-performance-budget`.
3. For each clip, fill the contract row: type (`skeletal` / `morph` / `both`), length, FPS, `loop` / `one-shot` / `chain`, trigger, blend, root-motion (`bake` or `strip`), and interpolation (`LINEAR` / `STEP` / `CUBICSPLINE`).
4. Apply consumer-stack caveats (`references/web-stack-caveats.md`), animation-type caveats (`references/animation-types.md`), and transition rules (`references/transition-rules.md`).
5. Attach the "what to verify after export" checklist covering `render-export-evidence` and manual viewer testing.
6. Record truth states (`Runtime status: Not Run`, `Artifact status: Not Produced` default; downgrade-only, never upgrade).
7. Hand off to `glb-web-handoff` (and `three-fiber-component-shape-planner` if R3F, then `non-blender-user-response-writer` for final user wording).

## Decision tree

```txt
Clip list unknown?
  → Do not invent clips; hand off to product-hero-scene-planner, character-portrait-scene-planner, environment-establishing-shot-planner, interior-architectural-scene-planner, or product-grid-scene-planner first
Channel, bone, or morph ceiling unpinned or exceeded?
  → Hand off to glb-mobile-performance-budget
Multiple clips meant to chain or transition?
  → Document blend duration explicitly per clip pair
Root motion present?
  → Pick binary treatment per clip: bake OR strip (never both, never undefined)
Export proof or playback verification needed?
  → Hand off to render-export-evidence + require manual viewer test
```

## Playbooks

### Playbook A: Idle-only loop

Single skeletal idle clip, auto-loop on mount. Pin type, length, FPS, `loop`, auto trigger, `0ms` blend, root-motion (`strip` or `bake`), and interpolation (`LINEAR` / `STEP` / `CUBICSPLINE`).

### Playbook B: Idle + active (hover/click)

Two clips. Pin FPS, length, trigger, crossfade blend duration (e.g., 200–400ms), return-to-idle chain semantics, binary root-motion (`bake` or `strip`), and interpolation (`LINEAR` / `STEP` / `CUBICSPLINE`) for each clip.

### Playbook C: Scroll-driven scrub

Single clip driven by scroll progress (`one-shot` / programmatic scrub trigger). Pin length, FPS, blend (`0ms`), binary root-motion (`bake` or `strip`), and interpolation (`LINEAR` / `STEP` / `CUBICSPLINE`). Never promise playback smoothness.

## Mode handling

### Text-only mode

Produce the animation contract from the scene plan; set `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Runtime-ready mode

Keep this skill's contract truth states downgrade-only (default `Runtime status: Not Run`, `Artifact status: Not Produced`; never upgrade here). Route export verification to `render-export-evidence` and require a manual viewer test to verify clip count, lengths, and playback behavior against the contract.

### Blocked runtime mode

Produce the planning contract with `Runtime status: Not Run` and `Artifact status: Not Produced`, and explicitly list which verification items remain blocked pending `render-export-evidence` and manual viewer testing.

## Validation checklist

* [ ] Every clip from the scene plan is listed (no invented clips)
* [ ] Type pinned per clip (`skeletal` / `morph` / `both`)
* [ ] Length and FPS pinned per clip
* [ ] `loop` / `one-shot` / `chain` semantics explicit per clip
* [ ] Trigger model and blend duration explicit per clip
* [ ] Root-motion treatment chosen as binary (`bake` or `strip`, never both)
* [ ] Interpolation pinned per clip (`LINEAR` / `STEP` / `CUBICSPLINE`)
* [ ] Channel, bone, and morph counts checked against ceilings from `glb-mobile-performance-budget`
* [ ] Consumer-stack caveats and what-to-verify checklist included
* [ ] Truth states default to `Runtime status: Not Run` and `Artifact status: Not Produced` (downgrade-only, never upgraded)
* [ ] No smoothness promises and no Python snippets
* [ ] Next handoff skill explicitly named (`glb-web-handoff`)

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All per-clip contract fields pinned (including FPS, binary root-motion, and interpolation), stack caveats and verify checklist included, truth states honest and downgrade-only, handoff named. |
| Warn | Contract present but blend duration, trigger detail, or stack caveats are incomplete. |
| Fail | Inventing clips, promising smoothness, omitting FPS / interpolation / binary root-motion, including Python snippets, upgrading truth states, or claiming clips play correctly without `render-export-evidence` + manual viewer test. |

## Failure handling

* If clip list is unknown → do not invent clips; hand off to the appropriate scene planner (`product-hero-scene-planner`, `character-portrait-scene-planner`, `environment-establishing-shot-planner`, `interior-architectural-scene-planner`, or `product-grid-scene-planner`).
* If consumer stack is unknown → list caveats per stack and ask the user to confirm before `glb-web-handoff`.
* If channel, bone, or morph counts exceed ceilings → hand off to `glb-mobile-performance-budget`.
* If export proof is missing → keep `Runtime status: Not Run` and `Artifact status: Not Produced`, and hand off to `render-export-evidence`.

## Troubleshooting

| Problem | Response |
|---|---|
| Clip plays at wrong speed in web viewer | Check that the contracted FPS and clip length in seconds match the consumer stack playback settings during manual viewer test. |
| Clip transition pops or loops abruptly | Verify `loop` / `one-shot` / `chain` semantics, blend duration, and pinned interpolation (`LINEAR` / `STEP` / `CUBICSPLINE`) in the contract. |
| Bone or channel limits exceeded on target device | Hand off to `glb-mobile-performance-budget` to enforce bone, morph, and animation channel ceilings. |
| Unverified export or missing clips in file | Hand off to `render-export-evidence` for export verification and perform a manual viewer test. |

## Best practices

* Always pin FPS and interpolation (`LINEAR` / `STEP` / `CUBICSPLINE`) per clip, even when the user thinks defaults are sufficient.
* Treat root motion as a strict binary choice (`bake` or `strip`), never undefined or mixed.
* Always pair with `glb-mobile-performance-budget` for channel, bone, and morph ceilings.
* Never invent clips and never promise playback smoothness.

## Good examples

* "Clips: `idle` (`skeletal`, `4s`, `30fps`, `loop`, `auto`, blend `0ms`, root-motion `strip`, `LINEAR`), `wave` (`skeletal`, `2s`, `30fps`, `one-shot` chain to `idle`, `hover`, blend `250ms`, root-motion `strip`, `LINEAR`). Ceilings (via `glb-mobile-performance-budget`): channels 24/50, bones 32/64, morphs 0/8. What to verify: confirm export via `render-export-evidence` and manual viewer test. `Runtime status: Not Run`, `Artifact status: Not Produced`. Next: `glb-web-handoff`."

## Bad examples

- "It animates." — no contract.
- "Will be smooth." — no FPS, no blend, no measurement.

## User-facing response template

```txt
Clip contract:
  <clip name>: <skeletal|morph|both> | <length s> | <fps> | <loop|one-shot|chain> | <trigger> | <blend ms> | <bake|strip> | <LINEAR|STEP|CUBICSPLINE>

Consumer stack: <three.js / r3f / babylon / model-viewer>
Stack-specific caveats: <list>

Budget check (from glb-mobile-performance-budget):
  Animation channels: <N> of <ceiling>
  Bones: <N> of <ceiling>
  Morph targets: <N> of <ceiling>

What to verify after export:
  - [ ] Export proof verified via render-export-evidence
  - [ ] Clip names, lengths, FPS, and loop/chain behavior checked in manual viewer test
  - [ ] Root-motion (bake vs strip) and blend transitions verified in target consumer stack

Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <gaps>
Next: glb-web-handoff
```

## Anti-patterns

* Inventing clip names not present in the scene plan.
* Promising playback smoothness under any circumstance.
* Leaving root-motion treatment ambiguous or mixing `bake` and `strip` silently.
* Omitting FPS or interpolation type (`LINEAR` / `STEP` / `CUBICSPLINE`).
* Including Blender Python (`bpy.ops`) snippets.
* Using `Artifact status: Not Run` or upgrading truth states instead of keeping them downgrade-only.

## Cross-skill handoff

* Missing clip list / scene plan → `../product-hero-scene-planner/SKILL.md`, `../character-portrait-scene-planner/SKILL.md`, `../environment-establishing-shot-planner/SKILL.md`, `../interior-architectural-scene-planner/SKILL.md`, or `../product-grid-scene-planner/SKILL.md` (owns scene planning and clip list definition)
* Channel, bone, and morph ceilings → `../glb-mobile-performance-budget/SKILL.md` (pins animation channel, bone, and morph ceilings)
* Export verification → `../render-export-evidence/SKILL.md` (verifies exported GLB artifacts)
* Web delivery handoff → `../glb-web-handoff/SKILL.md` (owns web delivery package)
* React Three Fiber component shape → `../three-fiber-component-shape-planner/SKILL.md` (owns R3F component structure)
* Final user-facing wording → `../non-blender-user-response-writer/SKILL.md` (owns plain-language final response)

## Non-goals

* Run Blender or export GLB files.
* Author, retarget, or modify animations.
* Generate Python or `bpy` snippets.
* Promise web-side playback smoothness or upgrade truth states.

## References
- `references/animation-types.md`
- `references/web-stack-caveats.md`
- `references/transition-rules.md`
- `../../docs/skill-system.md`
