# 🚀 Start Here

Welcome to BlendOps! This guide helps you understand what BlendOps is, where it stands, and how to get started.

> [!IMPORTANT]
> BlendOps is **Draft v0**. It's a workflow specification project, not a production-ready tool. Read this guide to understand current status and limitations before diving in.

---

## 📊 Current status at a glance

| Area | Status | What it means |
|---|---|---|
| **Product version** | Draft v0 | Workflow specs documented, no stable release claim |
| **Runtime eval** | Not Run | Official runtime manual eval has not been executed |
| **Artifacts** | Not Produced | No preview/render/GLB files generated in this repo |
| **Package/marketplace** | Not Published | No npm package, no marketplace listing |
| **Canonical skill package** | Draft fixture | `bundles/skill-package/blendops/` exists as draft source |

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
- BlendOps is not published to npm or any marketplace
- No `npx blendops` installer exists yet
- Installation is manual, project-local, and reversible

**Your options:**

| Method | Best for | Start here |
|---|---|---|
| **AI coding agent paste-prompt** | Claude Code, OpenCode, Cursor, Codex, Gemini, GitHub Copilot | [AI agent install flow](./ai-agent-install-flow.md) |
| **Claude Desktop manual import** | Claude Desktop app with Personal Skills | [Claude Desktop bundle](../bundles/claude-desktop-manual/README.md) |
| **Generic project-local fallback** | Unknown/unsupported tools | [Generic bundle](../bundles/generic-project-local/README.md) |

**Canonical package source:**
- `bundles/skill-package/blendops/` — target-neutral portable package
- See [package README](../bundles/skill-package/README.md) for structure

**Per-target install docs:**
- [docs/install/README.md](./install/README.md) — all target-specific guides

---

### 🖥️ I use Claude Desktop

**What you need to know:**
- BlendOps skill package can be manually imported as a Personal Skill
- Runtime requires separate Claude Desktop Blender Connector setup
- Connector configuration is not automatic

**Start here:**
- [Claude Desktop manual bundle](../bundles/claude-desktop-manual/README.md)
- [Claude Desktop install guide](./install/claude-desktop.md)
- [Claude app setup notes](./claude-app-setup.md)

**Runtime setup (separate step):**
- [External runtime setup](./external-runtime-setup.md)
- [Runtime stack strategy](./runtime-stack-strategy.md)

---

### 💻 I use a coding agent (Claude Code, OpenCode, Cursor, etc.)

**What you need to know:**
- Installation is project-local by default
- Use the AI agent paste-prompt for automatic setup
- Direct official MCP use from coding agents is not verified/supported

**Start here:**
- [AI agent install flow](./ai-agent-install-flow.md) — copy-paste prompt
- [Agent install guide](./agent-install.md) — detailed instructions
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

**Runtime stack options:**

| Stack | What it is | When to use |
|---|---|---|
| **Stack 1** | Claude Desktop Connector + official Blender MCP | Claude Desktop users (only verified stack) |
| **Stack 2** | Official Blender CLI | Direct Blender executable invocation, no MCP |
| **Stack 3** | Optional unofficial third-party bridges | Experimental/local only, not official release path |

**Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and not currently supported.**

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
- Draft v0, not production-ready
- Runtime eval: Not Run
- Artifacts: Not Produced
- Release tag: Not Ready

**Start here:**
- [Release readiness](./release-readiness.md) — current status
- [Release readiness rollup v0](./release-readiness-rollup-v0.md) — Phase 3.3 pre-runtime summary
- [Evals index](./evals/README.md) — all eval protocols and results

**Eval evidence:**
- [Cyberpunk shoe v0 text-only eval](./evals/cyberpunk-shoe-hero-v0-text-eval.md) — Executed / Text-only
- [Cyberpunk shoe v0 manual eval protocol](./evals/cyberpunk-shoe-hero-v0-manual-eval.md) — Protocol / Not yet executed
- [Manual install beta v0](./evals/manual-install-beta-v0.md) — Executed / Dry-run / Warn
- [Skill package upload-readiness v0](./evals/skill-package-upload-readiness-v0.md) — Executed / Text-only / No upload / Warn

---

## 🎯 Runtime summary

BlendOps documents three runtime stacks:

| Stack | Description | Status |
|---|---|---|
| **Stack 1** | Claude Desktop official connector stack (Claude Desktop Connector + official Blender MCP) | Only verified stack (read-only smoke evidence) |
| **Stack 2** | Official Blender CLI fallback (direct executable invocation, no MCP) | Documented, not verified |
| **Stack 3** | Optional unofficial third-party bridge stack (user-managed, experimental/local) | Not part of official release path |

**Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.**

**Key point:** BlendOps does not ship its own runtime. Runtime setup is a separate, explicit step that depends on upstream official Blender and Claude documentation.

---

## 📦 Install/package summary

**Canonical portable skill package:**
- Source: `bundles/skill-package/blendops/`
- Structure: `SKILL.md` + `references/` (target-neutral core) + `agents/openai.yaml` (OpenAI metadata only)
- Status: Draft fixture, not published

**Claude Desktop manual bundle:**
- Source: `bundles/claude-desktop-manual/`
- Purpose: Manual Personal Skill import for Claude Desktop
- Status: Draft fixture, does not claim connector/runtime success

**Generic project-local fallback:**
- Source: `bundles/generic-project-local/`
- Purpose: Unknown/unsupported tool fallback
- Status: Draft fixture with rollback notes

**Per-target install docs:**
- [docs/install/README.md](./install/README.md) — all target-specific guides

**Future installer/npx:**
- Spec exists: [docs/install/installer-spec.md](./install/installer-spec.md)
- Implementation: Not done, do not claim `npx blendops` works

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

BlendOps is Draft v0 and not yet accepting external contributions. Focus is on internal validation and runtime eval completion first.

---

## 📄 License

MIT — see [LICENSE](../LICENSE).
