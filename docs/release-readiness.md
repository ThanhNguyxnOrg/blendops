# 🚦 Release Readiness

Status: Draft v0, not production, not stable  
Date: 2026-04-29

> [!CAUTION]
> Conservative tag decision: **do not tag v0.1.0 yet; defer tag until official runtime manual eval evidence exists, or until missing runtime evidence is explicitly accepted as a documented limitation.** BlendOps has useful Draft v0 install and documentation evidence, but runtime eval evidence is still Blocked / Not Run and artifacts are Not Produced.
>
> Phase 3.3 rollup: [docs/release-readiness-rollup-v0.md](./release-readiness-rollup-v0.md)

---

## Status dashboard

| Gate | Status | Evidence |
|---|---|---|
| Product and docs direction | Ready for Draft v0 review | Active docs describe official-runtime workflow and skill collection direction. |
| Root collection layout | Ready for Draft v0 review | `skills/`, `laws/`, and `packs/` exist. |
| Skill depth and gate review | Ready for Draft v0 review | Skill depth enrichment and gate review reports exist. |
| Adapter install dry-run | Warn | Adapter architecture and dry-run install eval are complete, with native-path confidence still environment-dependent. |
| Manual install beta | Warn | Evidence report: [docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md). |
| Official runtime verification criteria | Prepared | Criteria doc: [docs/evals/official-runtime-verification-criteria.md](./evals/official-runtime-verification-criteria.md). |
| Runtime availability checklist | Prepared | Readiness doc: [docs/evals/runtime-availability-checklist.md](./evals/runtime-availability-checklist.md). |
| Official runtime manual eval packet | Prepared | Packet doc: [docs/evals/official-runtime-manual-eval-packet.md](./evals/official-runtime-manual-eval-packet.md). |
| Claude Desktop Blender connector read-only smoke test | Pass / Available | Evidence report: [docs/evals/blender-connector-read-only-smoke-test.md](./evals/blender-connector-read-only-smoke-test.md). Read-only session access only; no mutation, render, export, or artifacts. |
| Official runtime manual eval | Blocked / Not Run | Full eval remains Not Run; read-only connector access is not artifact or recipe evidence. |
| Runtime artifacts | Not Produced | No fresh preview/render/GLB evidence has been produced in official-runtime manual eval. |
| Release tag | Not Ready | Do not tag v0.1.0 yet; defer until official runtime manual eval evidence exists or missing runtime evidence is explicitly accepted as a documented limitation. |

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
- Claude Desktop Blender connector read-only smoke test has Pass / Available evidence: [docs/evals/blender-connector-read-only-smoke-test.md](./evals/blender-connector-read-only-smoke-test.md).

---

## ❌ Not Ready

- Official runtime manual eval is blocked/not executed in a runtime-available environment.
- Claude Code native install path confidence remains environment-dependent.
- Product-hero v0 pack remains Draft v0.
- No fresh BlendOps runtime artifact evidence, preview/render/GLB, has been produced in official-runtime manual eval.
- The v0.1.0 draft tag is not ready; see the Phase 3.3 rollup: [docs/release-readiness-rollup-v0.md](./release-readiness-rollup-v0.md).

---

## ⚠️ Warnings

1. Claude Code native path confidence is not universal across environments.
2. Official runtime manual execution evidence is missing; read-only connector access is verified but does not prove recipe execution, rendering, export, or artifact validation.
3. Manual install beta verdict remains Warn, not full Pass.
4. Some skill examples can still be expanded for edge audiences.
5. Confidence labels may require tighter environment scoping.

---

## 🧱 Blockers

| Blocker | Status | Required evidence |
|---|---|---|
| Official runtime criteria | Prepared | Draft v0 criteria prepared in [docs/evals/official-runtime-verification-criteria.md](./evals/official-runtime-verification-criteria.md); no runtime execution claimed. |
| Runtime availability checklist | Prepared | Draft v0 readiness checklist prepared in [docs/evals/runtime-availability-checklist.md](./evals/runtime-availability-checklist.md); no runtime execution claimed. |
| Official runtime manual eval packet | Prepared | Draft v0 packet prepared in [docs/evals/official-runtime-manual-eval-packet.md](./evals/official-runtime-manual-eval-packet.md); no runtime execution claimed. |
| Official runtime manual eval evidence | Blocked / Not Run | Runtime eval record with real execution evidence in a runtime-available environment. |
| Runtime artifact evidence | Not Produced | Preview/render/GLB evidence captured from official-runtime manual eval. |
| Adapter native-path certainty | Warn | Environment-scoped decision or accepted limitation with clear user-facing wording. |

---

## 🧾 Required before draft release tag

- [x] Prepare official runtime verification criteria without claiming runtime execution.
- [x] Prepare runtime availability checklist without claiming runtime execution.
- [x] Prepare official runtime manual eval packet without claiming runtime execution.
- [ ] Resolve remaining adapter friction found during manual install beta.
- [ ] Run official-runtime manual eval with evidence capture.
- [ ] Verify rollback procedures end-to-end.
- [ ] Resolve or explicitly accept remaining warnings.
- [ ] Keep final tag decision conservative until blockers are cleared.

> [!WARNING]
> Current decision: **do not tag v0.1.0 yet; defer tag until official runtime manual eval evidence exists, or until missing runtime evidence is explicitly accepted as a documented limitation.** This is a Draft v0 readiness report, not a production or stable readiness claim.

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
