---
name: blendops-build
description: Build the planned scene in Blender step by step. Use when a plan is approved and a runtime is ready to model, add materials, lights, camera, preview, render, or export GLB.
---

# blendops-build

## Purpose

Turn an approved scene plan into a real Blender scene through the ready runtime path, one small step at a time, with a JSON report after every step.

## Quick start

1. Confirm the plan is locked and `blendops-connect-blender` says the runtime is ready.
2. Tell the user in plain words what will change in their scene and which files will be written, and wait for their yes before the first change.
3. Read the Blender version and the current scene; save a backup copy of the `.blend` file.
4. Build in this order, one small step at a time: units, rough shapes, modifiers, materials, lights, camera, preview.
5. Hand the preview to `blendops-final-check`; make the final render or GLB export only after it passes, then hand that file to `blendops-final-check` too. On any failure, hand off to `blendops-fix-problems`.

## When to use

- A plan is approved and the user wants it built in Blender.
- A build step failed and needs a fixed retry.

## When not to use
<!-- blendops:generated:start exclusions -->
- the scene plan, camera, or lighting plan is not decided yet → use `../blendops-scene-plan/SKILL.md` (plan before building)
- no runtime path is ready or the user has not chosen one → use `../blendops-connect-blender/SKILL.md` (check readiness first)
- GLB size, triangle, or texture budget questions → use `../blendops-glb-budget/SKILL.md` (budgets are owned by blendops-glb-budget)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "build the scene in Blender"
- "make it in Blender"
- "model this object"
- "add materials and lights"
- "set up the camera in Blender"
- "render a preview"
- "export the GLB from Blender"
- "the script failed in Blender"
- "which socket name does this Blender version use"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- Runtime state is one of `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`; artifacts default to `Not Produced`.
- The runtime path is ready (`blendops-connect-blender`). On Path 2 the user has opted in to `execute_blender_code`.
- The user has confirmed the planned changes and output paths (explicit operator confirmation, required by the `L3` ceiling in `registry/runtime-capability-policy.json`).
- A backup `.blend` copy is saved before the first change.

## Required laws

- [`../../laws/official-runtime-only.md`](../../laws/official-runtime-only.md)
- [`../../laws/evidence-before-done.md`](../../laws/evidence-before-done.md)
- [`../../laws/non-blender-user-language.md`](../../laws/non-blender-user-language.md)
- [`../../laws/no-arbitrary-python-interface.md`](../../laws/no-arbitrary-python-interface.md)

## Official runtime boundary

BlendOps runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix** (see `../../docs/runtime-stack-strategy.md`):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually). Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 tells you to install the Lab add-on inside Blender. Build with `execute_blender_code` only after the user confirms the changes; look up APIs with `search_api_docs` / `get_python_api_docs`; preview with `render_thumbnail_to_path` and read the file path the tool returns.
2. **Path 2 — Community `mcp-for-blender` (formerly `blender-mcp`)** (Blender 3.0+). Build with `execute_blender_code` only after the user confirms the changes; preview with `viewport_capture` or `look` (v2.2.7+) or `get_viewport_screenshot` (v1.x). Do not call asset libraries or AI model generators unless the brief allows it.
3. **CLI fallback (appendix)** — `blender --background --python`, see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md). Each step is a new Blender process: open the saved file with `blender --background scene.blend --python-exit-code 1 --python step.py` (without the exit-code flag a Python error still exits 0). Each step that changes the scene saves it in place at the end (`bpy.ops.wm.save_mainfile()`), or later steps will not see earlier changes; the first read-only scene check does not save.

This skill runs generated Blender Python inside the runtime only. It never hands that code to the user as their answer.

## Decision tree

- Any code at all → first check [API version rules](references/api-version-rules.md).
- Shapes → [modeling](references/modeling.md).
- Surfaces → [materials](references/materials.md).
- Lights or camera → [lighting and camera](references/lighting-camera.md).
- Preview, final render, or GLB → [render and export](references/render-export.md).

## Playbooks

- [build-order](references/build-order.md) — Step order and per-step rules.
- [api-version-rules](references/api-version-rules.md) — API names that changed in 4.0, 4.2, and 5.0.
- [modeling](references/modeling.md) — Primitives, bmesh, modifiers, ground contact.
- [materials](references/materials.md) — Principled BSDF values, glTF-safe setup.
- [lighting-camera](references/lighting-camera.md) — Studio lights, aiming, framing math.
- [render-export](references/render-export.md) — Preview, render, GLB export, evidence.

## Mode handling

### Text-only mode
No runtime: write the build plan as steps only. Runtime stays `Not Run` and artifacts stay `Not Produced`.

### Runtime-ready mode
Run the steps. A file that exists on disk is `Produced`; it becomes `Verified` only after `blendops-final-check`.

### Blocked runtime mode
Stop building, keep the step list, report the blocker in plain language, and hand off to `blendops-connect-blender`.

## Validation checklist

- [ ] Blender version read and version-specific names used.
- [ ] User confirmed the changes before the first one.
- [ ] Backup saved before the first change.
- [ ] Each step changed one thing and printed a JSON report.
- [ ] Objects are named, at real size, with scale applied and resting on the ground.
- [ ] Output files exist at absolute paths before being reported.
- [ ] The reply explains changes in plain words and does not hand the user Python.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Every planned step ran, reports exist, outputs exist on disk, truth states match evidence. |
| Warn | Some steps were skipped or simplified, with the reason stated. |
| Fail | A step failed without a retry plan, outputs are claimed without files, or code was given to the user as the answer. |

## Failure handling

- Step error: read the error text, fix only that step, re-run it. After two failed retries, hand off to `blendops-fix-problems`.
- Wrong look after preview: hand off to `blendops-final-check`, which routes fixes back here.
- Runtime lost: mark the step `Attempted`, hand off to `blendops-connect-blender`.

## Troubleshooting

- `KeyError` on a node input: the socket was renamed; see [API version rules](references/api-version-rules.md).
- `context is incorrect` from `bpy.ops`: use the `bpy.data` form of the same change.
- Black or inside-out faces: negative scale or flipped normals; see [modeling](references/modeling.md).

## Best practices

- Small steps, each with a report.
- Real-world sizes in metres.
- Look up an API before guessing it.

## Good examples

"Step 3 of 9: added the sole and upper at real size (0.29 m long), resting on the floor. Runtime: Produced for the scene changes; Artifacts: Not Produced yet."

## Bad examples

One 300-line script that builds everything at once, fails on line 180, and leaves half a scene. Doing this hides which step broke and leaves no evidence.

## User-facing response template

```txt
Step: scene-build-execution <n of total>
Status: <Pass/Warn/Fail or scoped status>
Runtime: <state>
Artifacts: <state>
Evidence: <paths/links/logs or none>
Next safe action: <skill/doc/action>
Limitations: <gaps>
```

## Anti-patterns

- Claiming render, export, or GLB results without evidence.
- Recommending "paste this Python" as the user's fix.
- Describing Anthropic Connector as standalone.
- Using `BLENDER_EEVEE_NEXT` on Blender 5.0+ or old Principled socket names on 4.0+.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [progression] Preview, render or GLB exists; check it against the done criteria → `../blendops-final-check/SKILL.md`
- [conditional] A build step failed or the output looks wrong → `../blendops-fix-problems/SKILL.md`
- [fallback] Runtime is not ready for building → `../blendops-connect-blender/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [api-version-rules.md](references/api-version-rules.md)
- [build-order.md](references/build-order.md)
- [lighting-camera.md](references/lighting-camera.md)
- [materials.md](references/materials.md)
- [modeling.md](references/modeling.md)
- [render-export.md](references/render-export.md)
