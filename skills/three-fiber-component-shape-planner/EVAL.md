# EVAL — three-fiber-component-shape-planner

## Text-only eval prompt
Use three-fiber-component-shape-planner to produce the React Three Fiber component spec for a hero-card GLB delivery (single instance, idle + hover animations, no variants).

## Expected behavior
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

## Pass / Warn / Fail criteria
- Pass: complete spec covering every decision point, no code generation, no runtime claim
- Warn: spec missing one decision (e.g. Suspense placement or caching policy)
- Fail: generates working component code instead of spec, or claims runtime perf, or omits ref / fallback

## Common failure modes
- emitting component code (out of scope)
- omitting Suspense placement
- promising performance
- not specifying R3F version

## Evidence expectations
- explicit decision per row of the spec template
- usage example uses minimal pseudocode-style snippet, not full implementation
- no measurement claim

## Sample passing response outline
- Component name + R3F version
- Props / ref / Suspense / cache / animation / cleanup / fallback rows filled
- Minimal usage example
- Handoff to glb-web-handoff named

## Sample failing response outline
- Generates a 100-line component file
- Promises 60fps without measurement
- Skips ref interface entirely
