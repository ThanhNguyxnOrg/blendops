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
| Clip list (names + lengths in frames or seconds) | Consumer must know what exists |
| Target FPS | Determines time-base mapping for the consumer |
| Loop / one-shot / chain semantics per clip | Determines play behavior |
| Trigger model | Auto / hover / click / scroll / programmatic |

### Optional inputs

| Input | Use |
|---|---|
| Bone hierarchy summary | Helps consumers warn on missing bones |
| Morph target list | For face / shape variants |
| Root motion treatment | Bake into clip or strip and apply at runtime? |
| Blend duration between transitions | Gives consumer animation mixer crossfade hint |

### Assumptions to confirm
- Animation timing is recorded in seconds (not just frames) for portability.
- glTF binary stores animation samplers as keyframe arrays; ensure interpolation type is documented (LINEAR / STEP / CUBICSPLINE).
- Skinned meshes need bone count below the consumer's per-mesh limit (web stacks vary).

## Output schema

### Primary output
A structured animation contract: per-clip rows with type, length, FPS, loop, trigger, blend, root-motion, caveats.

### Secondary output
- consumer-stack-specific caveats (Three.js / R3F / Babylon / model-viewer)
- a "what to verify after export" checklist
- assumptions and limitations explicit

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

This skill is documentation-only. It does not export GLB, run Blender, or claim that a clip plays correctly without measured evidence (`render-export-evidence` for export proof + manual viewer test for playback).

If runtime is involved, refer to `../../docs/runtime-stack-strategy.md` for the 2-path + CLI appendix model. Animation export tools work in all paths but caveats differ (CLI requires explicit `bpy.ops.export_scene.gltf(filepath=..., export_animations=True)` and add-on enable).

## Operating procedure
1. Read the clip list from scene plan or measured GLB (`gltf-validator` output is ideal).
2. For each clip, fill the contract row.
3. Apply consumer-stack caveats (see `references/web-stack-caveats.md`).
4. Apply animation-type caveats (see `references/animation-types.md`).
5. Apply root-motion + transition rules (see `references/transition-rules.md`).
6. Mark export evidence status (Not Run / Produced / Verified).
7. Hand off to glb-web-handoff with the contract pinned.

## Decision tree

```txt
Clip list unknown?
  → Hand off to scene planner first
Skeletal + morph in same clip?
  → Document both, flag bone budget tightness
Multiple clips meant to chain?
  → Document blend duration explicitly per pair
Root motion present?
  → Pick: bake into clip OR strip + apply at runtime; not both
```

## Playbooks

### Playbook A: Idle-only loop
Single skeletal idle clip, auto-loop on mount. Record FPS, length, interpolation. No root motion, no transitions. The simplest contract.

### Playbook B: Idle + active (hover/click)
Two clips. Consumer crossfades 200–400ms. Document blend duration, document return-to-idle policy.

### Playbook C: Scroll-driven scrub
Single long clip, no auto-play, consumer scrubs `mixer.setTime(scrollProgress * length)`. Document interpolation type explicitly (CUBICSPLINE recommended for smoothness).

## Mode handling

### Text-only mode
Produce contract from the scene plan; mark `Artifact status: Not Run`.

### Runtime-ready mode
After export, validate clip count + lengths against the contract using the GLB. Upgrade `Artifact status` only if measured.

### Blocked runtime mode
Produce the contract and explicitly mark which fields cannot be confirmed without runtime.

## Validation checklist
- [ ] Every clip listed in the contract
- [ ] Type per clip (skeletal / morph / both)
- [ ] FPS pinned
- [ ] Loop / one-shot / chain explicit
- [ ] Trigger model explicit
- [ ] Blend duration where applicable
- [ ] Root motion treatment chosen (one of two, never both)
- [ ] Consumer-stack caveats listed
- [ ] No "smooth animation guaranteed" without testing
- [ ] Handoff to next skill named

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All clips contracted, all caveats listed, evidence honest, handoff named. |
| Warn | Contract present but FPS / blend / trigger ambiguous. |
| Fail | Claiming clip plays correctly without measurement, or conflicting root-motion treatment, or omitting consumer-stack caveats. |

## Failure handling
- If clip list is unknown → hand off to scene planner first; do not invent clips.
- If consumer stack is unknown → list caveats per stack; ask user to pick.
- If skeletal + morph budget exceeds tier → hand off to performance-budget skill.

## Troubleshooting

| Problem | Response |
|---|---|
| Clip plays at wrong speed in web | Verify FPS in glTF matches consumer's mixer time scale (default 1.0). |
| Clip stutters at end | Check loop semantics + last keyframe matches first within tolerance. |
| Bones missing in web | Check bone count against consumer's per-mesh limit; check binding pose export option. |
| Morph not visible | Verify `KHR_materials_variants` is not used in place of morph; check shape key export option. |

## Best practices
- Always pin FPS even when the user thinks it "doesn't matter".
- Always document interpolation per clip; defaults break smoothness for scrub-driven cases.
- Treat root motion as a binary choice (bake OR strip), never undefined.
- Always pair with `glb-mobile-performance-budget` for animation channel budget.

## Good examples
- "Clips: idle (skeletal, 4s, 30fps, auto-loop, LINEAR), wave (skeletal, 2s, 30fps, hover-trigger, blend 250ms back to idle, LINEAR). Root motion: stripped, applied at runtime via parent transform. Animation channel count: 24 of 50 budget. Compliance: Not Run."

## Bad examples
- "It animates." — no contract.
- "Will be smooth." — no FPS, no blend, no measurement.

## User-facing response template

```txt
Clip contract:
  <clip name>: <type> | <length s> | <fps> | <loop/one-shot> | <trigger> | <blend ms> | <root motion> | <interpolation>

Consumer stack: <three.js / r3f / babylon / model-viewer>
Stack-specific caveats: <list>

Animation channel total: <N> of <budget>
Bones: <N> of <budget>
Morph targets: <N> of <budget>

Export evidence status: Not Run / Produced / Verified
Limitations: <gaps>
Next: glb-web-handoff
```

## Anti-patterns
- Inventing clip names not in the scene plan.
- Promising playback smoothness without testing.
- Mixing root motion + parented motion silently.
- Omitting interpolation type.

## Cross-skill handoff
- Performance budget → `../glb-mobile-performance-budget/SKILL.md`
- Render/export evidence → `../render-export-evidence/SKILL.md`
- Web handoff → `../glb-web-handoff/SKILL.md`
- React Three Fiber consumer shape → `../three-fiber-component-shape-planner/SKILL.md`
- Final response → `../non-blender-user-response-writer/SKILL.md`

## Non-goals
- Run Blender.
- Author or retarget animation.
- Generate animation Python.
- Promise web-side smoothness without measurement.

## References
- `references/animation-types.md`
- `references/web-stack-caveats.md`
- `references/transition-rules.md`
- `../../docs/skill-system.md`
