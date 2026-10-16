---
name: glb-web-handoff
description: Prepare truthful GLB/web handoff output with explicit artifact status, assumptions, and caveats.
---

# glb-web-handoff

## Purpose
Define reliable handoff language and checks for GLB/web scenarios without overclaiming.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- when writing the GLB/web handoff summary after upstream validation from `blender-scene-quality-checker` and evidence classification from `render-export-evidence`
- when summarizing per-artifact export statuses and web compatibility assumptions/caveats (transform/scale/origin, material/texture portability, loader/extensions, stack, performance)
- when preparing truthful next checks before passing final wording to `non-blender-user-response-writer`

## When not to use
- to claim GLB or export success without concrete evidence
- to replace runtime export verification
- to validate upstream scene readiness (use `blender-scene-quality-checker`)
- to classify raw render/export artifact evidence (use `render-export-evidence`)
- to define mobile or file-size performance budgets (use `glb-mobile-performance-budget`)
- to define animation playback or rig contracts (use `glb-animation-handoff`)
- to write the final user-facing response wording (use `non-blender-user-response-writer`)

## Trigger phrases
- "prepare web handoff"
- "is GLB ready"
- "summarize export status"

## Prerequisites / readiness
- upstream readiness output from `blender-scene-quality-checker` available (or marked unverified)
- classified artifact evidence state from `render-export-evidence` known
- runtime mode known (within the 2-path + CLI appendix runtime model)

## Input schema

### Required inputs
- per-artifact status evidence from `render-export-evidence` (with provenance to the current run for any pre-existing files)
- upstream readiness summary from `blender-scene-quality-checker`
- handoff target context and known compatibility assumptions

### Optional inputs
- size/performance budget outputs from `glb-mobile-performance-budget`
- animation handoff notes from `glb-animation-handoff`
- expected downstream web stack details

### Assumptions to confirm
- transform/scale/origin assumptions
- material/texture portability assumptions
- loader/extensions assumptions
- target web stack assumptions
- performance assumptions and caveats
- truth states are downgrade-only (never upgrade):
  - Runtime: `Not Run | Attempted | Produced | Verified | Failed`
  - Artifacts: `Not Run | Not Produced | Produced | Verified | Failed` (default `Not Produced`)

## Output schema

### Primary output
- truthful GLB/web handoff summary with explicit Runtime status and per-artifact statuses

### Secondary output
- compatibility assumptions and caveats covering transform/scale/origin, material/texture portability, loader/extensions, stack, and performance

### Evidence / caveat output
- explicit Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and per-artifact status (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`), downgrade-only
- provenance confirmation tying any `Produced` or `Verified` artifact to the current run
- unresolved risk notes, next checks, and cross-skill handoffs

## Required laws
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Never claim GLB or export success without concrete evidence tied to the current run, and never replace runtime export verification. Keep runtime vocabulary strictly within the 2-path (Path 1 Official Blender Lab MCP 5.1+, Path 2 community `mcp-for-blender`) + CLI appendix model. This skill never runs Blender or Python and never upgrades Runtime or Artifact truth states (downgrade-only).

## Operating procedure
1. Enumerate expected handoff artifacts (GLB, preview renders, reports) and check current-run provenance for any pre-existing files.
2. Record Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and mark each artifact status (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) using `render-export-evidence` without upgrading any state.
3. Document transform/scale/origin assumptions and caveats.
4. Document material/texture portability assumptions and caveats.
5. Document loader/extensions and target web stack compatibility assumptions without inventing unsupported guarantees.
6. Document performance caveats and uncertainty (incorporating `glb-mobile-performance-budget` if size budgets apply, and `glb-animation-handoff` if animation contracts apply).
7. Verify compliance with evidence boundaries and upstream `blender-scene-quality-checker` findings.
8. Produce the plain-language handoff summary with actionable next checks and hand off to `non-blender-user-response-writer` for final user-facing wording.

## Decision tree
- If concrete current-run GLB evidence is classified by `render-export-evidence` -> report `Produced` or `Verified` (matching evidence, never upgraded) + full compatibility caveats.
- If a GLB file exists on disk but lacks provenance to the current run -> do not claim `Produced` or `Verified`; downgrade to `Not Produced` with a provenance caveat.
- If runtime was not executed -> mark Runtime `Not Run` and artifacts `Not Run` or default `Not Produced`.
- If runtime was `Attempted` or `Failed` and no valid GLB was exported -> mark artifact `Not Produced` or `Failed` with failure notes and next checks.
- If size budgets or animation contracts are needed -> route to `glb-mobile-performance-budget` or `glb-animation-handoff` respectively.
- Once handoff summary is complete -> hand off to `non-blender-user-response-writer` for final user-facing wording.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- document handoff expectations, compatibility assumptions, and caveats only
- mark Runtime `Not Run` and artifacts `Not Run` or `Not Produced` (default `Not Produced`)

### Runtime-ready mode
- report evidence-linked Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and per-artifact statuses (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) with current-run provenance and downgrade-only enforcement

### Blocked runtime mode
- make zero production or verification claims; keep artifacts at `Not Produced`, `Not Run`, or `Failed`
- provide blocker-driven next checks and compatibility caveats

## Validation checklist
- [ ] Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) explicit
- [ ] GLB and preview per-artifact statuses (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) explicit
- [ ] current-run provenance verified for any pre-existing files
- [ ] truth states strictly downgrade-only (never upgraded)
- [ ] transform/scale/origin assumptions documented
- [ ] material/texture portability caveats documented
- [ ] loader/extensions assumptions documented
- [ ] target stack assumptions documented
- [ ] performance caveats documented
- [ ] no unsupported readiness guarantees or role blur with evidence/quality/budget/animation/response skills
- [ ] actionable next checks and handoff to `non-blender-user-response-writer` included

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Artifact truth | Status matches evidence | Partial evidence | Claims without evidence |
| Compatibility clarity | Assumptions/caveats complete | Some gaps | Missing assumptions |
| Web handoff usability | Clear next actions | Partial actionability | Confusing or incomplete |
| Evidence boundary | No overclaims | Minor ambiguity | Contradictory claims |

## Failure handling
- Missing evidence: mark Runtime `Not Run` (or `Attempted`) and artifacts `Not Produced` (default) or `Not Run`, then route to `render-export-evidence` / list missing checks.
- Failed export evidence: mark Runtime/artifact `Failed` or `Not Produced` (downgrade-only), record failure reason, and list next checks.
- Pre-existing file without current-run provenance: refuse `Produced`/`Verified` status, keep at `Not Produced`, and require a fresh verified export run.
- Unknown compatibility in any of the 5 categories: mark `Warn` with an explicit caveat rather than assuming support.

## Troubleshooting
- Existing files found: verify provenance before claiming produced.
- Missing scale/origin assumptions: add as blocker.
- Missing stack assumptions: mark handoff as conditional.

## Best practices
- Always pair every per-artifact status with its matching compatibility caveats.
- Enforce downgrade-only truth states and verify current-run provenance before accepting any file as `Produced` or `Verified`.
- Keep handoff notes in plain language and hand off final user-facing phrasing to `non-blender-user-response-writer`.

## Good examples
"Runtime status: `Not Run`. Artifact statuses: GLB `Not Produced` (default), Preview `Not Produced`. Compatibility assumptions & caveats: transform/scale/origin (1 unit = 1m, Z-up to Y-up conversion unverified), material/texture portability (procedural nodes must be baked before GLB export), loader/extensions (unverified compression/extension support), stack (target web viewer unspecified), performance (draw-call and file-size budget unverified; route to `glb-mobile-performance-budget` if constrained). Next checks: run export via configured runtime path, classify evidence with `render-export-evidence`, and pass summary to `non-blender-user-response-writer`."

## Bad examples
“GLB is ready for production.” (no artifact proof)

## User-facing response template
- Runtime status (`Not Run | Attempted | Produced | Verified | Failed`)
- Per-artifact statuses (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) with current-run provenance notes
- Compatibility assumptions and caveats:
  - Transform / scale / origin
  - Material / texture portability
  - Loader / extensions
  - Target stack
  - Performance
- Unverified risks and next checks
- Cross-skill handoff (to `non-blender-user-response-writer` for final user-facing wording)

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- using non-official runtime setup paths
- producing jargon-heavy final output without explanation

## Cross-skill handoff
- Upstream scene readiness validation: `blender-scene-quality-checker`
- Upstream artifact evidence classification: `render-export-evidence`
- Mobile and file-size budget constraints: `glb-mobile-performance-budget`
- Animation playback and rig handoff contracts: `glb-animation-handoff`
- Final user-facing response wording: `non-blender-user-response-writer`

## Non-goals
- Generating Python scripts or executing Blender exports
- Replacing runtime export verification
- Upgrading Runtime or Artifact truth states or accepting pre-existing files without current-run provenance
- Classifying raw render/export evidence (`render-export-evidence`) or validating upstream scene quality (`blender-scene-quality-checker`)
- Defining size budgets (`glb-mobile-performance-budget`), animation contracts (`glb-animation-handoff`), or final user-facing wording (`non-blender-user-response-writer`)
- Making unsupported web stack or loader compatibility guarantees

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
