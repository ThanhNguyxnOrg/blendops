# Decision Tree — Choosing a Blender Execution Path

```txt
Need interactive, multi-step scene inspection or steering inside a live Blender session?
  ├─ NO (headless batch renders, deterministic CI export, scripted hygiene passes)
  │    └─ Use CLI appendix (`cli-appendix-job-outline`) — documented upstream as a
  │       first-class Blender CLI surface (no in-repo eval evidence file yet).
  └─ YES (interactive MCP host session)
       ├─ Are TWO or more MCP bridges/add-ons enabled on port 9876 or the same instance?
       │    └─ STOP immediately → route to `bridge-conflicts` (single-bridge law).
       ├─ Is Blender 5.1+ installed AND user ready to install Official Blender Lab MCP add-on?
       │    ├─ YES → Choose Path 1 (`path-one-host-outline`):
       │    │         (a) Anthropic Connector host (Claude Desktop) OR
       │    │         (b) Manual MCP client (Claude Code, Cursor, Codex, OpenCode, Zed, etc.)
       │    └─ NO (Blender 3.0–5.0 or Lab MCP unavailable)
       │         └─ Consider Path 2 (`mcp-for-blender`) ONLY IF user explicitly accepts
       │            community maintenance/support boundaries (`docs/unofficial-runtime-bridges.md`).
       └─ Blender version unknown?
            └─ WARN branch: emit conditional Path 1 (5.1+) vs Path 2 (3.0+) table;
               request verbatim `blender --version` output before proceeding.
```

## Non-Negotiable Rules
- Anthropic Connector is a **Path 1 host option**, never a standalone runtime — the Blender Lab MCP add-on must be installed and enabled inside Blender 5.1+ first.
- Never apply the Blender 5.1+ floor to Path 2 (`3.0+`) or the CLI appendix.
- Selecting a path does **not** verify readiness or approve writes; pair with `runtime-readiness` and `runtime-attempt-report`.

## Related skill
- [SKILL.md](../SKILL.md)
