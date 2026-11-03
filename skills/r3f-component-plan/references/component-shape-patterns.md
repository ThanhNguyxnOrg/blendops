# Component shape patterns for R3F GLB consumers

## Pattern A — Static hero (no interactivity)

**Props**: `src`, `scale`, `position`, `rotation`, `onLoaded?`
**Ref**: not needed
**Suspense**: at component boundary
**useGLTF**: shared cache
**Animation**: single idle clip, auto-play on mount, loop forever

## Pattern B — Hover / click activation

**Props**: `src`, `scale`, `defaultClip`, `activeClip`, `triggerEvent` (`hover` | `click` | `scroll`)
**Ref**: `{ playAction(name, opts), stopAction(name) }`
**Suspense**: at component boundary, fallback `<mesh>` placeholder
**useGLTF**: shared cache
**Animation**: defaultClip auto-plays; activeClip plays on trigger; crossfade per `glb-animation-handoff` contract

## Pattern C — Configurator with variants

**Props**: `src`, `variant`, `colorOverrides?`, `onVariantChange?`, `animationName?`
**Ref**: `{ playAction(name), setVariant(name), captureScreenshot() }`
**Suspense**: at page section level (whole configurator)
**useGLTF**: shared cache + `useGLTF.preload(src)` on app boot
**Animation**: optional; primarily driven by variant changes

## Pattern D — Scroll-driven scrub

**Props**: `src`, `scrollProgress` (0..1), `clipName`
**Ref**: `{ setTime(seconds) }`
**Suspense**: at section boundary
**useGLTF**: per-instance (each scroll target has its own loaded scene)
**Animation**: single clip, manually scrubbed via `mixer.setTime`

## Pattern E — AR + R3F dual

**Props**: `src`, `iosSrc?` (USDZ for iOS Quick Look), `arOnly?: boolean`
**Ref**: `{ enterAR() }`
**Suspense**: at component boundary
**useGLTF**: shared cache for R3F path
**Animation**: same contract, but consumer must verify AR Quick Look behavior independently

## How to choose

| User intent | Pattern |
|---|---|
| Static product shot | A |
| "It does something on hover" | B |
| "Color and trim swap" | C |
| "Animates as you scroll" | D |
| "Also works in AR" | E |

## Related skill
`../SKILL.md`
