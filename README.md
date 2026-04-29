# 🦾 BlendOps

BlendOps is an AI-native Blender workflow layer for people who do not know Blender.

```txt
User prompt
→ AI workflow plan
→ external Blender runtime
→ preview/export artifacts
→ web-ready 3D handoff
```

---

## ✨ What BlendOps is

BlendOps focuses on the product/workflow layer above runtime tooling:

- natural-language intent understanding
- scene/workflow planning
- structured validation
- render/export handoff expectations
- web-ready usage guidance

---

## 🚫 What BlendOps is not

BlendOps does **not** currently ship its own:

- BlendOps-owned CLI runtime
- custom MCP server runtime
- custom Blender addon runtime

BlendOps is also not intended to clone or re-implement external runtime tooling.

---

## 👤 Target user

A person who does not know Blender internals but can ask an AI coding tool (Claude Code, Cursor, OpenCode, Codex, etc.) for useful 3D outcomes.

Typical desired outputs:

- Blender scene
- GLB asset
- preview render
- practical web integration guidance

---

## 🧭 External runtime setup (required first)

Before using BlendOps workflow specs, complete external runtime setup:

- **BlendOps setup overview:** [docs/external-runtime-setup.md](./docs/external-runtime-setup.md)
- **Official Blender MCP Server:** https://www.blender.org/lab/mcp-server/
- **Official Claude Blender Connector tutorial:** https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- **Official Blender CLI docs:** https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

For exact/current install commands and runtime configuration details, follow upstream docs.

---

## 🗂️ Active documentation map

| Area | Doc |
|---|---|
| Docs start page | [docs/README.md](./docs/README.md) |
| Product direction | [docs/product-direction.md](./docs/product-direction.md) |
| External runtime setup | [docs/external-runtime-setup.md](./docs/external-runtime-setup.md) |
| Runtime boundary | [docs/reference-runtime.md](./docs/reference-runtime.md) |
| User journey | [docs/first-user-journey.md](./docs/first-user-journey.md) |
| Golden path spec | [docs/golden-path-cyberpunk-shoe.md](./docs/golden-path-cyberpunk-shoe.md) |
| Workflow contract | [docs/workflow-contract.md](./docs/workflow-contract.md) |
| Safety model | [docs/safety-model.md](./docs/safety-model.md) |
| Architecture | [docs/architecture.md](./docs/architecture.md) |
| Research index | [docs/research/skill-systems-research.md](./docs/research/skill-systems-research.md) |
| Skill/law design draft | [docs/blendops-skill-system-design.md](./docs/blendops-skill-system-design.md) |
| Proposed law format | [docs/blendops-law-format.md](./docs/blendops-law-format.md) |
| Proposed first skill pack | [docs/blendops-first-skill-pack.md](./docs/blendops-first-skill-pack.md) |
| Cleanup audit | [docs/cleanup-audit.md](./docs/cleanup-audit.md) |
| Release readiness | [docs/release-readiness.md](./docs/release-readiness.md) |

---

## 🧩 v0 Official Runtime Skill Pack

- Pack: [docs/packs/v0-product-hero-pack.md](./docs/packs/v0-product-hero-pack.md)
- Laws: [docs/laws/README.md](./docs/laws/README.md)
- Skills: [docs/skills/README.md](./docs/skills/README.md)
- Workflow: [docs/workflows/product-hero-workflow.md](./docs/workflows/product-hero-workflow.md)
- Recipe: [docs/recipes/cyberpunk-shoe-hero.md](./docs/recipes/cyberpunk-shoe-hero.md)

---

## 🧩 Install with your AI agent

Attach BlendOps v0 laws/skills/workflows to a project by giving your AI coding agent a short install prompt.

**Human quick install prompt:**

```txt
Install BlendOps in this project by following:
https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/agent-install.md

Use project-local install unless I explicitly ask for global install.
Do not install Blender runtime.
Do not run Blender.
Do not overwrite existing config without asking.
Summarize exactly what you changed.
```

- Agent install guide: [docs/agent-install.md](./docs/agent-install.md)
- Prompt examples: [docs/examples/agent-install-prompt.md](./docs/examples/agent-install-prompt.md)

Note: this installs/attaches BlendOps skills/docs only. It does not install Blender runtime.

---

## 🧭 Install adapters and scopes

BlendOps uses target adapters and install scopes instead of hard-coded one-off install logic.

- project-local is default
- generic-root fallback handles unknown future tools
- user-global is opt-in only
- Claude Code and Claude app/Desktop are separate targets

Links:
- [docs/target-adapter-architecture.md](./docs/target-adapter-architecture.md)
- [docs/install-scopes.md](./docs/install-scopes.md)
- [docs/adapter-registry.md](./docs/adapter-registry.md)
- [docs/adapters/README.md](./docs/adapters/README.md)
- [docs/examples/blendops-root-entrypoint.md](./docs/examples/blendops-root-entrypoint.md)
- [docs/claude-app-setup.md](./docs/claude-app-setup.md)

---

## 🧩 BlendOps Skills

Canonical specs live under `docs/`.

Installable draft skill units now live under root collections:
- Skills: [skills/README.md](./skills/README.md)
- Laws: [laws/README.md](./laws/README.md)
- Pack manifest: [packs/product-hero-v0/PACK.md](./packs/product-hero-v0/PACK.md)

Draft note: this collection is still draft and should be validated through install dry-run + runtime eval before promotion.

Skill depth note: root skills are benchmark-informed and reviewed against multi-layer gates.
- Skills index: [skills/README.md](./skills/README.md)
- Review gates: [skill-reviews/README.md](./skill-reviews/README.md)
- Depth audit report: [skill-reviews/reports/v0-skill-depth-audit.md](./skill-reviews/reports/v0-skill-depth-audit.md)

---

## 🔁 Product flow

BlendOps is designed around this workflow:

`intent` → `scene/workflow plan` → `external runtime execution` → `validation` → `artifact handoff` → `web-ready guidance`

---

## ✅ Current repo status

- active docs aligned to official-runtime workflow/skill collection direction
- root `skills/`, `laws/`, and `packs/` collections are active

---

## 🛡️ Safety boundary

Official runtime integrations can expose powerful Blender capabilities.

BlendOps safety stance:

- do **not** use arbitrary Python as final user-facing product interface
- prefer constrained workflow plans and explicit validation outputs
- communicate limitations and failures clearly

---

## 📍 Next milestones

1. resolve Claude Code native-path ambiguity from adapter dry-run findings
2. run manual install beta tests in disposable projects
3. run official-runtime manual eval when connector/MCP path is available
4. prepare Draft v0 release-readiness package (no stable claim yet)

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
