# Skill Systems Research for BlendOps

Status: Draft research foundation (not final law/skill definitions)
Date: 2026-04-29

## Scope and method

This document synthesizes verified findings from:
- Claude Code skill/workflow repositories
- curated “awesome” collections
- BMAD-oriented workflow repos
- official Anthropic/Claude documentation

Per request, the Perplexity seed was treated as a discovery input only. Claims below are either:
- **Verified from source** (linked)
- **Partially verified / inferred** (explicitly marked)
- **Not verified** (captured in a dedicated section)

---

## Comparative source table

| Source | Purpose | Structure | Unit type | Trigger model | Workflow model | Guardrails | Verification | Strengths | Weaknesses | BlendOps lesson |
|---|---|---|---|---|---|---|---|---|---|---|
| [obra/superpowers-skills](https://github.com/obra/superpowers-skills) | Community skill library | `skills/` categorized by domain | `SKILL.md` + helper scripts | Frontmatter `when_to_use`; helper search scripts | Composable lifecycle skills (brainstorm→plan→execute→verify) | Strong “discipline” skills (TDD/debug/verification) | Skill-level verification guidance; some tool scripts | Clear modularization and prompt-budget awareness | Repo is archived/read-only; README structure drift (`scripts/` claim vs root) | Keep skills small/composable; enforce verification discipline |
| [obra/superpowers-lab](https://github.com/obra/superpowers-lab) | Experimental skill plugin | `.claude-plugin/` + `skills/` + changelog | Experimental `SKILL.md` packs + scripts | Plugin install + skill-trigger descriptions | Experiment lane separate from core | Safety caveats in skill docs (e.g., host requirements) | Limited formal CI signals; mostly skill-level docs | Good “lab vs stable” separation | README “current skills” lagged some repo state | Maintain a separate experimental pack for fast iteration |
| [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) | Cross-harness agent system | Large modular tree: skills, hooks, rules, manifests, plugins, tests | Rules, skills, commands, hooks, agents | Manifest/profile install + hooks + commands | Full lifecycle with harness-level orchestration | Extensive policy/hook design | Strong CI and validation footprint | Mature modular architecture and install profiles | Very large surface area; complexity overhead | Adopt manifest-driven modular install and strict separation of concerns |
| [wesammustafa/Claude-Code-Everything-You-Need-to-Know](https://github.com/wesammustafa/Claude-Code-Everything-You-Need-to-Know) | Tutorial-heavy handbook | README-centric + `.claude` examples | Guides, command docs, hook examples | Primarily user-invoked command patterns | Human-guided workflows | Some explicit safeguards in hook examples | Limited automation evidence at repo level | Strong onboarding narrative | Portability issues in examples (environment-specific config), less automated governance | Use as educational reference, not as architecture authority |
| [Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode) | Team-first orchestration runtime/plugin | Large runtime repo: plugin, skills, hooks, scripts, agents, tests | Commands, skills, runtime scripts | Slash commands + hook/event system + team pipeline | Explicit staged pipeline (`team-plan`→`team-prd`→`team-exec`→`team-verify`→`team-fix`) | Strong enforcement logic in runtime scripts | CI/workflow presence and upgrade checks | High operational maturity and orchestration depth | Heavy runtime complexity and plugin coupling | Good orchestration reference, but BlendOps should avoid rebuilding runtime now |
| [aj-geddes/claude-code-bmad-skills](https://github.com/aj-geddes/claude-code-bmad-skills) | BMAD adaptation for Claude Code | `bmad-v6/`, `bmad-skills/`, docs, installers | Skill packs + workflow commands + templates | Slash-command driven phase progression | Structured multi-phase BMAD workflow | Procedural gates and check commands | Installer verification + workflow checklists | Good workflow scaffolding and artifact templates | Parallel version tracks (`bmad-v6` + `bmad-skills`) can create drift/confusion | Keep phase-gated workflow templates, avoid overlapping generation systems |
| [cabinlab/BMAD-CLAUDE-CODE](https://github.com/cabinlab/BMAD-CLAUDE-CODE) | BMAD fork focused on Claude usage | `bmad-agent/` + optional dashboard + docs | Personas, tasks, checklists, templates | Instruction/persona routing in docs | Documentation-driven multi-session workflow | Checklist-heavy quality gates | Mostly process-level verification, less hard automation | Strong documentation assets and continuity ideas | Manual-discipline dependence; less deterministic enforcement | Use checklist assets, but add deterministic validation gates |
| [LangGPT/awesome-claude-code](https://github.com/LangGPT/awesome-claude-code) | Curated ecosystem list | README + docs | Links/catalog entries | N/A (discovery list) | N/A | N/A | N/A | Good breadth discovery | Not an executable system; quality/curation drift signals | Use only as discovery input; re-verify everything |
| [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) | Curated list + automation tooling | Data + templates + scripts + tests + alt readmes | Resource tables, generation scripts, governance workflows | Submission and maintenance workflows | Maintainer-centric curation lifecycle | Policy/quality controls in repo automation | Strong automation/test signals | Excellent “data source → generated docs” model | Root README currently transitional/TODO tone | Strong pattern for BlendOps research index generation |
| [Anthropic Claude Code docs](https://docs.anthropic.com/en/docs/claude-code/skills) | Official behavior and architecture | Product docs pages | Features, skill standard, permissions/hook model | Skill frontmatter + explicit invocation + system behavior | Agentic loop + tool usage patterns | Official permission/hook controls | Official guidance on verification and safety posture | Canonical source for compatibility constraints | Not a turnkey architecture blueprint | Make official docs the baseline truth contract |

---

## Claims verified from source

### Verified patterns worth reusing

1. **Separation of stable vs experimental catalogs**
   - Stable catalog pattern in `superpowers-skills`; experimental lane in `superpowers-lab`.
   - Sources: [superpowers-skills](https://github.com/obra/superpowers-skills), [superpowers-lab](https://github.com/obra/superpowers-lab)

2. **Manifest/profile-driven installation reduces prompt/runtime bloat**
   - Evident in `everything-claude-code` repository organization and manifests.
   - Source: [everything-claude-code](https://github.com/affaan-m/everything-claude-code)

3. **Deterministic checks outperform purely narrative guardrails**
   - Repos with hooks/CI/workflow gates demonstrate stronger consistency.
   - Sources: [oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode), [everything-claude-code](https://github.com/affaan-m/everything-claude-code)

4. **“Awesome list” repos are discovery tools, not execution contracts**
   - Useful for breadth, but not sufficient as implementation truth.
   - Sources: [LangGPT list](https://github.com/LangGPT/awesome-claude-code), [hesreallyhim list](https://github.com/hesreallyhim/awesome-claude-code)

5. **Official Anthropic docs define compatibility constraints**
   - Skill behavior, permission model, hook model, and SDK caveats should anchor law/skill format design.
   - Sources: [Claude Code skills](https://docs.anthropic.com/en/docs/claude-code/skills), [permissions](https://docs.anthropic.com/en/docs/claude-code/permissions), [hooks guide](https://docs.anthropic.com/en/docs/claude-code/hooks-guide), [Agent SDK skills](https://docs.anthropic.com/en/docs/agent-sdk/skills)

---

## Claims from Perplexity seed not verified

The following categories were present in seed material but are **not accepted as verified in this repo yet**:

- Exact benchmark/performance claims between frameworks unless tied to original benchmark repo/docs.
- Star/fork growth claims unless matched to current source snapshots.
- “Best” command/skill pack claims without direct inspection of representative files.
- Secondary blog claims about Blender workflow quality without official or high-trust production references.

---

## Sources rejected or down-ranked

1. **Down-ranked: low-governance “awesome” entries without active maintenance signals**
   - Reason: useful as pointers only; insufficient verification depth.

2. **Down-ranked: docs with obvious drift or transitional placeholders**
   - Example signals: transitional TODO-heavy root docs, stale catalog sections.

3. **Rejected for core guidance: uncited/random blog posts for Blender quality rules**
   - BlendOps requires official docs or high-quality production references.

---

## What these sources do well

- Treat skills as **modular units** instead of giant system prompts.
- Separate **rules/guardrails** from **workflow steps**.
- Use install/update artifacts to support maintainability.
- Add explicit verification checkpoints before completion.
- Maintain reference catalogs with generation/automation to reduce manual drift.

---

## Common failure modes to avoid in BlendOps

- Monolithic “everything prompt” files that become unmaintainable.
- Unclear trigger rules that lead to accidental over-activation.
- No deterministic checks (relying only on prose).
- Mixing historical and active guidance in the same entrypoint.
- Rebuilding runtime infrastructure before workflow contracts are stable.

---

## BlendOps takeaway (research phase)

BlendOps should implement a **portable, runtime-light skill/law system** that:
- relies on external runtime references for execution,
- keeps policy/guardrails explicit and testable,
- separates core/stable from experimental patterns,
- and prioritizes verifiable outputs for non-Blender users.

This document intentionally stops before final law specification (that is in synthesis docs).
