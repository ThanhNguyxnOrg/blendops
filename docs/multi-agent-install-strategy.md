# Multi-Agent Install Strategy

Status: Draft v0 strategy  
Scope: BlendOps skill/law/pack installation, not Blender runtime installation

> [!IMPORTANT]
> BlendOps is a Blender workflow, skill, law, and pack collection. Installing BlendOps content is separate from configuring a Blender runtime bridge. This strategy does not install Blender, run Blender, claim runtime execution success, or claim marketplace/plugin availability.

---

## High-level model

BlendOps installation has three separate layers.

| Layer | What it installs or records | Boundary |
|---|---|---|
| Skill/install layer | BlendOps docs, skills, laws, packs, adapters, references, and entrypoint instructions. | Does not install or run Blender runtime. |
| Runtime bridge layer | Stack 1 Claude Desktop official connector setup, Stack 2 official Blender CLI fallback, or Stack 3 optional unofficial bridge setup chosen by the user. | Separate setup owned by upstream docs and the local user environment; not installed by BlendOps. |
| Evidence/eval layer | Readiness checks, connector smoke tests, full runtime eval records, artifact truth labels. | Evidence is required before claiming runtime or artifact success. |

The layers may be used together, but success in one layer does not prove success in another. For example, a Claude Desktop Personal Skill import does not prove Blender connector access, and read-only connector access does not prove render/export behavior.

The canonical portable package source is `bundles/skill-package/blendops/`: `SKILL.md` plus `references/` are target-neutral core content, while `agents/openai.yaml` is OpenAI/ChatGPT Skills UI metadata only. It is not the universal adapter layer and does not configure Claude Desktop, Claude Code, OpenCode, Cursor, Codex, Gemini, Antigravity, GitHub Copilot, or generic project-local fallback installs.

---

## Target surfaces

BlendOps should plan for these targets while preserving confidence labels.

| Surface | Notes |
|---|---|
| Claude Desktop Personal Skills | User-managed skill import through Claude Desktop UI when available. Separate from connector setup. |
| Claude Desktop Blender Connector | Official runtime bridge path for Claude Desktop users. Separate from Personal Skills. |
| Claude Code | Coding-agent target; project-local or tool-native install path should be verified per adapter. |
| OpenCode | Candidate for plugin-style install later; current Draft v0 should remain project-local or documented until verified. |
| Cursor | Candidate for project/rules or tool-native attachment; verify before writing tool-specific paths. |
| Codex CLI/App | Candidate for project instruction or plugin-style attachment; do not invent paths. |
| Gemini CLI | Candidate future adapter; mark linked-only or not researched until verified. |
| Antigravity | Candidate future adapter; keep fallback-only until source-backed install path is verified. |
| GitHub Copilot | Candidate target; use generic project-local attachment unless install path evidence exists. |
| Generic root/project-local fallback | Default safe path for unknown or low-confidence tools. |

---

## Claude Desktop special case

Claude Desktop has two distinct surfaces:

1. **Personal Skills / user-facing instruction import**
   - A user manually imports or attaches BlendOps skill content through Claude Desktop UI when supported by the app UI.
   - This is a user-managed skill/install-layer action.
   - It does not prove Blender runtime access.

2. **Blender Connector**
   - A user separately enables and configures the official Claude Desktop Blender Connector.
   - The official Blender MCP bridge/add-on must be installed/enabled inside Blender and running/connected for runtime access.
   - Connector enabled does not mean a runtime eval passed.
   - A read-only connector smoke test should pass before any scene mutation.

Current evidence records should stay scoped:

- Read-only connector access can be `Pass / Available` when session summaries return.
- Full official runtime manual eval remains `Not Run` until recipe execution, validation, and evidence capture happen.
- Preview/render/GLB artifacts remain `Not Produced` until generated evidence exists.

---

## MCP-capable coding agents

Claude Code, OpenCode, Cursor, Codex, Gemini, and other MCP-capable agents may each need separate configuration for BlendOps content installation.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

Rules:

- Configuration in one client does not automatically configure another client.
- Each client should prefer a project-local or tool-native install path with a confidence label.
- If native paths are unknown, use the generic root/project-local fallback.
- Blender runtime bridge setup remains separate if Blender control is needed.
- Do not present direct official MCP as a supported runtime route for non-Claude Desktop agents.
- Do not use a non-official bridge as the BlendOps official runtime path.
- Do not claim a marketplace or plugin listing until the package is actually accepted, listed, and verified.

---

## Proposed package structure

A future single-package layout can be inspired by modular skill/plugin repositories while staying BlendOps-specific.

```txt
blendops-skill/
├─ SKILL.md
├─ agents/
├─ references/
├─ laws/
├─ packs/
├─ evals/
├─ adapters/
├─ assets/
└─ LICENSE.txt
```

Purpose of each area:

| Path | Purpose |
|---|---|
| `SKILL.md` | Top-level entrypoint that explains when and how to use BlendOps content. |
| `agents/` | Optional agent-target notes, prompts, or wrappers. |
| `references/` | Source links, status rollups, examples, and background docs. |
| `laws/` | Guardrails such as official-runtime-only and evidence-before-done. |
| `packs/` | Composed workflows and skill/law bundles. |
| `evals/` | Install, readiness, smoke, and runtime evidence records. |
| `adapters/` | Target-specific install mappings and fallback behavior. |
| `assets/` | Optional static assets only; no generated runtime artifacts by default. |
| `LICENSE.txt` | License text for redistributed package form. |

This package structure is a strategy target, not a current packaged release.

---

## Install matrix

| Surface | Skill install mechanism | Runtime bridge mechanism | Automation level | User manual steps | Current BlendOps confidence | Notes |
|---|---|---|---|---|---|---|
| Claude Desktop Personal Skills | Manual import or attachment of BlendOps skill content through Claude Desktop UI. | Separate Official Claude Blender Connector. | Manual UI import | Import skill content; separately enable connector if runtime is needed. | linked-only | Skill import does not prove runtime access. |
| Claude Desktop Blender Connector | Not a skill install surface; use BlendOps docs as guidance. | Official Claude Blender Connector plus Blender-side bridge/server. | Manual UI import / Docs-only/reference | Enable connector, connect from Blender, run read-only smoke test before mutation. | verified-read for read-only smoke evidence | Full runtime eval still Not Run. |
| Claude Code | Project-local files or verified tool-native skill path. | Direct official MCP unsupported/unverified; use Stack 2 CLI fallback if explicitly selected, or Stack 3 only as optional third-party experiment. | Project-local file install | Attach `skills/`, `laws/`, `packs/`, and entrypoint instructions. | verified-read for project-local adapter; native path environment-dependent | Keep Claude Code distinct from Claude Desktop. |
| OpenCode | Project-local files now; future tool-native install option if verified. | Direct official MCP unsupported/unverified; use Stack 2 CLI fallback if explicitly selected, or Stack 3 only as optional third-party experiment. | Project-local file install / future verified tool-native install | Add project-local entrypoint or verified config later. | linked-only | Do not claim plugin availability yet. |
| Cursor | Project-local rules/docs attachment if verified. | Direct official MCP unsupported/unverified; use Stack 2 CLI fallback if explicitly selected, or Stack 3 only as optional third-party experiment. | Project-local file install | Add project rules or docs references only after backup/approval. | linked-only | Avoid broad global rule mutation. |
| Codex CLI/App | Generic project instruction or future adapter. | Direct official MCP unsupported/unverified; use Stack 2 CLI fallback if explicitly selected, or Stack 3 only as optional third-party experiment. | Project-local file install / Docs-only/reference | Use AGENTS-style fallback when native path is unknown. | linked-only | Do not invent plugin paths. |
| Gemini CLI | Future adapter or docs-only reference until researched. | Direct official MCP unsupported/unverified; use Stack 2 CLI fallback if explicitly selected, or Stack 3 only as optional third-party experiment. | Docs-only/reference | Treat as not researched until verified. | not researched | Add adapter only after source-backed path exists. |
| Generic root/project-local fallback | `BLENDOPS.md`, `AGENTS.md`, or copied core collection references. | Direct official MCP unsupported/unverified; use Stack 2 CLI fallback if explicitly selected, or Stack 3 only as optional third-party experiment. | Project-local file install | Copy/reference core collection and record rollback. | verified-read | Default safest reversible path. |

---

## Near-term AI paste-command flow

The primary near-term UX is a user-managed paste prompt: the user copies [AI Agent Install Flow](./ai-agent-install-flow.md) into a coding agent with terminal/file access, and the agent performs a reversible project-local attachment.

This is an install-layer action only. It does not install Blender, configure runtime bridges, run runtime evals, or create preview/render/GLB artifacts. Unknown or mixed targets should use the generic project-local fallback or ask the user before writing.

Per-target guidance lives in [docs/install/](./install/README.md). Future installer behavior is specified in [docs/install/installer-spec.md](./install/installer-spec.md) and remains unimplemented.

---

## Automation levels

| Level | Meaning | BlendOps Draft v0 posture |
|---|---|---|
| Manual UI import | User imports or attaches skill content through an app UI. | Allowed when user-managed and caveated. |
| Project-local file install | Files copied or referenced inside a project. | Default near-term route. |
| Tool-native plugin install | Tool-specific plugin/config path installs BlendOps content. | Future, only after verified. |
| Marketplace/plugin install | Listed package or marketplace item. | Future, do not claim now. |
| Docs-only/reference | No files installed; user reads or links docs. | Safe fallback. |

---

## Future packaging phases

| Phase | Goal | Completion signal |
|---|---|---|
| Phase A | Project-local generic package | Reversible copy/reference flow verified in disposable projects. |
| Phase B | Claude Desktop Personal Skill bundle | User-managed import package tested without claiming connector/runtime success. |
| Phase C | OpenCode installation options research | Source-backed install/config path and rollback verified before any tool-native claim. |
| Phase D | Cursor/Codex/Gemini adapters | Each adapter has confidence labels, install scope, verification, and rollback. |
| Phase E | Marketplace/package automation if justified | Published/listed package exists and install evidence is recorded. |

Do not mark a phase complete until its evidence exists.

---

## Non-actions preserved

- No Blender runtime is installed by the skill package.
- No Blender runtime is run by install docs.
- No preview/render/GLB artifact is claimed by install success.
- No marketplace/plugin listing is claimed until verified.
- No custom BlendOps runtime implementation is introduced.
