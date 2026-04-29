# Skill/Law Pattern Synthesis for BlendOps

Status: Research synthesis draft (not final implementation rules)
Date: 2026-04-29

## Purpose

This document extracts reusable structural patterns from audited Claude Code ecosystems and official Anthropic guidance, then adapts them for BlendOps.

Primary sources:
- Anthropic Claude Code docs: https://docs.anthropic.com/en/docs/claude-code/skills
- Anthropic permissions model: https://docs.anthropic.com/en/docs/claude-code/permissions
- Anthropic hooks model: https://docs.anthropic.com/en/docs/claude-code/hooks-guide
- Anthropic Agent SDK skills caveats: https://docs.anthropic.com/en/docs/agent-sdk/skills
- superpowers-skills: https://github.com/obra/superpowers-skills
- superpowers-lab: https://github.com/obra/superpowers-lab
- everything-claude-code: https://github.com/affaan-m/everything-claude-code
- oh-my-claudecode: https://github.com/Yeachan-Heo/oh-my-claudecode
- BMAD adaptations: https://github.com/aj-geddes/claude-code-bmad-skills and https://github.com/cabinlab/BMAD-CLAUDE-CODE

---

## 1) Best directory structure patterns

### Pattern A — Stable + Experimental split

Observed in:
- `superpowers-skills` (stable catalog)
- `superpowers-lab` (experimental catalog)

BlendOps adaptation:
- `docs/laws/` (stable)
- `docs/labs/` or `docs/experiments/` (draft patterns)

Why it works:
- prevents unstable experiments from contaminating production guidance
- reduces fear of iteration in experimental lane

### Pattern B — Function-based separation

Observed in mature repos:
- `skills/`, `commands/`, `rules/`, `hooks/`, `agents/`, `docs/`, `scripts/`

BlendOps adaptation (documentation/product layer):
- `docs/research/` for evidence
- `docs/laws/` for policy-like constraints
- `docs/workflows/` for operational sequences
- `docs/recipes/` for concrete user scenarios

Why it works:
- cleaner ownership and review boundaries
- avoids “one giant README” anti-pattern

### Pattern C — Data-driven index generation

Observed in:
- `hesreallyhim/awesome-claude-code` (`THE_RESOURCES_TABLE.csv` + generated views)

BlendOps adaptation:
- maintain one source-of-truth index table for law/skill metadata
- generate docs index pages from structured metadata in future phase

---

## 2) Best SKILL.md / law file patterns

### Reusable fields from observed skill ecosystems

Common effective fields:
- `name`
- `description`
- `when_to_use`
- explicit do/don’t constraints
- verification steps
- failure handling

BlendOps law/skill should include equivalent semantic fields even if naming differs.

### Recommended frontmatter for BlendOps draft files

```yaml
name: <identifier>
status: proposed | draft | active | deprecated
purpose: <one-line outcome>
when_to_use:
  - <trigger phrase or intent pattern>
inputs:
  - <required input>
outputs:
  - <expected artifact>
runtime_assumptions:
  - <external runtime dependency>
safety_level: strict | moderate | advisory
verification_level: required | recommended
source_confidence: verified | mixed | inferred
```

(Frontmatter is proposed, not final.)

---

## 3) Progressive disclosure patterns

Best pattern from Anthropic + ecosystem:
1. lightweight metadata always visible
2. full instructions loaded only when triggered
3. heavy supporting details referenced, not duplicated inline

Implication for BlendOps:
- keep “law summary” short
- move long examples/checklists to linked subdocs
- avoid bloating always-on memory with full procedural detail

---

## 4) Slash command patterns

Observed command categories:
- orchestration commands (plan/execute/verify)
- quality gates (check/review/validate)
- setup/update commands

BlendOps recommendation:
- do not implement new runtime slash commands now
- define command-intent mapping in docs so different harnesses can implement equivalents later

Example mapping style:
- intent: “validate scene quality”
- Claude Code style: `/...`
- Cursor/OpenCode/Codex style: documented equivalent workflow prompt

---

## 5) Rules vs skills vs commands vs hooks vs agents

### Practical separation model for BlendOps

- **Rules/Laws**: non-negotiable policy constraints (what must/must not happen)
- **Skills/Workflows**: how to execute a class of tasks
- **Commands**: invocation shorthand bound to a harness (optional for now)
- **Hooks**: deterministic enforcement in runtime environments (external, not BlendOps core today)
- **Agents**: specialized roles when supported by harness

Key lesson:
- keep policy and process separate so policy remains portable across toolchains.

---

## 6) Guardrail patterns

High-value patterns to retain:
- explicit non-goals section
- mandatory safety checks before claiming completion
- fail-fast behavior on missing prerequisites
- transparent caveat reporting (not silent failure)

BlendOps-specific guardrail emphasis:
- do not pretend BlendOps owns runtime execution
- clearly state external runtime assumptions
- block claims if required output artifacts are missing

---

## 7) Verification patterns

Observed strong patterns:
- checklist-backed validation
- staged verification gates
- deterministic checks where possible

BlendOps adaptation:
- required artifact validation checklist in each law/skill
- evidence section in user-facing output:
  - what was checked
  - what passed
  - what failed / uncertain

---

## 8) Install/update patterns

Observed:
- mature projects provide explicit install/update/doctor paths
- weaker systems drift when setup docs and runtime behavior diverge

BlendOps adaptation now:
- document external runtime setup as first-class prerequisite
- keep BlendOps itself as workflow/policy layer until law model stabilizes

---

## 9) How to keep skills small (anti-bloat)

Recommended constraints:
- each skill/law solves one core objective
- move long rationale to references
- cap “always-read” section length
- include links instead of embedding full external docs

Red flags:
- giant multipurpose files with mixed policy + setup + examples
- repeated boilerplate across many files

---

## 10) Separate product docs from executable instructions

Recommended split:
- Product docs: positioning, scope, user outcomes
- Executable instructions: law/skill/workflow specs with validation requirements

BlendOps should avoid blending these layers in one file.

---

## 11) Naming model recommendation

Candidate labels considered:
- law
- skill
- workflow
- recipe
- pack
- playbook

Recommended hybrid:
- **Law** = policy constraint and quality gate
- **Workflow** = multi-step execution path
- **Recipe** = concrete scenario implementation
- **Pack** = grouped release bundle (v0 pack, v1 pack)

Why:
- “law” alone is too rigid for all content
- “skill” alone is too tool-specific
- hybrid model keeps portability and clarity

---

## 12) Pattern summary for BlendOps v0

Adopt immediately:
1. stable vs experimental separation
2. explicit trigger + inputs + outputs + verification in every spec
3. strict non-goal/runtime-boundary declarations
4. evidence-backed references and confidence labels

Defer to later phase:
1. runtime-specific command wrappers
2. custom hooks/runtime automation
3. generated index tooling (after schema freeze)
