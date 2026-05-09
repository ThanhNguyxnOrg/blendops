# Contributing to BlendOps

Thanks for contributing.

BlendOps is a **product/workflow + Skills-pack layer** for non-Blender users. It is **not** a Blender runtime, MCP server, or installer.

---

## Scope of contributions

Welcome:

- product / workflow doc clarity (README, hub, runtime, install)
- scene / workflow planning skill contracts (`skills/`)
- shared guardrail laws (`laws/`)
- pack manifests (`packs/`)
- per-target install docs (`docs/install/`) and adapter mappings (`docs/adapters/`)
- bundle fixtures (`bundles/skill-package/`, `bundles/claude-desktop-manual/`, `bundles/generic-project-local/`)
- evidence records under `docs/evals/` when you actually run a path

Out of scope (will be rejected):

- shipping a BlendOps-owned CLI / MCP server / Blender add-on (intentionally external — see `laws/official-runtime-only.md`)
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

Node 18 or newer is required.

---

## Required pre-PR checks

Run BOTH before opening a PR. CI runs `docs:check` on every PR.

```bash
npm run docs:check     # validates active markdown files under docs/skills/laws/packs/skill-reviews (see script footer count): frontmatter spec, runtime model, link integrity, Blender 5.1+ for Path 1, evidence rules
npm run skills:export  # produces 10 ZIPs + 10 Claude Code folders into dist/claude-skills/
```

Or run both with the convenience script:

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
- [ ] runtime references use the 2-path + CLI appendix model (Path 1 = Lab MCP with hosts a/b, Path 2 = community `ahujasid/blender-mcp`, CLI fallback = appendix, documented upstream as first-class Blender CLI surface; no in-repo evidence file yet) — see [`docs/runtime-stack-strategy.md`](./docs/runtime-stack-strategy.md)
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
- Blender-side add-on identity (Lab MCP add-on version OR `ahujasid/blender-mcp` `addon.py` commit)
- MCP server source (`.mcpb` bundle filename / source commit / `uvx blender-mcp` version)
- MCP host product + version
- Exact tool names called + responses
- Single-bridge constraint check
- No-mutation guarantee for read-only smoke

---

Questions? See [`SUPPORT.md`](./SUPPORT.md).
