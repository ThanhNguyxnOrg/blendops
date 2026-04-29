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

## Relationship to workflow contract and golden path

This safety model is enforced through:

- `docs/workflow-contract.md` (input/intermediate/output contract)
- `docs/golden-path-cyberpunk-shoe.md` (first concrete non-Blender-user journey)

---

## Out of scope for this document

- low-level code sandbox implementation details
- runtime-specific ACL implementation details
- network/container hardening implementation
- frontend/UI implementation
