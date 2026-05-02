# 🧪 Evals, Draft v0

BlendOps evals are evidence records for laws, skills, workflows, recipes, and packs.

> [!WARNING]
> Evals must separate planned tests from executed tests. Runtime artifacts remain Not Run/Not Produced unless a runtime eval record provides evidence.

---

## Verdict dashboard

| Area | Current verdict | Status |
|---|---|---|
| Manual runtime protocol | No verdict yet | Protocol / Not yet executed |
| Text-only cyberpunk shoe eval | Text-only evidence only | Executed / Text-only, no Blender runtime |
| Runtime cyberpunk shoe eval | Blocked | Blocked / Not Run |
| Blender connector read-only smoke test | Pass | Available / Read-only session access |
| Adapter install dry-run | Warn | Executed / Dry-run |
| Manual install beta v0 | Warn | Executed / Dry-run / No runtime / No global config writes |
| Official runtime verification criteria | Prepared | Criteria only / Not Run |
| Runtime availability checklist | Prepared | Readiness checklist only / Not Run |
| Official runtime manual eval packet | Prepared | Packet only / Not Run |
| Skill package upload-readiness eval | Warn | Executed / Text-only / No upload / No publication |

---

## Eval principles

- Evals must clearly distinguish **planned tests** from **executed tests**.
- Evals must record **runtime source confidence**: `verified-read`, `linked-only`, or `mixed`.
- Evals must not fake runtime results or artifact success.
- Evals must preserve official-runtime-only boundaries in active docs.
- Warnings must stay separate from blockers.
- Non-actions must be explicit when runtime, install, or artifact steps were not performed.

---

## Status model

| Status | Meaning |
|---|---|
| **Protocol / Not yet executed** | Test plan only, no runtime execution claims. |
| **Executed / Text-only (No Blender runtime)** | Evaluation completed on prompts, plans, and checklists only. Runtime artifacts remain Not Run/Not Produced. |
| **Executed / Dry-run** | Install or workflow behavior was tested without runtime execution or artifact production. |
| **Executed / Runtime** | Official runtime path actually run with real preview/export/GLB evidence and explicit pass/warn/fail outcomes. |
| **Blocked / Not Run** | Eval could not be executed in the current environment. |

---

## Evidence and result index

| Eval | Result | Evidence type | Notes |
|---|---|---|---|
| [cyberpunk-shoe-hero-v0-manual-eval.md](./cyberpunk-shoe-hero-v0-manual-eval.md) | Not yet executed | Protocol | Manual runtime eval protocol only. |
| [cyberpunk-shoe-hero-v0-text-eval.md](./cyberpunk-shoe-hero-v0-text-eval.md) | Text-only | Prompt/plan/checklist evidence | No Blender runtime execution. |
| [cyberpunk-shoe-hero-v0-runtime-eval.md](./cyberpunk-shoe-hero-v0-runtime-eval.md) | Blocked / Not Run | No runtime evidence | Runtime eval result record is blocked in current environment. |
| [blender-connector-read-only-smoke-test.md](./blender-connector-read-only-smoke-test.md) | Pass / Available | Read-only connector evidence | Official Claude Desktop Blender Connector returned session, datablock, and object summaries; no mutation, render, export, or artifacts. |
| [adapter-install-v0-dry-run.md](./adapter-install-v0-dry-run.md) | Warn | Dry-run install evidence | Adapter install evaluation report. |
| [manual-install-beta-v0.md](./manual-install-beta-v0.md) | Warn | Dry-run fixture evidence | Manual install beta dry-run summary. |
| [official-runtime-verification-criteria.md](./official-runtime-verification-criteria.md) | Prepared | Criteria only | Defines Draft v0 evidence rules for future official-runtime evals. |
| [runtime-availability-checklist.md](./runtime-availability-checklist.md) | Prepared | Readiness checklist only | Preflight checklist for deciding whether an official-runtime eval can be attempted. |
| [official-runtime-manual-eval-packet.md](./official-runtime-manual-eval-packet.md) | Prepared | Packet only | Operator checklist and result template for future official-runtime manual evals. |
| [skill-package-upload-readiness-v0.md](./skill-package-upload-readiness-v0.md) | Warn | Text-only package-source evidence | Canonical package source shape passes Draft v0 upload-readiness review; actual UI upload/import is Not Tested and publication is Not Published. |

---

## Non-actions to preserve

- Do not claim Blender runtime was run unless a runtime eval record says so with evidence.
- Do not claim preview/render/GLB artifacts exist unless produced evidence is listed.
- Do not convert Warn results into Pass results without new evidence.
- Do not treat Draft v0 evals as production or stable readiness.

---

## Blockers

| Blocker | Affects | Current state |
|---|---|---|
| Runtime-available environment missing | Runtime eval | Blocked / Not Run |
| Preview/render/GLB evidence missing | Artifact-truth readiness | Not Produced |

---

## Warnings

| Warning | Affects | Current state |
|---|---|---|
| Adapter native-path confidence varies by environment | Install/adoption | Warn |
| Mode-selection wording needs ongoing care | Install/adoption | Warn |
| Manual install beta is not full Pass | Release readiness | Warn |
