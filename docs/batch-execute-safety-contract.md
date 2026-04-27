# 🛡️ Batch Execute Safety Contract (Real Execution)

> 📚 Docs: [Index](./README.md) · [AI usage](./ai-agent-usage.md) · [Batch execute dry-run evidence](./runtime-smoke-test-batch-execute-dry-run.md)

**Status:** Spec-only contract (real `batch.execute` execution is **not implemented yet**)  
**Scope:** Requirements that must be met **before** enabling non-dry-run execution.

---

## 1) Hard preconditions (execution gate)

Real `batch.execute` must be rejected unless **all** conditions below are true.

1. **Dry-run first is mandatory**
   - A successful dry-run must exist for the same plan.
   - Real execution request must include a dry-run reference (at minimum prior `request_id` or `dry_run_id`).
   - Real execution must verify the referenced dry-run succeeded and corresponds to the exact same step set.
   - Real execution must verify `plan_fingerprint` matches between dry-run and real execution to ensure identical step arrays.

2. **Global confirmation token is mandatory**
   - Real execution must require an explicit top-level confirmation token (for example `confirm: "EXECUTE_BATCH"`).
   - Missing/wrong token must return `ok: false` and execute **zero** steps.

3. **Typed operations only (no arbitrary code)**
   - Reject any payload containing forbidden fields such as `python`, `script`, `shell`, `command`, `eval`, `exec`.
   - Reject non-whitelisted operations and bridge lifecycle/self-referential batch ops.

4. **Destructive step confirmations are mandatory**
   - Any destructive step (current and future) must include its step-level confirmation requirements.
   - Example: `scene.clear` must still require `confirm: "CLEAR_SCENE"`.
   - If any required destructive confirmation is missing/invalid, reject before execution begins.

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
   - One receipt per attempted/executed step, including at least:
     - step index
     - operation name
     - `ok`
     - duration/timing
     - warnings/errors
     - artifact references (when applicable)

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

Real execution must not be declared supported until runtime evidence is recorded.

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
   - Render/export steps include artifact metadata in receipts

Document evidence in a dedicated runtime doc (for example `docs/runtime-smoke-test-batch-execute-real.md`) before claiming support.

---

## 6) Explicit non-goals for first real-execution release

- Automatic rollback/transactional scene restore
- Parallel step execution
- Arbitrary Python/shell/code execution
- Implicit bridge lifecycle management within batch steps

---

## 7) Contract compliance rule

Until all sections above are implemented and runtime-verified, `batch.execute` must remain dry-run only.
