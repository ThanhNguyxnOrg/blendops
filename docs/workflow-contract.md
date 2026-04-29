# Workflow Contract (Product Specification)

## Purpose

Define the BlendOps workflow contract for non-Blender-user AI-assisted 3D creation.

This is a **product contract/spec**, not implementation code.

BlendOps contract scope:
- translates user intent into a constrained workflow plan
- frames runtime execution expectations against external runtime dependencies
- validates outcome quality against user intent
- produces plain-language handoff for web/app/game/render targets

---

## Contract principles

1. **User intent first**
   - Input is natural-language creative intent, not Blender commands.

2. **Constrained workflow over raw runtime control**
   - BlendOps defines safe plan stages; runtime power is abstracted and controlled.

3. **Evidence over assertions**
   - “Success” must include artifact and validation evidence.

4. **Plain-language handoff**
   - Output must be understandable by non-Blender users.

5. **External runtime dependency clarity**
   - BlendOps is workflow/product layer; Blender CLI + reference bridge are external assumptions.

---

## Contract: Input

Required input fields:

1. **Natural-language creative prompt**
   - Example: “Create a cyberpunk shoe web hero with floating shoe, neon lights, glossy dark floor, cinematic camera, export GLB, and web usage guidance.”

2. **Target use case**
   - One of:
     - `web`
     - `app`
     - `game`
     - `render`

Optional input fields:

3. **Style constraints**
   - e.g., realistic/stylized, mood references, brand tone, forbidden motifs.

4. **Asset constraints**
   - e.g., source model availability, performance budget expectations, texture constraints, orientation/unit notes.

Input acceptance rules:
- If required fields are missing, workflow must trigger clarification before planning.
- If prompt is contradictory, workflow must request disambiguation or proceed with explicit assumptions.

---

## Contract: Intermediate outputs

The workflow must produce these intermediate artifacts before final handoff.

### 1) Intent summary

Purpose:
- confirm shared understanding of the request.

Contents:
- normalized objective statement
- declared target use case
- assumptions made due to missing info
- explicit exclusions/out-of-scope

### 2) Scene plan

Purpose:
- convert creative intent into staged scene goals.

Contents:
- subject/composition plan
- camera/framing plan
- lighting plan
- material/look plan
- environment/background plan
- output objective plan (GLB/render/preview intent)

### 3) Runtime execution plan

Purpose:
- define how the plan routes through external runtime assumptions.

Contents:
- execution mode assumptions (external runtime, not BlendOps custom runtime)
- preflight checks required before run
- staged execution boundaries
- retry/failure handling strategy (high-level)

### 4) Validation checklist

Purpose:
- convert user intent into measurable checks.

Contents:
- required scene feature checks
- output completeness checks
- quality/caveat checks
- pass/partial/fail decision rules

### 5) Artifact plan

Purpose:
- define expected handoff package before execution claims.

Contents:
- expected artifact classes (GLB/preview/report)
- expected metadata/evidence requirements
- failure-report requirements if artifacts are missing

---

## Contract: Output

Final output must include the following sections.

### 1) Plain-language result summary

- what the user asked for
- what was produced
- current status: pass / partial / fail

### 2) Generated/expected artifacts

- artifact list with purpose labels
- present vs missing artifact indicators
- caveats for each major artifact

### 3) GLB/render/preview handoff expectations

- GLB handoff statement (available/not available + reason)
- preview evidence statement
- known limitations affecting downstream usage

### 4) Web/app/game/render usage guidance

- practical integration guidance for selected target use case
- quality/performance considerations
- next-step suggestions for iteration

### 5) Limitations and caveats

- unresolved quality gaps
- runtime/environment constraints
- assumptions that may affect reproducibility

---

## Completion-state model

The contract uses a strict completion taxonomy:

- **Pass**
  - required artifacts produced
  - required validation checks pass
  - handoff guidance complete

- **Partial**
  - core artifact exists but one or more required checks fail
  - response must explain impact and remediation path

- **Fail**
  - no usable artifact and/or intent alignment not achieved
  - response must include concrete failure cause and next-step recovery options

---

## Runtime assumption contract (external)

BlendOps workflow contract assumes:

- official Blender CLI provides low-level execution primitives
- `ahujasid/blender-mcp` is reference external bridge pattern
- runtime process behavior, tool availability, and environment reliability are external dependencies

BlendOps responsibilities:
- normalize intent
- constrain workflow stages
- require validation and evidence
- provide user-facing clarity

Not a BlendOps responsibility in this phase:
- shipping custom CLI/MCP/addon runtime implementation

---

## Evidence expectations (product layer)

A successful/partial response should include or reference:

- produced artifact list
- validation checklist results
- clear indication of missing outputs
- reproducibility-relevant assumptions (version/environment caveats where known)

No “silent success” allowed.

---

## Non-goals for this contract

- no code-level API schema definition yet
- no custom runtime protocol design yet
- no direct raw-shell or arbitrary Python user-facing interface
- no frontend implementation details
