# Suspense placement rules

## Three placement levels

### 1. Component boundary (most common)
```
<Suspense fallback={<Placeholder/>}>
  <Model src="..." />
</Suspense>
```
- Use when the GLB is a self-contained unit (hero card, single mesh).
- Fallback is local to the component.
- Pro: keeps the rest of the page interactive while the GLB loads.

### 2. Page section
- Use when multiple GLBs share a configurator-like UI section.
- Fallback covers the whole section.
- Pro: avoids layout shift between staggered loads.
- Con: section appears empty until all sub-models load.

### 3. App root (rare)
- Use only when GLB load is critical to the entire app's first paint.
- Almost never the right answer for a marketing site or commerce page.

## When to use which

| Use case | Placement |
|---|---|
| Hero card | Component boundary |
| Configurator with one model | Component boundary |
| Configurator with many models | Page section |
| Critical onboarding scene | App root (very rare) |

## Fallback rules

- Always provide a meaningful fallback. `null` is the worst option for UX (sudden content pop-in).
- For hero cards: a static image preview or a low-poly placeholder mesh.
- For configurators: a skeleton or spinner.
- For AR: a "Tap to view in AR" CTA while loading.

## Error boundary pairing

`Suspense` handles loading; it does **not** handle errors. Always pair with an error boundary:

- Use `react-error-boundary` or a custom class component.
- Show a friendly fallback with retry.
- Log the error so the consumer team can capture failure rates.

## Related skill
`../SKILL.md`
