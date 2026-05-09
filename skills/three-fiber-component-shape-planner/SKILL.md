---
name: three-fiber-component-shape-planner
description: Plan the React Three Fiber component shape (props, refs, Suspense, useGLTF cache, animation hooks) before delivering a GLB to a web team.
---

# three-fiber-component-shape-planner

## Purpose
Translate a planned GLB delivery into the exact public surface a React Three Fiber component should expose, so the web engineer's contract is locked before code is written.

## Quick start
- enumerate the props the consumer needs (color, animation name, scale, onLoaded)
- decide ref shape (forwardRef, imperative methods)
- decide Suspense boundary location
- decide useGLTF caching + cleanup strategy
- decide animation hook contract (auto-play, manual control)

## When to use
- the GLB will ship to a web app using React Three Fiber
- before the web team writes the component
- when "I'll just import the GLB" needs more rigor (multiple clips, prop overrides, lazy loading)

## When not to use
- consumers using vanilla Three.js (different API)
- consumers using Babylon / model-viewer (different stack)
- the GLB is rendered server-side (e.g. AR pre-render); no React component needed

## Trigger phrases
- "how should the React component look"
- "what props should I expose"
- "ref shape for the model"
- "we use react-three-fiber"

## Prerequisites / readiness
- GLB delivery contract known (clips, materials, variants)
- target React/Three.js/R3F versions known (or assume current stable)
- consumer team's preferred state-management style noted (Zustand / context / props)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| GLB delivery contract | Determines what props can vary |
| R3F version | Hook signatures change between R3F 8 / 9 |
| Use case (hero / configurator / AR) | Determines lazy-loading + Suspense placement |
| Customization scope | Color overrides? Animation triggers? Variants? |

### Optional inputs

| Input | Use |
|---|---|
| Existing component patterns in the consumer codebase | Maintain consistency |
| Performance budget | Decides whether to use `useGLTF` cache or per-instance load |
| LOD requirements | Triggers `meshoptimizer` / Draco decision points |

### Assumptions to confirm
- The consumer team can install peer deps (`three`, `@react-three/fiber`, `@react-three/drei`).
- GLB fetched over HTTP is acceptable; no special CDN auth needed.
- Memory pressure from cached GLB scenes is acceptable for the use case.

## Output schema

### Primary output
A React Three Fiber component shape spec including:
- Props table (name, type, default, purpose)
- Ref interface (imperative methods exposed)
- Suspense placement (inside vs outside)
- useGLTF caching policy (shared vs per-instance)
- Animation hook contract
- Cleanup contract (unmount behavior)

### Secondary output
- minimal usage example for the web engineer
- caveats about R3F version compatibility
- error / fallback contract (what shows if GLB fails to load)

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

This skill produces **planning specs only**. It does not generate component code, run a web app, or claim that the resulting component will perform correctly without measured load tests. Web-side implementation is owned by the consumer team.

If runtime is involved, refer to `../../docs/runtime-stack-strategy.md` for the 2-path + CLI appendix model. R3F lives entirely on the web side and does not interact with Blender at runtime.

## Operating procedure
1. Read the GLB delivery contract + animation contract.
2. Enumerate consumer customization points → props table.
3. Decide ref shape based on imperative needs (play / pause / setColor).
4. Decide Suspense placement based on use case (hero needs sub-tree fallback; configurator needs page-level fallback).
5. Decide useGLTF caching policy based on instance count + memory.
6. Decide animation hook contract based on trigger model.
7. Produce spec + minimal usage example.
8. Hand off to web engineer + flag verification checklist.

## Decision tree

```txt
Multiple instances of the same model?
  → useGLTF cache (shared) + reuse scene clones
Single instance?
  → useGLTF works as-is
Animation triggered by hover/click?
  → expose `animationName` prop + ref method `playAction(name, opts)`
Material variants (configurator)?
  → expose `variant` prop + use KHR_materials_variants
Lazy load on scroll?
  → wrap in Suspense at section level + dynamic import
GLB fetch can fail?
  → wrap in error boundary + provide fallback prop
```

## Playbooks

### Playbook A: Hero card single instance
- Suspense at component boundary, fallback `<mesh>` placeholder.
- `useGLTF('/hero.glb')` directly.
- No props beyond `scale`, `position`, `rotation`.
- One animation auto-plays on mount.

### Playbook B: Configurator
- Suspense at page section level.
- `useGLTF` shared cache.
- Props: `variant`, `colorOverride`, `animationName`, `onVariantChange`.
- Ref: `playAction(name)`, `setVariant(name)`, `triggerExplodedView()`.

### Playbook C: AR viewer with `<model-viewer>` fallback
- Detect AR support; render R3F path or `<model-viewer>` fallback.
- Component exposes both code paths through one prop interface.

## Mode handling

### Text-only mode
Produce the spec; do not write component code. Leave implementation to the consumer team.

### Runtime-ready mode
Component implementation is the consumer's responsibility. This skill never upgrades to "runtime-ready" because runtime is the web app, not BlendOps.

### Blocked runtime mode
If consumer stack version is unknown, list per-version caveats.

## Validation checklist
- [ ] Props table complete with name + type + default + purpose
- [ ] Ref interface specified (or marked "no imperative methods needed")
- [ ] Suspense placement explicit
- [ ] useGLTF caching policy explicit
- [ ] Animation contract explicit (auto / manual / scrub)
- [ ] Cleanup contract explicit
- [ ] Error / fallback contract explicit
- [ ] Minimal usage example included
- [ ] No claim of runtime performance without measurement
- [ ] R3F version targeted

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All decision points resolved, props/ref/Suspense/cache/animation/cleanup spec complete, usage example present. |
| Warn | Spec mostly complete but Suspense placement or caching ambiguous. |
| Fail | Generates component code (out of scope), claims runtime perf, or omits ref / fallback contract. |

## Failure handling
- If user wants component code → redirect: this skill specifies; the consumer implements.
- If R3F version unknown → write per-version caveats.
- If consumer's state management is unknown → make state external via props + onChange callbacks (most portable).

## Troubleshooting

| Problem | Response |
|---|---|
| GLB renders but materials look wrong | Verify color management (sRGB encoding for color textures, linear for data textures); add caveat. |
| Animation does not play | Verify clip name matches; ensure `useAnimations(clips, scene)` is called with correct scene reference. |
| Multiple instances cause lag | Clone scene via `SkeletonUtils.clone()` per instance; share geometry, not animation state. |
| Hot-reload breaks model | useGLTF cache survives HMR; preload + cache-bust on path change. |

## Best practices
- Prefer external state via props + callbacks over internal mutable state.
- Always forward ref so the consumer can grab the model root.
- Always wrap in Suspense; never assume sync GLB load.
- Document peer-dep version range in the spec.

## Good examples
- "Component spec: props { src, scale=1, animationName='idle', variant?, onLoaded? }, ref methods { playAction(name, opts), setVariant(name) }, Suspense at component boundary, useGLTF shared cache, R3F 8.x."

## Bad examples
- "Just useGLTF and render." — no props, no ref, no Suspense, no error path.
- "Will be smooth." — no measurement, no ceiling.

## User-facing response template

```txt
Component name: <PascalCase>
R3F version: <8.x / 9.x>

Props:
  <name>: <type> = <default>  // <purpose>

Ref interface:
  <method>(args): <returnType>

Suspense placement: <component boundary / page section / app root>
useGLTF caching: <shared cache / per-instance>
Animation hook: <auto-play idle / manual play via ref / scrub>
Cleanup on unmount: <stop animations / dispose materials / no-op>
Error / fallback: <fallback prop / error boundary / placeholder mesh>

Minimal usage:
  <code-style snippet>

Limitations: <gaps>
Next: glb-web-handoff with this spec attached
```

## Anti-patterns
- Returning generated component code instead of a spec.
- Promising runtime performance.
- Mixing internal state + external state without a clear default.
- Skipping Suspense.

## Cross-skill handoff
- GLB performance budget → `../glb-mobile-performance-budget/SKILL.md`
- Animation contract → `../glb-animation-handoff/SKILL.md`
- Web handoff summary → `../glb-web-handoff/SKILL.md`
- Final response → `../non-blender-user-response-writer/SKILL.md`

## Non-goals
- Generate component code.
- Run R3F at runtime.
- Verify performance.
- Replace the consumer team's engineering decisions.

## References
- `references/component-shape-patterns.md`
- `references/suspense-placement-rules.md`
- `references/usegltf-caching-rules.md`
- `../../docs/skill-system.md`
