# Text-Only Mode Handling

When the deliverable is a plan / brief / response (not a runtime artifact), checks 3-6 are **N/A**, not Skipped or Failed. This file is the canonical reference for that distinction.

## What "text-only mode" means

A handoff is text-only when **no runtime artifact is referenced or claimed**:

- a confirmed brief from `intent-to-3d-brief-writer`
- a scene plan from `product-hero-scene-planner`
- a composition / lighting / material plan
- a non-Blender-user response that summarizes status only
- a brainstorming output

In text-only mode, only checks **1, 2, 7** apply.

## How to mark N/A

For every check that is N/A, **explicitly write `N/A` plus the reason**, not blank, not skipped:

| Check | N/A note example |
|---|---|
| 3 (artifact paths exist) | `N/A — text-only deliverable, no artifact path asserted.` |
| 4 (validation notes) | `N/A — no `Verified` claim made; deliverable is a plan, not a runtime output.` |
| 5 (tool names recorded) | `N/A — no runtime tool was called; deliverable is a plan.` |
| 6 (no-mutation guarantee) | `N/A — no runtime smoke; deliverable is a plan.` |

## Anti-patterns

- Skipping checks silently. Always write N/A + reason.
- Treating "the operator might run this later" as a runtime claim. Until runtime evidence exists, the deliverable is text-only.
- Letting check 7 (plain language) lapse just because checks 3-6 are N/A. Plain language always applies for user-facing text.

## Promotion to runtime mode

If the deliverable is later combined with runtime evidence (e.g. plan + actual render), re-run **all 7 checks**. The previously-N/A checks 3-6 become required.
