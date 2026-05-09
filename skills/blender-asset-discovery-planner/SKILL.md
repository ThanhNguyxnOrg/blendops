---
name: blender-asset-discovery-planner
description: Plan the asset acquisition strategy (procedural, library, generative, photogrammetry) for a Blender scene without installing or executing. Use after the brief, before scene planning.
---

# blender-asset-discovery-planner

## Purpose

Decide where the assets in a scene will come from before the scene planner commits to a layout. Asset acquisition decisions affect poly budget, web GLB size, licensing, and time-to-handoff. This skill produces a per-asset plan with explicit confidence labels and licensing notes — without installing tools, running Blender, or fetching anything.

This skill is BlendOps-specific (no direct analog in Anthropic Superpowers or BMad), driven by a real Blender domain need.

## Quick start

- read the 8-slot brief from `intent-to-3d-brief-writer`
- enumerate every asset class needed (subjects, props, environment, materials, HDRIs)
- pick a strategy per asset class (procedural / library / generative / photogrammetry)
- record license + confidence label per choice
- hand off to scene planner

## When to use

- after the 3D brief is locked, before any scene plan
- when scene assets aren't trivially given (e.g. user says "shoe" but doesn't supply a shoe model)
- when poly budget / GLB size / brand-licensing constraints exist
- when planner needs to know upfront whether assets are procedural or external

## When not to use

- the user supplied all assets in the brief (skip; route directly to planner)
- runtime is already executing and assets are already in the scene (route to evidence skill)
- the request is iteration on an existing scene (assets are already chosen)

## Trigger phrases

- "what assets do we need"
- "where do the models come from"
- "asset plan before scene planning"
- "do we generate or import"
- "license check on assets"

## Prerequisites / readiness

- 8-slot brief from `intent-to-3d-brief-writer` (or equivalent)
- list of constraint slots (performance, brand, time)
- no Blender runtime required
- works in text-only mode

## Input schema

### Required inputs

- 8-slot brief (subject, mood, deliverables, constraints, evidence, acceptance, audience, owner)
- list of asset classes implied by the brief (e.g. "shoe model, neon lights, glossy floor, HDRI environment")

### Optional inputs

- known asset libraries the user has access to (Poly Haven, Sketchfab, brand asset library)
- license preferences (CC0 only / commercial OK / brand-restricted)
- prior similar scenes to match asset choices

### Assumptions to confirm

- the operator can defer fetching to a later runtime step
- license restrictions matter for the deliverable
- runtime status is `Not Run` and may stay so

## Output schema

### Primary output

- per-asset-class plan with strategy + license + confidence

```md
| Asset class | Strategy | Source candidate | License | Confidence | Risk notes |
|---|---|---|---|---|---|
| Hero shoe model | Generative or import | Hyper3D / Hunyuan3D / user-supplied / Sketchfab | CC0 / commercial-OK / TBD | linked-only / verified-read / unknown | poly budget |
| Floor + props | Procedural | Geometry Nodes setup | N/A | verified-read | poly budget |
| Lighting fixtures | Procedural | mesh light setup | N/A | verified-read | none |
| HDRI environment | Library | Poly Haven HDRI | CC0 | verified-read | filesize |
```

### Secondary output

- summary of poly budget / GLB size implications
- explicit list of assets the operator must obtain before runtime
- license risk callouts

### Evidence / caveat output

- runtime status: `Not Run`
- artifact status: `Not Produced`
- no asset is downloaded, generated, or installed by this skill

## Required laws

- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary

This skill does not download, generate, or install any asset. It does not run Blender, configure any MCP path, or touch the network. It produces a plan in markdown.

If the chosen strategy is "generative" via Path 2 (community `ahujasid/blender-mcp` integrates Hyper3D / Hunyuan3D), this skill notes that the actual generation happens in a runtime step under that path with the per-path caveats (see `docs/unofficial-runtime-bridges.md`).

## Operating procedure

1. Read the 8-slot brief.
2. Enumerate every asset class implied (subjects, props, environment, materials, HDRIs, particles).
3. For each asset class, pick a strategy:
   - **Procedural** — Geometry Nodes / shader nodes inside Blender; no external asset.
   - **Library** — Poly Haven, brand asset library, Sketchfab, user-supplied.
   - **Generative** — Hyper3D / Hunyuan3D (Path 2-only at present); text-to-3D pipeline.
   - **Photogrammetry** — user-supplied scan; preprocessing required.
4. For each pick: record source candidate, license, confidence label (`verified-read` / `linked-only` / `unknown`), and risk notes.
5. Sum per-class poly / GLB-size estimates against the brief's constraints. Flag overage explicitly.
6. List which assets must be obtained before any runtime step; mark license check status per asset.
7. Hand off the asset plan to `product-hero-scene-planner` (or relevant planner) with the brief and the asset plan as joint inputs.

## Decision tree

- subject is brand-specific (e.g. exact branded shoe) → strategy must be user-supplied / library; never generative without licensing
- mood is highly specific (cyberpunk neon) → HDRI = library, color via shader procedural
- web GLB constraint < 10MB → poly budget is tight; favor procedural over high-poly imports
- iteration-loop deliverable → favor procedural (cheap to iterate)
- one-shot marketing render → import-or-generative is fine if license OK

## Playbooks

- Playbook A: "Cyberpunk shoe web hero" — shoe = generative or user-supplied; floor + props = procedural; HDRI = library; budget = web-tight
- Playbook B: "Brand product render" — subject = brand library only; environment = procedural; license = brand-restricted
- Playbook C: "Iteration sketch" — everything procedural; library only for HDRI

## Mode handling

### Text-only mode

- plan only, no fetch / generate / install
- runtime status: `Not Run`
- artifact status: `Not Produced`

### Runtime-ready mode

- plan stays text-only; runtime steps consume the plan
- if generative strategy chosen, route to runtime readiness checker first to confirm Path 2 (`ahujasid/blender-mcp` Hyper3D / Hunyuan3D integrations) is configured

### Blocked runtime mode

- plan still produced
- mark generative options blocked; favor procedural / library

## Validation checklist

- [ ] every implied asset class enumerated
- [ ] strategy chosen per asset class
- [ ] source candidate named per choice
- [ ] license recorded per choice
- [ ] confidence label per choice
- [ ] poly / GLB budget summed and compared to brief constraints
- [ ] generative strategy flagged with Path 2 caveat if used
- [ ] no asset fetched / installed / generated by this skill
- [ ] runtime status remains `Not Run`
- [ ] license risks called out

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Asset coverage | All implied assets listed | 1-2 missing with note | 3+ missing |
| License records | Every asset has license entry | Some `TBD` with follow-up | Missing license entries |
| Confidence labels | Every choice labeled | Partial labels | No labels |
| Budget reconciliation | Summed and compared | Summed without comparison | Not summed |
| Runtime claim | None | None | Asset claimed to be fetched / generated by this skill |

## Failure handling

- license unknown: mark `TBD` and ask user before scene planner commits
- generative strategy required but Path 2 not available: route to runtime readiness checker
- conflicting constraints (e.g. brand asset + tight web budget): surface conflict, ask user to relax one

## Troubleshooting

- if the asset list is too long, group by class and propose tiered approach (essentials vs. nice-to-have)
- if the user has no preference, default to procedural-first per BlendOps `evidence-before-done` (procedural is reproducible)

## Best practices

- procedural-first when license / budget pressure is high
- library-second when matching mood matters
- generative as a last resort, always with explicit caveats
- never fetch from this skill

## Good examples

- "Cyberpunk shoe brief. Asset plan: hero shoe = user-supplied OR generative-via-Path-2 (license = user; confidence = linked-only); floor + props = procedural; HDRI = Poly Haven (CC0; verified-read); accent neon = procedural emission shader. Poly budget: 8MB GLB target, current estimate 6MB — Pass. Generative strategy flagged with Path 2 caveat."

## Bad examples

- "Just use any free shoe model from the internet, we'll figure out license later." (no source named, no license, no confidence label, license risk ignored)

## User-facing response template

- Brief recap (one line)
- Asset table (markdown)
- Budget summary
- License risks called out
- Generative caveats if applicable
- Handoff: scene planner with this asset plan + brief

## Anti-patterns

- fetching / downloading any asset from this skill
- skipping license entries
- claiming generative strategy works without confirming Path 2
- letting scene planner change asset strategy silently after handoff

## Cross-skill handoff

- After: `product-hero-scene-planner` with brief + asset plan
- If generative chosen and runtime unknown: `official-runtime-readiness-checker`
- If license risk surfaces: route back to `intent-to-3d-brief-writer` (slot 4 constraints)

## Non-goals

- fetching / downloading / installing assets
- running Blender or generative tools
- making the scene plan
- license adjudication beyond surfacing risk

## References

- BlendOps law: ../../laws/official-runtime-only.md
- BlendOps law: ../../laws/evidence-before-done.md
- BlendOps doc on Path 2 generative integrations: ../../docs/unofficial-runtime-bridges.md
- Skill system: ../../docs/skill-system.md
