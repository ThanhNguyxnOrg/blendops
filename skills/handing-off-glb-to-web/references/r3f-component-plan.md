
# handing-off-glb-to-web (reference for `handing-off-glb-to-web`)

> Detailed playbook carried over from the former `handing-off-glb-to-web` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

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

## Trigger phrases

## Prerequisites / readiness
- GLB delivery contract known (clips, materials, variants)
- target React/Three.js/R3F versions known (or assume current stable)
- consumer team's preferred state-management style noted (Zustand / context / props)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| GLB delivery contract (from `handing-off-glb-to-web`) | Defines available variants, nodes, and delivery constraints |
| Animation contract (from `handing-off-glb-to-web`) | Defines clip names, triggers, loop/chain rules, and blend durations |
| R3F version (`8` vs `9`) | Hook signatures change between R3F 8 and R3F 9 and require explicit caveats |
| Use case (hero / configurator / interactive view) | Determines Suspense placement, fallback behavior, and instance policy |
| Customization scope | Determines which props and ref methods are exposed |

### Optional inputs

| Input | Use |
|---|---|
| Performance budget (from `budgeting-glb-for-web`) | Informs `useGLTF` shared caching vs per-instance policy within pinned ceilings |
| Existing consumer state pattern | Aligns prop and callback shapes with the consumer team's state flow |

### Assumptions to confirm
- Animation clip contracts are already locked via `handing-off-glb-to-web`.
- Memory and asset ceilings are already pinned via `budgeting-glb-for-web`.
- Target R3F major version (8 or 9) is identified, or caveats for both are documented.

## Output schema

### Primary output
A locked React Three Fiber component shape spec (no generated component implementation code) containing:
- Props table (name, type, default, purpose)
- Ref interface (imperative methods exposed, or explicit "none")
- Suspense placement (inside vs outside component boundary)
- `useGLTF` caching policy (shared vs per-instance)
- Animation hook contract (aligned with `handing-off-glb-to-web`)
- Cleanup contract (unmount behavior)
- Error / fallback contract (what renders if GLB load fails)
- Minimal usage example (consumer call-site shape only, not component implementation code)

### Secondary output
- R3F version compatibility caveats (specifically R3F 8 vs 9 hook signature differences)
- explicit boundary notes referencing `handing-off-glb-to-web`, `budgeting-glb-for-web`, and `handing-off-glb-to-web`

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

Default is `Runtime status: Not Run` and `Artifact status: Not Produced`. Truth states are downgrade-only and never upgraded by this skill, as web runtime belongs to the consumer team.

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

This skill produces **planning specs only**. It does not generate component code, run a web app, or claim that the resulting component will perform correctly without measured load tests. Web-side implementation is owned by the consumer team.

If runtime is involved, refer to `../../docs/runtime-stack-strategy.md` for the 2-path + CLI appendix model. R3F lives entirely on the web side and does not interact with Blender at runtime.

## Operating procedure

1. Read the upstream animation contract (`handing-off-glb-to-web`) and performance ceilings (`budgeting-glb-for-web`).
2. Enumerate consumer customization points into the props table (name, type, default, purpose).
3. Define the ref interface for imperative controls (or mark "none required").
4. Specify Suspense boundary placement and the error / fallback contract.
5. Specify the `useGLTF` caching policy and the unmount cleanup contract.
6. Specify the animation hook contract matching `handing-off-glb-to-web` triggers and add R3F 8/9 hook signature caveats.
7. Provide a minimal call-site usage example (never generate the component implementation code).
8. Record truth states (`Runtime status: Not Run`, `Artifact status: Not Produced` default; downgrade-only) and hand off to `handing-off-glb-to-web` (and `using-blendops` for final user wording).

## Decision tree

```txt
Animation clips present but uncontracted?
  → Hand off to handing-off-glb-to-web first
Performance or memory ceilings unpinned?
  → Hand off to budgeting-glb-for-web first
Multiple instances vs single instance?
  → Document useGLTF caching policy (shared cache vs per-instance) and unmount cleanup contract
Interactive animation triggers required?
  → Expose declarative trigger props and/or ref interface aligned with handing-off-glb-to-web
R3F version 8 vs 9 unknown?
  → Document hook signature caveats for both R3F 8 and R3F 9
GLB load or network failure possible?
  → Lock explicit Suspense placement + error boundary / fallback contract
```

## Playbooks

### Playbook A: Hero single instance

* Props table: transform props (`scale`, `position`, `rotation`) and `onLoaded` callback.
* Ref interface: none required (or root reference only).
* Suspense placement: around component boundary with explicit placeholder fallback.
* `useGLTF` caching policy: standard single-instance cache policy with explicit unmount cleanup contract.
* Animation hook contract: auto-play idle clip per `handing-off-glb-to-web`.
* Error / fallback contract: fallback visual if asset fetch fails.

### Playbook B: Interactive configurator

* Props table: `variant`, `colorOverride`, `animationName`, `onVariantChange`, `onError`.
* Ref interface: `playAction(name)`, `setVariant(name)`.
* Suspense placement: section-level boundary with loading fallback.
* `useGLTF` caching policy: shared cache policy aligned with `budgeting-glb-for-web` ceilings and explicit unmount cleanup.
* Animation hook contract: controlled transitions per `handing-off-glb-to-web` with R3F 8/9 hook signature caveats.
* Error / fallback contract: error boundary fallback prop.

### Playbook C: Multi-instance product grid item

* Props table: `src`, `instanceId`, `activeClip`, `onSelect`.
* Ref interface: `playAction(name)`, `stopAction()`.
* Suspense placement: grid or card boundary with lightweight fallback contract.
* `useGLTF` caching policy: shared asset cache policy paired with explicit unmount cleanup contract, bounded by `budgeting-glb-for-web`.
* Error / fallback contract: per-card fallback state on load error.

## Mode handling

### Text-only mode

Produce the complete R3F component shape spec and minimal call-site usage example; do not generate component implementation code. Set `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Runtime-ready mode

Web runtime belongs to the consumer team, not BlendOps. Keep `Runtime status: Not Run` and `Artifact status: Not Produced` as the planning default; truth states are downgrade-only and never upgraded by this skill.

### Blocked runtime mode

If the consumer R3F version or upstream contracts are incomplete, document R3F 8/9 hook signature caveats, keep truth states at `Runtime status: Not Run` and `Artifact status: Not Produced` (or downgrade to `Failed` if blocked), and name required upstream handoffs.

## Validation checklist

* [ ] Props table complete (name, type, default, purpose)
* [ ] Ref interface specified (or explicitly marked "no imperative methods needed")
* [ ] Suspense placement explicit
* [ ] `useGLTF` caching policy explicit
* [ ] Animation hook contract explicit and aligned with `handing-off-glb-to-web`
* [ ] Cleanup contract explicit
* [ ] Error / fallback contract explicit
* [ ] Minimal call-site usage example included (without generating component implementation code)
* [ ] R3F 8/9 hook signature caveats documented
* [ ] No performance promises without measurement
* [ ] Truth states set to `Runtime status: Not Run` and `Artifact status: Not Produced` (downgrade-only, never upgraded)
* [ ] Next handoff skill named (`handing-off-glb-to-web` / `using-blendops`)

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Complete component shape spec (props, ref, Suspense, `useGLTF` cache policy, animation hook contract, cleanup, error/fallback, minimal usage example), R3F 8/9 caveats noted, truth states downgrade-only, handoffs named. |
| Warn | Spec present but Suspense placement, cleanup policy, or R3F 8/9 version caveats are incomplete. |
| Fail | Generates component implementation code, claims runtime performance, upgrades truth states, invents R3F runtime internals as BlendOps facts, blurs color/material/animation/budget ownership, or omits error/fallback/ref contracts. |

## Failure handling

* If the user asks for full React component implementation code → refuse code generation; explain that this skill outputs the locked component shape spec and minimal usage example for the web team to implement.
* If R3F version (8 vs 9) is unknown → include hook signature caveats for both versions.
* If animation clip details are missing → hand off to `handing-off-glb-to-web` instead of inventing clip hooks.
* If memory or instance ceilings are unknown → hand off to `budgeting-glb-for-web`.
* If material or color encoding questions arise → hand off to `planning-lighting-and-materials` and `planning-lighting-and-materials`.

## Troubleshooting

| Problem | Response |
|---|---|
| Material or color appearance mismatch reported | Do not diagnose texture/color encoding here; hand off to `planning-lighting-and-materials` and `planning-lighting-and-materials`. |
| Animation clip names or transitions mismatch | Verify the animation hook contract against `handing-off-glb-to-web` and check R3F 8 vs 9 hook signature caveats. |
| Multi-instance memory or frame budget concerns | Hand off to `budgeting-glb-for-web` to pin ceilings, and clarify the `useGLTF` caching and unmount cleanup contracts in the spec. |
| Asset delivery, compression, or packaging mismatch | Hand off to `handing-off-glb-to-web` for web delivery packaging details. |

## Best practices

* Prefer declarative props and callbacks over implicit internal state.
* Lock all eight spec elements (props, ref, Suspense, `useGLTF` cache policy, animation hook contract, cleanup, error/fallback, minimal call-site usage example) before web engineering starts.
* Document R3F 8 vs 9 hook signature differences as explicit caveats rather than asserting runtime guarantees.
* Respect strict role boundaries with `handing-off-glb-to-web`, `budgeting-glb-for-web`, `handing-off-glb-to-web`, and `using-blendops`.

## Good examples

* "Component spec `ProductHeroModel` (R3F 8/9 caveat: verify hook signatures for target major version): Props `{ src: string, scale?: number = 1, animationName?: 'idle' | 'open' = 'idle', variant?: string, onLoaded?: () => void }`; Ref `{ playAction(name: string): void }`; Suspense: wrapped at parent section boundary; `useGLTF` policy: shared cache; Animation hook: bound to `handing-off-glb-to-web` clip contract; Cleanup: stop active mixer actions and release instance resources on unmount; Error/fallback: render `fallback` prop inside error boundary; Minimal usage: `<ErrorBoundary fallback={<FallbackCard />}><Suspense fallback={<Loader />}><ProductHeroModel ref={modelRef} src=\"/model.glb\" animationName=\"idle\" /></Suspense></ErrorBoundary>`. `Runtime status: Not Run`, `Artifact status: Not Produced`. Next: `handing-off-glb-to-web`."

## Bad examples
- "Just useGLTF and render." — no props, no ref, no Suspense, no error path.
- "Will be smooth." — no measurement, no ceiling.

## User-facing response template

```txt
Component name: <PascalCase>
R3F version caveat: <R3F / 8 9 caveats hook signature>

Props table:
  <name> | <type> | <default> | <purpose>

Ref interface:
  <method>(args): <returnType> (or "none")

Suspense placement: <component boundary / page section / app root>
useGLTF caching policy: <shared cache / per-instance>
Animation hook contract: <aligned with handing-off-glb-to-web>
Cleanup contract: <unmount cleanup policy>
Error / fallback contract: <error boundary + fallback behavior>

Minimal usage example (call-site only, no component code):
  <Suspense + Component ErrorBoundary call-site>

Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <gaps>
Next: handing-off-glb-to-web (then using-blendops)
```

## Anti-patterns

* Generating React Three Fiber component implementation code instead of a shape spec.
* Promising runtime performance without measurement.
* Presenting unverified R3F internals (hook implementation details, scene cloning APIs, HMR behavior) as BlendOps facts.
* Blurring boundaries into color/texture validation (`planning-lighting-and-materials`, `planning-lighting-and-materials`), animation contracts (`handing-off-glb-to-web`), budgets (`budgeting-glb-for-web`), or web delivery packaging (`handing-off-glb-to-web`).
* Using `Artifact status: Not Run` or upgrading truth states instead of keeping `Runtime status: Not Run` and `Artifact status: Not Produced` downgrade-only.

## Cross-skill handoff

## Non-goals

* Generate React or Three.js component implementation code.
* Run web apps or execute React Three Fiber at runtime.
* Claim or verify web runtime performance.
* Upgrade truth states (web runtime belongs to the consumer team, not BlendOps).
* Own animation contracts, performance budgets, color/material validation, or web delivery packaging.

## References
- `references/component-shape-patterns.md`
- `references/suspense-placement-rules.md`
- `references/usegltf-caching-rules.md`
- `../../docs/skill-system.md`
