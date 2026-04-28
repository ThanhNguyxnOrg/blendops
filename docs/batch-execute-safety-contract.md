# 🛡️ Batch Execute Safety Contract (Real Execution)

> 📚 Docs: [Index](./README.md) · [AI usage](./ai-agent-usage.md) · [Batch execute dry-run evidence](./runtime-smoke-test-batch-execute-dry-run.md)

**Status:** Implemented for first guarded real execution slice (non-destructive operations only).  
**Scope:** Mandatory safety contract for dry-run linkage + first real execution behavior.

---

## 1) Hard preconditions (execution gate)

Real `batch.execute` must be rejected unless **all** conditions below are true.

1. **Dry-run first is mandatory**
   - Real execution request must include both `dry_run_id` and `plan_fingerprint`.
   - Real execution recomputes fingerprint from submitted steps and requires exact equality with submitted `plan_fingerprint`.
   - On mismatch, execution is rejected with `ok: false`, `executed_steps: 0`, and zero mutation.
   - **Current limitation:** persistent server-side dry-run registry verification (`dry_run_id` existence/history validation) is not yet implemented; this remains future hardening.

2. **Global confirmation token is mandatory**
   - Real execution must require an explicit top-level confirmation token (for example `confirm: "EXECUTE_BATCH"`).
   - Missing/wrong token must return `ok: false` and execute **zero** steps.

3. **Typed operations only (no arbitrary code)**
   - Reject any payload containing forbidden fields such as `python`, `script`, `shell`, `command`, `eval`, `exec`.
   - Reject non-whitelisted operations and bridge lifecycle/self-referential batch ops.

4. **First real execution slice is non-destructive only**
   - Real execution allowlist is restricted to:
     - `scene.inspect`
     - `object.create`
     - `material.create`
     - `material.apply`
     - `lighting.setup`
     - `camera.set`
     - `validate.scene`
   - Real execution must reject destructive/output/stateful/bridge/self-referential operations, including:
     - `scene.clear`, `undo.last`, `render.preview`, `export.asset`
     - `bridge.start`, `bridge.stop`, `bridge.logs`, `bridge.status`, `bridge.operations`
     - nested `batch.plan` and nested `batch.execute`.
   - Dry-run may still preview rejected real-execution operations; real mode must not execute them.

---

## 2) Execution semantics

1. **Deterministic sequential execution**
   - Steps execute in declared order, one at a time.

2. **Stop-on-first-error (required)**
   - On first failed step, batch execution must stop immediately.
   - Remaining steps must be marked not executed.

3. **No rollback by default**
   - Partial execution is an accepted failure mode.
   - Rollback is forbidden unless explicitly designed, implemented, and validated as a separate feature.

4. **No hidden side channels**
   - Batch execution must not invoke arbitrary Python/shell/code paths.
   - It must call only approved typed operation handlers.

---

## 3) Response, receipts, and correlation

Real execution responses must include:

1. **Top-level correlation fields**
   - `request_id`
   - `receipt` with operation-level timing/outcome

2. **Per-step receipts (required)**
   - One receipt per attempted/executed/skipped step, including at least:
     - step index
     - operation name
     - `ok`
     - `skipped` boolean
     - duration/timing
     - warning/error text when failed
     - per-step `request_id` when available

3. **Outcome summary**
   - `executed_steps`
   - `failed_step` (if any)
   - `stopped_on_error: true`
   - `remaining_steps_skipped`

4. **Dry-run linkage**
   - Response must include the dry-run reference used for authorization/gating.
   - Response must include `plan_fingerprint` to enable verification of step array identity across dry-run and real execution.

---

## 4) Generated artifact handling

For steps that produce outputs (render/export):

1. **Track artifacts in structured output**
   - Include artifact path/type/existence/size metadata in step receipts.

2. **Path and extension safety**
   - Enforce typed operation path/extension validation as defined by operation schemas.

3. **No implicit publishing**
   - Do not upload, publish, or commit generated artifacts.
   - Keep artifact handling explicit and opt-in.

---

## 5) Runtime evidence requirements (before enabling real execution)

Real execution support claims require runtime evidence; if runtime cannot be run, document explicit limitation and do not claim PASS.

Required evidence set:

1. **Happy path (non-destructive)**
   - Valid dry-run reference + valid global confirm
   - All steps execute, per-step receipts present

2. **Missing/invalid global confirm rejection**
   - Request rejected with zero executed steps

3. **Missing/invalid dry-run reference rejection**
   - Request rejected with zero executed steps

4. **Forbidden code/operation rejection**
   - Request rejected before execution

5. **Destructive-step confirmation enforcement**
   - Missing step confirm rejected before execution

6. **Stop-on-first-error behavior**
   - Failure at step N halts execution
   - N+1..end marked skipped
   - No rollback performed

7. **Request correlation and receipts**
   - Top-level `request_id` + `receipt` and per-step receipts verifiable

8. **Artifact metadata verification**
   - For first real execution slice, render/export steps are rejected before execution.
   - Artifact metadata verification remains required for future release when render/export are admitted.

Document evidence in a dedicated runtime doc (for example `docs/runtime-smoke-test-batch-execute-real.md`) before claiming support.

---

## 6) Explicit non-goals for first real-execution release

- Automatic rollback/transactional scene restore
- Parallel step execution
- Arbitrary Python/shell/code execution
- Implicit bridge lifecycle management within batch steps

---

## 7) Contract compliance rule

`batch.execute` real mode is allowed only when this contract gates are enforced. Current release is intentionally limited to non-destructive operations and exact dry-run fingerprint linkage.
