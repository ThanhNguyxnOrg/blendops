# Checklist patterns

## Visual readability

- Subject occupies frame share range appropriate to shot type.
- Primary light direction matches stated mood adjectives (translate to measurable contrast/heuristic descriptions).

## Technical delivery

- Resolution / aspect matches `resolution-aspect-decision` outputs when chosen.
- Format matches `output-format-decision`.
- Color pipeline expectations reference `color-management-decision`.

## Real-time / web

- GLB budgets reference `glb-mobile-performance-budget` when consumer is web/mobile.
- Animation rules reference `glb-animation-handoff` if animated.

## Process

- Stop conditions from `blender-stop-condition-decider` embedded as criteria where relevant.

Mark platform-specific rows **P0** only when contractually required.
