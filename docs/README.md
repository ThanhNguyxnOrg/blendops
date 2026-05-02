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
2. **Runtime stack strategy:** [runtime-stack-strategy.md](./runtime-stack-strategy.md)
3. **Product direction:** [product-direction.md](./product-direction.md)
4. **Release status:** [release-readiness.md](./release-readiness.md)
5. **Release readiness rollup:** [release-readiness-rollup-v0.md](./release-readiness-rollup-v0.md)
6. **AI agent install flow:** [ai-agent-install-flow.md](./ai-agent-install-flow.md)
7. **Multi-agent install strategy:** [multi-agent-install-strategy.md](./multi-agent-install-strategy.md)
8. **Distribution strategy:** [distribution-strategy.md](./distribution-strategy.md)
9. **Eval status:** [evals/README.md](./evals/README.md)
10. **Workflow and delivery specs:** continue through the grouped navigation below

> [!TIP]
> If you're evaluating release readiness, read the release status and manual install beta evidence before the pack docs.

---

## 🧭 Navigation by job

| Job | Start with | Then read |
|---|---|---|
| Understand the product | [product-direction.md](./product-direction.md) | [architecture.md](./architecture.md), [reference-runtime.md](./reference-runtime.md) |
| Set runtime boundaries | [external-runtime-setup.md](./external-runtime-setup.md) | [runtime-stack-strategy.md](./runtime-stack-strategy.md), [reference-runtime.md](./reference-runtime.md), [../laws/official-runtime-only.md](../laws/official-runtime-only.md) |
| Review workflow behavior | [workflow-contract.md](./workflow-contract.md) | [first-user-journey.md](./first-user-journey.md), [safety-model.md](./safety-model.md) |
| Try install/adoption docs | [ai-agent-install-flow.md](./ai-agent-install-flow.md) | [agent-install.md](./agent-install.md), [install-scopes.md](./install-scopes.md), [multi-agent-install-strategy.md](./multi-agent-install-strategy.md), [adapters/README.md](./adapters/README.md) |
| Check eval evidence | [evals/README.md](./evals/README.md) | [release-readiness.md](./release-readiness.md), [release-readiness-rollup-v0.md](./release-readiness-rollup-v0.md) |
| Review v0 pack content | [../packs/README.md](../packs/README.md) | [../skills/README.md](../skills/README.md), [workflows/README.md](./workflows/README.md) |

---

## 🧩 Core docs

| Area | Doc |
|---|---|
| Product direction | [product-direction.md](./product-direction.md) |
| Skill system | [skill-system.md](./skill-system.md) |
| Runtime setup, external | [external-runtime-setup.md](./external-runtime-setup.md) |
| Runtime stack strategy | [runtime-stack-strategy.md](./runtime-stack-strategy.md) |
| Runtime boundary | [reference-runtime.md](./reference-runtime.md) |
| Optional bridge caveats, unofficial Stack 3 | [unofficial-runtime-bridges.md](./unofficial-runtime-bridges.md) |
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
| Root laws index | [../laws/README.md](../laws/README.md) |
| Official runtime only law | [../laws/official-runtime-only.md](../laws/official-runtime-only.md) |
| No arbitrary Python interface law | [../laws/no-arbitrary-python-interface.md](../laws/no-arbitrary-python-interface.md) |
| Evidence before done law | [../laws/evidence-before-done.md](../laws/evidence-before-done.md) |
| Non-Blender-user language law | [../laws/non-blender-user-language.md](../laws/non-blender-user-language.md) |

---

## 🛠️ Skills

| Area | Doc |
|---|---|
| Skill system guide | [skill-system.md](./skill-system.md) |
| Root skills index | [../skills/README.md](../skills/README.md) |
| Product hero scene planner | [../skills/product-hero-scene-planner/SKILL.md](../skills/product-hero-scene-planner/SKILL.md) |
| Blender scene quality checker | [../skills/blender-scene-quality-checker/SKILL.md](../skills/blender-scene-quality-checker/SKILL.md) |
| GLB web handoff | [../skills/glb-web-handoff/SKILL.md](../skills/glb-web-handoff/SKILL.md) |
| Non-Blender-user response writer | [../skills/non-blender-user-response-writer/SKILL.md](../skills/non-blender-user-response-writer/SKILL.md) |

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
| Root packs index | [../packs/README.md](../packs/README.md) |
| v0 product hero pack | [../packs/product-hero-v0/PACK.md](../packs/product-hero-v0/PACK.md) |

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
| AI agent install flow | [ai-agent-install-flow.md](./ai-agent-install-flow.md) |
| Per-target install docs | [install/README.md](./install/README.md) |
| Installer script spec (future) | [install/installer-spec.md](./install/installer-spec.md) |
| Install strategy | [install-strategy.md](./install-strategy.md) |
| Install scopes | [install-scopes.md](./install-scopes.md) |
| Multi-agent install strategy | [multi-agent-install-strategy.md](./multi-agent-install-strategy.md) |
| Distribution strategy | [distribution-strategy.md](./distribution-strategy.md) |
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
| Current cleanup audit | [cleanup-audit.md](./cleanup-audit.md) | Governance record |
| Release readiness status | [release-readiness.md](./release-readiness.md) | Draft v0, do not tag yet |
| Release readiness rollup v0 | [release-readiness-rollup-v0.md](./release-readiness-rollup-v0.md) | Phase 3.3 pre-runtime rollup |
| Distribution strategy | [distribution-strategy.md](./distribution-strategy.md) | Draft v0, no marketplace claim |

---

## ⚠️ Notes

- BlendOps is a product/workflow layer for non-Blender users.
- BlendOps does **not** currently ship its own BlendOps-owned CLI/MCP/addon runtime.
- Runtime stack status follows [runtime-stack-strategy.md](./runtime-stack-strategy.md).
- Runtime artifacts remain Not Run/Not Produced unless an eval record states otherwise with evidence.
