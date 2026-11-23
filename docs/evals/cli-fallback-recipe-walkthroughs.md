# CLI fallback: recipe walkthroughs run in real Blender

## Scope and truth states

- Runtime status: **Verified**, limited to the checks below, run headless on Linux through the CLI fallback.
- Blender versions: `Blender 4.2.23 LTS` and `Blender 5.1.2`, the same official archives as [cli-fallback-blender-ci.md](./cli-fallback-blender-ci.md).
- Path 1 and Path 2: **Not Run**. The steps are written for `execute_blender_code` too, but no MCP session ran them.
- Artifacts: the previews, look-check views, final still and GLBs below are **Produced** as test output only (CI artifacts). They are not committed and are not user deliverables.
- Visual review: an agent looked at the pictures once while writing the walkthroughs; no scored visual review ran. Only the numeric checks below gate the test.

No BlendOps-owned CLI command, MCP server or add-on was added. The runner lives under `evals/blender-checks/` and is not part of the npm package.

## What runs

`npm run test:blender` ([`scripts/test-blender-references.mjs`](../../scripts/test-blender-references.mjs)) also covers every walkthrough in `docs/recipes/` that has `python` steps; a new one fails the run until it gets an entry. For each walkthrough:

1. [`run-walkthrough.py`](../../evals/blender-checks/run-walkthrough.py) starts the scene the user would hand over (an empty file, or for the chair a test file with three planted export problems, a cushion parented to the chair and a hidden copy sharing its material), then runs each `python` step in order in its own namespace, with `/abs/path/` pointed at the output folder. Any Python error fails the run (`--python-exit-code 1`).
2. The scene-state script from `skills/blendops-look-check/references/scene-state.md` runs on the saved `.blend` with the walkthrough's own `## Plan` JSON. The test requires zero issues and verdict `pass`.
3. Every expected file must exist and be non-empty; a GLB must pass `inspect-glb` with the planned mesh count and under the triangle budget.

| Walkthrough | Recipe | Extra checks | Expected output |
|---|---|---|---|
| [sci-fi-crate-prop](../recipes/sci-fi-crate-prop.md) | `recipe.hard-surface-prop` | none | `preview.png`, 3 look-check views, `crate.glb` with 2 meshes, ≤ 50,000 triangles |
| [dusk-campsite-environment](../recipes/dusk-campsite-environment.md) | `recipe.stylized-environment-scene` | all 8 trees share one mesh | `preview.png`, 3 look-check views, 1280 × 720 `campsite.png` |
| [chair-glb-web-handoff](../recipes/chair-glb-web-handoff.md) | `recipe.blender-to-glb-handoff` | before the steps, scene-state reports exactly `fail:scale_applied:Chair`; after, `Chair` has scale 1, its material has no noise node, the hidden copy that shared `Wood` keeps it, and the parented cushion keeps its size and height | `chair-backup.blend`, `chair.glb` with 2 meshes, ≤ 100,000 triangles |

## Local results

`npm run test:blender` on the session VM (Ubuntu, CPU only), output under `BLENDER_CHECK_OUT`:

| Blender | Tests | Crate GLB | Chair GLB | Campsite still | Scene-state after (crate / campsite / chair) |
|---|---|---|---|---|---|
| 4.2.23 | 12 pass, 0 fail | valid, 2 meshes, 2 materials, 660 triangles | valid, 2 meshes, 2 materials, 84 triangles | 1280 × 720 PNG | pass / pass / pass |
| 5.1.2 | 12 pass, 0 fail | valid, 2 meshes, 2 materials, 660 triangles | valid, 2 meshes, 2 materials, 84 triangles | 1280 × 720 PNG | pass / pass / pass |

The 12 tests are the 8 of [cli-fallback-blender-ci.md](./cli-fallback-blender-ci.md) plus the walkthrough coverage check and one test per walkthrough. The chair's glTF audit step reported the three planted problems before the fixes: `Chair` at scale 2, `ShaderNodeTexNoise` in `Wood`, hidden `Chair_Old`.

## CI results

The [Blender workflow](../../.github/workflows/blender.yml) runs these tests on both versions and uploads `blender-check-out/` (including `recipes/<walkthrough>/`) as a 14-day artifact.

[Run 45215822342](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/45215822342) on commit `0fbaf8a`, both jobs passed:

| Job | Artifact |
|---|---|
| [Blender 4.2.23](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/45215822342/job/137836546703) | [`blender-4.2.23-check-output`](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/45215822342/artifacts/14839825033) |
| [Blender 5.1.2](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/45215822342/job/137836547328) | [`blender-5.1.2-check-output`](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/45215822342/artifacts/14839195763) |
