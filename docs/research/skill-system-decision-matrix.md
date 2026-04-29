# Skill System Decision Matrix for BlendOps v0

Status: Research decision draft
Date: 2026-04-29

## Decision context

BlendOps is currently a product/workflow layer for non-Blender users and explicitly does **not** ship its own custom CLI/MCP/addon runtime in active scope.

Decision goal:
Choose a v0 approach for law/skill/workflow delivery that maximizes portability, safety, and non-Blender-user usefulness while minimizing accidental runtime rebuild.

---

## Options compared

A. Prompt-pack only
B. Slash commands only
C. Filesystem skills/laws
D. Wrapper around external MCP
E. Future custom adapter
F. Hybrid (recommended candidate)

---

## Scoring rubric

Scale: 1 (worst) to 5 (best)

Criteria:
1. Implementation cost
2. Maintainability
3. Safety
4. Non-Blender-user usefulness
5. Claude Code compatibility
6. Cursor/OpenCode/Codex portability
7. Risk of rebuilding runtime
8. Fit for Blender workflow
9. Ability to verify outputs

Note:
- For “risk of rebuilding runtime,” high score = low risk.

---

## Decision matrix

| Option | Implementation cost | Maintainability | Safety | Non-Blender-user usefulness | Claude Code compatibility | Cursor/OpenCode/Codex portability | Low runtime-rebuild risk | Blender workflow fit | Output verifiability | Total (max 45) | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| A. Prompt-pack only | 5 | 2 | 2 | 3 | 4 | 4 | 5 | 2 | 2 | 29 | Fastest to start; weakest governance and verification discipline |
| B. Slash commands only | 3 | 3 | 3 | 3 | 5 | 2 | 3 | 3 | 3 | 28 | Strong in Claude Code, weaker cross-harness portability |
| C. Filesystem skills/laws | 4 | 4 | 4 | 4 | 5 | 4 | 5 | 4 | 4 | 38 | Best balance of structure, portability, and low runtime coupling |
| D. Wrapper around external MCP | 2 | 2 | 3 | 4 | 3 | 2 | 1 | 4 | 4 | 25 | High drift risk toward runtime ownership |
| E. Future custom adapter | 1 | 2 | 3 | 4 | 2 | 2 | 1 | 4 | 4 | 23 | Not v0-ready; likely to violate current product boundary |
| F. Hybrid (skills/laws + workflow recipes + optional command mappings) | 4 | 5 | 4 | 5 | 5 | 5 | 5 | 5 | 5 | 43 | Retains portability and verification while avoiding runtime rebuild |

---

## Why Option F wins for BlendOps v0

Option F keeps BlendOps in its current product/workflow role while still being practical:

- Uses **filesystem laws/skills** as canonical artifacts (portable).
- Adds **workflow recipes** for concrete user outcomes.
- Adds **command intent mappings** (doc-level) without owning command runtime implementation.
- Keeps runtime integration external and explicit.

This aligns with:
- official Anthropic skill architecture patterns
- evidence from mature ecosystem repos with modular separation
- BlendOps’ non-goal of rebuilding runtime in this phase

---

## Recommended BlendOps v0 architecture

1. **Core law/skill files** (portable, declarative)
2. **Workflow recipes** for common user intents
3. **Quality checklists** for output validation
4. **External runtime assumption docs** as prerequisite contract
5. **Cross-harness invocation guidance** (Claude/Cursor/OpenCode/Codex mappings)

Not in v0:
- custom runtime adapter implementation
- direct runtime orchestration layer
- custom MCP/addon ownership

---

## Sensitivity notes

If portability were weighted lower and Claude-only optimization weighted higher, Option C could tie or beat Option F.

If runtime ownership became a strategic priority later, Option D/E could be reconsidered in a future phase—but that conflicts with current repository direction and should be explicitly re-approved.

---

## BlendOps v0 recommendation

**Adopt Option F (Hybrid) for v0.**

Concretely:
- canonical artifacts = laws + skills + workflows + checklists
- runtime execution remains external-reference based
- verification is explicit and required in every workflow

This provides the highest score across safety, portability, usability, and strategic fit.
