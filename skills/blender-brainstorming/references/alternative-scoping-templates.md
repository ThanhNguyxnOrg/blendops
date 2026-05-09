# Alternative Scoping Templates

After clarifying questions are answered, propose 2-3 distinct scopings. Distinct means **the trade-offs are visible**, not minor variants.

## Standard 3-tier scoping

For most product-hero / scene-render requests:

### Scoping A — Minimal hero render

- Single render image, one camera angle.
- One mood lock (no iteration on mood).
- Acceptance: subject is recognizable + mood reads.
- Time-to-handoff: short.
- Trade-off: no GLB, no web handoff, no iteration.

### Scoping B — Full web-ready GLB + render

- Render image + GLB export.
- Web performance budget enforced.
- Acceptance: render passes mood check + GLB passes size + import check.
- Time-to-handoff: medium.
- Trade-off: poly budget tightens lookdev choices.

### Scoping C — Iteration-friendly text-only plan first

- Scene plan + composition + lighting + material plans.
- No render, no GLB.
- Acceptance: plans are reviewable on paper.
- Time-to-handoff: shortest.
- Trade-off: no visual proof, runtime status stays `Not Run`.

## When to deviate from the 3-tier

- User has a brand asset library → Scoping A may extend to "import branded model + minimal render".
- User has Hyper3D / Hunyuan3D access (Path 2) → add Scoping D "generative subject + procedural environment".
- User wants AR / USDZ → add Scoping E "GLB + AR handoff" (route through `glb-web-handoff` for caveats).

## Anti-patterns

- 3 scopings that only differ in mood. Mood was already in question 2.
- Scopings that all need runtime — iteration scopings should always include a text-only option.
- Scopings that ignore the audience answer (question 4). Audience drives evidence expectations.
