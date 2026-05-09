<div align="center">

# 🦾 BlendOps

**AI-native Blender workflow specs for people who do not know Blender.**

[![License: MIT](https://img.shields.io/badge/license-MIT-2ea44f.svg?style=flat-square)](./LICENSE)
[![Status: Draft v0](https://img.shields.io/badge/status-draft%20v0-orange.svg?style=flat-square)](./docs/release-readiness.md)
[![Runtime model: 2-path + CLI appendix](https://img.shields.io/badge/runtime%20model-2--path%20%2B%20CLI%20appendix-6f42c1.svg?style=flat-square)](./docs/runtime-stack-strategy.md)
[![Path 1 read-only smoke: Pass](https://img.shields.io/badge/path%201%20smoke-Pass-2ea44f.svg?style=flat-square)](./docs/evals/blender-connector-read-only-smoke-test.md)
[![Path 2 user-reported: verified](https://img.shields.io/badge/path%202%20user--reported-verified-2ea44f.svg?style=flat-square)](./docs/unofficial-runtime-bridges.md)
[![Full runtime eval: Not Run](https://img.shields.io/badge/full%20runtime%20eval-Not%20Run-lightgrey.svg?style=flat-square)](./docs/release-readiness-rollup-v0.md)
[![Artifacts: Not Produced](https://img.shields.io/badge/artifacts-Not%20Produced-lightgrey.svg?style=flat-square)](./docs/release-readiness-rollup-v0.md)
[![Release: v0.1.0-draft](https://img.shields.io/github/v/release/ThanhNguyxnOrg/blendops?include_prereleases&label=release&color=2ea44f&style=flat-square)](https://github.com/ThanhNguyxnOrg/blendops/releases/tag/v0.1.0-draft)

[![Skills: 32](https://img.shields.io/badge/skills-32-1f6feb.svg?style=flat-square)](./skills/README.md)
[![Laws: 4](https://img.shields.io/badge/laws-4-1f6feb.svg?style=flat-square)](./laws/README.md)
[![Packs: 1](https://img.shields.io/badge/packs-1-1f6feb.svg?style=flat-square)](./packs/README.md)
[![Install targets: 16](https://img.shields.io/badge/install%20targets-16-1f6feb.svg?style=flat-square)](./docs/install/README.md)
[![Adapters: 6](https://img.shields.io/badge/adapters-6-1f6feb.svg?style=flat-square)](./docs/adapters/README.md)
[![Bundles: 3](https://img.shields.io/badge/bundles-3-1f6feb.svg?style=flat-square)](./bundles/)
[![Inspired by: Superpowers + BMad](https://img.shields.io/badge/inspired%20by-Superpowers%20%2B%20BMad-orange.svg?style=flat-square)](./skills/README.md)

[![Anthropic: Blender Connector](https://img.shields.io/badge/Anthropic-Blender%20Connector%20(Path%201%20host)-d97757.svg?style=flat-square)](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude)
[![Blender Lab: MCP server](https://img.shields.io/badge/Blender%20Lab-MCP%20server%20(Path%201%20Blender--side)-f5792a.svg?style=flat-square)](https://www.blender.org/lab/mcp-server/)
[![Community: ahujasid/blender-mcp](https://img.shields.io/badge/Community-ahujasid%2Fblender--mcp%20(Path%202)-181717.svg?style=flat-square&logo=github)](https://github.com/ahujasid/blender-mcp)

[![Coding agent: Claude Code](https://img.shields.io/badge/coding%20agent-Claude%20Code-d97757.svg?style=flat-square)](./docs/install/claude-code.md)
[![Coding agent: Cursor](https://img.shields.io/badge/coding%20agent-Cursor-1f6feb.svg?style=flat-square)](./docs/install/cursor.md)
[![Coding agent: Codex](https://img.shields.io/badge/coding%20agent-Codex-10a37f.svg?style=flat-square)](./docs/install/codex.md)
[![Coding agent: Cline](https://img.shields.io/badge/coding%20agent-Cline-007ACC.svg?style=flat-square)](./docs/install/cline.md)
[![Coding agent: Continue.dev](https://img.shields.io/badge/coding%20agent-Continue.dev-5436DA.svg?style=flat-square)](./docs/install/continue.md)
[![Coding agent: Zed](https://img.shields.io/badge/coding%20agent-Zed-D29922.svg?style=flat-square)](./docs/install/zed.md)
[![Coding agent: goose](https://img.shields.io/badge/coding%20agent-goose%20(Block)-FF8C00.svg?style=flat-square)](./docs/install/goose.md)
[![+ 4 more coding agents](https://img.shields.io/badge/%2B%204%20more%20coding%20agents-OpenCode%20%E2%80%A2%20Gemini%20%E2%80%A2%20Antigravity%20%E2%80%A2%20Copilot-1f6feb.svg?style=flat-square)](./docs/install/README.md)

[![Local LLM: Ollama](https://img.shields.io/badge/local%20LLM-Ollama-000000.svg?style=flat-square)](./docs/install/ollama.md)
[![Local LLM: LM Studio](https://img.shields.io/badge/local%20LLM-LM%20Studio-7e57c2.svg?style=flat-square)](./docs/install/lm-studio.md)
[![Local LLM: Open WebUI](https://img.shields.io/badge/local%20LLM-Open%20WebUI-1f8a44.svg?style=flat-square)](./docs/install/open-webui.md)

</div>

> [!IMPORTANT]
> This README is a quick skim. **Full documentation lives in [`docs/README.md`](./docs/README.md)** — bookmark that page for everything (specs, runtime, install, evals, laws, skills, recipes, research).

---

## ✨ What it is, in 3 lines

- A **portable AI-agent Skills pack for Blender**, built for users who don't know Blender.
- A **content layer** (`SKILL.md`-based) that loads inside any compatible AI agent.
- **Complements** Anthropic Blender Connector + Blender Lab MCP — does **not** replace them.

```txt
Human intent (non-Blender user)
  → BlendOps Skills (planning · readiness · evidence · handoff)
  → external Blender runtime (Path 1 Lab MCP / Path 2 community / CLI)
  → validated artifacts + non-Blender-user response
```

---

## 🎯 Scope (what BlendOps is and isn't)

| BlendOps **publishes** (this repo's deliverable) | BlendOps **redirects to** (upstream — not this repo's work) |
|---|---|
| 32 skills (planning, readiness, evidence, handoff, troubleshooting, brainstorming, web 3D handoff deep, quality validation deep, domain scene planners, process discipline, …) | **Path 1 — Blender Lab MCP** (Lab add-on + Lab server). Owner: Blender Foundation. Source: [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/) |
| 4 laws (evidence-before-done, official-runtime-only, no-arbitrary-python-interface, non-blender-user-language) | **Path 1 host (a) — Anthropic Blender Connector** (Claude-Desktop-specific MCP host). Owner: Anthropic. Source: [claude.com/.../using-the-blender-connector-in-claude](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude) |
| 1 pack (`product-hero-v0`), 3 bundles (skill-package, claude-desktop-manual, generic-project-local) | **Path 2 — Community `ahujasid/blender-mcp`** (different add-on/server). Owner: 21K+ stars community project. Source: [github.com/ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp) |
| 16 install target docs + 3 mode auto-detect install flow | **CLI fallback** (`blender --background --python ...`). Owner: Blender Foundation. Source: [docs.blender.org/manual/.../command_line](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html) |
| Skill ZIP / OpenAI YAML / canonical bundle generation (`npm run skills:export` → 16 ZIPs) | The Blender executable, MCP servers, MCP host clients, OS, GPU drivers, network. |

**What this means for "completeness":**

- The **skills layer** (32 skills + workflows + install docs + ZIP generation + CI guards) is **complete** at Draft v0 — nothing upstream blocks it. Roadmap target: 48 skills (3x); progress 32/48.
- Whether the **upstream runtime paths work in your environment** is up to upstream Blender Foundation / Anthropic / `ahujasid` (Path 1 + Path 2 are user-reported verified by the repo owner; CLI is decades-stable upstream). BlendOps **redirects** to them via per-target install docs but does not own their stability.
- The "Full runtime eval: Not Run" / "Artifacts: Not Produced" labels refer to **in-repo provenance evidence files only** — operator-side records under `docs/evals/`. They do **not** mean "the upstream runtime paths don't work" or "BlendOps is incomplete."

---

## ⚡ Use in 30 seconds

Paste this into any AI agent:

```txt
Read and follow the BlendOps AI Agent Quickstart:
https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/ai-agent-quickstart.md

Auto-detect your environment first, then pick one mode:
- If you have project filesystem write access → Mode A: install BlendOps project-locally (skills/, laws/, packs/, target-specific entrypoint).
- If you are in a chat-only UI (Claude Desktop chat, Claude.ai, ChatGPT) with no filesystem write → Mode B: output 16 separate ZIPs from skills/*/SKILL.md (one ZIP per skill) for me to drag-drop into the Skills UI manually.
- If you cannot fetch the repo, cannot write, AND cannot output ZIPs → Mode C: ask one concise question.

Do not install Blender, configure runtime connectors, run Blender, or claim generated artifacts. Report the selected mode, files changed or ZIP filenames, runtime status, artifact status, and limitations.
```

The agent auto-detects which mode applies. Coding agents (Claude Code, Cursor, Codex, OpenCode, Cline, Continue, Zed, goose, Gemini, Copilot, Antigravity) hit **Mode A** and install **project-locally**. Claude Desktop / Claude.ai / ChatGPT chats hit **Mode B** and output **separate ZIPs from skills/*/SKILL.md** (one per skill) for you to drag-drop into the Skills UI manually. Anything else falls back to **Mode C — blocked-needs-input**. Full mode logic in [`docs/ai-agent-install-flow.md`](./docs/ai-agent-install-flow.md).

---

## 🧭 Runtime in one paragraph

BlendOps recognizes **2 MCP execution paths + a CLI fallback appendix** ([full doc](./docs/runtime-stack-strategy.md)):

- **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) **Anthropic Blender Connector** in Claude Desktop, or (b) any other MCP client configured manually).
- **Path 2 — Community `ahujasid/blender-mcp`** (different add-on/server, mature 21K+ stars third-party, Blender 3.0+).
- **CLI fallback (appendix)** — direct `blender --background --python`. **Documented upstream** as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

> [!WARNING]
> **Anthropic Connector is not standalone.** Anthropic's tutorial step 2 explicitly tells you to install the Blender Lab MCP add-on inside Blender. The Connector is the Claude-Desktop-specific MCP host on top of the Lab stack. **Path 1 needs Blender 5.1+ regardless of host** because of the Lab add-on manifest.

---

## 📚 Read more

| Want to | Open |
|---|---|
| **Read everything (the hub)** | [`docs/README.md`](./docs/README.md) |
| 5-minute orientation | [`docs/start-here.md`](./docs/start-here.md) |
| Set up Blender runtime | [`docs/external-runtime-setup.md`](./docs/external-runtime-setup.md) |
| Install BlendOps in your AI tool | [`docs/install/README.md`](./docs/install/README.md) |
| Browse skills / laws / packs | [`skills/README.md`](./skills/README.md) · [`laws/README.md`](./laws/README.md) · [`packs/README.md`](./packs/README.md) |
| Check release readiness | [`docs/release-readiness.md`](./docs/release-readiness.md) |
| See the canonical portable skill package | [`bundles/skill-package/blendops/`](./bundles/skill-package/blendops/) |

---

## 🚫 What it does **not** do

BlendOps does not install Blender, ship its own runtime, configure Anthropic Connector or the Lab MCP add-on for you, run Blender, claim mutation/render/export artifacts, ship an `npx` installer, or claim a marketplace listing. See [`docs/release-readiness.md`](./docs/release-readiness.md) for the honest current state.

---

## 📄 License

MIT — see [`LICENSE`](./LICENSE).
