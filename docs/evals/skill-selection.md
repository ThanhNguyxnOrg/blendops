# Skill selection eval

Checks whether a request picks the right skill when an agent sees only each skill's `name` and `description` (the text a host loads before it opens a skill).

- Cases: [`evals/skill-selection-evals.json`](../../evals/skill-selection-evals.json), 72 requests: 4 per skill (3 English, 1 Vietnamese) and 8 that should load no skill. A case may list `acceptable` alternates when two skills are both a fair first pick.
- Runner: `npm run evals:selection` (`scripts/run-skill-selection-eval.mjs`). `--json` prints the full result, `--prompt-pack` prints the prompt for a live model run, `--responses <file>` scores that run's JSON answers.
- Test: `scripts/test-skill-selection.mjs` (in `npm test`) checks the cases, the scorer, and that the word-overlap baseline stays at or above 0.6 with at most 3 false triggers and no description pair overlapping 0.3 or more.

## Truth state

| Check | State |
|---|---|
| Case and scorer validation | **Verified** (deterministic, `npm test`) |
| Word-overlap baseline | **Verified** (deterministic) |
| Live model selection | **Not Run**: no model run is recorded. Run `--prompt-pack`, give it to the model, save its JSON answer, then run `--responses`. |

## Word-overlap baseline

The baseline scores each skill by the rare words a request shares with its name and description. It cannot read meaning, so it is a floor that catches descriptions that drift into each other, not an estimate of model accuracy.

| Metric | Value |
|---|---|
| Accuracy | 0.653 (English 0.722, Vietnamese 0.444) |
| False triggers on the 8 out-of-scope requests | 3 |

Most similar description pairs (share of weighted words):

| Pair | Overlap | Shared words |
|---|---|---|
| `blendops-product-shot` / `blendops-scene-plan` | 0.188 | brief, plan, product, scene, shot |
| `blendops-build` / `blendops-fix-problems` | 0.150 | blender, export, glb, render, runtime, step |
| `blendops-build` / `blendops-final-check` | 0.129 | export, preview, render, runtime, scene |
| `blendops-build` / `blendops-lighting-materials` | 0.102 | light, material, plan |
| `blendops-fix-problems` / `blendops-look-check` | 0.090 | fix, look, wrong |

Read-outs for description edits:

- Vietnamese requests mostly fail on words alone because every description is English; a live run is the real check for them.
- `blendops-build` lists materials, lights and camera, so lighting and material planning requests drift to it; its "plan is approved and a runtime is ready" condition is what a model has to use to tell them apart.
- `blendops-look-check` and `blendops-fix-problems` both say "fix" and "wrong"; look-check is for a preview that exists, fix-problems for a failure or error.
