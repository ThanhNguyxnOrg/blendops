# 📚 BlendOps Documentation

Active docs for the current product and workflow direction.

> [!WARNING]
> BlendOps is Draft v0. It is not production-ready or stable. Start with setup boundaries, then read the workflow and eval status before treating any pack as releasable.

---

## 🚦 Status dashboard

| Area | Status | What it means |
|---|---|---|
| Product direction | Draft v0 | Product and workflow direction are documented, with no stable release claim. |
| Runtime boundary | Active | BlendOps depends on an external Blender runtime and does not ship its own runtime. |
| Install/adoption docs | Warn | Dry-run install evidence exists, with adapter path confidence still environment-dependent. |
| Runtime eval evidence | Blocked / Not Run | Official runtime manual eval evidence has not been produced in a runtime-available environment. |
| Release tag | Not Ready | Conservative decision remains: do not tag yet. |

---

## 🚀 Start here

1. **External runtime setup, required first:** [external-runtime-setup.md](./external-runtime-setup.md)
2. **Product direction:** [product-direction.md](./product-direction.md)
3. **Release status:** [release-readiness.md](./release-readiness.md)
4. **Eval status:** [evals/README.md](./evals/README.md)
5. **Workflow and delivery specs:** continue through the grouped navigation below

> [!TIP]
> If you're evaluating release readiness, read the release status and manual install beta evidence before the pack docs.

---

## 🧭 Navigation by job

| Job | Start with | Then read |
|---|---|---|
| Understand the product | [product-direction.md](./product-direction.md) | [architecture.md](./architecture.md), [reference-runtime.md](./reference-runtime.md) |
| Set runtime boundaries | [external-runtime-setup.md](./external-runtime-setup.md) | [reference-runtime.md](./reference-runtime.md), [laws/official-runtime-only.md](./laws/official-runtime-only.md) |
| Review workflow behavior | [workflow-contract.md](./workflow-contract.md) | [first-user-journey.md](./first-user-journey.md), [safety-model.md](./safety-model.md) |
| Try install/adoption docs | [agent-install.md](./agent-install.md) | [install-scopes.md](./install-scopes.md), [adapters/README.md](./adapters/README.md) |
| Check eval evidence | [evals/README.md](./evals/README.md) | [release-readiness.md](./release-readiness.md) |
| Review v0 pack content | [packs/README.md](./packs/README.md) | [skills/README.md](./skills/README.md), [workflows/README.md](./workflows/README.md) |

---

## 🧩 Core docs

| Area | Doc |
|---|---|
| Product direction | [product-direction.md](./product-direction.md) |
| Runtime setup, external | [external-runtime-setup.md](./external-runtime-setup.md) |
| Runtime boundary | [reference-runtime.md](./reference-runtime.md) |
| Architecture | [architecture.md](./architecture.md) |

---

## 🛠️ Workflow specs

| Area | Doc |
|---|---|
| First user journey | [first-user-journey.md](./first-user-journey.md) |
| Golden path, cyberpunk shoe | [golden-path-cyberpunk-shoe.md](./golden-path-cyberpunk-shoe.md) |
| Workflow contract | [workflow-contract.md](./workflow-contract.md) |
| Safety model | [safety-model.md](./safety-model.md) |

---

## ⚖️ Laws

| Area | Doc |
|---|---|
| Laws index | [laws/README.md](./laws/README.md) |
| Official runtime only law | [laws/official-runtime-only.md](./laws/official-runtime-only.md) |
| No arbitrary Python interface law | [laws/no-arbitrary-python-interface.md](./laws/no-arbitrary-python-interface.md) |
| Evidence before done law | [laws/evidence-before-done.md](./laws/evidence-before-done.md) |
| Non-Blender-user language law | [laws/non-blender-user-language.md](./laws/non-blender-user-language.md) |

---

## 🛠️ Skills

| Area | Doc |
|---|---|
| Skills index | [skills/README.md](./skills/README.md) |
| Official runtime setup guide | [skills/official-runtime-setup-guide.md](./skills/official-runtime-setup-guide.md) |
| Product hero scene planner | [skills/product-hero-scene-planner.md](./skills/product-hero-scene-planner.md) |
| Blender scene quality checker | [skills/blender-scene-quality-checker.md](./skills/blender-scene-quality-checker.md) |
| GLB web handoff | [skills/glb-web-handoff.md](./skills/glb-web-handoff.md) |
| Non-Blender-user response writer | [skills/non-blender-user-response-writer.md](./skills/non-blender-user-response-writer.md) |

---

## 🔁 Workflows

| Area | Doc |
|---|---|
| Workflows index | [workflows/README.md](./workflows/README.md) |
| Product hero workflow | [workflows/product-hero-workflow.md](./workflows/product-hero-workflow.md) |

---

## 🧪 Recipes

| Area | Doc |
|---|---|
| Recipes index | [recipes/README.md](./recipes/README.md) |
| Cyberpunk shoe hero recipe | [recipes/cyberpunk-shoe-hero.md](./recipes/cyberpunk-shoe-hero.md) |

---

## 📦 Packs

| Area | Doc |
|---|---|
| Packs index | [packs/README.md](./packs/README.md) |
| v0 product hero pack | [packs/v0-product-hero-pack.md](./packs/v0-product-hero-pack.md) |

---

## 🧩 Installable skill collection

| Area | Doc |
|---|---|
| Root skills index | [../skills/README.md](../skills/README.md) |
| Root laws index | [../laws/README.md](../laws/README.md) |
| Product hero v0 pack | [../packs/product-hero-v0/PACK.md](../packs/product-hero-v0/PACK.md) |

---

## 🧪 Evals

| Area | Doc | Current status |
|---|---|---|
| Evals index | [evals/README.md](./evals/README.md) | Draft v0 index |
| Cyberpunk shoe v0 manual eval protocol | [evals/cyberpunk-shoe-hero-v0-manual-eval.md](./evals/cyberpunk-shoe-hero-v0-manual-eval.md) | Protocol / Not yet executed |
| Cyberpunk shoe v0 text-only eval | [evals/cyberpunk-shoe-hero-v0-text-eval.md](./evals/cyberpunk-shoe-hero-v0-text-eval.md) | Executed / Text-only |
| Manual install beta v0 | [evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md) | Executed / Dry-run / Warn |

---

## 🧩 Install / Adoption

| Area | Doc |
|---|---|
| Install strategy | [install-strategy.md](./install-strategy.md) |
| Install scopes | [install-scopes.md](./install-scopes.md) |
| Adapter architecture | [target-adapter-architecture.md](./target-adapter-architecture.md) |
| Capability profile schema | [capability-profile.md](./capability-profile.md) |
| Adapter registry | [adapter-registry.md](./adapter-registry.md) |
| Adapter docs index | [adapters/README.md](./adapters/README.md) |
| Agent install guide | [agent-install.md](./agent-install.md) |
| Package layout plan | [package-layout.md](./package-layout.md) |
| Agent install prompts | [examples/agent-install-prompt.md](./examples/agent-install-prompt.md) |
| BLENDOPS.md root template | [examples/blendops-root-entrypoint.md](./examples/blendops-root-entrypoint.md) |
| Claude app/Desktop setup notes | [claude-app-setup.md](./claude-app-setup.md) |
| Claude app project instructions template | [examples/claude-app-project-instructions.md](./examples/claude-app-project-instructions.md) |

---

## 🔬 Research docs

| Area | Doc |
|---|---|
| Skill systems research | [research/skill-systems-research.md](./research/skill-systems-research.md) |
| Skill/law pattern synthesis | [research/skill-system-patterns.md](./research/skill-system-patterns.md) |
| Skill system decision matrix | [research/skill-system-decision-matrix.md](./research/skill-system-decision-matrix.md) |
| Blender workflow research | [research/blender-workflow-research.md](./research/blender-workflow-research.md) |
| Web 3D asset pipeline | [research/web-3d-asset-pipeline.md](./research/web-3d-asset-pipeline.md) |
| Blender quality checklist | [research/blender-quality-checklist.md](./research/blender-quality-checklist.md) |
| Blender skill benchmark analysis | [research/blender-skill-benchmark-analysis.md](./research/blender-skill-benchmark-analysis.md) |

---

## 🧱 BlendOps synthesis docs

| Area | Doc |
|---|---|
| Skill system design | [blendops-skill-system-design.md](./blendops-skill-system-design.md) |
| Proposed law format | [blendops-law-format.md](./blendops-law-format.md) |
| Proposed first skill pack | [blendops-first-skill-pack.md](./blendops-first-skill-pack.md) |

---

## 🧪 Skill reviews

| Area | Doc |
|---|---|
| Skill review index | [../skill-reviews/README.md](../skill-reviews/README.md) |
| Review gates | [../skill-reviews/review-gates.md](../skill-reviews/review-gates.md) |
| Acceptance criteria | [../skill-reviews/acceptance-criteria.md](../skill-reviews/acceptance-criteria.md) |
| Skill template | [../skill-reviews/blendops-skill-template.md](../skill-reviews/blendops-skill-template.md) |
| Depth standard | [../skill-reviews/depth-standard.md](../skill-reviews/depth-standard.md) |
| v0 depth audit report | [../skill-reviews/reports/v0-skill-depth-audit.md](../skill-reviews/reports/v0-skill-depth-audit.md) |
| v0 skill gate review report | [../skill-reviews/reports/v0-skill-gate-review.md](../skill-reviews/reports/v0-skill-gate-review.md) |

---

## 🧾 Governance and audit docs

| Area | Doc | Status |
|---|---|---|
| Contributor guide | [../CONTRIBUTING.md](../CONTRIBUTING.md) | Includes commit authorship policy |
| Current cleanup audit | [cleanup-audit.md](./cleanup-audit.md) | Governance record |
| Release readiness status | [release-readiness.md](./release-readiness.md) | Draft v0, do not tag yet |

---

## ⚠️ Notes

- BlendOps is a product/workflow layer for non-Blender users.
- BlendOps does **not** currently ship its own BlendOps-owned CLI/MCP/addon runtime.
- Runtime artifacts remain Not Run/Not Produced unless an eval record states otherwise with evidence.
