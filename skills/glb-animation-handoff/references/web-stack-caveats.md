# Web stack caveats per consumer

These are documentation-only assumptions; the consumer must validate against their stack version.

## Three.js (vanilla)

- Use `GLTFLoader` → returns `gltf.animations` clip array.
- `AnimationMixer` per object instance; do not share mixers across cloned objects.
- Default `timeScale = 1.0`; verify FPS embedded in clips matches scene FPS.
- `clipAction.setLoop(LoopRepeat | LoopOnce | LoopPingPong)`.
- Crossfade via `clipAction.crossFadeTo(otherAction, durationSec, warpTimeScale)`.

## React Three Fiber (R3F)

- `useGLTF('/path/to.glb')` returns memoized scene + animations.
- `useAnimations(clips, scene)` returns `{ actions, mixer, names }`.
- Call `actions.idle.play()` inside `useEffect` on mount; clean up with `.stop()`.
- Mixer ticks via R3F frameloop automatically; do not manually call `mixer.update()`.
- Suspense boundary required around the component due to async GLB load.

## Babylon.js

- `SceneLoader.ImportMeshAsync` returns `{ animationGroups }`.
- Each `AnimationGroup` plays/stops/blends independently.
- Different animation API surface than Three.js; clips translate but blends are stack-specific.

## google/model-viewer (web component)

- `<model-viewer src="x.glb" autoplay animation-name="idle">`.
- Single active clip at a time; switch via `animation-name` attribute.
- No crossfade in pure model-viewer; transitions must be authored as a single longer clip with intermediate frames.

## Stack-agnostic caveats

- Negative scale on a parent node breaks normals in some loaders; bake transforms before export.
- Animation that targets a missing node fails silently in some loaders, errors in others.
- Cubic spline interpolation requires 3x more keyframe data — file-size cost is real.

## Related skill
`../SKILL.md`
