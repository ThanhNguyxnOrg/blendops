# Install Patterns Research for BlendOps

Status: Draft research
Date: 2026-04-29

## Scope

This research evaluates agent-driven install/adoption patterns for attaching BlendOps as a workflow/skill pack.

Research targets requested:
- https://github.com/code-yeongyu/oh-my-openagent
- README install sections and installation guide docs if accessible
- official Claude Code docs for skills/hooks/commands
- OpenCode skill/plugin docs patterns
- Cursor rules/project docs patterns
- Codex / AGENTS.md project-instruction patterns

## Source confidence legend

- **verified-read**: source content fetched/read in this environment
- **linked-only**: source link known but detailed content not fetched/read here
- **mixed**: partially fetched + partially linked-only

## Source notes and access status

- `oh-my-openagent` repo/README/install guide: verified-read
  - https://github.com/code-yeongyu/oh-my-openagent
  - https://github.com/code-yeongyu/oh-my-openagent/blob/main/README.md
  - https://github.com/code-yeongyu/oh-my-openagent/blob/main/docs/guide/installation.md
- Claude Code docs baseline references: mixed (some previously fetched/read, some linked-only in this pass)
  - https://docs.anthropic.com/en/docs/claude-code/skills
  - https://docs.anthropic.com/en/docs/claude-code/hooks-guide
  - https://docs.anthropic.com/en/docs/claude-code/permissions
- OpenCode/Cursor/Codex pattern references: linked-only in this pass (no invented path assumptions)

---

## Findings table

| Source | Install model | Human UX | Agent UX | Paths/config | Verification | BlendOps lesson | Avoid |
|---|---|---|---|---|---|---|---|
| [`code-yeongyu/oh-my-openagent`](https://github.com/code-yeongyu/oh-my-openagent) repo root | Agent-assisted install model centered on short human prompt + agent execution flow | User pastes one prompt and delegates install to agent | Agent fetches guide/instructions and applies project changes | **verified-read** (repo/paths inspected in this pass) | Validate by checking changed files and reporting what was touched | Borrow the “single prompt + explicit change summary” UX | Avoid copying wording verbatim or inheriting unrelated runtime assumptions |
| [`oh-my-openagent` README install section](https://github.com/code-yeongyu/oh-my-openagent/blob/main/README.md) | Human prompt delegation + agent raw-guide fetch model | Fast onboarding for humans | Agent-friendly fetch-and-follow install pattern | **verified-read** in this pass | Requires agent to report modifications and verify artifacts | Keep install entrypoint short and agent-readable | Avoid destructive/global mutations without explicit user opt-in |
| [`oh-my-openagent` installation guide](https://github.com/code-yeongyu/oh-my-openagent/blob/main/docs/guide/installation.md) | Detailed procedure layer behind quick prompt handoff | Human fallback beyond quick prompt | Agent fetches raw guide and follows explicit steps | **verified-read** in this pass | Verify step completion against actual file outcomes | Separate quick prompt from full guide in BlendOps too | Avoid undocumented assumptions about host/global paths |
| Official Claude Code docs (skills/hooks/permissions ecosystem) | Official structured guidance model for project instructions and skill behavior | Human reads docs for canonical behavior | Agent can follow project-local instruction files and skill docs | **mixed** (Claude docs were previously fetched/read in earlier phases; not fully re-fetched in this pass) | Use explicit status/evidence and avoid unsupported claims | Project-local instruction-first model is low-risk for BlendOps v0 | Avoid implying runtime install is part of skill-pack attach |
| OpenCode docs patterns (skills/plugins) | Tool-specific extension/skill attachment model | Human can configure per-project or user-level behavior depending on tool | Agent can write project-local skill/config entrypoints when verified | **linked-only** in this pass | Verify created files + no global mutation unless requested | Keep OpenCode adoption optional and path-verified | Avoid guessing unsupported paths/flags |
| Cursor rules/project docs patterns | Rules-file/project-context attachment model | Human can attach concise project rules | Agent can create/update project-local rules doc | **linked-only** in this pass (limited direct source retrieval) | Verify rules file exists and references BlendOps pack paths | Cursor support should default to project-local rules attachment | Avoid broad global rule mutation by default |
| Codex / AGENTS.md project instruction patterns | Project-instruction attachment via AGENTS-style file | Human can review one project instruction file | Agent can append a bounded BlendOps section and references | **linked-only** in this pass | Verify instruction file exists and backup before overwrite | Use AGENTS.md as generic fallback when tool paths uncertain | Avoid tool-specific assumptions when environment is unknown |

---

## Cross-source synthesis

### What to borrow

1. **Single copy-paste human prompt** that points agent to a raw guide.
2. **Agent-readable mission + safety rules** before any file mutation.
3. **Project-local default install mode** with explicit global opt-in.
4. **Deterministic verification output** listing exactly what changed.
5. **Rollback instructions** as part of install completion.

### What to avoid

1. Global config mutations without explicit consent.
2. Runtime installation claims in a docs/skill-pack installer.
3. Tool-path assumptions without confidence labeling.
4. Verbose or destructive scripts for v0.
5. Mixing runtime setup execution with skill-pack attach.

---

## Recommended v0 direction from research

BlendOps v0 should ship as a **docs/skill-pack adoption flow**:
- project-local by default
- global only by explicit request + backup/rollback
- official runtime remains external prerequisite
- install guide is agent-oriented and reversible

This keeps risk low while making agent adoption practical.

---

## Known research gaps (explicit)

- Full direct fetch of some tool-specific docs (OpenCode/Cursor/Codex pattern docs) was not consistently available in this pass.
- Cursor docs discovery returned incomplete results/rate-limit behavior in this pass.

These gaps are recorded as **linked-only** and are not used for high-confidence procedural claims.
