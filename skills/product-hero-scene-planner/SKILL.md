---
name: product-hero-scene-planner
description: Generate a complete product-hero scene plan from non-Blender-user intent with explicit assumptions and gates.
---

# product-hero-scene-planner

## Purpose
Turn user intent or an upstream brief into a complete, plain-language product-hero scene plan (subject, composition, camera, lighting, material, environment, plus render, export, and web-handoff intent) before any runtime phase.

Canonical role: high-level `scene-planning` for single product-hero workflows in BlendOps. Keep role boundaries strict:
- `intent-to-3d-brief-writer` writes the upstream brief.
- THIS skill (`product-hero-scene-planner`) produces the complete product-hero scene plan and assumptions register.
- `blender-composition-camera-planner` deep-dives framing and lens setup.
- `blender-lighting-material-planner` deep-dives lookdev and shader/light rigs.
- `acceptance-criteria-builder` writes measurable acceptance rows.
- `blender-stop-condition-decider` pins the done condition.
- `blender-scene-quality-checker` reviews scene readiness later.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- single product-hero scene planning from user intent or an `intent-to-3d-brief-writer` brief
- pre-runtime structural planning across subject, camera, composition, lighting, material, environment, and delivery intent
- translating non-Blender product presentation goals into an assumption-tracked scene plan

## When not to use
- to execute Blender commands, write Python, or claim generated artifacts
- to skip unresolved critical ambiguity or hide missing inputs
- when raw user intent still needs initial brief normalization (use `intent-to-3d-brief-writer` first)
- when planning a multi-item catalog or grid layout (use `product-grid-scene-planner`)
- when deep-diving camera/framing mechanics (use `blender-composition-camera-planner`) or shader/lighting rigs (use `blender-lighting-material-planner`)
- when writing measurable pass/fail acceptance tables (use `acceptance-criteria-builder`), pinning stop rules (use `blender-stop-condition-decider`), or auditing a built scene (use `blender-scene-quality-checker`)

## Trigger phrases
- “plan a product hero scene”
- “turn this into a Blender plan”
- “prepare cyberpunk shoe scene plan”

## Prerequisites / readiness
- output destination clarified (web, app, game, or still/video render)
- upstream brief from `intent-to-3d-brief-writer` provided or user intent clear enough to extract constraints
- runtime readiness optionally checked via `official-runtime-readiness-checker` (does not alter this skill's truth states: Runtime stays `Not Run`, Artifacts stay `Not Produced`)
- if a live scene already exists, read-only inspection data (`get_objects_summary`) provided so real dimensions replace assumptions

## Input schema

### Required inputs
- user prompt or upstream brief (from `intent-to-3d-brief-writer`)
- output destination (web/app/game/render)

### Optional inputs
- style/mood references
- product constraints and plausible real-world object dimensions
- read-only live-scene summary (`get_objects_summary`) if an existing scene is being planned against
- performance constraints (e.g., target polycount or mobile web limits)

### Assumptions to confirm
- source model availability and scale plausibility (if `get_objects_summary` is unavailable)
- quality priority (realtime web vs marketing render)
- acceptable caveat level for deferred sections

## Output schema

### Primary output
- complete product-hero scene plan covering:
  1. Subject plan (primary product, context props, plausible real-world dimensions or `get_objects_summary` measurements)
  2. Composition plan (focal hierarchy, framing intent, negative space)
  3. Camera plan (angle, lens intent, depth-of-field strategy)
  4. Lighting plan (key/fill/rim roles, mood intent)
  5. Material plan (surface finish intent, portability caveats)
  6. Environment plan (backdrop, support surface, reflections/context)
  7. Render & export intent (format, resolution/aspect intent, engine direction)
  8. Web-handoff intent (GLB/realtime readiness notes, or explicit deferral if render-only)

### Secondary output
- assumptions register (explicitly listing every unconfirmed input or dimensional assumption)
- targeted clarification questions (when critical inputs are missing or conflicting)

### Evidence / caveat output
- explicit deferral log (every omitted or partial plan section must be marked deferred with a concrete caveat)
- fixed truth-state declaration: `Runtime: Not Run`, `Artifacts: Not Produced` (downgrade-only, never upgrade)

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Planning-only skill: no Blender execution, no Python scripts, and no artifact generation.
- Runtime truth state must remain `Not Run` (from canonical states `Not Run | Attempted | Produced | Verified | Failed`).
- Artifact truth state must remain `Not Produced` (downgrade-only, never upgrade).
- When a live scene exists, consume read-only inspection results (`get_objects_summary`) rather than assuming object dimensions, without executing scene mutations.

## Operating procedure
1. Restate user intent and desired outcome in plain, non-Blender language (or ingest the brief from `intent-to-3d-brief-writer`).
2. Identify target audience and output destination profile (web, app, game, or render).
3. Extract hard constraints (brand, style, real-world sizing, delivery platform).
4. Generate targeted clarification questions if critical data is missing.
5. Build subject plan: define primary hero object, support props, and plausible real-world dimensions (use read-only `get_objects_summary` measurements instead of assumptions whenever a live scene exists).
6. Build high-level composition plan (focal hierarchy, framing, negative space) ready for deep-dive in `blender-composition-camera-planner`.
7. Build high-level camera plan (angle, focal length intent, depth strategy) ready for deep-dive in `blender-composition-camera-planner`.
8. Build high-level lighting plan (key/fill/rim roles and mood intent) ready for deep-dive in `blender-lighting-material-planner`.
9. Build high-level material plan (surface finish intent and export portability caveats) ready for deep-dive in `blender-lighting-material-planner`.
10. Build environment plan (backdrop, ground plane, ambient context).
11. Define render/export intent and web-handoff intent (ensure every section in steps 5–11 is either present or explicitly deferred with a documented caveat).
12. Populate the assumptions register, lock truth states (`Runtime: Not Run`, `Artifacts: Not Produced`), and specify next-skill handoffs (`acceptance-criteria-builder` for measurable acceptance rows, `blender-stop-condition-decider` for done conditions, and `blender-scene-quality-checker` for post-build review).

## Decision tree
- If output destination is unknown → pause and ask for destination first, or provide explicitly caveated options.
- If a live scene exists → use read-only `get_objects_summary` data for object scale/counts instead of guessing; otherwise record plausible real-world dimensions in the assumptions register.
- If any plan section cannot be completed → mark that section explicitly deferred with a caveat (never silently omit).
- If constraints conflict (e.g., cinematic glass refractions vs strict mobile web budget) → present Option A / Option B trade-offs and route to `acceptance-criteria-builder`.
- Regardless of whether downstream runtime is ready, unknown, or blocked → keep planning-only mode with `Runtime: Not Run` and `Artifacts: Not Produced`.

## Playbooks
- Playbook A: Text-only planning path (no live scene; relies on plausible real-world sizing assumptions + full assumptions register; `Runtime: Not Run`, `Artifacts: Not Produced`).
- Playbook B: Live-scene-informed planning path (consumes read-only `get_objects_summary` to ground object dimensions; prepares handoffs to deep-dive planners; `Runtime: Not Run`, `Artifacts: Not Produced`).
- Playbook C: Blocked-downstream path (delivers complete scene plan, assumptions register, and blocker caveats while keeping `Runtime: Not Run` and `Artifacts: Not Produced`).

## Mode handling

### Text-only mode
- deliver complete scene plan and assumptions register using plausible real-world dimensions
- truth states stay `Runtime: Not Run` and `Artifacts: Not Produced`

### Runtime-ready mode
- prefer read-only `get_objects_summary` facts over dimensional assumptions if a live scene exists
- include structured handoff steps for downstream planners and checkers
- truth states stay `Runtime: Not Run` and `Artifacts: Not Produced` (no upgrade in this skill)

### Blocked runtime mode
- deliver complete scene plan, assumptions register, and blocker-aware next actions
- truth states stay `Runtime: Not Run` and `Artifacts: Not Produced`

## Validation checklist
- [ ] intent and output destination restated in plain language
- [ ] subject plan includes plausible real-world dimensions (or `get_objects_summary` data when a live scene exists)
- [ ] composition, camera, lighting, material, and environment plans are all present (or explicitly deferred with a caveat)
- [ ] render/export intent and web-handoff intent are present (or explicitly deferred with a caveat)
- [ ] assumptions register is complete and explicit
- [ ] clarification questions included for any unresolved critical inputs
- [ ] truth states explicitly set to `Runtime: Not Run` and `Artifacts: Not Produced` (no overclaims or upgrades)
- [ ] no Python code or Blender execution commands included
- [ ] role boundaries respected with explicit handoffs to `blender-composition-camera-planner`, `blender-lighting-material-planner`, `acceptance-criteria-builder`, `blender-stop-condition-decider`, and `blender-scene-quality-checker`

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Intent & sizing grounding | Intent clear; dimensions grounded via `get_objects_summary` or plausible real-world sizing | Minor non-critical ambiguity; sizing assumed with caveat | Core intent unclear or implausible/untracked object scale |
| Plan completeness | All 8 plan sections present or explicitly deferred with a caveat | Deferral caveats present but brief | Any plan section silently omitted or left vague without deferral caveat |
| Assumption transparency | Complete assumptions register + clear deferral caveats | Minor assumptions listed inline instead of register | Hidden assumptions or silent guesses |
| Evidence & role boundary | `Runtime: Not Run`, `Artifacts: Not Produced`; clean handoffs; no Python | Slightly verbose handoff boundary | Runtime/artifact state upgraded, Python included, or blurs into deep-dive/acceptance/checker roles |

## Failure handling
- Missing critical inputs: block and ask targeted questions.
- Conflicting constraints: provide prioritized options with caveats.
- Unknown runtime readiness: continue in text-only planning mode.

## Troubleshooting
- Prompt too broad or unstructured: hand off upstream to `intent-to-3d-brief-writer` before finalizing the scene plan.
- Web + cinematic conflict: flag trade-off in assumptions register and route to `cycles-vs-eevee-decision` or `glb-mobile-performance-budget`.
- No source model available: log intake risk in assumptions register and route to `blender-asset-discovery-planner` or `asset-fallback-strategy`.

## Best practices
- preserve non-Blender user language and explain visual trade-offs plainly
- keep real-world object dimensions plausible; when a live scene exists, always use read-only inspection (`get_objects_summary`) rather than assumptions
- ensure every plan section is either complete or explicitly deferred with a caveat
- keep high-level scene planning modular so downstream planners and acceptance builders can consume it cleanly

## Good examples
“Complete product-hero plan covering subject (plausible 28 cm shoe length assumed; no live scene `get_objects_summary` available), composition, camera, lighting, material, environment, and render/export/web-handoff intent, with an explicit assumptions register and truth states locked at `Runtime: Not Run` and `Artifacts: Not Produced`.”

## Bad examples
“Hero scene done.” (no structure, no caveats)

## User-facing response template
- **What you asked for:** (plain-language goal and destination)
- **Proposed product-hero scene plan:** (subject & sizing, composition, camera, lighting, material, environment, render/export intent, web-handoff intent)
- **Deferred sections & caveats:** (any section deferred and why, or "None")
- **Assumptions register:** (explicit list of unverified inputs and sizing assumptions)
- **Current status:** `Runtime: Not Run` | `Artifacts: Not Produced`
- **Next action / handoff:** (recommended next skill from catalog)

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- claiming runtime execution or upgrading truth states beyond `Runtime: Not Run` and `Artifacts: Not Produced`
- assigning `Not Run` to artifacts instead of runtime (confusing runtime and artifact truth states)
- silently omitting any plan section instead of marking it explicitly deferred with a caveat
- guessing object scale when a live scene exists and read-only `get_objects_summary` can be inspected
- blurring roles by writing deep camera/light rigs, measurable acceptance tables, or stop conditions instead of handing off
- including Python code or Blender CLI/MCP execution commands in the plan
- producing Blender-jargon-heavy output without plain-language explanation

## Cross-skill handoff
- Upstream input (if raw prompt needs structuring): `intent-to-3d-brief-writer`
- Next (deep-dive framing & camera): `blender-composition-camera-planner`
- Next (deep-dive lookdev & lighting): `blender-lighting-material-planner`
- Then (measurable pass/fail rows): `acceptance-criteria-builder`
- Then (pin done condition): `blender-stop-condition-decider`
- Later (post-build readiness review): `blender-scene-quality-checker`
- Delivery handoff (when web/render output is targeted): `glb-web-handoff` or `render-export-evidence`

## Non-goals
- executing Blender commands, MCP mutations, or CLI jobs
- writing Python scripts
- claiming `Attempted`, `Produced`, or `Verified` runtime/artifact states
- replacing `intent-to-3d-brief-writer` (upstream brief), `blender-composition-camera-planner` (deep framing), `blender-lighting-material-planner` (deep lookdev), `acceptance-criteria-builder` (measurable acceptance rows), `blender-stop-condition-decider` (done conditions), or `blender-scene-quality-checker` (readiness review)

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
