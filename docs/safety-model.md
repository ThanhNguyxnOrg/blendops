# Safety Model (Product Layer)

## Purpose

Define the BlendOps safety model for non-Blender-user workflows.

This model governs **workflow intent, planning, validation, and user-facing communication**.
It does not define raw runtime implementation code.

---

## Safety goals

1. Protect non-expert users from unsafe low-level execution exposure.
2. Constrain AI behavior to approved workflow stages.
3. Make failure and risk visible in plain language.
4. Preserve external-runtime utility while limiting product-layer risk.

---

## Safety boundary: BlendOps vs external runtime

BlendOps is a product/workflow layer.

- External runtime may expose powerful low-level capabilities (including arbitrary Python execution in some reference bridge patterns).
- BlendOps must not expose that power directly as the final user-facing interface.
- BlendOps must enforce intent constraints, planning constraints, and validation/reporting constraints before claiming success.

Boundary rule:
- **User interacts with constrained workflow contract, not raw runtime primitives.**

---

## Prohibited user-facing interfaces

BlendOps final user-facing workflow must **not** be:

1. Arbitrary Python execution interface
2. Raw shell command interface
3. Unrestricted Blender CLI flag interface
4. Unbounded runtime-tool invocation surface

These may exist in underlying runtime infrastructure, but they are not acceptable as end-user BlendOps interaction contracts.

---

## Constrained workflow operation model

BlendOps-approved operation stages:

1. Intent intake
2. Clarification (if needed)
3. Scene/workflow planning
4. Execution planning (external runtime assumptions)
5. Validation against intent
6. User-facing artifact and guidance handoff

Safety requirement:
- Operations outside these stages require explicit policy review before inclusion.

---

## Intent safety controls

### 1) Input normalization

- Convert free-form prompt into structured intent summary.
- Identify missing critical parameters or contradictory constraints.

### 2) Clarification gate

- Ask minimal clarifying questions when required for safe/quality execution.
- If user declines clarification, proceed with explicit assumptions and disclose them.

### 3) Scope control

- Keep generated plan limited to user request and target use case.
- Reject hidden scope expansion not justified by user intent.

---

## Execution safety controls (product layer)

BlendOps should require a constrained execution plan envelope:

1. **Preflight checks**
   - runtime availability assumptions
   - output target expectations
   - artifact destination assumptions

2. **Plan-bound execution**
   - execution should map to declared scene/workflow plan stages
   - no undeclared high-risk operations in silent mode

3. **Failure visibility**
   - if execution cannot proceed, return explicit status and reason

4. **No silent success**
   - success claims require validation and artifact evidence

---

## Validation safety controls

### Required validation dimensions

1. Intent alignment
2. Required visual feature coverage
3. Artifact completeness
4. Handoff clarity
5. Caveat transparency

### Completion-state taxonomy

- **Pass**: Required checks and required artifacts present
- **Partial**: Core output present, but one+ required checks unmet
- **Fail**: No usable output or major intent mismatch

Safety requirement:
- Every final response must include one of these explicit states.

---

## Artifact and evidence safety controls

Expected evidence classes (product layer):

- generated artifact list (or explicit missing outputs)
- validation checklist outcomes
- plain-language caveats/limitations
- practical next steps when partial/fail

Evidence rule:
- Assertions without artifact/validation context are treated as unsafe/incomplete response quality.

---

## User-facing risk and failure communication

When risk/failure occurs, response must include:

1. What failed or is uncertain
2. Likely cause (plain language)
3. Impact on user goal
4. Recommended next action options

Communication policy:
- Avoid hiding runtime constraints.
- Avoid implying guaranteed output quality.
- Prefer transparent tradeoff language.

---

## High-risk scenarios to explicitly guard

1. Ambiguous prompt interpreted as deterministic requirement
2. Export reported as complete but artifact unusable for target use case
3. Visual intent mismatch hidden by superficial completion claim
4. Runtime/tooling instability omitted from final response
5. Unsafe low-level execution capabilities surfaced directly to non-expert users

---

## Security and abuse posture (product layer)

BlendOps safety model should:

- constrain workflow intent and execution stages
- minimize exposure of low-level control surfaces
- require explicit user-visible failure disclosure
- route advanced/high-risk operations through policy-governed paths (not default path)

---

## Runtime capability tiers (`L0`–`L3`) and scene rollback protocol (`F-10`)

To prevent implicit privilege escalation when transitioning from BlendOps workflow planning to external MCP or CLI execution, BlendOps enforces a four-tier capability model defined in [`../schemas/runtime-capability-policy.schema.json`](../schemas/runtime-capability-policy.schema.json), compiled in [`../registry/runtime-capability-policy.json`](../registry/runtime-capability-policy.json), and validated by `scripts/validate-capability-policy.mjs`:

| Tier | Name | Allowed Operations | Mandatory Safety & Rollback Gates |
| :--- | :--- | :--- | :--- |
| **`L0`** | **Planning & Read-Only Inspection (Default)** | Workflow routing, brief decomposition, quality checklists, and read-only MCP inspection (`get_blendfile_summary_datablocks`, `get_objects_summary`, `get_scene_info`). | Zero scene mutation; zero file writes. All 48 BlendOps skills default to `L0` execution posture. |
| **`L1`** | **Reversible Scene Mutation** | Bounded camera, lighting, material, and object transform edits in an active Blender session. | Requires a verified pre-mutation `.blend` checkpoint (`<scene>.pre-<skill-id>-<ISO8601-UTC>.blend`) with non-zero byte size and 64-hex SHA-256 digest before any mutation occurs (`failClosedOnBackupFailure: true`), plus explicit `mutationBoundaries` and `recoveryProtocol`. |
| **`L2`** | **File Export & External Asset Import** | Still/turntable renders, `.glb` container exports, and external 3D/material asset imports. | Inherits all `L1` pre-mutation backup gates when mutating, requires an explicit `outputDirectoryAllowlist` (blocking path traversal), and requires `asset-license-checker` clearance (`CC0-1.0`, `CC-BY-4.0`, `Royalty-Free-Commercial`, or `Proprietary-First-Party`) before importing external assets. |
| **`L3`** | **Arbitrary Code / Destructive Operations** | Headless CLI batch jobs (`blender --background --python`) or multi-object destructive scene resets. | Inherits all `L1`/`L2` safeguards, requires explicit `operatorConfirmation` (`confirmed: true`, `confirmedBy`, `scopeSummary`), and enforces [`../laws/no-arbitrary-python-interface.md`](../laws/no-arbitrary-python-interface.md) (`userFacingPythonAllowed: false`). |

### Pre-mutation `.blend` checkpoint and fail-closed rollback rule

1. **Backup Before Mutation:** Any `L1`, `L2`, or `L3` scene-mutating operation must first record a verified `.blend` checkpoint (`sourceBlendPath`, `backupPath`, `byteSize > 0`, 64-character hex `sha256`, `createdBeforeMutation: true`, `verifiedOnDisk: true`).
2. **Fail-Closed Enforcement:** If backup creation or on-disk SHA-256 verification fails, `evaluateRuntimeCapabilityInvocation` in `scripts/validate-capability-policy.mjs` and `executeTypedOperationSequence` in `scripts/runtime-orchestrator.mjs` strictly block the mutation (`allowed: false`, `mutationBlockedByBackupFailure: true`).
3. **Typed Operation Registry (`registry/runtime-operations.json`) & Transaction State Machine:**
   - BlendOps maps `ExecutionPlan` steps to 18 canonical typed operations (`11 L0` read-only inspections, `4 L1` bounded reversible mutations, `3 L2` separately gated export/import operations) validated against [`../schemas/runtime-operations.schema.json`](../schemas/runtime-operations.schema.json).
   - Arbitrary Python (`op.blocked.arbitrary-python`), shell (`op.blocked.shell-execution`), and destructive resets (`op.blocked.unconfirmed-destructive-reset`) are explicitly blocked (`L3`).
   - Every operation follows a strict state machine (`planned → preflight → checkpoint_verified → approved_if_required → executing → readback → postcondition_verified → committed`) with idempotency tracking, zero blind retries on mutation timeouts, independent scene readback, and verified rollback restoration (`rollback_verified` vs `rollback_failed`), recorded in an Operation Execution Ledger ([`../schemas/operation-execution-ledger.schema.json`](../schemas/operation-execution-ledger.schema.json)).
4. **Post-Recovery Verification & Honest Truth State:** If a mutation fails and the `.blend` checkpoint is restored, the orchestrator verifies scene restoration via Path 1 (`get_blendfile_summary_datablocks`, `get_objects_summary`) or Path 2 (`get_scene_info`, `get_object_info`) and reports `Runtime status: Failed` (or `Attempted`) with `Artifact status: Not Produced`.
5. **Honest Boundary:** BlendOps defines and validates this capability, typed operation, and rollback protocol in schemas, registry metadata, and deterministic mock MCP tests; it does **not** ship or claim a live Blender runtime daemon inside this repository (`blenderRuntime: "Not Run"`).

---

## Relationship to workflow contract and golden path

This safety model is enforced through:

- `docs/workflow-contract.md` (input/intermediate/output contract)
- `docs/golden-path-cyberpunk-shoe.md` (first concrete non-Blender-user journey)
- `schemas/runtime-capability-policy.schema.json` and `registry/runtime-capability-policy.json` (`L0`–`L3` capability & rollback policy)
- `schemas/runtime-operations.schema.json`, `registry/runtime-operations.json`, `schemas/operation-execution-ledger.schema.json`, and `scripts/runtime-orchestrator.mjs` (Phase 3 typed operations & transaction safety)

---

## Out of scope for this document

- low-level code sandbox implementation details
- runtime-specific ACL implementation details
- network/container hardening implementation
- frontend/UI implementation
