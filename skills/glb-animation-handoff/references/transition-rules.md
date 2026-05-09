# Transition + Root Motion Rules

## Transitions between clips

**Rule 1 — explicit blend duration**: every documented transition must have a blend duration in milliseconds. Defaults silently differ across stacks.

**Rule 2 — preserve last keyframe coherence**: when transition is "blend", the last frame of clip A and the first frame of clip B should be visually close to avoid pop.

**Rule 3 — return-to-idle policy**: hover/click activations must define what happens when the trigger ends:
- snap back to idle
- crossfade back over N ms
- play out current clip first, then crossfade
- (not allowed) leave the model frozen

## Common blend durations

| Transition type | Recommended blend | Notes |
|---|---|---|
| Idle → idle variant | 300–500 ms | Subtle |
| Idle → action (hover) | 150–250 ms | Quick response |
| Action → idle (return) | 300–500 ms | Smoother return |
| Action → action chain | 100–200 ms | Tight |
| Scrub-driven (no blend) | 0 ms | Use scrub time directly |

## Root motion treatment

Choose **exactly one** treatment per GLB; never mix:

### Option A — Bake root motion into clip
- Translate keys live on the root node inside the animation.
- Web side simply plays; the model translates as part of the clip.
- Pro: simple consumer code.
- Con: cannot reposition the model dynamically without offsetting.

### Option B — Strip root motion, apply at runtime
- Animation only deforms relative to root; root stays fixed.
- Web side moves the parent transform programmatically.
- Pro: allows interactive positioning.
- Con: consumer must implement the offset.

## Forbidden mixed cases

- Clip A baked + clip B stripped (jarring pops on blend).
- Skeletal root translation + parent transform translation simultaneously (positions drift).
- Documenting "neutral" as a treatment (no such thing — pick A or B).

## Recording in handoff contract

The contract row must contain one of:
- `root-motion: baked`
- `root-motion: stripped (consumer applies parent transform)`
- `root-motion: none (object-level animation, no skinned movement)`

## Related skill
`../SKILL.md`
