# Gate template

## Per-stage gate format

Every gate has 4 fields:

1. **Acceptance criteria** (3-5 concrete checks). NOT vague feelings.
2. **Evidence required**: file path / measurement / produced artifact.
3. **Current state**: `Pending` / `Pass` / `Fail` / `Blocked`.
4. **Failed-gate action**: what happens if this gate fails.

## Concrete criteria examples

### Stage: scene plan
- [ ] Scene plan section count >= 7 (subject, camera, lighting, materials, background, mood, asset list).
- [ ] Each section has explicit value (no "TBD").
- [ ] Asset list flagged for discovery.
- [ ] No runtime claim made.

### Stage: render
- [ ] `out/render-YYYY-MM-DD.png` exists.
- [ ] Dimensions match scene aspect (e.g. 1920×1080 for 16:9).
- [ ] Samples >= 128 (Cycles) or no banding artifacts (Eevee).
- [ ] Render time logged.
- [ ] No missing-texture error in render log.

### Stage: export
- [ ] `out/scene.glb` exists.
- [ ] File size within budget.
- [ ] `gltf-validator` passes.
- [ ] Triangle count within budget.

## Vague criteria to avoid

- "Looks good"
- "Acceptable"
- "Solid"
- "On the right track"
- "We'll know when we see it"

## Why concrete matters

A vague gate creates the illusion of progress without verification. Re-reading "looks good" later gives no information about whether the stage actually completed correctly. Concrete criteria allow honest re-evaluation.

## Related skill
`../SKILL.md`
