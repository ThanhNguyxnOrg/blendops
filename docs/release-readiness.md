# 🚦 Release Readiness

Status: Draft v0, not production, not stable  
Date: 2026-05-09 (scope clarified)

> [!IMPORTANT]
> **Scope: BlendOps publishes the skills layer; runtime paths are an upstream redirect.** This readiness report grades only what BlendOps **owns**: 16 skills + 4 laws + 1 pack + 3 bundles + 16 install target docs + ZIP/package generation + CI guards. Runtime execution (Path 1 Lab MCP, Path 2 `ahujasid` community, CLI) is owned by Blender Foundation / Anthropic / the community — BlendOps redirects users via per-target install docs and does **not** claim ownership of those upstream paths' stability.
>
> The skills layer is **Ready for Draft v0**. The `v0.1.0-draft` tag is **tag-able now**; deferring it is a publishing decision, not a blocker.
>
> Phase 3.3 rollup: [docs/release-readiness-rollup-v0.md](./release-readiness-rollup-v0.md)

---

## Skills layer dashboard (BlendOps publishes — what this repo owns)

| Gate | Status | Evidence |
|---|---|---|
| Product and docs direction | Ready for Draft v0 review | Active docs describe upstream-redirect workflow and skill collection direction. |
| Root collection layout | Ready for Draft v0 review | `skills/` (16 skills), `laws/` (4 laws), `packs/` (1 pack) exist. |
| Skill depth and gate review | Ready for Draft v0 review | All 16 skills at Expanded Draft v0; 13 Pass / 3 Warn / 0 Fail in `skill-reviews/reports/v0-skill-gate-review.md`. |
| Skill ZIP / package generation | Ready for Draft v0 review | `npm run skills:export` produces 16 ZIPs + 16 Claude Code skill folders. Anthropic Skills frontmatter spec compliance verified. |
| Adapter install dry-run | Warn | Adapter architecture and dry-run install eval are complete, with native-path confidence still environment-dependent. |
| Manual install beta | Warn | Evidence report: [docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md). |
| CI guards | Ready for Draft v0 review | `npm run docs:check` validates 182 markdown files. |
| **`v0.1.0-draft` tag** | **🟡 Tag-able now** | **Skills layer is complete. Tagging is a publishing decision, not gated on upstream runtime evidence.** |

## Runtime paths dashboard (BlendOps redirects to — owned by upstream)

This grades whether BlendOps' redirect docs are accurate, **not** whether BlendOps "owns" the upstream paths.

| Path | Owner | Redirect doc accurate? | In-repo provenance file? |
|---|---|---|---|
| Path 1 — Lab MCP (Blender Foundation) | Blender Foundation ([blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/)) | ✅ Per-target install docs cite source, list Blender 5.1+, host options (a) and (b). | `docs/evals/blender-connector-read-only-smoke-test.md` (read-only). No mutation/render/export evidence file yet (optional operator-side). |
| Path 1 host (a) — Anthropic Blender Connector | Anthropic ([claude.com tutorial](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude)) | ✅ `docs/install/claude-desktop.md` documents Connector + Lab add-on dependency. | Same as Path 1 above. |
| Path 1 host (b) — Manual MCP client config | Each MCP client | ✅ Per-target install docs (cursor, claude-code, cline, continue, …). | Same as Path 1 above. |
| Path 2 — Community `ahujasid/blender-mcp` | `ahujasid` community ([21K+ stars](https://github.com/ahujasid/blender-mcp)) | ✅ `docs/unofficial-runtime-bridges.md` lists caveats; install docs cite source. | Template at `docs/evals/path-2-ahujasid-readonly-template.md`. No filled file yet (optional operator-side). |
| CLI fallback | Blender Foundation ([CLI manual](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html)) | ✅ `docs/runtime-stack-strategy.md` includes a CLI compatibility considerations table (GLB export, --factory-startup add-on enablement, GPU rendering, viewport limits, stateless caveat). | None (optional operator-side). |

> [!NOTE]
> Path 1 + Path 2 are **user-reported verified by repo owner** (2026-04-29 + 2026-05-08 + 2026-05-09 reconfirmation). CLI is decades-stable upstream first-class surface. The lack of an in-repo eval record file does **not** mean the upstream paths don't work — it just means BlendOps has not captured a per-recipe provenance record under `docs/evals/`. That record is optional operator-side.

---

## ✅ Ready

- Official-runtime-only boundaries are active across skills, laws, and packs.
- Root collection exists: `skills/`, `laws/`, `packs/`.
- Skill depth enrichment and gate review reports exist.
- Adapter architecture and dry-run install eval are complete.
- Manual install beta dry-run has been executed and documented: [docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md).
- Official runtime verification criteria are prepared: [docs/evals/official-runtime-verification-criteria.md](./evals/official-runtime-verification-criteria.md).
- Runtime availability checklist is prepared: [docs/evals/runtime-availability-checklist.md](./evals/runtime-availability-checklist.md).
- Official runtime manual eval packet is prepared: [docs/evals/official-runtime-manual-eval-packet.md](./evals/official-runtime-manual-eval-packet.md).
- Path 1 read-only smoke test has Pass / Available evidence (likely Anthropic Connector host): [docs/evals/blender-connector-read-only-smoke-test.md](./evals/blender-connector-read-only-smoke-test.md).

---

## ⚪ Optional / outside publisher scope

The following are **not** "Not Ready" items in the publishing sense — they are deliberately scoped outside what BlendOps owns:

- **In-repo runtime artifact evidence** (preview / render / GLB captured under `docs/evals/`) — optional operator-side provenance. BlendOps redirects to upstream runtime paths and does not run Blender itself, so evidence capture happens on the operator's machine. The upstream paths themselves are user-reported verified by repo owner.
- **Claude Code native install path confidence** — environment-dependent, by design (different Claude Code versions / configs). Documented as Warn with linked-only confidence.
- **Product-hero v0 pack** — labeled Draft v0 deliberately (the recipe is a planning spec, not a "verified once and done" artifact).

---

## ⚠️ Warnings

1. Claude Code native path confidence is not universal across environments.
2. Full runtime manual execution evidence is missing for any path; Path 1 is user-reported verified by repo owner (2026-04-29 read-only smoke + 2026-05-09 operator confirms) but does not yet have an in-repo evidence file proving recipe execution, rendering, export, or artifact validation. Path 2 is user-reported verified by repo owner (2026-05-08, reconfirmed 2026-05-09) without a formal evidence file. CLI fallback is documented upstream as a first-class Blender CLI surface; no in-repo evidence file yet.
3. Manual install beta verdict remains Warn, not full Pass.
4. Some skill examples can still be expanded for edge audiences.
5. Confidence labels may require tighter environment scoping.

---

## 🧱 No blockers for `v0.1.0-draft`

There are no skills-layer blockers for the `v0.1.0-draft` tag. Earlier drafts of this report listed runtime-eval-evidence items as blockers; that framing was wrong because BlendOps does not own runtime execution paths — it redirects to upstream. Skills layer has clean CI, all 16 skills are Expanded Draft v0, all 16 install targets are documented, and skill ZIP / package generation is verified at source level.

The previously-listed "blockers" are now correctly scoped:

| Item | Old framing (wrong) | Correct framing |
|---|---|---|
| Official runtime manual eval evidence | Blocker for v0.1.0 | Optional operator-side provenance record. Path 1 + Path 2 are user-reported verified by repo owner. |
| Runtime artifact evidence | Blocker for v0.1.0 | Optional operator-side provenance under `docs/evals/`. Upstream paths produce real artifacts; BlendOps does not run them. |
| Adapter native-path certainty | Blocker | Documented Warn with linked-only confidence per environment. Not a v0.1.0 blocker. |

---

## 🧾 Ready for `v0.1.0-draft` tag

- [x] 16 skills at Expanded Draft v0 with frontmatter spec compliance.
- [x] 4 laws + 1 pack + 3 bundle fixtures.
- [x] 16 install target docs (Claude Desktop, Claude Code, Cursor, Codex, OpenCode, Gemini, Antigravity, Copilot, Cline, Continue, Zed, goose, Ollama, LM Studio, Open WebUI, generic-project).
- [x] 3-mode auto-detect install flow (Mode A / B / C) in `docs/ai-agent-quickstart.md` + README 30-second prompt.
- [x] Skill ZIP / package generation working (`npm run skills:export` → 16 ZIPs + 16 Claude Code folders).
- [x] CI guards passing (`npm run docs:check` validates 182 active markdown files).
- [x] Runtime-stack-strategy 2-path + CLI appendix documented with upstream redirect clarity.
- [x] CLI compatibility considerations researched + documented (GLB export, add-on enablement, GPU flags, viewport limits, stateless caveat).
- [x] AGENTS.md, CONTRIBUTING.md, GitHub PR / issue templates, package.json metadata.
- [x] TODO.md scope-corrected: optional operator-side provenance items separated from BlendOps publishing items.

> [!NOTE]
> Whether to actually cut the `v0.1.0-draft` tag is a publishing decision (release notes, GitHub release page, etc.). Nothing in the skills layer blocks it. The "Not Run" / "Not Produced" labels on runtime/artifact badges refer to **in-repo provenance under `docs/evals/`**, not to whether the upstream redirect targets work — they do.

---

## 🔒 Required before public stable claim

- Multiple successful runtime eval runs with evidence.
- Artifact-truth reporting validated repeatedly.
- Install adapters validated across at least two environments.
- No unresolved high-risk warnings.

---

## 🧪 Manual beta checklist

Evidence report: [docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md)

- [x] generic-root install dry-run in disposable repo
- [x] Claude Code project-local install dry-run in disposable repo
- [x] Claude app/Desktop setup text-only walkthrough
- [x] verify no runtime installed/run during install tests
- [x] verify rollback instructions are executable
- [x] update install docs from beta findings

---

## 🛑 Non-actions preserved

- This readiness report does not claim Blender runtime was run.
- This readiness report does not claim preview/render/GLB artifacts exist.
- This readiness report does not claim production readiness.
- This readiness report does not claim stable readiness.
