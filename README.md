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

BlendOps helps an AI coding agent turn plain-language 3D requests into constrained Blender workflow plans, validation expectations, and practical handoff guidance.

```txt
Human intent
  → BlendOps laws / skills / workflow specs
  → AI-generated scene plan
  → official external Blender runtime execution
  → validation notes and handoff guidance
```

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

BlendOps runtime guidance uses three stacks:

1. **Stack 1 — Claude Desktop official connector stack** (Claude Desktop Blender Connector + official Blender MCP bridge/add-on)
2. **Stack 2 — Official Blender CLI fallback**
3. **Stack 3 — Optional unofficial third-party bridge stack** (experimental/local only, not official release path)

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is **not verified** and is **not currently a supported BlendOps route**.

For runtime setup details, see [docs/runtime-stack-strategy.md](./docs/runtime-stack-strategy.md).

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
