# Conflict Playbooks

Pre-canned resolution patterns for the 5 most common Single-bridge constraint conflicts. Always build the bridge state matrix first (see `bridge-state-matrix-template.md`), then match the playbook.

## Playbook A — Path 1 + Path 2 both installed in Blender

**Symptoms:**
- Lab MCP add-on **AND** `ahujasid/blender-mcp` `addon.py` both enabled in Blender.
- Smoke test fails or returns inconsistent tool surface.

**Diagnosis:**
- Two Blender-side bridges contend for the local socket. Even if MCP host points at only one, Blender side has two add-ons listening.

**Resolution (cheapest first):**
1. Identify the intended path from brief / readiness checker / user.
2. In Blender: Edit → Preferences → Add-ons → disable the unintended add-on.
3. Restart Blender (or the MCP-side relevant process).
4. Re-run readiness smoke.

**Do-not reminders:**
- Do not keep both Blender-side add-ons enabled "just in case". They will collide again next session.

---

## Playbook B — Two MCP clients targeting the same Blender

**Symptoms:**
- Claude Desktop Connector ON **AND** Cursor (or Codex / Cline / etc.) has manual `mcpServers.blender` entry.
- Second client to connect silently fails.

**Diagnosis:**
- Per Anthropic + Blender community guidance, Blender accepts one MCP client per session.

**Resolution:**
1. Pick one client per Blender session (the one the user actively works in).
2. Unregister the Blender MCP entry from the other client(s) **for this Blender instance** (their config can stay for OTHER Blender instances).
3. Restart the disabled client(s).

**Do-not reminders:**
- Do not assume "the second client will queue". It silently fails.
- Do not change ports as a workaround unless you're running two Blender instances.

---

## Playbook C — Port collision on `localhost:9876`

**Symptoms:**
- `lsof -i :9876` (or equivalent) shows a process not started by Blender.
- Bridge connection fails immediately.

**Diagnosis:**
- Another process (often a leftover Lab MCP or `ahujasid` server) is bound to the default port.

**Resolution:**
1. Identify the listener: `lsof -i :9876` → PID → process name.
2. If the listener is a leftover Blender MCP server, kill it and restart Blender.
3. If the listener is unrelated, change the BlendOps server's port and update the matching MCP host config.
4. Re-run readiness smoke.

**Do-not reminders:**
- Do not blindly kill processes you don't recognize.
- If you change ports, both server AND host config must match.

---

## Playbook D — Anthropic Connector + manual `mcpServers.blender` Lab entry both ON

**Symptoms:**
- Claude Desktop has Connector toggle ON.
- Claude Desktop also has `mcpServers.blender` pointing at the Lab `.mcpb` bundle in Settings → Developer → Edit Config.

**Diagnosis:**
- Both are **Path 1 host options** targeting the same Lab stack. Per `docs/runtime-stack-strategy.md`, pick one host per session.

**Resolution:**
1. Pick host (a) Anthropic Connector OR host (b) manual MCP — not both.
2. Disable the unused option (toggle off Connector OR remove manual entry).
3. Restart Claude Desktop.

**Do-not reminders:**
- Do not treat Connector as if it were a separate "Path A" runtime. It is a host on top of Lab MCP.
- The 5.1+ Blender floor still applies to whichever host you pick.

---

## Playbook E — Matrix is clean but smoke still fails

**Symptoms:**
- Single MCP client active.
- Single Blender-side add-on enabled.
- Port not in conflict.
- Smoke test still fails.

**Diagnosis:**
- This is **not** a bridge conflict. The cause is upstream (planner, runtime setup, scene file, or Blender version).

**Resolution:**
- Hand off to `blender-troubleshooting` for 4-phase diagnosis.
- Do **not** propose more bridge changes — they would not help.
