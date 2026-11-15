# 🚀 Start Here

Welcome to BlendOps! This guide helps you understand what BlendOps is, where it stands, and how to get started.

> [!IMPORTANT]
> BlendOps is **v1.0.0 (Production)**. Read this guide to understand what BlendOps ships, how it connects to Blender via external runtime paths, and what truth guarantees it enforces.

---

## 📊 Current status at a glance

| Area | Status | What it means |
|---|---|---|
| **Product version** | v1.0.0 | Production skills, knowledge/recipe catalogs, CLI tooling, and CI suite |
| **Runtime eval** | Not Run | Live Blender official runtime manual eval is optional operator-side provenance |
| **Artifacts** | Not Produced | No preview/render/GLB files generated in this repo |
| **Package/marketplace** | Not Published | CLI package metadata is public-release ready; first npm staged publication awaits maintainer approval; no marketplace listing |
| **Canonical skill package** | Verified fixture | `bundles/skill-package/blendops/` built and checked by CI |

---

## 🧭 Choose your path

Pick the path that matches what you want to do:

### 🎯 I want to understand BlendOps

**Start with:**
- [Product direction](./product-direction.md) — what BlendOps is and isn't
- [Architecture](./architecture.md) — how the pieces fit together
- [First user journey](./first-user-journey.md) — what a non-Blender user experiences

**Then explore:**
- [Workflow contract](./workflow-contract.md) — what BlendOps promises
- [Safety model](./safety-model.md) — how BlendOps stays safe
- [Golden path spec](./golden-path-cyberpunk-shoe.md) — example workflow

---

### 📦 I want to install/use the skill package

**Current reality:**
- BlendOps is not yet published to the public npm registry; its first staged release is awaiting maintainer approval. No marketplace listing exists.
- The CLI (`bin/blendops.mjs` / `scripts/install-skills.mjs`) is packaged and tested via `npm pack`; public `npx blendops` use is unavailable until the staged version is approved.
- Installation is project-local or multiple-skill-zip-prepared, transactional, and reversible

Use the short prompt from [README.md](../README.md#-use-in-30-seconds). The agent will read [AI Agent Quickstart](./ai-agent-quickstart.md) and auto-select project-local install or multiple Skills ZIP preparation.

**Your options:**

| Method | Best for | Start here |
|---|---|---|
| **30-second prompt** | Any AI/agent | [README 30-second prompt](../README.md#-use-in-30-seconds) |
| **Project-local install details** | Claude Code, OpenCode, Cursor, Codex, Gemini, GitHub Copilot | [AI agent install flow](./ai-agent-install-flow.md) |
| **Claude Desktop multiple ZIP details** | Claude Desktop / Claude.ai Skills UI upload prep | [Claude Desktop install guide](./install/claude-desktop.md) |
| **Generic project-local fallback** | Unknown/unsupported writable projects | [Generic bundle](../bundles/generic-project-local/README.md) |

**Canonical package source:**
- `bundles/skill-package/blendops/` — target-neutral portable package and skill.zip source
- See [package README](../bundles/skill-package/README.md) for structure

**Per-target install docs:**
- [docs/install/README.md](./install/README.md) — target-specific fallback details

---

### 🖥️ I use Claude Desktop

**What you need to know:**
- Use the short prompt from [README.md](../README.md#-use-in-30-seconds); expected mode is usually multiple Skills ZIP preparation
- BlendOps skill package can be manually imported as a Personal Skill
- Runtime requires separate Claude Desktop Blender Connector setup
- Connector configuration is not automatic

**Start here:**
- [README 30-second prompt](../README.md#-use-in-30-seconds)
- [Claude Desktop install guide](./install/claude-desktop.md)
- [Claude Desktop manual bundle](../bundles/claude-desktop-manual/README.md)
- [Claude app setup notes](./claude-app-setup.md)

**Runtime setup (separate step):**
- [External runtime setup](./external-runtime-setup.md)
- [Runtime stack strategy](./runtime-stack-strategy.md)

---

### 💻 I use a coding agent (Claude Code, OpenCode, Cursor, etc.)

**What you need to know:**
- Installation is project-local by default
- Use the short README prompt for automatic setup via [AI Agent Quickstart](./ai-agent-quickstart.md)
- Coding agents host Path 1 via manual MCP config (host option b) or Path 2; native skill-loader maturity varies per tool

**Start here:**
- [README 30-second prompt](../README.md#-use-in-30-seconds)
- [AI agent install flow](./ai-agent-install-flow.md) — project-local mode details
- [Multi-agent install strategy](./multi-agent-install-strategy.md) — cross-tool approach

**Per-tool guides:**
- [Claude Code](./install/claude-code.md)
- [OpenCode](./install/opencode.md)
- [Cursor](./install/cursor.md)
- [Codex](./install/codex.md)
- [Gemini](./install/gemini.md)
- [GitHub Copilot](./install/github-copilot.md)

---

### ⚙️ I want runtime setup

**Critical distinction:**
- **Skill install** = attach BlendOps workflow knowledge to your project
- **Runtime setup** = configure Blender execution environment (separate step)

**BlendOps does NOT:**
- Install Blender
- Configure Claude Desktop Connector automatically
- Configure official Blender MCP bridge/add-on automatically
- Ship its own runtime

**Runtime path options (2-path + CLI appendix model):**

| Path | What it is | Min Blender |
|---|---|---|
| **Path 1** | Official **Blender Lab MCP** (Lab add-on + Lab server in Blender), hosted from either (a) Anthropic Blender Connector in Claude Desktop, OR (b) any other MCP client configured manually | **5.1+** (Lab add-on manifest) |
| **Path 2** | Community **`mcp-for-blender`** (formerly `ahujasid/blender-mcp`, mature third-party, different add-on/server) | 3.0+ |
| **CLI fallback (appendix)** | Direct `blender --background --python` — no MCP | 4.2+ recommended; documented upstream as a first-class Blender CLI surface; no in-repo evidence file yet |

**Anthropic Connector is not a separate path.** It is one host option for Path 1; you still install the Blender Lab MCP add-on inside Blender either way (Anthropic tutorial step 2). The 5.1+ floor applies whichever Path 1 host you pick. See [`docs/runtime-stack-strategy.md`](./runtime-stack-strategy.md) for the corrected attribution history of the 2026-04-29 smoke test.

**Start here:**
- [External runtime setup](./external-runtime-setup.md) — overview
- [Runtime stack strategy](./runtime-stack-strategy.md) — detailed stack comparison
- [Reference runtime](./reference-runtime.md) — runtime boundary rules

**Official upstream docs:**
- [Blender MCP project](https://projects.blender.org/lab/blender_mcp)
- [Blender Lab MCP page](https://www.blender.org/lab/mcp-server/)
- [Claude Blender Connector tutorial](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude)
- [Blender CLI docs](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)

---

### 🧪 I want eval/release readiness

**Current status:**
- Production `v1.0.0` skills, knowledge, recipe, CLI, and CI layers
- Runtime eval: Not Run
- Artifacts: Not Produced
- Public npm package: Not Published (initial staged publication pending approval); marketplace listing: Not Published

**Start here:**
- [Release readiness](./release-readiness.md) — current release readiness and scope boundaries
- [Evals index](./evals/README.md) — all eval protocols and results

**Eval evidence:**
- [Cyberpunk shoe v0 text-only eval](./evals/cyberpunk-shoe-hero-v0-text-eval.md) — Executed / Text-only
- [Cyberpunk shoe v0 manual eval protocol](./evals/cyberpunk-shoe-hero-v0-manual-eval.md) — Protocol / Not yet executed
- [Manual install beta v0](./evals/manual-install-beta-v0.md) — Executed / Dry-run / Warn
- [Skill package upload-readiness v0](./evals/skill-package-upload-readiness-v0.md) — Executed / Text-only / No upload / Warn

---

## 🎯 Runtime summary

BlendOps documents **two MCP execution paths** plus a **CLI fallback appendix** (replaces older 3-stack and 4-route drafts that mis-described the Anthropic Connector ↔ Blender Lab MCP relationship):

| Path | Description | Verification status |
|---|---|---|
| **Path 1** | Official Blender Lab MCP (Lab add-on + Lab server, **Blender 5.1+**), hosted from Anthropic Blender Connector OR any other MCP client manually configured | Read-only smoke 2026-04-29 (likely Anthropic Connector host); mutation/render/export `Not Run` |
| **Path 2** | Community **`mcp-for-blender`** (formerly `ahujasid/blender-mcp`, mature third-party, **Blender 3.0+**) | User-reported verified 2026-05-08 (operator statement, does not promote eval scope); no formal eval file yet |
| **CLI fallback** | Direct `blender --background --python` (no MCP, **Blender 4.2+ recommended**) | Not Run; documented upstream as a first-class Blender CLI surface; no in-repo evidence file yet |

**Single-bridge constraint:** Blender accepts one MCP bridge session per Blender instance on the default port (`localhost:9876`). Do not run Path 1 + Path 2 concurrently against the same Blender instance. Side-by-side on separate instances is supported upstream via per-instance `--port 9877`.

**Key point:** BlendOps does not ship its own runtime. The Anthropic Connector is a Claude-Desktop-specific MCP host on top of Blender Lab MCP — not a separate runtime, and not standalone. Lab MCP add-on must be installed in Blender either way.

---

## 📦 Install/package summary

**Canonical portable skill package:**
- Source: `bundles/skill-package/blendops/`
- Structure: `SKILL.md` + `references/` (target-neutral core) + `agents/openai.yaml` (OpenAI metadata only)
- Status: Verified local fixture (`1.0.0`), not published to a marketplace

**Claude Desktop manual bundle:**
- Source: `bundles/claude-desktop-manual/`
- Purpose: Manual Personal Skill import for Claude Desktop
- Status: Verified local fixture (`1.0.0`); does not claim connector/runtime success

**Generic project-local fallback:**
- Source: `bundles/generic-project-local/`
- Purpose: Unknown/unsupported tool fallback
- Status: Verified local fixture (`1.0.0`) with rollback notes

**Per-target install docs:**
- [docs/install/README.md](./install/README.md) — all target-specific guides

**Local repository installer & future `npx`:**
- Local repository script: `node scripts/install-skills.mjs` (`--doctor`, `--dry-run`, `--write`, `--rollback`) — see [docs/install/installer-spec.md](./install/installer-spec.md)
- Public `npm`/`npx`: Not published yet; use only after the initial staged release is approved and the registry version is verified

---

## ⚖️ Evidence truth

BlendOps uses strict evidence labels:

| Label | Meaning |
|---|---|
| **Not Run** | Runtime eval has not been executed |
| **Attempted** | Tried but no success confirmation |
| **Produced** | Generated file or visible output exists |
| **Verified** | Produced + validated against acceptance criteria |
| **Failed** | Attempted and confirmed failure |

**Critical rules:**
- Do not claim preview/render/GLB exists without evidence
- Do not upgrade "Attempted" to "Produced" without generated file
- Do not claim runtime eval passed without execution record
- Transcript alone is not enough for runtime success

See [Evidence before done law](../laws/evidence-before-done.md) for full rules.

---

## 📚 Full docs index

For exhaustive documentation navigation, see:
- **[docs/README.md](./README.md)** — complete docs index with all sections

---

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [AGENTS.md](../AGENTS.md) for contributor guidelines and required pre-PR verification (`npm run ci`).

---

## 📄 License

MIT — see [LICENSE](../LICENSE).
