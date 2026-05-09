---
name: glb-mobile-performance-budget
description: Set explicit triangle / texture / draw-call / file-size / animation budgets for GLB targeted at mobile-web before any export decision.
---

# glb-mobile-performance-budget

## Purpose
Translate "make it work on mobile" intent into a concrete numeric budget table that downstream skills (scene planner, quality checker, render-export-evidence, glb-web-handoff) can validate against.

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
- desktop-only renders without web handoff
- offline pre-rendered video (no real-time budget needed)
- replacing engineering load testing (this skill sets a planning budget, not a real-world benchmark)

## Trigger phrases
- "what's a good polycount for mobile"
- "how big can the GLB be"
- "will this load on iPhone"
- "what should I aim for on a phone"

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
Numeric budget table for the chosen tier covering: triangles, vertices, GLB file size, texture pixel budget, distinct material count, draw calls, animation channel count, bones, morph targets.

### Secondary output
- a "violations would block handoff" rule list
- a fallback degradation plan (what to drop first if a violation appears)
- explicit assumptions about device tier, network, and FOV

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

## Official runtime boundary

BlendOps runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix** (see `../../docs/runtime-stack-strategy.md`):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server in Blender 5.1+, hosted from Anthropic Connector or any other MCP client manually).
2. **Path 2 — Community `ahujasid/blender-mcp`** (Blender 3.0+, third-party prior art).
3. **CLI fallback (appendix)** — `blender --background --python ...`. **Documented upstream** as a first-class Blender CLI surface; no in-repo evidence file yet.

This skill is a **planning** skill. It sets numeric budgets but never installs Blender, runs Blender, or claims that an exported GLB satisfies the budget without measured evidence.

## Operating procedure
1. Confirm device tier with the user; default to "mid-mobile" if not stated.
2. Confirm scene scope and target context.
3. Look up the budget row from the references budget tables.
4. Adjust ±10% if user constraints justify it; record adjustments.
5. Pin the budget table into the scene plan output.
6. List violations that would block GLB handoff if measured later.
7. Provide a degradation plan (what to drop first).
8. Hand off to the scene planner or quality checker with the pinned budget.

## Decision tree

```txt
Tier unknown?
  → Default to "mid-mobile" + warn
Scene scope unknown?
  → Ask once, fall back to "single product"
Multiple competing budgets (AR + hero card)?
  → Pick the strictest, document the override
Existing GLB exceeds budget?
  → Hand off to quality checker for what to drop
```

## Playbooks

### Playbook A: Single product hero on mobile
Use mid-mobile baseline. Lock GLB ≤ 4 MB compressed (Draco), ≤ 50K triangles, ≤ 4 textures @ 1K. AR add-on: drop to 25K tris and 2K textures.

### Playbook B: Configurator on mid-mobile
Allow 80K triangles (more material variants), but cap GLB at 6 MB and limit draw calls to ≤ 30.

### Playbook C: Low-end Android
Hard cap: 25K triangles, 2 MB GLB, 2 textures @ 512 px, no morph targets, ≤ 1 skinned mesh.

## Mode handling

### Text-only mode
Produce the budget table and rules. Do not claim compliance.

### Runtime-ready mode
The budget table is still the planning artifact; compliance is measured by render-export-evidence + quality-checker after a real export. Never upgrade to "Verified" without measured evidence.

### Blocked runtime mode
Same budget output; mark compliance unknown.

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
| Pass | Budget table has concrete numbers for tier, scope, and context; degradation plan present; no compliance claim. |
| Warn | Budget present but tier/scope ambiguous; degradation plan partial. |
| Fail | "Will be fast on mobile" claim without numeric budget; missing degradation plan; treating budget as a measured result. |

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
- Always pair triangle budget with texture and file-size budgets — one alone is misleading.
- Reserve 20% headroom against the hard cap for runtime overhead.
- Prefer Draco-compressed GLB file size in budgets unless explicitly excluded.
- Treat AR contexts as a separate stricter tier, not "mobile but a bit smaller".

## Good examples
- "Mid-mobile, single product hero, web hero card. Budget: ≤ 50K tri / ≤ 4 MB GLB (Draco) / ≤ 4 textures @ 1024 / ≤ 8 draw calls. Compliance: Not Run."

## Bad examples
- "Should be fine on mobile." — no numbers, no tier, no rules.
- "GLB will be fast." — no measurement, no caveat.

## User-facing response template

```txt
Device tier: <low-end Android / mid-mobile / high-mobile / desktop fallback>
Scope: <single product / multi-product / environment>
Context: <hero card / e-commerce viewer / AR / configurator>
Budget:
  Triangles: <N>
  Vertices: <N>
  GLB file size (Draco): <N MB>
  Texture pixel budget total: <N MP>
  Distinct materials: <N>
  Draw calls: <N>
  Animation channels: <N>
  Bones: <N>
  Morph targets: <N>
Violations would block handoff: yes / no
Degradation order if violated: <list 1-3 things to drop first>
Compliance: Not Run (planning budget only)
```

## Anti-patterns
- Picking polycount in isolation.
- Treating the budget as a benchmark.
- Promising performance without measurement.
- Mixing tiers ("kind of mobile but desktop too").

## Cross-skill handoff
- Scene planning → `../product-hero-scene-planner/SKILL.md`, `../blender-composition-camera-planner/SKILL.md`, `../blender-lighting-material-planner/SKILL.md`
- Quality validation → `../blender-scene-quality-checker/SKILL.md`
- Render/export evidence → `../render-export-evidence/SKILL.md`
- GLB handoff → `../glb-web-handoff/SKILL.md`
- Animation budget specific → `../glb-animation-handoff/SKILL.md`

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
