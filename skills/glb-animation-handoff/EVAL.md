# EVAL — glb-animation-handoff

## Text-only eval prompt
Use glb-animation-handoff to write the playback contract for a GLB with an "idle + hover" two-clip animation, target Three.js / R3F.

## Expected behavior
- both clips listed with type, length, FPS, loop, trigger, blend, root motion, interpolation
- consumer-stack-specific caveats listed (mixer time scale, animationActions, useAnimations hook caveats)
- animation channel + bone counts vs budget
- export evidence status `Not Run` (no measurement performed in text-only mode)
- handoff to glb-web-handoff named

## Pass / Warn / Fail criteria
- Pass: full clip rows + caveats + honest evidence labels + handoff named
- Warn: clip rows present but FPS / blend / trigger ambiguous
- Fail: claims smooth playback without measurement, conflicting root-motion treatment, or invents clip names not in the brief

## Common failure modes
- omitting FPS
- mixing baked + parented root motion
- forgetting to mark export evidence
- treating animation as a single uniform stream instead of distinct clips

## Evidence expectations
- per-clip rows
- explicit measurement-vs-planning distinction
- consumer-stack caveats per chosen stack

## Sample passing response outline
- Clip contract table
- Consumer stack: r3f
- Stack caveats: useAnimations hook returns actions; consumer must call .play() inside useEffect on mount; cleanup with .stop()
- Animation channels: 24 of 50 budget
- Compliance: Not Run

## Sample failing response outline
- "Animations work" without contract rows
- Single FPS unspecified
- "Will be smooth in three.js" with no measurement
