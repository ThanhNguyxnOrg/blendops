# BlendOps Roadmap (Product-Layer Rebuild)

_Last updated: 2026-05-09 (operator reconfirms Path 1 + Path 2 both work in their environment; CLI fallback reframed from "publisher has not verified" → "documented upstream as first-class Blender CLI surface, no in-repo evidence file yet"; the misframed "Blocked on UI test" section removed because UI upload is the user's manual step, not a publisher-side test gap)_

> [!NOTE]
> BlendOps remains **Draft v0**. The **content layer** (docs, skills, laws, packs, bundles) is **shippable / runnable end-to-end** for content install + planning workflows. **Runtime paths Path 1 + Path 2 are user-reported verified by the repo owner** — they actually run on the operator's machine — but BlendOps does not yet hold a captured per-path **in-repo evidence file** with mutation/render/export tool calls. The publisher cannot generate that file for someone else's Blender install; the user runs Blender once and saves the evidence file.

---

## ▶️ Is BlendOps "running" yet?

| Layer | Runnable? | Why |
|---|---|---|
| Content install (clone → paste prompt → agent installs project-locally OR prepares Skills ZIPs) | ✅ Yes | `docs/ai-agent-quickstart.md` + 3 mode flow + 16 install targets. Just paste the README 30-second prompt. |
| Skill ZIP / package generation | ✅ Yes | `npm run skills:export` → 16 ZIPs ready in `dist/claude-skills/desktop-zips/` + canonical portable skill at `bundles/skill-package/blendops/`. |
| Skill upload to Claude Desktop / Claude.ai / ChatGPT Skills UI | ✅ Yes (the UI step is the user's manual action, not a publisher gap) | `npm run skills:export` produces correctly-shaped Anthropic Skills (≤200-char description, no `version:` / `status:` keys) and an OpenAI YAML manifest. Importing into the chat-app UI is a 30-second drag-drop the user performs once. |
| Path 1 — Official Blender Lab MCP (Lab add-on + Lab server, host: Anthropic Connector OR manual MCP, Blender 5.1+) | ✅ User-reported verified by repo owner (2026-04-29 read-only smoke + 2026-05-09 reconfirms full path works) | No captured in-repo evidence file with mutation/render/export tool calls yet. |
| Path 2 — Community `ahujasid/blender-mcp` (Blender 3.0+) | ✅ User-reported verified by repo owner (2026-05-08, reconfirmed 2026-05-09) | No captured in-repo evidence file yet. |
| CLI fallback (`blender --background --python ...`) | ⚠️ Documented upstream as a first-class Blender CLI surface (stable across LTS releases, used widely in render farms / HPC / CI) | No in-repo evidence file yet. The path itself is upstream-stable and not "experimental"; only the captured eval record is missing. |
| In-repo runtime evidence file (any path, mutation/render/export captured) | ❌ Not Yet Captured | Requires running Blender on the operator's machine and saving `docs/evals/path-X-...md`. BlendOps does not install Blender, so the publisher cannot do this for someone else's environment. |
| `v0.1.0` tag | ❌ Not Ready | Conservative: defer until at least one captured per-path evidence file exists OR the limitation is explicitly accepted in the release notes. |
| `npx blendops` installer | ❌ Not implemented | Spec only at `docs/install/installer-spec.md`. |
| Marketplace / plugin listing | ❌ Not Published | Documented as future work. |

**Bottom line**: someone can clone the repo today, install BlendOps content into any AI agent, plan a Blender scene, prepare Skills ZIPs, drag-drop them into Claude.ai / ChatGPT, follow per-path setup steps to reach Blender, and **actually drive Blender via Path 1 or Path 2** (both user-reported verified by the repo owner). The only unbuilt thing is a captured per-path evidence file under `docs/evals/`, which by design lives on the operator's machine. That's the Draft v0 contract.

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

### ✅ Phase 4 agent expansion (more coding agents + local LLM runners, 2026-05-09)

Added 7 new install targets (9 → 16 total) based on web research of MCP support in popular tools. **All 11 of the existing + new coding agents share the same install pattern** (project-local files + optional MCP host config); the prior "MCP-first agent" sub-bucket was an artificial split and is dropped. Only Claude Desktop (chat UI) and the 3 local LLM runners (Ollama / LM Studio / Open WebUI) are genuinely different consumer types.

**Coding agents added (4 of them — same install pattern as Claude Code / Cursor / Codex):**

- [x] `docs/install/cline.md` — VS Code coding agent with MCP support. Source: https://docs.cline.bot/mcp-servers/mcp.
- [x] `docs/install/continue.md` — VS Code / JetBrains coding agent; `.continue/mcpServers/` YAML or JSON. Source: https://docs.continue.dev/customize/deep-dives/mcp.
- [x] `docs/install/zed.md` — Zed editor (coding agent UX); `settings.json` `context_servers` + extensions; HTTP/SSE since Nov 2025; remote MCP since Jan 2026. Source: https://zed.dev/docs/ai/mcp.
- [x] `docs/install/goose.md` — Block's goose coding agent; **upstream Blender MCP tutorial exists** at http://block.github.io/goose/docs/mcp/blender-mcp covering Path 2.

**Local LLM runners added (3 — genuinely different consumer type, BlendOps stays docs-only):**

- [x] `docs/install/ollama.md` — Local LLM runner; experimental MCP via PR #13700 (`~/.ollama/mcp-servers.json`, namespaced tools, `--experimental` flag) + 3rd-party clients (mcphost, mcp-client-for-ollama, OllamaC).
- [x] `docs/install/lm-studio.md` — Local LLM runner; native MCP since 0.3.17, `mcp.json` Cursor-compatible.
- [x] `docs/install/open-webui.md` — Local LLM frontend; native MCP since 0.6.31, Streamable HTTP transport (stdio MCP needs bridge).

All 7 register in `docs/install/README.md`, `docs/adapter-registry.md` "Install-only pending adapter draft" section, `docs/multi-agent-install-strategy.md` per-client matrix, `docs/ai-agent-install-flow.md` target confidence table, `scripts/check-docs.mjs requiredDocs`, `README.md` badges + per-target table, `docs/README.md` per-target tables.

Adapter rows for these 7 stay deferred until each native skill path is verified — they are install-only docs with linked-only confidence labels (per the adapter promotion ladder defined in `docs/adapter-registry.md`).

### ✅ Phase 4 final docs polish (2026-05-09)

After the 6 Phase 4 skills + 7 install targets + references/ rounds, the remaining
docs cleanup is now complete:

- [x] Promote final 2 baseline skills (`blendops-help`, `render-export-evidence`)
      from Draft v0 → Expanded Draft v0 by adding `references/` (3 files each:
      routing-decision-tree / quick-start-prompts / lifecycle-phases for
      `blendops-help`; truth-label-decision-tree / evidence-record-templates /
      attempted-vs-failed-rubric for `render-export-evidence`).
      → **All 16 skills now Expanded Draft v0**.
- [x] Refresh `skill-reviews/reports/v0-skill-depth-audit.md` to cover all 16
      skills (was 8); drop "partial snapshot" WARNING banner.
- [x] Refresh `skill-reviews/reports/v0-skill-gate-review.md` to cover all 16
      skills (was 8); 13 Pass / 3 Warn (Superpowers + BMad source-provenance
      notes) / 0 Fail; drop "partial snapshot" WARNING.
- [x] Add canonical 7-stage `docs/workflows/full-non-blender-user-workflow.md`
      chaining all 16 skills end-to-end. Update `docs/workflows/README.md`
      and `docs/README.md` workflows section to list it as the canonical
      broad-scope workflow (with `product-hero-workflow.md` reframed as
      the narrower subset).

After this, the only remaining actionable items are operator-blocked
(runtime evidence) or future-deferred (Phase 4 npx installer / Phase 5
web-3D implementation) — see the "Blocked on operator action" and
"Future work deliberately deferred" sections below.

### ✅ Phase 4 skills expansion (Superpowers + BMad inspired, 2026-05-09)

Added 6 new process / discipline skills based on web research of [Anthropic Superpowers](https://github.com/anthropics/skills) (150K+ stars, 12-skill framework) and [BMad-Method](https://docs.bmad-method.org/) (34+ agile-AI workflows):

- [x] `skills/blender-brainstorming/` — Socratic intent exploration before planning (Superpowers `/brainstorming` analog).
- [x] `skills/blender-troubleshooting/` — Structured 4-phase root-cause analysis (Superpowers `/systematic-debugging` analog).
- [x] `skills/pre-handoff-verification/` — 7-point evidence gate before any "ready" / `Verified` claim (Superpowers `/verification-before-completion` analog).
- [x] `skills/intent-to-3d-brief-writer/` — Convert NL intent into 8-slot structured 3D brief (BMad analysis-phase analog).
- [x] `skills/blender-asset-discovery-planner/` — Per-asset acquisition strategy (procedural / library / generative / photogrammetry) before scene planner (BlendOps-specific).
- [x] `skills/runtime-bridge-conflict-resolver/` — Diagnose Single-bridge constraint conflicts (Path 1 + Path 2 + port `9876`) (BlendOps-specific).

All 6 ship with `SKILL.md` + `EVAL.md` + 3 `references/` files each (18 reference files total: templates, playbooks, decision trees, patterns, do-not lists). Frontmatter ≤200 chars, all required headings present, registered in `scripts/check-docs.mjs`, summarized in both bundles, indexed in `docs/skill-system.md`, `skills/README.md`, `docs/README.md`. All 6 promoted from Draft v0 → **Expanded Draft v0** after references/ added (matches the existing 8 Expanded Draft v0 skills' depth pattern). Skills export now produces 16 ZIPs + 16 Claude Code folders.

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
- [x] settle final runtime model after upstream re-read 2026-05-08: 2 MCP execution paths (Path 1 = Lab MCP with hosts a/b, Path 2 = community `ahujasid`) + CLI fallback appendix (documented upstream as first-class Blender CLI surface; no in-repo evidence file yet). Earlier 3-stack + 4-route drafts are superseded; see `docs/runtime-stack-strategy.md` for the corrected attribution history
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

## 🚧 Items the operator runs, not the publisher

These items require **the user (operator) to actually run Blender** on their own machine and save the resulting evidence file in this repo. BlendOps publisher does not install Blender, does not run Blender on the user's machine, and does not own the user's MCP host configuration — so the publisher cannot generate these evidence files for someone else's environment.

This is not the same thing as "untested". Path 1 + Path 2 are user-reported verified by the repo owner already; only the captured in-repo evidence file is missing.

### 🔴 In-repo runtime evidence file (one captured eval per path)
- [ ] **Capture Path 1 in-repo evidence file** — run the cyberpunk shoe recipe (or any non-trivial recipe) via Path 1 (host a Anthropic Connector OR host b manual MCP). Record `blender --version`, Lab MCP add-on version, MCP server source/commit, MCP host product+build, exact tool names called + responses, mutation / render / export / GLB artifact output paths, validation notes. Save as `docs/evals/path-1-recipe-cyberpunk-shoe-YYYY-MM-DD.md`. Template in `docs/evals/blender-connector-read-only-smoke-test.md` "What a clean re-verification would record".
- [ ] **Capture Path 2 in-repo evidence file** — run a recipe (read-only first, then mutation) via `ahujasid/blender-mcp`. Record `blender --version`, `addon.py` commit, `uvx blender-mcp` version, MCP host, exact tool names (`get_scene_info`, `execute_blender_code`, etc.) + responses, artifacts. Save as `docs/evals/path-2-ahujasid-readonly-YYYY-MM-DD.md` (template at `docs/evals/path-2-ahujasid-readonly-template.md`).
- [ ] **Optional: capture CLI fallback in-repo evidence file** — pick any small recipe, run via `blender --background --python script.py --render-output ...`, save `docs/evals/cli-fallback-recipe-...-YYYY-MM-DD.md`. The CLI itself is upstream-stable; this is purely about getting an in-repo provenance record.

### 🔵 Future work (deliberately deferred)
- [ ] Phase 4 — Minimal product implementation (e.g. an actual `npx blendops` installer). Spec exists at `docs/install/installer-spec.md`. Build only after at least one captured runtime evidence file exists and a clear product requirement justifies it.
- [ ] Phase 5 — Web-ready 3D output specifics (GLB handoff helpers, preview report tooling, React Three Fiber / Three.js usage guidance). Currently covered as planning specs in `skills/glb-web-handoff/SKILL.md` and `docs/golden-path-cyberpunk-shoe.md`. Promote to implementation only after runtime evidence exists.

### ⚪ Not a blocker — Skills UI upload

Earlier drafts of this TODO listed "manually test canonical skill package upload/import in a target UI" as a 🟡 blocker. **That framing was wrong.** The contract is:

1. `npm run skills:export` produces correctly-shaped ZIPs / packages (✅ already verified at source level via `scripts/check-docs.mjs` + `docs/evals/skill-package-upload-readiness-v0.md`).
2. The user drag-drops a ZIP into Claude.ai / Claude Desktop / ChatGPT Skills UI (a one-time, 30-second manual action — there is no "test" the publisher can run).

The publisher's job ends at step 1. Step 2 is the documented user action, not a publisher gap.

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

- Promotes Path 1 (or Path 2) from "User-reported verified" to a captured in-repo evidence file.
- Removes the "Full runtime eval: Not Run" badge.
- Justifies the `v0.1.0` tag (or an explicit documented limitation acceptance).

Everything else upstream of that is the operator's environment (which Blender, which MCP host, which client) and is correctly outside the publisher's scope.
