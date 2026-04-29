# BlendOps First Skill Pack (Draft v0)

Status: Draft v0 pack (not final)
Date: 2026-04-29

## Purpose

Define the first 3–5 BlendOps laws/skills that maximize non-Blender-user value while preserving current runtime boundary (external runtime references, no custom runtime rebuild).

---

## Selection criteria for v0

A v0 unit should:
1. solve a high-frequency user need
2. reduce common failure modes
3. enforce transparent caveat reporting
4. stay portable across harnesses
5. avoid runtime ownership creep

---

## Implemented draft file mapping

- Laws: `docs/laws/*.md`
- Skills: `docs/skills/*.md`
- Workflow: `docs/workflows/product-hero-workflow.md`
- Recipe: `docs/recipes/cyberpunk-shoe-hero.md`
- Pack: `docs/packs/v0-product-hero-pack.md`

---

## 1) external-runtime-setup-guide

### Purpose
Guide users through prerequisite external runtime setup and boundary understanding before any workflow execution.

### Trigger
- “How do I run this with Blender?”
- “Set up official runtime for BlendOps workflow”
- first-time project onboarding

### Inputs
- user environment (OS/toolchain)
- target runtime choice (Official Blender MCP Server, Official Claude Blender Connector, Official Blender CLI reference)

### Outputs
- setup checklist
- runtime boundary confirmation
- known-risk disclosure

### Safety rules
- Must clearly state BlendOps does not ship custom runtime in active scope.
- Must not provide fabricated commands if source docs are unavailable.

### Validation
- setup prerequisites checklist completed
- user confirms boundary understanding

### Why it belongs in v0
Prevents downstream confusion and false assumptions about BlendOps capabilities.

### Must not do
- must not rebuild or imply internal runtime ownership
- must not route users to non-official MCP runtimes as active setup paths
- must not skip caveat reporting for powerful runtime features

---

## 2) product-hero-scene-planner

### Purpose
Translate non-Blender user intent into a structured hero-scene plan before execution.

### Trigger
- “Create product hero scene”
- “Make a marketing-ready render setup”
- “I need a scene plan, not Blender internals”

### Inputs
- product description
- style/mood goals
- output destination (render + web handoff)

### Outputs
- composition plan
- blockout plan
- lighting/material intent plan
- validation checkpoints

### Safety rules
- Must separate assumptions from confirmed requirements.
- Must avoid claiming visual quality without validation checkpoints.

### Validation
- checklist includes composition/scale/lighting/material readiness items
- explicit open-risk section

### Why it belongs in v0
Directly supports BlendOps’ primary non-Blender-user workflow.

### Must not do
- must not jump directly into runtime-specific execution details
- must not produce opaque Blender-jargon-only output

---

## 3) blender-scene-quality-checker

### Purpose
Assess scene quality readiness with structured pass/warn/fail output.

### Trigger
- “Is this scene ready?”
- “Quality-check this before export”
- “What is still wrong?”

### Inputs
- scene context and intended output use case
- available preview/render evidence

### Outputs
- category checklist results
- blocking issues list
- recommended next actions

### Safety rules
- Must block “ready” if critical checks fail.
- Must disclose uncertainty if evidence is incomplete.

### Validation
- all checklist categories evaluated
- final status declared: Ready / Conditionally Ready / Not Ready

### Why it belongs in v0
Addresses the most frequent quality gap: overclaiming readiness.

### Must not do
- must not hide failures behind generic “looks good” language

---

## 4) glb-web-handoff

### Purpose
Produce a reliable Blender→GLB→web handoff contract for Three.js/R3F consumers.

### Trigger
- “Export this for web”
- “Prepare GLB handoff”
- “Will this work in Three.js/R3F?”

### Inputs
- target runtime assumptions
- export intent and constraints
- validation evidence

### Outputs
- handoff package requirements
- runtime compatibility notes
- extension/loader assumptions
- performance caveat summary

### Safety rules
- Must explicitly distinguish standard requirements vs best-practice advice.
- Must not claim runtime compatibility without listing assumptions.

### Validation
- transform/material/export/runtime checklist complete
- known version-sensitive risks documented

### Why it belongs in v0
Critical bridge from Blender workflow to actual product usage on web.

### Must not do
- must not present unsupported extensions/decoders as guaranteed

---

## 5) non-blender-user-response-writer

### Purpose
Convert technical workflow findings into clear, action-oriented language for non-Blender users.

### Trigger
- user requests plain-language explanation
- mixed technical/non-technical stakeholder communication

### Inputs
- technical findings (quality checks, export constraints, caveats)
- user context (experience level, goal urgency)

### Outputs
- plain-language summary
- prioritized actions
- risk/caveat section

### Safety rules
- Must preserve technical truth while simplifying language.
- Must not remove critical warnings.

### Validation
- includes: what passed / what failed / what next
- avoids unexplained Blender jargon

### Why it belongs in v0
Ensures BlendOps remains useful to the target audience, not only technical operators.

### Must not do
- must not oversimplify by hiding blockers or unknowns

---

## Pack-level release notes (proposed)

This pack should ship as a documentation-level v0 pilot with:
- explicit “proposed/draft” labels
- required verification sections
- cross-harness invocation guidance
- no runtime ownership claims

Success criteria for pilot:
- users can complete an end-to-end non-Blender-user workflow
- failure states are clearly surfaced
- handoff outputs are usable by web teams
