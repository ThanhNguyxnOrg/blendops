# Current Repository Audit & Reconciled Truth State (`main`)

> [!IMPORTANT]
> This directory (`docs/audits/current/`) is the **single authoritative source of truth** for the current state of `ThanhNguyxnOrg/blendops`.
> The historical Phase 0 baseline (`54.5 / 100` at commit `3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d`) is preserved immutably in [`../phase-0/baseline-scorecard.json`](../phase-0/baseline-scorecard.json) for historical comparison only.

---

## 1. Historical Baseline vs. Current Repository State

| Metric | Historical Phase 0 Baseline (`3ea3c35`) | Current Reconciled State (`main`) | Status / Change |
| :--- | :---: | :---: | :--- |
| **Overall Measured Score** | `54.5 / 100` | **`70.0 / 100`** | **`+15.5`** (backed by Phases 1, 2, 2.1, 3) |
| **Active P0 Zero-Compensation Blockers** | `3` (`F-01`, `F-02`, `F-04`) | **`0`** | `F-01` & `F-02` **FIXED**; `F-04` **PARTIALLY_FIXED** (CI runner active) |
| **Skills with `Artifact status: Not Run` (`F-01`)** | `30 / 48` | **`0 / 48`** | **FIXED** in Phase 1 + guarded in `scripts/check-docs.mjs` |
| **Portable ZIP Exporter & Full CI (`F-02`)** | `spawnSync zip ENOENT` | **Pure-Node `fflate` (48/48 ZIPs)** | **FIXED** in Phase 1 + `EVAL.md` verified in Phase 2.1 |
| **Adapter Registry Sync (`F-08`)** | `16 / 26` targets synced | **`26 / 26` targets synced** | **PARTIALLY_FIXED** in Phase 1 (20 targets remain `linked-only`) |
| **Machine-Readable Contracts (`F-03`)** | `0 / 48` | **`4 / 48` (`routing-pilot`)** | **PARTIALLY_FIXED** in Phase 2 & 2.1 (`Ajv2020` + 16-state solver) |
| **Machine-Readable Eval Suites (`F-04`)** | `0 / 48` (0 runners) | **`12 / 48` (`73` cases in CI)** | **PARTIALLY_FIXED** in Phase 3 (`36 / 48` prose-only pending) |
| **Live LLM / Blender Runtime Evals** | `Not Run` | **`Not Run` / `Not Produced`** | Honest zero-fabrication boundary preserved |

---

## 2. Finding Lifecycle Summary (`F-01` through `F-10`)

| ID | Priority | Finding | Phase 0 State | Current Status | Verification / Remaining Work |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **F-01** | **P0** | `Artifact status: Not Run` contradiction in 30 skills | `OPEN` | **`FIXED`** | 0/48 skills affected; guarded in `check-docs.mjs` and `test-phase1.mjs`. |
| **F-02** | **P0** | External `zip` binary dependency & partial CI workflow | `OPEN` | **`FIXED`** | Pure-Node `fflate` exports `SKILL.md`, `EVAL.md`, and `references/*`; `docs.yml` runs `npm run ci`. |
| **F-03** | **P0** | Machine-readable `contract.json` & compiled `registry/` | `OPEN` | **`PARTIALLY_FIXED`** | 4/48 routing skills contracted with `Ajv2020` & 16-state overlap solver; 44/48 skills pending. |
| **F-04** | **P0** | Structured behavioral evaluation suites & automated runner | `OPEN` | **`PARTIALLY_FIXED`** | 12/48 pilot `.eval.json` suites (73 cases) & `scripts/run-evals.mjs` in CI; 36/48 prose evals pending. |
| **F-05** | **P1** | 8 Batch 7/8 skills omit 9–11 extended template sections | `OPEN` | **`OPEN`** | 8/48 skills still omit extended template sections; tracked in `skill-inventory.json`. |
| **F-06** | **P1** | Routing quartet handoffs & `blender-scope-boundary-enforcer` reachability | `OPEN` | **`FIXED`** | Wired in `blendops-help` and `workflow-stage-router` contracts and verified in `workflow-graph.json`. |
| **F-07** | **P1** | Deterministic GLB inspector & Blender version matrices | `OPEN` | **`OPEN`** | Scoped in Phase 3 Roadmap E1 (`docs/audits/phase-3/README.md`). |
| **F-08** | **P1** | `docs/adapter-registry.md` drift from 26 `docs/install/` targets | `OPEN` | **`PARTIALLY_FIXED`** | All 26 install targets synced & guarded in CI; empirical Tier 1/2/3 host testing in Roadmap E4. |
| **F-09** | **P2** | Manual bundle reference summary drift risk | `OPEN` | **`DEFERRED`** | Deferred until all 48 skills have `contract.json`. |
| **F-10** | **P1** | Runtime capability tiers (L0–L3) & scene rollback protocol | `OPEN` | **`OPEN`** | Scoped in Phase 3 Roadmap E3 (`docs/audits/phase-3/README.md`). |

---

## 3. Files in This Directory

- [`scorecard.json`](./scorecard.json) — Reconciled 9-pillar scorecard (**70.0 / 100**) with side-by-side historical baseline comparison.
- [`findings.json`](./findings.json) — Machine-readable lifecycle table for `F-01` through `F-10`.
- [`skill-inventory.json`](./skill-inventory.json) — Live 48-skill inventory reflecting Phase 1 truth-state fixes, Phase 2/2.1 contracts, and Phase 3 pilot eval coverage.
- [`eval-inventory.json`](./eval-inventory.json) — Live 48-skill evaluation inventory separating the 12 machine-readable pilot suites (73 cases) from the 36 prose-only `EVAL.md` files.
- [`verification-manifest.json`](./verification-manifest.json) — Verified commit chain, CI pipeline commands, and runtime/artifact truth states.

## Related Documentation

- Historical Phase 0 Audit: [`../phase-0/README.md`](../phase-0/README.md)
- Phase 2.1 Hardening Report: [`../phase-2.1/README.md`](../phase-2.1/README.md)
- Phase 3 Evaluation & Roadmap: [`../phase-3/README.md`](../phase-3/README.md)
