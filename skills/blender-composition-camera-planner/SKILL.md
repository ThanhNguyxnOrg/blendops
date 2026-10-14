---
name: blender-composition-camera-planner
description: Provide detailed composition and camera planning for product hero outputs.
---

# blender-composition-camera-planner

## Purpose
Design high-quality composition/camera strategy for product hero scenes in plain, actionable language.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- expanding an upstream scene brief from `product-hero-scene-planner` into detailed framing and camera direction
- defining focal hierarchy, viewer attention path, camera angle, focal length mood, and depth layering before lookdev
- aligning hero framing and negative space with web/UI copy overlays

## When not to use
- as proof of rendered output quality or to validate an existing framing (use `composition-quality-checker`)
- to design lighting rigs or surface materials/lookdev (use `blender-lighting-material-planner`)
- to lock final pixel resolution or output aspect specs (use `resolution-aspect-decision`)
- to choose delivery file formats (use `output-format-decision`)
- when subject intent is undefined

## Trigger phrases
- “improve composition and camera”
- “choose hero framing”
- “set camera strategy for product hero”

## Prerequisites / readiness
- upstream scene concept from `product-hero-scene-planner` (or clear subject and destination context) available
- planning-only boundary accepted: runtime status remains `Not Run` and artifacts remain `Not Produced`

## Input schema

### Required inputs
- subject intent (from `product-hero-scene-planner` or user brief)
- target output context (web/app/game/render)

### Optional inputs
- target aspect ratio constraints (from `resolution-aspect-decision` if already locked)
- UI/copy overlay constraints
- cinematic vs neutral tone preference

### Assumptions to confirm
- need for negative space
- focal detail priority
- camera motion vs static hero shot intent

## Output schema

### Primary output
- composition-camera plan with plain-language rationale

### Secondary output
- fallback framing variant for uncertain constraints

### Evidence / caveat output
- unresolved visual assumptions
- explicit truth states: Runtime `Not Run`, Artifacts `Not Produced` (downgrade-only, never upgrade)

## Required laws
- ../../laws/non-blender-user-language.md
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Planning-only skill: no Blender execution, no Python scripts, and no artifact generation. Runtime status stays `Not Run` and artifacts stay `Not Produced` (truth states are downgrade-only, never upgraded without verified evidence).

## Operating procedure
1. Define focal hierarchy (primary/secondary/background).
2. Define hero-section objective and viewer attention path.
3. Select aspect ratio framing strategy (deferring final resolution/aspect locks to `resolution-aspect-decision`).
4. Reserve negative space for UI/text overlays if needed.
5. Choose camera angle preset family.
6. Set focal length guidance by mood (dramatic vs neutral).
7. Define depth layering (foreground/midground/background).
8. Define target silhouette/readability checks (for later validation by `composition-quality-checker`).
9. Produce fallback framing variant for uncertainty.
10. Translate plan into plain-language rationale.

## Decision tree
- If copy overlay required → prioritize negative space and silhouette.
- If product detail priority high → tighter framing and controlled depth.
- If uncertainty high → provide two options and ask preference.

## Playbooks
- Playbook A: Full brief path — expand upstream `product-hero-scene-planner` output into primary framing + fallback variant (`Runtime: Not Run`, `Artifacts: Not Produced`).
- Playbook B: Overlay-heavy path — prioritize negative space and silhouette separation for UI/copy constraints (`Runtime: Not Run`, `Artifacts: Not Produced`).
- Playbook C: High-uncertainty path — provide two distinct framing variants with trade-off rationale and explicit caveats (`Runtime: Not Run`, `Artifacts: Not Produced`).

## Mode handling

### Text-only mode
- provide primary composition/camera plan and fallback variant in plain language
- report `Runtime: Not Run` and `Artifacts: Not Produced`

### Runtime-ready mode
- provide the composition/camera plan plus explicit target criteria for `composition-quality-checker` to validate once a scene exists
- keep `Runtime: Not Run` and `Artifacts: Not Produced` during planning

### Blocked runtime mode
- deliver full composition/camera plan and fallback variant with explicit caveats
- keep `Runtime: Not Run` and `Artifacts: Not Produced`; make no visual success claims

## Validation checklist
- [ ] focal hierarchy explicit
- [ ] hero framing objective and attention path explicit
- [ ] aspect ratio framing strategy documented (without overriding `resolution-aspect-decision`)
- [ ] negative space policy documented
- [ ] camera angle preset rationale documented
- [ ] focal length guidance by mood documented
- [ ] depth layering (foreground/midground/background) documented
- [ ] target silhouette/readability checks documented for `composition-quality-checker`
- [ ] fallback framing variant documented
- [ ] plain-language rationale included throughout
- [ ] truth states explicitly set to `Runtime: Not Run` and `Artifacts: Not Produced`

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Focal hierarchy | Clear primary/secondary/background priority | Partial hierarchy | Missing hierarchy |
| Framing strategy | Matches output context and includes fallback variant | Generic framing or weak fallback | Mismatched framing or missing fallback |
| Camera rationale | Specific plain-language angle, focal-length mood, and depth layering | Vague rationale or unexplained jargon | No rationale or includes Python/execution commands |
| Role & truth boundary | Stays in planning; reports `Runtime: Not Run` and `Artifacts: Not Produced` | Mild boundary overlap with lookdev/validation | Claims verified framing quality or upgrades truth states |

## Failure handling
- Conflicting goals: provide trade-off options.
- Missing constraints: ask targeted follow-up.
- Unknown destination: use conservative web-hero defaults + caveat.

## Troubleshooting
- Subject lost in frame: tighten framing focus, adjust camera angle preset, or increase spatial separation between foreground, midground, and background layers.
- No room for copy: widen negative space allowance and shift primary focal placement off-center.
- Flat spatial staging: adjust camera angle and focal-length perspective or increase depth-layer spacing (route lighting/material contrast issues to `blender-lighting-material-planner`).
- Existing scene framing needs pass/fail grading: hand off to `composition-quality-checker`.

## Best practices
- optimize for clarity before stylization
- tie each camera choice to user outcome
- preserve fallback path for uncertain constraints

## Good examples
“Primary subject occupies center-right with left negative space for hero copy; camera 3/4 angle chosen for silhouette and depth readability.”

## Bad examples
“Use cinematic camera.” (no context, no criteria)

## User-facing response template
- Composition summary (focal hierarchy, attention path, negative space, depth layering, silhouette checks)
- Camera strategy summary (aspect strategy, angle preset, focal length by mood)
- Fallback framing variant
- Why this helps your goal (plain-language rationale)
- Truth states (`Runtime: Not Run`, `Artifacts: Not Produced`) and unverified assumptions
- Recommended next skill handoff

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- claiming runtime or artifact states above `Not Run` / `Not Produced` (violating downgrade-only truth rules)
- writing Python code or Blender camera execution commands
- designing lighting rigs or material lookdev instead of handing off to `blender-lighting-material-planner`
- validating rendered/viewport composition instead of handing off to `composition-quality-checker`
- locking final export resolution/aspect (`resolution-aspect-decision`) or file formats (`output-format-decision`)
- producing jargon-heavy camera specs without plain-language rationale

## Cross-skill handoff
- Upstream input from: `product-hero-scene-planner`
- Lateral output specs (if needed): `resolution-aspect-decision` (aspect/resolution locks), `output-format-decision` (file formats)
- Next (lookdev & lighting): `blender-lighting-material-planner`
- Then (validation): `composition-quality-checker` and `blender-scene-quality-checker`

## Non-goals
- executing Blender commands, writing Python scripts, or generating scene/render artifacts
- designing lighting setups or materials (owned by `blender-lighting-material-planner`)
- validating or scoring completed scene framing (owned by `composition-quality-checker`)
- locking output resolution/aspect standards (owned by `resolution-aspect-decision`) or file formats (owned by `output-format-decision`)

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
