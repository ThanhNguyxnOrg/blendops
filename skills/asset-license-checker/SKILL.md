---
name: asset-license-checker
description: Verify license compliance for downloaded 3D assets, textures, HDRIs, fonts before scene build or export.
---

# asset-license-checker

## Purpose
Catch license risk before assets go into a scene that will be rendered, exported, or shipped. This is a planning / validation skill — does not modify assets, does not consult lawyers.

## Quick start
- Receive the sourced external asset list from `blender-asset-discovery-planner` (models, textures, HDRIs, fonts, sounds, brushes).
- Record source URL, documented license name, and stated permissions per asset.
- Flag risk per asset (`Pass` / `Warn` / `Fail`) and specify required attribution lines and attribution plan.
- Gate progression: hand off to `asset-style-consistency-checker`, `asset-library-organization-planner`, or `workflow-stage-router` only if all rows are `Pass` or explicitly accepted `Warn`; route any `Fail` rows to `asset-fallback-strategy`.

## When to use
- Immediately after `blender-asset-discovery-planner` produces a candidate asset list.
- Before handing off to `asset-style-consistency-checker`, `asset-library-organization-planner`, or scene planners (`product-hero-scene-planner`, `character-portrait-scene-planner`, `environment-establishing-shot-planner`, `interior-architectural-scene-planner`, `product-grid-scene-planner`).
- Before `pre-handoff-verification`, `render-export-evidence`, `glb-web-handoff`, or `glb-animation-handoff`.
- Whenever a previously sourced asset's license or attribution requirement is unclear.

## When not to use
- Sourcing or searching for candidate assets (use `blender-asset-discovery-planner`).
- Checking visual consistency, scale, or aesthetic fit across assets (use `asset-style-consistency-checker`).
- Replacing or working around rejected/blocked assets (use `asset-fallback-strategy`).
- Structuring folders, naming conventions, or catalog storage (use `asset-library-organization-planner`).
- First-party assets authored entirely in-house with no external dependencies.
- Legal advice or binding legal interpretation (this skill flags risk only; escalate ambiguity to legal).

## Trigger phrases
- "is this license OK"
- "can I use this commercially"
- "what's the license"
- "license check"

## Prerequisites / readiness
- Sourced asset list from `blender-asset-discovery-planner` with source URLs/origins recorded.
- Intended use case stated (commercial, non-commercial, internal, or open-source).
- Target attribution plan defined (where and how attribution lines will be rendered, or whether attribution cannot be supported).

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Asset list (name + source) | Scope of check |
| Intended use case | Drives compatibility |
| Target attribution policy | Some licenses require attribution |

### Optional inputs

| Input | Use |
|---|---|
| Existing internal license whitelist | Pre-approved sources |
| Brand legal policy | Per-company override rules |

### Assumptions to confirm
- Asset license file or page is publicly readable.
- License version is current (licenses sometimes change).
- The user's intended use is accurately stated.

## Output schema

### Primary output
A per-asset row table: asset name, source URL, documented license name, attribution required (Y/N), commercial allowed (Y/N), modification allowed (Y/N), redistribution allowed (Y/N), validation verdict (`Pass` / `Warn` / `Fail`), and notes.

### Secondary output
- Required attribution lines and attribution rendering plan (where applicable).
- Blocked assets (`Fail`) routed to `asset-fallback-strategy`.
- Top-line gate status (`Pass` / `Warn` / `Fail`).

### Evidence / caveat output
Validation verdicts (`Pass` / `Warn` / `Fail`) apply per asset and are separate from runtime and artifact truth states. Truth states are downgrade-only (never upgrade), and `Artifact status` defaults to `Not Produced`:

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
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

Validation skill — does not modify assets, does not run Blender. Verdicts are based on documented license terms, not legal interpretation. **Not legal advice**: when in doubt, recommend the user consult their legal team.

## Operating procedure

1. Ingest the external asset list from `blender-asset-discovery-planner`.
2. Ensure every external asset has its own row; unknown or missing license immediately blocks use (`Fail`).
3. Look up documented license terms per `references/license-source-rules.md` (do not interpret ambiguous legal language).
4. Map documented permissions (commercial, modification, redistribution, attribution) against the stated intended use and attribution plan.
5. Assign a per-asset validation verdict (`Pass` / `Warn` / `Fail`) separate from runtime/artifact truth states.
6. Compile exact attribution lines and verify an attribution plan exists wherever attribution is required.
7. Route any `Fail` assets to `asset-fallback-strategy` (or back to `blender-asset-discovery-planner` for re-sourcing).
8. Gate downstream progression: proceed to `asset-style-consistency-checker`, `asset-library-organization-planner`, or `workflow-stage-router` only if all rows are `Pass` or explicitly accepted `Warn`.

## Decision tree

```txt
License unknown, missing, or unverified source?
  → Fail (blocks use until source and license are confirmed)
"CC0 / public domain" with documented dedication?
  → Pass for the stated use (still record attribution plan as N/A)
Documented terms forbid intended use (e.g., non-commercial-only license for a commercial project, or no modification/redistribution when required)?
  → Fail (route asset to asset-fallback-strategy)
Attribution required by license, but no attribution plan exists?
  → Fail (blocks use until attribution plan is confirmed)
Documented terms permit intended use, but contain ambiguity?
  → Warn (escalate ambiguity to legal; requires explicit user/legal acceptance to proceed)
```

## Playbooks

### Playbook A: Commercial delivery

Require explicit documented commercial permission for every asset row. If attribution is required, verify the attribution plan is approved before gating; otherwise mark `Fail` and route to `asset-fallback-strategy`. Escalate any custom or ambiguous terms to legal.

### Playbook B: Internal / non-commercial review

Verify documented terms cover internal or non-commercial use. Track all required attribution lines so internal prototypes cannot advance to commercial handoff (`pre-handoff-verification`) without re-running `asset-license-checker`.

### Playbook C: Redistributed or shared package

Verify documented redistribution and modification permissions for every external asset row, ensure package-level attribution lines are included in the attribution plan, and escalate cross-license compatibility questions to legal.

## Mode handling

### Text-only mode
Evaluate license rows strictly from the provided asset specification and documented source text. No Python and no Blender execution. Set `Runtime status: Not Run` and `Artifact status: Not Produced` (downgrade-only, never upgrade).

### Runtime-ready mode
Evaluate license rows against user-supplied license files or manifest records. Maintain `Runtime status: Not Run` (this skill never runs Blender) and downgrade truth states if any expected documentation artifact is missing.

### Blocked runtime mode
If source URLs or license files are unreadable or missing, assign per-asset verdict `Fail` (unknown license blocks use), keep `Artifact status: Not Produced`, and route blocked assets to `asset-fallback-strategy`.

## Validation checklist
- [ ] Every external asset has a dedicated row in the table.
- [ ] Source URL and documented license name are recorded per row (unknown license marked `Fail`).
- [ ] Permissions per row recorded (`commercial` / `modification` / `redistribution` / `attribution`).
- [ ] Per-asset validation verdict (`Pass` / `Warn` / `Fail`) assigned separately from truth states.
- [ ] Required attribution lines and attribution plan recorded where applicable.
- [ ] Runtime and artifact truth states included (`Artifact status` defaults to `Not Produced`; downgrade-only).
- [ ] Scene gate enforced: downstream handoff allowed only on all-`Pass` or explicitly accepted `Warn`; `Fail` rows routed to `asset-fallback-strategy`.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
| --- | --- |
| Pass | License is explicitly documented, permissions match intended use, and required attribution is covered by a concrete attribution plan. |
| Warn | Documented permissions appear compatible, but terms contain ambiguity requiring legal review or the attribution plan needs explicit user confirmation. |
| Fail | License is unknown/missing, documented terms forbid intended use, attribution is required without an attribution plan, or rights are reserved without explicit permission. |

## Failure handling
- Unknown or missing license → assign `Fail` and block asset use immediately.
- Attribution required without a rendering plan → assign `Fail` and block until an attribution plan is established.
- Vague or unverified assurance ("probably fine") → never assign `Pass`; mark `Warn` (if documented terms exist but need legal review) or `Fail` (if undocumented), and escalate ambiguity to legal.
- Any `Fail` verdict → block downstream scene progression and hand off rejected assets to `asset-fallback-strategy` or `blender-asset-discovery-planner`.
- Truth states → downgrade-only; never upgrade `Runtime status` or `Artifact status`.

## Troubleshooting

| Problem | Response |
|---|---|
| License page unreachable / missing | Assign `Fail` (unknown license blocks use); route to `asset-fallback-strategy` or `blender-asset-discovery-planner`. |
| License terms changed since download | Flag as `Warn` or `Fail` depending on whether dated proof of prior terms exists; do not assume grandfathering — escalate to legal. |
| Mixed-license asset bundle | Split bundle so every individual external sub-asset gets its own row and verdict. |
| AI-generated external asset | Treat as unknown/ambiguous unless platform terms are explicitly documented for the intended use; escalate ambiguity to legal. |

## Best practices
- Record license at acquisition time, not at build time.
- Maintain an internal whitelist for repeat sources.
- Never ship without verifying every external asset's license.
- "Not legal advice" — escalate ambiguity to legal.

## Good examples
- "Asset: `studio_hdri.exr`, source: documented vendor URL, license: explicitly documented public-domain/permissive terms, commercial: Y, mod: Y, redist: Y, attribution: N. Verdict: `Pass`."
- "Asset: `hero_chair.glb`, source: documented marketplace URL, license: attribution-required license, commercial: Y, attribution plan: credits screen line recorded. Verdict: `Pass`."

## Bad examples
- "Asset is from internet." — no source, no license.

## User-facing response template

```txt
Intended use: <commercial / non-commercial / internal / open-source>
Attribution plan: <where attribution will render or "none">

| Asset | Source | License | Comm | Mod | Redist | Attribution | Verdict | Notes |
|---|---|---|---|---|---|---|---|---|

Required attribution lines:
  - <line 1 or "none">

Assets blocked (Fail — route to asset-fallback-strategy): <list or "none">
Top-line gate verdict: <Pass / Warn / Fail>
Note: Not legal advice; escalate any license ambiguity to your legal team.

Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default: Not Produced)
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: <if all Pass or explicitly accepted Warn: asset-style-consistency-checker / asset-library-organization-planner / workflow-stage-router | if any Fail: asset-fallback-strategy / blender-asset-discovery-planner>
```

## Anti-patterns
- "Should be fine" verdicts.
- Skipping the attribution plan.
- Treating "all rights reserved" assets as usable.
- Inventing license terms.

## Cross-skill handoff
- Upstream asset sourcing → `../blender-asset-discovery-planner/SKILL.md` (provides the external asset list to check).
- Visual style validation → `../asset-style-consistency-checker/SKILL.md` (checks visual style after license gate passes).
- Rejected/blocked asset handling → `../asset-fallback-strategy/SKILL.md` (handles assets flagged `Fail`).
- Asset library organization → `../asset-library-organization-planner/SKILL.md` (organizes approved assets).
- Stage routing & scene planning gate → `../workflow-stage-router/SKILL.md` (proceeds to scene planners only when all assets are `Pass` or explicitly accepted `Warn`).

## Non-goals
- Give legal advice or interpret complex contracts (escalate ambiguity to legal).
- Source or discover candidate assets (`blender-asset-discovery-planner`).
- Check visual style or aesthetic consistency (`asset-style-consistency-checker`).
- Plan fallbacks or replacements for failed assets (`asset-fallback-strategy`).
- Organize asset libraries or folder structures (`asset-library-organization-planner`).
- Modify asset files, write Python, or run Blender.

## References
- `references/common-license-mapping.md`
- `references/license-source-rules.md`
- `references/attribution-rendering-patterns.md`
- `../../docs/skill-system.md`
