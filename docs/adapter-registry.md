# Adapter Registry

Status: Draft v0

| Adapter | Status | Confidence | Default scope | Fallback | Notes |
|---|---|---|---|---|---|
| Claude Code | Draft | verified-read | project-local | generic-root | Distinct from Claude app/Desktop |
| Claude app/Desktop | Draft | linked-only | docs-only/reference | generic-root | Use connector/runtime docs context only |
| OpenCode | Draft | linked-only | project-local | generic-root | Verify native skill path before writing |
| Cursor | Draft | linked-only | project-local | generic-root | Prefer rules/doc attachment if verified |
| Codex/generic | Draft | linked-only | generic-root | docs-only/reference | AGENTS.md-style fallback |
| Generic-root | Draft | verified-read | project-local | docs-only/reference | Universal fallback for unknown tools |

## Future candidates (not researched)

- Gemini CLI
- Windsurf
- Continue
- Cline
- Roo
- Aider
- VS Code extensions
- Other AI coding agents

For future candidates:
- mark as not researched until verified
- do not invent paths
- add via `docs/adapters/adapter-template.md`
