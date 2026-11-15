# BlendOps Roadmap

_Last updated for **v1.0.0** (48 canonical skills, 151 reference guides, 26 install target docs, 35+ CLI targets via `--with-skills-dir` + `skills.sh.json`, 269 deterministic eval cases, 17 CI test suites)._

> [!NOTE]
> BlendOps publishes one thing: a **skills layer** (**48 skills** + **151 reference guides** + 4 laws + 1 pack + 3 bundles + **26 install target docs** / **35+ CLI targets** via `--with-skills-dir` + deterministic catalog & CLI + ZIP/package generation + automated CI guards). The layer is **complete and production-ready at `v1.0.0`**.
>
> Everything related to actually running Blender — the Blender executable, the MCP servers, the MCP hosts, the CLI — is **upstream**, owned by Blender Foundation / Anthropic / the `ahujasid` community. BlendOps **redirects** users to the right upstream docs per install target. Path 1 + Path 2 are **user-reported verified by the repo owner**; CLI is **documented upstream as a first-class Blender CLI surface** (no in-repo evidence file yet).
>
> Optional operator-side runtime evidence records under `docs/evals/` are useful for provenance, and are **not** BlendOps publishing blockers.

---

## ▶️ Is BlendOps "running" yet?

### Skills layer (BlendOps publishes — what this repo owns)

| Layer | Runnable? | Why |
|---|---|---|
| Content install (clone → paste prompt → agent installs project-locally OR prepares Skills ZIPs) | ✅ Yes | `docs/ai-agent-quickstart.md` + 3-mode auto-detect flow + 26 install targets + 35+ CLI targets. |
| Skill ZIP / package generation | ✅ Yes | `npm run skills:export` → 48 ZIPs in `dist/claude-skills/desktop-zips/` + canonical portable skill at `bundles/skill-package/blendops/`. |
| Skill upload to Claude Desktop / Claude.ai / ChatGPT Skills UI | ✅ Yes (UI drag-drop = user's manual action, not a publisher gap) | `npm run skills:export` produces compliant Anthropic Skills (≤200-char description, no `version:` / `status:` keys) and an OpenAI YAML manifest. |
| CI guards | ✅ Yes | `npm run ci` validates active Markdown docs, knowledge/recipe catalogs, 48 contracts, 269 deterministic evals, repository architecture, and all 17 `node --test` suites. |
| `v1.0.0` release | ✅ Ready | Skills layer, contracts, evals, CLI, and release inspection server are complete and verified. |

### Runtime paths (BlendOps redirects to — owned by upstream, not this repo)

| Path | Owner | Status (upstream + this operator) | BlendOps' role |
|---|---|---|---|
| **Path 1 — Lab MCP** (Lab add-on + Lab server, Blender 5.1+) | Blender Foundation ([blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/)) | ✅ User-reported verified by repo owner — operator statement, does not promote eval scope (2026-04-29 read-only smoke + 2026-05-09 full path) | Redirect via per-target install docs. Stability is upstream's claim. |
| Path 1 host (a) — **Anthropic Blender Connector** | Anthropic ([claude.com tutorial](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude)) | ✅ Documented upstream | Redirect from `docs/install/claude-desktop.md`. |
| Path 1 host (b) — **Manual MCP client config** (Cursor, Claude Code, Codex, OpenCode, Cline, …) | Each MCP client | ✅ Documented upstream per client | Redirect from per-target install doc. |
| **Path 2 — Community `mcp-for-blender` (formerly `blender-mcp`)** (Blender 3.0+) | `ahujasid` community ([github.com/ahujasid/mcp-for-blender](https://github.com/ahujasid/mcp-for-blender)) | ✅ User-reported verified by repo owner — operator statement, does not promote eval scope (2026-05-08, reconfirmed 2026-05-09) | Redirect via `docs/unofficial-runtime-bridges.md` + install docs. |
| **CLI fallback** (`blender --background --python ...`) | Blender Foundation ([CLI manual](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)) | ✅ Documented upstream as a first-class Blender CLI surface; no in-repo evidence file yet | Redirect; CLI compatibility considerations table in `docs/runtime-stack-strategy.md`. |

### Optional operator-side provenance (not blockers)

| Item | Why optional | Where |
|---|---|---|
| In-repo per-path evidence file (`docs/evals/path-X-...md`) | Useful provenance for an operator who wants a captured eval record. NOT a BlendOps publishing blocker because BlendOps redirects to upstream paths and does not run Blender. | `docs/evals/path-2-mcp-for-blender-readonly-template.md` is a fill-in template. |
| `blendops` CLI & project-local installer | ✅ Implemented and tarball-tested (`bin/blendops.mjs` + `scripts/install-skills.mjs`). Public npm metadata is prepared; initial staged publication is pending maintainer approval. | `docs/install/installer-spec.md` |
| Marketplace / plugin listing | Future distribution work. Gated on upstream listing acceptance. | — |

**Bottom line**: clone the repo → run `npx skills add ThanhNguyxnOrg/blendops` or `npm run skills:install` → plan a scene with **48 skills** → follow per-target install doc to enable an upstream runtime path → drive Blender via Path 1 / Path 2 (both user-reported verified by the repo owner — operator statement) or CLI (upstream-documented).

---

## 🟢 Completed Milestones (Included in v1.0.0)

### Architecture, Laws, Packs & Golden Path
- [x] Product-layer boundaries, external runtime model (2 MCP execution paths + CLI fallback appendix), safety model (`docs/safety-model.md`), and workflow contract (`docs/workflow-contract.md`).
- [x] Canonical 4 shared guardrail laws (`laws/`), initial `product-hero-v0` pack (`packs/product-hero-v0/PACK.md`), canonical workflows (`docs/workflows/`), and cyberpunk shoe golden path (`docs/golden-path-cyberpunk-shoe.md`).

### Full-Catalog Skill Layer (48/48 Skills, Contracts & Reference Hardening)
- [x] Canonical template (`skills/_template/SKILL.md`), depth standard (`skill-reviews/depth-standard.md`), and 9 review gates (`skill-reviews/review-gates.md`).
- [x] Complete 48-skill catalog (16 baseline skills + 32 expansion skills across Web 3D, Quality Validation, Domain Planners, Process Discipline, Asset/Sourcing, Color/Format/Output, Recipe/Pack Ops, Runtime Path Discipline).
- [x] Full-catalog machine-readable `contract.json` coverage (48/48 skills, 371 edges, 16-state routing precedence determinism) and deterministic `SKILL.md` managed sections (`scripts/build-registry.mjs`).
- [x] Deep enrichment across all **151/151 skill reference guides** (principled BSDF tables, multi-engine export parity, 6-gate mesh/UV QA rules, reference-silhouette checks, Superpowers-style verification rubrics).

### Knowledge, Recipes, SceneSpec Compiler & Behavioral Evals
- [x] Architecture Reconciliation & Knowledge/Recipe Foundation: 20-source citation registry (`registry/knowledge-sources.json`), 30-record domain knowledge catalog (`registry/knowledge-catalog.json`), 10-record recipe catalog (`registry/recipe-catalog.json`), bilingual retrieval index (`registry/catalog-index.json`), and 90/90 retrieval eval suite (`evals/catalog-retrieval-evals.json`).
- [x] Deterministic `SceneSpec` → `ExecutionPlan` compiler & skill harmonizer (`scripts/compile-scene-plan.mjs`), Ajv Draft 2020-12 schema suite (`schemas/*.schema.json`), and shared catalog ZIP export (`dist/shared-catalog/blendops-knowledge-and-recipes.zip`).
- [x] Full-catalog machine-readable evaluation suites (`evals/suites/*.eval.json`, 48/48 skills, 269/269 deterministic cases passing via `npm run evals:run`).

### Safe Runtime Governance, MCP Qualification & Async Client
- [x] Typed 18-operation runtime registry (`registry/runtime-operations.json`), capability tiers (`L0`–`L3`), fail-closed pre-mutation `.blend` checkpoints, and rollback protocol (`scripts/runtime-orchestrator.mjs`).
- [x] `@modelcontextprotocol/sdk` async STDIO + Streamable HTTP client (`connectMcpRuntimeClient`), 7-state lifecycle, SHA-256 tool-contract fingerprinting, secret redaction, and deterministic CLI exit codes `0..7`.

### GLB 2.0 Web Handoff, Installer, CLI & Distribution
- [x] GLB 2.0 container inspector (`scripts/inspect-glb.mjs`), web handoff report generator (`scripts/generate-glb-handoff-report.mjs`), Three.js & React Three Fiber viewer examples (`docs/examples/glb-web-handoff/`).
- [x] Transactional project-local installer (`scripts/install-skills.mjs`), distributable CLI (`bin/blendops.mjs`), deterministic 48-skill ZIP/folder exporter (`scripts/export-claude-skills.mjs`), and 96 deterministic bundle reference summaries (`scripts/generate-bundle-reference-summaries.mjs`).
- [x] Root `skills.sh.json` 8-group catalog, `vercel-labs/skills` Lockfile v2 (`skills-lock.json` `computedHash`), `--with-skills-dir` + `--skill <slug>` across `26` install target docs and `35+` CLI targets.
- [x] Complete repository inventory classification & reference integrity verification (`scripts/validate-repository-architecture.mjs`, `.gitattributes`, `.editorconfig`, clean `v1.0.0` audit snapshots under `docs/audits/current/`).

---

## ⚪ Optional — operator-side provenance (NOT BlendOps publishing blockers)

These are useful for any operator who wants a **captured in-repo eval record** under `docs/evals/`, but they are **not** requirements for `v1.0.0`:

- [ ] Capture Path 1 in-repo evidence file (`docs/evals/path-1-recipe-cyberpunk-shoe-YYYY-MM-DD.md`) — run a recipe via Path 1 (host a Anthropic Connector OR host b manual MCP). Record `blender --version`, Lab MCP add-on version, MCP server source/commit, MCP host product+build, exact tool names + responses, artifacts.
- [ ] Capture Path 2 in-repo evidence file (`docs/evals/path-2-mcp-for-blender-readonly-YYYY-MM-DD.md`) — run a recipe via `mcp-for-blender` (formerly `blender-mcp`). Template at `docs/evals/path-2-mcp-for-blender-readonly-template.md`.
- [ ] Capture CLI fallback in-repo evidence file (`docs/evals/cli-fallback-recipe-...-YYYY-MM-DD.md`) — run a script via `blender --background --python ...`. Pure provenance; the CLI surface itself is upstream-documented.

## 🔵 Post-v1.0.0 Future Work (deliberately deferred)

- [ ] Complete initial public npm registry release — run `npm stage publish`, review the staged package, and approve it with npm 2FA; verify `npm view blendops version` and a clean consumer install.
- [ ] Empirical verification across the remaining 24 `linked-only` external AI host applications outside CI (`F-08` tracking).

---

## 🛡️ Permanent policy guards (these stay true forever)

- **Runtime status remains `Not Run`** unless a per-path runtime eval evidence file is recorded under `docs/evals/`.
- **Artifact status remains `Not Produced`** unless preview / render / GLB output paths exist on disk AND validation notes are recorded.
- **Packaged skill, plugin listing, marketplace listing remain "Not Published"** unless that surface actually accepts and lists the package — see `docs/distribution-strategy.md`.
- **Arbitrary Python is never the BlendOps user-facing workflow.** This is enforced by `laws/no-arbitrary-python-interface.md`. The runtime paths use LLM-generated Python internally; BlendOps' final product surface stays workflow + validation + evidence.
