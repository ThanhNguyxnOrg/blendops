---
name: asset-fallback-strategy
description: Provide a fallback strategy when an asset is unavailable, over-budget, license-blocked, or style-incompatible — without halting the recipe.
---

# asset-fallback-strategy

## Purpose
When `asset-license-checker`, `asset-style-consistency-checker`, or `glb-mobile-performance-budget` blocks an asset (or an asset is unavailable), this skill plans 2-3 actionable fallback options (replace / re-source / procedural / generative / drop-with-caveat) ordered by speed so the recipe can proceed. Any chosen replacement must re-pass `asset-license-checker` and `asset-style-consistency-checker` (plus `glb-mobile-performance-budget` when budget applies).

## Quick start
- read the failed asset + blocking reason
- propose 2-3 fallback options ordered by speed-to-implement (always including `drop-with-caveat`)
- score each option on time, brief-match, and license
- pick one only with explicit user agreement
- update the asset list and route any replacement back through `asset-license-checker` and `asset-style-consistency-checker` (and `glb-mobile-performance-budget` if budget-constrained)

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
A fallback option table: option (`replace` / `re-source` / `procedural` / `generative` / `drop-with-caveat`), source / method, time-to-implement, brief-match, license, and recommendation.

### Secondary output
- updated asset list reflecting the user-approved fallback
- mandatory re-check routing for replacements (`asset-license-checker`, `asset-style-consistency-checker`, and `glb-mobile-performance-budget`)
- caveat lines if `drop-with-caveat` is chosen
- evidence label

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default: Not Produced)
Rule: downgrade-only, never upgrade
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Process and planning skill only — never acquires, generates, or edits assets itself. Outputs a fallback plan and routes execution or re-verification to dedicated skills.

## Operating procedure

1. Read failed asset + blocking reason.
2. Read brief style + budget context.
3. Propose 2-3 fallback options ordered by speed-to-implement (see `references/fallback-option-types.md`), always including `drop-with-caveat`.
4. Score each option on time, brief-match, and license.
5. Recommend one option and pause for explicit user agreement.
6. Once agreed, update the asset list and route the replacement back into the check chain (`asset-license-checker`, `asset-style-consistency-checker`, and `glb-mobile-performance-budget`), or escalate to `blender-scope-boundary-enforcer` / `blender-recipe-decomposer` if no viable fallback exists.

## Decision tree

```txt
Failed by license?
  → (1) Replace from internal library (`asset-library-organization-planner`)
  → (2) Re-source compliant alternative (`blender-asset-discovery-planner`)
  → (3) Drop with caveat
Failed by budget (size/poly)?
  → (1) Replace with lighter stand-in from internal library (`asset-library-organization-planner`)
  → (2) Plan procedural / generative alternative
  → (3) Drop with caveat
Failed by style?
  → (1) Re-source style-aligned alternative (`blender-asset-discovery-planner`)
  → (2) Plan procedural / generative alternative matching brief
  → (3) Drop with caveat
Failed by unavailability?
  → (1) Replace from internal library (`asset-library-organization-planner`)
  → (2) Plan procedural / generative alternative
  → (3) Drop with caveat
```

## Playbooks

### Playbook A: Hero shoe model unavailable

Options (ordered by speed): (1) Replace with stand-in mesh from internal library via `asset-library-organization-planner` (fastest, lower brief-match). (2) Plan a procedural or generative alternative (medium speed, medium brief-match). (3) Drop with caveat: omit the hero shoe and adjust deliverables (fastest fallback exit, requires caveat note). Any replacement must re-pass `asset-license-checker` and `asset-style-consistency-checker`.

### Playbook B: HDRI blocked by license

Options (ordered by speed): (1) Drop with caveat: omit HDRI and rely on planned scene lighting (caveat: ambient reflection changes). (2) Re-source a license-clear HDRI via `blender-asset-discovery-planner` (fast, high brief-match). (3) Plan a procedural sky alternative (medium speed, medium brief-match). Any replacement must re-pass `asset-license-checker` and `asset-style-consistency-checker`.

### Playbook C: Texture over-budget

Options (ordered by speed): (1) Drop with caveat: omit high-cost texture variation and use a simpler material plan (caveat: reduced surface detail). (2) Replace with a lighter asset from the internal library via `asset-library-organization-planner` (fast, medium brief-match). (3) Re-source a budget-compliant texture via `blender-asset-discovery-planner` (medium speed, high brief-match). Any replacement must re-pass `asset-license-checker`, `asset-style-consistency-checker`, and `glb-mobile-performance-budget`.

## Mode handling

### Text-only mode

Output the fallback strategy table and wait for user agreement.

### Runtime-ready mode

After user agreement on a fallback, hand off to `blender-asset-discovery-planner` (re-source) or `asset-library-organization-planner` (internal library), then require re-verification through `asset-license-checker`, `asset-style-consistency-checker`, and `glb-mobile-performance-budget`.

### Blocked runtime mode

Strategy is recorded as a forward-plan; no immediate handoff execution.

## Validation checklist

* [ ] Failed asset + blocking reason explicitly stated
* [ ] 2-3 options ordered by speed, scored on time, brief-match, and license
* [ ] `drop-with-caveat` option included
* [ ] Recommendation explicit and user agreement required before proceeding
* [ ] Updated asset list reflected after agreement
* [ ] Picked replacement routed back to `asset-license-checker` and `asset-style-consistency-checker` (plus `glb-mobile-performance-budget` when applicable)
* [ ] Caveat lines documented if `drop-with-caveat` is chosen

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | 2-3 speed-ordered options (including `drop-with-caveat`) scored on time/brief-match/license + explicit recommendation + user agreement + updated list + re-check routing to `asset-license-checker` and `asset-style-consistency-checker`. |
| Warn | Options and `drop-with-caveat` present, but recommendation or re-check routing note is soft. |
| Fail | Missing `drop-with-caveat`; silent substitution without user agreement; skips replacement re-checks; or attempts to acquire, generate, or edit assets directly. |

## Failure handling

* No viable fallback exists → hand off to `blender-scope-boundary-enforcer` for scope reduction or `blender-recipe-decomposer` to split the recipe.
* Picked replacement fails `asset-license-checker`, `asset-style-consistency-checker`, or `glb-mobile-performance-budget` → repeat the fallback planning cycle or escalate to scope reduction.
* User refuses all options → document refusal and flag as recipe-blocker.

## Troubleshooting

| Problem | Response |
| --- | --- |
| Fallback doesn't match brief | Propose scope reduction via `blender-scope-boundary-enforcer` or select another fallback; do not silently lower quality. |
| Procedural option requires unavailable capability | Cross out procedural option; rely on `replace`, `re-source`, or `drop-with-caveat`. |
| Replacement or generative candidate has unclear license or style fit | Route through `asset-license-checker` and `asset-style-consistency-checker` before accepting into the recipe. |

## Best practices
- Always offer at least 2 options.
- Always show a "drop with caveat" option (even if last choice).
- Time-to-implement is decisive; brief match is necessary; license confidence is non-negotiable.
- Keep this skill narrow.

## Good examples

* "Failed: `hero-shoe-mesh.glb` (blocked by `asset-license-checker`). Options (ordered by speed): (1) Drop with caveat — omit hero shoe mesh and note missing centerpiece (time: immediate, brief-match: low, license: clear). (2) Replace from internal library via `asset-library-organization-planner` — generic shoe stand-in (time: fast, brief-match: medium, license: pre-cleared). (3) Re-source compliant commercial mesh via `blender-asset-discovery-planner` (time: slower, brief-match: high, license: requires verification). Recommended: (3) for brief fidelity. User agreement required; once picked, replacement must re-pass `asset-license-checker` and `asset-style-consistency-checker`."

## Bad examples
- "We'll figure it out." — no options listed.

## User-facing response template

```txt
Failed asset: <name>
Reason: <license / budget / style / unavailable>

| Option | Type (replace / re-source / procedural / generative / drop-with-caveat) | Source / method | Time | Brief-match | License | Recommendation |
|---|---|---|---|---|---|---|

Recommendation: <option>
Decision needed: User agreement required before continuing.
Caveat lines (if drop-with-caveat): <list>
Updated asset list: <link or note>
Next re-checks (if replacement picked): asset-license-checker, asset-style-consistency-checker, glb-mobile-performance-budget (if budget applies)
Escalation (if no viable fallback): blender-scope-boundary-enforcer or blender-recipe-decomposer
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default: Not Produced; downgrade-only)
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Anti-patterns

* Dropping an asset without an explicit caveat ("just drop it").
* Omitting `drop-with-caveat` from the proposed option set.
* Silently substituting an asset without user agreement.
* Inventing fallback sources or acquiring, generating, or editing assets directly.
* Skipping `asset-license-checker`, `asset-style-consistency-checker`, or `glb-mobile-performance-budget` on the chosen replacement.

## Cross-skill handoff

* Re-source external asset → `../blender-asset-discovery-planner/SKILL.md`
* Internal library lookup → `../asset-library-organization-planner/SKILL.md`
* License re-check on replacement → `../asset-license-checker/SKILL.md`
* Style re-check on replacement → `../asset-style-consistency-checker/SKILL.md`
* Budget re-check on replacement → `../glb-mobile-performance-budget/SKILL.md`
* Scope reduction when no viable fallback exists → `../blender-scope-boundary-enforcer/SKILL.md`
* Recipe split when no viable fallback exists → `../blender-recipe-decomposer/SKILL.md`

## Non-goals

* Acquire, generate, or edit assets itself.
* Run Blender or execute Python.
* Perform license, style, or performance budget checks itself.

## References
- `references/fallback-option-types.md`
- `references/scoring-rubric.md`
- `references/drop-with-caveat-rules.md`
- `../../docs/skill-system.md`
