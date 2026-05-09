# EVAL — blender-asset-discovery-planner

Status: Draft v0 text-only baseline  
Scope: per-asset strategy plan; no fetch / install / generate / runtime.

## Text-only eval prompt

Use blender-asset-discovery-planner to produce a per-asset plan from an 8-slot brief. Choose strategy + source + license + confidence + risk per asset. Do not fetch / install / generate. Do not run Blender.

## Expected behavior

- enumerates every asset class implied by the brief
- assigns one strategy per class (procedural / library / generative / photogrammetry)
- records source candidate + license + confidence label + risk per choice
- sums poly / GLB budget and compares to constraint slot
- flags generative strategy with Path 2 caveat
- never fetches, downloads, generates, or installs anything

## Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Cyberpunk shoe web hero brief | Subject = floating cyberpunk shoe; constraint = ≤10MB GLB; mood = neon glossy floor | Hero shoe = generative-via-Path-2 OR user-supplied; floor + props = procedural; HDRI = library (Poly Haven CC0); accent neon = procedural emission. Budget 8MB est. Pass. Generative caveat flagged. | full asset table, budget sum, generative caveat |
| Brand product render | Subject = brand sneaker; constraint = brand-restricted asset library only | Subject = brand library only; environment = procedural; license = brand-restricted; license risk callout | brand-only enforcement, license risk |
| Iteration sketch | Deliverable = text-only plan loop, runtime later | Everything procedural; library only for HDRI; license low-risk; budget N/A | procedural-first, low risk |
| Generative without Path 2 readiness | User wants Hyper3D shoe but Path 2 not configured | Mark generative blocked; route to readiness checker; offer library/procedural alternatives | blocked flag, route, alternatives |
| User skips license slot | User says "doesn't matter" | Mark `TBD`, ask before planner consumes | TBD entries, user follow-up |
| Conflicting constraints | Brand asset + ≤2MB GLB | Surface conflict; ask user to relax one constraint | conflict callout |
| Missing brief | No 8-slot brief provided | Route back to `intent-to-3d-brief-writer` | re-route message |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| Asset class | Subject / props / environment / materials / HDRI / particles |
| Strategy | Procedural / library / generative / photogrammetry |
| Source candidate | Named (Poly Haven, Sketchfab, brand library, Hyper3D, user-supplied, …) |
| License | CC0 / commercial-OK / brand-restricted / TBD |
| Confidence | `verified-read` / `linked-only` / `unknown` |
| Risk notes | Poly budget / filesize / license / generative caveats |
| Budget summary | Poly / GLB-size estimate vs. constraint |
| Generative caveat | Path 2 flag + caveat link if used |
| Runtime status | `Not Run` |
| Artifact status | `Not Produced` |

## Pass / Warn / Fail criteria

- Pass: every asset class has strategy + source + license + confidence + risk; budget summed and compared; generative strategy flagged correctly; no fetch / install
- Warn: 1-2 fields `TBD` with follow-up; budget summed without comparison; generative strategy missing caveat link
- Fail: missing strategy, license, or confidence on any asset; budget not summed; generative chosen with no caveat; claimed asset was fetched / installed / generated

## Common failure modes

- "just use any free model from the internet" (no source, no license, no confidence)
- skipping license entries entirely
- choosing generative without Path 2 caveat or readiness check
- silently fetching or generating assets from this skill (not allowed)
- letting downstream planner change strategy without explicit feedback

## Evidence expectations

- markdown asset table visible
- budget summary visible
- license risk callouts visible
- generative caveat link present if applicable
- explicit `Not Run` / `Not Produced`

## Sample passing response outline

- Brief recap (one line)
- Asset table with 6+ rows
- Budget summary: estimate vs. constraint
- License risks: 0-2 callouts
- Generative caveats: 0-1
- Handoff: scene planner

## Sample failing response outline

- "Use whatever free models you can find" (no table, no license)
- Skipped budget summary
- Claimed Hyper3D would generate the shoe without checking Path 2 readiness
