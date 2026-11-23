# useGLTF caching rules

`useGLTF` (from `@react-three/drei`) memoizes loaded GLBs by URL. Choose caching policy explicitly.

## Shared cache (default useGLTF behavior)

```
const { scene } = useGLTF('/hero.glb')
```

- One fetch per URL across the entire app session.
- Fastest for repeat use of the same model.
- **Caveat**: cloning is needed if multiple instances render the same scene; raw `scene` is shared by reference. Use `SkeletonUtils.clone(scene)`.

## Per-instance load

- Avoid `useGLTF` cache when each instance must have an independent animation state, materials, or modifications.
- Use `useLoader(GLTFLoader, src)` directly instead.
- More memory; slower repeat load; better isolation.

## Preloading

```
useGLTF.preload('/hero.glb')
```

- Call at app boot or before navigation to a section that will use the model.
- Reduces fallback time on first render.
- Pair with `<link rel="preload" as="fetch" href="/hero.glb" crossorigin>` in HTML for browser-level fetching.

## Cache busting

- The cache is keyed by URL string. Add a version query (`/hero.glb?v=2`) to force reload.
- Hot module reload preserves the cache; if a `.glb` file changes, change the URL.

## Memory rules

- Each cached GLB stays in memory until manual eviction (`useGLTF.clear(src)`).
- For long-lived single-page apps: consider clearing on route change.
- For configurators with many variants: shared cache is the right answer; the alternative blows up memory.

## When to choose what

| Use case | Cache policy |
|---|---|
| Single instance, single page | Shared (default) |
| Multiple instances, same model | Shared + `SkeletonUtils.clone()` |
| Independent animation state per instance | Per-instance load |
| Configurator (many variants, single instance at a time) | Shared + preload |
| Long-running SPA with many GLBs | Shared + manual cache eviction on route change |

## Related skill
`../SKILL.md`
