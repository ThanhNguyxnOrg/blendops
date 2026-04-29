# 🚦 Release Readiness

Status: Draft v0, not production, not stable  
Date: 2026-04-29

> [!CAUTION]
> Conservative tag decision: **do not tag yet**. BlendOps has useful Draft v0 install and documentation evidence, but runtime eval evidence is still Blocked / Not Run and artifacts are Not Produced.

---

## Status dashboard

| Gate | Status | Evidence |
|---|---|---|
| Product and docs direction | Ready for Draft v0 review | Active docs describe official-runtime workflow and skill collection direction. |
| Root collection layout | Ready for Draft v0 review | `skills/`, `laws/`, and `packs/` exist. |
| Skill depth and gate review | Ready for Draft v0 review | Skill depth enrichment and gate review reports exist. |
| Adapter install dry-run | Warn | Adapter architecture and dry-run install eval are complete, with native-path confidence still environment-dependent. |
| Manual install beta | Warn | Evidence report: [docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md). |
| Official runtime manual eval | Blocked / Not Run | Runtime-available environment evidence is missing. |
| Runtime artifacts | Not Produced | No fresh preview/render/GLB evidence has been produced in official-runtime manual eval. |
| Release tag | Not Ready | Do not tag yet. |

---

## ✅ Ready

- Official-runtime-only boundaries are active across skills, laws, and packs.
- Root collection exists: `skills/`, `laws/`, `packs/`.
- Skill depth enrichment and gate review reports exist.
- Adapter architecture and dry-run install eval are complete.
- Manual install beta dry-run has been executed and documented: [docs/evals/manual-install-beta-v0.md](./evals/manual-install-beta-v0.md).

---

## ❌ Not Ready

- Official runtime manual eval is blocked/not executed in a runtime-available environment.
- Claude Code native install path confidence remains environment-dependent.
- Product-hero v0 pack remains Draft v0.
- No fresh BlendOps runtime artifact evidence, preview/render/GLB, has been produced in official-runtime manual eval.
- The v0.1.0 draft tag is not ready.

---

## ⚠️ Warnings

1. Claude Code native path confidence is not universal across environments.
2. Official runtime manual execution evidence is missing.
3. Manual install beta verdict remains Warn, not full Pass.
4. Some skill examples can still be expanded for edge audiences.
5. Confidence labels may require tighter environment scoping.

---

## 🧱 Blockers

| Blocker | Status | Required evidence |
|---|---|---|
| Official runtime manual eval evidence | Blocked / Not Run | Runtime eval record with real execution evidence in a runtime-available environment. |
| Runtime artifact evidence | Not Produced | Preview/render/GLB evidence captured from official-runtime manual eval. |
| Adapter native-path certainty | Warn | Environment-scoped decision or accepted limitation with clear user-facing wording. |

---

## 🧾 Required before v0.1.0 draft tag

- [ ] Run manual install beta in disposable repos and resolve adapter friction.
- [ ] Run official-runtime manual eval with evidence capture.
- [ ] Verify rollback procedures end-to-end.
- [ ] Resolve or explicitly accept remaining warnings.
- [ ] Keep final tag decision conservative until blockers are cleared.

> [!WARNING]
> Current decision: **do not tag yet**. This is a Draft v0 readiness report, not a production or stable readiness claim.

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
