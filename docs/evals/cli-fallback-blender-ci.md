# CLI fallback: Blender CI check for skill references

## Scope and truth states

- Runtime status: **Verified**, limited to the checks below, run headless on Linux.
- Blender versions: `Blender 4.2.23 LTS` and `Blender 5.1.2`, official Linux x64 archives from download.blender.org, SHA-256 checked before use.
- Path 1 and Path 2: **Not Run**.
- Artifacts: a 32×18 test preview PNG and a two-mesh test GLB of placeholder boxes are **Produced** as CI output only. They are not committed and are not product renders or exports.
- Real product scenes and the visual review: **Not Run**.

No BlendOps-owned CLI command, MCP server or add-on was added. The check scripts live under `scripts/blender-checks/` and are not part of the npm package.

## What runs

[`.github/workflows/blender.yml`](../../.github/workflows/blender.yml) runs `npm run test:blender` ([`scripts/test-blender-references.mjs`](../../scripts/test-blender-references.mjs)) once per Blender version, on pull requests and pushes to `main` that touch the build, look-check or final-check skills or the check scripts, and on manual dispatch. Every Blender call uses `--background --factory-startup --python-exit-code 1`, so a Python error fails the job.

1. **Build reference examples.** Each `python` block in `skills/blendops-build/references/*.md` runs in file order, in a fresh scene holding `Shoe_Sole`, `Shoe_Upper` and a camera ([`run_snippets.py`](../../scripts/blender-checks/run_snippets.py)). A check per file then confirms the result:

   | Reference | Confirmed after the examples run |
   |---|---|
   | `api-version-rules.md` | The EEVEE id it picks is accepted by `scene.render.engine` on that Blender. |
   | `build-order.md` | The examples run without error. |
   | `lighting-camera.md` | Lights `Key`, `Fill`, `Rim` exist; the camera tracks `Shoe_Upper`; the framing distance is positive. |
   | `materials.md` | `Shoe_Upper` uses `Leather_Black`. |
   | `modeling.md` | `Crate_Body` has scale 1 and rests at z = 0; `Plinth` has Bevel then Weighted Normal. |
   | `render-export.md` | `preview.png` is written; `model.glb` passes `inspect-glb` with exactly 2 meshes and 2 nodes (no camera). |

   A new reference with `python` blocks fails the run until it gets a check.
2. **Scene-state.** [`scene_state_scenes.py`](../../scripts/blender-checks/scene_state_scenes.py) builds the five test scenes of [cli-fallback-scene-state.md](./cli-fallback-scene-state.md). The last `python` block of `skills/blendops-look-check/references/scene-state.md` runs on each, with the plans listed in the test. The test compares the exact issue list (level, check, object), the verdict and key object facts (unit-scaled size, instance count, lowest point, framing).

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
