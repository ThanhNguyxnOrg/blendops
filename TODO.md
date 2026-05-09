# BlendOps Roadmap (Product-Layer Rebuild)

_Last updated: 2026-05-09 (Phase 4: 10 → 16 skills + 9 → 16 install targets; Superpowers + BMad inspired process / discipline skills + Ollama / LM Studio / Open WebUI local + Cline / Continue / Zed / goose MCP-first agents)_

> [!NOTE]
> BlendOps remains **Draft v0**. The **content layer** (docs, skills, laws, packs, bundles) is **shippable / runnable end-to-end** for content install + planning workflows. The **runtime evidence layer** is gated on the operator running Blender once and recording evidence — BlendOps publisher cannot do that for the user because BlendOps does not install Blender.

---

## ▶️ Is BlendOps "running" yet?

| Layer | Runnable? | Why |
|---|---|---|
| Content install (clone → paste prompt → agent installs project-locally OR prepares Skills ZIPs) | ✅ Yes | `docs/ai-agent-quickstart.md` + 3 mode flow + 9 install targets. Just paste the README 30-second prompt. |
| Skill upload to Claude Desktop / Claude.ai | ✅ Yes (mechanically) | `npm run skills:export` → 10 ZIPs ready in `dist/claude-skills/desktop-zips/`. UI upload is manual user action. |
| Skill upload to ChatGPT (OpenAI Skills UI) | ✅ Yes (mechanically) | `bundles/skill-package/blendops/` + `agents/openai.yaml` ready. UI upload is manual user action. |
| Path 1 read-only Blender access (Lab MCP via Anthropic Connector or manual MCP) | ✅ Smoke verified 2026-04-29 | Mutation/render/export not attempted. |
| Path 2 community `ahujasid/blender-mcp` | ⚠️ User-reported verified 2026-05-08 | No formal evidence file yet. |
| CLI fallback | ❌ Not Run / Publisher has not verified | Documented for completeness only. |
| Full runtime manual eval (any path) | ❌ **Blocked on operator** | Requires running Blender, capturing mutation/render/export evidence, saving `docs/evals/path-X-...md`. |
| `v0.1.0` tag | ❌ Not Ready | Conservative: defer until full runtime eval evidence exists OR explicitly accept the limitation. |
| `npx blendops` installer | ❌ Not implemented | Spec only at `docs/install/installer-spec.md`. |
| Marketplace / plugin listing | ❌ Not Published | Documented as future work. |

**Bottom line**: someone can clone the repo today, install BlendOps content into any AI agent, plan a Blender scene, prepare Skills ZIPs, follow per-path setup steps to reach Blender — and BlendOps will reliably refuse to claim runtime/artifact success without operator-recorded evidence. That's exactly the Draft v0 contract.

---

## 🟢 What's done

### ✅ Phase 0: Product reset
- [x] remove old custom runtime implementation
- [x] rewrite docs truthfully
- [x] define external runtime assumption
- [x] define first non-Blender-user journey
- [x] add external runtime setup overview docs (`docs/external-runtime-setup.md`)

### ✅ Phase 1: First non-Blender-user golden path spec
- [x] user asks for a simple 3D product hero
- [x] define AI workflow
- [x] define expected artifacts
- [x] define acceptance criteria
- [x] define external runtime assumptions using official runtime hierarchy
- [x] document first golden path (`docs/golden-path-cyberpunk-shoe.md`)
- [x] define workflow contract (`docs/workflow-contract.md`)
- [x] define product-layer safety model (`docs/safety-model.md`)

### ✅ Phase 1.5: Research foundation
- [x] research skill/workflow systems and source-verify claims
- [x] produce skill/law pattern synthesis
- [x] produce decision matrix for BlendOps v0 direction
- [x] research Blender production workflow with source confidence labels
- [x] research Blender to GLB to web handoff pipeline
- [x] define Blender quality checklist categories and gate format
- [x] draft BlendOps synthesis docs (design, law format, first skill pack)

### ✅ Phase 1.6: Official runtime strategy alignment
- [x] remove non-official runtime references from active strategy
- [x] adopt official-only runtime references in active docs
- [x] research official Blender MCP (Lab MCP `bpype/blender_mcp`) source accessibility
- [x] research Anthropic Blender Connector source accessibility
- [x] update v0 skill pack runtime assumptions to documented-only

### ✅ Phase 2: Workflow design
- [x] scene plan format
- [x] safety model
- [x] validation checklist
- [x] user-facing language
- [x] render/export expectations

### ✅ Phase 2.5: v0 pack review and text-only eval
- [x] create cyberpunk shoe v0 manual eval protocol
- [x] run text-only dry eval before runtime manual eval
- [x] create runtime eval result/blocker record
- [x] decide whether to package installable skills later (Decision 2026-05-08: YES, packaged as multi-skill ZIP fixtures + 3 bundle fixtures: `bundles/skill-package/`, `bundles/claude-desktop-manual/`, `bundles/generic-project-local/`)
- [x] refine validation gates (`scripts/check-docs.mjs` enforces Anthropic Skills frontmatter spec, OpenAI YAML, runtime model snippets, link validity, Blender 5.1+ for Path 1; per-skill SKILL.md validation checklists; pack-level gates in `packs/product-hero-v0/PACK.md`)

### ✅ Phase 2.6: Installable skill pack layout
- [x] create root `skills/` multi-skill entrypoints (10 skills total)
- [x] create root laws (4 laws)
- [x] create root pack (`packs/product-hero-v0/PACK.md`)
- [x] create workflow doc (`docs/workflows/product-hero-workflow.md`)
- [x] create recipe doc (`docs/recipes/cyberpunk-shoe-hero.md`)
- [x] create per-skill references and EVAL files
- [x] update docs to point to installable pack

### ✅ Phase 2.7: Skill depth and review gates
- [x] benchmark Blender skill repos
- [x] create canonical skill template (`skills/_template/SKILL.md`)
- [x] create review gates (`skill-reviews/review-gates.md`)
- [x] expand 8 root skills (later 10 with `official-runtime-setup-guide` and `blendops-help`)
- [x] add per-skill eval prompts
- [x] update pack manifest

### ✅ Phase 2.8: Skill depth audit and enrichment
- [x] audit every root skill for depth
- [x] define depth standard (`skill-reviews/depth-standard.md`)
- [x] enrich all root SKILL.md files
- [x] add per-skill references
- [x] enrich per-skill EVAL files
- [x] update pack/readme indexes

### ✅ Phase 2.9: Skill gate review eval
- [x] run every root skill through review gates
- [x] produce pass/warn/fail report (`skill-reviews/reports/v0-skill-gate-review.md`)
- [x] fix remaining weak skills
- [x] then run adapter install dry-run

### ✅ Phase 2.10: Adapter install dry-run eval
- [x] test generic-root fallback in a disposable fixture project
- [x] test Claude Code adapter in a disposable fixture
- [x] test Claude app setup docs text-only
- [x] verify no runtime is installed/run
- [x] verify rollback instructions
- [x] update install flow from findings

### ✅ Phase 2.11: Public repo polish and release-readiness cleanup
- [x] update GitHub About/topics if needed
- [x] cleanup stale duplicate docs (5 obsolete docs deleted 2026-05-08; see `docs/README.md` for current hub)
- [x] update README milestones (slim badge layout 2026-05-08)
- [x] prepare v0 manual install instructions
- [x] decide whether to tag draft release (Decision: do not tag yet; defer until official runtime manual eval evidence exists or limitation is explicitly accepted)
- [x] polish README.md into product landing page (slim + 17 badges + redirect to `docs/README.md` hub)
- [x] create `docs/start-here.md` friendly docs overview

### ✅ Phase 2.12: Manual install beta
- [x] run generic-root install dry-run in disposable fixture project
- [x] run Claude Code project-local fallback dry-run
- [x] run Claude app/Desktop docs-only/reference walkthrough
- [x] verify no runtime was installed/run
- [x] verify rollback clarity in fixture reports
- [x] document beta findings in `docs/evals/manual-install-beta-v0.md`

### ✅ Phase 4 agent expansion (local + MCP-first, 2026-05-09)

Added 7 new install targets (9 → 16 total) based on web research of MCP support in popular agents and local LLM runners:

- [x] `docs/install/cline.md` — VS Code MCP-first extension. Source: https://docs.cline.bot/mcp-servers/mcp.
- [x] `docs/install/continue.md` — VS Code / JetBrains assistant; `.continue/mcpServers/` YAML or JSON. Source: https://docs.continue.dev/customize/deep-dives/mcp.
- [x] `docs/install/zed.md` — Zed editor; `settings.json` `context_servers` + extensions; HTTP/SSE since Nov 2025; remote MCP since Jan 2026. Source: https://zed.dev/docs/ai/mcp.
- [x] `docs/install/goose.md` — Block's goose agent; **upstream Blender MCP tutorial exists** at http://block.github.io/goose/docs/mcp/blender-mcp covering Path 2.
- [x] `docs/install/ollama.md` — Local LLM; experimental MCP via PR #13700 (`~/.ollama/mcp-servers.json`, namespaced tools, `--experimental` flag) + 3rd-party clients (mcphost, mcp-client-for-ollama, OllamaC).
- [x] `docs/install/lm-studio.md` — Local LLM; native MCP since 0.3.17, `mcp.json` Cursor-compatible.
- [x] `docs/install/open-webui.md` — Local LLM frontend; native MCP since 0.6.31, Streamable HTTP transport (stdio MCP needs bridge).

All 7 register in `docs/install/README.md`, `docs/adapter-registry.md` "Install-only pending adapter draft" section, `docs/multi-agent-install-strategy.md` per-client matrix, `docs/ai-agent-install-flow.md` target confidence table, `scripts/check-docs.mjs requiredDocs`, `README.md` badges + per-target table, `docs/README.md` per-target tables.

Adapter rows for these 7 stay deferred until each native skill path is verified — they are install-only docs with linked-only confidence labels (per the adapter promotion ladder defined in `docs/adapter-registry.md`).

### ✅ Phase 4 skills expansion (Superpowers + BMad inspired, 2026-05-09)

Added 6 new process / discipline skills based on web research of [Anthropic Superpowers](https://github.com/anthropics/skills) (150K+ stars, 12-skill framework) and [BMad-Method](https://docs.bmad-method.org/) (34+ agile-AI workflows):

- [x] `skills/blender-brainstorming/` — Socratic intent exploration before planning (Superpowers `/brainstorming` analog).
- [x] `skills/blender-troubleshooting/` — Structured 4-phase root-cause analysis (Superpowers `/systematic-debugging` analog).
- [x] `skills/pre-handoff-verification/` — 7-point evidence gate before any "ready" / `Verified` claim (Superpowers `/verification-before-completion` analog).
- [x] `skills/intent-to-3d-brief-writer/` — Convert NL intent into 8-slot structured 3D brief (BMad analysis-phase analog).
- [x] `skills/blender-asset-discovery-planner/` — Per-asset acquisition strategy (procedural / library / generative / photogrammetry) before scene planner (BlendOps-specific).
- [x] `skills/runtime-bridge-conflict-resolver/` — Diagnose Single-bridge constraint conflicts (Path 1 + Path 2 + port `9876`) (BlendOps-specific).

All 6 ship with `SKILL.md` + `EVAL.md`, frontmatter ≤200 chars, all required headings present, registered in `scripts/check-docs.mjs`, summarized in both bundles, indexed in `docs/skill-system.md`, `skills/README.md`, `docs/README.md`. Skills export now produces 16 ZIPs + 16 Claude Code folders.

### ✅ Phase 2.13: Portable skill system architecture
- [x] create canonical skill system guide (`docs/skill-system.md`)
- [x] create reusable root skill template (`skills/_template/SKILL.md`)
- [x] add BlendOps next-step helper skill (`skills/blendops-help/SKILL.md`)
- [x] add BlendOps next-step helper baseline eval (`skills/blendops-help/EVAL.md`)
- [x] add render/export evidence skill (`skills/render-export-evidence/SKILL.md`)
- [x] add render/export evidence baseline eval (`skills/render-export-evidence/EVAL.md`)
- [x] document canonical aliases for runtime readiness and scene planning without duplicating skills
- [x] document AI agent paste-command install flow (`docs/ai-agent-install-flow.md`)
- [x] create per-target AI agent install docs (`docs/install/`, 9 targets + installer-spec)
- [x] design local installer script spec (`docs/install/installer-spec.md`) without implementation
- [x] create Claude Desktop skill bundle without claiming connector/runtime success
- [x] package a project-local skill bundle with rollback notes (`bundles/generic-project-local/` with `ROLLBACK.md`)
- [x] research OpenCode, Cursor, Codex, and Gemini adapters with confidence labels (initial drafts in `docs/install/{opencode,cursor,codex,gemini}.md` and `docs/adapters/{opencode,cursor,codex}.md` with linked-only confidence; Gemini stays install-only pending source-backed verification)
- [x] create skill packaging fixture and validation script (`scripts/export-claude-skills.mjs` produces 10 ZIPs + 10 Claude Code folders; `scripts/check-docs.mjs` validates 137 active markdown files against runtime model, frontmatter spec, evidence rules, link integrity)

### ✅ Phase 3: Official runtime readiness (docs + criteria)
- [x] document official runtime compatibility assumptions without confirming them until evidence exists
- [x] define runtime verification criteria for official integration paths (`docs/evals/official-runtime-verification-criteria.md`)
- [x] prepare official runtime manual eval packet without claiming runtime execution (`docs/evals/official-runtime-manual-eval-packet.md`)
- [x] prepare runtime availability checklist without claiming runtime execution (`docs/evals/runtime-availability-checklist.md`)
- [x] prepare Phase 3.3 pre-runtime release readiness rollup (`docs/release-readiness-rollup-v0.md`)
- [x] record Path 1 read-only smoke test (`docs/evals/blender-connector-read-only-smoke-test.md`; likely Anthropic Connector host)
- [x] settle final runtime model after upstream re-read 2026-05-08: 2 MCP execution paths (Path 1 = Lab MCP with hosts a/b, Path 2 = community `ahujasid`) + CLI fallback appendix (publisher not verified). Earlier 3-stack + 4-route drafts are superseded; see `docs/runtime-stack-strategy.md` for the corrected attribution history
- [x] update eval docs to the 2-path + CLI appendix model (`docs/evals/{official-runtime-manual-eval-packet,official-runtime-verification-criteria,runtime-availability-checklist}.md` legacy mapping notes; `docs/evals/blender-connector-read-only-smoke-test.md` re-attributed)
- [x] draft and link multi-agent install and distribution strategy docs without claiming package or marketplace availability
- [x] complete runtime stack model cleanup across public docs (every doc, skill, law, bundle, and the CI guard now use the same 2-path + CLI appendix model)
- [x] package a project-local generic BlendOps bundle with rollback notes (`bundles/generic-project-local/`)
- [x] prepare Claude Desktop Personal Skill import bundle without claiming connector/runtime success (`bundles/claude-desktop-manual/`)
- [x] promote canonical portable BlendOps skill package source (`bundles/skill-package/blendops/`)
- [x] clarify OpenAI metadata vs multi-agent adapters (`bundles/skill-package/blendops/agents/README.md`)
- [x] complete skill package upload-readiness eval (text-only/source-level; `docs/evals/skill-package-upload-readiness-v0.md`)
- [x] add universal install prompt that auto-selects project-local install, skill.zip preparation, or blocked-needs-input (`docs/ai-agent-quickstart.md` Mode A/B/C)
- [x] define evidence gates for any future tool-native package, extension, or marketplace listing (`docs/install/installer-spec.md` "Implementation gates before promotion"; `docs/distribution-strategy.md` distribution levels + required evidence per listing)
- [x] research OpenCode installation options after source-backed path verification (drafted in `docs/install/opencode.md` + `docs/adapters/opencode.md` with linked-only confidence; further verification deferred until upstream OpenCode skill API is source-backed)
- [x] research and draft Cursor, Codex adapters with confidence labels (`docs/install/{cursor,codex}.md` + `docs/adapters/{cursor,codex}.md`); Gemini remains install-only pending native MCP/skill format confirmation per upstream

---

## 🚧 Blocked on operator action (cannot be done by docs alone)

These items require **the user (operator) to actually run Blender or upload to a Skills UI**. BlendOps publisher cannot complete them because BlendOps does not install Blender, configure third-party UIs, or operate the user's environment.

### 🔴 Blocked on Blender runtime evidence
- [ ] **run cyberpunk shoe recipe through a runtime path** (Path 1 host a OR host b OR Path 2). Capture mutation, render, export, GLB artifacts, validation notes. Save evidence file under `docs/evals/path-X-recipe-cyberpunk-shoe-YYYY-MM-DD.md`. Template in `docs/evals/blender-connector-read-only-smoke-test.md` "What a clean re-verification would record".
- [ ] **inspect if non-Blender-user response stays friendly under real output** — once recipe has run, route the recorded artifacts through `skills/non-blender-user-response-writer` and check the final response for jargon leakage.
- [ ] **upgrade Path 2 from "user-reported verified" to "Verified" with a formal evidence file** — record `addon.py` commit, `uvx blender-mcp` version, exact tool names called (`get_scene_info`, `execute_blender_code`), Blender version. Save under `docs/evals/path-2-ahujasid-readonly-YYYY-MM-DD.md`.

### 🟡 Blocked on UI test (zero risk, but BlendOps publisher cannot do for the user)
- [ ] **manually test canonical skill package upload/import in a target UI** — upload `bundles/skill-package/blendops/SKILL.md` (or the appropriate ZIP from `dist/claude-skills/desktop-zips/`) into Claude.ai or ChatGPT Skills UI. Confirm: it imports, the description is shown, the skill activates on intent. Save outcome in `docs/evals/skill-package-upload-readiness-v0.md` (already exists; mark text-only → executed once UI test runs).
- [ ] **add Blender-specific eval skills** only after the cyberpunk shoe runtime eval (above) is recorded — these would expand domain skill coverage with evidence-backed claims.

### 🔵 Future work (deliberately deferred)
- [ ] Phase 4 — Minimal product implementation (e.g. an actual `npx blendops` installer). Spec exists at `docs/install/installer-spec.md`. Build only after runtime evidence exists and a clear product requirement justifies it.
- [ ] Phase 5 — Web-ready 3D output specifics (GLB handoff helpers, preview report tooling, React Three Fiber / Three.js usage guidance). Currently covered as planning specs in `skills/glb-web-handoff/SKILL.md` and `docs/golden-path-cyberpunk-shoe.md`. Promote to implementation only after runtime evidence exists.

---

## 🛡️ Permanent policy guards (these are not checkboxes, they stay true forever)

These items used to appear as "[ ] keep X unchecked until evidence" in earlier drafts. They are restated here as **policy** so they are not mistakenly marked done:

- **Runtime status remains `Not Run`** unless a per-path runtime eval evidence file is recorded under `docs/evals/`.
- **Artifact status remains `Not Produced`** unless preview / render / GLB output paths exist on disk AND validation notes are recorded.
- **Packaged skill, plugin listing, marketplace listing remain "Not Published"** unless that surface actually accepts and lists the package — see `docs/distribution-strategy.md`.
- **Product implementation decisions remain deferred** until official runtime evidence exists. (Phase 4 entry above.)
- **Arbitrary Python is never the BlendOps user-facing workflow.** This is enforced by `laws/no-arbitrary-python-interface.md`. The runtime paths use LLM-generated Python internally; BlendOps' final product surface stays workflow + validation + evidence.

---

## 🎯 What changes the picture

The single highest-leverage operator action is **running the cyberpunk shoe recipe through one runtime path once and saving the evidence file**. Doing that:

- Upgrades Path 1 (or Path 2) from "smoke / user-reported" to "Verified".
- Unblocks Phase 2.5 final 2 items.
- Removes the "Full runtime manual eval: Blocked / Not Run" badge.
- Justifies the `v0.1.0` tag (or an explicit documented limitation acceptance).

Everything else upstream of that is the operator's environment (which Blender, which MCP host, which client) and is correctly outside the publisher's scope.
