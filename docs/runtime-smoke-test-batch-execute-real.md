# 🧪 Runtime Smoke Test: batch.execute (first real execution slice)

> 📚 Docs: [Index](./README.md) · [Safety contract](./batch-execute-safety-contract.md) · [Dry-run runtime evidence](./runtime-smoke-test-batch-execute-dry-run.md)

**Operation:** `batch.execute`  
**Status:** First guarded real execution slice (non-destructive allowlist only)  
**Date:** 2026-04-27  
**Blender:** 4.2.5 LTS  
**Mode:** GUI bridge (when runtime available)

---

## Scope of this evidence

This doc records the exact verification criteria for first real execution release:

- dry-run linkage gates are mandatory for real execution:
  - `confirm: "EXECUTE_BATCH"`
  - `dry_run_id: string`
  - `plan_fingerprint: string`
- fingerprint equality is enforced before mutation
- `dry_run_id` format and linkage is validated: must start with `dryrun:<first16hex_of_plan_fingerprint>:<request_id>`
- real execution allowlist is restricted to non-destructive operations only:
  - `scene.inspect`
  - `object.create`
  - `material.create`
  - `material.apply`
  - `lighting.setup`
  - `camera.set`
  - `validate.scene`
- real execution rejects:
  - `scene.clear`, `undo.last`, `render.preview`, `export.asset`
  - bridge lifecycle/status ops
  - nested batch ops
  - forbidden code fields (`python`, `script`, `shell`, `command`, `eval`, `exec`)

---

## Local verification commands (required)

```bash
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm WRONG --dry-run-id x --plan-fingerprint y --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --dry-run-id x --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --plan-fingerprint y --verbose
```

Expected for all above:
- `operation: "cli.invalid_arguments"`
- no bridge call

---

## Runtime verification sequence (bridge available)

```bash
# 1) Start bridge
node apps/cli/dist/index.js bridge start --mode gui --verbose

# 2) Capture pre-state
node apps/cli/dist/index.js scene inspect --verbose

# 3) Dry-run (capture dry_run_id + plan_fingerprint)
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --dry-run --verbose

# 4) Real execute with captured linkage fields
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --dry-run-id <captured> --plan-fingerprint <captured> --verbose

# 5) Capture post-state
node apps/cli/dist/index.js scene inspect --verbose

# 6) Rejection tests
node apps/cli/dist/index.js batch execute --file examples/batch/invalid-scene-clear.json --confirm EXECUTE_BATCH --dry-run-id <captured> --plan-fingerprint <captured> --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --confirm EXECUTE_BATCH --dry-run-id <captured> --plan-fingerprint sha256:deadbeef --verbose

# 7) Stop bridge
node apps/cli/dist/index.js bridge stop
```

Expected:
- valid non-destructive plan: `ok: true`
- per-step receipts present
- `executed_steps` matches executed allowed steps
- `failed_step` is `null` if all pass
- `stopped_on_error: false` if all pass
- rejected plans fail before execution with `executed_steps: 0`

---

## Runtime evidence (2026-04-27)

**Local rejection tests (CLI argument validation):**
- Missing `--confirm`: ✅ rejected with `cli.invalid_arguments`
- Wrong `--confirm` value: ✅ rejected with `cli.invalid_arguments`
- Missing `--plan-fingerprint`: ✅ rejected with `cli.invalid_arguments`
- Missing `--dry-run-id`: ✅ rejected with `cli.invalid_arguments`

**Runtime execution (bridge available):**
- Bridge availability: `available`
- Dry-run dry_run_id: `dryrun:f615eec4987dabc2:req_1777346647119_f9x3fkjtr`
- Dry-run plan_fingerprint: `sha256:f615eec4987dabc2518d87abe46f78716997b5bbd5b2332d00c602df0f649a31`
- Real execute result: `ok: true`
- Real execute executed_steps: `5`
- Real execute failed_step: `null`
- Real execute stopped_on_error: `false`
- Real execute remaining_steps_skipped: `0`
- Real execute step_receipts: `5`
- Scene before object count: `3`
- Scene after object count: `4` (batch_cube created)
- Rejection test (`scene.clear` in real mode): ✅ **PASS** (ok: false, executed_steps: 0)
- Rejection test (fingerprint mismatch): ✅ **PASS** (ok: false, executed_steps: 0)

**Verdict:** ✅ All safety gates enforced. Real execution allowlist verified. Destructive operations rejected before mutation.

---

---

## 🔗 dry_run_id linkage runtime evidence

**Date:** 2026-04-28  
**Blender:** 4.2.5 LTS  
**Mode:** GUI bridge

**Captured linkage fields:**
- Dry-run plan_fingerprint: `sha256:7fed7d5e95670321d3999371292f3c5a83ab3484178383da903d1184f585a2d8`
- Dry-run dry_run_id: `dryrun:7fed7d5e95670321:req_1777358557664_qmfb4ia14`

**Valid real execution (matching linkage):**
- Result: `ok: true`
- Executed steps: `5`
- Failed step: `null`
- Stopped on error: `false`
- Step receipts: `5` (all steps executed)
- Plan fingerprint accepted: ✅
- dry_run_id linkage accepted: ✅

**Wrong dry_run_id prefix rejection:**
- Submitted dry_run_id: `dryrun:0000000000000000:test` (wrong prefix)
- Result: `ok: false`
- Message: `batch.execute dry_run_id linkage validation failed`
- Executed steps: `0`
- Validation error: `dry_run_id must start with dryrun:7fed7d5e95670321:`
- Verdict: ✅ **PASS** (rejected before execution, zero mutation)

**Fingerprint mismatch rejection:**
- Submitted plan_fingerprint: `sha256:0000000000000000000000000000000000000000000000000000000000000000`
- Result: `ok: false`
- Message: `batch.execute plan_fingerprint mismatch`
- Executed steps: `0`
- Verdict: ✅ **PASS** (rejected before execution, zero mutation)

**scene.clear real execution rejection:**
- Operation: `scene.clear` with matching dry_run_id and plan_fingerprint
- Result: `ok: false`
- Message: `batch.execute validation failed`
- Executed steps: `0`
- Validation error: `operation is not allowed in first real batch.execute release`
- Verdict: ✅ **PASS** (rejected by real execution allowlist, zero mutation)

**Scene mutation verification:**
- Object count before: `3`
- Object count after: `4` (batch_cube created)
- Expected: Non-destructive mutation only (object creation allowed)
- Verdict: ✅ **PASS** (only allowed operations executed)

**Linkage validation verdict:** ✅ All dry_run_id linkage gates enforced. Wrong prefix rejected. Fingerprint mismatch rejected. Destructive operations rejected. Non-destructive real execution succeeded with matching linkage.

---

## Current limitation

Persistent dry-run registry validation is future hardening. Current first release enforces exact step identity through recomputed fingerprint equality but does not yet prove `dry_run_id` history persistence server-side.
