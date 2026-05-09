# 7-Point Verification Checklist

Run all 7 before any handoff. Each must Pass (or be N/A in text-only mode for checks 3-6) before claim is upheld.

## Checklist with examples

| # | Check | Pass example | Fail example |
|---|---|---|---|
| 1 | **Claim is named explicitly** (one of `Not Run` / `Attempted` / `Produced` / `Verified` / `Failed`). No vague "ready" / "done" / "good". | "Verified for Path 1 host (a) Anthropic Connector render of cyberpunk shoe." | "It's ready, ship it." |
| 2 | **Path attribution is explicit** (Path 1 host a/b, Path 2, CLI fallback, or text-only). | "Path 1, host (a) Anthropic Connector, Blender 5.1.0." | "We used the connector." |
| 3 | **Artifact paths exist** for any `Produced` or `Verified` claim. | `renders/preview-2026-05-09.png` resolves; `exports/hero.glb` resolves. | "The render is at renders/preview.png" but file does not exist on disk. |
| 4 | **Validation notes present** for any `Verified` claim. | "Subject framing centered, neon visible, GLB ≤ 10MB, web import test passed." | (Empty validation field; just a file path.) |
| 5 | **Tool / command names recorded** for any runtime claim. | Path 1: `run_blender_code` recorded. Path 2: `get_scene_info` + `execute_blender_code`. CLI: exact `blender --background --python` command. | "We ran Blender." (no tool names) |
| 6 | **No-mutation guarantee** for any read-only smoke claim. | Tool list = `get_blendfile_summary_path_info`, `get_objects_summary`. No `execute_blender_code`, `run_blender_code`, or `create_object`. | Smoke claim with `execute_blender_code` in the tool list. |
| 7 | **Plain-language summary** passes `non-blender-user-language` check. | "Your render is ready. The shoe is centered, the neon mood is visible, and the GLB is small enough for web." | "BSDF subsurf scattering applied; topology budget at 8k tris; tangent-space NaN handled." |

## Mode-aware applicability

| Claim type | Checks 1, 2, 7 | Checks 3, 4, 5, 6 |
|---|---|---|
| Text-only plan / brief | Required | Mark **N/A explicitly** |
| Read-only smoke evidence | Required | Required (check 6 especially important) |
| Mutation / render / export claim | Required | Required |
| Final user-facing response | Required | Required if response cites runtime claims |
