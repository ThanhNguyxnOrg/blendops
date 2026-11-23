
# blendops-glb-budget (reference for `blendops-glb-budget`)

> Detailed playbook carried over from the former `blendops-glb-budget` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

## Purpose
Translate "make it work on mobile" intent into a concrete numeric planning ceiling table (triangles, vertices, GLB file size, texture pixels, materials, draw calls, animation channels, bones, morph targets) per device tier, scene scope, and target context. Pin this budget before scene mutation so downstream scene planners consume it, `blendops-glb-budget` and `blendops-lighting-materials` validate counts and textures against it, `blendops-final-check` measures compliance, `blendops-glb-web-handoff` consumes it for web delivery, and `blendops-glb-web-handoff` owns animation contracts.

## Quick start
- pick the device tier (low-end Android, mid-mobile, high-mobile, desktop-fallback)
- read the budget row for that tier
- pin the budget into the scene plan before mutation
- treat any later violation as a blocker, not a warning

## When to use
- before scene plan is locked
- before any GLB export attempt
- when user says "for mobile" / "for the web" / "phone" / "low-end devices"
- when designing a scene that must run alongside other web content

## When not to use

## Trigger phrases

## Prerequisites / readiness
- intended device tier known (or user willing to pick one)
- expected scene scope known (single product / multi-product / environment)
- GLB target context known (hero card / e-commerce viewer / AR / configurator)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Device tier | Different tiers permit very different budgets. |
| Scene scope | Single mesh and full environment have different budget semantics. |
| Target context | AR viewer is stricter than a static hero card. |

### Optional inputs

| Input | Use |
|---|---|
| Existing competitor GLB references | Calibrates the budget against shipped peers. |
| Network constraints | 3G/4G/5G affects file-size tolerance. |
| Animation complexity | Skeletal + morph budgets differ. |

### Assumptions to confirm
- Budget is a planning ceiling, not a guaranteed runtime performance result.
- Field-of-view, post-processing, and shader complexity affect real GPU cost beyond polycount.
- Mobile GPU memory varies wildly; budgets here favor the lower end of the tier.

## Output schema

### Primary output
Numeric budget table sourced from `references/budget-tiers.md` for the chosen device tier, scene scope, and target context covering all 9 metrics: triangles, vertices, GLB file size, texture pixel budget, distinct material count, draw calls, animation channel count, bones, and morph targets.

### Secondary output
- a "violations block handoff" rule list (sourced from `references/violation-rules.md`)
- a fallback degradation plan specifying what to drop first if a violation appears (sourced from `references/degradation-plan.md`)
- explicit assumptions about device tier, network, and FOV
- a named handoff to the next skill in the workflow

### Evidence / caveat output
Because this skill produces a planning artifact before mutation or export, truth states default to `Runtime status: Not Run` and `Artifact status: Not Produced`. Truth states are downgrade-only, never upgraded without measured evidence, and never marked `Verified` by this skill.

```txt
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: none (planning ceiling only; compliance measured later by blendops-final-check, blendops-glb-budget, and blendops-lighting-materials)
Limitations: Planning ceiling only, not a runtime benchmark or compliance claim.
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`

## Official runtime boundary

BlendOps runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix** (see `../../docs/runtime-stack-strategy.md`):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server in Blender 5.1+, hosted from Anthropic Connector or any other MCP client manually).
2. **Path 2 — Community `mcp-for-blender` (formerly `blender-mcp`)** (Blender 3.0+, third-party prior art).
3. **CLI fallback (appendix)** — `blender --background --python ...`. **Documented upstream** as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md).

This skill is a **planning** skill. It sets numeric budgets but never installs Blender, runs Blender, or claims that an exported GLB satisfies the budget without measured evidence.

## Operating procedure

1. Confirm device tier with the user; default to "mid-mobile" if not stated and record the assumption.
2. Confirm scene scope and target context.
3. Look up the exact 9-metric budget row from `references/budget-tiers.md` matching the device tier, scene scope, and target context (never invent budget numbers).
4. Pin the numeric budget table into the scene plan before any mutation.
5. Attach the violation rules from `references/violation-rules.md` stating that any measured violation blocks handoff.
6. Attach the ordered degradation plan from `references/degradation-plan.md` specifying what to drop first if a ceiling is exceeded.
7. Set `Runtime status: Not Run` and `Artifact status: Not Produced`.
8. Name the explicit downstream handoff: scene planners (`blendops-product-shot`, `blendops-scene-plan`, `blendops-product-shot`) to build within the budget, `blendops-glb-web-handoff` for animation contracts, or `blendops-glb-budget` and `blendops-lighting-materials` to validate an existing scene.

## Decision tree

```txt
Tier unknown?
  → Default to "mid-mobile" + document assumption
Scene scope unknown?
  → Ask once, fall back to "single product" + document assumption
Multiple competing contexts (e.g., AR + hero card)?
  → Pick the strictest ceiling row from references/budget-tiers.md, document the override
Animation present in scope?
  → Pin animation channels, bones, and morph target ceilings from references/budget-tiers.md, then hand off animation contracts to blendops-glb-web-handoff
Existing GLB or scene exceeds budget?
  → Block handoff; apply references/degradation-plan.md and route to blendops-glb-budget and blendops-lighting-materials
```

## Playbooks

### Playbook A: Single product hero on mobile

Select the `mid-mobile` + `single product` + `hero card` (or `AR` if AR viewer is required) row from `references/budget-tiers.md`. Pin all 9 numeric ceilings (triangles, vertices, GLB file size, texture pixels, materials, draw calls, animation channels, bones, morph targets), attach `references/degradation-plan.md`, and hand off to `blendops-product-shot`.

### Playbook B: Configurator on mid-mobile

Select the `mid-mobile` + `configurator` row from `references/budget-tiers.md` to account for material variants and draw-call ceilings. Pin all 9 numeric ceilings, require `blendops-lighting-materials` and `blendops-glb-budget` validation before export, and route final delivery through `blendops-final-check` and `blendops-glb-web-handoff`.

### Playbook C: Low-end Android

Select the `low-end Android` row from `references/budget-tiers.md`. Pin strict numeric ceilings across all 9 metrics (including bone and morph target caps from the reference table), attach `references/violation-rules.md` so any overrun blocks handoff, and hand off animation constraints to `blendops-glb-web-handoff`.

## Mode handling

### Text-only mode

Produce the 9-metric budget table (from `references/budget-tiers.md`), violation rules, degradation plan, and named handoff. Pin `Runtime status: Not Run` and `Artifact status: Not Produced`. Do not claim compliance.

### Runtime-ready mode

The budget table remains a planning artifact (`Runtime status: Not Run`, `Artifact status: Not Produced` at budget-pinning time). Actual compliance is measured later by `blendops-final-check` alongside `blendops-glb-budget` and `blendops-lighting-materials` after export. Truth states are downgrade-only and never upgraded to `Verified` without measured evidence.

### Blocked runtime mode

Produce the same planning budget table, violation rules, degradation plan, and named handoff. Pin `Runtime status: Not Run` and `Artifact status: Not Produced`, and record the runtime blocker under `Limitations`.

## Validation checklist
- [ ] Device tier chosen explicitly
- [ ] Scene scope chosen explicitly
- [ ] Target context chosen explicitly
- [ ] Budget table pinned with concrete numbers (no "low" / "high" without numbers)
- [ ] Violations rule list present
- [ ] Degradation plan present
- [ ] Assumptions section present
- [ ] No "guaranteed performance" claim made
- [ ] Handoff to next skill named

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All 9 budget metrics pinned from `references/budget-tiers.md` for explicit tier, scope, and context; violation rules and degradation plan present; named handoff included; truth states set to `Runtime status: Not Run` and `Artifact status: Not Produced`; no benchmark or compliance claim. |
| Warn | Budget table present from references but tier, scope, or context assumed via fallback; degradation plan or assumptions only partially detailed. |
| Fail | Invented budget numbers; "will be fast on mobile" or compliance claim without measured evidence; missing violation rules, degradation plan, or named handoff; upgraded truth state. |

## Failure handling
- If user pushes for a "yes, it'll run on iPhone X" guarantee → restate that this skill produces a planning budget, not a benchmark.
- If competing constraints exist → pick the strictest and document the override in writing.
- If user has no device data → use mid-mobile as default and write the assumption.

## Troubleshooting

| Problem | Response |
|---|---|
| User wants a single number ("just tell me the polycount") | Give the tier-appropriate triangle cap and immediately add the texture/file-size companions. |
| Budget feels too tight | Confirm scene scope; the user may have over-stated complexity. |
| Budget feels too loose | Confirm device tier; user may have under-stated low-end mobile expectations. |

## Best practices

* Always pin all 9 budget metrics together from `references/budget-tiers.md` — polycount alone is misleading without texture pixel, draw-call, material, file-size, and animation ceilings.
* Treat every ceiling in the pinned table as a hard handoff blocker enforced downstream by `blendops-glb-budget`, `blendops-lighting-materials`, and `blendops-final-check`.
* Treat AR contexts as a distinct stricter context in `references/budget-tiers.md`, not an informal tweak.
* Keep role boundaries strict: pin numeric ceilings here, let `blendops-glb-web-handoff` own animation contracts, and let `blendops-glb-web-handoff` own web delivery packaging.

## Good examples

* "Tier: `mid-mobile` | Scope: `single product` | Context: `hero card`. All 9 numeric ceilings pinned from `references/budget-tiers.md` (triangles, vertices, GLB file size, texture pixels, materials, draw calls, animation channels, bones, morph targets). Violations block handoff per `references/violation-rules.md`. Degradation order attached from `references/degradation-plan.md`. `Runtime status: Not Run`, `Artifact status: Not Produced`. Next skill handoff: `blendops-product-shot`."

## Bad examples
- "Should be fine on mobile." — no numbers, no tier, no rules.
- "GLB will be fast." — no measurement, no caveat.

## User-facing response template

```txt
Device tier: <low-end Android / mid-mobile / high-mobile / desktop-fallback>
Scope: <single product / multi-product / environment>
Context: <hero card / e-commerce viewer / AR / configurator>
Budget (sourced from references/budget-tiers.md):
  Triangles: <N>
  Vertices: <N>
  GLB file size: <N MB>
  Texture pixel budget total: <N MP>
  Distinct materials: <N>
  Draw calls: <N>
  Animation channels: <N>
  Bones: <N>
  Morph targets: <N>
Violations block handoff: yes (enforced by blendops-glb-budget, blendops-lighting-materials, and blendops-final-check)
Degradation order if violated: <list 1-3 things to drop first from references/degradation-plan.md>
Assumptions: <device tier, network, and FOV assumptions>
Next skill handoff: <blendops-product-shot | blendops-scene-plan | blendops-scene-plan | blendops-scene-plan | blendops-product-shot | blendops-glb-budget | blendops-lighting-materials | blendops-final-check | blendops-glb-web-handoff | blendops-glb-web-handoff>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: none (planning budget only)
Limitations: Planning ceiling only; not a benchmark or compliance measurement.
```

## Anti-patterns
- Picking polycount in isolation.
- Treating the budget as a benchmark.
- Promising performance without measurement.
- Mixing tiers ("kind of mobile but desktop too").

## Cross-skill handoff

## Non-goals
- Run a real-world benchmark.
- Install Blender.
- Run Blender.
- Choose a render engine.
- Write web-side optimization code.

## References
- `references/budget-tiers.md`
- `references/violation-rules.md`
- `references/degradation-plan.md`
- `../../docs/skill-system.md`
- `../../docs/runtime-stack-strategy.md`
