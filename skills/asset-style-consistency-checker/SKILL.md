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
- single asset (no consistency check needed)
- pure planning before assets are picked
- intentionally mixed-style art direction (verify with brief)

## Trigger phrases
- "do these assets fit together"
- "style check the assets"
- "scene feels like a collage"

## Prerequisites / readiness
- asset list with previews known
- scene brief style locked
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
A per-asset row table: name, realism axis, detail axis, color axis, surface axis, drift verdict (None / Minor / Major), remediation note.

### Secondary output
- top-line consistency verdict
- assets to drop / restyle / replace
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

Validation skill — does not modify assets. Verdicts are based on documented previews + style brief.

## Operating procedure
1. Read asset list and previews.
2. Read brief style.
3. For each asset, evaluate on 4 style axes (see `references/style-axes.md`).
4. Compare against brief baseline; flag drift.
5. List remediation options.
6. Hand off to scene build (Pass) or `asset-fallback-strategy` (Fail).

## Decision tree

```txt
Asset matches all 4 axes?
  → Pass row
Asset off on 1 axis?
  → Minor drift; verify intent
Asset off on 2+ axes?
  → Major drift; recommend replace
Two assets in same scene with major drift between them?
  → Fail; cannot mix without breaking visual hierarchy
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
Verdicts based on documented previews.

### Runtime-ready mode
Verdicts based on actual scene preview snapshot.

### Blocked runtime mode
Skip rows that depend on rendered preview; mark as such.

## Validation checklist
- [ ] Every asset has 4-axis row
- [ ] Brief baseline cited
- [ ] Drift verdict per row
- [ ] Top-line consistency verdict
- [ ] Remediation for any drift
- [ ] Honest evidence label

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All assets within consistency tolerance; brief style respected. |
| Warn | One asset minor drift; remediation noted. |
| Fail | Two+ assets major drift; brief style not respected; collage-error visible. |

## Failure handling
- Major drift → recommend asset replacement; hand off to discovery.
- Brief unclear about style → hand off to brief writer.
- "Mixed style is intentional" → verify with user before accepting.

## Troubleshooting

| Problem | Response |
|---|---|
| Hard to tell style from preview | Need higher-quality reference; mark Warn until clarified. |
| Style is on the boundary | Lock the style axis early; do not invite repeat boundary calls. |
| User changes style mid-scene | Treat as scope creep; hand off to scope enforcer. |

## Best practices
- Lock style early; revisions are cheap pre-build.
- Always evaluate against the brief, not against vibe.
- Prefer 1 source for related assets to reduce drift risk.
- Keep this skill narrow — do not check license / budget / topology here.

## Good examples
- "shoe-base.glb: realistic, high-detail, neutral color, PBR. shoe-laces.glb: realistic, high-detail, neutral, PBR. shoe-environment-stylized.glb: stylized, low-detail, saturated, flat. Drift: Major. Remediation: replace stylized environment."

## Bad examples
- "Assets look like they go together." — no axis-by-axis verdict.

## User-facing response template

```txt
Brief style: <one line>

| Asset | Realism | Detail | Color | Surface | Drift | Remediation |
|---|---|---|---|---|---|---|

Top-line consistency: Pass / Warn / Fail
Assets to drop / restyle / replace: <list>
Limitations: <gaps>
Next: scene build (Pass) / asset-fallback-strategy (Fail)
```

## Anti-patterns
- "Vibe match" verdicts.
- Skipping the brief reference.
- Mixing license / budget / topology checks here.
- Inventing axis values.

## Cross-skill handoff
- License → `../asset-license-checker/SKILL.md`
- Discovery → `../blender-asset-discovery-planner/SKILL.md`
- Fallback → `../asset-fallback-strategy/SKILL.md`
- Library → `../asset-library-organization-planner/SKILL.md`
- Material check → `../material-quality-checker/SKILL.md`

## Non-goals
- Modify assets.
- Re-style assets.
- Run Blender.

## References
- `references/style-axes.md`
- `references/drift-classification.md`
- `references/intentional-mixed-style.md`
- `../../docs/skill-system.md`
