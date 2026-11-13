# Workflow Recommendation Template

Use this exact plain-language recommendation card at the conclusion of `recipe-fit-assessor` so the user and downstream planning skills receive one clear primary anchor, honest gaps, and a single next skill.

```txt
Goal summary: <1 plain-English sentence capturing user intent>
Deliverables: <explicit formats, e.g. still PNG (16:9) + interactive web .glb>
Key constraints: <timeline, realism level, web MB/triangle cap, license posture>

Fit verdict: Strong | Partial | Poor
Primary anchor: <exact repo path, e.g. docs/recipes/cyberpunk-shoe-hero.md>
Alternate anchor(s): <secondary recipe/pack path or "none">

Scope gaps & mitigations (required if Partial or Poor):
  - Gap 1: <exact mismatch, e.g. "Recipe targets offline still PNG while web .glb < 5 MB is requested">
    Mitigation: <e.g. "Pair recipe with mobile-glb-budget + glb-web-handoff after lighting plan">

Recommended next skill: <single slug, e.g. pack-prerequisite-checker | scope-guard | intent-to-3d-brief-writer>
Notes for brief writer:
  - <concrete slot detail preserved from user request>
  - <unanswered question to confirm before build>

Catalog evidence inspected: <exact doc/catalog paths read>
Runtime posture (context only):
  Runtime status: Not Run (assessment is planning-only; see runtime-path-picker if execution requested)
  Artifact status: Not Produced
```

## Authoring Rules
- Keep terminology plain; translate unavoidable terms (`GLB = lightweight 3D web file`, `Cycles = realistic raytraced renderer`) on first use.
- Never silently omit a `Partial` or `Poor` gap just to push a recipe forward.

## Related skill
[../SKILL.md](../SKILL.md)
