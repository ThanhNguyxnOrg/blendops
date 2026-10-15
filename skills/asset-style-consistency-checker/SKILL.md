---
name: asset-style-consistency-checker
description: Verify chosen assets share visual style (realism, detail, color treatment) before scene build; flag style drift between assets early.
---

# asset-style-consistency-checker

## Purpose
Catch style mismatches between assets before they end up in the same scene where the inconsistency reads as compositing error.

## Quick start
- list every asset planned for the scene
- evaluate each on style axes (realism / detail / color / surface)
- flag drift between assets
- recommend remediation (drop / restyle / replace)

## When to use
- after `asset-license-checker` clears the assets
- before scene build
- when a scene preview shows visible style mismatch
- when assets come from multiple sources

## When not to use
- single isolated asset where no multi-asset or scene-brief consistency check is requested
- pure planning before candidate assets are picked (use `blender-asset-discovery-planner`)
- intentionally mixed-style art direction, ONLY when the locked brief explicitly specifies mixed styles
- checking asset licenses (`asset-license-checker`), polygon/performance budgets (`polycount-budget-checker`), topology, or planning materials/lighting (`blender-lighting-material-planner`)

## Trigger phrases
- "do these assets fit together"
- "style check the assets"
- "scene feels like a collage"

## Prerequisites / readiness
- candidate asset list with previews sourced via `blender-asset-discovery-planner`
- all candidate assets cleared by `asset-license-checker`
- scene brief visual style locked (via `intent-to-3d-brief-writer` if needed)
- target scene quality bar set

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Asset list with previews | Subject of the check |
| Brief style locked | Reference for consistency |

### Optional inputs

| Input | Use |
|---|---|
| Reference image / mood board | Style baseline |
| Existing scene preview | Real-world consistency check |

### Assumptions to confirm
- Brief style is unambiguous.
- Asset previews are representative of final use.

## Output schema

### Primary output
A per-asset row table containing: asset name, realism axis, detail axis, color axis, surface axis, drift verdict (`None | Minor | Major`), validation verdict (`Pass | Warn | Fail`), and remediation hint (`none | drop | restyle | replace`).

### Secondary output
- top-line scene consistency verdict (`Pass | Warn | Fail`)
- summary list of assets to drop, restyle, or replace
- downstream handoff routing
- evidence and truth-state block (kept strictly separate from `Pass | Warn | Fail` validation verdicts)

### Evidence / caveat output

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

Validation-only skill — never modifies or re-styles assets, and never executes Blender or Python. Per-asset verdicts (`Pass | Warn | Fail`) and drift classifications (`None | Minor | Major`) are derived solely from documented asset previews and the locked style brief, and are tracked separately from runtime/artifact truth states (which default to `Not Produced` for artifacts and are downgrade-only).

## Operating procedure
1. Confirm the asset list is sourced from `blender-asset-discovery-planner` and cleared by `asset-license-checker`.
2. Read the locked brief style baseline (if missing or ambiguous, hand off to `intent-to-3d-brief-writer`).
3. For each asset, evaluate all 4 style axes (`realism`, `detail`, `color`, `surface`) against the locked brief (see `references/style-axes.md`).
4. Assign a drift verdict (`None | Minor | Major`) and a validation verdict (`Pass | Warn | Fail`) per asset row.
5. Provide remediation hints only (`drop | restyle | replace`) for any asset with `Minor` or `Major` drift — never modify or re-style the asset here.
6. Route approved rows (`Pass`) to `asset-library-organization-planner` for organization and `blender-scene-quality-checker` for broad scene review; route rejected rows (`Fail`) to `asset-fallback-strategy` or back to `blender-asset-discovery-planner`.

## Decision tree

```txt
Brief explicitly locks mixed-style art direction?
  → Evaluate each asset against its assigned role in the brief; allowed contrast = None drift (Pass row)
Asset matches brief baseline across all 4 axes (realism / detail / color / surface)?
  → Drift: None | Verdict: Pass | Remediation: none
Asset off on 1 axis?
  → Drift: Minor | Verdict: Warn | Remediation: restyle or drop (verify intent)
Asset off on 2+ axes, or clashes severely with hero asset?
  → Drift: Major | Verdict: Fail | Remediation: replace or drop (hand off to asset-fallback-strategy)
Two or more assets in the same scene have Major drift between them without explicit mixed-style brief?
  → Top-line Verdict: Fail; cannot combine without breaking visual hierarchy
```

## Playbooks

### Playbook A: All-realistic product hero
All assets realistic; same detail density; PBR materials. One stylized prop → drop or restyle.

### Playbook B: Stylized character + flat background
Character is stylized; background must be equally simplified. Detailed background asset → drop.

### Playbook C: Mixed-style intentional (collage / editorial)
Brief explicitly mixed-style; verify with brief; drift becomes feature, not bug.

## Mode handling

### Text-only mode

Evaluate rows from documented previews and metadata. Set `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Runtime-ready mode

Evaluate rows using rendered scene preview snapshots alongside asset previews. Downgrade truth states if any preview is incomplete; never upgrade truth states beyond verified evidence.

### Blocked runtime mode

Skip rows that depend on a live rendered preview and mark limitations clearly. Keep `Runtime status: Not Run` (or `Failed` if attempted and blocked) and `Artifact status: Not Produced`.

## Validation checklist
- [ ] Every asset has a 4-axis row (`realism`, `detail`, `color`, `surface`) evaluated against the locked brief
- [ ] Every asset row includes both a drift verdict (`None / Minor / Major`) and a validation verdict (`Pass / Warn / Fail`)
- [ ] Top-line consistency verdict (`Pass / Warn / Fail`) is stated
- [ ] Remediation hints (`drop / restyle / replace`) are provided for any drift without modifying assets
- [ ] No license, polycount budget, or topology checks are mixed into the evaluation
- [ ] Runtime and artifact truth states (default `Not Produced`, downgrade-only) are reported separately from `Pass / Warn / Fail` verdicts

## Pass / Warn / Fail rubric

| Scope | Verdict | Criteria |
| --- | --- | --- |
| Per-asset row | Pass | Matches locked brief across all 4 axes (`realism`, `detail`, `color`, `surface`), or matches explicit mixed-style brief rule; drift is `None`. |
| Per-asset row | Warn | `Minor` drift on 1 axis against the locked brief; usable with a `restyle` or `drop` remediation hint. |
| Per-asset row | Fail | `Major` drift on 2+ axes against the locked brief; requires `replace` or `drop` via `asset-fallback-strategy`. |
| Top-line scene | Pass | All asset rows are `Pass` (or `Warn` with accepted remediation); locked brief style is respected. |
| Top-line scene | Warn | One or more assets show `Minor` drift (`Warn`), but no unresolved `Major` drift exists. |
| Top-line scene | Fail | Any asset has unresolved `Major` drift (`Fail`) or two+ assets clash, creating a visible collage error against the brief. |

Note: `Pass / Warn / Fail` validation verdicts measure style consistency only and must never be conflated with Runtime or Artifact truth states.

## Failure handling
- `Major` drift (`Fail` row) → recommend `replace` or `drop`; hand off rejected assets to `asset-fallback-strategy` or `blender-asset-discovery-planner`.
- Brief unclear or unlocked regarding visual style → stop evaluation and hand off to `intent-to-3d-brief-writer`.
- Claim that "mixed style is intentional" → accept ONLY if the locked brief explicitly specifies mixed styles; otherwise mark drift and hand off to `intent-to-3d-brief-writer` or `blender-scope-boundary-enforcer`.

## Troubleshooting

| Problem | Response |
|---|---|
| Hard to tell style from preview | Request higher-quality preview; mark asset row `Warn` with limitation noted until clarified. |
| Style is on the boundary | Lock the style axis early against the brief; do not invite repeat boundary calls. |
| User changes style mid-scene | Treat as scope creep; hand off to `blender-scope-boundary-enforcer`. |

## Best practices
- Lock style early; revisions are cheap pre-build.
- Always evaluate against the brief, not against vibe.
- Prefer 1 source for related assets to reduce drift risk.
- Keep this skill narrow — do not check license / budget / topology here.

## Good examples
- "`shoe-base.glb`: realism=realistic, detail=high, color=neutral, surface=PBR | Drift: `None` | Verdict: `Pass` | Remediation: `none`. `shoe-laces.glb`: realism=realistic, detail=high, color=neutral, surface=PBR | Drift: `None` | Verdict: `Pass` | Remediation: `none`. `shoe-environment-stylized.glb`: realism=stylized, detail=low, color=saturated, surface=flat | Drift: `Major` | Verdict: `Fail` | Remediation: `replace` via `asset-fallback-strategy`."

## Bad examples
- "Assets look like they go together." — no axis-by-axis verdict.

## User-facing response template

```txt
Brief style: <one line locked baseline>

| Asset | Realism | Detail | Color | Surface | Drift (None/Minor/Major) | Verdict (Pass/Warn/Fail) | Remediation (none/drop/restyle/replace) |
|---|---|---|---|---|---|---|---|

Top-line consistency: Pass / Warn / Fail
Assets to drop / restyle / replace: <list or "none">
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default: Not Produced)
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
Next: asset-library-organization-planner & blender-scene-quality-checker (Pass) / asset-fallback-strategy (Fail)
```

## Anti-patterns
- "Vibe match" verdicts.
- Skipping the brief reference.
- Mixing license / budget / topology checks here.
- Inventing axis values.

## Cross-skill handoff
- Upstream discovery → `../blender-asset-discovery-planner/SKILL.md` (sources the candidate asset list)
- Upstream license gate → `../asset-license-checker/SKILL.md` (must clear licenses before this skill runs)
- Upstream brief lock → `../intent-to-3d-brief-writer/SKILL.md` (locks style baseline if brief is ambiguous)
- Scope enforcement → `../blender-scope-boundary-enforcer/SKILL.md` (handles mid-scene style changes)
- Rejected asset fallback → `../asset-fallback-strategy/SKILL.md` (handles `Fail` assets needing replacement/drop)
- Approved asset organization → `../asset-library-organization-planner/SKILL.md` (organizes `Pass` assets)
- Broad scene review → `../blender-scene-quality-checker/SKILL.md` (consumes the 4-axis style rows during scene review)
- Material & lookdev boundary → `../material-quality-checker/SKILL.md` and `../blender-lighting-material-planner/SKILL.md` (handles shader quality and lookdev planning; do not perform here)
- Budget & topology boundary → `../polycount-budget-checker/SKILL.md` (handles geometry budgets; do not perform here)

## Non-goals
- Never modify or re-style assets.
- Never check asset licenses (belongs to `asset-license-checker`).
- Never check polycount budgets or mesh topology (belongs to `polycount-budget-checker`).
- Never execute Blender or Python code.

## References
- `references/style-axes.md`
- `references/drift-classification.md`
- `references/intentional-mixed-style.md`
- `../../docs/skill-system.md`
