
# blendops-glb-web-handoff (reference for `blendops-glb-web-handoff`)

> Detailed playbook carried over from the former `blendops-glb-web-handoff` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

## Purpose
Define reliable handoff language and checks for GLB/web scenarios without overclaiming.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- when writing the GLB/web handoff summary after upstream validation from `blendops-final-check` and evidence classification from `blendops-final-check`
- when summarizing per-artifact export statuses and web compatibility assumptions/caveats (transform/scale/origin, material/texture portability, loader/extensions, stack, performance)
- when preparing truthful next checks before passing final wording to `blendops-start`

## When not to use

## Trigger phrases

## Prerequisites / readiness
- upstream readiness output from `blendops-final-check` available (or marked unverified)
- classified artifact evidence state from `blendops-final-check` known
- runtime mode known (within the 2-path + CLI appendix runtime model)

## Input schema

### Required inputs
- per-artifact status evidence from `blendops-final-check` (with provenance to the current run for any pre-existing files)
- upstream readiness summary from `blendops-final-check`
- handoff target context and known compatibility assumptions

### Optional inputs
- size/performance budget outputs from `blendops-glb-budget`
- animation handoff notes from `blendops-glb-web-handoff`
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
2. Inspect the GLB 2.0 binary container with `scripts/inspect-glb.mjs` (`blendops glb-inspect`) and generate/validate the structured handoff manifest (`schemas/glb-web-handoff-manifest.schema.json`) via `scripts/generate-glb-handoff-report.mjs` (`blendops glb-handoff`) across all four validation tiers (Tier 1 Container Structural, Tier 2 Khronos glTF 2.0 Specification, Tier 3 Visual Quality, Tier 4 Live Blender Runtime).
3. Record Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and mark each artifact status (`Not Produced | Produced | Verified | Failed`, default `Not Produced`) using `blendops-final-check` without upgrading any state.
4. Document transform/scale/origin assumptions and caveats (`+Y up, +Z forward, -X right`, `1 unit = 1 meter`, non-identity or negative root scale checks).
5. Document material/texture portability assumptions and caveats (embedded `bufferView` vs external URI textures, KTX2/WebP transcoders, alpha modes).
6. Document loader/extensions and target web stack compatibility assumptions (`DRACOLoader`, `MeshoptDecoder`, `KTX2Loader`, Three.js / React Three Fiber integration modules in `docs/examples/blendops-glb-web-handoff/README.md`) without inventing unsupported guarantees.
7. Document performance caveats and uncertainty (incorporating `blendops-glb-budget` if size budgets apply, and `blendops-glb-web-handoff` if animation contracts apply).
8. Verify compliance with evidence boundaries and upstream `blendops-final-check` findings, then hand off to `blendops-start` for final user-facing wording.

## Decision tree
- If concrete current-run GLB evidence is classified by `blendops-final-check` -> report `Produced` or `Verified` (matching evidence, never upgraded) + full compatibility caveats.
- If a GLB file exists on disk but lacks provenance to the current run -> do not claim `Produced` or `Verified`; downgrade to `Not Produced` with a provenance caveat.
- If runtime was not executed -> mark Runtime `Not Run` and artifacts `Not Run` or default `Not Produced`.
- If runtime was `Attempted` or `Failed` and no valid GLB was exported -> mark artifact `Not Produced` or `Failed` with failure notes and next checks.
- If size budgets or animation contracts are needed -> route to `blendops-glb-budget` or `blendops-glb-web-handoff` respectively.
- Once handoff summary is complete -> hand off to `blendops-start` for final user-facing wording.

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
- [ ] GLB and preview per-artifact statuses (`Not Produced | Produced | Verified | Failed`, default `Not Produced`) explicit
- [ ] current-run provenance verified for any pre-existing files (synthetic test fixtures remain `Not Produced`)
- [ ] truth states strictly downgrade-only (never upgraded)
- [ ] 4-tier validation summary explicit (Container Structural, glTF 2.0 Specification, Visual Quality, Live Runtime)
- [ ] transform/scale/origin assumptions documented
- [ ] material/texture portability caveats documented
- [ ] loader/extensions assumptions documented (`DRACOLoader`, `MeshoptDecoder`, `KTX2Loader`)
- [ ] target stack assumptions documented (`threejs`, `react-three-fiber`, `model-viewer`, `babylonjs`)
- [ ] performance caveats documented
- [ ] no unsupported readiness guarantees or role blur with evidence/quality/budget/animation/response skills
- [ ] actionable next checks and handoff to `blendops-start` included

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Artifact truth | Status matches evidence | Partial evidence | Claims without evidence |
| Compatibility clarity | Assumptions/caveats complete | Some gaps | Missing assumptions |
| Web handoff usability | Clear next actions | Partial actionability | Confusing or incomplete |
| Evidence boundary | No overclaims | Minor ambiguity | Contradictory claims |

## Failure handling
- Missing evidence: mark Runtime `Not Run` (or `Attempted`) and artifacts `Not Produced` (default) or `Not Run`, then route to `blendops-final-check` / list missing checks.
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
- Keep handoff notes in plain language and hand off final user-facing phrasing to `blendops-start`.

## Good examples
"Runtime status: `Not Run`. Artifact statuses: GLB `Not Produced` (default), Preview `Not Produced`. Compatibility assumptions & caveats: transform/scale/origin (1 unit = 1m, Z-up to Y-up conversion unverified), material/texture portability (procedural nodes must be baked before GLB export), loader/extensions (unverified compression/extension support), stack (target web viewer unspecified), performance (draw-call and file-size budget unverified; route to `blendops-glb-budget` if constrained). Next checks: run export via configured runtime path, classify evidence with `blendops-final-check`, and pass summary to `blendops-start`."

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
- Cross-skill handoff (to `blendops-start` for final user-facing wording)

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- using non-official runtime setup paths
- producing jargon-heavy final output without explanation

## Cross-skill handoff

## Non-goals
- Generating Python scripts or executing Blender exports
- Replacing runtime export verification
- Upgrading Runtime or Artifact truth states or accepting pre-existing files without current-run provenance
- Classifying raw render/export evidence (`blendops-final-check`) or validating upstream scene quality (`blendops-final-check`)
- Defining size budgets (`blendops-glb-budget`), animation contracts (`blendops-glb-web-handoff`), or final user-facing wording (`blendops-start`)
- Making unsupported web stack or loader compatibility guarantees

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
- [`../../schemas/glb-web-handoff-manifest.schema.json`](../../../schemas/glb-web-handoff-manifest.schema.json)
- [`../../scripts/inspect-glb.mjs`](../../../scripts/inspect-glb.mjs)
- [`../../scripts/generate-glb-handoff-report.mjs`](../../../scripts/generate-glb-handoff-report.mjs)
- [`../../docs/examples/blendops-glb-web-handoff/README.md`](../../../docs/examples/blendops-glb-web-handoff/README.md)
