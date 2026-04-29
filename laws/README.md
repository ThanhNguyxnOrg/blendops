# BlendOps Laws Collection

> [!NOTE]
> Status: Draft v0. These laws are shared guardrails for installable Blender skills in `skills/` and pack manifests in `packs/`.

## Law index

| Law | Doc | Protects |
|---|---|---|
| Official runtime only | [official-runtime-only](./official-runtime-only.md) | Keeps BlendOps aligned to official runtime paths only |
| No arbitrary Python interface | [no-arbitrary-python-interface](./no-arbitrary-python-interface.md) | Prevents arbitrary Python from becoming the user-facing workflow |
| Evidence before done | [evidence-before-done](./evidence-before-done.md) | Blocks artifact and runtime overclaims without evidence |
| Non-Blender-user language | [non-blender-user-language](./non-blender-user-language.md) | Keeps outputs clear for users who don't know Blender internals |

## Scope

| Applies to | Requirement |
|---|---|
| Root-level skill units | Follow every relevant law during planning, validation, handoff, and final response. |
| Pack manifests | Include laws explicitly and preserve their constraints. |
| User-facing outputs | State artifact/runtime status truthfully and in plain language. |
| Install docs | Preserve no-runtime and no-global-config-by-default constraints. |

## Status block

| Field | Value |
|---|---|
| Collection status | Draft v0 |
| Runtime posture | Official-runtime-only |
| Runtime install | Not included |
| Runtime execution guarantee | Not claimed |
| Promotion requirement | Review and eval evidence must be recorded before any non-draft claim |
