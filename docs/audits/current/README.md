# Current Repository Audit & Release Verification (`v1.0.0`)

> [!IMPORTANT]
> This directory (`docs/audits/current/`) is the **single authoritative source of truth** for the reconciled static verification state of `ThanhNguyxnOrg/blendops` (`v1.0.0`).
> Initial baseline metrics (`54.5 / 100` at commit `3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d`) are embedded for historical comparison only.

---

## 1. Historical Baseline vs. Production v1.0.0 State

| Metric | Initial Baseline (`3ea3c35`) | Current Reconciled State (`v1.0.0`) | Status / Change |
| :--- | :---: | :---: | :--- |
| **Overall Measured Score** | `54.5 / 100` | **`87.0 / 100`** | **`+32.5`** (backed by schemas, registries, CLI tooling, and CI suites) |
| **Active P0 Zero-Compensation Blockers** | `3` (`F-01`, `F-02`, `F-04`) | **`0`** | `F-01`, `F-02`, `F-03`, `F-04` **FIXED** |
| **Skills with `Artifact status: Not Run` (`F-01`)** | `30 / 14` | **`0 / 14`** | **FIXED** & guarded in `scripts/check-docs.mjs` |
| **Extended Template Completeness (`F-05`)** | `8 / 14` skills missing sections | **`0 / 14` skills missing sections** | **FIXED** (18-heading guard in `scripts/check-docs.mjs`) |
| **Portable ZIP Exporter & Full CI (`F-02`)** | `spawnSync zip ENOENT` | **Pure-Node `fflate` (14/14 ZIPs)** | **FIXED** (isolated `--output-root` + full `npm run ci`) |
| **Adapter Registry & Evidence Integrity (`F-08`)** | `16 / 26` targets synced | **`26 / 26` targets synced & guarded** | **PARTIALLY_FIXED** (2 `verified-read`, 24 `linked-only`, CLI installer verified) |
| **Machine-Readable Contracts (`F-03`)** | `0 / 14` | **`14 / 14` (`full-catalog`)** | **FIXED** (`Ajv2020` + 195-edge DAG + 0 bare-ID handoffs) |
| **Machine-Readable Eval Suites (`F-04`)** | `0 / 14` (0 runners) | **`14 / 14` (`269` cases in CI)** | **FIXED** (0 unmigrated prose suites) |
| **Bundle Reference Summaries (`F-09`)** | `28` manual summary files | **`28` deterministic generated summaries** | **FIXED** (`bundles:summaries:build` + `bundles:summaries:check` in CI) |
| **Live LLM / Blender Runtime Evals** | `Not Run` | **`Not Run` / `Not Produced`** | Honest zero-fabrication boundary preserved |

### 1.1 Audit Provenance & Snapshot Basis

Because a Git commit cannot honestly contain its own final commit SHA inside tracked files, `docs/audits/current/*.json` records explicit provenance metadata (`auditProvenance`):

| Provenance Field | Recorded Value | Explanation |
| :--- | :--- | :--- |
| `sourceCommitSha` | `657b5ba04235997d2212cee5f9cd2a2e3cfadaf8` (`657b5ba`) | Latest verified commit in Git history when the generator executed |
| `workingTreeState` | `dirty` | Whether audited files had uncommitted changes on top of `sourceCommitSha` |
| `snapshotBasis` | `working-tree-on-top-of-source-commit` | Explicit distinction between a clean committed tree and a working tree on top of `sourceCommitSha` |
| `uncommittedChangeCount` | `601` | Count of modified/staged/deleted/untracked repository paths outside `docs/audits/current/**` |
| `auditedInputsSha256` | `cf468efb106ed7c0c67c1a768ed181a2b7b0818f52c8cf63b4bea79dcc526fb2` | Deterministic SHA-256 content digest across all manifest-declared repository inputs |

### 1.2 Audited Input Digest Scope & Manifest Governance

The `auditedInputsSha256` digest is governed by [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json):

- **Included Scope (`requiredFiles` + `requiredDirectories`):** Covers [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json), root governance & dependency files, core architecture & runtime docs, all CLI/validation/compiler/eval/bundle/installer/test scripts (`scripts/test-*.mjs`), and the complete directory trees `docs/evals`, `docs/examples/handing-off-glb-to-web`, `docs/install`, `docs/adapters`, `docs/recipes`, `docs/workflows`, `laws`, `packs`, `bundles`, `skills`, `registry`, `evals`, and `schemas`.
- **Excluded Scope (`excludedPrefixes` & `excludedExactPaths`):** Excludes `docs/audits/current/**`, `.git/`, `node_modules/`, `dist/`, `.aistudio/`, temporary files, and symbolic links.
- **Digest Algorithm:** Expands all manifest files and directories into a deduplicated, lexicographically sorted list of normalized POSIX relative paths and computes a SHA-256 digest over unambiguous length-prefixed framing.

---

## 2. Finding Lifecycle Summary (`F-01` through `F-10`)

| ID | Priority | Finding | Baseline State | Current Status | Verification / Remaining Work |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **F-01** | **P0** | `Artifact status: Not Run` contradiction in 30 skills | `OPEN` | **`FIXED`** | 0/14 skills affected; guarded in `check-docs.mjs` and `test-skills-export.mjs`. |
| **F-02** | **P0** | External `zip` binary dependency & partial CI workflow | `OPEN` | **`FIXED`** | Pure-Node `fflate` exports `SKILL.md`, `EVAL.md`, and `references/*` with `--output-root` isolation; `docs.yml` runs `npm run ci`. |
| **F-03** | **P0** | Machine-readable `contract.json` & compiled `registry/` | `OPEN` | **`FIXED`** | 14/14 skills contracted (`4` routing participants + `44` specialist skills), 195-edge acyclic progression graph, and 14/14 relative-path Markdown handoffs. |
| **F-04** | **P0** | Structured behavioral evaluation suites & automated runner | `OPEN` | **`FIXED`** | 14/14 canonical `.eval.json` suites (269 cases: 35 `contract_routing` + 70 `contract_handoff` + 164 `deterministic_fixture`, 0 prose-only pending) verified in CI; `live_model` and `blender_runtime` remain `Not Run`. |
| **F-05** | **P1** | 8 skills omit 9–11 extended template sections | `OPEN` | **`FIXED`** | 14/14 skills include all 9 core + 9 extended sections; guarded in `check-docs.mjs` and `test-skill-templates.mjs`. |
| **F-06** | **P1** | Routing quartet handoffs & `defining-done-and-gates` reachability | `OPEN` | **`FIXED`** | Wired in `using-blendops` and `using-blendops` contracts and verified in `workflow-graph.json`. |
| **F-07** | **P1** | Deterministic GLB inspector & Blender version matrices | `OPEN` | **`FIXED`** | `scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`, `schemas/glb-web-handoff-manifest.schema.json`, `docs/examples/handing-off-glb-to-web/`, `scripts/validate-evidence-packet.mjs`, and `docs/blender-version-compatibility.md` verified in CI. |
| **F-08** | **P1** | `docs/adapter-registry.md` drift from 26 `docs/install/` targets | `OPEN` | **`PARTIALLY_FIXED`** | All 26 install targets synced and verified in `docs/evals/adapter-empirical-verification.md`; `bin/blendops.mjs`, `scripts/install-skills.mjs`, `scripts/test-project-installer.mjs`, and `scripts/test-cli-package.mjs` verify safe project-local attachment, rollback, and packaged CLI tarball execution; 2 targets (`claude-code`, `generic-project`) are `verified-read`; 24 targets remain `linked-only` pending live host testing. |
| **F-09** | **P2** | Manual bundle reference summary drift risk | `OPEN` | **`FIXED`** | 28/28 bundle reference summaries (14 Claude Desktop + 14 portable skill package) and `bundles/claude-desktop-manual/manifest.json` deterministically generated and verified via `npm run bundles:summaries:check` and `scripts/test-bundle-summaries.mjs`. |
| **F-10** | **P1** | Runtime capability tiers (L0–L3) & scene rollback protocol | `OPEN` | **`FIXED`** | `registry/runtime-capability-policy.json`, `scripts/validate-capability-policy.mjs`, and `docs/safety-model.md` enforce L0–L3 tiers and fail-closed `.blend` backup checks. |

---

## 3. Files in This Directory

- [`scorecard.json`](./scorecard.json) — Reconciled 9-pillar scorecard (**87.0 / 100**) with initial baseline comparison and `auditProvenance`.
- [`findings.json`](./findings.json) — Machine-readable lifecycle table for `F-01` through `F-10`.
- [`skill-inventory.json`](./skill-inventory.json) — Live 14-skill inventory reflecting truth-state fixes, full-catalog contracts, eval coverage, and template completion.
- [`eval-inventory.json`](./eval-inventory.json) — Live 14-skill evaluation inventory covering all 14 machine-readable suites (269 cases) with 0 remaining prose-only skills.
- [`verification-manifest.json`](./verification-manifest.json) — Verified provenance context, CI pipeline commands, and runtime/artifact truth states.
- [`repository-inventory.json`](./repository-inventory.json) — Complete machine-readable inventory classifying every tracked repository file across 7 canonical categories.

## Related Documentation

- Repository Architecture & Directory Guide: [`../../architecture.md`](../../architecture.md)
- Audited Input Digest Manifest: [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json)
- Release Readiness Matrix: [`../../release-readiness.md`](../../release-readiness.md)
