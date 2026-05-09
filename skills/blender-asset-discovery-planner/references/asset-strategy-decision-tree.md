# Asset Strategy Decision Tree

Per-asset-class decision tree. Walk top-down, stop at the first matching condition.

```
1. Is the asset BRAND-RESTRICTED (e.g. specific branded product)?
   YES → strategy = library OR user-supplied. Generative is risky for licensing. Photogrammetry only if legal-cleared.
   NO  → continue to 2.

2. Is the asset HIGHLY SPECIFIC and not in any free library?
   YES → strategy = generative (Path 2 only) OR user-supplied OR photogrammetry. Mark generative with Path 2 caveat.
   NO  → continue to 3.

3. Is poly budget TIGHT (web GLB ≤ 10MB, mobile target)?
   YES → strategy = procedural (Geometry Nodes inside Blender) preferred. Library only if low-poly source.
   NO  → continue to 4.

4. Is the deliverable an ITERATION LOOP (text-only first, runtime later)?
   YES → strategy = procedural (cheap to iterate, no fetch needed).
   NO  → continue to 5.

5. Is mood / look HIGHLY SPECIFIC?
   YES → strategy = library (Poly Haven HDRI for mood, branded asset library for subject).
   NO  → strategy = procedural-first as default (most reproducible per evidence-before-done law).
```

## Strategy → Source candidate map

| Strategy | Typical sources | Typical license | Typical confidence |
|---|---|---|---|
| Procedural | Geometry Nodes / shader nodes inside Blender | N/A (your work) | `verified-read` |
| Library | Poly Haven, Sketchfab (CC0), brand asset library, user-supplied .blend | CC0 / commercial-OK / brand-restricted | `verified-read` if you have the file; `linked-only` if reading upstream |
| Generative | Hyper3D Rodin, Hunyuan3D (Path 2 integrations) | Per upstream model terms (often commercial-OK; verify per model) | `linked-only` |
| Photogrammetry | User-supplied scan + preprocessing (Reality Capture, Meshroom, Polycam) | User's own | `verified-read` if scan exists |

## Anti-patterns

- "Just use any free model from the internet" — no source named, no license, no confidence label. **Rejected.**
- Choosing generative without checking Path 2 readiness (the host must have `ahujasid/blender-mcp` configured + `addon.py` enabled). Route to `official-runtime-readiness-checker` first if generative.
- Choosing high-poly Sketchfab import for a tight web budget. Compare poly count to budget BEFORE the planner commits.
