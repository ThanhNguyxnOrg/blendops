# Evals (Draft v0)

BlendOps evals are evidence records for laws, skills, workflows, recipes, and packs.

## Eval principles

- Evals must clearly distinguish **planned tests** from **executed tests**.
- Evals must record **runtime source confidence** (`verified-read`, `linked-only`, or `mixed`).
- Evals must not fake runtime results or artifact success.
- Evals must preserve official-runtime-only boundaries in active docs.

## Status model

- **Protocol / Not yet executed**: test plan only, no runtime execution claims
- **Executed / Text-only (No Blender runtime)**: evaluation completed on prompts/plans/checklists only; runtime artifacts remain Not Run/Not Produced
- **Executed / Runtime**: official runtime path actually run with real preview/export/GLB evidence and explicit pass/warn/fail outcomes

## Eval index

- [cyberpunk-shoe-hero-v0-manual-eval.md](./cyberpunk-shoe-hero-v0-manual-eval.md) — protocol-only manual runtime eval
- [cyberpunk-shoe-hero-v0-text-eval.md](./cyberpunk-shoe-hero-v0-text-eval.md) — executed text-only dry eval (no Blender runtime execution)
- [cyberpunk-shoe-hero-v0-runtime-eval.md](./cyberpunk-shoe-hero-v0-runtime-eval.md) — runtime eval result record (blocked in current environment)
