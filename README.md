# 🦾 BlendOps

<p align="center">
  <strong>AI-native Blender workflow specs for people who do not know Blender.</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green.svg"></a>
  <img alt="Status: Draft v0" src="https://img.shields.io/badge/status-draft%20v0-orange.svg">
  <img alt="Runtime eval: Not Run" src="https://img.shields.io/badge/runtime%20eval-Not%20Run-lightgrey.svg">
  <img alt="Artifacts: Not Produced" src="https://img.shields.io/badge/artifacts-Not%20Produced-lightgrey.svg">
</p>

BlendOps is a portable **AI-agent Skills pack for Blender**, built for users who don't know Blender. Think of it as "superpowers for the Blender domain" — a set of `SKILL.md`-based capabilities (planning, runtime readiness, evidence, plain-language handoff) that load on-demand inside any compatible AI agent.

```txt
Human intent (non-Blender user)
  → BlendOps Skills (planning · readiness · evidence · handoff)
  → external Blender runtime via Claude Connect / Blender CLI
  → validated artifacts + non-Blender-user response
```

**Multi-agent compatible.** BlendOps is a content layer — same Skills work across:

| Surface | How |
|---|---|
| Claude Desktop (with Claude Connect for Blender) | Upload Skills via UI, runtime via Connector |
| Claude Code / Cursor / OpenCode / Codex / Gemini | Project-local install of `skills/` + `laws/` + `packs/` |
| ChatGPT (OpenAI Skills UI) | Upload `bundles/skill-package/blendops/` package |
| Any other tool | Generic project-local fallback in `bundles/generic-project-local/` |

**Complements, not replaces, Claude Connect.** Claude Connect handles the runtime bridge to Blender. BlendOps adds the *workflow knowledge* on top: how to plan a scene, what evidence to require, how to talk to non-Blender users.

> [!IMPORTANT]
> BlendOps is **Draft v0**. It is not production-ready and does not claim runtime eval completion, preview/render/GLB artifact production, or stable release status.

---

## ✨ What it does

| Capability | What you get | Current truth |
|---|---|---|
| 🧭 Intent-to-workflow planning | Structured scene planning for non-Blender-user requests | Draft v0 |
| 🛡️ Safety and validation framing | Explicit constraints and evidence rules before "done" | Draft v0 |
| 📦 Portable skill package layout | Reusable laws/skills/packs docs for project-local install or Skills UI upload prep | Draft fixture |
| 🌐 Web handoff guidance | Specs for downstream web-ready 3D handoff patterns | Draft, not runtime-proven |

---

## 🚫 What it does not do

BlendOps does **not**:

- install Blender
- ship its own runtime
- configure Claude Desktop Connector automatically
- configure official Blender MCP bridge/add-on automatically
- run Blender runtime eval by itself
- create/render/export or prove preview/render/GLB artifacts without evidence
- provide an implemented `npm`/`npx` installer
- claim marketplace/plugin listing availability

---

## ⚡ Use in 30 seconds

Paste this into any AI agent:

```txt
Read and follow the BlendOps AI Agent Quickstart:
https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/ai-agent-quickstart.md

Prepare BlendOps for this environment using the safest mode. If I need Claude/Skills upload, create separate ZIPs from skills/*/SKILL.md so they import as multiple skills. Do not install Blender, configure runtime connectors, run Blender, or claim generated artifacts. Report the selected mode, files changed or ZIP filenames, runtime status, artifact status, and limitations.
```

The full agent-facing instructions live in [docs/ai-agent-quickstart.md](./docs/ai-agent-quickstart.md). Coding agents should install project-locally; Claude Desktop-style chats should prepare one ZIP per canonical skill.

Then continue with:
- [AI Agent Install Flow](./docs/ai-agent-install-flow.md)
- [Install targets index](./docs/install/README.md)

---

## 🛠️ Pick your install path

| You are using | Selected mode | Source |
|---|---|---|
| Claude Desktop or Claude.ai chat | Multiple Skills ZIP preparation | `skills/*/SKILL.md` + [Claude Desktop guide](./docs/install/claude-desktop.md) |
| Coding agent (Claude Code/OpenCode/Cursor/Codex/Gemini/etc.) | Project-local install | [docs/ai-agent-install-flow.md](./docs/ai-agent-install-flow.md) |
| Unknown/ambiguous target | Blocked-needs-input or generic project-local fallback | `bundles/generic-project-local/` |

---

## 🧭 Runtime truth

BlendOps runtime guidance uses **four runtime routes** (replacing the older 3-stack labeling that conflated three different products into one stack — see [`docs/runtime-stack-strategy.md`](./docs/runtime-stack-strategy.md) for the corrected attribution history):

| Route | What it is | Min Blender | BlendOps verification |
|---|---|---|---|
| **Route A** Anthropic Blender Connector | One-click toggle in Claude Desktop, Anthropic-shipped April 2026 | **4.2+** (4.5 LTS recommended) | Not Verified |
| **Route B** Blender Foundation MCP Server (`bpype/blender_mcp`) | Standalone MCP server from Blender Foundation Lab | **5.1+** | Ambiguous (smoke test tool names match this route, but attribution unclear) |
| **Route C** Community Blender MCP (`ahujasid/blender-mcp`) | Mature 21K+ stars prior-art project; only path for many non-Claude clients | **3.0+** | User-reported verified (no formal evidence file yet) |
| **Route D** Official Blender CLI | Direct `blender --background --python` invocation, no MCP | 4.2+ recommended | Not Run |

> [!WARNING]
> The **Blender 5.1+** requirement applies **only to Route B** (Blender Foundation MCP Server, `bpype/blender_mcp`). It does **not** apply to Route A, Route C, or Route D. Earlier BlendOps drafts conflated Routes A and B into one "Stack 1" and incorrectly required 5.1+ for the whole stack — that mistake is corrected in the runtime docs.

> [!IMPORTANT]
> **Currently no route has a clean fresh evidence record.** The 2026-04-29 smoke test was originally labeled Route A, but its tool names (`get_blendfile_summary_*`) match Route B; the user reports verifying Route C separately. See [`docs/evals/blender-connector-read-only-smoke-test.md`](./docs/evals/blender-connector-read-only-smoke-test.md) for the corrected attribution. A fresh re-verification is needed before any route can move from "Not Verified" / "Ambiguous" / "User-reported" to documented "Verified".

> [!NOTE]
> **Naming glossary.** Anthropic's product is called the **Blender Connector** (full name: Claude Desktop Blender Connector). Across BlendOps docs and the wider community you will also see "Claude Connect" and "Claude Connector" as shorter synonyms for it. They all refer to **Route A** — the one-click toggle inside Claude Desktop. They do **not** refer to the Blender Foundation's standalone MCP server (Route B) or the community `ahujasid/blender-mcp` project (Route C). When precision matters, name the route.

For runtime setup details, see [`docs/runtime-stack-strategy.md`](./docs/runtime-stack-strategy.md) and [`docs/external-runtime-setup.md`](./docs/external-runtime-setup.md).

---

## 🗺️ Project map

High-value links:

- **Start here:** [docs/start-here.md](./docs/start-here.md)
- **Full docs index:** [docs/README.md](./docs/README.md)
- **Skill package:** [bundles/skill-package/blendops/](./bundles/skill-package/blendops/)
- **Claude Desktop bundle:** [bundles/claude-desktop-manual/](./bundles/claude-desktop-manual/)
- **Generic bundle:** [bundles/generic-project-local/](./bundles/generic-project-local/)
- **Runtime stack:** [docs/runtime-stack-strategy.md](./docs/runtime-stack-strategy.md)
- **Evals:** [docs/evals/README.md](./docs/evals/README.md)

---

## 📄 License

MIT — see [LICENSE](./LICENSE).
