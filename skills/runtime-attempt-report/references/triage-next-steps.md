# Runtime Failure Triage & Next Actions

Match the observed failure signal cleanly without guessing or loosening safety gates:

| Observed Signal | Probable Root Cause | Verified Next Action |
|---|---|---|
| **Timeout on first MCP handshake / `tools/list`** | MCP server not listening, host sandbox firewall blocking localhost socket, or STDIO command wrong path | Inspect host MCP log; confirm Blender is open with add-on ticked enabled; keep `Runtime status: Failed` or `Attempted`. |
| **Lab MCP add-on fails to load inside Blender** | Blender version below `5.1.0` (Path 1 manifest floor) or wrong zip structure installed | Run `blender --version` verbatim. If `< 5.1.0`, route back to `runtime-path-picker` (Path 2 `3.0+` or CLI appendix). |
| **Port `9876` already bound / inconsistent tool schemas** | Dual bridge collision (Path 1 + Path 2 active together) or stale Blender headless process holding socket | Stop immediately and invoke `bridge-conflicts`; disable competing add-on and restart clean Blender session. |
| **CLI exits `0` but no render/GLB appears** | `-o` flag placed after `-f`, relative `//` path without `.blend` saved, or omitted `--python-exit-code 1` | Check stderr, fix flag order (`cli-appendix-job-outline`), verify `fs` output before updating `Artifact status`. |
| **Enterprise policy disallows external MCP / sockets** | Network or client policy blocks local MCP transport | Switch outline cleanly to CLI appendix batch job or pure planning deliverables; keep `Runtime status: Not Run`. |
| **Tool call mutates unexpected object or returns invalid payload** | Unqualified third-party tool or outdated schema drift | Abort mutation batch, run rollback verification, redact any sensitive tokens before recording `docs/evals/` packet. |

## Related skill
- [SKILL.md](../SKILL.md)
