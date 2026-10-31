# Adapters

> [!NOTE]
> Status: Draft v0. Adapters are install mapping docs. They aren't runtime code and don't install Blender runtime.

> [!IMPORTANT]
> **Adapters are a smaller subset of the install layer.** This folder covers 6 verified-or-drafted adapters. New tool support starts as an install doc first, then graduates to an adapter only after the install path is verified. For the full per-target install guide, see [`docs/install/`](../install/README.md) (26 targets).

## Policy guardrails

| Policy | Adapter requirement |
|---|---|
| Official runtime only | Preserve official-only runtime policy in every target mapping. |
| No runtime install | Don't install Blender or runtime tooling. |
| No runtime execution | Don't run Blender during install. |
| Confidence labels | Declare verified, linked-only, or unknown assumptions. |
| Scope clarity | Declare supported scopes and fallback behavior. |
| Reversible edits | Require backups before modifying existing config files. |

## Adapter index

See [`docs/evals/adapter-empirical-verification-phase-7.md`](../evals/adapter-empirical-verification-phase-7.md) for the Phase 7 empirical host verification report across all 6 adapters and 20 install-only targets.

| Target | Adapter doc | BlendOps confidence | Primary use | Expected scope posture |
|---|---|---|---|---|
| Claude Code | [claude-code.md](./claude-code.md) | `verified-read` (repo-local) | Claude Code workspace attachment | Project-local first, fallback if native path isn't verified |
| Claude app/Desktop | [claude-app.md](./claude-app.md) | `linked-only` | App/Desktop reference or project instructions | Docs-only/reference unless explicit attachment is safe |
| OpenCode | [opencode.md](./opencode.md) | `linked-only` | OpenCode workspace attachment | Project-local first |
| Cursor | [cursor.md](./cursor.md) | `linked-only` | Cursor workspace attachment | Project-local or generic-root fallback |
| Codex | [codex.md](./codex.md) | `linked-only` | Codex workspace attachment | Project-local or generic-root fallback |
| Generic root | [generic-root.md](./generic-root.md) | `verified-read` (repo-local) | Unknown or partially verified tools | `BLENDOPS.md` fallback |
| Adapter template | [adapter-template.md](./adapter-template.md) | template | New adapter authoring | Requires scope, confidence, backup, rollback |

## Quick selection rule

| If target support is | Use |
|---|---|
| Verified and project-local path is known | Target adapter |
| Linked-only or uncertain | [generic-root.md](./generic-root.md) |
| Writes are disallowed | Docs-only/reference mode |
| User asks for global install | Only proceed after explicit approval and verified global path |
