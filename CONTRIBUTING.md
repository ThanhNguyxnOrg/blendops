# Contributing to BlendOps

Thanks for contributing.

BlendOps is a **product/workflow + Skills-pack layer** for non-Blender users, paired with a project-local skill installer (`bin/blendops.mjs`, `scripts/install-skills.mjs`) and GLB 2.0 web handoff inspection toolkit (`scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`). It is **not** a Blender runtime, MCP server, or Blender add-on.

---

## Scope of contributions

Welcome:

- product / workflow doc clarity (README, hub, runtime, install, architecture)
- scene / workflow planning skill contracts (`skills/`)
- shared guardrail laws (`laws/`)
- pack manifests (`packs/`)
- per-target install docs (`docs/install/`) and adapter mappings (`docs/adapters/`)
- bundle fixtures (`bundles/skill-package/`, `bundles/claude-desktop-manual/`, `bundles/generic-project-local/`)
- GLB 2.0 container inspection and web viewer handoff examples (`docs/examples/glb-web-handoff/`)
- evidence records under `docs/evals/` when you actually run a path

Out of scope (will be rejected):

- shipping a BlendOps-owned Blender runtime, MCP server, or Blender add-on (intentionally external — see `laws/official-runtime-only.md`)
- making arbitrary Python the user-facing surface (see `laws/no-arbitrary-python-interface.md`)
- claiming runtime / artifact success without an evidence file (see `laws/evidence-before-done.md`)
- introducing dense Blender jargon into user-facing outputs (see `laws/non-blender-user-language.md`)

---

## Local setup

```bash
git clone https://github.com/ThanhNguyxnOrg/blendops.git
cd blendops
npm install
```

Node 20 or newer is required.

---

## Required pre-PR checks

Run the full CI suite before opening a PR. GitHub Actions runs `npm run ci` and cross-platform CLI tests (`ubuntu-latest`, `windows-latest`, `macos-latest`) on every PR and push to `main`.

```bash
npm run docs:check               # validates active markdown files, frontmatter spec, runtime model, link integrity, Blender 5.1+ for Path 1, evidence rules
npm run catalog:check            # validates knowledge-sources (20), knowledge-catalog (30), recipe-catalog (10), and retrieval evals (90/90)
npm run operations:check         # validates deterministic 18-operation MCP/CLI orchestrator contracts
npm run arch:check               # validates repository inventory classification, root policy, duplicate rules, and internal references
npm run registry:check           # verifies registry/skills.json and registry/workflow-graph.json match skills/*/contract.json
npm run evals:check              # validates evals/*.json against schemas/skill-eval.schema.json
npm run evals:run                # runs deterministic behavioral evaluations across all 48 skills (269 cases)
npm run bundles:summaries:check  # verifies 96 generated bundle reference summaries are in sync
npm run skills:export            # produces one ZIP + one Claude Code folder per skills/*/SKILL.md (48 total) into dist/claude-skills/
npm test                         # runs all phase regression test suites (test-phase1.mjs .. test-phase19.mjs)
```

Or run the entire pipeline with the single convenience script:

```bash
npm run ci
```

---

## Branching

- branch from `main`
- descriptive names: `docs/<area>-<topic>`, `skill/<name>-<change>`, `eval/<path>-<scenario>-<date>`

---

## Pull request checklist

- [ ] change is aligned with product / workflow direction (see [`docs/product-direction.md`](./docs/product-direction.md))
- [ ] no BlendOps-owned CLI / MCP / addon runtime surface reintroduced
- [ ] no arbitrary Python presented as user-facing surface
- [ ] runtime / artifact claims have evidence files under `docs/evals/`
- [ ] runtime references use the 2-path + CLI appendix model (Path 1 = Lab MCP with hosts a/b, Path 2 = community `mcp-for-blender`, CLI fallback = appendix, documented upstream as first-class Blender CLI surface; no in-repo evidence file yet) — see [`docs/runtime-stack-strategy.md`](./docs/runtime-stack-strategy.md)
- [ ] `npm run docs:check` passes locally
- [ ] `npm run skills:export` passes locally and produces clean ZIPs
- [ ] docs updated for any user-facing contract change
- [ ] scope is focused and clearly explained

---

## Reporting bugs

Use the bug report issue template. Please include:

- environment (OS, Node, Blender version)
- AI tool / runtime path used (which Path 1 host, or Path 2)
- affected docs / skill / bundle
- repro steps
- expected vs actual behavior

Security-sensitive issues: see [`SECURITY.md`](./SECURITY.md). Do not open public issues for security issues.

---

## Feature requests

Use the feature request issue template. Please include:

- target user workflow (which non-Blender-user scenario)
- why current docs / flow are insufficient
- proposed minimal change
- safety implications (does it affect any law?)

---

## Adding a new skill

See [`skills/README.md`](./skills/README.md) and [`docs/skill-system.md`](./docs/skill-system.md). New skills must:

- start from `skills/_template/SKILL.md`
- have valid Anthropic Skills frontmatter (`name` ≤64 chars, `description` ≤200 chars, no `version`/`status`/`tags` keys)
- ship with both `SKILL.md` and `EVAL.md`
- use the 2-path + CLI appendix runtime model when discussing runtime
- pass `npm run docs:check` after the skill is registered in `scripts/check-docs.mjs` `requiredSkills`

---

## Adding a new install target / adapter

See [`docs/install/README.md`](./docs/install/README.md), [`docs/adapters/README.md`](./docs/adapters/README.md), and [`docs/adapter-registry.md`](./docs/adapter-registry.md). New targets:

- start as an install doc under `docs/install/<target>.md`
- graduate to an adapter at `docs/adapters/<target>.md` once the project-local mapping is verified or drafted
- use `verified-read` / `linked-only` / `unknown` confidence labels honestly
- pass `npm run docs:check`

---

## Recording runtime evidence

Don't claim runtime / artifact success in a doc. Record it in `docs/evals/path-X-...md`. Template at [`docs/evals/blender-connector-read-only-smoke-test.md`](./docs/evals/blender-connector-read-only-smoke-test.md) section "What a clean re-verification would record".

Required fields:

- Path number (1 or 2) and host option (a / b for Path 1)
- `blender --version` verbatim
- Blender-side add-on identity (Lab MCP add-on version OR `mcp-for-blender` `addon.py` commit)
- MCP server source (`.mcpb` bundle filename / source commit / `uvx mcp-for-blender` version)
- MCP host product + version
- Exact tool names called + responses
- Single-bridge constraint check
- No-mutation guarantee for read-only smoke

---

Questions? See [`SUPPORT.md`](./SUPPORT.md).
