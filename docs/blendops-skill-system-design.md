# BlendOps Skill System Design (Research Synthesis)

Status: Proposed design direction (not final)
Date: 2026-04-29

## Context

BlendOps is currently positioned as a **product/workflow layer for non-Blender users**.
It does not currently ship a custom runtime (CLI/MCP/addon) in active scope.

Design target:
Create a portable law/skill/workflow format that can guide outputs across Claude Code, Cursor, OpenCode, and Codex while referencing external runtime dependencies explicitly.

---

## 1) Naming model decision

### Recommendation: Hybrid naming model

Use a hybrid vocabulary instead of a single term:

- **Law**: non-negotiable constraint and quality gate
- **Skill**: reusable execution pattern for a task class
- **Workflow**: multi-step process spanning multiple skills/laws
- **Recipe**: concrete scenario implementation
- **Pack**: grouped release unit for versioned adoption

Why:
- “Law-only” is too rigid for all content.
- “Skill-only” is too harness-specific.
- Hybrid model improves portability and maintainability.

---

## Collection model clarification

BlendOps is not a single monolithic skill.

BlendOps should be modeled as:
- multiple focused skills under `skills/`
- shared guardrails under `laws/`
- compositional bundles under `packs/`

Each skill should remain narrow, composable, and independently reviewable.

---

## 2) What one BlendOps law/skill should contain

Every unit should include:

1. Purpose
2. Trigger/when-to-use
3. Inputs required
4. Outputs expected
5. External runtime assumptions
6. Workflow steps
7. Safety constraints
8. Validation checklist
9. Failure handling
10. User-facing response template
11. Non-goals
12. Verification evidence policy

---

## 3) Required vs optional fields

### Required fields

- `name`
- `type` (law|skill|workflow|recipe)
- `status` (proposed|draft|active|deprecated)
- `purpose`
- `when_to_use`
- `inputs`
- `outputs`
- `runtime_assumptions`
- `safety_rules`
- `validation_checklist`
- `failure_handling`
- `verification`

### Optional fields

- examples
- anti-patterns
- confidence level
- compatibility notes by harness
- references/citations block

---

## 4) Trigger model

Triggering should be **explicit-first**:

1. explicit invocation by intent phrase or command equivalent
2. contextual auto-trigger only when confidence is high and scope is safe
3. fallback to clarifying questions when ambiguity is high

Key principle:
No hidden trigger should bypass safety and validation requirements.

---

## 5) How laws/skills constrain AI behavior

Each law/skill should define:

- Must-do requirements
- Must-not-do prohibitions
- Blocking conditions
- Required user caveat language

Examples of constraints:
- must not claim runtime success without evidence
- must not hide unresolved export/runtime risks
- must not imply BlendOps owns runtime capabilities it does not provide

---

## 6) External runtime reference model

BlendOps law/skill files must explicitly separate:

- what BlendOps defines (workflow/policy)
- what external runtime executes
- what evidence is expected back from runtime

Runtime references should be:
- link-based
- version-aware when possible
- explicitly marked as assumptions/dependencies
- official-source-first in active docs (Official Blender MCP Server, Official Claude Blender Connector, Official Blender CLI reference)
- no named community runtime fallback in active strategy (historical notes belong in archive context only)

---

## 7) Artifact output model

Expected output artifacts should be standardized.

Minimum set per workflow:

1. Plan artifact (what will be done)
2. Validation artifact (what was checked)
3. Handoff artifact (what user receives)
4. Caveat artifact (what remains uncertain/risky)

For web 3D outcomes, typical bundle:
- preview image(s)
- GLB export
- validation checklist
- runtime compatibility notes

---

## 8) Verification model

Verification should be mandatory and structured:

- pre-flight checks (inputs/runtime assumptions)
- execution checks (process integrity)
- post-checks (artifact quality + compatibility)
- final truth report (pass/warn/fail)

No “done” claim without a final verification section.

---

## 9) Cross-editor / cross-harness usefulness

To remain portable across Claude Code/Cursor/OpenCode/Codex:

- keep core units as plain markdown + frontmatter
- avoid tool-specific internals in canonical content
- provide per-harness invocation notes as optional overlay
- preserve safety/validation semantics identically across harnesses

---

## 10) Proposed v0 architecture

### Implemented draft artifact map (docs only)

- Laws: `docs/laws/*`
- Skills: `docs/skills/*`
- Workflows: `docs/workflows/*`
- Recipes: `docs/recipes/*`
- Packs: `docs/packs/*`

This is a documentation/spec layer only (no runtime code added).


### Directory concept

```txt
docs/
  research/
  laws/
  skills/
  workflows/
  recipes/
  packs/
```

### v0 rollout sequence

1. finalize research-derived format
2. publish first skill/law pack (3–5 units)
3. test against non-Blender-user scenarios
4. refine based on verification failure patterns

---

## 11) Non-goals for current phase

- building custom runtime adapter
- implementing custom MCP/addon execution stack
- reproducing full orchestrator frameworks in-repo

These are explicitly deferred until post-v0 evaluation.

---

## 12) Decision summary

BlendOps should adopt a **hybrid law/skill/workflow system** with:
- explicit runtime boundaries,
- mandatory verification,
- non-Blender-user language,
- and cross-harness portability as first-class design constraints.
