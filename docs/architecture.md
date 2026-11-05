# Architecture & Repository Organization

BlendOps is a **portable AI-agent Skills, Knowledge, and Workflow Verification system for Blender**, designed for non-Blender users. It does **not** ship a Blender runtime, MCP server, or Blender add-on; instead, it pairs a governed 5-layer architecture (`skills/`, `registry/knowledge-catalog.json`, `registry/recipe-catalog.json`, `laws/`, `packs/`, `bundles/`) with deterministic local CLI tooling (`bin/blendops.mjs`, `scripts/install-skills.mjs`, `scripts/build-knowledge-catalog.mjs`, `scripts/compile-scene-plan.mjs`, `scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`) and redirects Blender execution to upstream runtime paths.

---

## 1. Five-Layer Architecture & Runtime Boundary

BlendOps enforces a strict separation across five architectural layers:

| Layer | Responsibility | Canonical Artifacts | What Does NOT Belong Here |
|---|---|---|---|
| **A. Skill Layer** | Portable operating workflows (`SKILL.md`), activation boundaries, stage routing, quality gates, and plain-language handoff contracts. | `skills/*/SKILL.md`, `skills/*/contract.json`, `skills/*/EVAL.md`, `registry/skills.json`, `registry/workflow-graph.json` | Duplicated cross-skill reference tables, unverified runtime claims, or raw Python execution dumps. |
| **B. Knowledge Layer** | Reusable, source-attributed 3D domain rules, principles, numeric parameter guidance, observable checks, and version-aware claims across 11 3D domains. | `registry/knowledge-sources.json` (20 sources), `registry/knowledge-catalog.json` (30 `knowledge.*` records), `schemas/knowledge-*.schema.json` | Procedural multi-skill stage routing (belongs in Recipe/Skill layers) or unattributed lore. |
| **C. Recipe Layer & SceneSpec Harmonizer** | Composable multi-stage scene/asset blueprints (`recipe.*`), canonical `SceneSpec` intermediate representation, and the deterministic Skill Harmonizer (`scripts/compile-scene-plan.mjs`) that compiles a `SceneSpec` into an `ExecutionPlan` with 8-level conflict resolution. | `registry/recipe-catalog.json` (10 `recipe.*` records), `schemas/{recipe-record,scene-spec,execution-plan}.schema.json`, `scripts/compile-scene-plan.mjs`, `docs/recipes/cyberpunk-shoe-hero.md`, `packs/product-hero-v0/PACK.md` | Single-skill operating rubrics or live runtime execution transcripts. |
| **D. Runtime / Production Layer** | External execution boundary governed by `L0`–`L3` capability tiers (`registry/runtime-capability-policy.json`), 18 typed operations (`registry/runtime-operations.json`), and transaction/checkpoint orchestration (`scripts/runtime-orchestrator.mjs`). BlendOps redirects to upstream runtimes and never owns a bridge or add-on. | `registry/runtime-capability-policy.json`, `registry/runtime-operations.json`, `schemas/{runtime-session,runtime-operations,operation-execution-ledger}.schema.json`, `scripts/runtime-orchestrator.mjs`, `docs/runtime-stack-strategy.md`, `docs/external-runtime-setup.md` | BlendOps-owned MCP servers, Blender add-ons, or implied execution during skill installation. |
| **E. Evaluation & Evidence Layer** | Deterministic verification of skill routing (`evals/suites/*.eval.json`), catalog retrieval (`evals/catalog-retrieval-evals.json`), SceneSpec compilation (`evals/scene-specs/*.json`), architecture audits (`docs/audits/`), and operator runtime evidence (`docs/evals/`). | `evals/suites/*.eval.json` (48), `evals/catalog-retrieval-evals.json` (90 cases), `evals/scene-specs/*.json` (12 fixtures), `docs/audits/skill-architecture-audit.{json,md}`, `docs/audits/current/*`, `docs/evals/*.md` | Treating schema validity (`authored`/`version-checked`) as live runtime proof (`Not Run` / `Not Produced`). |

```txt
Non-Blender user
  └──> AI coding agent or chat UI (26 supported targets)
        └──> BlendOps 5-Layer Knowledge, Recipe & Skill System (this repository)
              ├── Layer A (Skills): 48 portable skills + 4 guardrail laws + deterministic DAG (`registry/workflow-graph.json`)
              ├── Layer B (Knowledge): 30 `knowledge.*` records across 11 3D domains + 20 `source.*` citations (`registry/knowledge-catalog.json`)
              ├── Layer C (Recipes & SceneSpec Harmonizer): 10 `recipe.*` blueprints + `SceneSpec` -> `ExecutionPlan` compiler (`scripts/compile-scene-plan.mjs`)
              ├── Layer D (Runtime Boundary & Production Layer): L0–L3 capability policy + 18 typed operations (`registry/runtime-operations.json`) + transaction/checkpoint orchestrator (`scripts/runtime-orchestrator.mjs`) + upstream redirect (Path 1 Lab MCP 5.1+, Path 2 `mcp-for-blender` 3.0+, CLI appendix)
              └── Layer E (Evaluation & Evidence): 48 skill eval suites + 90 catalog retrieval evals + 12 SceneSpec fixtures + GLB 2.0 inspector & web handoff toolkit
```

See [`docs/runtime-stack-strategy.md`](./runtime-stack-strategy.md) for the authoritative 2-path + CLI appendix runtime specification, [`docs/knowledge-and-recipe-catalog.md`](./knowledge-and-recipe-catalog.md) for the human-readable Knowledge & Recipe Catalog, and [`docs/audits/skill-architecture-audit.md`](./audits/skill-architecture-audit.md) for the 48-skill and 151-reference architecture reconciliation audit.

---

## 2. Repository Directory Architecture

Every tracked file in the repository belongs to an explicit subsystem and classification (`canonical_source`, `generated_artifact`, `historical_record`, `documentation`, `runtime_build_test_infrastructure`, `distribution_artifact`, or `configuration`), validated in CI by `scripts/validate-repository-architecture.mjs` (`npm run arch:check`) and recorded in [`docs/audits/current/repository-inventory.json`](./audits/current/repository-inventory.json).

```txt
blendops/
├── .editorconfig                         # Editor formatting rules (UTF-8, LF, 2-space indent)
├── .gitattributes                        # Cross-platform line-ending & binary file attributes
├── .gitignore                            # Local build, cache, runtime, and scratch exclusions
├── .github/                              # GitHub governance, templates, assets, and CI workflows
│   ├── ISSUE_TEMPLATE/                   # Bug report & feature request intake templates
│   ├── assets/                           # Brand marks & README social preview images
│   ├── workflows/                        # CI workflows (`docs.yml`, `auto-assign.yml`, `auto-merge-dependabot.yml`)
│   ├── dependabot.yml                    # Weekly dependency update configuration
│   └── pull_request_template.md          # Pre-PR verification checklist
├── AGENTS.md                             # Mandatory rules for AI agents modifying this repository
├── CHANGELOG.md                          # Chronological release and phase history
├── CODE_OF_CONDUCT.md                    # Contributor Covenant code of conduct
├── CONTRIBUTING.md                       # Contributor guide and required pre-PR checks
├── LICENSE                               # MIT License
├── README.md                             # Product landing page and 30-second universal install prompt
├── SECURITY.md                           # Vulnerability reporting and safety policy
├── SUPPORT.md                            # User and contributor support guide
├── TODO.md                               # Roadmap, completed milestones, and permanent policy guards
├── package.json                          # Package manifest (`"private": true`), CLI bin, and CI scripts
├── package-lock.json                     # Deterministic npm dependency lockfile
├── bin/
│   └── blendops.mjs                      # Distributable CLI entrypoint (`doctor`, `install`, `rollback`, `glb-*`, `catalog-*`, `scene-spec-validate`, `plan-*`, `runtime`, `operation`, `execution`)
├── skills/                               # 48 canonical skills + `_template/` authoring template
│   ├── README.md                         # Canonical 48-skill catalog index
│   ├── _template/                        # Skill & eval authoring template (`SKILL.md`, `EVAL.md`)
│   └── <skill-id>/                       # Each skill: `SKILL.md`, `EVAL.md`, `contract.json`, `references/*.md`
├── laws/                                 # 4 non-negotiable guardrail laws
│   ├── README.md
│   ├── evidence-before-done.md
│   ├── no-arbitrary-python-interface.md
│   ├── non-blender-user-language.md
│   └── official-runtime-only.md
├── packs/                                # Multi-skill domain workflow packs
│   ├── README.md
│   └── product-hero-v0/PACK.md
├── bundles/                              # Offline & project-local attachment bundles
│   ├── generic-project-local/            # Project-local attachment template (`BLENDOPS.md`, `ROLLBACK.md`, `manifest.json`)
│   ├── claude-desktop-manual/            # Claude Desktop manual bundle + 48 generated skill reference summaries
│   └── skill-package/blendops/           # Standalone portable upload package + 48 generated skill reference summaries
├── schemas/                              # JSON Schema Draft 2020-12 contracts (15 schemas)
│   ├── adapter-compatibility-matrix.schema.json
│   ├── contract-context-fields.schema.json
│   ├── execution-plan.schema.json
│   ├── glb-web-handoff-manifest.schema.json
│   ├── knowledge-record.schema.json
│   ├── knowledge-source-registry.schema.json
│   ├── operation-execution-ledger.schema.json
│   ├── recipe-record.schema.json
│   ├── runtime-capability-policy.schema.json
│   ├── runtime-evidence-packet.schema.json
│   ├── runtime-operations.schema.json
│   ├── runtime-session.schema.json
│   ├── scene-spec.schema.json
│   ├── skill-contract.schema.json
│   └── skill-eval.schema.json
├── registry/                             # Canonical policy matrices, knowledge/recipe catalogs & generated indices
│   ├── compatibility-matrix.json         # Canonical 26-target adapter compatibility matrix
│   ├── contract-context-fields.json      # Canonical routing context field vocabulary
│   ├── knowledge-sources.json            # Canonical 20-source citation registry & controlled domain taxonomy
│   ├── knowledge-catalog.json            # Canonical 30-record 3D domain knowledge catalog (`knowledge.*`)
│   ├── recipe-catalog.json               # Canonical 10-record multi-stage recipe catalog (`recipe.*`)
│   ├── runtime-capability-policy.json    # Canonical L0–L3 runtime capability tier policy
│   ├── runtime-operations.json           # Canonical 18-operation typed runtime operation registry (`op.*`) + blocked L3 interfaces
│   ├── catalog-index.json                # [Generated] Deterministic search & cross-reference index (`npm run catalog:build`)
│   ├── skills.json                       # [Generated] Aggregated 48-skill contract registry (`npm run registry:build`)
│   └── workflow-graph.json               # [Generated] Deterministic skill handoff & DAG routing graph
├── evals/                                # Deterministic behavioral, catalog retrieval & SceneSpec evaluation suites
│   ├── README.md
│   ├── catalog-retrieval-evals.json      # 90-case deterministic bilingual knowledge & recipe retrieval evaluation suite
│   ├── scene-specs/*.json                # 12 canonical SceneSpec fixtures (8 valid + 4 negative/conflicting)
│   └── suites/<skill-id>.eval.json       # 48 machine-readable positive/negative/edge behavioral test suites
├── scripts/                              # Generators, validators, CLI tools, and phase regression test suites
│   ├── build-knowledge-catalog.mjs       # Validates & builds `registry/catalog-index.json`, `docs/knowledge-and-recipe-catalog.md`, and `docs/audits/skill-architecture-audit.{json,md}`
│   ├── build-registry.mjs                # Builds and validates `registry/skills.json` & `registry/workflow-graph.json`
│   ├── check-docs.mjs                    # Enforces frontmatter, runtime model, links, headings, and policy guards
│   ├── compile-scene-plan.mjs            # Deterministic SceneSpec validator, Skill Harmonizer, and ExecutionPlan compiler
│   ├── dev-server.mjs                    # Local documentation & git bundle verification server (port 3000)
│   ├── export-claude-skills.mjs          # Deterministically exports 48 skill ZIPs + Claude Code folders + shared catalog ZIP to `dist/`
│   ├── generate-bundle-reference-summaries.mjs # Generates & verifies 96 dual-profile bundle reference summaries
│   ├── generate-current-audit.mjs        # Reconciles `docs/audits/current/*` with live SHA-256 input provenance
│   ├── generate-glb-handoff-report.mjs   # Generates JSON/Markdown/HTML GLB web handoff reports
│   ├── inspect-glb.mjs                   # Binary GLB 2.0 container & glTF semantic inspector
│   ├── install-skills.mjs                # Safe project-local installer & CLI (`--doctor`, `--dry-run`, `--write`, `--rollback`, `glb-*`, `catalog-*`, `scene-spec-validate`, `plan-*`, `runtime`, `operation`, `execution`)
│   ├── run-evals.mjs                     # Deterministic behavioral evaluation runner for all 48 skills
│   ├── runtime-orchestrator.mjs          # Runtime session discovery, typed operation registry validator, checkpoint/rollback transaction orchestrator, and CLI subcommands
│   ├── validate-capability-policy.mjs    # Validates `registry/runtime-capability-policy.json`
│   ├── validate-compatibility-matrix.mjs # Validates `registry/compatibility-matrix.json` against `docs/install/` & `docs/adapters/`
│   ├── validate-evidence-packet.mjs      # Validates runtime evidence packets against truth-state promotion gates
│   ├── validate-repository-architecture.mjs # Validates repository inventory, root policy, duplicates, and reference integrity
│   └── test-phase1.mjs .. test-phase16.mjs # Comprehensive Node test suites (`npm test`)
├── skill-reviews/                        # Skill quality rubrics, depth standards, and historical v0 review reports
│   ├── README.md
│   ├── acceptance-criteria.md
│   ├── blendops-skill-template.md
│   ├── depth-standard.md
│   ├── review-gates.md
│   └── reports/                          # Historical v0 skill depth audit & gate review snapshots
└── docs/                                 # Product hub, runtime setup, install guides, adapters, evals, examples, and audits
    ├── README.md                         # Master documentation hub
    ├── knowledge-and-recipe-catalog.md   # [Generated] Human-readable index of 10 recipes, 30 knowledge records, and 20 sources
    ├── adapters/                         # Verified & drafted project-local adapter mappings (8 files)
    ├── audits/                           # Historical phase audit snapshots (`phase-0`..`phase-3`), `skill-architecture-audit.{json,md}`, + `current/` audit state
    ├── evals/                            # Runtime smoke tests, dry-run install evidence, and manual eval packets (12 files)
    ├── examples/glb-web-handoff/         # Three.js (`threejs-glb-viewer.mjs`) & React Three Fiber (`r3f-glb-viewer.tsx`) viewer modules
    ├── install/                          # Per-target install guides for 26 targets + `installer-spec.md` (28 files)
    ├── recipes/                          # End-to-end 3D scene scenario recipes (`cyberpunk-shoe-hero.md`)
    └── workflows/                        # Canonical multi-skill workflow chains (`full-non-blender-user-workflow.md`, `product-hero-workflow.md`)
```

---

## 3. Canonical Source vs. Generated Artifacts vs. Historical Records

| Classification | Canonical Location(s) | Mutability & Ownership Rule |
|---|---|---|
| **Canonical Source** (`canonical_source`) | `skills/*/{SKILL.md,EVAL.md,contract.json,references/*}`, `laws/*.md`, `packs/*`, `registry/{compatibility-matrix,contract-context-fields,knowledge-sources,knowledge-catalog,recipe-catalog,runtime-capability-policy,runtime-operations}.json`, `bundles/*/BLENDOPS.md` | Authoritative source of truth. Edited directly and validated by CI. |
| **Generated Artifacts** (`generated_artifact`) | `registry/{skills,workflow-graph,catalog-index}.json`, `docs/knowledge-and-recipe-catalog.md`, `docs/audits/skill-architecture-audit.{json,md}`, `bundles/claude-desktop-manual/references/skills/*.md` (48), `bundles/skill-package/blendops/references/skill-*.md` (48), `docs/audits/current/*`, `dist/*` (untracked build output) | Must **never** be hand-edited. Regenerated deterministically by `npm run catalog:build`, `npm run registry:build`, `npm run bundles:summaries:build`, `node scripts/generate-current-audit.mjs`, and `npm run arch:build`. |
| **Historical Records** (`historical_record`) | `docs/audits/{phase-0,phase-2,phase-2.1,phase-3}/**`, `docs/release-readiness-rollup-v0.md`, `skill-reviews/reports/*`, `docs/evals/*.md`, `CHANGELOG.md` | Preserved for auditability and provenance. Historical snapshots must not be rewritten to falsify past baselines. |
| **Documentation** (`documentation`) | `README.md`, `TODO.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `docs/*.md`, `docs/{install,adapters,recipes,workflows}/*.md` | User-facing and contributor-facing guides; validated for link integrity and runtime model accuracy by `npm run docs:check` and `npm run arch:check`. |
| **Runtime, Build & Test Infrastructure** (`runtime_build_test_infrastructure`) | `scripts/*.mjs`, `evals/*.json`, `evals/suites/*.eval.json`, `docs/examples/glb-web-handoff/*.{mjs,tsx}` | Executed by `npm run ci`, `npm test`, and the `blendops` CLI. |
| **Distribution Artifacts** (`distribution_artifact`) | `bin/blendops.mjs`, `bundles/*/manifest.json`, `bundles/skill-package/blendops/**` | Packaged into local `npm pack` tarballs and offline skill bundles. |
| **Configuration** (`configuration`) | `package.json`, `package-lock.json`, `.gitignore`, `.gitattributes`, `.editorconfig`, `.github/**`, `schemas/*.schema.json`, `docs/audits/audited-inputs.manifest.json` | Governs tooling, schema validation, CI matrix execution, and repository hygiene. |

---

## 4. Duplicate & Near-Duplicate Policy

1. **Single Approved Exact Content Duplicate**:
   - `LICENSE` (root MIT license) and `bundles/skill-package/blendops/LICENSE.txt` are byte-for-byte identical (`SHA-256: 25df86f7dc59...`) so that `bundles/skill-package/blendops/` remains legally self-contained when distributed as a standalone upload folder.
   - Any other exact duplicate tracked file is rejected by `scripts/validate-repository-architecture.mjs`.
2. **Dual-Profile Generated Bundle Reference Summaries**:
   - `bundles/claude-desktop-manual/references/skills/<id>.md` (48 files) and `bundles/skill-package/blendops/references/skill-<id>.md` (48 files) are generated deterministically from `skills/<id>/SKILL.md` and `skills/<id>/contract.json` by `scripts/generate-bundle-reference-summaries.mjs` and verified in CI (`npm run bundles:summaries:check`).

---

## 5. npm Packaging & Permanent Scope Boundaries

- **Packaged Tarball Scope (`package.json` `"files"`)**: Includes `bin/`, core runtime scripts (`install-skills.mjs`, `build-knowledge-catalog.mjs`, `compile-scene-plan.mjs`, `runtime-orchestrator.mjs`, `validate-capability-policy.mjs`, `validate-evidence-packet.mjs`, `export-claude-skills.mjs`, `inspect-glb.mjs`, `generate-glb-handoff-report.mjs`), `docs/knowledge-and-recipe-catalog.md`, `docs/recipes/`, `docs/workflows/`, `docs/examples/glb-web-handoff/`, `skills/`, `laws/`, `packs/`, `bundles/`, `registry/`, `schemas/`, `README.md`, `LICENSE`, and `CHANGELOG.md`. Excludes test suites (`scripts/test-phase*.mjs`), CI-only audit generators, dev server, `docs/audits/`, `evals/`, and `.github/`.
- **Permanent Non-Goals**:
  - `"private": true` remains set — npm publication status is `Not Published`.
  - Marketplace/plugin listing status is `Not Published`.
  - Live Blender runtime execution remains `Not Run` and production artifacts remain `Not Produced` unless backed by a formal operator evidence packet under `docs/evals/`.

