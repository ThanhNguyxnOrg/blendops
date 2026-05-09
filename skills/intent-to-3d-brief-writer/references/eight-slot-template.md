# 8-Slot Brief Template

Use this exact template for every brief. Fill or mark `Unknown` per slot. The brief is a contract; planners do not silently expand or contract scope.

## Template

```md
# 3D Brief: <short title>

> TL;DR (one line): <one-sentence summary>

## 1. Subject

<what the scene is about — plain language, no Blender jargon>

## 2. Mood / style

<tone, references, brand notes>

## 3. Deliverables

- <render image / GLB for web / preview / response> (be exhaustive — no implicit "and other things")

## 4. Constraints

- <performance budget, time, scope, brand restrictions, license>

## 5. Evidence expectations

- Acceptable truth labels: <`Not Run` / `Attempted` / `Produced` / `Verified` / `Failed`>
- Required evidence fields per claim: <list>

## 6. Acceptance criteria

- <observable, not subjective — the planner / operator can prove pass/fail>

## 7. Audience

<marketing team / tech artist / non-Blender-technical user / mixed>

## 8. Owner

<operator / agent / human reviewer — who runs and verifies>

---

## Decisions deferred

| Decision | Deferred to skill |
|---|---|
| <e.g. exact lighting placement> | `blender-lighting-material-planner` |
| <e.g. exact camera focal length> | `blender-composition-camera-planner` |
| <e.g. material portability for web> | `blender-lighting-material-planner` |

## Unknowns

- <list of `Unknown` slots with why they are not yet resolved>

## Confirmation

- [ ] User has read this brief and confirmed (echo + edit cycle complete)
- [ ] Runtime status: `Not Run`
- [ ] Artifact status: `Not Produced`
```

## Filled example (cyberpunk shoe web hero)

```md
# 3D Brief: Cyberpunk Shoe Web Hero

> TL;DR: floating cyberpunk sneaker in neon-noir mood, render + GLB for marketing web embed.

## 1. Subject
A floating sneaker, hero-centered, with subtle motion implied (no full animation).

## 2. Mood / style
Cyberpunk neon-noir: glossy dark floor, neon accent rim lighting, mid-saturation.

## 3. Deliverables
- One render image (1920×1080, PNG)
- One GLB file for web embed (≤ 10MB target)
- One non-Blender-user response summarizing status

## 4. Constraints
- Web GLB must load on mid-tier mobile (poly budget tight)
- Brand neon palette only (no off-brand pinks)
- License: brand-restricted shoe model OR generative via Path 2

## 5. Evidence expectations
- Acceptable labels for render: `Verified`
- Acceptable labels for GLB: `Produced` minimum, `Verified` if web import test passes
- Required fields: output path, file existence, validation notes per artifact

## 6. Acceptance criteria
- Subject framing centered with negative space top-left for headline
- Neon rim lighting visible from primary camera
- GLB ≤ 10MB
- GLB opens in target web viewer without errors

## 7. Audience
Marketing team — non-Blender-technical. Final response must be plain language.

## 8. Owner
Operator: <user>. Verification by: `pre-handoff-verification` before release.

## Decisions deferred
| Decision | Deferred to skill |
|---|---|
| Exact lighting placement | `blender-lighting-material-planner` |
| Exact camera focal length and angle | `blender-composition-camera-planner` |
| Shoe surface material (procedural vs imported PBR) | `blender-lighting-material-planner` |
| Asset acquisition strategy | `blender-asset-discovery-planner` |

## Unknowns
- Final shoe model source (brand library vs generative). Decided after asset discovery planner runs.

## Confirmation
- [x] User confirmed (2026-05-09)
- Runtime status: `Not Run`
- Artifact status: `Not Produced`
```
