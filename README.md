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

- custom CLI runtime
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
| Reset audit | [docs/reset-audit.md](./docs/reset-audit.md) |
| Markdown audit | [docs/markdown-cleanup-audit.md](./docs/markdown-cleanup-audit.md) |

---

## 🔁 Product flow

BlendOps is designed around this workflow:

`intent` → `scene/workflow plan` → `external runtime execution` → `validation` → `artifact handoff` → `web-ready guidance`

---

## ✅ Current repo status

- runtime-era custom implementation removed from active codebase
- active docs aligned to product/workflow direction
- historical runtime materials preserved under [`docs/archive/`](./docs/archive/README.md)

---

## 🛡️ Safety boundary

Official runtime integrations can expose powerful Blender capabilities.

BlendOps safety stance:

- do **not** use arbitrary Python as final user-facing product interface
- prefer constrained workflow plans and explicit validation outputs
- communicate limitations and failures clearly

---

## 📍 Next milestones

1. finalize first non-Blender-user golden path
2. mature workflow/validation artifacts
3. decide long-term external-runtime integration strategy
4. implement minimal product features from workflow requirements

---

## 🗃️ Historical runtime note

Pre-reset custom runtime work remains recoverable from git history (baseline reference: `04c70db`) and from the archive docs.

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
