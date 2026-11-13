# Pack Readiness Output Template

Use this exact structured readiness report format when concluding `pack-prerequisite-checker`. Replace placeholders with observed inputs (`Ready`, `Needs input`, or `Blocked`) and preserve canonical `Runtime status` / `Artifact status` truth labels.

```txt
Pack / recipe: <pack-or-recipe-slug> (e.g. packs/product-hero-v0/PACK.md)

| Area | Status | Notes / Required Owner Action |
|---|---|---|
| Goal & scope | Ready / Needs input / Blocked | <brief clarity, target audience, single primary deliverable> |
| Deliverables & format | Ready / Needs input / Blocked | <still PNG / turntable / .glb / web target specified> |
| Asset & license plan | Ready / Needs input / Blocked | <procedural vs licensed external assets; CC0/CC-BY clearance> |
| Quality & budget bar | Ready / Needs input / Blocked | <polycount, texture size, color pipeline AgX/PBR Neutral> |
| Runtime posture | Ready (planning-only) / Needs input / Blocked | <Path 1 / Path 2 / CLI fallback or explicit planning-only mode> |
| Single-bridge check | Clear / Needs check / Blocked | <confirm Path 1 & Path 2 are not concurrently active> |
| Evidence habit | Active | <truth labels locked: Not Run / Not Produced until real files exist> |

Pack gate verdict: GO | CONDITIONAL-GO (planning-only) | NO-GO

If NO-GO (minimum fixes in strict order):
  1. <first blocker + target skill slug>
  2. <second blocker + target skill slug>

If GO / CONDITIONAL-GO:
  Next skill: <exact next skill slug, e.g. product-hero-scene-planner>

Truth boundary:
  Runtime status: <Not Run | Attempted | Verified | Failed>
  Artifact status: <Not Produced | Produced | Verified | Failed>
```

## Usage Rules
- Issue **`GO`** only when every planning gate is `Ready` and runtime readiness matches the user's mode.
- Issue **`CONDITIONAL-GO (planning-only)`** when the user explicitly wants scene/camera/lighting plans only (`Runtime status: Not Run`, `Artifact status: Not Produced`).
- Issue **`NO-GO`** if any `Blocked` row exists; never skip directly to scene mutation.

## Related skill
[../SKILL.md](../SKILL.md)
