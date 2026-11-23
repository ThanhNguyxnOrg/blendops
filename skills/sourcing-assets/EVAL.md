# sourcing-assets — EVAL

Behavioral evaluation prompts for `sourcing-assets`. Sections below come from the skills merged into it in v2.0.0.

## From former `sourcing-assets`

Status: 1.0.0 text-only baseline  
Scope: per-asset strategy plan; no fetch / install / generate / runtime.

### Text-only eval prompt

Use sourcing-assets to produce a per-asset plan from an 8-slot brief. Choose strategy + source + license + confidence + risk per asset. Do not fetch / install / generate. Do not run Blender.

### Expected behavior

- enumerates every asset class implied by the brief
- assigns one strategy per class (procedural / library / generative / photogrammetry)
- records source candidate + license + confidence label + risk per choice
- sums poly / GLB budget and compares to constraint slot
- flags generative strategy with Path 2 caveat
- never fetches, downloads, generates, or installs anything

### Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Cyberpunk shoe web hero brief | Subject = floating cyberpunk shoe; constraint = ≤10MB GLB; mood = neon glossy floor | Hero shoe = generative-via-Path-2 OR user-supplied; floor + props = procedural; HDRI = library (Poly Haven CC0); accent neon = procedural emission. Budget 8MB est. Pass. Generative caveat flagged. | full asset table, budget sum, generative caveat |
| Brand product render | Subject = brand sneaker; constraint = brand-restricted asset library only | Subject = brand library only; environment = procedural; license = brand-restricted; license risk callout | brand-only enforcement, license risk |
| Iteration sketch | Deliverable = text-only plan loop, runtime later | Everything procedural; library only for HDRI; license low-risk; budget N/A | procedural-first, low risk |
| Generative without Path 2 readiness | User wants Hyper3D shoe but Path 2 not configured | Mark generative blocked; route to readiness checker; offer library/procedural alternatives | blocked flag, route, alternatives |
| User skips license slot | User says "doesn't matter" | Mark `TBD`, ask before planner consumes | TBD entries, user follow-up |
| Conflicting constraints | Brand asset + ≤2MB GLB | Surface conflict; ask user to relax one constraint | conflict callout |
| Missing brief | No 8-slot brief provided | Route back to `scoping-3d-briefs` | re-route message |

### Expected evidence/status fields

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

### Pass / Warn / Fail criteria

- Pass: every asset class has strategy + source + license + confidence + risk; budget summed and compared; generative strategy flagged correctly; no fetch / install
- Warn: 1-2 fields `TBD` with follow-up; budget summed without comparison; generative strategy missing caveat link
- Fail: missing strategy, license, or confidence on any asset; budget not summed; generative chosen with no caveat; claimed asset was fetched / installed / generated

### Common failure modes

- "just use any free model from the internet" (no source, no license, no confidence)
- skipping license entries entirely
- choosing generative without Path 2 caveat or readiness check
- silently fetching or generating assets from this skill (not allowed)
- letting downstream planner change strategy without explicit feedback

### Evidence expectations

- markdown asset table visible
- budget summary visible
- license risk callouts visible
- generative caveat link present if applicable
- explicit `Not Run` / `Not Produced`

### Sample passing response outline

- Brief recap (one line)
- Asset table with 6+ rows
- Budget summary: estimate vs. constraint
- License risks: 0-2 callouts
- Generative caveats: 0-1
- Handoff: scene planner

### Sample failing response outline

- "Use whatever free models you can find" (no table, no license)
- Skipped budget summary
- Claimed Hyper3D would generate the shoe without checking Path 2 readiness

## From former `sourcing-assets`

### Text-only eval prompt
Apply sourcing-assets on a 4-asset list (1 CC0 HDRI from polyhaven, 1 MIT model from sketchfab, 1 unknown texture, 1 paid commercial license model). Intended use: commercial brand campaign.

### Expected behavior
- 4-row asset table with source / license / permissions / verdict
- attribution lines listed
- assets to remove flagged (the unknown one as Fail)
- top-line status
- "not legal advice" caveat

### Pass / Warn / Fail criteria
- Pass: 4 rows + verdicts + attribution + caveat
- Warn: rows present but attribution incomplete
- Fail: marks "should be fine" verdicts, fabricates license terms

### Common failure modes
- "Should be fine" verdicts
- skipping attribution plan
- inventing license terms
- treating "all rights reserved" as usable

### Sample passing response outline
- Header: intended use + attribution policy
- 4 rows + verdicts
- Attribution list
- Assets to remove
- Top-line + caveat

### Sample failing response outline
- "Looks OK to use"
- No license terms cited

## From former `sourcing-assets`

### Text-only eval prompt
Apply sourcing-assets on a 4-asset list (3 realistic PBR + 1 stylized cartoon) for an all-realistic product hero brief.

### Expected behavior
- per-asset 4-axis (realism / detail / color / surface) rows
- drift verdict per row
- top-line: Fail (1 stylized in all-realistic brief)
- remediation: replace or restyle the stylized asset
- handoff to fallback strategy

### Pass / Warn / Fail criteria
- Pass: 4 rows + brief reference + verdicts + remediation
- Warn: rows present but axis values guessed
- Fail: "vibe" verdicts, no axis-by-axis evaluation

### Sample passing response outline
- Brief style line
- 4 rows
- Top-line + remediation list
- Next handoff

### Sample failing response outline
- "Looks fine"
- No axis evaluation

## From former `sourcing-assets`

### Text-only eval prompt
Apply sourcing-assets on a failed hero-shoe-mesh.glb (license-blocked) for a commercial brand campaign brief.

### Expected behavior
- 2-3 options (CC0 / paid commercial / procedural / drop)
- columns: time / brief match / license / recommendation
- recommendation given
- user agreement required
- caveat for drop option
- updated asset list

### Pass / Warn / Fail criteria
- Pass: 2-3 options + recommendation + agreement required + caveat
- Warn: options thin or recommendation soft
- Fail: silent substitution, no caveat, no agreement

### Common failure modes
- "we'll figure it out"
- skipping license check on fallback
- silent substitution
- omitting drop option

### Sample passing response outline
- Failed asset + reason
- Options table with columns
- Recommendation
- "Decision needed"
- Caveat / updated list

### Sample failing response outline
- "Use anything similar"
- No options table

## From former `sourcing-assets`

### Text-only eval prompt
Apply sourcing-assets for a medium repo (~150 assets, mixed models / textures / HDRIs, git + LFS).

### Expected behavior
- folder tree pinned
- naming convention with examples
- metadata schema (fields)
- VCS rules (LFS threshold)
- license tracking strategy
- review process
- migration steps if relevant

### Pass / Warn / Fail criteria
- Pass: all sections pinned + naming + license tracking
- Warn: metadata schema partial
- Fail: "just dump in a folder", no naming, no license tracking

### Sample passing response outline
- Library size + VCS header
- Tree
- Naming + metadata + VCS + license + review sections
- Migration steps

### Sample failing response outline
- "Use a Drive folder"
- No naming or metadata
