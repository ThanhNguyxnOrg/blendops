
# planning-scenes (reference for `planning-scenes`)

> Detailed playbook carried over from the former `planning-scenes` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

## Purpose
Translate an interior architectural visualization intent (room or interior space planned for catalog, brand, or showcase) into a complete, structured room plan with an assumptions register. Distinct from `planning-scenes` (outdoor/wide places; an establishing shot of an interior room belongs HERE when furniture and surfaces dominate), `planning-product-scenes` (single manufactured product), and `planning-scenes` (single subject).

## Quick start
- lock style early and pin room type + plausible room dimensions (never invent dimensions; record any defaults in the assumptions register)
- pin architecture basics (walls, floor, ceiling, windows, doors)
- pin furniture + props + material palette
- pin lighting (natural + artificial mix) + mood + time of day
- pin camera angle + lens
- emit a structured plan with an assumptions register + handoff to `sourcing-assets`, `budgeting-glb-for-web`, `sourcing-assets`, and quality checkers

## When to use
- intent is an interior room, space, or venue where furniture and surfaces dominate (including interior establishing shots)
- architectural visualization, catalog, brand showcase, hospitality, or residential room planning
- before any modeling, furniture sourcing, or rendering

## When not to use

## Trigger phrases

## Prerequisites / readiness
- brief from `scoping-3d-briefs`
- room type + style known
- aspect / use case known

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Room type + plausible dimensions | Drives layout, scale, and furniture fit (dimensions must be plausible, never invented) |
| Style era / aesthetic | Locked early to drive architecture, material palette, and furniture choices |
| Time of day + mood | Drives natural light direction, intensity, and artificial fixture balance |
| Aspect ratio | Drives camera framing and composition rules |

### Optional inputs

| Input | Use |
|---|---|
| Reference images / boards | Style calibration |
| Brand guidelines | Color, material, and branding alignment |
| Specific furniture requests | Flagged as rows for `sourcing-assets` |

### Assumptions to confirm
- Plausible room dimensions explicitly stated or flagged for confirmation (never silently invented).
- Style is locked early and consistent across architecture, furniture, and props (validated via `sourcing-assets`).
- Scene scope is realizable within target asset/performance constraints (budget questions routed to `budgeting-glb-for-web`).
- Camera position, lens, and target are locked before modeling.

## Output schema

### Primary output
A complete interior room plan containing:
- Room (type, plausible dimensions, locked style)
- Architecture (walls, floor, ceiling, windows, doors)
- Furniture + props
- Material palette (key surfaces + finishes)
- Lighting (natural light via windows + artificial fixtures + practical lamps)
- Camera (position, lens, target)
- Mood + time of day
- Assumptions register (all unconfirmed inputs and plausible dimension assumptions)

### Secondary output
- asset rows flagged for `sourcing-assets`
- style consistency notes for `sourcing-assets`
- budget questions flagged for `budgeting-glb-for-web`
- validation handoff list for `planning-camera-and-framing`, `planning-lighting-and-materials`, `planning-lighting-and-materials`, and `verifying-before-handoff`

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Planning-only skill — does not model, source furniture, render, or execute Blender. Runtime status stays `Not Run` and artifact status stays `Not Produced` (downgrade-only, never upgrade). Hand off asset sourcing to `sourcing-assets`, budget questions to `budgeting-glb-for-web`, style checks to `sourcing-assets`, and validation to `planning-camera-and-framing`, `planning-lighting-and-materials`, `planning-lighting-and-materials`, and `verifying-before-handoff`.

## Operating procedure
1. Read brief from `scoping-3d-briefs`; lock style early and pin room type + plausible room dimensions (never invent dimensions; log any unconfirmed values in the assumptions register).
2. Pin architecture basics: walls, floor, ceiling, windows, and doors (see `references/interior-architecture-rules.md`).
3. Plan furniture layout + props (see `references/furniture-layout-rules.md`).
4. Pin material palette and key surfaces matching the locked style.
5. Plan lighting: natural light (windows + sun direction) + artificial light (overhead fixtures + practical lamps).
6. Pin camera position, lens, and target (see `references/interior-camera-rules.md`).
7. Pin mood + time of day.
8. Compile the assumptions register and list asset rows for `sourcing-assets`.
9. Emit handoffs to `sourcing-assets`, `budgeting-glb-for-web`, `sourcing-assets`, `planning-camera-and-framing`, `planning-lighting-and-materials`, `planning-lighting-and-materials`, and `verifying-before-handoff`.

## Decision tree

```txt
Room dimensions missing or unrealistic for use case (e.g. 100m² home office)?
  → Do not invent dimensions; warn, propose plausible defaults in the assumptions register, and verify intent
Style unclear in brief?
  → Return to scoping-3d-briefs before planning furniture or materials
Style + furniture mismatch (e.g. modern brief + ornate Victorian sofa)?
  → Fail; lock one style early and route to sourcing-assets
Performance or polycount budget in question?
  → Route budget questions to budgeting-glb-for-web
Time of day mid-day but only artificial lighting planned?
  → Warn; natural window light should be accounted for alongside artificial fixtures
Wide-angle 14mm in a small room?
  → Warn; distortion likely; propose 24mm + camera repositioning
```

## Playbooks

### Playbook A: Modern living room hero (16:9 catalog)
24–35mm wide; camera in corner; afternoon natural light through window; sofa + coffee table + rug as primary furniture; minimal palette; soft shadows.

### Playbook B: Hospitality lobby (1:1 social)
35mm; camera centered toward focal art / reception; warm artificial lighting + minimal natural; rich materials.

### Playbook C: Office showroom (wide 2.39:1)
24mm; camera elevated; mix natural + artificial; clean material palette; depth layered (foreground furniture + midground workstations + background views).

## Mode handling

### Text-only mode
Emit the structured room plan, assumptions register, and handoff list. Runtime stays `Not Run`; artifacts stay `Not Produced`.

### Runtime-ready mode
Emit the structured room plan, assumptions register, and downstream handoffs. Do not execute Blender; runtime stays `Not Run` and artifacts stay `Not Produced`.

### Blocked runtime mode
Emit the structured room plan and assumptions register; flag what cannot be confirmed downstream. Runtime stays `Not Run`; artifacts stay `Not Produced`.

## Validation checklist
- [ ] Style locked early
- [ ] Room type + plausible dimensions pinned (never invented)
- [ ] Assumptions register populated
- [ ] Architecture basics (walls, floor, ceiling, windows, doors) pinned
- [ ] Furniture + props listed
- [ ] Material palette + key surfaces listed
- [ ] Lighting plan (natural + artificial) explicit
- [ ] Camera position + lens + target chosen
- [ ] Mood + time of day pinned
- [ ] Asset rows flagged for `sourcing-assets`
- [ ] Handoffs named (`budgeting-glb-for-web`, `sourcing-assets`, `planning-camera-and-framing`, `planning-lighting-and-materials`, `planning-lighting-and-materials`, `verifying-before-handoff`)
- [ ] Runtime status locked to `Not Run` and Artifact status locked to `Not Produced`

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | All room plan sections complete, style locked early, plausible dimensions with assumptions register, natural + artificial lighting planned, assets flagged, handoffs named, truth states set to `Not Run` / `Not Produced`. |
| Warn | Minor ambiguity recorded in assumptions register (e.g. secondary prop finish or exact window orientation pending confirmation). |
| Fail | Invented or implausible room dimensions; missing assumptions register; style + furniture clash; missing lighting or camera plan; truth states upgraded beyond `Not Run` / `Not Produced`. |

## Failure handling
- Unclear brief or style → hand off to `scoping-3d-briefs`.
- Style mismatch across assets → hand off to `sourcing-assets`.
- Unknown asset or performance budget → hand off to `budgeting-glb-for-web`.
- Composition, lighting, material, or overall scene validation issues → hand off to `planning-camera-and-framing`, `planning-lighting-and-materials`, `planning-lighting-and-materials`, and `verifying-before-handoff`.

## Troubleshooting

| Problem | Resolution |
| --- | --- |
| Room dimensions not supplied by user | Do not invent silently; propose standard plausible dimensions in the assumptions register and request confirmation. |
| Planned layout feels empty or lacks depth | Add foreground/midground prop layers in the plan, place camera in a corner rather than room center, and flag for `planning-camera-and-framing`. |
| Planned lighting lacks contrast | Balance natural window light direction with warm artificial practical lamps, and flag for `planning-lighting-and-materials`. |
| Planned materials or furniture clash | Lock the style palette early and route to `sourcing-assets` and `planning-lighting-and-materials`. |
| Wide-angle lens distortion risk in small room | Plan for a 24–35mm lens with corner camera placement and verify via `planning-camera-and-framing`. |

## Best practices
- Plan natural + artificial lighting together; they form a system.
- Always provide a camera in corner (not center) for room scenes — center loses depth.
- Lock palette early (3–5 colors max).
- Treat windows as light sources, not decorations.

## Good examples
- "Room: modern minimalist living room, 4×6m, ceiling 2.7m, style locked to warm Scandinavian modern. Architecture: light oak floor, matte white walls, floor-to-ceiling window on south wall, fireplace center back, flush wood door on east wall. Furniture + props: 3-seat neutral fabric sofa facing fireplace, low oak coffee table, woven area rug, single armchair right, ceramic vase on table. Material palette: light oak, matte white plaster, brushed concrete, warm grey linen. Lighting: afternoon natural sunlight through south window (dominant) + 2 recessed ceiling lights + 1 warm floor lamp by armchair. Camera: 35mm lens, north-east corner at eye-level, targeting sofa and fireplace framing. Mood + time of day: calm, warm afternoon (15:00). Assumptions register: 2.7m ceiling height assumed as plausible residential standard pending user confirmation; standard doorway width assumed. Runtime status: Not Run. Artifact status: Not Produced."

## Bad examples
- "Living room scene." — no dims, style, lighting, or camera.

## User-facing response template

```txt
Room: <type / plausible dims / locked style>
Architecture: <walls / floor / ceiling / windows / doors>
Furniture + props: <list>
Material palette: <3-5 dominant finishes>
Key surfaces: <floor / wall / ceiling / furniture fabric>
Lighting: Natural: <window + sun direction + intensity> | Artificial: <ceiling fixtures + practical lamps> | Ambient environment: <sky/exterior bounce if any>
Camera: <focal length> | <position> | <eye-line> | <target>
Mood + time of day: <line>
Assumptions register: <explicitly confirmed vs assumed plausible dimensions, style locks, and constraints>

Assets to discover (for sourcing-assets): <list>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <brief / inputs or "none">
Limitations: <gaps>
Next: sourcing-assets | budgeting-glb-for-web | sourcing-assets | planning-camera-and-framing | planning-lighting-and-materials | planning-lighting-and-materials | verifying-before-handoff
```

## Anti-patterns
- Center-of-room camera for hero shots (loses depth).
- Skipping window light when natural light is available.
- Mixing style eras without intent.
- Inventing room dimensions.

## Cross-skill handoff

## Non-goals
- Model the room or geometry.
- Source furniture or download assets (belongs to `sourcing-assets`).
- Decide performance or polycount budgets (belongs to `budgeting-glb-for-web`).
- Audit cross-asset style consistency or validate composition, lighting, materials, or scene quality (belongs to `sourcing-assets`, `planning-camera-and-framing`, `planning-lighting-and-materials`, `planning-lighting-and-materials`, and `verifying-before-handoff`).
- Render or run Blender.

## References
- `references/interior-architecture-rules.md`
- `references/furniture-layout-rules.md`
- `references/interior-camera-rules.md`
- `../../docs/skill-system.md`
