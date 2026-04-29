# 🦾 BlendOps

<p align="center">
  <strong>AI-native Blender workflow specs for people who do not know Blender.</strong>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-green.svg"></a>
  <img alt="Status: Draft v0" src="https://img.shields.io/badge/status-draft%20v0-orange.svg">
  <img alt="Runtime: official Blender runtime only" src="https://img.shields.io/badge/runtime-official%20Blender%20only-blue.svg">
  <img alt="Production: not stable" src="https://img.shields.io/badge/production-not%20stable-lightgrey.svg">
</p>

BlendOps is a product/workflow layer that helps an AI coding agent turn a plain-language 3D request into a constrained Blender workflow plan, validation expectations, and web handoff guidance.

```txt
Human intent
  → BlendOps laws / skills / workflow specs
  → AI-generated scene plan
  → official external Blender runtime execution
  → validation notes and handoff guidance
```

> [!IMPORTANT]
> BlendOps is currently a **draft v0 workflow/specification project**. It does not claim stable or production-ready status, and this README does not claim that Blender has been run for this repository.

---

## ✨ What BlendOps is

BlendOps focuses on the layer above Blender runtime tooling:

- **Natural-language 3D intent framing** for users who do not know Blender internals.
- **Workflow plans and constraints** that an AI coding agent can follow.
- **Laws, skills, and recipes** for repeatable scene-generation behavior.
- **Validation and safety expectations** before handing work to a user.
- **Web-ready guidance** for teams that eventually need practical 3D integration notes.

It is designed to make AI-assisted Blender work more structured, less ad hoc, and easier to review.

---

## 🚫 What BlendOps is not

BlendOps does **not** currently ship its own:

- BlendOps-owned CLI runtime
- custom MCP server runtime
- custom Blender addon runtime
- stable release channel
- verified generated scene, render, preview, or GLB artifact in this repository

BlendOps is also not intended to clone, replace, or re-implement official Blender runtime tooling.

> [!CAUTION]
> Treat the current materials as draft workflow infrastructure. Do not present them to users as a finished 3D asset pipeline.

---

## ✅ Current status

| Area | Status | Notes |
|---|---:|---|
| Product direction | Drafted | Public docs describe official-runtime-only positioning. |
| Root skill/law/pack collections | Active draft | Root `skills/`, `laws/`, and `packs/` collections exist for v0 evaluation. |
| Install adapter model | Drafted | Project-local install is the default; user-global install is opt-in only. |
| Official runtime execution | Not verified here | Runtime setup is documented, but this README does not claim Blender was run. |
| Release readiness | Not stable | Draft v0 readiness work remains in progress. |

---

## 👤 Who this is for

BlendOps is for a person who can ask an AI coding tool for a useful 3D outcome but does not know Blender internals.

Examples of desired outcomes may include:

- a Blender scene plan
- a future Blender scene file produced through an official runtime
- a future GLB export produced through an official runtime
- a future preview render produced through an official runtime
- practical web integration guidance

> [!NOTE]
> Those examples describe intended workflow outcomes. They are not claims that this repository currently contains generated preview, render, GLB, or Blender artifacts.

---

## 🧭 Official runtime setup

BlendOps keeps runtime execution outside this repository and points users to official Blender-supported paths.

Start here:

- **BlendOps setup overview:** [docs/external-runtime-setup.md](./docs/external-runtime-setup.md)
- **Official Blender MCP Server:** https://www.blender.org/lab/mcp-server/
- **Official Claude Blender Connector tutorial:** https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- **Official Blender CLI docs:** https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

For exact/current install commands and runtime configuration details, follow upstream Blender and Claude documentation.

> [!WARNING]
> BlendOps install prompts do **not** install Blender runtime and do **not** run Blender. Runtime setup is a separate, explicit step.

---

## 🧩 Install BlendOps with your AI agent

Attach the draft v0 BlendOps laws, skills, workflows, and docs to a project by giving your AI coding agent this prompt.

```txt
Install BlendOps in this project by following:
https://raw.githubusercontent.com/ThanhNguyxnOrg/blendops/main/docs/agent-install.md

Use project-local install unless I explicitly ask for global install.
Do not install Blender runtime.
Do not run Blender.
Do not overwrite existing config without asking.
Summarize exactly what you changed.
```

Helpful install references:

- [docs/agent-install.md](./docs/agent-install.md)
- [docs/examples/agent-install-prompt.md](./docs/examples/agent-install-prompt.md)
- [docs/install-scopes.md](./docs/install-scopes.md)
- [docs/multi-agent-install-strategy.md](./docs/multi-agent-install-strategy.md)
- [docs/distribution-strategy.md](./docs/distribution-strategy.md)
- [docs/target-adapter-architecture.md](./docs/target-adapter-architecture.md)
- [docs/adapter-registry.md](./docs/adapter-registry.md)
- [docs/adapters/README.md](./docs/adapters/README.md)

Default install stance:

| Scope | Position |
|---|---|
| Project-local | Default |
| User-global | Opt-in only |
| Unknown future tools | Generic root fallback |
| Claude Code vs Claude app/Desktop | Separate targets |

---

## 🗂️ Documentation map

| Start here | Doc |
|---|---|
| Docs index | [docs/README.md](./docs/README.md) |
| Product direction | [docs/product-direction.md](./docs/product-direction.md) |
| External runtime setup | [docs/external-runtime-setup.md](./docs/external-runtime-setup.md) |
| Runtime boundary | [docs/reference-runtime.md](./docs/reference-runtime.md) |
| Optional bridge caveats, unofficial | [docs/unofficial-runtime-bridges.md](./docs/unofficial-runtime-bridges.md) |
| First user journey | [docs/first-user-journey.md](./docs/first-user-journey.md) |
| Golden path spec | [docs/golden-path-cyberpunk-shoe.md](./docs/golden-path-cyberpunk-shoe.md) |
| Workflow contract | [docs/workflow-contract.md](./docs/workflow-contract.md) |
| Safety model | [docs/safety-model.md](./docs/safety-model.md) |
| Architecture | [docs/architecture.md](./docs/architecture.md) |
| Release readiness | [docs/release-readiness.md](./docs/release-readiness.md) |
| Release readiness rollup v0 | [docs/release-readiness-rollup-v0.md](./docs/release-readiness-rollup-v0.md) |
| Distribution strategy | [docs/distribution-strategy.md](./docs/distribution-strategy.md) |

| v0 pack area | Doc |
|---|---|
| Pack overview | [docs/packs/v0-product-hero-pack.md](./docs/packs/v0-product-hero-pack.md) |
| Laws | [docs/laws/README.md](./docs/laws/README.md) |
| Skills | [docs/skills/README.md](./docs/skills/README.md) |
| Workflow | [docs/workflows/product-hero-workflow.md](./docs/workflows/product-hero-workflow.md) |
| Recipe | [docs/recipes/cyberpunk-shoe-hero.md](./docs/recipes/cyberpunk-shoe-hero.md) |

| Root installable drafts | Doc |
|---|---|
| Skills index | [skills/README.md](./skills/README.md) |
| Laws index | [laws/README.md](./laws/README.md) |
| Pack manifest | [packs/product-hero-v0/PACK.md](./packs/product-hero-v0/PACK.md) |
| Review gates | [skill-reviews/README.md](./skill-reviews/README.md) |
| Depth audit | [skill-reviews/reports/v0-skill-depth-audit.md](./skill-reviews/reports/v0-skill-depth-audit.md) |

| Research and cleanup | Doc |
|---|---|
| Skill systems research | [docs/research/skill-systems-research.md](./docs/research/skill-systems-research.md) |
| Skill/law design draft | [docs/blendops-skill-system-design.md](./docs/blendops-skill-system-design.md) |
| Proposed law format | [docs/blendops-law-format.md](./docs/blendops-law-format.md) |
| Proposed first skill pack | [docs/blendops-first-skill-pack.md](./docs/blendops-first-skill-pack.md) |
| Cleanup audit | [docs/cleanup-audit.md](./docs/cleanup-audit.md) |

---

## 🔁 Product flow

BlendOps is designed around a conservative, reviewable workflow:

```txt
intent
  → workflow plan
  → official external runtime execution
  → validation notes
  → artifact handoff expectations
  → web-ready guidance
```

The project emphasizes explicit boundaries: planning and validation live in BlendOps; Blender execution belongs to official external runtime setup.

---

## 🛡️ Safety boundary

Official runtime integrations can expose powerful Blender capabilities.

BlendOps safety stance:

- do **not** use arbitrary Python as the final user-facing product interface
- prefer constrained workflow plans and explicit validation outputs
- communicate limitations and failures clearly
- separate install/setup instructions from runtime execution
- avoid unsupported claims about generated artifacts

---

## ⚠️ Known limitations

- Draft v0 materials still need install dry-runs in disposable projects.
- Official runtime manual evaluation remains a future milestone.
- Generated Blender scenes, preview renders, and GLB exports are not claimed as current repository artifacts.
- Runtime setup depends on upstream official Blender and Claude documentation.
- The root skill collection is still draft and should be validated before promotion.

---

## 📍 Next milestones

1. Resolve Claude Code native-path ambiguity from adapter dry-run findings.
2. Run manual install beta tests in disposable projects.
3. Run official-runtime manual evaluation when the connector/runtime path is available.
4. Run the runtime availability checklist and official runtime manual eval before any v0.1.0 draft tag.

---

## 📄 License

MIT — see [LICENSE](./LICENSE).
