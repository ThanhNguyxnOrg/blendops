---
name: blendops-look-check
description: Check a built preview with numbers first, then pictures from several sides, and fix one issue per round. Use after a preview is made to find and fix what looks wrong.
---

# blendops-look-check

## Purpose

Check a built scene against its plan and brief before the final render or export: read sizes, positions and framing as numbers, capture views from several sides, review them, fix one issue per round through `blendops-build`, and stop after three rounds.

## Quick start

1. Confirm a preview exists and the runtime is still ready.
2. Run the numeric checks; they only read the scene.
3. Capture the camera view and at least two other views.
4. Review the pictures against the brief.
5. Fix the top issue through `blendops-build`, then check again. Stop at `pass`, a repeated issue, or round three.

## When to use

- A preview of a built scene exists and must be checked before the final render or GLB export.
- The user says something looks wrong in a preview.

## When not to use
<!-- blendops:generated:start exclusions -->
- no preview or build exists yet → use `../blendops-build/SKILL.md` (build and preview first)
- the final render or GLB must be verified and labelled for handoff → use `../blendops-final-check/SKILL.md` (final evidence and truth labels are owned by blendops-final-check)
- no runtime path is ready → use `../blendops-connect-blender/SKILL.md` (check readiness first)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "check how the preview looks"
- "does it look right"
- "the preview looks wrong"
- "something is floating"
- "the object is cut off in the shot"
- "compare the preview with the brief"
- "check it from other angles"
- "fix what looks off before the final render"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- Runtime state is one of `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`; artifacts default to `Not Produced`.
- A preview was produced by `blendops-build` and the runtime path is still ready (`blendops-connect-blender`).
- The locked scene plan (object names, sizes, lights, camera) and the look criteria from `blendops-done-criteria` are at hand.

## Required laws

- [`../../laws/official-runtime-only.md`](../../laws/official-runtime-only.md)
- [`../../laws/evidence-before-done.md`](../../laws/evidence-before-done.md)
- [`../../laws/non-blender-user-language.md`](../../laws/non-blender-user-language.md)
- [`../../laws/no-arbitrary-python-interface.md`](../../laws/no-arbitrary-python-interface.md)

## Official runtime boundary

BlendOps runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix** (see `../../docs/runtime-stack-strategy.md`):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually). Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 tells you to install the Lab add-on inside Blender. Read the scene with `get_objects_summary` / `get_object_detail_summary` or a read-only `execute_blender_code` script; capture with `render_thumbnail_to_path` and `get_screenshot_of_area_as_image`.
2. **Path 2 — Community `mcp-for-blender` (formerly `blender-mcp`)** (Blender 3.0+). Read the scene with `get_scene_info` / `get_object_info`; capture with `look` or `viewport_capture` (v2.2.7+) or `get_viewport_screenshot` (v1.x).
3. **CLI fallback (appendix)** — `blender --background --python`, see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md). Run checks and captures with `blender --background scene.blend --python-exit-code 1 --python check.py`; these scripts never save the file.

Check scripts run inside the runtime only. They are never handed to the user as their answer.

## Decision tree

- Context flags: look issues go in `quality.verdict` (`fail` or `warn`), not in `runtime.errorDetected`. Set `runtime.errorDetected` only when a check script, capture or tool call fails, the same issue comes back after its fix, or a fix breaks a check that passed before. Set `gate.status` to `pending` at the start of every round; after round three with a `fail` left, set it to `blocked`, stop, and ask the user.

- Always start with the [numeric checks](references/numeric-checks.md); a failed number beats a picture that looks fine.
- Numbers pass → [capture views](references/capture-views.md), then [visual review](references/visual-review.md).
- Any issue → [fix loop](references/fix-loop.md): one fix per round through `blendops-build`.

## Playbooks

- [numeric-checks](references/numeric-checks.md) — Read-only size, ground, frame, material and light checks.
- [capture-views](references/capture-views.md) — Camera view plus two more sides, per runtime path.
- [visual-review](references/visual-review.md) — What to judge in the pictures and what not to trust.
- [fix-loop](references/fix-loop.md) — Issue order, one fix per round, stop rules, round report.

## Mode handling

### Text-only mode
No runtime: list the checks and views that would run. Runtime stays `Not Run`, artifacts stay `Not Produced`, and the verdict is `not_run`.

### Runtime-ready mode
Run the rounds. Pictures returned by the tool are `Produced` previews; nothing becomes `Verified` here. That is `blendops-final-check`'s call.

### Blocked runtime mode
Stop, keep the issue list, report the blocker in plain language, and hand off to `blendops-connect-blender`.

## Validation checklist

- [ ] Numeric checks ran before any picture was judged.
- [ ] At least three views were captured, and each file was returned by the tool or found on disk.
- [ ] Each issue names its area, view and level (`fail` or `warn`).
- [ ] Only one issue was fixed per round, and the checks ran again after it.
- [ ] The loop stopped at `pass`, a repeated issue, or round three.
- [ ] The reply shows the pictures, explains issues in plain words, and does not hand the user Python.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Numeric checks pass and no visual `fail` is left. |
| Warn | Only polish items (`warn`) are left, listed for the user. |
| Fail | A numeric or visual `fail` is left after three rounds, or a picture was judged without numeric checks. |

## Failure handling

- A check script or capture fails: mark the round `Attempted` and hand off to `blendops-fix-problems`.
- The same issue comes back after its fix: hand off to `blendops-fix-problems`.
- Runtime lost: hand off to `blendops-connect-blender`.

## Troubleshooting

- Every object fails "in frame": `scene.camera` is not the planned camera, or the camera is inside an object.
- Ground gap of a few millimetres on every object: the floor plane is not at the planned height; check the plan's floor value first.
- Path 1 thumbnail looks old: it was written to Blender's temp folder; use the path the tool returned.

## Best practices

- Numbers first, pictures second.
- Three views, not one.
- One fix per round.

## Good examples

"Round 1: the shoe floats 12 mm above the floor (side view) and the toe is in shadow. Fixed the floor gap first. Round 2: all size, floor and framing checks pass; the shadow on the toe is a polish item. Runtime: Produced (3 previews); Artifacts: preview Produced."

## Bad examples

"Looks great from the camera!" after one picture, while the side view would show the object sinking into the floor. Doing this skips the numbers and the other views.

## User-facing response template

```txt
Step: preview-look-check round <n of 3>
Status: <Pass/Warn/Fail>
Runtime: <state>
Artifacts: <state>
Evidence: <preview image paths>
Next safe action: <skill/doc/action>
Limitations: <gaps>
```

## Anti-patterns

- Trusting a picture over a failed number.
- Fixing several issues at once, so nobody can tell which change helped.
- Saving the scene from a check script.
- Calling a preview `Verified`.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [progression] No fail left; check the preview against the done criteria → `../blendops-final-check/SKILL.md`
- [conditional] A fail was found within three rounds; fix it with one build step and check again → `../blendops-build/SKILL.md`
- [conditional] A check or capture failed, or an issue came back after its fix → `../blendops-fix-problems/SKILL.md`
- [fallback] Runtime is not ready for checks → `../blendops-connect-blender/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not make the final render or export, and does not mark anything `Verified`.
- Does not hand the user Python as the final interface.

## References

- [capture-views.md](references/capture-views.md)
- [fix-loop.md](references/fix-loop.md)
- [numeric-checks.md](references/numeric-checks.md)
- [visual-review.md](references/visual-review.md)
