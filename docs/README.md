# 📚 BlendOps Documentation Hub

The single index for everything in this repo. Bookmark this page.

> [!WARNING]
> BlendOps is **Draft v0**. It is a documentation + skill-pack project, not a production-ready tool. No marketplace listing. No `npx` installer yet. Runtime evidence is partial (Path 1 read-only smoke only).

---

## 🚦 Status dashboard

| Area | Status | Meaning |
|---|---|---|
| Product direction | Draft v0 | Workflow specs are documented; no stable release claim. |
| Skill / law / pack collection | Draft Pass | 16 root skills (10 domain + 6 process/discipline inspired by Superpowers + BMad), 4 laws, 1 pack (`product-hero-v0`). |
| Runtime path model | Active (2-path + CLI appendix) | Path 1 (Lab MCP, hosted from Anthropic Connector or manual MCP); Path 2 (community `ahujasid/blender-mcp`); CLI fallback (documented upstream as first-class Blender CLI; no in-repo evidence file yet). |
| Path 1 read-only smoke | Pass / Available | 2026-04-29 record (likely Anthropic Connector host). |
| Path 2 user-reported verified | Yes (2026-05-08) | No formal eval file yet. |
| CLI fallback | Not Run | **Documented upstream** as a first-class Blender CLI surface; no in-repo evidence file yet. |
| Full runtime manual eval (any path) | Blocked / Not Run | Mutation/render/export not attempted. |
| Runtime artifacts | Not Produced | No fresh preview/render/GLB. |
| Release tag (`v0.1.0`) | Not Ready | Conservative decision; do not tag yet. |
| Marketplace / `npx` listing | Not Published | None claimed. |

---

## 🚀 Start here (recommended order)

1. [`start-here.md`](./start-here.md) — friendly first-read orientation.
2. [`product-direction.md`](./product-direction.md) — what BlendOps is and isn't.
3. [`runtime-stack-strategy.md`](./runtime-stack-strategy.md) — the canonical 2-path + CLI appendix runtime model with corrected attribution history.
4. [`external-runtime-setup.md`](./external-runtime-setup.md) — per-path Blender + MCP setup walkthrough.
5. [`ai-agent-quickstart.md`](./ai-agent-quickstart.md) — the prompt to paste into any AI agent.
6. [`ai-agent-install-flow.md`](./ai-agent-install-flow.md) — universal install/prep flow (Mode A/B/C).

> [!TIP]
> If you only have 5 minutes: read [`start-here.md`](./start-here.md). If you only need runtime setup: read [`external-runtime-setup.md`](./external-runtime-setup.md).

---

## 🧭 Navigation by job

| Job | Start with | Then read |
|---|---|---|
| Understand the product | [`product-direction.md`](./product-direction.md) | [`architecture.md`](./architecture.md), [`reference-runtime.md`](./reference-runtime.md) |
| Set up Blender runtime | [`external-runtime-setup.md`](./external-runtime-setup.md) | [`runtime-stack-strategy.md`](./runtime-stack-strategy.md), [`reference-runtime.md`](./reference-runtime.md), [`unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md), [`../laws/official-runtime-only.md`](../laws/official-runtime-only.md) |
| Review workflow behavior | [`workflow-contract.md`](./workflow-contract.md) | [`first-user-journey.md`](./first-user-journey.md), [`safety-model.md`](./safety-model.md) |
| Install BlendOps into a tool | [`ai-agent-quickstart.md`](./ai-agent-quickstart.md) | [`ai-agent-install-flow.md`](./ai-agent-install-flow.md), [`install-scopes.md`](./install-scopes.md), [`multi-agent-install-strategy.md`](./multi-agent-install-strategy.md), [`adapters/README.md`](./adapters/README.md), [`install/README.md`](./install/README.md) |
| Check eval evidence | [`evals/README.md`](./evals/README.md) | [`release-readiness.md`](./release-readiness.md), [`release-readiness-rollup-v0.md`](./release-readiness-rollup-v0.md) |
| Review v0 pack content | [`../packs/README.md`](../packs/README.md) | [`../skills/README.md`](../skills/README.md), [`workflows/README.md`](./workflows/README.md), [`recipes/README.md`](./recipes/README.md) |

---

## 🧩 Core specs

| Area | Doc |
|---|---|
| Product direction | [`product-direction.md`](./product-direction.md) |
| Architecture | [`architecture.md`](./architecture.md) |
| Skill system | [`skill-system.md`](./skill-system.md) |
| Workflow contract | [`workflow-contract.md`](./workflow-contract.md) |
| Safety model | [`safety-model.md`](./safety-model.md) |
| First user journey | [`first-user-journey.md`](./first-user-journey.md) |
| Golden path (cyberpunk shoe) | [`golden-path-cyberpunk-shoe.md`](./golden-path-cyberpunk-shoe.md) |

---

## 🧭 Runtime (2-path + CLI appendix model)

| Area | Doc |
|---|---|
| Path strategy + corrected attribution history | [`runtime-stack-strategy.md`](./runtime-stack-strategy.md) |
| External setup walkthrough | [`external-runtime-setup.md`](./external-runtime-setup.md) |
| Runtime boundary summary | [`reference-runtime.md`](./reference-runtime.md) |
| Path 2 caveats (community `ahujasid/blender-mcp`) | [`unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md) |
| Claude app/Desktop setup notes | [`claude-app-setup.md`](./claude-app-setup.md) |

---

## 📦 Install + adoption

| Area | Doc |
|---|---|
| AI agent quickstart (paste-this-prompt) | [`ai-agent-quickstart.md`](./ai-agent-quickstart.md) |
| AI agent install flow (Mode A/B/C) | [`ai-agent-install-flow.md`](./ai-agent-install-flow.md) |
| Install scopes (project-local / tool-native / generic-root / user-global / docs-only) | [`install-scopes.md`](./install-scopes.md) |
| Per-target install index | [`install/README.md`](./install/README.md) |
| Multi-agent install strategy | [`multi-agent-install-strategy.md`](./multi-agent-install-strategy.md) |
| Distribution strategy | [`distribution-strategy.md`](./distribution-strategy.md) |
| Adapter index | [`adapters/README.md`](./adapters/README.md) |
| Adapter registry (promotion ladder) | [`adapter-registry.md`](./adapter-registry.md) |
| Capability profile schema | [`capability-profile.md`](./capability-profile.md) |
| Future installer script spec | [`install/installer-spec.md`](./install/installer-spec.md) |
| Bundle: canonical portable skill package | [`../bundles/skill-package/README.md`](../bundles/skill-package/README.md) |
| Bundle: Claude Desktop manual import | [`../bundles/claude-desktop-manual/README.md`](../bundles/claude-desktop-manual/README.md) |
| Bundle: generic project-local fallback | [`../bundles/generic-project-local/README.md`](../bundles/generic-project-local/README.md) |
| Example: agent install prompts | [`examples/agent-install-prompt.md`](./examples/agent-install-prompt.md) |
| Example: `BLENDOPS.md` root template | [`examples/blendops-root-entrypoint.md`](./examples/blendops-root-entrypoint.md) |
| Example: Claude app project instructions | [`examples/claude-app-project-instructions.md`](./examples/claude-app-project-instructions.md) |

---

## 📂 Per-target install docs (16 targets total)

3 consumer types: **chat UI** (Claude Desktop), **coding agents** (11 — Claude Code through goose), **local LLM runners** (3 — Ollama / LM Studio / Open WebUI). Plus a generic project-local fallback.

### 1) Chat UI with Skills upload

| Target | Doc | Selected mode | Confidence |
|---|---|---|---|
| Claude Desktop / Claude.ai | [`install/claude-desktop.md`](./install/claude-desktop.md) | multiple Skills ZIP preparation | linked-only / manual |

### 2) Coding agents (project-local install + can host MCP for Blender)

All 11 accept BlendOps via project-local files and can host MCP for Blender via Path 1 host (b) Lab MCP or Path 2 community `ahujasid/blender-mcp`. They differ in MCP config syntax and native-skill-loader maturity.

| Target | Doc | Selected mode | Confidence |
|---|---|---|---|
| Claude Code | [`install/claude-code.md`](./install/claude-code.md) | project-local install | verified-read for project-local adapter |
| OpenCode | [`install/opencode.md`](./install/opencode.md) | project-local install | linked-only |
| Cursor | [`install/cursor.md`](./install/cursor.md) | project-local install | linked-only |
| Codex CLI/App | [`install/codex.md`](./install/codex.md) | project-local install | linked-only |
| Gemini CLI | [`install/gemini.md`](./install/gemini.md) | project-local install | not researched |
| Antigravity | [`install/antigravity.md`](./install/antigravity.md) | project-local install | not researched |
| GitHub Copilot | [`install/github-copilot.md`](./install/github-copilot.md) | project-local install | linked-only / generic |
| Cline (VS Code) | [`install/cline.md`](./install/cline.md) | project-local install | linked-only |
| Continue.dev | [`install/continue.md`](./install/continue.md) | project-local install | linked-only |
| Zed editor | [`install/zed.md`](./install/zed.md) | project-local install | linked-only |
| goose (Block) | [`install/goose.md`](./install/goose.md) | docs-only + Standard IO extension | linked-only — has upstream Blender tutorial |

### 3) Local LLM runners (docs-only; runner hosts MCP for Blender)

| Target | Doc | Selected mode | Confidence |
|---|---|---|---|
| Ollama | [`install/ollama.md`](./install/ollama.md) | docs-only + `~/.ollama/mcp-servers.json` (experimental) | linked-only / experimental |
| LM Studio | [`install/lm-studio.md`](./install/lm-studio.md) | docs-only + `mcp.json` (Cursor-compatible) | linked-only |
| Open WebUI | [`install/open-webui.md`](./install/open-webui.md) | docs-only + Streamable HTTP MCP | linked-only |

### Generic / future

| Target | Doc | Selected mode | Confidence |
|---|---|---|---|
| Generic project | [`install/generic-project.md`](./install/generic-project.md) | project-local install fallback | verified-read fallback |
| Installer script spec (future) | [`install/installer-spec.md`](./install/installer-spec.md) | future only | Draft spec only |

---

## ⚖️ Laws

| Law | Doc |
|---|---|
| Index | [`../laws/README.md`](../laws/README.md) |
| Official runtime only | [`../laws/official-runtime-only.md`](../laws/official-runtime-only.md) |
| No arbitrary Python interface | [`../laws/no-arbitrary-python-interface.md`](../laws/no-arbitrary-python-interface.md) |
| Evidence before done | [`../laws/evidence-before-done.md`](../laws/evidence-before-done.md) |
| Non-Blender-user language | [`../laws/non-blender-user-language.md`](../laws/non-blender-user-language.md) |

---

## 🛠️ Skills (16 root skills)

| Skill | Doc | Group |
|---|---|---|
| Index + how to add a new skill | [`../skills/README.md`](../skills/README.md) | — |
| `blendops-help` (router) | [`../skills/blendops-help/SKILL.md`](../skills/blendops-help/SKILL.md) | Help |
| `blender-brainstorming` (Superpowers `/brainstorming` analog) | [`../skills/blender-brainstorming/SKILL.md`](../skills/blender-brainstorming/SKILL.md) | Process |
| `intent-to-3d-brief-writer` (BMad analysis-phase analog) | [`../skills/intent-to-3d-brief-writer/SKILL.md`](../skills/intent-to-3d-brief-writer/SKILL.md) | Process |
| `blender-asset-discovery-planner` | [`../skills/blender-asset-discovery-planner/SKILL.md`](../skills/blender-asset-discovery-planner/SKILL.md) | Process |
| `official-runtime-setup-guide` | [`../skills/official-runtime-setup-guide/SKILL.md`](../skills/official-runtime-setup-guide/SKILL.md) | Runtime |
| `official-runtime-readiness-checker` | [`../skills/official-runtime-readiness-checker/SKILL.md`](../skills/official-runtime-readiness-checker/SKILL.md) | Runtime |
| `runtime-bridge-conflict-resolver` (Single-bridge constraint) | [`../skills/runtime-bridge-conflict-resolver/SKILL.md`](../skills/runtime-bridge-conflict-resolver/SKILL.md) | Runtime |
| `product-hero-scene-planner` | [`../skills/product-hero-scene-planner/SKILL.md`](../skills/product-hero-scene-planner/SKILL.md) | Planning |
| `blender-composition-camera-planner` | [`../skills/blender-composition-camera-planner/SKILL.md`](../skills/blender-composition-camera-planner/SKILL.md) | Planning |
| `blender-lighting-material-planner` | [`../skills/blender-lighting-material-planner/SKILL.md`](../skills/blender-lighting-material-planner/SKILL.md) | Planning |
| `blender-scene-quality-checker` | [`../skills/blender-scene-quality-checker/SKILL.md`](../skills/blender-scene-quality-checker/SKILL.md) | Quality |
| `blender-troubleshooting` (Superpowers `/systematic-debugging` analog) | [`../skills/blender-troubleshooting/SKILL.md`](../skills/blender-troubleshooting/SKILL.md) | Quality |
| `render-export-evidence` | [`../skills/render-export-evidence/SKILL.md`](../skills/render-export-evidence/SKILL.md) | Evidence |
| `pre-handoff-verification` (Superpowers `/verification-before-completion` analog) | [`../skills/pre-handoff-verification/SKILL.md`](../skills/pre-handoff-verification/SKILL.md) | Evidence |
| `glb-web-handoff` | [`../skills/glb-web-handoff/SKILL.md`](../skills/glb-web-handoff/SKILL.md) | Handoff |
| `non-blender-user-response-writer` | [`../skills/non-blender-user-response-writer/SKILL.md`](../skills/non-blender-user-response-writer/SKILL.md) | Handoff |

---

## 📦 Packs

| Pack | Doc |
|---|---|
| Index | [`../packs/README.md`](../packs/README.md) |
| `product-hero-v0` | [`../packs/product-hero-v0/PACK.md`](../packs/product-hero-v0/PACK.md) |

---

## 🔁 Workflows + recipes

| Area | Doc |
|---|---|
| Workflows index | [`workflows/README.md`](./workflows/README.md) |
| **Full non-Blender-user workflow** (canonical, 7 stages, chains all 16 skills) | [`workflows/full-non-blender-user-workflow.md`](./workflows/full-non-blender-user-workflow.md) |
| Product hero workflow (narrower subset, 5 stages) | [`workflows/product-hero-workflow.md`](./workflows/product-hero-workflow.md) |
| Recipes index | [`recipes/README.md`](./recipes/README.md) |
| Cyberpunk shoe hero recipe | [`recipes/cyberpunk-shoe-hero.md`](./recipes/cyberpunk-shoe-hero.md) |

---

## 🧪 Evals + readiness

| Area | Doc | Status |
|---|---|---|
| Evals index | [`evals/README.md`](./evals/README.md) | Draft v0 index |
| Path 1 read-only smoke test (likely Anthropic Connector host) | [`evals/blender-connector-read-only-smoke-test.md`](./evals/blender-connector-read-only-smoke-test.md) | Pass / Available |
| Cyberpunk shoe v0 text-only eval | [`evals/cyberpunk-shoe-hero-v0-text-eval.md`](./evals/cyberpunk-shoe-hero-v0-text-eval.md) | Executed / Text-only |
| Cyberpunk shoe v0 manual eval protocol | [`evals/cyberpunk-shoe-hero-v0-manual-eval.md`](./evals/cyberpunk-shoe-hero-v0-manual-eval.md) | Protocol / Not yet executed |
| Cyberpunk shoe v0 runtime eval | [`evals/cyberpunk-shoe-hero-v0-runtime-eval.md`](./evals/cyberpunk-shoe-hero-v0-runtime-eval.md) | Historical / Blocked |
| Manual install beta v0 | [`evals/manual-install-beta-v0.md`](./evals/manual-install-beta-v0.md) | Executed / Dry-run / Warn |
| Adapter install v0 dry-run | [`evals/adapter-install-v0-dry-run.md`](./evals/adapter-install-v0-dry-run.md) | Executed / Dry-run |
| Skill package upload-readiness v0 | [`evals/skill-package-upload-readiness-v0.md`](./evals/skill-package-upload-readiness-v0.md) | Executed / Text-only / No upload / Warn |
| Official runtime verification criteria | [`evals/official-runtime-verification-criteria.md`](./evals/official-runtime-verification-criteria.md) | Prepared |
| Runtime availability checklist | [`evals/runtime-availability-checklist.md`](./evals/runtime-availability-checklist.md) | Prepared |
| Official runtime manual eval packet | [`evals/official-runtime-manual-eval-packet.md`](./evals/official-runtime-manual-eval-packet.md) | Prepared |
| Release readiness status | [`release-readiness.md`](./release-readiness.md) | Draft v0; do not tag yet |
| Release readiness rollup v0 | [`release-readiness-rollup-v0.md`](./release-readiness-rollup-v0.md) | Phase 3.3 pre-runtime rollup |

---

## 🧪 Skill reviews + reports

| Area | Doc |
|---|---|
| Index | [`../skill-reviews/README.md`](../skill-reviews/README.md) |
| Review gates | [`../skill-reviews/review-gates.md`](../skill-reviews/review-gates.md) |
| Acceptance criteria | [`../skill-reviews/acceptance-criteria.md`](../skill-reviews/acceptance-criteria.md) |
| Skill template | [`../skill-reviews/blendops-skill-template.md`](../skill-reviews/blendops-skill-template.md) |
| Depth standard | [`../skill-reviews/depth-standard.md`](../skill-reviews/depth-standard.md) |
| v0 depth audit report | [`../skill-reviews/reports/v0-skill-depth-audit.md`](../skill-reviews/reports/v0-skill-depth-audit.md) |
| v0 skill gate review report | [`../skill-reviews/reports/v0-skill-gate-review.md`](../skill-reviews/reports/v0-skill-gate-review.md) |

---

## 🔬 Research notes

| Topic | Doc |
|---|---|
| Skill systems research | [`research/skill-systems-research.md`](./research/skill-systems-research.md) |
| Skill / law pattern synthesis | [`research/skill-system-patterns.md`](./research/skill-system-patterns.md) |
| Skill system decision matrix | [`research/skill-system-decision-matrix.md`](./research/skill-system-decision-matrix.md) |
| Install patterns research | [`research/install-patterns-research.md`](./research/install-patterns-research.md) |
| Blender workflow research | [`research/blender-workflow-research.md`](./research/blender-workflow-research.md) |
| Blender quality checklist | [`research/blender-quality-checklist.md`](./research/blender-quality-checklist.md) |
| Blender skill benchmark analysis | [`research/blender-skill-benchmark-analysis.md`](./research/blender-skill-benchmark-analysis.md) |
| Web 3D asset pipeline | [`research/web-3d-asset-pipeline.md`](./research/web-3d-asset-pipeline.md) |

---

## ⚠️ Non-claims preserved

- BlendOps does not install Blender, configure the Anthropic Blender Connector, configure the Blender Lab MCP add-on, configure the community `ahujasid/blender-mcp` stack, or run Blender.
- Read-only smoke evidence is not mutation/render/export evidence.
- CLI fallback is **documented upstream** as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.
- No marketplace / npm / `npx` listing. No tag.
- See [`release-readiness.md`](./release-readiness.md) for the full readiness state.
