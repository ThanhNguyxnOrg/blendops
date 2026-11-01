# Current Repository Audit & Reconciled Truth State (`main`)

> [!IMPORTANT]
> This directory (`docs/audits/current/`) is the **single authoritative source of truth** for the current state of `ThanhNguyxnOrg/blendops`.
> The historical Phase 0 baseline (`54.5 / 100` at commit `3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d`) is preserved immutably in [`../phase-0/baseline-scorecard.json`](../phase-0/baseline-scorecard.json) for historical comparison only.

---

## 1. Historical Baseline vs. Current Repository State

| Metric | Historical Phase 0 Baseline (`3ea3c35`) | Current Reconciled State (`main`) | Status / Change |
| :--- | :---: | :---: | :--- |
| **Overall Measured Score** | `54.5 / 100` | **`87.0 / 100`** | **`+32.5`** (backed by Phases 1, 2, 2.1, 3, 3.1, 3.1.1, 4, 5, 6, 6.1, 7, 8, 8.1, 8.1.1, 9, 10, 10.1, 10.2, 11) |
| **Active P0 Zero-Compensation Blockers** | `3` (`F-01`, `F-02`, `F-04`) | **`0`** | `F-01`, `F-02`, `F-03`, `F-04` **FIXED** |
| **Skills with `Artifact status: Not Run` (`F-01`)** | `30 / 48` | **`0 / 48`** | **FIXED** in Phase 1 + guarded in `scripts/check-docs.mjs` |
| **Extended Template Completeness (`F-05`)** | `8 / 48` skills missing sections | **`0 / 48` skills missing sections** | **FIXED** in Phase 4 + 18-heading guard in `scripts/check-docs.mjs` |
| **Portable ZIP Exporter & Full CI (`F-02`)** | `spawnSync zip ENOENT` | **Pure-Node `fflate` (48/48 ZIPs)** | **FIXED** in Phase 1 + `EVAL.md` verified in Phase 2.1 + isolated `--output-root` in Phase 6.1 |
| **Adapter Registry & Evidence Integrity (`F-08`)** | `16 / 26` targets synced | **`26 / 26` targets synced & guarded** | **PARTIALLY_FIXED** in Phases 1, 3, 7, 10 & 11 (2 `verified-read`, 24 `linked-only`, local installer & packaged CLI verified) |
| **Machine-Readable Contracts (`F-03`)** | `0 / 48` | **`48 / 48` (`full-catalog`)** | **FIXED** in Phase 5 (`Ajv2020` + 371-edge DAG + 0 bare-ID handoffs) |
| **Machine-Readable Eval Suites (`F-04`)** | `0 / 48` (0 runners) | **`48 / 48` (`269` cases in CI)** | **FIXED** in Phase 6 (`0 / 48` prose-only pending) |
| **Bundle Reference Summaries (`F-09`)** | `96` manual summary files | **`96` deterministic generated summaries** | **FIXED** in Phase 8 (`bundles:summaries:build` + `bundles:summaries:check` in CI) |
| **Live LLM / Blender Runtime Evals** | `Not Run` | **`Not Run` / `Not Produced`** | Honest zero-fabrication boundary preserved |

### 1.1 Audit Provenance & Snapshot Basis

Because a Git commit cannot honestly contain its own final commit SHA inside tracked files, `docs/audits/current/*.json` records explicit provenance metadata (`auditProvenance`):

| Provenance Field | Recorded Value | Explanation |
| :--- | :--- | :--- |
| `sourceCommitSha` | `f0804fd64a9fa4f263a9ec59c5de84ed21733747` (`f0804fd`) | Latest verified commit in Git history when the generator executed |
| `workingTreeState` | `dirty` | Whether audited files had uncommitted changes on top of `sourceCommitSha` |
| `snapshotBasis` | `working-tree-on-top-of-source-commit` | Explicit distinction between a clean committed tree and a working tree on top of `sourceCommitSha` |
| `uncommittedChangeCount` | `26` | Count of modified/staged/deleted/untracked repository paths outside `docs/audits/current/**` |
| `auditedInputsSha256` | `64bbebc86d3c60fca447d85ad8c08500dc4c54b72bddeedda036dfd4933085bc` | Deterministic SHA-256 content digest across all manifest-declared repository inputs |

### 1.2 Audited Input Digest Scope & Manifest Governance

The `auditedInputsSha256` digest is governed by [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json):

- **Included Scope (`requiredFiles` + `requiredDirectories`):** Covers [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json) itself, root governance & dependency files (`AGENTS.md`, `README.md`, `TODO.md`, `LICENSE`, `package.json`, `package-lock.json`, `.github/workflows/docs.yml`), core architecture & runtime docs (`docs/README.md`, `docs/start-here.md`, `docs/runtime-stack-strategy.md`, `docs/adapter-registry.md`, `docs/distribution-strategy.md`, etc.), all CLI/validation/compiler/eval/bundle/installer/test scripts (`bin/blendops.mjs`, `scripts/check-docs.mjs`, `scripts/export-claude-skills.mjs`, `scripts/build-registry.mjs`, `scripts/run-evals.mjs`, `scripts/generate-bundle-reference-summaries.mjs`, `scripts/generate-current-audit.mjs`, `scripts/dev-server.mjs`, `scripts/install-skills.mjs`, `scripts/test-phase1.mjs` through `scripts/test-phase11.mjs`), and the complete directory trees `docs/audits/phase-0`, `docs/audits/phase-2`, `docs/audits/phase-2.1`, `docs/audits/phase-3`, `docs/evals`, `docs/install`, `docs/adapters`, `laws`, `packs`, `bundles`, `skills`, `registry`, `evals`, and `schemas`.
- **Excluded Scope (`excludedPrefixes` & `excludedExactPaths`):** Excludes `docs/audits/current/**` (generated output directory to prevent self-referential hashing), `.git/`, `node_modules/`, `dist/`, `.aistudio/`, temporary files, and symbolic links.
- **Digest Algorithm:** Expands all manifest files and directories into a deduplicated, lexicographically sorted list of normalized POSIX relative paths and computes a SHA-256 digest over unambiguous length-prefixed framing (`path:<byteLength>:<relPath>\0content:<byteLength>:\0<bytes>\0`).
- **Adding New Evidence Paths:** Whenever a new file or directory is referenced in `scorecard.json` (`pillars[].evidenceFiles[]`) or `findings.json` (`findings[].evidencePaths[]`), it **must** be covered by `requiredFiles` or `requiredDirectories` in [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json). This invariant is enforced in CI by `scripts/test-phase3.mjs`, `scripts/test-phase6.mjs`, `scripts/test-phase7.mjs`, and `scripts/test-phase8.mjs`.

---

## 2. Finding Lifecycle Summary (`F-01` through `F-10`)

| ID | Priority | Finding | Phase 0 State | Current Status | Verification / Remaining Work |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **F-01** | **P0** | `Artifact status: Not Run` contradiction in 30 skills | `OPEN` | **`FIXED`** | 0/48 skills affected; guarded in `check-docs.mjs` and `test-phase1.mjs`. |
| **F-02** | **P0** | External `zip` binary dependency & partial CI workflow | `OPEN` | **`FIXED`** | Pure-Node `fflate` exports `SKILL.md`, `EVAL.md`, and `references/*` with `--output-root` isolation; `docs.yml` runs `npm run ci`. |
| **F-03** | **P0** | Machine-readable `contract.json` & compiled `registry/` | `OPEN` | **`FIXED`** | 48/48 skills contracted (`4` routing participants + `44` specialist skills), 371-edge acyclic progression graph, and 48/48 relative-path Markdown handoffs. |
| **F-04** | **P0** | Structured behavioral evaluation suites & automated runner | `OPEN` | **`FIXED`** | 48/48 canonical `.eval.json` suites (269 cases: 21 `contract_routing` + 124 `contract_handoff` + 124 `deterministic_fixture`, 0 prose-only pending) verified in CI; `live_model` and `blender_runtime` remain `Not Run`. |
| **F-05** | **P1** | 8 Batch 7/8 skills omit 9–11 extended template sections | `OPEN` | **`FIXED`** | 48/48 skills include all 9 core + 9 extended sections; guarded in `check-docs.mjs` and `test-phase4.mjs`. |
| **F-06** | **P1** | Routing quartet handoffs & `blender-scope-boundary-enforcer` reachability | `OPEN` | **`FIXED`** | Wired in `blendops-help` and `workflow-stage-router` contracts and verified in `workflow-graph.json`. |
| **F-07** | **P1** | Deterministic GLB inspector & Blender version matrices | `OPEN` | **`FIXED`** | `scripts/inspect-glb.mjs`, `scripts/validate-evidence-packet.mjs`, and `docs/blender-version-compatibility.md` verified in CI. |
| **F-08** | **P1** | `docs/adapter-registry.md` drift from 26 `docs/install/` targets | `OPEN` | **`PARTIALLY_FIXED`** | All 26 install targets synced and verified in `docs/evals/adapter-empirical-verification-phase-7.md`; `bin/blendops.mjs`, `scripts/install-skills.mjs`, `scripts/test-phase10.mjs`, and `scripts/test-phase11.mjs` verify safe project-local attachment, rollback, and packaged CLI tarball execution; 2 targets (`claude-code`, `generic-project`) are `verified-read`; 24 targets remain `linked-only` pending live host testing. |
| **F-09** | **P2** | Manual bundle reference summary drift risk | `OPEN` | **`FIXED`** | 96/96 bundle reference summaries (48 Claude Desktop + 48 portable skill package) and `bundles/claude-desktop-manual/manifest.json` deterministically generated and verified via `npm run bundles:summaries:check` and `scripts/test-phase8.mjs`. |
| **F-10** | **P1** | Runtime capability tiers (L0–L3) & scene rollback protocol | `OPEN` | **`FIXED`** | `registry/runtime-capability-policy.json`, `scripts/validate-capability-policy.mjs`, and `docs/safety-model.md` enforce L0–L3 tiers and fail-closed `.blend` backup checks. |

---

## 3. Files in This Directory

- [`scorecard.json`](./scorecard.json) — Reconciled 9-pillar scorecard (**87.0 / 100**) with side-by-side historical baseline comparison and `auditProvenance`.
- [`findings.json`](./findings.json) — Machine-readable lifecycle table for `F-01` through `F-10`.
- [`skill-inventory.json`](./skill-inventory.json) — Live 48-skill inventory reflecting Phase 1 truth-state fixes, Phase 2/2.1/5 full-catalog contracts, Phase 3/6 full-catalog eval coverage, and Phase 4 extended template completion.
- [`eval-inventory.json`](./eval-inventory.json) — Live 48-skill evaluation inventory covering all 48 machine-readable suites (269 cases) with 0 remaining prose-only skills.
- [`verification-manifest.json`](./verification-manifest.json) — Verified commit chain through `f0804fd64a9fa4f263a9ec59c5de84ed21733747`, Phase 10 / 10.1 / 10.2 / 11 provenance context, CI pipeline commands, and runtime/artifact truth states.

## Related Documentation

- Audited Input Digest Manifest: [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json)
- Historical Phase 0 Audit: [`../phase-0/README.md`](../phase-0/README.md)
- Phase 2.1 Hardening Report: [`../phase-2.1/README.md`](../phase-2.1/README.md)
- Phase 3 Evaluation & Roadmap: [`../phase-3/README.md`](../phase-3/README.md)
