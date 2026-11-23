# CLI fallback: mech-prop export — 2026-11-21

## Scope and truth states

- Runtime source confidence: `verified-read` — official Linux Blender archive, local executable and captured process output.
- Runtime status: **Verified**, limited to this disposable CLI evaluation on Linux.
- GLB artifact status: **Verified**, meaning on-disk bytes, SHA-256, GLB container/geometry/bounds inspection only.
- PNG still: **Produced**, not visually reviewed. Browser/viewer check: **Not Run**.
- Path 1 and Path 2: **Not Run** in this evaluation; their existing evidence is unchanged.
- Full SceneSpec artistic/quality-gate acceptance is **Not Run**. This is one recipe implementation, not an automatic general-purpose ExecutionPlan executor.

No BlendOps-owned CLI command, MCP server or add-on was added. The developer eval harness drives the upstream executable using `--background --python`; Python is internal recipe implementation, not a user-facing deliverable. No version bump or publication was performed (the checkout already declared package version 1.0.1).

## Environment and setup

Ubuntu Linux x64; Node was available through the existing nvm installation but not initially on PATH. Loaded it with `source /home/ubuntu/.nvm/nvm.sh`: Node `v24.22.2`, npm `10.8.3`. `npm ci` printed:

```text
added 96 packages, and audited 97 packages in 3s
found 0 vulnerabilities
```

Checked `core.hooksPath`, `.husky`, package lifecycle scripts, and `.git/hooks`: no configured hook framework or active hooks, only Git's sample hooks. Nothing needed installing. No new dependencies.

Official Blender download and extraction:

```bash
curl -L --fail https://download.blender.org/release/Blender4.2/blender-4.2.0-linux-x64.tar.xz -o /home/ubuntu/Downloads/blender-4.2.0-linux-x64.tar.xz
tar -xf /home/ubuntu/Downloads/blender-4.2.0-linux-x64.tar.xz -C /home/ubuntu/Downloads
/home/ubuntu/Downloads/blender-4.2.0-linux-x64/blender --version
```

Version output (identifying lines):

```text
Blender 4.2.0
	build date: 2024-07-16
	build time: 06:27:02
Blender 4.2.0 (hash a51f293548ad built 2024-07-16 06:27:02)
```

The fixture permits CLI fallback, targets Blender 4.1–5.1, and recommends 5.1. Blender 4.2 meets the fixture minimum and the documented CLI recommendation; the Lab MCP 5.1+ floor does not apply to this appendix.

## Compile and live execution

All Node commands below were run from the repository root with nvm loaded.

```bash
node scripts/compile-scene-plan.mjs plan-compile evals/scene-specs/hard-surface-mech-prop.scene-spec.json --out /home/ubuntu/mech-plan.json
BLENDER_BIN=/home/ubuntu/Downloads/blender-4.2.0-linux-x64/blender BLENDOPS_EVAL_DIR=/home/ubuntu/mech-eval-triangulated-2026-11-21 node scripts/run-live-runtime-eval.mjs
```

Compiler output (excerpt):

```text
Status: ready (Can proceed to runtime: Yes)
Primary Recipe: recipe.hard-surface-prop
Conflicts: 1 total (0 blocking, 0 warning, 1 informational)
Runtime status: Not Run
Artifact status: Not Produced
```

Compilation correctly makes no live success claim. No compiler defect was found. The informational conflict schedules separate still-render and web-export branches.

The harness creates a **new** work directory (existing directories are rejected), saves the factory scene to `scene.blend`, copies and hashes `checkpoint.blend` **before** executing the recipe, then opens the saved scene in a separate Blender process. Exact upstream argument pattern, with each script path substituted in order:

```text
/home/ubuntu/Downloads/blender-4.2.0-linux-x64/blender --background --factory-startup --python-exit-code 1 --python /home/ubuntu/mech-eval-triangulated-2026-11-21/baseline.py
/home/ubuntu/Downloads/blender-4.2.0-linux-x64/blender --background --factory-startup --python-exit-code 1 --python /home/ubuntu/mech-eval-triangulated-2026-11-21/recipe.py
```

Both processes exited 0. The wrapper runs `evals/recipes/hard-surface-mech-prop.py` with disposable output paths. It performs Boolean cutting, chamfers, weighted normals, triangulation, UV packing, tangent-normal and ambient-occlusion baking, packed roughness/metallic texture creation, GLB export, and a CPU Cycles still render. The plan, complete process arguments/stdout/stderr, inspection, paths and hashes are retained locally in `execution-plan.json` and `runtime-result.json` inside the work directory.

Final tool response:

```json
{
  "ok": true,
  "glbPath": "/home/ubuntu/mech-eval-triangulated-2026-11-21/actuator.glb",
  "bytes": 1275660,
  "sha256": "81f198bd035b1ba847b17dab0dce56c9635d77ce8c7591df5fe9941b4e9dcb9c",
  "rollback": null
}
```

Blender output (excerpt):

```text
Info: Baking map saved to internal image, save it externally or pack it
Info: Baking map saved to internal image, save it externally or pack it
Info: Saved "scene.blend"
Saved: '/home/ubuntu/mech-eval-triangulated-2026-11-21/actuator.png'
EVAL_RECIPE_COMPLETE triangles=1724
Blender quit
```

Checkpoint SHA-256: `cd4648310eb1a30b50479c8c582faa49a1a59da17473d092c7967b8a6d2273c1`.
PNG SHA-256: `40ba88d9dc2912a54ff689e30f8115cf8c614b0a2adbc12796901f21bfcaa854`.

## Inspection and handoff

```bash
node scripts/inspect-glb.mjs /home/ubuntu/mech-eval-triangulated-2026-11-21/actuator.glb --strict-bounds --khronos
node scripts/generate-glb-handoff-report.mjs /home/ubuntu/mech-eval-triangulated-2026-11-21/actuator.glb --strict-bounds --khronos --out-dir /home/ubuntu/mech-handoff-final-2026-11-21
```

Both commands exited 0. Inspector output (selected fields):

```json
{
  "valid": true,
  "counts": {
    "scenes": 1, "nodes": 1, "meshes": 1, "primitives": 1,
    "vertices": 3528, "trianglesEstimate": 1724,
    "materials": 1, "textures": 2, "images": 2,
    "animations": 0, "skins": 0
  },
  "errors": [],
  "warnings": []
}
```

Handoff output records the same file hash/size, no external URI dependencies and no required extensions. The standalone handoff CLI conservatively retains `Not Run` / `Not Produced` because it does not attest current-run provenance. The eval harness separately uses `generateGlbHandoffReportFromFileSync` with `blender_export` provenance and `cli-appendix` to produce the scoped runtime-aware report under the work directory's `handoff/`.

`--khronos` reported `unavailable`: "Optional Khronos gltf-validator package is not installed in this environment; container-level GLB 2.0 inspection completed via built-in Node parser." **Full glTF specification conformance is not claimed.**

The GLB is not committed: repository convention ignores `*.glb` and has no committed live-artifact policy. The local path, exact size and SHA-256 above identify the actual produced bytes; the recipe is committed for reproduction. Reproduction requires a fresh directory and may produce a different hash across Blender versions.

## Failure injection and rollback

Before adding the rollback implementation, `node --test scripts/test-live-runtime-eval.mjs` printed:

```text
✖ injected Blender failure restores checkpoint bytes and independently reads back
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ Buffer(7) [Uint8Array] [ ... ]
- Buffer(22) [Uint8Array] [ ... ]
ℹ tests 4
ℹ pass 2
ℹ fail 2
```

The actual file contained `MUTATED` instead of the checkpoint baseline. After the fix, all six tests run without Blender using a real Node subprocess as a fake executable: invalid SceneSpec, pre-mutation checkpoint, injected process failure, malformed GLB, empty GLB and absent GLB. The fake refuses to mutate unless the checkpoint already contains the baseline bytes, and its independent readback process rejects unrestored bytes.

Also ran a real injected failure through `runCliFallbackEval` with the same SceneSpec, official Blender executable, work directory `/home/ubuntu/mech-rollback-2026-11-21`, and local recipe `/home/ubuntu/mech-injected-failure.py`. That recipe deletes every scene object, saves the mutated `BLEND_PATH`, then raises `RuntimeError('Injected live failure after saving mutation')`. Invocation:

```bash
node --input-type=module -e "import {runCliFallbackEval} from './scripts/runtime-orchestrator.mjs'; console.log(runCliFallbackEval({sceneSpecPath:'evals/scene-specs/hard-surface-mech-prop.scene-spec.json',recipePath:'/home/ubuntu/mech-injected-failure.py',workDir:'/home/ubuntu/mech-rollback-2026-11-21',blender:'/home/ubuntu/Downloads/blender-4.2.0-linux-x64/blender'}));"
```

The result was `ok: false`, with the injected traceback and a nonzero recipe exit. Rollback output:

```json
{
  "verified": true,
  "sha256": "de63351047cd298e5f0c73f25370d60597535c2bf1865efe6c39b6cf598bd50a"
}
```

Restore validates paths and checkpoint digest, copies the checkpoint bytes over the mutated scene, verifies the restored digest, and launches a fresh upstream Blender `readback.py` process. Readback opened the restored file and compared object names/types against the saved baseline JSON (Camera, Cube, Light); exit 0. Failed-run GLB output is removed. Failed restore remains explicitly unverified and retains the checkpoint for manual recovery.

## Limitations and corrections

- Initial recipe attempts exposed Blender's n-gon tangent limitation: `Error: Tangent space can only be computed for tris/quads, aborting` and `Could not calculate tangents`. Triangulating before UV/bake/export removed these messages in the final run; the final GLB includes the additional tangent accessor.
- Initial handoff attempt used unsupported provenance/path enum values; corrected to existing `blender_export` / `cli-appendix`, then reran the complete recipe successfully. No schema expansion was needed.
- Final exporter warning: `More than one shader node tex image used for a texture. The resulting glTF sampler will behave like the first shader node tex image.` Both generated images use default compatible sampler settings; browser appearance is still unverified.
- This is a baseline mechanical prop, not full artistic acceptance: no separate high-poly normal transfer, HDRI environment, LOD chain, meshopt compression or KTX2 transcoding. Ambient occlusion is baked into the internal packed image but not independently verified as a glTF occlusion binding. These requested fixture features remain unverified/unimplemented; the standard uncompressed GLB stays within the 8 MB / 45,000 triangle budgets.
- No visual review, browser playback, installed MCP configuration, Path 1/2 mutation evidence, release approval, marketplace listing or publication is implied.

## Repository verification status

The six new subprocess regression tests pass, including rollback. Full repository validation is **Failed**, not green: the preexisting checkout declares package/lock version `1.0.1`, while the installed CLI and existing package/distribution assertions expect `1.0.0`. The same version errors were reproduced in a separate HEAD worktree. No version metadata or existing assertions were changed to hide this discrepancy.

Initial `npm test` (Node 24) also exposed the new evidence-count artifact needing `npm run catalog:build`, and a missing ignored `dist/` directory before the existing live-staging test. Catalog outputs were regenerated; the full CI sequence creates `dist/` via the existing skill exporter. Final pipeline-equivalent validation on Node `v20.20.2` used:

```bash
npm ci
npm run arch:build && npm run audit:sync-digest && npm run ci
```

All validation steps before the test phase completed. Final test-phase output:

```text
# tests 306
# suites 14
# pass 303
# fail 3
# cancelled 0
# skipped 0
# todo 0
```

The remaining three failures are the existing package-version assertions in `test-cli-package.mjs`, `test-distribution-metadata.mjs`, and `test-repository-architecture.mjs`. Required local generated audit changes come from `npm run catalog:build`, `npm run arch:build`, and `npm run audit:sync-digest`, not manual audit edits. No workflow files were modified.
