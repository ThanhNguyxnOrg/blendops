# CLI fallback: Blender CI check for skill references

## Scope and truth states

- Runtime status: **Verified**, limited to the checks below, run headless on Linux.
- Blender versions: `Blender 4.2.23 LTS` and `Blender 5.1.2`, official Linux x64 archives from download.blender.org, SHA-256 checked before use.
- Path 1 and Path 2: **Not Run**.
- Artifacts: a 32×18 test preview PNG and a two-mesh test GLB of placeholder boxes are **Produced** as CI artifacts only (see CI results). They are not committed and are not product renders or exports.
- Real product scenes and the visual review: **Not Run**.

No BlendOps-owned CLI command, MCP server or add-on was added. The check scripts live under `evals/blender-checks/` and are not part of the npm package.

## What runs

[`.github/workflows/blender.yml`](../../.github/workflows/blender.yml) runs `npm run test:blender` ([`scripts/test-blender-references.mjs`](../../scripts/test-blender-references.mjs)) once per Blender version, on pull requests and pushes to `main` that touch the build, look-check or final-check skills, the recipe walkthroughs or the check scripts, and on manual dispatch. The recipe walkthrough checks it also runs are described in [cli-fallback-recipe-walkthroughs.md](./cli-fallback-recipe-walkthroughs.md). Every Blender call uses `--background --factory-startup --python-exit-code 1`, so a Python error fails the job.

1. **Build reference examples.** Each `python` block in `skills/blendops-build/references/*.md` runs in file order, in a fresh scene holding `Shoe_Sole`, `Shoe_Upper` and a camera ([`run-snippets.py`](../../evals/blender-checks/run-snippets.py)). A check per file then confirms the result:

   | Reference | Confirmed after the examples run |
   |---|---|
   | `api-version-rules.md` | The EEVEE id it picks is accepted by `scene.render.engine` on that Blender. |
   | `build-order.md` | The examples run without error. |
   | `lighting-camera.md` | Lights `Key`, `Fill`, `Rim` exist; the camera tracks `Shoe_Upper`; the framing distance is positive. |
   | `materials.md` | `Shoe_Upper` uses `Leather_Black`. |
   | `modeling.md` | `Crate_Body` has scale 1 and rests at z = 0; `Plinth` has Bevel then Weighted Normal. |
   | `render-export.md` | `preview.png` is written; `model.glb` passes `inspect-glb` with exactly 2 meshes and 2 nodes (no camera). |

   A new reference with `python` blocks fails the run until it gets a check.
2. **Scene-state.** [`scene-state-scenes.py`](../../evals/blender-checks/scene-state-scenes.py) builds the five test scenes of [cli-fallback-scene-state.md](./cli-fallback-scene-state.md). The last `python` block of `skills/blendops-look-check/references/scene-state.md` runs on each, with the plans listed in the test. The test compares the exact issue list (level, check, object), the verdict and key object facts (unit-scaled size, instance count, lowest point, framing).

## CI results

[Workflow run 45206981903](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/45206981903) on commit `28b7c54` (PR #27), both jobs `success`:

| Job | Tests | Artifact (kept 14 days) |
|---|---|---|
| [Blender 4.2.23](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/45206981903/job/137805232368) | 8 pass, 0 fail, 0 skipped | `blender-4.2.23-check-output` (id 14833229373) |
| [Blender 5.1.2](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/45206981903/job/137805232852) | 8 pass, 0 fail, 0 skipped | `blender-5.1.2-check-output` (id 14835165716) |

Each artifact holds the same files:

- `build/<reference>/job.json` for the six build references.
- `build/render-export/preview.png`: 32×18 PNG.
- `build/render-export/model.glb`: `inspect-glb` valid, 2 meshes, 2 nodes.
- `scene-state/scene1.blend` … `scene5.blend`: the five test scenes.
- `scene-state/<case>.py` and `<case>.json` for the six cases: verdicts `scene1-no-plan` warn, `scene1-example-plan` fail, `scene2-plan` fail, `scene3-plan` pass, `scene4-plan` fail, `scene5-plan` pass on both versions.

| Artifact file | 4.2.23 SHA-256 | 5.1.2 SHA-256 |
|---|---|---|
| `model.glb` | `ebff2e5c5096511a67e8e5cd0e0726d8614220f0e178c8aac4e9fa8e66f4ef72` | `d4193daa69f623943e7a3f91528197f4e091959a68b5b61ac1d3779a5b2fa5ed` |
| `preview.png` | `d4b38ea669602f30520d79d486501c35dd9e8bda03f93bbbef02b3f7a0e71ec6` | `cc08b0896eda7c1f654d215039242f4d8eba36d2e4d8dfda2ab53ea8bcd85fcc` |

## Local results

Run on 2026-11-23 with `BLENDER=<path> npm run test:blender`:

| Blender | Tests | Result |
|---|---|---|
| 4.2.23 | 8 | 8 pass |
| 5.1.2 | 8 | 8 pass |

Negative check: changing the 4.2 EEVEE id in `api-version-rules.md` to `BLENDER_EEVEE_NEXTX` fails `api-version-rules.md` on 4.2.23, as intended.

On the scene-state example plan, Blender 4.2.23 also reports `fail:engine` because that plan names the 5.x id `BLENDER_EEVEE`; the test expects it on 4.x only.

## Limits

- Only checks that the examples run and leave the stated result; it does not judge scene quality.
- Linux x64 only. Other platforms and GPU rendering are Not Run.
