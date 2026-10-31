# Current Repository Audit & Reconciled Truth State (`main`)

> [!IMPORTANT]
> This directory (`docs/audits/current/`) is the **single authoritative source of truth** for the current state of `ThanhNguyxnOrg/blendops`.
> The historical Phase 0 baseline (`54.5 / 100` at commit `3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d`) is preserved immutably in [`../phase-0/baseline-scorecard.json`](../phase-0/baseline-scorecard.json) for historical comparison only.

---

## 1. Historical Baseline vs. Current Repository State

| Metric | Historical Phase 0 Baseline (`3ea3c35`) | Current Reconciled State (`main`) | Status / Change |
| :--- | :---: | :---: | :--- |
| **Overall Measured Score** | `54.5 / 100` | **`78.0 / 100`** | **`+23.5`** (backed by Phases 1, 2, 2.1, 3, 3.1, 3.1.1, 4) |
| **Active P0 Zero-Compensation Blockers** | `3` (`F-01`, `F-02`, `F-04`) | **`0`** | `F-01` & `F-02` **FIXED**; `F-04` **PARTIALLY_FIXED** (CI runner active) |
| **Skills with `Artifact status: Not Run` (`F-01`)** | `30 / 48` | **`0 / 48`** | **FIXED** in Phase 1 + guarded in `scripts/check-docs.mjs` |
| **Extended Template Completeness (`F-05`)** | `8 / 48` skills missing sections | **`0 / 48` skills missing sections** | **FIXED** in Phase 4 + 18-heading guard in `scripts/check-docs.mjs` |
| **Portable ZIP Exporter & Full CI (`F-02`)** | `spawnSync zip ENOENT` | **Pure-Node `fflate` (48/48 ZIPs)** | **FIXED** in Phase 1 + `EVAL.md` verified in Phase 2.1 |
| **Adapter Registry Sync (`F-08`)** | `16 / 26` targets synced | **`26 / 26` targets synced** | **PARTIALLY_FIXED** in Phase 1 (20 targets remain `linked-only`) |
| **Machine-Readable Contracts (`F-03`)** | `0 / 48` | **`4 / 48` (`routing-pilot`)** | **PARTIALLY_FIXED** in Phase 2 & 2.1 (`Ajv2020` + 16-state solver) |
| **Machine-Readable Eval Suites (`F-04`)** | `0 / 48` (0 runners) | **`12 / 48` (`73` cases in CI)** | **PARTIALLY_FIXED** in Phase 3 & 3.1 (`36 / 48` prose-only pending) |
| **Live LLM / Blender Runtime Evals** | `Not Run` | **`Not Run` / `Not Produced`** | Honest zero-fabrication boundary preserved |

### 1.1 Audit Provenance & Snapshot Basis

Because a Git commit cannot honestly contain its own final commit SHA inside tracked files, `docs/audits/current/*.json` records explicit provenance metadata (`auditProvenance`):

| Provenance Field | Recorded Value | Explanation |
| :--- | :--- | :--- |
| `sourceCommitSha` | `a5ddece28e71d0ce89f6b7a741214f8832d37ee5` (`a5ddece`) | Latest verified commit in Git history when the generator executed |
| `workingTreeState` | `dirty` | Whether audited files had uncommitted changes on top of `sourceCommitSha` |
| `snapshotBasis` | `working-tree-on-top-of-source-commit` | Explicit distinction between a clean committed tree and a working tree on top of `sourceCommitSha` |
| `uncommittedChangeCount` | `27` | Count of modified/staged/deleted/untracked repository paths outside `docs/audits/current/**` |
| `auditedInputsSha256` | `55832d3ae6e9c54ded68b7639094da094d691fd6da5ca6dcde40cfaa674b54bb` | Deterministic SHA-256 content digest across all manifest-declared repository inputs |

### 1.2 Audited Input Digest Scope & Manifest Governance

The `auditedInputsSha256` digest is governed by [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json):

- **Included Scope (`requiredFiles` + `requiredDirectories`):** Covers [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json) itself, root governance & dependency files (`AGENTS.md`, `README.md`, `TODO.md`, `LICENSE`, `package.json`, `package-lock.json`, `.github/workflows/docs.yml`), core architecture & runtime docs (`docs/README.md`, `docs/start-here.md`, `docs/runtime-stack-strategy.md`, `docs/adapter-registry.md`, etc.), all validation/compiler/eval/test scripts (`scripts/check-docs.mjs`, `scripts/export-claude-skills.mjs`, `scripts/build-registry.mjs`, `scripts/run-evals.mjs`, `scripts/generate-current-audit.mjs`, `scripts/test-phase1.mjs`, `scripts/test-phase2.mjs`, `scripts/test-phase3.mjs`, `scripts/test-phase4.mjs`), and the complete directory trees `docs/audits/phase-0`, `docs/audits/phase-2`, `docs/audits/phase-2.1`, `docs/audits/phase-3`, `docs/evals`, `docs/install`, `docs/adapters`, `laws`, `packs`, `bundles`, `skills`, `registry`, `evals`, and `schemas`.
- **Excluded Scope (`excludedPrefixes` & `excludedExactPaths`):** Excludes `docs/audits/current/**` (generated output directory to prevent self-referential hashing), `.git/`, `node_modules/`, `dist/`, `.aistudio/`, temporary files, and symbolic links.
- **Digest Algorithm:** Expands all manifest files and directories into a deduplicated, lexicographically sorted list of normalized POSIX relative paths and computes a SHA-256 digest over unambiguous length-prefixed framing (`path:<byteLength>:<relPath>\0content:<byteLength>:\0<bytes>\0`).
- **Adding New Evidence Paths:** Whenever a new file or directory is referenced in `scorecard.json` (`pillars[].evidenceFiles[]`) or `findings.json` (`findings[].evidencePaths[]`), it **must** be covered by `requiredFiles` or `requiredDirectories` in [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json). This invariant is enforced in CI by `scripts/test-phase3.mjs`.

---

## 2. Finding Lifecycle Summary (`F-01` through `F-10`)

| ID | Priority | Finding | Phase 0 State | Current Status | Verification / Remaining Work |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **F-01** | **P0** | `Artifact status: Not Run` contradiction in 30 skills | `OPEN` | **`FIXED`** | 0/48 skills affected; guarded in `check-docs.mjs` and `test-phase1.mjs`. |
| **F-02** | **P0** | External `zip` binary dependency & partial CI workflow | `OPEN` | **`FIXED`** | Pure-Node `fflate` exports `SKILL.md`, `EVAL.md`, and `references/*`; `docs.yml` runs `npm run ci`. |
| **F-03** | **P0** | Machine-readable `contract.json` & compiled `registry/` | `OPEN` | **`PARTIALLY_FIXED`** | 4/48 routing skills contracted with `Ajv2020` & 16-state overlap solver; 44/48 skills pending. |
| **F-04** | **P0** | Structured behavioral evaluation suites & automated runner | `OPEN` | **`PARTIALLY_FIXED`** | 12/48 pilot `.eval.json` suites (73 cases) & `scripts/run-evals.mjs` (all 5 predicate operators) in CI; 36/48 prose evals pending. |
| **F-05** | **P1** | 8 Batch 7/8 skills omit 9–11 extended template sections | `OPEN` | **`FIXED`** | 48/48 skills include all 9 core + 9 extended sections; guarded in `check-docs.mjs` and `test-phase4.mjs`. |
| **F-06** | **P1** | Routing quartet handoffs & `blender-scope-boundary-enforcer` reachability | `OPEN` | **`FIXED`** | Wired in `blendops-help` and `workflow-stage-router` contracts and verified in `workflow-graph.json`. |
| **F-07** | **P1** | Deterministic GLB inspector & Blender version matrices | `OPEN` | **`FIXED`** | `scripts/inspect-glb.mjs`, `scripts/validate-evidence-packet.mjs`, and `docs/blender-version-compatibility.md` verified in CI. |
| **F-08** | **P1** | `docs/adapter-registry.md` drift from 26 `docs/install/` targets | `OPEN` | **`PARTIALLY_FIXED`** | All 26 install targets synced in `docs/adapter-registry.md` & `registry/compatibility-matrix.json`; 24 targets remain `linked-only` pending live host testing. |
| **F-09** | **P2** | Manual bundle reference summary drift risk | `OPEN` | **`DEFERRED`** | Deferred until all 48 skills have `contract.json`. |
| **F-10** | **P1** | Runtime capability tiers (L0–L3) & scene rollback protocol | `OPEN` | **`FIXED`** | `registry/runtime-capability-policy.json`, `scripts/validate-capability-policy.mjs`, and `docs/safety-model.md` enforce L0–L3 tiers and fail-closed `.blend` backup checks. |

---

## 3. Files in This Directory

- [`scorecard.json`](./scorecard.json) — Reconciled 9-pillar scorecard (**78.0 / 100**) with side-by-side historical baseline comparison and `auditProvenance`.
- [`findings.json`](./findings.json) — Machine-readable lifecycle table for `F-01` through `F-10`.
- [`skill-inventory.json`](./skill-inventory.json) — Live 48-skill inventory reflecting Phase 1 truth-state fixes, Phase 2/2.1 contracts, Phase 3 pilot eval coverage, and Phase 4 extended template completion.
- [`eval-inventory.json`](./eval-inventory.json) — Live 48-skill evaluation inventory separating the 12 machine-readable pilot suites (73 cases) from the 36 prose-only `EVAL.md` files.
- [`verification-manifest.json`](./verification-manifest.json) — Verified commit chain through `a5ddece28e71d0ce89f6b7a741214f8832d37ee5`, Phase 3 + Phase 4 provenance context, CI pipeline commands, and runtime/artifact truth states.

## Related Documentation

- Audited Input Digest Manifest: [`../audited-inputs.manifest.json`](../audited-inputs.manifest.json)
- Historical Phase 0 Audit: [`../phase-0/README.md`](../phase-0/README.md)
- Phase 2.1 Hardening Report: [`../phase-2.1/README.md`](../phase-2.1/README.md)
- Phase 3 Evaluation & Roadmap: [`../phase-3/README.md`](../phase-3/README.md)
