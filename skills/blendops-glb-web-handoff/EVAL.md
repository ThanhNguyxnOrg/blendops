# blendops-glb-web-handoff — EVAL

Behavioral evaluation prompts for `blendops-glb-web-handoff`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-glb-web-handoff`

### Text-only eval prompt
Use blendops-glb-web-handoff to produce a handoff report with explicit artifact status and caveats.

### Expected behavior
- GLB/preview status
- assumptions and limitations
- next verification actions

### Pass / Warn / Fail criteria
- Pass: no artifact overclaims + clear caveats
- Warn: partial caveats or assumptions
- Fail: web readiness claim without evidence

### Common failure modes
- claiming export succeeded without proof
- no compatibility caveats

### Evidence expectations
- artifact status per item
- assumption/caveat section
- next checks section

### Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

### Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action

## From former `blendops-glb-web-handoff`

### Text-only eval prompt
Use blendops-glb-web-handoff to write the playback contract for a GLB with an "idle + hover" two-clip animation, target Three.js / R3F.

### Expected behavior
- both clips listed with type, length, FPS, loop, trigger, blend, root motion, interpolation
- consumer-stack-specific caveats listed (mixer time scale, animationActions, useAnimations hook caveats)
- animation channel + bone counts vs budget
- export evidence status `Not Run` (no measurement performed in text-only mode)
- handoff to blendops-glb-web-handoff named

### Pass / Warn / Fail criteria
- Pass: full clip rows + caveats + honest evidence labels + handoff named
- Warn: clip rows present but FPS / blend / trigger ambiguous
- Fail: claims smooth playback without measurement, conflicting root-motion treatment, or invents clip names not in the brief

### Common failure modes
- omitting FPS
- mixing baked + parented root motion
- forgetting to mark export evidence
- treating animation as a single uniform stream instead of distinct clips

### Evidence expectations
- per-clip rows
- explicit measurement-vs-planning distinction
- consumer-stack caveats per chosen stack

### Sample passing response outline
- Clip contract table
- Consumer stack: r3f
- Stack caveats: useAnimations hook returns actions; consumer must call .play() inside useEffect on mount; cleanup with .stop()
- Animation channels: 24 of 50 budget
- Compliance: Not Run

### Sample failing response outline
- "Animations work" without contract rows
- Single FPS unspecified
- "Will be smooth in three.js" with no measurement

## From former `blendops-glb-web-handoff`

### Text-only eval prompt
Use blendops-glb-web-handoff to produce the React Three Fiber component spec for a hero-card GLB delivery (single instance, idle + hover animations, no variants).

### Expected behavior
- props table (src, scale, animationName, onLoaded, …)
- ref interface (playAction)
- Suspense placement at component boundary
- useGLTF caching policy stated
- animation hook contract (idle auto-play + hover trigger)
- cleanup contract on unmount
- error / fallback contract
- minimal usage example
- no component code generated (spec only)
- R3F version targeted

### Pass / Warn / Fail criteria
- Pass: complete spec covering every decision point, no code generation, no runtime claim
- Warn: spec missing one decision (e.g. Suspense placement or caching policy)
- Fail: generates working component code instead of spec, or claims runtime perf, or omits ref / fallback

### Common failure modes
- emitting component code (out of scope)
- omitting Suspense placement
- promising performance
- not specifying R3F version

### Evidence expectations
- explicit decision per row of the spec template
- usage example uses minimal pseudocode-style snippet, not full implementation
- no measurement claim

### Sample passing response outline
- Component name + R3F version
- Props / ref / Suspense / cache / animation / cleanup / fallback rows filled
- Minimal usage example
- Handoff to blendops-glb-web-handoff named

### Sample failing response outline
- Generates a 100-line component file
- Promises 60fps without measurement
- Skips ref interface entirely
