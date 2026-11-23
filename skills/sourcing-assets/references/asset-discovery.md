
# sourcing-assets (reference for `sourcing-assets`)

> Detailed playbook carried over from the former `sourcing-assets` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

## Purpose

Decide where the assets in a scene will come from before the scene planner commits to a layout. Asset acquisition decisions affect poly budget, web GLB size, licensing, and time-to-handoff. This skill produces a per-asset plan with explicit confidence labels and licensing notes — without installing tools, running Blender, or fetching anything.

This skill is BlendOps-specific (no direct analog in Anthropic Superpowers or BMad), driven by a real Blender domain need.

## Quick start

- read the 8-slot brief from `scoping-3d-briefs`
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

## Trigger phrases

## Prerequisites / readiness

- 8-slot brief from `scoping-3d-briefs` (or equivalent)
- list of constraint slots (performance, brand, time)
- no Blender runtime required
- works in text-only mode

## Input schema

### Required inputs

- 8-slot brief from `scoping-3d-briefs` (subject, mood, deliverables, constraints, evidence, acceptance, audience, owner)
- list of asset classes implied by the brief (e.g., hero subject, lighting, floor, environment backdrop)

### Optional inputs

- known asset libraries the user has access to (approved brand library, internal library, user-supplied files)
- license preferences (public domain only, commercial allowed, brand-restricted)
- prior similar scenes to match asset choices

### Assumptions to confirm

- the operator can defer fetching or generation to a later runtime step
- license restrictions matter for the deliverable (risks surfaced here; verdicts handled by `sourcing-assets`)
- truth states start at Runtime `Not Run` and Artifact `Not Produced` for plan-only work (downgrade-only, never upgrade)

## Output schema

### Primary output

- per-asset-class plan with strategy + source candidate + license + confidence + risk notes

| Asset class | Strategy | Source candidate | License | Confidence | Risk notes |
|---|---|---|---|---|---|
| Hero shoe model | generative | Path 2 community `mcp-for-blender` (formerly `ahujasid/blender-mcp`) Hyper3D / Hunyuan3D integration | TBD | linked-only | poly budget; Path 2 caveat; needs `sourcing-assets` verdict |
| Floor + props | procedural | built-in procedural setup | N/A | verified-read | poly budget |
| Lighting fixtures | procedural | built-in area light setup | N/A | verified-read | none |
| Environment backdrop | library | approved environment library | commercial-OK / TBD | verified-read | filesize; style check via `sourcing-assets` |

### Secondary output

- budget reconciliation summary compared against `budgeting-glb-for-web` and `budgeting-glb-for-web`
- explicit list of assets the operator must obtain before any runtime step
- license risk callouts for `sourcing-assets` to adjudicate

### Evidence / caveat output

- Runtime status: `Not Run`
- Artifact status: `Not Produced`
- Truth states are downgrade-only, never upgrade
- No asset is downloaded, generated, fetched, or installed by this skill

## Required laws

- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary

This skill does not download, generate, fetch, or install any asset. It does not run Blender, configure any MCP path, or touch the network. It produces a plain-language plan in markdown.

If the chosen strategy is `generative`, it is Path 2-only (community `mcp-for-blender`, formerly `ahujasid/blender-mcp`, Hyper3D / Hunyuan3D integrations) with per-path caveats (see `docs/unofficial-runtime-bridges.md`). Actual generation happens in a runtime step, never here.

## Operating procedure

1. Read the 8-slot brief from `scoping-3d-briefs`.
2. Enumerate every asset class implied (subjects, props, environment, materials, lighting backdrops, effects).
3. For each asset class, pick one acquisition strategy:
   - **procedural** — created inside Blender via built-in procedural rules; no external asset file.
   - **library** — existing approved library or user-supplied asset.
   - **generative** — Hyper3D / Hunyuan3D (Path 2-only via community `mcp-for-blender`, formerly `ahujasid/blender-mcp`, with per-path caveats); actual generation happens in a runtime step, never here.
   - **photogrammetry** — user-supplied scan; cleanup required before scene assembly.
4. For each pick: record source candidate, license, confidence label (`verified-read` / `linked-only` / `unknown`), and risk notes.
5. Reconcile per-class polycount and file-size estimates against `budgeting-glb-for-web` (and `budgeting-glb-for-web`). Flag any overage risk explicitly.
6. List every asset that must be obtained before runtime; surface license risks for `sourcing-assets` (do not issue license verdicts here) and flag multi-source combinations for `sourcing-assets`.
7. Hand off the asset plan + brief to the target scene planner (`planning-product-scenes`, `planning-scenes`, `planning-scenes`, `planning-scenes`, or `planning-product-scenes`).

## Decision tree

- subject is brand-specific (e.g., exact branded product) -> strategy must be `library` (user-supplied / brand library); never `generative` without explicit brand authorization
- mood is highly specific -> backdrop = `library`, color and surface treatments = `procedural`
- tight web or mobile budget constraint -> reconcile against `budgeting-glb-for-web`; favor `procedural` over heavy external imports
- iteration-loop deliverable -> favor `procedural` (fast and reproducible to adjust)
- one-shot marketing render -> `library` or `generative` (Path 2-only with caveats) is acceptable once license risk is cleared by `sourcing-assets`

## Playbooks

- Playbook A: "Cyberpunk shoe web hero" — shoe = generative or user-supplied; floor + props = procedural; HDRI = library; budget = web-tight
- Playbook B: "Brand product render" — subject = brand library only; environment = procedural; license = brand-restricted
- Playbook C: "Iteration sketch" — everything procedural; library only for HDRI

## Mode handling

### Text-only mode

- plan only, no fetch / generate / install
- Runtime status: `Not Run`
- Artifact status: `Not Produced`
- Truth states are downgrade-only, never upgrade

### Runtime-ready mode

- plan stays text-only; downstream runtime steps consume the plan
- if `generative` strategy is chosen, route to `setting-up-blender-runtime` first to confirm Path 2 (`mcp-for-blender`, formerly `ahujasid/blender-mcp`, Hyper3D / Hunyuan3D integrations) readiness and caveats

### Blocked runtime mode

- plan is still produced with Runtime `Not Run` and Artifact `Not Produced`
- mark `generative` options blocked; favor `procedural` or `library` via `sourcing-assets`

## Validation checklist

- [ ] every implied asset class enumerated
- [ ] canonical strategy chosen per asset class (`procedural` / `library` / `generative` / `photogrammetry`)
- [ ] source candidate named per choice
- [ ] license recorded per choice with risks surfaced for `sourcing-assets` (no final license verdicts claimed here)
- [ ] confidence label (`verified-read` / `linked-only` / `unknown`) assigned per choice
- [ ] budget reconciled against `budgeting-glb-for-web` and brief constraints
- [ ] obtain-before-runtime asset list included
- [ ] generative strategy flagged as Path 2-only (`mcp-for-blender`, formerly `ahujasid/blender-mcp`, Hyper3D / Hunyuan3D) with per-path caveats
- [ ] no asset downloaded, fetched, installed, or generated by this skill
- [ ] truth states set to Runtime `Not Run` and Artifact `Not Produced` (downgrade-only, never upgrade)

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Asset coverage | All implied assets listed | 1-2 missing with note | 3+ missing |
| License records | Every asset has license entry | Some `TBD` with follow-up | Missing license entries |
| Confidence labels | Every choice labeled | Partial labels | No labels |
| Budget reconciliation | Summed and compared | Summed without comparison | Not summed |
| Runtime claim | None | None | Asset claimed to be fetched / generated by this skill |

## Failure handling

- license unknown: mark `TBD`, surface the risk note, and route to `sourcing-assets` before the scene planner commits
- generative strategy requested but Path 2 readiness unknown or unavailable: route to `setting-up-blender-runtime` (and `sourcing-assets` if blocked)
- conflicting constraints (e.g., high-detail scan vs. tight mobile budget): surface conflict against `budgeting-glb-for-web` and route back to `scoping-3d-briefs` if constraints must be relaxed

## Troubleshooting

- if the asset list is too long, group by class and propose tiered approach (essentials vs. nice-to-have)
- if the user has no preference, default to procedural-first per BlendOps `evidence-before-done` (procedural is reproducible)

## Best practices

- procedural-first when license / budget pressure is high
- library-second when matching mood matters
- generative as a last resort, always with explicit caveats
- never fetch from this skill

## Good examples

- "Cyberpunk shoe brief. Asset plan: hero shoe = `generative` via Path 2 `mcp-for-blender` (formerly `ahujasid/blender-mcp`) Hyper3D/Hunyuan3D integration (license = `TBD`, risk surfaced for `sourcing-assets`; confidence = `linked-only`); floor + props = `procedural` (license = N/A; confidence = `verified-read`); environment lighting = `library` (approved studio backdrop; license = commercial-OK; confidence = `verified-read`). Budget reconciliation: estimated footprint checked against `budgeting-glb-for-web`. Obtain-before-runtime list: hero shoe mesh and environment backdrop. Runtime: `Not Run`, Artifact: `Not Produced`."

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

- downloading, fetching, generating, or installing any asset from this skill
- issuing final license verdicts instead of surfacing license risk for `sourcing-assets`
- skipping style consistency handoffs (`sourcing-assets`) when mixing procedural, library, and generative sources
- claiming generative strategy works in Path 1 or without checking Path 2 caveats via `setting-up-blender-runtime`
- referring to the community bridge as bare `blender-mcp` instead of `mcp-for-blender` (formerly `ahujasid/blender-mcp`)
- upgrading truth states above Runtime `Not Run` or Artifact `Not Produced`

## Cross-skill handoff

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
