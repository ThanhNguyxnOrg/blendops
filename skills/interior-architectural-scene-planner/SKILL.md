---
name: interior-architectural-scene-planner
description: Plan an interior architectural visualization scene (room layout, furniture, materials, natural + artificial lighting) before any modeling or render attempt.
---

# interior-architectural-scene-planner

## Purpose
Translate an interior arch viz intent (room / interior space planned for catalog / brand / showcase) into a structured scene plan. Distinct from `environment-establishing-shot-planner` (outdoor/wide) and `product-hero-scene-planner` (single product hero).

## Quick start
- pin room type + dimensions + style
- pin furniture + props + key materials
- pin lighting (natural + artificial mix)
- pin camera angle + lens
- pin mood + time of day
- emit a structured plan + handoff to checkers

## When to use
- intent is interior room / space / venue
- arch viz / catalog / brand / showcase / hospitality / residential
- before any modeling

## When not to use
- outdoor establishing (use `environment-establishing-shot-planner`)
- single hero product (use `product-hero-scene-planner`)
- character portrait (use `character-portrait-scene-planner`)

## Trigger phrases
- "interior of"
- "living room scene"
- "office showcase"
- "hotel lobby"
- "kitchen showroom"

## Prerequisites / readiness
- brief from `intent-to-3d-brief-writer`
- room type + style known
- aspect / use case known

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Room type | Drives layout + furniture |
| Style era / aesthetic | Drives material + furniture choices |
| Time of day | Drives natural light direction + intensity |
| Aspect ratio | Composition rules |

### Optional inputs

| Input | Use |
|---|---|
| Reference images / boards | Style calibration |
| Brand guidelines | Color + material + branding |
| Specific furniture brand requests | Asset sourcing |

### Assumptions to confirm
- Room is realizable in a reasonable budget (asset / polycount).
- Style is consistent across architecture + furniture + props.
- Camera is locked.

## Output schema

### Primary output
A structured interior arch viz plan: Room (type / dims / style), Architecture (walls / floor / ceiling / windows / doors), Furniture + props, Materials (palette + key surfaces), Lighting (natural via windows + artificial fixtures + practicals), Camera (position / lens / target), Mood + time of day.

### Secondary output
- asset list flagged for `blender-asset-discovery-planner`
- branding / palette notes
- handoff list

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Planning skill — does not run Blender, model, or render. Hand off to discovery / quality checkers.

## Operating procedure
1. Read brief; pin room type + style.
2. Pin architecture basics (see `references/interior-architecture-rules.md`).
3. Plan furniture layout + props (see `references/furniture-layout-rules.md`).
4. Pin material palette (per style + brand).
5. Plan lighting: natural (windows + sun direction) + artificial (fixtures + practicals).
6. Pin camera angle + lens (see `references/interior-camera-rules.md`).
7. Pin mood + time of day.
8. List assets + flag for discovery.
9. Emit handoff.

## Decision tree

```txt
Room dimensions unrealistic for use case (e.g. 100m² home office)?
  → Warn; verify intent
Style + furniture brand mismatch (modern brief + ornate Victorian sofa)?
  → Fail; pick one
Time of day mid-day but only artificial lighting planned?
  → Warn; window light should dominate
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
Plan only.

### Runtime-ready mode
Plan + runtime path attribution.

### Blocked runtime mode
Plan only; flag what cannot be confirmed.

## Validation checklist
- [ ] Room type + dims + style pinned
- [ ] Architecture basics pinned
- [ ] Furniture + props listed
- [ ] Material palette + key surfaces listed
- [ ] Lighting plan (natural + artificial) explicit
- [ ] Camera + lens chosen
- [ ] Mood + time of day pinned
- [ ] Asset list flagged
- [ ] Handoff named

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All sections + plausible style consistency + lighting plan + assets flagged. |
| Warn | One section ambiguous (palette unclear, time of day vs lighting mismatch). |
| Fail | Style + furniture clash; impossible camera (14mm in 4m² room); lighting plan absent. |

## Failure handling
- Style unclear → hand off to brief writer.
- Asset budget unknown → hand off to budget skill.
- Camera unrealistic → propose alternative.

## Troubleshooting

| Problem | Response |
|---|---|
| Room feels empty | Add foreground prop + verify camera is in corner (not center). |
| Lighting reads flat | Mix natural + artificial; add practicals; verify HDRI not dominating. |
| Materials clash | Lock palette early per `style-consistency-rules.md` (character planner). |
| Wide-angle distortion ugly | Use 24–35mm; reposition camera farther. |

## Best practices
- Plan natural + artificial lighting together; they form a system.
- Always provide a camera in corner (not center) for room scenes — center loses depth.
- Lock palette early (3–5 colors max).
- Treat windows as light sources, not decorations.

## Good examples
- "Room: modern minimalist living room, 4×6m, ceiling 2.7m, light oak floor, white walls, large window south-facing. Architecture: floor-to-ceiling window left wall, fireplace center back. Furniture: 3-seat sofa facing fireplace, low coffee table, area rug, single armchair right. Materials: warm wood + concrete + neutral fabric. Lighting: afternoon natural through window dominant + 2 ceiling spots + 1 floor lamp. Camera: 35mm, near corner, eye-level. Mood: calm, modern, warm. Time: 15:00."

## Bad examples
- "Living room scene." — no dims, style, lighting, or camera.

## User-facing response template

```txt
Room: <type / dims / style / era>
Architecture: <walls / floor / ceiling / windows / doors>
Furniture + props: <list>
Material palette: <3-5 dominant>
Key surfaces: <floor / wall / counter / fabric>
Lighting: Natural: <window + sun direction + intensity> | Artificial: <fixtures + practicals> | HDRI: <if any>
Camera: <focal length> | <position> | <eye-line> | <target>
Mood + time of day: <line>

Assets to discover: <list>
Limitations: <gaps>
Next: blender-asset-discovery-planner / composition-quality-checker / lighting-quality-checker / material-quality-checker
```

## Anti-patterns
- Center-of-room camera for hero shots (loses depth).
- Skipping window light when natural light is available.
- Mixing style eras without intent.
- Inventing room dimensions.

## Cross-skill handoff
- Brief writer → `../intent-to-3d-brief-writer/SKILL.md`
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- Material validation → `../material-quality-checker/SKILL.md`
- Lighting validation → `../lighting-quality-checker/SKILL.md`
- Composition validation → `../composition-quality-checker/SKILL.md`

## Non-goals
- Model the room.
- Source furniture.
- Render.
- Run Blender.

## References
- `references/interior-architecture-rules.md`
- `references/furniture-layout-rules.md`
- `references/interior-camera-rules.md`
- `../../docs/skill-system.md`
