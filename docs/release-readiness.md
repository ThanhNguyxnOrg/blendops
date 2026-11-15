# 🚦 Release Readiness

Status: **1.0.0 (Production)**  
Scope: 48 skills + 151 reference guides + 30 knowledge records + 10 recipes + 20 sources + 26 install target docs (`35+` CLI targets via `--with-skills-dir` and `skills.sh.json`)

> [!IMPORTANT]
> **Scope: BlendOps publishes the skills, knowledge, recipe, and local CLI tooling layers; runtime paths are an upstream redirect.** This readiness report grades what BlendOps **owns**: 48 skills + 4 laws + 1 pack (`product-hero-v0`) + 3 bundles + Knowledge/Recipe Catalog + SceneSpec compiler + GLB inspector + runtime capability/transaction orchestrator + 26 install target docs (`35+` CLI targets) + ZIP/package generation + CI guards. Runtime execution (Path 1 Lab MCP, Path 2 `mcp-for-blender`, CLI appendix) is owned by Blender Foundation / Anthropic / the community — BlendOps redirects users via per-target install docs and does **not** claim ownership of those upstream paths' stability.

---

## Release layer dashboard (BlendOps owns)

| Gate | Status | Evidence |
|---|---|---|
| Product and docs direction | Production Ready (`1.0.0`) | Active docs describe upstream-redirect workflow, 5-layer architecture, and strict truth rules. |
| Root collection layout | Production Ready (`1.0.0`) | `skills/` (48 skills), `laws/` (4 laws), `packs/` (`product-hero-v0`) validated on disk and in registry. |
| Skill depth and gate review | Production Ready (`1.0.0`) | All 48 skills have full `SKILL.md`, `EVAL.md`, `contract.json`, and 151 hardened reference guides (gate review records preserved in `skill-reviews/reports/`). |
| Knowledge & Recipe Catalog + SceneSpec Harmonizer | Production Ready (`1.0.0`) | `registry/knowledge-catalog.json` (30 records), `registry/recipe-catalog.json` (10 recipes), `registry/knowledge-sources.json` (20 sources), `evals/catalog-retrieval-evals.json` (90 bilingual evals), and `scripts/compile-scene-plan.mjs`. |
| Skill ZIP / package generation | Production Ready (`1.0.0`) | `npm run skills:export` produces one ZIP + one Claude Code folder per `skills/*/SKILL.md` (48 total) + shared knowledge catalog ZIP. Anthropic Skills frontmatter spec compliance verified. |
| Local installer & CLI tarball readiness | Production Ready (`Unpublished`) | `bin/blendops.mjs` + `scripts/install-skills.mjs` verified via `scripts/test-project-installer.mjs` and `scripts/test-cli-package.mjs` (`npm pack` + isolated consumer tarball install). Package remains `"private": true` (`Not Published` to npm). |
| GLB Web Handoff & Viewer Integration | Production Ready (`Not Run` / `Not Produced` for live Blender exports) | `schemas/glb-web-handoff-manifest.schema.json`, `scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`, CLI `glb-inspect` / `glb-handoff` / `glb-validate-manifest`, and Three.js + React Three Fiber examples ([docs/examples/glb-web-handoff/README.md](./examples/glb-web-handoff/README.md)) verified in `scripts/test-glb-handoff.mjs`. |
| Adapter install dry-run & Manual install beta | Documented with Warn scoping | Adapter architecture and dry-run install evals complete ([docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md), [docs/evals/adapter-install-v0-dry-run.md](./evals/adapter-install-v0-dry-run.md)), with native-path confidence explicitly environment-scoped. |
| CI guards & test suites | Verified (`npm run ci`) | `npm run ci` validates `docs:check`, `catalog:check`, `operations:check`, `arch:check`, `registry:check`, `evals:check`, `evals:run`, `bundles:summaries:check`, `skills:export`, and all regression suites (`scripts/test-*.mjs`). |

## Runtime paths dashboard (BlendOps redirects to — owned by upstream)

This grades whether BlendOps' redirect docs are accurate, **not** whether BlendOps owns the upstream paths.

| Path | Owner | Redirect doc accurate? | In-repo provenance file? |
|---|---|---|---|
| Path 1 — Lab MCP (Blender Foundation) | Blender Foundation ([blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/)) | ✅ Per-target install docs cite source, list Blender 5.1+, host options (a) and (b). | `docs/evals/blender-connector-read-only-smoke-test.md` (read-only). No mutation/render/export evidence file yet (optional operator-side). |
| Path 1 host (a) — Anthropic Blender Connector | Anthropic ([claude.com tutorial](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude)) | ✅ `docs/install/claude-desktop.md` documents Connector + Lab add-on dependency. | Same as Path 1 above. |
| Path 1 host (b) — Manual MCP client config | Each MCP client | ✅ Per-target install docs (cursor, claude-code, cline, continue, …). | Same as Path 1 above. |
| Path 2 — Community `mcp-for-blender` | `ahujasid` community ([github.com/ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender)) | ✅ `docs/unofficial-runtime-bridges.md` lists caveats; install docs cite source. | Template at `docs/evals/path-2-mcp-for-blender-readonly-template.md`. No filled file yet (optional operator-side). |
| CLI fallback | Blender Foundation ([CLI manual](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)) | ✅ `docs/runtime-stack-strategy.md` includes a CLI compatibility considerations table (GLB export, `--factory-startup` add-on enablement, GPU rendering, viewport limits, stateless caveat). | None (optional operator-side). |

> [!NOTE]
> Path 1 + Path 2 are **user-reported verified by repo owner** (2026-04-29 + 2026-05-08 + 2026-05-09 reconfirmation). CLI is documented upstream as a first-class Blender CLI surface. The lack of a full mutation eval record file does **not** mean the upstream paths don't work — it just means BlendOps keeps strict operator-side truth labels (`Not Run` / `Not Produced`) unless a verified evidence packet is recorded under `docs/evals/`.

---

## ✅ Ready in v1.0.0

- Official-runtime-only boundaries are active across skills, laws, and packs.
- 48 skills complete with Anthropic Skills frontmatter spec compliance (`151/151` hardened references, zero stub templates).
- 4 laws + 1 pack (`product-hero-v0`, version `1.0.0`) + 3 bundle fixtures (`1.0.0`) + `skills.sh.json` 8-group catalog + Lockfile v2 (`skills-lock.json`).
- 26 install target docs (`35+` CLI targets with `--with-skills-dir` & `skills.sh.json`) and 3-mode auto-detect install flow (`docs/ai-agent-quickstart.md`).
- Safe project-local installer (`scripts/install-skills.mjs`) and distributable CLI (`bin/blendops.mjs`) verified end-to-end via `npm pack`, with `"private": true` retained to prevent accidental registry publishing.
- Knowledge & Recipe Catalog (`30` knowledge records, `10` recipes, `20` sources), `SceneSpec` compiler, and `L0`–`L3` runtime capability/operation orchestrator verified deterministically.
- Web-ready GLB 2.0 inspection, handoff manifest schema (`schemas/glb-web-handoff-manifest.schema.json`), report generator, and Three.js / React Three Fiber viewer examples verified.
- Repository architecture, complete tracked-file classification (`docs/audits/current/repository-inventory.json`), root hygiene (`.gitattributes`, `.editorconfig`, `.gitignore`), and internal reference integrity verified (`npm run arch:check`).
- Runtime verification packets and dry-run eval records prepared and preserved in `docs/evals/`.

---

## ⚠️ Operational caveats

1. Native skill-loader confidence varies by host editor version (documented as `linked-only` or environment-scoped `Warn` in `registry/compatibility-matrix.json`).
2. Full live Blender runtime mutation/render/export evidence remains an optional operator-side provenance record (`Not Run` / `Not Produced` in this repository).
3. Manual install beta verdict remains `Warn` across unverified host environments: [docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md).

---

## 🧪 Manual beta checklist

Evidence report: [docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md)

- [x] generic-root install dry-run in disposable repo
- [x] Claude Code project-local install dry-run in disposable repo
- [x] Claude app/Desktop setup text-only walkthrough
- [x] verify no runtime installed/run during install tests
- [x] verify rollback instructions are executable
- [x] update install docs from beta findings

---

## 🛑 Non-claims preserved

- This readiness report does not claim live Blender mutation/render/export runtime execution occurred in CI (`Runtime status: Not Run`).
- This readiness report does not claim preview/render/GLB binary artifacts exist in this repository (`Artifact status: Not Produced`).
- This readiness report does not claim public npm or marketplace publication (`"private": true`, `Not Published`).

