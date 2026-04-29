# Adapters

> [!NOTE]
> Status: Draft v0. Adapters are install mapping docs. They aren't runtime code and don't install Blender runtime.

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

| Target | Adapter doc | Primary use | Expected scope posture |
|---|---|---|---|
| Claude Code | [claude-code.md](./claude-code.md) | Claude Code workspace attachment | Project-local first, fallback if native path isn't verified |
| Claude app/Desktop | [claude-app.md](./claude-app.md) | App/Desktop reference or project instructions | Docs-only/reference unless explicit attachment is safe |
| OpenCode | [opencode.md](./opencode.md) | OpenCode workspace attachment | Project-local first |
| Cursor | [cursor.md](./cursor.md) | Cursor workspace attachment | Project-local or generic-root fallback |
| Codex | [codex.md](./codex.md) | Codex workspace attachment | Project-local or generic-root fallback |
| Generic root | [generic-root.md](./generic-root.md) | Unknown or partially verified tools | `BLENDOPS.md` fallback |
| Adapter template | [adapter-template.md](./adapter-template.md) | New adapter authoring | Requires scope, confidence, backup, rollback |

## Quick selection rule

| If target support is | Use |
|---|---|
| Verified and project-local path is known | Target adapter |
| Linked-only or uncertain | [generic-root.md](./generic-root.md) |
| Writes are disallowed | Docs-only/reference mode |
| User asks for global install | Only proceed after explicit approval and verified global path |
