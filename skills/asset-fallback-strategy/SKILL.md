---
name: asset-fallback-strategy
description: Provide a fallback strategy when an asset is unavailable, over-budget, license-blocked, or style-incompatible — without halting the recipe.
---

# asset-fallback-strategy

## Purpose
When `asset-license-checker` / `asset-style-consistency-checker` / `glb-mobile-performance-budget` blocks an asset, this skill produces an actionable fallback (replace / re-source / generate procedural / drop with caveat) so the recipe can proceed.

## Quick start
- read the failed asset + reason
- propose 2-3 fallback options ordered by speed-to-implement
- pick one with user agreement
- update the asset list

## When to use
- after a checker fails an asset
- when an asset cannot be acquired in time
- when budget excludes the originally-planned asset
- when license blocks an asset

## When not to use
- when no asset has failed (nothing to fall back to)
- pure exploration (no concrete asset list)
- when the user wants to wait for the original asset

## Trigger phrases
- "what if we can't get this asset"
- "fallback for the model"
- "the license blocks us"
- "scaled-down asset"

## Prerequisites / readiness
- failed asset + reason known
- recipe brief known (informs alternative selection)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Failed asset + reason | Drives fallback search |
| Recipe brief | Alternative must satisfy brief |
| Time / budget remaining | Affects feasibility of options |

### Optional inputs

| Input | Use |
|---|---|
| Existing internal asset library | Source of fast fallbacks |
| Generative tool access (procedural / AI) | Adds option types |

### Assumptions to confirm
- The user accepts that a fallback is needed (vs waiting).
- "Drop with caveat" is a valid option even if not preferred.

## Output schema

### Primary output
A fallback option table: option (replace / re-source / procedural / generative / drop), source / method, time-to-implement, brief match, license confidence, recommendation.

### Secondary output
- updated asset list reflecting picked fallback
- caveat lines if "drop" is chosen
- evidence label

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

Process / planning skill — does not download / acquire / generate assets. Outputs a strategy.

## Operating procedure
1. Read failed asset + reason.
2. Read brief style + budget context.
3. Generate 2-3 fallback options (see `references/fallback-option-types.md`).
4. Score each on time / brief match / license / quality.
5. Recommend one; require user agreement.
6. Update asset list; flag downstream rework needed.

## Decision tree

```txt
Failed by license?
  → Replace from CC0 source first; otherwise paid alternative
Failed by budget (size/poly)?
  → Lower-poly version; or procedural; or simplification
Failed by style?
  → Replace from same-style source; or restyle
Failed by unavailability?
  → Re-source from cache; or procedural; or drop with caveat
```

## Playbooks

### Playbook A: Hero shoe model unavailable
Options: (1) Use stand-in mesh from internal lib (fastest, may not match brand). (2) Source from photogrammetry service (slowest, exact). (3) Procedural / generative (medium, brand-aligned but stylization may drift).

### Playbook B: HDRI blocked by license
Options: (1) Replace with CC0 from polyhaven (fastest). (2) Bake HDR from procedural sky shader (medium). (3) Drop HDRI; rely on explicit lights (caveat: ambient feel changes).

### Playbook C: Texture over-budget
Options: (1) Resize from 4K to 1K (fastest). (2) Replace with procedural noise + tiled detail (medium). (3) Drop texture variation; use solid color (caveat: visual difference).

## Mode handling

### Text-only mode
Strategy table only.

### Runtime-ready mode
After picking fallback, hand off to discovery / asset-fetch action.

### Blocked runtime mode
Strategy is forward-plan; no immediate action.

## Validation checklist
- [ ] Failed asset + reason explicit
- [ ] 2-3 options with time / match / license columns
- [ ] Recommendation explicit
- [ ] User agreement evidence required
- [ ] Updated asset list reflected
- [ ] Caveat lines if "drop"

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | 2-3 options + recommendation + agreement + updated list. |
| Warn | Options present but recommendation soft. |
| Fail | "Just drop it" without caveat; no alternatives explored; agreement missing. |

## Failure handling
- No viable fallback exists → recommend recipe scope reduction (drop the deliverable that needed this asset).
- Fallback also blocks → repeat the cycle with new fallback search.
- User refuses all options → document; flag as recipe-blocker.

## Troubleshooting

| Problem | Response |
|---|---|
| Fallback doesn't match brief | Either change brief or change fallback; do not silently lower quality. |
| Procedural option requires modeling skill not available | Cross out; rely on replace / drop. |
| Generative AI tool license unclear | Run through `asset-license-checker` first. |

## Best practices
- Always offer at least 2 options.
- Always show a "drop with caveat" option (even if last choice).
- Time-to-implement is decisive; brief match is necessary; license confidence is non-negotiable.
- Keep this skill narrow.

## Good examples
- "Failed: hero-shoe-mesh.glb (license-blocked). Options: (1) polyhaven CC0 generic shoe — 30 min, brief match low. (2) Buy commercial license $99 — 2 hr, exact match. (3) Procedural shape + texture — 4 hr, match medium. Recommended: (2) for brief fidelity. Decision needed."

## Bad examples
- "We'll figure it out." — no options listed.

## User-facing response template

```txt
Failed asset: <name>
Reason: <license / budget / style / unavailable>

| Option | Source / method | Time | Brief match | License | Recommendation |
|---|---|---|---|---|---|

Recommendation: <option>
Decision needed before continuing.
Caveat lines (if drop): <list>
Updated asset list: <link or note>
Limitations: <gaps>
Next: discovery for selected fallback / scope reduction if all blocked
```

## Anti-patterns
- "Just drop it" without caveat.
- Silently substituting without user agreement.
- Inventing fallback sources.
- Skipping the license check on the new fallback.

## Cross-skill handoff
- Discovery for new asset → `../blender-asset-discovery-planner/SKILL.md`
- License check on fallback → `../asset-license-checker/SKILL.md`
- Style check on fallback → `../asset-style-consistency-checker/SKILL.md`
- Budget recheck → `../glb-mobile-performance-budget/SKILL.md`
- Library lookup → `../asset-library-organization-planner/SKILL.md`

## Non-goals
- Acquire the asset.
- Run Blender.
- Generate AI imagery.

## References
- `references/fallback-option-types.md`
- `references/scoring-rubric.md`
- `references/drop-with-caveat-rules.md`
- `../../docs/skill-system.md`
