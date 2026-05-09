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

BlendOps runtime guidance uses **two MCP execution paths** plus a **CLI fallback appendix**. Earlier 3-stack and 4-route drafts conflated separate things — the corrected model and history live in [`docs/runtime-stack-strategy.md`](./docs/runtime-stack-strategy.md).

| Path | Blender-side stack | Host options | Min Blender | BlendOps verification |
|---|---|---|---|---|
| **Path 1** Official Blender Lab MCP | **Lab MCP add-on + Lab MCP server** from `blender.org/lab/mcp-server` (`bpype/blender_mcp`) | (a) Anthropic Blender Connector in Claude Desktop (one-click toggle), OR (b) any other MCP client (Claude Code, Cursor, Codex, OpenCode, Cline, VS Code) configured manually | **5.1+** (Lab add-on manifest) | Read-only smoke test 2026-04-29 (likely via Anthropic Connector host); mutation/render/export `Not Run` |
| **Path 2** Community `ahujasid/blender-mcp` | Different `addon.py` + server via `uvx blender-mcp` (mature 21K+ stars third-party) | Any MCP client | **3.0+** | User-reported verified; no formal eval file yet |
| **CLI fallback (appendix)** | None — direct `blender` executable | Shell `blender --background --python …` | 4.2+ recommended | **Publisher has not verified** in this repo. Documented only. |

> [!IMPORTANT]
> **Anthropic Connector is not standalone.** Anthropic's tutorial step 2 explicitly tells you to install the **Blender Lab MCP add-on inside Blender** ([`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/)). The Connector toggle is just the Claude-Desktop-specific MCP host on top of the same Lab stack — there is no Anthropic-only Blender component. Because the Lab add-on requires Blender 5.1+, **Path 1 needs Blender 5.1+ even when you use the Anthropic Connector**, despite Anthropic's tutorial mentioning "4.2+" elsewhere.

> [!WARNING]
> **The 5.1+ floor is not optional for Path 1.** It applies whether the host is Anthropic Connector (Path 1 host a) or a manual MCP client (Path 1 host b). Only Path 2 (community `ahujasid/blender-mcp`) is documented at Blender 3.0+. The CLI fallback appendix is unrelated to MCP.

> [!NOTE]
> **Naming glossary.** "Claude Connect / Claude Connector / Claude Desktop Blender Connector" all refer to **Anthropic's host option** for Path 1. They do **not** refer to "the entire Blender-side stack" — Lab MCP in Blender is required either way. When precision matters, name the path **and** the host (e.g. "Path 1, host (a) Anthropic Connector").

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
