# Lab Add-on Reminders — Path 1 Prerequisites

Keep these hard boundaries visible whenever guiding a non-Blender user through Path 1 setup:

1. **Blender 5.1+ applies to Path 1 ONLY**: The Lab MCP add-on manifest sets `blender_version_min = 5.1.0`. Translate in plain user language: *"This official connection needs Blender 5.1 or newer."* If the user cannot upgrade from 3.x/4.x, stop and route back to `runtime-path-picker` (Path 2 or CLI appendix).
2. **Blender-side add-on precedes client setup**: Never advise enabling Anthropic Connector or editing Cursor/Claude Code MCP config alone and expecting Blender control to work. The Lab MCP add-on inside Blender opens the endpoint.
3. **One bridge per instance**: Never leave a community `mcp-for-blender` add-on active alongside Lab MCP inside the same Blender preferences profile.
4. **Verify add-on checkbox & restart if stalled**: Users frequently install the `.zip` without ticking the add-on enable checkbox or saving preferences before restarting Blender.
5. **Conservative truth status**: Document setup steps cleanly, then require `runtime-readiness` checks (`Runtime status: Not Run` until handshake is observed).

## Related skill
- [SKILL.md](../SKILL.md)
