# Architecture & Repository Organization

BlendOps is a **portable AI-agent Skills pack and workflow verification layer for Blender**, designed for non-Blender users. It does **not** ship a Blender runtime, MCP server, or Blender add-on; instead, it pairs a structured planning/validation content layer (`skills/`, `laws/`, `packs/`, `bundles/`) with deterministic local CLI tooling (`bin/blendops.mjs`, `scripts/install-skills.mjs`, `scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`) and redirects Blender execution to upstream runtime paths.

---

## 1. Product & Runtime Layer Architecture

```txt
Non-Blender user
  └──> AI coding agent or chat UI (26 supported targets)
        └──> BlendOps workflow & verification layer (this repository)
              ├── 48 portable skills + 4 guardrail laws + 1 pack (`product-hero-v0`)
              ├── Project-local installer & rollback CLI (`bin/blendops.mjs`, `scripts/install-skills.mjs`)
              ├── GLB 2.0 structural inspector & web handoff toolkit (`scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`)
              └── Upstream Blender runtime redirect (2 MCP execution paths + CLI fallback appendix):
                    ├── Path 1 — Official Blender Lab MCP (Blender 5.1+; Lab add-on + Lab server)
                    │     ├── Host (a): Anthropic Blender Connector in Claude Desktop (not standalone; requires Lab add-on)
                    │     └── Host (b): Any other MCP client manually configured
                    ├── Path 2 — Community `mcp-for-blender` (`ahujasid/mcp-for-blender`, Blender 3.0+)
                    └── CLI fallback (appendix) — `blender --background --python` (documented upstream; no in-repo evidence file yet)
                          └──> Blender (external scene mutation, rendering, and GLB export)
                                └──> Web / Three.js / React Three Fiber viewer handoff
```

See [`docs/runtime-stack-strategy.md`](./runtime-stack-strategy.md) for the authoritative 2-path + CLI appendix runtime specification and [`laws/README.md`](../laws/README.md) for the four non-negotiable guardrail laws.

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
│   └── blendops.mjs                      # Distributable CLI entrypoint (`doctor`, `install`, `rollback`, `glb-*`)
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
├── schemas/                              # JSON Schema Draft 2020-12 contracts (7 schemas)
│   ├── adapter-compatibility-matrix.schema.json
│   ├── contract-context-fields.schema.json
│   ├── glb-web-handoff-manifest.schema.json
│   ├── runtime-capability-policy.schema.json
│   ├── runtime-evidence-packet.schema.json
│   ├── skill-contract.schema.json
│   └── skill-eval.schema.json
├── registry/                             # Canonical policy matrices & generated routing graphs
│   ├── compatibility-matrix.json         # Canonical 26-target adapter compatibility matrix
│   ├── contract-context-fields.json      # Canonical routing context field vocabulary
│   ├── runtime-capability-policy.json    # Canonical L0–L3 runtime capability tier policy
│   ├── skills.json                       # [Generated] Aggregated 48-skill contract registry (`npm run registry:build`)
│   └── workflow-graph.json               # [Generated] Deterministic skill handoff & DAG routing graph
├── evals/                                # Deterministic behavioral evaluation suites
│   ├── README.md
│   └── <skill-id>.json                   # 48 machine-readable positive/negative/edge behavioral test suites
├── scripts/                              # Generators, validators, CLI tools, and phase regression test suites
│   ├── build-registry.mjs                # Builds and validates `registry/skills.json` & `registry/workflow-graph.json`
│   ├── check-docs.mjs                    # Enforces frontmatter, runtime model, links, headings, and policy guards
│   ├── dev-server.mjs                    # Local documentation & git bundle verification server (port 3000)
│   ├── export-claude-skills.mjs          # Deterministically exports 48 skill ZIPs + Claude Code folders to `dist/`
│   ├── generate-bundle-reference-summaries.mjs # Generates & verifies 96 dual-profile bundle reference summaries
│   ├── generate-current-audit.mjs        # Reconciles `docs/audits/current/*` with live SHA-256 input provenance
│   ├── generate-glb-handoff-report.mjs   # Generates JSON/Markdown/HTML GLB web handoff reports
│   ├── inspect-glb.mjs                   # Binary GLB 2.0 container & glTF semantic inspector
│   ├── install-skills.mjs                # Safe project-local installer (`--doctor`, `--dry-run`, `--write`, `--rollback`)
│   ├── run-evals.mjs                     # Deterministic behavioral evaluation runner for all 48 skills
│   ├── validate-capability-policy.mjs    # Validates `registry/runtime-capability-policy.json`
│   ├── validate-compatibility-matrix.mjs # Validates `registry/compatibility-matrix.json` against `docs/install/` & `docs/adapters/`
│   ├── validate-evidence-packet.mjs      # Validates runtime evidence packets against truth-state promotion gates
│   ├── validate-repository-architecture.mjs # Validates repository inventory, root policy, duplicates, and reference integrity
│   └── test-phase1.mjs .. test-phase13.mjs # Comprehensive Node test suites (`npm test`)
├── skill-reviews/                        # Skill quality rubrics, depth standards, and historical v0 review reports
│   ├── README.md
│   ├── acceptance-criteria.md
│   ├── blendops-skill-template.md
│   ├── depth-standard.md
│   ├── review-gates.md
│   └── reports/                          # Historical v0 skill depth audit & gate review snapshots
└── docs/                                 # Product hub, runtime setup, install guides, adapters, evals, examples, and audits
    ├── README.md                         # Master documentation hub
    ├── adapters/                         # Verified & drafted project-local adapter mappings (8 files)
    ├── audits/                           # Historical phase audit snapshots (`phase-0`..`phase-3`) + `current/` audit state
    ├── evals/                            # Runtime smoke tests, dry-run install evidence, and manual eval packets (12 files)
    ├── examples/glb-web-handoff/         # Three.js (`threejs-glb-viewer.mjs`) & React Three Fiber (`r3f-glb-viewer.tsx`) viewer modules
    ├── install/                          # Per-target install guides for 26 targets + `installer-spec.md` (28 files)
    ├── recipes/                          # End-to-end 3D scene recipes (`cyberpunk-shoe-hero.md`)
    └── workflows/                        # Canonical multi-skill workflow chains (`full-non-blender-user-workflow.md`, `product-hero-workflow.md`)
```

---

## 3. Canonical Source vs. Generated Artifacts vs. Historical Records

| Classification | Canonical Location(s) | Mutability & Ownership Rule |
|---|---|---|
| **Canonical Source** (`canonical_source`) | `skills/*/{SKILL.md,EVAL.md,contract.json,references/*}`, `laws/*.md`, `packs/*`, `registry/{compatibility-matrix,contract-context-fields,runtime-capability-policy}.json`, `bundles/*/BLENDOPS.md` | Authoritative source of truth. Edited directly and validated by CI. |
| **Generated Artifacts** (`generated_artifact`) | `registry/{skills,workflow-graph}.json`, `bundles/claude-desktop-manual/references/skills/*.md` (48), `bundles/skill-package/blendops/references/skill-*.md` (48), `docs/audits/current/*`, `dist/*` (untracked build output) | Must **never** be hand-edited. Regenerated deterministically by `npm run registry:build`, `npm run bundles:summaries:build`, `node scripts/generate-current-audit.mjs`, and `npm run arch:build`. |
| **Historical Records** (`historical_record`) | `docs/audits/{phase-0,phase-2,phase-2.1,phase-3}/**`, `docs/release-readiness-rollup-v0.md`, `skill-reviews/reports/*`, `docs/evals/*.md`, `CHANGELOG.md` | Preserved for auditability and provenance. Historical snapshots must not be rewritten to falsify past baselines. |
| **Documentation** (`documentation`) | `README.md`, `TODO.md`, `AGENTS.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`, `docs/*.md`, `docs/{install,adapters,recipes,workflows}/*.md` | User-facing and contributor-facing guides; validated for link integrity and runtime model accuracy by `npm run docs:check` and `npm run arch:check`. |
| **Runtime, Build & Test Infrastructure** (`runtime_build_test_infrastructure`) | `scripts/*.mjs`, `evals/*.json`, `docs/examples/glb-web-handoff/*.{mjs,tsx}` | Executed by `npm run ci`, `npm test`, and the `blendops` CLI. |
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

- **Packaged Tarball Scope (`package.json` `"files"`)**: Includes `bin/`, core runtime scripts (`install-skills.mjs`, `export-claude-skills.mjs`, `inspect-glb.mjs`, `generate-glb-handoff-report.mjs`), `docs/examples/glb-web-handoff/`, `skills/`, `laws/`, `packs/`, `bundles/`, `registry/`, `schemas/`, `README.md`, `LICENSE`, and `CHANGELOG.md`. Excludes test suites (`scripts/test-phase*.mjs`), CI generators, dev server, `docs/audits/`, and `.github/`.
- **Permanent Non-Goals**:
  - `"private": true` remains set — npm publication status is `Not Published`.
  - Marketplace/plugin listing status is `Not Published`.
  - Live Blender runtime execution remains `Not Run` and production artifacts remain `Not Produced` unless backed by a formal operator evidence packet under `docs/evals/`.
