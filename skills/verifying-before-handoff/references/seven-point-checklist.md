# 7-Point Verification Checklist

Run all 7 before any handoff. Each must Pass (or be N/A in text-only mode for checks 3-6) before claim is upheld.

## Checklist with examples

| # | Check | Pass example | Fail example |
|---|---|---|---|
| 1 | **Claim is named explicitly** (one of `Not Run` / `Attempted` / `Produced` / `Verified` / `Failed`). No vague "ready" / "done" / "good". | "Verified for Path 1 host (a) Anthropic Connector render of cyberpunk shoe." | "It's ready, ship it." |
| 2 | **Path attribution is explicit** (Path 1 host a/b, Path 2, CLI fallback, or text-only). | "Path 1, host (a) Anthropic Connector, Blender 5.1.0." | "We used the connector." |
| 3 | **Artifact paths exist** for any `Produced` or `Verified` claim. | `renders/preview-2026-05-09.png` resolves; `exports/hero.glb` resolves. | "The render is at renders/preview.png" but file does not exist on disk. |
| 4 | **Validation notes present** for any `Verified` claim. | "Subject framing centered, neon visible, GLB ≤ 10MB, web import test passed." | (Empty validation field; just a file path.) |
| 5 | **Tool / command names recorded** for any runtime claim. | Path 1: `execute_blender_code` recorded (mutation) or read-only summary tools recorded (smoke). Path 2: `get_scene_info` + `execute_blender_code`. CLI: exact `blender --background --python` command. | "We ran Blender." (no tool names) |
| 6 | **No-mutation guarantee** for any read-only smoke claim. | Tool list = `get_blendfile_summary_path_info`, `get_objects_summary`. No `execute_blender_code` on either backend. | Smoke claim with `execute_blender_code` in the tool list. |
| 7 | **Plain-language summary** passes `non-blender-user-language` check. | "Your render is ready. The shoe is centered, the neon mood is visible, and the GLB is small enough for web." | "BSDF subsurf scattering applied; topology budget at 8k tris; tangent-space NaN handled." |

## Mode-aware applicability

| Claim type | Checks 1, 2, 7 | Checks 3, 4, 5, 6 |
|---|---|---|
| Text-only plan / brief | Required | Mark **N/A explicitly** |
| Read-only smoke evidence | Required | Required (check 6 especially important) |
| Mutation / render / export claim | Required | Required |
| Final user-facing response | Required | Required if response cites runtime claims |

## The Iron Law & Red Flags (Anti-Rationalization)

> **Violating the letter of the verification gate is violating the spirit of the verification gate. NO `Verified` or `Produced` CLAIM WITHOUT FRESH, INSPECTABLE EVIDENCE.**

### Red Flags — STOP and Downgrade Immediately

- Using hedging language as proof ("should work", "probably rendered", "looks clean", "seems ready")
- Expressing completion before running checks ("Done!", "Perfect!", "Ship it!")
- Treating a read-only smoke test as evidence that scene mutation, rendering, or GLB export succeeded
- Treating Path 2 (`mcp-for-blender`) transcripts as official Draft/Release certification
- Citing an old or unlinked pre-existing file without proving current-run provenance

### Rationalization Prevention Table

| Excuse | Reality |
|---|---|
| "The MCP call returned success, so the artifact is Verified." | A tool call transcript without a verified disk path and validation notes stays capped at `Produced` (or `Attempted`). |
| "I already inspected the render mentally / from code." | Visual and structural checks require inspectable output artifacts; mental confidence is not evidence. |
| "Just this once, the user knows what I mean by 'ready'." | Vague claims hide failure states. Name one exact state (`Not Run` / `Attempted` / `Produced` / `Verified` / `Failed`). |
| "The smoke test passed, so Path 1 works end-to-end." | Smoke pass confirms read-only connectivity only (`Artifact status: Not Produced`). Never extrapolate to render/export. |
| "Different wording means the 7-point gate doesn't apply." | Paraphrases of "finished" or "complete" trigger the same 7 checks. |
